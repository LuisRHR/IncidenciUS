import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';

const IncidenceForm = ({ user, groups = [], onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [targetType, setTargetType] = useState('user'); 
  const [targetName, setTargetName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Creamos el objeto con los datos que SÍ tenemos en el estado
    const newIncidence = {
      title: title, 
      description: description,
      priority: priority,
      sender: user ? user.name : "Anónimo",
      userReceiver: targetType === 'user' ? targetName : "---",
      groupReceiver: targetType === 'group' ? targetName : "---",
      date: new Date().toLocaleString(),
      // El CID no se va a poder ver en la versión final 
      cid: "Qm" + Math.random().toString(36).substring(7)
    };

    onSubmit(newIncidence);
  };

  return (
    <Container>
      <Card className="shadow-sm border-0 rounded-4 p-2 mx-auto" style={{ maxWidth: '700px' }}>
        <Card.Body className="p-4">
          <h3 className="fw-bold mb-4 text-primary">Reportar Incidencia</h3>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Título de la Incidencia</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Resumen breve del suceso..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label className="fw-bold">Prioridad</Form.Label>
                <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="1">Baja</option>
                  <option value="2">Media</option>
                  <option value="3">Alta</option>
                </Form.Select>
              </Col>
              <Col md={6}>
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
                /*Esto se va a cambiar a posteriori en los gruposs sobre todo, para no tener que seleccionarlo */
                <Form.Select value={targetName} onChange={(e) => setTargetName(e.target.value)} required>
                  <option value="">Selecciona un grupo...</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Descripción de la Incidencia</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder="Detalla lo ocurrido..." value={description} onChange={(e) => setDescription(e.target.value)} required/>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-3 fw-bold shadow-sm">
              Firmar y Enviar
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default IncidenceForm;
