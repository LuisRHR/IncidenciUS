import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

const AdminRequestForm = ({ user, wallet, onSubmit, onCancel }) => {
    const [requestReason, setRequestReason] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const requestData = {
            type: 'ADMIN_REQUEST',
            userName: user.userName,
            wallet: wallet,
            requestReason: requestReason
        };
        onSubmit(requestData);
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <h3 className="fw-bold text-center mb-4">Petición de Administrador</h3>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Nombre de Usuario</Form.Label>
                    <Form.Control type="text" value={user.userName} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Wallet Address</Form.Label>
                    <Form.Control type="text" value={wallet} disabled />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">Motivo de la Petición (Request Reason)</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={4} 
                        placeholder="Justifica tu solicitud de rango..." 
                        value={requestReason} 
                        onChange={(e) => setRequestReason(e.target.value)} 
                        required 
                    />
                </Form.Group>
                <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" className="py-2 fw-bold">Enviar Petición</Button>
                    <Button variant="link" className="text-muted" onClick={onCancel}>Cancelar</Button>
                </div>
            </Form>
        </Card>
    );
};

export default AdminRequestForm;