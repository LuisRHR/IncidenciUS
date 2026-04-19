import React, { useState } from 'react';
import { Card, Form, Button, ToggleButtonGroup, ToggleButton, Alert } from 'react-bootstrap';

const ReportForm = ({ user, onSubmit, onCancel }) => {
    const [reportType, setReportType] = useState('bug'); // 'bug' o 'user'
    const [targetUser, setTargetUser] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const reportData = {
            type: reportType === 'bug' ? 'ERROR_TECNICO' : 'REPORTE_USUARIO',
            sender: user ? user.userName : "Anónimo", /*No debería de ser anónimo, pero se deja así para pruebas */
            target: reportType === 'user' ? targetUser : "Sistema",
            description,
            date: new Date().toLocaleString(),
            // Generamos un ID que simule un identificador de registro en blockchain
            id: "REP-" + Math.random().toString(36).substring(7).toUpperCase()
        };
        
        onSubmit(reportData);
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <div className="text-center mb-4">
                {/*Es probable que aquí se añadan las opciones de petición de administrador del sistema */}
                <h3 className="fw-bold">Centro de Reportes</h3>
                <p className="text-muted small">Registra incidencias técnicas o comportamientos indebidos en la red.</p>
            </div>
            
            <Form onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                    <ToggleButtonGroup 
                        type="radio" 
                        name="reportOptions" 
                        defaultValue={'bug'} 
                        onChange={(val) => setReportType(val)}
                        className="w-100"
                    >
                        <ToggleButton id="tbg-bug" value={'bug'} variant="outline-primary">
                            Bug / Error
                        </ToggleButton>
                        <ToggleButton id="tbg-user" value={'user'} variant="outline-danger">
                            Reportar Usuario
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>

                {reportType === 'user' && (
                    <Form.Group className="mb-3 animate__animated animate__fadeIn">
                        <Form.Label className="fw-bold">Nombre del usuario a reportar</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Ej: usuario_malicioso_01" 
                            value={targetUser}
                            onChange={(e) => setTargetUser(e.target.value)}
                            required
                        />
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                        {reportType === 'bug' ? 'Descripción del error' : 'Motivo del reporte'}
                    </Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={4} 
                        placeholder={reportType === 'bug' ? "Explica qué ha fallado..." : "Describe el comportamiento del usuario..."}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </Form.Group>

                <Alert variant="secondary" className="small border-0 py-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Este reporte se registrará de forma inmutable asociado a tu cuenta, por lo que se recomienda proporcionar información veraz y detallada para facilitar su gestión.
                </Alert>

                <div className="d-grid gap-2">
                    <Button variant="dark" type="submit" className="py-2">
                        Firmar y Enviar Reporte
                    </Button>
                    <Button variant="link" className="text-muted" onClick={onCancel}>
                        Cancelar
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default ReportForm;
