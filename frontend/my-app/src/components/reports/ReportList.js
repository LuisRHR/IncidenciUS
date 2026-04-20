import React from 'react';
import { Table, Badge, Card, Container } from 'react-bootstrap';

const ReportList = ({ reports }) => {
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
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-4 text-muted">No hay reportes.</td></tr>
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
