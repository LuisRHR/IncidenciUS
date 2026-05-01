import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const GroupForm = ({ onCreateGroup, onCancel }) => {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (groupName.trim() === '') {
                setError("El nombre del grupo no puede estar vacío.");
                setIsSubmitting(false);
                return;
            }

            const result = await Web3Service.createGroup(groupName.trim(), description);

            onCreateGroup();
        } catch (err) {
            setError(err.message || "Error al crear el grupo. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center">
            <Card className="shadow-sm border-0 rounded-4 p-2" style={{ maxWidth: '500px', width: '100%' }}>
                <Card.Body className="p-4 text-center">

                    <h3 className="fw-bold mb-3">Crear Nuevo Grupo</h3>
                    <p className="text-muted small mb-4">
                        Al crear el grupo, se establecerá una relación en la blockchain que te nombrará <strong>Administrador de Grupo</strong>.
                    </p>

                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit} className="text-start">
                        <Form.Group className="mb-3" controlId="groupName">
                            <Form.Label className="fw-bold small">Nombre de la Organización o Grupo</Form.Label>
                            <Form.Control type="text" size="lg" placeholder="Ej: Equipo de Seguridad Beta" value={groupName} onChange={(e) => setGroupName(e.target.value)} required disabled={isSubmitting}/>
                        </Form.Group>
                        
                        <Form.Group className="mb-4" controlId="groupDescription">
                            <Form.Label className="fw-bold small">Descripción (Opcional)</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Describe el propósito del grupo..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting}/>
                        </Form.Group>
                        
                        <div className="d-grid gap-2">
                            <Button variant="primary" size="lg" type="submit" className="py-3 shadow-sm fw-bold" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Consolidando en Blockchain...
                                    </>
                                ) : (
                                    "Consolidar Grupo"
                                )}
                            </Button>
                            <Button variant="link" className="text-muted decoration-none" onClick={onCancel} disabled={isSubmitting}>
                                Volver al Panel
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GroupForm;
