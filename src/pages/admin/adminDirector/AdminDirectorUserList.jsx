import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Dropdown, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined, CloseOutlined, DeleteOutlined, PlayCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import adminUserService from '../../../services/users/adminUserService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { 
  UserStatus, 
  UserStatusLabels, 
  DocumentTypeLabels, 
  formatUserFullName, 
  getUserStatusColor 
} from '../../../types/users/user.types';

const { Option } = Select;

const AdminDirectorUserList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all'); // Nuevo filtro por rol
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, statusFilter, roleFilter]);

  /**
   * Cargar todos los usuarios admin/director
   */
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminUserService.getAllUsersComplete();
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
   * Aplica filtros de búsqueda, rol y estado
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

    // Filtro por rol (corregido para comparar correctamente)
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRoles = Array.isArray(user.roles) ? user.roles : [];
        // Convertir el filtro a mayúsculas y buscar en los roles
        const filterRole = roleFilter.toUpperCase();
        return userRoles.some(role => role.toUpperCase() === filterRole);
      });
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  /**
   * Activar un usuario
   */
  const handleActivateUser = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de activar este usuario?',
      message: `Se activará el usuario "${username}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await adminUserService.activateAdminUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario activado correctamente');
            loadUsers(); // Recargar la lista
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
   * Desactivar un usuario
   */
  const handleDeactivateUser = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de desactivar este usuario?',
      message: `Se desactivará el usuario "${username}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await adminUserService.deactivateAdminUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario desactivado correctamente');
            loadUsers(); // Recargar la lista
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
   * Eliminar un usuario
   */
  const handleDeleteUser = async (keycloakId, username) => {
    showAlert({
      title: '¿Está seguro de eliminar este usuario?',
      message: `Se eliminará el usuario "${username}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await adminUserService.deleteAdminUser(keycloakId);
          if (response.success) {
            showSuccess('Usuario eliminado correctamente');
            loadUsers(); // Recargar la lista
          } else {
            showError(response.error || 'Error al eliminar usuario');
          }
        } catch (err) {
          showError('Error al eliminar usuario: ' + err.message);
        }
      }
    });
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <small className="text-muted">{formatUserFullName(record)}</small>
        </div>
      ),
      sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><small>{record.email}</small></div>
          {record.phone && <div><small>{record.phone}</small></div>}
        </div>
      ),
    },
    {
      title: 'Documento',
      key: 'document',
      render: (_, record) => (
        <div>
          <small className="text-muted">{DocumentTypeLabels[record.documentType]}</small>
          <br />
          {record.documentNumber}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getUserStatusColor(status) === 'success' ? 'green' : getUserStatusColor(status) === 'danger' ? 'red' : 'orange'}>
          {UserStatusLabels[status]}
        </Tag>
      ),
      sorter: (a, b) => (UserStatusLabels[a.status] || '').localeCompare(UserStatusLabels[b.status] || ''),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-',
      sorter: (a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => navigate(`/admin/admin-director/users/${record.keycloakId}/view`),
          },
          ...(record.status !== UserStatus.I ? [{
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => navigate(`/admin/admin-director/users/${record.keycloakId}/edit`),
          }] : []),
          {
            type: 'divider',
          },
          ...(record.status === UserStatus.A ? [{
            key: 'deactivate',
            label: 'Desactivar',
            icon: <CloseOutlined />,
            onClick: () => handleDeactivateUser(record.keycloakId, record.username),
          }] : record.status === UserStatus.I ? [{
            key: 'restore',
            label: 'Restaurar',
            icon: <UndoOutlined />,
            onClick: () => handleActivateUser(record.keycloakId, record.username),
          }] : [{
            key: 'activate',
            label: 'Activar',
            icon: <PlayCircleOutlined />,
            onClick: () => handleActivateUser(record.keycloakId, record.username),
          }]),
          ...(record.status !== UserStatus.I ? [{
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteUser(record.keycloakId, record.username),
          }] : []),
        ];

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
                  <h3 className="page-title">Gestión de Usuarios Admin/Director</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Usuarios Admin/Director</li>
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
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-4 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por nombre, email, usuario o documento..."
                          prefix={<SearchOutlined />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por rol"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los roles</Option>
                        <Option value="admin">Administrador</Option>
                        <Option value="director">Director</Option>
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value="A">Activo</Option>
                        <Option value="I">Inactivo</Option>
                        <Option value="PENDING">Pendiente</Option>
                        <Option value="SUSPENDED">Suspendido</Option>
                      </Select>
                    </div>
                    <div className="col-lg-4 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => navigate('/admin/admin-director/users/create')}
                          className="btn-sm"
                        >
                          Nuevo Usuario
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de usuarios */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredUsers}
                      rowKey="keycloakId"
                      loading={loading}
                      pagination={{
                        total: filteredUsers.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} usuarios`,
                      }}
                      scroll={{ x: 800 }}
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
    </>
  );
};

export default AdminDirectorUserList;
