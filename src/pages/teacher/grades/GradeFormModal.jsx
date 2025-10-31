/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Input, Button, Select, DatePicker, Card, Row, Col, Modal } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import locale from 'antd/es/date-picker/locale/es_ES';
import useAlert from "../../../hooks/useAlert";
import AlertModal from "../../../components/AlertModal";
import gradeService from "../../../services/grades/gradeService";
import { 
  Grade, 
  GradeScale, 
  TypePeriod, 
  EvaluationType, 
  validateGrade 
} from "../../../types/grades/grade";

const { Option } = Select;
const { TextArea } = Input;

// Cursos predefinidos para el sistema educativo peruano
const MOCK_COURSES = [
  { id: 'MAT', name: 'Matemática' },
  { id: 'COM', name: 'Comunicación' },
  { id: 'CCS', name: 'Ciencias Sociales' },
  { id: 'DPC', name: 'Desarrollo Personal, Ciudadanía y Cívica' },
  { id: 'CYT', name: 'Ciencia y Tecnología' },
  { id: 'EFI', name: 'Educación Física' },
  { id: 'ERE', name: 'Educación Religiosa' },
  { id: 'AYC', name: 'Arte y Cultura' },
  { id: 'EPT', name: 'Educación para el Trabajo' },
  { id: 'ING', name: 'Inglés como lengua extranjera' }
];

const GradeFormModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  gradeData = null,
  classroomData = null,
  studentData = null,
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);

  // Efectos
  useEffect(() => {
    if (visible) {
      if (gradeData && mode === 'edit') {
        setIsEdit(true);
        populateForm(gradeData);
      } else {
        setIsEdit(false);
        resetForm();
        
        // Si hay datos de aula y estudiante pre-seleccionados
        if (classroomData && studentData) {
          setSelectedClassroomId(classroomData.classroomId);
          
          console.log('🎯 Pre-llenando formulario con datos:');
          console.log('   🏫 Aula:', classroomData);
          console.log('   👤 Estudiante:', studentData);
          
          // Pre-llenar SOLO los IDs en el formulario (necesarios para el backend)
          // Los nombres se mostrarán en los inputs disabled
          setTimeout(() => {
            form.setFieldsValue({
              classroomId: classroomData.classroomId,
              studentId: studentData.id,
              courseId: classroomData.courseId || '',
              periodId: classroomData.periodId || ''
            });
          }, 100);
        }
      }
    }
  }, [visible, gradeData, classroomData, studentData, mode]);

  /**
   * Carga los estudiantes matriculados en un aula
   */
  const loadStudentsByClassroom = async (classroomId) => {
    if (!classroomId) return;
    
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `https://lab.vallegrande.edu.pe/school/gateway/api/v1/enrollments/teacher/by-classroom/${classroomId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        const enrollments = result.data || [];
        
        // Mapear a formato para el select
        const studentList = enrollments
          .filter(enrollment => enrollment.status === 'ACTIVE')
          .map(enrollment => ({
            id: enrollment.studentId,
            name: `${enrollment.firstName} ${enrollment.lastName}`,
            documentNumber: enrollment.documentNumber,
            fullData: enrollment
          }));
        
        setStudents(studentList);
      } else {
        console.error('Error al cargar estudiantes:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Maneja el cambio del aula
   */
  const handleClassroomChange = (e) => {
    const value = e.target.value.trim();
    setSelectedClassroomId(value);
    
    // Limpiar el estudiante seleccionado cuando cambia el aula
    form.setFieldsValue({ studentId: undefined });
    
    // Cargar estudiantes del aula seleccionada (si tiene al menos 20 caracteres, típico de un ID)
    if (value && value.length >= 20) {
      loadStudentsByClassroom(value);
    } else {
      setStudents([]);
    }
  };

  /**
   * Resetea el formulario con valores por defecto
   */
  const resetForm = () => {
    const newGrade = gradeService.createNewGrade();
    form.setFieldsValue({
      studentId: '',
      courseId: '',
      classroomId: '',
      periodId: '',
      typePeriod: undefined,
      competenceName: '',
      capacityEvaluated: '',
      gradeScale: undefined,
      numericGrade: null,
      evaluationType: undefined,
      evaluationDate: dayjs(),
      observations: '',
    });
  };

  /**
   * Popula el formulario con los datos de la calificación
   */
  const populateForm = (grade) => {
    form.setFieldsValue({
      studentId: grade.studentId || '',
      courseId: grade.courseId || '',
      classroomId: grade.classroomId || '',
      periodId: grade.periodId || '',
      typePeriod: grade.typePeriod,
      competenceName: grade.competenceName || '',
      capacityEvaluated: grade.capacityEvaluated || '',
      gradeScale: grade.gradeScale,
      numericGrade: grade.numericGrade,
      evaluationType: grade.evaluationType,
      evaluationDate: grade.evaluationDate ? dayjs(grade.evaluationDate) : dayjs(),
      observations: grade.observations || '',
    });
    
    // Si hay un classroomId, cargar los estudiantes
    if (grade.classroomId) {
      setSelectedClassroomId(grade.classroomId);
      loadStudentsByClassroom(grade.classroomId);
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      let response;
      
      if (isEdit && gradeData?.id) {
        // ===== ACTUALIZACIÓN: Solo enviar los 7 campos editables =====
        const updatePayload = {
          competenceName: values.competenceName.trim(),
          capacityEvaluated: (values.capacityEvaluated || '').trim() || 'Capacidad no especificada',
          gradeScale: values.gradeScale,
          numericGrade: values.numericGrade || null,
          evaluationType: values.evaluationType,
          evaluationDate: values.evaluationDate.format('YYYY-MM-DD'),
          observations: values.observations ? values.observations.trim() : '',
        };
        
        console.log('📝 Actualizando calificación con ID:', gradeData.id);
        console.log('📤 Payload de actualización (solo campos editables):', updatePayload);
        response = await gradeService.updateGrade(gradeData.id, updatePayload);
      } else {
        // ===== CREACIÓN: Enviar todos los campos =====
        // Si hay datos pre-cargados, usar los IDs de classroomData y studentData
        const gradePayload = {
          studentId: studentData ? studentData.id : values.studentId.trim(),
          courseId: classroomData ? classroomData.courseId : values.courseId.trim(),
          classroomId: classroomData ? classroomData.classroomId : values.classroomId.trim(),
          periodId: classroomData ? classroomData.periodId : values.periodId.trim(),
          typePeriod: values.typePeriod,
          competenceName: values.competenceName.trim(),
          capacityEvaluated: (values.capacityEvaluated || '').trim() || 'Capacidad no especificada',
          gradeScale: values.gradeScale,
          numericGrade: values.numericGrade || null,
          evaluationType: values.evaluationType,
          evaluationDate: values.evaluationDate.format('YYYY-MM-DD'),
          observations: values.observations ? values.observations.trim() : '',
        };

        console.log('📝 Creando nueva calificación');
        console.log('📋 Datos de origen:');
        if (classroomData) {
          console.log('   🏫 Classroom:', classroomData);
        }
        if (studentData) {
          console.log('   👤 Student:', studentData);
        }
        console.log('📤 Payload final:', gradePayload);

        // Validar antes de enviar
        const validation = validateGrade(gradePayload);
        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join('\n');
          showError('Errores de validación', errorMessages);
          setLoading(false);
          return;
        }
        
        response = await gradeService.registerGrade(gradePayload);
      }

      console.log('📬 Respuesta recibida:', response);

      if (response.success) {
        // Resetear formulario y cerrar modal PRIMERO
        form.resetFields();
        onCancel();
        
        // Notificar éxito para recargar los datos
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // Mostrar alerta DESPUÉS de cerrar el modal
        setTimeout(() => {
          showSuccess(response.message || (isEdit ? 'Calificación actualizada exitosamente' : 'Calificación registrada exitosamente'));
        }, 100);
      } else {
        if (response.validationErrors) {
          const errorMessages = Object.values(response.validationErrors).join('\n');
          showError('Errores de validación', errorMessages);
        } else {
          showError('Error al guardar', response.error || 'Los datos deben ser válidos y únicos');
        }
      }
    } catch (error) {
      showError('Error al guardar la calificación');
    }
    
    setLoading(false);
  };

  /**
   * Maneja la cancelación del modal
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  /**
   * Maneja el cambio del nivel de logro para mostrar descripción
   */
  const handleGradeScaleChange = (value) => {
    const levelInfo = GradeScale[value];
    if (levelInfo) {
      form.setFieldsValue({
        remarks: levelInfo.description
      });
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Calificación' : 'Nueva Calificación'}
      open={visible}
      onCancel={handleCancel}
      width={1000}
      footer={null}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Información del Estudiante y Curso */}
        <Card title="Información de la Evaluación" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="classroomId"
                label="Aula"
                rules={[
                  { required: true, message: 'El aula es obligatoria' }
                ]}
              >
                {classroomData ? (
                  <Input 
                    value={classroomData.classroomName || 'Aula no especificada'}
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5', 
                      color: '#000',
                      fontWeight: '500'
                    }}
                  />
                ) : (
                  <Input 
                    placeholder="Ingrese el ID del aula (ej: 690059632dc0bce8d164fe2b)" 
                    maxLength={100}
                    disabled={isEdit}
                    onBlur={handleClassroomChange}
                  />
                )}
              </Form.Item>
              {loadingStudents && (
                <div style={{ marginTop: -10, marginBottom: 10, color: '#1890ff' }}>
                  <span>🔄 Cargando estudiantes...</span>
                </div>
              )}
              {!loadingStudents && students.length > 0 && !classroomData && (
                <div style={{ marginTop: -10, marginBottom: 10, color: '#52c41a' }}>
                  <span>✅ {students.length} estudiante(s) encontrado(s)</span>
                </div>
              )}
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="studentId"
                label="Estudiante"
                rules={[
                  { required: true, message: 'El estudiante es obligatorio' }
                ]}
              >
                {studentData ? (
                  <Input 
                    value={`${studentData.firstName} ${studentData.lastName}`}
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5', 
                      color: '#000',
                      fontWeight: '500'
                    }}
                    addonAfter={`DNI: ${studentData.documentNumber}`}
                  />
                ) : (
                  <Select 
                    placeholder={loadingStudents ? "Cargando estudiantes..." : "Seleccione un estudiante"}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={isEdit || !selectedClassroomId || loadingStudents}
                    loading={loadingStudents}
                    notFoundContent={
                      loadingStudents ? "Cargando..." : 
                      !selectedClassroomId ? "Primero ingrese el ID del aula" :
                      "No hay estudiantes matriculados en esta aula"
                    }
                    options={students.map(student => ({
                      value: student.id,
                      label: `${student.name} (DNI: ${student.documentNumber})`
                    }))}
                  />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="courseId"
                label="Curso"
                rules={[
                  { required: true, message: 'El curso es obligatorio' }
                ]}
              >
                {classroomData && classroomData.courseName ? (
                  <Input 
                    value={classroomData.courseName}
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5', 
                      color: '#000',
                      fontWeight: '500'
                    }}
                  />
                ) : (
                  <Input 
                    placeholder="Ingrese el ID del curso (ej: course-uuid-mat)" 
                    maxLength={100}
                    disabled={isEdit}
                  />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="periodId"
                label="Período"
                rules={[
                  { required: true, message: 'El período es obligatorio' }
                ]}
              >
                {classroomData && classroomData.periodName ? (
                  <Input 
                    value={classroomData.periodName}
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5', 
                      color: '#000',
                      fontWeight: '500'
                    }}
                  />
                ) : (
                  <Input 
                    placeholder="Ingrese el ID del período (ej: period-uuid-001)" 
                    maxLength={100}
                    disabled={isEdit}
                  />
                )}
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="typePeriod"
                label="Tipo de Período"
                rules={[{ required: true, message: 'El tipo de período es obligatorio' }]}
              >
                <Select 
                  placeholder="Seleccione el tipo de período"
                  disabled={isEdit}
                >
                  {Object.values(TypePeriod).map(period => (
                    <Option key={period.code} value={period.code}>{period.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="evaluationType"
                label="Tipo de Evaluación"
                rules={[{ required: true, message: 'El tipo de evaluación es obligatorio' }]}
              >
                <Select placeholder="Seleccione el tipo de evaluación">
                  {Object.values(EvaluationType).map(type => (
                    <Option key={type.code} value={type.code}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="competenceName"
                label="Nombre de la Competencia"
                rules={[
                  { required: true, message: 'El nombre de la competencia es obligatorio' },
                  { min: 5, message: 'El nombre debe tener al menos 5 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Ej: Resuelve problemas de cantidad" 
                  maxLength={200}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="capacityEvaluated"
                label="Capacidad Evaluada"
                rules={[
                  { required: true, message: 'La capacidad evaluada es obligatoria' },
                  { min: 3, message: 'La capacidad debe tener al menos 3 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Ej: Traduce cantidades a expresiones numéricas" 
                  maxLength={200}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Calificación */}
        <Card title="Calificación y Observaciones" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gradeScale"
                label="Escala de Calificación"
                rules={[{ required: true, message: 'La escala de calificación es obligatoria' }]}
              >
                <Select 
                  placeholder="Seleccione la escala de calificación"
                  onChange={handleGradeScaleChange}
                >
                  {Object.values(GradeScale).map(level => (
                    <Option key={level.code} value={level.code}>
                      <div>
                        <strong>{level.code} - {level.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {level.description}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="numericGrade"
                label="Calificación Numérica (Opcional)"
              >
                <Input 
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  placeholder="Ej: 16.5" 
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="evaluationDate"
                label="Fecha de Evaluación"
                rules={[{ required: true, message: 'La fecha de evaluación es obligatoria' }]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  placeholder="Seleccione la fecha de evaluación"
                  style={{ width: '100%' }}
                  locale={locale}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              {/* Mostrar información de la escala seleccionada */}
              <div className="form-group">
                <label>Descripción de la Escala</label>
                <div className="alert alert-info">
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.gradeScale !== currentValues.gradeScale}>
                    {({ getFieldValue }) => {
                      const scale = getFieldValue('gradeScale');
                      const scaleInfo = GradeScale[scale];
                      return scaleInfo ? (
                        <div>
                          <strong>{scaleInfo.name}</strong>
                          <div className="mt-1" style={{ fontSize: '13px' }}>
                            {scaleInfo.description}
                          </div>
                        </div>
                      ) : (
                        <div>Seleccione una escala de calificación para ver la descripción</div>
                      );
                    }}
                  </Form.Item>
                </div>
              </div>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="observations"
                label="Observaciones"
                rules={[
                  { max: 500, message: 'Las observaciones no pueden exceder 500 caracteres' }
                ]}
              >
                <TextArea 
                  rows={4}
                  placeholder="Ingrese observaciones adicionales (opcional)"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Botones de acción */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
          >
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
          </Button>
        </div>
      </Form>

      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </Modal>
  );
};

GradeFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  gradeData: PropTypes.object,
  classroomData: PropTypes.object,
  studentData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

GradeFormModal.defaultProps = {
  onSuccess: null,
  gradeData: null,
  classroomData: null,
  studentData: null,
};

export default GradeFormModal;
