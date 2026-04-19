import React, { useState } from 'react';
import { Table, Button, Badge, Card, Form, InputGroup } from 'react-bootstrap';

//Implementa logica de invitar a usuario y eliminar usuarios del grupo 

const GroupManagement = ({ groupName, members, onRemove, onInvite }) => {
  const [searchName, setSearchName] = useState('');

  const handleInvite = (e) => {
    e.preventDefault();
    if (searchName.trim()) {
      onInvite(searchName);
      setSearchName('');
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-4">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">Gestión de {groupName}</h3>
            <p className="text-muted small">Añade nuevos miembros por su nombre de usuario.</p>
          </div>
        </div>

        <Form onSubmit={handleInvite} className="mb-4">
          <InputGroup>
            <Form.Control
              placeholder="Nombre de usuario (ej: Juan_Dev)..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <Button variant="primary" type="submit">
              Invitar al Grupo
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
            {members.map((member) => (
              <tr key={member.wallet}>
                <td><strong>{member.userName}</strong></td>
                <td><code className="small">{member.wallet.substring(0,15)}...</code></td>
                <td className="text-end">
                  <Button variant="link" className="text-danger p-0" onClick={() => onRemove(member.wallet)}>
                    Expulsar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default GroupManagement;
