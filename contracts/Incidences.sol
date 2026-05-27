// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
import "./UserGroups.sol";
/**
 * @title Incidences
 * @notice Contrato para la gestión de incidencias enviadas a usuarios o grupos.
 * @dev Permite la búsqueda filtrada por destinatario individual o grupal.
 */
contract Incidences {
    /// @notice Enumerado de los niveles de urgencia de la incidencia.
    enum priority {BAJA, MEDIA, ALTA}

    /**
     * @notice Estructura de una incidencia.
     * @param id ID único autoincremental.
     * @param titleHash Hash del título.
     * @param descriptionHash Hash de la descripción del grupo.
     * @param date Fecha de creación (string).
     * @param priorityLevel Nivel de prioridad (BAJA/MEDIA/ALTA).
     * @param senderNameHash Hash del nombre del emisor.
     * @param userReceiverHash Hash del nombre del usuario receptor (si es individual).
     * @param groupReceiverHash Hash del nombre del grupo receptor (si es grupal).
     * @param privateDataCID CID de IPFS con los detalles privados.
     * @param encryptedAESKey Llave AES cifrada para el/los receptores.
     */
    struct Incidence {
        uint id;
        bytes32 titleHash;
        bytes32 descriptionHash;
        string date;
        priority priorityLevel;
        bytes32 senderNameHash;
        bytes32 userReceiverHash;
        bytes32 groupReceiverHash;
        string privateDataCID;
        string encryptedAESKey;
    }
    
    /// @notice Contador total de incidencias.
    uint public incidenceCount=1;
    /// @notice Instancia del contrato de usuarios.
    Users public users;
    /// @notice Instancia del contrato de grupos.
    Groups public groups;

    /**
     * @notice Inicializa las referencias a los contratos de usuarios y grupos.
     * @param usersAddress Dirección de Users.sol.
     * @param groupsAddress Dirección de UserGroups.sol.
     */
    constructor(address usersAddress, address groupsAddress) {
        users = Users(usersAddress);
        groups = Groups(groupsAddress);
    }

    /// @dev Mappings para indexar incidencias por emisor y receptor (usuario o grupo).
    mapping (uint => Incidence) public incidences;
    mapping (uint => uint[]) public senderToIncidenceIds;
    mapping (uint => uint[]) public userRToIncidenceIds;
    mapping (uint => uint[]) public groupRToIncidenceIds;

    /**
     * @notice Crea una nueva incidencia y la indexa según su destino.
     * @param titleHash Hash del título.
     * @param descriptionHash Hash de la descripción.
     * @param date Fecha de registro.
     * @param priorityLevel Nivel de urgencia.
     * @param senderNameHash Hash del nombre del emisor.
     * @param userReceiverHash Hash del nombre del usuario receptor (si es individual).
     * @param groupReceiver Nombre del grupo receptor en claro (para búsqueda de ID).
     * @param groupReceiverHash Hash del grupo receptor (si es grupal).
     * @param privateDataCID CID de IPFS.
     * @param encryptedAESKey Llave AES cifrada.
     */
    function registerIncidence(bytes32 titleHash, bytes32 descriptionHash, string memory date, priority priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, string memory groupReceiver, bytes32 groupReceiverHash, string memory privateDataCID, string memory encryptedAESKey) public {
        incidences[incidenceCount] = Incidence(incidenceCount, titleHash, descriptionHash, date, priorityLevel, senderNameHash, userReceiverHash, groupReceiverHash, privateDataCID, encryptedAESKey);
        if (userReceiverHash != bytes32(0)) {
            uint userId = users.getIdByUserName(userReceiverHash);
            userRToIncidenceIds[userId].push(incidenceCount);
        }
        else if (groupReceiverHash != bytes32(0)) {
            uint groupId = groups.getIdByGroupName(groupReceiver);
            groupRToIncidenceIds[groupId].push(incidenceCount);
        }
        uint senderId = users.getIdByUserName(senderNameHash);
        senderToIncidenceIds[senderId].push(incidenceCount);

        incidenceCount++;
    }

    /**
     * @notice Permite a un usuario ver las incidencias enviadas directamente a él.
     * @return Incidence[] Lista de incidencias individuales del remitente.
     */
    function userViewIndividualIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender); 
        uint[] memory result = userRToIncidenceIds[userId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }

    /**
     * @notice Permite a un usuario ver las incidencias del grupo al que pertenece.
     * @dev Requiere que el usuario sea miembro de un grupo activo.
     * @return Incidence[] Lista de incidencias grupales.
     */
    function userViewGroupIncidences() public view returns (Incidence[] memory) {
        require(groups.getGroupIdByUserWallet(msg.sender) != 0, "No eres miembro de ningun grupo"); 
        uint groupId = groups.getGroupIdByUserWallet(msg.sender);
        uint[] memory result = groupRToIncidenceIds[groupId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i=0; i<result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }
}
