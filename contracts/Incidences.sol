// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
import "./UserGroups.sol";

contract Incidences {
    enum priority {BAJA, MEDIA, ALTA}
    struct Incidence {
        uint id;
        bytes32 titleHash;
        bytes32 descriptionHash;
        string date;
        priority priorityLevel;
        bytes32 senderNameHash;
        bytes32 userReceiverHash;
        bytes32 groupReceiverHash;

        // CID de IPFS con toda la información privada de la incidencia 
        string privateDataCID;
    }
    
    uint public incidenceCount=1;

    Users public users;
    Groups public groups;

    constructor(address usersAddress, address groupsAddress) {
        users = Users(usersAddress);
        groups = Groups(groupsAddress);
    }

    mapping (uint => Incidence) public incidences;
    mapping (uint => uint[]) public senderToIncidenceIds;
    mapping (uint => uint[]) public userRToIncidenceIds;
    mapping (uint => uint[]) public groupRToIncidenceIds;

    function registerIncidence(bytes32 titleHash, bytes32 descriptionHash, string memory date, priority priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, string memory groupReceiver, bytes32 groupReceiverHash, string memory privateDataCID) public{
        incidences[incidenceCount] = Incidence(incidenceCount, titleHash, descriptionHash, date, priorityLevel, senderNameHash, userReceiverHash, groupReceiverHash, privateDataCID);
        if (userReceiverHash != bytes32(0)) {
            uint userId = users.getIdByUserName(userReceiverHash);
            userRToIncidenceIds[userId].push(incidenceCount);
        }
        else if (groupReceiverHash != bytes32(0)) {
            uint groupId = groups.getIdByGroupName(groupReceiver);
            groupRToIncidenceIds[groupId].push(incidenceCount);
        }
        uint senderId = users.getIdByUserName(senderNameHash);
        senderToIncidenceIds[senderId].push(incidenceCount);

        incidenceCount++;
    }

    function userViewIndividualIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender); 
        uint[] memory result = userRToIncidenceIds[userId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }

    function userViewGroupIncidences() public view returns (Incidence[] memory) {
        require(groups.getGroupIdByUserWallet(msg.sender) != 0, "No eres miembro de ningun grupo"); 
        uint groupId = groups.getGroupIdByUserWallet(msg.sender);
        uint[] memory result = groupRToIncidenceIds[groupId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }
}
