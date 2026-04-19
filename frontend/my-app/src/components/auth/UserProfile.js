import React from 'react';
import { Card, ListGroup, Badge, Row, Col } from 'react-bootstrap';

const UserProfile = ({ user, userGroup }) => {
  return (
    <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
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
              <Col xs={8} className="text-end text-success fw-bold">Verificado</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 py-3 border-0">
            <Row>
              <Col xs={4} className="text-muted">Grupo Actual</Col>
              <Col xs={8} className="text-end">
                {userGroup ? (
                  <Badge bg="info" className="p-2">{userGroup.name}</Badge>
                ) : (
                  <span className="text-muted italic">Sin grupo asignado</span>
                )}
              </Col>
            </Row>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default UserProfile;
