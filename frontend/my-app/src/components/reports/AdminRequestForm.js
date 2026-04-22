import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const AdminRequestForm = ({ user, wallet, onSubmit, onCancel }) => {
    const [requestReason, setRequestReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await Web3Service.createAdminRequest(requestReason);

            onSubmit();
        } catch (err) {
            setError(err.message || "Error al enviar la solicitud. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <h3 className="fw-bold text-center mb-4">Petición de Administrador</h3>
            
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

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
                    <Form.Control as="textarea" rows={4} placeholder="Justifica tu solicitud de rango..." value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required disabled={isSubmitting}/>
                </Form.Group>
                <div className="d-grid gap-2">
                    <Button 
                        variant="primary" 
                        type="submit" 
                        className="py-2 fw-bold"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Enviando...
                            </>
                        ) : (
                            "Enviar Petición"
                        )}
                    </Button>
                    <Button variant="link" className="text-muted" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default AdminRequestForm;
