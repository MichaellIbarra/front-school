import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Componente de Alerta Personalizada
 * Se integra con el hook useAlert para mostrar alertas consistentes en toda la aplicación
 */
const AlertModal = ({ 
  alert, 
  visible: propVisible, 
  title: propTitle, 
  message: propMessage, 
  type: propType, 
  showCancel: propShowCancel, 
  confirmText: propConfirmText, 
  cancelText: propCancelText,
  onConfirm, 
  onCancel 
}) => {
  
  // Soporte para ambas interfaces: objeto alert o propiedades directas
  const alertData = alert || {
    visible: propVisible,
    title: propTitle,
    message: propMessage,
    type: propType,
    showCancel: propShowCancel,
    confirmText: propConfirmText,
    cancelText: propCancelText
  };
  
  if (!alertData || !alertData.visible) return null;
  
  const {
    visible = false,
    title = 'Alerta',
    message = '',
    type = 'info',
    showCancel = true,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  } = alertData;
  
  // Configuración de iconos y colores según el tipo
  const getAlertConfig = (alertType) => {
    switch (alertType) {
      case 'success':
        return {
          icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />,
          confirmButtonType: 'primary'
        };
      case 'error':
        return {
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />,
          confirmButtonType: 'primary'
        };
      case 'warning':
        return {
          icon: <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '24px' }} />,
          confirmButtonType: 'primary'
        };
      case 'info':
      default:
        return {
          icon: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
          confirmButtonType: 'primary'
        };
    }
  };

  const config = getAlertConfig(type);

  return (
    <Modal
      open={visible}
      title={null}
      footer={null}
      closable={false}
      centered
      width={400}
      onCancel={onCancel}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* Icono */}
        <div style={{ marginBottom: '16px' }}>
          {config.icon}
        </div>
        
        {/* Título */}
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: '#262626'
        }}>
          {title}
        </h3>
        
        {/* Mensaje */}
        <p style={{ 
          fontSize: '14px', 
          color: '#595959', 
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {showCancel && (
            <Button 
              onClick={onCancel}
              style={{ minWidth: '80px' }}
            >
              {cancelText}
            </Button>
          )}
          <Button 
            type={config.confirmButtonType}
            onClick={onConfirm}
            style={{ minWidth: '80px' }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Validación de PropTypes
AlertModal.propTypes = {
  alert: PropTypes.shape({
    visible: PropTypes.bool,
    title: PropTypes.string,
    message: PropTypes.string,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    showCancel: PropTypes.bool,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string
  }),
  // Propiedades directas como alternativa
  visible: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  showCancel: PropTypes.bool,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func
};

// Valores por defecto
AlertModal.defaultProps = {
  alert: null,
  onConfirm: () => {},
  onCancel: () => {}
};

export default AlertModal;