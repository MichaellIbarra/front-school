import { useState } from 'react';

/**
 * Hook personalizado para manejo de alertas y confirmaciones
 * Proporciona una API similar a SweetAlert2 pero integrada con el sistema de la aplicación
 */
const useAlert = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    showCancel: true,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: null,
    onCancel: null,
    autoClose: false,
    autoCloseTime: 3000
  });

  /**
   * Muestra una alerta personalizada
   * @param {Object} options - Opciones de configuración de la alerta
   * @param {string} options.title - Título de la alerta
   * @param {string} options.message - Mensaje de la alerta
   * @param {string} options.type - Tipo de alerta: 'success', 'error', 'warning', 'info'
   * @param {boolean} options.showCancel - Si mostrar el botón cancelar (default: true)
   * @param {string} options.confirmText - Texto del botón confirmar (default: 'Aceptar')
   * @param {string} options.cancelText - Texto del botón cancelar (default: 'Cancelar')
   * @param {Function} options.onConfirm - Callback cuando se confirma
   * @param {Function} options.onCancel - Callback cuando se cancela
   * @param {boolean} options.autoClose - Si cerrar automáticamente (default: false)
   * @param {number} options.autoCloseTime - Tiempo para cerrar automáticamente en ms (default: 3000)
   */
  const showAlert = (options) => {
    const config = {
      visible: true,
      title: options.title || 'Alerta',
      message: options.message || '',
      type: options.type || 'info',
      showCancel: options.showCancel !== undefined ? options.showCancel : true,
      confirmText: options.confirmText || 'Aceptar',
      cancelText: options.cancelText || 'Cancelar',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      autoClose: options.autoClose || false,
      autoCloseTime: options.autoCloseTime || 3000
    };

    setAlertState(config);

    // Auto cerrar si está configurado
    if (config.autoClose) {
      setTimeout(() => {
        hideAlert();
        if (config.onConfirm) {
          config.onConfirm();
        }
      }, config.autoCloseTime);
    }
  };

  /**
   * Oculta la alerta actual
   */
  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      visible: false
    }));
  };

  /**
   * Maneja la confirmación de la alerta
   */
  const handleConfirm = () => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    hideAlert();
  };

  /**
   * Maneja la cancelación de la alerta
   */
  const handleCancel = () => {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    hideAlert();
  };

  /**
   * Shortcut para mostrar alerta de éxito
   */
  const showSuccess = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'success',
      showCancel: false,
      autoClose: false, // Cambiar a false para que el usuario tenga control
      ...options
    });
  };

  /**
   * Shortcut para mostrar alerta de error
   */
  const showError = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'error',
      showCancel: false,
      ...options
    });
  };

  /**
   * Shortcut para mostrar alerta de advertencia
   */
  const showWarning = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'warning',
      ...options
    });
  };

  /**
   * Shortcut para mostrar confirmación
   */
  const showConfirm = (title, message, onConfirm, options = {}) => {
    showAlert({
      title,
      message,
      type: 'warning',
      onConfirm,
      ...options
    });
  };

  return {
    // Estado de la alerta
    alertState,
    
    // Funciones principales
    showAlert,
    hideAlert,
    handleConfirm,
    handleCancel,
    
    // Shortcuts
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};

export default useAlert;