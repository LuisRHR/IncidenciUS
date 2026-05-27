import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Alert, ListGroup, Form, Button, Spinner } from 'react-bootstrap';
import { Web3Service } from '../../services/web3service';

/**
 * Componente que muestra las incidencias compartidas de un grupo de trabajo.
 * Recupera incidencias cifradas con la clave simétrica del grupo (Group AES Key).
 * 
 * Solo los miembros activos con la llave del grupo pueden visualizar este contenido.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.userGroup - Datos del grupo al que pertenece el usuario.
 * @param {Function} props.onCancel - Callback para volver atrás.
 */
const GroupIncidencesList = ({ userGroup, onCancel }) => {
    const [incidences, setIncidences] = useState([]);
    const [filteredIncidences, setFilteredIncidences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    /**
     * Carga las incidencias del grupo.
     * Requiere que la llave AES del grupo esté presente en la sesión para el descifrado.
     * @async
     */
    const loadIncidences = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!userGroup) {
                setIncidences([]);
                setFilteredIncidences([]);
                setIsLoading(false);
                return;
            }

            const groupInc = await Web3Service.getGroupIncidences();
            setIncidences(groupInc || []);
            setFilteredIncidences(groupInc || []);
        } catch (err) {
            console.error("Error loading group incidences:", err);
            setError("Error al cargar las incidencias del grupo. Intenta de nuevo.");
            setIncidences([]);
            setFilteredIncidences([]);
        } finally {
            setIsLoading(false);
        }
    }, [userGroup]);

    useEffect(() => {
        loadIncidences();
    }, [loadIncidences]);

    /**
     * Filtra las incidencias del grupo por un rango temporal.
     */
    const applyFilter = () => {
        if (!fromDate || !toDate) {
            alert("Por favor selecciona ambas fechas.");
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        const filtered = incidences.filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= from && incDate <= to;
        });

        setFilteredIncidences(filtered);
    };

    /**
     * Restablece el listado completo sin filtros.
     */
    const resetFilter = () => {
        setFromDate('');
        setToDate('');
        setFilteredIncidences(incidences);
    };

    if (isLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </Container>
        );
    }

    if (!userGroup) {
        return (
            <Container className="mt-4">
                <Alert variant="info" className="text-center py-5">
                    <p className="mb-0">No perteneces a ningún grupo. Únete a un grupo para ver sus incidencias.</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={onCancel}>
                        Volver
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Incidencias del Grupo: <Badge bg="secondary">{userGroup.name}</Badge></h2>
                <Button variant="light" onClick={onCancel} className="btn-sm">
                    ← Atrás
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Filtro de fechas */}
            <Card className="mb-4 shadow border-0 rounded-4">
                <Card.Body>
                    <h5 className="fw-bold mb-3">Filtrar por Rango de Fechas</h5>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Desde</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Hasta</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex gap-2 align-items-end">
                            <Button 
                                variant="primary" 
                                onClick={applyFilter}
                                className="w-100"
                            >
                                Filtrar
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                onClick={resetFilter}
                                className="w-100"
                            >
                                Limpiar
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Lista de incidencias */}
            <div className="mb-4">
                <Badge pill bg="primary" className="px-3 py-2">
                    {filteredIncidences.length} Incidencias
                </Badge>
            </div>

            {filteredIncidences.length === 0 ? (
                <Alert variant="light" className="text-center py-5 border">
                    <p className="text-muted mb-0">No hay incidencias del grupo en el rango de fechas seleccionado.</p>
                </Alert>
            ) : (
                <Row>
                    {filteredIncidences.map((inc, index) => (
                        <Col md={6} lg={4} className="mb-4" key={index}>
                            <Card className="h-100 shadow border-0 rounded-4 overflow-hidden">
                                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                                    <Badge bg={inc.priority === 2 ? 'danger' : inc.priority === 1 ? 'warning' : 'info'}>
                                        Prioridad {inc.priority === 2 ? 'Alta' : inc.priority === 1 ? 'Media' : 'Baja'}
                                    </Badge>
                                    <small className="text-muted fw-bold">
                                        {inc.date ? new Date(inc.date).toLocaleDateString() : 'N/A'}
                                    </small>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title className="fw-bold text-dark">{inc.title}</Card.Title>
                                    <Card.Text className="text-muted small">
                                        {inc.description}
                                    </Card.Text>
                                    
                                    <ListGroup variant="flush" className="small bg-light rounded-3 overflow-hidden">
                                        <ListGroup.Item className="bg-transparent py-1">
                                            <strong>De:</strong> <code className="text-primary">{inc.senderUserName}/{inc.senderEmail}</code>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent py-1">
                                            <strong>Para:</strong> Grupo: {userGroup?.name || 'N/A'}
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default GroupIncidencesList;
