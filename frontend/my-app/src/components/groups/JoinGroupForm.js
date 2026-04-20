import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

const JoinGroupForm = ({ onJoin, onCancel }) => {
    const [groupName, setGroupName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onJoin(groupName);
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '500px' }}>
            <div className="text-center mb-4">
                <h3 className="fw-bold">Unirse a un Grupo</h3>
                <p className="text-muted small">Debes haber sido invitado previamente por el administrador del grupo.</p>
            </div>

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">Nombre del Grupo</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Ej: LRHR" 
                        value={groupName} 
                        onChange={(e) => setGroupName(e.target.value)} 
                        required 
                    />
                </Form.Group>

                <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" className="py-2 fw-bold">
                        Validar Invitación y Unirse
                    </Button>
                    <Button variant="link" className="text-muted" onClick={onCancel}>
                        Cancelar
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default JoinGroupForm;
