import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userInstitutionService } from '../../../../services/users/userInstitutionService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const UserInstitutionView = () => {
    const { userId } = useParams();
    const [loading, setLoading] = useState(true);
    const [userRelation, setUserRelation] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        if (userId) {
            loadUserRelation();
        }
    }, [userId]);

    const loadUserRelation = async () => {
        try {
            setLoading(true);
            const data = await userInstitutionService.getUserRelations(userId);
            setUserRelation(data);
        } catch (error) {
            console.error('Error loading user relation:', error);
            alert('Error al cargar la información del usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAssignmentStatus = async (institutionId, isActive) => {
        const actionKey = `${institutionId}_toggle`;
        try {
            setActionLoading(prev => ({ ...prev, [actionKey]: true }));
            
            if (isActive) {
                await userInstitutionService.deactivateAssignment(userId, institutionId);
                alert('Asignación desactivada exitosamente');
            } else {
                await userInstitutionService.activateAssignment(userId, institutionId);
                alert('Asignación activada exitosamente');
            }
            
            loadUserRelation(); // Recargar datos
        } catch (error) {
            console.error('Error toggling assignment status:', error);
            alert('Error al cambiar el estado de la asignación');
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const handleDeleteAssignment = async (institutionId, institutionName) => {
        if (!window.confirm(`¿Está seguro de eliminar la asignación a "${institutionName}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        const actionKey = `${institutionId}_delete`;
        try {
            setActionLoading(prev => ({ ...prev, [actionKey]: true }));
            await userInstitutionService.deleteSpecificAssignment(userId, institutionId);
            alert('Asignación eliminada exitosamente');
            loadUserRelation(); // Recargar datos
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Error al eliminar la asignación');
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const handleChangeGeneralStatus = async (newStatus) => {
        if (!window.confirm(`¿Está seguro de cambiar el estado general a "${newStatus}"?`)) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, generalStatus: true }));
            await userInstitutionService.changeRelationStatus(userId, newStatus);
            alert('Estado general actualizado exitosamente');
            loadUserRelation(); // Recargar datos
        } catch (error) {
            console.error('Error changing general status:', error);
            alert('Error al cambiar el estado general');
        } finally {
            setActionLoading(prev => ({ ...prev, generalStatus: false }));
        }
    };

    const handleDeleteAllRelations = async () => {
        if (!window.confirm('¿Está seguro de eliminar TODAS las relaciones de este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, deleteAll: true }));
            await userInstitutionService.deleteAllRelations(userId);
            alert('Todas las relaciones eliminadas exitosamente');
            // Después de eliminar todo, redirigir a la lista
            window.location.href = '/admin-director/user-institution';
        } catch (error) {
            console.error('Error deleting all relations:', error);
            alert('Error al eliminar las relaciones');
        } finally {
            setActionLoading(prev => ({ ...prev, deleteAll: false }));
        }
    };

    const getRoleLabel = (role) => {
        const roleLabels = {
            'ADMIN': 'Administrador',
            'DIRECTOR': 'Director',
            'TEACHER': 'Profesor',
            'STUDENT': 'Estudiante'
        };
        return roleLabels[role] || role;
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            'A': 'Activo',
            'I': 'Inactivo',
            'SUSPENDED': 'Suspendido'
        };
        return statusLabels[status] || status;
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'A':
                return 'badge-linesuccess';
            case 'I':
                return 'badge-linedanger';
            case 'SUSPENDED':
                return 'badge-linewarning';
            default:
                return 'badge-secondary';
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!userRelation) {
        return (
            <div className="content">
                <div className="page-header">
                    <div className="page-title">
                        <h4>Usuario No Encontrado</h4>
                        <h6>No se encontraron relaciones para este usuario</h6>
                    </div>
                    <div className="page-btn">
                        <Link to="/admin-director/user-institution" className="btn btn-secondary">
                            <i className="fa fa-arrow-left me-2"></i>Volver
                        </Link>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body text-center py-5">
                        <i className="fa fa-user-times fa-4x text-muted mb-3"></i>
                        <h5>Usuario no encontrado</h5>
                        <p className="text-muted">No se encontraron relaciones usuario-institución para este ID.</p>
                        <Link to="/admin-director/user-institution" className="btn btn-primary">
                            Volver a la lista
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-wrapper">
            <Header />
            <Sidebar activeClassName="user-institution-list" />
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="page-title">
                            <h4>Detalles de Relación Usuario-Institución</h4>
                            <h6>Información completa de {userRelation.user?.firstName} {userRelation.user?.lastName}</h6>
                        </div>
                        <div className="page-btn">
                            <Link to="/admin-director/user-institution" className="btn btn-secondary me-2">
                                <i className="fa fa-arrow-left me-2"></i>Volver
                            </Link>
                            <Link 
                                to={`/admin-director/user-institution/edit/${userId}`} 
                                className="btn btn-primary"
                            >
                                <i className="fa fa-edit me-2"></i>Editar
                            </Link>
                        </div>
                    </div>

            {/* Información del Usuario */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <i className="fa fa-user me-2"></i>Información del Usuario
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="d-flex align-items-center">
                                <div className="avatar avatar-xl me-3">
                                    <span className="avatar-title rounded-circle bg-primary text-white">
                                        {userRelation.user?.firstName?.charAt(0)}{userRelation.user?.lastName?.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h5 className="mb-1">{userRelation.user?.firstName} {userRelation.user?.lastName}</h5>
                                    <p className="text-muted mb-1">{userRelation.user?.email}</p>
                                    <p className="text-muted mb-0">ID: {userRelation.userId}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="info-item">
                                <label>Estado General:</label>
                                <div className="mt-1">
                                    <span className={`badge ${getStatusBadgeClass(userRelation.status)}`}>
                                        {getStatusLabel(userRelation.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="info-item">
                                <label>Última Modificación:</label>
                                <div className="mt-1">
                                    {userRelation.lastModified ? 
                                        new Date(userRelation.lastModified).toLocaleString() : 
                                        'N/A'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asignaciones a Instituciones */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                        <i className="fa fa-building me-2"></i>
                        Asignaciones a Instituciones ({userRelation.institutionAssignments?.length || 0})
                    </h5>
                    <div className="dropdown">
                        <button
                            className="btn btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            disabled={actionLoading.generalStatus}
                        >
                            {actionLoading.generalStatus ? (
                                <i className="fa fa-spinner fa-spin me-2"></i>
                            ) : (
                                <i className="fa fa-cog me-2"></i>
                            )}
                            Acciones Generales
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => handleChangeGeneralStatus('A')}
                                    disabled={userRelation.status === 'A'}
                                >
                                    <i className="fa fa-play me-2"></i>Activar Usuario
                                </button>
                            </li>
                            <li>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => handleChangeGeneralStatus('I')}
                                    disabled={userRelation.status === 'I'}
                                >
                                    <i className="fa fa-pause me-2"></i>Desactivar Usuario
                                </button>
                            </li>
                            <li>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => handleChangeGeneralStatus('SUSPENDED')}
                                    disabled={userRelation.status === 'SUSPENDED'}
                                >
                                    <i className="fa fa-ban me-2"></i>Suspender Usuario
                                </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button 
                                    className="dropdown-item text-danger"
                                    onClick={handleDeleteAllRelations}
                                    disabled={actionLoading.deleteAll}
                                >
                                    {actionLoading.deleteAll ? (
                                        <i className="fa fa-spinner fa-spin me-2"></i>
                                    ) : (
                                        <i className="fa fa-trash me-2"></i>
                                    )}
                                    Eliminar Todas las Relaciones
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="card-body">
                    {!userRelation.institutionAssignments || userRelation.institutionAssignments.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fa fa-building fa-4x text-muted mb-3"></i>
                            <h5>Sin Asignaciones</h5>
                            <p className="text-muted">Este usuario no tiene asignaciones a ninguna institución.</p>
                            <Link 
                                to={`/admin-director/user-institution/edit/${userId}`}
                                className="btn btn-primary"
                            >
                                <i className="fa fa-plus me-2"></i>Agregar Asignación
                            </Link>
                        </div>
                    ) : (
                        <div className="row">
                            {userRelation.institutionAssignments.map((assignment, index) => (
                                <div key={index} className="col-md-6 col-lg-4 mb-4">
                                    <div className="card border">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <h6 className="card-title mb-0">{assignment.institutionName}</h6>
                                                <span className={`badge ${assignment.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                    {assignment.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            
                                            <div className="info-group mb-3">
                                                <div className="info-item mb-2">
                                                    <label><strong>Rol:</strong></label>
                                                    <span className="badge badge-outline-primary ms-2">
                                                        {getRoleLabel(assignment.role)}
                                                    </span>
                                                </div>
                                                <div className="info-item mb-2">
                                                    <label><strong>Fecha de Asignación:</strong></label>
                                                    <div>{assignment.assignedDate ? 
                                                        new Date(assignment.assignedDate).toLocaleDateString() : 
                                                        'N/A'
                                                    }</div>
                                                </div>
                                                {assignment.lastModified && (
                                                    <div className="info-item mb-2">
                                                        <label><strong>Última Modificación:</strong></label>
                                                        <div>{new Date(assignment.lastModified).toLocaleDateString()}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex gap-2">
                                                <button
                                                    className={`btn btn-sm ${
                                                        assignment.isActive ? 'btn-outline-warning' : 'btn-outline-success'
                                                    } flex-1`}
                                                    onClick={() => handleToggleAssignmentStatus(assignment.institutionId, assignment.isActive)}
                                                    disabled={actionLoading[`${assignment.institutionId}_toggle`]}
                                                    title={assignment.isActive ? 'Desactivar asignación' : 'Activar asignación'}
                                                >
                                                    {actionLoading[`${assignment.institutionId}_toggle`] ? (
                                                        <i className="fa fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className={`fa ${assignment.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                                                    )}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteAssignment(assignment.institutionId, assignment.institutionName)}
                                                    disabled={actionLoading[`${assignment.institutionId}_delete`]}
                                                    title="Eliminar asignación"
                                                >
                                                    {actionLoading[`${assignment.institutionId}_delete`] ? (
                                                        <i className="fa fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fa fa-trash"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Historial de Movimientos (si está disponible) */}
            {userRelation.assignmentMovements && userRelation.assignmentMovements.length > 0 && (
                <div className="card mt-4">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <i className="fa fa-history me-2"></i>Historial de Movimientos
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Acción</th>
                                        <th>Institución</th>
                                        <th>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userRelation.assignmentMovements.map((movement, index) => (
                                        <tr key={index}>
                                            <td>{new Date(movement.timestamp).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${
                                                    movement.action === 'ASSIGNED' ? 'badge-success' :
                                                    movement.action === 'DEACTIVATED' ? 'badge-warning' :
                                                    movement.action === 'DELETED' ? 'badge-danger' :
                                                    'badge-info'
                                                }`}>
                                                    {movement.action}
                                                </span>
                                            </td>
                                            <td>{movement.institutionName}</td>
                                            <td>{movement.details}</td>
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
);
};

export default UserInstitutionView;
