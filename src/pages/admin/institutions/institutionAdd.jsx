/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Switch, Select, InputNumber, TimePicker, Card, Upload, Row, Col, AutoComplete, Spin } from "antd";
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import moment from "moment";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import institutionAdminService from "../../../services/institutions/institutionAdminService";
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
  
  // Estados para búsqueda MINEDU
  const [searchLoading, setSearchLoading] = useState(false);
  const [minEduOptions, setMinEduOptions] = useState([]);
  
  // Estados para upload de logo
  const [logoUploading, setLogoUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

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
      const newInstitution = institutionAdminService.createNewInstitution();
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
      const response = await institutionAdminService.getInstitutionById(institutionId);
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
   * Busca instituciones en MINEDU por código
   */
  const handleMinEduSearch = async (searchValue) => {
    if (!searchValue || searchValue.length < 6) {
      setMinEduOptions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await institutionAdminService.searchMinEduInstitutions(searchValue);
      
      console.log('🔍 Respuesta de MINEDU:', response);
      
      // La estructura de la respuesta es: response.data.data.items
      if (response.success && response.data && response.data.data && response.data.data.items && response.data.data.items.length > 0) {
        const institutions = response.data.data.items;
        const options = institutions.map(institution => ({
          value: institution.codinst,
          label: (
            <div style={{ lineHeight: '1.4' }}>
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                {institution.cenEdu || 'Sin nombre'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Código: {institution.codinst} • {institution.cenPob} • {institution.distrito?.nombreDistrito}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {institution.dirCen} • Nivel: {institution.nivelModalidad?.valor}
              </div>
            </div>
          ),
          searchText: `${institution.cenEdu} ${institution.cenPob} ${institution.codinst}`, // Para facilitar la búsqueda
          data: institution
        }));
        
        console.log('📋 Opciones procesadas:', options);
        setMinEduOptions(options);
      } else {
        console.log('❌ No se encontraron instituciones o respuesta inválida');
        setMinEduOptions([]);
      }
    } catch (error) {
      console.error('Error al buscar en MINEDU:', error);
      setMinEduOptions([]);
    }
    setSearchLoading(false);
  };

  /**
   * Maneja la selección de una institución de MINEDU
   */
  const handleMinEduSelect = (value, option) => {
    const institutionData = option.data;
    
    console.log('✅ Institución seleccionada de MINEDU:', institutionData);

    // Autocompletar campos del formulario con datos de MINEDU
    const formData = {
      name: institutionData.cenEdu || '',
      codeInstitution: institutionData.codinst || '',
      address: `${institutionData.dirCen || ''}, ${institutionData.cenPob || ''}`.replace(', ,', ',').trim(),
      contactPhone: institutionData.telefono || '',
      contactEmail: institutionData.email || '', // Si está disponible
    };

    // Limpiar campos vacíos
    Object.keys(formData).forEach(key => {
      if (!formData[key] || formData[key].trim() === '' || formData[key] === ', ') {
        delete formData[key];
      }
    });

    form.setFieldsValue(formData);

    // Limpiar las opciones después de seleccionar
    setMinEduOptions([]);

    showSuccess(
      '✅ Datos encontrados en MINEDU', 
      `Se encontraron datos para "${institutionData.cenEdu}". Los campos disponibles han sido autocompletados.`
    );
  };

  /**
   * Popula el formulario con los datos de la institución
   */
  const populateForm = (institution) => {
    form.setFieldsValue({
      name: institution.name,
      codeInstitution: institution.codeInstitution,
      address: institution.address,
      contactEmail: institution.contactEmail,
      contactPhone: institution.contactPhone,
      'uiSettings.color': institution.uiSettings?.color || '#FF0000',
      'uiSettings.logoPosition': institution.uiSettings?.logoPosition || 'LEFT',
      'uiSettings.showStudentPhotos': institution.uiSettings?.showStudentPhotos || false,
      'evaluationSystem.gradeScale': institution.evaluationSystem?.gradeScale || 'NUMERICAL_0_20',
      'evaluationSystem.minimumPassingGrade': institution.evaluationSystem?.minimumPassingGrade || 10.5,
      'evaluationSystem.showDecimals': institution.evaluationSystem?.showDecimals || true,
      'scheduleSettings.morningStartTime': institution.scheduleSettings?.morningStartTime ? 
        moment(institution.scheduleSettings.morningStartTime, 'HH:mm:ss') : moment('08:00:00', 'HH:mm:ss'),
      'scheduleSettings.morningEndTime': institution.scheduleSettings?.morningEndTime ? 
        moment(institution.scheduleSettings.morningEndTime, 'HH:mm:ss') : moment('12:00:00', 'HH:mm:ss'),
      'scheduleSettings.afternoonStartTime': institution.scheduleSettings?.afternoonStartTime ? 
        moment(institution.scheduleSettings.afternoonStartTime, 'HH:mm:ss') : moment('14:00:00', 'HH:mm:ss'),
      'scheduleSettings.afternoonEndTime': institution.scheduleSettings?.afternoonEndTime ? 
        moment(institution.scheduleSettings.afternoonEndTime, 'HH:mm:ss') : moment('18:00:00', 'HH:mm:ss'),
      'scheduleSettings.nightStartTime': institution.scheduleSettings?.nightStartTime ? 
        moment(institution.scheduleSettings.nightStartTime, 'HH:mm:ss') : moment('19:00:00', 'HH:mm:ss'),
      'scheduleSettings.nightEndTime': institution.scheduleSettings?.nightEndTime ? 
        moment(institution.scheduleSettings.nightEndTime, 'HH:mm:ss') : moment('22:00:00', 'HH:mm:ss'),
    });

    // Inicializar fileList si hay logo existente
    if (institution.logo) {
      setFileList([{
        uid: '-1',
        name: 'Logo existente',
        status: 'done',
        url: institution.logo
      }]);
    } else {
      setFileList([]);
    }
  };

  /**
   * Valida el archivo antes de subir
   */
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      showError('Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)');
      return false;
    }
    
    const maxSizeInMB = 10;
    const fileSizeInMB = file.size / 1024 / 1024;
    
    if (fileSizeInMB > maxSizeInMB) {
      showError(`La imagen debe ser menor a ${maxSizeInMB}MB. Tamaño actual: ${fileSizeInMB.toFixed(2)}MB`);
      return false;
    }
    
    // Mostrar advertencia si la imagen es muy grande (mayor a 5MB)
    if (fileSizeInMB > 5) {
      showWarning(`Imagen grande detectada (${fileSizeInMB.toFixed(2)}MB). Se recomienda usar imágenes menores a 5MB para mejor rendimiento.`);
    }
    
    return true;
  };

  /**
   * Maneja la subida del logo
   */
  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    if (!institutionData.id) {
      showError('Debe guardar la institución antes de subir el logo');
      onError(new Error('No institution ID available'));
      return;
    }

    setLogoUploading(true);
    try {
      const response = await institutionAdminService.uploadLogo(institutionData.id, file);
      
      if (response.success) {
        showSuccess(response.message || 'Logo subido correctamente');
        
        // Actualizar los datos de la institución con la nueva URL del logo
        if (response.data && response.data.logo) {
          setInstitutionData(prev => ({
            ...prev,
            logo: response.data.logo
          }));
          
          // Actualizar la lista de archivos con el estado done
          setFileList([{
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: response.data.logo
          }]);
        }
        
        onSuccess(response);
      } else {
        showError(response.error || 'Error al subir el logo');
        onError(new Error(response.error || 'Server error'));
      }
    } catch (error) {
      showError('Error al subir el logo');
      onError(error);
    } finally {
      setLogoUploading(false);
    }
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
        codeInstitution: String(values.codeInstitution).trim(),
        address: values.address,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        status: isEdit ? institutionData.status : 'A', // Mantener estado actual en edición, 'A' por defecto en creación
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
          afternoonEndTime: values['scheduleSettings.afternoonEndTime'].format('HH:mm:ss'),
          nightStartTime: values['scheduleSettings.nightStartTime']?.format('HH:mm:ss'),
          nightEndTime: values['scheduleSettings.nightEndTime']?.format('HH:mm:ss')
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
        response = await institutionAdminService.updateInstitution(institutionData.id, institutionPayload);
      } else {
        response = await institutionAdminService.createInstitution(institutionPayload);
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
                      <Link to="/dashboard">Dashboard</Link>
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
                            label={
                              <span>
                                Código de la Institución
                                {!isEdit && (
                                  <span style={{ color: '#52c41a', fontSize: '12px', marginLeft: '8px' }}>
                                    (Buscar en MINEDU con código)
                                  </span>
                                )}
                              </span>
                            }
                            name="codeInstitution"
                            rules={[
                              { required: true, message: 'El código es obligatorio' },
                              { min: 6, message: 'El código debe tener al menos 6 dígitos' },
                              { max: 12, message: 'El código no puede exceder 12 dígitos' },
                              { pattern: /^\d+$/, message: 'Solo números permitidos' }
                            ]}
                          >
                            {!isEdit ? (
                              <AutoComplete
                                style={{ width: '100%' }}
                                placeholder="Ingresa código MINEDU (ej: 25024745) para autocompletar"
                                onSearch={handleMinEduSearch}
                                onSelect={handleMinEduSelect}
                                options={minEduOptions}
                                notFoundContent={searchLoading ? <Spin size="small" /> : 'No encontrado'}
                                suffixIcon={<SearchOutlined style={{ color: '#52c41a' }} />}
                              />
                            ) : (
                              <Input 
                                placeholder="Ej: 001234567890" 
                                maxLength={12}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  e.target.value = value;
                                }}
                              />
                            )}
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
                      
                      {isEdit && institutionData.id && (
                        <Row gutter={16}>
                          <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                                Logo de la Institución
                              </label>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                                Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 10MB. Recomendado: menos de 5MB.
                              </div>
                              <Upload
                                name="logo"
                                listType="picture-card"
                                className="logo-uploader"
                                showUploadList={true}
                                fileList={fileList}
                                maxCount={1}
                                beforeUpload={handleBeforeUpload}
                                customRequest={handleLogoUpload}
                                disabled={logoUploading}
                                accept="image/*"
                                onChange={(info) => {
                                  setFileList(info.fileList);
                                }}
                                onRemove={() => {
                                  setFileList([]);
                                  setInstitutionData(prev => ({
                                    ...prev,
                                    logo: ''
                                  }));
                                }}
                              >
                                {fileList.length >= 1 ? null : (
                                  logoUploading ? (
                                    <div>
                                      <Spin />
                                      <div style={{ marginTop: 8 }}>Subiendo...</div>
                                    </div>
                                  ) : (
                                    <div>
                                      <UploadOutlined />
                                      <div style={{ marginTop: 8 }}>Subir Logo</div>
                                    </div>
                                  )
                                )}
                              </Upload>
                            </div>
                          </Col>
                        </Row>
                      )}
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
                      
                      <Row gutter={16} className="mt-3">
                        <Col span={12}>
                          <h5>Turno Noche</h5>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item
                                label="Hora Inicio"
                                name="scheduleSettings.nightStartTime"
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
                                name="scheduleSettings.nightEndTime"
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