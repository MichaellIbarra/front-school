import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Row, Col, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SafetyOutlined } from '@ant-design/icons';
import passwordResetService from '../../services/auth/passwordResetService';

const { Title, Text, Paragraph } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  /**
   * Maneja el envío del formulario
   */
  const handleFormSubmit = async (formValues) => {
    const { email } = formValues;
    
    console.log('📧 Procesando solicitud de reset para:', email);
    
    setLoading(true);
    setAlertInfo(null);
    
    try {
      // Llamar al servicio para solicitar el reset
      const response = await passwordResetService.requestPasswordReset(email);
      
      if (response.success) {
        console.log('✅ Solicitud procesada exitosamente');
        
        // Mostrar pantalla de éxito
        setEmailSent(true);
        setAlertInfo({
          type: 'success',
          message: response.message || 'Si el usuario existe, recibirás un enlace para restablecer tu contraseña.'
        });
        
        // Mostrar mensaje de éxito global
        message.success('Enlace de restablecimiento enviado');
        
        // Limpiar el formulario
        form.resetFields();
        
      } else {
        console.error('❌ Error en la solicitud:', response.error);
        
        setAlertInfo({
          type: 'error',
          message: response.error || 'Error al procesar la solicitud. Intenta nuevamente.'
        });
        
        message.error('Error al enviar el enlace de restablecimiento');
      }
      
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      
      setAlertInfo({
        type: 'error',
        message: 'Error de conexión con el servidor. Verifica tu conexión a internet e intenta nuevamente.'
      });
      
      message.error('Error de conexión');
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja errores de validación del formulario
   */
  const handleFormError = (errorInfo) => {
    console.warn('⚠️ Errores de validación en el formulario:', errorInfo);
    
    setAlertInfo({
      type: 'warning',
      message: 'Por favor, corrige los errores en el formulario antes de continuar.'
    });
    
    message.warning('Completa todos los campos requeridos');
  };

  /**
   * Reinicia el formulario para enviar otro email
   */
  const handleSendAnother = () => {
    setEmailSent(false);
    setAlertInfo(null);
    form.resetFields();
  };

  /**
   * Navega de vuelta al login
   */
  const handleBackToLogin = () => {
    window.location.href = '/school/login';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '500px' }}>
        <Col xs={24}>
          <Card
            style={{
              borderRadius: '15px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Header del formulario */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <SafetyOutlined 
                style={{ 
                  fontSize: '48px', 
                  color: '#667eea', 
                  marginBottom: '16px',
                  display: 'block'
                }} 
              />
              <Title level={2} style={{ marginBottom: '8px', color: '#333' }}>
                ¿Olvidaste tu contraseña?
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Valle Grande - Sistema de Gestión Educativa
              </Text>
            </div>

            {/* Contenido principal */}
            {!emailSent ? (
              <div>
                {/* Instrucciones */}
                <Paragraph 
                  style={{ 
                    textAlign: 'center', 
                    marginBottom: '24px', 
                    color: '#666',
                    fontSize: '15px',
                    lineHeight: '1.5'
                  }}
                >
                  Ingresa tu email o nombre de usuario y te enviaremos un enlace 
                  para restablecer tu contraseña de forma segura.
                </Paragraph>

                {/* Alerta informativa */}
                {alertInfo && (
                  <Alert
                    message={alertInfo.message}
                    type={alertInfo.type}
                    showIcon
                    closable
                    onClose={() => setAlertInfo(null)}
                    style={{ marginBottom: '24px' }}
                  />
                )}

                {/* Formulario principal */}
                <Form
                  form={form}
                  name="passwordResetForm"
                  layout="vertical"
                  onFinish={handleFormSubmit}
                  onFinishFailed={handleFormError}
                  autoComplete="off"
                  disabled={loading}
                >
                  {/* Campo de email/usuario */}
                  <Form.Item
                    label="Email o Usuario"
                    name="email"
                    rules={[
                      { 
                        required: true, 
                        message: 'Este campo es obligatorio' 
                      },
                      {
                        min: 3,
                        message: 'Debe tener al menos 3 caracteres'
                      },
                      {
                        max: 100,
                        message: 'No puede tener más de 100 caracteres'
                      }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#667eea' }} />}
                      placeholder="Ingresa tu email o nombre de usuario"
                      size="large"
                      disabled={loading}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d9d9d9'
                      }}
                    />
                  </Form.Item>

                  {/* Botón de envío */}
                  <Form.Item style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        height: '48px',
                        fontSize: '16px'
                      }}
                    >
                      {loading ? 'Enviando enlace...' : 'Enviar enlace de restablecimiento'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              /* Pantalla de confirmación */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <MailOutlined 
                  style={{ 
                    fontSize: '72px', 
                    color: '#52c41a', 
                    marginBottom: '24px',
                    display: 'block'
                  }} 
                />
                
                <Title level={3} style={{ color: '#52c41a', marginBottom: '16px' }}>
                  ¡Enlace Enviado!
                </Title>
                
                <Paragraph style={{ 
                  fontSize: '16px', 
                  marginBottom: '16px',
                  color: '#333'
                }}>
                  {alertInfo?.message || 'Si el usuario existe, recibirás un enlace por email'}
                </Paragraph>
                
                <Paragraph style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  marginBottom: '24px',
                  lineHeight: '1.5'
                }}>
                  Revisa tu bandeja de entrada y también la carpeta de spam o correo no deseado.
                  El enlace será válido por un tiempo limitado.
                </Paragraph>

                {/* Botón para enviar otro email */}
                <Button
                  type="default"
                  onClick={handleSendAnother}
                  style={{
                    marginBottom: '12px',
                    borderRadius: '6px'
                  }}
                >
                  Enviar a otro email
                </Button>
              </div>
            )}

            {/* Footer con enlace de vuelta */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToLogin}
                size="large"
                style={{
                  color: '#667eea',
                  fontSize: '14px',
                  padding: '4px 8px'
                }}
              >
                Volver al Login
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;