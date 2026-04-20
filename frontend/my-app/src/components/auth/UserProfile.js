import React, { useState } from 'react';
import { Card, ListGroup, Badge, Row, Col, Modal, Button } from 'react-bootstrap';

const UserProfile = ({ user, userGroup, onDeleteProfile }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Card className="shadow-sm border-0 rounded-4 overflow-hidden mx-auto" style={{ maxWidth: '800px' }}>
        <div className="bg-primary py-5 text-center text-white">
          <h3 className="mb-0">{user.userName}</h3>
          <Badge bg="light" text="dark" className="mt-2">{user.role}</Badge>
        </div>
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-4">Detalles de la Cuenta</h5>
          <ListGroup variant="flush">
            <ListGroup.Item className="px-0 py-3">
              <Row>
                <Col xs={4} className="text-muted">Wallet Address</Col>
                <Col xs={8} className="text-end text-break">
                  <code>{user.wallet}</code>
                </Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item className="px-0 py-3">
              <Row>
                <Col xs={4} className="text-muted">Estado en Red</Col>
                <Col xs={8} className="text-end text-success fw-bold">Verificado (Mapping Activo)</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item className="px-0 py-3">
              <Row>
                <Col xs={4} className="text-muted">Grupo Actual</Col>
                <Col xs={8} className="text-end">
                  {userGroup ? (
                    <Badge bg="info" className="p-2">{userGroup.name}</Badge>
                  ) : (
                    <span className="text-muted">Sin grupo asignado</span>
                  )}
                </Col>
              </Row>
            </ListGroup.Item>
          </ListGroup>

          {/* Sección de eliminación de perfil */}
          <div className="mt-5 pt-4 border-top">
            <h6 className="text-danger fw-bold mb-3">Zona Peligrosa</h6>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border border-danger-subtle">
              <div>
                <p className="mb-0 fw-bold small">Eliminar Perfil de la Red</p>
                <p className="mb-0 text-muted small">Esta acción ejecutará una transacción para borrar tus datos del mapping del contrato.</p>
              </div>
              <Button variant="outline-danger" size="sm" onClick={() => setShowModal(true)}>
                Borrar Perfil
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Modal de confirmación */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">¿Confirmar eliminación?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Al confirmar, se enviará una transacción a la Blockchain para eliminar la información vinculada a tu wallet. 
          <strong> No podrás acceder a tus incidencias ni grupos hasta que vuelvas a registrarte.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => {
            onDeleteProfile();
            setShowModal(false);
          }}>
            Sí, eliminar de la red
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserProfile;
