/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Select, Button, Card, Row, Col, AutoComplete, Alert } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import classroomService from "../../../services/academic/classroomService";
import { Enrollment, EnrollmentType, validateEnrollment } from "../../../types/enrollments/enrollments";

const { Option } = Select;

const EnrollmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [enrollment, setEnrollment] = useState(Enrollment);
  const [students, setStudents] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const isEdit = false; // No se permite editar matrículas

  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState(EnrollmentType.REGULAR);

  useEffect(() => {
    // Obtener studentId de los parámetros de búsqueda de la URL
    const searchParams = new URLSearchParams(location.search);
    const urlStudentId = searchParams.get('studentId');
    
    loadStudents();
    loadClassrooms();
    
    // Nueva matrícula
    initializeNewEnrollment(urlStudentId);
  }, [location.search]);

  useEffect(() => {
    // Actualizar el estado local cuando el formulario cambie el tipo de matrícula
    const currentEnrollmentType = form.getFieldValue('enrollmentType');
    if (currentEnrollmentType) {
      setSelectedEnrollmentType(currentEnrollmentType);
    }
  }, [form.getFieldValue('enrollmentType')]);

  /**
   * Inicializa una nueva matrícula
   */
  const initializeNewEnrollment = async (studentId = null) => {
    try {
      const newEnrollment = enrollmentService.createNewEnrollment();
      
      // Si hay studentId en la URL, preseleccionar el estudiante
      if (studentId) {
        newEnrollment.studentId = studentId;
      }
      
      setEnrollment(newEnrollment);
      populateForm(newEnrollment);
    } catch (error) {
      console.error('Error al inicializar nueva matrícula:', error);
      showError('Error al inicializar matrícula');
    }
  };

  /**
   * Carga los estudiantes disponibles (solo los no matriculados)
   */
  const loadStudents = async () => {
    try {
      // Cargar solo estudiantes no matriculados
      const response = await studentService.getUnenrolledStudents();
      console.log('[DEBUG] Unenrolled Students API Response (EnrollmentForm):', response);
      if (response.success) {
        setStudents(response.data);
        // Preparar opciones para el Select
        const options = response.data.map(student => ({
          value: student.id,
          label: `${student.firstName} ${student.lastName} - ${student.documentNumber}`,
          student: student
        }));
        setStudentOptions(options);
        
        // Mostrar información al usuario sobre la cantidad de estudiantes disponibles
        if (response.data.length === 0) {
          showAlert({
            type: 'warning',
            title: 'Sin estudiantes disponibles',
            message: 'No hay estudiantes sin matrícula disponibles para matricular.'
          });
        } else {
          console.log(`${response.data.length} estudiantes sin matrícula disponibles`);
        }
      } else {
        showError(response.error || 'Error al cargar estudiantes');
      }
    } catch (error) {
      console.error('Error al cargar estudiantes no matriculados:', error);
      showError('Error al cargar estudiantes disponibles');
    }
  };

  /**
   * Carga las aulas disponibles
   */
  const loadClassrooms = async () => {
    try {
      const response = await classroomService.getAllClassrooms();
      console.log('[DEBUG] Classroom API Response (EnrollmentForm):', response);
      if (response.success) {
        setClassrooms(response.data);
        console.log('[DEBUG] Classrooms state in EnrollmentForm:', response.data);
      } else {
        showError(response.error || "Error al cargar las aulas");
      }
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      showError('Error de red al cargar las aulas');
    }
  };

  /**
   * Llena el formulario con los datos de la matrícula
   */
  const populateForm = (enrollmentData) => {
    const formData = {
      ...enrollmentData,
      enrollmentDate: enrollmentData.enrollmentDate ? 
        (Array.isArray(enrollmentData.enrollmentDate) ? 
          `${enrollmentData.enrollmentDate[0]}-${enrollmentData.enrollmentDate[1].toString().padStart(2, '0')}-${enrollmentData.enrollmentDate[2].toString().padStart(2, '0')}` :
          enrollmentData.enrollmentDate
        ) : new Date().toISOString().split('T')[0]
    };
    
    form.setFieldsValue(formData);
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar los datos
      const enrollmentData = {
        ...values,
        enrollmentDate: values.enrollmentDate ? 
          (typeof values.enrollmentDate === 'string' ? values.enrollmentDate : 
           values.enrollmentDate.toISOString ? values.enrollmentDate.toISOString().split('T')[0] : 
           values.enrollmentDate) : null,
        enrollmentType: values.enrollmentType,
        ...(values.enrollmentType === EnrollmentType.TRANSFER && { transferReason: values.transferReason }),
      };

      // Solo crear matrículas, no editar
      const response = await enrollmentService.createEnrollment(enrollmentData);

      if (response.success) {
        showSuccess(response.message || 'Matrícula creada exitosamente');
        navigate('/secretary/enrollments');
      } else {
        if (response.validationErrors) {
          showError(`Errores de validación: ${response.validationErrors.join(', ')}`);
        } else {
          showError(response.error);
        }
      }
    } catch (error) {
      showError('Error al crear la matrícula');
    }
    
    setLoading(false);
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    navigate('/secretary/enrollments');
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
                    Nueva Matrícula
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/enrollments">Matrículas</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      Nueva
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
                    disabled={loading}
                  >
                    {/* Alerta informativa */}
                    <Alert
                      message="Información importante"
                      description={`Solo se muestran estudiantes que NO tienen matrícula activa. Si no ve el estudiante que busca, verifique que no esté ya matriculado. Estudiantes disponibles: ${students.length}`}
                      type="info"
                      showIcon
                      className="mb-3"
                    />

                    {/* Datos de la Matrícula */}
                    <Card title="Datos de la Matrícula" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Fecha de Matrícula"
                            name="enrollmentDate"
                            rules={[{ required: true, message: 'La fecha de matrícula es requerida' }]}
                          >
                            <Input 
                              type="date"
                              placeholder="Seleccione la fecha"
                              className="w-100"
                              defaultValue={new Date().toISOString().split('T')[0]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Aula"
                            name="classroomId"
                            rules={[{ required: true, message: 'El aula es requerida' }]}
                          >
                            <Select
                              showSearch
                              placeholder="Seleccione un aula"
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                            >
                              {classrooms.map(classroom => (
                                <Option key={classroom.id} value={classroom.id}>
                                  {classroom.classroomName} {classroom.section ? `(${classroom.section})` : ''}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Tipo de Matrícula"
                            name="enrollmentType"
                            initialValue={EnrollmentType.REGULAR}
                          >
                            <Select 
                              placeholder="Seleccione" 
                              onChange={(value) => setSelectedEnrollmentType(value)}
                            >
                              <Option value={EnrollmentType.REGULAR}>Regular</Option>
                              <Option value={EnrollmentType.TRANSFER}>Transferencia</Option>
                              <Option value={EnrollmentType.REPEAT}>Repetición</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        {selectedEnrollmentType === EnrollmentType.TRANSFER && (
                          <Col xs={24} sm={12} md={8}>
                            <Form.Item
                              label="Razón de Transferencia"
                              name="transferReason"
                              rules={[{ required: true, message: 'La razón de transferencia es requerida' }]}
                            >
                              <Input.TextArea rows={2} placeholder="Ingrese la razón de la transferencia" />
                            </Form.Item>
                          </Col>
                        )}
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24}>
                          <Form.Item
                            label="Estudiante (Solo estudiantes sin matrícula)"
                            name="studentId"
                            rules={[{ required: true, message: 'Seleccione un estudiante' }]}
                          >
                            <Select
                              showSearch
                              placeholder="Busque un estudiante disponible para matricular"
                              optionFilterProp="children"
                              loading={searchingStudents}
                              filterOption={(input, option) =>
                                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                            >
                              {studentOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                  {option.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Botones */}
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={loading}
                      >
                        Guardar Matrícula
                      </Button>
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

export default EnrollmentForm;