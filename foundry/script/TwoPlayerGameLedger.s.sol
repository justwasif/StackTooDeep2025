// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {TwoPlayerGameLedger} from "../src/TwoPlayerGameLedger.sol";

contract Counter is Script {
    TwoPlayerGameLedger public twoPlayerGameLedger;

    function setUp() public {}

    function run() public {
        address GKC=0x7418D8BaB84ADa7b59813B80A61959734E2699b5;
        
        vm.startBroadcast();

        twoPlayerGameLedger = new TwoPlayerGameLedger(GKC);

        vm.stopBroadcast();
    }
}
