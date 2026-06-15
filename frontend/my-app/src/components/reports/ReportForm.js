import React, { useState } from 'react';
import { Card, Form, Button, ToggleButtonGroup, ToggleButton, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

/**
 * Centro de reportes para la comunicación segura con los administradores.
 * Permite enviar dos tipos de reportes:
 * Bug: Errores técnicos del sistema.
 * User: Denuncias de comportamiento contra otros usuarios.
 * 
 * Aplica cifrado híbrido multinivel: el contenido se cifra con AES y la clave AES 
 * se cifra asimétricamente para cada administrador del sistema.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.user - Usuario emisor.
 * @param {Function} props.onSubmit - Callback tras procesar el reporte.
 * @param {Function} props.onCancel - Callback para salir del componente.
 */
const ReportForm = ({ user, onSubmit, onCancel }) => {
    const [reportType, setReportType] = useState('bug');
    const [title, setTitle] = useState('');
    const [targetUserName, setTargetUserName] = useState('');
    const [targetEmail, setTargetEmail] = useState('');
    const [description, setDescription] = useState('');
    const [proofs, setProofs] = useState([]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Gestiona el envío del reporte.
     * Sube las imágenes de prueba a IPFS y delega la lógica de cifrado 
     * de llaves por administrador al servicio Web3.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Evita doble envío manual

        setIsSubmitting(true);
        setError(null);
        
        try {
            if (reportType === 'bug') {
                await Web3Service.createBugReport(user.userName.trim(), title, description, proofs);
            } else {
                await Web3Service.createUserReport(user.userName.trim(), targetUserName.trim(), targetEmail.trim(), description, proofs);
            }
            onSubmit(); 
        } catch (err) {
            setError(err.message);
            setIsSubmitting(false); // Solo reactivar si falló
        }
    };
    return (
        <Card className="shadow border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <div className="text-center mb-4">
                <h3 className="fw-bold">Centro de Reportes</h3>
                <ToggleButtonGroup type="radio" name="reportType" value={reportType} onChange={(val) => setReportType(val)}>
                    <ToggleButton id="tbg-radio-1" value={'bug'} variant="outline-dark">Reportar Bug</ToggleButton>
                    <ToggleButton id="tbg-radio-2" value={'user'} variant="outline-dark">Reportar Usuario</ToggleButton>
                </ToggleButtonGroup>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                {reportType === 'bug' ? (
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Título del Bug</Form.Label>
                        <Form.Control type="text" placeholder="Resumen del error..." value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}/>
                    </Form.Group>
                ) : (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Usuario Reportado</Form.Label>
                            <Form.Control type="text" placeholder="Nombre de usuario..." value={targetUserName} onChange={(e) => setTargetUserName(e.target.value)} required disabled={isSubmitting}/>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Email del Usuario</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="email@example.com..." 
                                value={targetEmail} 
                                onChange={(e) => setTargetEmail(e.target.value)} 
                                required 
                                disabled={isSubmitting}
                            />
                        </Form.Group>
                    </>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Descripción</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={3} 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                        disabled={isSubmitting}
                        maxLength={300}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    {/*queremos poder subir archivos*/}
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small">Pruebas (Imágenes)</Form.Label>
                        <Form.Control 
                            type="file" 
                            onChange={(e) => setProofs(e.target.files)}
                            disabled={isSubmitting} 
                            multiple 
                            accept="image/*"
                        />
                    </Form.Group>
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
                                Enviando a Blockchain...
                            </>
                        ) : (
                            "Enviar a Blockchain"
                        )}
                    </Button>
                    <Button 
                        variant="link" 
                        className="text-muted" 
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default ReportForm;
