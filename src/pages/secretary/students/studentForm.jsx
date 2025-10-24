/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Select, Button, Card, Row, Col, Divider, Spin } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import { Student, DocumentType, Gender, validateStudent } from "../../../types/students/students";

// Suprimir warning de compatibilidad de Ant Design con React 19
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('antd: compatible')) return;
  originalError(...args);
};

console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('antd: compatible')) return;
  originalWarn(...args);
};

const { Option } = Select;

const StudentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(Student);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      // Si viene del state de navegación, usar esos datos
      if (location.state?.student) {
        const studentData = location.state.student;
        setStudent(studentData);
        populateForm(studentData);
      } else {
        // Si no, cargar desde el servicio
        loadStudent();
      }
    } else {
      // Nuevo estudiante
      const newStudent = studentService.createNewStudent();
      setStudent(newStudent);
      populateForm(newStudent);
    }
  }, [id, location.state]);

  /**
   * Carga los datos del estudiante desde el servicio
   */
  const loadStudent = async () => {
    // En modo de edición, mostrar mensaje de que no se puede editar
    showError('No se puede editar estudiantes existentes en este momento');
    navigate('/secretary/students');
  };

  /**
   * Llena el formulario con los datos del estudiante
   */
  const populateForm = (studentData) => {
    const formData = {
      ...studentData,
      birthDate: studentData.birthDate ? 
        (Array.isArray(studentData.birthDate) ? 
          `${studentData.birthDate[0]}-${studentData.birthDate[1].toString().padStart(2, '0')}-${studentData.birthDate[2].toString().padStart(2, '0')}` :
          studentData.birthDate
        ) : null
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
      const studentData = {
        ...values,
        birthDate: values.birthDate ? 
          (typeof values.birthDate === 'string' ? values.birthDate : 
           values.birthDate.toISOString ? values.birthDate.toISOString().split('T')[0] : 
           values.birthDate) : null
      };

      // Solo crear estudiantes, no editar
      const response = await studentService.createStudent(studentData);

      if (response.success) {
        showSuccess(response.message || 'Estudiante creado exitosamente');
        navigate('/secretary/students');
      } else {
        if (response.validationErrors) {
          // Mostrar errores de validación
          showError(`Errores de validación: ${response.validationErrors.join(', ')}`);
        } else {
          showError(response.error);
        }
      }
    } catch (error) {
      showError('Error al crear el estudiante');
    }
    
    setLoading(false);
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    navigate('/secretary/students');
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
                    Nuevo Estudiante
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/students">Estudiantes</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      Nuevo
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
                    initialValues={{
                      documentType: DocumentType.DNI,
                      gender: Gender.MALE,
                      birthDate: new Date().toISOString().split('T')[0],
                    }}
                  >
                    {/* Datos del Estudiante */}
                    <Card title="Datos del Estudiante" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Nombres"
                            name="firstName"
                            rules={[
                              { required: true, message: 'Los nombres son requeridos' },
                              { min: 2, message: 'Mínimo 2 caracteres' }
                            ]}
                          >
                            <Input placeholder="Ingrese los nombres" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Apellidos"
                            name="lastName"
                            rules={[
                              { required: true, message: 'Los apellidos son requeridos' },
                              { min: 2, message: 'Mínimo 2 caracteres' }
                            ]}
                          >
                            <Input placeholder="Ingrese los apellidos" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Tipo de Documento"
                            name="documentType"
                            rules={[{ required: true, message: 'Seleccione el tipo de documento' }]}
                          >
                            <Select placeholder="Seleccione">
                              <Option value={DocumentType.DNI}>DNI</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Número de Documento"
                            name="documentNumber"
                            rules={[
                              { required: true, message: 'El número de documento es requerido' },
                              { pattern: /^\d{8}$/, message: 'Debe tener 8 dígitos' }
                            ]}
                          >
                            <Input 
                              placeholder="Ingrese el número de documento" 
                              maxLength={8}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Fecha de Nacimiento"
                            name="birthDate"
                            rules={[{ required: true, message: 'La fecha de nacimiento es requerida' }]}
                          >
                            <Input 
                              type="date"
                              placeholder="Seleccione la fecha"
                              className="w-100"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Género"
                            name="gender"
                            rules={[{ required: true, message: 'Seleccione el género' }]}
                          >
                            <Select placeholder="Seleccione">
                              <Option value={Gender.MALE}>Masculino</Option>
                              <Option value={Gender.FEMALE}>Femenino</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Dirección"
                            name="address"
                            rules={[{ required: true, message: 'La dirección es requerida' }]}
                          >
                            <Input placeholder="Ingrese la dirección completa" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Teléfono"
                            name="phone"
                            rules={[
                              { pattern: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                            ]}
                          >
                            <Input placeholder="Ingrese el teléfono" maxLength={9} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Datos del Apoderado */}
                    <Card title="Datos del Apoderado" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Nombre del Apoderado"
                            name="parentName"
                            rules={[{ required: true, message: 'El nombre del apoderado es requerido' }]}
                          >
                            <Input placeholder="Ingrese el nombre del apoderado" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Teléfono del Apoderado"
                            name="parentPhone"
                            rules={[
                              { pattern: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                            ]}
                          >
                            <Input placeholder="Teléfono del apoderado" maxLength={9} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24}>
                          <Form.Item
                            label="Email del Apoderado"
                            name="parentEmail"
                            rules={[
                              { type: 'email', message: 'Ingrese un email válido' }
                            ]}
                          >
                            <Input placeholder="Email del apoderado" />
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
                        Guardar Estudiante
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

export default StudentForm;