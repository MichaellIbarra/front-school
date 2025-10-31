/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined, IdcardOutlined, CalendarOutlined, ManOutlined, WomanOutlined, CheckCircleOutlined, HomeOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, HistoryOutlined, UnorderedListOutlined, FilePdfOutlined, FileExcelOutlined, PrinterOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import { Gender, getStatusText, getStatusColor, formatBirthDate, calculateAge, formatDateTime, arrayToDate } from "../../../types/students/students";

// Suprimir warning de compatibilidad de Ant Design con React 19
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('antd: compatible')) return;
  originalWarn(...args);
};

const { Option } = Select;

const StudentList = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [displayStudents, setDisplayStudents] = useState([]);
  const [currentView, setCurrentView] = useState('all'); // 'all', 'unenrolled', 'inactive', etc.
  
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
  }, [students, searchText, genderFilter]);

  /**
   * Carga todos los estudiantes desde el servicio
   */
  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentsByInstitution();
      if (response.success) {
        setStudents(response.data);
        setCurrentView('all');
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
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(search)
      );
    }

    // Filtro por género
    if (genderFilter !== 'all') {
      filtered = filtered.filter(student => student.gender === genderFilter);
    }

    setDisplayStudents(filtered);
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
      };  /**
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
   * Navega a la página de importación masiva de estudiantes
   */
  const handleBulkImport = () => {
    navigate('/secretary/students/bulk-import');
  };

  /**
   * Ver estudiantes no matriculados
   */
  const handleViewUnenrolledStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getUnenrolledStudents();
      if (response.success) {
        setStudents(response.data);
        setCurrentView('unenrolled');
        showSuccess(`${response.data.length} estudiantes no matriculados encontrados`);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al obtener estudiantes no matriculados');
    }
    setLoading(false);
  };

  /**
   * Ver estudiantes inactivos
   */
  const handleViewInactiveStudents = async () => {
    setLoading(true);
    try {
      console.log('Cargando estudiantes inactivos...'); // Debug
      const response = await studentService.getStudentsByStatus('INACTIVE');
      console.log('Respuesta estudiantes inactivos:', response); // Debug
      if (response.success) {
        setStudents(response.data);
        setCurrentView('inactive');
        showSuccess(`${response.data.length} estudiantes inactivos encontrados`);
      } else {
        console.error('Error en respuesta:', response.error); // Debug
        showError(response.error);
      }
    } catch (error) {
      console.error('Excepción al obtener estudiantes inactivos:', error); // Debug
      showError('Error al obtener estudiantes inactivos');
    }
    setLoading(false);
  };

  /**
   * Ver estadísticas de estudiantes
   */
  const handleViewStatistics = async () => {
    setLoading(true);
    try {
      const response = await studentService.getStudentStatistics();
      if (response.success) {
        // Mostrar estadísticas en un modal o navegar a una página de estadísticas
        setCurrentView('statistics');
        showSuccess('Estadísticas cargadas exitosamente');
        console.log('Estadísticas:', response.data);
        // Aquí podrías abrir un modal con las estadísticas o navegar a otra página
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al obtener estadísticas');
    }
    setLoading(false);
  };

  /**
   * Volver a la vista de todos los estudiantes
   */
  const handleViewAll = () => {
    loadStudents();
  };

  /**
   * Activar estudiante
   */
  const handleActivateStudent = async (studentId) => {
    try {
      const response = await studentService.activateStudent(studentId);
      if (response.success) {
        showSuccess(response.message);
        loadStudents(); // Recargar la lista
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al activar el estudiante');
    }
  };

  /**
   * Desactivar estudiante
   */
  const handleDeactivateStudent = async (studentId) => {
    try {
      const response = await studentService.deactivateStudent(studentId);
      if (response.success) {
        showSuccess(response.message);
        loadStudents(); // Recargar la lista
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al desactivar el estudiante');
    }
  };

  /**
   * Exporta la lista de estudiantes actual a CSV
   */
  const handleExportStudents = async () => {
    try {
      // Importar dinámicamente la utilidad de exportación
      const { default: ExportUtils } = await import('../../../utils/students/exportUtils');
      
      // Usar los estudiantes filtrados actuales
      const dataToExport = displayStudents.length > 0 ? displayStudents : students;
      
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

  /**
   * Maneja la exportación de reportes
   */
  const handleReportExport = async (exportType) => {
    try {
      // Importar dinámicamente la utilidad de reportes
      const { default: StudentReportExporter } = await import('../../../utils/students/studentReportExporter');
      
      // Usar los estudiantes filtrados actuales
      const dataToExport = displayStudents.length > 0 ? displayStudents : students;
      
      if (dataToExport.length === 0) {
        showWarning('No hay estudiantes para generar reporte');
        return;
      }

      let result;
      const institutionName = localStorage.getItem('institution_name') || '';

      switch (exportType) {
        case 'csv':
          result = StudentReportExporter.exportStudentsToCSV(dataToExport, institutionName);
          break;
        case 'pdf':
          result = StudentReportExporter.exportStudentsToPDF(dataToExport, institutionName);
          break;
        case 'active':
          result = StudentReportExporter.exportActiveStudents(dataToExport, institutionName);
          break;
        case 'inactive':
          result = StudentReportExporter.exportInactiveStudents(dataToExport, institutionName);
          break;
        case 'male':
          result = StudentReportExporter.exportStudentsByGender(dataToExport, 'MALE', institutionName);
          break;
        case 'female':
          result = StudentReportExporter.exportStudentsByGender(dataToExport, 'FEMALE', institutionName);
          break;
        default:
          result = StudentReportExporter.exportStudentsToPDF(dataToExport, institutionName);
      }

      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      showError('Error al generar el reporte de estudiantes');
    }
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
      sorter: (a, b) => calculateAge(b.birthDate) - calculateAge(a.birthDate),
    },
    {
      title: 'Teléfono',
      key: 'phone',
      render: (_, record) => (
        <div>
          <div>{record.phone || 'Sin teléfono'}</div>
        </div>
      ),
    },
    {
      title: 'Apoderado',
      key: 'guardian',
      render: (_, record) => (
        <div>
          <div>{record.parentName}</div>
          <div><small>{record.parentPhone || 'Sin teléfono'}</small></div>
          <div><small>{record.parentEmail || 'Sin email'}</small></div>
        </div>
      ),
    },
    {
      title: 'Dirección',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <small>{address || 'Sin dirección'}</small>
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
            type: 'divider',
          },
          ...(record.status === 'ACTIVE' ? [
            {
              key: 'deactivate',
              label: 'Desactivar',
              icon: <CloseOutlined />,
              onClick: () => handleDeactivateStudent(record.id),
              style: { color: '#ff4d4f' }
            }
          ] : [
            {
              key: 'activate',
              label: 'Activar',
              icon: <CheckOutlined />,
              onClick: () => handleActivateStudent(record.id),
              style: { color: '#52c41a' }
            }
          ])
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
                    Gestión de Estudiantes
                    {currentView === 'unenrolled' && <span style={{color: '#1890ff', marginLeft: '10px'}}> - No Matriculados</span>}
                    {currentView === 'inactive' && <span style={{color: '#1890ff', marginLeft: '10px'}}> - Inactivos</span>}
                    {currentView === 'statistics' && <span style={{color: '#1890ff', marginLeft: '10px'}}> - Estadísticas</span>}
                  </h3>
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
                    <div className="col-lg-2 col-md-3 col-sm-12 mb-2">
                      <Select
                        placeholder="Estado"
                        value={genderFilter}
                        onChange={setGenderFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los géneros</Option>
                        <Option value="MALE">Masculino</Option>
                        <Option value="FEMALE">Femenino</Option>
                      </Select>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex gap-2 flex-wrap justify-content-end">
                        <Button
                          type={currentView === 'all' ? 'primary' : 'default'}
                          icon={<UnorderedListOutlined />}
                          onClick={handleViewAll}
                        >
                          Todas
                        </Button>
                        <Button
                          type={currentView === 'unenrolled' ? 'primary' : 'default'}
                          icon={<UserOutlined />}
                          onClick={handleViewUnenrolledStudents}
                        >
                          No Matriculados
                        </Button>
                        <Button
                          type={currentView === 'inactive' ? 'primary' : 'default'}
                          icon={<CloseOutlined />}
                          onClick={handleViewInactiveStudents}
                        >
                          Inactivos
                        </Button>
                        <Button
                          type={currentView === 'statistics' ? 'primary' : 'default'}
                          icon={<FileTextOutlined />}
                          onClick={handleViewStatistics}
                        >
                          Estadísticas
                        </Button>
                        <Button
                          type="default"
                          icon={<DownloadOutlined />}
                          onClick={handleBulkImport}
                        >
                          Importar Masivo
                        </Button>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'csv',
                                label: 'Exportar CSV',
                                icon: <FileExcelOutlined />,
                                onClick: () => handleReportExport('csv'),
                              },
                              {
                                key: 'pdf',
                                label: 'Reporte PDF',
                                icon: <FilePdfOutlined />,
                                onClick: () => handleReportExport('pdf'),
                              },
                              { type: 'divider' },
                              {
                                key: 'active',
                                label: 'Solo Activos',
                                icon: <CheckOutlined />,
                                onClick: () => handleReportExport('active'),
                              },
                              {
                                key: 'inactive',
                                label: 'Solo Inactivos',
                                icon: <CloseOutlined />,
                                onClick: () => handleReportExport('inactive'),
                              },
                              { type: 'divider' },
                              {
                                key: 'male',
                                label: 'Solo Masculino',
                                icon: <ManOutlined />,
                                onClick: () => handleReportExport('male'),
                              },
                              {
                                key: 'female',
                                label: 'Solo Femenino',
                                icon: <WomanOutlined />,
                                onClick: () => handleReportExport('female'),
                              },
                            ],
                          }}
                          trigger={['click']}
                        >
                          <Button
                            type="default"
                            icon={<PrinterOutlined />}
                          >
                            Reportes
                          </Button>
                        </Dropdown>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                        >
                          Nuevo Estudiante
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de estudiantes */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={displayStudents}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: displayStudents.length,
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
                          <div className="col-5"><strong><UserOutlined /> Nombres:</strong></div>
                          <div className="col-7">{selectedStudent.firstName}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong><UserOutlined /> Apellidos:</strong></div>
                          <div className="col-7">{selectedStudent.lastName}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong><IdcardOutlined /> Documento:</strong></div>
                          <div className="col-7">{selectedStudent.documentType}: {selectedStudent.documentNumber}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong><CalendarOutlined /> Fecha Nac.:</strong></div>
                          <div className="col-7">
                            {formatBirthDate(selectedStudent.birthDate)} 
                            <small className="text-muted"> ({calculateAge(selectedStudent.birthDate)} años)</small>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>{selectedStudent.gender === 'MALE' ? <ManOutlined /> : <WomanOutlined />} Género:</strong></div>
                          <div className="col-7">{selectedStudent.gender === 'MALE' ? 'Masculino' : 'Femenino'}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong><CheckCircleOutlined /> Estado:</strong></div>
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
                          <div className="col-4"><strong><HomeOutlined /> Dirección:</strong></div>
                          <div className="col-8">{selectedStudent.address}</div>
                        </div>
                        {selectedStudent.district && (
                          <div className="row mb-2">
                            <div className="col-4"><strong><EnvironmentOutlined /> Distrito:</strong></div>
                            <div className="col-8">{selectedStudent.district}</div>
                          </div>
                        )}
                        {selectedStudent.province && (
                          <div className="row mb-2">
                            <div className="col-4"><strong><EnvironmentOutlined /> Provincia:</strong></div>
                            <div className="col-8">{selectedStudent.province}</div>
                          </div>
                        )}
                        {selectedStudent.department && (
                          <div className="row mb-2">
                            <div className="col-4"><strong><EnvironmentOutlined /> Departamento:</strong></div>
                            <div className="col-8">{selectedStudent.department}</div>
                          </div>
                        )}
                        <div className="row mb-2">
                          <div className="col-4"><strong><PhoneOutlined /> Teléfono:</strong></div>
                          <div className="col-8">{selectedStudent.phone || <span className="text-muted">No registrado</span>}</div>
                        </div>
                        {selectedStudent.email && (
                          <div className="row mb-2">
                            <div className="col-4"><strong><MailOutlined /> Email:</strong></div>
                            <div className="col-8">{selectedStudent.email}</div>
                          </div>
                        )}
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
                              <div className="col-4"><strong><UserOutlined /> Nombre:</strong></div>
                              <div className="col-8">{selectedStudent.parentName}</div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong><PhoneOutlined /> Teléfono:</strong></div>
                              <div className="col-8">{selectedStudent.parentPhone || <span className="text-muted">No registrado</span>}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong><MailOutlined /> Email:</strong></div>
                              <div className="col-8">{selectedStudent.parentEmail || <span className="text-muted">No registrado</span>}</div>
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
                              <div className="col-4"><strong><ClockCircleOutlined /> Fecha Registro:</strong></div>
                              <div className="col-8">{formatDateTime(selectedStudent.createdAt)}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong><HistoryOutlined /> Última Actualización:</strong></div>
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
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default StudentList;