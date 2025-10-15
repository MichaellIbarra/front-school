/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import headquarterAdminService from "../../../services/institutions/headquarterAdminService";
import InstitutionAdminService from "../../../services/institutions/institutionAdminService";
import { HeadquarterStatus } from "../../../types/institutions";
import ExportUtils from '../../../utils/institutions/exportUtils';

const { Option } = Select;

const HeadquarterList = () => {
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [headquarters, setHeadquarters] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredHeadquarters, setFilteredHeadquarters] = useState([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInstitution();
    loadHeadquarters();
  }, [institutionId]);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [headquarters, searchText, statusFilter]);

  /**
   * Carga la información de la institución
   */
  const loadInstitution = async () => {
    try {
      const response = await InstitutionAdminService.getInstitutionById(institutionId);
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
   * Carga todas las sedes de la institución desde el servicio
   */
  const loadHeadquarters = async () => {
    setLoading(true);
    try {
      const response = await headquarterAdminService.getHeadquartersByInstitution(institutionId);
      
      if (response.success) {
        setHeadquarters(response.data || []);
      } else {
        showError('Error al cargar sedes', response.error);
        setHeadquarters([]);
      }
    } catch (error) {
      showError('Error de conexión', 'No se pudieron cargar las sedes');
      setHeadquarters([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...headquarters];

    // Filtro por texto de búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(hq => 
        hq.name.toLowerCase().includes(searchLower) ||
        hq.phone.toLowerCase().includes(searchLower) ||
        hq.address.toLowerCase().includes(searchLower) ||
        (Array.isArray(hq.modularCode) && hq.modularCode.some(code => 
          code.toLowerCase().includes(searchLower)
        ))
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(hq => hq.status === statusFilter);
    }

    setFilteredHeadquarters(filtered);
  };

  /**
   * Navega al formulario de crear nueva sede
   */
  const handleCreate = () => {
    navigate(`/admin/institution/${institutionId}/headquarters/add`);
  };

  /**
   * Navega al formulario de editar sede
   */
  const handleEdit = (headquarter) => {
    navigate(`/admin/institution/${institutionId}/headquarters/edit/${headquarter.id}`, {
      state: { headquarter }
    });
  };

  /**
   * Muestra detalles de la sede
   */
  const handleView = (headquarter) => {
    // Procesar códigos modulares
    let modularCodesText = 'Sin códigos';
    if (Array.isArray(headquarter.modularCode) && headquarter.modularCode.length > 0) {
      modularCodesText = headquarter.modularCode.join(', ');
    }

    showAlert({
      title: `Sede: ${headquarter.name}`,
      message: `
        <div style="text-align: left;">
          <p><strong>Códigos Modulares:</strong> ${modularCodesText}</p>
          <p><strong>Dirección:</strong> ${headquarter.address}</p>
          <p><strong>Teléfono:</strong> ${headquarter.phone || 'Sin teléfono'}</p>
          <p><strong>Estado:</strong> ${headquarter.status === 'A' ? 'Activo' : 'Inactivo'}</p>
          <p><strong>Fecha Creación:</strong> ${new Date(headquarter.createdAt).toLocaleDateString()}</p>
        </div>
      `,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };



  /**
   * Cambia el estado de una sede (Activo/Inactivo)
   */
  const handleToggleStatus = async (headquarter) => {
    const newStatus = headquarter.status === 'A' ? 'Inactivo' : 'Activo';
    const action = headquarter.status === 'A' ? 'desactivar' : 'activar';
    
    showAlert({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} sede?`,
      message: `¿Estás seguro de que deseas ${action} la sede "${headquarter.name}"?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          let response;
          if (headquarter.status === 'A') {
            response = await headquarterAdminService.deleteHeadquarter(headquarter.id);
          } else {
            response = await headquarterAdminService.restoreHeadquarter(headquarter.id);
          }
          
          if (response.success) {
            showSuccess(`Sede ${newStatus.toLowerCase()}`, `La sede ha sido ${newStatus.toLowerCase()} exitosamente`);
            loadHeadquarters();
          } else {
            showError('Error al cambiar estado', response.error);
          }
        } catch (error) {
          showError('Error de conexión', 'No se pudo cambiar el estado de la sede');
        }
      }
    });
  };

  /**
   * Restaura una sede eliminada
   */
  const handleRestore = async (headquarter) => {
    showAlert({
      title: '¿Restaurar sede?',
      message: `¿Estás seguro de que deseas restaurar la sede "${headquarter.name}"?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await headquarterAdminService.restoreHeadquarter(headquarter.id);
          
          if (response.success) {
            showSuccess('Sede restaurada', response.message);
            loadHeadquarters();
          } else {
            showError('Error al restaurar', response.error);
          }
        } catch (error) {
          showError('Error de conexión', 'No se pudo restaurar la sede');
        }
      }
    });
  };

  /**
   * Elimina múltiples sedes seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona sedes', 'Debes seleccionar al menos una sede para eliminar');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} sede(s)?`,
      message: 'Las sedes seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            try {
              const response = await headquarterAdminService.deleteHeadquarter(id);
              if (response.success) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} sede(s) eliminada(s)`, `Se eliminaron ${successCount} sedes exitosamente`);
          }
          
          if (errorCount > 0) {
            showError(`Error en ${errorCount} sede(s)`, `No se pudieron eliminar ${errorCount} sedes`);
          }

          setSelectedRowKeys([]);
          loadHeadquarters();
        } catch (error) {
          showError('Error de conexión', 'No se pudieron eliminar las sedes');
        }
      },
    });
  };

  /**
   * Regresa al listado de instituciones
   */
  const handleBack = () => {
    navigate('/admin/institution');
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
      title: 'Sede',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <small className="text-muted">
            {Array.isArray(record.modularCode) && record.modularCode.length > 0 
              ? `Códigos: ${record.modularCode.slice(0, 2).join(', ')}${record.modularCode.length > 2 ? '...' : ''}` 
              : 'Sin códigos modulares'}
          </small>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Dirección',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <div style={{ maxWidth: '200px' }}>
          <Tooltip title={text}>
            {text.length > 50 ? `${text.substring(0, 50)}...` : text}
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Códigos Modulares',
      dataIndex: 'modularCode',
      key: 'modularCode',
      render: (modularCode) => {
        // Manejar tanto arrays como strings JSON (compatibilidad)
        let codes = [];
        if (Array.isArray(modularCode)) {
          codes = modularCode;
        } else {
          try {
            codes = JSON.parse(modularCode || '[]');
          } catch (e) {
            return <span className="text-muted">Formato inválido</span>;
          }
        }
        
        if (codes.length === 0) {
          return <span className="text-muted">Sin códigos</span>;
        }
        
        return (
          <div>
            {codes.map((code, index) => (
              <Tag key={index} color="blue" className="mb-1">
                {code}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <div>
          <span>{phone || 'Sin teléfono'}</span>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'A' ? 'green' : 'red'}>
          {status === 'A' ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: 'A' },
        { text: 'Inactivo', value: 'I' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
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
            onClick: () => handleView(record),
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'toggle',
            label: record.status === 'A' ? 'Desactivar' : 'Activar',
            icon: record.status === 'A' ? <CloseOutlined /> : <CheckOutlined />,
            onClick: () => handleToggleStatus(record),
          },
          {
            type: 'divider',
          },
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
                  <h3 className="page-title">
                    Sedes {institution ? `- ${institution.name}` : ''}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/admin/institution">Instituciones</Link>
                    </li>
                    <li className="breadcrumb-item active">Sedes</li>
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
                          <h3>Lista de Sedes</h3>
                          <div className="doctor-search-blk">
                            <div className="add-group">
                        
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                className="me-2"
                              >
                                Agregar Sede
                              </Button>
                              <Dropdown
                                overlay={
                                  <Menu>
                                    <Menu.Item 
                                      key="csv" 
                                      icon={<i className="fas fa-file-csv"></i>}
                                      onClick={() => ExportUtils.exportHeadquartersToCSV(filteredHeadquarters, institution?.name)}
                                    >
                                      Exportar CSV
                                    </Menu.Item>
                                    <Menu.Item 
                                      key="pdf" 
                                      icon={<i className="fas fa-file-pdf"></i>}
                                      onClick={() => ExportUtils.exportHeadquartersToPDF(filteredHeadquarters, institution?.name)}
                                    >
                                      Exportar PDF
                                    </Menu.Item>
                                    <Menu.Item 
                                      key="excel" 
                                      icon={<i className="fas fa-file-excel"></i>}
                                      onClick={() => ExportUtils.exportHeadquartersToExcel(filteredHeadquarters, institution?.name)}
                                    >
                                      Exportar Excel
                                    </Menu.Item>
                                  </Menu>
                                }
                                trigger={['click']}
                              >
                                <Button icon={<DownloadOutlined />} className="me-2">
                                  Exportar
                                </Button>
                              </Dropdown>
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
                    <div className="col-md-6">
                      <Input
                        placeholder="Buscar por nombre, código, contacto, email o dirección"
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
                        onChange={(value) => setStatusFilter(value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value="A">Activo</Option>
                        <Option value="I">Inactivo</Option>
                      </Select>
                    </div>
                    <div className="col-md-3">
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
                      dataSource={filteredHeadquarters}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} sedes`,
                      }}
                      scroll={{ x: 1000 }}
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
      
      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default HeadquarterList;