// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";

contract Reports {

    // Para implementar correctamente la extensión de report a bugreport y userreport vamos a
    // usar directamente dos structs separados ya que no hay herencia entre structs aunque
    // comparten una estructura base

    struct BugReport {
        uint id;
        bytes32 senderHash;
        bytes32 descriptionHash;
        bytes32 hashProofs;
        bytes32 titleHash;

        // CID de IPFS para almacenar las pruebas de la denuncia, como fotos o videos, junto con el resto de la información.
        string userReportCID;
    }

    struct UserReport {
        uint id;
        bytes32 senderHash;
        bytes32 descriptionHash;
        bytes32 hashProofs;
        bytes32 userNameHash;
        bytes32 emailHash;

        // CID de IPFS para almacenar las pruebas de la denuncia, como fotos o videos, junto con el resto de la información.
        string userReportCID;
    }

    uint public reportCount=1;
    Users public users;

    constructor(address usersAddress) {
        users = Users(usersAddress);
    }

    mapping(uint => BugReport) public bugReports;
    mapping(uint => UserReport) public userReports;

    function createBugReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 titleHashed, bytes32 hashProofs, string memory userReportCID) public {
        bugReports[reportCount] = BugReport(reportCount, senderHashed, descriptionHashed, hashProofs, titleHashed, userReportCID);
        reportCount++;
    }

    function createUserReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 userNameHashed, bytes32 emailHashed, bytes32 hashProofs, string memory userReportCID) public {
        userReports[reportCount] = UserReport(reportCount, senderHashed, descriptionHashed, hashProofs, userNameHashed, emailHashed, userReportCID);
        reportCount++;
    }

    function viewSortedBugReports() public view returns (BugReport[] memory) {
        BugReport[] memory result = new BugReport[](reportCount);
        uint count = 0;
        uint userId = users.getIdByWallet(msg.sender);
        Users.userCondition condition = users.getUserById(userId).condition;
        require(condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "Acceso denegado: Se requiere rol de Administrador");        for (uint i = reportCount; i>0; i--) {
            // Si existe un bugReport con ese id, lo añadimos al resultado, además evitar confundirlo con un userReport por un error que sucedia.
            if (bugReports[i].id!=0 || userReports[i].id!=0) { 
                result[count] = bugReports[i];
                count++;
            }
        }

        return result;
    }

    function viewSortedUserReports() public view returns (UserReport[] memory) {
        UserReport[] memory result = new UserReport[](reportCount);
        uint count = 0;
        uint userId = users.getIdByWallet(msg.sender);
        Users.userCondition condition = users.getUserById(userId).condition;
        require(condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "Acceso denegado: Se requiere rol de Administrador");        for (uint i = reportCount; i>0; i--) {
            // Si existe un userReport con ese id, lo añadimos al resultado
            if (userReports[i].id!=0 || bugReports[i].id!=0) { 
                result[count] = userReports[i];
                count++;
            }
        }

        return result;
    }

    function removeBugReport(uint requestId) public {
    require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
    delete bugReports[requestId];
    }

    function removeUserReport(uint requestId) public {
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
        delete userReports[requestId];
    }
}
