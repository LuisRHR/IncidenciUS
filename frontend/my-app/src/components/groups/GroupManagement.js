import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const GroupManagement = ({ groupName, members, onMemberRemoved, onGroupDeleted }) => {
  const [searchName, setSearchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [membersInfo, setMembersInfo] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const fetchMembersInfo = async () => {
      if (!members || members.length === 0) {
        setMembersInfo([]);
        return;
      }

      setLoadingMembers(true);
      try {
        if (typeof members[0] === 'number') {
          const infos = await Web3Service.getMembersInfo(members);
          setMembersInfo(infos);
        } else {
          setMembersInfo(members);
        }
      } catch (err) {
        console.error("Error fetching members info:", err);
        setMembersInfo([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembersInfo();
  }, [members]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await Web3Service.inviteUserToGroup(searchName);
      setSuccess(`${searchName} ha sido invitado al grupo exitosamente.`);
      setSearchName('');
    } catch (err) {
      setError(err.message || "Error al invitar al usuario. Verifica que exista.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userName) => {
    if (!window.confirm(`¿Estás seguro de expulsar a ${userName}?`)) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await Web3Service.removeUserFromGroup(userName);
      setSuccess(`Usuario ${userName} expulsado del grupo.`);
      onMemberRemoved(userName);
    } catch (err) {
      setError(err.message || "Error al expulsar al miembro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el grupo ${groupName}? Esta acción no se puede deshacer.`)) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await Web3Service.deleteGroup(groupName);
      setSuccess(`Grupo ${groupName} eliminado exitosamente.`);
      onGroupDeleted();
    } catch (err) {
      setError(err.message || "Error al eliminar el grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-4">
      <Card.Header className="bg-white py-3">
        <h5 className="mb-0 fw-bold">Gestionar Grupo: {groupName}</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleInvite} className="mb-4">
          <Form.Label className="small fw-bold text-muted">Invitar nuevo miembro (Nombre de usuario)</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="Nombre del usuario..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              disabled={isSubmitting}
            />
            <Button variant="primary" type="submit" disabled={isSubmitting || !searchName.trim()}>
              {isSubmitting ? <Spinner size="sm" animation="border" /> : "Invitar"}
            </Button>
          </InputGroup>
        </Form>

        <Table hover responsive align="middle">
          <thead className="table-light">
            <tr>
              <th>Miembro</th>
              <th>Wallet</th>
              <th className="text-end">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loadingMembers ? (
              <tr><td colSpan="3" className="text-center text-muted py-4"><Spinner size="sm" animation="border" className="me-2" /> Cargando miembros...</td></tr>
            ) : membersInfo.length === 0 ? (
              <tr><td colSpan="3" className="text-center text-muted py-4">No hay miembros en el grupo aún</td></tr>
            ) : (
              membersInfo.map((member) => (
                <tr key={member.wallet || member.uid}>
                  <td><strong>{member.userName}</strong></td>
                  <td><code className="small">{member.wallet ? member.wallet.substring(0, 15) : 'N/A'}...</code></td>
                  <td className="text-end">
                    <Button 
                      variant="link" 
                      className="text-danger p-0" 
                      onClick={() => handleRemove(member.userName)}
                      disabled={isSubmitting}
                    >
                      Expulsar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => handleDeleteGroup()} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" animation="border" /> : "Eliminar Grupo"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default GroupManagement;
