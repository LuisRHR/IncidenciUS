// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
import "./UserGroups.sol";

contract Incidences {
    enum priority {BAJA, MEDIA, ALTA}
    struct Incidence {
        uint id;
        string titleHash;
        string descriptionHash;
        string date;
        priority priorityLevel;
        string senderNameHash;
        string userReceiverHash;
        string groupReceiverHash;

        // CID de IPFS con toda la información privada de la incidencia 
        string privateDataCID;
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

    function registerIncidence(string memory titleHash, string memory descriptionHash, string memory date, priority priorityLevel, string memory senderNameHash, string memory userReceiverHash, string memory groupReceiverHash, string memory privateDataCID) public {
        // En la lógica de alto nivel debe de verificarse que el checkbox que se marque si el grupo es el destinatario, mande como senderName "" y que en caso contrario mande groupReceiver como "", así como que el usuario o grupo destinatario que sea en cada caso
        incidenceCount++;
        incidences[incidenceCount] = Incidence(incidenceCount, titleHash, descriptionHash, date, priorityLevel, senderNameHash, userReceiverHash, groupReceiverHash, privateDataCID);
        if (keccak256(abi.encodePacked(userReceiverHash)) != keccak256(abi.encodePacked(""))) {
            uint userId = users.getIdByUserName(userReceiverHash);
            userRToIncidenceIds[userId].push(incidenceCount);
        }
        else if (keccak256(abi.encodePacked(groupReceiverHash)) != keccak256(abi.encodePacked(""))) {
            uint groupId = groups.getIdByGroupName(groupReceiverHash);
            groupRToIncidenceIds[groupId].push(incidenceCount);
        }
        uint senderId = users.getIdByUserName(senderNameHash);
        senderToIncidenceIds[senderId].push(incidenceCount);
    }

    function userViewIndividualIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender); 
        require(userRToIncidenceIds[userId].length > 0, "No tienes incidencias asignadas");
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
        require(groupRToIncidenceIds[groupId].length > 0, "No tienes incidencias asignadas"); 
        uint[] memory result = groupRToIncidenceIds[groupId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }
}
