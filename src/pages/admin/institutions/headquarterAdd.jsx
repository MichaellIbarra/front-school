/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Select, Card, Row, Col } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import headquarterAdminService from "../../../services/institutions/headquarterAdminService";
import institutionAdminService from "../../../services/institutions/institutionAdminService";
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
      const newHeadquarter = headquarterAdminService.createNewHeadquarter(institutionId);
      setHeadquarterData(newHeadquarter);
      populateForm(newHeadquarter);
    }
  }, [id, institutionId, location.state]);

  /**
   * Carga la información de la institución
   */
  const loadInstitution = async () => {
    try {
      const response = await institutionAdminService.getInstitutionById(institutionId);
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
      const response = await headquarterAdminService.getHeadquarterById(headquarterId);
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
    // Parsear códigos modulares para mostrarlos como texto separado por comas (sin espacios)
    let modularCodesText = '';
    if (Array.isArray(headquarter.modularCode)) {
      modularCodesText = headquarter.modularCode.join(',');
    }

    form.setFieldsValue({
      name: headquarter.name,
      modularCodes: modularCodesText,
      address: headquarter.address,
      phone: headquarter.phone,
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Procesar códigos modulares: convertir texto separado por comas a array
      const modularCodesArray = values.modularCodes 
        ? values.modularCodes.split(',').filter(code => code.length > 0)
        : [];

      // Validar que haya al menos un código modular
      if (modularCodesArray.length === 0) {
        showError('Error de validación', 'Debe ingresar al menos un código modular');
        setLoading(false);
        return;
      }

      // Validar que cada código modular tenga entre 5 y 10 caracteres
      for (const code of modularCodesArray) {
        if (code.length < 5 || code.length > 10) {
          showError('Error de validación', `El código modular "${code}" debe tener entre 5 y 10 caracteres`);
          setLoading(false);
          return;
        }
      }

      // Validar que el institutionId sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!institutionId || !uuidRegex.test(institutionId)) {
        showError('Error de validación', 'ID de institución inválido');
        setLoading(false);
        return;
      }

      // Función para limpiar texto y remover caracteres problemáticos
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/[\t\n\r\f\v]/g, ' ')  // Remover espacios problemáticos
          .replace(/\s+/g, ' ')            // Múltiples espacios a uno
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remover caracteres no imprimibles
          .trim();
      };

      // Limpiar y validar datos antes del envío
      const headquarterPayload = {
        institutionId: String(institutionId || '').trim(),
        name: cleanText(values.name),
        modularCode: modularCodesArray, // Enviar como array
        address: cleanText(values.address),
        phone: String(values.phone || '').trim().replace(/\D/g, ''),
        status: 'A' // Siempre activo por defecto
      };

      // Validación adicional antes de enviar
      if (!headquarterPayload.institutionId || !headquarterPayload.name) {
        showError('Error de validación', 'Faltan datos obligatorios');
        setLoading(false);
        return;
      }

      // Validar longitudes mínimas y máximas
      if (headquarterPayload.name.length < 3 || headquarterPayload.name.length > 100) {
        showError('Error de validación', 'El nombre de la sede debe tener entre 3 y 100 caracteres');
        setLoading(false);
        return;
      }

      console.log('📋 Datos a enviar:', headquarterPayload);

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
        console.log('🔄 Actualizando sede con ID:', headquarterData.id);
        response = await headquarterAdminService.updateHeadquarter(headquarterData.id, headquarterPayload);
      } else {
        console.log('✨ Creando nueva sede...');
        response = await headquarterAdminService.createHeadquarter(headquarterPayload);
      }

      console.log('📡 Respuesta del servidor:', response);

      if (response.success) {
        showSuccess('Operación exitosa', response.message);
        navigate(`/admin/institution/${institutionId}/headquarters`);
      } else {
        console.error('❌ Error del servidor:', response.error);
        showError('Error al guardar', response.error || "Los datos deben ser válidos y únicos");
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      showError('Error al guardar la sede', error.message || 'No se pudo completar la operación');
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
                      <Link to="/dashboard">Dashboard</Link>
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
                  >
                    {/* Información Básica */}
                    <Card title="Información Básica de la Sede" className="mb-4">
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            label="Nombre de la Sede"
                            name="name"
                            rules={[
                              { required: true, message: 'El nombre de la sede es obligatorio' },
                              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                              { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                            ]}
                          >
                            <Input placeholder="Ingresa el nombre de la sede" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            label="Códigos Modulares"
                            name="modularCodes"
                            rules={[
                              { required: true, message: 'Debe ingresar al menos un código modular' },
                              {
                                validator: (_, value) => {
                                  if (!value || value.trim() === '') {
                                    return Promise.reject(new Error('Debe ingresar al menos un código modular'));
                                  }
                                  
                                  // Validar que no tenga espacios (solo números y comas)
                                  if (!/^[0-9,]+$/.test(value)) {
                                    return Promise.reject(new Error('Solo se permiten números y comas (sin espacios)'));
                                  }
                                  
                                  // Validar que no empiece o termine con coma
                                  if (value.startsWith(',') || value.endsWith(',')) {
                                    return Promise.reject(new Error('Los códigos no pueden empezar o terminar con coma'));
                                  }
                                  
                                  // Validar que no tenga comas consecutivas
                                  if (value.includes(',,')) {
                                    return Promise.reject(new Error('No se permiten comas consecutivas'));
                                  }
                                  
                                  // Separar códigos y validar cada uno
                                  const codes = value.split(',');
                                  
                                  for (let code of codes) {
                                    if (code.length < 5 || code.length > 10) {
                                      return Promise.reject(new Error(`El código "${code}" debe tener entre 5 y 10 dígitos`));
                                    }
                                  }
                                  
                                  return Promise.resolve();
                                }
                              }
                            ]}
                          >
                            <Input 
                              placeholder="Ingresa los códigos modulares separados por comas (ej: 12345,67890,11111)"
                              maxLength={200}
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
                            <TextArea rows={2} placeholder="Dirección completa de la sede" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Información de Contacto */}
                    <Card title="Información de Contacto" className="mb-4">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Teléfono"
                            name="phone"
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