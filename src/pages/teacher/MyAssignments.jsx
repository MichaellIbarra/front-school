import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Empty, Spin, Row, Col, Table, Space, Tooltip, Tabs, Modal, Descriptions, Select, Input } from 'antd';
import { 
  ReloadOutlined, 
  BookOutlined, 
  HomeOutlined, 
  ClockCircleOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import teacherAssignmentService from '../../services/academic/teacherAssignmentService';
import gradeService from '../../services/grades/gradeService';
import AlertModal from '../../components/AlertModal';
import useAlert from '../../hooks/useAlert';
import useTitle from '../../hooks/useTitle';
import GradeFormModal from './grades/GradeFormModal';

const { TabPane } = Tabs;

/**
 * Vista para que el docente vea sus asignaciones y califique estudiantes
 * Basado en AcademicTeacherRest.java - GET /api/v1/teacher/my-assignments
 */
const MyAssignments = () => {
  useTitle('Mis Asignaciones - Docente');
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({
    teacherId: null,
    institutionId: null,
    total: 0
  });
  
  // Estados para el flujo de calificaciones
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [gradeModalMode, setGradeModalMode] = useState('create'); // 'create' o 'edit'
  const [studentGrades, setStudentGrades] = useState({}); // { studentId: [grades] }
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // 'students' o 'grades'
  
  // Estados para vista previa y filtros
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewGrade, setPreviewGrade] = useState(null);
  const [filterStudentId, setFilterStudentId] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  const { 
    alertState,
    showSuccess,
    showError, 
    handleConfirm: alertConfirm, 
    handleCancel: alertCancel 
  } = useAlert();

  useEffect(() => {
    loadMyAssignments();
  }, []);

  /**
   * Cargar mis asignaciones como docente
   */
  const loadMyAssignments = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando mis asignaciones como docente...');
      const response = await teacherAssignmentService.getMyAssignments();
      
      if (response.success) {
        setAssignments(response.data || []);
        setTeacherInfo({
          teacherId: response.teacherId,
          institutionId: response.institutionId,
          total: response.total || 0
        });
        console.log('✅ Asignaciones cargadas:', response.data);
      } else {
        showError(response.error || 'Error al cargar asignaciones');
        setAssignments([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar asignaciones:', error);
      showError('Error al cargar las asignaciones');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar estudiantes de un aula específica
   */
  const loadStudentsByClassroom = async (classroomId) => {
    if (!classroomId) {
      console.warn('⚠️ No se proporcionó classroomId');
      return;
    }
    
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = `https://lab.vallegrande.edu.pe/school/gateway/api/v1/enrollments/teacher/by-classroom/${classroomId}`;
      
      console.log('📚 Cargando estudiantes del aula...');
      console.log('   📌 Classroom ID:', classroomId);
      console.log('   🔗 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('📦 Respuesta completa del servidor:', result);

      if (response.ok) {
        const enrollments = result.data || [];
        
        console.log('✅ Total de matrículas recibidas:', enrollments.length);
        console.log('📋 Datos de matrículas:', enrollments);
        
        // Filtrar solo estudiantes activos
        const activeStudents = enrollments
          .filter(enrollment => {
            const isActive = enrollment.status === 'ACTIVE';
            console.log(`   👤 ${enrollment.firstName} ${enrollment.lastName} - Estado: ${enrollment.status} - ${isActive ? '✅' : '❌'}`);
            return isActive;
          })
          .map(enrollment => ({
            key: enrollment.id,
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
        
        console.log('✅ Estudiantes activos filtrados:', activeStudents.length);
        setStudents(activeStudents);
        
        // Cargar calificaciones de todos los estudiantes
        if (activeStudents.length > 0) {
          await loadAllStudentsGrades(activeStudents);
        }
      } else {
        console.error('❌ Error al cargar estudiantes:', response.status);
        console.error('❌ Mensaje:', result.message || 'Sin mensaje');
        showError('Error al cargar los estudiantes del aula');
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar estudiantes:', error);
      showError('Error al cargar los estudiantes');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Manejar clic en un curso para ver sus estudiantes
   */
  const handleViewStudents = (assignment) => {
    console.log('👁️ Viendo estudiantes de la asignación:');
    console.log('   📋 Assignment completo:', assignment);
    console.log('   🏫 Classroom ID:', assignment.classroomId);
    console.log('   📚 Course ID:', assignment.courseId);
    console.log('   📅 Period ID:', assignment.periodId);
    
    setSelectedAssignment(assignment);
    loadStudentsByClassroom(assignment.classroomId);
  };

  /**
   * Cargar calificaciones de todos los estudiantes del aula
   */
  const loadAllStudentsGrades = async (studentsList) => {
    setLoadingGrades(true);
    try {
      console.log('📊 Cargando calificaciones del teacher...');
      
      // Obtener TODAS las calificaciones del teacher
      const response = await gradeService.getMyGrades();
      
      if (response.success) {
        const allGrades = response.data || [];
        console.log('✅ Total de calificaciones del teacher:', allGrades.length);
        
        // Filtrar calificaciones por aula, curso y solo activas
        const filteredGrades = allGrades.filter(grade => 
          grade.classroomId === selectedAssignment?.classroomId &&
          grade.courseId === selectedAssignment?.courseId &&
          grade.status === 'A' // Solo calificaciones activas
        );
        
        console.log('📋 Calificaciones filtradas para esta aula/curso:', filteredGrades.length);
        
        // Agrupar calificaciones por estudiante
        const gradesMap = {};
        studentsList.forEach(student => {
          const studentGradesList = filteredGrades.filter(grade => 
            grade.studentId === student.id
          );
          gradesMap[student.id] = studentGradesList;
          console.log(`   ✅ ${studentGradesList.length} calificaciones para ${student.fullName}`);
        });
        
        setStudentGrades(gradesMap);
        console.log('📊 Mapa de calificaciones cargado:', gradesMap);
      } else {
        console.error('❌ Error al cargar calificaciones:', response.error);
        showError(response.error || 'Error al cargar las calificaciones');
        setStudentGrades({});
      }
    } catch (error) {
      console.error('❌ Error al cargar calificaciones:', error);
      showError('Error al cargar las calificaciones');
      setStudentGrades({});
    } finally {
      setLoadingGrades(false);
    }
  };

  /**
   * Recargar calificaciones de un estudiante específico
   */
  const reloadStudentGrades = async (studentId) => {
    try {
      console.log('🔄 Recargando calificaciones del teacher...');
      const response = await gradeService.getMyGrades();
      
      if (response.success) {
        const allGrades = response.data || [];
        
        // Filtrar calificaciones del estudiante específico en esta aula/curso
        const filteredGrades = allGrades.filter(grade => 
          grade.classroomId === selectedAssignment?.classroomId &&
          grade.courseId === selectedAssignment?.courseId &&
          grade.studentId === studentId &&
          grade.status === 'A'
        );
        
        setStudentGrades(prev => ({
          ...prev,
          [studentId]: filteredGrades
        }));
        
        console.log(`✅ Calificaciones actualizadas para estudiante ${studentId}:`, filteredGrades.length);
      }
    } catch (error) {
      console.error('Error al recargar calificaciones:', error);
    }
  };

  /**
   * Volver a la lista de asignaciones
   */
  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setStudents([]);
    setSelectedStudent(null);
  };

  /**
   * Abrir modal para calificar estudiante
   */
  const handleGradeStudent = (student) => {
    console.log('📝 Abriendo modal de calificación...');
    console.log('   👤 Estudiante seleccionado:', student);
    console.log('   🏫 Assignment seleccionado:', selectedAssignment);
    console.log('   📋 Datos para classroomData:');
    console.log('      - classroomId:', selectedAssignment?.classroomId);
    console.log('      - classroomName:', selectedAssignment?.classroomName);
    console.log('      - courseId:', selectedAssignment?.courseId);
    console.log('      - courseName:', selectedAssignment?.courseName);
    console.log('      - periodId:', selectedAssignment?.periodId);
    console.log('      - periodName:', selectedAssignment?.periodName);
    console.log('   📋 Datos para studentData:');
    console.log('      - id:', student?.id);
    console.log('      - firstName:', student?.firstName);
    console.log('      - lastName:', student?.lastName);
    console.log('      - documentNumber:', student?.documentNumber);
    
    setSelectedStudent(student);
    setSelectedGrade(null);
    setGradeModalMode('create');
    setGradeModalVisible(true);
  };

  /**
   * Abrir modal de vista previa
   */
  const handlePreviewGrade = (grade) => {
    console.log('👁️ Vista previa de calificación:', grade);
    setPreviewGrade(grade);
    setPreviewModalVisible(true);
  };

  /**
   * Cerrar modal de vista previa
   */
  const handleClosePreview = () => {
    setPreviewModalVisible(false);
    setPreviewGrade(null);
  };

  /**
   * Abrir modal para editar calificación
   */
  const handleEditGrade = (student, grade) => {
    console.log('✏️ Editando calificación:', grade);
    setSelectedStudent(student);
    setSelectedGrade(grade);
    setGradeModalMode('edit');
    setGradeModalVisible(true);
  };

  /**
   * Eliminar calificación (eliminación lógica)
   */
  const handleDeleteGrade = async (gradeId, studentId) => {
    try {
      console.log('🗑️ Eliminando calificación:', gradeId);
      const response = await gradeService.deleteGrade(gradeId);
      
      if (response.success) {
        showSuccess('Calificación eliminada exitosamente');
        await reloadStudentGrades(studentId);
      } else {
        showError(response.error || 'Error al eliminar la calificación');
      }
    } catch (error) {
      console.error('Error al eliminar calificación:', error);
      showError('Error al eliminar la calificación');
    }
  };

  /**
   * Obtener calificaciones filtradas
   */
  const getFilteredGrades = () => {
    let allGrades = Object.values(studentGrades).flat();
    
    // Filtrar por estudiante si hay filtro activo
    if (filterStudentId) {
      allGrades = allGrades.filter(grade => grade.studentId === filterStudentId);
    }
    
    // Filtrar por texto de búsqueda
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      allGrades = allGrades.filter(grade => {
        const student = students.find(s => s.id === grade.studentId);
        const studentName = student ? student.fullName.toLowerCase() : '';
        const competence = grade.competenceName.toLowerCase();
        return studentName.includes(searchLower) || competence.includes(searchLower);
      });
    }
    
    return allGrades;
  };

  /**
   * Exportar a CSV
   */
  const exportToCSV = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) {
      showError('No hay calificaciones para exportar');
      return;
    }

    const headers = ['#', 'Estudiante', 'DNI', 'Competencia', 'Capacidad', 'Tipo', 'Calificación', 'Nota Numérica', 'Fecha', 'Observaciones'];
    const rows = filteredGrades.map((grade, index) => {
      const student = students.find(s => s.id === grade.studentId);
      return [
        index + 1,
        student ? student.fullName : 'N/A',
        student ? student.documentNumber : 'N/A',
        grade.competenceName,
        grade.capacityEvaluated || 'N/A',
        grade.evaluationType,
        grade.gradeScale,
        grade.numericGrade || 'N/A',
        new Date(grade.evaluationDate).toLocaleDateString('es-PE'),
        grade.observations || 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calificaciones_${selectedAssignment.courseName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('Archivo CSV descargado exitosamente');
  };

  /**
   * Exportar a Excel (formato tabla HTML que Excel puede abrir)
   */
  const exportToExcel = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) {
      showError('No hay calificaciones para exportar');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <h2>Reporte de Calificaciones</h2>
          <p><strong>Curso:</strong> ${selectedAssignment.courseName}</p>
          <p><strong>Aula:</strong> ${selectedAssignment.classroomName}</p>
          <p><strong>Período:</strong> ${selectedAssignment.periodName}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>DNI</th>
                <th>Competencia</th>
                <th>Capacidad</th>
                <th>Tipo</th>
                <th>Calificación</th>
                <th>Nota Numérica</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGrades.map((grade, index) => {
                const student = students.find(s => s.id === grade.studentId);
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${student ? student.fullName : 'N/A'}</td>
                    <td>${student ? student.documentNumber : 'N/A'}</td>
                    <td>${grade.competenceName}</td>
                    <td>${grade.capacityEvaluated || 'N/A'}</td>
                    <td>${grade.evaluationType}</td>
                    <td>${grade.gradeScale}</td>
                    <td>${grade.numericGrade || 'N/A'}</td>
                    <td>${new Date(grade.evaluationDate).toLocaleDateString('es-PE')}</td>
                    <td>${grade.observations || 'N/A'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calificaciones_${selectedAssignment.courseName}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    showSuccess('Archivo Excel descargado exitosamente');
  };

  /**
   * Exportar a PDF (usando window.print con estilos)
   */
  const exportToPDF = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) {
      showError('No hay calificaciones para exportar');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Calificaciones</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { size: A4 landscape; margin: 1cm; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #333; text-align: center; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Reporte de Calificaciones</h2>
          <div class="info">
            <p><strong>Institución:</strong> Institución Educativa 20188 - Centro de Mujeres</p>
            <p><strong>Curso:</strong> ${selectedAssignment.courseName}</p>
            <p><strong>Aula:</strong> ${selectedAssignment.classroomName}</p>
            <p><strong>Período:</strong> ${selectedAssignment.periodName}</p>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-PE', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}</p>
            <p><strong>Total de calificaciones:</strong> ${filteredGrades.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Estudiante</th>
                <th style="width: 80px;">DNI</th>
                <th>Competencia</th>
                <th>Tipo</th>
                <th style="width: 60px;">Calif.</th>
                <th style="width: 60px;">Nota</th>
                <th style="width: 80px;">Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGrades.map((grade, index) => {
                const student = students.find(s => s.id === grade.studentId);
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${student ? student.fullName : 'N/A'}</td>
                    <td>${student ? student.documentNumber : 'N/A'}</td>
                    <td>${grade.competenceName}</td>
                    <td>${grade.evaluationType}</td>
                    <td style="text-align: center; font-weight: bold;">${grade.gradeScale}</td>
                    <td style="text-align: center;">${grade.numericGrade || '-'}</td>
                    <td>${new Date(grade.evaluationDate).toLocaleDateString('es-PE')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      showSuccess('Generando PDF... Use "Guardar como PDF" en la ventana de impresión');
    }, 250);
  };

  /**
   * Cerrar modal de calificación
   */
  const handleCloseGradeModal = () => {
    setGradeModalVisible(false);
    setSelectedStudent(null);
    setSelectedGrade(null);
    setGradeModalMode('create');
  };

  /**
   * Éxito al guardar calificación
   */
  const handleGradeSuccess = async (gradeData) => {
    console.log('✅ Calificación guardada:', gradeData);
    
    // Recargar las calificaciones del estudiante
    if (selectedStudent?.id) {
      await reloadStudentGrades(selectedStudent.id);
    }
    
    showSuccess(gradeModalMode === 'edit' 
      ? 'Calificación actualizada exitosamente' 
      : 'Calificación registrada exitosamente'
    );
    handleCloseGradeModal();
  };

  /**
   * Obtener color para el card basado en el índice
   */
  const getCardColor = (index) => {
    const colors = [
      '#1976d2', // Azul
      '#388e3c', // Verde
      '#d32f2f', // Rojo
      '#f57c00', // Naranja
      '#7b1fa2', // Púrpura
      '#0097a7', // Cyan
    ];
    return colors[index % colors.length];
  };

  /**
   * Renderizar tag de estado
   */
  const renderStatusTag = (status) => {
    const statusMap = {
      'A': { color: 'success', text: 'ACTIVO' },
      'I': { color: 'default', text: 'INACTIVO' },
      'P': { color: 'warning', text: 'PENDIENTE' },
      'C': { color: 'error', text: 'CANCELADO' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <>
      <Header />
      <Sidebar activeClassName="my-assignments" />
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">
                    {!selectedAssignment ? 'Mis Asignaciones' : 
                     `Estudiantes - ${selectedAssignment.courseName || selectedAssignment.courseId}`}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Docente</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      {!selectedAssignment ? 'Mis Asignaciones' : 'Estudiantes'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Vista condicional: Asignaciones o Estudiantes */}
          {!selectedAssignment ? (
            /* VISTA DE ASIGNACIONES */
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                  <BookOutlined className="me-2" />
                  Mis Cursos ({teacherInfo.total})
                </h4>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadMyAssignments}
                  loading={loading}
                >
                  Recargar
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spin size="large" tip="Cargando mis asignaciones..." />
                </div>
              ) : assignments.length === 0 ? (
                <Card>
                  <Empty
                    description="No tienes asignaciones registradas"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <p className="text-muted mt-3">
                      No se encontraron asignaciones para tu usuario.
                      <br />
                      Contacta con la secretaría académica si crees que esto es un error.
                    </p>
                  </Empty>
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {assignments.map((assignment, index) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={assignment.id}>
                      <Card
                        hoverable
                        className="h-100"
                        cover={
                          <div 
                            className="p-4 text-white d-flex align-items-end"
                            style={{ 
                              background: getCardColor(index),
                              minHeight: '120px',
                              borderRadius: '8px 8px 0 0'
                            }}
                          >
                            <div className="w-100">
                              <h5 className="text-white mb-1 fw-bold">
                                {assignment.courseName || `Curso ${assignment.courseId}`}
                              </h5>
                              <p className="text-white mb-0 opacity-75">
                                <HomeOutlined className="me-1" />
                                {assignment.classroomName || `Aula ${assignment.classroomId}`}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Período</small>
                            {renderStatusTag(assignment.status)}
                          </div>
                          <div className="fw-bold">
                            {assignment.periodName || `Período ${assignment.periodId}`}
                          </div>
                        </div>

                        {assignment.scheduleInfo && (
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">
                              <ClockCircleOutlined className="me-1" />
                              Horario
                            </small>
                            <div className="text-dark">{assignment.scheduleInfo}</div>
                          </div>
                        )}

                        <div className="border-top pt-3 mt-3">
                          <Button 
                            type="primary" 
                            block
                            onClick={() => handleViewStudents(assignment)}
                          >
                            Ver Estudiantes
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          ) : (
            /* VISTA DE ESTUDIANTES */
            <Card>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToAssignments}
                >
                  Volver a Mis Asignaciones
                </Button>
                <div className="text-end">
                  <h6 className="mb-0">
                    {selectedAssignment.classroomName || selectedAssignment.classroomId}
                  </h6>
                  <small className="text-muted">
                    {selectedAssignment.courseName}
                  </small>
                </div>
              </div>

              {loadingStudents || loadingGrades ? (
                <div className="text-center py-5">
                  <Spin size="large" tip={loadingStudents ? "Cargando estudiantes..." : "Cargando calificaciones..."} />
                </div>
              ) : students.length === 0 ? (
                <Empty
                  description="No hay estudiantes matriculados"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <p className="text-muted mt-3">
                    Esta aula no tiene estudiantes activos en este momento.
                  </p>
                </Empty>
              ) : (
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                  {/* Pestaña de Estudiantes */}
                  <TabPane 
                    tab={
                      <span>
                        <UserOutlined />
                        Estudiantes ({students.length})
                      </span>
                    } 
                    key="students"
                  >
                    <Table
                      dataSource={students}
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
                                DNI: {record.documentNumber}
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
                                <i className="fa fa-phone me-1"></i>
                                {record.parentPhone}
                              </small>
                            </div>
                          )
                        },
                        {
                          title: 'Acciones',
                          key: 'actions',
                          width: 150,
                          render: (_, record) => (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => handleGradeStudent(record)}
                            >
                              Calificar
                            </Button>
                          )
                        }
                      ]}
                    />
                  </TabPane>

                  {/* Pestaña de Calificaciones */}
                  <TabPane 
                    tab={
                      <span>
                        <FileTextOutlined />
                        Calificaciones ({getFilteredGrades().length})
                      </span>
                    } 
                    key="grades"
                  >
                    {/* Filtros y Exportación */}
                    <div className="mb-3">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                          <Input
                            placeholder="Buscar por estudiante o competencia..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                          />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <Select
                            placeholder="Filtrar por estudiante"
                            style={{ width: '100%' }}
                            value={filterStudentId}
                            onChange={setFilterStudentId}
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={[
                              { value: null, label: 'Todos los estudiantes' },
                              ...students.map(student => ({
                                value: student.id,
                                label: student.fullName
                              }))
                            ]}
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Space>
                            <Tooltip title="Exportar a PDF">
                              <Button
                                icon={<FilePdfOutlined />}
                                onClick={exportToPDF}
                                disabled={getFilteredGrades().length === 0}
                              >
                                PDF
                              </Button>
                            </Tooltip>
                            <Tooltip title="Exportar a Excel">
                              <Button
                                icon={<FileExcelOutlined />}
                                onClick={exportToExcel}
                                disabled={getFilteredGrades().length === 0}
                              >
                                Excel
                              </Button>
                            </Tooltip>
                            <Tooltip title="Exportar a CSV">
                              <Button
                                icon={<FileOutlined />}
                                onClick={exportToCSV}
                                disabled={getFilteredGrades().length === 0}
                              >
                                CSV
                              </Button>
                            </Tooltip>
                          </Space>
                        </Col>
                      </Row>
                    </div>

                    <Table
                      dataSource={getFilteredGrades()}
                      pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} calificaciones`
                      }}
                      columns={[
                        {
                          title: '#',
                          key: 'index',
                          width: 50,
                          render: (_, __, index) => index + 1
                        },
                        {
                          title: 'Estudiante',
                          dataIndex: 'studentId',
                          key: 'studentId',
                          render: (studentId) => {
                            const student = students.find(s => s.id === studentId);
                            return student ? (
                              <div>
                                <strong>{student.fullName}</strong>
                                <br />
                                <small className="text-muted">DNI: {student.documentNumber}</small>
                              </div>
                            ) : 'N/A';
                          }
                        },
                        {
                          title: 'Competencia',
                          dataIndex: 'competenceName',
                          key: 'competenceName',
                          ellipsis: true
                        },
                        {
                          title: 'Tipo',
                          dataIndex: 'evaluationType',
                          key: 'evaluationType',
                          width: 120,
                          render: (type) => (
                            <Tag color="blue">{type}</Tag>
                          )
                        },
                        {
                          title: 'Calificación',
                          dataIndex: 'gradeScale',
                          key: 'gradeScale',
                          width: 100,
                          render: (scale, record) => (
                            <div>
                              <Tag color="green">{scale}</Tag>
                              {record.numericGrade && (
                                <div>
                                  <small className="text-muted">{record.numericGrade}</small>
                                </div>
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Fecha',
                          dataIndex: 'evaluationDate',
                          key: 'evaluationDate',
                          width: 120,
                          render: (date) => new Date(date).toLocaleDateString('es-PE')
                        },
                        {
                          title: 'Acciones',
                          key: 'actions',
                          width: 150,
                          render: (_, record) => {
                            const student = students.find(s => s.id === record.studentId);
                            return (
                              <Space size="small">
                                <Tooltip title="Ver detalles">
                                  <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreviewGrade(record)}
                                  />
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditGrade(student, record)}
                                  />
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteGrade(record.id, record.studentId)}
                                  />
                                </Tooltip>
                              </Space>
                            );
                          }
                        }
                      ]}
                    />
                  </TabPane>
                </Tabs>
              )}
            </Card>
          )}
        </div>

        <AlertModal 
          alert={alertState} 
          onConfirm={alertConfirm} 
          onCancel={alertCancel} 
        />

        {/* Modal de Vista Previa */}
        <Modal
          title="Detalles de la Calificación"
          open={previewModalVisible}
          onCancel={handleClosePreview}
          footer={[
            <Button key="close" onClick={handleClosePreview}>
              Cerrar
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const student = students.find(s => s.id === previewGrade?.studentId);
                handleClosePreview();
                handleEditGrade(student, previewGrade);
              }}
            >
              Editar
            </Button>
          ]}
          width={800}
        >
          {previewGrade && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Estudiante" span={2}>
                <strong>
                  {students.find(s => s.id === previewGrade.studentId)?.fullName || 'N/A'}
                </strong>
                <br />
                <small className="text-muted">
                  DNI: {students.find(s => s.id === previewGrade.studentId)?.documentNumber || 'N/A'}
                </small>
              </Descriptions.Item>
              
              <Descriptions.Item label="Competencia" span={2}>
                {previewGrade.competenceName}
              </Descriptions.Item>
              
              <Descriptions.Item label="Capacidad Evaluada" span={2}>
                {previewGrade.capacityEvaluated || 'No especificada'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Tipo de Evaluación">
                <Tag color="blue">{previewGrade.evaluationType}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Tipo de Período">
                <Tag color="purple">{previewGrade.typePeriod}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Escala de Calificación">
                <Tag color="green" style={{ fontSize: '16px', padding: '4px 12px' }}>
                  {previewGrade.gradeScale}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Nota Numérica">
                {previewGrade.numericGrade ? (
                  <Tag color="cyan" style={{ fontSize: '16px', padding: '4px 12px' }}>
                    {previewGrade.numericGrade}
                  </Tag>
                ) : 'No aplica'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Fecha de Evaluación" span={2}>
                {new Date(previewGrade.evaluationDate).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Descriptions.Item>
              
              <Descriptions.Item label="Observaciones" span={2}>
                {previewGrade.observations || 'Sin observaciones'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Estado">
                {renderStatusTag(previewGrade.status)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Fecha de Registro">
                {new Date(previewGrade.createdAt).toLocaleDateString('es-PE')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Modal de Calificación */}
        <GradeFormModal
          visible={gradeModalVisible}
          mode={gradeModalMode}
          gradeData={selectedGrade}
          classroomData={selectedAssignment}
          studentData={selectedStudent}
          onSuccess={handleGradeSuccess}
          onCancel={handleCloseGradeModal}
        />
      </div>
    </>
  );
};

export default MyAssignments;
