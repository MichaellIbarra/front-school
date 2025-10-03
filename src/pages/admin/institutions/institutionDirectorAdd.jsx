/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Button, Select, Card, Row, Col, Breadcrumb } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import institutionService from "../../../services/institutions/institutionService";
import { CreateDirectorModel, validateDirector, DirectorDocumentType, DirectorDocumentTypeLabels } from "../../../types/institutions";

const { Option } = Select;

const InstitutionDirectorAdd = () => {
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [directorData, setDirectorData] = useState({
    ...CreateDirectorModel,
    institutionId: institutionId
  });

  // Cargar información de la institución al montar el componente
  useEffect(() => {
    if (institutionId) {
      loadInstitutionInfo();
    }
  }, [institutionId]);

  /**
   * Carga información básica de la institución
   */
  const loadInstitutionInfo = async () => {
    try {
      const response = await institutionService.getInstitutionById(institutionId);
      if (response.success) {
        setInstitutionInfo(response.data);
      } else {
        showError('Error', 'No se pudo cargar la información de la institución');
      }
    } catch (error) {
      console.error('Error al cargar información de la institución:', error);
      showError('Error', 'Error al cargar la información de la institución');
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔍 Institution ID from URL:', institutionId);
      console.log('📝 Form values received:', values);

      // Preparar los datos con valores por defecto antes de validar
      const directorData = {
        ...values,
        roles: values.roles || ['director'],
        status: values.status || 'A',
        institutionId: institutionId
      };

      console.log('✅ Director data prepared:', directorData);

      // Validar los datos del director
      const validation = validateDirector(directorData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\\n');
        showError('Errores de validación', errorMessages);
        setLoading(false);
        return;
      }

      // Preparar los datos para enviar
      const directorPayload = {
        username: directorData.username.trim(),
        email: directorData.email.trim(),
        firstname: directorData.firstname.trim(),
        lastname: directorData.lastname.trim(),
        roles: directorData.roles,
        documentType: directorData.documentType,
        documentNumber: directorData.documentNumber.trim(),
        phone: directorData.phone ? directorData.phone.trim() : '',
        status: directorData.status,
        institutionId: directorData.institutionId
      };

      console.log('🚀 Final payload to send:', directorPayload);

      // Llamar al servicio para asignar el director
      const response = await institutionService.assignDirector(institutionId, directorPayload);
      
      if (response.success) {
        showSuccess(
          'Director Asignado',
          response.message || 'El director ha sido asignado exitosamente a la institución',
          {
            onConfirm: () => {
              navigate(`/admin/institution/${institutionId}/directors`);
            }
          }
        );
        
      } else {
        showError('Error al asignar director', 'Debe colocar datos validos y únicos');
      }
    } catch (error) {
      console.error('Error al asignar director:', error);
      showError('Error', 'Error inesperado al asignar el director');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela la operación y regresa al listado de directores
   */
  const handleCancel = () => {
    navigate(`/admin/institution/${institutionId}/directors`);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <Breadcrumb className="breadcrumb">
                    <Breadcrumb.Item>
                      <a href="/admin/institution">Instituciones</a>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                      {institutionInfo?.name || 'Institución'}
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                      <a href={`/admin/institution/${institutionId}/directors`}>Directores</a>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Asignar Director</Breadcrumb.Item>
                  </Breadcrumb>
                  <h3 className="page-title">
                    Asignar Director a {institutionInfo?.name || 'la Institución'}
                  </h3>
                  <p className="mb-0">
                    Crea y asigna un nuevo director a esta institución
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="row">
            <div className="col-md-12">
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    documentType: 'DNI'
                  }}
                >
                  <Row gutter={[16, 16]}>
                    {/* Información Personal */}
                    <Col xs={24}>
                      <h4 className="mb-3">Información Personal</h4>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Nombre de Usuario"
                        name="username"
                        rules={[
                          { required: true, message: 'El nombre de usuario es obligatorio' },
                          { min: 3, message: 'Mínimo 3 caracteres' },
                          { max: 50, message: 'Máximo 50 caracteres' },
                          { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Solo letras, números, guiones y guiones bajos' }
                        ]}
                      >
                        <Input placeholder="Ingrese el nombre de usuario" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Correo Electrónico"
                        name="email"
                        rules={[
                          { required: true, message: 'El correo es obligatorio' },
                          { type: 'email', message: 'Formato de correo inválido' }
                        ]}
                      >
                        <Input placeholder="correo@ejemplo.com" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Teléfono"
                        name="phone"
                        rules={[
                          { pattern: /^[0-9+\-\s]{7,15}$/, message: 'Formato de teléfono inválido (7-15 dígitos)' }
                        ]}
                      >
                        <Input placeholder="+51 999 999 999" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Nombre"
                        name="firstname"
                        rules={[
                          { required: true, message: 'El nombre es obligatorio' },
                          { max: 100, message: 'Máximo 100 caracteres' }
                        ]}
                      >
                        <Input placeholder="Ingrese el nombre" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Apellido"
                        name="lastname"
                        rules={[
                          { required: true, message: 'El apellido es obligatorio' },
                          { max: 100, message: 'Máximo 100 caracteres' }
                        ]}
                      >
                        <Input placeholder="Ingrese el apellido" />
                      </Form.Item>
                    </Col>

                    {/* Información de Documento */}
                    <Col xs={24}>
                      <h4 className="mb-3 mt-3">Información de Documento</h4>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Tipo de Documento"
                        name="documentType"
                        rules={[{ required: true, message: 'Seleccione el tipo de documento' }]}
                      >
                        <Select placeholder="Seleccione el tipo">
                          {Object.entries(DirectorDocumentTypeLabels).map(([key, label]) => (
                            <Option key={key} value={key}>{label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        label="Número de Documento"
                        name="documentNumber"
                        rules={[
                          { required: true, message: 'El número de documento es obligatorio' },
                          { pattern: /^[0-9]{8,20}$/, message: 'El documento debe tener entre 8 y 20 dígitos' }
                        ]}
                      >
                        <Input placeholder="Ingrese el número de documento" />
                      </Form.Item>
                    </Col>

                    {/* Información Adicional */}
                    <Col xs={24}>
                      <div className="alert alert-info mt-3">
                        <h6><strong>Información importante:</strong></h6>
                        <ul className="mb-0">
                          <li>Se creará un nuevo usuario con rol de Director</li>
                          <li>Se enviará un correo con las credenciales temporales</li>
                          <li>El director deberá cambiar su contraseña en el primer acceso</li>
                          <li>El director tendrá acceso completo a la gestión de esta institución</li>
                        </ul>
                      </div>
                    </Col>

                    {/* Botones de acción */}
                    <Col xs={24} className="mt-4">
                      <div className="text-end">
                        <Button 
                          type="default" 
                          onClick={handleCancel}
                          className="me-2"
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
                          {loading ? 'Asignando...' : 'Asignar Director'}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar id="menu-item12" id1="menu-items12" activeClassName="institutions" />
      <Header />
      
      {/* Modal de alerta */}
      <AlertModal
        alert={alertState}
        onConfirm={alertConfirm}
        onCancel={alertCancel}
      />
    </>
  );
};

export default InstitutionDirectorAdd;