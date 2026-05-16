// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";

contract Reports {

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

    mapping(uint => mapping(address => string)) public bugReportKeys;
    mapping(uint => mapping(address => string)) public userReportKeys;

    function createBugReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 titleHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public {
        require(adminWallets.length == encryptedKeys.length, "Arrays de admins y llaves deben coincidir");
        
        bugReports[reportCount] = BugReport(reportCount, senderHashed, descriptionHashed, hashProofs, titleHashed, userReportCID);
        
        for (uint i = 0; i < adminWallets.length; i++) {
            bugReportKeys[reportCount][adminWallets[i]] = encryptedKeys[i];
        }
        reportCount++;
    }

    function createUserReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 userNameHashed, bytes32 emailHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public {
        require(adminWallets.length == encryptedKeys.length, "Arrays de admins y llaves deben coincidir");

        userReports[reportCount] = UserReport(reportCount, senderHashed, descriptionHashed, hashProofs, userNameHashed, emailHashed, userReportCID);

        for (uint i = 0; i < adminWallets.length; i++) {
            userReportKeys[reportCount][adminWallets[i]] = encryptedKeys[i];
        }
        reportCount++;
    }

    function viewSortedBugReports() public view returns (BugReport[] memory) {
        uint activeCount = 0;
        uint userId = users.getIdByWallet(msg.sender);
        require(users.getUserById(userId).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "Acceso denegado: Se requiere rol de Administrador");

        for (uint i = 1; i < reportCount; i++) {
            if (bugReports[i].id != 0) activeCount++;
        }

        BugReport[] memory result = new BugReport[](activeCount);
        uint currentIndex = 0;
        for (uint i = reportCount; i > 0; i--) {
            if (bugReports[i].id != 0 || userReports[i].id != 0) {
                result[currentIndex] = bugReports[i];
                currentIndex++;
            }
        }

        return result;
    }

    function viewSortedUserReports() public view returns (UserReport[] memory) {
        uint activeCount = 0;
        uint userId = users.getIdByWallet(msg.sender);
        require(users.getUserById(userId).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "Acceso denegado: Se requiere rol de Administrador");

        for (uint i = 1; i < reportCount; i++) {
            if (userReports[i].id != 0) activeCount++;
        }

        UserReport[] memory result = new UserReport[](activeCount);
        uint currentIndex = 0;
        for (uint i = reportCount; i > 0; i--) {
            if (userReports[i].id != 0 || bugReports[i].id != 0) {
                result[currentIndex] = userReports[i];
                currentIndex++;
            }
        }

        return result;
    }

    function removeBugReport(uint reportId) public {
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
        delete bugReports[reportId];
    }

    function removeUserReport(uint reportId) public {
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
        delete userReports[reportId];
    }
}
