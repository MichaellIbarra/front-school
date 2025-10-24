/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Modal, Card, Row, Col, Descriptions, Checkbox, Form, DatePicker } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import classroomService from "../../../services/academic/classroomService";
import { EnrollmentType, getEnrollmentStatusText, getEnrollmentStatusColor, formatEnrollmentDate, formatDateTime, arrayToDate } from "../../../types/enrollments/enrollments";

const { Option } = Select;

const EnrollmentList = () => {
  // Estado para los datos de estudiantes
  const [students, setStudents] = useState([]);
  // Estado para los datos de aulas
  const [classrooms, setClassrooms] = useState([]);

  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();

  // Estados para manejo de datos
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayEnrollments, setDisplayEnrollments] = useState([]);

  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [currentView, setCurrentView] = useState('all'); // 'all', 'retired', 'active', etc.

  // Estados para modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Estados para modal de importación masiva
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkEnrollments, setBulkEnrollments] = useState([]); // Lista de estudiantes no matriculados
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedStudentsForBulk, setSelectedStudentsForBulk] = useState([]); // IDs de estudiantes seleccionados
  const [bulkSelectedClassroom, setBulkSelectedClassroom] = useState(null); // Aula seleccionada para matrícula masiva

  /**
   * Abre el modal de detalles de la matrícula
   * @param {object} enrollment - Objeto de matrícula a mostrar
   */
  const handleViewDetails = (enrollment) => {
    const student = students.find(s => s.id === enrollment.studentId);
    setSelectedEnrollment({ ...enrollment, student });
    setShowDetailsModal(true);
  };

  /**
   * Cierra el modal de detalles de la matrícula
   */
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEnrollment(null);
  };

  // Estados para filtro de aulas
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  // Solo cargar aulas y setear la primera como seleccionada, pero NO cargar matrículas aquí
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Cargar aulas
        const classroomsResponse = await classroomService.getAllClassrooms();
        console.log('[DEBUG] Classrooms fetched in EnrollmentList:', classroomsResponse);
        if (classroomsResponse.success) {
          setClassrooms(classroomsResponse.data);
          console.log('[DEBUG] Classrooms state in EnrollmentList:', classroomsResponse.data);
          if (classroomsResponse.data.length > 0) {
            setSelectedClassroom(classroomsResponse.data[0].id);
          }
        } else {
          showError(classroomsResponse.error || "Error al cargar las aulas");
          setClassrooms([]);
        }

        // Cargar todos los estudiantes de la institución para mostrar nombre en la tabla
        const studentsResponse = await studentService.getStudentsByInstitution();
        console.log('[DEBUG] Students fetched in EnrollmentList:', studentsResponse);
        if (studentsResponse.success) {
          setStudents(studentsResponse.data);
        } else {
          showError(studentsResponse.error || "Error al cargar los estudiantes");
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        showError('Error al cargar datos iniciales');
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // Cuando cambia el aula seleccionada, recargar matrículas de ese aula
  useEffect(() => {
    console.log('[DEBUG] selectedClassroom changed:', selectedClassroom);
    if (selectedClassroom) {
      loadEnrollments(selectedClassroom);
    } else {
      setEnrollments([]);
    }
    // eslint-disable-next-line
  }, [selectedClassroom]);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [enrollments, students, searchText]);

  /**
   * Carga todas las matrículas desde el servicio
   */
  // Cargar matrículas de un aula específica
  const loadEnrollments = async (classroomId) => {
    setLoading(true);
    try {
      // Debug: mostrar classroomId y detalles de la petición
      console.log('[DEBUG] loadEnrollments classroomId:', classroomId);
      const headers = enrollmentService.getAuthHeaders();
      const url = `${enrollmentService.baseURL}/enrollments/secretary/by-classroom/${classroomId}`;
      console.log('[DEBUG] URL:', url);
      console.log('[DEBUG] Headers:', headers);
      const response = await enrollmentService.getEnrollmentsByClassroom(classroomId);
      console.log('[DEBUG] Respuesta API:', response);
      if (response.success) {
        setEnrollments(response.data);
        setCurrentView('all'); // Establecer vista como 'todas' cuando se cargan normalmente
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setEnrollments([]);
      }
    } catch (error) {
      console.error('[DEBUG] Error en loadEnrollments:', error);
      showError('Error al cargar las matrículas');
      setEnrollments([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda
   */
  const applyFilters = () => {
    let filtered = [...enrollments];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(enrollment => {
        const student = students.find(s => s.id === enrollment.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
        const documentNumber = student ? student.documentNumber?.toLowerCase() : '';
        const classroomId = enrollment.classroomId?.toLowerCase() || '';

        return (
          studentName.includes(search) ||
          documentNumber.includes(search) ||
          classroomId.includes(search)
        );
      });
    }
    setDisplayEnrollments(filtered);
  };

  /**
   * Navega al formulario de crear nueva matrícula
   */
  const handleCreate = () => {
    navigate('/secretary/enrollments/add');
  };

  /**
   * Abre el modal de importación masiva de matrículas
   */
  const handleBulkImport = () => {
    console.log('[DEBUG] Aulas disponibles para modal:', classrooms); // Debug para ver estructura
    loadUnenrolledStudents();
    setShowBulkImportModal(true);
  };

  /**
   * Cierra el modal de importación masiva
   */
  const handleCloseBulkImportModal = () => {
    setShowBulkImportModal(false);
    setBulkEnrollments([]);
    setSelectedStudentsForBulk([]);
    setBulkSelectedClassroom(null);
  };

  /**
   * Carga estudiantes no matriculados
   */
  const loadUnenrolledStudents = async () => {
    setBulkLoading(true);
    try {
      const response = await studentService.getUnenrolledStudents();
      if (response.success) {
        setBulkEnrollments(response.data);
        showSuccess(`${response.data.length} estudiantes disponibles para matricular`);
      } else {
        showError(response.error);
        setBulkEnrollments([]);
      }
    } catch (error) {
      showError('Error al cargar estudiantes no matriculados');
      setBulkEnrollments([]);
    }
    setBulkLoading(false);
  };

  /**
   * Ejecuta la matrícula masiva de estudiantes seleccionados
   */
  const handleExecuteBulkImport = async () => {
    if (selectedStudentsForBulk.length === 0) {
      showWarning('Seleccione al menos un estudiante para matricular');
      return;
    }

    if (!bulkSelectedClassroom) {
      showWarning('Seleccione un aula para la matrícula');
      return;
    }

    setBulkLoading(true);
    try {
      const enrollmentsToCreate = selectedStudentsForBulk.map(studentId => ({
        studentId: studentId,
        classroomId: bulkSelectedClassroom,
        enrollmentType: 'REGULAR',
        academicYear: new Date().getFullYear().toString(),
        enrollmentDate: new Date().toISOString().split('T')[0]
      }));

      const response = await enrollmentService.bulkCreateEnrollments(enrollmentsToCreate);
      
      if (response.success) {
        showSuccess(`✅ ${selectedStudentsForBulk.length} estudiantes matriculados exitosamente`);
        handleCloseBulkImportModal();
        if (selectedClassroom) {
          loadEnrollments(selectedClassroom); // Recargar la lista
        }
      } else {
        showError(`❌ Error al matricular estudiantes: ${response.error}`);
      }
    } catch (error) {
      showError(`❌ Error inesperado: ${error.message}`);
    }
    setBulkLoading(false);
  };

  /**
   * Maneja la selección individual de estudiantes
   */
  const handleStudentSelection = (studentId, checked) => {
    if (checked) {
      setSelectedStudentsForBulk([...selectedStudentsForBulk, studentId]);
    } else {
      setSelectedStudentsForBulk(selectedStudentsForBulk.filter(id => id !== studentId));
    }
  };

  /**
   * Selecciona o deselecciona todos los estudiantes
   */
  const handleSelectAllStudents = (checked) => {
    if (checked) {
      const allStudentIds = bulkEnrollments.map(student => student.id);
      setSelectedStudentsForBulk(allStudentIds);
    } else {
      setSelectedStudentsForBulk([]);
    }
  };

  /**
   * Volver a ver todas las matrículas del aula seleccionada
   */
  const handleViewAll = () => {
    if (selectedClassroom) {
      loadEnrollments(selectedClassroom);
      setCurrentView('all');
      showSuccess('Mostrando todas las matrículas del aula');
    } else {
      showWarning('Seleccione un aula primero');
    }
  };

  /**
   * Ver matrículas por estado
   */
  const handleViewByStatus = async (status) => {
    setLoading(true);
    try {
      const response = await enrollmentService.getEnrollmentsByStatus(status);
      if (response.success) {
        setEnrollments(response.data);
        setCurrentView(status.toLowerCase());
        const statusText = status === 'RETIRED' ? 'retiradas' : status.toLowerCase();
        showSuccess(`${response.data.length} matrículas ${statusText} encontradas. Use "Todas" para volver a la vista normal.`);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError(`Error al obtener matrículas con estado ${status}`);
    }
    setLoading(false);
  };

  /**
   * Ver estadísticas de matrículas
   */
  const handleViewStatistics = async () => {
    setLoading(true);
    try {
      const response = await enrollmentService.getEnrollmentStatistics();
      if (response.success) {
        setStatistics(response.data);
        showSuccess('Estadísticas cargadas exitosamente');
        console.log('Estadísticas de matrículas:', response.data);
        // Aquí podrías abrir un modal con las estadísticas o navegar a otra página
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al obtener estadísticas de matrículas');
    }
    setLoading(false);
  };

  /**
   * Transferir estudiante a otra aula
   */
  const handleTransferStudent = async (enrollmentId, newClassroomId) => {
    try {
      const response = await enrollmentService.transferStudent(enrollmentId, newClassroomId);
      if (response.success) {
        showSuccess(response.message);
        loadEnrollments(selectedClassroom); // Recargar la lista
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al transferir el estudiante');
    }
  };

  /**
   * Cancelar matrícula
   */
  const handleCancelEnrollment = async (enrollmentId) => {
    try {
      const response = await enrollmentService.cancelEnrollment(enrollmentId);
      if (response.success) {
        showSuccess(response.message);
        loadEnrollments(selectedClassroom); // Recargar la lista
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al cancelar la matrícula');
    }
  };

  /**
   * Ver matrículas por estudiante
   */
  const handleViewByStudent = async (studentId) => {
    setLoading(true);
    try {
      const response = await enrollmentService.getEnrollmentsByStudent(studentId);
      if (response.success) {
        setEnrollments(response.data);
        const student = students.find(s => s.id === studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'el estudiante';
        showSuccess(`${response.data.length} matrículas de ${studentName} encontradas`);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError('Error al obtener matrículas del estudiante');
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Estudiante',
      dataIndex: 'studentId',
      key: 'studentId',
      render: (studentId, record) => {
        // Buscar el estudiante por ID
        const student = students.find(s => s.id === studentId);
        if (student) {
          return (
            <span>
              {student.firstName} {student.lastName}
              {student.documentNumber ? ` - ${student.documentNumber}` : ''}
            </span>
          );
        }
        return <span>{studentId || '-'}</span>;
      },
    },
    {
      title: 'Aula',
      dataIndex: 'classroomId',
      key: 'classroomId',
      render: (classroomId) => {
        const classroom = classrooms.find(c => c.id === classroomId);
        return (
          <small>{classroom ? `${classroom.classroomName} ${classroom.section ? `(${classroom.section})` : ''}` : classroomId}</small>
        );
      },
    },
    {
      title: 'Tipo de Matrícula',
      dataIndex: 'enrollmentType',
      key: 'enrollmentType',
      render: (type) => (
        <span>{type}</span>
      ),
    },
    {
      title: 'Fecha de Matrícula',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      render: (date) => (
        <span>{Array.isArray(date) ? date.join('-') : '-'}</span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span>{status}</span>
      ),
    },
    // No mostrar columna de Fecha Creación
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => handleViewDetails(record),
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => navigate(`/secretary/enrollments/edit/${record.id}`, { state: { enrollment: record } }),
          },
          {
            type: 'divider',
          },
          {
            key: 'transfer',
            label: 'Transferir',
            icon: <UndoOutlined />,
            onClick: () => {
              // Aquí podrías abrir un modal para seleccionar la nueva aula
              const newClassroomId = prompt('Ingrese el ID de la nueva aula:');
              if (newClassroomId) {
                handleTransferStudent(record.id, newClassroomId);
              }
            },
          },
          {
            key: 'viewStudent',
            label: 'Ver Matrículas del Estudiante',
            icon: <UserOutlined />,
            onClick: () => handleViewByStudent(record.studentId),
          },
          {
            type: 'divider',
          },
          {
            key: 'cancel',
            label: 'Cancelar Matrícula',
            icon: <CloseOutlined />,
            onClick: () => handleCancelEnrollment(record.id),
            style: { color: '#ff4d4f' }
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
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">
                    Gestión de Matrículas
                    {currentView !== 'all' && (
                      <small className="text-muted ms-2">
                        - Mostrando: {currentView === 'retired' ? 'Retiradas' : currentView}
                      </small>
                    )}
                  </h3>
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
                    <div className="col-lg-2 col-md-4 col-sm-12 mb-2">
                      {/* Select para filtrar por aula */}
                      <Select
                        showSearch
                        placeholder="Filtrar por aula"
                        value={selectedClassroom}
                        onChange={setSelectedClassroom}
                        style={{ width: '100%' }}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        allowClear={false}
                      >
                        {classrooms.map((classroom) => (
                          <Option key={classroom.id} value={classroom.id}>
                            {classroom.classroomName} {classroom.section ? `(${classroom.section})` : ''}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          type={currentView === 'all' ? 'primary' : 'default'}
                          icon={<CheckOutlined />}
                          onClick={handleViewAll}
                          className="btn-sm"
                        >
                          Todas
                        </Button>
                        <Button
                          type={currentView === 'retired' ? 'primary' : 'default'}
                          icon={<CloseOutlined />}
                          onClick={() => handleViewByStatus('RETIRED')}
                          className="btn-sm"
                        >
                          Retirados
                        </Button>
                        <Button
                          type="default"
                          icon={<FileTextOutlined />}
                          onClick={handleViewStatistics}
                          className="btn-sm"
                        >
                          Estadísticas
                        </Button>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleBulkImport}
                          className="btn-sm"
                        >
                          Importar Masivo
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          className="btn-sm"
                        >
                          Nueva Matrícula
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de matrículas */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={displayEnrollments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: displayEnrollments.length,
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
                          <div className="col-5"><strong>ID Matrícula:</strong></div>
                          <div className="col-7">
                            <span className="badge bg-primary">{selectedEnrollment.id}</span>
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
                        {selectedEnrollment.enrollmentType === EnrollmentType.TRANSFER && selectedEnrollment.transferReason && (
                          <div className="row mb-2">
                            <div className="col-5"><strong>Razón de Transferencia:</strong></div>
                            <div className="col-7">{selectedEnrollment.transferReason}</div>
                          </div>
                        )}
                        {selectedEnrollment.qrCode && (
                          <div className="row mb-2">
                            <div className="col-5"><strong>Código QR:</strong></div>
                            <div className="col-7">
                              <img src={selectedEnrollment.qrCode} alt="QR Code" style={{ maxWidth: '100px' }} />
                            </div>
                          </div>
                        )}
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
                    // handleCloseDetailsModal();
                    // handleEdit(selectedEnrollment);
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
                      // handleCloseDetailsModal();
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
      <Modal
        title={
          <div className="d-flex align-items-center">
            <UserOutlined className="me-2" />
            Matrícula Masiva de Estudiantes
          </div>
        }
        open={showBulkImportModal}
        onCancel={handleCloseBulkImportModal}
        width={1000}
        footer={[
          <Button key="cancel" onClick={handleCloseBulkImportModal}>
            Cancelar
          </Button>,
          <Button
            key="enroll"
            type="primary"
            loading={bulkLoading}
            onClick={handleExecuteBulkImport}
            disabled={selectedStudentsForBulk.length === 0 || !bulkSelectedClassroom}
          >
            Matricular {selectedStudentsForBulk.length} Estudiantes
          </Button>
        ]}
      >
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {/* Selección de Aula */}
          <div className="mb-4">
            <Form layout="vertical">
              <Form.Item label="Seleccionar Aula" required>
                <Select
                  placeholder="Seleccione un aula"
                  value={bulkSelectedClassroom}
                  onChange={setBulkSelectedClassroom}
                  style={{ width: '100%' }}
                >
                  {classrooms.map(classroom => (
                    <Select.Option key={classroom.id} value={classroom.id}>
                      {(() => {
                        // Construir nombre descriptivo del aula
                        let displayName = '';
                        
                        if (classroom.name) {
                          displayName = classroom.name;
                        } else if (classroom.grade && classroom.section) {
                          displayName = `${classroom.grade}° ${classroom.section}`;
                        } else if (classroom.grade) {
                          displayName = `${classroom.grade}° Grado`;
                        } else if (classroom.level) {
                          displayName = classroom.level;
                        } else {
                          displayName = `Aula ${classroom.id.substring(0, 8)}...`;
                        }
                        
                        // Agregar información adicional si está disponible
                        const extras = [];
                        if (classroom.capacity) extras.push(`Cap: ${classroom.capacity}`);
                        if (classroom.academicYear) extras.push(classroom.academicYear);
                        
                        return displayName + (extras.length > 0 ? ` (${extras.join(', ')})` : '');
                      })()}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </div>

          {/* Lista de Estudiantes No Matriculados */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Estudiantes Disponibles ({bulkEnrollments.length})</h6>
              <Checkbox
                checked={selectedStudentsForBulk.length === bulkEnrollments.length && bulkEnrollments.length > 0}
                indeterminate={selectedStudentsForBulk.length > 0 && selectedStudentsForBulk.length < bulkEnrollments.length}
                onChange={(e) => handleSelectAllStudents(e.target.checked)}
              >
                Seleccionar Todos
              </Checkbox>
            </div>

            {bulkLoading ? (
              <div className="text-center py-4">
                <p>Cargando estudiantes disponibles...</p>
              </div>
            ) : bulkEnrollments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No hay estudiantes disponibles para matricular</p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                {bulkEnrollments.map((student) => (
                  <div 
                    key={student.id} 
                    className="p-3 border-bottom d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleStudentSelection(student.id, !selectedStudentsForBulk.includes(student.id))}
                  >
                    <div className="d-flex align-items-center">
                      <Checkbox
                        checked={selectedStudentsForBulk.includes(student.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStudentSelection(student.id, e.target.checked);
                        }}
                        className="me-3"
                      />
                      <div>
                        <strong>{student.firstName} {student.lastName}</strong>
                        <br />
                        <small className="text-muted">
                          {student.documentType}: {student.documentNumber}
                        </small>
                        {student.birthDate && (
                          <>
                            <br />
                            <small className="text-muted">
                              Nació: {student.birthDate}
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <Tag color={student.gender === 'MALE' ? 'blue' : 'pink'}>
                        {student.gender === 'MALE' ? 'M' : 'F'}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedStudentsForBulk.length > 0 && (
            <div className="mt-3 p-2" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
              <strong>{selectedStudentsForBulk.length}</strong> estudiantes seleccionados
              {bulkSelectedClassroom && (
                <span> para matricular en <strong>{
                  (() => {
                    const classroom = classrooms.find(c => c.id === bulkSelectedClassroom);
                    if (!classroom) return 'Aula seleccionada';
                    
                    if (classroom.name) {
                      return classroom.name;
                    } else if (classroom.grade && classroom.section) {
                      return `${classroom.grade}° ${classroom.section}`;
                    } else if (classroom.grade) {
                      return `${classroom.grade}° Grado`;
                    } else if (classroom.level) {
                      return classroom.level;
                    } else {
                      return `Aula ${classroom.id.substring(0, 8)}...`;
                    }
                  })()
                }</strong></span>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* AlertModal para confirmaciones */}
      <AlertModal 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
}

export default EnrollmentList;