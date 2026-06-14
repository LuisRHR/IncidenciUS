// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
import "./UserGroups.sol";

/**
 * @title Incidences
 * @notice Contrato para la gestión de incidencias enviadas a usuarios o grupos.
 */
contract Incidences {
    /// @notice Enumerado que define la prioridad de una incidencia.
    enum priority { BAJA, MEDIA, ALTA }

    /// @notice Enumerado que define los estados posibles de una incidencia (4 estados).
    enum incidenceStatus { ACTIVA, RESUELTA, REABIERTA, CERRADA }

    /**
     * @notice Estructura que representa una incidencia enviada a un usuario o grupo.
     * @param id Identificador único incremental.
     * @param titleHash Hash del título de la incidencia.
     * @param descriptionHash Hash de la descripción de la incidencia.
     * @param date Fecha de creación en formato string.
     * @param priorityLevel Nivel de prioridad (BAJA, MEDIA, ALTA).
     * @param senderNameHash Hash del nombre del usuario que envía la incidencia.
     * @param userReceiverHash Hash del nombre del usuario receptor (si es individual).
     * @param groupReceiverHash Hash del nombre del grupo receptor (si es grupal).
     * @param privateDataCID CID de IPFS con los datos privados cifrados.
     * @param encryptedAESKey Clave AES cifrada para descifrar los datos (para receptores miembro o usuario individual).
     * @param status Estado actual de la incidencia.
     * @param senderWallet Dirección wallet del usuario que envía la incidencia.
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
        incidenceStatus status;
        address senderWallet;
    }

    /// @notice Contador incremental para asignar IDs únicos a nuevas incidencias.
    uint public incidenceCount = 1;
    /// @notice Referencia al contrato de usuarios para validar datos.
    Users public users;
    /// @notice Referencia al contrato de grupos para validar datos.
    Groups public groups;

    constructor(address usersAddress, address groupsAddress) {
        users = Users(usersAddress);
        groups = Groups(groupsAddress);
    }

    /// @dev Almacena todas las incidencias indexadas por ID.
    mapping(uint => Incidence) public incidences;
    /// @dev Mapea ID de emisor a array de IDs de incidencias que envió.
    mapping(uint => uint[]) public senderToIncidenceIds;
    /// @dev Mapea ID de usuario a array de IDs de incidencias dirigidas a él.
    mapping(uint => uint[]) public userRToIncidenceIds;
    /// @dev Mapea ID de grupo a array de IDs de incidencias dirigidas a él.
    mapping(uint => uint[]) public groupRToIncidenceIds;
    /// @dev Almacena la clave AES cifrada para el emisor (permite descifrar en notificaciones).
    mapping(uint => mapping(address => string)) public senderEncryptedKeys;
    /// @dev Claves AES cifradas asimétricamente para miembros de un grupo (cuando el emisor no es miembro).
    mapping(uint => mapping(address => string)) public groupMemberKeys;
    /// @notice Se emite cuando se registra una nueva incidencia.
    event IncidenceRegistered(uint indexed id, address indexed senderWallet);
    /// @notice Se emite cuando se actualiza el estado de una incidencia.
    event IncidenceStatusChanged(uint indexed id, incidenceStatus newStatus, address indexed changedBy);

    /**
     * @notice Registra una nueva incidencia dirigida a un usuario o grupo.
     * @dev Almacena la incidencia con estado inicial ACTIVA y gestiona claves AES por tipo de receptor.
     * @param titleHash Hash keccak256 del título (datos sensibles).
     * @param descriptionHash Hash keccak256 de la descripción (datos sensibles).
     * @param date Fecha de creación en formato string.
     * @param priorityLevel Prioridad de la incidencia (BAJA, MEDIA, ALTA).
     * @param senderNameHash Hash keccak256 del nombre del remitente.
     * @param userReceiverHash Hash del receptor individual (0 si es grupal).
     * @param groupReceiver Nombre del grupo receptor (vacío si es individual).
     * @param groupReceiverHash Hash del nombre del grupo receptor.
     * @param privateDataCID CID de IPFS con los datos privados cifrados.
     * @param encryptedAESKey Clave AES cifrada para receptores miembro del grupo.
     * @param senderEncryptedAESKey Clave AES cifrada para el remitente (si es necesaria).
     */
    function registerIncidence(bytes32 titleHash, bytes32 descriptionHash, string memory date, priority priorityLevel,bytes32 senderNameHash, bytes32 userReceiverHash,
     string memory groupReceiver,bytes32 groupReceiverHash, string memory privateDataCID, string memory encryptedAESKey,string memory senderEncryptedAESKey) public {
        incidences[incidenceCount] = Incidence(
            incidenceCount, titleHash, descriptionHash, date, priorityLevel,
            senderNameHash, userReceiverHash, groupReceiverHash,
            privateDataCID, encryptedAESKey, incidenceStatus.ACTIVA, msg.sender
        );

        if (userReceiverHash != bytes32(0)) {
            uint userId = users.getIdByUserName(userReceiverHash);
            userRToIncidenceIds[userId].push(incidenceCount);
        } else if (groupReceiverHash != bytes32(0)) {
            uint groupId = groups.getIdByGroupName(groupReceiver);
            groupRToIncidenceIds[groupId].push(incidenceCount);
        }

        uint senderId = users.getIdByUserName(senderNameHash);
        senderToIncidenceIds[senderId].push(incidenceCount);

        if (bytes(senderEncryptedAESKey).length > 0) {
            senderEncryptedKeys[incidenceCount][msg.sender] = senderEncryptedAESKey;
        }

        emit IncidenceRegistered(incidenceCount, msg.sender);
        incidenceCount++;
    }

    /**
     * @notice Almacena claves AES por miembro para incidencias enviadas por no-miembros a grupos.
     * @dev Permite que un emisor no-miembro proporcione claves AES descifradas para cada miembro del grupo.
     * @param incidenceId Identificador de la incidencia.
     * @param memberWallets Array de direcciones wallet de los miembros del grupo.
     * @param encryptedKeys Array de claves AES cifradas correspondientes a cada miembro.
     */
    function storeGroupMemberKeys(uint incidenceId,address[] memory memberWallets,string[] memory encryptedKeys) public {
        require(incidences[incidenceId].senderWallet == msg.sender, "Solo el emisor puede almacenar claves");
        require(memberWallets.length == encryptedKeys.length, "Arrays de diferente longitud");
        for (uint i = 0; i < memberWallets.length; i++) {
            groupMemberKeys[incidenceId][memberWallets[i]] = encryptedKeys[i];
        }
    }

    /**
     * @notice Actualiza el estado de una incidencia siguiendo las transiciones permitidas.
     * @dev Transiciones válidas:
     *   - ACTIVA (0)    -> RESUELTA (1)
     *   - REABIERTA (2) -> RESUELTA (1)
     *   - RESUELTA (1)  -> REABIERTA (2)
     *   - RESUELTA (1)  -> CERRADA (3) (cierre definitivo por el emisor)
     * @dev No se valida el rol del llamante — el frontend controla qué botón ve cada usuario.
     * @param incidenceId Identificador único de la incidencia.
     * @param newStatus Nuevo estado destino de la incidencia.
     */
    function updateIncidenceStatus(uint incidenceId, incidenceStatus newStatus) public {
        Incidence storage inc = incidences[incidenceId];
        require(inc.id != 0, "Incidencia no encontrada");
        require(newStatus <= incidenceStatus.CERRADA, "Estado no valido");

        if (newStatus == incidenceStatus.RESUELTA) {
            require(inc.status == incidenceStatus.ACTIVA || inc.status == incidenceStatus.REABIERTA,"Solo se puede resolver cuando esta activa o reabierta");
        } else if (newStatus == incidenceStatus.REABIERTA) {
            require(inc.status == incidenceStatus.RESUELTA,"Solo se puede reabrir cuando esta resuelta");
        } else if (newStatus == incidenceStatus.CERRADA) {
            require(inc.status == incidenceStatus.RESUELTA,"Solo se puede cerrar cuando esta resuelta");
        } else if (newStatus == incidenceStatus.ACTIVA) {
            revert("No se permite volver a Activa directamente");
        }

        inc.status = newStatus;
        emit IncidenceStatusChanged(incidenceId, newStatus, msg.sender);
    }

    /**
     * @notice Obtiene todas las incidencias dirigidas individualmente al usuario que llama.
     * @dev Recupera incidencias del mapping userRToIncidenceIds basado en la wallet actual.
     * @return Incidence[] Array con todas las incidencias individuales del usuario.
     */
    function userViewIndividualIncidences() public view returns (Incidence[] memory) {
        uint userId = users.getIdByWallet(msg.sender);
        uint[] memory result = userRToIncidenceIds[userId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);
        for (uint i = 0; i < result.length; i++) {
            resultIncidences[i] = incidences[result[i]];
        }
        return resultIncidences;
    }

    /**
     * @notice Obtiene todas las incidencias dirigidas al grupo del usuario actual.
     * @dev Recupera incidencias del grupo y gestiona claves de descifrado diferenciadas:
     *   - Para emisores miembro: usa la clave AES simétrica del grupo.
     *   - Para emisores no-miembro: usa la clave específica almacenada en groupMemberKeys.
     * @return Incidence[] Array con todas las incidencias del grupo.
     */
    function userViewGroupIncidences() public view returns (Incidence[] memory) {
        require(groups.getGroupIdByUserWallet(msg.sender) != 0, "No eres miembro de ningun grupo");

        uint groupId = groups.getGroupIdByUserWallet(msg.sender);
        uint[] memory result = groupRToIncidenceIds[groupId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);

        for (uint i = 0; i < result.length; i++) {
            Incidence memory inc = incidences[result[i]];

            // Para emisores que no son miembros.
            if (bytes(inc.encryptedAESKey).length == 0) {
                inc.encryptedAESKey = groupMemberKeys[result[i]][msg.sender];
            }

            resultIncidences[i] = inc;
        }
        return resultIncidences;
    }

    /**
     * @notice Obtiene todas las incidencias enviadas por el usuario actual, necesario para notificaciones.
     * @dev Recupera incidencias del mapping senderToIncidenceIds e inyecta la clave AES específica del remitente.
     * @return Incidence[] Array con todas las incidencias enviadas por el usuario.
     */
    function senderViewSentIncidences() public view returns (Incidence[] memory) {
        uint senderId = users.getIdByWallet(msg.sender);
        uint[] memory result = senderToIncidenceIds[senderId];
        Incidence[] memory resultIncidences = new Incidence[](result.length);

        for (uint i = 0; i < result.length; i++) {
            Incidence memory inc = incidences[result[i]];
            inc.encryptedAESKey = senderEncryptedKeys[result[i]][msg.sender];
            resultIncidences[i] = inc;
        }

        return resultIncidences;
    }
}
