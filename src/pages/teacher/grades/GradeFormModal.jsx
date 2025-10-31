/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Input, Button, Select, DatePicker, Card, Row, Col, Modal, Tooltip, Tag, Divider } from "antd";
import { SaveOutlined, QuestionCircleOutlined, BulbOutlined, InfoCircleOutlined } from "@ant-design/icons";
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
  const [suggestionsModalVisible, setSuggestionsModalVisible] = useState(false);

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

  /**
   * Renderiza el modal de sugerencias
   */
  const renderSuggestionsModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BulbOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          <span>Guía para Calificar Correctamente</span>
        </div>
      }
      open={suggestionsModalVisible}
      onCancel={() => setSuggestionsModalVisible(false)}
      width={800}
      footer={[
        <Button key="close" type="primary" onClick={() => setSuggestionsModalVisible(false)}>
          Entendido
        </Button>
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '10px' }}>
        {/* Sección 1: Escalas de Calificación */}
        <Card size="small" className="mb-3" style={{ border: '1px solid #e8e8e8' }}>
          <h4 style={{ color: '#1890ff', marginBottom: '12px' }}>
            <InfoCircleOutlined /> Escalas de Calificación (CNEB)
          </h4>
          <div style={{ lineHeight: '1.8' }}>
            {Object.values(GradeScale).map((scale) => (
              <div key={scale.code} style={{ marginBottom: '12px', paddingLeft: '10px', borderLeft: `3px solid ${scale.color}` }}>
                <div>
                  <Tag color={scale.color} style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {scale.code}
                  </Tag>
                  <strong>{scale.name}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {scale.description}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sección 2: Campos Obligatorios */}
        <Card size="small" className="mb-3" style={{ border: '1px solid #e8e8e8' }}>
          <h4 style={{ color: '#52c41a', marginBottom: '12px' }}>
            <InfoCircleOutlined /> Campos Obligatorios
          </h4>
          <ul style={{ marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Tipo de Período:</strong> Seleccione el bimestre o trimestre correspondiente (I, II, III, IV)</li>
            <li><strong>Tipo de Evaluación:</strong> Indique si es Formativa, Sumativa o Diagnóstica</li>
            <li><strong>Competencia:</strong> Mínimo 5 caracteres. Ejemplo: &quot;Resuelve problemas de cantidad&quot;</li>
            <li><strong>Capacidad Evaluada:</strong> Mínimo 3 caracteres. Ejemplo: &quot;Traduce cantidades a expresiones numéricas&quot;</li>
            <li><strong>Escala de Calificación:</strong> Seleccione AD, A, B o C según el desempeño del estudiante</li>
            <li><strong>Fecha de Evaluación:</strong> Debe ser una fecha válida dentro del período académico</li>
          </ul>
        </Card>

        {/* Sección 3: Ejemplos de Competencias por Área */}
        <Card size="small" className="mb-3" style={{ border: '1px solid #e8e8e8' }}>
          <h4 style={{ color: '#722ed1', marginBottom: '12px' }}>
            <InfoCircleOutlined /> Ejemplos de Competencias por Área
          </h4>
          
          <Divider orientation="left" style={{ fontSize: '13px', margin: '8px 0' }}>Matemática</Divider>
          <ul style={{ marginBottom: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Resuelve problemas de cantidad</li>
            <li>Resuelve problemas de regularidad, equivalencia y cambio</li>
            <li>Resuelve problemas de forma, movimiento y localización</li>
            <li>Resuelve problemas de gestión de datos e incertidumbre</li>
          </ul>

          <Divider orientation="left" style={{ fontSize: '13px', margin: '8px 0' }}>Comunicación</Divider>
          <ul style={{ marginBottom: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Se comunica oralmente en su lengua materna</li>
            <li>Lee diversos tipos de textos escritos en su lengua materna</li>
            <li>Escribe diversos tipos de textos en su lengua materna</li>
          </ul>

          <Divider orientation="left" style={{ fontSize: '13px', margin: '8px 0' }}>Ciencia y Tecnología</Divider>
          <ul style={{ marginBottom: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Indaga mediante métodos científicos para construir conocimientos</li>
            <li>Explica el mundo físico basándose en conocimientos sobre seres vivos</li>
            <li>Diseña y construye soluciones tecnológicas para resolver problemas</li>
          </ul>

          <Divider orientation="left" style={{ fontSize: '13px', margin: '8px 0' }}>Personal Social</Divider>
          <ul style={{ marginBottom: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li>Construye su identidad</li>
            <li>Convive y participa democráticamente</li>
            <li>Construye interpretaciones históricas</li>
            <li>Gestiona responsablemente el espacio y el ambiente</li>
          </ul>
        </Card>

        {/* Sección 4: Ejemplos de Capacidades */}
        <Card size="small" className="mb-3" style={{ border: '1px solid #e8e8e8' }}>
          <h4 style={{ color: '#fa541c', marginBottom: '12px' }}>
            <InfoCircleOutlined /> Ejemplos de Capacidades Evaluadas
          </h4>
          <ul style={{ marginBottom: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
            <li>Traduce cantidades a expresiones numéricas</li>
            <li>Comunica su comprensión sobre los números y las operaciones</li>
            <li>Usa estrategias y procedimientos de estimación y cálculo</li>
            <li>Argumenta afirmaciones sobre las relaciones numéricas</li>
            <li>Obtiene información del texto escrito</li>
            <li>Infiere e interpreta información del texto</li>
            <li>Reflexiona y evalúa la forma, el contenido y contexto del texto</li>
            <li>Problematiza situaciones para hacer indagación</li>
            <li>Diseña estrategias para hacer indagación</li>
            <li>Genera y registra datos o información</li>
          </ul>
        </Card>

        {/* Sección 5: Buenas Prácticas */}
        <Card size="small" style={{ border: '1px solid #e8e8e8', backgroundColor: '#f6ffed' }}>
          <h4 style={{ color: '#52c41a', marginBottom: '12px' }}>
            <BulbOutlined /> Buenas Prácticas al Calificar
          </h4>
          <ol style={{ marginBottom: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '13px' }}>
            <li>
              <strong>Sea específico:</strong> Indique claramente qué competencia y capacidad está evaluando
            </li>
            <li>
              <strong>Use evidencias:</strong> Base su calificación en evidencias concretas del desempeño del estudiante
            </li>
            <li>
              <strong>Sea coherente:</strong> La calificación debe reflejar el nivel de logro descrito en la escala
            </li>
            <li>
              <strong>Retroalimente:</strong> Use las observaciones para brindar retroalimentación constructiva
            </li>
            <li>
              <strong>Registre oportunamente:</strong> Califique dentro del período correspondiente
            </li>
            <li>
              <strong>Revise antes de guardar:</strong> Verifique que todos los datos sean correctos
            </li>
          </ol>
        </Card>
      </div>
    </Modal>
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{isEdit ? 'Editar Calificación' : 'Nueva Calificación'}</span>
          <Tooltip title="Ver guía de calificación">
            <Button
              type="dashed"
              icon={<BulbOutlined />}
              onClick={() => setSuggestionsModalVisible(true)}
              style={{ marginLeft: 'auto' }}
            >
              Sugerencias
            </Button>
          </Tooltip>
        </div>
      }
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
                label={
                  <span>
                    Tipo de Período <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Seleccione el bimestre o trimestre en el que se realizó la evaluación">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'El tipo de período es obligatorio' },
                  { 
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const validPeriods = Object.keys(TypePeriod);
                      if (!validPeriods.includes(value)) {
                        return Promise.reject('Seleccione un tipo de período válido');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Select 
                  placeholder="Seleccione el tipo de período"
                  disabled={isEdit}
                  showSearch
                  optionFilterProp="children"
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
                label={
                  <span>
                    Tipo de Evaluación <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Formativa: Durante el proceso de aprendizaje. Sumativa: Al final. Diagnóstica: Al inicio">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'El tipo de evaluación es obligatorio' },
                  { 
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const validTypes = Object.keys(EvaluationType);
                      if (!validTypes.includes(value)) {
                        return Promise.reject('Seleccione un tipo de evaluación válido');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Select 
                  placeholder="Seleccione el tipo de evaluación"
                  showSearch
                  optionFilterProp="children"
                >
                  {Object.values(EvaluationType).map(type => (
                    <Option key={type.code} value={type.code}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="competenceName"
                label={
                  <span>
                    Nombre de la Competencia <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Escriba la competencia del CNEB que está evaluando. Mínimo 5 caracteres">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'El nombre de la competencia es obligatorio' },
                  { 
                    min: 5, 
                    message: 'El nombre debe tener al menos 5 caracteres' 
                  },
                  { 
                    max: 200, 
                    message: 'El nombre no puede exceder 200 caracteres' 
                  },
                  {
                    whitespace: true,
                    message: 'El nombre no puede estar vacío'
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const trimmed = value.trim();
                      if (trimmed.length < 5) {
                        return Promise.reject('La competencia debe tener al menos 5 caracteres (sin contar espacios)');
                      }
                      // Validar que no sean solo números
                      if (/^\d+$/.test(trimmed)) {
                        return Promise.reject('La competencia no puede ser solo números');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input 
                  placeholder="Ej: Resuelve problemas de cantidad" 
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="capacityEvaluated"
                label={
                  <span>
                    Capacidad Evaluada <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Especifique qué capacidad de la competencia está evaluando. Mínimo 3 caracteres">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'La capacidad evaluada es obligatoria' },
                  { 
                    min: 3, 
                    message: 'La capacidad debe tener al menos 3 caracteres' 
                  },
                  { 
                    max: 200, 
                    message: 'La capacidad no puede exceder 200 caracteres' 
                  },
                  {
                    whitespace: true,
                    message: 'La capacidad no puede estar vacía'
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const trimmed = value.trim();
                      if (trimmed.length < 3) {
                        return Promise.reject('La capacidad debe tener al menos 3 caracteres (sin contar espacios)');
                      }
                      // Validar que no sean solo números
                      if (/^\d+$/.test(trimmed)) {
                        return Promise.reject('La capacidad no puede ser solo números');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input 
                  placeholder="Ej: Traduce cantidades a expresiones numéricas" 
                  maxLength={200}
                  showCount
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
                label={
                  <span>
                    Escala de Calificación <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Seleccione la calificación según el nivel de logro del estudiante (AD, A, B, C)">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'La escala de calificación es obligatoria' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const validGrades = Object.keys(GradeScale);
                      if (!validGrades.includes(value)) {
                        return Promise.reject('Seleccione una escala de calificación válida');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Select 
                  placeholder="Seleccione la escala de calificación"
                  onChange={handleGradeScaleChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {Object.values(GradeScale).map(level => (
                    <Option key={level.code} value={level.code}>
                      <div>
                        <Tag color={level.color} style={{ marginRight: '8px' }}>{level.code}</Tag>
                        <strong>{level.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
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
                label={
                  <span>
                    Calificación Numérica (Opcional)
                    <Tooltip title="Para nivel secundaria. Ingrese una nota entre 0 y 20">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === null || value === undefined || value === '') {
                        return Promise.resolve();
                      }
                      const numValue = parseFloat(value);
                      if (isNaN(numValue)) {
                        return Promise.reject('Debe ingresar un número válido');
                      }
                      if (numValue < 0) {
                        return Promise.reject('La nota no puede ser negativa');
                      }
                      if (numValue > 20) {
                        return Promise.reject('La nota no puede ser mayor a 20');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input 
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  placeholder="Ej: 16.5"
                  addonAfter="/20"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="evaluationDate"
                label={
                  <span>
                    Fecha de Evaluación <span style={{ color: 'red' }}>*</span>
                    <Tooltip title="Seleccione la fecha en que se realizó la evaluación">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { required: true, message: 'La fecha de evaluación es obligatoria' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.reject();
                      const selectedDate = value.toDate();
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      
                      if (selectedDate > today) {
                        return Promise.reject('La fecha no puede ser futura');
                      }
                      
                      // Validar que no sea demasiado antigua (más de 2 años)
                      const twoYearsAgo = new Date();
                      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                      
                      if (selectedDate < twoYearsAgo) {
                        return Promise.reject('La fecha no puede ser mayor a 2 años atrás');
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  placeholder="Seleccione la fecha de evaluación"
                  style={{ width: '100%' }}
                  locale={locale}
                  disabledDate={(current) => {
                    // No permitir fechas futuras
                    return current && current > dayjs().endOf('day');
                  }}
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
                label={
                  <span>
                    Observaciones
                    <Tooltip title="Agregue comentarios sobre el desempeño del estudiante, fortalezas y aspectos a mejorar">
                      <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  { 
                    max: 500, 
                    message: 'Las observaciones no pueden exceder 500 caracteres' 
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim() === '') {
                        return Promise.resolve();
                      }
                      const trimmed = value.trim();
                      if (trimmed.length < 10) {
                        return Promise.reject('Si ingresa observaciones, debe tener al menos 10 caracteres');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <TextArea 
                  rows={4}
                  placeholder="Ingrese observaciones adicionales sobre el desempeño del estudiante, fortalezas identificadas y aspectos por mejorar (opcional, mínimo 10 caracteres)"
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

      {/* Modal de sugerencias */}
      {renderSuggestionsModal()}
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
