/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Select, Button, Card, Row, Col, AutoComplete } from "antd";
import { SaveOutlined, ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import { Enrollment, validateEnrollment } from "../../../types/enrollments/enrollments";
// Usando Date nativo de JavaScript

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
  const isEdit = Boolean(id);

  useEffect(() => {
    // Obtener studentId de los parámetros de búsqueda de la URL
    const searchParams = new URLSearchParams(location.search);
    const urlStudentId = searchParams.get('studentId');
    
    loadStudents();
    
    if (isEdit) {
      // Si viene del state de navegación, usar esos datos
      if (location.state?.enrollment) {
        const enrollmentData = location.state.enrollment;
        setEnrollment(enrollmentData);
        populateForm(enrollmentData);
      } else {
        // Si no, cargar desde el servicio
        loadEnrollment();
      }
    } else {
      // Nueva matrícula
      initializeNewEnrollment(urlStudentId);
    }
  }, [id, location.state, location.search]);

  /**
   * Inicializa una nueva matrícula con número generado automáticamente
   */
  const initializeNewEnrollment = async (studentId = null) => {
    try {
      const newEnrollment = enrollmentService.createNewEnrollment();
      
      // Generar número de matrícula automáticamente
      const enrollmentNumber = await enrollmentService.generateNextEnrollmentNumber();
      newEnrollment.enrollmentNumber = enrollmentNumber;
      
      // Si hay studentId en la URL, preseleccionar el estudiante
      if (studentId) {
        newEnrollment.studentId = studentId;
      }
      
      setEnrollment(newEnrollment);
      populateForm(newEnrollment);
    } catch (error) {
      console.error('Error al inicializar nueva matrícula:', error);
      showError('Error al generar número de matrícula');
    }
  };

  /**
   * Carga los estudiantes disponibles
   */
  const loadStudents = async () => {
    try {
      const response = await studentService.getStudentsNotEnrolled();
      if (response.success) {
        setStudents(response.data);
        // Preparar opciones para el AutoComplete
        const options = response.data.map(student => ({
          value: student.id,
          label: `${student.firstName} ${student.lastName} - ${student.documentNumber}`,
          student: student
        }));
        setStudentOptions(options);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  /**
   * Carga los datos de la matrícula desde el servicio
   */
  const loadEnrollment = async () => {
    setLoading(true);
    try {
      const response = await enrollmentService.getEnrollmentById(id);
      
      if (response.success && response.data) {
        setEnrollment(response.data);
        populateForm(response.data);
      } else {
        showError(response.error || 'Matrícula no encontrada');
        navigate('/secretary/enrollments');
      }
    } catch (error) {
      showError('Error al cargar la matrícula');
      navigate('/secretary/enrollments');
    }
    setLoading(false);
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
   * Busca estudiantes por texto
   */
  const handleStudentSearch = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setStudentOptions(students.map(student => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName} - ${student.documentNumber}`,
        student: student
      })));
      return;
    }

    setSearchingStudents(true);
    
    try {
      // Buscar por nombre
      const nameResponse = await studentService.searchStudentsByFirstName(searchText);
      let foundStudents = nameResponse.success ? nameResponse.data : [];
      
      // Si no encuentra por nombre, buscar por apellido
      if (foundStudents.length === 0) {
        const lastNameResponse = await studentService.searchStudentsByLastName(searchText);
        foundStudents = lastNameResponse.success ? lastNameResponse.data : [];
      }
      
      // Si no encuentra por nombre/apellido, buscar por documento
      if (foundStudents.length === 0 && /^\d+$/.test(searchText)) {
        const docResponse = await studentService.getStudentByDocument(searchText);
        foundStudents = docResponse.success ? docResponse.data : [];
      }
      
      // Preparar opciones
      const options = foundStudents.map(student => ({
        value: student.id,
        label: `${student.firstName} ${student.lastName} - ${student.documentNumber}`,
        student: student
      }));
      
      setStudentOptions(options);
    } catch (error) {
      console.error('Error al buscar estudiantes:', error);
    }
    
    setSearchingStudents(false);
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar los datos
      let enrollmentNumber = values.enrollmentNumber;
      
      // Si no hay número de matrícula, generar uno nuevo
      if (!enrollmentNumber) {
        enrollmentNumber = await enrollmentService.generateNextEnrollmentNumber();
      }
      
      const enrollmentData = {
        ...values,
        enrollmentNumber,
        enrollmentDate: values.enrollmentDate ? 
          (typeof values.enrollmentDate === 'string' ? values.enrollmentDate : 
           values.enrollmentDate.toISOString ? values.enrollmentDate.toISOString().split('T')[0] : 
           values.enrollmentDate) : null,
      };

      let response;
      if (isEdit) {
        response = await enrollmentService.updateEnrollment(id, enrollmentData);
      } else {
        response = await enrollmentService.createEnrollment(enrollmentData);
      }

      if (response.success) {
        showSuccess(response.message || `Matrícula ${isEdit ? 'actualizada' : 'creada'} exitosamente`);
        navigate('/secretary/enrollments');
      } else {
        if (response.validationErrors) {
          showError(`Errores de validación: ${response.validationErrors.join(', ')}`);
        } else {
          showError(response.error);
        }
      }
    } catch (error) {
      showError(`Error al ${isEdit ? 'actualizar' : 'crear'} la matrícula`);
    }
    
    setLoading(false);
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    navigate('/secretary/enrollments');
  };

  /**
   * Genera automáticamente el número de matrícula
   */
  const handleGenerateNumber = async () => {
    try {
      const number = await enrollmentService.generateNextEnrollmentNumber();
      form.setFieldsValue({ enrollmentNumber: number });
      setEnrollment(prev => ({ ...prev, enrollmentNumber: number }));
    } catch (error) {
      console.error('Error al generar número de matrícula:', error);
      showError('Error al generar número de matrícula');
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
                    {isEdit ? 'Editar Matrícula' : 'Nueva Matrícula'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/enrollments">Matrículas</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      {isEdit ? 'Editar' : 'Nueva'}
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
                    {/* Datos de la Matrícula */}
                    <Card title="Datos de la Matrícula" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Número de Matrícula"
                            name="enrollmentNumber"
                            rules={[
                              { required: true, message: 'El número de matrícula es requerido' }
                            ]}
                          >
                            <Input 
                              placeholder="Ingrese el número de matrícula"
                              addonAfter={
                                <Button 
                                  type="link" 
                                  size="small" 
                                  onClick={handleGenerateNumber}
                                  disabled={isEdit}
                                >
                                  Generar
                                </Button>
                              }
                            />
                          </Form.Item>
                        </Col>
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
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="ID del Aula"
                            name="classroomId"
                            rules={[{ required: true, message: 'El ID del aula es requerido' }]}
                          >
                            <Input placeholder="Ingrese el ID del aula" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Estudiante"
                            name="studentId"
                            rules={[{ required: true, message: 'Seleccione un estudiante' }]}
                          >
                            <Select
                              showSearch
                              placeholder="Busque y seleccione un estudiante"
                              optionFilterProp="children"
                              loading={searchingStudents}
                              onSearch={handleStudentSearch}
                              filterOption={false}
                              notFoundContent={searchingStudents ? 'Buscando...' : 'No encontrado'}
                            >
                              {studentOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                  {option.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        {isEdit && (
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="Estado"
                              name="status"
                              rules={[{ required: true, message: 'Seleccione el estado' }]}
                            >
                              <Select placeholder="Seleccione el estado">
                                <Option value="ACTIVE">Activa</Option>
                                <Option value="INACTIVE">Inactiva</Option>
                                <Option value="COMPLETED">Completada</Option>
                                <Option value="CANCELLED">Cancelada</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        )}
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
                        {isEdit ? 'Actualizar' : 'Guardar'} Matrícula
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