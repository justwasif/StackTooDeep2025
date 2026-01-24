// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Counter is ERC20, ERC20Burnable, ReentrancyGuard{

    uint256 public constant EXCHANGE_RATE = 10000;

    constructor() ERC20("Ghee_Khatam_Coin ", "GKH"){}

    function deposit() public payable  {
        require(msg.value>0, "Not Enough Eth Collatarlized!");
        uint256 collataralGiven = msg.value; 

        uint256 tokensToMint = collataralGiven * EXCHANGE_RATE; 

        _mint(msg.sender, tokensToMint); 
    } 
    
    function burnTokens(uint256 amountToBurn) public nonReentrant {
        require(balanceOf(msg.sender)>= amountToBurn, "Not enough Tokens to burn");

        uint256 ethToReturn = amountToBurn / EXCHANGE_RATE;

        burn(amountToBurn);

        (bool success,) = payable(msg.sender).call{value: ethToReturn}("");
        require(success, "Transaction has failed!");

    }

    function getContractEthBalance() public view returns(uint256 ) {
        return address(this).balance;
    }

}