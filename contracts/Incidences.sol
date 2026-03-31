// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Incidences {
    struct Incidence {
        uint id;
        string title;
        string description;
        uint256 date;
        enum priority {BAJA, MEDIA, ALTA};
        string senderName;
        string userReceiver;
        string groupReceiver;
    }

    mapping (uint => Incidence) public incidences;

    constructor() {
        
    }
}