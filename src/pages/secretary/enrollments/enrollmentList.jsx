/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import BulkEnrollmentModal from "./BulkEnrollmentModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import { EnrollmentStatus, getEnrollmentStatusText, getEnrollmentStatusColor, formatEnrollmentDate, formatDateTime, arrayToDate } from "../../../types/enrollments/enrollments";

const { Option } = Select;

const EnrollmentList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState(EnrollmentStatus.ACTIVE);
  const [classroomFilter, setClassroomFilter] = useState('all');
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // Estados para modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  
  // Estados para modal de matrícula masiva
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Cargar matrículas al montar el componente
  useEffect(() => {
    loadEnrollments();
    loadStatistics();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [enrollments, searchText, activeTab, classroomFilter]);

  /**
   * Carga todas las matrículas desde el servicio y enriquece con datos reales de estudiantes
   */
  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const response = await enrollmentService.getAllEnrollments();
      if (response.success) {
        // Enriquecer con datos reales de estudiantes
        const enrichedEnrollments = await enrichWithRealStudentData(response.data);
        setEnrollments(enrichedEnrollments);
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setEnrollments([]);
      }
    } catch (error) {
      showError('Error al cargar las matrículas');
      setEnrollments([]);
    }
    setLoading(false);
  };

  /**
   * Enriquece las matrículas con datos reales de estudiantes de forma eficiente
   */
  const enrichWithRealStudentData = async (enrollments) => {
    try {
      // Obtener IDs únicos de estudiantes
      const studentIds = [...new Set(enrollments.map(e => e.studentId).filter(Boolean))];
      
      if (studentIds.length === 0) {
        console.log('⚠️ No hay IDs de estudiantes para cargar');
        return enrollments;
      }

      console.log(`🔄 Iniciando carga de ${studentIds.length} estudiantes únicos...`);
      
      // Cargar estudiantes
      const studentsResponse = await studentService.getStudentsByIds(studentIds);
      
      // Crear mapa de estudiantes por ID
      const studentsMap = new Map();
      
      if (studentsResponse.success && studentsResponse.data) {
        studentsResponse.data.forEach(student => {
          if (student && student.id) {
            studentsMap.set(student.id, student);
          }
        });
        console.log(`✅ ${studentsMap.size} estudiantes mapeados correctamente`);
      } else {
        console.error('❌ Error en respuesta de estudiantes:', studentsResponse.error);
      }
      
      // Enriquecer matrículas con datos de estudiantes
      const enrichedEnrollments = enrollments.map(enrollment => {
        const student = studentsMap.get(enrollment.studentId);
        return {
          ...enrollment,
          student: student || null
        };
      });
      
      // Mostrar estadísticas
      const withStudentData = enrichedEnrollments.filter(e => e.student).length;
      const withoutStudentData = enrichedEnrollments.length - withStudentData;
      
      console.log(`📊 Estadísticas: ${withStudentData} con datos, ${withoutStudentData} sin datos`);
      
      return enrichedEnrollments;
      
    } catch (error) {
      console.error('💥 Error al enriquecer con datos de estudiantes:', error);
      return enrollments; // Devolver datos originales si falla
    }
  };

  /**
   * Carga estadísticas de matrículas
   */
  const loadStatistics = async () => {
    try {
      const response = await enrollmentService.getEnrollmentDistribution();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  /**
   * Aplica filtros de búsqueda, estado y aula
   */
  const applyFilters = () => {
    let filtered = [...enrollments];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(enrollment => {
        // Buscar en campos básicos
        const basicMatch = enrollment.enrollmentNumber?.toLowerCase().includes(search) ||
                          enrollment.classroomId?.toLowerCase().includes(search) ||
                          enrollment.studentId?.toLowerCase().includes(search);
        
        // Buscar en datos reales del estudiante si están disponibles
        let studentMatch = false;
        if (enrollment.student) {
          studentMatch = enrollment.student.firstName?.toLowerCase().includes(search) ||
                        enrollment.student.lastName?.toLowerCase().includes(search) ||
                        enrollment.student.documentNumber?.toLowerCase().includes(search) ||
                        enrollment.student.email?.toLowerCase().includes(search);
        }
        
        return basicMatch || studentMatch;
      });
    }

    // Filtro por estado (siempre filtra por el tab activo)
    filtered = filtered.filter(enrollment => enrollment.status === activeTab);

    // Filtro por aula
    if (classroomFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.classroomId === classroomFilter);
    }

    setFilteredEnrollments(filtered);
  };

  /**
   * Navega al formulario de crear nueva matrícula
   */
  const handleCreate = () => {
    navigate('/secretary/enrollments/add');
  };

  /**
   * Abre el modal de matrícula masiva
   */
  const handleBulkEnrollment = () => {
    setShowBulkModal(true);
  };

  /**
   * Cierra el modal de matrícula masiva
   */
  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
  };

  /**
   * Maneja el éxito de la matrícula masiva
   */
  const handleBulkEnrollmentSuccess = () => {
    loadEnrollments(); // Recargar la lista
    loadStatistics(); // Recargar estadísticas
  };

  /**
   * Navega al formulario de editar matrícula
   */
  const handleEdit = (enrollment) => {
    navigate(`/secretary/enrollments/edit/${enrollment.id}`, { 
      state: { enrollment } 
    });
  };

  /**
   * Muestra detalles de la matrícula
   */
  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDetailsModal(true);
  };

  /**
   * Cierra el modal de detalles
   */
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEnrollment(null);
  };

  /**
   * Cambia el estado de una matrícula
   */
  const handleChangeStatus = (enrollment, newStatus) => {
    const statusText = getEnrollmentStatusText(newStatus);
    
    showAlert({
      title: `¿Cambiar estado a ${statusText}?`,
      message: `Se cambiará el estado de la matrícula "${enrollment.enrollmentNumber}" a ${statusText}`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.updateEnrollmentStatus(enrollment.id, newStatus);
          if (response.success) {
            showSuccess(`Estado actualizado a ${statusText} correctamente`);
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al actualizar el estado');
        }
      },
    });
  };

  /**
   * Elimina una matrícula
   */
  const handleDelete = async (enrollment) => {
    showAlert({
      title: '¿Eliminar esta matrícula?',
      message: `Se eliminará la matrícula "${enrollment.enrollmentNumber}". Esta acción se puede revertir.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.deleteEnrollment(enrollment.id);
          if (response.success) {
            showSuccess('Matrícula eliminada correctamente');
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar la matrícula');
        }
      },
    });
  };

  /**
   * Restaura una matrícula eliminada
   */
  const handleRestore = async (enrollment) => {
    showAlert({
      title: '¿Restaurar esta matrícula?',
      message: `Se restaurará la matrícula "${enrollment.enrollmentNumber}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.restoreEnrollment(enrollment.id);
          if (response.success) {
            showSuccess('Matrícula restaurada correctamente');
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar la matrícula');
        }
      },
    });
  };

  /**
   * Elimina múltiples matrículas seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una matrícula');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} matrícula(s)?`,
      message: 'Las matrículas seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await enrollmentService.deleteEnrollment(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} matrícula(s) eliminada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} matrícula(s)`);
          }

          setSelectedRowKeys([]);
          loadEnrollments();
        } catch (error) {
          showError('Error en la eliminación masiva');
        }
      },
    });
  };

  /**
   * Exporta la lista de matrículas actual a CSV
   */
  const handleExportEnrollments = async () => {
    try {
      // Importar dinámicamente la utilidad de exportación
      const { default: EnrollmentExportUtils } = await import('../../../utils/enrollments/exportUtils');
      
      // Usar las matrículas filtradas actuales
      const dataToExport = filteredEnrollments.length > 0 ? filteredEnrollments : enrollments;
      
      if (dataToExport.length === 0) {
        showWarning('No hay matrículas para exportar');
        return;
      }

      EnrollmentExportUtils.exportEnrollmentsToCSV(dataToExport);
      showSuccess(`${dataToExport.length} matrículas exportadas exitosamente`);
    } catch (error) {
      console.error('Error al exportar matrículas:', error);
      showError('Error al exportar las matrículas');
    }
  };

  /**
   * Muestra estadísticas de matrículas por aula
   */
  const handleViewAnalytics = () => {
    if (!statistics) {
      showWarning('No hay estadísticas disponibles');
      return;
    }

    const analyticsText = Object.entries(statistics)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    showAlert({
      title: 'Estadísticas de Matrículas',
      message: `Distribución de Matrículas:\n\n${analyticsText}`,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Obtiene las aulas únicas para el filtro
   */
  const getUniqueClassrooms = () => {
    const classrooms = [...new Set(enrollments.map(e => e.classroomId))].filter(Boolean);
    return classrooms.sort();
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
      title: 'Número de Matrícula',
      dataIndex: 'enrollmentNumber',
      key: 'enrollmentNumber',
      sorter: (a, b) => a.enrollmentNumber.localeCompare(b.enrollmentNumber),
    },
    {
      title: 'Estudiante',
      dataIndex: 'student',
      key: 'student',
      render: (student, record) => {
        // Si tenemos datos reales del estudiante
        if (student) {
          return (
            <div>
              <div className="fw-bold text-primary">
                {student.firstName} {student.lastName}
              </div>
              <small className="text-muted">
                {student.documentType}: {student.documentNumber}
              </small>
            </div>
          );
        }
        
        // Fallback si no se pudieron cargar los datos reales
        return (
          <div>
            <div className="text-danger fw-bold">
              ⚠️ Estudiante no encontrado
            </div>
            <small className="text-muted">
              ID: {record.studentId?.slice(0, 8)}...{record.studentId?.slice(-4)}
            </small>
            <br/>
            <small className="text-warning">
              <i className="fas fa-unlink me-1"></i>
              Referencia rota
            </small>
          </div>
        );
      },
      sorter: (a, b) => {
        const getStudentName = (record) => {
          if (record.student) {
            return `${record.student.firstName} ${record.student.lastName}`;
          }
          return record.studentId || '';
        };
        
        return getStudentName(a).localeCompare(getStudentName(b));
      },
    },
    {
      title: 'Aula',
      dataIndex: 'classroomId',
      key: 'classroomId',
      render: (classroomId) => (
        <div>
          <small>{classroomId}</small>
        </div>
      ),
    },
    {
      title: 'Fecha de Matrícula',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      render: (date) => formatEnrollmentDate(date),
      sorter: (a, b) => {
        const dateA = arrayToDate(a.enrollmentDate);
        const dateB = arrayToDate(b.enrollmentDate);
        return dateA && dateB ? dateA - dateB : 0;
      },
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getEnrollmentStatusColor(status)}>
          {getEnrollmentStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'Activa', value: EnrollmentStatus.ACTIVE },
        { text: 'Inactiva', value: EnrollmentStatus.INACTIVE },
        { text: 'Completada', value: EnrollmentStatus.COMPLETED },
        { text: 'Transferida', value: EnrollmentStatus.TRANSFERRED },
        { text: 'Retirada', value: EnrollmentStatus.WITHDRAWN },
        { text: 'Suspendida', value: EnrollmentStatus.SUSPENDED },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha Creación',
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
            type: 'divider',
          },
          {
            key: 'active',
            label: 'Marcar como Activa',
            icon: <CheckOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.ACTIVE),
            disabled: record.status === EnrollmentStatus.ACTIVE,
          },
          {
            key: 'completed',
            label: 'Marcar como Completada',
            icon: <CheckOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.COMPLETED),
            disabled: record.status === EnrollmentStatus.COMPLETED,
          },
          {
            key: 'cancelled',
            label: 'Cancelar',
            icon: <CloseOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.CANCELLED),
            disabled: record.status === EnrollmentStatus.CANCELLED,
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
                  <h3 className="page-title">Gestión de Matrículas</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Matrículas</li>
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
                          placeholder="Buscar por número, nombre del estudiante, documento, aula..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Aula"
                        value={classroomFilter}
                        onChange={setClassroomFilter}
                        className="w-100"
                      >
                        <Option value="all">Todas las aulas</Option>
                        {getUniqueClassrooms().map(classroom => (
                          <Option key={classroom} value={classroom}>{classroom}</Option>
                        ))}
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
                          Nueva Matrícula
                        </Button>
                        <Button
                          type="primary"
                          icon={<UsergroupAddOutlined />}
                          onClick={handleBulkEnrollment}
                          className="btn-sm"
                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                          Matrícula Masiva
                        </Button>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleExportEnrollments}
                          className="btn-sm"
                        >
                          Exportar
                        </Button>
                        <Button
                          icon={<FileTextOutlined />}
                          onClick={handleViewAnalytics}
                          className="btn-sm"
                        >
                          Analytics
                        </Button>
                        <Button
                          icon={<UserOutlined />}
                          onClick={() => navigate('/secretary/students')}
                          className="btn-sm"
                        >
                          Estudiantes
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
                          className={`nav-link ${activeTab === EnrollmentStatus.ACTIVE ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.ACTIVE)}
                          type="button"
                        >
                          <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          Activas
                          <Tag color="success" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === EnrollmentStatus.INACTIVE ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.INACTIVE)}
                          type="button"
                        >
                          <CloseOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                          Inactivas
                          <Tag color="error" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.INACTIVE).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === EnrollmentStatus.COMPLETED ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.COMPLETED)}
                          type="button"
                        >
                          <span style={{ marginRight: '8px' }}>✅</span>
                          Completadas
                          <Tag color="blue" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === EnrollmentStatus.TRANSFERRED ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.TRANSFERRED)}
                          type="button"
                        >
                          <UndoOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
                          Transferidas
                          <Tag color="purple" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.TRANSFERRED).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === EnrollmentStatus.WITHDRAWN ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.WITHDRAWN)}
                          type="button"
                        >
                          <span style={{ marginRight: '8px' }}>📤</span>
                          Retiradas
                          <Tag color="orange" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.WITHDRAWN).length}
                          </Tag>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === EnrollmentStatus.SUSPENDED ? 'active' : ''}`}
                          onClick={() => setActiveTab(EnrollmentStatus.SUSPENDED)}
                          type="button"
                        >
                          <span style={{ marginRight: '8px' }}>⏸️</span>
                          Suspendidas
                          <Tag color="volcano" style={{ marginLeft: '8px' }}>
                            {enrollments.filter(e => e.status === EnrollmentStatus.SUSPENDED).length}
                          </Tag>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Tabla de matrículas */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredEnrollments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredEnrollments.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} matrículas`,
                      }}
                      scroll={{ x: 1000 }}
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
      
      {/* Modal de Detalles de la Matrícula */}
      {selectedEnrollment && (
        <div className={`modal fade ${showDetailsModal ? 'show' : ''}`} 
             style={{ display: showDetailsModal ? 'block' : 'none' }}
             id="enrollment_details_modal" 
             tabIndex="-1" 
             role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FileTextOutlined style={{ marginRight: '8px' }} />
                  Detalles de la Matrícula
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
                  {/* Información de la Matrícula */}
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          📋 Información de Matrícula
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row mb-2">
                          <div className="col-5"><strong>N° Matrícula:</strong></div>
                          <div className="col-7">
                            <span className="badge bg-primary">{selectedEnrollment.enrollmentNumber}</span>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Fecha Matrícula:</strong></div>
                          <div className="col-7">{formatEnrollmentDate(selectedEnrollment.enrollmentDate)}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Aula:</strong></div>
                          <div className="col-7">
                            <span className="badge bg-info">{selectedEnrollment.classroomId}</span>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-5"><strong>Estado:</strong></div>
                          <div className="col-7">
                            <Tag color={getEnrollmentStatusColor(selectedEnrollment.status)}>
                              {getEnrollmentStatusText(selectedEnrollment.status)}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Estudiante */}
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="card-title mb-0">
                          <UserOutlined style={{ marginRight: '6px' }} />
                          Información del Estudiante
                        </h6>
                      </div>
                      <div className="card-body">
                        {selectedEnrollment.student ? (
                          <>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Nombre:</strong></div>
                              <div className="col-8">
                                {selectedEnrollment.student.firstName} {selectedEnrollment.student.lastName}
                              </div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Documento:</strong></div>
                              <div className="col-8">
                                {selectedEnrollment.student.documentType}: {selectedEnrollment.student.documentNumber}
                              </div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Email:</strong></div>
                              <div className="col-8">
                                {selectedEnrollment.student.email || <span className="text-muted">No registrado</span>}
                              </div>
                            </div>
                            <div className="row mb-2">
                              <div className="col-4"><strong>Teléfono:</strong></div>
                              <div className="col-8">
                                {selectedEnrollment.student.phone || <span className="text-muted">No registrado</span>}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-muted">
                            <p>ID: {selectedEnrollment.studentId}</p>
                            <small>Información del estudiante no disponible</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información del Apoderado */}
                  {selectedEnrollment.student && (
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
                                <div className="col-4"><strong>Nombre:</strong></div>
                                <div className="col-8">
                                  {selectedEnrollment.student.guardianName} {selectedEnrollment.student.guardianLastName}
                                </div>
                              </div>
                              <div className="row mb-2">
                                <div className="col-4"><strong>Documento:</strong></div>
                                <div className="col-8">
                                  {selectedEnrollment.student.guardianDocumentType}: {selectedEnrollment.student.guardianDocumentNumber}
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="row mb-2">
                                <div className="col-4"><strong>Relación:</strong></div>
                                <div className="col-8">{selectedEnrollment.student.guardianRelationship}</div>
                              </div>
                              <div className="row mb-2">
                                <div className="col-4"><strong>Teléfono:</strong></div>
                                <div className="col-8">
                                  {selectedEnrollment.student.guardianPhone || <span className="text-muted">No registrado</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                              <div className="col-4"><strong>Fecha Creación:</strong></div>
                              <div className="col-8">{formatDateTime(selectedEnrollment.createdAt)}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row mb-2">
                              <div className="col-4"><strong>Última Actualización:</strong></div>
                              <div className="col-8">{formatDateTime(selectedEnrollment.updatedAt)}</div>
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
                    handleEdit(selectedEnrollment);
                  }}
                >
                  <EditOutlined style={{ marginRight: '6px' }} />
                  Editar
                </button>
                {selectedEnrollment.student && (
                  <button 
                    type="button" 
                    className="btn btn-info"
                    onClick={() => {
                      handleCloseDetailsModal();
                      navigate('/secretary/students', { 
                        state: { highlightStudent: selectedEnrollment.studentId } 
                      });
                    }}
                  >
                    <UserOutlined style={{ marginRight: '6px' }} />
                    Ver Estudiante
                  </button>
                )}
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
      
      {/* Modal de Matrícula Masiva */}
      <BulkEnrollmentModal
        visible={showBulkModal}
        onCancel={handleCloseBulkModal}
        onSuccess={handleBulkEnrollmentSuccess}
      />
      
      {/* AlertModal para confirmaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default EnrollmentList;