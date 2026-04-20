import React, { useState } from 'react';
import { Card, Form, Button, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';

const ReportForm = ({ user, onSubmit, onCancel }) => {
    const [reportType, setReportType] = useState('bug');
    const [title, setTitle] = useState('');
    const [targetUserName, setTargetUserName] = useState('');
    const [targetEmail, setTargetEmail] = useState('');
    const [description, setDescription] = useState('');
    const [proofs, setProofs] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const reportData = {
            sender: user ? user.userName : "Anónimo",
            description,
            proofs,
            type: reportType === 'bug' ? 'BUG_REPORT' : 'USER_REPORT',
            title: reportType === 'bug' ? title : '',
            userName: reportType === 'user' ? targetUserName : '',
            email: reportType === 'user' ? targetEmail : ''
        };

        onSubmit(reportData);
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: '600px' }}>
            <div className="text-center mb-4">
                <h3 className="fw-bold">Centro de Reportes</h3>
                <ToggleButtonGroup type="radio" name="reportType" defaultValue={'bug'} onChange={(val) => setReportType(val)}>
                    <ToggleButton id="tbg-radio-1" value={'bug'} variant="outline-dark">Reportar Bug</ToggleButton>
                    <ToggleButton id="tbg-radio-2" value={'user'} variant="outline-dark">Reportar Usuario</ToggleButton>
                </ToggleButtonGroup>
            </div>

            <Form onSubmit={handleSubmit}>
                {reportType === 'bug' ? (
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Título del Bug</Form.Label>
                        <Form.Control type="text" placeholder="Resumen del error..." value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </Form.Group>
                ) : (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Usuario Reportado</Form.Label>
                            <Form.Control type="text" placeholder="Nombre..." value={targetUserName} onChange={(e) => setTargetUserName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Correo Electrónico</Form.Label>
                            <Form.Control type="email" placeholder="email@ejemplo.com" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} required />
                        </Form.Group>
                    </>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Descripción</Form.Label>
                    <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">Pruebas (Proofs)</Form.Label>
                    <Form.Control type="text" value={proofs} onChange={(e) => setProofs(e.target.value)} required />
                </Form.Group>

                <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" className="py-2 fw-bold">Enviar a Blockchain</Button>
                    <Button variant="link" className="text-muted" onClick={onCancel}>Cancelar</Button>
                </div>
            </Form>
        </Card>
    );
};

export default ReportForm;
