// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
import "./UserGroups.sol";

contract Incidences {
    enum priority {BAJA, MEDIA, ALTA}
    struct Incidence {
        uint id;
        string title;
        string description;
        string date;
        priority priorityLevel;
        string senderName;
        string userReceiver;
        string groupReceiver;
    }
    
    uint public incidenceCount;

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

    function registerIncidence(string memory title, string memory description, string memory date, priority priorityLevel, string memory senderName, string memory userReceiver, string memory groupReceiver) public {
        // En la lógica de alto nivel debe de verificarse que el checkbox que se marque si el grupo es el destinatario, mande como senderName "" y que en caso contrario mande groupReceiver como "", así como que el usuario o grupo destinatario que sea en cada caso
        incidenceCount++;
        incidences[incidenceCount] = Incidence(incidenceCount, title, description, date, priorityLevel, senderName, userReceiver, groupReceiver);
        if (keccak256(abi.encodePacked(userReceiver)) != keccak256(abi.encodePacked(""))) {
            uint userId = users.getIdByUserName(userReceiver);
            userRToIncidenceIds[userId].push(incidenceCount);
        }
        else if (keccak256(abi.encodePacked(groupReceiver)) != keccak256(abi.encodePacked(""))) {
            uint groupId = groups.getIdByGroupName(groupReceiver);
            groupRToIncidenceIds[groupId].push(incidenceCount);
        }
        uint senderId = users.getIdByUserName(senderName);
        senderToIncidenceIds[senderId].push(incidenceCount);
    }

    function userViewIndividualIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender);
        uint[] memory result;
        Incidence[] memory resultIncidences;
        require(userRToIncidenceIds[userId].length > 0, "No tienes incidencias asignadas");
        result = userRToIncidenceIds[userId];
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }

    function userViewGroupIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender);
        uint groupId = groups.getGroupIdByUserWallet(msg.sender);
        uint[] memory result;
        Incidence[] memory resultIncidences;
        require(groupRToIncidenceIds[groupId].length > 0, "No tienes incidencias asignadas");
        address userWallet = users.getUserById(userId).wallet;
        require(groups.getGroupIdByUserWallet(userWallet) != 0, "No eres miembro de ningun grupo");  
        result = groupRToIncidenceIds[groupId];
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }
}