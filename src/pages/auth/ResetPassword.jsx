import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, Alert, Progress, Space, Typography, Row, Col } from 'antd';
import { LockOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import passwordResetService from '../../services/auth/passwordResetService';

const { Title, Text, Paragraph } = Typography;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isValid: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('info');
  const [success, setSuccess] = useState(false);

  // Obtener token de la URL al montar el componente
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setAlertMessage('Token de reseteo no encontrado. Por favor, solicita un nuevo enlace de reseteo.');
      setAlertType('error');
    }
  }, [searchParams]);

  // Validar contraseña en tiempo real
  useEffect(() => {
    if (newPassword) {
      const validation = passwordResetService.validatePasswordRequirements(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        isValid: false
      });
    }
  }, [newPassword]);

  // Validar que las contraseñas coincidan
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [newPassword, confirmPassword]);

  // Calcular progreso de fortaleza de contraseña
  const getPasswordStrength = () => {
    let strength = 0;
    if (passwordValidation.minLength) strength += 20;
    if (passwordValidation.hasUppercase) strength += 20;
    if (passwordValidation.hasLowercase) strength += 20;
    if (passwordValidation.hasNumber) strength += 20;
    if (passwordValidation.hasSpecialChar) strength += 20;
    return strength;
  };

  const getPasswordStrengthStatus = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'exception';
    if (strength < 80) return 'normal';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength === 0) return '';
    if (strength < 40) return 'Débil';
    if (strength < 80) return 'Media';
    return 'Fuerte';
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!token) {
      setAlertMessage('Token no válido. Por favor, solicita un nuevo enlace de reseteo.');
      setAlertType('error');
      return;
    }

    if (!passwordValidation.isValid) {
      setAlertMessage('La contraseña no cumple con todos los requisitos de seguridad.');
      setAlertType('warning');
      return;
    }

    if (!passwordsMatch) {
      setAlertMessage('Las contraseñas no coinciden.');
      setAlertType('warning');
      return;
    }

    setLoading(true);
    setAlertMessage(null);

    try {
      const result = await passwordResetService.resetPassword(token, newPassword);

      if (result.success) {
        setSuccess(true);
        setAlertMessage('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
        setAlertType('success');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setAlertMessage(result.error || 'Error al actualizar la contraseña. Por favor, intenta nuevamente.');
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
                Cambiar Contraseña
              </Title>
              <Text type="secondary">
                Valle Grande - Sistema de Gestión Educativa
              </Text>
            </div>

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
            {!success && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={!token || loading}
              >
                {/* Nueva contraseña */}
                <Form.Item
                  label="Nueva Contraseña"
                  name="newPassword"
                  rules={[
                    { required: true, message: 'Por favor ingresa tu nueva contraseña' },
                    {
                      validator: (_, value) => {
                        if (!value || passwordValidation.isValid) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('La contraseña no cumple con los requisitos'));
                      }
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Ingresa tu nueva contraseña"
                    size="large"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Form.Item>

                {/* Barra de fortaleza de contraseña */}
                {newPassword && (
                  <div style={{ marginBottom: '24px' }}>
                    <Progress
                      percent={getPasswordStrength()}
                      status={getPasswordStrengthStatus()}
                      format={() => getPasswordStrengthText()}
                      strokeColor={{
                        '0%': '#ff4d4f',
                        '50%': '#faad14',
                        '100%': '#52c41a'
                      }}
                    />
                  </div>
                )}

                {/* Confirmar contraseña */}
                <Form.Item
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  rules={[
                    { required: true, message: 'Por favor confirma tu contraseña' },
                    {
                      validator: (_, value) => {
                        if (!value || passwordsMatch) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Las contraseñas no coinciden'));
                      }
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirma tu nueva contraseña"
                    size="large"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Form.Item>

                {/* Requisitos de contraseña */}
                <Card
                  size="small"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderLeft: '4px solid #667eea',
                    marginBottom: '24px'
                  }}
                >
                  <Paragraph strong style={{ marginBottom: '12px', fontSize: '14px' }}>
                    Requisitos de Contraseña:
                  </Paragraph>
                  <Space direction="vertical" size="small">
                    <Text style={{ fontSize: '13px' }}>
                      {passwordValidation.minLength ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      Mínimo 8 caracteres
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                      {passwordValidation.hasUppercase ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      Al menos una letra mayúscula
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                      {passwordValidation.hasLowercase ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      Al menos una letra minúscula
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                      {passwordValidation.hasNumber ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      Al menos un número
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                      {passwordValidation.hasSpecialChar ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      Al menos un carácter especial (!@#$%^&*...)
                    </Text>
                  </Space>
                </Card>

                {/* Botón de envío */}
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    disabled={!token || !passwordValidation.isValid || !passwordsMatch}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Actualizando contraseña...' : 'Cambiar Contraseña'}
                  </Button>
                </Form.Item>

                {/* Enlace para volver al login */}
                <div style={{ textAlign: 'center' }}>
                  <Button type="link" onClick={() => navigate('/login')}>
                    Volver al Login
                  </Button>
                </div>
              </Form>
            )}

            {/* Mensaje de éxito */}
            {success && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircleOutlined style={{ fontSize: '72px', color: '#52c41a', marginBottom: '24px' }} />
                <Title level={3} style={{ color: '#52c41a', marginBottom: '16px' }}>
                  ¡Contraseña Actualizada!
                </Title>
                <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                  Tu contraseña ha sido actualizada exitosamente.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Ir al Login
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResetPassword;
