import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userInstitutionService } from '../../../../services/users/userInstitutionService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const UserInstitutionEdit = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRelation, setUserRelation] = useState(null);

    const [formData, setFormData] = useState({
        assignments: [],
        status: 'A'
    });

    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    const roleOptions = [
        { value: 'TEACHER', label: 'Profesor' },
        { value: 'AUXILIARY', label: 'Auxiliar' },
        { value: 'DIRECTOR', label: 'Director' },
        { value: 'ADMINISTRATIVE', label: 'Administrativo' },
        { value: 'COORDINATOR', label: 'Coordinador' },
        { value: 'STUDENT', label: 'Estudiante' },
        { value: 'VISITOR', label: 'Visitante' }
    ];

    const statusOptions = [
        { value: 'A', label: 'Activo' },
        { value: 'I', label: 'Inactivo' },
        { value: 'SUSPENDED', label: 'Suspendido' }
    ];

    useEffect(() => {
        if (userId) {
            loadUserRelation();
        }
    }, [userId]);

    useEffect(() => {
        checkForChanges();
    }, [formData, originalData]);

    const loadUserRelation = async () => {
        try {
            setLoading(true);
            console.log('Cargando relaciones para usuario:', userId);
            
            const data = await userInstitutionService.getUserRelations(userId);
            console.log('Datos recibidos del backend:', data);
            
            setUserRelation(data);
            
            const initialFormData = {
                assignments: data.institutionAssignments || [],
                status: data.status || 'A'
            };
            
            console.log('Datos del formulario inicializados:', initialFormData);
            
            setFormData(initialFormData);
            setOriginalData(JSON.parse(JSON.stringify(initialFormData)));
        } catch (error) {
            console.error('Error loading user relation:', error);
            if (error.message.includes('not found') || error.message.includes('no encontrado')) {
                alert('No se encontraron relaciones para este usuario');
            } else {
                alert('Error al cargar la relación del usuario: ' + error.message);
            }
            navigate('/admin-director/user-institution');
        } finally {
            setLoading(false);
        }
    };

    const checkForChanges = () => {
        if (!originalData) return;
        
        const hasStatusChange = formData.status !== originalData.status;
        const hasAssignmentChanges = JSON.stringify(formData.assignments) !== JSON.stringify(originalData.assignments);
        
        setHasChanges(hasStatusChange || hasAssignmentChanges);
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({
            ...prev,
            status: e.target.value
        }));
    };

    const handleAssignmentChange = (index, field, value) => {
        const updatedAssignments = [...formData.assignments];
        updatedAssignments[index] = {
            ...updatedAssignments[index],
            [field]: value
        };
        
        setFormData(prev => ({
            ...prev,
            assignments: updatedAssignments
        }));

        // Limpiar errores
        if (errors[`assignment_${index}_${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`assignment_${index}_${field}`]: ''
            }));
        }
    };

    const addNewAssignment = () => {
        const newAssignment = {
            institutionId: '',
            institutionName: '',
            role: 'TEACHER',
            status: 'A',
            assignmentDate: new Date().toISOString(),
            endDate: '',
            isNew: true
        };

        setFormData(prev => ({
            ...prev,
            assignments: [...prev.assignments, newAssignment]
        }));
    };

    const removeAssignment = async (index) => {
        const assignment = formData.assignments[index];
        
        if (assignment.isNew) {
            // Si es una asignación nueva, simplemente la removemos del formulario
            const updatedAssignments = formData.assignments.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, assignments: updatedAssignments }));
            return;
        }

        // Si es una asignación existente, confirmar eliminación
        if (!window.confirm('¿Está seguro de eliminar esta asignación? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await userInstitutionService.deleteSpecificAssignment(userId, assignment.institutionId);
            alert('Asignación eliminada exitosamente');
            loadUserRelation(); // Recargar datos
        } catch (error) {
            console.error('Error removing assignment:', error);
            alert('Error al eliminar la asignación');
        }
    };

    const toggleAssignmentStatus = async (index) => {
        const assignment = formData.assignments[index];
        
        if (assignment.isNew) {
            // Para asignaciones nuevas, solo cambiar en el formulario
            const newStatus = assignment.status === 'A' ? 'I' : 'A';
            handleAssignmentChange(index, 'status', newStatus);
            return;
        }

        try {
            console.log('Cambiando estado de asignación:', {
                userId,
                institutionId: assignment.institutionId,
                currentStatus: assignment.status,
                action: assignment.status === 'A' ? 'deactivate' : 'activate'
            });

            if (assignment.status === 'A') {
                await userInstitutionService.deactivateAssignment(userId, assignment.institutionId);
                alert('Asignación desactivada');
            } else {
                await userInstitutionService.activateAssignment(userId, assignment.institutionId);
                alert('Asignación activada');
            }
            
            // Recargar datos después del cambio
            await loadUserRelation();
        } catch (error) {
            console.error('Error toggling assignment status:', error);
            alert('Error al cambiar el estado de la asignación: ' + error.message);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        formData.assignments.forEach((assignment, index) => {
            if (!assignment.institutionId) {
                newErrors[`assignment_${index}_institutionId`] = 'Debe seleccionar una institución';
            }
            if (!assignment.role) {
                newErrors[`assignment_${index}_role`] = 'Debe seleccionar un rol';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            alert('Por favor corrija los errores en el formulario');
            return;
        }

        try {
            setSaving(true);

            // Actualizar estado general si cambió
            if (formData.status !== originalData.status) {
                await userInstitutionService.changeRelationStatus(userId, formData.status);
            }

            // Procesar asignaciones nuevas
            const newAssignments = formData.assignments.filter(a => a.isNew);
            for (const assignment of newAssignments) {
                const assignmentData = {
                    institutionId: assignment.institutionId,
                    role: assignment.role,
                    assignmentDate: assignment.assignmentDate || null,
                    endDate: assignment.endDate || null,
                    description: assignment.status === 'A' ? 'Asignación activa' : 'Asignación inactiva'
                };
                
                // Remover campos nulos/vacíos
                Object.keys(assignmentData).forEach(key => {
                    if (assignmentData[key] === null || assignmentData[key] === '') {
                        delete assignmentData[key];
                    }
                });
                
                await userInstitutionService.assignUserToInstitution(userId, assignmentData);
            }

            // Actualizar roles y fechas de asignaciones existentes
            const existingAssignments = formData.assignments.filter(a => !a.isNew);
            const originalAssignments = originalData.assignments;
            
            for (const assignment of existingAssignments) {
                const original = originalAssignments.find(o => o.institutionId === assignment.institutionId);
                if (original) {
                    const hasRoleChange = original.role !== assignment.role;
                    const hasDateChange = original.assignmentDate !== assignment.assignmentDate || 
                                         original.endDate !== assignment.endDate;
                    
                    if (hasRoleChange || hasDateChange) {
                        const updateData = {
                            newRole: assignment.role,
                            assignmentDate: assignment.assignmentDate || null,
                            endDate: assignment.endDate || null
                        };
                        
                        // Remover campos nulos/vacíos
                        Object.keys(updateData).forEach(key => {
                            if (updateData[key] === null || updateData[key] === '') {
                                delete updateData[key];
                            }
                        });
                        
                        console.log('Actualizando rol para asignación:', {
                            userId,
                            institutionId: assignment.institutionId,
                            updateData,
                            original,
                            current: assignment
                        });
                        
                        const updateResult = await userInstitutionService.updateUserRole(userId, assignment.institutionId, updateData);
                        console.log('Resultado de actualización de rol:', updateResult);
                    }
                }
            }

            alert('Relación usuario-institución actualizada exitosamente');
            
            // Recargar los datos antes de navegar para asegurar consistencia
            await loadUserRelation();
            
            navigate('/admin-director/user-institution');
        } catch (error) {
            console.error('Error updating relation:', error);
            alert('Error al actualizar la relación');
        } finally {
            setSaving(false);
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
                <div className="alert alert-warning">
                    <h5>Usuario no encontrado</h5>
                    <p>No se encontraron relaciones para este usuario.</p>
                    <Link to="/admin-director/user-institution" className="btn btn-primary">
                        Volver a la lista
                    </Link>
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
                            <h4>Editar Relación Usuario-Institución</h4>
                            <h6>Modificar asignaciones de {userRelation.user?.firstName} {userRelation.user?.lastName}</h6>
                        </div>
                        <div className="page-btn">
                            <Link to="/admin-director/user-institution" className="btn btn-secondary">
                                <i className="fa fa-arrow-left me-2"></i>Volver
                            </Link>
                        </div>
                    </div>

            <form onSubmit={handleSubmit}>
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
                                    <div className="avatar avatar-lg me-3">
                                        <span className="avatar-title rounded-circle bg-primary text-white">
                                            {userRelation.user?.firstName?.charAt(0)}{userRelation.user?.lastName?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">{userRelation.user?.firstName} {userRelation.user?.lastName}</h6>
                                        <p className="text-muted mb-0">{userRelation.user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="status">Estado General</label>
                                <select
                                    id="status"
                                    className="form-control"
                                    value={formData.status}
                                    onChange={handleStatusChange}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4 d-flex align-items-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={loadUserRelation}
                                    disabled={loading}
                                    title="Recargar datos desde el servidor"
                                >
                                    <i className="fa fa-refresh me-2"></i>
                                    {loading ? 'Cargando...' : 'Recargar'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-warning"
                                    onClick={async () => {
                                        console.log('=== DEBUG INFO ===');
                                        console.log('UserId:', userId);
                                        console.log('FormData:', formData);
                                        console.log('OriginalData:', originalData);
                                        console.log('UserRelation:', userRelation);
                                        
                                        const testResult = await userInstitutionService.testConnection();
                                        console.log('Test de conexión:', testResult);
                                        
                                        if (userId) {
                                            try {
                                                const relations = await userInstitutionService.getUserRelations(userId);
                                                console.log('Relaciones actuales del usuario:', relations);
                                            } catch (error) {
                                                console.log('Error obteniendo relaciones:', error);
                                            }
                                        }
                                        
                                        alert('Check console for debug info');
                                    }}
                                    title="Debug - Ver información en consola"
                                >
                                    <i className="fa fa-bug me-2"></i>Debug
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={addNewAssignment}
                                >
                                    <i className="fa fa-plus me-2"></i>Agregar Asignación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asignaciones a Instituciones */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <i className="fa fa-building me-2"></i>Asignaciones a Instituciones
                        </h5>
                    </div>
                    <div className="card-body">
                        {formData.assignments.length === 0 ? (
                            <div className="text-center py-4">
                                <div className="text-muted">
                                    <i className="fa fa-inbox fa-3x mb-3 d-block"></i>
                                    No hay asignaciones a instituciones
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={addNewAssignment}
                                >
                                    Agregar Primera Asignación
                                </button>
                            </div>
                        ) : (
                            <div className="row">
                                {formData.assignments.map((assignment, index) => (
                                    <div key={index} className="col-12 mb-4">
                                        <div className={`card ${assignment.isNew ? 'border-success' : ''}`}>
                                            <div className="card-header bg-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">
                                                        {assignment.isNew ? (
                                                            <span className="badge badge-success me-2">Nueva</span>
                                                        ) : null}
                                                        Asignación {index + 1}
                                                    </h6>
                                                    <div>
                                                        {assignment.status === 'A' ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning me-2"
                                                                onClick={() => toggleAssignmentStatus(index)}
                                                                title="Desactivar asignación"
                                                            >
                                                                <i className="fa fa-pause"></i> Desactivar
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => toggleAssignmentStatus(index)}
                                                                title="Activar asignación"
                                                            >
                                                                <i className="fa fa-play"></i> Activar
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => removeAssignment(index)}
                                                            title="Eliminar asignación"
                                                        >
                                                            <i className="fa fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>
                                                                Institución <span className="text-danger">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className={`form-control ${
                                                                    errors[`assignment_${index}_institutionId`] ? 'is-invalid' : ''
                                                                }`}
                                                                value={assignment.institutionId}
                                                                onChange={(e) => {
                                                                    handleAssignmentChange(index, 'institutionId', e.target.value);
                                                                }}
                                                                disabled={!assignment.isNew}
                                                                placeholder="Ingrese el ID de la institución"
                                                            />
                                                            {errors[`assignment_${index}_institutionId`] && (
                                                                <div className="invalid-feedback">
                                                                    {errors[`assignment_${index}_institutionId`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label>
                                                                Rol <span className="text-danger">*</span>
                                                            </label>
                                                            <select
                                                                className={`form-control ${
                                                                    errors[`assignment_${index}_role`] ? 'is-invalid' : ''
                                                                }`}
                                                                value={assignment.role}
                                                                onChange={(e) => handleAssignmentChange(index, 'role', e.target.value)}
                                                            >
                                                                {roleOptions.map(option => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {errors[`assignment_${index}_role`] && (
                                                                <div className="invalid-feedback">
                                                                    {errors[`assignment_${index}_role`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label>Estado</label>
                                                            <div className="mt-2">
                                                                <span className={`badge text-white ${
                                                                    assignment.status === 'A' ? 'bg-success' : 'bg-danger'
                                                                }`}>
                                                                    <i className={`fa ${assignment.status === 'A' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                                                    {assignment.status === 'A' ? 'ACTIVO' : 'INACTIVO'}
                                                                </span>
                                                            </div>
                                                            {assignment.assignmentDate && (
                                                                <small className="text-muted d-block mt-1">
                                                                    Asignado: {new Date(assignment.assignmentDate).toLocaleDateString('es-ES')}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Segunda fila con campos de fecha */}
                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>
                                                                Fecha de Asignación
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={userInstitutionService.formatDateForInput(assignment.assignmentDate)}
                                                                onChange={(e) => {
                                                                    const dateValue = userInstitutionService.convertDateInputToISO(e.target.value, false);
                                                                    handleAssignmentChange(index, 'assignmentDate', dateValue);
                                                                }}
                                                            />
                                                            <small className="text-muted">
                                                                Fecha de inicio de la asignación
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>
                                                                Fecha de Fin (Opcional)
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={userInstitutionService.formatDateForInput(assignment.endDate)}
                                                                onChange={(e) => {
                                                                    const dateValue = userInstitutionService.convertDateInputToISO(e.target.value, true);
                                                                    handleAssignmentChange(index, 'endDate', dateValue);
                                                                }}
                                                                min={userInstitutionService.formatDateForInput(assignment.assignmentDate)}
                                                            />
                                                            <small className="text-muted">
                                                                Fecha en que termina la asignación
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones */}
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/admin-director/user-institution" className="btn btn-secondary">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving || !hasChanges}
                            >
                                {saving ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin me-2"></i>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-save me-2"></i>
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                        {!hasChanges && (
                            <div className="text-muted text-end mt-2">
                                <small>No hay cambios pendientes</small>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
);
};

export default UserInstitutionEdit;
