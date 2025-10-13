/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Select, Button, Card, Row, Col, Divider, Spin } from "antd";
import { SaveOutlined, ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import reniecService from "../../../services/students/reniecService";
import { Student, DocumentType, Gender, GuardianRelationship, validateStudent } from "../../../types/students/students";

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
  const [searchingReniec, setSearchingReniec] = useState(false);
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
    setLoading(true);
    try {
      const response = await studentService.getStudentById(id);
      if (response.success && response.data) {
        setStudent(response.data);
        populateForm(response.data);
      } else {
        showError(response.error || 'Estudiante no encontrado');
        navigate('/secretary/students');
      }
    } catch (error) {
      showError('Error al cargar el estudiante');
      navigate('/secretary/students');
    }
    setLoading(false);
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
   * Busca datos del estudiante en RENIEC por DNI
   */
  const handleSearchReniec = async () => {
    const dni = form.getFieldValue('documentNumber');
    
    if (!dni || dni.length !== 8) {
      showError('Por favor ingrese un DNI válido de 8 dígitos');
      return;
    }

    setSearchingReniec(true);
    try {
      const response = await reniecService.searchByDNI(dni);
      
      if (response.success && response.data) {
        // Rellenar el formulario con los datos de RENIEC
        const fieldsToSet = {
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          documentType: response.data.documentType,
          birthDate: response.data.birthDate,
          gender: response.data.gender,
          address: response.data.address
        };

        // Agregar datos del apoderado si existen
        if (response.data.guardianName) {
          fieldsToSet.guardianName = response.data.guardianName;
        }
        if (response.data.guardianLastName) {
          fieldsToSet.guardianLastName = response.data.guardianLastName;
        }
        if (response.data.guardianRelationship) {
          fieldsToSet.guardianRelationship = response.data.guardianRelationship;
        }
        if (response.data.guardianDocumentType) {
          fieldsToSet.guardianDocumentType = response.data.guardianDocumentType;
        }

        form.setFieldsValue(fieldsToSet);
        
        showSuccess('Datos encontrados en RENIEC y completados automáticamente');
      } else {
        showError(response.error || 'No se encontraron datos en RENIEC');
      }
    } catch (error) {
      showError('Error al consultar RENIEC');
    } finally {
      setSearchingReniec(false);
    }
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

      let response;
      if (isEdit) {
        response = await studentService.updateStudent(id, studentData);
      } else {
        response = await studentService.createStudent(studentData);
      }

      if (response.success) {
        showSuccess(response.message || `Estudiante ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
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
      showError(`Error al ${isEdit ? 'actualizar' : 'crear'} el estudiante`);
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
                    {isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/students">Estudiantes</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      {isEdit ? 'Editar' : 'Nuevo'}
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
                    {/* Datos del Estudiante */}
                    <Card title="Datos del Estudiante" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
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
                        <Col xs={24} sm={12} md={8}>
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
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Tipo de Documento"
                            name="documentType"
                            rules={[{ required: true, message: 'Seleccione el tipo de documento' }]}
                          >
                            <Select placeholder="Seleccione">
                              <Option value={DocumentType.DNI}>DNI</Option>
                              <Option value={DocumentType.PASSPORT}>Pasaporte</Option>
                              <Option value={DocumentType.CE}>Carné de Extranjería</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
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
                        {!isEdit && form.getFieldValue('documentType') === 'DNI' && (
                          <Col xs={24} sm={12} md={4}>
                            <Form.Item label=" " colon={false}>
                              <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearchReniec}
                                loading={searchingReniec}
                                block
                              >
                                Buscar RENIEC
                              </Button>
                            </Form.Item>
                          </Col>
                        )}
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
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
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
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                              { type: 'email', message: 'Ingrese un email válido' }
                            ]}
                          >
                            <Input placeholder="Ingrese el email" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Dirección */}
                    <Card title="Dirección" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24}>
                          <Form.Item
                            label="Dirección"
                            name="address"
                            rules={[{ required: true, message: 'La dirección es requerida' }]}
                          >
                            <Input placeholder="Ingrese la dirección completa" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Distrito"
                            name="district"
                            rules={[{ required: true, message: 'El distrito es requerido' }]}
                          >
                            <Input placeholder="Ingrese el distrito" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Provincia"
                            name="province"
                            rules={[{ required: true, message: 'La provincia es requerida' }]}
                          >
                            <Input placeholder="Ingrese la provincia" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Departamento"
                            name="department"
                            rules={[{ required: true, message: 'El departamento es requerido' }]}
                          >
                            <Input placeholder="Ingrese el departamento" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Datos del Apoderado */}
                    <Card title="Datos del Apoderado" className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Nombres del Apoderado"
                            name="guardianName"
                            rules={[{ required: true, message: 'Los nombres del apoderado son requeridos' }]}
                          >
                            <Input placeholder="Ingrese los nombres del apoderado" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Apellidos del Apoderado"
                            name="guardianLastName"
                            rules={[{ required: true, message: 'Los apellidos del apoderado son requeridos' }]}
                          >
                            <Input placeholder="Ingrese los apellidos del apoderado" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Tipo de Documento"
                            name="guardianDocumentType"
                            rules={[{ required: true, message: 'Seleccione el tipo de documento' }]}
                          >
                            <Select placeholder="Seleccione">
                              <Option value={DocumentType.DNI}>DNI</Option>
                              <Option value={DocumentType.PASSPORT}>Pasaporte</Option>
                              <Option value={DocumentType.CE}>Carné de Extranjería</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Número de Documento"
                            name="guardianDocumentNumber"
                            rules={[
                              { required: true, message: 'El número de documento es requerido' },
                              { pattern: /^\d{8}$/, message: 'Debe tener 8 dígitos' }
                            ]}
                          >
                            <Input placeholder="Número de documento" maxLength={8} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Relación"
                            name="guardianRelationship"
                            rules={[{ required: true, message: 'Seleccione la relación' }]}
                          >
                            <Select placeholder="Seleccione">
                              <Option value={GuardianRelationship.FATHER}>Padre</Option>
                              <Option value={GuardianRelationship.MOTHER}>Madre</Option>
                              <Option value={GuardianRelationship.GUARDIAN}>Apoderado</Option>
                              <Option value={GuardianRelationship.GRANDPARENT}>Abuelo/a</Option>
                              <Option value={GuardianRelationship.OTHER}>Otro</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Teléfono del Apoderado"
                            name="guardianPhone"
                            rules={[
                              { pattern: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                            ]}
                          >
                            <Input placeholder="Teléfono del apoderado" maxLength={9} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Email del Apoderado"
                            name="guardianEmail"
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
                        {isEdit ? 'Actualizar' : 'Guardar'} Estudiante
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