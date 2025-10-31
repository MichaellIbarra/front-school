/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Tabs } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined, BellOutlined, DownloadOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import gradeService from "../../../services/grades/gradeService";
import { 
  GradeScale, 
  TypePeriod, 
  EvaluationType, 
  formatDate, 
  getGradeScaleBadgeClass 
} from "../../../types/grades/grade";
import GradeFormModal from "./GradeFormModal";
import GradeReportExporter from "../../../utils/grades/reportExporter";

const { Option } = Select;
const { TabPane } = Tabs;

const GradeList = () => {
  // eslint-disable-next-line
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [grades, setGrades] = useState([]);
  const [inactiveGrades, setInactiveGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Estados para aulas y estudiantes
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [gradeScaleFilter, setGradeScaleFilter] = useState('all');
  const [typePeriodFilter, setTypePeriodFilter] = useState('all');
  const [filteredGrades, setFilteredGrades] = useState([]);
  
  // Estados para modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  /**
   * Carga las aulas asignadas al profesor desde Mis Asignaciones
   */
  const loadMyClassrooms = async () => {
    setLoadingClassrooms(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // TEMPORAL: Usar endpoint correcto cuando esté disponible
      // Por ahora, crear aulas de ejemplo basadas en las asignaciones conocidas
      const mockClassrooms = [
        {
          id: '690059632dc0bce8d164fe2b',
          courseId: '68fbc62fb0cadfa457d1b786',
          courseName: 'Curso 68fbc62fb0cadfa457d1b786',
          classroomName: 'Aula 68fbc6b1b0cadfa457d1b788',
          periodId: 'period-2025',
          assignments: []
        }
      ];
      
      setClassrooms(mockClassrooms);
      
      // TODO: Descomentar cuando el endpoint esté disponible
      /*
      const response = await fetch(
        'https://lab.vallegrande.edu.pe/school/gateway/api/v1/academic/teacher/my-assignments',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        const assignments = result.data || [];
        
        // Mapear las aulas únicas
        const classroomMap = new Map();
        
        assignments.forEach(assignment => {
          if (!classroomMap.has(assignment.classroomId)) {
            classroomMap.set(assignment.classroomId, {
              id: assignment.classroomId,
              courseId: assignment.courseId,
              courseName: assignment.courseName || assignment.courseId,
              classroomName: assignment.classroomName || assignment.classroomId,
              periodId: assignment.periodId,
              assignments: []
            });
          }
          classroomMap.get(assignment.classroomId).assignments.push(assignment);
        });
        
        setClassrooms(Array.from(classroomMap.values()));
      } else {
        console.error('Error al cargar aulas:', response.status);
        showError('Error al cargar las aulas asignadas');
      }
      */
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      showError('Error al cargar las aulas asignadas');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  /**
   * Carga los estudiantes de un aula específica
   */
  const loadStudentsByClassroom = async (classroomId) => {
    if (!classroomId) return;
    
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `https://lab.vallegrande.edu.pe/school/gateway/api/v1/enrollments/teacher/by-classroom/${classroomId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        const enrollments = result.data || [];
        
        // Filtrar solo estudiantes activos y mapear
        const activeStudents = enrollments
          .filter(enrollment => enrollment.status === 'ACTIVE')
          .map(enrollment => ({
            id: enrollment.studentId,
            enrollmentId: enrollment.id,
            firstName: enrollment.firstName,
            lastName: enrollment.lastName,
            fullName: `${enrollment.firstName} ${enrollment.lastName}`,
            documentType: enrollment.documentType,
            documentNumber: enrollment.documentNumber,
            classroomId: enrollment.classroomId,
            parentName: enrollment.parentName,
            parentPhone: enrollment.parentPhone,
            parentEmail: enrollment.parentEmail
          }));
        
        setStudents(activeStudents);
      } else {
        console.error('Error al cargar estudiantes:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Maneja la selección de un aula
   */
  const handleSelectClassroom = (classroom) => {
    setSelectedClassroom(classroom);
    loadStudentsByClassroom(classroom.id);
  };

  /**
   * Vuelve a la vista de aulas
   */
  const handleBackToClassrooms = () => {
    setSelectedClassroom(null);
    setStudents([]);
    setSelectedStudent(null);
  };

  /**
   * Carga todas las calificaciones desde el servicio
   */
  const loadGrades = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando calificaciones...');
      
      // El backend solo devuelve calificaciones activas por defecto
      // Las inactivas solo se pueden ver si fueron eliminadas en esta sesión
      const response = await gradeService.getMyGrades();
      if (response.success) {
        const allGrades = response.data || [];
        console.log('📊 Total de calificaciones recibidas:', allGrades.length);
        console.log('📋 Calificaciones:', allGrades);
        
        // Por defecto, todas vienen activas del backend
        // Solo mostramos las que realmente estén marcadas como activas
        const active = allGrades.filter(g => 
          !g.status || 
          g.status === 'A' || 
          g.status === 'ACTIVE' || 
          g.status === 'Active'
        );
        
        console.log('✅ Calificaciones activas:', active.length);
        
        setGrades(active);
        // Las inactivas se llenarán cuando se eliminen localmente
      } else {
        console.error('❌ Error en respuesta:', response.error);
        showError(response.error || 'Error al cargar las calificaciones');
        setGrades([]);
        setInactiveGrades([]);
      }
    } catch (error) {
      console.error('❌ Excepción al cargar calificaciones:', error);
      showError('Error al cargar las calificaciones');
      setGrades([]);
      setInactiveGrades([]);
    }
    setLoading(false);
  };

  // Cargar aulas asignadas al montar el componente
  useEffect(() => {
    loadMyClassrooms();
  // eslint-disable-next-line
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda, filtros o tab activo
  useEffect(() => {
    let filtered = activeTab === 'active' ? [...grades] : [...inactiveGrades];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(grade => 
        grade.studentId?.toLowerCase().includes(search) ||
        grade.courseId?.toLowerCase().includes(search) ||
        grade.typePeriod?.toLowerCase().includes(search) ||
        grade.evaluationType?.toLowerCase().includes(search) ||
        grade.observations?.toLowerCase().includes(search)
      );
    }

    // Filtro por escala de calificación
    if (gradeScaleFilter !== 'all') {
      filtered = filtered.filter(grade => grade.gradeScale === gradeScaleFilter);
    }

    // Filtro por tipo de período
    if (typePeriodFilter !== 'all') {
      filtered = filtered.filter(grade => grade.typePeriod === typePeriodFilter);
    }

    setFilteredGrades(filtered);
  }, [grades, inactiveGrades, searchText, gradeScaleFilter, typePeriodFilter, activeTab]);

  /**
   * Abre modal para crear nueva calificación
   */
  const handleCreate = (student = null) => {
    setModalMode('create');
    setSelectedStudent(student);
    setSelectedGrade(null);
    setModalVisible(true);
  };

  /**
   * Abre modal para editar calificación
   */
  const handleEdit = (grade) => {
    setModalMode('edit');
    setSelectedGrade(grade);
    setModalVisible(true);
  };

  /**
   * Muestra detalles de la calificación
   */
  const handleView = (grade) => {
    const levelInfo = GradeScale[grade.gradeScale];
    const badgeClass = getGradeScaleBadgeClass(grade.gradeScale);
    
    // Crear contenido HTML estructurado horizontal
    const details = (
      <div className="grade-details-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Información del Estudiante */}
        <div className="card mb-3">
          <div className="card-header text-white bg-primary">
            <h6 className="mb-0">
              <i className="fa fa-graduation-cap me-2"></i>
              Información del Estudiante
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-user me-2"></i>Estudiante:</strong>
                <p className="mb-0 text-muted small">{grade.studentId}</p>
              </div>
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-book me-2"></i>Curso:</strong>
                <p className="mb-0 text-muted small">{grade.courseId}</p>
              </div>
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-door-open me-2"></i>Aula:</strong>
                <p className="mb-0 text-muted small">{grade.classroomId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Período y Evaluación */}
        <div className="card mb-3">
          <div className="card-header text-white bg-info">
            <h6 className="mb-0">
              <i className="fa fa-calendar me-2"></i>
              Período y Evaluación
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-calendar-alt me-2"></i>ID Período:</strong>
                <p className="mb-0 text-muted small">{grade.periodId}</p>
              </div>
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-calendar-check me-2"></i>Tipo de Período:</strong>
                <p className="mb-0 text-muted small">{TypePeriod[grade.typePeriod]?.name || grade.typePeriod}</p>
              </div>
              <div className="col-md-4 mb-2">
                <strong><i className="fa fa-clipboard-check me-2"></i>Tipo de Evaluación:</strong>
                <p className="mb-0 text-muted small">{EvaluationType[grade.evaluationType]?.name || grade.evaluationType}</p>
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-12 mb-2">
                <strong><i className="fa fa-clock me-2"></i>Fecha de Evaluación:</strong>
                <p className="mb-0 text-muted small">{formatDate(grade.evaluationDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Competencia y Capacidad */}
        <div className="card mb-3">
          <div className="card-header text-white bg-secondary">
            <h6 className="mb-0">
              <i className="fa fa-brain me-2"></i>
              Competencia y Capacidad
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-star me-2"></i>Competencia:</strong>
                <p className="mb-0 text-muted small">{grade.competenceName}</p>
              </div>
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-tasks me-2"></i>Capacidad Evaluada:</strong>
                <p className="mb-0 text-muted small">{grade.capacityEvaluated || 'No especificada'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calificación */}
        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <h6 className="mb-0"><i className="fa fa-chart-line me-2"></i>Calificación Obtenida</h6>
          </div>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6 mb-2">
                <strong>Escala de Calificación:</strong>
                <p className="mb-2">
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '16px', padding: '8px 12px' }}>
                    {grade.gradeScale} - {levelInfo?.name || 'N/A'}
                  </span>
                </p>
                <small className="text-muted">{levelInfo?.description || 'Sin descripción disponible'}</small>
              </div>
              <div className="col-md-6 mb-2">
                <strong>Calificación Numérica:</strong>
                <p className="mb-0">
                  <span className="badge bg-primary" style={{ fontSize: '18px', padding: '8px 16px' }}>
                    {grade.numericGrade !== null && grade.numericGrade !== undefined ? grade.numericGrade : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <div className="card-header bg-warning text-white">
            <h6 className="mb-0"><i className="fa fa-comment me-2"></i>Observaciones</h6>
          </div>
          <div className="card-body">
            <div className="alert alert-light border mb-0" style={{ 
              backgroundColor: '#f8f9fa',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {grade.observations || 'Sin observaciones registradas'}
            </div>
          </div>
        </div>
      </div>
    );

    showAlert({
      title: `Detalles de Calificación`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Maneja el cambio de pestañas
   */
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
  };

  /**
   * Elimina una calificación (cambio lógico de estado a I=Inactive)
   */
  const handleDelete = async (grade) => {
    showAlert({
      title: '¿Eliminar esta calificación?',
      message: `Se eliminará lógicamente la calificación del estudiante "${grade.studentId}" en el curso "${grade.courseId}". Esta acción se puede revertir.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await gradeService.deleteGrade(grade.id);
          if (response.success) {
            showSuccess('Calificación eliminada correctamente');
            
            // Actualizar el estado local: mover de activas a inactivas
            setGrades(prevGrades => prevGrades.filter(g => g.id !== grade.id));
            setInactiveGrades(prevInactive => [...prevInactive, { ...grade, status: 'I' }]);
          } else {
            showError(response.error || 'Error al eliminar la calificación');
          }
        } catch (error) {
          showError('Error al eliminar la calificación');
        }
      },
    });
  };

  /**
   * Restaura una calificación eliminada (cambio de estado de I=Inactive a A=Active)
   */
  const handleRestore = async (grade) => {
    showAlert({
      title: '¿Restaurar esta calificación?',
      message: `Se restaurará la calificación del estudiante "${grade.studentId}" y volverá a estar activa.`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await gradeService.restoreGrade(grade.id);
          if (response.success) {
            showSuccess('Calificación restaurada correctamente');
            
            // Actualizar el estado local: mover de inactivas a activas
            setInactiveGrades(prevInactive => prevInactive.filter(g => g.id !== grade.id));
            setGrades(prevGrades => [...prevGrades, { ...grade, status: 'A' }]);
          } else {
            showError(response.error || 'Error al restaurar la calificación');
          }
        } catch (error) {
          showError('Error al restaurar la calificación');
        }
      },
    });
  };

  /**
   * Restaura múltiples calificaciones seleccionadas
   */
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una calificación');
      return;
    }

    showAlert({
      title: `¿Restaurar ${selectedRowKeys.length} calificación(es)?`,
      message: 'Las calificaciones seleccionadas serán restauradas y volverán a estar disponibles.',
      type: 'info',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;
          const restoredGrades = [];

          for (const id of selectedRowKeys) {
            const response = await gradeService.restoreGrade(id);
            if (response.success) {
              successCount++;
              // Encontrar la calificación restaurada en el array de inactivas
              const restoredGrade = inactiveGrades.find(g => g.id === id);
              if (restoredGrade) {
                restoredGrades.push({ ...restoredGrade, status: 'A' });
              }
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} calificación(es) restaurada(s) correctamente`);
            
            // Actualizar el estado local
            setInactiveGrades(prevInactive => 
              prevInactive.filter(g => !selectedRowKeys.includes(g.id))
            );
            setGrades(prevGrades => [...prevGrades, ...restoredGrades]);
          }
          if (errorCount > 0) {
            showError(`Error al restaurar ${errorCount} calificación(es)`);
          }

          setSelectedRowKeys([]);
        } catch (error) {
          showError('Error en la restauración masiva');
        }
      },
    });
  };

  /**
   * Maneja el éxito del modal (crear/editar)
   */
  const handleModalSuccess = () => {
    // Siempre recargar después de crear o editar para mantener consistencia
    loadGrades();
  };

  /**
   * Maneja la cancelación del modal
   */
  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedGrade(null);
  };

  /**
   * Exporta a Excel
   */
  const handleExportExcel = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToExcel(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a Excel');
    }
  };

  /**
   * Exporta a PDF
   */
  const handleExportPDF = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToPDF(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a PDF');
    }
  };

  /**
   * Exporta a CSV
   */
  const handleExportCSV = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToCSV(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a CSV');
    }
  };

  /**
   * Imprime el reporte
   */
  const handlePrint = () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = GradeReportExporter.printReport(dataToExport);
      if (result.success) {
        showSuccess('Reporte enviado a impresión');
      } else {
        showError('Error al imprimir', result.error);
      }
    } catch (error) {
      showError('Error al imprimir el reporte');
    }
  };

  /**
   * Elimina múltiples calificaciones seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una calificación');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} calificación(es)?`,
      message: 'Las calificaciones seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await gradeService.deleteGrade(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} calificación(es) eliminada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} calificación(es)`);
          }

          setSelectedRowKeys([]);
          loadGrades();
        } catch (error) {
          showError('Error en la eliminación masiva');
        }
      },
    });
  };

  // Configuración de selección de filas
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
    }),
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Estudiante',
      dataIndex: 'studentId',
      key: 'studentId',
      sorter: (a, b) => a.studentId.localeCompare(b.studentId),
      render: (studentId) => (
        <div>
          <strong>{studentId}</strong>
        </div>
      ),
    },
    {
      title: 'Curso',
      dataIndex: 'courseId',
      key: 'courseId',
      sorter: (a, b) => a.courseId.localeCompare(b.courseId),
    },
    {
      title: 'Tipo Período',
      dataIndex: 'typePeriod',
      key: 'typePeriod',
      filters: Object.values(TypePeriod).map(period => ({
        text: period.name,
        value: period.code,
      })),
      onFilter: (value, record) => record.typePeriod === value,
    },
    {
      title: 'Tipo Evaluación',
      dataIndex: 'evaluationType',
      key: 'evaluationType',
      render: (type) => (
        <span className="badge badge-info">{type}</span>
      ),
    },
    {
      title: 'Escala de Calificación',
      dataIndex: 'gradeScale',
      key: 'gradeScale',
      render: (scale) => {
        const badgeClass = getGradeScaleBadgeClass(scale);
        const scaleInfo = GradeScale[scale];
        return (
          <Tooltip title={scaleInfo?.description}>
            <span className={`badge ${badgeClass}`}>
              {scale} - {scaleInfo?.name}
            </span>
          </Tooltip>
        );
      },
      filters: Object.values(GradeScale).map(scale => ({
        text: `${scale.code} - ${scale.name}`,
        value: scale.code,
      })),
      onFilter: (value, record) => record.gradeScale === value,
    },
    {
      title: 'Fecha Evaluación',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate),
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

        // Solo mostrar opciones de edición y eliminación para elementos activos
        if (activeTab === 'active') {
          items.push(
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
              key: 'delete',
              label: 'Eliminar',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            }
          );
        } else {
          // Solo mostrar restaurar para elementos inactivos
          items.push(
            {
              type: 'divider',
            },
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <UndoOutlined />,
              onClick: () => handleRestore(record),
            }
          );
        }

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
                    {!selectedClassroom ? 'Mis Aulas Asignadas' : 
                     `Estudiantes - ${selectedClassroom.courseName || selectedClassroom.courseId}`}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/teacher/grades">Calificaciones</Link>
                    </li>
                    {selectedClassroom && (
                      <li className="breadcrumb-item active">{selectedClassroom.courseName}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Vista de Aulas o Estudiantes */}
          {!selectedClassroom ? (
            /* VISTA DE AULAS */
            <div className="row">
              <div className="col-sm-12">
                <div className="card card-table">
                  <div className="card-body">
                    <div className="page-sub-header mb-4">
                      <h5 className="page-title">Selecciona un Aula para Calificar</h5>
                      <p className="text-muted">Haz clic en un aula para ver los estudiantes matriculados</p>
                    </div>

                    {loadingClassrooms ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Cargando...</span>
                        </div>
                        <p className="mt-2">Cargando aulas asignadas...</p>
                      </div>
                    ) : classrooms.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="fa fa-chalkboard-teacher fa-3x text-muted mb-3"></i>
                        <h5 className="text-muted">No tienes aulas asignadas</h5>
                        <p className="text-muted">Contacta con el director para que te asigne cursos</p>
                      </div>
                    ) : (
                      <div className="row">
                        {classrooms.map((classroom) => (
                          <div key={classroom.id} className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-4">
                            <div 
                              className="card h-100 shadow-sm hover-card" 
                              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                              onClick={() => handleSelectClassroom(classroom)}
                            >
                              <div className="card-body">
                                <div className="d-flex align-items-center mb-3">
                                  <div className="icon-circle bg-primary text-white me-3" style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fa fa-chalkboard-teacher fa-lg"></i>
                                  </div>
                                  <div>
                                    <h5 className="mb-0">{classroom.courseName || classroom.courseId}</h5>
                                    <small className="text-muted">Aula: {classroom.classroomName || classroom.id.substring(0, 8)}</small>
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <span className="badge bg-info">
                                    <i className="fa fa-users me-1"></i>
                                    {classroom.assignments.length} asignación(es)
                                  </span>
                                  <Button type="primary" size="small">
                                    Ver Estudiantes <i className="fa fa-arrow-right ms-1"></i>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA DE ESTUDIANTES */
            <div className="row">
              <div className="col-sm-12">
                <div className="card card-table">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Button 
                        type="default" 
                        icon={<i className="fa fa-arrow-left me-2"></i>}
                        onClick={handleBackToClassrooms}
                      >
                        Volver a Aulas
                      </Button>
                      <div className="text-end">
                        <h6 className="mb-0">Aula: {selectedClassroom.classroomName || selectedClassroom.id.substring(0, 8)}</h6>
                        <small className="text-muted">Curso: {selectedClassroom.courseName}</small>
                      </div>
                    </div>

                    {loadingStudents ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Cargando...</span>
                        </div>
                        <p className="mt-2">Cargando estudiantes...</p>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="fa fa-user-graduate fa-3x text-muted mb-3"></i>
                        <h5 className="text-muted">No hay estudiantes matriculados</h5>
                        <p className="text-muted">Esta aula no tiene estudiantes activos</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table
                          dataSource={students}
                          rowKey="id"
                          pagination={{
                            pageSize: 10,
                            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} estudiantes`
                          }}
                          columns={[
                            {
                              title: '#',
                              key: 'index',
                              width: 60,
                              render: (_, __, index) => index + 1
                            },
                            {
                              title: 'Estudiante',
                              dataIndex: 'fullName',
                              key: 'fullName',
                              sorter: (a, b) => a.fullName.localeCompare(b.fullName),
                              render: (text, record) => (
                                <div>
                                  <strong>{text}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {record.documentType}: {record.documentNumber}
                                  </small>
                                </div>
                              )
                            },
                            {
                              title: 'Padre/Tutor',
                              dataIndex: 'parentName',
                              key: 'parentName',
                              render: (text, record) => (
                                <div>
                                  {text}
                                  <br />
                                  <small className="text-muted">
                                    <i className="fa fa-phone me-1"></i>{record.parentPhone}
                                  </small>
                                </div>
                              )
                            },
                            {
                              title: 'Acciones',
                              key: 'actions',
                              width: 150,
                              render: (_, record) => (
                                <Space>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleCreate(record)}
                                  >
                                    Calificar
                                  </Button>
                                </Space>
                              )
                            }
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Modal de formulario */}
      <GradeFormModal
        visible={modalVisible}
        mode={modalMode}
        gradeData={selectedGrade}
        classroomData={selectedClassroom}
        studentData={selectedStudent}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />
    </>
  );
};

export default GradeList;