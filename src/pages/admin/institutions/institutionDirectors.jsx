/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Card, Breadcrumb } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import institutionService from "../../../services/institutions/institutionService";
import { formatDirectorFullName, getDirectorStatusColor, DirectorStatusLabels, DirectorPasswordStatusLabels, getDirectorPasswordStatusColor } from "../../../types/institutions";

const { Option } = Select;

const InstitutionDirectorsList = () => {
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [directors, setDirectors] = useState([]);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredDirectors, setFilteredDirectors] = useState([]);

  // Cargar directores al montar el componente
  useEffect(() => {
    if (institutionId) {
      loadDirectors();
      loadInstitutionInfo();
    }
  }, [institutionId]);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [directors, searchText, statusFilter]);

  /**
   * Carga información básica de la institución
   */
  const loadInstitutionInfo = async () => {
    try {
      const response = await institutionService.getInstitutionById(institutionId);
      if (response.success) {
        setInstitutionInfo(response.data);
      }
    } catch (error) {
      console.error('Error al cargar información de la institución:', error);
    }
  };

  /**
   * Carga todos los directores de la institución desde el servicio
   */
  const loadDirectors = async () => {
    setLoading(true);
    try {
      const response = await institutionService.getDirectorsByInstitutionId(institutionId);
      if (response.success) {
        setDirectors(response.data);
      } else {
        showError('Error al cargar directores', response.error);
      }
    } catch (error) {
      console.error('Error al cargar directores:', error);
      showError('Error', 'Error al cargar los directores');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...directors];

    // Filtro por texto de búsqueda
    if (searchText) {
      filtered = filtered.filter(director => {
        const searchTerm = searchText.toLowerCase();
        const fullName = formatDirectorFullName(director).toLowerCase();
        const email = director.userDetails?.email?.toLowerCase() || '';
        const username = director.userDetails?.username?.toLowerCase() || '';
        const documentNumber = director.userDetails?.documentNumber?.toLowerCase() || '';
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               username.includes(searchTerm) ||
               documentNumber.includes(searchTerm);
      });
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(director => director.status === statusFilter);
    }

    setFilteredDirectors(filtered);
  };

  /**
   * Navega al formulario de asignar nuevo director
   */
  const handleCreate = () => {
    navigate(`/admin/institution/${institutionId}/directors/add`);
  };

  /**
   * Muestra detalles del director
   */
  const handleView = (director) => {
    const userDetails = director.userDetails || {};
    const assignment = director.institutionAssignments?.[0] || {};
    
    showAlert({
      title: 'Detalles del Director',
      message: (
        <div className="director-details">
          <p><strong>Nombre Completo:</strong> {formatDirectorFullName(director)}</p>
          <p><strong>Usuario:</strong> {userDetails.username}</p>
          <p><strong>Email:</strong> {userDetails.email}</p>
          <p><strong>Documento:</strong> {userDetails.documentType} - {userDetails.documentNumber}</p>
          <p><strong>Teléfono:</strong> {userDetails.phone || 'No especificado'}</p>
          <p><strong>Estado:</strong> {DirectorStatusLabels[director.status] || director.status}</p>
          <p><strong>Estado de Contraseña:</strong> {DirectorPasswordStatusLabels[userDetails.passwordStatus] || userDetails.passwordStatus}</p>
          <p><strong>Fecha de Asignación:</strong> {assignment.assignmentDate ? new Date(assignment.assignmentDate).toLocaleDateString() : 'No especificada'}</p>
          <p><strong>Fecha de Creación:</strong> {director.createdAt ? new Date(director.createdAt).toLocaleDateString() : 'No especificada'}</p>
        </div>
      ),
      type: 'info',
      showCancel: false
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
      title: 'Director',
      key: 'director',
      render: (_, record) => {
        const userDetails = record.userDetails || {};
        return (
          <div>
            <strong>{formatDirectorFullName(record)}</strong>
            <br />
            <small className="text-muted">Usuario: {userDetails.username}</small>
          </div>
        );
      },
      sorter: (a, b) => formatDirectorFullName(a).localeCompare(formatDirectorFullName(b)),
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.userDetails?.email || 'No especificado',
      sorter: (a, b) => (a.userDetails?.email || '').localeCompare(b.userDetails?.email || ''),
    },
    {
      title: 'Documento',
      key: 'document',
      render: (_, record) => {
        const userDetails = record.userDetails || {};
        return (
          <div>
            <div>{userDetails.documentType || 'No especificado'}</div>
            <small className="text-muted">{userDetails.documentNumber || 'No especificado'}</small>
          </div>
        );
      },
    },
    {
      title: 'Teléfono',
      key: 'phone',
      render: (_, record) => record.userDetails?.phone || 'No especificado',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getDirectorStatusColor(status)}>
          {DirectorStatusLabels[status] || status}
        </Tag>
      ),
      filters: [
        { text: 'Activo', value: 'A' },
        { text: 'Inactivo', value: 'I' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha de Asignación',
      key: 'assignmentDate',
      render: (_, record) => {
        const assignment = record.institutionAssignments?.[0];
        return assignment?.assignmentDate 
          ? new Date(assignment.assignmentDate).toLocaleDateString() 
          : 'No especificada';
      },
      sorter: (a, b) => {
        const dateA = a.institutionAssignments?.[0]?.assignmentDate;
        const dateB = b.institutionAssignments?.[0]?.assignmentDate;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
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
            onClick: () => handleView(record),
          }
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
        <div className="content container-fluid">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <Breadcrumb className="breadcrumb">
                    <Breadcrumb.Item>
                      <Link to="/admin/institution">Instituciones</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                      {institutionInfo?.name || 'Institución'}
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Directores</Breadcrumb.Item>
                  </Breadcrumb>
                  <h3 className="page-title">
                    Directores de {institutionInfo?.name || 'la Institución'}
                  </h3>
                  <p className="mb-0">
                    Gestiona los directores asignados a esta institución
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="row">
            <div className="col-md-12">
              <Card>
                <div className="table-top">
                  <div className="search-set">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Button 
                          type="default" 
                          icon={<ArrowLeftOutlined />}
                          onClick={handleBack}
                          className="me-2"
                        >
                          Volver
                        </Button>
                        
                        <Input
                          placeholder="Buscar por nombre, email, usuario o documento..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: 350 }}
                          className="me-2"
                        />
                        
                        <Select
                          placeholder="Estado"
                          value={statusFilter}
                          onChange={setStatusFilter}
                          style={{ width: 120 }}
                          className="me-2"
                        >
                          <Option value="all">Todos</Option>
                          <Option value="A">Activo</Option>
                          <Option value="I">Inactivo</Option>
                        </Select>
                      </div>
                      
                      <div>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                        >
                          Asignar Director
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de directores */}
                <Table
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={filteredDirectors}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: filteredDirectors.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} de ${total} directores`,
                  }}
                  scroll={{ x: 1200 }}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar id="menu-item12" id1="menu-items12" activeClassName="institutions" />
      <Header />
      
      {/* Modal de alerta */}
      <AlertModal
        alert={alertState}
        onConfirm={alertConfirm}
        onCancel={alertCancel}
      />
    </>
  );
};

export default InstitutionDirectorsList;