// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Users.sol";
import "./UserGroups.sol";

contract Incidences {
    struct Incidence {
        uint id;
        string title;
        string description;
        string date;
        enum priority {BAJA, MEDIA, ALTA};
        string senderName;
        string userReceiver;
        string groupReceiver;
    }
    
    uint public incidenceCount;

    mapping (uint => Incidence) public incidences;
    mapping (uint => uint[]) public senderToIncidenceIds;
    mapping (uint => uint[]) public userRToIncidenceIds;
    mapping (uint => uint[]) public groupRToIncidenceIds;

    function registerIncidence(string memory title, string memory description, string memory date, string memory priority, string memory senderName, string memory userReceiver, string memory groupReceiver) public {
        // En la lógica de alto nivel debe de verificarse que el checkbox que se marque si el grupo es el destinatario, mande como senderName "" y que en caso contrario mande groupReceiver como "", así como que el usuario o grupo destinatario que sea en cada caso
        incidenceCount++;
        incidences[incidenceCount] = Incidence(incidenceCount, title, description, date, priority, senderName, userReceiver, groupReceiver);
        if (userReceiver != "") {
            userRToIncidenceIds[userNameToUid[userReceiver]].push(incidenceCount);
        }
        else if (groupReceiver != "") {
            groupRToIncidenceIds[groupNameToId[groupReceiver]].push(incidenceCount);
        }
        senderToIncidenceIds[userNameToUid[senderName]].push(incidenceCount);
    }

    function letUserOrGroupViewIncidencesForThem(string memory date1, string memory date2) public view returns (Incidence[] memory) {
        Incidence[] memory result;
        uint count = 0;
        uint userId = walletToUid[msg.sender];
        uint groupId = walletToGroupId[msg.sender];

        //TO-DO Implementar lógica para filtrar por fechas, así com mostrar incidencias tanto para usuarios como para grupos
    }
    constructor() {
        
    }
}