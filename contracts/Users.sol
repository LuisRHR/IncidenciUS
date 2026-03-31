// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Users {
    enum userCondition {COMUN, ADMINISTRADOR};
    struct User {
        uint uid;
        string userName;
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
        
        users[uid] = User(uid, userName, msg.sender, userCondition.COMUN, false);
        walletToUid[msg.sender] = uid;
        userNameToUid[userName] = uid;
        emailToUid[email] = uid;
    }
    
    constructor() {
        
    }
}