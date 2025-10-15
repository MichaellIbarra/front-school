import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Dropdown, Tag } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  CloseOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined, 
  UndoOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import directorUserService from '../../../../services/adminDirectorService/directorUserService';
import StaffReportExporter from '../../../../utils/directorPersonal/staffReportExporter';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';
import { 
  UserStatus, 
  UserStatusLabels, 
  DocumentTypeLabels, 
  formatUserFullName, 
  getUserStatusColor 
} from '../../../../types/users/user.types';

const { Option } = Select;

const DirectorPersonalList = () => {
  const navigate = useNavigate();
  const { showAlert, showSuccess, showError } = useAlert();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, statusFilter]);

  /**
   * Cargar todos los usuarios director personal
   */
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await directorUserService.getAllStaff();
      if (response.success) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        showError(response.error || 'Error al cargar usuarios');
        setUsers([]);
      }
    } catch (err) {
      showError('Error al cargar usuarios: ' + err.message);
      setUsers([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...users];

    // Filtro por texto de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        formatUserFullName(user).toLowerCase().includes(search) ||
        user.documentNumber?.includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  /**
   * Activar usuario
   */
  const handleActivate = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de activar este usuario?',
      message: `Se activará el usuario "${username}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await directorUserService.activateStaffUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario activado correctamente');
            loadUsers();
          } else {
            showError(response.error || 'Error al activar usuario');
          }
        } catch (err) {
          showError('Error al activar usuario: ' + err.message);
        }
      }
    });
  };

  /**
   * Desactivar usuario
   */
  const handleDeactivate = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de desactivar este usuario?',
      message: `Se desactivará el usuario "${username}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await directorUserService.deactivateStaffUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario desactivado correctamente');
            loadUsers();
          } else {
            showError(response.error || 'Error al desactivar usuario');
          }
        } catch (err) {
          showError('Error al desactivar usuario: ' + err.message);
        }
      }
    });
  };

  /**
   * Eliminar usuario
   */
  const handleDelete = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de eliminar este usuario?',
      message: `Se eliminará el usuario "${username}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await directorUserService.deleteStaffUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario eliminado correctamente');
            loadUsers();
          } else {
            showError(response.error || 'Error al eliminar usuario');
          }
        } catch (err) {
          showError('Error al eliminar usuario: ' + err.message);
        }
      }
    });
  };

  /**
   * Exportar nómina completa a PDF
   */
  const handleExportPDF = () => {
    const result = StaffReportExporter.exportStaffToPDF(filteredUsers);
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.error || 'Error al exportar PDF');
    }
  };

  /**
   * Exportar nómina completa a CSV
   */
  const handleExportCSV = () => {
    const result = StaffReportExporter.exportStaffToCSV(filteredUsers);
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.error || 'Error al exportar CSV');
    }
  };

  /**
   * Exportar solo profesores
   */
  const handleExportTeachers = () => {
    const result = StaffReportExporter.exportByRole(users, 'TEACHER');
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.error || 'Error al exportar profesores');
    }
  };

  /**
   * Exportar solo personal activo
   */
  const handleExportActive = () => {
    const result = StaffReportExporter.exportActiveStaff(users);
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.error || 'Error al exportar personal activo');
    }
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Nombre Completo',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => {
        const nameA = formatUserFullName(a);
        const nameB = formatUserFullName(b);
        return nameA.localeCompare(nameB);
      },
      render: (_, record) => formatUserFullName(record),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Documento',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      render: (text, record) => (
        <div>
          <small style={{ color: '#999' }}>
            {DocumentTypeLabels[record.documentType]}
          </small>
          <br />
          {text || '-'}
        </div>
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      render: (status) => {
        const color = getUserStatusColor(status);
        const colorMap = {
          'success': '#52c41a',
          'warning': '#faad14',
          'danger': '#ff4d4f',
          'secondary': '#d9d9d9'
        };
        return (
          <Tag color={colorMap[color] || 'default'}>
            {UserStatusLabels[status] || status}
          </Tag>
        );
      },
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-',
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Ver Detalles',
            onClick: () => navigate(`/admin/admin-director/director-personal/${record.keycloakId}/view`),
          },
        ];

        if (record.status !== UserStatus.I) {
          menuItems.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Editar',
            onClick: () => navigate(`/admin/admin-director/director-personal/${record.keycloakId}/edit`),
          });
        }

        menuItems.push({ type: 'divider' });

        if (record.status === UserStatus.A) {
          menuItems.push({
            key: 'deactivate',
            icon: <CloseOutlined />,
            label: 'Desactivar',
            onClick: () => handleDeactivate(record.keycloakId, record.username),
          });
        } else if (record.status === UserStatus.I) {
          menuItems.push({
            key: 'restore',
            icon: <UndoOutlined />,
            label: 'Restaurar',
            onClick: () => handleActivate(record.keycloakId, record.username),
          });
        } else {
          menuItems.push({
            key: 'activate',
            icon: <PlayCircleOutlined />,
            label: 'Activar',
            onClick: () => handleActivate(record.keycloakId, record.username),
          });
        }

        if (record.status !== UserStatus.I) {
          menuItems.push({ type: 'divider' });
          menuItems.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Eliminar',
            danger: true,
            onClick: () => handleDelete(record.keycloakId, record.username),
          });
        }

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreHorizontal size={18} />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <Header />
      <Sidebar id="menu-item10" id1="menu-items10" activeClassName="director-personal" />
      
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Gestión de Personal</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/admin/director/dashboard">Inicio</Link>
                  </li>
                  <li className="breadcrumb-item active">Personal</li>
                </ul>
              </div>
              <div className="col-auto text-end">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/admin/admin-director/director-personal/create')}
                  size="large"
                >
                  Nuevo Personal
                </Button>
              </div>
            </div>
          </div>

          {/* Reportes de Personal */}
          <div className="card mb-4" style={{ 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #f0f0f0'
          }}>
            <div className="card-header" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px 8px 0 0',
              padding: '16px 24px'
            }}>
              <h5 className="mb-0" style={{ color: 'white', fontWeight: 600 }}>
                <PrinterOutlined style={{ marginRight: '8px' }} />
                Reportes de Personal
              </h5>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              <Space size="middle" wrap style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  danger
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  size="large"
                  disabled={filteredUsers.length === 0}
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
                  disabled={filteredUsers.length === 0}
                >
                  Exportar CSV
                </Button>
                <Button
                  type="primary"
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', minWidth: '200px' }}
                  icon={<UserOutlined />}
                  onClick={handleExportTeachers}
                  size="large"
                  disabled={users.filter(u => u.role?.includes('TEACHER')).length === 0}
                >
                  PDF Profesores
                </Button>
                <Button
                  type="primary"
                  style={{ backgroundColor: '#faad14', borderColor: '#faad14', minWidth: '200px' }}
                  icon={<CheckCircleOutlined />}
                  onClick={handleExportActive}
                  size="large"
                  disabled={users.filter(u => u.status === UserStatus.A).length === 0}
                >
                  PDF Activos
                </Button>
                <Button
                  type="default"
                  icon={<PrinterOutlined />}
                  onClick={() => window.print()}
                  size="large"
                  disabled={filteredUsers.length === 0}
                  style={{ minWidth: '200px' }}
                >
                  Imprimir Vista
                </Button>
              </Space>
              <div style={{ marginTop: '16px', textAlign: 'center', color: '#999' }}>
                <small>
                  Los reportes se generan con los datos filtrados actuales. Total: <strong>{filteredUsers.length}</strong> registro(s)
                </small>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card mb-4" style={{ 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}>
            <div className="card-body">
              <Space size="middle" style={{ width: '100%' }}>
                <Input
                  placeholder="Buscar por nombre, usuario, email o DNI"
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 400 }}
                  size="large"
                  allowClear
                />
                <Select
                  placeholder="Filtrar por Estado"
                  value={statusFilter === 'all' ? undefined : statusFilter}
                  onChange={(value) => setStatusFilter(value || 'all')}
                  style={{ width: 200 }}
                  size="large"
                  allowClear
                >
                  {Object.entries(UserStatus).map(([key, value]) => (
                    <Option key={key} value={value}>
                      {UserStatusLabels[value]}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="default"
                  icon={<UndoOutlined />}
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  size="large"
                >
                  Limpiar Filtros
                </Button>
              </Space>
            </div>
          </div>

          {/* Tabla de Personal */}
          <div className="card" style={{ 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}>
            <div className="card-body">
              <Table
                columns={columns}
                dataSource={filteredUsers}
                loading={loading}
                rowKey={(record) => record.keycloakId || record.id}
                pagination={{
                  total: filteredUsers.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} usuarios`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                locale={{
                  emptyText: users.length === 0 
                    ? 'No hay personal registrado' 
                    : 'No se encontraron usuarios con los filtros aplicados',
                }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          </div>
        </div>
      </div>

      <AlertModal />
    </div>
  );
};

export default DirectorPersonalList;
