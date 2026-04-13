// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title  WrappedConfidentialUSDC — ERC-7984 Confidential USDC Token
/// @notice Wraps any ERC-20 (USDC) into a confidential equivalent where balances
///         and transfer amounts are encrypted using iExec Nox TEE.
///         Built on ERC20ToERC7984Wrapper — wrap is 1-tx, unwrap is 2-step (TEE).

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";

contract WrappedConfidentialUSDC is ERC20ToERC7984Wrapper {
    constructor(IERC20 usdc)
        ERC20ToERC7984Wrapper(usdc)
        ERC7984("Wrapped Confidential USDC", "wcUSDC", "")
    {}
}
