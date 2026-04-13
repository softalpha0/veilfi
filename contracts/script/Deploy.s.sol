// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {VeilVault} from "../src/VeilVault.sol";
import {WrappedConfidentialUSDC} from "../src/WrappedConfidentialUSDC.sol";

/// @notice Deploys VeilFi contracts on Arbitrum Sepolia (chainId 421614)
///
///  Required env vars:
///    PRIVATE_KEY   — deployer key (with 0x prefix)
///
///  Arbitrum Sepolia addresses (pre-filled, verify before deploying):
///    USDC     : 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
///    Aave Pool: 0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff
///    aUSDC    : 0x460b97BD498E1157530AEb3086301d5225b91216
///
///  Nox NoxCompute is resolved automatically by chain ID in Nox.sol:
///    Arbitrum Sepolia → 0xd464B198f06756a1d00be223634b85E0a731c229
contract Deploy is Script {
    address constant USDC      = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant AAVE_POOL = 0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff;
    address constant A_USDC    = 0x460b97BD498E1157530AEb3086301d5225b91216;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        // 1. Deploy WrappedConfidentialUSDC (ERC-7984 cUSDC wrapper)
        WrappedConfidentialUSDC wcUSDC = new WrappedConfidentialUSDC(IERC20(USDC));

        // 2. Deploy VeilVault (ERC-7984 share token + Aave yield)
        VeilVault vault = new VeilVault(USDC, AAVE_POOL, A_USDC);

        console.log("Chain                      :", block.chainid);
        console.log("WrappedConfidentialUSDC    :", address(wcUSDC));
        console.log("VeilVault                  :", address(vault));
        console.log("Underlying USDC            :", USDC);
        console.log("Aave Pool                  :", AAVE_POOL);
        console.log("aUSDC                      :", A_USDC);

        vm.stopBroadcast();
    }
}
