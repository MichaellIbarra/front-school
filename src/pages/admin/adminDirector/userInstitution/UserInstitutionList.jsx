import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userInstitutionService } from '../../../../services/users/userInstitutionService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const UserInstitutionList = () => {
    const [relations, setRelations] = useState([]);
    const [filteredRelations, setFilteredRelations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        loadRelations();
    }, []);

    useEffect(() => {
        filterRelations();
    }, [relations, searchTerm, statusFilter, roleFilter]);

    const loadRelations = async () => {
        try {
            setLoading(true);
            const data = await userInstitutionService.getAllRelations();
            setRelations(data);
        } catch (error) {
            console.error('Error loading relations:', error);
            alert('Error al cargar las relaciones usuario-institución');
        } finally {
            setLoading(false);
        }
    };

    const filterRelations = () => {
        let filtered = relations;

        // Filtro por término de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(relation =>
                relation.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                relation.institutionAssignments?.some(assignment =>
                    assignment.institutionId?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Filtro por estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(relation => relation.status === statusFilter);
        }

        // Filtro por rol
        if (roleFilter !== 'all') {
            filtered = filtered.filter(relation =>
                relation.institutionAssignments?.some(assignment => assignment.role === roleFilter)
            );
        }

        setFilteredRelations(filtered);
    };

    const handleDeleteRelation = async (userId) => {
        if (window.confirm('¿Está seguro de que desea eliminar todas las relaciones de este usuario?')) {
            try {
                await userInstitutionService.deleteAllRelations(userId);
                alert('Relaciones eliminadas exitosamente');
                loadRelations();
            } catch (error) {
                console.error('Error deleting relations:', error);
                alert('Error al eliminar las relaciones');
            }
        }
    };

    const handleDeactivateRelation = async (userId) => {
        try {
            await userInstitutionService.changeRelationStatus(userId, 'I');
            alert('Estado de relación cambiado a INACTIVO exitosamente');
            loadRelations(); // Recargar datos después del cambio
        } catch (error) {
            console.error('Error deactivating relations:', error);
            alert('Error al cambiar el estado de la relación');
        }
    };

    const handleActivateRelation = async (userId) => {
        try {
            await userInstitutionService.changeRelationStatus(userId, 'A');
            alert('Estado de relación cambiado a ACTIVO exitosamente');
            loadRelations(); // Recargar datos después del cambio
        } catch (error) {
            console.error('Error activating relations:', error);
            alert('Error al cambiar el estado de la relación');
        }
    };

    const handleReloadData = () => {
        loadRelations();
    };

    return (
        <div className="main-wrapper">
            <Header />
            <Sidebar activeClassName="user-institution-list" />
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="row">
                            <div className="col-sm-12">
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <Link to="/admin-director">AdminDirector</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Gestión Usuario-Institución</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card card-table show-entire">
                                <div className="card-body">
                                    <div className="page-table-header mb-2">
                                        <div className="row align-items-center">
                                            <div className="col-md-8">
                                                <div className="doctor-table-blk">
                                                    <h3>Gestión de Relaciones Usuario-Institución</h3>
                                                </div>
                                            </div>
                                            <div className="col-md-4 text-end">
                                                <div className="btn-group" role="group">
                                                    <button 
                                                        className="btn btn-outline-info" 
                                                        onClick={handleReloadData}
                                                        title="Recargar datos"
                                                        disabled={loading}
                                                    >
                                                        <i className="fa fa-refresh"></i> {loading ? 'Cargando...' : 'Recargar'}
                                                    </button>
                                                    <Link 
                                                        to="/admin-director/user-institution/create" 
                                                        className="btn btn-primary"
                                                        title="Agregar nueva relación"
                                                    >
                                                        <i className="fa fa-plus"></i> Agregar Relación
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filtros */}
                                    <div className="row mb-3">
                                        <div className="col-md-4">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Buscar por ID de usuario o institución..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <select
                                                className="form-control"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="all">Todos los estados</option>
                                                <option value="A">Activo</option>
                                                <option value="I">Inactivo</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <select
                                                className="form-control"
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                            >
                                                <option value="all">Todos los roles</option>
                                                <option value="TEACHER">Profesor</option>
                                                <option value="AUXILIARY">Auxiliar</option>
                                                <option value="DIRECTOR">Director</option>
                                                <option value="ADMINISTRATIVE">Administrativo</option>
                                                <option value="COORDINATOR">Coordinador</option>
                                                <option value="STUDENT">Estudiante</option>
                                                <option value="VISITOR">Visitante</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setStatusFilter('all');
                                                    setRoleFilter('all');
                                                }}
                                            >
                                                Limpiar Filtros
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tabla */}
                                    <div className="table-responsive">
                                        {loading ? (
                                            <div className="text-center p-4">
                                                <div className="spinner-border" role="status">
                                                    <span className="sr-only">Cargando...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <table className="table border-0 custom-table comman-table datatable mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>USUARIO</th>
                                                        <th>EMAIL</th>
                                                        <th>INSTITUCIONES ASIGNADAS</th>
                                                        <th>ESTADO GENERAL</th>
                                                        <th>FECHA ACTUALIZACIÓN</th>
                                                        <th>ACCIONES</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRelations.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="text-center">
                                                                No se encontraron relaciones usuario-institución
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredRelations.map((relation) => (
                                                            <tr key={relation.userId}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="avatar avatar-sm me-2">
                                                                            <span className="avatar-title rounded-circle bg-primary text-white">
                                                                                {relation.userId?.charAt(0)?.toUpperCase()}{relation.userId?.charAt(1)?.toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <strong className="text-dark">Usuario: {relation.userId}</strong>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="text-dark">{relation.userId}</span>
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        {relation.institutionAssignments?.map((assignment, index) => (
                                                                            <span key={index} className="badge bg-info text-white me-1 mb-1">
                                                                                {assignment.institutionId} ({assignment.role})
                                                                            </span>
                                                                        ))}
                                                                        {(!relation.institutionAssignments || relation.institutionAssignments.length === 0) && (
                                                                            <span className="text-muted">Sin asignaciones</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge text-white ${
                                                                        relation.status === 'A' ? 'bg-success' : 
                                                                        relation.status === 'I' ? 'bg-danger' : 
                                                                        'bg-secondary'
                                                                    }`}>
                                                                        {relation.status === 'A' ? 'ACTIVO' : 
                                                                         relation.status === 'I' ? 'INACTIVO' : 
                                                                         relation.status || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-dark">
                                                                        {relation.updatedAt ? userInstitutionService.formatDate(relation.updatedAt) : 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="actions">
                                                                        <Link
                                                                            className="btn btn-sm bg-success-light me-2"
                                                                            to={`/admin-director/user-institution/view/${relation.userId}`}
                                                                        >
                                                                            <i className="fa fa-eye"></i>
                                                                        </Link>
                                                                        {/* Editar - Solo si la relación NO está eliminada lógicamente */}
                                                                        {relation.status !== 'I' && (
                                                                            <Link
                                                                                className="btn btn-sm bg-danger-light me-2"
                                                                                to={`/admin-director/user-institution/edit/${relation.userId}`}
                                                                            >
                                                                                <i className="fa fa-edit"></i>
                                                                            </Link>
                                                                        )}
                                                                        {relation.status === 'A' ? (
                                                                            <button
                                                                                className="btn btn-sm bg-warning-light me-2"
                                                                                onClick={() => handleDeactivateRelation(relation.userId)}
                                                                                title="Cambiar estado a INACTIVO"
                                                                            >
                                                                                <i className="fa fa-ban"></i>
                                                                            </button>
                                                                        ) : relation.status === 'I' ? (
                                                                            <button
                                                                                className="btn btn-sm bg-success-light me-2"
                                                                                onClick={() => handleActivateRelation(relation.userId)}
                                                                                title="Restaurar"
                                                                            >
                                                                                <i className="fa fa-undo"></i>
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                className="btn btn-sm bg-success-light me-2"
                                                                                onClick={() => handleActivateRelation(relation.userId)}
                                                                                title="Cambiar estado a ACTIVO"
                                                                            >
                                                                                <i className="fa fa-check"></i>
                                                                            </button>
                                                                        )}
                                                                        {/* Eliminar - Solo si la relación NO está eliminada lógicamente */}
                                                                        {relation.status !== 'I' && (
                                                                            <button
                                                                                className="btn btn-sm bg-danger-light"
                                                                                onClick={() => handleDeleteRelation(relation.userId)}
                                                                                title="Eliminar"
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInstitutionList;