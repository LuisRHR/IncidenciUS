// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UsersModule", (m) => {
  const users = m.contract("Users")
  const usergroups = m.contract("Groups", [users])
  const incidences = m.contract("Incidences", [users, usergroups])
  const reports = m.contract("Reports", [users])
  const adminrequests = m.contract("AdminRequests")

  return { users, incidences, reports, usergroups, adminrequests };
});