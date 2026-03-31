// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Groups {
    struct Group {
        string groupName;
        string description;
    }

    mapping (uint => Group) public groups;

    constructor() {
        
    }
}