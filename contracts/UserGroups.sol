// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";
/**
 * @title Groups
 * @notice Este contrato gestiona la creación de grupos, invitaciones de miembros y la distribución de llaves de acceso cifradas.
 * @dev Se apoya en el contrato Users para validar la identidad de los participantes.
 */
contract Groups {
    /**
     * @notice Estructura que define un grupo de trabajo.
     * @param groupName Nombre único del grupo.
     * @param description Breve explicación del propósito del grupo.
     * @param members Lista de UIDs de los usuarios que pertenecen al grupo.
     * @param invitedUsers Lista de UIDs de usuarios que han sido invitados pero aún no aceptan.
     * @param admin UID del usuario con permisos de administración sobre el grupo.
     */
    struct Group {
        string groupName;
        string description;
        uint[] members;
        uint[] invitedUsers;
        uint admin;
    }

    /// @notice Contador incremental para asignar IDs únicos a los grupos.
    uint public groupCount = 1;
    /// @notice Referencia al contrato de gestión de usuarios.
    Users public users;

    /**
     * @notice Inicializa el contrato vinculándolo con el sistema de usuarios existente.
     * @param usersAddress Dirección del contrato Users.sol desplegado.
     */
    constructor(address usersAddress) {
        users = Users(usersAddress);
    }

    /// @dev Almacena la información detallada de cada grupo indexada por su ID único.
    mapping(uint => Group) public groups;
    /// @dev Relaciona el nombre único de un grupo con su ID correspondiente.
    mapping(string => uint) public groupNameToId;
    /// @dev Mapea la dirección de un administrador con el ID del grupo que gestiona.
    mapping(address => uint) public walletAdminToGroupId;
    /// @dev Mapea la dirección de un usuario con el ID del grupo al que pertenece actualmente.
    mapping(address => uint) public walletToGroupId;
    /// @dev Almacena la lista de IDs de grupos a los que un usuario ha sido invitado.
    mapping(uint => uint[]) public userIdToInvitedGroupIds;
    /// @dev Almacena las llaves de acceso cifradas asimétricamente para cada miembro de un grupo.
    mapping(uint => mapping(address => string)) public groupUsersKeys;
    /// @dev Almacena los nombres de usuario cifrados con la clave AES del grupo para preservar la privacidad.
    mapping(uint => mapping(uint => string)) public memberEncryptedNames;

    /**
     * @notice Evento notifica a usuario para unirse a un grupo.
     * @param groupId ID del grupo al que se invita.
     * @param groupName Nombre del grupo al que se invita.
     */
    event InvitedToGroup(uint groupId, string groupName);

    /**
     * @notice Registra un nuevo grupo en el sistema.
     * @dev El creador se convierte automáticamente en administrador y primer miembro.
     * @param groupName Nombre identificativo del grupo.
     * @param description Texto descriptivo del grupo.
     * @param encryptedAdminKey Llave de cifrado del grupo protegida con la clave pública del creador.
     */
    function createGroup(string memory groupName, string memory description, string memory encryptedAdminKey) public {
        require(groupNameToId[groupName] == 0, "Grupo ya existe con este nombre"); 

        uint groupId = groupCount;
        uint adminId = users.getIdByWallet(msg.sender);
        require(adminId != 0, "El creador del grupo no es un usuario registrado");

        groups[groupId] = Group(groupName, description, new uint[](0), new uint[](0), adminId);
        groups[groupId].members.push(adminId);
        groups[groupId].admin = adminId;
        groupNameToId[groupName] = groupId;
        walletAdminToGroupId[msg.sender] = groupId;
        walletToGroupId[msg.sender] = groupId;
        groupUsersKeys[groupId][msg.sender] = encryptedAdminKey;

        groupCount++;
    }

    /**
     * @notice Invita a un usuario a unirse al grupo del cual el remitente es administrador.
     * @dev Almacena la llave del grupo cifrada específicamente para el invitado.
     * @param userNameHashed Hash del nombre del usuario invitado.
     * @param encryptedKeyForUser Llave del grupo cifrada con la clave pública del invitado.
     */
    function inviteUserToGroup(bytes32 userNameHashed, string memory encryptedKeyForUser) public {
        uint groupId = walletAdminToGroupId[msg.sender];
        require(groupId != 0, "No eres administrador de ningun grupo");
        
        uint userId = users.getIdByUserName(userNameHashed);
        require(userId != 0, "Usuario a invitar no registrado"); // Verificamos que el usuario a invitar está registrado
        require(!isMember(groupId, userId), "Usuario ya es miembro del grupo"); // Verificamos que el usuario no es ya miembro del grupo
        require(!isInvited(groupId, userId), "Usuario ya ha sido invitado al grupo"); // Verificamos que el usuario no ha sido ya invitado al grupo
        require(userId != 0, "Usuario no registrado");
        
        address userWallet = users.getUserById(userId).wallet;
        
        groups[groupId].invitedUsers.push(userId);
        userIdToInvitedGroupIds[userId].push(groupId);

        groupUsersKeys[groupId][userWallet] = encryptedKeyForUser;
        emit InvitedToGroup(groupId, groups[groupId].groupName);
    }

    /**
     * @dev Verifica si un usuario ya pertenece a un grupo.
     * @param groupId ID del grupo a consultar.
     * @param userId ID del usuario.
     * @return bool Verdadero si el usuario es miembro.
     */
    function isMember(uint groupId, uint userId) internal view returns (bool) {
        uint[] memory members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == userId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Verifica si un usuario tiene una invitación pendiente para un grupo.
     * @param groupId ID del grupo a consultar.
     * @param userId UID del usuario.
     * @return bool Verdadero si el usuario ha sido invitado.
     */
    function isInvited(uint groupId, uint userId) internal view returns (bool) {
        uint[] memory invitedUsers = groups[groupId].invitedUsers;
        for (uint i = 0; i < invitedUsers.length; i++) {
            if (invitedUsers[i] == userId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Permite a un usuario aceptar una invitación y unirse a un grupo.
     * @dev Al unirse, se eliminan automáticamente todas las demás invitaciones pendientes para este usuario.
     * @param groupName Nombre del grupo al que desea unirse.
     */
    function userJoined(string memory groupName) public {
        require(walletToGroupId[msg.sender] == 0, "Ya eres miembro de un grupo");
        uint groupId = groupNameToId[groupName];
        uint userId = users.getIdByWallet(msg.sender);
        require(isInvited(groupId, userId), "No has sido invitado a este grupo"); 

        groups[groupId].members.push(userId);
        walletToGroupId[msg.sender] = groupId;
        for (uint i = 0; i < userIdToInvitedGroupIds[userId].length; i++) {
            uint invitedGroupId = userIdToInvitedGroupIds[userId][i];
            if (invitedGroupId != groupId) {
                delete groupUsersKeys[invitedGroupId][msg.sender];
            }

            uint[] storage groupInvitedUsers = groups[invitedGroupId].invitedUsers;
            for (uint j = 0; j < groupInvitedUsers.length; j++) {
                if (groupInvitedUsers[j] == userId) {
                    groupInvitedUsers[j] = groupInvitedUsers[groupInvitedUsers.length - 1];
                    groupInvitedUsers.pop();
                    break;
                }
            }
        }
        delete userIdToInvitedGroupIds[userId];
    }

    /**
     * @notice Permite a un usuario rechazar una invitación a un grupo.
     * @param groupName Nombre del grupo cuya invitación desea rechazar.
     */
    function rejectGroupInvitation(string memory groupName) public {
        uint groupId = groupNameToId[groupName];
        require(groupId != 0, "Grupo no encontrado");
        uint userId = users.getIdByWallet(msg.sender);
        require(isInvited(groupId, userId), "No has sido invitado a este grupo");

        // Eliminar de invitedUsers del grupo
        uint[] storage groupInvitedUsers = groups[groupId].invitedUsers;
        for (uint i = 0; i < groupInvitedUsers.length; i++) {
            if (groupInvitedUsers[i] == userId) {
                groupInvitedUsers[i] = groupInvitedUsers[groupInvitedUsers.length - 1];
                groupInvitedUsers.pop();
                break;
            }
        }

        // Eliminar de userIdToInvitedGroupIds del usuario
        uint[] storage userInvitedGroups = userIdToInvitedGroupIds[userId];
        for (uint i = 0; i < userInvitedGroups.length; i++) {
            if (userInvitedGroups[i] == groupId) {
                userInvitedGroups[i] = userInvitedGroups[userInvitedGroups.length - 1];
                userInvitedGroups.pop();
                break;
            }
        }

        // Eliminar la clave del usuario
        delete groupUsersKeys[groupId][msg.sender];
    }

    /**
     * @notice Expulsa a un usuario de un grupo.
     * @dev Solo puede ser ejecutado por el administrador del grupo.
     * @param userNameHashed Hash del nombre del usuario a eliminar.
     */
    function deleteUserFromGroup(bytes32 userNameHashed) public {
        uint groupId = walletAdminToGroupId[msg.sender];
        require(groupId != 0, "No eres administrador de ningun grupo");
        uint userId = users.getIdByUserName(userNameHashed);
        require(userId != 0, "Usuario a eliminar no registrado");

        uint[] storage members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == userId) {
                members[i] = members[members.length - 1];
                members.pop();
                address userWallet = users.getUserById(userId).wallet;
                delete walletToGroupId[userWallet];
                break;
            }
        }
        if (groups[groupId].admin == userId) {
            groups[groupId].admin = members.length > 0 ? members[0] : 0;
        }
        
    }

    /**
     * @notice Permite al usuario abandonar su grupo actual.
     * @dev Se utiliza principalmente como limpieza cuando un usuario decide borrar su cuenta.
     */
    function deleteSelfUserFromGroup_WhenDeletingUser() public {
        uint userId = users.getIdByWallet(msg.sender);
        uint groupId =  walletToGroupId[msg.sender];
        require(userId != 0, "Usuario a eliminar no registrado");

        uint[] storage members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == userId) {
                members[i] = members[members.length - 1];
                members.pop();
                delete walletToGroupId[users.getUserById(userId).wallet];
                break;
            }
        }
        if (groups[groupId].admin == userId) {
            groups[groupId].admin = members.length > 0 ? members[0] : 0;
        }
        
    }

    /**
     * @notice Disuelve completamente un grupo.
     * @dev Elimina todas las referencias de los miembros y el administrador.
     */
    function deleteGroup() public {
        uint groupId = walletAdminToGroupId[msg.sender];
        require(groupId != 0, "No eres administrador de ningun grupo");

        for (uint i = 0; i < groups[groupId].members.length; i++) {
            uint userId = groups[groupId].members[i];
            address userWallet = users.getUserById(userId).wallet;
            delete walletToGroupId[userWallet];
        }
        delete groupNameToId[groups[groupId].groupName];
        delete walletAdminToGroupId[msg.sender];
        delete groups[groupId];
    }
    
    function storeMemberEncryptedName(string memory encryptedName) public {
        uint groupId = walletToGroupId[msg.sender];
        require(groupId != 0, "No eres miembro de ningun grupo");
        uint uid = users.getIdByWallet(msg.sender);
        memberEncryptedNames[groupId][uid] = encryptedName;
    }

    /**
     * @notice Distribuye o actualiza la llave del grupo para un miembro específico.
     * @param groupId ID del grupo.
     * @param member Dirección de la wallet del miembro.
     * @param encryptedKey Llave cifrada con la clave pública del miembro.
     */
    function setMemberGroupKey(uint groupId, address member, string memory encryptedKey) public {
        require(msg.sender == users.getUserById(groups[groupId].admin).wallet, "Solo el admin del grupo puede distribuir llaves");
        groupUsersKeys[groupId][member] = encryptedKey;
    }

    /**
     * @notice Obtiene la lista de miembros del grupo al que pertenece el remitente.
     * @return uint[] Array de IDs de usuario.
     */
    function getGroupMembers() public view returns (uint[] memory) {
        uint groupId = walletToGroupId[msg.sender];
        return groups[groupId].members;
    }

    /**
     * @notice Consulta la información de un grupo por su ID.
     * @param groupId Identificador numérico del grupo.
     * @return Group Estructura completa del grupo.
     */
    function getGroupById(uint groupId) public view returns (Group memory) {
        return groups[groupId];
    }

    /**
     * @notice Busca el ID de un grupo por su nombre.
     * @param groupName Nombre del grupo.
     * @return uint El ID del grupo (0 si no existe).
     */
    function getIdByGroupName(string memory groupName) public view returns (uint) {
        return groupNameToId[groupName];
    }

    /**
     * @notice Busca el ID del grupo administrado por una wallet específica.
     * @param adminWallet Dirección del administrador.
     * @return uint ID del grupo.
     */
    function getGroupIdByAdminWallet(address adminWallet) public view returns (uint) {
        return walletAdminToGroupId[adminWallet];
    }

    /**
     * @notice Obtiene el ID del grupo al que pertenece un usuario.
     * @param userWallet Dirección del usuario.
     * @return uint ID del grupo.
     */
    function getGroupIdByUserWallet(address userWallet) public view returns (uint) {
        return walletToGroupId[userWallet];
    }
    
    /**
     * @notice Obtiene las invitaciones pendientes para un usuario.
     * @param userId UID del usuario.
     * @return uint[] Array de IDs de grupos que han invitado al usuario.
     */
    function getInvitedGroupIdsByUserId(uint userId) public view returns (uint[] memory) {
        return userIdToInvitedGroupIds[userId];
    }

}
