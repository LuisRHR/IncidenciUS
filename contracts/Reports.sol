// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0

contract Report {
    uint id;
    string sender;
    string description;
    //PROOFS?
    constructor() {
        
    }
}

contract BugReport is Report{
    string title;
}

contract UserReport is Report{
    string userName;
    string email;
}