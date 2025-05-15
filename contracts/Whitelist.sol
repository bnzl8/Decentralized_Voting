// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    mapping(address => bool) private whitelistedAddresses;
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
        emit AddressWhitelisted(_address);
    }

    function removeFromWhitelist(address _address) external onlyOwner {
        require(whitelistedAddresses[_address], "Address not in whitelist");
        whitelistedAddresses[_address] = false;
        emit AddressRemovedFromWhitelist(_address);
    }

    function isWhitelisted(address _address) external view returns (bool) {
        return whitelistedAddresses[_address];
    }

    function addMultipleToWhitelist(address[] calldata _addresses) external onlyOwner {
        for (uint i = 0; i < _addresses.length; i++) {
            if (!whitelistedAddresses[_addresses[i]]) {
                whitelistedAddresses[_addresses[i]] = true;
                emit AddressWhitelisted(_addresses[i]);
            }
        }
    }
} 