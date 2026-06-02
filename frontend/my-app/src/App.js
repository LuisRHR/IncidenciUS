import React, { useState, useCallback, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { Web3Service } from './services/web3service';
import { motion, AnimatePresence } from 'framer-motion';

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
import UserNotifications from './components/auth/UserNotifications';

/**
 * Componente principal de la aplicación IncidenciUS.
 * Gestiona el estado global de la aplicación, la navegación entre vistas
 * y la sincronización de datos del usuario y grupo con la Blockchain.
 * 
 * @returns {JSX.Element} El componente raíz de la aplicación.
 */
function App() {
  /**
   * Estado que controla la vista actual de la aplicación.
   * @type {string}
   */
  const [view, setView] = useState('welcome'); 
  /**
   * Estado que almacena los datos del usuario actual.
   * @type {Object|null}
   */
  const [user, setUser] = useState(null);
  /**
   * Estado que almacena la dirección de la wallet del usuario.
   * @type {string}
   */
  const [wallet, setWallet] = useState("");
  /**
   * Estado que almacena los datos del grupo al que pertenece el usuario.
   * @type {Object|null}
   */
  const [userGroup, setUserGroup] = useState(null);
  /**
   * Estado que almacena la lista de miembros del grupo actual.
   * @type {Array<Object>}
   */
  const [allMembers, setAllMembers] = useState([]);
  // const [allUsers, setAllUsers] = useState([]); // Comentado porque no se usa

  /**
   * Función asíncrona para refrescar los datos del usuario y del grupo
   * desde la Blockchain. Se ejecuta al inicio y periódicamente.
   * @type {Function}
   */
  const refreshData = useCallback(async () => {
      try {
        const sessionKey = sessionStorage.getItem('cached_priv_key');
        
        if (window.ethereum && window.ethereum.selectedAddress && sessionKey) {
          const userData = await Web3Service.getActualUser(); 

          if (userData.isBanned) {
            setUser(null);
            setUserGroup(null);
            return;
          }
          const groupData = await Web3Service.getActualGroup();

          setUser(userData);
          setUserGroup(groupData);
        }
      } catch (err) {
        console.error("Error sincronizando con Blockchain:", err);
      }
    }, []);

    /**
     * Efecto que carga los datos iniciales y establece un intervalo de refresco.
     */
    useEffect(() => {
      refreshData();
      const interval = setInterval(() => {
        refreshData();
      }, 10000); 

      return () => clearInterval(interval);
    }, [refreshData]);

  /**
   * Manejador para el éxito del proceso de login.
   * Establece la dirección de la wallet, los datos del usuario y, si aplica, los datos del grupo.
   * @param {string} address - Dirección de la wallet conectada.
   * @param {Object|null} userData - Datos del usuario obtenidos de la Blockchain, o null si no está registrado.
   */
  const handleLoginSuccess = async (address, userData) => {
    setWallet(address);
    if (userData && userData.exists) {
      setUser(userData);
      try {
        const dataGroup = await Web3Service.getActualGroup();
        if (dataGroup && dataGroup !== 0 && dataGroup !== null) {
          setUserGroup(dataGroup);
          setAllMembers(dataGroup.members);
        }
      } catch (error) {
        console.error("Error al obtener información del grupo:", error);
      }
      setView('dashboard');
    } else {
      alert("No se encontró un perfil asociado a esta wallet. Por favor, regístrate para continuar.");
      setView('register');
      return;
    }
  };

  /**
   * Manejador para el éxito del proceso de registro.
   * Notifica al usuario y lo redirige a la vista de bienvenida para iniciar sesión.
   * @param {Object} userData - Datos del usuario registrado.
   */
  const handleRegisterSuccess = (userData) => {
    alert("Registro exitoso. Ahora puedes iniciar sesión con tu wallet.");
    setView('welcome');
  };

  /**
   * Manejador para el éxito de la eliminación del perfil.
   * Limpia los estados de usuario y grupo, y recarga la página.
   */
  const handleDeleteProfileSuccess = () => {
    setUser(null);
    setWallet("");
    setUserGroup(null);
    window.location.reload();
    setView('welcome');
  };
  /**
   * Manejador para el envío exitoso de una incidencia.
   * Refresca los datos y vuelve al dashboard.
   * @param {Object} newInc - La nueva incidencia (actualmente no se usa directamente, solo se refresca).
   */
  const handleIncidenceSubmit = (newInc) => {
    refreshData();
    setView('dashboard'); 
  };

  /**
   * Manejador para el éxito de la creación de un grupo.
   * Actualiza la información del grupo del usuario y vuelve al dashboard.
   */
  const handleCreateGroupSuccess = async () => {
    try {
      let dataGroup = await Web3Service.getActualGroup();
      if (dataGroup && dataGroup !== 0 && dataGroup !== null) {
        setUserGroup(dataGroup);
        setAllMembers(dataGroup.members || []);
      }
      setView('dashboard');
    } catch (error) {
      console.error("Error al obtener información del grupo:", error);
      setView('dashboard');
    }
  };

  /**
   * Manejador para el éxito al unirse a un grupo.
   * Actualiza la información del grupo del usuario y vuelve al dashboard.
   */
  const handleJoinGroupSuccess = async () => {
    try {
      let dataGroup = await Web3Service.getActualGroup();
      if (dataGroup && dataGroup !== 0 && dataGroup !== null) {
        setUserGroup(dataGroup);
        setAllMembers(dataGroup.members);
      }
      setView('dashboard');
    } catch (error) {
      console.error("Error al obtener información del grupo:", error);
      setView('dashboard');
    }
  };

  /**
   * Manejador para el éxito al enviar un reporte.
   * Refresca los datos y vuelve al dashboard.
   */
  const handleReportSuccess = () => {
    refreshData();
    setView('dashboard');
  };

  /**
   * Manejador para el éxito al enviar una petición de administrador.
   * Refresca los datos y vuelve al dashboard.
   */
  const handleAdminRequestSuccess = () => {
    refreshData();
    setView('dashboard');
  };

  /**
   * Manejador para cuando un miembro es expulsado de un grupo.
   * Actualiza la lista de miembros del grupo y redirige la vista si el usuario expulsado era el actual.
   * @param {string} removedUserName - Nombre del usuario expulsado.
   */
  const handleGroupMemberRemoved = async (removedUserName) => {
    try {
      // Obtener datos actualizados del blockchain
      const updatedGroup = await Web3Service.getActualGroup();
      if (updatedGroup) {
        setUserGroup(updatedGroup);
        setAllMembers(updatedGroup.members);
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (removedUserName === user?.userName) {
          setView("dashboard");
        }
        else{
          setView("manage-members");
        }
      }
    } catch (error) {
      console.error("Error actualizando grupo después de expulsar usuario:", error);
    }
  };

  /**
   * Manejador para cuando el grupo actual es eliminado.
   * Limpia los estados relacionados con el grupo y redirige al dashboard.
   */
  const handleGroupDeleted = async () => {
    setUserGroup(null);
    setAllMembers([]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setView('dashboard');
  };

  /**
   * Renderiza la vista de bienvenida/login.
   */
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

  /**
   * Renderiza la vista de registro.
   */
  if (view === 'register') {
    return (
      <Container className="py-5">
        <Register wallet={wallet} onSuccess={handleRegisterSuccess} />
        <button className="btn btn-link d-block mx-auto mt-3 text-decoration-none" onClick={() => setView('welcome')}>Cancelar</button>
      </Container>
    );
  }

  /**
   * Renderiza la interfaz principal de la aplicación (navbar y contenido dinámico).
   */
  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" expand="lg" className="shadow-sm border-bottom sticky-top py-3 mb-4">
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
                      {user?.uid === userGroup.admin && (
                        <NavDropdown.Item onClick={() => setView('manage-members')} className="fw-bold text-primary">
                          Gestión de miembros
                        </NavDropdown.Item>
                      )}
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

            <Nav>
              <Nav.Link onClick={() => setView('notifications')}>
                Notificaciones {user?.notifications && user.notifications.length > 0 && (
                  <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                    {user.notifications.length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav>

            <Nav className="align-items-center">
              <NavDropdown title="Mi Cuenta" id="user-dropdown" align="end">
                <NavDropdown.Item onClick={() => setView('profile')}>Ver Perfil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => {
                  setView('welcome'); 
                  setUser(null); 
                  setUserGroup(null); 
                  sessionStorage.clear();
                  localStorage.clear();
                }}>Cerrar Sesión</NavDropdown.Item>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {view === 'dashboard' && (
              <div className="bg-white p-5 rounded-4 shadow-sm border text-center">
                <h2 className="display-6 fw-bold">Panel de Control de {user?.userName}</h2>
                <p className="text-muted">Bienvenido a la plataforma de incidencias descentralizada de IncidenciUS.</p>
              </div>
            )}
            
            {view === 'join-group' && <JoinGroupForm user={user} onJoin={handleJoinGroupSuccess} onCancel={() => setView('dashboard')}/>}
            {view === 'create-group' && <GroupForm user={user} onCreateGroup={handleCreateGroupSuccess} onCancel={() => setView('dashboard')} />}
            {view === 'create' && <IncidenceForm user={user} onSubmit={handleIncidenceSubmit} />}
            {view === 'list-user-incidences' && <UserIncidencesList user={user} onCancel={() => setView('dashboard')}/>}
            {view === 'list-group-incidences' && <GroupIncidencesList user={user} userGroup={userGroup} onCancel = {() => setView('dashboard')}/>}
            {view === 'notifications' && <UserNotifications onCancel={() => setView('dashboard')} />}
            {view === 'profile' && <UserProfile user={user} userGroup={userGroup} onDeleteProfileSuccess={handleDeleteProfileSuccess}/>}
            
            {view === 'manage-members' && (
              <GroupManagement 
                groupName={userGroup?.name} 
                members={allMembers} 
                onMemberRemoved={handleGroupMemberRemoved}
                onGroupDeleted={handleGroupDeleted}
              />
            )}
            
            {view === 'report-form' && <ReportForm user={user} onSubmit={handleReportSuccess} onCancel={() => setView('dashboard')} />}
            {view === 'admin-request' && <AdminRequestForm user={user} wallet={wallet} onSubmit={handleAdminRequestSuccess} onCancel={() => setView('dashboard')} />}
            
            {view === 'view-reports' && user?.role === 'Admin de Sistema' && <ReportList onDecline={() => setView('dashboard')} />}
            {view === 'view-requests' && user?.role === 'Admin de Sistema' && (
              <AdminRequestList onAcceptSuccess={() => setView('dashboard')} onDecline={() => setView('dashboard')} />
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
}

export default App;
