import { ethers } from 'ethers';

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
    "function registerIncidence(string memory titleHash, string memory descriptionHash, string memory date, uint8 priorityLevel, string memory senderNameHash, string memory userReceiverHash, string memory groupReceiverHash, string memory privateDataCID) public",
    "function userViewIndividualIncidences() public view returns (tuple(uint id, string titleHash, string descriptionHash, string date, uint8 priorityLevel, string senderNameHash, string userReceiverHash, string groupReceiverHash, string privateDataCID)[])",
    "function userViewGroupIncidences() public view returns (tuple(uint id, string titleHash, string descriptionHash, string date, uint8 priorityLevel, string senderNameHash, string userReceiverHash, string groupReceiverHash, string privateDataCID)[])",
    "function removeRequest(uint requestId) public"
];

const ADMIN_REQUESTS_ABI = [
    "function createAdminRequest(address userWallet, string memory requestReason) public",
    "function viewRequests() public view returns (tuple(uint id, address userWallet, string requestReason)[])",
    "function removeRequest(uint requestId) public"
];

// Constantes para IPFS, configurar en otro momento si se quiere usar un servicio real de IPFS, por ahora se usan mocks para facilitar el desarrollo sin necesidad de una conexión real a IPFS
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY
const IPFS_UPLOAD_URL = process.env.REACT_APP_IPFS_UPLOAD_URL;

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT

const getContract = async (contractType, withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask no detectado");
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress = process.env[`REACT_APP_${contractType}_CONTRACT`];    
    if (!contractAddress) {
        throw new Error(`La  dirección del contrato ${contractType} no está configurada. Por favor, actualiza CONTRACT_ADDRESSES en web3Service.js`);
    }
    
    let abi;
    switch(contractType) {
        case 'USERS': abi = USERS_ABI; break;
        case 'GROUPS': abi = GROUPS_ABI; break;
        case 'REPORTS': abi = REPORTS_ABI; break;
        case 'INCIDENCES': abi = INCIDENCES_ABI; break;
        case 'ADMIN_REQUESTS': abi = ADMIN_REQUESTS_ABI; break;
        // No debería llegar aquí porque validamos arriba, pero por seguridad:
        default: throw new Error(`Tipo de contrato desconocido: ${contractType}`);
    }
    
    if (withSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(contractAddress, abi, signer);
    }
    return new ethers.Contract(contractAddress, abi, provider);
};

const uploadToIPFS = async (data, pinataJwt = null) => {
    try {
        if (!pinataJwt) {
            console.warn("IPFS upload: Using mock CID. Configure pinataJwt for real IPFS storage.");
            // Genera un CID simulado en formato válido para pruebas sin conexión real a IPFS
            const mockCID = "QmSimulated" + Math.random().toString(36).substring(2, 15).padEnd(15, '0');
            
            // Almacenar los datos en localStorage para poder recuperarlos después
            try {
                const mockStorage = JSON.parse(localStorage.getItem('mockIPFSStorage') || '{}');
                mockStorage[mockCID] = data;
                localStorage.setItem('mockIPFSStorage', JSON.stringify(mockStorage));
            } catch (e) {
                console.warn("Could not save to localStorage:", e);
            }
            
            return mockCID;
        }

        const response = await fetch(IPFS_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pinataJwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pinataContent: data
            })
        });

        if (!response.ok) {
            throw new Error(`IPFS upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw error;
    }
};


const fetchFromIPFS = async (cid) => {
    try {
        if (!cid || cid === "N/A" || cid === "") {
            return { error: "No CID provided" };
        }

        // Verificar si es un mock CID (comienza con QmSimulated)
        if (cid.startsWith("QmSimulated")) {
            try {
                const mockStorage = JSON.parse(localStorage.getItem('mockIPFSStorage') || '{}');
                if (mockStorage[cid]) {
                    return mockStorage[cid];
                }
            } catch (e) {
                console.warn("Could not read from localStorage:", e);
            }
            // Si no está en localStorage, devolver error
            return { error: "Mock CID data not found in local storage" };
        }

        const gatewayUrl = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
        const response = await fetch(`${gatewayUrl}${cid}`);
        if (!response.ok) {
            throw new Error(`Fallo al recuperar información de IPFS: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching CID ${cid} from IPFS:`, error);
        return { error: error.message };
    }
};

const hashValue = (value) => {
    return ethers.id(value);
};


export const Web3Service = {
    
    login: async () => {
        const contract = await getContract('USERS', true);  // Necesita signer para identificar al usuario
        try {
            const userBC = await contract.login();
            const cid = userBC.userInfoCID;
            console.log("CID recuperado de la Blockchain:", cid); // Mira qué sale aquí
            let ipfsData = { userName: "Usuario Desconocido", email: "" }; // Valores por defecto
            if (cid && cid !== "N/A" && cid !== "") {
                ipfsData = await fetchFromIPFS(cid);
                // Si hay error en IPFS, mantén los valores por defecto
                if (ipfsData.error) {
                    ipfsData = { userName: "Usuario Desconocido", email: "" };
                }
            }

            return {
                exists: true,
                uid: Number(userBC.uid),
                wallet: userBC.wallet,
                isBanned: userBC.isBanned,
                // Mapeo del Enum: 0 = COMUN, 1 = ADMINISTRADOR_SISTEMA
                role: userBC.condition === 1n ? 'Admin de Sistema' : 'Comun',
                condition: Number(userBC.condition),
                cid: cid,
                // Datos traídos de IPFS
                userName: ipfsData.userName, 
                email: ipfsData.email
            };
        } catch (e) {
            console.log("Usuario no registrado en el contrato.");
            return { exists: false };
        }
    },

    register: async (userName, email) => {
        const contract = await getContract('USERS', true);
        
        try {
            const userInfoData = {
                userName: userName,
                email: email
            };
            const cid = await uploadToIPFS(userInfoData, PINATA_JWT);
            
            const userNameHash = hashValue(userName);
            const emailHash = hashValue(email);

            const tx = await contract.registerUser(userNameHash, emailHash, cid);
            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash,
                cid: cid,
                message: "Usuario registrado exitosamente. Puedes iniciar sesión ahora."
            };
        } catch (error) {
            console.error("Error registrando al usuario:", error);
            throw error;
        }
    },


    deleteUser: async () => {
        const contract = await getContract('USERS', true);
        try {
            const tx = await contract.deleteUser();
            return await tx.wait();
        } catch (error) {
            console.error("Error eliminando al usuario:", error);
            throw error;
        }
    },

    blockUser: async (userNameToBlock) => {
        const contract = await getContract('USERS', true);
        try {
            const userNameHash = hashValue(userNameToBlock);
            const tx = await contract.blockUser(userNameHash);
            // No hace falta hacer nada con IPFS aquí porque el bloqueo es solo un cambio de estado en el contrato y es público
            return await tx.wait();
        } catch (error) {
            console.error("Error bloqueando al usuario:", error);
            throw error;
        }
    },

    // Este de aquí es una función auxiliar que puede ser util en algunos lugares del frontend
    getActualUser: async () => {
        const contract = await getContract('USERS', true);
        try {
            const userBC = await contract.getActualUser();
            const cid = userBC.userInfoCID;
            let ipfsData = { userName: "Usuario Desconocido", email: "" };
            if (cid && cid !== "N/A" && cid !== "") {
                ipfsData = await fetchFromIPFS(cid);
                if (ipfsData.error) {
                    ipfsData = { userName: "Usuario Desconocido", email: "" };
                }
            }

            return {
                exists: true,
                uid: Number(userBC.uid),
                wallet: userBC.wallet,
                isBanned: userBC.isBanned,
                // Mapeo del Enum: 0 = COMUN, 1 = ADMINISTRADOR_SISTEMA
                role: userBC.condition === 1n ? 'Admin de Sistema' : 'Comun',
                condition: Number(userBC.condition),
                cid: cid,
                // Datos traídos de IPFS
                userName: ipfsData.userName, 
                email: ipfsData.email
            };
        } catch (e) {
            console.log("Usuario no registrado en el contrato.");
            return { exists: false };
        }
    },

    giveUserAdminStatus: async (userAddress) => {
        const contract = await getContract('USERS', true);
        // Enviamos la dirección del usuario al contrato
        const tx = await contract.giveUserAdminStatus(userAddress);
        return await tx.wait();
    },

    createGroup: async (groupName, description = "") => {
        const contract = await getContract('GROUPS', true);
        try {
            const tx = await contract.createGroup(groupName, description);
            // Aquí no es necesario hacer nada con IPFS porque la información del grupo se almacena directamente en el contrato y es pública, no hay datos privados que ocultar. El nombre del grupo y su descripción se guardan como strings en el contrato, por lo que no requieren hashing ni almacenamiento en IPFS.
            return await tx.wait();
        } catch (error) {
            console.error("Error creando el grupo:", error);
            throw error;
        }
    },

    inviteUserToGroup: async (userNameToInvite) => {
        const contract = await getContract('GROUPS', true);
        try {
            // Aquí si hay que hashear porque el contrato usa una propiedad de user, la cual si es privada, por lo que el contrato no puede almacenar el nombre de usuario directamente, sino su hash. El contrato luego compara hashes para verificar invitaciones, por lo que es necesario hashear el nombre de usuario antes de enviarlo al contrato.
            const userNameHash = hashValue(userNameToInvite);
            const tx = await contract.inviteUserToGroup(userNameHash);
            return await tx.wait();
        } catch (error) {
            console.error("Error inviting user to group:", error);
            throw error;
        }
    },

    joinGroup: async (groupName) => {
        const contract = await getContract('GROUPS', true);
        try {
            const tx = await contract.userJoined(groupName);
            return await tx.wait();
        } catch (error) {
            console.error("Error joining group:", error);
            throw error;
        }
    },

    removeUserFromGroup: async (userNameToRemove) => {
        const contract = await getContract('GROUPS', true);
        try {
            // Volvemos a la misma casuistica de inviteUserToGroup, el contrato no puede almacenar el nombre de usuario directamente porque es privado, por lo que se almacena su hash. Para eliminar a un usuario del grupo, el contrato necesita comparar el hash del nombre de usuario con los hashes almacenados, por lo que es necesario hashear el nombre de usuario antes de enviarlo al contrato para su eliminación.
            const userNameHash = hashValue(userNameToRemove);
            const tx = await contract.deleteUserFromGroup(userNameHash);
            return await tx.wait();
        } catch (error) {
            console.error("Error removing user from group:", error);
            throw error;
        }
    },

    deleteGroup: async () => {
        const contract = await getContract('GROUPS', true);
        try {
            const tx = await contract.deleteGroup();
            return await tx.wait();
        } catch (error) {
            console.error("Error deleting group:", error);
            throw error;
        }
    },

    getGroupMembers: async (groupId) => {
        const contract = await getContract('GROUPS', true);
        try {
            const members = await contract.getGroupMembers(groupId);
            return members;
        } catch (error) {
            console.error("Error fetching group members:", error);
            throw error;
        }
    },

    getActualGroup: async () => {
        const contract = await getContract('GROUPS', true);
        try {
            const groupId = await contract.getGroupIdByUserWallet(window.ethereum.selectedAddress);
            if (groupId.toString() === "0") {
                return null;
            }
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
            console.error("Error fetching actual group:", error);
            throw error;
        }
    },

    getMembersInfo: async (memberIds) => {
        const contract = await getContract('USERS', true);
        const members = [];
        
        for (const memberId of memberIds) {
            try {
                const userData = await contract.getUserById(memberId);
                const cid = userData.userInfoCID;
                let userInfo = { userName: "Usuario Desconocido", email: "" };
                
                if (cid && cid !== "N/A" && cid !== "") {
                    userInfo = await fetchFromIPFS(cid);
                    if (userInfo.error) {
                        userInfo = { userName: "Usuario Desconocido", email: "" };
                    }
                }
                
                members.push({
                    uid: memberId,
                    wallet: userData.wallet,
                    userName: userInfo.userName,
                    email: userInfo.email,
                    isBanned: userData.isBanned
                });
            } catch (err) {
                console.warn(`Error fetching user ${memberId}:`, err);
            }
        }
        
        return members;
    },

    createBugReport: async (userSender, title, description, proofs) => {
        const contract = await getContract('REPORTS', true);
        try {
            // Prepara los datos para IPFS (toda la información sensible o muy costosa de almacenar en blockchain se guarda en IPFS, y solo se guarda el hash de esa información en el contrato para referencia)
            const reportData = {
                userSender: userSender,
                title: title,
                description: description,
                proofs: proofs
            };
            const cid = await uploadToIPFS(reportData, PINATA_JWT);

            const senderHash = hashValue(userSender);
            const titleHash = hashValue(title);
            const descriptionHash = hashValue(description);
            const proofsHash = hashValue(proofs);

            const tx = await contract.createBugReport(senderHash, descriptionHash, titleHash, proofsHash, cid);
            return await tx.wait();
        } catch (error) {
            console.error("Error creating bug report:", error);
            throw error;
        }
    },


    createUserReport: async (userSender,userNameToReport, email, description, proofs) => {
        const contract = await getContract('REPORTS', true);
        try {
            const reportData = {
                userSender: userSender,
                userNameReported: userNameToReport,
                email: email,
                description: description,
                proofs: proofs
            };
            const cid = await uploadToIPFS(reportData, PINATA_JWT);

            const senderHash = hashValue(userSender);
            const descriptionHash = hashValue(description);
            const userNameHash = hashValue(userNameToReport);
            const emailHash = hashValue(email);
            const proofsHash = hashValue(proofs);

            const tx = await contract.createUserReport(senderHash, descriptionHash, userNameHash, emailHash, proofsHash, cid);
            return await tx.wait();
        } catch (error) {
            console.error("Error creating user report:", error);
            throw error;
        }
    },

    viewSortedBugReports: async () => {
        const contract = await getContract('REPORTS', false);

        try {
            const reportsBC = await contract.viewSortedBugReports();
            const reports = await Promise.all(
                reportsBC.map(async (report) => {
                    const ipfsData = await fetchFromIPFS(report.userReportCID);
                    return {
                        id: Number(report.id),
                        type: 'BUG_REPORT',
                        sender: ipfsData.sender,
                        title: ipfsData.title,
                        description: ipfsData.description,
                        proofs: ipfsData.proofs,
                        cid: report.userReportCID,
                        ...ipfsData
                    };
                })
            );
            return reports;
        } catch (error) {
            console.error("Error fetching sorted bug reports:", error);
            throw error;
        }
    },

    removeUserReport: async (reportId) => {
        try {
            const contract = await getContract('REPORTS', true);
            const tx = await contract.removeUserReport(reportId);
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar reporte de usuario:", error);
            throw error;
        }
    },

    removeBugReport: async (reportId) => {
        try {
            const contract = await getContract('REPORTS', true);
            const tx = await contract.removeBugReport(reportId);
            return await tx.wait();
        } catch (error) {
            console.error("Error al eliminar reporte de bug:", error);
            throw error;
        }
    },

    viewSortedUserReports: async () => {
        const contract = await getContract('REPORTS', false);
        try {
            const reportsBC = await contract.viewSortedUserReports();
            const reports = await Promise.all(
                reportsBC.map(async (report) => {
                    const ipfsData = await fetchFromIPFS(report.userReportCID);
                    return {
                        id: Number(report.id),
                        type: 'USER_REPORT',
                        sender: ipfsData.userSender,
                        userNameReported: ipfsData.userNameReported,
                        email: ipfsData.email,
                        description: ipfsData.description,
                        proofs: ipfsData.proofs,
                        cid: report.userReportCID,
                        ...ipfsData
                    };
                }
            ));
            return reports;
        } catch (error) {
            console.error("Error fetching sorted user reports:", error);
            throw error;
        }    
    },


    registerIncidence: async (title, description, priority, userReceiver = "", groupReceiver = "", userDate = "", senderUserName = "") => {
        const contract = await getContract('INCIDENCES', true);
        try {
            
            const incidenceData = {
                title: title,
                description: description,
                priority: priority,
                createdAt: userDate,
                senderUserName: senderUserName,
                userReceiver: userReceiver,
                groupReceiver: groupReceiver
            };
            const cid = await uploadToIPFS(incidenceData, PINATA_JWT);

            const titleHash = hashValue(title);
            const descriptionHash = hashValue(description);
            const senderNameHash =  hashValue(senderUserName);
            const userReceiverHash = userReceiver ? hashValue(userReceiver) : "";
            const groupReceiverHash = groupReceiver ? hashValue(groupReceiver) : "";
            const date = userDate || new Date().toISOString().split('T')[0];

            const tx = await contract.registerIncidence(
                titleHash,
                descriptionHash,
                date,
                priority,
                senderNameHash,
                userReceiverHash,
                groupReceiverHash,
                cid
            );
            return await tx.wait();
        } catch (error) {
            console.error("Error registering incidence:", error);
            throw error;
        }
    },

    getUserIncidences: async () => {
        const contract = await getContract('INCIDENCES', false);
        try {
            console.log("Obteniendo incidencias del usuario...");
            const incidencesBC = await contract.userViewIndividualIncidences();
            console.log("Incidencias recibidas del contrato:", incidencesBC);
            
            if (!incidencesBC || incidencesBC.length === 0) {
                console.log("No hay incidencias");
                return [];
            }
            
            const incidences = await Promise.all(
                incidencesBC.map(async (inc, index) => {
                    try {
                        console.log(`Procesando incidencia ${index}:`, inc);
                        const ipfsData = await fetchFromIPFS(inc.privateDataCID);
                        console.log(`Datos IPFS para incidencia ${index}:`, ipfsData);
                        
                        return {
                            id: Number(inc.id),
                            title: ipfsData.title || "Sin título",
                            description: ipfsData.description || "",
                            priority: inc.priorityLevel,
                            date: inc.date,
                            cid: inc.privateDataCID,
                            ...ipfsData
                        };
                    } catch (err) {
                        console.error(`Error procesando incidencia ${index}:`, err);
                        return null;
                    }
                })
            );
            
            const validIncidences = incidences.filter(inc => inc !== null);
            console.log("Incidencias procesadas:", validIncidences);
            return validIncidences;
        } catch (error) {
            console.error("Error getting user incidences:", error);
            console.error("Error details:", error.message);
            return [];
        }
    },

    getGroupIncidences: async () => {
        const contract = await getContract('INCIDENCES', false);
        try {
            console.log("Obteniendo incidencias del grupo...");
            const incidencesBC = await contract.userViewGroupIncidences();
            console.log("Incidencias del grupo recibidas del contrato:", incidencesBC);
            
            if (!incidencesBC || incidencesBC.length === 0) {
                console.log("No hay incidencias de grupo");
                return [];
            }
            
            const incidences = await Promise.all(
                incidencesBC.map(async (inc, index) => {
                    try {
                        console.log(`Procesando incidencia de grupo ${index}:`, inc);
                        const ipfsData = await fetchFromIPFS(inc.privateDataCID);
                        console.log(`Datos IPFS para incidencia de grupo ${index}:`, ipfsData);
                        
                        return {
                            id: Number(inc.id),
                            title: ipfsData.title || "Sin título",
                            description: ipfsData.description || "",
                            priority: inc.priorityLevel,
                            date: inc.date,
                            cid: inc.privateDataCID,
                            ...ipfsData
                        };
                    } catch (err) {
                        console.error(`Error procesando incidencia de grupo ${index}:`, err);
                        return null;
                    }
                })
            );
            
            const validIncidences = incidences.filter(inc => inc !== null);
            console.log("Incidencias de grupo procesadas:", validIncidences);
            return validIncidences;
        } catch (error) {
            console.error("Error getting group incidences:", error);
            console.error("Error details:", error.message);
            return [];
        }
    },



    createAdminRequest: async (requestReason) => {
        const contract = await getContract('ADMIN_REQUESTS', true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userWallet = await signer.getAddress();

            const tx = await contract.createAdminRequest(userWallet, requestReason);
            return await tx.wait();
        } catch (error) {
            console.error("Error creating admin request:", error);
            throw error;
        }
    },

    viewAdminRequests: async () => {
        const contract = await getContract('ADMIN_REQUESTS', false);
        try {
            const requests = await contract.viewRequests();
            return requests.map(req => ({
                id: Number(req.id),
                userWallet: req.userWallet,
                requestReason: req.requestReason
            }));
        } catch (error) {
            console.error("Error viewing admin requests:", error);
            return [];
        }
    },

    removeAdminRequest: async (requestId) => {
        const contract = await getContract('ADMIN_REQUESTS', true);
        try {
            const tx = await contract.removeRequest(requestId);
            return await tx.wait();
        } catch (error) {
            console.error("Error removing admin request:", error);
            throw error;
        }
    },

    // Exports de funciones que pueden tener utilidad para otros componentes
    hashValue,
    uploadToIPFS,
    fetchFromIPFS,
    IPFS_GATEWAY
};
