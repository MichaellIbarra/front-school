import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminUserService from '../../../services/users/adminUserService';
import reniecService from '../../../services/users/reniecService';
import institutionAdminService from '../../../services/institutions/institutionAdminService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { 
  UserStatus, 
  DocumentType, 
  UserRoles,
  createUserModel, 
  userValidationRules,
  DocumentTypeLabels,
  UserRoleLabels
} from '../../../types/users/user.types';

const AdminDirectorUserCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(createUserModel());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dniSearch, setDniSearch] = useState('');
  const [searchingDNI, setSearchingDNI] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  // Cargar instituciones al montar el componente
  useEffect(() => {
    loadInstitutions();
  }, []);

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

    // Validar roles
    if (!formData.roles || formData.roles.length === 0) {
      newErrors.roles = 'Debe seleccionar al menos un rol';
    }

    // Validar institutionId si el rol es Director
    if (formData.roles.includes(UserRoles.DIRECTOR) && !formData.institutionId) {
      newErrors.institutionId = 'Debe seleccionar una institución para el Director';
    }

    // Validación con el servicio
    const serviceValidation = adminUserService.validateUserData(formData);
    if (!serviceValidation.isValid) {
      serviceValidation.errors.forEach(error => {
        if (!newErrors.general) newErrors.general = [];
        newErrors.general.push(error);
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    setLoading(true);
    try {
      const formattedData = adminUserService.formatUserDataForSubmit(formData);
      console.log('Enviando datos al backend:', formattedData);
      
      const response = await adminUserService.createAdminUser(formattedData);
      console.log('✅ Respuesta del servicio:', response);
      
      if (response.success) {
        alert(response.message || '✅ Usuario creado exitosamente');
        navigate('/admin/admin-director/users');
      } else {
        alert('❌ Error al crear usuario: ' + (response.error || 'Error desconocido'));
      }
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      alert('❌ Error al crear usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar formulario
   */
  const handleReset = () => {
    setFormData(createUserModel());
    setErrors({});
  };

  return (
    <>
      <Header />
      <Sidebar activeClassName="admin-director-users-create" />
      
      <div className="page-wrapper">
        <div className="content">{/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Crear Usuario Admin/Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/admin-director/users">Usuarios Admin/Director</Link>
                  </li>
                  <li className="breadcrumb-item active">Crear Usuario</li>
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
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Errores generales */}
                    {errors.general && (
                      <div className="alert alert-danger">
                        <ul className="mb-0">
                          {errors.general.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                            <option value={UserStatus.A}>Activo</option>
                            <option value={UserStatus.I}>Inactivo</option>
                          </select>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Roles <span className="text-danger">*</span></label>
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
                          {errors.roles && (
                            <div className="text-danger mt-1">{errors.roles}</div>
                          )}
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
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                Creando...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-save mr-1"></i>
                                Crear Usuario
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={handleReset}
                            disabled={loading}
                          >
                            <i className="fa fa-refresh mr-1"></i>
                            Limpiar
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

export default AdminDirectorUserCreate;
