import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Web3Service } from "../../services/web3service";

const IncidenceForm = ({ user, groups = [], onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('0');
  const [targetType, setTargetType] = useState('user'); 
  const [targetName, setTargetName] = useState('');
  const [incidenceDate, setIncidenceDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userReceiver = targetType === 'user' ? targetName : "";
      const groupReceiver = targetType === 'group' ? targetName : "";
      const priorityNum = parseInt(priority);

      const result = await Web3Service.registerIncidence(
        title,
        description,
        priorityNum,
        userReceiver,
        groupReceiver,
        null,
        incidenceDate
      );

      onSubmit();
    } catch (err) {
      setError(err.message || "Error al enviar la incidencia. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Card className="shadow-sm border-0 rounded-4 p-2 mx-auto" style={{ maxWidth: '700px' }}>
        <Card.Body className="p-4">
          <h3 className="fw-bold mb-4 text-primary">Reportar Incidencia</h3>
          
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Título de la Incidencia</Form.Label>
              <Form.Control type="text" placeholder="Resumen breve del suceso..." value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}/>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label className="fw-bold">Prioridad</Form.Label>
                <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={isSubmitting}>
                  <option value="0">Baja</option>
                  <option value="1">Media</option>
                  <option value="2">Alta</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Fecha de Incidencia</Form.Label>
                <Form.Control type="date" value={incidenceDate} onChange={(e) => setIncidenceDate(e.target.value)} required disabled={isSubmitting}/>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Label className="fw-bold">Tipo de Destino</Form.Label>
                <div className="d-flex mt-2">
                  <Form.Check type="radio" label="Usuario" name="targetType" className="me-3" checked={targetType === 'user'} onChange={() => {setTargetType('user'); setTargetName('')}}/>
                  <Form.Check type="radio" label="Grupo" name="targetType" checked={targetType === 'group'} onChange={() => {setTargetType('group'); setTargetName('')}}/>
                </div>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Destinatario</Form.Label>
              {targetType === 'user' ? (
                <Form.Control type="text" placeholder="Nombre del usuario..." value={targetName} onChange={(e) => setTargetName(e.target.value)} required/>
                ) : (

                <Form.Select value={targetName} onChange={(e) => setTargetName(e.target.value)} required>
                  <option value="">Selecciona un grupo...</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Descripción de la Incidencia</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder="Detalla lo ocurrido..." value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isSubmitting}
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-3 fw-bold shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Enviando a Blockchain...
                </>
              ) : (
                "Firmar y Enviar"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default IncidenceForm;
