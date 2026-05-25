import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const JoinGroupForm = ({ onJoin, onCancel }) => {
    const [groupName, setGroupName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await Web3Service.joinGroup(groupName);

            onJoin({
                name: groupName,
                txHash: result.hash
            });
        } catch (err) {
            setError(err.message || "Error al unirse al grupo. Verifica que hayas sido invitado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '500px' }}>
            <div className="text-center mb-4">
                <h3 className="fw-bold">Unirse a un Grupo</h3>
                <p className="text-muted small">Debes haber sido invitado previamente por el administrador del grupo.</p>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">Nombre del Grupo</Form.Label>
                    <Form.Control type="text" placeholder="Ej: LRHR" value={groupName} onChange={(e) => setGroupName(e.target.value)} required disabled={isSubmitting}/>
                </Form.Group>

                <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" className="py-2 fw-bold" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Validando...
                            </>
                        ) : (
                            "Validar Invitación y Unirse"
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

export default JoinGroupForm;
