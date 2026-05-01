import React, { useState } from 'react';
import { Card, ListGroup, Badge, Row, Col, Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Web3Service } from '../../services/web3service';

const UserProfile = ({ user, userGroup, onDeleteProfileSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await Web3Service.deleteUser();
      
      // Espera un poco para asegurar que la transacción se confirme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowModal(false);
      if (onDeleteProfileSuccess) {
        onDeleteProfileSuccess();
      }
    } catch (err) {
      console.error("Error al eliminar perfil:", err);
      setError("No se pudo eliminar el perfil de la Blockchain. Asegúrate de firmar la transacción.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="shadow-sm border-0 rounded-4 overflow-hidden mx-auto" style={{ maxWidth: '800px' }}>
        <div className="bg-primary py-5 text-center text-white">
          <h3 className="mb-0">{user.userName}</h3>
          <Badge bg="light" text="dark" className="mt-2">
            {user.condition === 1 ? "ADMINISTRADOR DE SISTEMA" : "USUARIO COMÚN"}
          </Badge>
        </div>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          
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
            
          </ListGroup>

          <div className="mt-5 border-top pt-4">
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border border-danger-subtle">
              <div>
                <p className="mb-0 fw-bold small">Eliminar Perfil de la Red</p>
                <p className="mb-0 text-muted small">Borrará tus datos de forma permanente en la Blockchain.</p>
              </div>
              <Button variant="outline-danger" size="sm" onClick={() => setShowModal(true)}>
                Borrar Perfil
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => !isDeleting && setShowModal(false)} centered>
        <Modal.Header closeButton={!isDeleting}>
          <Modal.Title className="fw-bold">¿Confirmar eliminación?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Al confirmar, se enviará una transacción a la Blockchain para eliminar la información vinculada a tu wallet. 
          <strong> Esta acción es irreversible y perderás acceso a tus grupos.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Eliminando...
              </>
            ) : (
              "Sí, eliminar de la red"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserProfile;
