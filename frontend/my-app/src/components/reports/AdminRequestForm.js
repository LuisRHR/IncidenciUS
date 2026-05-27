import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

/**
 * Componente de formulario para solicitar el rango de Administrador de Sistema.
 * Envía una petición pública (no cifrada) a la Blockchain para que los 
 * administradores actuales puedan evaluarla.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.user - Datos del usuario solicitante.
 * @param {string} props.wallet - Dirección de la wallet del solicitante.
 * @param {Function} props.onSubmit - Callback tras enviar la petición con éxito.
 * @param {Function} props.onCancel - Callback para cancelar y volver atrás.
 * 
 * @returns {JSX.Element} El formulario de petición de admin.
 */
const AdminRequestForm = ({ user, wallet, onSubmit, onCancel }) => {
    const [requestReason, setRequestReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Procesa el envío de la solicitud.
     * Registra la wallet y el motivo en el Smart Contract `ADMIN_REQUESTS`.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await Web3Service.createAdminRequest(requestReason);

            onSubmit();
        } catch (err) {
            setError(err.message || "Error al enviar la solicitud. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <h3 className="fw-bold text-center mb-4">Petición de Administrador</h3>
            
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">Nombre de Usuario</Form.Label>
                    <Form.Control type="text" value={user.userName} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">Dirección de la wallet</Form.Label>
                    <Form.Control type="text" value={wallet} disabled />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">Motivo de la Petición</Form.Label>
                    <Form.Control as="textarea" rows={4} placeholder="Justifica tu solicitud de rango..." maxLength={120} value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required disabled={isSubmitting}/>
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
