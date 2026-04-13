// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";

contract Reports {

    // Para implementar correctamente la extensión de report a bugreport y userreport vamos a
    // usar directamente dos structs separados ya que no hay herencia entre structs aunque
    // comparten una estructura base

    struct BugReport {
        uint id;
        string sender;
        string description;
        string title;
    }

    struct UserReport {
        uint id;
        string sender;
        string description;
        string userName;
        string email;
    }

    uint public reportCount;
    Users public users;

    constructor(address usersAddress) {
        users = Users(usersAddress);
    }

    mapping(uint => BugReport) public bugReports;
    mapping(uint => UserReport) public userReports;

    function createBugReport(string memory sender, string memory description, string memory title) public {
        reportCount++;

        bugReports[reportCount] = BugReport(reportCount, sender, description, title);
    }

    function createUserReport(string memory sender, string memory description, string memory userName, string memory email) public {
        reportCount++;

        userReports[reportCount] = UserReport(reportCount, sender, description, userName, email);
    }

    function viewSortedBugReports() public view returns (BugReport[] memory) {
        BugReport[] memory result = new BugReport[](reportCount);
        uint count = 0;
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para ver los reportes de bugs");
        for (uint i = reportCount; i>0; i--) {
            // Si existe un bugReport con ese id, lo añadimos al resultado
            if (bugReports[i].id!=0) { 
                result[count] = bugReports[i];
                count++;
            }
        }

        return result;
    }

    function viewSortedUserReports() public view returns (UserReport[] memory) {
        UserReport[] memory result = new UserReport[](reportCount);
        uint count = 0;
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para ver los reportes de bugs");
        for (uint i = reportCount; i>0; i--) {
            // Si existe un userReport con ese id, lo añadimos al resultado
            if (userReports[i].id!=0) { 
                result[count] = userReports[i];
                count++;
            }
        }

        return result;
    }

}