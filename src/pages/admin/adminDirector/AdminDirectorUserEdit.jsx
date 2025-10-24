import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import adminUserService from '../../../services/users/adminUserService';
import reniecService from '../../../services/users/reniecService';
import institutionAdminService from '../../../services/institutions/institutionAdminService';
import { 
  UserStatus, 
  DocumentType, 
  UserRoles,
  createUserModel, 
  userValidationRules,
  DocumentTypeLabels,
  UserRoleLabels
} from '../../../types/users/user.types';

const AdminDirectorUserEdit = () => {
  const { keycloakId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(createUserModel());
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [dniSearch, setDniSearch] = useState('');
  const [searchingDNI, setSearchingDNI] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (keycloakId) {
      loadUserData();
    }
    loadInstitutions();
  }, [keycloakId]);

  /**
   * Cargar lista de instituciones
   */
  const loadInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const response = await institutionAdminService.getAllInstitutions();
      if (response.success) {
        setInstitutions(response.data);
      } else {
        console.error('Error al cargar instituciones:', response.error);
      }
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  /**
   * Cargar datos del usuario a editar
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Obtener el usuario específico por keycloakId
      const response = await adminUserService.getAdminUserByKeycloakId(keycloakId);
      
      if (!response.success) {
        throw new Error(response.error || 'Error al obtener usuario');
      }
      
      const userData = response.data;
      
      if (!userData) {
        throw new Error('Usuario no encontrado');
      }
      
      // Mapear datos del usuario al formato del formulario
      const mappedData = {
        username: userData.username || '',
        email: userData.email || '',
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        roles: userData.roles || [],
        documentType: userData.documentType || DocumentType.DNI,
        documentNumber: userData.documentNumber || '',
        phone: userData.phone || '',
        status: userData.status || UserStatus.A,
        institutionId: userData.institutionId || null
      };
      
      setFormData(mappedData);
      setOriginalData(mappedData);
    } catch (error) {
      alert('Error al cargar datos del usuario: ' + error.message);
      navigate('/admin/admin-director/users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Manejar roles como checkboxes
      if (name === 'roles') {
        const updatedRoles = checked 
          ? [...formData.roles, value]
          : formData.roles.filter(role => role !== value);
        
        setFormData(prev => ({
          ...prev,
          roles: updatedRoles,
          // Si se deselecciona Director, limpiar institutionId
          institutionId: updatedRoles.includes(UserRoles.DIRECTOR) ? prev.institutionId : null
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Buscar datos en RENIEC por DNI
   */
  const handleDNISearch = async () => {
    // Validar formato del DNI
    const validation = reniecService.validateDNI(dniSearch);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSearchingDNI(true);
    
    try {
      const result = await reniecService.searchByDNI(dniSearch);
      
      if (result.success) {
        // Auto-completar los campos del formulario
        setFormData(prev => ({
          ...prev,
          firstname: result.data.nombres,
          lastname: `${result.data.apellidoPaterno} ${result.data.apellidoMaterno}`.trim(),
          documentType: DocumentType.DNI,
          documentNumber: result.data.dni
        }));
        
        alert(`✅ Datos encontrados: ${result.data.nombreCompleto}`);
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error al buscar en RENIEC:', error);
      alert('Error al consultar RENIEC. Por favor, intente nuevamente.');
    } finally {
      setSearchingDNI(false);
    }
  };

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username || formData.username.trim().length < userValidationRules.username.minLength) {
      newErrors.username = userValidationRules.username.message;
    }

    // Validar email
    if (!formData.email || !userValidationRules.email.pattern.test(formData.email)) {
      newErrors.email = userValidationRules.email.message;
    }

    // Validar documento
    if (!formData.documentNumber || formData.documentNumber.trim().length < userValidationRules.documentNumber.minLength) {
      newErrors.documentNumber = userValidationRules.documentNumber.message;
    }

    // Validar teléfono si se proporciona
    if (formData.phone && !userValidationRules.phone.pattern.test(formData.phone)) {
      newErrors.phone = userValidationRules.phone.message;
    }

    // Validar institutionId si el rol es Director
    if (formData.roles.includes(UserRoles.DIRECTOR) && !formData.institutionId) {
      newErrors.institutionId = 'Debe seleccionar una institución para el Director';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Verificar si hay cambios en el formulario
   */
  const hasChanges = () => {
    if (!originalData) return false;
    
    return Object.keys(formData).some(key => {
      if (key === 'password') return false; // Ignorar campo de contraseña
      if (Array.isArray(formData[key])) {
        return JSON.stringify(formData[key]) !== JSON.stringify(originalData[key]);
      }
      return formData[key] !== originalData[key];
    });
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario');
      return;
    }

    if (!hasChanges()) {
      alert('No hay cambios para guardar');
      return;
    }

    setSaving(true);
    try {
      const formattedData = adminUserService.formatUserDataForSubmit(formData);
      const response = await adminUserService.updateAdminUser(keycloakId, formattedData);
      
      if (response.success) {
        alert(response.message || 'Usuario actualizado exitosamente');
        navigate('/admin/admin-director/users');
      } else {
        alert('Error al actualizar usuario: ' + (response.error || 'Error desconocido'));
      }
    } catch (error) {
      alert('Error al actualizar usuario: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Restaurar datos originales
   */
  const handleReset = () => {
    if (originalData) {
      setFormData({ ...originalData });
      setErrors({});
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

  return (
    <>
      <Header />
      <Sidebar activeClassName="admin-director-users-list" />
      
      <div className="page-wrapper">
        <div className="content">{/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Editar Usuario Admin/Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/admin-director/users">Usuarios Admin/Director</Link>
                  </li>
                  <li className="breadcrumb-item active">Editar Usuario</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Información del Usuario</h4>
                  {hasChanges() && (
                    <div className="text-warning">
                      <i className="fa fa-exclamation-triangle"></i> Hay cambios sin guardar
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      {/* Información básica */}
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Nombre de usuario <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="username"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Ingrese nombre de usuario"
                          />
                          {errors.username && (
                            <div className="invalid-feedback">{errors.username}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Email <span className="text-danger">*</span></label>
                          <input
                            type="email"
                            name="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="ejemplo@correo.com"
                          />
                          {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Nombres</label>
                          <input
                            type="text"
                            name="firstname"
                            className="form-control"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            placeholder="Nombres del usuario"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Apellidos</label>
                          <input
                            type="text"
                            name="lastname"
                            className="form-control"
                            value={formData.lastname}
                            onChange={handleInputChange}
                            placeholder="Apellidos del usuario"
                          />
                        </div>
                      </div>

                      {/* Búsqueda RENIEC */}
                      <div className="col-12">
                        <div className="card bg-light border mt-3 mb-3">
                          <div className="card-body">
                            <h5 className="card-title mb-3">
                              <i className="fa fa-search"></i> Búsqueda Rápida por DNI (RENIEC)
                            </h5>
                            <p className="text-muted small mb-3">
                              Ingrese el DNI para auto-completar nombres y apellidos desde la base de datos RENIEC
                            </p>
                            <div className="row align-items-end">
                              <div className="col-md-8">
                                <div className="form-group mb-0">
                                  <label>DNI (8 dígitos)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={dniSearch}
                                    onChange={(e) => setDniSearch(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="Ej: 12345678"
                                    maxLength="8"
                                    disabled={searchingDNI}
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <button
                                  type="button"
                                  className="btn btn-info btn-block"
                                  onClick={handleDNISearch}
                                  disabled={searchingDNI || dniSearch.length !== 8}
                                >
                                  {searchingDNI ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm mr-2"></span>
                                      Buscando...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa fa-search mr-1"></i>
                                      Buscar en RENIEC
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información de documento */}
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Tipo de documento <span className="text-danger">*</span></label>
                          <select
                            name="documentType"
                            className="form-control"
                            value={formData.documentType}
                            onChange={handleInputChange}
                          >
                            {Object.entries(DocumentType).map(([key, value]) => (
                              <option key={key} value={value}>
                                {DocumentTypeLabels[value]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Número de documento <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="documentNumber"
                            className={`form-control ${errors.documentNumber ? 'is-invalid' : ''}`}
                            value={formData.documentNumber}
                            onChange={handleInputChange}
                            placeholder="Número de documento"
                          />
                          {errors.documentNumber && (
                            <div className="invalid-feedback">{errors.documentNumber}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Teléfono</label>
                          <input
                            type="text"
                            name="phone"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+51 999 999 999"
                          />
                          {errors.phone && (
                            <div className="invalid-feedback">{errors.phone}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Estado</label>
                          <select
                            name="status"
                            className="form-control"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            {Object.entries(UserStatus).map(([key, value]) => (
                              <option key={key} value={value}>
                                {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Roles</label>
                          <div className="row">
                            {Object.entries(UserRoles).map(([key, value]) => (
                              <div key={key} className="col-md-6">
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    name="roles"
                                    value={value}
                                    checked={formData.roles.includes(value)}
                                    onChange={handleInputChange}
                                    className="form-check-input"
                                    id={`role-${value}`}
                                  />
                                  <label className="form-check-label" htmlFor={`role-${value}`}>
                                    {UserRoleLabels[value]}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Institución - Solo se muestra si es Director */}
                      {formData.roles.includes(UserRoles.DIRECTOR) && (
                        <div className="col-md-12">
                          <div className="form-group">
                            <label>Institución <span className="text-danger">*</span></label>
                            <select
                              name="institutionId"
                              className={`form-control ${errors.institutionId ? 'is-invalid' : ''}`}
                              value={formData.institutionId || ''}
                              onChange={handleInputChange}
                              disabled={loadingInstitutions}
                            >
                              <option value="">Seleccione una institución</option>
                              {institutions.map((institution) => (
                                <option key={institution.id} value={institution.id}>
                                  {institution.name}
                                </option>
                              ))}
                            </select>
                            {errors.institutionId && (
                              <div className="invalid-feedback">{errors.institutionId}</div>
                            )}
                            {loadingInstitutions && (
                              <small className="form-text text-muted">
                                <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                                Cargando instituciones...
                              </small>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <button
                            type="submit"
                            className="btn btn-primary mr-2"
                            disabled={saving || !hasChanges()}
                          >
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Guardando...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-save mr-1"></i>
                                Guardar Cambios
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={handleReset}
                            disabled={saving}
                          >
                            <i className="fa fa-refresh mr-1"></i>
                            Restaurar
                          </button>
                          
                          <Link
                            to="/admin/admin-director/users"
                            className="btn btn-outline-secondary"
                          >
                            <i className="fa fa-arrow-left mr-1"></i>
                            Volver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDirectorUserEdit;
