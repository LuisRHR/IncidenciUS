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
            const cleanBugReps = bugReps.filter(rep => 
                rep && (rep.title || rep.description) && rep.cid !== "N/A"
            );

            const cleanUserReps = userReps.filter(rep => 
                rep && (rep.userNameReported || rep.email) && rep.cid !== "N/A"
            );
            const allReports = [...cleanBugReps, ...cleanUserReps];
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
        setError(null);
        setSuccess(null);
        
        try {
            console.log("Iniciando bloqueo del usuario:", nameToBlock);
            const tx1 = await Web3Service.blockUser(nameToBlock); 
            if (tx1 && tx1.wait) await tx1.wait();
            console.log("Éxito: Usuario bloqueado.");
            try {
                console.log("Iniciando eliminación del reporte ID:", report.id);
                const tx2 = await Web3Service.removeUserReport(report.id);
                if (tx2 && tx2.wait) await tx2.wait();
                console.log("Éxito: Reporte eliminado.");
                
                setSuccess("Proceso completo: Usuario bloqueado y reporte descartado.");
                loadReports();
                
            } catch (errBorrado) {
                console.warn("Fallo al eliminar reporte:", errBorrado);
                setSuccess("Aviso: El usuario ha sido bloqueado con éxito, pero tu cuenta no tiene permisos para borrar el reporte de la lista.");
            }

        } catch (errBloqueo) {
            console.error("Error al bloquear usuario:", errBloqueo);
            setError("Error al bloquear: " + (errBloqueo.message || "La transacción falló"));
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

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Consultando registros en la Blockchain...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Registro de Reportes de Sistema</h3>
                <Button variant="light" onClick={onDecline} className="btn-sm">← Volver al Panel</Button>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="shadow border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-light border-bottom">
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
                                    <td><code className="small">{rep.userSender}</code></td>
                                    <td>
                                        <strong>{rep.type === 'BUG_REPORT' ? rep.title : rep.userNameReported}</strong>
                                        {rep.type === 'USER_REPORT' && rep.email && <div className="small text-muted">{rep.email}</div>}
                                    </td>
                                    <td><small>{rep.description}</small></td>
                                    <td>
                                        {Array.isArray(rep.proofs) ? (
                                            <div className="d-flex flex-wrap gap-1">
                                                {rep.proofs.map((cid, i) => (
                                                    <img 
                                                        key={i}
                                                        src={`${Web3Service.IPFS_GATEWAY}${cid}`} 
                                                        alt="Prueba"
                                                        className="rounded border"
                                                        style={{ width: '35px', height: '35px', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => window.open(`${Web3Service.IPFS_GATEWAY}${cid}`, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <code className="small text-muted">{rep.proofs?.substring(0, 20)}...</code>
                                        )}
                                    </td>
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

