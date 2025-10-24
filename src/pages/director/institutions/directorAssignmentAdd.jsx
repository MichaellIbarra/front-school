/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col, 
  Select,
  Typography,
  Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';

// Componentes de diseño
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AlertModal from '../../../components/AlertModal';

// Servicios
import assignmentsService from '../../../services/institutions/assignmentsService';
import headquarterDirectorService from '../../../services/institutions/headquarterDirectorService';

// Hooks y helpers
import useAlert from "../../../hooks/useAlert";
import { 
  Assignment,
  validateAssignmentPost,
  mapModelToPostPayload,
  getUserFullName,
  formatUserRoles
} from '../../../types/institutions/assignments';

const { Option } = Select;
const { Title } = Typography;

const DirectorAssignmentAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID de la asignación para edición
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [assignmentData, setAssignmentData] = useState(Assignment);
  const [users, setUsers] = useState([]);
  const [headquarters, setHeadquarters] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Verificar si es modo edición
  useEffect(() => {
    loadInitialData();
    
    if (id && id !== 'add') {
      setIsEdit(true);
      loadAssignment(id);
    } else if (location.state?.assignment) {
      setIsEdit(true);
      const assignment = location.state.assignment;
      setAssignmentData(assignment);
      populateForm(assignment);
    } else {
      // Modo creación - crear nueva asignación
      setIsEdit(false);
      const newAssignment = { ...Assignment };
      setAssignmentData(newAssignment);
    }
  }, [id, location.state]);

  /**
   * Carga los datos iniciales necesarios (usuarios y sedes)
   */
  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        loadUsers(),
        loadHeadquarters()
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      showError('Error al cargar datos iniciales');
    }
    setLoadingData(false);
  };

  /**
   * Carga la lista de usuarios (staff)
   */
  const loadUsers = async () => {
    try {
      const response = await assignmentsService.getDirectorStaff();
      if (response.success) {
        setUsers(response.data || []);
      } else {
        showError('Error al cargar usuarios: ' + response.error);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showError('Error al cargar la lista de usuarios');
    }
  };

  /**
   * Carga la lista de sedes
   */
  const loadHeadquarters = async () => {
    try {
      const response = await headquarterDirectorService.getDirectorHeadquarters();
      if (response.success) {
        setHeadquarters(response.data || []);
      } else {
        showError('Error al cargar sedes: ' + response.error);
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      showError('Error al cargar la lista de sedes');
    }
  };

  /**
   * Carga una asignación específica para edición
   */
  const loadAssignment = async (assignmentId) => {
    setLoading(true);
    try {
      // TODO: Implementar método para obtener asignación por ID
      // const response = await assignmentsService.getAssignmentById(assignmentId);
      // if (response.success && response.data) {
      //   setAssignmentData(response.data);
      //   populateForm(response.data);
      // } else {
      //   showError('Asignación no encontrada', response.error);
      //   navigate('/director/assignments');
      // }
      
      showWarning('Funcionalidad de edición pendiente de implementar');
      navigate('/director/assignments');
    } catch (error) {
      showError('Error al cargar la asignación', 'No se pudo cargar la información de la asignación');
      navigate('/director/assignments');
    }
    setLoading(false);
  };

  /**
   * Popula el formulario con los datos de la asignación
   */
  const populateForm = (assignment) => {
    form.setFieldsValue({
      userId: assignment.userId,
      headquarterId: assignment.headquarterId,
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Validar que se hayan seleccionado usuario y sede
      if (!values.userId) {
        showError('Error de validación', 'Debe seleccionar un usuario');
        setLoading(false);
        return;
      }

      if (!values.headquarterId) {
        showError('Error de validación', 'Debe seleccionar una sede');
        setLoading(false);
        return;
      }

      // Crear el payload para la asignación
      const assignmentPayload = {
        userId: values.userId,
        headquarterId: values.headquarterId
      };

      console.log('📋 Datos a enviar:', assignmentPayload);

      // Validar el payload
      const validation = validateAssignmentPost(assignmentPayload);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(', ');
        showError('Error de validación', errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit) {
        // TODO: Implementar actualización de asignación
        showError('Funcionalidad de edición pendiente de implementar');
        setLoading(false);
        return;
      } else {
        // Crear nueva asignación
        response = await assignmentsService.createAssignment(assignmentPayload);
      }

      if (response.success) {
        const successMessage = isEdit 
          ? 'Asignación actualizada exitosamente' 
          : 'Asignación creada exitosamente';
        
        showSuccess(successMessage);
        
        // Redirigir al listado después de un breve delay
        setTimeout(() => {
          navigate('/director/assignments');
        }, 1500);
      } else {
        showError('Error al guardar la asignación', response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error al procesar asignación:', error);
      showError('Error al procesar la asignación', error.message || 'Error inesperado');
    }
    
    setLoading(false);
  };

  /**
   * Cancela la operación y regresa al listado
   */
  const handleCancel = () => {
    navigate('/director/assignments');
  };

  /**
   * Obtiene el usuario seleccionado para mostrar información adicional
   */
  const getSelectedUser = (userId) => {
    return users.find(user => user.keycloakId === userId);
  };

  /**
   * Obtiene la sede seleccionada para mostrar información adicional
   */
  const getSelectedHeadquarter = (headquarterId) => {
    return headquarters.find(hq => hq.id === headquarterId);
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
                    {isEdit ? 'Editar Asignación' : 'Nueva Asignación de Personal'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/director/assignments">Asignaciones</Link>
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
                  {loadingData ? (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando datos necesarios...</p>
                    </div>
                  ) : (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                    >
                      {/* Información de la Asignación */}
                      <Card title="Información de la Asignación" className="mb-4">
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Seleccionar Usuario"
                              name="userId"
                              rules={[
                                { required: true, message: 'Debe seleccionar un usuario' }
                              ]}
                            >
                              <Select
                                placeholder="Seleccione un usuario del personal"
                                showSearch
                                filterOption={(input, option) => {
                                  const user = users.find(u => u.keycloakId === option.value);
                                  if (!user) return false;
                                  const searchText = `${user.firstname} ${user.lastname} ${user.email} ${user.username}`.toLowerCase();
                                  return searchText.includes(input.toLowerCase());
                                }}
                                optionLabelProp="label"
                              >
                                {users.map(user => (
                                  <Option 
                                    key={user.keycloakId} 
                                    value={user.keycloakId}
                                    label={getUserFullName(user)}
                                  >
                                    <div>
                                      <div><strong>{getUserFullName(user)}</strong></div>
                                      <div style={{ fontSize: '12px', color: '#888' }}>
                                        {user.email} | {user.username}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#666' }}>
                                        Roles: {formatUserRoles(user.roles, 3)}
                                      </div>
                                    </div>
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Seleccionar Sede"
                              name="headquarterId"
                              rules={[
                                { required: true, message: 'Debe seleccionar una sede' }
                              ]}
                            >
                              <Select
                                placeholder="Seleccione una sede"
                                showSearch
                                filterOption={(input, option) => {
                                  const hq = headquarters.find(h => h.id === option.value);
                                  if (!hq) return false;
                                  const searchText = `${hq.name} ${hq.address}`.toLowerCase();
                                  return searchText.includes(input.toLowerCase());
                                }}
                                optionLabelProp="label"
                              >
                                {headquarters.map(hq => (
                                  <Option 
                                    key={hq.id} 
                                    value={hq.id}
                                    label={hq.name}
                                  >
                                    <div>
                                      <div><strong>{hq.name}</strong></div>
                                      <div style={{ fontSize: '12px', color: '#888' }}>
                                        {hq.address}
                                      </div>
                                      {hq.modularCode && hq.modularCode.length > 0 && (
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                          Códigos: {hq.modularCode.slice(0, 2).join(', ')}
                                          {hq.modularCode.length > 2 ? '...' : ''}
                                        </div>
                                      )}
                                    </div>
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Vista previa de la selección */}
                        <Form.Item shouldUpdate>
                          {({ getFieldValue }) => {
                            const selectedUserId = getFieldValue('userId');
                            const selectedHeadquarterId = getFieldValue('headquarterId');
                            const selectedUser = getSelectedUser(selectedUserId);
                            const selectedHeadquarter = getSelectedHeadquarter(selectedHeadquarterId);

                            if (selectedUser || selectedHeadquarter) {
                              return (
                                <Card 
                                  title="Vista Previa de la Asignación" 
                                  size="small" 
                                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}
                                >
                                  <Row gutter={16}>
                                    {selectedUser && (
                                      <Col span={12}>
                                        <div>
                                          <UserOutlined /> <strong>Usuario Seleccionado:</strong>
                                          <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                                            <div><strong>{getUserFullName(selectedUser)}</strong></div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                              Email: {selectedUser.email}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                              Username: {selectedUser.username}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                              Roles: {formatUserRoles(selectedUser.roles, 3)}
                                            </div>
                                          </div>
                                        </div>
                                      </Col>
                                    )}
                                    {selectedHeadquarter && (
                                      <Col span={12}>
                                        <div>
                                          <HomeOutlined /> <strong>Sede Seleccionada:</strong>
                                          <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                                            <div><strong>{selectedHeadquarter.name}</strong></div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                              Dirección: {selectedHeadquarter.address}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                              Teléfono: {selectedHeadquarter.phone}
                                            </div>
                                            {selectedHeadquarter.modularCode && selectedHeadquarter.modularCode.length > 0 && (
                                              <div style={{ fontSize: '12px', color: '#666' }}>
                                                Códigos Modulares: {selectedHeadquarter.modularCode.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </Col>
                                    )}
                                  </Row>
                                </Card>
                              );
                            }
                            return null;
                          }}
                        </Form.Item>
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
                          disabled={loadingData}
                        >
                          {isEdit ? 'Actualizar' : 'Crear'} Asignación
                        </Button>
                      </div>
                    </Form>
                  )}
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

export default DirectorAssignmentAdd;