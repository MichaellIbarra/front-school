/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, EyeOutlined, HomeOutlined, DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import ExportUtils from "../../../utils/institutions/exportUtils";
import useAlert from "../../../hooks/useAlert";
import institutionAdminService from "../../../services/institutions/institutionAdminService";

const { Option } = Select;

const InstitutionList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);

  // Cargar instituciones al montar el componente
  useEffect(() => {
    loadInstitutions();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [institutions, searchText, statusFilter]);

  /**
   * Carga todas las instituciones desde el servicio
   */
  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const response = await institutionAdminService.getAllInstitutions();
      if (response.success) {
        setInstitutions(response.data);
        // Solo mostrar mensaje si viene del backend
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setInstitutions([]);
      }
    } catch (error) {
      showError('Error al cargar las instituciones');
      setInstitutions([]);
    }
    setLoading(false);
  };
  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...institutions];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(institution => 
        institution.name?.toLowerCase().includes(search) ||
        institution.codeInstitution?.toString().includes(search) ||
        institution.contactEmail?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(institution => institution.status === statusFilter);
    }

    setFilteredInstitutions(filtered);
  };

  /**
   * Navega al formulario de crear nueva institución
   */
  const handleCreate = () => {
    navigate('/admin/institution/add');
  };

  /**
   * Navega al formulario de editar institución
   */
  const handleEdit = (institution) => {
    navigate(`/admin/institution/edit/${institution.id}`, { 
      state: { institution } 
    });
  };

  /**
   * Muestra detalles de la institución
   */
  const handleView = (institution) => {
    const details = `
Código: ${institution.codeInstitution}
Dirección: ${institution.address}
Email: ${institution.contactEmail}
Teléfono: ${institution.contactPhone}
Estado: ${institution.status === 'A' ? 'Activo' : 'Inactivo'}
Creado: ${new Date(institution.createdAt).toLocaleDateString()}
    `.trim();

    showAlert({
      title: `Detalles de ${institution.name}`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Cambia el estado de una institución (Activo/Inactivo)
   */
  const handleToggleStatus = async (institution) => {
    const newStatus = institution.status === 'A' ? 'I' : 'A';
    const action = newStatus === 'A' ? 'activar' : 'desactivar';
    
    showAlert({
      title: `¿Estás seguro de ${action} esta institución?`,
      message: `Se ${action}á la institución "${institution.name}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          let response;
          
          if (newStatus === 'A') {
            response = await institutionAdminService.restoreInstitution(institution.id);
          } else {
            // Para desactivar, usar el método delete que hace soft delete
            response = await institutionAdminService.deleteInstitution(institution.id);
          }

          if (response.success) {
            showSuccess(`Institución ${action}da correctamente`);
            loadInstitutions();
          } else {
            showError(response.error || `Error al ${action} la institución`);
          }
        } catch (error) {
          console.error(`Error al ${action} institución:`, error);
          showError(`Error al ${action} la institución`);
        }
      },
    });
  };







  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Institución',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <small className="text-muted">Código: {record.codeInstitution}</small>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><small>{record.contactEmail}</small></div>
          <div><small>{record.contactPhone}</small></div>
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
            key: 'headquarters',
            label: 'Sedes',
            icon: <HomeOutlined />,
            onClick: () => navigate(`/admin/institution/${record.id}/headquarters`),
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
                  <h3 className="page-title">Gestión de Instituciones</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Instituciones</li>
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
                          placeholder="Buscar por nombre, código, email..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
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
                      </Select>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item 
                                key="csv" 
                                icon={<i className="fas fa-file-csv"></i>}
                                onClick={() => ExportUtils.exportInstitutionsToCSV(filteredInstitutions)}
                              >
                                Exportar CSV
                              </Menu.Item>
                              <Menu.Item 
                                key="pdf" 
                                icon={<i className="fas fa-file-pdf"></i>}
                                onClick={() => ExportUtils.exportInstitutionsToPDF(filteredInstitutions)}
                              >
                                Exportar PDF
                              </Menu.Item>
                              <Menu.Item 
                                key="excel" 
                                icon={<i className="fas fa-file-excel"></i>}
                                onClick={() => ExportUtils.exportInstitutionsToExcel(filteredInstitutions)}
                              >
                                Exportar Excel
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={['click']}
                        >
                          <Button icon={<DownloadOutlined />} className="btn-sm">
                            Exportar
                          </Button>
                        </Dropdown>
                        <Button
                          icon={<FileTextOutlined />}
                          onClick={() => navigate('/admin/institution/reports')}
                          className="btn-sm"
                        >
                          Reportes
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          className="btn-sm"
                        >
                          Nueva Institución
                        </Button>

                      </div>
                    </div>
                  </div>

                  {/* Tabla de instituciones */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredInstitutions}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredInstitutions.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} instituciones`,
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

export default InstitutionList;
