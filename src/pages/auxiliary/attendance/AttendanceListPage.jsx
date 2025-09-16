/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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

const AttendanceListPage = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [students, setStudents] = useState([]);
  const [allAttendances, setAllAttendances] = useState([]);
  const [localStudents, setLocalStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocalStudents, setLoadingLocalStudents] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchType, setSearchType] = useState('faltaron');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState('search'); // 'search', 'list-all', 'create-attendance'
  
  // Estados para crear asistencia
  const [studentSearchText, setStudentSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
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

  // Estados para marcar ausencias
  const [showMarkAbsencesModal, setShowMarkAbsencesModal] = useState(false);
  const [markAbsencesDate, setMarkAbsencesDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingMarkAbsences, setLoadingMarkAbsences] = useState(false);

  // Opciones para el select
  const searchTypeOptions = Object.entries(SEARCH_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

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
   * Carga estudiantes según el tipo de búsqueda seleccionado
   */
  const loadStudents = async () => {
    if (!searchType) return;
    
    setLoading(true);
    try {
      let response;
      
      switch (searchType) {
        case 'by-date':
          if (!selectedDate) {
            showWarning('Seleccione una fecha para búsqueda por fecha específica');
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
            showWarning('Seleccione una fecha para búsqueda de estudiantes presentes');
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
        // Ordenar los estudiantes por fecha y hora (más recientes primero)
        const sortedStudents = (response.data || []).sort((a, b) => {
          // Primero ordenar por fecha de entrada (entryDate)
          const dateA = new Date(a.entryDate || a.createdAt || 0);
          const dateB = new Date(b.entryDate || b.createdAt || 0);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Más recientes primero
          }
          
          // Si las fechas son iguales, ordenar por hora de entrada (entryTime o entryTimestamp)
          const timeA = a.entryTimestamp ? new Date(a.entryTimestamp) : 
                       a.entryTime ? new Date(`${a.entryDate}T${a.entryTime}`) : 
                       new Date(a.createdAt || 0);
          const timeB = b.entryTimestamp ? new Date(b.entryTimestamp) : 
                       b.entryTime ? new Date(`${b.entryDate}T${b.entryTime}`) : 
                       new Date(b.createdAt || 0);
          
          return timeB.getTime() - timeA.getTime(); // Más recientes primero
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
    console.log('📋 loadAllAttendances iniciado - Llamando a getAllAttendances()');
    setLoading(true);
    try {
      const response = await attendanceService.getAllAttendances();
      console.log('📋 Respuesta de getAllAttendances:', response);
      
      if (response.success) {
        // Ordenar las asistencias por fecha y hora (más recientes primero)
        const sortedAttendances = (response.data || []).sort((a, b) => {
          // Primero ordenar por fecha de entrada (entryDate)
          const dateA = new Date(a.entryDate || a.createdAt || 0);
          const dateB = new Date(b.entryDate || b.createdAt || 0);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Más recientes primero
          }
          
          // Si las fechas son iguales, ordenar por hora de entrada (entryTime o entryTimestamp)
          const timeA = a.entryTimestamp ? new Date(a.entryTimestamp) : 
                       a.entryTime ? new Date(`${a.entryDate}T${a.entryTime}`) : 
                       new Date(a.createdAt || 0);
          const timeB = b.entryTimestamp ? new Date(b.entryTimestamp) : 
                       b.entryTime ? new Date(`${b.entryDate}T${b.entryTime}`) : 
                       new Date(b.createdAt || 0);
          
          return timeB.getTime() - timeA.getTime(); // Más recientes primero
        });
        
        setAllAttendances(sortedAttendances);
        console.log(`✅ ${sortedAttendances.length} asistencias cargadas y ordenadas`);
        
        // Debug: Mostrar algunas muestras de datos para entender la estructura
        console.log('📊 Muestras de datos recibidos:');
        sortedAttendances.slice(0, 3).forEach((item, index) => {
          console.log(`Registro ${index + 1}:`, {
            studentName: item.studentName,
            observations: item.observations,
            attendanceStatus: item.attendanceStatus,
            status: item.status,
            registrationMethod: item.registrationMethod,
            registeredBy: item.registeredBy
          });
        });
        
        if (sortedAttendances.length === 0) {
          showAlert({
            title: 'Sin registros',
            message: 'No se encontraron registros de asistencias',
            type: 'info',
            showCancel: false,
            confirmText: 'Entendido'
          });
        } else {
          showSuccess(`Se cargaron ${sortedAttendances.length} registro(s) de asistencia`);
        }
      } else {
        showError(response.error);
        setAllAttendances([]);
      }
    } catch (err) {
      console.error('❌ Error en loadAllAttendances:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar todas las asistencias');
      setAllAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga estudiantes locales para crear asistencias
   */
  const loadLocalStudents = async () => {
    setLoadingLocalStudents(true);
    try {
      console.log('🔄 Cargando estudiantes locales...');
      const response = await attendanceService.getLocalStudents();
      
      if (response.success) {
        console.log('✅ Estudiantes locales cargados:', response.data.length);
        setLocalStudents(response.data || []);
        if (response.data?.length === 0) {
          showWarning('No se encontraron estudiantes locales');
        } else {
          console.log('📊 Primeros 3 estudiantes:', response.data.slice(0, 3));
        }
      } else {
        console.error('❌ Error en respuesta del servicio:', response.error);
        throw new Error(response.error || 'Error al cargar estudiantes locales');
      }
    } catch (err) {
      console.error('❌ Error al cargar estudiantes locales:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar estudiantes locales');
      setLocalStudents([]);
    } finally {
      setLoadingLocalStudents(false);
    }
  };

  /**
   * Crear nueva asistencia
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
      console.log('💾 Creando asistencia para:', selectedStudent.name);
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
        console.log('✅ Asistencia creada exitosamente');
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
        console.error('❌ Error en respuesta del servicio:', response.error);
        throw new Error(response.error || 'Error al crear asistencia');
      }
    } catch (err) {
      console.error('❌ Error al crear asistencia:', err);
      showError(err instanceof Error ? err.message : 'Error al crear asistencia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abrir modal de edición con datos de asistencia
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

      console.log('🔄 Actualizando asistencia ID:', editingAttendance.id);
      const response = await attendanceService.updateAttendance(editingAttendance.id, attendanceData);
      
      if (response.success) {
        console.log('✅ Asistencia actualizada exitosamente');
        showSuccess('Asistencia actualizada exitosamente');
        setShowEditModal(false);
        setEditingAttendance(null);
        
        // Recargar datos según la vista activa
        if (activeView === 'list-all') {
          loadAllAttendances();
        } else {
          loadStudents();
        }
      } else {
        console.error('❌ Error en respuesta del servicio:', response.error);
        throw new Error(response.error || 'Error al actualizar asistencia');
      }
    } catch (err) {
      console.error('❌ Error al actualizar asistencia:', err);
      showError(err instanceof Error ? err.message : 'Error al actualizar asistencia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar modal de edición
   */
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAttendance(null);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceObservations('');
  };

  /**
   * Abrir modal de justificación
   */
  const handleOpenJustificationModal = (student) => {
    setJustificationStudent(student);
    setJustificationType('MEDICAL');
    setJustificationReason('');
    setShowJustificationModal(true);
  };

  /**
   * Crear nueva justificación usando attendanceService
   * POST /api/v1/justifications
   */
  const handleCreateJustificationDirect = async () => {
    if (!justificationStudent) {
      showWarning('No se ha seleccionado un estudiante');
      return;
    }
    
    if (!justificationReason.trim()) {
      showWarning('Por favor ingrese la razón de la justificación');
      return;
    }

    setLoading(true);
    try {
      const justificationData = {
        attendanceId: justificationStudent.id || justificationStudent.studentEnrollmentId,
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
      console.error('❌ Error al cargar justificaciones:', err);
      showError(err instanceof Error ? err.message : 'Error al cargar justificaciones');
      setJustifications([]);
    } finally {
      setLoadingJustifications(false);
    }
  };

  /**
   * Aprobar justificación usando attendanceService
   * PUT /api/v1/justifications/{id}/approve
   */
  const handleApproveJustification = async (justificationId) => {
    setLoading(true);
    try {
      const approvalData = {
        approvedBy: 'Auxiliar',
        approvalComments: 'Aprobado desde gestión de asistencias'
      };

      const response = await attendanceService.approveJustification(justificationId, approvalData);
      
      if (response.success) {
        showSuccess('Justificación aprobada exitosamente');
        loadJustifications(); // Recargar justificaciones
      } else {
        showError(response.error || 'Error al aprobar justificación');
      }
    } catch (err) {
      console.error('❌ Error al aprobar justificación:', err);
      showError(err instanceof Error ? err.message : 'Error al aprobar justificación');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar modal de justificación
   */
  const handleCloseJustificationModal = () => {
    setShowJustificationModal(false);
    setJustificationStudent(null);
    setJustificationReason('');
    setJustificationType('MEDICAL');
  };

  /**
   * Maneja el cambio de tipo de búsqueda
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
      // Al volver a la vista de búsqueda, recargar si hay un tipo de búsqueda seleccionado
      if (searchType) {
        loadStudents();
      }
    }
  };

  /**
   * Navega a crear justificación para un estudiante
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
   * Marca ausencias automáticamente para una fecha específica
   */
  const handleMarkAbsencesForDate = async () => {
    if (!markAbsencesDate) {
      showWarning('Por favor seleccione una fecha');
      return;
    }

    // Confirmar acción
    const confirmed = window.confirm(
      `¿Está seguro de marcar ausencias automáticamente para ${markAbsencesDate}?\n\n` +
      `Esto marcará como ausentes a todos los estudiantes que no registraron asistencia en esta fecha.`
    );
    
    if (!confirmed) return;

    setLoadingMarkAbsences(true);
    try {
      console.log('🔄 Marcando ausencias para fecha:', markAbsencesDate);
      const response = await attendanceService.markAbsencesForDate(markAbsencesDate);
      
      if (response.success) {
        console.log('✅ Ausencias marcadas exitosamente:', response.data);
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
        console.error('❌ Error al marcar ausencias:', response.error);
        throw new Error(response.error || 'Error al marcar ausencias');
      }
    } catch (err) {
      console.error('❌ Error al marcar ausencias:', err);
      showError(err instanceof Error ? err.message : 'Error al marcar ausencias automáticamente');
    } finally {
      setLoadingMarkAbsences(false);
    }
  };

  /**
   * Determina el estado de asistencia de un estudiante basado en todos los indicadores disponibles
   */
  const determineAttendanceStatus = (student) => {
    // Debug para entender los datos
    console.log('🔍 Determinando estado para:', student.studentName, {
      observations: student.observations,
      registrationMethod: student.registrationMethod,
      registeredBy: student.registeredBy,
      attendanceStatus: student.attendanceStatus,
      status: student.status,
      entryTime: student.entryTime,
      entryTimestamp: student.entryTimestamp
    });
    
    // 1. Verificar primero si está explícitamente marcado como presente
    if (student.attendanceStatus === 'present' || student.status === 'present' || 
        (student.observations && student.observations.toLowerCase().includes('presente'))) {
      return 'present';
    }
    
    // 2. Verificar si está explícitamente marcado como ausente
    if (student.observations && student.observations.toLowerCase().includes('ausente')) {
      return 'absent';
    }
    
    // 3. Si es registro manual, probablemente presente (a menos que diga lo contrario)
    if (student.registrationMethod === 'MANUAL') {
      if (student.observations && student.observations.toLowerCase().includes('ausente')) {
        return 'absent';
      }
      return 'present'; // Manual generalmente significa que el estudiante estuvo presente
    }
    
    // 4. Si es automático, analizar el contexto
    if (student.registrationMethod === 'AUTOMATIC') {
      // Si menciona "No registró asistencia" es ausente
      if (student.observations && student.observations.includes('No registró asistencia')) {
        return 'absent';
      }
      // Si tiene hora de entrada real, podría ser presente automático
      if (student.entryTime && !student.observations?.includes('ausente')) {
        return 'present';
      }
      return 'automatic'; // Estado especial para automáticos ambiguos
    }
    
    // 5. Estado por defecto si no hay información clara
    return 'undefined';
  };

  /**
   * Filtrar estudiantes por texto de búsqueda
   */
  const filteredStudents = students.filter(student => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      student.studentName?.toLowerCase().includes(search) ||
      student.studentEnrollmentId?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    );
  });

  /**
   * Filtrar todas las asistencias por texto de búsqueda
   */
  const filteredAllAttendances = allAttendances.filter(attendance => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      attendance.studentName?.toLowerCase().includes(search) ||
      attendance.studentEnrollmentId?.toLowerCase().includes(search) ||
      attendance.email?.toLowerCase().includes(search)
    );
  });

  /**
   * Obtener datos actuales según la vista activa
   */
  const getCurrentData = () => {
    return activeView === 'list-all' ? filteredAllAttendances : filteredStudents;
  };

  /**
   * Refreshar datos según la vista activa
   */
  const handleRefresh = () => {
    console.log('🔄 handleRefresh llamado - Vista activa:', activeView);
    if (activeView === 'list-all') {
      console.log('📋 Cargando todas las asistencias...');
      loadAllAttendances();
    } else {
      console.log('🔍 Cargando búsqueda de estudiantes...');
      loadStudents();
    }
  };

  /**
   * Exportar a CSV (placeholder)
   */
  const handleExportCSV = () => {
    showAlert({
      title: 'Exportar CSV',
      message: 'Funcionalidad de exportación próximamente',
      type: 'info',
      showCancel: false,
      confirmText: 'Entendido'
    });
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
                    <h3 className="page-title">📋 Gestión de Asistencias y Ausencias</h3>
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
                                    placeholder="Buscar por nombre, ID matrícula, email..."
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
                                  title="Ir a Gestión de Justificaciones"
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
                          <Link to="#" className="me-2" onClick={handleExportCSV} title="Exportar CSV">
                            <img src={pdficon} alt="CSV" />
                          </Link>
                          <Link to="#" className="me-2" onClick={handleExportCSV} title="Exportar Excel">
                            <img src={pdficon2} alt="Excel" />
                          </Link>
                          <Link to="#" className="me-2" onClick={handleExportCSV} title="Exportar PDF">
                            <img src={pdficon3} alt="PDF" />
                          </Link>
                          <Link to="#" onClick={handleExportCSV} title="Imprimir">
                            <img src={pdficon4} alt="Print" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* /Table Header */}

                    {/* Navegación de Vistas */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded">
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('search'); }}
                            >
                              🔍 Búsqueda de Estudiantes
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'list-all' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('list-all'); }}
                            >
                              📋 Todas las Asistencias
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'create-attendance' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('create-attendance'); }}
                            >
                              ➕ Crear Asistencia
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className="nav-link"
                              to="#"
                              onClick={(e) => { e.preventDefault(); setShowMarkAbsencesModal(true); }}
                            >
                              ❌ Marcar Ausencias
                            </Link>
                          </li>
                          <li className="nav-item">
                            <Link 
                              className={`nav-link ${activeView === 'justifications' ? 'active' : ''}`}
                              to="#"
                              onClick={(e) => { e.preventDefault(); handleViewChange('justifications'); }}
                            >
                              📋 Ver Justificaciones
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    {/* /Navegación de Vistas */}

                    {/* Filtros de búsqueda - Solo mostrar en vista de búsqueda */}
                    {activeView === 'search' && (
                    <div className="staff-search-table">
                      <form onSubmit={(e) => e.preventDefault()}>
                        <div className="row">
                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="form-group local-forms">
                              <label>Tipo de Búsqueda <span className="text-danger">*</span></label>
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
                                placeholder="Seleccione tipo de búsqueda"
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

                          <div className="col-12 col-md-6 col-xl-4">
                            <div className="doctor-submit">
                              <button
                                type="button"
                                className="btn btn-primary submit-list-form me-2"
                                onClick={loadStudents}
                                disabled={loading}
                              >
                                {loading ? 'Buscando...' : '🔍 Buscar Estudiantes'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                    )}
                    {/* /Filtros de búsqueda */}

                    {/* Formulario de crear asistencia - Solo mostrar en vista de crear asistencia */}
                    {activeView === 'create-attendance' && (
                    <div className="staff-search-table">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title">➕ Crear Nueva Asistencia</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={(e) => e.preventDefault()}>
                            <div className="row">
                              {/* Dropdown de estudiantes */}
                              <div className="col-12 col-md-6">
                                <div className="form-group local-forms">
                                  <label>Seleccionar Estudiante <span className="text-danger">*</span></label>
                                  <div className="search-dropdown position-relative">
                                    <input 
                                      type="text" 
                                      className="form-control dropdown-input" 
                                      placeholder="🔍 Buscar estudiante por nombre, apellido o DNI..." 
                                      value={studentSearchText}
                                      onChange={(e) => {
                                        setStudentSearchText(e.target.value);
                                        setShowStudentDropdown(true);
                                      }}
                                      onFocus={() => setShowStudentDropdown(true)}
                                      autoComplete="off"
                                    />
                                    <span className="dropdown-arrow position-absolute end-0 top-50 translate-middle-y me-3">▼</span>
                                    
                                    {showStudentDropdown && (
                                      <div className="dropdown-menu show position-absolute w-100 mt-1" style={{zIndex: 1050, maxHeight: '200px', overflowY: 'auto'}}>
                                        {loadingLocalStudents ? (
                                          <div className="dropdown-item-text text-center">
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Cargando estudiantes...
                                          </div>
                                        ) : localStudents.length === 0 ? (
                                          <div className="dropdown-item-text text-center text-muted">
                                            No se encontraron estudiantes
                                          </div>
                                        ) : (
                                          localStudents
                                            .filter(student => 
                                              !studentSearchText || 
                                              student.name?.toLowerCase().includes(studentSearchText.toLowerCase()) ||
                                              student.dni?.includes(studentSearchText) ||
                                              student.enrollmentId?.toLowerCase().includes(studentSearchText.toLowerCase())
                                            )
                                            .slice(0, 10) // Limitar a 10 resultados
                                            .map((student, index) => (
                                              <button
                                                key={student.id || index}
                                                type="button"
                                                className="dropdown-item"
                                                onClick={() => {
                                                  setSelectedStudent(student);
                                                  setStudentSearchText(`${student.name} - ${student.enrollmentId}`);
                                                  setShowStudentDropdown(false);
                                                }}
                                              >
                                                <div>
                                                  <strong>{student.name}</strong>
                                                  <br />
                                                  <small className="text-muted">
                                                    ID: {student.enrollmentId} | DNI: {student.dni}
                                                  </small>
                                                </div>
                                              </button>
                                            ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {selectedStudent && (
                                    <div className="mt-2 p-2 bg-light rounded">
                                      <small>
                                        <strong>Estudiante seleccionado:</strong> {selectedStudent.name}
                                        <br />
                                        <strong>ID Matrícula:</strong> {selectedStudent.enrollmentId}
                                        <br />
                                        <strong>DNI:</strong> {selectedStudent.dni}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Fecha de asistencia */}
                              <div className="col-12 col-md-6 col-xl-3">
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

                              {/* Observaciones */}
                              <div className="col-12">
                                <div className="form-group local-forms">
                                  <label>Observaciones (Opcional)</label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="Escriba aquí cualquier observación adicional..."
                                    value={attendanceObservations}
                                    onChange={(e) => setAttendanceObservations(e.target.value)}
                                  ></textarea>
                                </div>
                              </div>

                              {/* Botones de acción */}
                              <div className="col-12">
                                <div className="doctor-submit d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-primary submit-list-form"
                                    onClick={handleCreateAttendance}
                                    disabled={loading || !selectedStudent}
                                  >
                                    {loading ? (
                                      <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Guardando...
                                      </>
                                    ) : (
                                      '💾 Crear Asistencia'
                                    )}
                                  </button>
                                  
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      setSelectedStudent(null);
                                      setStudentSearchText('');
                                      setAttendanceObservations('');
                                      setAttendanceDate(new Date().toISOString().split('T')[0]);
                                      setShowStudentDropdown(false);
                                    }}
                                  >
                                    🔄 Limpiar Formulario
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Vista de Justificaciones - Solo mostrar en vista de justificaciones */}
                    {activeView === 'justifications' && (
                    <div className="staff-search-table">
                      <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="card-title">📋 Gestión de Justificaciones</h5>
                          <div className="d-flex gap-2">
                            <Link 
                              to="/auxiliary/justifications" 
                              className="btn btn-info btn-sm"
                              title="Ir a gestión completa de justificaciones"
                            >
                              🔧 Gestión Completa
                            </Link>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={loadJustifications}
                              disabled={loadingJustifications}
                            >
                              {loadingJustifications ? '🔄 Cargando...' : '🔄 Actualizar'}
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
                                  <th>Fecha Envío</th>
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
                                          {justification.justificationType === 'MEDICAL' ? '🏥 Médica' :
                                           justification.justificationType === 'FAMILY_EMERGENCY' ? '👨‍👩‍👧‍👦 Familiar' :
                                           justification.justificationType === 'PERSONAL' ? '👤 Personal' :
                                           justification.justificationType === 'ACADEMIC' ? '🎓 Académica' :
                                           justification.justificationType || 'N/A'}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="text-truncate" style={{maxWidth: '200px', display: 'inline-block'}}>
                                          {justification.justificationReason || 'Sin motivo'}
                                        </span>
                                      </td>
                                      <td>
                                        {justification.submissionDate ? 
                                          new Date(justification.submissionDate).toLocaleDateString('es-ES') : 
                                          'N/A'
                                        }
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          justification.approvalStatus === 'PENDING' ? 'badge-warning' :
                                          justification.approvalStatus === 'APPROVED' ? 'badge-success' :
                                          justification.approvalStatus === 'REJECTED' ? 'badge-danger' :
                                          'badge-secondary'
                                        }`}>
                                          {justification.approvalStatus === 'PENDING' ? '⏳ Pendiente' :
                                           justification.approvalStatus === 'APPROVED' ? '✅ Aprobada' :
                                           justification.approvalStatus === 'REJECTED' ? '❌ Rechazada' :
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
                                                title="Aprobar justificación"
                                              >
                                                <i className="feather-check">
                                                  <FeatherIcon icon="check" />
                                                </i>
                                              </button>
                                              <button
                                                className="btn btn-sm bg-danger-light"
                                                onClick={() => {
                                                  showAlert({
                                                    title: '¿Rechazar justificación?',
                                                    message: `Se rechazará la justificación para "${justification.attendanceId}"`,
                                                    type: 'warning',
                                                    onConfirm: () => {
                                                      // Aquí iría la lógica de rechazo
                                                      console.log('Rechazar justificación:', justification.id);
                                                    }
                                                  });
                                                }}
                                                title="Rechazar justificación"
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
                                                title: 'Detalles de la Justificación',
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
                                            🔄 Recargar Justificaciones
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Información adicional */}
                          {justifications.length > 0 && (
                            <div className="row mt-3">
                              <div className="col-sm-12">
                                <div className="d-flex justify-content-between align-items-center">
                                  <p className="text-muted mb-0">
                                    Mostrando {justifications.length} justificación(es)
                                  </p>
                                  <div className="d-flex gap-2">
                                    <span className="badge badge-warning">⏳ Pendientes: {justifications.filter(j => j.approvalStatus === 'PENDING').length}</span>
                                    <span className="badge badge-success">✅ Aprobadas: {justifications.filter(j => j.approvalStatus === 'APPROVED').length}</span>
                                    <span className="badge badge-danger">❌ Rechazadas: {justifications.filter(j => j.approvalStatus === 'REJECTED').length}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Tabla de resultados - Solo mostrar en vista de búsqueda y listado */}
                    {(activeView === 'search' || activeView === 'list-all') && (
                    <>
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            {activeView === 'search' 
                              ? `📊 Resultados de búsqueda: ${getCurrentData().length} registro(s)`
                              : `📋 Todas las asistencias: ${getCurrentData().length} registro(s)`
                            }
                          </h6>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={handleRefresh}
                            disabled={loading}
                          >
                            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
                          </button>
                          
                          {/* Botón temporal para debug - buscar presentes */}
                          <button 
                            className="btn btn-info btn-sm ms-2"
                            onClick={async () => {
                              console.log('🔍 Buscando estudiantes presentes...');
                              try {
                                const response = await attendanceService.getPresentStudentsByDate(new Date().toISOString().split('T')[0]);
                                console.log('👥 Estudiantes presentes:', response);
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
                            🧪 Debug Presentes
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table border-0 star-student table-hover table-center mb-0 datatable table-striped">
                        <thead className="student-thread">
                          <tr>
                            <th>Estudiante</th>
                            <th>ID Matrícula</th>
                            <th>Email</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estado</th>
                            <th>Método Registro</th>
                            <th>Observaciones</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentData().length > 0 ? (
                            getCurrentData().map((student, index) => (
                              <tr key={student.studentEnrollmentId || index}>
                                <td>
                                  <h2 className="table-avatar">
                                    <span className="student-avatar-text">
                                      {student.studentName?.charAt(0)?.toUpperCase() || 'E'}
                                    </span>
                                    <span className="ml-2">{student.studentName || 'N/A'}</span>
                                  </h2>
                                </td>
                                <td>
                                  <span className="badge badge-info">
                                    {student.studentEnrollmentId || 'N/A'}
                                  </span>
                                </td>
                                <td>{student.email || 'No disponible'}</td>
                                <td>
                                  {student.entryDate ? 
                                    new Date(student.entryDate).toLocaleDateString('es-ES') : 
                                    'N/A'
                                  }
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
                                  {/* Determinar estado basado en los datos reales o el tipo de búsqueda */}
                                  {activeView === 'list-all' ? (
                                    // En vista de todas las asistencias, usar función de determinación de estado
                                    (() => {
                                      const status = determineAttendanceStatus(student);
                                      
                                      switch (status) {
                                        case 'present':
                                          return (
                                            <span className="badge badge-success">
                                              ✅ Presente
                                            </span>
                                          );
                                        case 'absent':
                                          return (
                                            <span className="badge badge-danger">
                                              ❌ Ausente
                                            </span>
                                          );
                                        case 'automatic':
                                          return (
                                            <span className="badge badge-warning">
                                              🤖 Automático
                                            </span>
                                          );
                                        default:
                                          return (
                                            <span className="badge badge-secondary">
                                              ❓ Sin definir
                                            </span>
                                          );
                                      }
                                    })()
                                  ) : (
                                    // En vista de búsqueda, usar el tipo de búsqueda
                                    searchType === 'present-by-date' || searchType === 'all-attendance' ? (
                                      <span className="badge badge-success">
                                        ✅ Presente
                                      </span>
                                    ) : (
                                      <span className="badge badge-danger">
                                        ❌ Ausente
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
                                    {student.registrationMethod === 'MANUAL' ? '👤 Manual' :
                                     student.registrationMethod === 'AUTOMATIC' ? '🤖 Automático' :
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
                                    {/* Mostrar acciones basándose en la vista y el estado real del estudiante */}
                                    {activeView === 'list-all' ? (
                                      // En vista de todas las asistencias, verificar estado real
                                      <>
                                        {/* Botón de editar - siempre disponible en vista list-all */}
                                        <button
                                          className="btn btn-sm bg-primary-light me-2"
                                          onClick={() => handleEditAttendance(student)}
                                          title="Editar asistencia"
                                        >
                                          <i className="feather-edit">
                                            <FeatherIcon icon="edit" />
                                          </i>
                                          ✏️ Editar
                                        </button>
                                        
                                        {/* Botón de justificación basado en el estado real */}
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
                                              title="Crear justificación para este estudiante"
                                            >
                                              <i className="feather-plus">
                                                <FeatherIcon icon="plus" />
                                              </i>
                                              📝 Justificar
                                            </button>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      // En vista de búsqueda, usar lógica anterior
                                      (searchType !== 'present-by-date' && searchType !== 'all-attendance') ? (
                                        <button
                                          className="btn btn-sm bg-success-light me-2"
                                          onClick={() => handleOpenJustificationModal(student)}
                                          title="Crear justificación para este estudiante"
                                        >
                                          <i className="feather-edit">
                                            <FeatherIcon icon="edit" />
                                          </i>
                                          📝 Crear Justificación
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
                            ))
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
                                          'Seleccione un tipo de búsqueda y haga clic en "Buscar Estudiantes"'
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

                    {/* Información adicional */}
                    {getCurrentData().length > 0 && (
                      <div className="row mt-3">
                        <div className="col-sm-12">
                          <div className="float-end">
                            <p className="text-muted">
                              {activeView === 'list-all' 
                                ? `Mostrando ${filteredAllAttendances.length} de ${allAttendances.length} registro(s) de asistencia`
                                : `Mostrando ${filteredStudents.length} de ${students.length} estudiante(s)`
                              }
                            </p>
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

      {/* Modal de edición de asistencia */}
      {showEditModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">✏️ Editar Asistencia</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseEditModal}
                ></button>
              </div>
              <div className="modal-body">
                {editingAttendance && (
                  <>
                    {/* Información del estudiante */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <strong>📚 Estudiante:</strong> {editingAttendance.studentName}<br/>
                          <strong>🆔 ID Matrícula:</strong> {editingAttendance.studentEnrollmentId}<br/>
                          <strong>📧 Email:</strong> {editingAttendance.email || 'No disponible'}
                        </div>
                      </div>
                    </div>

                    {/* Formulario de edición */}
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
                            placeholder="Escriba aquí cualquier observación adicional..."
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
                  🚫 Cancelar
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
                    '💾 Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para marcar ausencias automáticamente */}
      {showMarkAbsencesModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">❌ Marcar Ausencias Automáticamente</h4>
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
                  <strong>Atención:</strong> Esta acción marcará como ausentes a todos los estudiantes 
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
                    Seleccione la fecha para la cual desea marcar las ausencias automáticamente.
                  </small>
                </div>

                <div className="form-group">
                  <div className="alert alert-info">
                    <h6><i className="fe fe-info me-2"></i>¿Qué hace esta función?</h6>
                    <ul className="mb-0">
                      <li>Revisa todos los estudiantes matriculados</li>
                      <li>Identifica quiénes NO registraron asistencia en la fecha seleccionada</li>
                      <li>Los marca automáticamente como &quot;ausentes&quot;</li>
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