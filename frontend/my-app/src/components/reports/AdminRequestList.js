import React, { useCallback, useState } from 'react';
import { Table, Button, Card, Container, Spinner, Alert, Badge } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const AdminRequestList = ({ onAcceptSuccess, onDecline }) => {
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [requests, setRequests] = useState([]);
    
    const loadRequests = useCallback(async () => {
        setError(null);
        try {
            const reqs = await Web3Service.viewAdminRequests();
            setRequests(reqs || []);
        } catch (err) {
            console.error("Error loading admin requests:", err);
            setError("Error al cargar las solicitudes de administrador. Intenta de nuevo.");
            setRequests([]);
        }
    }, []);

    React.useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAccept = async (req) => {
        if (!req.userWallet) {
            setError("La wallet del usuario no es válida.");
            return;
        }

        setProcessingId(req.id);
        setError(null);
        setSuccess(null);
        
        try {
            await Web3Service.giveUserAdminStatus(req.userWallet); 
            await Web3Service.removeAdminRequest(req.id);
            
            setSuccess(`Usuario ${req.userWallet.substring(0,8)}... ascendido a Administrador.`);
            setRequests(prev => prev.filter(r => r.id !== req.id && req.id!==0));
        } catch (err) {
            console.error("Error en el proceso de ascenso:", err);
            setError("Error en Blockchain: " + (err.message || "No se pudo completar el proceso"));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (req) => {
        if (!window.confirm("¿Estás seguro de que quieres denegar esta solicitud?")) return;

        setProcessingId(req.id);
        setError(null);
        setSuccess(null);
        try {
            await Web3Service.removeAdminRequest(req.id);
            
            setSuccess(`Petición denegada correctamente.`);
            setRequests(prev => prev.filter(r => r.id !== req.id && req.id!==0));
        } catch (err) {
            setError("Error al eliminar la petición: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };
    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Gestión de Solicitudes</h3>
                <Button variant="light" onClick={onDecline} className="btn-sm">← Volver al Panel</Button>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Wallet Solicitante</th>
                            <th>Motivo</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-4 text-muted">No hay solicitudes pendientes.</td></tr>
                        ) : (
                            requests.map((req, idx) => (
                                <tr key={req.id || idx}>
                                    <td><Badge bg="secondary">#{req.id}</Badge></td>
                                    <td><code className="small">{req.userWallet}</code></td>
                                    <td><small>{req.requestReason}</small></td>
                                    <td className="text-end">
                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button 
                                                variant="success" 
                                                size="sm" 
                                                className="fw-bold" 
                                                disabled={processingId === req.id} 
                                                onClick={() => handleAccept(req)}
                                            >
                                                {processingId === req.id ? <Spinner size="sm" animation="border" /> : "Ascender"}
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                disabled={processingId === req.id} 
                                                onClick={() => handleReject(req)}
                                            >
                                                {processingId === req.id ? <Spinner size="sm" animation="border" /> : "Declinar"}
                                            </Button>
                                        </div>
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
