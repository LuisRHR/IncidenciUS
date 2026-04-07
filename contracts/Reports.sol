// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
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

    function viewSortedBugReports(string memory reportType) public view returns (BugReport[] memory) {
        BugReport[] memory result;
        uint count = 0;
        require(users[walletToUid[msg.sender]].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para ver los reportes de bugs");
        for (uint i = reportCount; i>0; i--) {
            // Si existe un bugReport con ese id, lo añadimos al resultado
            if (BugReports[i]!=0) { 
                result[count] = bugReports[i];
                count++;
            }
        }

        return result;
    }

    function viewSortedUserReports(string memory reportType) public view returns (UserReport[] memory) {
        UserReport[] memory result;
        uint count = 0;
        require(users[walletToUid[msg.sender]].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para ver los reportes de bugs");
        for (uint i = reportCount; i>0; i--) {
            // Si existe un userReport con ese id, lo añadimos al resultado
            if (userReports[i]!=0) { 
                result[count] = userReports[i];
                count++;
            }
        }

        return result;
    }


    constructor() {
        
    }
}