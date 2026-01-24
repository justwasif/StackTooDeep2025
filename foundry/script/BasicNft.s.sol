// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

import {Script,console} from "forge-std/Script.sol";
import {BasicNft} from "../src/BasicNft.sol";

contract BasiC is Script{ 
    BasicNft public basicNft;

    function setUp() public{

    }

    function run() public{
        vm.startBroadcast();
        basicNft=new BasicNft();
        vm.stopBroadcast();
    }

}