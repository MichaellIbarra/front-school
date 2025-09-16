import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService } from '../../../../services/academic/courseService';
import { CourseRequest, CourseLevels } from '../../../../types/academic/course.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeExists, setCodeExists] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { alertState, handleConfirm, handleCancel: handleAlertCancel, showSuccess, showError, showWarning, showConfirm } = useAlert();

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    // Detectar cambios en el formulario
    if (originalData && Object.keys(originalData).length > 0) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const result = await courseService.getCourseById(id);
      
      if (result.success) {
        const courseData = {
          institutionId: result.data.institutionId,
          courseCode: result.data.courseCode,
          courseName: result.data.courseName,
          level: result.data.level,
          description: result.data.description || '',
          hoursPerWeek: result.data.hoursPerWeek,
          status: result.data.status
        };
        
        setFormData(courseData);
        setOriginalData({ ...courseData });
      } else {
        showError(
          'Error',
          result.message || 'No se pudo cargar el curso',
          { onConfirm: () => navigate('/secretary/courses') }
        );
      }
    } catch (error) {
      console.error('Error al cargar curso:', error);
      showError(
        'Error',
        'Error de conexión. No se pudo cargar el curso.',
        { onConfirm: () => navigate('/secretary/courses') }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Verificar código de curso solo si cambió
    if (field === 'courseCode' && value !== originalData.courseCode) {
      if (value.length >= 3) {
        checkCourseCode(value);
      } else {
        setCodeExists(false);
      }
    } else if (field === 'courseCode' && value === originalData.courseCode) {
      setCodeExists(false); // El código original siempre es válido
    }
  };

  const checkCourseCode = async (courseCode) => {
    if (!courseCode.trim()) return;
    
    try {
      setCheckingCode(true);
      const result = await courseService.existsByCourseCode(courseCode.trim());
      setCodeExists(result.exists);
    } catch (error) {
      console.error('Error al verificar código:', error);
    } finally {
      setCheckingCode(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validar institución
    if (!formData.institutionId?.trim()) {
      errors.institutionId = 'El ID de la institución es obligatorio';
    }

    // Validar código
    if (!formData.courseCode?.trim()) {
      errors.courseCode = 'El código del curso es obligatorio';
    } else if (formData.courseCode !== originalData.courseCode && codeExists) {
      errors.courseCode = 'Ya existe un curso con este código';
    }

    // Validar nombre
    if (!formData.courseName?.trim()) {
      errors.courseName = 'El nombre del curso es obligatorio';
    } else if (formData.courseName.trim().length < 3) {
      errors.courseName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar nivel
    if (!formData.level?.trim()) {
      errors.level = 'El nivel es obligatorio';
    }

    // Validar horas por semana
    if (!formData.hoursPerWeek || formData.hoursPerWeek <= 0) {
      errors.hoursPerWeek = 'Las horas por semana deben ser mayor a 0';
    } else if (formData.hoursPerWeek > 40) {
      errors.hoursPerWeek = 'Las horas por semana no pueden ser mayor a 40';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning(
        'Datos Incompletos',
        'Por favor, corrija los errores en el formulario'
      );
      return;
    }

    if (formData.courseCode !== originalData.courseCode && codeExists) {
      showWarning(
        'Código Duplicado',
        'Ya existe un curso con este código. Por favor, utilice un código diferente.'
      );
      return;
    }

    if (!hasChanges) {
      showWarning(
        'Sin Cambios',
        'No se han detectado cambios en el curso.'
      );
      return;
    }

    setSaving(true);
    try {
      const courseRequest = new CourseRequest(formData);
      const result = await courseService.updateCourse(id, courseRequest);
      
      if (result.success) {
        showSuccess(
          'Éxito',
          'Curso actualizado correctamente',
          { onConfirm: () => navigate('/secretary/courses') }
        );
      } else {
        showError(
          'Error',
          result.message || 'Error al actualizar el curso'
        );
      }
    } catch (error) {
      console.error('Error al actualizar el curso:', error);
      showError(
        'Error',
        'Error de conexión. Intente nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      showConfirm(
        'Confirmación',
        '¿Está seguro de cancelar? Los cambios no guardados se perderán.',
        () => navigate('/secretary/courses')
      );
    } else {
      navigate('/secretary/courses');
    }
  };

  const handleReset = () => {
    showConfirm(
      'Confirmación',
      '¿Está seguro de restaurar los datos originales? Todos los cambios se perderán.',
      () => {
        setFormData({ ...originalData });
        setValidationErrors({});
        setCodeExists(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">
            Cargando curso...
          </span>
        </Spinner>
      </div>
    );
  }

  if (!formData || Object.keys(formData).length === 0) {
    return null; // El error ya se mostró en loadCourse
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="course-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Editar Curso</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="#" onClick={() => navigate('/secretary/courses')}>Cursos</a>
                  </li>
                  <li className="breadcrumb-item active">Editar</li>
                </ul>
              </div>
            </div>
          </div>

          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="card-title">Información del Curso</h5>
              {hasChanges && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle"></i> Cambios pendientes
                </small>
              )}
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Institución <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="ID de la institución"
                        value={formData.institutionId || ''}
                        onChange={(e) => handleInputChange('institutionId', e.target.value)}
                        isInvalid={!!validationErrors.institutionId}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.institutionId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Código del Curso <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          placeholder="Ej: MAT001, HIS002"
                          value={formData.courseCode || ''}
                          onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                          isInvalid={!!validationErrors.courseCode || (formData.courseCode !== originalData.courseCode && codeExists)}
                          isValid={formData.courseCode && formData.courseCode.length >= 3 && 
                                  (formData.courseCode === originalData.courseCode || (!codeExists && !checkingCode))}
                        />
                        {checkingCode && (
                          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                            <Spinner size="sm" animation="border" />
                          </div>
                        )}
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.courseCode || (codeExists ? 'Ya existe un curso con este código' : '')}
                      </Form.Control.Feedback>
                      {formData.courseCode && formData.courseCode.length >= 3 && 
                       (formData.courseCode === originalData.courseCode || (!codeExists && !checkingCode)) && (
                        <Form.Text className="text-success">
                          <i className="fas fa-check"></i> Código {formData.courseCode === originalData.courseCode ? '(sin cambios)' : 'disponible'}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Nombre del Curso <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre completo del curso"
                        value={formData.courseName || ''}
                        onChange={(e) => handleInputChange('courseName', e.target.value)}
                        isInvalid={!!validationErrors.courseName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.courseName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Nivel Educativo <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={formData.level || ''}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        isInvalid={!!validationErrors.level}
                      >
                        <option value="">Seleccionar nivel...</option>
                        {Object.values(CourseLevels).map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.level}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Horas por Semana <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="1"
                        min="1"
                        max="40"
                        value={formData.hoursPerWeek || ''}
                        onChange={(e) => handleInputChange('hoursPerWeek', parseInt(e.target.value) || 0)}
                        isInvalid={!!validationErrors.hoursPerWeek}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.hoursPerWeek}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Número de horas académicas por semana (1-40)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Select
                        value={formData.status || 'A'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Estado actual del curso
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descripción (Opcional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Descripción detallada del curso, objetivos, metodología, etc."
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        maxLength={500}
                      />
                      <Form.Text className="text-muted">
                        {(formData.description || '').length}/500 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <hr />
                
                <div className="d-flex justify-content-between">
                  <div>
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleReset}
                      disabled={saving || !hasChanges}
                      className="me-2"
                    >
                      <i className="fas fa-undo"></i> Restaurar
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <i className="fas fa-times"></i> Cancelar
                    </Button>
                  </div>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving || checkingCode || (formData.courseCode !== originalData.courseCode && codeExists) || !hasChanges}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Información adicional */}
          <Card className="mt-3">
            <Card.Body>
              <h6 className="text-muted">
                <i className="fas fa-info-circle"></i> Información Adicional
              </h6>
              <ul className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                <li>Los campos marcados con <span className="text-danger">*</span> son obligatorios</li>
                <li>El código del curso debe ser único en el sistema</li>
                <li>Las horas por semana deben estar entre 1 y 40</li>
                <li>Los cambios se guardarán automáticamente al hacer clic en &quot;Guardar Cambios&quot;</li>
              </ul>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Alert personalizado */}
      <AlertModal
        alert={alertState}
        onConfirm={handleConfirm}
        onCancel={handleAlertCancel}
      />
    </>
  );
};

export default EditCourse;