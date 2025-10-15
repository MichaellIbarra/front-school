import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Row, Col } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SafetyOutlined } from '@ant-design/icons';
import passwordResetService from '../../services/auth/passwordResetService';

const { Title, Text, Paragraph } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('info');
  const [emailSent, setEmailSent] = useState(false);

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!email.trim()) {
      setAlertMessage('Por favor ingresa tu email o nombre de usuario.');
      setAlertType('warning');
      return;
    }

    setLoading(true);
    setAlertMessage(null);

    try {
      const result = await passwordResetService.requestPasswordReset(email.trim());
      
      if (result.success) {
        setEmailSent(true);
        setAlertMessage(result.message);
        setAlertType('success');
      } else {
        setAlertMessage(result.error || 'Error al enviar el enlace de restablecimiento.');
        setAlertType('error');
      }
    } catch (error) {
      setAlertMessage('Error de conexión. Por favor, intenta nuevamente más tarde.');
      setAlertType('error');
    } finally {
      setLoading(false);
    }
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
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Logo y título */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <SafetyOutlined style={{ fontSize: '48px', color: '#667eea', marginBottom: '16px' }} />
              <Title level={2} style={{ marginBottom: '8px', color: '#333' }}>
                ¿Olvidaste tu contraseña?
              </Title>
              <Text type="secondary">
                Valle Grande - Sistema de Gestión Educativa
              </Text>
            </div>

            {!emailSent ? (
              <>
                <Paragraph style={{ textAlign: 'center', marginBottom: '24px', color: '#666' }}>
                  Ingresa tu email o nombre de usuario y te enviaremos un enlace para restablecer tu contraseña.
                </Paragraph>

                {/* Alerta de estado */}
                {alertMessage && (
                  <Alert
                    message={alertMessage}
                    type={alertType}
                    showIcon
                    closable
                    onClose={() => setAlertMessage(null)}
                    style={{ marginBottom: '24px' }}
                  />
                )}

                {/* Formulario */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  disabled={loading}
                >
                  <Form.Item
                    label="Email o Usuario"
                    name="email"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu email o usuario' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="Ingresa tu email o nombre de usuario"
                      size="large"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontWeight: 600,
                        marginBottom: '16px'
                      }}
                    >
                      {loading ? 'Enviando enlace...' : 'Enviar enlace de restablecimiento'}
                    </Button>
                  </Form.Item>
                </Form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <MailOutlined style={{ fontSize: '72px', color: '#52c41a', marginBottom: '24px' }} />
                <Title level={3} style={{ color: '#52c41a', marginBottom: '16px' }}>
                  ¡Enlace Enviado!
                </Title>
                <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                  {alertMessage}
                </Paragraph>
                <Paragraph style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
                  Revisa también tu carpeta de spam o correo no deseado.
                </Paragraph>
              </div>
            )}

            {/* Enlace para volver al login */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />}
                onClick={() => window.location.href = '/school/login'}
                size="large"
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