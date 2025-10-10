import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import directorUserService from '../../../../services/adminDirectorService/directorUserService';
import StaffReportExporter from '../../../../utils/directorPersonal/staffReportExporter';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import { 
  UserStatus, 
  UserStatusLabels, 
  DocumentTypeLabels, 
  formatUserFullName, 
  getUserStatusColor 
} from '../../../../types/users/user.types';

const DirectorPersonalList = () => {
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
   * Cargar todos los usuarios director personal
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await directorUserService.getAllStaff();
      if (response.success) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError(err.message);
      alert('Error al cargar usuarios: ' + err.message);
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
      const response = await directorUserService.activateStaffUser(keycloakId);
      if (response.success) {
        alert(response.message);
        loadUsers(); // Recargar la lista
      } else {
        throw new Error(response.error || 'Error al activar usuario');
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
      const response = await directorUserService.deactivateStaffUser(keycloakId);
      if (response.success) {
        alert(response.message);
        loadUsers(); // Recargar la lista
      } else {
        throw new Error(response.error || 'Error al desactivar usuario');
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
      const response = await directorUserService.deleteStaffUser(keycloakId);
      if (response.success) {
        alert(response.message);
        loadUsers(); // Recargar la lista
      } else {
        throw new Error(response.error || 'Error al eliminar usuario');
      }
    } catch (err) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  /**
   * Exportar nómina completa a PDF
   */
  const handleExportPDF = () => {
    const filteredData = getFilteredAndSortedUsers();
    const result = StaffReportExporter.exportStaffToPDF(filteredData);
    if (result.success) {
      alert(result.message);
    } else {
      alert('Error: ' + result.error);
    }
  };

  /**
   * Exportar nómina completa a CSV
   */
  const handleExportCSV = () => {
    const filteredData = getFilteredAndSortedUsers();
    const result = StaffReportExporter.exportStaffToCSV(filteredData);
    if (result.success) {
      alert(result.message);
    } else {
      alert('Error: ' + result.error);
    }
  };

  /**
   * Exportar solo profesores
   */
  const handleExportTeachers = () => {
    const result = StaffReportExporter.exportByRole(users, 'TEACHER');
    if (result.success) {
      alert(result.message);
    } else {
      alert('Error: ' + result.error);
    }
  };

  /**
   * Exportar solo personal activo
   */
  const handleExportActive = () => {
    const result = StaffReportExporter.exportActiveStaff(users);
    if (result.success) {
      alert(result.message);
    } else {
      alert('Error: ' + result.error);
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
      <>
        <Header />
        <Sidebar activeClassName="director-personal-list" />
        
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

  return (
    <>
      <Header />
      <Sidebar activeClassName="director-personal-list" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Gestión de Personal Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Personal Director</li>
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
                        <label>Buscar personal</label>
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
                          <Link to="/admin/admin-director/director-personal/create" className="btn btn-primary">
                            <i className="fa fa-plus"></i> Nuevo Personal
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Reportes */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="card-title mb-0">
                    <i className="fa fa-file-text"></i> Reportes de Nómina
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-12">
                      <p className="text-muted mb-3">
                        Genere reportes de la nómina de personal en diferentes formatos
                      </p>
                      <div className="btn-toolbar" role="toolbar">
                        <div className="btn-group mr-2 mb-2" role="group">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleExportPDF}
                            disabled={filteredUsers.length === 0}
                            title="Exportar nómina completa a PDF"
                          >
                            <i className="fa fa-file-pdf-o"></i> PDF Completo
                          </button>
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleExportCSV}
                            disabled={filteredUsers.length === 0}
                            title="Exportar nómina completa a CSV"
                          >
                            <i className="fa fa-file-excel-o"></i> CSV Completo
                          </button>
                        </div>
                        
                        <div className="btn-group mr-2 mb-2" role="group">
                          <button
                            type="button"
                            className="btn btn-info"
                            onClick={handleExportTeachers}
                            disabled={users.filter(u => u.roles?.includes('TEACHER')).length === 0}
                            title="Exportar solo profesores a PDF"
                          >
                            <i className="fa fa-graduation-cap"></i> Solo Profesores
                          </button>
                          <button
                            type="button"
                            className="btn btn-warning"
                            onClick={handleExportActive}
                            disabled={users.filter(u => u.status === 'A').length === 0}
                            title="Exportar solo personal activo a PDF"
                          >
                            <i className="fa fa-check-circle"></i> Solo Activos
                          </button>
                        </div>

                        <div className="btn-group mb-2" role="group">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => window.print()}
                            disabled={filteredUsers.length === 0}
                            title="Imprimir vista actual"
                          >
                            <i className="fa fa-print"></i> Imprimir Vista
                          </button>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                        <i className="fa fa-info-circle"></i> Los reportes se generan con los datos filtrados actuales.
                        Total: <strong>{filteredUsers.length}</strong> registro(s)
                      </small>
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
                              {users.length === 0 ? 'No hay personal registrado' : 'No se encontraron usuarios con los filtros aplicados'}
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
                                    to={`/admin/admin-director/director-personal/${user.keycloakId}/view`}
                                    className="btn btn-sm btn-outline-info mr-1"
                                    title="Ver detalles"
                                  >
                                    <i className="fa fa-eye"></i>
                                  </Link>

                                  {/* Editar - Solo si el usuario NO está eliminado lógicamente */}
                                  {user.status !== UserStatus.I && (
                                    <Link
                                      to={`/admin/admin-director/director-personal/${user.keycloakId}/edit`}
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

export default DirectorPersonalList;
