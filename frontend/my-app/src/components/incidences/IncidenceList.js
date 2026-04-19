import React from 'react';
import { Container, Row, Col, Card, Badge, Alert, ListGroup } from 'react-bootstrap';

const IncidenceList = ({ incidences }) => {
    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Historial de Incidencias</h2>
                <Badge pill bg="primary" className="px-3 py-2">
                    {incidences.length} Registros
                </Badge>
            </div>

            {incidences.length === 0 ? (
                <Alert variant="light" className="text-center py-5 border">
                    <p className="text-muted mb-0">No hay incidencias reportadas aún en la red.</p>
                </Alert>
            ) : (
                <Row>
                    {incidences.map((inc, index) => (    
                        <Col md={6} lg={4} className="mb-4" key={index}>
                            <Card className="h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                                    <Badge bg={inc.priority === 'Alta' ? 'danger' : inc.priority === 'Media' ? 'warning' : 'info'}>
                                        Prioridad {inc.priority || 'Baja'}
                                    </Badge>
                                    <small className="text-muted fw-bold">
                                        {inc.date ? inc.date.split(',')[0] : 'Reciente'}
                                    </small>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title className="fw-bold text-dark">{inc.title}</Card.Title>
                                    <Card.Text className="text-muted small">
                                        {inc.description}
                                    </Card.Text>
                                    
                                    <ListGroup variant="flush" className="small bg-light rounded-3 border">
                                        <ListGroup.Item className="bg-transparent py-1">
                                            <strong>De:</strong> <code className="text-primary">{inc.sender}</code>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent py-1">
                                            <strong>Para:</strong> {inc.userReceiver !== "---" ? inc.userReceiver : inc.groupReceiver}
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer className="bg-white border-0 pb-3">
                                    <div className="p-2 rounded bg-light border border-dashed">
                                        <small className="text-muted d-block text-truncate">
                                            {/* No se deberia de mostrar en la versión final */}
                                            <strong>Hash/CID:</strong> <code>{inc.cid}</code>
                                        </small>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default IncidenceList;
