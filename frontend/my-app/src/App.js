import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';

// Importación de componentes
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import IncidenceForm from './components/incidences/IncidenceForm';
import IncidenceList from './components/incidences/IncidenceList';
import GroupForm from './components/groups/GroupFrom';
import GroupManagement from './components/groups/GroupManagement';
import UserProfile from './components/auth/UserProfile';
import ReportForm from './components/reports/ReportForm';

function App() {
  // Estados principales de la aplicación; Faltan por añadir algunos componentes
  const [view, setView] = useState('welcome'); 
  const [user, setUser] = useState(null);       
  const [wallet, setWallet] = useState("");     
  const [incidences, setIncidences] = useState([]); 
  const [userGroup, setUserGroup] = useState(null); 
  const [allReports, setAllReports] = useState([]); // Almacén interno de reportes

  // Estado de usuarios simulado NO FUNCIONA 
  // tanto esto, como indicendes, como reportes, serán directamente redirigidos a la blockchain con los fetches correspondientes, pero para simular la experiencia de usuario, se mantienen en estado local
  const [allUsers, setAllUsers] = useState([
    { wallet: "0x1234567890abcdef1234567890abcdef12345678", userName: "User_Soporte_1", group: "LRHR" },
    { wallet: "0xabcdef1234567890abcdef1234567890abcdef12", userName: "User_Soporte_2", group: "LRHR" },
    { wallet: "0x9876543210fedcba9876543210fedcba98765432", userName: "Analista_Externo", group: "AMRQ" },
  ]);

  // Autenticación y Registro
  
  const handleLoginAttempt = (address) => {
    setWallet(address);
    const SYSTEM_ADMIN_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

    if (address.toLowerCase() === SYSTEM_ADMIN_WALLET.toLowerCase()) {
      setUser({ 
        wallet: address, 
        userName: "Admin_Principal", 
        role: 'Admin de Sistema' 
      });
      setUserGroup(null); 
      setView('dashboard');
    } else {
      alert("Wallet no reconocida. Redirigiendo a registro...");
      setView('register'); 
    }
  };

  const handleRegisterStart = (address) => {
    setWallet(address);
    setView('register'); 
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setUserGroup(null); 
    setView('dashboard');
  };

  // Lógica de gestión de grupos e incidencias

  const handleCreateGroup = (groupName) => {
    setUserGroup({
      name: groupName,
      isAdmin: true 
    });
    setView('dashboard');
  };

  const handleIncidenceSubmit = (newInc) => {
    setIncidences([...incidences, newInc]);
    setView('list'); 
  };

  const handleRemoveMember = (walletAddress) => {
    setAllUsers(prevUsers => 
      prevUsers.map(u => u.wallet === walletAddress ? { ...u, group: null } : u)
    );
  };

  const handleInviteMember = (targetUserName) => {
    const userExists = allUsers.find(u => u.userName.toLowerCase() === targetUserName.toLowerCase());

    if (!userExists) {
      alert("Usuario no encontrado en la red.");
      return;
    }
    
    if (userExists.group) {
      alert(`El usuario ya pertenece al grupo ${userExists.group}`);
      return;
    }

    setAllUsers(prev => prev.map(u => 
      u.userName.toLowerCase() === targetUserName.toLowerCase() ? { ...u, group: userGroup.name } : u
    ));
    alert(`¡${targetUserName} invitado con éxito!`);
  };

  const handleSendReport = (reportData) => {
    setAllReports([...allReports, reportData]);
    console.log("Nuevo Reporte Registrado en Blockchain:", reportData);
    alert(`Reporte ${reportData.id} enviado correctamente.`);
    setView('dashboard'); 
  };

  // Views de la aplicación

  if (view === 'welcome') {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="row w-100 g-4" style={{ maxWidth: '850px' }}>
          <div className="col-md-6">
            <div className="h-100 p-2 shadow-sm rounded-4 bg-white border">
              <Login onConnect={handleLoginAttempt} />
            </div>
          </div>
          <div className="col-md-6 text-center">
            <div className="h-100 p-5 shadow-sm rounded-4 bg-light border d-flex flex-column justify-content-center align-items-center">
              <h2 className="fw-bold mb-3">Nuevo Perfil</h2>
              <button 
                className="btn btn-primary btn-lg w-100 py-3"
                onClick={() => {
                    if (window.ethereum) {
                        window.ethereum.request({ method: 'eth_requestAccounts' })
                        .then(accounts => handleRegisterStart(accounts[0]));
                    }
                }}
              >
                Registrarse con MetaMask
              </button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (view === 'register') {
    return (
      <Container className="py-5">
        <Register wallet={wallet} onSuccess={handleRegisterSuccess} />
        <button className="btn btn-link d-block mx-auto mt-3" onClick={() => setView('welcome')}>Cancelar</button>
      </Container>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" expand="lg" className="shadow-sm border-bottom py-3 mb-4">
        <Container>
          <Navbar.Brand href="main" onClick={() => setView('dashboard')} className="fw-bold text-primary fs-3">
            IncidenciUS
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto ms-4">
              <NavDropdown title="Grupo">
                {userGroup ? (
                  <>
                    <NavDropdown.Item>Mi Grupo: <b>{userGroup.name}</b></NavDropdown.Item>
                    {userGroup.isAdmin && (
                      <>
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={() => setView('manage-members')} className="text-danger fw-bold">
                          Gestión de Miembros
                        </NavDropdown.Item>
                      </>
                    )}
                  </>
                ) : (
                  <NavDropdown.Item onClick={() => setView('create-group')}>Crear un Grupo</NavDropdown.Item>
                )}
              </NavDropdown>

              <NavDropdown title="Incidencias">
                <NavDropdown.Item onClick={() => setView('create')}>Reportar</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setView('list')}>Ver Historial</NavDropdown.Item>
              </NavDropdown>

              <NavDropdown title="Soporte">
                <NavDropdown.Item onClick={() => setView('report-form')}>Reportar Bug / Usuario</NavDropdown.Item>
              </NavDropdown>
            </Nav>

            <Nav className="align-items-center">
              <NavDropdown title="Mi Cuenta" id="user-dropdown" align="end">
                <NavDropdown.Item onClick={() => setView('profile')}>Ver Perfil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => {setView('welcome'); setUser(null); setUserGroup(null);}}>Cerrar Sesión</NavDropdown.Item>
              </NavDropdown>
              
              <div className="text-end ms-3 me-3">
                <div className="small fw-bold text-primary">{wallet.substring(0,10)}...</div>
                <small className="text-muted">
                    {user.userName} : <Badge bg="danger">{user.role}</Badge>
                </small>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {view === 'dashboard' && (
          <div className="bg-white p-5 rounded-4 shadow-sm border text-center">
            <h2 className="display-6 fw-bold">Panel de Control</h2>
            <p className="text-muted">Bienvenido a la red descentralizada de IncidenciUS.</p>
            {!userGroup && user?.role !== 'Admin de Sistema' && (
               <div className="alert alert-info d-inline-block mt-3">
                 No perteneces a ningún grupo. <button className="btn btn-link p-0 fw-bold" onClick={() => setView('create-group')}>Crea uno aquí</button>
               </div>
            )}
          </div>
        )}

        {view === 'create-group' && <GroupForm onCreateGroup={handleCreateGroup} onCancel={() => setView('dashboard')} />}
        {view === 'create' && <IncidenceForm user={user} onSubmit={handleIncidenceSubmit} />}
        {view === 'list' && <IncidenceList incidences={incidences} />}
        {view === 'profile' && <UserProfile user={user} userGroup={userGroup} wallet={wallet} />}
        {view === 'manage-members' && (
          <GroupManagement groupName={userGroup.name} members={allUsers.filter(u => u.group === userGroup.name)} onRemove={handleRemoveMember} onInvite={handleInviteMember} />
        )}
        {view === 'report-form' && (
          <ReportForm 
            user={user} 
            onSubmit={handleSendReport} 
            onCancel={() => setView('dashboard')} 
          />
        )}
      </Container>
    </div>
  );
}

export default App;
