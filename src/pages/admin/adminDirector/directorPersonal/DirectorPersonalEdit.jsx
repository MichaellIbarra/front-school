import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import directorUserService from '../../../../services/users/directorUserService';
import reniecService from '../../../../services/users/reniecService';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import { 
  DocumentType, 
  DocumentTypeLabels, 
  UserStatus,
  UserStatusLabels,
  DirectorPersonalRoles,
  DirectorPersonalRoleLabels,
  createUserModel,
  userValidationRules
} from '../../../../types/users/user.types';

const DirectorPersonalEdit = () => {
  const { keycloakId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(createUserModel());
  const [originalData, setOriginalData] = useState(createUserModel());
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [dniSearch, setDniSearch] = useState('');
  const [searchingDNI, setSearchingDNI] = useState(false);

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
        const userModel = {
          ...createUserModel(),
          ...userData,
          // Limpiar contraseña por seguridad
          password: ''
        };
        setFormData(userModel);
        setOriginalData(userModel);
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
   * Verificar si hay cambios en el formulario
   */
  const hasChanges = () => {
    const fieldsToCompare = [
      'username', 'email', 'firstname', 'lastname', 
      'documentType', 'documentNumber', 'phone',
      'enabled', 'roles'
    ];

    return fieldsToCompare.some(field => {
      // Comparación especial para arrays (roles)
      if (field === 'roles') {
        const currentRoles = formData[field] || [];
        const originalRoles = originalData[field] || [];
        return JSON.stringify(currentRoles.sort()) !== JSON.stringify(originalRoles.sort());
      }
      return formData[field] !== originalData[field];
    });
  };

  /**
   * Manejar cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar roles como checkboxes
    if (name === 'roles') {
      const updatedRoles = checked 
        ? [...formData.roles, value]
        : formData.roles.filter(role => role !== value);
      
      setFormData(prev => ({
        ...prev,
        roles: updatedRoles
      }));
    } else {
      const fieldValue = type === 'checkbox' ? checked : value;
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
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

    // Validar campos requeridos
    const requiredFields = ['username', 'email', 'firstname', 'lastname', 'documentType', 'documentNumber'];
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo es requerido';
      }
    });

    // Validar username
    if (formData.username && !userValidationRules.username.pattern.test(formData.username)) {
      newErrors.username = userValidationRules.username.message;
    }

    // Validar email
    if (formData.email && !userValidationRules.email.pattern.test(formData.email)) {
      newErrors.email = userValidationRules.email.message;
    }

    // Validar longitud de nombres
    if (formData.firstname && formData.firstname.length < 2) {
      newErrors.firstname = 'El nombre debe tener al menos 2 caracteres';
    }
    if (formData.lastname && formData.lastname.length < 2) {
      newErrors.lastname = 'El apellido debe tener al menos 2 caracteres';
    }

    // Validar documento
    if (formData.documentNumber && !userValidationRules.documentNumber.pattern.test(formData.documentNumber)) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Enviar formulario
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

    try {
      setSaving(true);

      // Preparar datos para envío
      const userData = {
        ...formData,
        // Limpiar campos vacíos opcionales
        phone: formData.phone?.trim() || null
      };

      // Eliminar campos de configuración de acceso
      delete userData.password;
      delete userData.emailVerified;

      const response = await directorUserService.updateStaffUser(keycloakId, userData);
      
      if (response.success) {
        alert(response.message);
        navigate('/admin/admin-director/director-personal');
      } else {
        throw new Error(response.error || 'Error al actualizar personal director');
      }
    } catch (err) {
      alert('Error al actualizar personal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Sidebar activeClassName="director-personal-edit" />
        
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
        <Sidebar activeClassName="director-personal-edit" />
        
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

  return (
    <>
      <Header />
      <Sidebar activeClassName="director-personal-edit" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Editar Personal Director</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/admin/admin-director/director-personal">Personal Director</Link>
                  </li>
                  <li className="breadcrumb-item active">Editar - {formData.username}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Información básica */}
                    <div className="row">
                      <div className="col-12">
                        <h4 className="card-title">Información Básica</h4>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Usuario <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="username"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Ingrese el nombre de usuario"
                            maxLength="50"
                          />
                          {errors.username && (
                            <div className="invalid-feedback">{errors.username}</div>
                          )}
                          <small className="form-text text-muted">
                            Solo letras, números y puntos. Mín. 3 caracteres.
                          </small>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Ingrese el email"
                          />
                          {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Nombres <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstname"
                            className={`form-control ${errors.firstname ? 'is-invalid' : ''}`}
                            value={formData.firstname}
                            onChange={handleInputChange}
                            placeholder="Ingrese los nombres"
                            maxLength="100"
                          />
                          {errors.firstname && (
                            <div className="invalid-feedback">{errors.firstname}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Apellidos <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastname"
                            className={`form-control ${errors.lastname ? 'is-invalid' : ''}`}
                            value={formData.lastname}
                            onChange={handleInputChange}
                            placeholder="Ingrese los apellidos"
                            maxLength="100"
                          />
                          {errors.lastname && (
                            <div className="invalid-feedback">{errors.lastname}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Búsqueda RENIEC */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="card bg-light border">
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
                    </div>

                    {/* Información de identificación */}
                    <div className="row">
                      <div className="col-12">
                        <h4 className="card-title mt-4">Información de Identificación</h4>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Tipo de Documento <span className="text-danger">*</span>
                          </label>
                          <select
                            name="documentType"
                            className={`form-control ${errors.documentType ? 'is-invalid' : ''}`}
                            value={formData.documentType}
                            onChange={handleInputChange}
                          >
                            <option value="">Seleccione un tipo</option>
                            {Object.entries(DocumentType).map(([key, value]) => (
                              <option key={key} value={value}>
                                {DocumentTypeLabels[value]}
                              </option>
                            ))}
                          </select>
                          {errors.documentType && (
                            <div className="invalid-feedback">{errors.documentType}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            Número de Documento <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="documentNumber"
                            className={`form-control ${errors.documentNumber ? 'is-invalid' : ''}`}
                            value={formData.documentNumber}
                            onChange={handleInputChange}
                            placeholder="Ingrese el número de documento"
                            maxLength="20"
                          />
                          {errors.documentNumber && (
                            <div className="invalid-feedback">{errors.documentNumber}</div>
                          )}
                          <small className="form-text text-muted">
                            Solo números, entre 6 y 20 dígitos.
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="row">
                      <div className="col-12">
                        <h4 className="card-title mt-4">Información de Contacto</h4>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Teléfono</label>
                          <input
                            type="text"
                            name="phone"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Ingrese el teléfono"
                            maxLength="15"
                          />
                          {errors.phone && (
                            <div className="invalid-feedback">{errors.phone}</div>
                          )}
                          <small className="form-text text-muted">
                            Solo números, entre 7 y 15 dígitos.
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Roles del personal */}
                    <div className="row">
                      <div className="col-12">
                        <h4 className="card-title mt-4">Roles del Personal</h4>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>
                            Roles <span className="text-danger">*</span>
                          </label>
                          <div className="form-check-container mt-2">
                            {Object.entries(DirectorPersonalRoles).map(([key, value]) => (
                              <div key={key} className="form-check form-check-inline mr-4">
                                <input
                                  type="checkbox"
                                  name="roles"
                                  value={value}
                                  checked={formData.roles && formData.roles.includes(value)}
                                  onChange={handleInputChange}
                                  className="form-check-input"
                                  id={`role-${value}`}
                                />
                                <label className="form-check-label" htmlFor={`role-${value}`}>
                                  {DirectorPersonalRoleLabels[value]}
                                </label>
                              </div>
                            ))}
                          </div>
                          {errors.roles && (
                            <div className="text-danger mt-1">
                              <small>{errors.roles}</small>
                            </div>
                          )}
                          <small className="form-text text-muted">
                            Seleccione uno o más roles que desempeñará este personal.
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Estado del usuario */}
                    <div className="row">
                      <div className="col-12">
                        <h4 className="card-title mt-4">Estado del Usuario</h4>
                        <hr />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Estado Actual</label>
                          <div className="form-control-plaintext">
                            <span className={`badge badge-${formData.status === UserStatus.A ? 'success' : 'warning'}`}>
                              {UserStatusLabels[formData.status] || 'Desconocido'}
                            </span>
                          </div>
                          <small className="form-text text-muted">
                            Use los botones de acción para cambiar el estado del usuario.
                          </small>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <div className="form-check mt-4">
                            <input
                              type="checkbox"
                              name="emailVerified"
                              className="form-check-input"
                              id="emailVerified"
                              checked={formData.emailVerified}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="emailVerified">
                              Email verificado
                            </label>
                          </div>
                          
                          <div className="form-check">
                            <input
                              type="checkbox"
                              name="enabled"
                              className="form-check-input"
                              id="enabled"
                              checked={formData.enabled}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="enabled">
                              Usuario habilitado
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información de auditoría */}
                    {(formData.createdAt || formData.updatedAt) && (
                      <>
                        <div className="row">
                          <div className="col-12">
                            <h4 className="card-title mt-4">Información de Auditoría</h4>
                            <hr />
                          </div>
                        </div>

                        <div className="row">
                          {formData.createdAt && (
                            <div className="col-md-6">
                              <div className="form-group">
                                <label>Fecha de Creación</label>
                                <div className="form-control-plaintext">
                                  {new Date(formData.createdAt).toLocaleString('es-ES')}
                                </div>
                              </div>
                            </div>
                          )}

                          {formData.updatedAt && (
                            <div className="col-md-6">
                              <div className="form-group">
                                <label>Última Actualización</label>
                                <div className="form-control-plaintext">
                                  {new Date(formData.updatedAt).toLocaleString('es-ES')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Botones de acción */}
                    <div className="row">
                      <div className="col-12">
                        <div className="form-group mt-4">
                          <button
                            type="submit"
                            className="btn btn-primary mr-3"
                            disabled={saving || !hasChanges()}
                          >
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                                Guardando...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-save mr-2"></i>
                                Guardar Cambios
                              </>
                            )}
                          </button>
                          
                          <Link
                            to="/admin/admin-director/director-personal"
                            className="btn btn-secondary mr-3"
                          >
                            <i className="fa fa-arrow-left mr-2"></i>
                            Volver
                          </Link>

                          <Link
                            to={`/admin/admin-director/director-personal/${keycloakId}/view`}
                            className="btn btn-info"
                          >
                            <i className="fa fa-eye mr-2"></i>
                            Ver Detalles
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

export default DirectorPersonalEdit;
