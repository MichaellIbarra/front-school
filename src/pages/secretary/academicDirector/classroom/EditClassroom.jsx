import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { classroomService } from '../../../../services/academic/classroomService';
import { validateClassroom } from '../../../../types/academic/classroom.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const EditClassroom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const { alertState, handleConfirm, handleCancel: handleAlertCancel, showSuccess, showError, showWarning, showConfirm } = useAlert();

  useEffect(() => {
    loadClassroom();
  }, [id]);

  useEffect(() => {
    // Detectar cambios en el formulario
    if (originalData && Object.keys(originalData).length > 0) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const loadClassroom = async () => {
    try {
      setLoading(true);
      const result = await classroomService.getClassroomById(id);
      
      if (result.success) {
        const classroomData = {
          code: result.data.code,
          name: result.data.name,
          description: result.data.description || '',
          status: result.data.status
        };
        
        setFormData(classroomData);
        setOriginalData({ ...classroomData });
      } else {
        showError(
          'Error',
          result.message || 'No se pudo cargar el aula',
          { onConfirm: () => navigate('/secretary/classrooms') }
        );
      }
    } catch (error) {
      console.error('Error al cargar aula:', error);
      showError(
        'Error',
        'Error de conexión. No se pudo cargar el aula.',
        { onConfirm: () => navigate('/secretary/classrooms') }
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
    const validationResult = validateClassroom(formData);
    
    if (validationResult) {
      // Convertir el string de error en un objeto de errores
      const errors = {};
      if (validationResult.includes('código')) {
        errors.code = validationResult;
      } else if (validationResult.includes('nombre')) {
        errors.name = validationResult;
      } else if (validationResult.includes('descripción')) {
        errors.description = validationResult;
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
      const result = await classroomService.updateClassroom(id, formData);
      
      if (result.success) {
        showSuccess(
          'Éxito',
          'Aula actualizada correctamente',
          { onConfirm: () => navigate('/secretary/classrooms') }
        );
      } else {
        showError(
          'Error',
          result.message || 'Error al actualizar el aula'
        );
      }
    } catch (error) {
      console.error('Error al actualizar el aula:', error);
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
        () => navigate('/secretary/classrooms')
      );
    } else {
      navigate('/secretary/classrooms');
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
      <Sidebar activeClassName="classroom-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Editar Aula</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item">
                    <a href="#" onClick={() => navigate('/secretary/classrooms')}>Aulas</a>
                  </li>
                  <li className="breadcrumb-item active">Editar</li>
                </ul>
              </div>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h5 className="card-title">
                Información del Aula
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
                        Código del Aula <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: A101, B202"
                        value={formData.code || ''}
                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                        isInvalid={!!validationErrors.code}
                        maxLength={20}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.code}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Código único del aula (máximo 20 caracteres)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Nombre del Aula <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre completo del aula"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        isInvalid={!!validationErrors.name}
                        maxLength={100}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.name}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Nombre descriptivo del aula (máximo 100 caracteres)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descripción (Opcional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Descripción del aula, ubicación, características especiales, etc."
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        isInvalid={!!validationErrors.description}
                        maxLength={255}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.description}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        {(formData.description || '').length}/255 caracteres
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
                        Estado del aula
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
                <li>El código del aula debe ser único en el sistema</li>
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

export default EditClassroom;
