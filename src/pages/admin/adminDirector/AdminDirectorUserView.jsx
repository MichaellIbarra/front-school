import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import adminUserService from '../../../services/users/adminUserService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { 
  UserStatusLabels, 
  DocumentTypeLabels, 
  PasswordStatusLabels,
  formatUserFullName, 
  getUserStatusColor,
  getPasswordStatusColor
} from '../../../types/users/user.types';

const AdminDirectorUserView = () => {
  const { keycloakId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (keycloakId) {
      loadUserData();
    }
  }, [keycloakId]);

  /**
   * Cargar datos del usuario
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await adminUserService.getAdminUserByKeycloakId(keycloakId);
      if (response.success) {
        setUserData(response.data);
      } else {
        alert('Error al cargar datos del usuario: ' + response.error);
      }
    } catch (error) {
      alert('Error al cargar datos del usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activar usuario
   */
  const handleActivateUser = async () => {
    if (!window.confirm('¿Está seguro que desea activar este usuario?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminUserService.activateAdminUser(keycloakId);
      if (response.success) {
        setUserData(response.data);
        alert('Usuario activado correctamente');
      } else {
        alert('Error al activar usuario: ' + response.error);
      }
    } catch (error) {
      alert('Error al activar usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Desactivar usuario
   */
  const handleDeactivateUser = async () => {
    if (!window.confirm('¿Está seguro que desea desactivar este usuario?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminUserService.deactivateAdminUser(keycloakId);
      if (response.success) {
        setUserData(response.data);
        alert('Usuario desactivado correctamente');
      } else {
        alert('Error al desactivar usuario: ' + response.error);
      }
    } catch (error) {
      alert('Error al desactivar usuario: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container-fluid">
        <div className="page-wrapper">
          <div className="content">
            <div className="alert alert-danger">
              <h4>Usuario no encontrado</h4>
              <p>No se pudo cargar la información del usuario.</p>
              <Link to="/admin/admin-director/users" className="btn btn-primary">
                Volver a la lista
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="admin-director-users-list" />
      
      <div className="page-wrapper">
        <div className="content">{/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-8">
                <h3 className="page-title">Detalles del Usuario</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/admin-director/users">Usuarios Admin/Director</Link>
                  </li>
                  <li className="breadcrumb-item active">Ver Usuario</li>
                </ul>
              </div>
              <div className="col-sm-4">
                <div className="float-right">
                  <Link
                    to={`/admin/admin-director/users/${keycloakId}/edit`}
                    className="btn btn-primary mr-2"
                  >
                    <i className="fa fa-edit"></i> Editar
                  </Link>
                  <Link
                    to="/admin/admin-director/users"
                    className="btn btn-outline-secondary"
                  >
                    <i className="fa fa-arrow-left"></i> Volver
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Información Personal */}
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Información Personal</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Usuario:</strong></td>
                            <td>{userData.username}</td>
                          </tr>
                          <tr>
                            <td><strong>Email:</strong></td>
                            <td>
                              <a href={`mailto:${userData.email}`}>
                                {userData.email}
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Nombres:</strong></td>
                            <td>{userData.firstname || '-'}</td>
                          </tr>
                          <tr>
                            <td><strong>Apellidos:</strong></td>
                            <td>{userData.lastname || '-'}</td>
                          </tr>
                          <tr>
                            <td><strong>Nombre Completo:</strong></td>
                            <td><strong>{formatUserFullName(userData)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Tipo de Documento:</strong></td>
                            <td>{DocumentTypeLabels[userData.documentType]}</td>
                          </tr>
                          <tr>
                            <td><strong>Número de Documento:</strong></td>
                            <td>{userData.documentNumber}</td>
                          </tr>
                          <tr>
                            <td><strong>Teléfono:</strong></td>
                            <td>
                              {userData.phone ? (
                                <a href={`tel:${userData.phone}`}>
                                  {userData.phone}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Keycloak ID:</strong></td>
                            <td>
                              <code>{userData.keycloakId}</code>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Información del Sistema</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>ID MongoDB:</strong></td>
                            <td><code>{userData.id}</code></td>
                          </tr>
                          <tr>
                            <td><strong>Fecha de Creación:</strong></td>
                            <td>
                              {userData.createdAt ? (
                                <>
                                  {new Date(userData.createdAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </>
                              ) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Última Actualización:</strong></td>
                            <td>
                              {userData.updatedAt ? (
                                <>
                                  {new Date(userData.updatedAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </>
                              ) : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Estado de Contraseña:</strong></td>
                            <td>
                              <span className={`badge badge-${getPasswordStatusColor(userData.passwordStatus)}`}>
                                {PasswordStatusLabels[userData.passwordStatus]}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Contraseña Creada:</strong></td>
                            <td>
                              {userData.passwordCreatedAt ? (
                                <>
                                  {new Date(userData.passwordCreatedAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </>
                              ) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Token de Reset:</strong></td>
                            <td>
                              {userData.passwordResetToken ? (
                                <span className="text-warning">
                                  <i className="fa fa-key"></i> Activo
                                </span>
                              ) : (
                                <span className="text-muted">Sin token</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Estado y Acciones */}
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Estado del Usuario</h4>
                </div>
                <div className="card-body text-center">
                  <div className="mb-3">
                    <span className={`badge badge-${getUserStatusColor(userData.status)} p-3`} style={{ fontSize: '1.1em' }}>
                      {UserStatusLabels[userData.status]}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h5>Acciones Rápidas</h5>
                  </div>

                  {/* Botones de acción */}
                  <div className="btn-group-vertical w-100">
                    {userData.status === 'A' ? (
                      <button
                        type="button"
                        className="btn btn-warning mb-2"
                        onClick={handleDeactivateUser}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="fa fa-pause mr-2"></i>
                        )}
                        Desactivar Usuario
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-success mb-2"
                        onClick={handleActivateUser}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="fa fa-play mr-2"></i>
                        )}
                        Activar Usuario
                      </button>
                    )}

                    <Link
                      to={`/admin-director/users/${keycloakId}/edit`}
                      className="btn btn-primary mb-2"
                    >
                      <i className="fa fa-edit mr-2"></i>
                      Editar Usuario
                    </Link>

                    <button
                      type="button"
                      className="btn btn-info mb-2"
                      onClick={loadUserData}
                      disabled={loading}
                    >
                      <i className="fa fa-refresh mr-2"></i>
                      Actualizar Datos
                    </button>
                  </div>
                </div>
              </div>

              {/* Card de información adicional */}
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Información Adicional</h4>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <small className="text-muted">ID en Base de Datos</small>
                    <p className="mb-1">
                      <code style={{ fontSize: '0.8em' }}>{userData.id}</code>
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">ID en Keycloak</small>
                    <p className="mb-1">
                      <code style={{ fontSize: '0.8em' }}>{userData.keycloakId}</code>
                    </p>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Estado de Contraseña</small>
                    <p className="mb-0">
                      <span className={`badge badge-${getPasswordStatusColor(userData.passwordStatus)}`}>
                        {PasswordStatusLabels[userData.passwordStatus]}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDirectorUserView;
