/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography,
  Image,
  Row,
  Col,
  Divider,
  Progress,
  Card,
  Alert,
  Tag
} from 'antd';
import { 
  WhatsAppOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

// Servicios
import notificationsDirectorService from '../../../services/notification/notificationsDirectorService';

// Types y utilidades
import {
  validateInstanceName,
  validatePhoneNumber,
  formatPhoneNumber,
  getConnectionStatusColor,
  getConnectionStatusText,
  getConnectionStatusIcon
} from '../../../types/notifications/notifications';

const { Title, Text } = Typography;

const WhatsAppModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  mode = 'create', // 'create' o 'reset'
  instance = null, // Para modo reset
  showAlert,
  showSuccess,
  showError 
}) => {
  const [form] = Form.useForm();
  
  // Estados del modal
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: formulario, 2: QR y temporizador
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(60); // 60 segundos
  const [timerActive, setTimerActive] = useState(false);
  const [processingTime, setProcessingTime] = useState(0); // Tiempo de procesamiento
  
  // Estados del formulario
  const [instanceName, setInstanceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Inicializar formulario según el modo
  useEffect(() => {
    if (visible) {
      if (mode === 'reset' && instance) {
        setInstanceName(instance.instanceName || '');
        setPhoneNumber(instance.phoneNumber || '');
        form.setFieldsValue({
          instanceName: instance.instanceName || '',
          phoneNumber: instance.phoneNumber || ''
        });
      } else {
        setInstanceName('');
        setPhoneNumber('');
        form.resetFields();
      }
      setStep(1);
      setQrData(null);
      setCountdown(60);
      setTimerActive(false);
    }
  }, [visible, mode, instance, form]);

  // Temporizador para QR
  useEffect(() => {
    let interval;
    if (timerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, countdown]);

  // Contador de tiempo de procesamiento
  useEffect(() => {
    let interval;
    if (loading) {
      setProcessingTime(0);
      interval = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
    } else {
      setProcessingTime(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  /**
   * Maneja el envío del formulario para crear instancia
   */
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      
      const instanceData = {
        instance_name: values.instanceName.trim(),
        phone_number: values.phoneNumber.trim()
      };

      console.log('📤 Creando instancia WhatsApp:', instanceData);
      
      const response = await notificationsDirectorService.createInstance(instanceData);
      
      console.log('📥 Respuesta del servicio:', response);
      
      if (response.success) {
        // El QR puede estar en diferentes lugares según la respuesta del backend
        const qrInfo = response.data || response;
        
        console.log('📊 Datos de QR:', qrInfo);
        
        setQrData(qrInfo);
        setStep(2);
        setCountdown(60);
        setTimerActive(true);
        
        showSuccess(
          'Instancia WhatsApp creada exitosamente',
          'Escanea el código QR en menos de 1 minuto para conectar tu WhatsApp.'
        );
      } else {
        console.error('❌ Error en la respuesta:', response);
        showError(
          'Error al crear instancia',
          response.error || 'No se pudo crear la instancia WhatsApp'
        );
      }
    } catch (error) {
      console.error('❌ Error al crear instancia:', error);
      showError(
        'Error inesperado',
        'Ocurrió un error inesperado al crear la instancia'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el reset de la instancia
   */
  const handleReset = async (values) => {
    try {
      setLoading(true);
      
      // Preparar datos para el reset
      const resetData = {
        id: instance.id, // ID de la instancia en el backend local
        instanceName: instance.instanceName,
        instanceCode: instance.instanceCode, // Mantener el código original
        phoneNumber: values.phoneNumber.trim() // Usar el número del formulario
      };

      console.log('📤 Reseteando instancia WhatsApp:', resetData);
      
      const response = await notificationsDirectorService.resetInstance(resetData);
      
      if (response.success && response.data) {
        setQrData(response.data);
        setStep(2);
        setCountdown(60);
        setTimerActive(true);
        
        showSuccess(
          'Instancia reiniciada exitosamente',
          'Escanea el nuevo código QR en menos de 1 minuto para reconectar tu WhatsApp.'
        );
        
        // Llamar a onSuccess para actualizar la lista
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showError(
          'Error al reiniciar instancia',
          response.error || 'No se pudo reiniciar la instancia WhatsApp'
        );
      }
    } catch (error) {
      console.error('❌ Error al resetear instancia:', error);
      showError(
        'Error inesperado',
        'Ocurrió un error inesperado al reiniciar la instancia'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    if (mode === 'create') {
      await handleCreate(values);
    } else if (mode === 'reset') {
      await handleReset(values);
    }
  };

  /**
   * Maneja el botón de restablecer (volver al paso 1)
   */
  const handleRestart = () => {
    setStep(1);
    setQrData(null);
    setTimerActive(false);
    setCountdown(60);
  };

  /**
   * Maneja el cierre del modal
   */
  const handleClose = () => {
    if (step === 2 && qrData) {
      // Si hay una instancia creada/reseteada, notificar éxito
      onSuccess();
    }
    onClose();
  };

  /**
   * Formatea el tiempo restante del countdown
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Formatea el tiempo de procesamiento
   */
  const formatProcessingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Obtiene el color del progreso según el tiempo restante
   */
  const getProgressColor = () => {
    if (countdown > 40) return '#52c41a'; // Verde
    if (countdown > 20) return '#faad14'; // Amarillo
    return '#ff4d4f'; // Rojo
  };

  return (
    <Modal
      title={
        <Space>
          <WhatsAppOutlined style={{ color: '#25D366' }} />
          {mode === 'create' ? 'Crear Nueva Instancia WhatsApp' : 'Reiniciar Instancia WhatsApp'}
        </Space>
      }
      open={visible}
      onCancel={loading ? undefined : handleClose}
      footer={null}
      width={600}
      centered
      destroyOnClose
      closable={!loading}
      maskClosable={!loading}
    >
      {step === 1 && (
        // Paso 1: Formulario
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <div style={{ marginBottom: '24px' }}>
            <Alert
              message={mode === 'create' ? 'Nueva Instancia WhatsApp' : 'Reiniciar Instancia WhatsApp'}
              description={
                mode === 'create' 
                  ? 'Completa los datos para crear una nueva instancia de WhatsApp para tu institución.'
                  : 'Puedes cambiar el número de teléfono o mantener el actual. La instancia se reiniciará y generará un nuevo código QR.'
              }
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          </div>

          <Form.Item
            label="Nombre de la Instancia"
            name="instanceName"
            rules={[
              { required: true, message: 'El nombre de la instancia es obligatorio' },
              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
              { max: 50, message: 'El nombre no puede exceder 50 caracteres' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Solo se permiten letras, números, guiones y guiones bajos' }
            ]}
          >
            <Input
              placeholder="Ej: SEDE_PRINCIPAL_2025"
              prefix={<WhatsAppOutlined />}
              disabled={mode === 'reset'} // En reset no se puede cambiar el nombre
            />
          </Form.Item>

          <Form.Item
            label="Número de Teléfono"
            name="phoneNumber"
            rules={[
              { required: mode === 'create', message: 'El número de teléfono es obligatorio' },
              { pattern: /^51\d{9}$/, message: 'Formato: 51XXXXXXXXX (código país + 9 dígitos)' }
            ]}
            extra={mode === 'reset' 
              ? "Opcional: deja el mismo número o cámbialo si deseas usar otro WhatsApp"
              : "Formato peruano: 51 + 9 dígitos (ej: 51987654321)"
            }
          >
            <Input
              placeholder="51987654321"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>

          {mode === 'reset' && (
            <Alert
              message="Reinicio de Instancia WhatsApp"
              description="Se eliminará la instancia actual del sistema externo y se creará una nueva con el mismo nombre. Puedes cambiar el número de teléfono si deseas asociar la instancia a un WhatsApp diferente, o mantener el mismo número."
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          )}

          {loading && (
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f0f8ff',
              border: '1px solid #d1ecf1',
              borderRadius: '6px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px', color: '#0c5460' }}>
                  🔄 <strong>Procesando solicitud...</strong>
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#0c5460' }}>
                  ⏱️ Tiempo transcurrido: <strong>{formatProcessingTime(processingTime)}</strong>
                </div>
                <Progress 
                  percent={(processingTime / 300) * 100} 
                  strokeColor="#17a2b8"
                  showInfo={false}
                  size="small"
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  Por favor espera, esto puede tomar varios minutos...
                </div>
              </div>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={loading}
                icon={mode === 'create' ? <WhatsAppOutlined /> : <ReloadOutlined />}
              >
                {mode === 'create' ? 'Crear Instancia' : 'Reiniciar Instancia'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {step === 2 && qrData && (
        // Paso 2: QR y Temporizador
        <div>
          <Alert
            message="¡Instancia Lista!"
            description={`La instancia ha sido ${mode === 'create' ? 'creada' : 'reiniciada'} exitosamente. Escanea el código QR con tu WhatsApp para conectar.`}
            type="success"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          {/* Información de la instancia */}
          <Card size="small" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Nombre:</Text>
                <br />
                <Text>{qrData.instanceName || qrData.instance_name}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Teléfono:</Text>
                <br />
                <Text>{formatPhoneNumber(qrData.phoneNumber || qrData.phone_number)}</Text>
              </Col>
            </Row>
            <Row style={{ marginTop: '12px' }}>
              <Col span={24}>
                <Text strong>Código de Instancia:</Text>
                <br />
                <Tag color="blue">{qrData.instanceCode || qrData.instance_code}</Tag>
              </Col>
            </Row>
          </Card>

          {/* Temporizador y QR */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: getProgressColor(), marginRight: '8px' }} />
              <Text strong style={{ fontSize: '18px', color: getProgressColor() }}>
                {formatTime(countdown)}
              </Text>
            </div>
            
            <Progress
              percent={(countdown / 60) * 100}
              strokeColor={getProgressColor()}
              showInfo={false}
              style={{ marginBottom: '16px' }}
            />
            
            <Text type="secondary">
              {timerActive 
                ? 'Tiempo restante para escanear el código QR'
                : 'El tiempo para escanear ha expirado'
              }
            </Text>
          </div>

          {/* Código QR */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              border: '2px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '16px', 
              display: 'inline-block',
              backgroundColor: '#fafafa'
            }}>
              {qrData.base64 ? (
                <Image
                  src={qrData.base64}
                  alt="Código QR WhatsApp"
                  style={{ maxWidth: '250px', maxHeight: '250px' }}
                  preview={false}
                />
              ) : (
                <div style={{ 
                  width: '250px', 
                  height: '250px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px'
                }}>
                  <QrcodeOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                </div>
              )}
            </div>
          </div>

          {/* Estado de conexión */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Text strong>Estado de Conexión: </Text>
            <Tag color={getConnectionStatusColor(qrData.connectionStatus || qrData.connection_status)}>
              {getConnectionStatusIcon(qrData.connectionStatus || qrData.connection_status)} {' '}
              {getConnectionStatusText(qrData.connectionStatus || qrData.connection_status)}
            </Tag>
          </div>

          {/* Instrucciones */}
          <Alert
            message="Instrucciones para conectar"
            description={
              <ol style={{ marginLeft: '16px', marginBottom: 0 }}>
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a <strong>Configuración</strong> → <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>&quot;Vincular un dispositivo&quot;</strong></li>
                <li>Escanea este código QR con la cámara de tu teléfono</li>
                <li>Una vez conectado, podrás enviar notificaciones desde el sistema</li>
              </ol>
            }
            type="info"
            showIcon
          />

          {/* Botones de acción */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRestart}
                disabled={loading}
              >
                Restablecer
              </Button>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={handleClose}
              >
                Finalizar
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WhatsAppModal;