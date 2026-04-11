// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Users {
    enum userCondition {COMUN, ADMINISTRADOR_SISTEMA}
    struct User {
        uint uid;
        string userName;
        string email;
        address wallet;
        userCondition condition;
        bool isBanned;
    }

    uint public userCount;

    mapping(uint => User) public users;
    mapping(address => uint) public walletToUid;
    mapping(string => uint) public userNameToUid;
    mapping(string => uint) public emailToUid;

    function registerUser(string memory userName, string memory email) public {
        //Restricción para evitar usuarios ya registrados
        require(walletToUid[msg.sender] == 0, "Usuario ya registrado con esta wallet");
        require(userNameToUid[userName] == 0, "Usuario ya registrado con este nombre");
        require(emailToUid[email] == 0, "Usuario ya registrado con este correo");
        
        //Creamos el nuevo usuario
        userCount++;
        uint uid = userCount;
        
        users[uid] = User(uid, userName, email, msg.sender, userCondition.COMUN, false);
        walletToUid[msg.sender] = uid;
        userNameToUid[userName] = uid;
        emailToUid[email] = uid;
    }

    function login() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    function giveUserInfo() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    function giveUserAdminStatus() public {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        users[uid].condition = userCondition.ADMINISTRADOR_SISTEMA;
    }

    function deleteUser() public {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        
        // Eliminamos el usuario de los mappings
        delete walletToUid[msg.sender];
        delete userNameToUid[users[uid].userName];
        delete emailToUid[users[uid].email];
        // Eliminamos el usuario del mapping principal
        delete users[uid];
    }

    function blockUser(string memory userName) public {
        uint uid = walletToUid[msg.sender];
        require(users[uid].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para bloquear usuarios");
        uint uidToBlock = userNameToUid[userName];
        require(uidToBlock != 0, "Usuario a bloquear no registrado");

        // No queremos eliminar al usuario, si no bloquearlo, para evitar que pueda volver a registrar esa wallet, de manera que quedará permanentemente bloqueado
        users[uidToBlock].isBanned = true;
    }

    function getUserById(uint uid) public view returns (User memory) {
        return users[uid];
    }

    function getIdByWallet(address wallet) public view returns (uint) {
        uint uid = walletToUid[wallet];
        return uid;
    }
    function getIdByUserName(string memory userName) public view returns (uint) {
        uint uid = userNameToUid[userName];
        return uid;
    }

     function getIdByEmail(string memory email) public view returns (uint) {
        uint uid = emailToUid[email];
        return uid;
    }
    
    constructor() {
        
    }
}