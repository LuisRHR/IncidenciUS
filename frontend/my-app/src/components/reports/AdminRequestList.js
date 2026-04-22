import React, { useState } from 'react';
import { Table, Button, Card, Container, Spinner, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const AdminRequestList = ({ requests, onAcceptSuccess, onDecline }) => {
    const [processingWallet, setProcessingWallet] = useState(null);
    const [error, setError] = useState(null);

    const handleAccept = async (wallet) => {
        setProcessingWallet(wallet);
        setError(null);
        try {
            // El contrato debe de tener la lógica.
            await Web3Service.giveUserAdminStatus(); 
            onAcceptSuccess(wallet);
        } catch (err) {
            setError("Error en Blockchain: " + (err.message || "No se pudo ascender al usuario"));
        } finally {
            setProcessingWallet(null);
        }
    };

    return (
        <Container className="py-4">
            <h3 className="fw-bold mb-4">Gestión de Solicitudes de Administrador</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Usuario</th>
                            <th>Wallet</th>
                            <th>Motivo</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-4 text-muted">No hay solicitudes pendientes.</td></tr>
                        ) : (
                            requests.map((req, idx) => (
                                <tr key={req.wallet || idx}>
                                    <td><strong>{req.userName}</strong></td>
                                    <td><code>{req.wallet}</code></td>
                                    <td>{req.requestReason}</td>
                                    <td className="text-end">
                                        <Button variant="success" size="sm" className="me-2 fw-bold" disabled={processingWallet === req.wallet} onClick={() => handleAccept(req.wallet)}>
                                            {processingWallet === req.wallet ? <Spinner size="sm" animation="border" /> : "Ascender"}
                                        </Button>
                                        <Button variant="outline-danger" size="sm" disabled={processingWallet === req.wallet} onClick={() => onDecline(req.wallet)}>
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
