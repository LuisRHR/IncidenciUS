// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
/**
 * @title Reports
 * @notice Gestiona la creación y consulta de reportes de errores (bugs) y reportes de usuarios.
 * @dev Utiliza un sistema de llaves cifradas para que solo los administradores autorizados accedan a los datos en IPFS.
 */
contract Reports {
    /**
     * @notice Estructura para reportes de fallos técnicos.
     * @param id Identificador único del reporte.
     * @param senderHash Hash del nombre del remitente.
     * @param descriptionHash Hash de la descripción del error.
     * @param hashProofs Hash de las evidencias adjuntas.
     * @param titleHash Hash del título del reporte.
     * @param bugReportCID Puntero IPFS a los datos completos y evidencias.
     */
    struct BugReport {
        uint id;
        bytes32 senderHash;
        bytes32 descriptionHash;
        bytes32 hashProofs;
        bytes32 titleHash;

        string bugReportCID;
    }

    /**
     * @notice Estructura para denuncias entre usuarios.
     * @param id Identificador único de la denuncia.
     * @param senderHash Hash del nombre del remitente.
     * @param descriptionHash Hash del motivo de la denuncia.
     * @param hashProofs Hash de las pruebas.
     * @param userNameHash Hash del nombre del usuario reportado.
     * @param emailHash Hash del correo del usuario reportado.
     * @param userReportCID Puntero IPFS con el expediente completo.
     */
    struct UserReport {
        uint id;
        bytes32 senderHash;
        bytes32 descriptionHash;
        bytes32 hashProofs;
        bytes32 userNameHash;
        bytes32 emailHash;

        string userReportCID;
    }

    /// @notice Contador global para IDs de reportes.
    uint public reportCount=1;
    /// @notice Referencia al contrato de usuarios para verificar permisos.
    Users public users;

    /**
     * @notice Constructor que vincula el gestor de usuarios.
     * @param usersAddress Dirección del contrato Users.sol.
     */
    constructor(address usersAddress) {
        users = Users(usersAddress);
    }

    mapping(uint => BugReport) public bugReports;
    mapping(uint => UserReport) public userReports;

    mapping(uint => mapping(address => string)) public bugReportKeys;
    mapping(uint => mapping(address => string)) public userReportKeys;

    /**
     * @notice Registra un nuevo reporte de bug y distribuye la llave de acceso a los administradores.
     * @dev Los arrays adminWallets y encryptedKeys deben tener el mismo orden y longitud.
     * @param senderHashed Hash del nombre del remitente.
     * @param descriptionHashed Hash de la descripción.
     * @param titleHashed Hash del título.
     * @param hashProofs Hash de las pruebas.
     * @param bugReportCID CID de IPFS.
     * @param adminWallets Direcciones de los administradores que podrán leer este reporte.
     * @param encryptedKeys Llave AES cifrada con la clave pública de cada administrador.
     */
    function createBugReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 titleHashed, bytes32 hashProofs, string memory bugReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public {
        require(adminWallets.length == encryptedKeys.length, "Arrays de admins y llaves deben coincidir");
        
        bugReports[reportCount] = BugReport(reportCount, senderHashed, descriptionHashed, hashProofs, titleHashed, bugReportCID);
        
        for (uint i = 0; i < adminWallets.length; i++) {
            bugReportKeys[reportCount][adminWallets[i]] = encryptedKeys[i];
        }
        reportCount++;
    }

    /**
     * @notice Registra una denuncia de usuario y distribuye las llaves de acceso.
     * @param senderHashed Hash del denunciante.
     * @param descriptionHashed Hash de la descripción.
     * @param userNameHashed Hash del usuario denunciado.
     * @param emailHashed Hash del email denunciado.
     * @param hashProofs Hash de las pruebas.
     * @param userReportCID CID de IPFS.
     * @param adminWallets Direcciones de administradores.
     * @param encryptedKeys Llaves cifradas para los administradores.
     */
    function createUserReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 userNameHashed, bytes32 emailHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public {
        require(adminWallets.length == encryptedKeys.length, "Arrays de admins y llaves deben coincidir");
        require(users.getIdByWallet(msg.sender) != users.getIdByUserName(senderHashed), "No puedes reportarte a ti mismo");
        require(users.getIdByWallet(msg.sender) != users.getIdByEmail(emailHashed), "No puedes reportarte a ti mismo");

        userReports[reportCount] = UserReport(reportCount, senderHashed, descriptionHashed, hashProofs, userNameHashed, emailHashed, userReportCID);

        for (uint i = 0; i < adminWallets.length; i++) {
            userReportKeys[reportCount][adminWallets[i]] = encryptedKeys[i];
        }
        reportCount++;
    }

    /**
     * @notice Lista todos los reportes de bugs en orden descendente (más nuevos primero).
     * @dev Solo accesible por Administradores de Sistema.
     * @return BugReport[] Array con los reportes activos.
     */
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

    /**
     * @notice Lista todas las denuncias de usuarios en orden descendente.
     * @dev Solo accesible por Administradores de Sistema.
     * @return UserReport[] Array con las denuncias activas.
     */
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

    /**
     * @notice Elimina un reporte de bug.
     * @param reportId ID del reporte a eliminar.
     */
    function removeBugReport(uint reportId) public {
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
        delete bugReports[reportId];
    }

    /**
     * @notice Elimina una denuncia de usuario.
     * @param reportId ID de la denuncia a eliminar.
     */
    function removeUserReport(uint reportId) public {
        require(users.getUserById(users.getIdByWallet(msg.sender)).condition == Users.userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para realizar esta accion");
        delete userReports[reportId];
    }
}
