// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract BasicNft is ERC721 {
    uint256 private s_tokenCounter;
    mapping (uint256 =>string ) private s_tokenIdToUri;
    constructor() ERC721("Doggie","DOG"){
        s_tokenCounter=0;

    }
    function mintNft(string memory tokenURi) public{
        uint256 tokenId=s_tokenCounter;
        s_tokenIdToUri[s_tokenCounter]=tokenURi;
        _safeMint(msg.sender,s_tokenCounter);
        s_tokenCounter++;
    }

    function tokenURI(uint256 tokenId) public view override returns(string memory){
        require(_ownerOf(tokenId)!=address(0),"");
        return s_tokenIdToUri[tokenId];
    }

}