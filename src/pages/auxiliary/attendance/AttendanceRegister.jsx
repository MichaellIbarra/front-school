import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Tag, DatePicker, Modal, message, Badge, Space, Divider } from 'antd';
import { CameraOutlined, ReloadOutlined, ArrowLeftOutlined, ClockCircleOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import dayjs from 'dayjs';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import useAlert from '../../../hooks/useAlert';
import AlertModal from '../../../components/AlertModal';
import { classroomService } from '../../../services/attendance';
import attendanceService from '../../../services/attendance/attendanceService';
import { BatchAttendanceStatus, RegistrationMethod } from '../../../types/attendance';

const AttendanceRegister = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { alertState, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [classroom, setClassroom] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [attendances, setAttendances] = useState([]);
  const [students, setStudents] = useState([]); // Lista de estudiantes del aula
  const [loading, setLoading] = useState(false);
  const [scannerModal, setScannerModal] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(''); // Para evitar escaneos duplicados
  const [lastScanTime, setLastScanTime] = useState(0); // Timestamp del último escaneo
  const [isProcessingQR, setIsProcessingQR] = useState(false); // Para evitar procesamiento múltiple
  const [detectedQRContent, setDetectedQRContent] = useState(''); // Para mostrar el contenido del QR detectado
  const [scanMode, setScanMode] = useState('entry'); // 'entry' para entrada, 'exit' para salida
  const [shiftInfo, setShiftInfo] = useState(null); // Información del turno actual
  
  // Estados para registro en lote (batch) - Separados por tipo
  const [batchAttendances, setBatchAttendances] = useState([]); // Array de asistencias de entrada
  const [batchExits, setBatchExits] = useState([]); // Array de asistencias de salida
  const [isSendingBatch, setIsSendingBatch] = useState(false); // Estado de envío del lote
  
  // Estados para modal de confirmación eliminados (registro automático)
  const videoRef = useRef(null); // Ref para el elemento video
  const qrScannerRef = useRef(null); // Ref para la instancia del scanner

  useEffect(() => {
    if (classroomId) {
      loadClassroomInfo();
      loadStudents();
      loadShiftInfo();
    }
  }, [classroomId]);

  // Cargar asistencias cuando cambien los estudiantes o la fecha
  useEffect(() => {
    if (classroomId && students.length > 0) {
      loadAttendances();
    }
  }, [classroomId, attendanceDate, students]);

  // Actualizar información del turno cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      loadShiftInfo();
    }, 60000); // Cada 60 segundos

    return () => clearInterval(interval);
  }, []);

  // Cleanup del scanner al desmontar el componente
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
    };
  }, []);

  /**
   * Cargar información del aula
   */
  const loadClassroomInfo = async () => {
    try {
      const classroomData = await classroomService.getClassroomById(classroomId);
      console.log('✅ Aula cargada:', classroomData);
      setClassroom(classroomData);
    } catch (error) {
      console.error('❌ Error al cargar información del aula:', error);
      showError('Error al cargar la información del aula');
    }
  };

  /**
   * Cargar estudiantes matriculados en el aula
   */
  const loadStudents = async () => {
    try {
      console.log(`🎓 Cargando estudiantes del aula ${classroomId}`);
      const studentsData = await classroomService.getStudentsByClassroom(classroomId);
      console.log('✅ Estudiantes cargados:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('❌ Error al cargar estudiantes:', error);
      showError('Error al cargar la lista de estudiantes');
      setStudents([]);
    }
  };

  /**
   * Cargar asistencias del aula por fecha
   */
  const loadAttendances = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAttendancesByClassroom(classroomId, attendanceDate);
      
      if (response.success) {
        console.log('✅ Asistencias cargadas:', response.data);
        
        // Combinar datos de asistencias con información de estudiantes
        const attendancesWithNames = response.data.map(attendance => {
          const student = students.find(s => s.studentId === attendance.studentId);
          return {
            ...attendance,
            studentName: student ? student.studentName : 'Sin nombre',
            firstName: student ? student.firstName : '',
            lastName: student ? student.lastName : '',
            documentNumber: student ? student.documentNumber : ''
          };
        });
        
        console.log('🎯 Asistencias con nombres:', attendancesWithNames);
        setAttendances(attendancesWithNames);
      } else {
        console.error('❌ Error al cargar asistencias:', response.error);
        showError(response.error || 'Error al cargar las asistencias');
        setAttendances([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar asistencias:', error);
      showError('Error al cargar las asistencias');
      setAttendances([]);
    }
    setLoading(false);
  };

  /**
   * Cargar información del turno actual
   */
  const loadShiftInfo = async () => {
    try {
      // Importación directa para evitar problemas de resolución de rutas
      const scheduleUtilsModule = await import('../../../utils/attendance/scheduleUtils');
      const currentShiftInfo = scheduleUtilsModule.getShiftDisplayInfo();
      setShiftInfo(currentShiftInfo);
      console.log('📊 Información del turno:', currentShiftInfo);
    } catch (error) {
      console.error('❌ Error al cargar información del turno:', error);
      setShiftInfo(null);
    }
  };

  /**
   * Abrir modal de scanner QR
   */
  const openQRScanner = async (mode = 'entry') => {
    console.log('🎯 Abriendo scanner QR en modo:', mode);
    console.log('🔄 Estado previo scanMode:', scanMode);
    
    setLastScannedCode(''); // Resetear código anterior
    setLastScanTime(0); // Resetear timestamp
    setIsProcessingQR(false); // Resetear estado de procesamiento
    setDetectedQRContent(''); // Limpiar contenido anterior
    setScanMode(mode); // Establecer el modo de escaneo
    setScannerModal(true);
    
    console.log('✅ Nuevo scanMode establecido:', mode);
    
    // Esperar a que el modal se abra completamente
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          console.log('🎥 Iniciando cámara...');
          
          // Crear nueva instancia del scanner
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => handleQRDetected(result, mode), // Pasar el modo directamente
            {
              returnDetailedScanResult: false, // Devuelve solo el string del QR
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment',
              maxScansPerSecond: 5 // Limitar escaneos por segundo
            }
          );
          
          // Iniciar el scanner
          await qrScannerRef.current.start();
          console.log('✅ Scanner QR iniciado correctamente');
          
        } catch (error) {
          console.error('❌ Error al iniciar scanner:', error);
          if (error.name === 'NotAllowedError') {
            message.error('Acceso a la cámara denegado. Por favor, permite el acceso a la cámara.');
          } else if (error.name === 'NotFoundError') {
            message.error('No se encontró ninguna cámara en el dispositivo.');
          } else if (error.name === 'NotSupportedError') {
            message.error('El navegador no soporta el acceso a la cámara.');
          } else {
            message.error('Error al acceder a la cámara: ' + error.message);
          }
        }
      }
    }, 100);
  };

  /**
   * Función para manejar QR detectado
   */
  const handleQRDetected = async (result, currentScanMode) => {
    // Si ya estamos procesando un QR, ignorar nuevos escaneos
    if (isProcessingQR) {
      return;
    }

    // Extraer el texto del resultado según el formato de qr-scanner
    let scannedText = '';
    
    if (typeof result === 'string') {
      // Si result es directamente un string
      scannedText = result.trim();
    } else if (result && typeof result === 'object') {
      // Si result es un objeto, puede tener propiedades como 'data' o 'text'
      scannedText = (result.data || result.text || result.value || '').toString().trim();
    } else {
      // Si no es string ni objeto válido
      console.warn('⚠️ Formato de QR desconocido:', result);
      return;
    }
    
    // Verificar que no sea vacío después de limpiar
    if (!scannedText) {
      return;
    }

    // Obtener el tiempo actual
    const currentTime = Date.now();
    
    // Evitar procesar el mismo código QR múltiples veces en un período corto
    if (scannedText === lastScannedCode && (currentTime - lastScanTime) < 2000) {
      console.log('🔄 QR duplicado ignorado (muy pronto):', scannedText);
      return;
    }

    console.log('🔍 QR detectado:', scannedText);
    console.log('🎯 Modo de escaneo activo:', currentScanMode);
    
    // Marcar que estamos procesando
    setIsProcessingQR(true);
    setLastScannedCode(scannedText);
    setLastScanTime(currentTime);

    try {
      // Pausar el scanner inmediatamente para evitar lecturas múltiples
      if (qrScannerRef.current) {
        qrScannerRef.current.pause();
      }
      
      // Validar el código QR (función sincrónica)
      const qrData = attendanceService.validateQRCode(scannedText);
      
      if (qrData && qrData.student_id && qrData.classroom_id) {
        console.log('✅ QR válido:', qrData);
        
        // Verificar que el classroomId del QR coincida con el aula actual
        if (qrData.classroom_id !== classroomId) {
          console.log('❌ QR de otra aula detectado:', {
            qrClassroomId: qrData.classroom_id,
            aulaActual: classroomId,
            nombreAula: classroom?.classroomName || 'Aula desconocida'
          });
          
          message.warning({
            content: `⚠️ Este QR pertenece a otra aula. Aula actual: ${classroom?.classroomName || 'Aula desconocida'}`,
            duration: 3,
            style: {
              marginTop: '60px',
              fontSize: '16px'
            }
          });
          
          // Reiniciar scanner después de 1 segundo
          setTimeout(() => {
            setLastScannedCode('');
            setLastScanTime(0);
            setIsProcessingQR(false);
            if (qrScannerRef.current) {
              qrScannerRef.current.start();
            }
          }, 1000);
          return;
        }
        
        console.log('✅ QR del aula correcta, procesando...');
        
        // Parar el scanner temporalmente
        if (qrScannerRef.current) {
          qrScannerRef.current.pause();
        }
        
        // Registrar asistencia automáticamente usando la función que respeta el scanMode
        try {
          await processAttendanceRegistration(qrData, currentScanMode);
          
          // Si llegó hasta aquí, fue exitoso
          const studentIdShort = qrData.student_id.slice(-8);
          const action = currentScanMode === 'entry' ? 'Entrada' : 'Salida';
          
          // Obtener información del estado para el mensaje
          let statusMessage = '';
          if (currentScanMode === 'entry' && shiftInfo) {
            statusMessage = ` - ${shiftInfo.statusText || 'PRESENTE'}`;
          }
          
          message.success({
            content: `✅ ¡${action} registrada${statusMessage}! ID: ...${studentIdShort}`,
            duration: 4,
            style: {
              marginTop: '60px',
              fontSize: '16px'
            }
          });
          
          console.log('🎉 Registro exitoso - Reiniciando scanner en 2 segundos...');
          
          // Esperar 2 segundos y reiniciar el scanner automáticamente
          setTimeout(() => {
            console.log('🔄 Reiniciando scanner automáticamente...');
            setLastScannedCode('');
            setLastScanTime(0);
            setIsProcessingQR(false);
            if (qrScannerRef.current) {
              qrScannerRef.current.start();
            }
          }, 2000);
          
        } catch (registrationError) {
          console.error('❌ Error al registrar asistencia:', registrationError);
          const action = currentScanMode === 'entry' ? 'entrada' : 'salida';
          message.error(`Error al registrar ${action}: ${registrationError.message}`);
          
          // Reiniciar scanner después de error
          setTimeout(() => {
            setLastScannedCode('');
            setLastScanTime(0);
            setIsProcessingQR(false);
            if (qrScannerRef.current) {
              qrScannerRef.current.start();
            }
          }, 2000);
        }
        
      } else {
        console.log('❌ QR inválido o malformado');
        message.error('Código QR inválido. Verifica que contenga la información correcta del estudiante.');
        
        // Reiniciar después de 1 segundo para evitar spam
        setTimeout(() => {
          setLastScannedCode(''); // Resetear para permitir re-escaneo
          setIsProcessingQR(false);
          if (qrScannerRef.current) {
            qrScannerRef.current.start();
          }
        }, 1000);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error al procesar QR:', error);
      message.error('Error al procesar el código QR: ' + error.message);
      
      // Reiniciar después de 1 segundo
      setTimeout(() => {
        setLastScannedCode(''); // Resetear para permitir re-escaneo
        setIsProcessingQR(false);
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
      }, 1000);
      return;
    }
    
    // Solo ejecutar si el QR fue válido
    setIsProcessingQR(false);
  };

  // Funciones de confirmación manual eliminadas (registro automático)

  /**
   * Procesa el registro de asistencia con el QR validado - MODO LOTE
   */
  const processAttendanceRegistration = async (qrData, currentScanMode) => {
    try {
      // Debug: Verificar fecha actual y modo de escaneo
      const currentDate = dayjs().format('YYYY-MM-DD');
      console.log('🗓️ Fecha seleccionada vs actual:', { 
        fechaSeleccionada: attendanceDate, 
        fechaActual: currentDate,
        sonIguales: attendanceDate === currentDate 
      });
      
      console.log('🔍 Modo de escaneo actual:', currentScanMode || scanMode);
      console.log('📋 QR Data recibido:', qrData);
      
      // Usar currentScanMode si se proporciona, sino usar scanMode del estado
      const modeToUse = currentScanMode || scanMode;
      
      // Si es entrada, verificar si el estudiante ya está registrado en el servidor
      if (modeToUse === 'entry') {
        console.log('🔍 Verificando si estudiante ya existe en servidor...');
        console.log('📊 Total asistencias en servidor:', attendances.length);
        
        const existingInServer = attendances.find(
          att => att.studentId === qrData.student_id && att.attendanceDate === attendanceDate
        );
        
        if (existingInServer) {
          console.log('⚠️ Estudiante ya registrado en el servidor:', existingInServer);
          const studentIdShort = qrData.student_id.slice(-8);
          const entryTime = existingInServer.attendanceTime || 'Sin hora';
          const exitTime = existingInServer.exitTime || 'No registrada';
          message.warning({
            content: `🚫 Estudiante ...${studentIdShort} ya registrado hoy. Entrada: ${entryTime} | Salida: ${exitTime}`,
            duration: 4,
            style: { marginTop: '60px', fontSize: '14px' }
          });
          return; // No agregar al lote
        }
      }
      
      // Preparar datos comunes
      
      const currentTime = dayjs().format('HH:mm:ss.SSS');
      const timestamp = dayjs().toISOString();
      
      // Importar utilidades dinámicamente para obtener el estado de asistencia
      const { getCurrentShift } = await import('../../../utils/attendance/scheduleUtils');
      const currentShift = getCurrentShift();
      
      console.log('⏰ Estado de asistencia determinado:', {
        turno: currentShift.shiftName,
        status: currentShift.status,
        statusText: currentShift.statusText,
        dentroDeTolerancia: currentShift.isWithinTolerance,
        horaActual: currentShift.currentTime,
        toleranciaMinutos: currentShift.toleranceMinutes
      });
      
      if (modeToUse === 'entry') {
        // Manejar lote de entrada
        const existingIndex = batchAttendances.findIndex(
          att => att.id_estudiante === qrData.student_id
        );
        
        if (existingIndex !== -1) {
          // Buscar información actualizada del estudiante
          const student = students.find(s => s.studentId === qrData.student_id);
          const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : qrData.full_name || 'Sin nombre';
          
          // Estudiante ya existe en el lote de entrada - actualizar
          const existingAttendance = { ...batchAttendances[existingIndex] };
          existingAttendance.nombre_completo = studentName; // Actualizar nombre también
          existingAttendance.hora_entrada = currentTime;
          existingAttendance.status = currentShift.status || 'P';
          existingAttendance.observaciones = `Entrada QR - ${currentTime} (${currentShift.statusText || 'PRESENTE'})`;
          existingAttendance.metodo_registro = RegistrationMethod.QR_ENTRY;
          existingAttendance.timestamp_registro = timestamp;
          
          const updatedBatch = [...batchAttendances];
          updatedBatch[existingIndex] = existingAttendance;
          setBatchAttendances(updatedBatch);
          
          message.success(`🔄 Estudiante existente: entrada actualizada en lote de entrada`);
        } else {
          // Buscar información del estudiante en la lista cargada
          const student = students.find(s => s.studentId === qrData.student_id);
          const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : qrData.full_name || 'Sin nombre';
          
          // Nuevo estudiante en el lote de entrada
          const newAttendance = {
            id_estudiante: qrData.student_id,
            nombre_completo: studentName,
            id_aula: qrData.classroom_id,
            nombre_aula: qrData.classroom_name,
            status: currentShift.status || 'P',
            hora_entrada: currentTime,
            hora_salida: null,
            observaciones: `Entrada QR - ${currentTime} (${currentShift.statusText || 'PRESENTE'})`,
            metodo_registro: RegistrationMethod.QR_ENTRY,
            timestamp_registro: timestamp,
            batch_status: BatchAttendanceStatus.PENDING
          };
          
          setBatchAttendances(prev => [...prev, newAttendance]);
          message.success(`✅ Nuevo estudiante: entrada agregada al lote de entrada`);
        }
      } else {
        // Manejar lote de salida
        const existingIndex = batchExits.findIndex(
          att => att.id_estudiante === qrData.student_id
        );
        
        if (existingIndex !== -1) {
          // Buscar información actualizada del estudiante
          const student = students.find(s => s.studentId === qrData.student_id);
          const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : qrData.full_name || 'Sin nombre';
          
          // Estudiante ya existe en el lote de salida - actualizar
          const existingExit = { ...batchExits[existingIndex] };
          existingExit.nombre_completo = studentName; // Actualizar nombre también
          existingExit.hora_salida = currentTime;
          existingExit.observaciones = `Salida QR - ${currentTime}`;
          existingExit.metodo_registro = RegistrationMethod.QR_EXIT;
          existingExit.timestamp_registro = timestamp;
          
          const updatedBatch = [...batchExits];
          updatedBatch[existingIndex] = existingExit;
          setBatchExits(updatedBatch);
          
          message.success(`🔄 Estudiante existente: salida actualizada en lote de salida`);
        } else {
          // Buscar información del estudiante en la lista cargada
          const student = students.find(s => s.studentId === qrData.student_id);
          const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : qrData.full_name || 'Sin nombre';
          
          // Nuevo estudiante en el lote de salida
          const newExit = {
            id_estudiante: qrData.student_id,
            nombre_completo: studentName,
            id_aula: qrData.classroom_id,
            nombre_aula: qrData.classroom_name,
            hora_salida: currentTime,
            observaciones: `Salida QR - ${currentTime}`,
            metodo_registro: RegistrationMethod.QR_EXIT,
            timestamp_registro: timestamp,
            batch_status: BatchAttendanceStatus.PENDING
          };
          
          setBatchExits(prev => [...prev, newExit]);
          message.success(`✅ Nuevo estudiante: salida agregada al lote de salida`);
        }
      }
      
      console.log('📦 Lotes actualizados:', { 
        entradas: batchAttendances.length, 
        salidas: batchExits.length,
        modo: modeToUse
      });
      
    } catch (error) {
      const modeToUse = currentScanMode || scanMode;
      console.error('❌ Error al procesar QR para lote:', error);
      message.error(`Error al agregar ${modeToUse === 'entry' ? 'entrada' : 'salida'} al lote: ` + error.message);
    }
  };

  /**
   * Cerrar modal del scanner
   */
  const closeScanner = () => {
    // Parar el scanner si está activo
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    
    // Resetear todos los estados relacionados con el scanner
    setLastScannedCode('');
    setLastScanTime(0);
    setIsProcessingQR(false);
    setDetectedQRContent('');
    setScannerModal(false);
  };

  /**
   * Reiniciar el scanner para escanear otro QR
   */
  const restartScanner = async () => {
    setDetectedQRContent('');
    setLastScannedCode('');
    setLastScanTime(0);
    setIsProcessingQR(false);
    
    // Reiniciar el scanner
    if (videoRef.current) {
      try {
        if (qrScannerRef.current) {
          await qrScannerRef.current.start();
        }
      } catch (error) {
        console.error('❌ Error al reiniciar scanner:', error);
        message.error('Error al reiniciar el scanner');
      }
    }
  };

  /**
   * Cambiar fecha de registro
   */
  const handleDateChange = (date) => {
    if (date) {
      setAttendanceDate(date.format('YYYY-MM-DD'));
    }
  };

  /**
   * Enviar lote de entradas al servidor
   */
  const sendBatchAttendances = async () => {
    if (batchAttendances.length === 0) {
      message.warning('No hay entradas en el lote para enviar');
      return;
    }

    setIsSendingBatch(true);
    
    try {
      // Preparar el lote según la estructura esperada por el backend
      const batchData = {
        classroomId: classroomId,
        date: attendanceDate,
        attendances: batchAttendances.map(att => ({
          studentId: att.id_estudiante,
          status: att.status, // Incluir el status (P, A, L, E, J)
          entryTime: att.hora_entrada,
          exitTime: att.hora_salida,
          observations: att.observaciones,
          timestamp: att.timestamp_registro
        }))
      };

      console.log('🚀 Enviando lote de entradas:');
      console.log('📦 Estructura del lote:', JSON.stringify(batchData, null, 2));
      console.log('📊 Verificación de status en lote:', batchData.attendances.map(att => ({
        studentId: att.studentId.slice(-8),
        status: att.status,
        statusText: att.status === 'P' ? 'Presente' : att.status === 'L' ? 'Tardanza' : att.status === 'A' ? 'Ausente' : 'Otro'
      })));
      
      // Enviar lote al backend
      const response = await attendanceService.sendBatchAttendances(batchData);
      
      if (response.success) {
        message.success({
          content: `✅ Lote de entradas enviado correctamente (${batchAttendances.length} registros)`,
          duration: 4,
          style: {
            marginTop: '60px',
            fontSize: '16px'
          }
        });
        
        // Limpiar el lote después del envío exitoso
        setBatchAttendances([]);
        
        // Recargar las asistencias desde el servidor
        await loadAttendances();
        
        console.log('🎉 Lote de entradas procesado exitosamente:', response.data);
      } else {
        throw new Error(response.error || 'Error desconocido al enviar el lote de entradas');
      }
      
    } catch (error) {
      console.error('❌ Error al enviar lote de entradas:', error);
      message.error('Error al enviar el lote de entradas: ' + error.message);
    } finally {
      setIsSendingBatch(false);
    }
  };

  /**
   * Enviar lote de salidas al servidor
   */
  const sendBatchExits = async () => {
    if (batchExits.length === 0) {
      message.warning('No hay salidas en el lote para enviar');
      return;
    }

    setIsSendingBatch(true);
    
    try {
      // Preparar el lote según la estructura esperada por el backend para salidas
      const batchData = {
        classroomId: classroomId,
        date: attendanceDate,
        exits: batchExits.map(exit => ({
          studentId: exit.id_estudiante,
          exitTime: exit.hora_salida,
          observations: exit.observaciones,
          timestamp: exit.timestamp_registro
        }))
      };

      console.log('🚀 Enviando lote de salidas:');
      console.log('📦 Estructura del lote:', JSON.stringify(batchData, null, 2));
      
      // Enviar lote al backend usando el endpoint específico para salidas
      const response = await attendanceService.sendBatchExits(batchData);
      
      if (response.success) {
        message.success({
          content: `✅ Lote de salidas enviado correctamente (${batchExits.length} registros)`,
          duration: 4,
          style: {
            marginTop: '60px',
            fontSize: '16px'
          }
        });
        
        // Limpiar el lote después del envío exitoso
        setBatchExits([]);
        
        // Recargar las asistencias desde el servidor
        await loadAttendances();
        
        console.log('🎉 Lote de salidas procesado exitosamente:', response.data);
      } else {
        throw new Error(response.error || 'Error desconocido al enviar el lote de salidas');
      }
      
    } catch (error) {
      console.error('❌ Error al enviar lote de salidas:', error);
      message.error('Error al enviar el lote de salidas: ' + error.message);
    } finally {
      setIsSendingBatch(false);
    }
  };

  /**
   * Limpiar lote de entradas
   */
  const clearBatchAttendances = () => {
    if (batchAttendances.length === 0) {
      message.info('No hay registros en el lote de entradas');
      return;
    }

    Modal.confirm({
      title: '¿Limpiar lote de entradas?',
      content: `Se eliminarán ${batchAttendances.length} registros del lote de entradas local. Esta acción no se puede deshacer.`,
      okText: 'Sí, limpiar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        setBatchAttendances([]);
        message.success('Lote de entradas limpiado');
      }
    });
  };

  /**
   * Limpiar lote de salidas
   */
  const clearBatchExits = () => {
    if (batchExits.length === 0) {
      message.info('No hay registros en el lote de salidas');
      return;
    }

    Modal.confirm({
      title: '¿Limpiar lote de salidas?',
      content: `Se eliminarán ${batchExits.length} registros del lote de salidas local. Esta acción no se puede deshacer.`,
      okText: 'Sí, limpiar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        setBatchExits([]);
        message.success('Lote de salidas limpiado');
      }
    });
  };

  /**
   * Eliminar registro específico del lote de entrada
   */
  const removeFromBatchEntry = (studentId) => {
    setBatchAttendances(prev => prev.filter(att => att.id_estudiante !== studentId));
    message.success('Registro eliminado del lote de entrada');
  };

  /**
   * Eliminar registro específico del lote de salida
   */
  const removeFromBatchExit = (studentId) => {
    setBatchExits(prev => prev.filter(att => att.id_estudiante !== studentId));
    message.success('Registro eliminado del lote de salida');
  };

  /**
   * Registrar salida de un estudiante
   */
  const handleExitRegister = async (record) => {
    try {
      setLoading(true);
      
      const exitData = {
        studentId: record.studentId,
        classroomId: record.classroomId,
        exitDate: attendanceDate,
        observations: 'Salida registrada manualmente'
      };

      const response = await attendanceService.registerExit(exitData);
      
      if (response.success) {
        message.success(`Salida registrada para ${record.studentName || 'estudiante'}`);
        // Recargar las asistencias para mostrar la actualización
        await loadAttendances();
      } else {
        message.error(response.error || 'Error al registrar la salida');
      }
    } catch (error) {
      console.error('❌ Error al registrar salida:', error);
      message.error('Error al registrar la salida');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Columnas de la tabla de asistencias
   */
  const columns = [
    {
      title: 'Personal',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text || 'Sin nombre'}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>ID: {record.studentId}</div>
        </div>
      )
    },
    {
      title: 'Fecha Entrada',
      dataIndex: 'attendanceDate',
      key: 'attendanceDate',
      render: (date) => {
        if (!date) return '---';
        return dayjs(date).format('DD/MM/YYYY');
      }
    },
    {
      title: 'H. Entrada',
      dataIndex: 'attendanceTime',
      key: 'attendanceTime',
      render: (time) => time || '---'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = record.status || 'A';
        
        switch(status) {
          case 'P':
            return <Tag color="green">PRESENTE</Tag>;
          case 'A':
            return <Tag color="red">AUSENTE</Tag>;
          case 'L':
            return <Tag color="orange">TARDANZA</Tag>;
          case 'E':
            return <Tag color="blue">EXCUSADO</Tag>;
          case 'J':
            return <Tag color="purple">JUSTIFICADO</Tag>;
          default:
            return <Tag color="gray">DESCONOCIDO</Tag>;
        }
      }
    },
    {
      title: 'H. Salida',
      dataIndex: 'exitTime',
      key: 'exitTime',
      render: (exitTime, record) => {
        if (exitTime) {
          return <span style={{ color: '#52c41a', fontWeight: '500' }}>{exitTime}</span>;
        }
        // Solo mostrar botón de salida si el estudiante está presente
        if (record.status === 'P' && record.attendanceTime) {
          return (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => handleExitRegister(record)}
              style={{ fontSize: '11px' }}
            >
              Registrar Salida
            </Button>
          );
        }
        return <span style={{ color: '#999' }}>---</span>;
      }
    }
  ];

  return (
    <>
      <Header />
      <Sidebar activeClassName="my-classrooms" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Encabezado */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/auxiliary/my-classrooms')}
                  style={{ marginBottom: '10px' }}
                >
                  Volver a Mis Aulas
                </Button>
                <h3 className="page-title">Registrar Asistencia</h3>
                {classroom && (
                  <div style={{ marginTop: '8px' }}>
                    <Tag color={classroomService.getRandomClassroomColor()}>
                      {classroom.classroomName || `Aula ${classroom.section}`} - {classroom.shiftName}
                    </Tag>
                    <Tag>Sección: {classroom.section}</Tag>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card de Control */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ marginRight: '8px', fontWeight: 500 }}>
                  Establecer Fecha de Registro:
                </label>
                <DatePicker
                  value={dayjs(attendanceDate)}
                  onChange={handleDateChange}
                  format="DD/MM/YYYY"
                  style={{ width: '200px' }}
                  allowClear={false}
                />
              </div>

              {/* Indicador de Turno Actual */}
              {shiftInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Turno Actual:</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                      <Badge 
                        color={
                        shiftInfo.badgeColor === 'success' ? '#52c41a' : 
                        shiftInfo.badgeColor === 'warning' ? '#faad14' : 
                        shiftInfo.badgeColor === 'error' ? '#ff4d4f' : 
                        '#d9d9d9'
                      } 
                        text={shiftInfo.displayMessage}
                      />
                    </div>
                    {shiftInfo.toleranceMessage && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: shiftInfo.isEstimated ? '#fa8c16' : (shiftInfo.status === 'P' ? '#52c41a' : '#faad14')
                      }}>
                        {shiftInfo.toleranceMessage} • Estado: {shiftInfo.statusText}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={() => openQRScanner('entry')}
                size="large"
                style={{ backgroundColor: '#52c41a' }}
                disabled={isProcessingQR}
              >
                {isProcessingQR && scanMode === 'entry' ? 'Procesando...' : 'QR Entrada'}
              </Button>

              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={() => openQRScanner('exit')}
                size="large"
                style={{ backgroundColor: '#faad14' }}
                disabled={isProcessingQR}
              >
                {isProcessingQR && scanMode === 'exit' ? 'Procesando...' : 'QR Salida'}
              </Button>

              <Divider type="vertical" />

              {/* Controles del Lote de Entrada */}
              <Space>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendBatchAttendances}
                  loading={isSendingBatch}
                  disabled={batchAttendances.length === 0}
                  style={{ backgroundColor: '#52c41a' }}
                >
                  Enviar Lote Entrada ({batchAttendances.length})
                </Button>

                <Button
                  icon={<DeleteOutlined />}
                  onClick={clearBatchAttendances}
                  disabled={batchAttendances.length === 0}
                  danger
                >
                  Limpiar Entrada
                </Button>
              </Space>

              <Divider type="vertical" />

              {/* Controles del Lote de Salida */}
              <Space>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendBatchExits}
                  loading={isSendingBatch}
                  disabled={batchExits.length === 0}
                  style={{ backgroundColor: '#ff7875' }}
                >
                  Enviar Lote Salida ({batchExits.length})
                </Button>

                <Button
                  icon={<DeleteOutlined />}
                  onClick={clearBatchExits}
                  disabled={batchExits.length === 0}
                  danger
                >
                  Limpiar Salida
                </Button>
              </Space>

              <Divider type="vertical" />

              <Button
                icon={<ReloadOutlined />}
                onClick={loadAttendances}
                loading={loading}
              >
                Actualizar
              </Button>

              <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
                <Space direction="vertical" size="small">
                  <div>Total registros: <strong>{attendances.length}</strong></div>
                  <div>Lote pendiente: <strong style={{ color: '#1890ff' }}>{batchAttendances.length}</strong></div>
                </Space>
              </div>
            </div>
          </Card>

          {/* Lote de Entradas Pendientes */}
          {batchAttendances.length > 0 && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📦 Lote de Entrada ({batchAttendances.length})</span>
                  <Badge count={batchAttendances.length} showZero style={{ backgroundColor: '#52c41a' }} />
                </div>
              }
              style={{ marginBottom: '20px' }}
              size="small"
            >
              <Table
                columns={[
                  {
                    title: 'ID Estudiante',
                    dataIndex: 'id_estudiante',
                    key: 'id_estudiante',
                    render: (id) => (
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        ...{id.slice(-8)}
                      </span>
                    )
                  },
                  {
                    title: 'Nombre',
                    dataIndex: 'nombre_completo',
                    key: 'nombre_completo',
                    render: (name) => name || 'Sin nombre'
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={status === 'P' ? 'green' : status === 'L' ? 'orange' : 'red'}>
                        {status === 'P' ? 'Presente' : status === 'L' ? 'Tardanza' : 'Ausente'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Hora Entrada',
                    dataIndex: 'hora_entrada',
                    key: 'hora_entrada',
                    render: (time) => time || <span style={{ color: '#999' }}>---</span>
                  },
                  {
                    title: 'Aula',
                    dataIndex: 'nombre_aula',
                    key: 'nombre_aula',
                    render: (aula) => aula || 'Sin aula'
                  },
                  {
                    title: 'Acciones',
                    key: 'actions',
                    render: (_, record) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => removeFromBatchEntry(record.id_estudiante)}
                        icon={<DeleteOutlined />}
                      >
                        Quitar
                      </Button>
                    )
                  }
                ]}
                dataSource={batchAttendances}
                rowKey="id_estudiante"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </Card>
          )}

          {/* Lote de Salidas Pendientes */}
          {batchExits.length > 0 && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📦 Lote de Salida ({batchExits.length})</span>
                  <Badge count={batchExits.length} showZero style={{ backgroundColor: '#ff7875' }} />
                </div>
              }
              style={{ marginBottom: '20px' }}
              size="small"
            >
              <Table
                columns={[
                  {
                    title: 'ID Estudiante',
                    dataIndex: 'id_estudiante',
                    key: 'id_estudiante',
                    render: (id) => (
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        ...{id.slice(-8)}
                      </span>
                    )
                  },
                  {
                    title: 'Nombre',
                    dataIndex: 'nombre_completo',
                    key: 'nombre_completo',
                    render: (name) => name || 'Sin nombre'
                  },
                  {
                    title: 'Hora Salida',
                    dataIndex: 'hora_salida',
                    key: 'hora_salida',
                    render: (time) => time || <span style={{ color: '#999' }}>---</span>
                  },
                  {
                    title: 'Aula',
                    dataIndex: 'nombre_aula',
                    key: 'nombre_aula',
                    render: (aula) => aula || 'Sin aula'
                  },
                  {
                    title: 'Acciones',
                    key: 'actions',
                    render: (_, record) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => removeFromBatchExit(record.id_estudiante)}
                        icon={<DeleteOutlined />}
                      >
                        Quitar
                      </Button>
                    )
                  }
                ]}
                dataSource={batchExits}
                rowKey="id_estudiante"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </Card>
          )}

          {/* Tabla de Asistencias */}
          <Card title="Lista de Asistencias">
            <Table
              columns={columns}
              dataSource={attendances}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} registros`
              }}
              locale={{
                emptyText: 'No hay asistencias registradas para esta fecha'
              }}
              size="middle"
            />
          </Card>
        </div>
      </div>

      {/* Modal de Scanner QR */}
      <Modal
        title={`Escanear QR - ${scanMode === 'entry' ? 'ENTRADA' : 'SALIDA'} de Estudiante`}
        open={scannerModal}
        onCancel={closeScanner}
        footer={[
          <Button key="close" onClick={closeScanner}>
            Cerrar Scanner
          </Button>
        ]}
        width={650}
        destroyOnClose
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ marginBottom: '20px', color: '#666', fontSize: '16px' }}>
            Coloque el código QR del estudiante frente a la cámara
          </p>
          
          {/* Información del aula actual */}
          {classroom && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '10px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <strong>Aula actual:</strong> {classroom.classroomName} - {classroom.shiftName}
              <br />
              <strong>Fecha:</strong> {dayjs(attendanceDate).format('DD/MM/YYYY')}
            </div>
          )}

          {/* Estado de procesamiento */}
          {isProcessingQR && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '12px', 
              backgroundColor: '#fff2e8', 
              borderRadius: '6px',
              border: '1px solid #ffb769',
              color: '#d46b08',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ⚡ Registrando asistencia automáticamente...
            </div>
          )}

          {/* Mostrar contenido del QR detectado */}
          {detectedQRContent && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#f6ffed', 
              borderRadius: '6px',
              border: '1px solid #b7eb8f',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#52c41a' }}>✅ QR Detectado:</h4>
              <pre style={{ 
                margin: 0, 
                fontSize: '12px', 
                backgroundColor: '#fff', 
                padding: '10px', 
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {detectedQRContent}
              </pre>
            </div>
          )}

          {/* Scanner QR - Solo mostrar si no hay QR detectado */}
          {scannerModal && !detectedQRContent && (
            <div style={{ 
              border: '2px solid #d9d9d9', 
              borderRadius: '8px', 
              overflow: 'hidden',
              maxWidth: '500px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <video 
                ref={videoRef}
                style={{ 
                  width: '100%', 
                  height: '400px',
                  objectFit: 'cover'
                }}
                autoPlay
                playsInline
                muted
              />
              {isProcessingQR && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '14px'
                }}>
                  ⚡ Procesando QR detectado...
                </div>
              )}
            </div>
          )}

          {/* Botón para reiniciar el scanner si ya se detectó un QR */}
          {detectedQRContent && (
            <Button 
              type="primary" 
              onClick={restartScanner}
              style={{ marginTop: '10px' }}
            >
              Escanear Otro QR
            </Button>
          )}

          <p style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
            El QR debe contener información del estudiante y el aula correspondiente
          </p>
        </div>
      </Modal>

      {/* Modal de confirmación eliminado - Registro automático */}

      <AlertModal alert={alertState} onConfirm={alertConfirm} onCancel={alertCancel} />
    </>
  );
};

export default AttendanceRegister;
