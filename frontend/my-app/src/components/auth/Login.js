import React from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { Web3Service } from "../../services/web3service";

const Login = ({ onConnect }) => {
    const [error, setError] = React.useState(null);
    const [isConnecting, setIsConnecting] = React.useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        if (window.ethereum) {
            try {   
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const address = accounts[0];

                const userData = await Web3Service.login();

                // Se ha añadido la logica de usuario baneado a la blockchain, ahora no es necesario hacer esta comprobación de usuario baneado
                if (userData.exists) {
                    /*
                    if (userData.isBanned) {
                        setError("Esta cuenta ha sido bloqueada.");
                        setIsConnecting(false);
                        return;
                    }*/
                    onConnect(address, userData); 
                } else {
                    onConnect(address, null); 
                }
            } catch (err) {
                setError("Error al validar usuario en Blockchain");
            } finally {
                setIsConnecting(false);
            }
        } else {
                setError("Instala MetaMask");
                setIsConnecting(false);
        }
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 p-4 text-center">
            <Card.Body>
                <div className="mb-4">
                    <h1 className="fw-bold text-primary">IncidenciUS</h1>
                    <p className="text-muted">Plataforma de gestión descentralizada</p>
                </div>

                <div className="my-4">
                    <p>Para acceder, necesitas conectar tu monedero de <strong>MetaMask</strong>.</p>
                </div>
                
                {error && (
                    <Alert variant="danger" className="py-2 small">
                        {error}
                    </Alert>
                )}
                
                <Button variant="primary" size="lg" onClick={handleConnect} disabled={isConnecting} className="w-100 py-3 mb-4 shadow-sm">
                    {isConnecting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Conectando...
                        </>
                    ) : (
                        "Conectar MetaMask"
                    )}
                </Button>

                <Alert variant="warning" className="text-start border-0">
                    <small className="text-muted d-block mb-1 fw-bold">Importante:</small>
                    <small className="text-muted">
                        Esta aplicación utiliza tecnología <strong>Blockchain</strong> para garantizar la integridad de los reportes y asegurar la transparencia de la información mediante nodos descentralizados.
                    </small>
                </Alert>
            </Card.Body>
        </Card>
    );
};

export default Login;
