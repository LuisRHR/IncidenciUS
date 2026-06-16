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
    "function login() public view returns (tuple(uint uid, bytes32 userNameHash,  bytes32 emailHash, address wallet, uint8 userRole, bool isBanned, string userInfoCID, string publicKey))",
    "function deleteUser() public",
    "function giveUserAdminStatus(address userAddress) public",    
    "function blockUser(bytes32 userNameHashed) public",
    "function getActualUser() public view returns (tuple(uint uid, bytes32 userNameHash, bytes32 emailHash, address wallet, uint8 userRole, bool isBanned, string userInfoCID, string publicKey))",
    "function getIdByWallet(address wallet) public view returns (uint)",
    "function getIdByUserName(bytes32 userNameHashed) public view returns (uint)",
    "function getIdByEmail(bytes32 emailHashed) public view returns (uint)",
    "function userCount() public view returns (uint)",
    "function getUserById(uint uid) public view returns (tuple(uint uid, bytes32 userNameHash, bytes32 emailHash, address wallet, uint8 userRole, bool isBanned, string userInfoCID, string publicKey))"
];

const GROUPS_ABI = [
    "function createGroup(string memory groupName, string memory description, string memory encryptedAdminKey) public",
    "function inviteUserToGroup(bytes32 userNameHashed, string memory encryptedKeyForUser) public",
    "function userJoined(string memory groupName) public",
    "function rejectGroupInvitation(string memory groupName) public",
    "function deleteUserFromGroup(bytes32 userNameHashed) public",
    "function deleteSelfUserFromGroup_WhenDeletingUser() public",
    "function deleteGroup() public",
    "function getGroupMembers(uint groupId) public view returns (uint[] memory)",
    "function getGroupById(uint groupId) public view returns (tuple(string groupName, string description, uint[] members, uint[] invitedUsers, uint admin))",
    "function getIdByGroupName(string memory groupName) public view returns (uint)",
    "function getGroupIdByAdminWallet(address adminWallet) public view returns (uint)",
    "function getGroupIdByUserWallet(address userWallet) public view returns (uint)",
    "function groupUsersKeys(uint groupId, address userWallet) public view returns (string)",
    "function storeMemberEncryptedName(string memory encryptedName) public",
    "function memberEncryptedNames(uint groupId, uint uid) public view returns (string)",
    "function getInvitedGroupIdsByUserId(uint userId) public view returns (uint[] memory)"
];

const REPORTS_ABI = [
    "function createBugReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 titleHashed, bytes32 hashProofs, string memory bugReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public",
    "function createUserReport(bytes32 senderHashed, bytes32 descriptionHashed, bytes32 userNameHashed, bytes32 emailHashed, bytes32 hashProofs, string memory userReportCID, address[] memory adminWallets, string[] memory encryptedKeys) public",
    "function viewSortedBugReports() public view returns (tuple(uint id, bytes32 senderHash, bytes32 descriptionHash, bytes32 hashProofs, bytes32 titleHash, string bugReportCID)[])",
    "function viewSortedUserReports() public view returns (tuple(uint id, bytes32 senderHash, bytes32 descriptionHash, bytes32 hashProofs, bytes32 userNameHash, bytes32 emailHash, string userReportCID)[])",
    "function bugReportKeys(uint reportId, address adminWallet) public view returns (string)",
    "function userReportKeys(uint reportId, address adminWallet) public view returns (string)",
    "function removeBugReport(uint requestId) public",
    "function removeUserReport(uint requestId) public"
];

const INCIDENCES_ABI = [
    "function registerIncidence(bytes32 titleHash, bytes32 descriptionHash, string memory date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, string memory groupReceiver, bytes32 groupReceiverHash, string memory privateDataCID, string memory encryptedAESKey, string memory senderEncryptedAESKey) public",
    "function userViewIndividualIncidences() public view returns (tuple(uint id, bytes32 titleHash, bytes32 descriptionHash, string date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, bytes32 groupReceiverHash, string privateDataCID, string encryptedAESKey, uint8 status, address senderWallet)[])",
    "function userViewGroupIncidences() public view returns (tuple(uint id, bytes32 titleHash, bytes32 descriptionHash, string date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, bytes32 groupReceiverHash, string privateDataCID, string encryptedAESKey, uint8 status, address senderWallet)[])",
    "function senderViewSentIncidences() public view returns (tuple(uint id, bytes32 titleHash, bytes32 descriptionHash, string date, uint8 priorityLevel, bytes32 senderNameHash, bytes32 userReceiverHash, bytes32 groupReceiverHash, string privateDataCID, string encryptedAESKey, uint8 status, address senderWallet)[])",
    "function updateIncidenceStatus(uint incidenceId, uint8 newStatus) public",
    "function storeGroupMemberKeys(uint incidenceId, address[] memory memberWallets, string[] memory encryptedKeys) public",
    "function groupMemberKeys(uint incidenceId, address memberWallet) public view returns (string)",
    "function senderEncryptedKeys(uint incidenceId, address senderWallet) public view returns (string)"
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
 * Obtiene la clave privada almacenada en la sesión volátil.
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
 * Sube datos JSON a IPFS a través de Pinata.
 * @param {Object} data - Los datos a subir.
 * @throws {Error} Si la subida falla.
 * @returns {Promise<string>} El CID (Hash) de IPFS de los datos subidos.
 */
const uploadToIPFS = async (data) => {
    try {
        const response = await fetch(IPFS_UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinataContent: data })
        });

        if (!response.ok) {
            throw new Error(`IPFS upload failed: ${response.statusText}`);
        }

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
        
        const gatewayUrl = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
        const response = await fetch(`${gatewayUrl}${cid}`);
        const data = await response.json();
        
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
                role: userBC.userRole === 1n ? 'Admin de Sistema' : 'Comun',
                userRole: Number(userBC.userRole),
                cid: cid,
                userName: ipfsData.userName.trim(),
                email: ipfsData.email.trim()
            };
        } catch (e) {
            // Detectar si el contrato revirtió la llamada por bloqueo
            if (e.message?.includes("Banned") || e.reason?.includes("Banned") || e.message?.includes("bloqueado")) {
                return { exists: true, isBanned: true };
            }
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
            
            const cid = await uploadToIPFS(encryptData({ userName: cleanName, email: cleanEmail }));
            
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
                role: userBC.userRole === 1n ? 'Admin de Sistema' : 'Comun',
                userRole: Number(userBC.userRole),
                cid: cid,
                userName: ipfsData.userName.trim(), 
                email: ipfsData.email.trim()
            };
        } catch (e) {
            if (e.message?.includes("bloqueado") || e.reason?.includes("bloqueado") || e.message?.includes("bloqueado")) {
                return { exists: true, isBanned: true };
            }
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
    createGroup: async (groupName, description = "", userName = "") => {
        try {
            const contract = await getContract('GROUPS', true);     
            const groupAESKey = ethers.hexlify(ethers.randomBytes(32));     
            const myPubKey = sessionStorage.getItem('user_pub_key');
            const encryptedAdminKey = await EthCrypto.encryptWithPublicKey(myPubKey, groupAESKey);
            sessionStorage.setItem('current_group_aes', groupAESKey);

            const tx = await contract.createGroup(groupName.trim(), description, JSON.stringify(encryptedAdminKey));
            await tx.wait();

            if (userName) {
                const encryptedName = CryptoJS.AES.encrypt(userName.trim(), groupAESKey).toString();
                const tx2 = await contract.storeMemberEncryptedName(encryptedName);
                await tx2.wait();
            }

            return true;
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
    joinGroup: async (groupName, userName = "") => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.userJoined(groupName.trim());
            await tx.wait();

            const provider = new ethers.BrowserProvider(window.ethereum);
            const wallet = (await provider.getSigner()).address;
            const groupId = await contract.getGroupIdByUserWallet(wallet);
            const privKey = sessionStorage.getItem('cached_priv_key');
            const encryptedGroupKeyStr = await contract.groupUsersKeys(groupId, wallet);

            if (encryptedGroupKeyStr && privKey) {
                const groupAESKey = await EthCrypto.decryptWithPrivateKey(
                    privKey.replace('0x', ''), 
                    JSON.parse(encryptedGroupKeyStr)
                );
                sessionStorage.setItem('current_group_aes', groupAESKey);

                if (userName) {
                    try {
                        const encryptedName = CryptoJS.AES.encrypt(userName.trim(), groupAESKey).toString();
                        const tx2 = await contract.storeMemberEncryptedName(encryptedName);
                        await tx2.wait();
                        sessionStorage.setItem('name_registered_in_group', '1');
                    } catch (nameErr) {
                        console.warn("Nombre no almacenado al unirse, se reparará en el próximo login:", nameErr);
                    }
                }
            }

            return true;
        } catch (error) {
            console.error("Error al unirse al grupo:", error);
            throw error;
        }
    },

    /**
     * Rechaza una invitación a un grupo.
     * @param {string} groupName - Nombre del grupo cuya invitación rechazar.
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción.
     */
    rejectGroupInvitation: async (groupName) => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.rejectGroupInvitation(groupName.trim());
            return await tx.wait();
        } catch (error) {
            console.error("Error al rechazar invitación:", error);
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
     * Recupera las invitaciones pendientes para el usuario actual.
     * @returns {Promise<Object[]>} Lista de grupos { id, name, description }
     */
    getInvitedGroups: async () => {
        try {
            const groupsContract = await getContract('GROUPS', false);
            const usersContract = await getContract('USERS', false);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const wallet = signer.address;
            const uid = Number(await usersContract.getIdByWallet(wallet));
            if (!uid || uid === 0) return [];
            const invited = await groupsContract.getInvitedGroupIdsByUserId(uid);
            const res = [];
            for (const gid of invited) {
                try {
                    const g = await groupsContract.getGroupById(gid);
                    res.push({ id: Number(gid), name: g.groupName, description: g.description });
                } catch (e) { console.warn('Error fetching invited group', gid, e); }
            }
            return res;
        } catch (error) {
            console.error('Error al obtener invitaciones:', error);
            return [];
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
                const privKey = sessionStorage.getItem('cached_priv_key');
                const encryptedGroupKeyStr = await contract.groupUsersKeys(groupId, wallet);
                if (encryptedGroupKeyStr && privKey) {
                    const groupAESKey = await EthCrypto.decryptWithPrivateKey(
                        privKey.replace('0x', ''),
                        JSON.parse(encryptedGroupKeyStr)
                    );
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
            const groupAESKey = sessionStorage.getItem('current_group_aes');
            if (!groupAESKey) throw new Error("No tienes la clave del grupo en sesión.");

            const usersContract = await getContract('USERS', false);
            const groupsContract = await getContract('GROUPS', true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const wallet = (await provider.getSigner()).address;
            const groupId = await groupsContract.getGroupIdByUserWallet(wallet);

            const members = [];
            for (const memberId of memberIds) {
                try {
                    const userData = await usersContract.getUserById(memberId);

                    let userName = "Usuario Desconocido";
                    const encryptedName = await groupsContract.memberEncryptedNames(groupId, memberId);
                    if (encryptedName && encryptedName !== "") {
                        const bytes = CryptoJS.AES.decrypt(encryptedName, groupAESKey);
                        const decoded = bytes.toString(CryptoJS.enc.Utf8);
                        if (decoded) userName = decoded;
                    }

                    members.push({
                        uid: memberId,
                        wallet: userData.wallet,
                        userName,
                        isBanned: userData.isBanned
                    });
                } catch (err) {
                    console.warn(`Error al obtener info del miembro ${memberId}:`, err);
                }
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
                if (Number(u.userRole) === 1) { 
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
            const userReportCID = await uploadToIPFS(encryptedContent);
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

                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey.replace('0x', ''), JSON.parse(encryptedKeyStr));
                    const ipfsEncrypted = await fetchFromIPFS(report.bugReportCID);
                    const bytes = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                    return { id: Number(report.id), type: 'BUG_REPORT', cid: report.bugReportCID, ...data };
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
            const userReportCID = await uploadToIPFS(encryptedContent);

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

                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey.replace('0x', ''), JSON.parse(encryptedKeyStr));
                    const ipfsEncrypted = await fetchFromIPFS(report.userReportCID);
                    const bytes = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                    return { id: Number(report.id), type: 'USER_REPORT', cid: report.userReportCID, ...data };
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
            const cid = await uploadToIPFS(encryptedContent);

            // Cifrar la AES key para el EMISOR (permite descifrar en notificaciones)
            const senderPubKey = sessionStorage.getItem('user_pub_key');
            let senderEncryptedAESKey = "";
            if (senderPubKey) {
                const encObj = await EthCrypto.encryptWithPublicKey(senderPubKey, aesKey);
                senderEncryptedAESKey = JSON.stringify(encObj);
            }

            let finalEncryptedAESKey = "";
            let memberWallets = [];
            let memberEncryptedKeys = [];

            if (userReceiver) {
                const userId = await usersContract.getIdByUserName(hashValue(userReceiver));
                const userObj = await usersContract.getUserById(userId);
                if (!userObj.publicKey || userObj.publicKey === "") throw new Error("El destinatario no tiene una clave pública registrada.");
                const encryptedAESKeyObj = await EthCrypto.encryptWithPublicKey(userObj.publicKey, aesKey);
                finalEncryptedAESKey = JSON.stringify(encryptedAESKeyObj);
            } else if (groupReceiver) {
                const groupAESKey = sessionStorage.getItem('current_group_aes');
                if (groupAESKey) {
                    // MIEMBRO del grupo: envuelve la clave con la group AES key
                    finalEncryptedAESKey = CryptoJS.AES.encrypt(aesKey, groupAESKey).toString();
                } else {
                    // NO-MIEMBRO: fan-out con clave pública de cada miembro.
                    // Usamos getGroupById en lugar de getGroupMembers para evitar restricciones de acceso.
                    const groupsContract = await getContract('GROUPS', false);
                    const groupId = await groupsContract.getIdByGroupName(groupReceiver);
                    if (groupId.toString() === "0") throw new Error("Grupo no encontrado.");
                    const groupData = await groupsContract.getGroupById(groupId);
                    const memberIds = Array.from(groupData.members).map(m => Number(m));
                    if (!memberIds || memberIds.length === 0) throw new Error("El grupo no tiene miembros.");
                    for (const memberId of memberIds) {
                        const memberData = await usersContract.getUserById(memberId);
                        if (memberData.publicKey && memberData.publicKey !== "") {
                            const encObj = await EthCrypto.encryptWithPublicKey(memberData.publicKey, aesKey);
                            memberWallets.push(memberData.wallet);
                            memberEncryptedKeys.push(JSON.stringify(encObj));
                        }
                    }
                    if (memberWallets.length === 0) {
                        throw new Error("Ningún miembro del grupo tiene clave pública registrada.");
                    }
                }
            }

            const txResponse = await contract.registerIncidence(
                hashValue(title), hashValue(description), userDate, priority,
                hashValue(senderUserName), userReceiver ? hashValue(userReceiver) : ethers.ZeroHash,
                groupReceiver, groupReceiver ? hashValue(groupReceiver) : ethers.ZeroHash,
                cid, finalEncryptedAESKey, senderEncryptedAESKey
            );
            const receipt = await txResponse.wait();

            // Almacenar claves por miembro si es envío de no-miembro a grupo
            if (memberWallets.length > 0) {
                let newIncidenceId = null;
                const iface = new ethers.Interface(['event IncidenceRegistered(uint indexed id, address indexed senderWallet)']);
                for (const log of receipt.logs) {
                    try { const p = iface.parseLog(log); newIncidenceId = Number(p.args.id); break; } catch {}
                }
                if (newIncidenceId) {
                    const contract2 = await getContract('INCIDENCES', true);
                    const tx2 = await contract2.storeGroupMemberKeys(newIncidenceId, memberWallets, memberEncryptedKeys);
                    await tx2.wait();
                }
            }
            return receipt;
        } catch (error) { console.error("Error al registrar incidencia:", error); throw error; }
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
                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey.replace('0x', ''), JSON.parse(inc.encryptedAESKey));
                    const ipfsEncrypted = await fetchFromIPFS(inc.privateDataCID);
                    const bytesData = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    return { id: Number(inc.id), priority: Number(inc.priorityLevel), date: inc.date, status: Number(inc.status), ...JSON.parse(bytesData.toString(CryptoJS.enc.Utf8)) };
                } catch (e) { console.error("Fallo al descifrar incidencia:", e); return null; }
            }));
            return res.filter(i => i !== null);
        } catch (error) { console.error("Error al obtener incidencias del usuario:", error); return []; }
    },

    /**
     * Obtiene y descifra las incidencias pertenecientes al grupo del usuario actual.
     * Intenta primero descifrando con la clave AES del grupo, y si falla, intenta con clave privada.
     * @returns {Promise<Object[]>} Lista de incidencias de grupo descifradas.
     */
    getGroupIncidences: async () => {
        try {
            let groupAESKey = sessionStorage.getItem('current_group_aes');
            const privKey = cachedPrivateKey || sessionStorage.getItem('cached_priv_key');
            
            // Si no tenemos clave AES de grupo, intentar recuperarla del contrato
            if (!groupAESKey && privKey) {
                try {
                    const contract = await getContract('GROUPS', true);
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const wallet = (await provider.getSigner()).address;
                    const groupId = await contract.getGroupIdByUserWallet(wallet);
                    if (groupId.toString() !== "0") {
                        const encryptedGroupKeyStr = await contract.groupUsersKeys(groupId, wallet);
                        if (encryptedGroupKeyStr) {
                            groupAESKey = await EthCrypto.decryptWithPrivateKey(
                                privKey.replace('0x', ''),
                                JSON.parse(encryptedGroupKeyStr)
                            );
                            sessionStorage.setItem('current_group_aes', groupAESKey);
                        }
                    }
                } catch (e) {
                    console.warn("No se pudo recuperar la clave AES del grupo:", e);
                }
            }
            
            if (!groupAESKey && !privKey) return [];
            const contract = await getContract('INCIDENCES', true);
            const incidencesBC = await contract.userViewGroupIncidences();
            const res = await Promise.all(incidencesBC.map(async (inc) => {
                try {
                    const encKey = inc.encryptedAESKey;
                    if (!encKey || encKey === "") return null;
                    let aesKey;
                    // JSON con ephemPublicKey → asimétrico (no-miembro envió). Otro formato → simétrico (miembro envió).
                    let isAsymmetric = false;
                    try { const p = JSON.parse(encKey); if (p.ephemPublicKey) isAsymmetric = true; } catch {}
                    if (isAsymmetric) {
                        if (!privKey) return null;
                        aesKey = await EthCrypto.decryptWithPrivateKey(privKey.replace('0x', ''), JSON.parse(encKey));
                    } else {
                        if (!groupAESKey) return null;
                        aesKey = CryptoJS.AES.decrypt(encKey, groupAESKey).toString(CryptoJS.enc.Utf8);
                    }
                    const ipfsEncrypted = await fetchFromIPFS(inc.privateDataCID);
                    const bytesData = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    return { id: Number(inc.id), priority: Number(inc.priorityLevel), date: inc.date, status: Number(inc.status), ...JSON.parse(bytesData.toString(CryptoJS.enc.Utf8)) };
                } catch (e) { console.error("Fallo al descifrar incidencia de grupo:", e); return null; }
            }));
            return res.filter(i => i !== null);
        } catch (error) { console.error("Error al obtener incidencias del grupo:", error); return []; }
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

    /**
     * Obtiene y descifra las incidencias enviadas por el usuario actual.
     * Permite al emisor recuperar la clave AES para visualizar sus propios reportes en el panel de notificaciones.
     * @returns {Promise<Object[]>} Lista de incidencias enviadas descifradas.
     */
    getSentIncidences: async () => {
        try {
            const privKey = cachedPrivateKey || sessionStorage.getItem('cached_priv_key');
            if (!privKey) return [];
            const contract = await getContract('INCIDENCES', true);
            const incidencesBC = await contract.senderViewSentIncidences();
            const res = await Promise.all(incidencesBC.map(async (inc) => {
                try {
                    const encKey = inc.encryptedAESKey;
                    if (!encKey || encKey === "" || encKey === "undefined") return null;
                    const aesKey = await EthCrypto.decryptWithPrivateKey(privKey.replace('0x', ''), JSON.parse(encKey));
                    const ipfsEncrypted = await fetchFromIPFS(inc.privateDataCID);
                    const bytesData = CryptoJS.AES.decrypt(ipfsEncrypted, aesKey);
                    return { id: Number(inc.id), priority: Number(inc.priorityLevel), date: inc.date, status: Number(inc.status), ...JSON.parse(bytesData.toString(CryptoJS.enc.Utf8)) };
                } catch (e) { console.error("Error al descifrar incidencia enviada:", e); return null; }
            }));
            return res.filter(i => i !== null);
        } catch (error) { console.error("Error al obtener incidencias enviadas:", error); return []; }
    },

    /**
     * Actualiza el estado de una incidencia específica en la Blockchain.
     * @param {number} incidenceId - Identificador único de la incidencia.
     * @param {number} newStatus - Nuevo estado (0: Activa, 1: Resuelta, 2: Reabierta, 3: Cerrada).
     * @returns {Promise<ethers.ContractTransactionReceipt>} Recibo de la transacción confirmada.
     */
    updateIncidenceStatus: async (incidenceId, newStatus) => {
        try {
            const contract = await getContract('INCIDENCES', true);
            const tx = await contract.updateIncidenceStatus(incidenceId, newStatus);
            return await tx.wait();
        } catch (error) { console.error("Error al actualizar estado:", error); throw error; }
    },

    hashValue, uploadToIPFS, fetchFromIPFS, IPFS_GATEWAY
};
