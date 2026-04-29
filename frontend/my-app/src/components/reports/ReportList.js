import React, { useCallback, useState, useEffect } from 'react';
import { Table, Badge, Card, Container, Button, Spinner, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const ReportList = ({ onDecline }) => {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [reports, setReports] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadReports = useCallback(async () => {
        setIsLoading(true); // Empezamos a cargar
        setError(null);
        try {
            const [bugReps, userReps] = await Promise.all([
                Web3Service.viewSortedBugReports(),
                Web3Service.viewSortedUserReports()
            ]);

            // Combinamos y filtramos IDs inválidos (0) de una vez
            const allReports = [...bugReps, ...userReps].filter(r => r && Number(r.id) !== 0);
            
            // Ordenamos por ID descendente
            allReports.sort((a, b) => Number(b.id) - Number(a.id));

            setReports(allReports); // Seteamos el array procesado directamente
        } catch (err) {
            console.error("Error loading reports:", err);
            setError("Error al conectar con la Blockchain para obtener reportes.");
            setReports([]);
        } finally {
            setIsLoading(false); // Terminamos de cargar
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);


    const handleAcceptUserReport = async (report) => {
        const nameToBlock = report.userNameReported; 
        
        if (!nameToBlock) {
            setError("No se encontró el nombre del usuario en el reporte.");
            return;
        }

        if (!window.confirm(`¿Bloquear a ${nameToBlock}?`)) return;
        
        setProcessingId(report.id);
        try {
            await Web3Service.blockUser(nameToBlock); 
            await Web3Service.removeUserReport(report.id);
            
            setSuccess("Usuario bloqueado correctamente.");
            loadReports();
        } catch (err) {
            setError("Error: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDismissReport = async (report) => {
        if (!window.confirm("¿Estás seguro de que quieres descartar este reporte? Se eliminará permanentemente.")) return;

        setProcessingId(report.id);
        setError(null);
        try {
            if (report.type === 'BUG_REPORT') {
                await Web3Service.removeBugReport(report.id);
            } else {
                await Web3Service.removeUserReport(report.id);
            }
            
            setSuccess("Reporte descartado correctamente.");
            loadReports();
        } catch (err) {
            console.error("Error al descartar:", err);
            setError("No se pudo eliminar el reporte de la Blockchain.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Registro de Reportes de Sistema</h3>
                <Button variant="light" onClick={onDecline} className="btn-sm">← Volver al Panel</Button>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Tipo</th>
                            <th>Emisor</th>
                            <th>Sujeto / Título</th>
                            <th>Descripción</th>
                            <th>Pruebas</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-muted">No hay reportes activos.</td></tr>
                        ) : (
                            reports.map((rep, idx) => (
                                <tr key={`${rep.type}-${rep.id}-${idx}`}>
                                    <td>
                                        <Badge bg={rep.type === 'BUG_REPORT' ? 'warning' : 'danger'}>
                                            {rep.type === 'BUG_REPORT' ? 'BUG' : 'USUARIO'}
                                        </Badge>
                                    </td>
                                    <td><code className="small">{rep.sender}</code></td>
                                    <td>
                                        <strong>{rep.type === 'BUG_REPORT' ? rep.title : rep.userNameReported}</strong>
                                        {rep.type === 'USER_REPORT' && rep.email && <div className="small text-muted">{rep.email}</div>}
                                    </td>
                                    <td><small>{rep.description}</small></td>
                                    <td><code className="small text-muted">{rep.proofs?.substring(0, 20)}...</code></td>
                                    <td className="text-end">
                                        <div className="d-flex gap-2 justify-content-end">
                                            {rep.type === 'USER_REPORT' && (
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    disabled={processingId === rep.id}
                                                    onClick={() => handleAcceptUserReport(rep)}
                                                >
                                                    {processingId === rep.id ? <Spinner size="sm" animation="border" /> : "Bloquear"}
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                disabled={processingId === rep.id}
                                                onClick={() => handleDismissReport(rep)}
                                            >
                                                Descartar
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

export default ReportList;

