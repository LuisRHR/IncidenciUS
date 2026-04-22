import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { Web3Service } from './services/web3service';

// Importación de componentes
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import IncidenceForm from './components/incidences/IncidenceForm';
import UserIncidencesList from './components/incidences/UserIncidencesList';
import GroupIncidencesList from './components/incidences/GroupIncidencesList';
import GroupForm from './components/groups/GroupFrom';
import GroupManagement from './components/groups/GroupManagement';
import UserProfile from './components/auth/UserProfile';
import ReportForm from './components/reports/ReportForm';
import ReportList from './components/reports/ReportList';
import AdminRequestForm from './components/reports/AdminRequestForm';
import AdminRequestList from './components/reports/AdminRequestList';
import JoinGroupForm from './components/groups/JoinGroupForm';

function App() {
  // Estados principales de la aplicación
  const [view, setView] = useState('welcome'); 
  const [user, setUser] = useState(null);       
  const [wallet, setWallet] = useState("");
  const [userGroup, setUserGroup] = useState(null); 
  const [allMembers, setAllMembers] = useState([]);
  //Esto puede ser interesante, lo dejo aquí porque lo use para el mock de todos los usuarios, pero ahora mismo no se usa
  const [allUsers, setAllUsers] = useState([]);

  const handleLoginSuccess = (address, userData) => {
    setWallet(address);
    if (userData && userData.exists) {
      setUser(userData);
      setView('dashboard');
      let dataGroup = Web3Service.getActualGroup();
      if (dataGroup) {
        setUserGroup(dataGroup);
        setAllMembers(dataGroup.members);
      }
    } else {
      alert("No se encontró un perfil asociado a esta wallet. Por favor, regístrate para continuar.");
      setView('register');
    }
  };


  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setWallet(userData.wallet);
    setView('dashboard');
  };

  const handleDeleteProfileSuccess = () => {
    setUser(null);
    setWallet("");
    setUserGroup(null);

    setView('welcome');

  };
  // Muchos de estos handlers van a cambiar teniendo en cuenta que ahora no hay que actualizar el estado porque se encargara de mostrar las cosas las vistas, pero los dejo aquí para que se vea que se ha pensado en ello y no se ha dejado de lado, aunque ahora mismo no hagan nada
  const handleIncidenceSubmit = (newInc) => {
    setView('dashboard'); 
  };

  const handleCreateGroupSuccess = () => {
    let dataGroup = Web3Service.getActualGroup();
    if (dataGroup) {
      groupData = {dataGroup};
    }
    setUserGroup({groupData});
    setAllMembers(groupData.members);
    setView('dashboard');
  };

  const handleJoinGroupSuccess = () => {
    let dataGroup = Web3Service.getActualGroup();
    if (dataGroup) {
      groupData = {dataGroup};
    }
    setUserGroup({groupData});
    setAllMembers(groupData.members);
    setView('dashboard');
  };

  // Estos handlers ahora solo actualizan el estado visual tras la acción del componente
  const handleReportSuccess = () => {
    setView('dashboard');
  };

  const handleAdminRequestSuccess = () => {
    setView('dashboard');
  };

  if (view === 'welcome') {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="row w-100 g-4" style={{ maxWidth: '850px' }}>
          <div className="col-md-6">
            <div className="h-100 p-2 shadow-sm rounded-4 bg-white border">
              <Login onConnect={handleLoginSuccess} />
            </div>
          </div>
          <div className="col-md-6 text-center">
            <div className="h-100 p-5 shadow-sm rounded-4 bg-light border d-flex flex-column justify-content-center align-items-center">
              <h2 className="fw-bold mb-3">Nuevo Perfil</h2>
              <button 
                className="btn btn-primary btn-lg w-100 py-3"
                onClick={() => setView('register')}
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
        <button className="btn btn-link d-block mx-auto mt-3 text-decoration-none" onClick={() => setView('welcome')}>Cancelar</button>
      </Container>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" expand="lg" className="shadow-sm border-bottom py-3 mb-4">
        <Container>
          <Navbar.Brand onClick={() => setView('dashboard')} className="fw-bold text-primary fs-3" style={{cursor:'pointer'}}>
            IncidenciUS
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto ms-4">
              <NavDropdown title="Grupo" id="nav-group">
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
                      <NavDropdown.Item onClick={() => setView('create-group')}>Crear un Grupo</NavDropdown.Item>
                      <NavDropdown.Item onClick={() => setView('join-group')}>Unirse a un Grupo</NavDropdown.Item>
                    </>
                  )}

              </NavDropdown>

              <NavDropdown title="Incidencias" id="nav-inc">
                <NavDropdown.Item onClick={() => setView('create')}>Reportar</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setView('list-user-incidences')}>Ver Historial Por Usuario</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setView('list-group-incidences')}>Ver Historial del Grupo</NavDropdown.Item>
              </NavDropdown>

              <NavDropdown title="Soporte" id="nav-support">
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
                    {user?.userName} : <Badge bg="info">{user?.role}</Badge>
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
        
        {view === 'join-group' && <JoinGroupForm onJoin={handleJoinGroupSuccess} onCancel={() => setView('dashboard')}/>}
        {view === 'create-group' && <GroupForm onCreateGroup={handleCreateGroupSuccess} onCancel={() => setView('dashboard')} />}
        {view === 'create' && <IncidenceForm user={user} onSubmit={handleIncidenceSubmit} />}
        {view === 'list' && <IncidenceList incidences={incidences} />}
        {view === 'list-user-incidences' && <UserIncidencesList user={user} onCancel={}/>}
        {view === 'list-group-incidences' && <GroupIncidencesList user={user} userGroup={userGroup} onCancel = {() => setView('list-group-incidences')}/>}
        {view === 'profile' && <UserProfile user={user} userGroup={userGroup} onDeleteProfileSuccess={handleDeleteProfileSuccess}/>}
        
        {view === 'manage-members' && (
          <GroupManagement 
            groupName={userGroup?.name} 
            members={allMembers} 
            //Es probable que muchos handlers aquí definidos acaben como este 
            onRemoveSuccess={() => setView('dashboard')} 
          />
        )}
        
        {view === 'report-form' && <ReportForm user={user} onSubmit={handleReportSuccess} onCancel={() => setView('dashboard')} />}
        {view === 'admin-request' && <AdminRequestForm user={user} wallet={wallet} onSubmit={handleAdminRequestSuccess} onCancel={() => setView('dashboard')} />}
        
        {view === 'view-reports' && <ReportList onDecline={() => setView('dashboard')} />}
        {view === 'view-requests' && user?.role === 'Admin de Sistema' && (
          <AdminRequestList onAcceptSuccess={() => setView('dashboard')} onDecline={() => setView('dashboard')} />
        )}
      </Container>
    </div>
  );
}

export default App;
