import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { periodService } from '../../../../services/academic/periodService';
import { PeriodRequest } from '../../../../types/academic/period.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';

/**
 * Componente para editar un período académico existente
 * Usado en el rol de Secretary
 */
const EditPeriod = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Estado del formulario
  const [formData, setFormData] = useState({
    institutionId: '',
    level: '',
    period: '',
    periodType: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'A'
  });

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // Opciones para los selects
  const levelOptions = [
    { value: 'INICIAL', label: 'Inicial' },
    { value: 'PRIMARIA', label: 'Primaria' },
    { value: 'SECUNDARIA', label: 'Secundaria' }
  ];

  const periodTypeOptions = [
    { value: 'BIMESTRE', label: 'Bimestre' },
    { value: 'TRIMESTRE', label: 'Trimestre' },
    { value: 'SEMESTRE', label: 'Semestre' },
    { value: 'ANUAL', label: 'Anual' }
  ];

  // Generar años académicos (año actual + 2 años hacia atrás y adelante)
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  };

  const academicYearOptions = generateAcademicYears();

  // Cargar datos del período al montar el componente
  useEffect(() => {
    if (id) {
      loadPeriodData();
    } else {
      alert('ID de período no válido');
      navigate('/secretary/periods');
    }
  }, [id]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const changed = Object.keys(formData).some(key => {
        // Para fechas, comparar solo la parte de la fecha (sin hora)
        if (key === 'startDate' || key === 'endDate') {
          const original = originalData[key] ? new Date(originalData[key]).toISOString().split('T')[0] : '';
          const current = formData[key];
          return original !== current;
        }
        return originalData[key] !== formData[key];
      });
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  /**
   * Cargar datos del período desde el servidor
   */
  const loadPeriodData = async () => {
    setLoadingPeriod(true);
    try {
      const result = await periodService.getPeriodById(id);
      if (result.success && result.data) {
        const period = result.data;
        
        // Formatear fechas para inputs de tipo date
        const formattedData = {
          institutionId: period.institutionId || '',
          level: period.level || '',
          period: period.period || '',
          periodType: period.periodType || '',
          academicYear: period.academicYear || '',
          startDate: period.startDate ? new Date(period.startDate).toISOString().split('T')[0] : '',
          endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : '',
          description: period.description || '',
          status: period.status || 'A'
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      } else {
        alert(result.message || 'Período no encontrado');
        navigate('/secretary/periods');
      }
    } catch (error) {
      console.error('Error al cargar período:', error);
      alert('Error de conexión al cargar el período');
      navigate('/secretary/periods');
    } finally {
      setLoadingPeriod(false);
    }
  };

  /**
   * Manejar cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar error de validación del campo que se está editando
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Si cambió el tipo de período, ya no necesitamos resetear nada
      // pues ahora el campo período es texto libre
      
      return newFormData;
    });
  };

  /**
   * Validar fechas - la fecha de fin debe ser posterior a la de inicio
   */
  const validateDates = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return end > start;
    }
    return true;
  };

  /**
   * Validar formulario antes del envío
   */
  const validateForm = () => {
    const errors = {};

    // Campos requeridos
    if (!formData.institutionId.trim()) errors.institutionId = 'La institución es requerida';
    if (!formData.level) errors.level = 'El nivel es requerido';
    if (!formData.periodType) errors.periodType = 'El tipo de período es requerido';
    if (!formData.period) errors.period = 'El período es requerido';
    if (!formData.academicYear) errors.academicYear = 'El año académico es requerido';
    if (!formData.startDate) errors.startDate = 'La fecha de inicio es requerida';
    if (!formData.endDate) errors.endDate = 'La fecha de fin es requerida';

    // Validación de fechas
    if (formData.startDate && formData.endDate) {
      if (!validateDates(formData.startDate, formData.endDate)) {
        errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    // Validación del año académico (debe ser numérico y de 4 dígitos)
    if (formData.academicYear && (isNaN(formData.academicYear) || formData.academicYear.length !== 4)) {
      errors.academicYear = 'El año académico debe ser un año válido (4 dígitos)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario.');
      return;
    }

    if (!hasChanges) {
      alert('No se han detectado cambios en el formulario.');
      return;
    }

    setLoading(true);
    try {
      const periodRequest = new PeriodRequest(formData);
      const result = await periodService.updatePeriod(id, periodRequest);
      
      if (result.success) {
        alert('Período académico actualizado exitosamente');
        navigate('/secretary/periods');
      } else {
        alert(result.message || 'Error al actualizar el período académico');
      }
    } catch (error) {
      console.error('Error al actualizar período:', error);
      alert('Error de conexión al actualizar el período académico');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleCancelEdit = () => {
    if (hasChanges) {
      if (window.confirm('¿Está seguro de cancelar? Se perderán los cambios realizados.')) {
        navigate('/secretary/periods');
      }
    } else {
      navigate('/secretary/periods');
    }
  };

  /**
   * Resetear formulario a los valores originales
   */
  const handleReset = () => {
    if (window.confirm('¿Está seguro de descartar todos los cambios?')) {
      setFormData({ ...originalData });
      setValidationErrors({});
      setHasChanges(false);
    }
  };

  if (loadingPeriod) {
    return (
      <div className="content container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando período...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="period-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Encabezado */}
          <div className="page-header">
            <div className="row">
              <div className="col">
                <h3 className="page-title">Editar Período Académico</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/secretary">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/secretary/periods">Períodos Académicos</Link>
                  </li>
                  <li className="breadcrumb-item active">Editar Período</li>
                </ul>
              </div>
            </div>
          </div>

      {/* Formulario */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title">Información del Período Académico</h5>
              {hasChanges && (
                <div className="badge badge-warning">
                  <i className="fas fa-exclamation-circle"></i> Cambios sin guardar
                </div>
              )}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* ID de Institución */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        ID de Institución <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${validationErrors.institutionId ? 'is-invalid' : ''}`}
                        name="institutionId"
                        value={formData.institutionId}
                        onChange={handleInputChange}
                        placeholder="Ingrese el ID de la institución"
                        disabled={loading}
                      />
                      {validationErrors.institutionId && (
                        <div className="invalid-feedback">
                          {validationErrors.institutionId}
                        </div>
                      )}
                      <small className="form-text text-muted">
                        Identificador único de la institución educativa
                      </small>
                    </div>
                  </div>

                  {/* Nivel */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Nivel Educativo <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-control ${validationErrors.level ? 'is-invalid' : ''}`}
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Seleccione un nivel</option>
                        {levelOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.level && (
                        <div className="invalid-feedback">
                          {validationErrors.level}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Tipo de Período */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Tipo de Período <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-control ${validationErrors.periodType ? 'is-invalid' : ''}`}
                        name="periodType"
                        value={formData.periodType}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Seleccione el tipo</option>
                        {periodTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.periodType && (
                        <div className="invalid-feedback">
                          {validationErrors.periodType}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Período */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Período <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${validationErrors.period ? 'is-invalid' : ''}`}
                        name="period"
                        value={formData.period}
                        onChange={handleInputChange}
                        placeholder="Ej: Primer Semestre, Segundo Bimestre, etc."
                        disabled={loading}
                      />
                      {validationErrors.period && (
                        <div className="invalid-feedback">
                          {validationErrors.period}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Año Académico */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Año Académico <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-control ${validationErrors.academicYear ? 'is-invalid' : ''}`}
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        {academicYearOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.academicYear && (
                        <div className="invalid-feedback">
                          {validationErrors.academicYear}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        className="form-control"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Fecha de Inicio */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Fecha de Inicio <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${validationErrors.startDate ? 'is-invalid' : ''}`}
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      {validationErrors.startDate && (
                        <div className="invalid-feedback">
                          {validationErrors.startDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fecha de Fin */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>
                        Fecha de Fin <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${validationErrors.endDate ? 'is-invalid' : ''}`}
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate} // No permitir fecha anterior al inicio
                        disabled={loading}
                      />
                      {validationErrors.endDate && (
                        <div className="invalid-feedback">
                          {validationErrors.endDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <div className="d-flex justify-content-between">
                        <div>
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            <i className="fas fa-arrow-left"></i> Volver
                          </button>
                          {hasChanges && (
                            <button
                              type="button"
                              className="btn btn-warning"
                              onClick={handleReset}
                              disabled={loading}
                            >
                              <i className="fas fa-undo"></i> Descartar Cambios
                            </button>
                          )}
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !hasChanges}
                          >
                            {loading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i> Actualizando...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save"></i> Actualizar Período
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Componente simplificado - usando alertas básicas por ahora */}
        </div>
      </div>
    </>
  );
};

export default EditPeriod;