/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Switch, Select, InputNumber, TimePicker, Card, Upload, Row, Col } from "antd";
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import institutionService from "../../../services/institutions/institutionService";
import { Institution, InstitutionStatus, LogoPosition, GradeScale, validateInstitution } from "../../../types/institutions";

const { Option } = Select;
const { TextArea } = Input;

const InstitutionAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [institutionData, setInstitutionData] = useState(Institution);

  // Verificar si es modo edición
  useEffect(() => {
    if (id && id !== 'add') {
      setIsEdit(true);
      loadInstitution(id);
    } else if (location.state?.institution) {
      setIsEdit(true);
      const institution = location.state.institution;
      setInstitutionData(institution);
      populateForm(institution);
    } else {
      // Modo creación
      setIsEdit(false);
      const newInstitution = institutionService.createNewInstitution();
      setInstitutionData(newInstitution);
      populateForm(newInstitution);
    }
  }, [id, location.state]);

  /**
   * Carga una institución específica para edición
   */
  const loadInstitution = async (institutionId) => {
    setLoading(true);
    try {
      const response = await institutionService.getInstitutionById(institutionId);
      if (response.success && response.data) {
        setInstitutionData(response.data);
        populateForm(response.data);
      } else {
        showError('Institución no encontrada');
        navigate('/admin/institution');
      }
    } catch (error) {
      showError('Error al cargar la institución');
      navigate('/admin/institution');
    }
    setLoading(false);
  };

  /**
   * Popula el formulario con los datos de la institución
   */
  const populateForm = (institution) => {
    form.setFieldsValue({
      name: institution.name,
      codeName: institution.codeName,
      modularCode: institution.modularCode,
      address: institution.address,
      contactEmail: institution.contactEmail,
      contactPhone: institution.contactPhone,
      status: institution.status === 'A',
      'uiSettings.color': institution.uiSettings?.color || '#3498DB',
      'uiSettings.logoPosition': institution.uiSettings?.logoPosition || 'LEFT',
      'uiSettings.showStudentPhotos': institution.uiSettings?.showStudentPhotos || false,
      'evaluationSystem.gradeScale': institution.evaluationSystem?.gradeScale || 'NUMERICAL_0_100',
      'evaluationSystem.minimumPassingGrade': institution.evaluationSystem?.minimumPassingGrade || 60.0,
      'evaluationSystem.showDecimals': institution.evaluationSystem?.showDecimals || false,
      'scheduleSettings.morningStartTime': institution.scheduleSettings?.morningStartTime ? 
        moment(institution.scheduleSettings.morningStartTime, 'HH:mm:ss') : moment('07:30:00', 'HH:mm:ss'),
      'scheduleSettings.morningEndTime': institution.scheduleSettings?.morningEndTime ? 
        moment(institution.scheduleSettings.morningEndTime, 'HH:mm:ss') : moment('11:30:00', 'HH:mm:ss'),
      'scheduleSettings.afternoonStartTime': institution.scheduleSettings?.afternoonStartTime ? 
        moment(institution.scheduleSettings.afternoonStartTime, 'HH:mm:ss') : moment('13:00:00', 'HH:mm:ss'),
      'scheduleSettings.afternoonEndTime': institution.scheduleSettings?.afternoonEndTime ? 
        moment(institution.scheduleSettings.afternoonEndTime, 'HH:mm:ss') : moment('17:00:00', 'HH:mm:ss'),
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar datos para envío
      const institutionPayload = {
        ...institutionData,
        name: values.name,
        codeName: values.codeName.toUpperCase(),
        modularCode: values.modularCode,
        address: values.address,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        status: values.status ? 'A' : 'I',
        uiSettings: {
          color: values['uiSettings.color'],
          logoPosition: values['uiSettings.logoPosition'],
          showStudentPhotos: values['uiSettings.showStudentPhotos']
        },
        evaluationSystem: {
          gradeScale: values['evaluationSystem.gradeScale'],
          minimumPassingGrade: values['evaluationSystem.minimumPassingGrade'],
          showDecimals: values['evaluationSystem.showDecimals']
        },
        scheduleSettings: {
          morningStartTime: values['scheduleSettings.morningStartTime'].format('HH:mm:ss'),
          morningEndTime: values['scheduleSettings.morningEndTime'].format('HH:mm:ss'),
          afternoonStartTime: values['scheduleSettings.afternoonStartTime'].format('HH:mm:ss'),
          afternoonEndTime: values['scheduleSettings.afternoonEndTime'].format('HH:mm:ss')
        }
      };

      // Validar antes de enviar
      const validation = validateInstitution(institutionPayload);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        showError('Errores de validación', errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit) {
        response = await institutionService.updateInstitution(institutionData.id, institutionPayload);
      } else {
        response = await institutionService.createInstitution(institutionPayload);
      }

      if (response.success) {
        showSuccess(response.message);
        navigate('/admin/institution');
      } else {
        showError("Los Datos deben ser validos y únicos");
      }
    } catch (error) {
      showError('Error al guardar la institución');
    }
    
    setLoading(false);
  };

  /**
   * Cancela la operación y regresa al listado
   */
  const handleCancel = () => {
    navigate('/admin/institution');
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
                    {isEdit ? 'Editar Institución' : 'Nueva Institución'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/admin/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/admin/institution">Instituciones</Link>
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
                    initialValues={{
                      status: true,
                      'uiSettings.color': '#3498DB',
                      'uiSettings.logoPosition': 'LEFT',
                      'uiSettings.showStudentPhotos': false,
                      'evaluationSystem.gradeScale': 'NUMERICAL_0_100',
                      'evaluationSystem.minimumPassingGrade': 60.0,
                      'evaluationSystem.showDecimals': false
                    }}
                  >
                    {/* Información Básica */}
                    <Card title="Información Básica" className="mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Nombre de la Institución"
                            name="name"
                            rules={[
                              { required: true, message: 'El nombre es obligatorio' },
                              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                              { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                            ]}
                          >
                            <Input placeholder="Ingresa el nombre de la institución" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Código de la Institución"
                            name="codeName"
                            rules={[
                              { required: true, message: 'El código es obligatorio' },
                              { min: 2, message: 'El código debe tener al menos 2 caracteres' },
                              { max: 10, message: 'El código no puede exceder 10 caracteres' },
                              { pattern: /^[A-Z0-9]+$/, message: 'Solo letras mayúsculas y números' }
                            ]}
                          >
                            <Input 
                              placeholder="Ej: INST001" 
                              style={{ textTransform: 'uppercase' }}
                              onChange={(e) => {
                                e.target.value = e.target.value.toUpperCase();
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Código Modular"
                            name="modularCode"
                            rules={[
                              { required: true, message: 'El código modular es obligatorio' },
                              { min: 5, message: 'El código modular debe tener al menos 5 caracteres' },
                              { max: 10, message: 'El código modular no puede exceder 10 caracteres' }
                            ]}
                          >
                            <Input placeholder="Código modular MINEDU" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Estado"
                            name="status"
                            valuePropName="checked"
                          >
                            <Switch
                              checkedChildren="Activo"
                              unCheckedChildren="Inactivo"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            label="Dirección"
                            name="address"
                            rules={[
                              { required: true, message: 'La dirección es obligatoria' }
                            ]}
                          >
                            <TextArea rows={2} placeholder="Dirección completa de la institución" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Email de Contacto"
                            name="contactEmail"
                            rules={[
                              { required: true, message: 'El email es obligatorio' },
                              { type: 'email', message: 'Formato de email inválido' }
                            ]}
                          >
                            <Input placeholder="contacto@institucion.edu" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Teléfono de Contacto"
                            name="contactPhone"
                            rules={[
                              { required: true, message: 'El teléfono es obligatorio' },
                              { pattern: /^[0-9]{9,12}$/, message: 'Formato de teléfono inválido (9-12 dígitos)' }
                            ]}
                          >
                            <Input placeholder="987654321" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Configuración de UI */}
                    <Card title="Configuración de Interfaz" className="mb-4">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            label="Color Principal"
                            name="uiSettings.color"
                          >
                            <Input type="color" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Posición del Logo"
                            name="uiSettings.logoPosition"
                          >
                            <Select>
                              <Option value="LEFT">Izquierda</Option>
                              <Option value="CENTER">Centro</Option>
                              <Option value="RIGHT">Derecha</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Mostrar Fotos de Estudiantes"
                            name="uiSettings.showStudentPhotos"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Sistema de Evaluación */}
                    <Card title="Sistema de Evaluación" className="mb-4">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            label="Escala de Calificación"
                            name="evaluationSystem.gradeScale"
                          >
                            <Select>
                              <Option value="NUMERICAL_0_100">Numérica 0-100</Option>
                              <Option value="NUMERICAL_0_20">Numérica 0-20</Option>
                              <Option value="LETTER_GRADE">Letras (A, B, C, D, F)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Nota Mínima Aprobatoria"
                            name="evaluationSystem.minimumPassingGrade"
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="60.0"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Mostrar Decimales"
                            name="evaluationSystem.showDecimals"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Configuración de Horarios */}
                    <Card title="Configuración de Horarios" className="mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <h5>Turno Mañana</h5>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item
                                label="Hora Inicio"
                                name="scheduleSettings.morningStartTime"
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Hora Fin"
                                name="scheduleSettings.morningEndTime"
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                        <Col span={12}>
                          <h5>Turno Tarde</h5>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item
                                label="Hora Inicio"
                                name="scheduleSettings.afternoonStartTime"
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="Hora Fin"
                                name="scheduleSettings.afternoonEndTime"
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Card>

                    {/* Botones de Acción */}
                    <div className="d-flex justify-content-end">
                      <Button
                        onClick={handleCancel}
                        className="me-2"
                      >
                        <ArrowLeftOutlined /> Cancelar
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        {isEdit ? 'Actualizar' : 'Crear'} Institución
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
      
      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default InstitutionAdd;