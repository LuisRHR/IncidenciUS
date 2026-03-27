// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0

contract Users {
    struct User {
        uint uid;
        string userName;
        address wallet;
        enum userCondition {COMUN, ADMINISTRADOR};
        bool isBanned;
    }
    
    constructor() {
        
    }
}