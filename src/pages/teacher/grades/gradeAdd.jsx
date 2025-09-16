/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Select, DatePicker, Card, Row, Col } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import locale from 'antd/es/date-picker/locale/es_ES';
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
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

const GradeAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [gradeData, setGradeData] = useState(Grade);

  // Verificar si es modo edición
  useEffect(() => {
    if (id && id !== 'add') {
      setIsEdit(true);
      loadGrade(id);
    } else if (location.state?.grade) {
      setIsEdit(true);
      const grade = location.state.grade;
      setGradeData(grade);
      populateForm(grade);
    } else {
      // Modo creación
      setIsEdit(false);
      const newGrade = gradeService.createNewGrade();
      setGradeData(newGrade);
      populateForm(newGrade);
    }
  }, [id, location.state]);

  /**
   * Carga una calificación específica para edición
   */
  const loadGrade = async (gradeId) => {
    setLoading(true);
    try {
      const response = await gradeService.getGradeById(gradeId);
      if (response.success && response.data) {
        setGradeData(response.data);
        populateForm(response.data);
      } else {
        showError('Calificación no encontrada');
        navigate('/teacher/grades');
      }
    } catch (error) {
      showError('Error al cargar la calificación');
      navigate('/teacher/grades');
    }
    setLoading(false);
  };

  /**
   * Popula el formulario con los datos de la calificación
   */
  const populateForm = (grade) => {
    form.setFieldsValue({
      studentId: grade.studentId,
      courseId: grade.courseId,
      academicPeriod: grade.academicPeriod,
      evaluationType: grade.evaluationType,
      achievementLevel: grade.achievementLevel,
      evaluationDate: grade.evaluationDate ? dayjs(grade.evaluationDate) : dayjs(),
      remarks: grade.remarks,
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
        showError('Errores de validación:\n' + errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit) {
        response = await gradeService.updateGrade(gradeData.id, gradePayload);
      } else {
        response = await gradeService.createGrade(gradePayload);
      }

      if (response.success) {
        showSuccess(response.message);
        navigate('/teacher/grades');
      } else {
        if (response.validationErrors) {
          const errorMessages = Object.values(response.validationErrors).join('\n');
          showError('Errores de validación:\n' + errorMessages);
        } else {
          showError(response.error || 'Error al guardar la calificación');
        }
      }
    } catch (error) {
      showError('Error al guardar la calificación');
    }
    
    setLoading(false);
  };

  /**
   * Cancela la operación y regresa al listado
   */
  const handleCancel = () => {
    navigate('/teacher/grades');
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
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">
                    {isEdit ? 'Editar Calificación' : 'Nueva Calificación'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/teacher/grades">Calificaciones</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      {isEdit ? 'Editar' : 'Agregar'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    className="row"
                  >
                    {/* Información del Estudiante y Curso */}
                    <Card title="Información de la Evaluación" className="col-12 mb-4">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                          <Form.Item
                            name="studentId"
                            label="ID del Estudiante"
                            rules={[
                              { required: true, message: 'El ID del estudiante es obligatorio' },
                              { min: 3, message: 'El ID debe tener al menos 3 caracteres' }
                            ]}
                          >
                            <Input 
                              placeholder="Ingrese el ID del estudiante" 
                              maxLength={50}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} lg={6}>
                          <Form.Item
                            name="courseId"
                            label="ID del Curso"
                            rules={[
                              { required: true, message: 'El ID del curso es obligatorio' },
                              { min: 3, message: 'El ID debe tener al menos 3 caracteres' }
                            ]}
                          >
                            <Input 
                              placeholder="Ingrese el ID del curso" 
                              maxLength={50}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} lg={6}>
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

                        <Col xs={24} sm={12} lg={6}>
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
                    <Card title="Calificación y Observaciones" className="col-12 mb-4">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={8}>
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

                        <Col xs={24} sm={12} lg={8}>
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

                        <Col xs={24} lg={8}>
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
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button 
                          onClick={handleCancel}
                          disabled={loading}
                          icon={<ArrowLeftOutlined />}
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
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* AlertModal para confirmaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default GradeAdd;