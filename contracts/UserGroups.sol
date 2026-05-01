// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Users.sol";

contract Groups {
    struct Group {
        string groupName;
        string description;
        // Posteriormente ponemos como vamos a relacionar los grupos con los usuarios, en esta relación se pueden ver arrays de ids de usuarios y el id del administrador para relacionarlo con el grupo
        uint[] members;
        uint[] invitedUsers;
        uint admin;
    }

    uint public groupCount;
    Users public users;

    // Creamos los grupos e instanciamos el contrato de usuarios para poder relacionar grupos y usuarios
    constructor(address usersAddress) {
        users = Users(usersAddress);
    }

    mapping (uint => Group) public groups;
    mapping (string => uint) public groupNameToId;
    mapping (address => uint) public walletAdminToGroupId;
    mapping (address => uint) public walletToGroupId;
    mapping (uint => uint[]) public userIdToInvitedGroupIds;

    function createGroup(string memory groupName, string memory description) public {
        require(groupNameToId[groupName] == 0, "Grupo ya existe con este nombre"); 

        // Creamos un nuevo grupo tras la verificación anterior
        groupCount++;
        uint groupId = groupCount;
        uint adminId = users.getIdByWallet(msg.sender);
        // El usuario debería de haber iniciado sesión, pero se realiza esta verificación para asegurarnos de que el creador del grupo es un usuario registrado
        require(adminId != 0, "El creador del grupo no es un usuario registrado");

        // Realizamos la creación del grupo, así como la adición del creador al grupo y la completición de los mappings necesarios
        groups[groupId] = Group(groupName, description, new uint[](0), new uint[](0), adminId);
        groups[groupId].members.push(adminId);
        groups[groupId].admin = adminId;
        groupNameToId[groupName] = groupId;
        walletAdminToGroupId[msg.sender] = groupId;
        walletToGroupId[msg.sender] = groupId;
    }

    function inviteUserToGroup(string memory userNameHashed) public {
        require(walletAdminToGroupId[msg.sender] != 0, "No eres administrador de ningun grupo"); // Verificamos que el remitente es administrador de un grupo

        uint groupId = walletAdminToGroupId[msg.sender];
        uint userId = users.getIdByUserName(userNameHashed);
        require(userId != 0, "Usuario a invitar no registrado"); // Verificamos que el usuario a invitar está registrado
        require(!isMember(groupId, userId), "Usuario ya es miembro del grupo"); // Verificamos que el usuario no es ya miembro del grupo
        require(!isInvited(groupId, userId), "Usuario ya ha sido invitado al grupo"); // Verificamos que el usuario no ha sido ya invitado al grupo

        groups[groupId].invitedUsers.push(userId); // Añadimos al usuario a la lista de invitados del grupo
        userIdToInvitedGroupIds[userId].push(groupId); // Añadimos el grupo a la lista de grupos a los que el usuario ha sido invitado
    }

    // Funciones auxiliares para chequeo de membresía e invitación
    function isMember(uint groupId, uint userId) internal view returns (bool) {
        uint[] memory members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == userId) {
                return true;
            }
        }
        return false;
    }

    function isInvited(uint groupId, uint userId) internal view returns (bool) {
        uint[] memory invitedUsers = groups[groupId].invitedUsers;
        for (uint i = 0; i < invitedUsers.length; i++) {
            if (invitedUsers[i] == userId) {
                return true;
            }
        }
        return false;
    }

    function userJoined( string memory groupName) public {
        // Realizamos las verificaciones para asegurarnos de que un usuario ha sido invitado y no sea miembro de otro grupo
        require(walletToGroupId[msg.sender] == 0, "Ya eres miembro de un grupo");
        uint groupId = groupNameToId[groupName];
        uint userId = users.getIdByWallet(msg.sender);
        require(isInvited(groupId, userId), "No has sido invitado a este grupo"); 

        // Añadimos al usuario como miembro del grupo
        groups[groupId].members.push(userId);
        walletToGroupId[msg.sender] = groupId;
        // Ahora nos aseguramos que el usuario se elimina de la lista de invitados de TODOS LOS GRUPOS a los que haya podido ser invitado:
        for (uint i = 0; i < userIdToInvitedGroupIds[userId].length; i++) {
            uint groupIds = userIdToInvitedGroupIds[userId][i];
            uint[] storage groupInvitedUsers = groups[groupIds].invitedUsers;
            for (uint j = 0; j < groupInvitedUsers.length; j++) {
                if (groupInvitedUsers[j] == userId) {
                    groupInvitedUsers[j] = groupInvitedUsers[groupInvitedUsers.length - 1];
                    groupInvitedUsers.pop();
                    break;
                }
            }
        }
    }


    function deleteUserFromGroup(string memory userNameHashed) public {
        uint groupId = walletAdminToGroupId[msg.sender];
        require(groupId != 0, "No eres administrador de ningun grupo");
        uint userId = users.getIdByUserName(userNameHashed);
        require(userId != 0, "Usuario a eliminar no registrado");

        uint[] storage members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == userId) {
                members[i] = members[members.length - 1];
                members.pop();
                // Extraemos la wallet del usuario eliminado 
                address userWallet = users.getUserById(userId).wallet;
                // Eliminamos el grupo del mapping walletToGroupId del usuario eliminado
                delete walletToGroupId[userWallet];
                break;
            }
        }
        // Si el usuario eliminado es el administrador, se asigna al primero del array como nuevo administrador
        if (groups[groupId].admin == userId) {
            groups[groupId].admin = members.length > 0 ? members[0] : 0; // Si no hay miembros, el grupo queda sin administrador
        }
        
    }

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
        // Si el usuario eliminado es el administrador, se asigna al primero del array como nuevo administrador
        if (groups[groupId].admin == userId) {
            groups[groupId].admin = members.length > 0 ? members[0] : 0; // Si no hay miembros, el grupo queda sin administrador
        }
        
    }

    function deleteGroup() public {
        uint groupId = walletAdminToGroupId[msg.sender];
        require(groupId != 0, "No eres administrador de ningun grupo");

        // En los siguientes pasos borramos de los grupos toda la relación de wallet a grupo Id asi como con el administrador, nombre de grupo y posteriormente el grupo en sí
        for (uint i = 0; i < groups[groupId].members.length; i++) {
            uint userId = groups[groupId].members[i];
            address userWallet = users.getUserById(userId).wallet;
            delete walletToGroupId[userWallet];
        }
        delete groupNameToId[groups[groupId].groupName];
        delete walletAdminToGroupId[msg.sender];
        delete groups[groupId];
    }

    function getGroupMembers() public view returns (uint[] memory) {
        uint groupId = walletToGroupId[msg.sender];
        return groups[groupId].members;
    }

    function getGroupById(uint groupId) public view returns (Group memory) {
        return groups[groupId];
    }

    function getIdByGroupName(string memory groupName) public view returns (uint) {
        return groupNameToId[groupName];
    }

    function getGroupIdByAdminWallet(address adminWallet) public view returns (uint) {
        return walletAdminToGroupId[adminWallet];
    }

    function getGroupIdByUserWallet(address userWallet) public view returns (uint) {
        return walletToGroupId[userWallet];
    }
    
    function getInvitedGroupIdsByUserId(uint userId) public view returns (uint[] memory) {
        return userIdToInvitedGroupIds[userId];
    }

}
