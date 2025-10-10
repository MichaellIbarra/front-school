/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Tabs } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined, CheckOutlined, SendOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import notificationService from "../../../services/grades/notificationService";
import { 
  NotificationType, 
  NotificationStatus, 
  NotificationChannel,
  RecipientType,
  getNotificationStatusBadgeClass,
  getNotificationTypeIcon,
  getNotificationTypeColor,
  formatDateTime,
  getTimeAgo
} from "../../../types/grades/notification";
import NotificationFormModal from "./NotificationFormModal";
import NotificationReportExporter from "../../../utils/grades/notificationReportExporter";

const { Option } = Select;
const { TabPane } = Tabs;

const NotificationList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [notifications, setNotifications] = useState([]);
  const [deletedNotifications, setDeletedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  
  // Estados para modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [notifications, deletedNotifications, searchText, statusFilter, typeFilter, activeTab]);

  /**
   * Carga todas las notificaciones desde el servicio
   */
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getAllNotifications();
      if (response.success) {
        // Separar notificaciones activas y eliminadas
        const active = response.data.filter(n => !n.deleted);
        const deleted = response.data.filter(n => n.deleted);
        
        setNotifications(active);
        setDeletedNotifications(deleted);
      } else {
        showError(response.error);
        setNotifications([]);
        setDeletedNotifications([]);
      }
    } catch (error) {
      showError('Error al cargar las notificaciones');
      setNotifications([]);
      setDeletedNotifications([]);
    }
    setLoading(false);
  };

  /**
   * Maneja el cambio de pestañas
   */
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = activeTab === 'active' ? [...notifications] : [...deletedNotifications];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.recipientId?.toLowerCase().includes(search) ||
        notification.message?.toLowerCase().includes(search) ||
        notification.notificationType?.toLowerCase().includes(search) ||
        notification.recipientType?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notification => notification.status === statusFilter);
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.notificationType === typeFilter);
    }

    setFilteredNotifications(filtered);
  };

  /**
   * Abre modal para crear nueva notificación
   */
  const handleCreate = () => {
    setModalMode('create');
    setSelectedNotification(null);
    setModalVisible(true);
  };

  /**
   * Abre modal para editar notificación
   */
  const handleEdit = (notification) => {
    setModalMode('edit');
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  /**
   * Muestra detalles de la notificación
   */
  const handleView = (notification) => {
    const statusBadgeClass = getNotificationStatusBadgeClass(notification.status);
    const typeIcon = getNotificationTypeIcon(notification.notificationType);
    const typeColor = getNotificationTypeColor(notification.notificationType);
    
    // Crear contenido HTML estructurado para mejor visualización
    const details = (
      <div className="notification-details-preview">
        <div className="card mb-3">
          <div className="card-header text-white" style={{ backgroundColor: typeColor }}>
            <h5 className="mb-0">
              <i className={`${typeIcon} me-2`}></i>
              {notification.notificationType}
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-user me-2"></i>Destinatario:</strong>
                <p className="mb-0 text-muted">{notification.recipientId}</p>
              </div>
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-users me-2"></i>Tipo de Destinatario:</strong>
                <p className="mb-0 text-muted">{notification.recipientType || 'No especificado'}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-circle me-2"></i>Estado:</strong>
                <p className="mb-0">
                  <span className={`badge ${statusBadgeClass}`}>{notification.status}</span>
                </p>
              </div>
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-paper-plane me-2"></i>Canal:</strong>
                <p className="mb-0 text-muted">{notification.channel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0"><i className="fa fa-envelope me-2"></i>Contenido del Mensaje</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-light border" style={{ 
              backgroundColor: '#f8f9fa',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {notification.message}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0"><i className="fa fa-clock me-2"></i>Información Temporal</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-2">
                <strong>Fecha de Creación:</strong>
                <p className="mb-0 text-muted">{formatDateTime(notification.createdAt)}</p>
                <small className="text-muted">{getTimeAgo(notification.createdAt)}</small>
              </div>
              <div className="col-md-6 mb-2">
                <strong>Fecha de Envío:</strong>
                <p className="mb-0 text-muted">
                  {notification.sentAt ? formatDateTime(notification.sentAt) : 'No enviado'}
                </p>
                {notification.sentAt && (
                  <small className="text-muted">{getTimeAgo(notification.sentAt)}</small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    showAlert({
      title: `Detalles de Notificación`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Marca una notificación como leída
   */
  const handleMarkAsRead = async (notification) => {
    try {
      const response = await notificationService.markAsRead(notification.id);
      if (response.success) {
        showSuccess('Notificación marcada como leída');
        loadNotifications();
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al marcar como leída');
    }
  };

  /**
   * Marca una notificación como enviada
   */
  const handleMarkAsSent = async (notification) => {
    try {
      const response = await notificationService.markAsSent(notification.id);
      if (response.success) {
        showSuccess('Notificación marcada como enviada');
        loadNotifications();
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al marcar como enviada');
    }
  };

  /**
   * Elimina una notificación
   */
  const handleDelete = async (notification) => {
    showAlert({
      title: '¿Eliminar esta notificación?',
      message: `Se eliminará la notificación para "${notification.recipientId}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await notificationService.deleteNotification(notification.id);
          if (response.success) {
            showSuccess('Notificación eliminada correctamente');
            loadNotifications();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar la notificación');
        }
      },
    });
  };

  /**
   * Restaura una notificación eliminada
   */
  const handleRestore = async (notification) => {
    showAlert({
      title: '¿Restaurar esta notificación?',
      message: `Se restaurará la notificación para "${notification.recipientId}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await notificationService.restoreNotification(notification.id);
          if (response.success) {
            showSuccess('Notificación restaurada correctamente');
            loadNotifications();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar la notificación');
        }
      },
    });
  };

  /**
   * Restaura múltiples notificaciones seleccionadas
   */
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una notificación');
      return;
    }

    showAlert({
      title: `¿Restaurar ${selectedRowKeys.length} notificación(es)?`,
      message: 'Las notificaciones seleccionadas serán restauradas y volverán a estar disponibles.',
      type: 'info',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await notificationService.restoreNotification(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} notificación(es) restaurada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al restaurar ${errorCount} notificación(es)`);
          }

          setSelectedRowKeys([]);
          loadNotifications();
        } catch (error) {
          showError('Error en la restauración masiva');
        }
      },
    });
  };

  /**
   * Maneja el éxito del modal (crear/editar)
   */
  const handleModalSuccess = (notificationData) => {
    loadNotifications();
  };

  /**
   * Maneja la cancelación del modal
   */
  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  /**
   * Exporta a Excel
   */
  const handleExportExcel = async () => {
    try {
      const dataToExport = activeTab === 'active' ? notifications : deletedNotifications;
      const result = await NotificationReportExporter.exportToExcel(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a Excel');
    }
  };

  /**
   * Exporta a PDF
   */
  const handleExportPDF = async () => {
    try {
      const dataToExport = activeTab === 'active' ? notifications : deletedNotifications;
      const result = await NotificationReportExporter.exportToPDF(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a PDF');
    }
  };

  /**
   * Exporta a CSV
   */
  const handleExportCSV = async () => {
    try {
      const dataToExport = activeTab === 'active' ? notifications : deletedNotifications;
      const result = await NotificationReportExporter.exportToCSV(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a CSV');
    }
  };

  /**
   * Imprime el reporte
   */
  const handlePrint = () => {
    try {
      const dataToExport = activeTab === 'active' ? notifications : deletedNotifications;
      const result = NotificationReportExporter.printReport(dataToExport);
      if (result.success) {
        showSuccess('Reporte enviado a impresión');
      } else {
        showError('Error al imprimir', result.error);
      }
    } catch (error) {
      showError('Error al imprimir el reporte');
    }
  };

  /**
   * Elimina múltiples notificaciones seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una notificación');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} notificación(es)?`,
      message: 'Las notificaciones seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await notificationService.deleteNotification(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} notificación(es) eliminada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} notificación(es)`);
          }

          setSelectedRowKeys([]);
          loadNotifications();
        } catch (error) {
          showError('Error en la eliminación masiva');
        }
      },
    });
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
      title: 'Tipo',
      dataIndex: 'notificationType',
      key: 'notificationType',
      width: 180,
      render: (type) => {
        const icon = getNotificationTypeIcon(type);
        const color = getNotificationTypeColor(type);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={icon} style={{ color }} />
            <span style={{ fontSize: '12px' }}>{type}</span>
          </div>
        );
      },
    },
    {
      title: 'Destinatario',
      key: 'recipient',
      width: 200,
      render: (_, record) => (
        <div>
          <strong>{record.recipientId}</strong>
          {record.recipientType && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.recipientType}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Mensaje',
      dataIndex: 'message',
      key: 'message',
      width: 400,
      render: (message) => (
        <div style={{ 
          maxWidth: '380px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <Tooltip title={message}>
            {message}
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const badgeClass = getNotificationStatusBadgeClass(status);
        return (
          <span className={`badge ${badgeClass}`}>
            {status}
          </span>
        );
      },
      filters: Object.values(NotificationStatus).map(status => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Canal',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel) => (
        <span className="badge badge-secondary" style={{ backgroundColor: '#6c757d', color: 'white' }}>
          {channel}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => handleView(record),
          }
        ];

        // Solo mostrar opciones de edición y eliminación para elementos activos
        if (activeTab === 'active') {
          items.push({
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          });

          // Agregar acciones basadas en el estado
          if (record.status === NotificationStatus.PENDING) {
            items.push({
              key: 'markSent',
              label: 'Marcar como Enviado',
              icon: <SendOutlined />,
              onClick: () => handleMarkAsSent(record),
            });
          }

          if (record.status !== NotificationStatus.READ) {
            items.push({
              key: 'markRead',
              label: 'Marcar como Leído',
              icon: <CheckOutlined />,
              onClick: () => handleMarkAsRead(record),
            });
          }

          items.push(
            {
              type: 'divider',
            },
            {
              key: 'delete',
              label: 'Eliminar',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            }
          );
        } else {
          // Solo mostrar restaurar para elementos inactivos
          items.push(
            {
              type: 'divider',
            },
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <UndoOutlined />,
              onClick: () => handleRestore(record),
            }
          );
        }

        return (
          <Space size="middle">
            <Dropdown
              menu={{ items }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                icon={<MoreHorizontal size={16} />}
                onClick={(e) => e.preventDefault()}
              />
            </Dropdown>
          </Space>
        );
      },
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
                  <h3 className="page-title">Gestión de Notificaciones</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Notificaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  {/* Pestañas para activos/inactivos */}
                  <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-3">
                    <TabPane tab={`Activas (${notifications.length})`} key="active">
                    </TabPane>
                    <TabPane tab={`Eliminadas (${deletedNotifications.length})`} key="inactive">
                    </TabPane>
                  </Tabs>

                  <div className="row mb-3 mt-3">
                    <div className="col-lg-3 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por destinatario, mensaje..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los estados</Option>
                        {Object.values(NotificationStatus).map(status => (
                          <Option key={status} value={status}>{status}</Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Tipo"
                        value={typeFilter}
                        onChange={setTypeFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los tipos</Option>
                        {Object.values(NotificationType).map(type => (
                          <Option key={type} value={type}>{type}</Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-5 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        {activeTab === 'active' && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            className="btn-sm"
                          >
                            Nueva Notificación
                          </Button>
                        )}
                        
                        {/* Botones de exportación */}
                        <Button.Group>
                          <Button 
                            icon={<i className="fa fa-file-excel" />}
                            onClick={handleExportExcel}
                            title="Exportar a Excel"
                            className="btn-sm"
                          >
                            Excel
                          </Button>
                          <Button 
                            icon={<i className="fa fa-file-pdf" />}
                            onClick={handleExportPDF}
                            title="Exportar a PDF"
                            className="btn-sm"
                          >
                            PDF
                          </Button>
                          <Button 
                            icon={<i className="fa fa-file-text" />}
                            onClick={handleExportCSV}
                            title="Exportar a CSV"
                            className="btn-sm"
                          >
                            CSV
                          </Button>
                          <Button 
                            icon={<i className="fa fa-print" />}
                            onClick={handlePrint}
                            title="Imprimir"
                            className="btn-sm"
                          >
                            Imprimir
                          </Button>
                        </Button.Group>
                        
                        {selectedRowKeys.length > 0 && activeTab === 'active' && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDelete}
                            className="btn-sm"
                          >
                            Eliminar ({selectedRowKeys.length})
                          </Button>
                        )}
                        {selectedRowKeys.length > 0 && activeTab === 'inactive' && (
                          <Button
                            type="primary"
                            icon={<UndoOutlined />}
                            onClick={handleBulkRestore}
                            className="btn-sm"
                          >
                            Restaurar ({selectedRowKeys.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de notificaciones */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredNotifications}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredNotifications.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} notificaciones`,
                      }}
                      scroll={{ x: 1200 }}
                      size="middle"
                    />
                  </div>
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

      {/* Modal de formulario */}
      <NotificationFormModal
        visible={modalVisible}
        mode={modalMode}
        notificationData={selectedNotification}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />
    </>
  );
};

export default NotificationList;