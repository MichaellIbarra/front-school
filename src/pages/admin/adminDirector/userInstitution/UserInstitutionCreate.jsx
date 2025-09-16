import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userInstitutionService } from '../../../../services/adminDirectorService/userInstitutionService';
import directorUserService from '../../../../services/adminDirectorService/directorUserService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const UserInstitutionCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [formData, setFormData] = useState({
        userId: '',
        institutionId: '',
        role: 'TEACHER',
        isActive: true
    });

    const [errors, setErrors] = useState({});

    const roleOptions = [
        { value: 'TEACHER', label: 'Profesor' },
        { value: 'AUXILIARY', label: 'Auxiliar' },
        { value: 'DIRECTOR', label: 'Director' },
        { value: 'ADMINISTRATIVE', label: 'Administrativo' }
    ];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            // Obtener usuarios usando el método correcto
            const data = await directorUserService.getAllCompleteUsers();
            setUsers(data.filter(user => user.status === 'A'));
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error al cargar la lista de usuarios');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.userId) {
            newErrors.userId = 'Debe seleccionar un usuario';
        }

        if (!formData.institutionId) {
            newErrors.institutionId = 'Debe seleccionar una institución';
        }

        if (!formData.role) {
            newErrors.role = 'Debe seleccionar un rol';
        }

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
            setLoading(true);

            const assignmentData = {
                institutionId: formData.institutionId,
                role: formData.role,
                isActive: formData.isActive
            };

            await userInstitutionService.assignUserToInstitution(formData.userId, assignmentData);
            alert('Usuario asignado a institución exitosamente');
            navigate('/admin-director/user-institution');
        } catch (error) {
            console.error('Error creating assignment:', error);
            
            if (error.response?.status === 409) {
                alert('El usuario ya está asignado a esta institución');
            } else if (error.response?.status === 404) {
                alert('Usuario o institución no encontrado');
            } else if (error.response?.status === 403) {
                alert('El usuario no está activo');
            } else {
                alert('Error al asignar usuario a institución');
            }
        } finally {
            setLoading(false);
        }
    };

    const selectedUser = users.find(user => user.id === formData.userId);

    return (
        <div className="main-wrapper">
            <Header />
            <Sidebar activeClassName="user-institution-create" />
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="page-title">
                            <h4>Asignar Usuario a Institución</h4>
                            <h6>Crear nueva relación usuario-institución</h6>
                        </div>
                        <div className="page-btn">
                            <Link to="/admin-director/user-institution" className="btn btn-secondary">
                                <i className="fa fa-arrow-left me-2"></i>Volver
                            </Link>
                        </div>
                    </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            {/* Selección de Usuario */}
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="userId">
                                        Usuario <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        id="userId"
                                        name="userId"
                                        className={`form-control ${errors.userId ? 'is-invalid' : ''}`}
                                        value={formData.userId}
                                        onChange={handleInputChange}
                                        disabled={loadingUsers}
                                    >
                                        <option value="">
                                            {loadingUsers ? 'Cargando usuarios...' : 'Seleccione un usuario'}
                                        </option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} - {user.email}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.userId && (
                                        <div className="invalid-feedback">{errors.userId}</div>
                                    )}
                                </div>
                            </div>

                            {/* Selección de Institución */}
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="institutionId">
                                        Institución <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="institutionId"
                                        name="institutionId"
                                        className={`form-control ${errors.institutionId ? 'is-invalid' : ''}`}
                                        value={formData.institutionId}
                                        onChange={handleInputChange}
                                        placeholder="Ingrese el ID de la institución"
                                    />
                                    {errors.institutionId && (
                                        <div className="invalid-feedback">{errors.institutionId}</div>
                                    )}
                                </div>
                            </div>

                            {/* Rol */}
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="role">
                                        Rol <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        {roleOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && (
                                        <div className="invalid-feedback">{errors.role}</div>
                                    )}
                                </div>
                            </div>

                            {/* Estado Activo */}
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="d-block">Estado</label>
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            name="isActive"
                                            className="form-check-input"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label" htmlFor="isActive">
                                            Asignación activa
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        Si está marcado, la asignación estará activa inmediatamente
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Resumen de la asignación */}
                        {formData.userId && formData.institutionId && (
                            <div className="mt-4">
                                <div className="alert alert-info">
                                    <h6><i className="fa fa-info-circle me-2"></i>Resumen de la asignación:</h6>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <strong>Usuario:</strong><br />
                                            {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'N/A'}<br />
                                            <small className="text-muted">{selectedUser?.email}</small>
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Institución:</strong><br />
                                            {formData.institutionId || 'N/A'}<br />
                                            <small className="text-muted">ID de institución</small>
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Rol:</strong><br />
                                            {roleOptions.find(opt => opt.value === formData.role)?.label || 'N/A'}<br />
                                            <small className="text-muted">
                                                Estado: {formData.isActive ? 'Activo' : 'Inactivo'}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fa fa-spinner fa-spin me-2"></i>
                                                Asignando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-save me-2"></i>
                                                Asignar Usuario
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
);
};

export default UserInstitutionCreate;
