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
  AchievementLevel, 
  AcademicPeriod, 
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
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');

  // Efectos
  useEffect(() => {
    if (visible) {
      if (gradeData && mode === 'edit') {
        setIsEdit(true);
        populateForm(gradeData);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, gradeData, mode]);

  /**
   * Resetea el formulario con valores por defecto
   */
  const resetForm = () => {
    const newGrade = gradeService.createNewGrade();
    form.setFieldsValue({
      studentId: '',
      courseId: '',
      academicPeriod: undefined,
      evaluationType: undefined,
      achievementLevel: undefined,
      evaluationDate: dayjs(),
      remarks: '',
    });
  };

  /**
   * Popula el formulario con los datos de la calificación
   */
  const populateForm = (grade) => {
    form.setFieldsValue({
      studentId: grade.studentId || '',
      courseId: grade.courseId || '',
      academicPeriod: grade.academicPeriod,
      evaluationType: grade.evaluationType,
      achievementLevel: grade.achievementLevel,
      evaluationDate: grade.evaluationDate ? dayjs(grade.evaluationDate) : dayjs(),
      remarks: grade.remarks || '',
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar datos para envío
      const gradePayload = {
        studentId: values.studentId.trim(),
        courseId: values.courseId.trim(),
        academicPeriod: values.academicPeriod,
        evaluationType: values.evaluationType,
        achievementLevel: values.achievementLevel,
        evaluationDate: values.evaluationDate.format('YYYY-MM-DD'),
        remarks: values.remarks ? values.remarks.trim() : '',
      };

      // Validar antes de enviar
      const validation = validateGrade(gradePayload);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        showError('Errores de validación', errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit && gradeData?.id) {
        response = await gradeService.updateGrade(gradeData.id, gradePayload);
      } else {
        response = await gradeService.createGrade(gradePayload);
      }

      if (response.success) {
        showSuccess(response.message);
        form.resetFields();
        onSuccess && onSuccess(response.data);
        onCancel();
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
  const handleAchievementLevelChange = (value) => {
    const levelInfo = AchievementLevel[value];
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
                name="studentId"
                label="Nombre del Estudiante"
                rules={[
                  { required: true, message: 'El nombre del estudiante es obligatorio' },
                  { min: 3, message: 'El nombre debe tener al menos 3 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Ingrese el nombre completo del estudiante" 
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="courseId"
                label="Curso"
                rules={[
                  { required: true, message: 'Seleccionar un curso es obligatorio' }
                ]}
              >
                <Select placeholder="Seleccione un curso">
                  {MOCK_COURSES.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="academicPeriod"
                label="Período Académico"
                rules={[{ required: true, message: 'El período académico es obligatorio' }]}
              >
                <Select placeholder="Seleccione el período académico">
                  {Object.values(AcademicPeriod).map(period => (
                    <Option key={period} value={period}>{period}</Option>
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
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Calificación */}
        <Card title="Calificación y Observaciones" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="achievementLevel"
                label="Nivel de Logro"
                rules={[{ required: true, message: 'El nivel de logro es obligatorio' }]}
              >
                <Select 
                  placeholder="Seleccione el nivel de logro"
                  onChange={handleAchievementLevelChange}
                >
                  {Object.values(AchievementLevel).map(level => (
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
              {/* Mostrar información del nivel de logro seleccionado */}
              <div className="form-group">
                <label>Descripción del Nivel</label>
                <div className="alert alert-info">
                  <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.achievementLevel !== currentValues.achievementLevel}>
                    {({ getFieldValue }) => {
                      const level = getFieldValue('achievementLevel');
                      const levelInfo = AchievementLevel[level];
                      return levelInfo ? (
                        <div>
                          <strong>{levelInfo.name}</strong>
                          <div className="mt-1" style={{ fontSize: '13px' }}>
                            {levelInfo.description}
                          </div>
                        </div>
                      ) : (
                        <div>Seleccione un nivel de logro para ver la descripción</div>
                      );
                    }}
                  </Form.Item>
                </div>
              </div>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="remarks"
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
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

GradeFormModal.defaultProps = {
  onSuccess: null,
  gradeData: null,
};

export default GradeFormModal;
