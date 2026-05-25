import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Web3Service } from "../../services/web3service";

const Register = ({ wallet, onSuccess }) => {
    const [formData, setFormData] = useState({
        userName: "",
        email: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const validateEmailFormat = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            if (!validateEmailFormat(formData.email)) {
                setError("Por favor, introduce un email válido");
                setIsSubmitting(false);
                return;
            }
            const sessionReady = await Web3Service.initSession();
            if (!sessionReady) {
                setError("Se requiere firma para cifrar tus datos.");
                setIsSubmitting(false);
                return;
            }
            const publicKey = sessionStorage.getItem('user_pub_key');
            if (!publicKey) {
                setError("Error al generar llaves criptográficas. Reintenta.");
                setIsSubmitting(false);
                return;
            }
            const result = await Web3Service.register(formData.userName, formData.email, publicKey);

            const newUser = {
                wallet,
                userName: formData.userName.trim(),
                email: formData.email.trim(),
                role: "Comun",
                condition: 0,
                cid: result.cid,
                exists: true
            };
            
            onSuccess(newUser);
        } catch (err) {
            console.error("Error en el registro:", err);
            setError(err.message || "Error en la transacción de registro. Asegúrate de que los datos sean correctos.");
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
        <Container className="d-flex justify-content-center">
            <Card className="shadow border-0 rounded-4 p-2" style={{ maxWidth: '500px', width: '100%' }}>
                <Card.Body className="p-4">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold">Nuevo Perfil</h2>
                        <p className="text-muted small">Completa tus datos para vincular tu identidad a la red.</p>
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formUserName">
                            <Form.Label className="fw-bold small text-secondary">Nombre de Usuario</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej: Juan_Dev"
                                maxLength={25}
                                value={formData.userName}
                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                disabled={isSubmitting}
                                className="py-2"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formEmail">
                            <Form.Label className="fw-bold small text-secondary">Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="usuario@informatica.us.es"
                                maxLength={50}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isSubmitting}
                                className="py-2"
                            />
                        </Form.Group>

                        {error && (
                            <Alert variant="danger" className="py-2 small mb-3">
                                {error}
                            </Alert>
                        )}

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 py-2 fw-bold shadow"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Registrando en Blockchain...
                                </>
                            ) : (
                                "Completar Registro"
                            )}
                        </Button>
                    </Form>
                </Card.Body>
                <Card.Footer className="bg-transparent border-0 text-center pb-4">
                    <small className="text-muted">
                        Tus datos se cifrarán y almacenarán de forma inmutable.
                    </small>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default Register;
