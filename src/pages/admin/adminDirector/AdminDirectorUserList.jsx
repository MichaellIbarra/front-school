import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminUserService from '../../../services/adminDirectorService/adminUserService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { 
  UserStatus, 
  UserStatusLabels, 
  DocumentTypeLabels, 
  formatUserFullName, 
  getUserStatusColor 
} from '../../../types/users/user.types';

const AdminDirectorUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Cargar todos los usuarios admin/director
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminUserService.getAllAdminUsers();
      
      if (response.success) {
        // La respuesta ahora viene con estructura: { success, data, total_users, message }
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error || 'Error al cargar usuarios');
        setUsers([]);
      }
    } catch (err) {
      setError(err.message);
      alert('Error al cargar usuarios: ' + err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activar un usuario
   */
  const handleActivateUser = async (keycloakId) => {
    if (!window.confirm('¿Está seguro que desea activar este usuario?')) {
      return;
    }

    try {
      const response = await adminUserService.activateAdminUser(keycloakId);
      if (response.success) {
        alert(response.message || 'Usuario activado correctamente');
        loadUsers(); // Recargar la lista
      } else {
        alert('Error al activar usuario: ' + (response.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error al activar usuario: ' + err.message);
    }
  };

  /**
   * Desactivar un usuario
   */
  const handleDeactivateUser = async (keycloakId) => {
    if (!window.confirm('¿Está seguro que desea desactivar este usuario?')) {
      return;
    }

    try {
      const response = await adminUserService.deactivateAdminUser(keycloakId);
      if (response.success) {
        alert(response.message || 'Usuario desactivado correctamente');
        loadUsers(); // Recargar la lista
      } else {
        alert('Error al desactivar usuario: ' + (response.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error al desactivar usuario: ' + err.message);
    }
  };

  /**
   * Eliminar un usuario
   */
  const handleDeleteUser = async (keycloakId, username) => {
    if (!window.confirm(`¿Está seguro que desea eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await adminUserService.deleteAdminUser(keycloakId);
      if (response.success) {
        alert(response.message || 'Usuario eliminado correctamente');
        loadUsers(); // Recargar la lista
      } else {
        alert('Error al eliminar usuario: ' + (response.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  /**
   * Filtrar y ordenar usuarios
   */
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = users.filter(user => {
      const matchesSearch = (
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatUserFullName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.documentNumber?.includes(searchTerm)
      );
      
      const matchesStatus = !statusFilter || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Ordenar usuarios
    filteredUsers.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';

      if (sortBy === 'fullName') {
        aValue = formatUserFullName(a);
        bValue = formatUserFullName(b);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredUsers;
  };

  /**
   * Cambiar ordenamiento
   */
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredUsers = getFilteredAndSortedUsers();

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

  return (
    <>
      <Header />
      <Sidebar activeClassName="admin-director-users-list" />
      
      <div className="page-wrapper">
        <div className="content">{/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Gestión de Usuarios Admin/Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Usuarios Admin/Director</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filtros y controles */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Buscar usuarios</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar por nombre, email, usuario o documento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Filtrar por estado</label>
                        <select
                          className="form-control"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="">Todos los estados</option>
                          {Object.entries(UserStatus).map(([key, value]) => (
                            <option key={key} value={value}>
                              {UserStatusLabels[value]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>&nbsp;</label>
                        <div className="d-block">
                          <Link to="/admin/admin-director/users/create" className="btn btn-primary">
                            <i className="fa fa-plus"></i> Nuevo Usuario
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <i className="fa fa-exclamation-triangle"></i> {error}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ml-2"
                    onClick={loadUsers}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover table-center mb-0">
                      <thead>
                        <tr>
                          <th 
                            className="cursor-pointer"
                            onClick={() => handleSort('username')}
                          >
                            Usuario
                            {sortBy === 'username' && (
                              <i className={`fa fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                            )}
                          </th>
                          <th 
                            className="cursor-pointer"
                            onClick={() => handleSort('fullName')}
                          >
                            Nombre Completo
                            {sortBy === 'fullName' && (
                              <i className={`fa fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                            )}
                          </th>
                          <th 
                            className="cursor-pointer"
                            onClick={() => handleSort('email')}
                          >
                            Email
                            {sortBy === 'email' && (
                              <i className={`fa fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                            )}
                          </th>
                          <th>Documento</th>
                          <th>Teléfono</th>
                          <th 
                            className="cursor-pointer"
                            onClick={() => handleSort('status')}
                          >
                            Estado
                            {sortBy === 'status' && (
                              <i className={`fa fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                            )}
                          </th>
                          <th 
                            className="cursor-pointer"
                            onClick={() => handleSort('createdAt')}
                          >
                            Fecha Creación
                            {sortBy === 'createdAt' && (
                              <i className={`fa fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                            )}
                          </th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center">
                              {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con los filtros aplicados'}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.keycloakId || user.id}>
                              <td>
                                <strong>{user.username}</strong>
                              </td>
                              <td>{formatUserFullName(user)}</td>
                              <td>{user.email}</td>
                              <td>
                                <div>
                                  <small className="text-muted">
                                    {DocumentTypeLabels[user.documentType]}
                                  </small>
                                  <br />
                                  {user.documentNumber}
                                </div>
                              </td>
                              <td>{user.phone || '-'}</td>
                              <td>
                                <span className={`badge badge-${getUserStatusColor(user.status)}`}>
                                  {UserStatusLabels[user.status]}
                                </span>
                              </td>
                              <td>
                                {user.createdAt && (
                                  <small>
                                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                  </small>
                                )}
                              </td>
                              <td>
                                <div className="actions">
                                  {/* Ver detalles - Siempre visible */}
                                  <Link
                                    to={`/admin/admin-director/users/${user.keycloakId}/view`}
                                    className="btn btn-sm btn-outline-info mr-1"
                                    title="Ver detalles"
                                  >
                                    <i className="fa fa-eye"></i>
                                  </Link>

                                  {/* Editar - Solo si el usuario NO está eliminado lógicamente */}
                                  {user.status !== UserStatus.I && (
                                    <Link
                                      to={`/admin/admin-director/users/${user.keycloakId}/edit`}
                                      className="btn btn-sm btn-outline-primary mr-1"
                                      title="Editar"
                                    >
                                      <i className="fa fa-edit"></i>
                                    </Link>
                                  )}

                                  {/* Activar/Desactivar/Restaurar */}
                                  {user.status === UserStatus.A ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-warning mr-1"
                                      title="Desactivar"
                                      onClick={() => handleDeactivateUser(user.keycloakId)}
                                    >
                                      <i className="fa fa-pause"></i>
                                    </button>
                                  ) : user.status === UserStatus.I ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success mr-1"
                                      title="Restaurar"
                                      onClick={() => handleActivateUser(user.keycloakId)}
                                    >
                                      <i className="fa fa-undo"></i>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success mr-1"
                                      title="Activar"
                                      onClick={() => handleActivateUser(user.keycloakId)}
                                    >
                                      <i className="fa fa-play"></i>
                                    </button>
                                  )}

                                  {/* Eliminar - Solo si el usuario NO está eliminado lógicamente */}
                                  {user.status !== UserStatus.I && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      title="Eliminar"
                                      onClick={() => handleDeleteUser(user.keycloakId, user.username)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Información de resultados */}
                  {filteredUsers.length > 0 && (
                    <div className="row mt-3">
                      <div className="col-12">
                        <p className="text-muted">
                          Mostrando {filteredUsers.length} de {users.length} usuarios
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDirectorUserList;
