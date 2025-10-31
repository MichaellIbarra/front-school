import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Select, Dropdown, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import teacherAssignmentService from '../../../services/academic/teacherAssignmentService';
import courseService from '../../../services/academic/courseService';
import classroomService from '../../../services/academic/classroomService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import academicExporter from '../../../utils/academic/academicExporter';
import { filterByStatus, getStatusColor, getStatusText } from '../../../utils/academic/academicHelpers';
import TeacherAssignmentFormModal from './TeacherAssignmentFormModal';
import TeacherAssignmentDetailModal from './TeacherAssignmentDetailModal';
import TeacherAssignmentReportExporter from '../../../utils/academic/teacherAssignmentReportExporter';

const { Option } = Select;

const TeacherAssignmentList = () => {
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  
  // Estados para el modal de detalle
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = useState(null);

  // Reference data for enrichment
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assignments, searchTerm, statusFilter, teachers, courses, classrooms]);

  const loadInitialData = async () => {
    // Primero cargar los datos de referencia
    await loadReferenceData();
    // Luego cargar las asignaciones
    await loadAssignments();
  };

  const loadReferenceData = async () => {
    try {
      // Cargar profesores usando el endpoint correcto
      console.log('🔄 Cargando profesores desde /users/secretary/by-role/teacher');
      
      const teachersResponse = await fetch(
        `https://lab.vallegrande.edu.pe/school/gateway/api/v1/users/secretary/by-role/teacher`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      let teachersData = [];
      if (teachersResponse.ok) {
        const data = await teachersResponse.json();
        console.log('✅ Respuesta de profesores:', data);
        
        // Manejar diferentes estructuras de respuesta
        if (data.users && Array.isArray(data.users)) {
          teachersData = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          teachersData = data.data;
        } else if (Array.isArray(data)) {
          teachersData = data;
        }
        
        console.log('👥 Profesores procesados:', teachersData.length);
      } else {
        console.error('❌ Error al cargar profesores - Status:', teachersResponse.status);
      }
      
      // Cargar cursos y aulas
      const classroomsResponse = await classroomService.getAllClassrooms();
      const coursesResponse = await courseService.getAllCourses();
      
      console.log('📊 Datos de referencia cargados:', {
        teachersCount: teachersData.length,
        coursesCount: coursesResponse?.data?.length || 0,
        classroomsCount: classroomsResponse?.data?.length || 0
      });
      
      // Handle potential response wrappers
      const coursesData = coursesResponse?.success ? (coursesResponse.data || []) : (coursesResponse?.data || coursesResponse || []);
      const classroomsData = classroomsResponse?.success ? (classroomsResponse.data || []) : (classroomsResponse?.data || classroomsResponse || []);
      
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
    } catch (error) {
      console.error('Error loading reference data:', error);
      setTeachers([]);
      setCourses([]);
      setClassrooms([]);
    }
  };

  const enrichAssignmentData = (assignment) => {
    // Ensure reference data are arrays
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    const coursesArray = Array.isArray(courses) ? courses : [];
    const classroomsArray = Array.isArray(classrooms) ? classrooms : [];

    console.log('🔍 Enriqueciendo asignación:', assignment.id);
    console.log('   - teacherId:', assignment.teacherId);
    console.log('   - Profesores disponibles:', teachersArray.length);

    // Buscar profesor por keycloakId o id
    const teacher = teachersArray.find(t => 
      t.keycloakId === assignment.teacherId || 
      t.id === assignment.teacherId
    );
    
    const course = coursesArray.find(c => c.id === assignment.courseId);
    const classroom = classroomsArray.find(c => c.id === assignment.classroomId);

    console.log('   - Profesor encontrado:', teacher);
    
    if (!teacher && teachersArray.length > 0) {
      console.log('   ⚠️ IDs disponibles:', teachersArray.map(t => ({ 
        keycloakId: t.keycloakId, 
        id: t.id,
        username: t.username 
      })));
    }

    // Construir nombre del profesor (firstname, lastname sin guión bajo)
    const teacherFirstName = teacher?.firstname || teacher?.firstName || '';
    const teacherLastName = teacher?.lastname || teacher?.lastName || '';
    const teacherName = `${teacherFirstName} ${teacherLastName}`.trim() || assignment.teacherId;

    // Construir nombre del curso
    const courseName = course?.courseName || course?.name || assignment.courseId;

    // Construir nombre del aula (formato: "1° A - Mañana")
    const classroomName = classroom 
      ? `${classroom.grade}° ${classroom.section}${classroom.shift ? ` - ${classroom.shift}` : ''}`
      : assignment.classroomId;

    console.log('   ✅ Nombres generados:', { teacherName, courseName, classroomName });

    return {
      ...assignment,
      teacherName,
      courseName,
      classroomName
    };
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await teacherAssignmentService.getAllTeacherAssignments();
      if (response.success) {
        setAssignments(Array.isArray(response.data) ? response.data : []);
      } else {
        showError(response.error || 'Error al cargar asignaciones docentes');
        setAssignments([]);
      }
    } catch (err) {
      showError('Error al cargar asignaciones docentes: ' + err.message);
      setAssignments([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...assignments];
    
    // Enrich data with names
    filtered = filtered.map(enrichAssignmentData);
    
    // Apply status filter
    filtered = filterByStatus(filtered, statusFilter);
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.teacherName?.toLowerCase().includes(search) ||
        a.courseName?.toLowerCase().includes(search) ||
        a.classroomName?.toLowerCase().includes(search)
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleDeleteAssignment = async (id, teacherId) => {
    showAlert({
      title: '¿Está seguro de eliminar esta asignación?',
      message: `Se eliminará la asignación del profesor "${teacherId}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await teacherAssignmentService.deleteTeacherAssignment(id);
          if (response.success) {
            showSuccess('Asignación eliminada correctamente');
            loadAssignments();
          } else {
            showError(response.error || 'Error al eliminar asignación');
          }
        } catch (err) {
          showError('Error al eliminar asignación: ' + err.message);
        }
      }
    });
  };

  const handleExport = () => {
    try {
      const success = academicExporter.exportTeacherAssignments(filteredAssignments);
      if (success) {
        showSuccess('Asignaciones exportadas exitosamente');
      } else {
        showError('Error al exportar asignaciones');
      }
    } catch (error) {
      showError('Error al exportar asignaciones: ' + error.message);
    }
  };

  const handleExportPDF = () => {
    try {
      const result = TeacherAssignmentReportExporter.exportAssignmentsToPDF(filteredAssignments);
      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Error al generar el PDF: ' + error.message);
    }
  };

  const handleExportByTeacher = () => {
    try {
      const result = TeacherAssignmentReportExporter.exportByTeacher(filteredAssignments);
      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Error al generar el reporte por profesor: ' + error.message);
    }
  };

  const handleExportCSV = () => {
    try {
      const result = TeacherAssignmentReportExporter.exportAssignmentsToCSV(filteredAssignments);
      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Error al exportar CSV: ' + error.message);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedAssignment(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenEditModal = (assignment) => {
    setSelectedAssignment(assignment);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAssignment(null);
  };

  const handleModalSuccess = () => {
    loadAssignments();
  };
  
  const handleOpenDetailModal = (assignment) => {
    setSelectedAssignmentForDetail(assignment);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedAssignmentForDetail(null);
  };

  const columns = [
    {
      title: 'Profesor',
      dataIndex: 'teacherName',
      key: 'teacherName',
      sorter: (a, b) => (a.teacherName || '').localeCompare(b.teacherName || ''),
      width: 200,
    },
    {
      title: 'Curso',
      dataIndex: 'courseName',
      key: 'courseName',
      sorter: (a, b) => (a.courseName || '').localeCompare(b.courseName || ''),
      width: 200,
    },
    {
      title: 'Aula',
      dataIndex: 'classroomName',
      key: 'classroomName',
      sorter: (a, b) => (a.classroomName || '').localeCompare(b.classroomName || ''),
      width: 150,
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
      width: 100,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => handleOpenDetailModal(record),
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleOpenEditModal(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteAssignment(record.id, record.teacherName),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreHorizontal size={16} />} onClick={(e) => e.preventDefault()} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Gestión de Asignaciones Docentes</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                    <li className="breadcrumb-item active">Asignaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-2">
                      <Input
                        placeholder="Buscar por profesor, curso, aula..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select value={statusFilter} onChange={setStatusFilter} className="w-100">
                        <Option value="all">Todos los estados</Option>
                        <Option value="A">Activo</Option>
                        <Option value="I">Inactivo</Option>
                      </Select>
                    </div>
                    <div className="col-lg-4 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'pdf',
                                label: 'Exportar PDF General',
                                icon: <FilePdfOutlined />,
                                onClick: handleExportPDF,
                              },
                              {
                                key: 'pdf-teacher',
                                label: 'PDF por Profesor',
                                icon: <FilePdfOutlined />,
                                onClick: handleExportByTeacher,
                              },
                              {
                                type: 'divider',
                              },
                              {
                                key: 'csv',
                                label: 'Exportar CSV',
                                icon: <DownloadOutlined />,
                                onClick: handleExportCSV,
                              },
                              {
                                key: 'excel',
                                label: 'Exportar Excel',
                                icon: <DownloadOutlined />,
                                onClick: handleExport,
                              },
                            ],
                          }}
                          trigger={['click']}
                          disabled={filteredAssignments.length === 0}
                        >
                          <Button icon={<DownloadOutlined />}>
                            Exportar
                          </Button>
                        </Dropdown>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                          Nueva Asignación
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredAssignments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredAssignments.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} asignaciones`,
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

      <Sidebar />
      <Header />
      <AlertModal alert={alertState} onConfirm={alertConfirm} onCancel={alertCancel} />
      
      <TeacherAssignmentFormModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
        assignmentData={selectedAssignment}
        mode={modalMode}
      />
      
      <TeacherAssignmentDetailModal
        visible={detailModalVisible}
        onCancel={handleCloseDetailModal}
        assignmentData={selectedAssignmentForDetail}
      />
    </>
  );
};

export default TeacherAssignmentList;
