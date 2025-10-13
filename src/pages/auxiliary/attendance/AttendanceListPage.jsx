/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import FeatherIcon from "feather-icons-react/build/FeatherIcon";
import Select from 'react-select';
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import attendanceService from "../../../services/attendance/attendanceService";
import { 
  SEARCH_TYPE_LABELS,
  JUSTIFICATION_TYPE_LABELS 
} from "../../../types/attendance";
import { pdficon, pdficon2, pdficon3, pdficon4, plusicon, refreshicon, searchnormal } from "../../../components/imagepath";
import AttendanceReportUtils from "../../../utils/attendance/attendanceReports";

const AttendanceListPage = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Funcin helper para obtener fecha local en formato YYYY-MM-DD
  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Funcin helper para formatear fecha sin problemas de zona horaria
  const formatDateLocal = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Si la fecha viene en formato YYYY-MM-DD, procesarla directamente
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Si viene con hora, crear fecha local sin conversión de zona horaria
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Estados para manejo de datos
  const [students, setStudents] = useState([]);
  const [allAttendances, setAllAttendances] = useState([]);
  const [localStudents, setLocalStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocalStudents, setLoadingLocalStudents] = useState(false);
  
  // Estados para filtros y bsqueda
  const [searchType, setSearchType] = useState('faltaron');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState('search'); // 'search', 'list-all', 'create-attendance'
  
  // Estados para filtros académicos
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStudentId, setFilterStudentId] = useState(''); // Nuevo: filtro por estudiante específico
  
  // Estados para crear asistencia
  const [studentSearchText, setStudentSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(getTodayLocalDate());
  const [attendanceObservations, setAttendanceObservations] = useState('');
  
  // Estados para editar asistencia
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para gestionar justificaciones
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationStudent, setJustificationStudent] = useState(null);
  const [justificationType, setJustificationType] = useState('MEDICAL');
  const [justificationReason, setJustificationReason] = useState('');
  const [justifications, setJustifications] = useState([]);
  const [loadingJustifications, setLoadingJustifications] = useState(false);
  const [absentStudents, setAbsentStudents] = useState([]); // Estudiantes ausentes para justificación
  const [loadingAbsentStudents, setLoadingAbsentStudents] = useState(false);
  const [selectedAbsentStudentId, setSelectedAbsentStudentId] = useState(''); // ID del estudiante seleccionado

  // Estados para marcar ausencias
  const [showMarkAbsencesModal, setShowMarkAbsencesModal] = useState(false);
  const [markAbsencesDate, setMarkAbsencesDate] = useState(getTodayLocalDate());
  const [loadingMarkAbsences, setLoadingMarkAbsences] = useState(false);

  // Estados para asistencias masivas
  const [massAttendanceDate, setMassAttendanceDate] = useState(getTodayLocalDate());
  const [selectedStudentsForAttendance, setSelectedStudentsForAttendance] = useState({}); // {studentId: true/false}
  const [loadingMassAttendance, setLoadingMassAttendance] = useState(false);
  const [massAttendanceObservations, setMassAttendanceObservations] = useState({});  // {studentId: 'observation'}

  // Opciones para el select
  const searchTypeOptions = Object.entries(SEARCH_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  // Opciones para filtros académicos (con cascada dependiente)
  // 1. Obtener todos los datos combinados
  const allData = useMemo(() => {
    return [...students, ...allAttendances, ...localStudents];
  }, [students, allAttendances, localStudents]);

  // 2. Obtener grados únicos (siempre disponibles)
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set();
    allData.forEach(s => {
      if (s.grade) {
        const normalizedGrade = String(s.grade).trim();
        gradesSet.add(normalizedGrade);
      }
    });
    return Array.from(gradesSet).sort();
  }, [allData]);

  const gradeOptions = [
    { value: '', label: 'Todos los Grados' },
    ...uniqueGrades.map(grade => ({ 
      value: grade, 
      label: `${grade}° Secundaria` 
    }))
  ];

  // 3. Obtener secciones únicas (filtradas por grado si está seleccionado)
  const uniqueSections = useMemo(() => {
    const sectionsSet = new Set();
    allData.forEach(s => {
      // Si hay filtro de grado, solo incluir secciones de ese grado
      if (filterGrade) {
        // Normalizar grados para comparación (eliminar °)
        const normalizedGrade = String(s.grade || '').trim().replace('°', '');
        const normalizedFilter = String(filterGrade).trim().replace('°', '');
        if (normalizedGrade === normalizedFilter && s.section) {
          sectionsSet.add(s.section);
        }
      } else {
        // Sin filtro de grado, mostrar todas las secciones
        s.section && sectionsSet.add(s.section);
      }
    });
    return Array.from(sectionsSet).sort();
  }, [allData, filterGrade]);

  const sectionOptions = [
    { value: '', label: 'Todas las Secciones' },
    ...uniqueSections.map(section => ({ 
      value: section, 
      label: `Sección ${section}` 
    }))
  ];

  // 4. Obtener cursos únicos (filtrados por grado y sección si están seleccionados)
  const uniqueCourses = useMemo(() => {
    const coursesSet = new Set();
    allData.forEach(s => {
      let includeThis = true;
      
      // Filtrar por grado si está seleccionado (normalizar para comparación)
      if (filterGrade) {
        const normalizedGrade = String(s.grade || '').trim().replace('°', '');
        const normalizedFilter = String(filterGrade).trim().replace('°', '');
        if (normalizedGrade !== normalizedFilter) {
          includeThis = false;
        }
      }
      
      // Filtrar por sección si está seleccionada
      if (filterSection && s.section !== filterSection) {
        includeThis = false;
      }
      
      if (includeThis && s.course) {
        coursesSet.add(s.course);
      }
    });
    return Array.from(coursesSet).sort();
  }, [allData, filterGrade, filterSection]);

  const courseOptions = [
    { value: '', label: 'Todos los Cursos' },
    ...uniqueCourses.map(course => ({ value: course, label: course }))
  ];

  // 5. Obtener estudiantes únicos (filtrados por grado, sección y curso si están seleccionados)
  const uniqueStudents = useMemo(() => {
    const studentsMap = new Map();
    
    allData.forEach(s => {
      const id = s.studentEnrollmentId || s.enrollmentId;
      const name = s.studentName || s.name;
      
      if (!id || !name) return;
      
      let includeThis = true;
      
      // Filtrar por grado si está seleccionado (normalizar para comparación)
      if (filterGrade) {
        const normalizedGrade = String(s.grade || '').trim().replace('°', '');
        const normalizedFilter = String(filterGrade).trim().replace('°', '');
        if (normalizedGrade !== normalizedFilter) {
          includeThis = false;
        }
      }
      
      // Filtrar por sección si está seleccionada
      if (filterSection && s.section !== filterSection) {
        includeThis = false;
      }
      
      // Filtrar por curso si está seleccionado
      if (filterCourse && s.course !== filterCourse) {
        includeThis = false;
      }
      
      if (includeThis && !studentsMap.has(id)) {
        studentsMap.set(id, { id, name, grade: s.grade, section: s.section, course: s.course });
      }
    });
    
    return Array.from(studentsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'es')
    );
  }, [allData, filterGrade, filterSection, filterCourse]);

  const studentOptions = [
    { value: '', label: 'Todos los Estudiantes' },
    ...uniqueStudents.map(student => ({ 
      value: student.id, 
      label: `${student.name} (ID: ${student.id})` 
    }))
  ];

  // Cargar estudiantes al cambiar los filtros
  useEffect(() => {
    if (searchType) {
      loadStudents();
    }
  }, [searchType]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-dropdown')) {
        setShowStudentDropdown(false);
      }
    };

    if (showStudentDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showStudentDropdown]);

  /**
   * Funciones de manejo para filtros en cascada
   */
  const handleGradeChange = (selectedOption) => {
    const newGrade = selectedOption.value;
    setFilterGrade(newGrade);
    
    // Si cambia el grado, limpiar filtros dependientes
    if (newGrade !== filterGrade) {
      setFilterSection('');
      setFilterCourse('');
      setFilterStudentId('');
    }
  };

  const handleSectionChange = (selectedOption) => {
    const newSection = selectedOption.value;
    setFilterSection(newSection);
    
    // Si cambia la sección, limpiar filtros dependientes
    if (newSection !== filterSection) {
      setFilterCourse('');
      setFilterStudentId('');
    }
  };

  const handleCourseChange = (selectedOption) => {
    const newCourse = selectedOption.value;
    setFilterCourse(newCourse);
    
    // Si cambia el curso, limpiar filtro de estudiante
    if (newCourse !== filterCourse) {
      setFilterStudentId('');
    }
  };

  const handleStudentChange = (selectedOption) => {
    const newStudentId = selectedOption.value;
    setFilterStudentId(newStudentId);
  };

  /**
   * Carga estudiantes locales para crear asistencias
   */
  const loadLocalStudents = async () => {
    setLoadingLocalStudents(true);
    setLocalStudents([]); // Limpiar lista anterior
    
    try {
      const response = await attendanceService.getLocalStudents();
      
      if (response.success) {
        const students = response.data || [];
        setLocalStudents(students);
        
        if (students.length === 0) {
          showWarning('No se encontraron estudiantes locales. Verifique la conexión con el servidor.');
        } else {
          showSuccess(`✓ ${students.length} estudiante(s) cargado(s) correctamente`);
        }
      } else {
        throw new Error(response.error || 'Error al cargar estudiantes');
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      showError(`Error: ${err instanceof Error ? err.message : 'No se pudo cargar la lista de estudiantes'}`);
      setLocalStudents([]);
    } finally {
      setLoadingLocalStudents(false);
    }
  };
  
  /**
   * Carga estudiantes segn el tipo de bsqueda seleccionado
   */
  const loadStudents = async () => {
    if (!searchType) return;
    
    setLoading(true);
    try {
      let response;
      
      switch (searchType) {
        case 'by-date':
          if (!selectedDate) {
            showWarning('Seleccione una fecha para bsqueda por fecha especfica');
            setLoading(false);
            return;
          }
          response = await attendanceService.getAbsentStudentsByDate(selectedDate);
          break;
          
        case 'general':
          response = await attendanceService.getAllAbsentStudents();
          break;
          
        case 'automatically-marked':
          response = await attendanceService.getAutomaticallyMarkedAbsent(selectedDate);
          break;
          
        case 'faltaron':
          response = await attendanceService.getStudentsWhoMissed(selectedDate);
          break;

        case 'all-attendance':
          response = await attendanceService.getAllAttendances(selectedDate);
          break;
          
        case 'present-by-date':
          if (!selectedDate) {
            showWarning('Seleccione una fecha para bsqueda de estudiantes presentes');
            setLoading(false);
            return;
          }
          response = await attendanceService.getPresentStudentsByDate(selectedDate);
          break;
          
        case 'attendance-report':
          response = await attendanceService.getAttendanceReport(selectedDate, selectedDate);
          break;
          
        default:
          setLoading(false);
          return;
      }
      
      if (response.success) {
        // Ordenar los estudiantes por fecha y hora (ms recientes primero)
        const sortedStudents = (response.data || []).sort((a, b) => {
          // Primero ordenar por fecha de entrada (entryDate)
          const dateA = new Date(a.entryDate || a.createdAt || 0);
          const dateB = new Date(b.entryDate || b.createdAt || 0);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Ms recientes primero
          }
          
          // Si las fechas son iguales, ordenar por hora de entrada (entryTime o entryTimestamp)
          const timeA = a.entryTimestamp ? new Date(a.entryTimestamp) : 
                       a.entryTime ? new Date(`${a.entryDate}T${a.entryTime}`) : 
                       new Date(a.createdAt || 0);
          const timeB = b.entryTimestamp ? new Date(b.entryTimestamp) : 
                       b.entryTime ? new Date(`${b.entryDate}T${b.entryTime}`) : 
                       new Date(b.createdAt || 0);
          
          return timeB.getTime() - timeA.getTime(); // Ms recientes primero
        });
        
        setStudents(sortedStudents);
        if (sortedStudents.length === 0) {
          showAlert({
            title: 'Sin resultados',
            message: 'No se encontraron estudiantes para los criterios seleccionados',
            type: 'info',
            showCancel: false,
            confirmText: 'Entendido'
          });
        } else {
          showSuccess(`Se encontraron ${sortedStudents.length} estudiante(s)`);
        }
      } else {
        showError(response.error);
        setStudents([]);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al cargar estudiantes');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga todas las asistencias para vista completa
   */
  const loadAllAttendances = async () => {
    console.log('🔍 loadAllAttendances iniciado');
    setLoading(true);
    try {
      const response = await attendanceService.getAllAttendances();
      console.log('📦 Respuesta de getAllAttendances:', response);
      
      if (response.success) {
        // Los datos ya vienen ordenados y limpios desde el servicio
        const attendances = response.data || [];
        setAllAttendances(attendances);
        
        console.log(`✅ ${attendances.length} asistencias cargadas`);
        
        if (attendances.length === 0) {
          showAlert({
            title: 'Sin registros',
            message: 'No se encontraron registros de asistencias',
            type: 'info',
            showCancel: false,
            confirmText: 'Entendido'
          });
        } else {
          showSuccess(`✓ ${attendances.length} registro(s) de asistencia cargado(s)`);
        }
      } else {
        showError(response.error || 'Error al cargar asistencias');
        setAllAttendances([]);
      }
    } catch (err) {
      console.error('❌ Error en loadAllAttendances:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar asistencias');
      setAllAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la creacion de asistencia individual
   */
  const handleCreateAttendance = async () => {
    if (!selectedStudent) {
      showWarning('Por favor seleccione un estudiante');
      return;
    }
    
    if (!attendanceDate) {
      showWarning('Por favor seleccione una fecha');
      return;
    }

    setLoading(true);
    try {
      console.log(' Creando asistencia para:', selectedStudent.name);
      const attendanceData = {
        studentEnrollmentId: selectedStudent.enrollmentId,
        studentName: selectedStudent.name,
        entryDate: attendanceDate,
        observations: attendanceObservations.trim() || '',
        registrationMethod: 'MANUAL',
        registeredBy: 'USUARIO_MANUAL'
      };

      const response = await attendanceService.createAttendance(attendanceData);
      
      if (response.success) {
        console.log(' Asistencia creada exitosamente');
        showSuccess('Asistencia creada exitosamente');
        // Limpiar formulario
        setSelectedStudent(null);
        setStudentSearchText('');
        setAttendanceObservations('');
        setShowStudentDropdown(false);
        // Recargar datos si estamos en vista de todas las asistencias
        if (activeView === 'list-all') {
          loadAllAttendances();
        }
      } else {
        console.error(' Error en respuesta del servicio:', response.error);
        throw new Error(response.error || 'Error al crear asistencia');
      }
    } catch (err) {
      console.error(' Error al crear asistencia:', err);
      showError(err instanceof Error ? err.message : 'Error al crear asistencia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abrir modal de edicin con datos de asistencia
   */
  const handleEditAttendance = (attendance) => {
    setEditingAttendance(attendance);
    setAttendanceDate(attendance.entryDate ? attendance.entryDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setAttendanceObservations(attendance.observations || '');
    setShowEditModal(true);
  };

  /**
   * Actualizar asistencia existente
   */
  const handleUpdateAttendance = async () => {
    if (!editingAttendance || !editingAttendance.id) {
      showWarning('No se puede actualizar la asistencia. ID no encontrado.');
      return;
    }

    setLoading(true);
    try {
      const attendanceData = {
        entryDate: attendanceDate,
        observations: attendanceObservations.trim() || ''
      };

      console.log(' Actualizando asistencia ID:', editingAttendance.id);
      const response = await attendanceService.updateAttendance(editingAttendance.id, attendanceData);
      
      if (response.success) {
        console.log(' Asistencia actualizada exitosamente');
        showSuccess('Asistencia actualizada exitosamente');
        setShowEditModal(false);
        setEditingAttendance(null);
        
        // Recargar datos segn la vista activa
        if (activeView === 'list-all') {
          loadAllAttendances();
        } else {
          loadStudents();
        }
      } else {
        console.error(' Error en respuesta del servicio:', response.error);
        throw new Error(response.error || 'Error al actualizar asistencia');
      }
    } catch (err) {
      console.error(' Error al actualizar asistencia:', err);
      showError(err instanceof Error ? err.message : 'Error al actualizar asistencia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar modal de edicin
   */
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAttendance(null);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceObservations('');
  };

  /**
   * Abrir modal de justificacin
   */
  const handleOpenJustificationModal = async (student) => {
    setJustificationStudent(student);
    setJustificationType('MEDICAL');
    setJustificationReason('');
    setSelectedAbsentStudentId(student?.id || student?.studentEnrollmentId || '');
    setShowJustificationModal(true);
    
    // Cargar estudiantes ausentes cuando se abre el modal
    await loadAbsentStudentsForJustification();
  };

  /**
   * Cargar estudiantes ausentes para crear justificaciones
   */
  const loadAbsentStudentsForJustification = async () => {
    setLoadingAbsentStudents(true);
    try {
      // Obtener estudiantes ausentes del día actual
      const response = await attendanceService.getAllAbsentStudents();
      
      if (response.success) {
        const absent = response.data || [];
        setAbsentStudents(absent);
        console.log(`📋 ${absent.length} estudiante(s) ausente(s) cargado(s) para justificación`);
      } else {
        showError(response.error || 'Error al cargar estudiantes ausentes');
        setAbsentStudents([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar estudiantes ausentes:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar estudiantes ausentes');
      setAbsentStudents([]);
    } finally {
      setLoadingAbsentStudents(false);
    }
  };

  /**
   * Crear nueva justificacin usando attendanceService
   * POST /api/v1/justifications
   */
  const handleCreateJustificationDirect = async () => {
    // Verificar que se haya seleccionado un estudiante ausente
    if (!selectedAbsentStudentId) {
      showWarning('Por favor seleccione un estudiante ausente');
      return;
    }
    
    if (!justificationReason.trim()) {
      showWarning('Por favor ingrese la razón de la justificación');
      return;
    }

    setLoading(true);
    try {
      const justificationData = {
        attendanceId: selectedAbsentStudentId,
        justificationType: justificationType,
        justificationReason: justificationReason.trim(),
        submissionDate: new Date().toISOString(),
        submittedBy: 'Auxiliar',
        approvalStatus: 'PENDING'
      };

      const response = await attendanceService.createJustification(justificationData);
      
      if (response.success) {
        showSuccess('Justificación creada exitosamente');
        setShowJustificationModal(false);
        setJustificationStudent(null);
        setJustificationReason('');
        setSelectedAbsentStudentId('');
        
        // Recargar datos según la vista activa
        if (activeView === 'list-all') {
          loadAllAttendances();
        } else if (activeView === 'justifications') {
          loadJustifications();
        } else {
          loadStudents();
        }
      } else {
        if (response.validationErrors) {
          const errors = Object.values(response.validationErrors).join(', ');
          showError(`Errores de validación: ${errors}`);
        } else {
          showError(response.error || 'Error al crear justificación');
        }
      }
    } catch (err) {
      console.error('❌ Error al crear justificación:', err);
      showError(err instanceof Error ? err.message : 'Error al crear justificación');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener todas las justificaciones activas usando attendanceService
   * GET /api/v1/justifications
   */
  const loadJustifications = async () => {
    setLoadingJustifications(true);
    try {
      const response = await attendanceService.getAllJustifications();
      
      if (response.success) {
        setJustifications(response.data || []);
        if (response.data?.length === 0) {
          showAlert({
            title: 'Sin justificaciones',
            message: 'No se encontraron justificaciones registradas',
            type: 'info',
            showCancel: false,
            confirmText: 'Entendido'
          });
        }
      } else {
        showError(response.error || 'Error al cargar justificaciones');
        setJustifications([]);
      }
    } catch (err) {
      console.error(' Error al cargar justificaciones:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar justificaciones');
      setJustifications([]);
    } finally {
      setLoadingJustifications(false);
    }
  };

  /**
   * Aprobar justificacin usando attendanceService
   * PUT /api/v1/justifications/{id}/approve
   */
  const handleApproveJustification = async (justificationId) => {
    setLoading(true);
    try {
      const approvalData = {
        approvedBy: 'Auxiliar',
        approvalComments: 'Aprobado desde gestin de asistencias'
      };

      const response = await attendanceService.approveJustification(justificationId, approvalData);
      
      if (response.success) {
        showSuccess('Justificacin aprobada exitosamente');
        loadJustifications(); // Recargar justificaciones
      } else {
        showError(response.error || 'Error al aprobar justificacin');
      }
    } catch (err) {
      console.error(' Error al aprobar justificacin:', err);
      showError(err instanceof Error ? err.message : 'Error al aprobar justificacin');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar modal de justificacin
   */
  const handleCloseJustificationModal = () => {
    setShowJustificationModal(false);
    setJustificationStudent(null);
    setJustificationReason('');
    setJustificationType('MEDICAL');
    setSelectedAbsentStudentId('');
    setAbsentStudents([]);
  };

  /**
   * Maneja el cambio de tipo de bsqueda
   */
  const handleSearchTypeChange = (selectedOption) => {
    setSearchType(selectedOption.value);
    setSelectedDate('');
    setStudents([]);
  };

  /**
   * Maneja el cambio de vista
   */
  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'list-all') {
      loadAllAttendances();
    } else if (view === 'create-attendance') {
      loadLocalStudents();
    } else if (view === 'justifications') {
      loadJustifications();
    } else {
      // Al volver a la vista de bsqueda, recargar si hay un tipo de bsqueda seleccionado
      if (searchType) {
        loadStudents();
      }
    }
  };

  /**
   * Navega a crear justificacin para un estudiante
   */
  const handleCreateJustification = (student) => {
    navigate('/auxiliary/justifications', { 
      state: { 
        student,
        createMode: true 
      } 
    });
  };

  /**
   * Marca ausencias automticamente para una fecha especfica
   */
  const handleMarkAbsencesForDate = async () => {
    if (!markAbsencesDate) {
      showWarning('Por favor seleccione una fecha');
      return;
    }

    // Confirmar accin
    const confirmed = window.confirm(
      `Est seguro de marcar ausencias automticamente para ${markAbsencesDate}?\n\n` +
      `Esto marcar como ausentes a todos los estudiantes que no registraron asistencia en esta fecha.`
    );
    
    if (!confirmed) return;

    setLoadingMarkAbsences(true);
    try {
      console.log(' Marcando ausencias para fecha:', markAbsencesDate);
      const response = await attendanceService.markAbsencesForDate(markAbsencesDate);
      
      if (response.success) {
        console.log(' Ausencias marcadas exitosamente:', response.data);
        showSuccess(
          `Ausencias marcadas exitosamente para ${markAbsencesDate}. ` +
          `${response.data?.markedAbsences || 0} estudiantes marcados como ausentes.`
        );
        setShowMarkAbsencesModal(false);
        
        // Recargar datos si la fecha coincide con la fecha seleccionada actual
        if (markAbsencesDate === selectedDate) {
          loadAllAttendances();
        }
      } else {
        console.error(' Error al marcar ausencias:', response.error);
        throw new Error(response.error || 'Error al marcar ausencias');
      }
    } catch (err) {
      console.error(' Error al marcar ausencias:', err);
      showError(err instanceof Error ? err.message : 'Error al marcar ausencias automticamente');
    } finally {
      setLoadingMarkAbsences(false);
    }
  };

  /**
   * Determina el estado de asistencia de un estudiante basado en todos los indicadores disponibles
   */
  const determineAttendanceStatus = (student) => {
    const observations = (student.observations || '').toLowerCase();
    
    // 1. PRIORIDAD: Verificar palabras clave de ausencia en observaciones
    if (observations.includes('falto') || 
        observations.includes('faltó') || 
        observations.includes('ausente') ||
        observations.includes('no asistio') ||
        observations.includes('no asistió') ||
        observations.includes('no registr') ||
        observations.includes('no registro')) {
      return 'absent';
    }
    
    // 2. Verificar si está explícitamente marcado como presente en observaciones
    if (observations.includes('presente') || observations.includes('asistio') || observations.includes('asistió')) {
      return 'present';
    }
    
    // 3. Verificar el campo attendanceStatus o status explícito
    if (student.attendanceStatus === 'PRESENT' || student.status === 'PRESENT') {
      return 'present';
    }
    
    if (student.attendanceStatus === 'ABSENT' || student.status === 'ABSENT') {
      return 'absent';
    }
    
    // 4. Si es registro manual sin observaciones claras, asumir presente
    if (student.registrationMethod === 'MANUAL' && student.entryTime) {
      return 'present';
    }
    
    // 5. Si es automático, analizar el contexto
    if (student.registrationMethod === 'AUTOMATIC') {
      // Si tiene hora de entrada, probablemente presente
      if (student.entryTime && !observations.includes('no')) {
        return 'automatic';
      }
      return 'absent';
    }
    
    // 6. Estado por defecto si no hay información clara
    return 'undefined';
  };

  /**
   * Maneja el cambio de checkbox para un estudiante
   */
  const handleCheckboxChange = (studentId, isChecked) => {
    setSelectedStudentsForAttendance(prev => ({
      ...prev,
      [studentId]: isChecked
    }));
  };

  /**
   * Seleccionar todos los estudiantes
   */
  const handleSelectAll = (isChecked) => {
    const newSelection = {};
    localStudents.forEach(student => {
      newSelection[student.enrollmentId] = isChecked;
    });
    setSelectedStudentsForAttendance(newSelection);
  };

  /**
   * Maneja el cambio de observaciones para un estudiante
   */
  const handleObservationChange = (studentId, observation) => {
    setMassAttendanceObservations(prev => ({
      ...prev,
      [studentId]: observation
    }));
  };

  /**
   * Crear asistencias masivas
   */
  const handleCreateMassAttendances = async () => {
    // Obtener estudiantes seleccionados (marcados como presentes)
    const selectedStudents = localStudents.filter(
      student => selectedStudentsForAttendance[student.enrollmentId] === true
    );

    if (selectedStudents.length === 0) {
      showWarning('Por favor seleccione al menos un estudiante que asisti');
      return;
    }

    if (!massAttendanceDate) {
      showWarning('Por favor seleccione una fecha');
      return;
    }

    showAlert({
      title: 'Crear asistencias masivas?',
      message: `Se crearn ${selectedStudents.length} asistencia(s) para la fecha ${massAttendanceDate}`,
      type: 'info',
      onConfirm: async () => {
        setLoadingMassAttendance(true);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
          // Crear asistencias una por una
          for (const student of selectedStudents) {
            try {
              const attendanceData = {
                studentEnrollmentId: student.enrollmentId,
                studentName: student.name,
                entryDate: massAttendanceDate,
                observations: massAttendanceObservations[student.enrollmentId] || 'Presente',
                registrationMethod: 'MANUAL',
                registeredBy: 'USUARIO_MASIVO'
              };

              const response = await attendanceService.createAttendance(attendanceData);
              
              if (response.success) {
                successCount++;
              } else {
                errorCount++;
                errors.push(`${student.name}: ${response.error}`);
              }
            } catch (err) {
              errorCount++;
              errors.push(`${student.name}: ${err.message}`);
            }
          }

          // Mostrar resultado
          if (successCount > 0 && errorCount === 0) {
            showSuccess(` ${successCount} asistencia(s) creada(s) exitosamente`);
            // Limpiar seleccin
            setSelectedStudentsForAttendance({});
            setMassAttendanceObservations({});
            // Recargar datos
            if (activeView === 'list-all') {
              loadAllAttendances();
            }
          } else if (successCount > 0 && errorCount > 0) {
            showWarning(` ${successCount} exitosas, ${errorCount} fallidas. Revise la consola para ms detalles.`);
            console.error('Errores en asistencias masivas:', errors);
          } else {
            showError(` Error al crear asistencias: ${errors.join(', ')}`);
            console.error('Errores en asistencias masivas:', errors);
          }
        } catch (err) {
          showError(`Error inesperado: ${err.message}`);
          console.error('Error creando asistencias masivas:', err);
        } finally {
          setLoadingMassAttendance(false);
        }
      }
    });
  };

  /**
   * Exportar estudiantes ausentes a PDF
   */
  const exportAbsentStudentsToPDF = () => {
    if (students.length === 0) {
      showWarning('No hay datos para exportar');
      return;
    }
    
    // Determinar el nivel de reporte
    const reportLevel = filterStudentId 
      ? 'ESTUDIANTE' 
      : (filterGrade && filterSection) 
        ? 'GRADO-SECCION' 
        : 'GENERAL';
    
    const filterInfo = {
      level: reportLevel,
      studentId: filterStudentId,
      studentName: filterStudentId ? studentOptions.find(opt => opt.value === filterStudentId)?.label : null,
      grade: filterGrade,
      section: filterSection,
      course: filterCourse
    };
    
    AttendanceReportUtils.exportAbsentStudentsToPDF(students, SEARCH_TYPE_LABELS[searchType], filterInfo);
    showSuccess('Reporte PDF generado correctamente');
  };

  /**
   * Exportar estudiantes ausentes a Excel
   */
  const exportAbsentStudentsToExcel = () => {
    if (students.length === 0) {
      showWarning('No hay datos para exportar');
      return;
    }
    AttendanceReportUtils.exportAbsentStudentsToExcel(students, SEARCH_TYPE_LABELS[searchType]);
    showSuccess('Reporte Excel descargado correctamente');
  };

  /**
   * Exportar estudiantes ausentes a CSV
   */
  const exportAbsentStudentsToCSV = () => {
    if (students.length === 0) {
      showWarning('No hay datos para exportar');
      return;
    }
    AttendanceReportUtils.exportAbsentStudentsToCSV(students, SEARCH_TYPE_LABELS[searchType]);
    showSuccess('Reporte CSV descargado correctamente');
  };

  /**
   * Exportar todas las asistencias a PDF (usa datos filtrados)
   */
  const exportAllAttendancesToPDF = () => {
    // Usar getCurrentData para obtener los datos filtrados actuales
    const dataToExport = getCurrentData;
    
    if (dataToExport.length === 0) {
      showWarning('No hay datos para exportar. Aplica los filtros o carga datos primero.');
      return;
    }
    
    // Detectar nivel de reporte basado en los filtros activos
    const reportLevel = filterStudentId 
      ? 'ESTUDIANTE' 
      : (filterGrade && filterSection) 
        ? 'GRADO-SECCION' 
        : 'GENERAL';

    const filterInfo = {
      level: reportLevel,
      studentId: filterStudentId,
      studentName: filterStudentId ? studentOptions.find(opt => opt.value === filterStudentId)?.label : null,
      grade: filterGrade,
      section: filterSection,
      course: filterCourse
    };
    
    console.log('📄 Generando reporte PDF con:', {
      registros: dataToExport.length,
      nivel: reportLevel,
      filtros: filterInfo
    });
    
    // Usar la misma función de ausentes pero con los datos filtrados
    AttendanceReportUtils.exportAbsentStudentsToPDF(dataToExport, 'Reporte de Asistencias', filterInfo);
    showSuccess(`✓ Reporte PDF generado: ${dataToExport.length} registro(s)`);
  };

  /**
   * Exportar todas las asistencias a Excel (usa datos filtrados)
   */
  const exportAllAttendancesToExcel = () => {
    const dataToExport = getCurrentData;
    
    if (dataToExport.length === 0) {
      showWarning('No hay datos para exportar. Aplica los filtros o carga datos primero.');
      return;
    }
    
    AttendanceReportUtils.exportAbsentStudentsToExcel(dataToExport, 'Reporte de Asistencias');
    showSuccess(`✓ Reporte Excel descargado: ${dataToExport.length} registro(s)`);
  };

  /**
   * Exportar todas las asistencias a CSV (usa datos filtrados)
   */
  const exportAllAttendancesToCSV = () => {
    const dataToExport = getCurrentData;
    
    if (dataToExport.length === 0) {
      showWarning('No hay datos para exportar. Aplica los filtros o carga datos primero.');
      return;
    }
    
    AttendanceReportUtils.exportAbsentStudentsToCSV(dataToExport, 'Reporte de Asistencias');
    showSuccess(`✓ Reporte CSV descargado: ${dataToExport.length} registro(s)`);
  };

  /**
   * Exportar justificaciones a PDF
   */
  const exportJustificationsToPDF = () => {
    if (justifications.length === 0) {
      showWarning('No hay justificaciones para exportar');
      return;
    }
    AttendanceReportUtils.exportJustificationsToPDF(justifications, 'Justificaciones');
    showSuccess('Reporte PDF de justificaciones generado correctamente');
  };

  /**
   * Exportar justificaciones a Excel
   */
  const exportJustificationsToExcel = () => {
    if (justifications.length === 0) {
      showWarning('No hay justificaciones para exportar');
      return;
    }
    AttendanceReportUtils.exportJustificationsToExcel(justifications, 'Justificaciones');
    showSuccess('Reporte Excel de justificaciones descargado correctamente');
  };

  /**
   * Exportar justificaciones a CSV
   */
  const exportJustificationsToCSV = () => {
    if (justifications.length === 0) {
      showWarning('No hay justificaciones para exportar');
      return;
    }
    AttendanceReportUtils.exportJustificationsToCSV(justifications, 'Justificaciones');
    showSuccess('Reporte CSV de justificaciones descargado correctamente');
  };

  /**
   * Generar reporte de resumen
   */
  const generateSummaryReport = () => {
    if (students.length === 0 && justifications.length === 0) {
      showWarning('No hay datos suficientes para generar un reporte de resumen');
      return;
    }
    const summary = AttendanceReportUtils.generateAttendanceSummaryReport(students, justifications);
    if (summary) {
      AttendanceReportUtils.exportSummaryReportToPDF(summary);
      showSuccess('Reporte de resumen generado correctamente');
    } else {
      showError('Error al generar el reporte de resumen');
    }
  };

  /**
   * Filtrar estudiantes por texto de búsqueda y filtros académicos
   */
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtro por texto
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesText = (
          student.studentName?.toLowerCase().includes(search) ||
          student.studentEnrollmentId?.toLowerCase().includes(search) ||
          student.email?.toLowerCase().includes(search)
        );
        if (!matchesText) return false;
      }
      
      // PRIORIDAD: Si hay filtro de estudiante específico, solo aplicar ese filtro
      if (filterStudentId) {
        return student.studentEnrollmentId === filterStudentId;
      }
      
      // Si no hay filtro de estudiante, aplicar filtros académicos
      if (filterGrade) {
        // Normalizar ambos valores: eliminar "°" y espacios para comparar
        const studentGrade = String(student.grade || '').trim().replace('°', '');
        const filterGradeStr = String(filterGrade).trim().replace('°', '');
        if (studentGrade !== filterGradeStr) return false;
      }
      
      if (filterSection) {
        const studentSection = String(student.section || '').trim().toUpperCase();
        const filterSectionStr = String(filterSection).trim().toUpperCase();
        if (studentSection !== filterSectionStr) return false;
      }
      
      if (filterCourse) {
        const studentCourse = String(student.course || '').trim();
        const filterCourseStr = String(filterCourse).trim();
        if (studentCourse !== filterCourseStr) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Ordenar alfabéticamente por nombre
      const nameA = (a.studentName || '').toLowerCase();
      const nameB = (b.studentName || '').toLowerCase();
      return nameA.localeCompare(nameB, 'es');
    });
  }, [students, searchText, filterGrade, filterSection, filterCourse, filterStudentId]);

  /**
   * Filtrar todas las asistencias por texto de búsqueda y filtros académicos
   */
  const filteredAllAttendances = useMemo(() => {
    console.log('🔄 Filtrando asistencias con:', { 
      filterGrade, 
      filterSection, 
      filterCourse, 
      filterStudentId, 
      searchText,
      totalRecords: allAttendances.length 
    });

    const filtered = allAttendances.filter(attendance => {
      // Filtro por texto
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesText = (
          attendance.studentName?.toLowerCase().includes(search) ||
          attendance.studentEnrollmentId?.toLowerCase().includes(search) ||
          attendance.email?.toLowerCase().includes(search)
        );
        if (!matchesText) return false;
      }
      
      // PRIORIDAD: Si hay filtro de estudiante específico, solo aplicar ese filtro
      if (filterStudentId) {
        return attendance.studentEnrollmentId === filterStudentId;
      }
      
      // Si no hay filtro de estudiante, aplicar filtros académicos
      if (filterGrade) {
        const attendanceGrade = String(attendance.grade || '').trim().replace('°', '');
        const filterGradeStr = String(filterGrade).trim().replace('°', '');
        if (attendanceGrade !== filterGradeStr) return false;
      }
      
      if (filterSection) {
        const attendanceSection = String(attendance.section || '').trim().toUpperCase();
        const filterSectionStr = String(filterSection).trim().toUpperCase();
        if (attendanceSection !== filterSectionStr) return false;
      }
      
      if (filterCourse) {
        const attendanceCourse = String(attendance.course || '').trim();
        const filterCourseStr = String(filterCourse).trim();
        if (attendanceCourse !== filterCourseStr) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Ordenar alfabéticamente por nombre
      const nameA = (a.studentName || '').toLowerCase();
      const nameB = (b.studentName || '').toLowerCase();
      return nameA.localeCompare(nameB, 'es');
    });

    console.log('✅ Resultado filtrado:', filtered.length, 'registros de', allAttendances.length, 'totales');
    
    return filtered;
  }, [allAttendances, searchText, filterGrade, filterSection, filterCourse, filterStudentId]);

  /**
   * Filtrar estudiantes locales (para crear asistencias) por filtros académicos
   */
  const filteredLocalStudents = localStudents.filter(student => {
    // Filtros académicos
    if (filterGrade && student.grade !== filterGrade) return false;
    if (filterSection && student.section !== filterSection) return false;
    if (filterCourse && student.course !== filterCourse) return false;
    
    return true;
  }).sort((a, b) => {
    // Ordenar alfabéticamente por nombre
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'es');
  });

  /**
   * Obtener datos actuales segn la vista activa
   */
  const getCurrentData = useMemo(() => {
    const data = activeView === 'list-all' ? filteredAllAttendances : filteredStudents;
    console.log('📊 getCurrentData recalculado:', {
      activeView,
      dataLength: data.length,
      filterGrade,
      filterSection,
      filterCourse
    });
    return data;
  }, [activeView, filteredAllAttendances, filteredStudents, filterGrade, filterSection, filterCourse]);

  /**
   * Refreshar datos segn la vista activa
   */
  const handleRefresh = () => {
    console.log(' handleRefresh llamado - Vista activa:', activeView);
    if (activeView === 'list-all') {
      console.log(' Cargando todas las asistencias...');
      loadAllAttendances();
    } else {
      console.log(' Cargando bsqueda de estudiantes...');
      loadStudents();
    }
  };

  return (
    <>
      <div className="main-wrapper">
        <Header />
        <Sidebar id='menu-item-attendance' id1='menu-items-attendance' activeClassName='attendance-list'/>
        <div className="page-wrapper">
          <div className="content container-fluid">
            
            {/* Page Header */}
            <div className="page-header">
              <div className="row">
                <div className="col-sm-12">
                  <div className="page-sub-header">
                    <h3 className="page-title"> Gestin de Asistencias y Ausencias</h3>
                    <ul className="breadcrumb">
                      <li className="breadcrumb-item">
                        <Link to="/dashboard">Dashboard</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <i className="feather-chevron-right">
                          <FeatherIcon icon="chevron-right" />
                        </i>
                      </li>
                      <li className="breadcrumb-item active">Buscar Estudiantes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* /Page Header */}

            <div className="row">
              <div className="col-sm-12">
                <div className="card card-table show-entire">
                  <div className="card-body">
                    
                    {/* Table Header */}
                    <div className="page-table-header mb-2">
                      <div className="row align-items-center">
                        <div className="col">
                          <div className="doctor-table-blk">
                            <h3>Buscar Estudiantes (Presentes/Ausentes)</h3>
                            <div className="doctor-search-blk">
                              <div className="top-nav-search table-search-blk">
                                <form onSubmit={(e) => e.preventDefault()}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por nombre, ID matrcula, email..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                  />
                                  <Link className="btn" onClick={(e) => e.preventDefault()}>
                                    <img src={searchnormal} alt="Search" />
                                  </Link>
                                </form>
                              </div>
                              <div className="add-group">
                                <Link
                                  to="/auxiliary/justifications"
                                  className="btn btn-primary add-pluss ms-2"
                                  title="Ir a Gestin de Justificaciones"
                                >
                                  <img src={plusicon} alt="Add" />
                                </Link>
                                <Link
                                  to="#"
                                  className="btn btn-primary doctor-refresh ms-2"
                                  onClick={handleRefresh}
                                  title="Actualizar datos"
                                >
                                  <img src={refreshicon} alt="Refresh" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-auto text-end float-end ms-auto download-grp">
                          <Link to="#" className="me-2" onClick={(e) => { e.preventDefault(); exportAbsentStudentsToCSV(); }} title="Exportar CSV">
                            <img src={pdficon} alt="CSV" />
                          </Link>
                          <Link to="#" className="me-2" onClick={(e) => { e.preventDefault(); exportAbsentStudentsToExcel(); }} title="Exportar Excel">
                            <img src={pdficon2} alt="Excel" />
                          </Link>
                          <Link to="#" className="me-2" onClick={(e) => { e.preventDefault(); exportAbsentStudentsToPDF(); }} title="Exportar PDF">
                            <img src={pdficon3} alt="PDF" />
                          </Link>
                          <Link to="#" onClick={(e) => { e.preventDefault(); generateSummaryReport(); }} title="Reporte Resumen">
                            <img src={pdficon4} alt="Summary" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* /Table Header */}

                    {/* Navegacin de Vistas */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded">
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('search'); }}
                            >
                               Bsqueda de Estudiantes
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'list-all' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('list-all'); }}
                            >
                               Todas las Asistencias
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'create-attendance' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('create-attendance'); }}
                            >
                               Crear Asistencia
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className="nav-link"
                              to="#"
                              onClick={(e) => { e.preventDefault(); setShowMarkAbsencesModal(true); }}
                            >
                               Marcar Ausencias
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'justifications' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('justifications'); }}
                            >
                               Ver Justificaciones
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Navegacin de Vistas */}

                    {/* Filtros de bsqueda - Solo mostrar en vista de bsqueda */}
                    {activeView === 'search' && (
                    <div className="staff-search-table">
                      <form onSubmit={(e) => e.preventDefault()}>
                        <div className="row">
                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>Tipo de Bsqueda <span className="text-danger">*</span></label>
                              <Select
                                value={searchTypeOptions.find(option => option.value === searchType)}
                                onChange={handleSearchTypeChange}
                                options={searchTypeOptions}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                id="search-type"
                                components={{
                                  IndicatorSeparator: () => null
                                }}
                                placeholder="Seleccione tipo de bsqueda"
                              />
                            </div>
                          </div>

                          {/* Selector de fecha condicional */}
                          {(searchType === 'by-date' || searchType === 'faltaron' || searchType === 'automatically-marked' || 
                            searchType === 'present-by-date' || searchType === 'all-attendance' || searchType === 'attendance-report') && (
                            <div className="col-12 col-md-6 col-xl-4">
                              <div className="form-group local-forms">
                                <label>
                                  Fecha {(searchType === 'by-date' || searchType === 'present-by-date') ? '(Requerida)' : '(Opcional)'}
                                  {(searchType === 'by-date' || searchType === 'present-by-date') && <span className="text-danger"> *</span>}
                                </label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  required={searchType === 'by-date' || searchType === 'present-by-date'}
                                />
                              </div>
                            </div>
                          )}

                          {/* Filtros Académicos */}
                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>Grado (Filtro)</label>
                              <Select
                                value={gradeOptions.find(option => option.value === filterGrade)}
                                onChange={handleGradeChange}
                                options={gradeOptions}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{
                                  IndicatorSeparator: () => null
                                }}
                                placeholder="Todos los Grados"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>Sección (Filtro)</label>
                              <Select
                                value={sectionOptions.find(option => option.value === filterSection)}
                                onChange={handleSectionChange}
                                options={sectionOptions}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{
                                  IndicatorSeparator: () => null
                                }}
                                placeholder="Todas las Secciones"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>Curso (Filtro)</label>
                              <Select
                                value={courseOptions.find(option => option.value === filterCourse)}
                                onChange={handleCourseChange}
                                options={courseOptions}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{
                                  IndicatorSeparator: () => null
                                }}
                                placeholder="Todos los Cursos"
                              />
                            </div>
                          </div>

                          {/* Filtro por Estudiante Individual (NIVEL ESTUDIANTE) */}
                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>
                                Estudiante Específico (Nivel Individual) 
                                {filterStudentId && <span className="badge badge-success ms-2">Activo</span>}
                              </label>
                              <Select
                                value={studentOptions.find(option => option.value === filterStudentId)}
                                onChange={handleStudentChange}
                                options={studentOptions}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                components={{
                                  IndicatorSeparator: () => null
                                }}
                                placeholder="Seleccionar un estudiante..."
                                isClearable
                              />
                              <small className="text-muted">
                                Seleccione para ver solo asistencias/faltas de este estudiante
                              </small>
                            </div>
                          </div>

                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="doctor-submit">
                              <button
                                type="button"
                                className="btn btn-primary submit-list-form me-2"
                                onClick={loadStudents}
                                disabled={loading}
                              >
                                {loading ? 'Buscando...' : ' Buscar Estudiantes'}
                              </button>
                              {(filterGrade || filterSection || filterCourse || filterStudentId) && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setFilterGrade('');
                                    setFilterSection('');
                                    setFilterCourse('');
                                    setFilterStudentId('');
                                  }}
                                  title="Limpiar todos los filtros"
                                >
                                  <FeatherIcon icon="x-circle" /> Limpiar Filtros
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                    )}
                    {/* /Filtros de bsqueda */}

                    {/* Formulario de crear asistencias masivas - Solo mostrar en vista de crear asistencia */}
                    {activeView === 'create-attendance' && (
                    <div className="staff-search-table">
                      <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="card-title"> Registro Masivo de Asistencias</h5>
                          <div className="d-flex gap-2 align-items-center">
                            <div className="form-group mb-0">
                              <label className="me-2 mb-0">Fecha:</label>
                              <input
                                type="date"
                                className="form-control form-control-sm d-inline-block"
                                style={{width: '150px'}}
                                value={massAttendanceDate}
                                onChange={(e) => setMassAttendanceDate(e.target.value)}
                              />
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                if (localStudents.length === 0) {
                                  loadLocalStudents();
                                }
                              }}
                              disabled={loadingLocalStudents}
                            >
                              {loadingLocalStudents ? ' Cargando...' : ' Actualizar Estudiantes'}
                            </button>
                          </div>
                        </div>
                        <div className="card-body">
                          {loadingLocalStudents ? (
                            <div className="text-center py-5">
                              <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Cargando estudiantes...</span>
                              </div>
                              <p className="mt-2">Cargando lista de estudiantes...</p>
                            </div>
                          ) : localStudents.length === 0 ? (
                            <div className="text-center py-5">
                              <i className="feather-users mb-2" style={{fontSize: '48px', color: '#ccc'}}>
                                <FeatherIcon icon="users" size={48} />
                              </i>
                              <p className="text-muted">No se encontraron estudiantes</p>
                              <button
                                className="btn btn-primary"
                                onClick={loadLocalStudents}
                                disabled={loadingLocalStudents}
                              >
                                Cargar Estudiantes
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Barra de filtros académicos */}
                              <div className="row mb-3">
                                <div className="col-12">
                                  <div className="card">
                                    <div className="card-body py-2">
                                      <div className="row align-items-end">
                                        <div className="col-md-3">
                                          <label className="form-label mb-1 small">Filtrar por Grado</label>
                                          <Select
                                            value={gradeOptions.find(option => option.value === filterGrade)}
                                            onChange={handleGradeChange}
                                            options={gradeOptions}
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            components={{ IndicatorSeparator: () => null }}
                                            placeholder="Todos"
                                          />
                                        </div>
                                        <div className="col-md-3">
                                          <label className="form-label mb-1 small">Filtrar por Sección</label>
                                          <Select
                                            value={sectionOptions.find(option => option.value === filterSection)}
                                            onChange={handleSectionChange}
                                            options={sectionOptions}
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            components={{ IndicatorSeparator: () => null }}
                                            placeholder="Todas"
                                          />
                                        </div>
                                        <div className="col-md-3">
                                          <label className="form-label mb-1 small">Filtrar por Curso</label>
                                          <Select
                                            value={courseOptions.find(option => option.value === filterCourse)}
                                            onChange={handleCourseChange}
                                            options={courseOptions}
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            components={{ IndicatorSeparator: () => null }}
                                            placeholder="Todos"
                                          />
                                        </div>
                                        <div className="col-md-3">
                                          {(filterGrade || filterSection || filterCourse) && (
                                            <button
                                              type="button"
                                              className="btn btn-secondary btn-sm w-100"
                                              onClick={() => {
                                                setFilterGrade('');
                                                setFilterSection('');
                                                setFilterCourse('');
                                              }}
                                            >
                                              <FeatherIcon icon="x-circle" size={14} /> Limpiar Filtros
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Informacin y controles superiores */}
                              <div className="row mb-3">
                                <div className="col-12">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <p className="mb-0">
                                        <strong>Total estudiantes:</strong> {filteredLocalStudents.length} {filterGrade || filterSection || filterCourse ? `(${localStudents.length} sin filtrar)` : ''} | 
                                        <strong className="text-success ms-2">Presentes seleccionados:</strong> {Object.values(selectedStudentsForAttendance).filter(v => v === true).length}
                                      </p>
                                      <small className="text-muted">Marque el checkbox de los estudiantes que asistieron</small>
                                    </div>
                                    <div className="form-check">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="selectAll"
                                        checked={filteredLocalStudents.length > 0 && Object.values(selectedStudentsForAttendance).filter(v => v === true).length === filteredLocalStudents.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                      />
                                      <label className="form-check-label" htmlFor="selectAll">
                                        Seleccionar Todos
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tabla de estudiantes */}
                              <div className="table-responsive" style={{maxHeight: '500px', overflowY: 'auto'}}>
                                <table className="table table-bordered table-hover table-striped">
                                  <thead className="table-primary" style={{position: 'sticky', top: 0, zIndex: 10}}>
                                    <tr>
                                      <th style={{width: '40px'}} className="text-center">#</th>
                                      <th style={{width: '50px'}} className="text-center">
                                        <input
                                          type="checkbox"
                                          checked={filteredLocalStudents.length > 0 && Object.values(selectedStudentsForAttendance).filter(v => v === true).length === filteredLocalStudents.length}
                                          onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                      </th>
                                      <th>Nombre</th>
                                      <th>Grado</th>
                                      <th>Sección</th>
                                      <th>Curso</th>
                                      <th>ID Matrícula</th>
                                      <th>DNI</th>
                                      <th>Observaciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredLocalStudents.map((student, index) => (
                                      <tr key={student.id || student.enrollmentId || index}>
                                        <td className="text-center">
                                          <strong className="text-muted">{index + 1}</strong>
                                        </td>
                                        <td className="text-center">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selectedStudentsForAttendance[student.enrollmentId] === true}
                                            onChange={(e) => handleCheckboxChange(student.enrollmentId, e.target.checked)}
                                          />
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center">
                                            <div className="avatar avatar-sm me-2">
                                              <span className="avatar-title rounded-circle bg-primary text-white">
                                                {student.name?.charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                            <div>
                                              <strong>{student.name}</strong>
                                              {selectedStudentsForAttendance[student.enrollmentId] && (
                                                <span className="badge badge-success ms-2"> Presente</span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          {student.grade ? (
                                            <span className="badge badge-primary">{student.grade}°</span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                        <td>
                                          {student.section ? (
                                            <span className="badge badge-secondary">Sección {student.section}</span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                        <td>
                                          {student.course ? (
                                            <span className="badge badge-info" style={{maxWidth: '120px', whiteSpace: 'normal'}}>{student.course}</span>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                        <td><span className="badge badge-dark">{student.enrollmentId}</span></td>
                                        <td>{student.dni || 'N/A'}</td>
                                        <td>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Observacin opcional..."
                                            value={massAttendanceObservations[student.enrollmentId] || ''}
                                            onChange={(e) => handleObservationChange(student.enrollmentId, e.target.value)}
                                            disabled={!selectedStudentsForAttendance[student.enrollmentId]}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Botones de accin */}
                              <div className="row mt-3">
                                <div className="col-12">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <button
                                        className="btn btn-secondary me-2"
                                        onClick={() => {
                                          setSelectedStudentsForAttendance({});
                                          setMassAttendanceObservations({});
                                        }}
                                        disabled={loadingMassAttendance || Object.keys(selectedStudentsForAttendance).length === 0}
                                      >
                                         Limpiar Seleccin
                                      </button>
                                    </div>
                                    <div>
                                      <button
                                        className="btn btn-success btn-lg"
                                        onClick={handleCreateMassAttendances}
                                        disabled={loadingMassAttendance || Object.values(selectedStudentsForAttendance).filter(v => v === true).length === 0}
                                      >
                                        {loadingMassAttendance ? (
                                          <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Creando Asistencias...
                                          </>
                                        ) : (
                                          <>
                                             Crear {Object.values(selectedStudentsForAttendance).filter(v => v === true).length} Asistencia(s)
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Vista de Justificaciones - Solo mostrar en vista de justificaciones */}
                    {activeView === 'justifications' && (
                    <div className="staff-search-table">
                      <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="card-title"> Gestin de Justificaciones</h5>
                          <div className="d-flex gap-2">
                            {/* Botones de exportacin para justificaciones */}
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={exportJustificationsToCSV}
                              title="Exportar justificaciones a CSV"
                              disabled={justifications.length === 0}
                            >
                               CSV
                            </button>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={exportJustificationsToExcel}
                              title="Exportar justificaciones a Excel"
                              disabled={justifications.length === 0}
                            >
                               Excel
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={exportJustificationsToPDF}
                              title="Exportar justificaciones a PDF"
                              disabled={justifications.length === 0}
                            >
                               PDF
                            </button>
                            <Link 
                              to="/auxiliary/justifications" 
                              className="btn btn-info btn-sm"
                              title="Ir a gestin completa de justificaciones"
                            >
                               Gestin Completa
                            </Link>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={loadJustifications}
                              disabled={loadingJustifications}
                            >
                              {loadingJustifications ? ' Cargando...' : ' Actualizar'}
                            </button>
                          </div>
                        </div>
                        <div className="card-body">
                          {/* Tabla de justificaciones */}
                          <div className="table-responsive">
                            <table className="table border-0 star-student table-hover table-center mb-0 datatable table-striped">
                              <thead className="student-thread">
                                <tr>
                                  <th>ID Asistencia</th>
                                  <th>Tipo</th>
                                  <th>Motivo</th>
                                  <th>Fecha Envo</th>
                                  <th>Estado</th>
                                  <th>Enviado por</th>
                                  <th className="text-end">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {justifications.length > 0 ? (
                                  justifications.map((justification, index) => (
                                    <tr key={justification.id || index}>
                                      <td>
                                        <h2 className="table-avatar">
                                          <span className="student-avatar-text">
                                            {justification.attendanceId?.charAt(0)?.toUpperCase() || 'J'}
                                          </span>
                                          <span className="ml-2">{justification.attendanceId || 'N/A'}</span>
                                        </h2>
                                      </td>
                                      <td>
                                        <span className="badge badge-info">
                                          {justification.justificationType === 'MEDICAL' ? ' Mdica' :
                                           justification.justificationType === 'FAMILY_EMERGENCY' ? ' Familiar' :
                                           justification.justificationType === 'PERSONAL' ? ' Personal' :
                                           justification.justificationType === 'ACADEMIC' ? ' Acadmica' :
                                           justification.justificationType || 'N/A'}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="text-truncate" style={{maxWidth: '200px', display: 'inline-block'}}>
                                          {justification.justificationReason || 'Sin motivo'}
                                        </span>
                                      </td>
                                      <td>
                                        {formatDateLocal(justification.submissionDate)}
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          justification.approvalStatus === 'PENDING' ? 'badge-warning' :
                                          justification.approvalStatus === 'APPROVED' ? 'badge-success' :
                                          justification.approvalStatus === 'REJECTED' ? 'badge-danger' :
                                          'badge-secondary'
                                        }`}>
                                          {justification.approvalStatus === 'PENDING' ? ' Pendiente' :
                                           justification.approvalStatus === 'APPROVED' ? ' Aprobada' :
                                           justification.approvalStatus === 'REJECTED' ? ' Rechazada' :
                                           justification.approvalStatus || 'N/A'}
                                        </span>
                                      </td>
                                      <td>{justification.submittedBy || 'N/A'}</td>
                                      <td className="text-end">
                                        <div className="actions">
                                          {justification.approvalStatus === 'PENDING' && (
                                            <>
                                              <button
                                                className="btn btn-sm bg-success-light me-2"
                                                onClick={() => handleApproveJustification(justification.id)}
                                                title="Aprobar justificacin"
                                              >
                                                <i className="feather-check">
                                                  <FeatherIcon icon="check" />
                                                </i>
                                              </button>
                                              <button
                                                className="btn btn-sm bg-danger-light"
                                                onClick={() => {
                                                  showAlert({
                                                    title: 'Rechazar justificacin?',
                                                    message: `Se rechazar la justificacin para "${justification.attendanceId}"`,
                                                    type: 'warning',
                                                    onConfirm: () => {
                                                      // Aqu ira la lgica de rechazo
                                                      console.log('Rechazar justificacin:', justification.id);
                                                    }
                                                  });
                                                }}
                                                title="Rechazar justificacin"
                                              >
                                                <i className="feather-x">
                                                  <FeatherIcon icon="x" />
                                                </i>
                                              </button>
                                            </>
                                          )}
                                          <button
                                            className="btn btn-sm bg-info-light ms-1"
                                            onClick={() => {
                                              showAlert({
                                                title: 'Detalles de la Justificacin',
                                                message: `
                                                  <strong>ID:</strong> ${justification.attendanceId}<br/>
                                                  <strong>Tipo:</strong> ${justification.justificationType}<br/>
                                                  <strong>Motivo:</strong> ${justification.justificationReason}<br/>
                                                  <strong>Estado:</strong> ${justification.approvalStatus}<br/>
                                                  <strong>Enviado por:</strong> ${justification.submittedBy}<br/>
                                                  <strong>Fecha:</strong> ${justification.submissionDate ? new Date(justification.submissionDate).toLocaleString('es-ES') : 'N/A'}
                                                `,
                                                type: 'info',
                                                showCancel: false,
                                                confirmText: 'Cerrar'
                                              });
                                            }}
                                            title="Ver detalles"
                                          >
                                            <i className="feather-eye">
                                              <FeatherIcon icon="eye" />
                                            </i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="7" className="text-center py-4">
                                      {loadingJustifications ? (
                                        <div>
                                          <div className="spinner-border text-primary" role="status">
                                            <span className="sr-only">Cargando...</span>
                                          </div>
                                          <p className="mt-2 text-muted">Cargando justificaciones...</p>
                                        </div>
                                      ) : (
                                        <div>
                                          <i className="feather-file-text mb-2" style={{fontSize: '48px', color: '#ccc'}}>
                                            <FeatherIcon icon="file-text" size={48} />
                                          </i>
                                          <p className="text-muted">
                                            No se encontraron justificaciones
                                          </p>
                                          <button 
                                            className="btn btn-primary btn-sm mt-2"
                                            onClick={loadJustifications}
                                          >
                                             Recargar Justificaciones
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Informacin adicional */}
                          {justifications.length > 0 && (
                            <div className="row mt-3">
                              <div className="col-sm-12">
                                <div className="d-flex justify-content-between align-items-center">
                                  <p className="text-muted mb-0">
                                    Mostrando {justifications.length} justificacin(es)
                                  </p>
                                  <div className="d-flex gap-2">
                                    <span className="badge badge-warning"> Pendientes: {justifications.filter(j => j.approvalStatus === 'PENDING').length}</span>
                                    <span className="badge badge-success"> Aprobadas: {justifications.filter(j => j.approvalStatus === 'APPROVED').length}</span>
                                    <span className="badge badge-danger"> Rechazadas: {justifications.filter(j => j.approvalStatus === 'REJECTED').length}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Tabla de resultados - Solo mostrar en vista de bsqueda y listado */}
                    {(activeView === 'search' || activeView === 'list-all') && (
                    <>
                    
                    {/* Barra de filtros rápidos para list-all */}
                    {activeView === 'list-all' && (
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-body py-2">
                              <div className="row align-items-end">
                                <div className="col-md-2">
                                  <label className="form-label mb-1 small">Filtrar por Grado</label>
                                  <Select
                                    value={gradeOptions.find(option => option.value === filterGrade)}
                                    onChange={handleGradeChange}
                                    options={gradeOptions}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    components={{ IndicatorSeparator: () => null }}
                                    placeholder="Todos"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label mb-1 small">Filtrar por Sección</label>
                                  <Select
                                    value={sectionOptions.find(option => option.value === filterSection)}
                                    onChange={handleSectionChange}
                                    options={sectionOptions}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    components={{ IndicatorSeparator: () => null }}
                                    placeholder="Todas"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label mb-1 small">Filtrar por Curso</label>
                                  <Select
                                    value={courseOptions.find(option => option.value === filterCourse)}
                                    onChange={handleCourseChange}
                                    options={courseOptions}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    components={{ IndicatorSeparator: () => null }}
                                    placeholder="Todos"
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label mb-1 small">Estudiante Individual</label>
                                  <Select
                                    value={studentOptions.find(option => option.value === filterStudentId)}
                                    onChange={handleStudentChange}
                                    options={studentOptions}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    components={{ IndicatorSeparator: () => null }}
                                    placeholder="Todos los estudiantes..."
                                    isClearable
                                  />
                                </div>
                                <div className="col-md-2">
                                  {(filterGrade || filterSection || filterCourse || filterStudentId) && (
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm w-100"
                                      onClick={() => {
                                        setFilterGrade('');
                                        setFilterSection('');
                                        setFilterCourse('');
                                        setFilterStudentId('');
                                      }}
                                    >
                                      <FeatherIcon icon="x-circle" size={14} /> Limpiar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            {activeView === 'search' 
                              ? ` Resultados de bsqueda: ${getCurrentData.length} registro(s)`
                              : ` Todas las asistencias: ${getCurrentData.length} registro(s)`
                            }
                          </h6>
                          <div className="d-flex gap-2">
                            {/* Botones de exportación según la vista activa - EXPORTA LOS DATOS FILTRADOS */}
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => activeView === 'search' ? exportAbsentStudentsToCSV() : exportAllAttendancesToCSV()}
                              title={`Exportar a CSV - ${getCurrentData.length} registro(s) actual(es)`}
                              disabled={getCurrentData.length === 0}
                            >
                               CSV ({getCurrentData.length})
                            </button>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => activeView === 'search' ? exportAbsentStudentsToExcel() : exportAllAttendancesToExcel()}
                              title={`Exportar a Excel - ${getCurrentData.length} registro(s) actual(es)`}
                              disabled={getCurrentData.length === 0}
                            >
                               Excel ({getCurrentData.length})
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => activeView === 'search' ? exportAbsentStudentsToPDF() : exportAllAttendancesToPDF()}
                              title={`Exportar a PDF - ${getCurrentData.length} registro(s) actual(es)`}
                              disabled={getCurrentData.length === 0}
                            >
                               PDF ({getCurrentData.length})
                            </button>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={handleRefresh}
                              disabled={loading}
                            >
                              {loading ? ' Cargando...' : ' Actualizar'}
                            </button>
                          </div>
                          
                          {/* Botn temporal para debug - buscar presentes */}
                          <button 
                            className="btn btn-info btn-sm ms-2"
                            onClick={async () => {
                              console.log(' Buscando estudiantes presentes...');
                              try {
                                const response = await attendanceService.getPresentStudentsByDate(new Date().toISOString().split('T')[0]);
                                console.log(' Estudiantes presentes:', response);
                                if (response.success && response.data.length > 0) {
                                  showAlert({
                                    title: 'Estudiantes Presentes Encontrados',
                                    message: `Se encontraron ${response.data.length} estudiantes presentes hoy`,
                                    type: 'info',
                                    showCancel: false,
                                    confirmText: 'OK'
                                  });
                                } else {
                                  showAlert({
                                    title: 'Sin Presentes',
                                    message: 'No se encontraron estudiantes presentes hoy',
                                    type: 'warning',
                                    showCancel: false,
                                    confirmText: 'OK'
                                  });
                                }
                              } catch (err) {
                                console.error('Error buscando presentes:', err);
                              }
                            }}
                          >
                             Debug Presentes
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table border-0 star-student table-hover table-center mb-0 datatable table-striped">
                        <thead className="student-thread">
                          <tr>
                            <th style={{width: '50px'}}>#</th>
                            <th>Estudiante</th>
                            <th>Grado</th>
                            <th>Sección</th>
                            <th>Curso</th>
                            <th>ID Matrícula</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estado</th>
                            <th>Método Registro</th>
                            <th>Observaciones</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentData.length > 0 ? (
                            getCurrentData.map((student, index) => {
                              // Crear key única combinando ID + fecha + hora + index para evitar duplicados
                              const uniqueKey = `${student.studentEnrollmentId || 'unknown'}-${student.entryDate || 'nodate'}-${student.entryTime || 'notime'}-${index}`;
                              
                              return (
                              <tr key={uniqueKey}>
                                <td className="text-center">
                                  <strong>{index + 1}</strong>
                                </td>
                                <td>
                                  <h2 className="table-avatar">
                                    <span className="student-avatar-text">
                                      {student.studentName?.charAt(0)?.toUpperCase() || 'E'}
                                    </span>
                                    <span className="ml-2">{student.studentName || 'N/A'}</span>
                                  </h2>
                                </td>
                                <td>
                                  {student.grade ? (
                                    <span className="badge badge-primary">
                                      {student.grade}°
                                    </span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {student.section ? (
                                    <span className="badge badge-secondary">
                                      Sección {student.section}
                                    </span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {student.course ? (
                                    <span className="badge badge-info" style={{maxWidth: '120px', whiteSpace: 'normal'}}>
                                      {student.course}
                                    </span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge badge-dark">
                                    {student.studentEnrollmentId || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  {formatDateLocal(student.entryDate)}
                                </td>
                                <td>
                                  {student.entryTime ? 
                                    student.entryTime.split('.')[0] : // Remover microsegundos
                                    student.entryTimestamp ? 
                                    new Date(student.entryTimestamp).toLocaleTimeString('es-ES') :
                                    'N/A'
                                  }
                                </td>
                                <td>
                                  {/* Determinar estado basado en los datos reales o el tipo de bsqueda */}
                                  {activeView === 'list-all' ? (
                                    // En vista de todas las asistencias, usar funcin de determinacin de estado
                                    (() => {
                                      const status = determineAttendanceStatus(student);
                                      
                                      switch (status) {
                                        case 'present':
                                          return (
                                            <span className="badge badge-success">
                                               Presente
                                            </span>
                                          );
                                        case 'absent':
                                          return (
                                            <span className="badge badge-danger">
                                               Ausente
                                            </span>
                                          );
                                        case 'automatic':
                                          return (
                                            <span className="badge badge-warning">
                                               Automtico
                                            </span>
                                          );
                                        default:
                                          return (
                                            <span className="badge badge-secondary">
                                               Sin definir
                                            </span>
                                          );
                                      }
                                    })()
                                  ) : (
                                    // En vista de bsqueda, usar el tipo de bsqueda
                                    searchType === 'present-by-date' || searchType === 'all-attendance' ? (
                                      <span className="badge badge-success">
                                         Presente
                                      </span>
                                    ) : (
                                      <span className="badge badge-danger">
                                         Ausente
                                      </span>
                                    )
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${
                                    student.registrationMethod === 'MANUAL' ? 'badge-primary' :
                                    student.registrationMethod === 'AUTOMATIC' ? 'badge-warning' :
                                    'badge-secondary'
                                  }`}>
                                    {student.registrationMethod === 'MANUAL' ? ' Manual' :
                                     student.registrationMethod === 'AUTOMATIC' ? ' Automtico' :
                                     student.registeredBy || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <span className="text-truncate" style={{maxWidth: '200px', display: 'inline-block'}}>
                                    {student.observations || 'Sin observaciones'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <div className="actions">
                                    {/* Mostrar acciones basndose en la vista y el estado real del estudiante */}
                                    {activeView === 'list-all' ? (
                                      // En vista de todas las asistencias, verificar estado real
                                      <>
                                        {/* Botn de editar - siempre disponible en vista list-all */}
                                        <button
                                          className="btn btn-sm bg-primary-light me-2"
                                          onClick={() => handleEditAttendance(student)}
                                          title="Editar asistencia"
                                        >
                                          <i className="feather-edit">
                                            <FeatherIcon icon="edit" />
                                          </i>
                                           Editar
                                        </button>
                                        
                                        {/* Botn de justificacin basado en el estado real */}
                                        {(() => {
                                          const status = determineAttendanceStatus(student);
                                          const isPresent = status === 'present';
                                          
                                          return isPresent ? (
                                            <span className="text-muted">
                                              <i className="feather-check">
                                                <FeatherIcon icon="check" />
                                              </i>
                                              Presente
                                            </span>
                                          ) : (
                                            <button
                                              className="btn btn-sm bg-success-light me-2"
                                              onClick={() => handleOpenJustificationModal(student)}
                                              title="Crear justificacin para este estudiante"
                                            >
                                              <i className="feather-plus">
                                                <FeatherIcon icon="plus" />
                                              </i>
                                               Justificar
                                            </button>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      // En vista de bsqueda, usar lgica anterior
                                      (searchType !== 'present-by-date' && searchType !== 'all-attendance') ? (
                                        <button
                                          className="btn btn-sm bg-success-light me-2"
                                          onClick={() => handleOpenJustificationModal(student)}
                                          title="Crear justificacin para este estudiante"
                                        >
                                          <i className="feather-edit">
                                            <FeatherIcon icon="edit" />
                                          </i>
                                           Crear Justificacin
                                        </button>
                                      ) : (
                                        <span className="text-muted">
                                          <i className="feather-check">
                                            <FeatherIcon icon="check" />
                                          </i>
                                          Presente
                                        </span>
                                      )
                                    )}
                                  </div>
                                </td>
                              </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center py-4">
                                {loading ? (
                                  <div>
                                    <div className="spinner-border text-primary" role="status">
                                      <span className="sr-only">Cargando...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Buscando estudiantes...</p>
                                  </div>
                                ) : (
                                  <div>
                                    <i className="feather-search mb-2" style={{fontSize: '48px', color: '#ccc'}}>
                                      <FeatherIcon icon="search" size={48} />
                                    </i>
                                    <p className="text-muted">
                                      {activeView === 'list-all' ? 
                                        'No hay registros de asistencia disponibles' :
                                        (students.length === 0 && searchType ? 
                                          'No se encontraron estudiantes para los criterios seleccionados' :
                                          'Seleccione un tipo de bsqueda y haga clic en "Buscar Estudiantes"'
                                        )
                                      }
                                    </p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Informacin adicional */}
                    {getCurrentData.length > 0 && (
                      <div className="row mt-3">
                        <div className="col-sm-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {(filterGrade || filterSection || filterCourse || filterStudentId) && (
                                <div className="mb-2">
                                  <small className="text-muted me-2">Filtros activos:</small>
                                  {filterStudentId && (
                                    <span className="badge badge-warning me-1">
                                      👤 Estudiante: {studentOptions.find(opt => opt.value === filterStudentId)?.label || filterStudentId}
                                    </span>
                                  )}
                                  {filterGrade && (
                                    <span className="badge badge-primary me-1">
                                      Grado: {filterGrade}°
                                    </span>
                                  )}
                                  {filterSection && (
                                    <span className="badge badge-secondary me-1">
                                      Sección: {filterSection}
                                    </span>
                                  )}
                                  {filterCourse && (
                                    <span className="badge badge-info me-1">
                                      Curso: {filterCourse}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="float-end">
                              <p className="text-muted mb-0">
                                {activeView === 'list-all' 
                                  ? `Mostrando ${filteredAllAttendances.length} de ${allAttendances.length} registro(s) de asistencia`
                                  : `Mostrando ${filteredStudents.length} de ${students.length} estudiante(s)`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </>
                    )}

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de edicin de asistencia */}
      {showEditModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"> Editar Asistencia</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseEditModal}
                ></button>
              </div>
              <div className="modal-body">
                {editingAttendance && (
                  <>
                    {/* Informacin del estudiante */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <strong> Estudiante:</strong> {editingAttendance.studentName}<br/>
                          <strong> ID Matrcula:</strong> {editingAttendance.studentEnrollmentId}<br/>
                          <strong> Email:</strong> {editingAttendance.email || 'No disponible'}
                        </div>
                      </div>
                    </div>

                    {/* Formulario de edicin */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group local-forms">
                          <label>Fecha de Asistencia <span className="text-danger">*</span></label>
                          <input
                            type="date"
                            className="form-control"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-group local-forms">
                          <label>Observaciones</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Escriba aqu cualquier observacin adicional..."
                            value={attendanceObservations}
                            onChange={(e) => setAttendanceObservations(e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseEditModal}
                >
                   Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpdateAttendance}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Actualizando...
                    </>
                  ) : (
                    ' Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para marcar ausencias automticamente */}
      {showMarkAbsencesModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title"> Marcar Ausencias Automticamente</h4>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowMarkAbsencesModal(false)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fe fe-alert-triangle me-2"></i>
                  <strong>Atencin:</strong> Esta accin marcar como ausentes a todos los estudiantes 
                  que no registraron asistencia en la fecha seleccionada.
                </div>
                
                <div className="form-group">
                  <label>Fecha para marcar ausencias <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={markAbsencesDate}
                    onChange={(e) => setMarkAbsencesDate(e.target.value)}
                    required
                  />
                  <small className="form-text text-muted">
                    Seleccione la fecha para la cual desea marcar las ausencias automticamente.
                  </small>
                </div>

                <div className="form-group">
                  <div className="alert alert-info">
                    <h6><i className="fe fe-info me-2"></i>Qu hace esta funcin?</h6>
                    <ul className="mb-0">
                      <li>Revisa todos los estudiantes matriculados</li>
                      <li>Identifica quines NO registraron asistencia en la fecha seleccionada</li>
                      <li>Los marca automticamente como &quot;ausentes&quot;</li>
                      <li>Permite agilizar el proceso de registro de ausencias</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowMarkAbsencesModal(false)}
                  disabled={loadingMarkAbsences}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleMarkAbsencesForDate}
                  disabled={loadingMarkAbsences || !markAbsencesDate}
                >
                  {loadingMarkAbsences ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Marcando...
                    </>
                  ) : (
                    <>
                      <i className="fe fe-check me-2"></i>
                      Marcar Ausencias
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Justificacin */}
      {showJustificationModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📝 Crear Justificación</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseJustificationModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* Selector de estudiante ausente */}
                <div className="form-group mb-3">
                  <label>Estudiante Ausente <span className="text-danger">*</span></label>
                  {loadingAbsentStudents ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Cargando...</span>
                      </div>
                      <p className="text-muted mt-2">Cargando estudiantes ausentes...</p>
                    </div>
                  ) : absentStudents.length > 0 ? (
                    <select
                      className="form-control form-select"
                      value={selectedAbsentStudentId}
                      onChange={(e) => setSelectedAbsentStudentId(e.target.value)}
                      required
                    >
                      <option value="">Seleccione un estudiante ausente</option>
                      {absentStudents.map((student) => (
                        <option 
                          key={student.id || student.studentEnrollmentId} 
                          value={student.id || student.studentEnrollmentId}
                        >
                          {student.studentName} - ID: {student.studentEnrollmentId} - {formatDateLocal(student.entryDate)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="alert alert-info">
                      <i className="feather-info me-2"></i>
                      No hay estudiantes ausentes registrados. Solo se pueden justificar ausencias ya registradas.
                    </div>
                  )}
                  <small className="form-text text-muted">
                    Seleccione el estudiante cuya ausencia desea justificar
                  </small>
                </div>

                {/* Tipo de justificación */}
                <div className="form-group mb-3">
                  <label>Tipo de Justificación <span className="text-danger">*</span></label>
                  <select
                    className="form-control form-select"
                    value={justificationType}
                    onChange={(e) => setJustificationType(e.target.value)}
                    required
                  >
                    <option value="MEDICAL">🏥 Médica</option>
                    <option value="FAMILY_EMERGENCY">👨‍👩‍👧 Emergencia Familiar</option>
                    <option value="PERSONAL">👤 Personal</option>
                    <option value="ACADEMIC">📚 Académica</option>
                    <option value="OTHER">📋 Otra</option>
                  </select>
                </div>

                {/* Razón de justificación */}
                <div className="form-group mb-3">
                  <label>Razón de la Justificación <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describa el motivo de la ausencia..."
                    value={justificationReason}
                    onChange={(e) => setJustificationReason(e.target.value)}
                    required
                  ></textarea>
                  <small className="form-text text-muted">
                    Explique detalladamente el motivo de la ausencia
                  </small>
                </div>

                {/* Información adicional */}
                <div className="alert alert-warning">
                  <i className="feather-alert-triangle me-2"></i>
                  <strong>Nota:</strong> La justificación quedará en estado &quot;Pendiente&quot; hasta que sea revisada y aprobada por el director.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseJustificationModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleCreateJustificationDirect}
                  disabled={loading || !selectedAbsentStudentId || !justificationReason.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <i className="feather-check me-2"></i>
                      Crear Justificación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AlertModal para confirmaciones y alertas */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default AttendanceListPage;


