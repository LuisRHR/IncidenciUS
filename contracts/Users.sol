// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Users
 * @notice Este contrato gestiona el registro, autenticación y roles de los usuarios en IncidenciUS.
 * @dev Almacena hashes de datos sensibles y utiliza CIDs de IPFS para información extendida.
 */
contract Users {
    /// @notice Enumerado que define el rol del usuario en el sistema.
    enum userCondition {COMUN, ADMINISTRADOR_SISTEMA}

    /**
     * @notice Estructura que representa a un usuario.
     * @param uid Identificador único incremental.
     * @param userNameHash Hash del nombre de usuario.
     * @param emailHash Hash del correo electrónico.
     * @param wallet Dirección de la billetera Ethereum asociada.
     * @param condition Rol actual del usuario (Común o Administrador).
     * @param isBanned Estado de bloqueo del usuario.
     * @param userInfoCID Puntero IPFS a los datos del perfil.
     * @param publicKey Clave pública utilizada para el cifrado de datos extremo a extremo.
     */
    struct User {
        uint uid;
        bytes32 userNameHash;
        bytes32 emailHash;
        address wallet;
        userCondition condition;
        bool isBanned;
        string userInfoCID;
        string publicKey;
    }

    /// @notice Contador para asignar IDs únicos a nuevos usuarios.
    uint public userCount=1;

    mapping(uint => User) public users;
    mapping(address => uint) public walletToUid;
    mapping(bytes32 => uint) public userNameToUid;
    mapping(bytes32 => uint) public emailToUid;

    /**
     * @notice Registra un nuevo usuario en la plataforma.
     * @dev Verifica que la wallet, el nombre y el email no existan previamente.
     * @dev El primer usuario registrado se asigna automáticamente como Administrador de Sistema.
     * @param userNameHashed Hash keccak256 del nombre de usuario.
     * @param emailHashed Hash keccak256 del correo electrónico.
     * @param userInfoCID CID de IPFS con la información cifrada/pública del perfil.
     * @param publicKey Clave pública para permitir que otros usuarios cifren datos para este usuario.
     */
    function registerUser(bytes32 userNameHashed, bytes32 emailHashed, string memory userInfoCID, string memory publicKey) public {
        require(walletToUid[msg.sender] == 0, "Usuario ya registrado con esta wallet");
        require(userNameToUid[userNameHashed] == 0, "Usuario ya registrado con este nombre");
        require(emailToUid[emailHashed] == 0, "Usuario ya registrado con este correo");
        
        uint uid = userCount;
        if (userCount == 1) {
            users[uid] = User(uid, userNameHashed, emailHashed, msg.sender, userCondition.ADMINISTRADOR_SISTEMA, false, userInfoCID, publicKey);
        } else {   
            users[uid] = User(uid, userNameHashed, emailHashed, msg.sender, userCondition.COMUN, false, userInfoCID, publicKey);
 
        }
        walletToUid[msg.sender] = uid;
        userNameToUid[userNameHashed] = uid;
        emailToUid[emailHashed] = uid;

        userCount++;
    }

    /**
     * @notice Valida el acceso del usuario actual.
     * @dev Requiere que el usuario esté registrado y no esté baneado.
     * @return User La estructura completa del usuario que llama a la función.
     */
    function login() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        require(!users[uid].isBanned, "Usuario bloqueado");
        return users[uid];
    }

    /**
     * @notice Obtiene la información del usuario que está interactuando con el contrato.
     * @return User Estructura con la información del remitente.
     */
    function giveUserInfo() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    /**
     * @notice Asciende a un usuario al rol de Administrador de Sistema.
     * @dev Solo puede ser llamado por un administrador (aunque faltaría un modificador de acceso aquí para mayor seguridad).
     * @param userAddress La dirección de la wallet del usuario a ascender.
     */
    function giveUserAdminStatus(address userAddress) public {
        uint uid = walletToUid[userAddress];
        require(uid != 0, "Usuario no registrado");
        uint callerUid = walletToUid[msg.sender];
        // Añadido actualmente tras crear otro sistema de dar admin.
        require(users[callerUid].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para ascender usuarios");
        require(users[uid].condition!=userCondition.ADMINISTRADOR_SISTEMA, "El usuario ya es admin");
        users[uid].condition = userCondition.ADMINISTRADOR_SISTEMA;
    }

    /**
     * @notice Elimina un usuario del sistema.
     * @dev Elimina todas las referencias al usuario en los mappings y borra su información.
     * Requiere que el usuario esté registrado para poder eliminarlo.
     */
    function deleteUser() public {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        delete walletToUid[msg.sender];
        delete userNameToUid[users[uid].userNameHash];
        delete emailToUid[users[uid].emailHash];
        delete users[uid];
    }

    /**
     * @notice Bloquea permanentemente a un usuario del sistema.
     * @dev Solo un Administrador de Sistema puede ejecutar esta acción.
     * El bloqueo se basa en el nombre de usuario (hash).
     * @param userNameHashed Hash del nombre del usuario a bloquear.
     */
    function blockUser(bytes32 userNameHashed) public {
        uint uid = walletToUid[msg.sender];
        require(users[uid].condition == userCondition.ADMINISTRADOR_SISTEMA, "No tienes permisos para bloquear usuarios");
        uint uidToBlock = userNameToUid[userNameHashed];
        require(uidToBlock != 0, "Usuario a bloquear no registrado");
        users[uidToBlock].isBanned = true;
    }

    /**
     * @notice Obtiene los datos del usuario que está interactuando con el contrato.
     * @return User Estructura con la información del remitente.
     */
    function getActualUser() public view returns (User memory) {
        uint uid = walletToUid[msg.sender];
        require(uid != 0, "Usuario no registrado");
        return users[uid];
    }

    /**
     * @notice Consulta la información de un usuario mediante su ID.
     * @param uid Identificador numérico del usuario.
     * @return User Estructura con la información del usuario solicitado.
     */
    function getUserById(uint uid) public view returns (User memory) {
        return users[uid];
    }

    /**
     * @notice Busca el UID asociado a una dirección de wallet.
     * @param wallet Dirección a consultar.
     * @return uint El ID del usuario (0 si no existe).
     */
    function getIdByWallet(address wallet) public view returns (uint) {
        return walletToUid[wallet];
    }

    /**
     * @notice Busca el UID asociado a un nombre de usuario.
     * @param userNameHashed Hash del nombre de usuario.
     * @return uint El ID del usuario (0 si no existe).
     */
    function getIdByUserName(bytes32 userNameHashed) public view returns (uint) {
        return userNameToUid[userNameHashed];
    }

    /**
     * @notice Busca el UID asociado a un correo electrónico.
     * @param emailHashed Hash del email.
     * @return uint El ID del usuario (0 si no existe).
     */
    function getIdByEmail(bytes32 emailHashed) public view returns (uint) {
        return emailToUid[emailHashed];
    }

    /** @notice Constructor del contrato.
     * @dev No realiza ninguna acción específica en la inicialización.
     */
    constructor() {}
}
