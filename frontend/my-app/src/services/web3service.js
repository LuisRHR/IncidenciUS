import { ethers } from 'ethers';
import EthCrypto from 'eth-crypto';
import CryptoJS from 'crypto-js';

// ABI de los contratos 
const USERS_ABI = [
    "function registerUser(string memory userNameHashed, string memory emailHashed, string memory userInfoCID) public",
    "function login() public view returns (tuple(uint uid, string userNameHash, string emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID))",
    "function deleteUser() public",
    "function giveUserAdminStatus(address userAddress) public",    
    "function blockUser(string memory userNameHashed) public",
    "function getActualUser() public view returns (tuple(uint uid, string userNameHash, string emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID))",
    "function getIdByWallet(address wallet) public view returns (uint)",
    "function getIdByUserName(string memory userNameHashed) public view returns (uint)",
    "function getIdByEmail(string memory emailHashed) public view returns (uint)",
    "function getUserById(uint uid) public view returns (tuple(uint uid, string userNameHash, string emailHash, address wallet, uint8 condition, bool isBanned, string userInfoCID))"
];

const GROUPS_ABI = [
    "function createGroup(string memory groupName, string memory description) public",
    "function inviteUserToGroup(string memory userNameHashed) public",
    "function userJoined(string memory groupName) public",
    "function deleteUserFromGroup(string memory userNameHashed) public",
    "function deleteSelfUserFromGroup_WhenDeletingUser() public",
    "function deleteGroup() public",
    "function getGroupMembers(uint groupId) public view returns (uint[] memory)",
    "function getGroupById(uint groupId) public view returns (tuple(string groupName, string description, uint[] members, uint[] invitedUsers, uint admin))",
    "function getIdByGroupName(string memory groupName) public view returns (uint)",
    "function getGroupIdByAdminWallet(address adminWallet) public view returns (uint)",
    "function getGroupIdByUserWallet(address userWallet) public view returns (uint)"
];

const REPORTS_ABI = [
    "function createBugReport(string memory senderHashed, string memory descriptionHashed, string memory titleHashed, string memory hashProofs, string memory userReportCID) public",
    "function createUserReport(string memory senderHashed, string memory descriptionHashed, string memory userNameHashed, string memory emailHashed, string memory hashProofs, string memory userReportCID) public",
    "function viewSortedBugReports() public view returns (tuple(uint id, string senderHash, string descriptionHash, string hashProofs, string titleHash, string userReportCID)[])",
    "function viewSortedUserReports() public view returns (tuple(uint id, string senderHash, string descriptionHash, string hashProofs, string userNameHash, string emailHash, string userReportCID)[])",
    "function removeBugReport(uint requestId) public",
    "function removeUserReport(uint requestId) public"
];

const INCIDENCES_ABI = [
    "function registerIncidence(string memory titleHash, string memory descriptionHash, string memory date, uint8 priorityLevel, string memory senderNameHash, string memory userReceiverHash, string memory groupReceiver, string memory groupReceiverHash, string memory privateDataCID) public",
    "function userViewIndividualIncidences() public view returns (tuple(uint id, string titleHash, string descriptionHash, string date, uint8 priorityLevel, string senderNameHash, string userReceiverHash, string groupReceiverHash, string privateDataCID)[])",
    "function userViewGroupIncidences() public view returns (tuple(uint id, string titleHash, string descriptionHash, string date, uint8 priorityLevel, string senderNameHash, string userReceiverHash, string groupReceiverHash, string privateDataCID)[])"
];

const ADMIN_REQUESTS_ABI = [
    "function createAdminRequest(address userWallet, string memory requestReason) public",
    "function viewRequests() public view returns (tuple(uint id, address userWallet, string requestReason)[])",
    "function removeRequest(uint requestId) public"
];

const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY;
const IPFS_UPLOAD_URL = process.env.REACT_APP_IPFS_UPLOAD_URL;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

const getSessionKey = () => sessionStorage.getItem('session_key');

const encryptData = (dataObject) => {
    const key = getSessionKey();
    if (!key) return dataObject;
    return CryptoJS.AES.encrypt(JSON.stringify(dataObject), key).toString();
};

const decryptData = (encryptedString) => {
    const key = getSessionKey();
    if (!key) return { error: "Sesión no iniciada para descifrado" };
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
        const payload = encryptData(data);

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

        const content = (data && data.pinataContent) ? data.pinataContent : data;
        return typeof content === 'string' ? decryptData(content) : content;
    } catch (error) {
        return { error: error.message };
    }
};

const hashValue = (value) => ethers.id(value);

export const Web3Service = {

    initSession: async () => {
        if (getSessionKey()) return true;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage("Acceder a mi panel privado de IncidenciUS");
            sessionStorage.setItem('session_key', hashValue(signature));
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
                const data = await fetchFromIPFS(cid);
                if (!data.error) ipfsData = data;
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

    register: async (userName, email) => {
        try {
            const contract = await getContract('USERS', true);
            const cleanName = userName.trim();
            const cleanEmail = email.trim();
            const cid = await uploadToIPFS({ userName: cleanName, email: cleanEmail }, PINATA_JWT);
            const tx = await contract.registerUser(hashValue(cleanName), hashValue(cleanEmail), cid);
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
                const data = await fetchFromIPFS(cid);
                if (!data.error) ipfsData = data;
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
            const tx = await contract.createGroup(groupName.trim(), description);
            return await tx.wait();
        } catch (error) {
            console.error("Error al crear grupo:", error);
            throw error;
        }
    },

    inviteUserToGroup: async (userNameToInvite) => {
        try {
            const contract = await getContract('GROUPS', true);
            const tx = await contract.inviteUserToGroup(hashValue(userNameToInvite.trim()));
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
            const groupId = await contract.getGroupIdByUserWallet(window.ethereum.selectedAddress);
            if (groupId.toString() === "0") return null;
            const groupData = await contract.getGroupById(groupId);
            return {
                id: Number(groupId),
                name: groupData.groupName,
                description: groupData.description,
                members: groupData.members.map(m => Number(m)),
                invitedUsers: groupData.invitedUsers.map(i => Number(i)),
                admin: Number(groupData.admin)
            };
        } catch (error) {
            console.error("Error al obtener el grupo actual:", error);
            return null;
        }
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
                        const data = await fetchFromIPFS(cid);
                        if (!data.error) userInfo = data;
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

    createBugReport: async (userSender, title, description, proofs) => {
        try {
            const contract = await getContract('REPORTS', true);
            const cid = await uploadToIPFS({ userSender: userSender.trim(), title, description, proofs }, PINATA_JWT);
            const tx = await contract.createBugReport(hashValue(userSender.trim()), hashValue(description), hashValue(title), hashValue(proofs), cid);
            return await tx.wait();
        } catch (error) {
            console.error("Error al crear reportes de bugs:", error);
            throw error;
        }
    },

    createUserReport: async (userSender, userNameToReport, email, description, proofs) => {
        try {
            const contract = await getContract('REPORTS', true);
            const cleanTarget = userNameToReport.trim();
            const cleanEmail = email.trim();
            const cid = await uploadToIPFS({ userSender: userSender.trim(), userNameReported: cleanTarget, email: cleanEmail, description, proofs }, PINATA_JWT);
            const tx = await contract.createUserReport(hashValue(userSender.trim()), hashValue(description), hashValue(cleanTarget), hashValue(cleanEmail), hashValue(proofs), cid);
            return await tx.wait();
        } catch (error) {
            console.error("Error al crear reportes de usuario:", error);
            throw error;
        }
    },

    viewSortedBugReports: async () => {
        try {
            const contract = await getContract('REPORTS', false);
            const reportsBC = await contract.viewSortedBugReports();
            return await Promise.all(reportsBC.map(async (report) => {
                const ipfsData = await fetchFromIPFS(report.userReportCID);
                return { id: Number(report.id), type: 'BUG_REPORT', ...ipfsData, cid: report.userReportCID };
            }));
        } catch (error) {
            console.error("Error al ver reportes de bugs:", error);
            throw error;
        }
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

    viewSortedUserReports: async () => {
        try {
            const contract = await getContract('REPORTS', false);
            const reportsBC = await contract.viewSortedUserReports();
            return await Promise.all(reportsBC.map(async (report) => {
                const ipfsData = await fetchFromIPFS(report.userReportCID);
                return { id: Number(report.id), type: 'USER_REPORT', ...ipfsData, cid: report.userReportCID };
            }));
        } catch (error) {
            console.error("Error al ver reportes de usuarios:", error);
            throw error;
        }
    },

    registerIncidence: async (title, description, priority, userReceiver = "", groupReceiver = "", userDate = "", senderUserName = "") => {
        try {
            const contract = await getContract('INCIDENCES', true);
            const cleanSender = senderUserName.trim();
            const cleanUserRec = userReceiver.trim();
            const cleanGroupRec = groupReceiver.trim();
            const cid = await uploadToIPFS({ title, description, priority, createdAt: userDate, senderUserName: cleanSender, userReceiver: cleanUserRec, groupReceiver: cleanGroupRec }, PINATA_JWT);
            const tx = await contract.registerIncidence(
                hashValue(title), hashValue(description.trim()), userDate || new Date().toISOString().split('T')[0],
                priority, hashValue(cleanSender), cleanUserRec ? hashValue(cleanUserRec) : "",
                cleanGroupRec, cleanGroupRec ? hashValue(cleanGroupRec) : "", cid
            );
            return await tx.wait();
        } catch (error) {
            console.error("Error al registrar incidencia:", error);
            throw error;
        }
    },

    getUserIncidences: async () => {
        try {
            const contract = await getContract('INCIDENCES', false);
            const usersContract = await getContract('USERS', false); // Para recuperar el correo electronico necesito acceder al contrato de usuario
            const incidencesBC = await contract.userViewIndividualIncidences();
            
            if (!incidencesBC) return [];

            const res = await Promise.all(incidencesBC.map(async (inc) => {
                const ipfsData = await fetchFromIPFS(inc.privateDataCID);
                let senderEmail = ipfsData.senderEmail || ""; 
                
                if (!senderEmail && inc.senderNameHash) {
                    try {
                        const userId = await usersContract.getIdByUserName(inc.senderNameHash);
                        if (userId.toString() !== "0") {
                            const userData = await usersContract.getUserById(userId);
                            const userProfile = await fetchFromIPFS(userData.userInfoCID);
                            if (!userProfile.error) senderEmail = userProfile.email;
                        }
                    } catch (err) {
                        console.warn("No se pudo recuperar email del contrato USERS", err);
                    }
                }

                return { id: Number(inc.id), priority: inc.priorityLevel, date: inc.date, cid: inc.privateDataCID, ...ipfsData, senderEmail: senderEmail };
            })); 
            return res.filter(i => i !== null);
        } catch (error) {
            console.error("Error al obtener incidencias del usuario:", error);
            return [];
        }
    },

    getGroupIncidences: async () => {
        try {
            const contract = await getContract('INCIDENCES', false);
            const usersContract = await getContract('USERS', false); // Misma razón que en la función anterior
            const incidencesBC = await contract.userViewGroupIncidences();
            if (!incidencesBC) return [];
            const res = await Promise.all(incidencesBC.map(async (inc) => {
                const ipfsData = await fetchFromIPFS(inc.privateDataCID);             
                let senderEmail = ipfsData.senderEmail || "";
                if (!senderEmail && inc.senderNameHash) {
                    try {
                        const userId = await usersContract.getIdByUserName(inc.senderNameHash);
                        if (userId.toString() !== "0") {
                            const userData = await usersContract.getUserById(userId);
                            const userProfile = await fetchFromIPFS(userData.userInfoCID);
                            if (!userProfile.error) senderEmail = userProfile.email;
                        }
                    } catch (e) {}
                }

                return { id: Number(inc.id), priority: inc.priorityLevel, date: inc.date, cid: inc.privateDataCID, ...ipfsData, senderEmail: senderEmail };
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
