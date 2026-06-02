import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Button, ListGroup, Spinner, Nav, Tab } from 'react-bootstrap';
import { Web3Service } from '../../services/web3service';

const PRIORITY_COLORS = { 2: 'danger', 1: 'warning', 0: 'info' };
const PRIORITY_LABELS = { 2: 'Alta', 1: 'Media', 0: 'Baja' };

/**
 * Centro de notificaciones para gestionar invitaciones a grupos e incidencias resueltas.
 * Proporciona dos secciones principales:
 * Invitaciones: Invitaciones a grupos pendientes con opciones de aceptar o rechazar.
 * Incidencias: Incidencias resueltas que requieren confirmación final (reabrirlas o cerrarlas).
 * 
 * Sincroniza todos los cambios con el contrato inteligente a través de Web3Service.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onCancel - Callback para volver al dashboard.
 * @param {Function} props.onGroupJoined - Callback para recargar datos del grupo tras aceptar una invitación.
 */
const UserNotifications = ({ onCancel, onGroupJoined }) => {
    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    /**
     * Carga todas las notificaciones: invitaciones pendientes e incidencias resueltas.
     * Filtra incidencias por estado (solo status=1 Resuelta) y excluye las descartadas.
     */
    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [sent, invited] = await Promise.all([
                Web3Service.getSentIncidences(),
                Web3Service.getInvitedGroups()
            ]);
            // Mostrar solo las incidencias que están en estado 'Resuelta' (status=1)
            const filtered = sent.filter(inc => inc.status === 1);
            setNotifications(filtered);
            setInvitations(invited || []);
        } catch (err) {
            console.error("Error cargando notificaciones:", err);
            setError("Error al cargar las notificaciones.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    /**
     * Reabre una incidencia resuelta al estado REABIERTA (status=2).
     * Elimina la notificación de la lista local tras actualizar el contrato.
     * 
     * @param {Object} inc - La incidencia a reabrir.
     */
    const handleReopen = async (inc) => {
        setProcessingId(inc.id);
        setError(null);
        try {
            await Web3Service.updateIncidenceStatus(inc.id, 2); // Reabierta
            // Desaparece de notificaciones (ya no está Resuelta)
            setNotifications(prev => prev.filter(n => n.id !== inc.id));
        } catch (err) {
            setError(err.message || "Error al reabrir la incidencia.");
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Cierra una incidencia resuelta definitivamente al estado CERRADA (status=3).
     * Requiere confirmación del usuario antes de procesar.
     * Una incidencia cerrada no aparecerá en notificaciones ni se puede reabrir.
     * 
     * @param {Object} inc - La incidencia a cerrar.
     */
    const handleClose = async (inc) => {
        if (!window.confirm("¿Confirmas que la incidencia quedó resuelta satisfactoriamente? Se cerrará definitivamente.")) return;
        setProcessingId(inc.id);
        setError(null);
        try {
            // Enviar Cerrada (3) al blockchain
            await Web3Service.updateIncidenceStatus(inc.id, 3);
            // Remover de notificaciones locales
            setNotifications(prev => prev.filter(n => n.id !== inc.id));
        } catch (err) {
            setError(err.message || "Error al cerrar la incidencia.");
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Acepta una invitación a grupo.
     * Actualiza el contrato, elimina la invitación local y recarga los datos del grupo.
     * 
     * @param {number} groupId - ID del grupo.
     * @param {string} groupName - Nombre del grupo.
     */
    const handleJoinGroup = async (groupId, groupName) => {
        setProcessingId(`join-${groupId}`);
        setError(null);
        try {
            await Web3Service.joinGroup(groupName);
            // Remover de la lista de invitaciones
            setInvitations(prev => prev.filter(g => g.id !== groupId));
            window.alert("¡Te has unido al grupo exitosamente!");
            // Recargar datos del grupo en el App
            if (onGroupJoined) {
                await onGroupJoined();
                await loadNotifications(); // Recarga para reflejar cambios tras unirse al grupo (posibles nuevas notificaciones)
            }
        } catch (err) {
            setError(err.message || "Error al unirse al grupo.");
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Rechaza una invitación a grupo.
     * Actualiza el contrato para eliminar la invitación y la remueve de la lista local.
     * 
     * @param {number} groupId - ID del grupo.
     * @param {string} groupName - Nombre del grupo.
     */
    const handleRejectInvitation = async (groupId, groupName) => {
        setProcessingId(`reject-${groupId}`);
        setError(null);
        try {
            await Web3Service.rejectGroupInvitation(groupName);
            setInvitations(prev => prev.filter(g => g.id !== groupId));
            window.alert("Invitación rechazada.");
        } catch (err) {
            setError(err.message || "Error al rechazar la invitación.");
        } finally {
            setProcessingId(null);
        }
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

    const hasNotifications = notifications.length > 0 || invitations.length > 0;

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Notificaciones</h2>
                    <p className="text-muted small mb-0">Invitaciones a grupos e incidencias resueltas</p>
                </div>
                <Button variant="light" onClick={onCancel} className="btn-sm">← Atrás</Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {!hasNotifications ? (
                <Alert variant="light" className="text-center py-5 border rounded-4">
                    <p className="text-muted mb-1">No tienes notificaciones pendientes.</p>
                    <small className="text-muted">Aquí aparecerán tus invitaciones a grupos e incidencias resueltas.</small>
                </Alert>
            ) : (
                <Tab.Container defaultActiveKey="invitations">
                    <Nav variant="pills" className="mb-4">
                        <Nav.Item>
                            <Nav.Link eventKey="invitations" className="fw-bold">
                                Invitaciones ({invitations.length})
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="incidences" className="fw-bold">
                                Incidencias ({notifications.length})
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* Tab: Invitaciones a Grupos */}
                        <Tab.Pane eventKey="invitations">
                            {invitations.length === 0 ? (
                                <Alert variant="info" className="py-4 text-center">
                                    No tienes invitaciones pendientes a grupos.
                                </Alert>
                            ) : (
                                <>
                                    <Alert variant="info" className="py-2 small border-0 rounded-3 mb-4">
                                        <strong>{invitations.length}</strong> invitación{invitations.length > 1 ? 'es' : ''} pendiente{invitations.length > 1 ? 's' : ''}. 
                                        Puedes <strong>aceptar</strong> unirte o <strong>rechazar</strong> la invitación.
                                    </Alert>
                                    <Row>
                                        {invitations.map((inv) => (
                                            <Col md={6} lg={4} className="mb-4" key={inv.id}>
                                                <Card className="h-100 shadow border-0 rounded-4 overflow-hidden">
                                                    <Card.Header className="bg-primary text-white">
                                                        <Badge bg="light" text="dark">Invitación</Badge>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <Card.Title className="fw-bold text-dark">{inv.name}</Card.Title>
                                                        <Card.Text className="text-muted small">{inv.description}</Card.Text>
                                                    </Card.Body>
                                                    <Card.Footer className="bg-white border-0 pb-3">
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="w-50 fw-bold"
                                                                disabled={processingId === `join-${inv.id}`}
                                                                onClick={() => handleJoinGroup(inv.id, inv.name)}
                                                            >
                                                                {processingId === `join-${inv.id}`
                                                                    ? <Spinner size="sm" animation="border" />
                                                                    : "Aceptar"}
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="w-50 fw-bold"
                                                                disabled={processingId === `reject-${inv.id}`}
                                                                onClick={() => handleRejectInvitation(inv.id, inv.name)}
                                                            >
                                                                {processingId === `reject-${inv.id}`
                                                                    ? <Spinner size="sm" animation="border" />
                                                                    : "Rechazar"}
                                                            </Button>
                                                        </div>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}
                        </Tab.Pane>

                        {/* Tab: Incidencias Resueltas */}
                        <Tab.Pane eventKey="incidences">
                            {notifications.length === 0 ? (
                                <Alert variant="info" className="py-4 text-center">
                                    No tienes incidencias resueltas pendientes de revisión.
                                </Alert>
                            ) : (
                                <>
                                    <Alert variant="info" className="py-2 small border-0 rounded-3 mb-4">
                                        <strong>{notifications.length}</strong> incidencia{notifications.length > 1 ? 's' : ''} resuelta{notifications.length > 1 ? 's' : ''}.
                                        Puedes <strong>reabrirla</strong> si no estás conforme o no se solucionó el problema, o <strong>cerrarla</strong> para confirmar que está solucionada.
                                    </Alert>
                                    <Row>
                                        {notifications.map((inc) => (
                                            <Col md={6} lg={4} className="mb-4" key={inc.id}>
                                                <Card className="h-100 shadow border-0 rounded-4 overflow-hidden">
                                                    <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                                                        <Badge bg="success">Resuelta</Badge>
                                                        <div className="d-flex gap-1 align-items-center">
                                                            <Badge bg={PRIORITY_COLORS[inc.priority] ?? 'secondary'}>
                                                                {PRIORITY_LABELS[inc.priority] ?? 'N/A'}
                                                            </Badge>
                                                            <small className="text-muted fw-bold ms-1">
                                                                {inc.date ? new Date(inc.date).toLocaleDateString() : 'N/A'}
                                                            </small>
                                                        </div>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <Card.Title className="fw-bold text-dark fs-6">{inc.title}</Card.Title>
                                                        <Card.Text className="text-muted small">{inc.description}</Card.Text>
                                                        <ListGroup variant="flush" className="small bg-light rounded-3 overflow-hidden">
                                                            <ListGroup.Item className="bg-transparent py-1">
                                                                <strong>De:</strong> <code className="text-primary">{inc.senderUserName}/{inc.senderEmail}</code>
                                                            </ListGroup.Item>
                                                            <ListGroup.Item className="bg-transparent py-1">
                                                                <strong>Para:</strong> {inc.userReceiver
                                                                    ? `Usuario: ${inc.userReceiver}`
                                                                    : inc.groupReceiver
                                                                    ? `Grupo: ${inc.groupReceiver}`
                                                                    : 'N/A'}
                                                            </ListGroup.Item>
                                                        </ListGroup>
                                                    </Card.Body>
                                                    <Card.Footer className="bg-white border-0 pb-3">
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="outline-warning"
                                                                size="sm"
                                                                className="w-50 fw-bold"
                                                                disabled={processingId === inc.id}
                                                                onClick={() => handleReopen(inc)}
                                                            >
                                                                {processingId === inc.id
                                                                    ? <Spinner size="sm" animation="border" />
                                                                    : "Reabrir"}
                                                            </Button>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="w-50 fw-bold"
                                                                disabled={processingId === inc.id}
                                                                onClick={() => handleClose(inc)}
                                                            >
                                                                Cerrar
                                                            </Button>
                                                        </div>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            )}
        </Container>
    );
};

export default UserNotifications;
