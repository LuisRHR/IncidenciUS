import React, { useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { Web3Service } from "../../services/web3service";

/**
 * Componente de Login para la autenticación vía Web3.
 * Gestiona la conexión inicial con MetaMask, la firma de desafíos criptográficos
 * y la validación del estado del usuario (existencia y bloqueos) en los contratos inteligentes.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onConnect - Callback ejecutado tras una conexión exitosa. 
 * Recibe (walletAddress, userData). userData es null si el usuario no está registrado.
 * 
 * @returns {JSX.Element} El componente de login renderizado.
 */
const Login = ({ onConnect }) => {
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    /**
     * Inicia el flujo de conexión: solicita cuentas a MetaMask, inicializa la sesión 
     * criptográfica y consulta el perfil del usuario en la Blockchain.
     */
    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        if (window.ethereum) {
            try {   
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const address = accounts[0];
                const sessionReady = await Web3Service.initSession();
                
                if (!sessionReady) {
                    setError("Se requiere la firma para acceder a tus datos cifrados.");
                    setIsConnecting(false);
                    return;
                }
                const userData = await Web3Service.login();

                if (userData && userData.exists) { // Verificación segura
                    if (userData.isBanned) {
                        setError("ACCESO DENEGADO: Esta cuenta ha sido bloqueada por la administración.");
                        return; 
                    }
                    onConnect(address, userData); 
                } else {
                    onConnect(address, null); 
                }
            } catch (err) {
                console.error(err);
                setError("Error en el proceso de autenticación.");
            } finally {
                setIsConnecting(false);
            }
        } else {
            setError("Instala MetaMask");
            setIsConnecting(false);
        }
    };

    return (
        <Card className="shadow border-0 rounded-4 p-4 text-center">
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
                
                <Button variant="primary" size="lg" onClick={handleConnect} disabled={isConnecting} className="w-100 py-3 mb-4 shadow">
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
