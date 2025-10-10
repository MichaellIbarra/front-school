import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAssignmentService } from '../../../../services/academic/teacherAssignmentService';
import { courseService } from '../../../../services/academic/courseService';
import { classroomService } from '../../../../services/academic/classroomService';
import { periodService } from '../../../../services/academic/periodService';
import { validateTeacherAssignment } from '../../../../types/academic/teacherAssignment.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const EditTeacherAssignment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const { alertState, handleConfirm, handleCancel: handleAlertCancel, showSuccess, showError, showWarning, showConfirm } = useAlert();

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    // Detectar cambios en el formulario
    if (originalData && Object.keys(originalData).length > 0) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [assignmentResult, coursesResult, classroomsResult, periodsResult] = await Promise.all([
        teacherAssignmentService.getAssignmentById(id),
        courseService.getAllCourses(),
        classroomService.getAllClassrooms(),
        periodService.getAllPeriods()
      ]);
      
      if (assignmentResult.success) {
        const assignmentData = {
          teacherId: assignmentResult.data.teacherId,
          courseId: assignmentResult.data.courseId,
          classroomId: assignmentResult.data.classroomId,
          periodId: assignmentResult.data.periodId,
          status: assignmentResult.data.status
        };
        
        setFormData(assignmentData);
        setOriginalData({ ...assignmentData });
      } else {
        showError(
          'Error',
          assignmentResult.message || 'No se pudo cargar la asignación',
          { onConfirm: () => navigate('/secretary/teacher-assignments') }
        );
        return;
      }
      
      if (coursesResult.success) {
        setCourses(coursesResult.data);
      }
      
      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data);
      }
      
      if (periodsResult.success) {
        setPeriods(periodsResult.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError(
        'Error',
        'Error de conexión. No se pudo cargar la asignación.',
        { onConfirm: () => navigate('/secretary/teacher-assignments') }
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
  };

  const validateForm = () => {
    const validationResult = validateTeacherAssignment(formData);
    
    if (validationResult) {
      // Convertir el string de error en un objeto de errores
      const errors = {};
      if (validationResult.includes('profesor')) {
        errors.teacherId = validationResult;
      } else if (validationResult.includes('curso')) {
        errors.courseId = validationResult;
      } else if (validationResult.includes('aula')) {
        errors.classroomId = validationResult;
      } else if (validationResult.includes('período')) {
        errors.periodId = validationResult;
      }
      setValidationErrors(errors);
      return false;
    }
    
    return true;
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

    if (!hasChanges) {
      showWarning(
        'Sin Cambios',
        'No hay cambios para guardar'
      );
      return;
    }

    setSaving(true);
    try {
      const result = await teacherAssignmentService.updateAssignment(id, formData);
      
      if (result.success) {
        showSuccess(
          'Éxito',
          'Asignación actualizada correctamente',
          { onConfirm: () => navigate('/secretary/teacher-assignments') }
        );
      } else {
        showError(
          'Error',
          result.message || 'Error al actualizar la asignación'
        );
      }
    } catch (error) {
      console.error('Error al actualizar la asignación:', error);
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
        () => navigate('/secretary/teacher-assignments')
      );
    } else {
      navigate('/secretary/teacher-assignments');
    }
  };

  const handleReset = () => {
    showConfirm(
      'Confirmación',
      '¿Está seguro de descartar los cambios?',
      () => {
        setFormData({ ...originalData });
        setValidationErrors({});
      }
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="teacher-assignment-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Editar Asignación de Profesor</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="#" onClick={() => navigate('/secretary/teacher-assignments')}>Asignaciones</a>
                  </li>
                  <li className="breadcrumb-item active">Editar</li>
                </ul>
              </div>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h5 className="card-title">
                Información de la Asignación
                {hasChanges && (
                  <span className="badge bg-warning text-dark ms-2">
                    <i className="fas fa-exclamation-circle"></i> Cambios sin guardar
                  </span>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        ID del Profesor <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingrese el ID del profesor"
                        value={formData.teacherId || ''}
                        onChange={(e) => handleInputChange('teacherId', e.target.value)}
                        isInvalid={!!validationErrors.teacherId}
                        maxLength={50}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.teacherId}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        ID único del profesor (máximo 50 caracteres)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Curso <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={formData.courseId || ''}
                        onChange={(e) => handleInputChange('courseId', e.target.value)}
                        isInvalid={!!validationErrors.courseId}
                      >
                        <option value="">Seleccionar curso...</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.courseCode} - {course.courseName}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.courseId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Aula <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={formData.classroomId || ''}
                        onChange={(e) => handleInputChange('classroomId', e.target.value)}
                        isInvalid={!!validationErrors.classroomId}
                      >
                        <option value="">Seleccionar aula...</option>
                        {classrooms.map(classroom => (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.code} - {classroom.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.classroomId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Período <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={formData.periodId || ''}
                        onChange={(e) => handleInputChange('periodId', e.target.value)}
                        isInvalid={!!validationErrors.periodId}
                      >
                        <option value="">Seleccionar período...</option>
                        {periods.map(period => (
                          <option key={period.id} value={period.id}>
                            {period.periodName} ({period.year})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.periodId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
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
                        Estado de la asignación
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
                      <i className="fas fa-undo"></i> Descartar Cambios
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
                    disabled={saving || !hasChanges}
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
                <li>El ID del profesor debe corresponder a un usuario válido en el sistema</li>
                <li>Los cambios serán guardados al hacer clic en &quot;Guardar Cambios&quot;</li>
                <li>Puede descartar los cambios haciendo clic en &quot;Descartar Cambios&quot;</li>
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

export default EditTeacherAssignment;
