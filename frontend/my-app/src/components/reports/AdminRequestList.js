import React from 'react';
import { Table, Button, Card, Container } from 'react-bootstrap';

const AdminRequestList = ({ requests, onAccept, onDecline }) => {
    return (
        <Container className="py-4">
            <h3 className="fw-bold mb-4">Gestión de Solicitud de Administrador</h3>
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Usuario</th>
                            <th>Wallet</th>
                            <th>Motivo (Request Reason)</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-4 text-muted">No hay solicitudes pendientes.</td></tr>
                        ) : (
                            requests.map((req, idx) => (
                                <tr key={idx}>
                                    <td><strong>{req.userName}</strong></td>
                                    <td><code>{req.wallet}</code></td>
                                    <td>{req.requestReason}</td>
                                    <td className="text-end">
                                        <Button 
                                            variant="success" 
                                            size="sm" 
                                            className="me-2 fw-bold"
                                            onClick={() => onAccept(req.wallet)}
                                        >
                                            Ascender
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => onDecline(req.wallet)}
                                        >
                                            Declinar
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </Container>
    );
};

export default AdminRequestList;
