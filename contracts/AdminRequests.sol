// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title AdminRequests
 * @notice Gestiona las solicitudes de los usuarios para obtener el rol de administrador de sistema.
 */
contract AdminRequests {
    /**
     * @notice Estructura de una solicitud.
     * @param id Identificador de la solicitud.
     * @param userWallet Wallet del usuario solicitante.
     * @param requestReason Texto explicativo del motivo del ascenso.
     */
    struct AdminRequest {
        uint id;
        address userWallet;
        string requestReason;
    }

    /// @notice Contador incremental de solicitudes.
    uint public requestCount=1;

    constructor() {}

    /// @dev Almacena todas las solicitudes de administración indexadas por su ID único.
    mapping(uint => AdminRequest) public adminRequests;
    /// @dev Relaciona la dirección wallet de un usuario con el ID de su solicitud activa.
    mapping(address => uint) public walletToRequestId;

    /**
     * @notice Crea una nueva solicitud de administrador.
     * @dev Se restringe a una solicitud activa por wallet para evitar spam.
     * @param userWallet Dirección wallet del solicitante.
     * @param requestReason Razón por la cual solicita el estatus de administrador.
     */
    function createAdminRequest(address userWallet, string memory requestReason) public {
        require(walletToRequestId[userWallet] == 0, "Ya has enviado una solicitud de admin");
        adminRequests[requestCount] = AdminRequest(requestCount, userWallet, requestReason);
        walletToRequestId[userWallet] = requestCount;   
        requestCount++;
    }

    /**
     * @notice Permite visualizar todas las solicitudes actuales.
     * @dev Devuelve un array compacto eliminando los huecos de solicitudes borradas.
     * @return AdminRequest[] Array con las solicitudes pendientes.
     */
    function viewRequests() public view returns (AdminRequest[] memory) {
         AdminRequest[] memory requests = new AdminRequest[](requestCount);
            for (uint i=1; i<=requestCount; i++) {
                if (adminRequests[i].id != 0)
                requests[i-1] = adminRequests[i];
            }
         return requests;
     }

    /**
     * @notice Elimina una solicitud (ya sea por aprobación o rechazo).
     * @dev Libera la wallet del mapping para que el usuario pueda volver a solicitar si fuera necesario.
     * @param requestId ID de la solicitud a borrar.
     */
    function removeRequest(uint requestId) public {
        address user = adminRequests[requestId].userWallet;
        delete walletToRequestId[user];
        delete adminRequests[requestId];
    }
}
