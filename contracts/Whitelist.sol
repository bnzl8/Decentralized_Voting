// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    mapping(address => bool) private whitelistedAddresses;
    address[] private whitelistedAddressList;
    
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);

    constructor() Ownable(msg.sender) {}

    modifier onlyWhitelisted() {
        require(whitelistedAddresses[msg.sender], "Address not whitelisted");
        _;
    }

    function addToWhitelist(address _address) external onlyOwner {
        require(!whitelistedAddresses[_address], "Address already whitelisted");
        whitelistedAddresses[_address] = true;
        whitelistedAddressList.push(_address);
        emit AddressWhitelisted(_address);
    }

    function removeFromWhitelist(address _address) external onlyOwner {
        require(whitelistedAddresses[_address], "Address not in whitelist");
        whitelistedAddresses[_address] = false;
        
        // Remove address from the list
        for (uint i = 0; i < whitelistedAddressList.length; i++) {
            if (whitelistedAddressList[i] == _address) {
                // Move the last element to the position of the element to delete
                whitelistedAddressList[i] = whitelistedAddressList[whitelistedAddressList.length - 1];
                // Remove the last element
                whitelistedAddressList.pop();
                break;
            }
        }
        
        emit AddressRemovedFromWhitelist(_address);
    }

    function isWhitelisted(address _address) external view returns (bool) {
        return whitelistedAddresses[_address];
    }

    function getWhitelistedAddresses() external view returns (address[] memory) {
        uint activeCount = 0;
        
        // Count active whitelisted addresses
        for (uint i = 0; i < whitelistedAddressList.length; i++) {
            if (whitelistedAddresses[whitelistedAddressList[i]]) {
                activeCount++;
            }
        }
        
        // Create array with active addresses only
        address[] memory activeAddresses = new address[](activeCount);
        uint currentIndex = 0;
        
        // Fill array with active addresses
        for (uint i = 0; i < whitelistedAddressList.length; i++) {
            if (whitelistedAddresses[whitelistedAddressList[i]]) {
                activeAddresses[currentIndex] = whitelistedAddressList[i];
                currentIndex++;
            }
        }
        
        return activeAddresses;
    }

    function addMultipleToWhitelist(address[] calldata _addresses) external onlyOwner {
        for (uint i = 0; i < _addresses.length; i++) {
            if (!whitelistedAddresses[_addresses[i]]) {
                whitelistedAddresses[_addresses[i]] = true;
                whitelistedAddressList.push(_addresses[i]);
                emit AddressWhitelisted(_addresses[i]);
            }
        }
    }
} 