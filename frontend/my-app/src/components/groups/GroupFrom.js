import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';

const GroupForm = ({ onCreateGroup, onCancel }) => {
    const [groupName, setGroupName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (groupName.trim() === '') {
            alert("El nombre del grupo no puede estar vacío.");
            return;
        }
        if (groupName.trim()) {
            onCreateGroup(groupName.trim());
        }
    };

    return (
        <Container className="d-flex justify-content-center">
            <Card className="shadow-sm border-0 rounded-4 p-2" style={{ maxWidth: '500px', width: '100%' }}>
                <Card.Body className="p-4 text-center">
                    <div className="display-5 mb-3">🤝</div>
                    <h3 className="fw-bold mb-3">Crear Nuevo Grupo</h3>
                    <p className="text-muted small mb-4">
                        Al crear el grupo, se establecerá una relación en la blockchain que te nombrará <strong>Administrador de Grupo</strong>.
                    </p>

                    <Form onSubmit={handleSubmit} className="text-start">
                        <Form.Group className="mb-4" controlId="groupName">
                            <Form.Label className="fw-bold small">Nombre de la Organización o Grupo</Form.Label>
                            <Form.Control type="text" size="lg" placeholder="Ej: Equipo de Seguridad Beta" value={groupName} onChange={(e) => setGroupName(e.target.value)} required/>
                        </Form.Group>
                        
                        <div className="d-grid gap-2">
                            <Button variant="primary" size="lg" type="submit" className="py-3 shadow-sm fw-bold">
                                Consolidar Grupo
                            </Button>
                            <Button variant="link" className="text-muted decoration-none" onClick={onCancel}>
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
