/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import { StudentStatus, Gender, getStatusText, getStatusColor, formatBirthDate, calculateAge, formatDateTime, arrayToDate } from "../../../types/students/students";

// Suprimir warning de compatibilidad de Ant Design con React 19
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('antd: compatible')) return;
  originalWarn(...args);
};

const { Option } = Select;

const StudentList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [genderFilter, setGenderFilter] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Estados para modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    loadStudents();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [students, searchText, activeTab, genderFilter]);

  /**
   * Carga todos los estudiantes desde el servicio
   */
  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getAllStudents();
      if (response.success) {
        setStudents(response.data);
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setStudents([]);
      }
    } catch (error) {
      showError('Error al cargar los estudiantes');
      setStudents([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda, estado y género
   */
  const applyFilters = () => {
    let filtered = [...students];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName?.toLowerCase().includes(search) ||
        student.lastName?.toLowerCase().includes(search) ||
        student.documentNumber?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(search)
      );
    }

    // Filtro por estado (siempre filtra por el tab activo)
    filtered = filtered.filter(student => student.status === activeTab);

    // Filtro por género
    if (genderFilter !== 'all') {
      filtered = filtered.filter(student => student.gender === genderFilter);
    }

    setFilteredStudents(filtered);
  };

  /**
   * Navega al formulario de crear nuevo estudiante
   */
  const handleCreate = () => {
    navigate('/secretary/students/add');
  };

  /**
   * Navega al formulario de editar estudiante
   */
  const handleEdit = (student) => {
    navigate(`/secretary/students/edit/${student.id}`, { 
      state: { student } 
    });
  };

  /**
   * Muestra detalles del estudiante
   */
  const handleView = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  /**
   * Cierra el modal de detalles
   */
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  /**
   * Cambia el estado de un estudiante
   */
  const handleToggleStatus = async (student) => {
    const newStatus = student.status === StudentStatus.ACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE;
    const action = newStatus === StudentStatus.ACTIVE ? 'activar' : 'desactivar';
    
    showAlert({
      title: `¿Estás seguro de ${action} este estudiante?`,
      message: `Se ${action}á al estudiante "${student.firstName} ${student.lastName}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          let response;
          
          if (newStatus === StudentStatus.ACTIVE) {
            // Para activar, usar restoreStudent
            response = await studentService.restoreStudent(student.id);
          } else {
            // Para desactivar, usar deactivateStudent
            response = await studentService.deactivateStudent(student.id);
          }
          
          if (response.success) {
            showSuccess(`Estudiante ${action}do correctamente`);
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          console.error(`Error al ${action} estudiante:`, error);
          showError(`Error al ${action} el estudiante`);
        }
      },
    });
  };

  /**
   * Elimina un estudiante
   */
  const handleDelete = async (student) => {
    showAlert({
      title: '¿Eliminar este estudiante?',
      message: `Se eliminará al estudiante "${student.firstName} ${student.lastName}". Esta acción se puede revertir.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await studentService.deleteStudent(student.id);
          if (response.success) {
            showSuccess('Estudiante eliminado correctamente');
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar el estudiante');
        }
      },
    });
  };

  /**
   * Restaura un estudiante eliminado
   */
  const handleRestore = async (student) => {
    showAlert({
      title: '¿Restaurar este estudiante?',
      message: `Se restaurará al estudiante "${student.firstName} ${student.lastName}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await studentService.restoreStudent(student.id);
          if (response.success) {
            showSuccess('Estudiante restaurado correctamente');
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar el estudiante');
        }
      },
    });
  };

  /**
   * Elimina múltiples estudiantes seleccionados
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos un estudiante');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} estudiante(s)?`,
      message: 'Los estudiantes seleccionados serán eliminados. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await studentService.deleteStudent(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} estudiante(s) eliminado(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} estudiante(s)`);
          }

          setSelectedRowKeys([]);
          loadStudents();
        } catch (error) {
          showError('Error en la eliminación masiva');
        }
      },
    });
  };

  /**
   * Navega a la página de importación masiva de estudiantes
   */
  const handleBulkCreate = () => {
    navigate('/secretary/students/bulk-import');
  };

  /**
   * Exporta la lista de estudiantes actual a CSV
   */
  const handleExportStudents = async () => {
    try {
      // Importar dinámicamente la utilidad de exportación
      const { default: ExportUtils } = await import('../../../utils/students/exportUtils');
      
      // Usar los estudiantes filtrados actuales
      const dataToExport = filteredStudents.length > 0 ? filteredStudents : students;
      
      if (dataToExport.length === 0) {
        showWarning('No hay estudiantes para exportar');
        return;
      }

      ExportUtils.exportStudentsToCSV(dataToExport);
      showSuccess(`${dataToExport.length} estudiantes exportados exitosamente`);
    } catch (error) {
      console.error('Error al exportar estudiantes:', error);
      showError('Error al exportar los estudiantes');
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
      title: 'Estudiante',
      dataIndex: 'firstName',
      key: 'student',
      render: (text, record) => (
        <div>
          <strong>{record.firstName} {record.lastName}</strong>
          <br />
          <small className="text-muted">{record.documentType}: {record.documentNumber}</small>
        </div>
      ),
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Edad/Género',
      key: 'ageGender',
      render: (_, record) => {
        const age = calculateAge(record.birthDate);
        return (
          <div>
            <div>{age} años</div>
            <small className="text-muted">{record.gender === 'MALE' ? 'Masculino' : 'Femenino'}</small>
          </div>
        );
      },
      sorter: (a, b) => calculateAge(a.birthDate) - calculateAge(b.birthDate),
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><small>{record.email || 'Sin email'}</small></div>
          <div><small>{record.phone || 'Sin teléfono'}</small></div>
        </div>
      ),
    },
    {
      title: 'Apoderado',
      key: 'guardian',
      render: (_, record) => (
        <div>
          <div><small>{record.guardianName} {record.guardianLastName}</small></div>
          <div><small>{record.guardianPhone || 'Sin teléfono'}</small></div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date),
      sorter: (a, b) => {
        const dateA = arrayToDate(a.createdAt);
        const dateB = arrayToDate(b.createdAt);
        return dateA && dateB ? dateA - dateB : 0;
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
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'enrollments',
            label: 'Matrículas',
            icon: <UserOutlined />,
            onClick: () => navigate(`/secretary/students/${record.id}/enrollments`),
          },
          {
            key: 'toggle',
            label: record.status === StudentStatus.ACTIVE ? 'Desactivar' : 'Activar',
            icon: record.status === StudentStatus.ACTIVE ? <CloseOutlined /> : <CheckOutlined />,
            onClick: () => handleToggleStatus(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record),
            danger: true,
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
                  <h3 className="page-title">Gestión de Estudiantes</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Estudiantes</li>
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
                          placeholder="Buscar por nombre, documento, email..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Género"
                        value={genderFilter}
                        onChange={setGenderFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los géneros</Option>
                        <Option value={Gender.MALE}>Masculino</Option>
                        <Option value={Gender.FEMALE}>Femenino</Option>
                      </Select>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          className="btn-sm"
                        >
                          Nuevo Estudiante
                        </Button>
                        <Button
                          icon={<FileTextOutlined />}
                          onClick={handleBulkCreate}
                          className="btn-sm"
                        >
                          Importar Lote
                        </Button>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleExportStudents}
                          className="btn-sm"
                        >
                          Exportar
                        </Button>
                        <Button
                          icon={<UserOutlined />}
                          onClick={() => navigate('/secretary/enrollments')}
                          className="btn-sm"
                        >
                          Matrículas
                        </Button>
                        {selectedRowKeys.length > 0 && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDelete}
                            className="btn-sm"
                          >
                            Eliminar ({selectedRowKeys.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pestañas por estado */}
                  <div className="mb-3">
                    <ul className="nav nav-tabs nav-tabs-solid">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === StudentStatus.ACTIVE ? 'active' : ''}`}
                          onClick={() => setActiveTab(StudentStatus.ACTIVE)}
                          type="button"
                        >
                          <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          Activos
                          <Tag color="success" style={{ marginLeft: '8px' }}>
                            {students.filter(s => s.status === StudentStatus.ACTIVE).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === StudentStatus.INACTIVE ? 'active' : ''}`}
                          onClick={() => setActiveTab(StudentStatus.INACTIVE)}
                          type="button"
                        >
                          <CloseOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                          Inactivos
                          <Tag color="warning" style={{ marginLeft: '8px' }}>
                            {students.filter(s => s.status === StudentStatus.INACTIVE).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === StudentStatus.TRANSFERRED ? 'active' : ''}`}
                          onClick={() => setActiveTab(StudentStatus.TRANSFERRED)}
                          type="button"
                        >
                          <UndoOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          Transferidos
                          <Tag color="blue" style={{ marginLeft: '8px' }}>
                            {students.filter(s => s.status === StudentStatus.TRANSFERRED).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === StudentStatus.GRADUATED ? 'active' : ''}`}
                          onClick={() => setActiveTab(StudentStatus.GRADUATED)}
                          type="button"
                        >
                          <span style={{ marginRight: '8px' }}>🎓</span>
                          Graduados
                          <Tag color="purple" style={{ marginLeft: '8px' }}>
                            {students.filter(s => s.status === StudentStatus.GRADUATED).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === StudentStatus.DECEASED ? 'active' : ''}`}
                          onClick={() => setActiveTab(StudentStatus.DECEASED)}
                          type="button"
                        >
                          <DeleteOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                          Retirados
                          <Tag color="error" style={{ marginLeft: '8px' }}>
                            {students.filter(s => s.status === StudentStatus.DECEASED).length}
                          </Tag>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Tabla de estudiantes */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredStudents}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredStudents.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} estudiantes`,
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
      
      {/* Modal de Detalles del Estudiante */}
      {selectedStudent && (
        <div className={`modal fade ${showDetailsModal ? 'show' : ''}`} 
             style={{ display: showDetailsModal ? 'block' : 'none' }}
             id="student_details_modal" 
             tabIndex="-1" 
             role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Detalles del Estudiante
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseDetailsModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Información Personal */}
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          <UserOutlined style={{ marginRight: '6px' }} />
                          Información Personal
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row mb-2">
                          <div className="col-5"><strong>Nombres:</strong></div>
                          <div className="col-7">{selectedStudent.firstName}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Apellidos:</strong></div>
                          <div className="col-7">{selectedStudent.lastName}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Documento:</strong></div>
                          <div className="col-7">{selectedStudent.documentType}: {selectedStudent.documentNumber}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Fecha Nac.:</strong></div>
                          <div className="col-7">
                            {formatBirthDate(selectedStudent.birthDate)} 
                            <small className="text-muted"> ({calculateAge(selectedStudent.birthDate)} años)</small>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Género:</strong></div>
                          <div className="col-7">{selectedStudent.gender === 'MALE' ? 'Masculino' : 'Femenino'}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Estado:</strong></div>
                          <div className="col-7">
                            <Tag color={getStatusColor(selectedStudent.status)}>
                              {getStatusText(selectedStudent.status)}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          📍 Información de Contacto
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row mb-2">
                          <div className="col-4"><strong>Dirección:</strong></div>
                          <div className="col-8">{selectedStudent.address}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-4"><strong>Distrito:</strong></div>
                          <div className="col-8">{selectedStudent.district}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-4"><strong>Provincia:</strong></div>
                          <div className="col-8">{selectedStudent.province}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-4"><strong>Departamento:</strong></div>
                          <div className="col-8">{selectedStudent.department}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-4"><strong>Teléfono:</strong></div>
                          <div className="col-8">{selectedStudent.phone || <span className="text-muted">No registrado</span>}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-4"><strong>Email:</strong></div>
                          <div className="col-8">{selectedStudent.email || <span className="text-muted">No registrado</span>}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Apoderado */}
                  <div className="col-12 mt-3">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          👥 Información del Apoderado
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong>Nombres:</strong></div>
                              <div className="col-8">{selectedStudent.guardianName}</div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Apellidos:</strong></div>
                              <div className="col-8">{selectedStudent.guardianLastName}</div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Documento:</strong></div>
                              <div className="col-8">{selectedStudent.guardianDocumentType}: {selectedStudent.guardianDocumentNumber}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong>Relación:</strong></div>
                              <div className="col-8">{selectedStudent.guardianRelationship}</div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Teléfono:</strong></div>
                              <div className="col-8">{selectedStudent.guardianPhone || <span className="text-muted">No registrado</span>}</div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Email:</strong></div>
                              <div className="col-8">{selectedStudent.guardianEmail || <span className="text-muted">No registrado</span>}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Registro */}
                  <div className="col-12 mt-3">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          📅 Información de Registro
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong>Fecha Registro:</strong></div>
                              <div className="col-8">{formatDateTime(selectedStudent.createdAt)}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong>Última Actualización:</strong></div>
                              <div className="col-8">{formatDateTime(selectedStudent.updatedAt)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseDetailsModal}
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    handleCloseDetailsModal();
                    handleEdit(selectedStudent);
                  }}
                >
                  <EditOutlined style={{ marginRight: '6px' }} />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal */}
      {showDetailsModal && (
        <div 
          className="modal-backdrop fade show" 
          onClick={handleCloseDetailsModal}
        />
      )}
      
      {/* AlertModal para confirmaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default StudentList;