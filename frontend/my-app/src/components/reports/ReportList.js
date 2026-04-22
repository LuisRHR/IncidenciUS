import React from 'react';
import { Table, Badge, Card, Container, Button } from 'react-bootstrap';

// TO-DO Traerse los reportes y mostrar el listado, ademas de implementar las acciones de aceptar (bloquear usuario o marcar bug como resuelto) y declinar (marcar como no valido) cada reporte. Para esto se pueden crear endpoints en el backend que reciban el id del reporte y realicen la acción correspondiente, luego actualizar el estado del componente para reflejar los cambios.

const ReportList = ({ reports, onBlockUser, onDecline }) => {
    return (
        <Container className="py-4">
            <h3 className="fw-bold mb-4">Registro de Reportes de Sistema</h3>
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Table hover responsive className="mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Tipo</th>
                            <th>Emisor</th>
                            <th>Título / Sujeto</th>
                            <th>Descripción</th>
                            <th>Pruebas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-muted">No hay reportes.</td></tr>
                        ) : (
                            reports.map((rep, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <Badge bg={rep.type === 'BUG_REPORT' ? 'warning' : 'danger'}>
                                            {rep.type === 'BUG_REPORT' ? 'BUG' : 'USUARIO'}
                                        </Badge>
                                    </td>
                                    <td><code>{rep.sender}</code></td>
                                    <td>{rep.type === 'BUG_REPORT' ? rep.title : `${rep.userName} (${rep.email})`}</td>
                                    <td>{rep.description}</td>
                                    <td><small className="text-muted">{rep.proofs}</small></td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button 
                                                variant="success" 
                                                size="sm" 
                                                onClick={() => rep.type === 'USER_REPORT' ? onBlockUser(rep.id, rep.userName) : onDecline(rep.id)}
                                            >
                                                Aceptar
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => onDecline(rep.id)}
                                            >
                                                Declinar
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
