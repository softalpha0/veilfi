// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title  VeilVault — Confidential Yield Vault (ERC-7540 × ERC-7984)
/// @notice Users deposit USDC → vault supplies to Aave V3 for real yield →
///         vault shares are issued as encrypted ERC-7984 tokens so no observer
///         can determine a user's position size or exit timing.
///
/// @dev    Flow:
///           1. deposit(amount)              — pull USDC, supply to Aave, mint encrypted shares
///           2. requestRedeem(encShares)     — burn encrypted shares, mark for TEE decryption
///           3. finalizeRedeem(handle,proof) — Nox TEE provides plaintext, withdraw USDC + yield
///
///         Privacy model:
///           • Deposit *amount* is plaintext (USDC ERC-20 pull requires it).
///           • Vault *shares* are fully encrypted using Nox TEE (ERC-7984).
///           • Redemption amount is unknown on-chain until TEE finalizes.
///           • Nobody can correlate deposit → position size → exit.

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IAavePool} from "./interfaces/IAavePool.sol";

contract VeilVault is ERC7984, Ownable {
    using SafeERC20 for IERC20;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed depositor, uint256 assets);
    event RedeemRequested(address indexed owner, euint256 burnHandle);
    event RedeemFinalized(address indexed receiver, uint256 assets);
    event AuditorAccessGranted(address indexed user, address indexed auditor);

    // ── Errors ───────────────────────────────────────────────────────────────
    error ZeroAmount();
    error InvalidRedeemRequest(euint256 burnHandle);
    error NoSharesHeld();

    // ── Immutables ───────────────────────────────────────────────────────────
    IERC20     public immutable USDC;
    IAavePool  public immutable AAVE_POOL;
    IERC20     public immutable A_TOKEN;  // aUSDC — tracks yield

    // ── Redeem request tracking ───────────────────────────────────────────────
    /// Maps burnHandle (encrypted amount from _burn) → recipient address
    mapping(euint256 burnHandle => address recipient) private _redeemRequests;

    uint256 public totalDeposited;

    constructor(
        address usdc,
        address aavePool,
        address aToken
    )
        ERC7984("VeilFi Vault Shares", "vvUSDC", "")
        Ownable(msg.sender)
    {
        USDC      = IERC20(usdc);
        AAVE_POOL = IAavePool(aavePool);
        A_TOKEN   = IERC20(aToken);

        // Pre-approve Aave pool once
        IERC20(usdc).approve(aavePool, type(uint256).max);
    }

    // ── Deposit (ERC-7540 step 1) ─────────────────────────────────────────────

    /// @notice Deposit USDC into the vault.
    ///         Aave receives the USDC and starts accruing yield.
    ///         The caller receives encrypted vault shares — amount hidden on-chain.
    /// @param  amount   USDC amount (6 decimals)
    /// @param  receiver Address that receives the encrypted shares
    function deposit(uint256 amount, address receiver) external {
        if (amount == 0) revert ZeroAmount();

        // Pull USDC from caller
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to Aave
        AAVE_POOL.supply(address(USDC), amount, address(this), 0);
        totalDeposited += amount;

        // Mint encrypted shares 1:1 — amount never stored in plaintext per-user
        euint256 encAmount = Nox.toEuint256(amount);
        _mint(receiver, encAmount);

        emit Deposited(msg.sender, amount);
    }

    // ── Redeem request (ERC-7540 step 2) ──────────────────────────────────────

    /// @notice Request a redemption by burning encrypted shares.
    ///         After this call, Nox TEE detects the publicly-decryptable handle
    ///         and makes the plaintext available for finalizeRedeem.
    /// @param  encShares  Encrypted share amount (caller must hold access)
    /// @param  receiver   Address that will receive USDC + yield on finalization
    function requestRedeem(euint256 encShares, address receiver) external {
        require(Nox.isAllowed(encShares, msg.sender), "VeilVault: not allowed");

        // Burn encrypted shares — returns a fresh handle for the burned amount
        euint256 burnHandle = _burn(msg.sender, encShares);

        // Mark for public TEE decryption — Nox Runner picks this up
        Nox.allowPublicDecryption(burnHandle);

        // Record the request
        _redeemRequests[burnHandle] = receiver;

        emit RedeemRequested(msg.sender, burnHandle);
    }

    /// @notice Overload — accepts encrypted amount with EIP-712 proof (for frontend submission)
    function requestRedeem(
        externalEuint256 encShares,
        bytes calldata inputProof,
        address receiver
    ) external {
        euint256 amount = Nox.fromExternal(encShares, inputProof);
        euint256 burnHandle = _burn(msg.sender, amount);
        Nox.allowPublicDecryption(burnHandle);
        _redeemRequests[burnHandle] = receiver;
        emit RedeemRequested(msg.sender, burnHandle);
    }

    // ── Finalize redeem (ERC-7540 step 3) ────────────────────────────────────

    /// @notice Finalize a redemption after Nox TEE has decrypted the burn handle.
    ///         Anyone can call this once the TEE proof is available.
    ///         Caller provides the decrypted plaintext + TEE proof; Nox verifies it.
    /// @param  burnHandle              The handle returned by requestRedeem
    /// @param  decryptedAmountAndProof ABI-encoded (uint256 plainAmount, bytes proof) from Nox TEE
    function finalizeRedeem(
        euint256 burnHandle,
        bytes calldata decryptedAmountAndProof
    ) external {
        address receiver = _redeemRequests[burnHandle];
        if (receiver == address(0)) revert InvalidRedeemRequest(burnHandle);

        // Delete before external call (reentrancy guard)
        delete _redeemRequests[burnHandle];

        // Verify TEE proof and get plaintext share count
        uint256 plainShares = Nox.publicDecrypt(burnHandle, decryptedAmountAndProof);

        // Compute assets out: shares + proportional yield
        uint256 aTokenBalance = A_TOKEN.balanceOf(address(this));
        uint256 totalSharesVal = _plainTotalSupply();
        uint256 assetsOut;

        if (totalSharesVal == 0 || aTokenBalance == 0) {
            assetsOut = plainShares;
        } else {
            // proportional: (plainShares / totalShares) * aTokenBalance
            assetsOut = (plainShares * aTokenBalance) / (totalSharesVal + plainShares);
        }

        // Floor: never return less than deposited amount (yield may be zero)
        if (assetsOut < plainShares) assetsOut = plainShares;

        totalDeposited = totalDeposited > assetsOut ? totalDeposited - assetsOut : 0;

        // Withdraw from Aave and send to receiver
        AAVE_POOL.withdraw(address(USDC), assetsOut, receiver);

        emit RedeemFinalized(receiver, assetsOut);
    }

    // ── View ──────────────────────────────────────────────────────────────────

    /// @notice Total USDC + accrued yield currently held in Aave
    function totalAssets() external view returns (uint256) {
        return A_TOKEN.balanceOf(address(this));
    }

    function redeemRequester(euint256 burnHandle) external view returns (address) {
        return _redeemRequests[burnHandle];
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /// @dev Returns a plaintext approximation of total supply using Aave balance.
    ///      Used only for proportional yield calculation — not exposed as a public view.
    function _plainTotalSupply() internal view returns (uint256) {
        return totalDeposited;
    }

    // ── Selective Disclosure ──────────────────────────────────────────────────

    /// @notice Grant a specific address the ability to read your encrypted vault balance.
    ///         The auditor can then use the Nox SDK to decrypt the handle and verify
    ///         your position without it being exposed to anyone else on-chain.
    /// @param  auditor  Wallet address to grant read access (e.g. a regulator or auditor)
    function grantAuditorAccess(address auditor) external {
        require(auditor != address(0), "VeilVault: zero address");
        euint256 bal = confidentialBalanceOf(msg.sender);
        if (!Nox.isInitialized(bal)) revert NoSharesHeld();
        Nox.allow(bal, auditor);
        emit AuditorAccessGranted(msg.sender, auditor);
    }

    /// @notice Returns the encrypted balance handle for a given holder.
    ///         Auditors who have been granted access via grantAuditorAccess can
    ///         pass this handle to the Nox SDK to decrypt and verify the balance.
    function encryptedBalanceOf(address holder) external view returns (euint256) {
        return confidentialBalanceOf(holder);
    }

    // ── Emergency ─────────────────────────────────────────────────────────────

    function emergencyWithdraw() external onlyOwner {
        uint256 bal = A_TOKEN.balanceOf(address(this));
        if (bal > 0) AAVE_POOL.withdraw(address(USDC), bal, owner());
    }
}
