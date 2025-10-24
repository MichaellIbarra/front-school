import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Tag, DatePicker, Modal, message } from 'antd';
import { CameraOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import dayjs from 'dayjs';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import useAlert from '../../../hooks/useAlert';
import AlertModal from '../../../components/AlertModal';
import { classroomService } from '../../../services/attendance';
import attendanceService from '../../../services/attendance/attendanceService';

const AttendanceRegister = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { alertState, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [classroom, setClassroom] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerModal, setScannerModal] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(''); // Para evitar escaneos duplicados
  const [lastScanTime, setLastScanTime] = useState(0); // Timestamp del último escaneo
  const [isProcessingQR, setIsProcessingQR] = useState(false); // Para evitar procesamiento múltiple
  const [detectedQRContent, setDetectedQRContent] = useState(''); // Para mostrar el contenido del QR detectado
  // Estados para modal de confirmación eliminados (registro automático)
  const videoRef = useRef(null); // Ref para el elemento video
  const qrScannerRef = useRef(null); // Ref para la instancia del scanner

  useEffect(() => {
    if (classroomId) {
      loadClassroomInfo();
      loadAttendances();
    }
  }, [classroomId, attendanceDate]);

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
   * Cargar asistencias del aula por fecha
   */
  const loadAttendances = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAttendancesByClassroom(classroomId, attendanceDate);
      
      if (response.success) {
        console.log('✅ Asistencias cargadas:', response.data);
        setAttendances(response.data);
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
   * Abrir modal de scanner QR
   */
  const openQRScanner = async () => {
    setLastScannedCode(''); // Resetear código anterior
    setLastScanTime(0); // Resetear timestamp
    setIsProcessingQR(false); // Resetear estado de procesamiento
    setDetectedQRContent(''); // Limpiar contenido anterior
    setScannerModal(true);
    
    // Esperar a que el modal se abra completamente
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          console.log('🎥 Iniciando cámara...');
          
          // Crear nueva instancia del scanner
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => handleQRDetected(result),
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
  const handleQRDetected = async (result) => {
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
        
        // Parar el scanner temporalmente
        if (qrScannerRef.current) {
          qrScannerRef.current.pause();
        }
        
        // Registrar asistencia automáticamente
        try {
          const response = await attendanceService.registerAttendanceByQR(
            qrData, // Pasar directamente qrData que ya tiene student_id y classroom_id
            attendanceDate,
            `Registro automático via QR - ${dayjs().format('HH:mm:ss')}`
          );
          
          if (response.success) {
            const studentIdShort = qrData.student_id.slice(-8);
            message.success({
              content: `✅ ¡Asistencia registrada! ID: ...${studentIdShort}`,
              duration: 3,
              style: {
                marginTop: '60px',
                fontSize: '16px'
              }
            });
            
            loadAttendances(); // Actualizar la lista
            
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
            
          } else {
            throw new Error(response.message || 'Error al registrar asistencia');
          }
          
        } catch (registrationError) {
          console.error('❌ Error al registrar asistencia:', registrationError);
          message.error(`Error al registrar: ${registrationError.message}`);
          
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
   * Procesa el registro de asistencia con el QR validado
   */
  const processAttendanceRegistration = async (qrData) => {
    try {
      console.log('📝 Iniciando registro de asistencia para:', qrData);
      
      const response = await attendanceService.registerAttendanceByQR(
        qrData,
        attendanceDate,
        `Registro via QR scan - ${dayjs().format('HH:mm:ss')}`
      );

      if (response.success) {
        console.log('✅ Asistencia registrada exitosamente:', response.data);
        showSuccess(`Asistencia registrada exitosamente para el estudiante`);
        
        // Recargar la lista de asistencias
        await loadAttendances();
      } else {
        console.error('❌ Error al registrar asistencia:', response.error);
        showError(response.error || 'Error al registrar la asistencia');
      }
    } catch (error) {
      console.error('❌ Error en processAttendanceRegistration:', error);
      showError('Error al registrar la asistencia: ' + error.message);
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
            return <Tag color="orange">TARDE</Tag>;
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
      key: 'exitTime',
      render: () => '---' // Por ahora no hay datos de salida
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
                    <Tag color={classroomService.getGradeColor(classroom.grade)}>
                      {classroom.classroomName} - {classroom.shiftName}
                    </Tag>
                    <Tag>Grado: {classroom.grade}°</Tag>
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

              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={openQRScanner}
                size="large"
                style={{ backgroundColor: '#1890ff' }}
                disabled={isProcessingQR}
              >
                {isProcessingQR ? 'Procesando...' : 'Escanear QR'}
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={loadAttendances}
                loading={loading}
              >
                Actualizar
              </Button>

              {/* Botón de prueba QR (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  type="dashed"
                  onClick={() => {
                    const testQR = {
                      student_id: "550e8400-e29b-41d4-a716-446655440000",
                      classroom_id: classroomId,
                      timestamp: new Date().toISOString()
                    };
                    processAttendanceRegistration(testQR);
                  }}
                  style={{ backgroundColor: '#f0f0f0' }}
                >
                  Test QR
                </Button>
              )}

              <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
                Total registros: <strong>{attendances.length}</strong>
              </div>
            </div>
          </Card>

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
        title="Escanear Código QR de Estudiante"
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
