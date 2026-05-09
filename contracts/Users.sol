// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Users {
    enum userCondition {COMUN, ADMINISTRADOR_SISTEMA}
    struct User {
        uint uid;
        bytes32 userNameHash;
        bytes32 emailHash;
        address wallet;
        userCondition condition;
        bool isBanned;
        // CID de IPFS
        string userInfoCID;
    }

    uint public userCount=1;

    mapping(uint => User) public users;
    mapping(address => uint) public walletToUid;
    mapping(bytes32 => uint) public userNameToUid;
    mapping(bytes32 => uint) public emailToUid;

    function registerUser(bytes32 userNameHashed, bytes32 emailHashed, string memory userInfoCID) public {
        //Restricción para evitar usuarios ya registrados
        require(walletToUid[msg.sender] == 0, "Usuario ya registrado con esta wallet");
        require(userNameToUid[userNameHashed] == 0, "Usuario ya registrado con este nombre");
        require(emailToUid[emailHashed] == 0, "Usuario ya registrado con este correo");
        
        //Creamos el nuevo usuario
        uint uid = userCount;
        
        users[uid] = User(uid, userNameHashed, emailHashed, msg.sender, userCondition.COMUN, false, userInfoCID);
        walletToUid[msg.sender] = uid;
        userNameToUid[userNameHashed] = uid;
        emailToUid[emailHashed] = uid;

        userCount++;
    }

    function login() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        require(!users[uid].isBanned, "Usuario bloqueado");
        return users[uid];
    }

    function giveUserInfo() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    function giveUserAdminStatus(address userAddress) public {
        uint uid = walletToUid[userAddress];
        require(uid != 0, "Usuario no registrado");
        require(users[uid].condition!=userCondition.ADMINISTRADOR_SISTEMA, "El usuario ya es admin");
        users[uid].condition = userCondition.ADMINISTRADOR_SISTEMA;
    }

    function deleteUser() public {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        
        // Eliminamos el usuario de los mappings
        delete walletToUid[msg.sender];
        delete userNameToUid[users[uid].userNameHash];
        delete emailToUid[users[uid].emailHash];
        // Eliminamos el usuario del mapping principal
        delete users[uid];
    }

    function blockUser(bytes32 userNameHashed) public {
        uint uid = walletToUid[msg.sender];
        require(users[uid].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para bloquear usuarios");
        uint uidToBlock = userNameToUid[userNameHashed];
        require(uidToBlock != 0, "Usuario a bloquear no registrado");

        // No queremos eliminar al usuario, si no bloquearlo, para evitar que pueda volver a registrar esa wallet, de manera que quedará permanentemente bloqueado
        users[uidToBlock].isBanned = true;
    }

    function getActualUser() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    function getUserById(uint uid) public view returns (User memory) {
        return users[uid];
    }

    function getIdByWallet(address wallet) public view returns (uint) {
        uint uid = walletToUid[wallet];
        return uid;
    }
    function getIdByUserName(bytes32 userNameHashed) public view returns (uint) {
        uint uid = userNameToUid[userNameHashed];
        return uid;
    }

     function getIdByEmail(bytes32 emailHashed) public view returns (uint) {
        uint uid = emailToUid[emailHashed];
        return uid;
    }
    
    constructor() {
        
    }
}
