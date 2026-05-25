import { ethers } from 'ethers';
import EthCrypto from 'eth-crypto';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

// ABI de los contratos 
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

const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY;
const IPFS_UPLOAD_URL = process.env.REACT_APP_IPFS_UPLOAD_URL;
const IPFS_FILE_UPLOAD_URL = process.env.REACT_APP_IPFS_FILE_UPLOAD_URL;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

const getSessionKey = () => sessionStorage.getItem('cached_priv_key');

const encryptData = (dataObject) => {
    const key = getSessionKey();
    if (!key) return dataObject;
    return CryptoJS.AES.encrypt(JSON.stringify(dataObject), key).toString();
};

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

const getPrivateKey = () => {
    if (!cachedPrivateKey) {
        cachedPrivateKey = sessionStorage.getItem('cached_priv_key');
    }
    return cachedPrivateKey;
};

const hashValue = (value) => ethers.id(value);
let cachedPrivateKey = null;

export const Web3Service = {

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

            // Derivación de clave pública para el registro
            const publicKey = EthCrypto.publicKeyByPrivateKey(privKey.replace('0x', ''));
            sessionStorage.setItem('user_pub_key', publicKey);

            return true;
        } catch (e) {
            return false;
        }
    },
    
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

    getGroupMembers: async (groupId) => {
        try {
            const contract = await getContract('GROUPS', true);
            return await contract.getGroupMembers(groupId);
        } catch (error) {
            console.error("Error al obtener miembros del grupo:", error);
            throw error;
        }
    },

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
