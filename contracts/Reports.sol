// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Reports {

    enum Tipo { Bug, User }

    struct Report {
        uint id;
        string sender;
        string description;
    }

    struct BugReport {
        string title;
    }

    struct UserReport {
        string userName;
        string email;
    }

    uint public reportCount;

    mapping(uint => Report) public reports;
    mapping(uint => BugReport) public bugReports;
    mapping(uint => UserReport) public userReports;

    function createBugReport(string memory sender, string memory description, string memory title) public {
        contador++;

        reports[contador] = Report(contador, sender, description);
        bugReports[contador] = BugReport(title);
    }

    function createUserReport(string memory sender, string memory description, string memory userName, string memory email) public {
        contador++;

        reports[contador] = Report(contador, sender, description);
        userReports[contador] = UserReport(userName, email);
    }
}