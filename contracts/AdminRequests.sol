// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract AdminRequests {

    struct AdminRequest {
        uint id;
        address userWallet;
        string requestReason;
    }

    uint public requestCount;

    constructor() {
        
    }

    mapping(uint => AdminRequest) public adminRequests;
    mapping(address => uint) public walletToRequestId;

    function createAdminRequest(address userWallet, string memory requestReason) public {
        requestCount++;
        require(walletToRequestId[userWallet] == 0, "Ya has enviado una solicitud de admin");
        adminRequests[requestCount] = AdminRequest(requestCount, userWallet, requestReason);
        walletToRequestId[userWallet] = requestCount;   
    }

     // TO-DO Función para que el admin pueda ver las solicitudes
}