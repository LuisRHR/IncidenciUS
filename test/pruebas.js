const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Suite Completa de Auditoría y Consumo de Gas - Sistema IncidenciUS", function () {
  let Users, Groups, Incidences, Reports, AdminRequests;
  let users, groups, incidences, reports, adminRequests;
  let adminSys, userA, userB, externalUser;

  const hashUserA = ethers.keccak256(ethers.toUtf8Bytes("usuarioA"));
  const hashUserB = ethers.keccak256(ethers.toUtf8Bytes("usuarioB"));
  const hashEmailA = ethers.keccak256(ethers.toUtf8Bytes("userA@test.com"));
  const hashEmailB = ethers.keccak256(ethers.toUtf8Bytes("userB@test.com"));
  const hashTitle = ethers.keccak256(ethers.toUtf8Bytes("Fallo en red"));
  const hashDesc = ethers.keccak256(ethers.toUtf8Bytes("No conecta al servidor de base de datos"));

  beforeEach(async function () {
    [adminSys, userA, userB, externalUser] = await ethers.getSigners();

    Users = await ethers.getContractFactory("Users");
    users = await Users.deploy();
    await users.waitForDeployment();

    Groups = await ethers.getContractFactory("Groups");
    groups = await Groups.deploy(await users.getAddress());
    await groups.waitForDeployment();

    Incidences = await ethers.getContractFactory("Incidences");
    incidences = await Incidences.deploy(await users.getAddress(), await groups.getAddress());
    await incidences.waitForDeployment();

    Reports = await ethers.getContractFactory("Reports");
    reports = await Reports.deploy(await users.getAddress());
    await reports.waitForDeployment();

    AdminRequests = await ethers.getContractFactory("AdminRequests");
    adminRequests = await AdminRequests.deploy();
    await adminRequests.waitForDeployment();

    await users.connect(adminSys).registerUser(
      ethers.keccak256(ethers.toUtf8Bytes("admin")), 
      ethers.keccak256(ethers.toUtf8Bytes("admin@test.com")), 
      "QmAdminCID", 
      "0xPubKeyAdmin"
    );
  });

  describe("1. Contrato Users.sol", function () {
    it("Debería registrar un usuario común", async function () {
      await expect(users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA"))
        .to.not.be.reverted;
      const uid = await users.getIdByWallet(userA.address);
      expect(uid).to.equal(2);
    });

    it("REVERT: No debería permitir el registro duplicado de una misma wallet", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await expect(
        users.connect(userA).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB")
      ).to.be.revertedWith("Usuario ya registrado con esta wallet");
    });

    it("REVERT: No debería permitir registrar un nombre de usuario duplicado", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await expect(
        users.connect(userB).registerUser(hashUserA, hashEmailB, "QmUserBCID", "0xPubKeyB")
      ).to.be.revertedWith("Usuario ya registrado con este nombre");
    });

    it("REVERT: No debería permitir registrar un correo electrónico duplicado", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await expect(
        users.connect(userB).registerUser(hashUserB, hashEmailA, "QmUserBCID", "0xPubKeyB")
      ).to.be.revertedWith("Usuario ya registrado con este correo");
    });

    it("REVERT: No debería permitir el login a un usuario no registrado", async function () {
      await expect(
        users.connect(externalUser).login()
      ).to.be.revertedWith("Usuario no registrado");
    });

    it("REVERT: No debería otorgar el estatus de administrador si el invocador no es administrador", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(userB).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB");
      await expect(
        users.connect(userA).giveUserAdminStatus(userB.address)
      ).to.be.revertedWith("No tienes permisos para ascender usuarios");
    });

    it("REVERT: No debería permitir ascender a quien ya ostenta el rol de administrador", async function () {
      await expect(
        users.connect(adminSys).giveUserAdminStatus(adminSys.address)
      ).to.be.revertedWith("El usuario ya es admin");
    });

    it("Debería permitir a un usuario eliminar su propia cuenta", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await expect(users.connect(userA).deleteUser())
        .to.not.be.reverted;
      const uid = await users.getIdByWallet(userA.address);
      expect(uid).to.equal(0);
    });

    it("REVERT: No debería permitir eliminar la cuenta si no está registrada previamente", async function () {
      await expect(
        users.connect(externalUser).deleteUser()
      ).to.be.revertedWith("Usuario no registrado");
    });

    it("Debería permitir al administrador del sistema bloquear a un usuario", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await expect(users.connect(adminSys).blockUser(hashUserA))
        .to.not.be.reverted;
      const userData = await users.getUserById(2);
      expect(userData.isBanned).to.be.true;
    });

    it("REVERT: No debería permitir el login a un usuario bloqueado", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(adminSys).blockUser(hashUserA);
      await expect(
        users.connect(userA).login()
      ).to.be.revertedWith("Usuario bloqueado");
    });

    it("REVERT: No debería permitir a un administrador bloquearse a sí mismo", async function () {
      const hashAdmin = ethers.keccak256(ethers.toUtf8Bytes("admin"));
      await expect(
        users.connect(adminSys).blockUser(hashAdmin)
      ).to.be.revertedWith("No puedes bloquearte a ti mismo");
    });

    it("REVERT: No debería permitir bloquear a un usuario que no existe en el sistema", async function () {
      const hashInexistente = ethers.keccak256(ethers.toUtf8Bytes("inexistente"));
      await expect(
        users.connect(adminSys).blockUser(hashInexistente)
      ).to.be.revertedWith("Usuario a bloquear no registrado");
    });

    it("REVERT: No debería permitir bloquear usuarios si el invocador carece del rol administrador", async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(userB).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB");
      await expect(
        users.connect(userA).blockUser(hashUserB)
      ).to.be.revertedWith("No tienes permisos para bloquear usuarios");
    });
  });

  describe("2. Contrato UserGroups.sol (Groups)", function () {
    beforeEach(async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(userB).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB");
    });

    it("Debería permitir crear un grupo correctamente", async function () {
      await expect(groups.connect(userA).createGroup("DevTeam", "Equipo de desarrollo Core", "0xEncryptedAdminKey"))
        .to.not.be.reverted;
      const groupId = await groups.getGroupIdByAdminWallet(userA.address);
      expect(groupId).to.equal(1);
    });

    it("Debería invitar a un usuario al grupo", async function () {
      await groups.connect(userA).createGroup("DevTeam", "Equipo de desarrollo Core", "0xEncryptedAdminKey");
      await expect(groups.connect(userA).inviteUserToGroup(hashUserB, "0xEncryptedKeyForUserB"))
        .to.not.be.reverted;
    });

    it("Debería permitir al usuario unirse tras recibir una invitación válida", async function () {
      await groups.connect(userA).createGroup("DevTeam", "Equipo de desarrollo Core", "0xEncryptedAdminKey");
      await groups.connect(userA).inviteUserToGroup(hashUserB, "0xEncryptedKeyForUserB");
      await expect(groups.connect(userB).userJoined("DevTeam"))
        .to.not.be.reverted;
      const userBGroupId = await groups.getGroupIdByUserWallet(userB.address);
      expect(userBGroupId).to.equal(1);
    });
  });

  describe("3. Contrato Incidences.sol", function () {
    beforeEach(async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(userB).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB");
      await groups.connect(userA).createGroup("DevTeam", "Equipo de desarrollo Core", "0xEncryptedAdminKey");
    });

    it("Debería registrar una incidencia dirigida a un usuario de forma individual", async function () {
      await expect(
        incidences.connect(userA).registerIncidence(
          hashTitle, hashDesc, "2026-06-15", 1, 
          hashUserA, hashUserB, "", ethers.ZeroHash,
          "QmPrivateDataCID", "0xEncAESKey", "0xSenderEncKey"
        )
      ).to.not.be.reverted;
    });

    it("Debería actualizar el estado de una incidencia", async function () {
      await incidences.connect(userA).registerIncidence(
        hashTitle, hashDesc, "2026-06-15", 1,
        hashUserA, hashUserB, "", ethers.ZeroHash,
        "QmPrivateDataCID", "0xEncAESKey", "0xSenderEncKey"
      );

      await expect(incidences.connect(userA).updateIncidenceStatus(1, 1))
        .to.emit(incidences, "IncidenceStatusChanged")
        .withArgs(1, 1, userA.address);

      const incData = await incidences.incidences(1);
      expect(incData.status).to.equal(1);
    });
  });

  describe("4. Contrato Reports.sol", function () {
    beforeEach(async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
      await users.connect(userB).registerUser(hashUserB, hashEmailB, "QmUserBCID", "0xPubKeyB");
    });

    it("Debería crear un reporte de bug distribuyendo llaves criptográficas", async function () {
      const hashBugTitle = ethers.keccak256(ethers.toUtf8Bytes("Bug Desbordamiento"));
      const hashBugDesc = ethers.keccak256(ethers.toUtf8Bytes("Fallo critico en modulo de control"));
      const hashProofs = ethers.keccak256(ethers.toUtf8Bytes("0xEvidenciaBytes"));

      await expect(
        reports.connect(userA).createBugReport(
          hashUserA, hashBugDesc, hashBugTitle, hashProofs, "QmBugReportCID",
          [adminSys.address], ["0xKeyEncryptedForAdminSys"]
        )
      ).to.not.be.reverted;
    });

    it("REVERT: No debería permitir crear un reporte de bug si la longitud de los arrays no coincide", async function () {
      const hashBugTitle = ethers.keccak256(ethers.toUtf8Bytes("Bug"));
      await expect(
        reports.connect(userA).createBugReport(
          hashUserA, hashUserA, hashBugTitle, hashUserA, "QmBugReportCID",
          [adminSys.address], []
        )
      ).to.be.revertedWith("Arrays de admins y llaves deben coincidir");
    });

    it("Debería permitir al administrador del sistema eliminar el reporte de bug", async function () {
      const hashBugTitle = ethers.keccak256(ethers.toUtf8Bytes("Bug Desbordamiento"));
      const hashBugDesc = ethers.keccak256(ethers.toUtf8Bytes("Fallo critico en modulo de control"));
      const hashProofs = ethers.keccak256(ethers.toUtf8Bytes("0xEvidenciaBytes"));

      await reports.connect(userA).createBugReport(
        hashUserA, hashBugDesc, hashBugTitle, hashProofs, "QmBugReportCID",
        [adminSys.address], ["0xKeyEncryptedForAdminSys"]
      );

      await expect(reports.connect(adminSys).removeBugReport(1))
        .to.not.be.reverted;

      const bugDeletedData = await reports.bugReports(1);
      expect(bugDeletedData.id).to.equal(0);
    });

    it("REVERT: Debería denegar la eliminación de un reporte de bug si el invocador carece del rol administrador", async function () {
      const hashBugTitle = ethers.keccak256(ethers.toUtf8Bytes("Bug"));
      await reports.connect(userA).createBugReport(hashUserA, hashUserA, hashBugTitle, hashUserA, "QmCID", [adminSys.address], ["0xKey"]);

      await expect(
        reports.connect(userA).removeBugReport(1)
      ).to.be.revertedWith("No tienes permisos para realizar esta accion");
    });

    it("Debería crear y eliminar reportes de usuario con el orden de parámetros correcto", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      const hashReportProofs = ethers.keccak256(ethers.toUtf8Bytes("0xPruebasUser"));

      await expect(
        reports.connect(userA).createUserReport(
          hashUserA,
          hashReportDesc,
          hashUserB,
          hashEmailB,
          hashReportProofs,
          "QmUserReportCID",
          [adminSys.address],
          ["0xKeyEncryptedUserReport"]
        )
      ).to.not.be.reverted;

      await expect(reports.connect(adminSys).removeUserReport(1))
        .to.not.be.reverted;

      const reportDeletedData = await reports.userReports(1);
      expect(reportDeletedData.id).to.equal(0);
    });

    it("REVERT: No debería permitir crear un reporte de usuario si la longitud de los arrays difiere", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      await expect(
        reports.connect(userA).createUserReport(
          hashUserA, hashReportDesc, hashUserB, hashEmailB, hashUserA, "QmCID", [adminSys.address], []
        )
      ).to.be.revertedWith("Arrays de admins y llaves deben coincidir");
    });

    it("REVERT: No debería permitir crear un reporte de usuario si el emisor no está registrado", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      await expect(
        reports.connect(externalUser).createUserReport(
          hashUserA, hashReportDesc, hashUserB, hashEmailB, hashUserA, "QmCID", [adminSys.address], ["0xKey"]
        )
      ).to.be.revertedWith("Debes estar registrado para reportar");
    });

    it("REVERT: No debería permitir a un usuario reportarse a sí mismo por coincidencia de nombre", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      await expect(
        reports.connect(userA).createUserReport(
          hashUserA, hashReportDesc, hashUserA, hashEmailB, hashUserA, "QmCID", [adminSys.address], ["0xKey"]
        )
      ).to.be.revertedWith("No puedes reportarte a ti mismo");
    });

    it("REVERT: No debería permitir a un usuario reportarse a sí mismo por coincidencia de correo electrónico", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      await expect(
        reports.connect(userA).createUserReport(
          hashUserA, hashReportDesc, hashUserB, hashEmailA, hashUserA, "QmCID", [adminSys.address], ["0xKey"]
        )
      ).to.be.revertedWith("No puedes reportarte a ti mismo");
    });

    it("REVERT: Debería denegar la eliminación de un reporte de usuario si el invocador carece del rol administrador", async function () {
      const hashReportDesc = ethers.keccak256(ethers.toUtf8Bytes("Comportamiento inapropiado"));
      await reports.connect(userA).createUserReport(
        hashUserA, hashReportDesc, hashUserB, hashEmailB, hashUserA, "QmCID", [adminSys.address], ["0xKey"]
      );
      await expect(
        reports.connect(userA).removeUserReport(1)
      ).to.be.revertedWith("No tienes permisos para realizar esta accion");
    });

    it("REVERT: No debería permitir ver la lista ordenada de reportes de bugs a un usuario común", async function () {
      await expect(
        reports.connect(userA).viewSortedBugReports()
      ).to.be.revertedWith("Acceso denegado: Se requiere rol de Administrador");
    });

    it("REVERT: No debería permitir ver la lista ordenada de reportes de usuarios a un usuario común", async function () {
      await expect(
        reports.connect(userA).viewSortedUserReports()
      ).to.be.revertedWith("Acceso denegado: Se requiere rol de Administrador");
    });
  });

  describe("5. Contrato AdminRequests.sol", function () {
    beforeEach(async function () {
      await users.connect(userA).registerUser(hashUserA, hashEmailA, "QmUserACID", "0xPubKeyA");
    });

    it("Debería crear una solicitud de administración correctamente", async function () {
      const razon = "Asignación de rol para soporte de auditoría interna de infraestructura";
      
      await expect(adminRequests.connect(userA).createAdminRequest(userA.address, razon))
        .to.not.be.reverted;

      const requests = await adminRequests.viewRequests();
      expect(requests[0].userWallet).to.equal(userA.address);
      expect(requests[0].requestReason).to.equal(razon);
    });

    it("Debería permitir la eliminación de una solicitud abierta", async function () {
      await adminRequests.connect(userA).createAdminRequest(userA.address, "Solicitud para revision");
      
      await expect(adminRequests.connect(adminSys).removeRequest(1))
        .to.not.be.reverted;

      const currentRequestId = await adminRequests.walletToRequestId(userA.address);
      expect(currentRequestId).to.equal(0);
    });
  });
});