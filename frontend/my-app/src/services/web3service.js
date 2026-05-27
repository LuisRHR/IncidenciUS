import { ethers } from 'ethers';
import EthCrypto from 'eth-crypto';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

/**
 * ABI simplificados de los contratos inteligentes para interacción desde el frontend.
 * Solo se incluyen las funciones necesarias para las operaciones del frontend.
 * Cualquier cambio en los contratos inteligentes debe reflejarse aquí para mantener la compatibilidad.
 */
const USERS_ABI = [
    "function registerUser( bytes32 userNameHashed,  bytes32 emailHashed, string memory userInfoCID, string memory publicKey) public",
    "function login() public view returns (tuple(uint uid, bytes32 userNameHash,  bytes32 emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID))",
    "function deleteUser() public",
    "function giveUserAdminStatus(address userAddress) public",    
    "function blockUser(bytes32 userNameHashed) public",
    "function getActualUser() public view returns (tuple(uint uid, bytes32 userNameHash, bytes32 emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID, string publicKey))",
    "function getIdByWallet(address wallet) public view returns (uint)",
    "function getIdByUserName(bytes32 userNameHashed) public view returns (uint)",
    "function getIdByEmail(bytes32 emailHashed) public view returns (uint)",
    "function userCount() public view returns (uint)",
    "function getUserById(uint uid) public view returns (tuple(uint uid, bytes32 userNameHash, bytes32 emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID, string publicKey))"
];

const GROUPS_ABI = [
    "function createGroup(string memory groupName, string memory description, string memory encryptedAdminKey) public",
    "function inviteUserToGroup(bytes32 userNameHashed, string memory encryptedKeyForUser) public",
    "function userJoined(string memory groupName) public",
    "function deleteUserFromGroup(bytes32 userNameHashed) public",
    "function deleteSelfUserFromGroup_WhenDeletingUser() public",
    "function deleteGroup() public",
    "function getGroupMembers(uint groupId) public view returns (uint[] memory)",
    "function getGroupById(uint groupId) public view returns (tuple(string groupName, string description, uint[] members, uint[] invitedUsers, uint admin))",
    "function getIdByGroupName(string memory groupName) public view returns (uint)",
    "function getGroupIdByAdminWallet(address adminWallet) public view returns (uint)",
    "function getGroupIdByUserWallet(address userWallet) public view returns (uint)",
    "function groupUsersKeys(uint groupId, address userWallet) public view returns (string)"
];

const REPORTS_ABI = [
    "function createBugReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 titleHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public",
    "function createUserReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 userNameHashed, bytes32 emailHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public",
    "function viewSortedBugReports() public view returns (tuple(uint id, bytes32 senderHash, bytes32 descriptionHash, bytes32 hashProofs, bytes32 titleHash, string userReportCID)[])",
    "function viewSortedUserReports() public view returns (tuple(uint id, bytes32 senderHash, bytes32 descriptionHash, bytes32 hashProofs, bytes32 userNameHash, bytes32 emailHash, string userReportCID)[])",
    "function bugReportKeys(uint reportId, address adminWallet) public view returns (string)",
    "function userReportKeys(uint reportId, address adminWallet) public view returns (string)",
    "function removeBugReport(uint requestId) public",
    "function removeUserReport(uint requestId) public"
];

const INCIDENCES_ABI = [
    "function registerIncidence(bytes32 titleHash, bytes32 descriptionHash, string memory date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, string memory groupReceiver, bytes32 groupReceiverHash, string memory privateDataCID, string memory encryptedAESKey) public",
    "function userViewIndividualIncidences() public view returns (tuple(uint id, bytes32 titleHash, bytes32 descriptionHash, string date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, bytes32 groupReceiverHash, string privateDataCID, string encryptedAESKey)[])",
    "function userViewGroupIncidences() public view returns (tuple(uint id, bytes32 titleHash, bytes32 descriptionHash, string date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, bytes32 groupReceiverHash, string privateDataCID, string encryptedAESKey)[])"
];

const ADMIN_REQUESTS_ABI = [
    "function createAdminRequest(address userWallet, string memory requestReason) public",
    "function viewRequests() public view returns (tuple(uint id, address userWallet, string requestReason)[])",
    "function removeRequest(uint requestId) public"
];

/**
 * Variables de entorno para configuración de IPFS y Pinata.
 * Actualmente se encuentran en un archivo .env en la raíz del proyecto por privacidad,
 * pero en un futuro puede que vayan diretamente aquí utilizando otra cuenta de Pinata
 * que no sea la mía personal, para evitar exponer tokens de acceso en el frontend.
 */
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY;
const IPFS_UPLOAD_URL = process.env.REACT_APP_IPFS_UPLOAD_URL;
const IPFS_FILE_UPLOAD_URL = process.env.REACT_APP_IPFS_FILE_UPLOAD_URL;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

/**
 * Obtiene la clave privada determinista almacenada en la sesión volátil.
 * @returns {string|null} Clave privada en formato hexadecimal (seed criptográfica) o null.
 */
 const getSessionKey = () => sessionStorage.getItem('cached_priv_key');

/**
 * Realiza el cifrado simétrico de un objeto de datos mediante el estándar AES-256.
 * @param {Object} dataObject - Objeto de datos en texto plano.
 * @returns {string|Object} El string cifrado resultante o el objeto original si no hay clave de sesión.
 */
const encryptData = (dataObject) => {
    const key = getSessionKey();
    if (!key) return dataObject;
    return CryptoJS.AES.encrypt(JSON.stringify(dataObject), key).toString();
};

/**
 * Descifra una cadena cifrada con AES utilizando la clave de sesión.
 * @param {string} encryptedString - La cadena de texto cifrada.
 * @returns {Object} El objeto de datos descifrado o un objeto de error si falla.
 */
const decryptData = (encryptedString) => {
    const key = getSessionKey();
    if (!key) return { error: "Sesión no iniciada para descifrado simetrico" };
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedString, key);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedStr);
    } catch (e) {
        return { error: "Error al descifrar o clave inválida" };
    }
};

/**
 * Instancia un contrato de ethers.js basado en el tipo solicitado.
 * @param {('USERS'|'GROUPS'|'REPORTS'|'INCIDENCES'|'ADMIN_REQUESTS')} contractType - El identificador del contrato.
 * @param {boolean} [withSigner=false] - Define si el contrato debe estar conectado a un firmante (para transacciones).
 * @throws {Error} Si MetaMask no está detectado o la dirección no está configurada.
 * @returns {Promise<ethers.Contract>} Una instancia del contrato de Ethers.
 */
const getContract = async (contractType, withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask no detectado");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress = process.env[`REACT_APP_${contractType}_CONTRACT`];    
    if (!contractAddress) throw new Error(`Dirección ${contractType} no configurada.`);
    
    let abi;
    switch(contractType) {
        case 'USERS': abi = USERS_ABI; break;
        case 'GROUPS': abi = GROUPS_ABI; break;
        case 'REPORTS': abi = REPORTS_ABI; break;
        case 'INCIDENCES': abi = INCIDENCES_ABI; break;
        case 'ADMIN_REQUESTS': abi = ADMIN_REQUESTS_ABI; break;
        default: throw new Error(`Tipo desconocido: ${contractType}`);
    }
    
    if (withSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(contractAddress, abi, signer);
    }
    return new ethers.Contract(contractAddress, abi, provider);
};

/**
 * Sube datos JSON a IPFS a través de Pinata o simula la subida en local.
 * Tras el commit de comentarios voy a eliminar la simulación local y dejar solo la subida real a IPFS, pero por ahora lo dejo.
 * @param {Object} data - Los datos a subir.
 * @param {string|null} [pinataJwt=null] - El token JWT de Pinata.
 * @throws {Error} Si la subida falla.
 * @returns {Promise<string>} El CID (Hash) de IPFS de los datos subidos.
 */
const uploadToIPFS = async (data, pinataJwt = null) => {
    try {
        const payload = data;

        if (!pinataJwt) {
            const mockCID = "QmSimulated" + Math.random().toString(36).substring(2, 15);
            const mockStorage = JSON.parse(localStorage.getItem('mockIPFSStorage') || '{}');
            mockStorage[mockCID] = payload;
            localStorage.setItem('mockIPFSStorage', JSON.stringify(mockStorage));
            return mockCID;
        }

        const response = await fetch(IPFS_UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${pinataJwt}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinataContent: payload })
        });

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("Error IPFS:", error);
        throw error;
    }
};

/**
 * Sube múltiples archivos a IPFS.
 * Para las imagenes de los reports.
 * @param {FileList|File[]} files - Lista de archivos a subir.
 * @returns {Promise<string[]>} Array de CIDs (hashes) de los archivos subidos.
 */
const uploadFilesToIPFS = async (files) => {
    if (!files || files.length === 0) return [];
    if (!process.env.REACT_APP_PINATA_JWT) {
        return Array.from(files).map(f => "QmMockFile" + Math.random().toString(36));
    }

    const uploadedCIDs = [];
    const filesArray = Array.from(files);

    for (const file of filesArray) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(IPFS_FILE_UPLOAD_URL, {
                method: 'POST',
                headers: { 
                    // IMPORTANTE: Solo Authorization. 
                    'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}` 
                },
                body: formData
            });

            if (!res.ok) {
                const errorDetail = await res.json();
                console.error("Error en la respuesta de Pinata:", errorDetail);
                throw new Error(`Pinata error: ${res.statusText}`);
            }

            const json = await res.json();
            uploadedCIDs.push(json.IpfsHash);

        } catch (error) {
            console.error("Error subiendo archivo individual:", error);
            throw error;
        }
    }
    
    return uploadedCIDs;
};  

/**
 * Recupera datos de IPFS dado un CID.
 * @param {string} cid - El CID de IPFS.
 * @returns {Promise<Object|null>} Los datos recuperados o null si ocurre un error.
 */
const fetchFromIPFS = async (cid) => {
    try {
        if (!cid || cid === "N/A" || cid === "") return { error: "No CID" };
        let data;
        if (cid.startsWith("QmSimulated")) {
            const mockStorage = JSON.parse(localStorage.getItem('mockIPFSStorage') || '{}');
            data = mockStorage[cid];
        } else {
            const gatewayUrl = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
            const response = await fetch(`${gatewayUrl}${cid}`);
            data = await response.json();
        }
        return (data && data.pinataContent !== undefined) ? data.pinataContent : data;
    } catch (error) {
        return null;
    }
};

/**
 * Obtiene la clave privada de la caché o de la sesión.
 * @returns {string|null} La clave privada.
 */
const getPrivateKey = () => {
    if (!cachedPrivateKey) {
        cachedPrivateKey = sessionStorage.getItem('cached_priv_key');
    }
    return cachedPrivateKey;
};

/**
 * Genera un hash keccak256 de un valor dado.
 * @param {string} value - El valor a hashear.
 * @returns {string} El hash resultante.
 */
const hashValue = (value) => ethers.id(value);

/** @type {string|null} Clave privada persistida en memoria durante la ejecución */
let cachedPrivateKey = null;

/**
 * Servicio principal para interactuar con la Web3, Contratos Inteligentes e IPFS.
 */
export const Web3Service = {

    /**
     * Establece la sesión criptográfica mediante la firma digital de un mensaje.
     * Deriva una clave privada determinista a partir de la firma y genera el par de claves secp256k1
     * necesario para el cifrado asimétrico ECIES.
     * @returns {Promise<boolean>} True si la sesión se inició con éxito.
     */
    initSession: async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = "Acceso a claves de seguridad para IncidenciUS";
            const signature = await signer.signMessage(message);
            
            const hashedMsg = ethers.hashMessage(message);
            const privKey = ethers.keccak256(ethers.solidityPacked(['bytes32', 'bytes'], [hashedMsg, signature]));
            
            cachedPrivateKey = privKey;
            sessionStorage.setItem('cached_priv_key', privKey);

            // Derivación de clave pública para el registro.
            // Permite que otros usuarios cifren datos para este usuario.
            const publicKey = EthCrypto.publicKeyByPrivateKey(privKey.replace('0x', ''));
            sessionStorage.setItem('user_pub_key', publicKey);

            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Realiza el login del usuario consultando el contrato inteligente.
     * Recupera y descifra los datos del perfil desde IPFS.
     * @returns {Promise<Object>} Objeto con el estado del login y datos del usuario.
     */
    login: async () => {
        try {
            const contract = await getContract('USERS', true);  
            const userBC = await contract.login();
            const cid = userBC.userInfoCID;
            let ipfsData = { userName: "Usuario Desconocido", email: "" }; 
            if (cid && cid !== "N/A" && cid !== "") {
                const raw = await fetchFromIPFS(cid);
                if (raw) {
                    const data = typeof raw === 'string' ? decryptData(raw) : raw;
                    if (!data.error) ipfsData = data;
                }
            }
            return {
                exists: true,
                uid: Number(userBC.uid),
                wallet: userBC.wallet,
                isBanned: userBC.isBanned,
                role: userBC.condition === 1n ? 'Admin de Sistema' : 'Comun',
                condition: Number(userBC.condition),
                cid: cid,
                userName: ipfsData.userName.trim(),
                email: ipfsData.email.trim()
            };
        } catch (e) {
            console.error("Error en login:", e);
            return { exists: false };
        }
    },

    /**
     * Registra un nuevo usuario en la plataforma.
     * Persiste los datos sensibles en IPFS (cifrados) y vincula el CID y la clave pública en la blockchain.
     * @param {string} userName - Nombre de usuario (texto plano).
     * @param {string} email - Correo electrónico (texto plano).
     * @param {string} publicKey - Clave pública generada en initSession.
     * @returns {Promise<Object>} Resultado de la transacción y CID del perfil.
     */
    register: async (userName, email, publicKey) => {
        try {
            const contract = await getContract('USERS', true);
            const cleanName = userName.trim();
            const cleanEmail = email.trim();
            
            const cid = await uploadToIPFS(encryptData({ userName: cleanName, email: cleanEmail }), PINATA_JWT);
            
            const tx = await contract.registerUser(
                hashValue(cleanName), 
                hashValue(cleanEmail), 
                cid, 
                publicKey
            );
            
            return { success: true, txHash: (await tx.wait()).hash, cid: cid };
        } catch (error) {
            console.error("Error en registro:", error);
            throw error;
        }
    },

    /**
     * Elimina el perfil del usuario actual de los contratos inteligentes y limpia el almacenamiento local.
     * @throws {Error} Si la transacción de eliminación falla.
     * @returns {Promise<Object>} Éxito de la operación.
     */
    deleteUser: async () => {
        try {
            const contractUsers = await getContract('USERS', true);
            const contractGroups = await getContract('GROUPS', true);
            const wallet = window.ethereum.selectedAddress;
            const groupId = await contractGroups.getGroupIdByUserWallet(wallet);

            console.log("Iniciando proceso de eliminación para el grupo:", groupId.toString());

            if (groupId.toString() !== "0") {
                const txGroup = await contractGroups.deleteSelfUserFromGroup_WhenDeletingUser();
                await txGroup.wait();
                console.log("Usuario eliminado del grupo con éxito.");
            }
            const txUser = await contractUsers.deleteUser();
            await txUser.wait(); 
            console.log("Usuario eliminado del sistema con éxito.");

            localStorage.clear();
            sessionStorage.clear();

            return { success: true };
        } catch (error) {
            console.error("Fallo crítico en la eliminación:", error.reason || error.message);
            throw new Error(`No se pudo eliminar el perfil: ${error.reason || "Error de contrato"}`);
        }
    },

    /**
     * Bloquea a un usuario (función de administrador).
     * @param {string} userNameToBlock - Nombre del usuario a bloquear.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    blockUser: async (userNameToBlock) => {
        try {
            const contract = await getContract('USERS', true);
            const tx = await contract.blockUser(hashValue(userNameToBlock.trim()));
            return await tx.wait();
        } catch (error) {
            console.error("Error al bloquear usuario:", error);
            throw error;
        }
    },

    /**
     * Obtiene los datos del usuario actualmente conectado.
     * @returns {Promise<Object>} Datos del usuario o estado de no existencia.
     */
    getActualUser: async () => {
        try {
            const contract = await getContract('USERS', true);
            const userBC = await contract.getActualUser();
            const cid = userBC.userInfoCID;
            let ipfsData = { userName: "Usuario Desconocido", email: "" };
            if (cid && cid !== "N/A" && cid !== "") {
                const raw = await fetchFromIPFS(cid);
                if (raw) {
                    const data = typeof raw === 'string' ? decryptData(raw) : raw;
                    if (!data.error) ipfsData = data;
                }
            }
            return {
                exists: true,
                uid: Number(userBC.uid),
                wallet: userBC.wallet,
                isBanned: userBC.isBanned,
                role: userBC.condition === 1n ? 'Admin de Sistema' : 'Comun',
                condition: Number(userBC.condition),
                cid: cid,
                userName: ipfsData.userName.trim(), 
                email: ipfsData.email.trim()
            };
        } catch (e) {
            console.error("Error al obtener usuario actual:", e);
            return { exists: false };
        }
    },

    /**
     * Otorga rango de administrador de sistema a una dirección de wallet.
     * @param {string} userAddress - Dirección del usuario.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    giveUserAdminStatus: async (userAddress) => {
        try {
            const contract = await getContract('USERS', true);
            const tx = await contract.giveUserAdminStatus(userAddress);
            return await tx.wait();
        } catch (error) {
            console.error("Error al otorgar estatus de admin:", error);
            throw error;
        }
    },

    /**
     * Crea un nuevo grupo en el sistema.
     * Genera una clave AES aleatoria para el grupo y la cifra con la clave pública del creador.
     * @param {string} groupName - Nombre del grupo.
     * @param {string} [description=""] - Descripción opcional.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    createGroup: async (groupName, description = "") => {
        try {
            const contract = await getContract('GROUPS', true);     
            const groupAESKey = ethers.hexlify(ethers.randomBytes(32));     
            const myPubKey = sessionStorage.getItem('user_pub_key');
            const encryptedAdminKey = await EthCrypto.encryptWithPublicKey(myPubKey, groupAESKey);
            sessionStorage.setItem('current_group_aes', groupAESKey);

            const tx = await contract.createGroup(groupName.trim(), description, JSON.stringify(encryptedAdminKey));
            return await tx.wait();
        } catch (error) {
            console.error("Error al crear grupo:", error);
            throw error;
        }
    },

    /**
     * Invita a un usuario a un grupo existente.
     * Cifra la clave AES del grupo con la clave pública del invitado.
     * @param {string} userNameToInvite - Nombre del usuario a invitar.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    inviteUserToGroup: async (userNameToInvite) => {
        try {
            const groupsContract = await getContract('GROUPS', true);
            const usersContract = await getContract('USERS', false);
            const userId = await usersContract.getIdByUserName(hashValue(userNameToInvite.trim()));
            const userObj = await usersContract.getUserById(userId);
            const userPubKey = userObj.publicKey;
            let groupAESKey = sessionStorage.getItem('current_group_aes');
            if (!groupAESKey) throw new Error("No se encontró la clave AES del grupo en sesión.");

            const encryptedKeyForUser = await EthCrypto.encryptWithPublicKey(userPubKey, groupAESKey);

            const tx = await groupsContract.inviteUserToGroup(hashValue(userNameToInvite.trim()), JSON.stringify(encryptedKeyForUser));
            return await tx.wait();
        } catch (error) {
            console.error("Error al invitar usuario:", error);
            throw error;
        }
    },

    /**
     * Acepta una invitación y se une formalmente al grupo en el contrato.
     * @param {string} groupName - Nombre del grupo.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    joinGroup: async (groupName) => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.userJoined(groupName.trim());
            return await tx.wait();
        } catch (error) {
            console.error("Error al unirse al grupo:", error);
            throw error;
        }
    },

    /**
     * Elimina a un usuario de un grupo.
     * @param {string} userNameToRemove - Nombre del usuario a eliminar.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    removeUserFromGroup: async (userNameToRemove) => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.deleteUserFromGroup(hashValue(userNameToRemove.trim()));
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar usuario del grupo:", error);
            throw error;
        }
    },

    /**
     * Disuelve el grupo actual (solo administradores del grupo).
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    deleteGroup: async () => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.deleteGroup();
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar grupo:", error);
            throw error;
        }
    },

    /**
     * Obtiene los IDs de los miembros de un grupo.
     * @param {number} groupId - ID del grupo.
     * @returns {Promise<number[]>} Lista de UIDs.
     */
    getGroupMembers: async (groupId) => {
        try {
            const contract = await getContract('GROUPS', true);
            return await contract.getGroupMembers(groupId);
        } catch (error) {
            console.error("Error al obtener miembros del grupo:", error);
            throw error;
        }
    },

    /**
     * Obtiene la información completa del grupo al que pertenece el usuario actual.
     * Si la clave AES del grupo no está en sesión, intenta recuperarla y descifrarla.
     * @returns {Promise<Object|null>} Datos del grupo o null.
     */
    getActualGroup: async () => {
        try {
            const contract = await getContract('GROUPS', true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const wallet = signer.address;            
            const groupId = await contract.getGroupIdByUserWallet(wallet);
            if (groupId.toString() === "0") return null;     
            const groupData = await contract.getGroupById(groupId);

            if (!sessionStorage.getItem('current_group_aes')) {
                const privKey = getPrivateKey();
                const encryptedGroupKeyStr = await contract.groupUsersKeys(groupId, wallet);
                if (encryptedGroupKeyStr && privKey) {
                    const groupAESKey = await EthCrypto.decryptWithPrivateKey(privKey, JSON.parse(encryptedGroupKeyStr));
                    sessionStorage.setItem('current_group_aes', groupAESKey);
                }
            }

            return {
                id: Number(groupId),
                name: groupData.groupName,
                description: groupData.description,
                admin: Number(groupData.admin),
                members: Array.from(groupData.members).map(m => Number(m)),
                invitedUsers: Array.from(groupData.invitedUsers).map(u => Number(u)),
            };
        } catch (error) { return null; }
    },

    /**
     * Obtiene información detallada (desde IPFS) de una lista de miembros.
     * @param {number[]} memberIds - Array de UIDs de usuarios.
     * @returns {Promise<Object[]>} Lista de objetos de usuario con nombre, email, etc.
     */
    getMembersInfo: async (memberIds) => {
        try {
            const contract = await getContract('USERS', true);
            const members = [];
            for (const memberId of memberIds) {
                try {
                    const userData = await contract.getUserById(memberId);
                    const cid = userData.userInfoCID;
                    let userInfo = { userName: "Usuario Desconocido", email: "" };
                    if (cid && cid !== "N/A" && cid !== "") {
                        const raw = await fetchFromIPFS(cid);
                        if (raw) {
                            const data = typeof raw === 'string' ? decryptData(raw) : raw;
                            if (!data.error) userInfo = data;
                        }
                    }
                    members.push({
                        uid: memberId,
                        wallet: userData.wallet,
                        userName: userInfo.userName.trim(),
                        email: userInfo.email.trim(),
                        isBanned: userData.isBanned
                    });
                } catch (err) { console.warn(`Error al obtener info del miembro ${memberId}:`, err); }
            }
            return members;
        } catch (error) {
            console.error("Error al obtener información de miembros:", error);
            throw error;
        }
    },

    /**
     * Obtiene una lista de todos los administradores del sistema registrados.
     * @returns {Promise<Object[]>} Lista de objetos con wallet y clave pública de los admins.
     */
    getAllAdmins: async () => {
        try {
            const contract = await getContract('USERS', false);
            const count = Number(await contract.userCount());
            const admins = [];
            for (let i = 1; i <= count; i++) {
                const u = await contract.getUserById(i); 
                if (Number(u.condition) === 1) { 
                    admins.push({ wallet: u.wallet, publicKey: u.publicKey });
                }
            }
            return admins;
        } catch (e) {
            console.error("Error obteniendo lista de admins:", e);
            return [];
        }
    },

    /**
     * Crea un reporte de error (Bug Report).
     * Implementa un modelo de cifrado múltiple (fan-out): cifra el contenido con AES y luego "envuelve"
     * la clave para cada administrador mediante sus claves públicas registradas.
     * @param {string} userSender - Identificador del remitente.
     * @param {string} title - Título del reporte.
     * @param {string} description - Descripción del bug.
     * @param {FileList|File[]} files - Archivos adjuntos como prueba.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    createBugReport: async (userSender, title, description, files) => {
        try {
            const contract = await getContract('REPORTS', true);
            const admins = await Web3Service.getAllAdmins();
            if (admins.length === 0) throw new Error("No hay administradores.");
            const fileCIDs = await uploadFilesToIPFS(files);
            const aesKey = ethers.hexlify(ethers.randomBytes(32));
            const payload = { userSender, title, description, proofs: fileCIDs };
            const encryptedContent = CryptoJS.AES.encrypt(JSON.stringify(payload), aesKey).toString();
            const userReportCID = await uploadToIPFS(encryptedContent, PINATA_JWT);
            const adminWallets = [];
            const encryptedKeys = [];
            for (let admin of admins) {
                const encrypted = await EthCrypto.encryptWithPublicKey(admin.publicKey, aesKey);
                adminWallets.push(admin.wallet);
                encryptedKeys.push(JSON.stringify(encrypted));
            }

            const tx = await contract.createBugReport(
                hashValue(userSender.trim()), hashValue(description), hashValue(title), 
                hashValue(fileCIDs.join(',')), userReportCID, adminWallets, encryptedKeys
            );
            return await tx.wait();
        } catch (error) { throw error; }
    },

    /**
     * Recupera y descifra los reportes de bugs (solo para administradores).
     * @returns {Promise<Object[]>} Lista de reportes descifrados.
     */
    viewSortedBugReports: async () => {
        try {
            const privKey = getPrivateKey();
            const contract = await getContract('REPORTS', true);
            const reportsBC = await contract.viewSortedBugReports();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const myWallet = signer.address;            
            const res = await Promise.all(reportsBC.map(async (report) => {
                try {
                    const encryptedKeyStr = await contract.bugReportKeys(report.id, myWallet);
                    if (!encryptedKeyStr) return null;

                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey, JSON.parse(encryptedKeyStr));
                    const ipfsEncrypted = await fetchFromIPFS(report.userReportCID);
                    const bytes = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                    return { id: Number(report.id), type: 'BUG_REPORT', ...data };
                } catch (e) { return null; }
            }));
            return res.filter(r => r !== null);
        } catch (error) { return []; }
    },



    /**
     * Crea un reporte sobre el comportamiento indebido de un usuario.
     * Utiliza un esquema de encapsulación de claves (KEM) para garantizar que solo los administradores
     * autorizados puedan acceder a la información sensible del reporte.
     * @param {string} userSender - Identificador del remitente.
     * @param {string} userNameToReport - Usuario denunciado.
     * @param {string} email - Email de contacto.
     * @param {string} description - Detalles de la denuncia.
     * @param {FileList|File[]} files - Pruebas adjuntas.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    createUserReport: async (userSender, userNameToReport, email, description, files) => {
        try {
            const contract = await getContract('REPORTS', true);
            const admins = await Web3Service.getAllAdmins();

            const fileCIDs = await uploadFilesToIPFS(files);
            const aesKey = ethers.hexlify(ethers.randomBytes(32));
            
            const payload = { userSender, userNameReported: userNameToReport, email, description, proofs: fileCIDs };
            const encryptedContent = CryptoJS.AES.encrypt(JSON.stringify(payload), aesKey).toString();
            const userReportCID = await uploadToIPFS(encryptedContent, PINATA_JWT);

            const adminWallets = admins.map(a => a.wallet);
            const encryptedKeys = await Promise.all(admins.map(async (a) => {
                const enc = await EthCrypto.encryptWithPublicKey(a.publicKey, aesKey);
                return JSON.stringify(enc);
            }));

            const tx = await contract.createUserReport(
                hashValue(userSender.trim()), hashValue(description), hashValue(userNameToReport.trim()), 
                hashValue(email.trim()), hashValue(fileCIDs.join(',')), userReportCID, adminWallets, encryptedKeys
            );
            return await tx.wait();
        } catch (error) { console.error(error); throw error; }
    },

    /**
     * Recupera y descifra los reportes de usuarios (solo para administradores).
     * @returns {Promise<Object[]>} Lista de reportes descifrados.
     */
    viewSortedUserReports: async () => {
        try {
            const privKey = cachedPrivateKey || sessionStorage.getItem('cached_priv_key');
            if (!privKey) return [];

            const contract = await getContract('REPORTS', true);
            const reportsBC = await contract.viewSortedUserReports();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const myWallet = signer.address;            
            const res = await Promise.all(reportsBC.map(async (report) => {
                try {
                    const encryptedKeyStr = await contract.userReportKeys(report.id, myWallet);
                    if (!encryptedKeyStr) return null;

                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey, JSON.parse(encryptedKeyStr));
                    const ipfsEncrypted = await fetchFromIPFS(report.userReportCID);
                    const bytes = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                    return { id: Number(report.id), type: 'USER_REPORT', ...data };
                } catch (e) { return null; }
            }));
            return res.filter(r => r !== null);
        } catch (error) { return []; }
    },

    /**
     * Elimina un reporte de usuario del contrato.
     * @param {number} reportId - ID del reporte.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    removeUserReport: async (reportId) => {
        try {
            const contract = await getContract('REPORTS', true);
            const tx = await contract.removeUserReport(reportId);
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar reportes de usuario:", error);
            throw error;
        }
    },

    /**
     * Elimina un reporte de bug del contrato.
     * @param {number} reportId - ID del reporte.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    removeBugReport: async (reportId) => {
        try {
            const contract = await getContract('REPORTS', true);
            const tx = await contract.removeBugReport(reportId);
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar reportes de bugs:", error);
            throw error;
        }
    },

    /**
     * Registra una nueva incidencia utilizando un esquema de cifrado híbrido.
     * El contenido se cifra con una clave AES efímera. Para destinatarios individuales, esta clave se 
     * cifra asimétricamente (ECIES). Para grupos, se cifra simétricamente con la clave maestra del grupo.
     * @param {string} title - Título de la incidencia.
     * @param {string} description - Cuerpo de la incidencia.
     * @param {number} priority - Nivel de prioridad (0-3).
     * @param {string} [userReceiver=""] - Nombre del usuario destinatario (opcional).
     * @param {string} [groupReceiver=""] - Nombre del grupo destinatario (opcional).
     * @param {string} [userDate=""] - Fecha de creación.
     * @param {string} [senderUserName=""] - Nombre del remitente.
     * @param {string} [senderEmail=""] - Email del remitente.
     */
    registerIncidence: async (title, description, priority, userReceiver = "", groupReceiver = "", userDate = "", senderUserName = "", senderEmail = "") => {
        try {
            const contract = await getContract('INCIDENCES', true);
            const usersContract = await getContract('USERS', false);

            const aesKey = ethers.hexlify(ethers.randomBytes(32));
            const incidencePayload = { title, description, priority, createdAt: userDate, senderUserName, senderEmail, userReceiver, groupReceiver };
            const encryptedContent = CryptoJS.AES.encrypt(JSON.stringify(incidencePayload), aesKey).toString();
            const cid = await uploadToIPFS(encryptedContent, PINATA_JWT);

            let finalEncryptedAESKey = "";

            if (userReceiver) {
                const userId = await usersContract.getIdByUserName(hashValue(userReceiver));
                const userObj = await usersContract.getUserById(userId);
                
                if (!userObj.publicKey || userObj.publicKey === "") {
                    throw new Error("El destinatario no tiene una clave pública registrada.");
                }

                // Cifrado Asimétrico para un usuario individual
                const encryptedAESKeyObj = await EthCrypto.encryptWithPublicKey(userObj.publicKey, aesKey);
                finalEncryptedAESKey = JSON.stringify(encryptedAESKeyObj);
            } else if (groupReceiver) {
                // Cifrado Simétrico para el grupo (envolvemos la llave de la incidencia con la llave del grupo)
                const groupAESKey = sessionStorage.getItem('current_group_aes');
                if (!groupAESKey) throw new Error("No tienes la llave del grupo para cifrar este mensaje.");
                finalEncryptedAESKey = CryptoJS.AES.encrypt(aesKey, groupAESKey).toString();
            }

            const tx = await contract.registerIncidence(
                hashValue(title), hashValue(description), userDate, priority, 
                hashValue(senderUserName), userReceiver ? hashValue(userReceiver) : ethers.ZeroHash,
                groupReceiver, groupReceiver ? hashValue(groupReceiver) : ethers.ZeroHash,
                cid, finalEncryptedAESKey 
            );
            return await tx.wait();
        } catch (error) {
            console.error("Error al registrar incidencia:", error);
            throw error;
        }
    },

    /**
     * Obtiene y descifra las incidencias enviadas directamente al usuario actual.
     * @returns {Promise<Object[]>} Lista de incidencias descifradas.
     */
    getUserIncidences: async () => {
        try {
            const privKey = cachedPrivateKey || sessionStorage.getItem('cached_priv_key');
            if (!privKey) return [];

            const contract = await getContract('INCIDENCES', true);
            const incidencesBC = await contract.userViewIndividualIncidences();

            const res = await Promise.all(incidencesBC.map(async (inc) => {
                try {
                    if (!inc.encryptedAESKey || inc.encryptedAESKey === "undefined") return null;

                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey, JSON.parse(inc.encryptedAESKey));
                    const ipfsEncrypted = await fetchFromIPFS(inc.privateDataCID);

                    const bytesData = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    const decryptedStr = bytesData.toString(CryptoJS.enc.Utf8);
                    return { id: Number(inc.id), priority: inc.priorityLevel, date: inc.date, ...JSON.parse(decryptedStr) };
                } catch (e) {
                    console.error("Fallo al descifrar incidencia:", e);
                    return null;
                }
            }));
            return res.filter(i => i !== null);
        } catch (error) {
            console.error("Error al obtener incidencias del usuario:", error);
            return [];
        }
    },

    /**
     * Obtiene y descifra las incidencias pertenecientes al grupo del usuario actual.
     * @returns {Promise<Object[]>} Lista de incidencias de grupo descifradas.
     */
    getGroupIncidences: async () => {
        try {
            const groupAESKey = sessionStorage.getItem('current_group_aes');
            if (!groupAESKey) return [];

            const contract = await getContract('INCIDENCES', true);
            const incidencesBC = await contract.userViewGroupIncidences();

            const res = await Promise.all(incidencesBC.map(async (inc) => {
                try {
                    const bytesKey = CryptoJS.AES.decrypt(inc.encryptedAESKey, groupAESKey);
                    const aesKey = bytesKey.toString(CryptoJS.enc.Utf8);
                    
                    const ipfsEncrypted = await fetchFromIPFS(inc.privateDataCID);
                    const bytesData = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    return { id: Number(inc.id), priority: inc.priorityLevel, date: inc.date, ...JSON.parse(bytesData.toString(CryptoJS.enc.Utf8)) };
                } catch (e) { return null; }
            }));
            return res.filter(i => i !== null);
        } catch (error) {
            console.error("Error al obtener incidencias del grupo:", error);
            return [];
        }
    },

    /**
     * Crea una solicitud formal para obtener el rol de administrador.
     * @param {string} requestReason - Motivo de la solicitud.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    createAdminRequest: async (requestReason) => {
        try {
            const contract = await getContract('ADMIN_REQUESTS', true);
            const signer = await (new ethers.BrowserProvider(window.ethereum)).getSigner();
            const tx = await contract.createAdminRequest(await signer.getAddress(), requestReason);
            return await tx.wait();
        } catch (error) {
            console.error("Error al crear petición de admin:", error);
            throw error;
        }
    },

    /**
     * Lista todas las peticiones de administración pendientes.
     * @returns {Promise<Object[]>} Lista de peticiones.
     */
    viewAdminRequests: async () => {
        try {
            const contract = await getContract('ADMIN_REQUESTS', false);
            const requests = await contract.viewRequests();
            return requests.map(req => ({ id: Number(req.id), userWallet: req.userWallet, requestReason: req.requestReason }));
        } catch (error) {
            console.error("Error al ver peticiones de admin:", error);
            throw error;
        }
    },

    /**
     * Elimina una petición de administración (al ser procesada).
     * @param {number} requestId - ID de la petición.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    removeAdminRequest: async (requestId) => {
        try {
            const contract = await getContract('ADMIN_REQUESTS', true);
            const tx = await contract.removeRequest(requestId);
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar petición de admin:", error);
            throw error;
        }
    },

    hashValue, uploadToIPFS, fetchFromIPFS, IPFS_GATEWAY
};
