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

     function viewRequests() public view returns (AdminRequest[] memory) {
         AdminRequest[] memory requests = new AdminRequest[](requestCount);
            for (uint i=1; i<=requestCount; i++) {
                requests[i-1] = adminRequests[i];
            }
         return requests;
     }

     function removeRequest(uint requestId) public {
        address user = adminRequests[requestId].userWallet;
        delete walletToRequestId[user]; // IMPORTANTE: Permitir nueva solicitud
        delete adminRequests[requestId];
    }
}
