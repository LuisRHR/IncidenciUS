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
import ReportList from './components/reports/ReportList';
import AdminRequestForm from './components/reports/AdminRequestForm';
import AdminRequestList from './components/reports/AdminRequestList';
import JoinGroupForm from './components/groups/JoinGroupForm';

function App() {
  // Estados principales de la aplicación; Faltan por añadir algunos componentes
  const [view, setView] = useState('welcome'); 
  const [user, setUser] = useState(null);       
  const [wallet, setWallet] = useState("");     
  const [incidences, setIncidences] = useState([]); 
  const [userGroup, setUserGroup] = useState(null); 
  const [allReports, setAllReports] = useState([]);
  const [allAdminRequests, setAllAdminRequests] = useState([]);

  // Estado de usuarios simulado, solo se usan las propiedades utiles en este caso, group además no es una propiedad, se cambiara posteriormente
  // tanto esto, como indicendes, como reportes, serán directamente redirigidos a la blockchain con los fetches correspondientes, pero para simular la experiencia de usuario, se mantienen en estado local
  const [allUsers, setAllUsers] = useState([
    { wallet: "0x1234567890abcdef1234567890abcdef12345678", userName: "User_Soporte_1", group: "LRHR", isBanned: false },
    { wallet: "0xabcdef1234567890abcdef1234567890abcdef12", userName: "User_Soporte_2", group: "LRHR", isBanned: false },
    { wallet: "0x9876543210fedcba9876543210fedcba98765432", userName: "Analista_Externo", group: "AMRQ", isBanned: false },
  ]);

  // Autenticación y Registro

  const handleLoginAttempt = (address) => {
    const checkBanned = allUsers.find(u => u.wallet.toLowerCase() === address.toLowerCase());
    if (checkBanned && checkBanned.isBanned) {
      alert("ACCESO DENEGADO: Esta cuenta ha sido bloqueada por un administrador.");
      return;
    }

    setWallet(address);
    const SYSTEM_ADMIN_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

    if (address.toLowerCase() === SYSTEM_ADMIN_WALLET.toLowerCase()) {
      setUser({ wallet: address, userName: "Admin_Principal", role: 'Admin de Sistema' });
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
    setAllUsers([...allUsers, { ...userData, isBanned: false }]);
    setUserGroup(null); 
    setView('dashboard');
  };

  const handleDeleteProfile = () => {
    console.log("Solicitud de borrado para la wallet:", wallet);
    
    // Limpiamos los estados locales para simular que el usuario ya no existe
    setUser(null);
    setUserGroup(null);
    setWallet("");
    setView('welcome');
    
    alert("Transacción enviada: Tu perfil ha sido eliminado del registro descentralizado.");
  };

  const handleBlockUser = (reportId, targetUserName) => {
    const target = allUsers.find(u => u.userName.toLowerCase() === targetUserName.toLowerCase());

    if (!target) {
      alert("Error: El usuario no existe.");
      return;
    }

    if (target.userName === user.userName) {
      alert("No puedes bloquearte a ti mismo.");
      return;
    }

    setAllUsers(prev => prev.map(u => 
      u.userName.toLowerCase() === targetUserName.toLowerCase() 
      ? { ...u, isBanned: true, group: null } 
      : u
    ));
    
    setAllReports(prev => prev.filter(r => r.id !== reportId));
    alert(`Usuario ${targetUserName} bloqueado correctamente.`);
  };

  const handleDeclineReport = (reportId) => {
    setAllReports(prev => prev.filter(r => r.id !== reportId));
  };

  // Lógica de gestión de grupos e incidencias

  const handleCreateGroup = (groupName) => {
    setUserGroup({ name: groupName, isAdmin: true });
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
      alert("Usuario no encontrado.");
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


  const handleJoinGroup = (groupName) => {
    const invitation = allUsers.find(u => 
      /* esto se gestionara de otra forma */
      u.wallet.toLowerCase() === wallet.toLowerCase() && 
      u.group === groupName
    );

    if (invitation) {
      setUserGroup({ name: groupName, isAdmin: false });
      setView('dashboard');
      alert(`¡Éxito! Te has unido al grupo ${groupName}.`);
    } else {
      alert("No tienes invitaciones pendientes para este grupo.");
    }
  };

  // Manejo de Reportes (Soporte)
  const handleSendReport = (data) => {
      if (data.type === 'USER_REPORT') {
      const targetExists = allUsers.find(u => u.userName.toLowerCase() === data.userName.toLowerCase());
      if (!targetExists) {
        alert("Error: El usuario que intentas reportar no existe en el registro.");
        return;
      }
      if(targetExists.userName === user.userName) {
        alert("No puedes reportarte a ti mismo.");
        return;
      }
    }

    if (data.type === 'ADMIN_REQUEST') {
      if (user.role === 'Admin de Sistema') {
        alert("Ya eres administrador, no puedes solicitar este rol.");
        return;
      }
      setAllAdminRequests([...allAdminRequests, data]);
      alert("Propuesta de administrador enviada.");
    } else {
      setAllReports([...allReports, data]);
      alert("Reporte registrado.");
    }
    setView('dashboard');
  };

  const handleAcceptAdmin = (wallet) => {
    alert(`Usuario ${wallet} ascendido a Administrador.`);
    setAllAdminRequests(allAdminRequests.filter(r => r.wallet !== wallet));
  };

  const handleDeclineAdmin = (wallet) => {
    alert(`Propuesta de ${wallet} rechazada.`);
    setAllAdminRequests(allAdminRequests.filter(r => r.wallet !== wallet));
  };


  // Vistas previas a la autenticación
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
  // Vistas principales después de la autenticación
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
                <NavDropdown title="Grupo">
                  {userGroup ? (
                    <>
                      <NavDropdown.Item>Mi Grupo: <b>{userGroup.name}</b></NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item onClick={() => setView('manage-members')} className="text-danger fw-bold">
                        Gestión de Miembros
                      </NavDropdown.Item>
                    </>
                  ) : (
                    <>
                      <NavDropdown.Item onClick={() => setView('create-group')}>
                        Crear un Grupo
                      </NavDropdown.Item>
                      <NavDropdown.Item onClick={() => setView('join-group')}>
                        Unirse a un Grupo
                      </NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
              </NavDropdown>

              <NavDropdown title="Incidencias">
                <NavDropdown.Item onClick={() => setView('create')}>Reportar</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setView('list')}>Ver Historial</NavDropdown.Item>
              </NavDropdown>

              <NavDropdown title="Soporte">
                <NavDropdown.Item onClick={() => setView('report-form')}>Reportar Bug / Usuario</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setView('admin-request')}>Petición de Administrador</NavDropdown.Item>
                {user?.role === 'Admin de Sistema' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => setView('view-reports')}>Ver Reportes</NavDropdown.Item>
                    <NavDropdown.Item onClick={() => setView('view-requests')} className="fw-bold text-primary">
                      Ver Peticiones de Admin
                    </NavDropdown.Item>
                  </>
                )}
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
          </div>
        )}
        {view === 'join-group' && (<JoinGroupForm onJoin={handleJoinGroup} onCancel={() => setView('dashboard')}/>)}
        {view === 'create-group' && <GroupForm onCreateGroup={handleCreateGroup} onCancel={() => setView('dashboard')} />}
        {view === 'create' && <IncidenceForm user={user} onSubmit={handleIncidenceSubmit} />}
        {view === 'list' && <IncidenceList incidences={incidences} />}
        {view === 'profile' && (<UserProfile user={user} userGroup={userGroup} onDeleteProfile={handleDeleteProfile}/>)}
        {view === 'manage-members' && (
          <GroupManagement groupName={userGroup.name} members={allUsers.filter(u => u.group === userGroup.name)} onRemove={handleRemoveMember} onInvite={handleInviteMember} />
        )}
        {view === 'report-form' && (
          <ReportForm user={user} onSubmit={handleSendReport} onCancel={() => setView('dashboard')} />
        )}
        {view === 'admin-request' && (
          <AdminRequestForm user={user} wallet={wallet} onSubmit={handleSendReport} onCancel={() => setView('dashboard')} />
        )}
        {view === 'view-reports' && <ReportList reports={allReports} onBlockUser={handleBlockUser} onDecline={handleDeclineReport} />}
        {view === 'view-requests' && user?.role === 'Admin de Sistema' && (
          <AdminRequestList 
            requests={allAdminRequests} 
            onAccept={handleAcceptAdmin} 
            onDecline={handleDeclineAdmin} 
          />
        )}
      </Container>
    </div>
  );
}

export default App;
