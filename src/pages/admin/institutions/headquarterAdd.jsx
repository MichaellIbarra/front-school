/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Switch, Select, Card, Row, Col } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import headquarterService from "../../../services/institutions/headquarterService";
import institutionService from "../../../services/institutions/institutionService";
import { Headquarter, validateHeadquarter } from "../../../types/institutions";

const { Option } = Select;
const { TextArea } = Input;

const HeadquarterAdd = () => {
  const navigate = useNavigate();
  const { institutionId, id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [headquarterData, setHeadquarterData] = useState(Headquarter);
  const [institution, setInstitution] = useState(null);

  // Verificar si es modo edición
  useEffect(() => {
    loadInstitution();
    
    if (id && id !== 'add') {
      setIsEdit(true);
      loadHeadquarter(id);
    } else if (location.state?.headquarter) {
      setIsEdit(true);
      const hq = location.state.headquarter;
      setHeadquarterData(hq);
      populateForm(hq);
    } else {
      // Modo creación
      setIsEdit(false);
      const newHeadquarter = headquarterService.createNewHeadquarter(institutionId);
      setHeadquarterData(newHeadquarter);
      populateForm(newHeadquarter);
    }
  }, [id, institutionId, location.state]);

  /**
   * Carga la información de la institución
   */
  const loadInstitution = async () => {
    try {
      const response = await institutionService.getInstitutionById(institutionId);
      if (response.success && response.data) {
        setInstitution(response.data);
      } else {
        showError('Error', 'No se pudo cargar la información de la institución');
        navigate('/admin/institution');
      }
    } catch (error) {
      showError('Error', 'Error al cargar la institución');
      navigate('/admin/institution');
    }
  };

  /**
   * Carga una sede específica para edición
   */
  const loadHeadquarter = async (headquarterId) => {
    setLoading(true);
    try {
      const response = await headquarterService.getHeadquarterById(headquarterId);
      if (response.success && response.data) {
        setHeadquarterData(response.data);
        populateForm(response.data);
      } else {
        showError('Sede no encontrada', response.error);
        navigate(`/admin/institution/${institutionId}/headquarters`);
      }
    } catch (error) {
      showError('Error al cargar la sede', 'No se pudo cargar la información de la sede');
      navigate(`/admin/institution/${institutionId}/headquarters`);
    }
    setLoading(false);
  };

  /**
   * Popula el formulario con los datos de la sede
   */
  const populateForm = (headquarter) => {
    form.setFieldsValue({
      headquartersName: headquarter.headquartersName,
      headquartersCode: headquarter.headquartersCode,
      address: headquarter.address,
      contactPerson: headquarter.contactPerson,
      contactEmail: headquarter.contactEmail,
      contactPhone: headquarter.contactPhone,
      status: headquarter.status === 'A',
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar datos para envío
      const headquarterPayload = {
        ...headquarterData,
        institutionId: institutionId,
        headquartersName: values.headquartersName,
        headquartersCode: values.headquartersCode.toUpperCase(),
        address: values.address,
        contactPerson: values.contactPerson,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        status: values.status ? 'A' : 'I'
      };

      // Validar antes de enviar
      const validation = validateHeadquarter(headquarterPayload);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        showError('Errores de validación', errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit) {
        response = await headquarterService.updateHeadquarter(headquarterData.id, headquarterPayload);
      } else {
        response = await headquarterService.createHeadquarter(headquarterPayload);
      }

      if (response.success) {
        showSuccess('Operación exitosa', response.message);
        navigate(`/admin/institution/${institutionId}/headquarters`);
      } else {
        showError("Los Datos deben ser validos y únicos");
      }
    } catch (error) {
      showError('Error al guardar la sede', 'No se pudo completar la operación');
    }
    
    setLoading(false);
  };

  /**
   * Cancela la operación y regresa al listado
   */
  const handleCancel = () => {
    navigate(`/admin/institution/${institutionId}/headquarters`);
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
                    {isEdit ? 'Editar Sede' : 'Nueva Sede'}
                    {institution && ` - ${institution.name}`}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/admin/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/admin/institution">Instituciones</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to={`/admin/institution/${institutionId}/headquarters`}>Sedes</Link>
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
                      status: true
                    }}
                  >
                    {/* Información Básica */}
                    <Card title="Información Básica de la Sede" className="mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Nombre de la Sede"
                            name="headquartersName"
                            rules={[
                              { required: true, message: 'El nombre de la sede es obligatorio' },
                              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                              { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                            ]}
                          >
                            <Input placeholder="Ingresa el nombre de la sede" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Código de la Sede"
                            name="headquartersCode"
                            rules={[
                              { required: true, message: 'El código de la sede es obligatorio' },
                              { min: 2, message: 'El código debe tener al menos 2 caracteres' },
                              { max: 15, message: 'El código no puede exceder 15 caracteres' }
                            ]}
                          >
                            <Input 
                              placeholder="Ej: SEDE001" 
                              style={{ textTransform: 'uppercase' }}
                              onChange={(e) => {
                                e.target.value = e.target.value.toUpperCase();
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={18}>
                          <Form.Item
                            label="Dirección"
                            name="address"
                            rules={[
                              { required: true, message: 'La dirección es obligatoria' }
                            ]}
                          >
                            <TextArea rows={2} placeholder="Dirección completa de la sede" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
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
                    </Card>

                    {/* Información de Contacto */}
                    <Card title="Información de Contacto" className="mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Persona de Contacto"
                            name="contactPerson"
                            rules={[
                              { required: true, message: 'La persona de contacto es obligatoria' }
                            ]}
                          >
                            <Input placeholder="Nombre del responsable de la sede" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Email de Contacto"
                            name="contactEmail"
                            rules={[
                              { required: true, message: 'El email es obligatorio' },
                              { type: 'email', message: 'Formato de email inválido' }
                            ]}
                          >
                            <Input placeholder="contacto@sede.edu" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
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
                        {isEdit ? 'Actualizar' : 'Crear'} Sede
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

export default HeadquarterAdd;