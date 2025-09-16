import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { periodService } from '../../../../services/academic/periodService';
import { PeriodRequest, periodTypeToBackend } from '../../../../types/academic/period.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';

/**
 * Componente para agregar un nuevo período académico
 * Usado en el rol de Secretary
 */
const AddPeriod = () => {
  const navigate = useNavigate();

  // Estado del formulario
  const [formData, setFormData] = useState({
    institutionId: '',
    level: '',
    period: '',
    periodType: '',
    academicYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    description: '',
    status: 'A'
  });

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

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

  // Mapeo de valores del frontend (español) al backend (inglés)
  const periodTypeMapping = periodTypeToBackend;

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
      
      // Si cambió el tipo de período, resetear el campo período
      if (name === 'periodType') {
        newFormData.period = '';
      }

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
   * Verificar si ya existe un período con los mismos datos
   */
  const checkDuplicatePeriod = async (formData) => {
    if (!formData.institutionId || !formData.level || !formData.period || !formData.academicYear) {
      return false;
    }

    setCheckingDuplicate(true);
    try {
      const result = await periodService.existsPeriod(
        formData.institutionId,
        formData.level,
        formData.period,
        formData.academicYear
      );
      return result.exists;
    } catch (error) {
      console.error('Error al verificar duplicado:', error);
      return false;
    } finally {
      setCheckingDuplicate(false);
    }
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

    // Verificar duplicados
    const isDuplicate = await checkDuplicatePeriod(formData);
    if (isDuplicate) {
      alert('Ya existe un período con los mismos datos (Institución, Nivel, Período y Año Académico).');
      return;
    }

    setLoading(true);
    try {
      // Convertir valores del frontend (español) al backend (inglés)
      const backendFormData = {
        ...formData,
        periodType: periodTypeMapping[formData.periodType] || formData.periodType
      };
      
      const periodRequest = new PeriodRequest(backendFormData);
      const result = await periodService.createPeriod(periodRequest);
      
      if (result.success) {
        alert('Período académico creado exitosamente');
        navigate('/secretary/periods');
      } else {
        alert(result.message || 'Error al crear el período académico');
      }
    } catch (error) {
      console.error('Error al crear período:', error);
      alert('Error de conexión al crear el período académico');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleCancelForm = () => {
    if (window.confirm('¿Está seguro de cancelar? Se perderán los datos ingresados.')) {
      navigate('/secretary/periods');
    }
  };

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
                <h3 className="page-title">Agregar Período Académico</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/secretary">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/secretary/periods">Períodos Académicos</Link>
                  </li>
                  <li className="breadcrumb-item active">Agregar Período</li>
                </ul>
              </div>
            </div>
          </div>

      {/* Formulario */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Información del Período Académico</h5>
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
                        placeholder="Ej: inst-001, inst-002"
                        disabled={loading}
                      />
                      {validationErrors.institutionId && (
                        <div className="invalid-feedback">
                          {validationErrors.institutionId}
                        </div>
                      )}
                      <small className="form-text text-muted">
                        Ingrese el ID de la institución (consulte con el administrador si no lo conoce)
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

                <div className="row">
                  {/* Descripción */}
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Descripción opcional del período académico"
                        rows={3}
                        maxLength={500}
                        disabled={loading}
                      />
                      <small className="form-text text-muted">
                        Máximo 500 caracteres ({formData.description.length}/500)
                      </small>
                    </div>
                  </div>
                </div>

                {/* Indicador de verificación de duplicados */}
                {checkingDuplicate && (
                  <div className="row">
                    <div className="col-md-12">
                      <div className="alert alert-info">
                        <i className="fas fa-spinner fa-spin"></i> Verificando si el período ya existe...
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group text-right">
                      <button
                        type="button"
                        className="btn btn-secondary mr-2"
                        onClick={handleCancelForm}
                        disabled={loading}
                      >
                        <i className="fas fa-times"></i> Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || checkingDuplicate}
                      >
                        {loading ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i> Guardar Período
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

      {/* Componente simplificado - usando alertas básicas por ahora */}
        </div>
      </div>
    </>
  );
};

export default AddPeriod;