/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Tooltip, 
  Modal, 
  Row, 
  Col,
  Typography,
  Dropdown,
  Menu,
  Form
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  ExportOutlined,
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  HomeOutlined,
  FilePdfOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { Filter } from 'react-feather';

// Componentes de diseño
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AlertModal from '../../../components/AlertModal';

// Servicios
import assignmentsService from '../../../services/institutions/assignmentsService';
import headquarterDirectorService from '../../../services/institutions/headquarterDirectorService';
import institutionDirectorService from '../../../services/institutions/institutionDirectorService';

// Hooks y helpers
import useAlert from "../../../hooks/useAlert";
import { 
  getUserFullName, 
  formatUserRoles,
  formatAssignmentDate,
  parseHeadquarterCode
} from '../../../types/institutions/assignments';
import { 
  formatModularCodesDisplay 
} from '../../../types/institutions/headquarter';
import AssignmentsReportExporter from '../../../utils/institutions/assignmentsReportExporter';

const { Option } = Select;

const DirectorAssignmentList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [headquarters, setHeadquarters] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [headquarterFilter, setHeadquarterFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  // Estados para el modal de edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editForm] = Form.useForm();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []); // Sin dependencias porque el director solo tiene una institución

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [assignments, users, searchText, headquarterFilter, roleFilter]);

  /**
   * Carga todos los datos iniciales necesarios
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInstitution(),
        loadAssignments(),
        loadUsers(),
        loadHeadquarters()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      showError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga todas las asignaciones del director
   */
  const loadAssignments = async () => {
    try {
      const result = await assignmentsService.getDirectorAssignments();
      if (result.success) {
        setAssignments(result.data || []);
        console.log('📋 Asignaciones cargadas:', result.data?.length || 0);
      } else {
        showError(result.error || 'Error al cargar las asignaciones');
      }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      showError('Error al cargar las asignaciones');
    }
  };

  /**
   * Carga la lista de usuarios staff
   */
  const loadUsers = async () => {
    try {
      const result = await assignmentsService.getDirectorStaff();
      if (result.success) {
        setUsers(result.data || []);
        console.log('👥 Usuarios cargados:', result.data?.length || 0);
      } else {
        showError(result.error || 'Error al cargar los usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showError('Error al cargar los usuarios');
    }
  };

  /**
   * Carga la lista de sedes disponibles
   */
  const loadHeadquarters = async () => {
    try {
      const result = await headquarterDirectorService.getDirectorHeadquarters();
      if (result.success) {
        setHeadquarters(result.data || []);
        console.log('🏢 Sedes cargadas:', result.data?.length || 0);
      } else {
        showError(result.error || 'Error al cargar las sedes');
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      showError('Error al cargar las sedes');
    }
  };

  /**
   * Carga la información de la institución del director
   */
  const loadInstitution = async () => {
    try {
      const result = await institutionDirectorService.getDirectorInstitution();
      if (result.success) {
        setInstitution(result.data);
        console.log('🏫 Institución cargada:', result.data?.name || 'Sin nombre');
      } else {
        showError(result.error || 'Error al cargar la institución');
      }
    } catch (error) {
      console.error('Error al cargar institución:', error);
      showError('Error al cargar la institución');
    }
  };

  /**
   * Aplica filtros de búsqueda, sede y rol
   */
  const applyFilters = () => {
    let filtered = [...assignments];

    // Filtro por texto de búsqueda (nombre del usuario o sede)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(assignment => {
        const user = users.find(u => u.keycloakId === assignment.userId);
        const userFullName = user ? getUserFullName(user).toLowerCase() : '';
        const headquarterName = (assignment.headquarterName || '').toLowerCase();
        const username = user ? user.username.toLowerCase() : '';
        
        return userFullName.includes(searchLower) || 
               headquarterName.includes(searchLower) ||
               username.includes(searchLower);
      });
    }

    // Filtro por sede
    if (headquarterFilter && headquarterFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.headquarterId === headquarterFilter);
    }

    // Filtro por rol
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const user = users.find(u => u.keycloakId === assignment.userId);
        return user && user.roles.includes(roleFilter);
      });
    }

    setFilteredAssignments(filtered);
  };

  /**
   * Navega al formulario de crear nueva asignación
   */
  const handleCreate = () => {
    navigate('/director/assignments/create');
  };

  /**
   * Muestra detalles de la asignación
   */
  const handleView = (assignment) => {
    const user = users.find(u => u.keycloakId === assignment.userId);
    
    Modal.info({
      title: 'Detalles de Asignación',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}><strong>Usuario:</strong></Col>
            <Col span={16}>{user ? getUserFullName(user) : 'Usuario no encontrado'}</Col>
            
            <Col span={8}><strong>Username:</strong></Col>
            <Col span={16}>{user?.username || '-'}</Col>
            
            <Col span={8}><strong>Email:</strong></Col>
            <Col span={16}>{user?.email || '-'}</Col>
            
            <Col span={8}><strong>Roles:</strong></Col>
            <Col span={16}>{user ? formatUserRoles(user.roles) : '-'}</Col>
            
            <Col span={8}><strong>Sede:</strong></Col>
            <Col span={16}>{assignment.headquarterName || 'Sin nombre'}</Col>
            
            <Col span={8}><strong>Dirección:</strong></Col>
            <Col span={16}>{assignment.headquarterAddress || '-'}</Col>
            
            <Col span={8}><strong>Códigos Modulares:</strong></Col>
            <Col span={16}>
              {assignment.headquarterCode && assignment.headquarterCode.length > 0 
                ? formatModularCodesDisplay(assignment.headquarterCode) 
                : 'Sin códigos modulares'}
            </Col>
            
            <Col span={8}><strong>Fecha Asignación:</strong></Col>
            <Col span={16}>{formatAssignmentDate(assignment.assignmentDate)}</Col>
            
            <Col span={8}><strong>Fecha Creación:</strong></Col>
            <Col span={16}>{formatAssignmentDate(assignment.createdAt)}</Col>
          </Row>
        </div>
      ),
    });
  };

  /**
   * Abre el modal de edición para cambiar la sede asignada
   */
  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    editForm.setFieldsValue({
      headquarterId: assignment.headquarterId
    });
    setEditModalVisible(true);
  };

  /**
   * Maneja el envío del formulario de edición
   */
  const handleUpdateSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (!editingAssignment) {
        showError('No hay asignación seleccionada para editar');
        return;
      }

      setLoading(true);
      
      const result = await assignmentsService.updateAssignment(
        editingAssignment.id, 
        values.headquarterId
      );
      
      if (result.success) {
        showSuccess(result.message || 'Asignación actualizada exitosamente');
        setEditModalVisible(false);
        setEditingAssignment(null);
        editForm.resetFields();
        
        // Recargar las asignaciones para reflejar los cambios
        await loadAssignments();
      } else {
        showError('Ya se encuentra registrado, verifique');
      }
    } catch (error) {
      console.error('Error en handleUpdateSubmit:', error);
      showError('Error al procesar la actualización');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una asignación
   */
  const handleDelete = async (assignment) => {
    const user = users.find(u => u.keycloakId === assignment.userId);
    const userName = user ? getUserFullName(user) : 'Usuario desconocido';
    
    showAlert({
      title: '¿Confirmar eliminación?',
      message: `¿Está seguro de que desea eliminar la asignación de "${userName}" a "${assignment.headquarterName}"?`,
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          // TODO: Implementar método de eliminación en el servicio
          // const result = await assignmentsService.deleteAssignment(assignment.id);
          showSuccess('Asignación eliminada exitosamente');
          loadAssignments();
        } catch (error) {
          console.error('Error al eliminar asignación:', error);
          showError('Error al eliminar la asignación');
        }
      }
    });
  };

  /**
   * Regresa al dashboard del director
   */
  const handleBack = () => {
    navigate('/director/dashboard');
  };

  /**
   * Obtiene los roles únicos de todos los usuarios
   */
  const getUniqueRoles = () => {
    const allRoles = users.flatMap(user => user.roles || []);
    const relevantRoles = allRoles.filter(role => 
      !role.startsWith('default-roles-') && 
      role !== 'offline_access' && 
      role !== 'uma_authorization'
    );
    return [...new Set(relevantRoles)];
  };

  /**
   * Elimina múltiples asignaciones seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showError('Debe seleccionar al menos una asignación para eliminar');
      return;
    }

    showAlert({
      title: 'Confirmar eliminación masiva',
      message: `¿Está seguro de eliminar ${selectedRowKeys.length} asignación(es) seleccionada(s)?`,
      type: 'warning',
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      onConfirm: async () => {
        setLoading(true);
        try {
          // TODO: Implementar eliminación masiva en el servicio
          for (const assignmentId of selectedRowKeys) {
            // await assignmentsService.deleteAssignment(assignmentId);
          }
          
          showSuccess(`${selectedRowKeys.length} asignación(es) eliminada(s) exitosamente`);
          setSelectedRowKeys([]);
          await loadAssignments();
        } catch (error) {
          console.error('Error en eliminación masiva:', error);
          showError('Error al eliminar las asignaciones: ' + error.message);
        }
        setLoading(false);
      }
    });
  };

  /**
   * Exportar reporte completo de asignaciones a PDF
   */
  const handleExportPDF = () => {
    try {
      const result = AssignmentsReportExporter.exportAssignmentsToPDF(filteredAssignments, users, institution?.name);
      if (result.success) {
        showSuccess('Exportación exitosa', result.message);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar', 'No se pudo generar el reporte PDF');
    }
  };

  /**
   * Exportar reporte completo de asignaciones a CSV
   */
  const handleExportCSV = () => {
    try {
      const result = AssignmentsReportExporter.exportAssignmentsToCSV(filteredAssignments, users, institution?.name);
      if (result.success) {
        showSuccess('Exportación exitosa', result.message);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar', 'No se pudo generar el archivo CSV');
    }
  };

  /**
   * Exportar solo asignaciones activas
   */
  const handleExportActiveAssignments = () => {
    try {
      const result = AssignmentsReportExporter.exportActiveAssignments(filteredAssignments, users, institution?.name);
      if (result.success) {
        showSuccess('Exportación exitosa', result.message);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar', 'No se pudo generar el reporte de asignaciones activas');
    }
  };

  // Configuración de selección de filas
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => {
        const user = users.find(u => u.keycloakId === record.userId);
        return user ? (
          <div>
            <strong>{getUserFullName(user)}</strong>
            <br />
            <small className="text-muted">@{user.username}</small>
            <br />
            <small className="text-muted">{formatUserRoles(user.roles)}</small>
          </div>
        ) : (
          <span style={{ color: '#ff4d4f' }}>Usuario no encontrado</span>
        );
      },
      sorter: (a, b) => {
        const userA = users.find(u => u.keycloakId === a.userId);
        const userB = users.find(u => u.keycloakId === b.userId);
        const nameA = userA ? getUserFullName(userA) : '';
        const nameB = userB ? getUserFullName(userB) : '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Sede Asignada',
      key: 'headquarter',
      render: (_, record) => (
        <div>
          <strong>{record.headquarterName || 'Sin nombre'}</strong>
          <br />
          <small className="text-muted">
            {record.headquarterCode && record.headquarterCode.length > 0 
              ? formatModularCodesDisplay(record.headquarterCode, 1)
              : 'Sin códigos modulares'}
          </small>
          {record.headquarterAddress && (
            <>
              <br />
              <small className="text-muted">{record.headquarterAddress}</small>
            </>
          )}
        </div>
      ),
      sorter: (a, b) => (a.headquarterName || '').localeCompare(b.headquarterName || ''),
    },
    {
      title: 'Fecha Asignación',
      dataIndex: 'assignmentDate',
      key: 'assignmentDate',
      render: (date) => formatAssignmentDate(date),
      sorter: (a, b) => new Date(a.assignmentDate) - new Date(b.assignmentDate),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatAssignmentDate(date),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Editar sede asignada">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {/* <Tooltip title="Eliminar asignación">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip> */}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Asignaciones de Personal</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Asignaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Controles superiores */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  {/* Barra de herramientas */}
                  <div className="page-table-header mb-3 mt-3">
                    <div className="row align-items-center">
                      <div className="col">
                        <div className="doctor-table-blk">
                          <h3>Gestión de Asignaciones</h3>
                          <div className="doctor-search-blk">
                            <div className="add-group">
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                className="me-2"
                              >
                                Agregar Asignación
                              </Button>
                              {selectedRowKeys.length > 0 && (
                                <Button
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={handleBulkDelete}
                                >
                                  Eliminar Seleccionadas ({selectedRowKeys.length})
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <Input
                        placeholder="Buscar por usuario o sede..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                    </div>
                    <div className="col-md-3">
                      <Select
                        placeholder="Filtrar por sede"
                        value={headquarterFilter}
                        onChange={setHeadquarterFilter}
                        style={{ width: '100%' }}
                      >
                        <Option value="all">Todas las sedes</Option>
                        {headquarters.map(hq => (
                          <Option key={hq.id} value={hq.id}>
                            {hq.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-md-3">
                      <Select
                        placeholder="Filtrar por rol"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        style={{ width: '100%' }}
                      >
                        <Option value="all">Todos los roles</Option>
                        {getUniqueRoles().map(role => (
                          <Option key={role} value={role}>
                            {role}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-md-2">
                      <div className="search-student-list">
                        <Button icon={<Filter size={16} />}>
                          Filtros Avanzados
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredAssignments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} asignaciones`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Exportación y Reportes */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">📊 Reportes y Exportación de Asignaciones</h5>
                </div>
                <div className="card-body" style={{ padding: '24px' }}>
                  <Space size="middle" wrap style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                      type="primary"
                      danger
                      icon={<FilePdfOutlined />}
                      onClick={handleExportPDF}
                      size="large"
                      disabled={filteredAssignments.length === 0}
                      style={{ minWidth: '200px' }}
                    >
                      PDF Completo
                    </Button>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', minWidth: '200px' }}
                      icon={<FileExcelOutlined />}
                      onClick={handleExportCSV}
                      size="large"
                      disabled={filteredAssignments.length === 0}
                    >
                      Exportar CSV
                    </Button>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', minWidth: '200px' }}
                      icon={<FilePdfOutlined />}
                      onClick={handleExportActiveAssignments}
                      size="large"
                      disabled={filteredAssignments.length === 0}
                    >
                      Solo Activas
                    </Button>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBack}
                      size="large"
                      style={{ minWidth: '200px' }}
                    >
                      Volver al Dashboard
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* Modal de edición de asignación */}
      <Modal
        title="Editar Asignación de Sede"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={handleUpdateSubmit}
          >
            Actualizar Asignación
          </Button>,
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          {editingAssignment && (
            <div style={{ marginBottom: 16 }}>
              <strong>Usuario:</strong> {(() => {
                const user = users.find(u => u.keycloakId === editingAssignment.userId);
                return user ? getUserFullName(user) : 'Usuario no encontrado';
              })()}
            </div>
          )}
          
          <Form.Item
            label="Seleccionar Nueva Sede"
            name="headquarterId"
            rules={[{ required: true, message: 'Debe seleccionar una sede' }]}
          >
            <Select
              placeholder="Seleccione una sede"
              showSearch
              filterOption={(input, option) => 
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {headquarters.map(hq => (
                <Select.Option key={hq.id} value={hq.id}>
                  {hq.name} - {hq.address}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default DirectorAssignmentList;