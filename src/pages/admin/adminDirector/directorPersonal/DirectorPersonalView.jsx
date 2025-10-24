import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import directorUserService from '../../../../services/users/directorUserService';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import { 
  UserStatus,
  UserStatusLabels, 
  DocumentTypeLabels, 
  PasswordStatus,
  PasswordStatusLabels,
  DirectorPersonalRoleLabels,
  formatUserFullName, 
  getUserStatusColor 
} from '../../../../types/users/user.types';

const DirectorPersonalView = () => {
  const { keycloakId } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (keycloakId) {
      loadUser();
    }
  }, [keycloakId]);

  /**
   * Cargar datos del usuario
   */
  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await directorUserService.getCompleteUserByKeycloakId(keycloakId);
      
      if (userData) {
        setUser(userData);
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err) {
      setError(err.message);
      alert('Error al cargar usuario: ' + err.message);
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
      await directorUserService.activateUser(keycloakId);
      alert('Usuario activado correctamente');
      loadUser(); // Recargar datos
    } catch (err) {
      alert('Error al activar usuario: ' + err.message);
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
      await directorUserService.deactivateUser(keycloakId);
      alert('Usuario desactivado correctamente');
      loadUser(); // Recargar datos
    } catch (err) {
      alert('Error al desactivar usuario: ' + err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar activeClassName="director-personal-view" />
        
        <div className="page-wrapper">
          <div className="content">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Cargando...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Sidebar activeClassName="director-personal-view" />
        
        <div className="page-wrapper">
          <div className="content">
            <div className="row">
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <i className="fa fa-exclamation-triangle"></i> {error}
                  <div className="mt-2">
                    <Link to="/admin/admin-director/director-personal" className="btn btn-secondary">
                      <i className="fa fa-arrow-left"></i> Volver a la lista
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <Sidebar activeClassName="director-personal-view" />
        
        <div className="page-wrapper">
          <div className="content">
            <div className="row">
              <div className="col-12">
                <div className="alert alert-warning" role="alert">
                  <i className="fa fa-info-circle"></i> No se encontró información del usuario.
                  <div className="mt-2">
                    <Link to="/admin/admin-director/director-personal" className="btn btn-secondary">
                      <i className="fa fa-arrow-left"></i> Volver a la lista
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="director-personal-view" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Detalles del Personal Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/admin-director/director-personal">Personal Director</Link>
                  </li>
                  <li className="breadcrumb-item active">{user.username}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <h4 className="card-title mb-0">
                        {formatUserFullName(user)}
                        <span className={`badge badge-${getUserStatusColor(user.status)} ml-3`}>
                          {UserStatusLabels[user.status]}
                        </span>
                      </h4>
                      <p className="text-muted">@{user.username}</p>
                    </div>
                    <div className="col-md-4 text-right">
                      <div className="btn-group" role="group">
                        {/* Editar */}
                        <Link
                          to={`/admin/admin-director/director-personal/${user.keycloakId}/edit`}
                          className="btn btn-primary mr-2"
                        >
                          <i className="fa fa-edit mr-1"></i>
                          Editar
                        </Link>

                        {/* Activar/Desactivar */}
                        {user.status === UserStatus.A ? (
                          <button
                            type="button"
                            className="btn btn-warning mr-2"
                            onClick={handleDeactivateUser}
                          >
                            <i className="fa fa-pause mr-1"></i>
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-success mr-2"
                            onClick={handleActivateUser}
                          >
                            <i className="fa fa-play mr-1"></i>
                            Activar
                          </button>
                        )}

                        {/* Volver */}
                        <Link
                          to="/admin/admin-director/director-personal"
                          className="btn btn-secondary"
                        >
                          <i className="fa fa-arrow-left mr-1"></i>
                          Volver
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="row">
            {/* Información básica */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="fa fa-user mr-2"></i>
                    Información Básica
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Usuario:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.username}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Nombres:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.firstname || user.firstName || 'No especificado'}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Apellidos:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.lastname || user.lastName || 'No especificado'}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Email:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.email}
                      {user.emailVerified && (
                        <span className="badge badge-success ml-2">
                          <i className="fa fa-check"></i> Verificado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Teléfono:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.phone || 'No especificado'}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Rol:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.role ? (
                        <span className="badge badge-primary">
                          {DirectorPersonalRoleLabels[user.role] || user.role}
                        </span>
                      ) : user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <span key={index} className="badge badge-primary mr-1">
                            {DirectorPersonalRoleLabels[role] || role}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">No asignado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de identificación y estado */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="fa fa-id-card mr-2"></i>
                    Identificación y Estado
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Tipo de Documento:</strong>
                    </div>
                    <div className="col-sm-8">
                      {DocumentTypeLabels[user.documentType] || user.documentType}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Número de Documento:</strong>
                    </div>
                    <div className="col-sm-8">
                      {user.documentNumber}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Estado:</strong>
                    </div>
                    <div className="col-sm-8">
                      <span className={`badge badge-${getUserStatusColor(user.status)}`}>
                        {UserStatusLabels[user.status]}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>Usuario Habilitado:</strong>
                    </div>
                    <div className="col-sm-8">
                      <span className={`badge badge-${user.enabled ? 'success' : 'danger'}`}>
                        {user.enabled ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>

                  {user.passwordStatus && (
                    <div className="row mb-3">
                      <div className="col-sm-4">
                        <strong>Estado de Contraseña:</strong>
                      </div>
                      <div className="col-sm-8">
                        <span className={`badge badge-${
                          user.passwordStatus === PasswordStatus.VALID || 
                          user.passwordStatus === PasswordStatus.PERMANENT 
                            ? 'success' 
                            : user.passwordStatus === PasswordStatus.EXPIRED 
                              ? 'danger' 
                              : 'warning'
                        }`}>
                          {PasswordStatusLabels[user.passwordStatus] || user.passwordStatus}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="row mb-3">
                    <div className="col-sm-4">
                      <strong>ID Keycloak:</strong>
                    </div>
                    <div className="col-sm-8">
                      <code>{user.keycloakId}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de fechas y auditoría */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="fa fa-clock mr-2"></i>
                    Información de Auditoría
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {user.createdAt && (
                      <div className="col-md-3">
                        <div className="mb-3">
                          <strong>Fecha de Creación:</strong>
                          <br />
                          <span className="text-muted">
                            {new Date(user.createdAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                      </div>
                    )}

                    {user.updatedAt && (
                      <div className="col-md-3">
                        <div className="mb-3">
                          <strong>Última Actualización:</strong>
                          <br />
                          <span className="text-muted">
                            {new Date(user.updatedAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                      </div>
                    )}

                    {user.lastLogin && (
                      <div className="col-md-3">
                        <div className="mb-3">
                          <strong>Último Acceso:</strong>
                          <br />
                          <span className="text-muted">
                            {new Date(user.lastLogin).toLocaleString('es-ES')}
                          </span>
                        </div>
                      </div>
                    )}

                    {user.passwordChangeRequired !== undefined && (
                      <div className="col-md-3">
                        <div className="mb-3">
                          <strong>Cambio de Contraseña Requerido:</strong>
                          <br />
                          <span className={`badge badge-${user.passwordChangeRequired ? 'warning' : 'success'}`}>
                            {user.passwordChangeRequired ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional si existe */}
          {(user.attributes || user.groups) && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="fa fa-cogs mr-2"></i>
                      Información Adicional
                    </h5>
                  </div>
                  <div className="card-body">
                    {user.groups && user.groups.length > 0 && (
                      <div className="row mb-3">
                        <div className="col-sm-2">
                          <strong>Grupos:</strong>
                        </div>
                        <div className="col-sm-10">
                          {user.groups.map((group, index) => (
                            <span key={index} className="badge badge-info mr-1">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.attributes && Object.keys(user.attributes).length > 0 && (
                      <div className="row">
                        <div className="col-sm-2">
                          <strong>Atributos:</strong>
                        </div>
                        <div className="col-sm-10">
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Atributo</th>
                                  <th>Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(user.attributes).map(([key, value]) => (
                                  <tr key={key}>
                                    <td><code>{key}</code></td>
                                    <td>
                                      {Array.isArray(value) ? value.join(', ') : value}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectorPersonalView;
