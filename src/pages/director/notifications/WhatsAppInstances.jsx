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
  Badge,
  Image,
  Tabs,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  RollbackOutlined,
  WhatsAppOutlined,
  QrcodeOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { Filter } from 'react-feather';

// Componentes de diseño
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AlertModal from '../../../components/AlertModal';
import WhatsAppModal from './WhatsAppModal';

// Servicios
import notificationsDirectorService from '../../../services/notification/notificationsDirectorService';

// Hooks y helpers
import useAlert from "../../../hooks/useAlert";
import { 
  WhatsAppInstance,
  WhatsAppInstanceStatus,
  ConnectionStatus,
  getInstanceStatusColor,
  getInstanceStatusText,
  getConnectionStatusColor,
  getConnectionStatusText,
  getConnectionStatusIcon,
  formatPhoneNumber,
  formatDateTime
} from '../../../types/notifications/notifications';

const { Option } = Select;
const { TabPane } = Tabs;

const WhatsAppInstances = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [activeInstances, setActiveInstances] = useState([]);
  const [deletedInstances, setDeletedInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [filteredInstances, setFilteredInstances] = useState([]);

  // Estados para modal WhatsApp
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'reset'
  const [modalInstance, setModalInstance] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [activeInstances, deletedInstances, searchText, statusFilter, connectionFilter, activeTab]);

  /**
   * Carga todos los datos iniciales necesarios
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActiveInstances(),
        loadDeletedInstances()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      showError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga todas las instancias activas
   */
  const loadActiveInstances = async () => {
    try {
      const result = await notificationsDirectorService.getInstances();
      if (result.success) {
        const instances = (result.data?.instances || []).map(instance => WhatsAppInstance.fromApiResponse(instance));
        setActiveInstances(instances);
        console.log('📱 Instancias activas cargadas:', instances.length);
      } else {
        showError(result.error || 'Error al cargar las instancias activas');
      }
    } catch (error) {
      console.error('Error al cargar instancias activas:', error);
      showError('Error al cargar las instancias activas');
    }
  };

  /**
   * Carga todas las instancias eliminadas
   */
  const loadDeletedInstances = async () => {
    try {
      const result = await notificationsDirectorService.getDeletedInstances();
      if (result.success) {
        const instances = (result.data?.instances || []).map(instance => new WhatsAppInstance(instance));
        setDeletedInstances(instances);
        console.log('🗑️ Instancias eliminadas cargadas:', instances.length);
      } else {
        showError(result.error || 'Error al cargar las instancias eliminadas');
      }
    } catch (error) {
      console.error('Error al cargar instancias eliminadas:', error);
      showError('Error al cargar las instancias eliminadas');
    }
  };

  /**
   * Aplica filtros de búsqueda, estado y conexión
   */
  const applyFilters = () => {
    const currentInstances = activeTab === 'active' ? activeInstances : deletedInstances;
    let filtered = [...currentInstances];

    // Filtro por texto de búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(instance => 
        instance.instanceName.toLowerCase().includes(searchLower) ||
        instance.phoneNumber.includes(searchLower) ||
        instance.instanceCode.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado de instancia
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    // Filtro por estado de conexión
    if (connectionFilter && connectionFilter !== 'all') {
      filtered = filtered.filter(instance => instance.connectionStatus === connectionFilter);
    }

    setFilteredInstances(filtered);
  };

  /**
   * Muestra detalles de la instancia con QR
   */
  const handleViewDetails = async (instance) => {
    try {
      // Obtener detalles actualizados de la instancia
      const result = await notificationsDirectorService.getInstanceDetails(instance.id);
      if (result.success) {
        const updatedInstance = WhatsAppInstance.fromApiResponse(result.data);
        
        Modal.info({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WhatsAppOutlined style={{ color: '#25D366' }} />
              Detalles de Instancia WhatsApp
            </div>
          ),
          width: 700,
          content: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                {/* Información básica */}
                <Col span={24}>
                  <Row gutter={[16, 8]}>
                    <Col span={8}><strong>Nombre de Instancia:</strong></Col>
                    <Col span={16}>{updatedInstance.instanceName}</Col>
                    
                    <Col span={8}><strong>Código de Instancia:</strong></Col>
                    <Col span={16}>
                      <Tag color="blue">{updatedInstance.instanceCode}</Tag>
                    </Col>
                    
                    <Col span={8}><strong>Número de Teléfono:</strong></Col>
                    <Col span={16}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PhoneOutlined />
                        {formatPhoneNumber(updatedInstance.phoneNumber)}
                      </div>
                    </Col>
                    
                    <Col span={8}><strong>Estado de Instancia:</strong></Col>
                    <Col span={16}>
                      <Badge 
                        color={getInstanceStatusColor(updatedInstance.status)} 
                        text={getInstanceStatusText(updatedInstance.status)} 
                      />
                    </Col>
                    
                    <Col span={8}><strong>Estado de Conexión:</strong></Col>
                    <Col span={16}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getConnectionStatusIcon(updatedInstance.connectionStatus)}</span>
                        <Badge 
                          color={getConnectionStatusColor(updatedInstance.connectionStatus)} 
                          text={getConnectionStatusText(updatedInstance.connectionStatus)} 
                        />
                      </div>
                    </Col>
                  </Row>
                </Col>

                {/* Código QR */}
                {updatedInstance.base64 && (
                  <Col span={24}>
                    <Divider>Código QR para WhatsApp</Divider>
                    <div style={{ textAlign: 'center' }}>
                      <Image
                        width={200}
                        height={200}
                        src={updatedInstance.base64}
                        alt="Código QR WhatsApp"
                        style={{ border: '1px solid #d9d9d9', borderRadius: '8px' }}
                        placeholder={
                          <div style={{ 
                            width: 200, 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px'
                          }}>
                            <QrcodeOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />
                          </div>
                        }
                      />
                      <div style={{ marginTop: '8px', color: '#666' }}>
                        <small>Escanea este código QR con WhatsApp para conectar</small>
                      </div>
                    </div>
                  </Col>
                )}

                {/* Fechas */}
                <Col span={24}>
                  <Divider>Información de Fechas</Divider>
                  <Row gutter={[16, 8]}>
                    <Col span={8}><strong>Fecha de Creación:</strong></Col>
                    <Col span={16}>{formatDateTime(updatedInstance.createdAt)}</Col>
                    
                    <Col span={8}><strong>Última Actualización:</strong></Col>
                    <Col span={16}>{formatDateTime(updatedInstance.updatedAt)}</Col>
                  </Row>
                </Col>
              </Row>
            </div>
          ),
        });
      } else {
        showError(result.error || 'Error al obtener detalles de la instancia');
      }
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      showError('Error al cargar los detalles de la instancia');
    }
  };

  /**
   * Actualiza el estado de conexión de una instancia
   */
  const handleRefreshStatus = async (instance) => {
    try {
      setLoading(true);
      const result = await notificationsDirectorService.getInstanceStatus(instance.id);
      if (result.success) {
        const updatedInstance = new WhatsAppInstance(result.data);
        
        // Actualizar en el estado correspondiente
        if (activeTab === 'active') {
          setActiveInstances(prev => 
            prev.map(inst => 
              inst.id === instance.id ? updatedInstance : inst
            )
          );
        }
        
        showSuccess('Estado de conexión actualizado');
      } else {
        showError(result.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showError('Error al actualizar el estado de conexión');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una instancia (eliminación lógica)
   */
  const handleDeleteInstance = async (instance) => {
    showAlert({
      title: '¿Confirmar eliminación?',
      message: `¿Está seguro de que desea eliminar la instancia "${instance.instanceName}"? Esta acción se puede revertir posteriormente.`,
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          const result = await notificationsDirectorService.deleteInstance(instance.id);
          if (result.success) {
            showSuccess('Instancia eliminada exitosamente');
            await loadInitialData(); // Recargar ambas listas
          } else {
            showError(result.error || 'Error al eliminar la instancia');
          }
        } catch (error) {
          console.error('Error al eliminar instancia:', error);
          showError('Error al eliminar la instancia');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  /**
   * Restaura una instancia eliminada
   */
  const handleRestoreInstance = async (instance) => {
    showAlert({
      title: '¿Confirmar restauración?',
      message: `¿Está seguro de que desea restaurar la instancia "${instance.instanceName}"?`,
      type: 'info',
      showCancel: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          const result = await notificationsDirectorService.restoreInstance(instance.id);
          if (result.success) {
            showSuccess('Instancia restaurada exitosamente');
            await loadInitialData(); // Recargar ambas listas
          } else {
            showError(result.error || 'Error al restaurar la instancia');
          }
        } catch (error) {
          console.error('Error al restaurar instancia:', error);
          showError('Error al restaurar la instancia');
        } finally {
          setLoading(false);
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
   * Elimina múltiples instancias seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showError('Debe seleccionar al menos una instancia para eliminar');
      return;
    }

    showAlert({
      title: 'Confirmar eliminación masiva',
      message: `¿Está seguro de eliminar ${selectedRowKeys.length} instancia(s) seleccionada(s)?`,
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const instanceId of selectedRowKeys) {
            await notificationsDirectorService.deleteInstance(instanceId);
          }
          
          showSuccess(`${selectedRowKeys.length} instancia(s) eliminada(s) exitosamente`);
          setSelectedRowKeys([]);
          await loadInitialData();
        } catch (error) {
          console.error('Error en eliminación masiva:', error);
          showError('Error al eliminar las instancias: ' + error.message);
        }
        setLoading(false);
      }
    });
  };

  /**
   * Restaura múltiples instancias seleccionadas
   */
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      showError('Debe seleccionar al menos una instancia para restaurar');
      return;
    }

    showAlert({
      title: 'Confirmar restauración masiva',
      message: `¿Está seguro de restaurar ${selectedRowKeys.length} instancia(s) seleccionada(s)?`,
      type: 'info',
      showCancel: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const instanceId of selectedRowKeys) {
            await notificationsDirectorService.restoreInstance(instanceId);
          }
          
          showSuccess(`${selectedRowKeys.length} instancia(s) restaurada(s) exitosamente`);
          setSelectedRowKeys([]);
          await loadInitialData();
        } catch (error) {
          console.error('Error en restauración masiva:', error);
          showError('Error al restaurar las instancias: ' + error.message);
        }
        setLoading(false);
      }
    });
  };

  /**
   * Exportar reporte de instancias a PDF
   */
  const handleExportPDF = () => {
    showSuccess('Exportando instancias a PDF...');
    // TODO: Implementar exportación PDF
  };

  /**
   * Exportar reporte de instancias a CSV
   */
  const handleExportCSV = () => {
    showSuccess('Exportando instancias a CSV...');
    // TODO: Implementar exportación CSV
  };

  /**
   * Abre el modal para crear nueva instancia
   */
  const handleCreateInstance = () => {
    setModalMode('create');
    setModalInstance(null);
    setModalVisible(true);
  };

  /**
   * Abre el modal para resetear una instancia
   */
  const handleResetInstance = (instance) => {
    setModalMode('reset');
    setModalInstance(instance);
    setModalVisible(true);
  };

  /**
   * Maneja el cierre del modal
   */
  const handleModalClose = () => {
    setModalVisible(false);
    setModalMode('create');
    setModalInstance(null);
  };

  /**
   * Maneja el éxito del modal (crear/reset)
   */
  const handleModalSuccess = () => {
    // Recargar datos después de crear/resetear
    loadInitialData();
    setSelectedRowKeys([]); // Limpiar selección
  };

  // Configuración de selección de filas
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // Configuración de columnas para instancias activas
  const activeColumns = [
    {
      title: 'Instancia',
      key: 'instance',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <WhatsAppOutlined style={{ color: '#25D366' }} />
            <strong>{record.instanceName}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Tag color="blue" size="small">{record.instanceCode}</Tag>
          </div>
        </div>
      ),
      sorter: (a, b) => a.instanceName.localeCompare(b.instanceName),
    },
    {
      title: 'Teléfono',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phoneNumber) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <PhoneOutlined />
          {formatPhoneNumber(phoneNumber)}
        </div>
      ),
      sorter: (a, b) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => (
        <Badge 
          color={getInstanceStatusColor(record.status)} 
          text={getInstanceStatusText(record.status)} 
        />
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Conexión',
      key: 'connectionStatus',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{getConnectionStatusIcon(record.connectionStatus)}</span>
          <Badge 
            color={getConnectionStatusColor(record.connectionStatus)} 
            text={getConnectionStatusText(record.connectionStatus)} 
          />
        </div>
      ),
      sorter: (a, b) => a.connectionStatus.localeCompare(b.connectionStatus),
    },
    {
      title: 'Última Actualización',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Reiniciar instancia">
            <Button 
              type="text" 
              style={{ color: '#fa8c16' }}
              icon={<SettingOutlined />} 
              onClick={() => handleResetInstance(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Configuración de columnas para instancias eliminadas
  const deletedColumns = [
    {
      title: 'Instancia',
      key: 'instance',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <WhatsAppOutlined style={{ color: '#ff4d4f' }} />
            <strong style={{ color: '#666' }}>{record.instanceName}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Tag color="red" size="small">{record.instanceCode}</Tag>
          </div>
        </div>
      ),
      sorter: (a, b) => a.instanceName.localeCompare(b.instanceName),
    },
    {
      title: 'Teléfono',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phoneNumber) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666' }}>
          <PhoneOutlined />
          {formatPhoneNumber(phoneNumber)}
        </div>
      ),
      sorter: (a, b) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => (
        <Badge 
          color={getInstanceStatusColor(record.status)} 
          text={getInstanceStatusText(record.status)} 
        />
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Conexión',
      key: 'connectionStatus',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{getConnectionStatusIcon(record.connectionStatus)}</span>
          <Badge 
            color={getConnectionStatusColor(record.connectionStatus)} 
            text={getConnectionStatusText(record.connectionStatus)} 
          />
        </div>
      ),
      sorter: (a, b) => a.connectionStatus.localeCompare(b.connectionStatus),
    },
    {
      title: 'Fecha Eliminación',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
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
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Restaurar instancia">
            <Button 
              type="text" 
              style={{ color: '#52c41a' }}
              icon={<RollbackOutlined />} 
              onClick={() => handleRestoreInstance(record)}
            />
          </Tooltip>
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
                  <h3 className="page-title">Gestión de Instancias WhatsApp</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/director/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Notificaciones WhatsApp</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  {/* Información general */}
                  <div className="page-table-header mb-3 mt-3">
                    <div className="row align-items-center">
                      <div className="col">
                        <div className="doctor-table-blk">
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <WhatsAppOutlined style={{ color: '#25D366', fontSize: '24px' }} />
                            Instancias WhatsApp
                          </h3>
                          <p className="text-muted">
                            Gestione las instancias de WhatsApp para envío de notificaciones de su institución
                          </p>
                        </div>
                      </div>
                      <div className="col-auto">
                        <Space>
                          <Button
                            type="primary"
                            icon={<WhatsAppOutlined />}
                            onClick={handleCreateInstance}
                          >
                            Crear Instancia
                          </Button>
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={loadInitialData}
                            loading={loading}
                          >
                            Actualizar
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>

                  {/* Filtros de búsqueda */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <Input
                        placeholder="Buscar por nombre, teléfono o código..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                    </div>
                    <div className="col-md-3">
                      <Select
                        placeholder="Filtrar por estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: '100%' }}
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value={WhatsAppInstanceStatus.ACTIVE}>Activo</Option>
                        <Option value={WhatsAppInstanceStatus.INACTIVE}>Inactivo</Option>
                      </Select>
                    </div>
                    <div className="col-md-3">
                      <Select
                        placeholder="Filtrar por conexión"
                        value={connectionFilter}
                        onChange={setConnectionFilter}
                        style={{ width: '100%' }}
                      >
                        <Option value="all">Todas las conexiones</Option>
                        <Option value={ConnectionStatus.CONNECTED}>Conectado</Option>
                        <Option value={ConnectionStatus.CONNECTING}>Conectando</Option>
                        <Option value={ConnectionStatus.SCANNING}>Escaneando QR</Option>
                        <Option value={ConnectionStatus.DISCONNECTED}>Desconectado</Option>
                        <Option value={ConnectionStatus.FAILED}>Error</Option>
                      </Select>
                    </div>
                    <div className="col-md-2">
                      <div className="search-student-list">
                        <Button icon={<Filter size={16} />}>
                          Filtros
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs para instancias activas y eliminadas */}
                  <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                      {
                        key: 'active',
                        label: (
                          <span>
                            <WhatsAppOutlined style={{ color: '#25D366' }} />
                            Instancias Activas ({activeInstances.length})
                          </span>
                        ),
                        children: (
                          <div>
                            {/* Acciones masivas para instancias activas */}
                            {selectedRowKeys.length > 0 && (
                              <div className="mb-3">
                                <Space>
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleBulkDelete}
                                  >
                                    Eliminar Seleccionadas ({selectedRowKeys.length})
                                  </Button>
                                </Space>
                              </div>
                            )}

                            {/* Tabla de instancias activas */}
                            <div className="table-responsive">
                              <Table
                                rowSelection={rowSelection}
                                columns={activeColumns}
                                dataSource={filteredInstances}
                                rowKey="id"
                                loading={loading}
                                pagination={{
                                  pageSize: 10,
                                  showSizeChanger: true,
                                  showQuickJumper: true,
                                  showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} de ${total} instancias`,
                                }}
                                scroll={{ x: 1000 }}
                                locale={{
                                  emptyText: (
                                    <div style={{ padding: '40px', textAlign: 'center' }}>
                                      <WhatsAppOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
                                      <p style={{ color: '#666' }}>No hay instancias WhatsApp activas</p>
                                      <p style={{ color: '#999', fontSize: '12px' }}>
                                        Las instancias activas aparecerán aquí
                                      </p>
                                    </div>
                                  )
                                }}
                              />
                            </div>
                          </div>
                        )
                      },
                      {
                        key: 'deleted',
                        label: (
                          <span>
                            <DeleteOutlined style={{ color: '#ff4d4f' }} />
                            Instancias Eliminadas ({deletedInstances.length})
                          </span>
                        ),
                        children: (
                          <div>
                            {/* Acciones masivas para instancias eliminadas */}
                            {selectedRowKeys.length > 0 && (
                              <div className="mb-3">
                                <Space>
                                  <Button
                                    type="primary"
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    icon={<RollbackOutlined />}
                                    onClick={handleBulkRestore}
                                  >
                                    Restaurar Seleccionadas ({selectedRowKeys.length})
                                  </Button>
                                </Space>
                              </div>
                            )}

                            {/* Tabla de instancias eliminadas */}
                            <div className="table-responsive">
                              <Table
                                rowSelection={rowSelection}
                                columns={deletedColumns}
                                dataSource={filteredInstances}
                                rowKey="id"
                                loading={loading}
                                pagination={{
                                  pageSize: 10,
                                  showSizeChanger: true,
                                  showQuickJumper: true,
                                  showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} de ${total} instancias eliminadas`,
                                }}
                                scroll={{ x: 1000 }}
                                locale={{
                                  emptyText: (
                                    <div style={{ padding: '40px', textAlign: 'center' }}>
                                      <RollbackOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
                                      <p style={{ color: '#666' }}>No hay instancias eliminadas</p>
                                      <p style={{ color: '#999', fontSize: '12px' }}>
                                        Las instancias eliminadas aparecerán aquí para su restauración
                                      </p>
                                    </div>
                                  )
                                }}
                              />
                            </div>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel de estadísticas y reportes */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">📊 Estadísticas y Reportes de Instancias WhatsApp</h5>
                </div>
                <div className="card-body" style={{ padding: '24px' }}>
                  {/* Estadísticas rápidas */}
                  <Row gutter={[16, 16]} className="mb-4">
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#25D366' }}>
                          {activeInstances.length}
                        </div>
                        <div style={{ color: '#666' }}>Instancias Activas</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                          {activeInstances.filter(i => i.connectionStatus === ConnectionStatus.CONNECTED).length}
                        </div>
                        <div style={{ color: '#666' }}>Conectadas</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                          {activeInstances.filter(i => [ConnectionStatus.CONNECTING, ConnectionStatus.SCANNING].includes(i.connectionStatus)).length}
                        </div>
                        <div style={{ color: '#666' }}>En Proceso</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                          {deletedInstances.length}
                        </div>
                        <div style={{ color: '#666' }}>Eliminadas</div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Botones de exportación y navegación */}
                  <Space size="middle" wrap style={{ width: '100%', justifyContent: 'center' }}>
                    <Button
                      type="primary"
                      danger
                      icon={<FilePdfOutlined />}
                      onClick={handleExportPDF}
                      size="large"
                      disabled={activeInstances.length === 0 && deletedInstances.length === 0}
                      style={{ minWidth: '200px' }}
                    >
                      Reporte PDF
                    </Button>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', minWidth: '200px' }}
                      icon={<FileExcelOutlined />}
                      onClick={handleExportCSV}
                      size="large"
                      disabled={activeInstances.length === 0 && deletedInstances.length === 0}
                    >
                      Exportar CSV
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

      {/* Componentes de diseño */}
      <Sidebar />
      <Header />
      
      {/* Modal de alertas */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />

      {/* Modal WhatsApp Create/Reset */}
      <WhatsAppModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        instance={modalInstance}
        showAlert={showAlert}
        showSuccess={showSuccess}
        showError={showError}
      />
    </>
  );
};

export default WhatsAppInstances;