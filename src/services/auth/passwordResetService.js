/**
 * Servicio para gestionar el reseteo de contraseñas
 * Consume los endpoints del microservicio vg-ms-user
 */

const RESET_URL = `${process.env.REACT_APP_DOMAIN}/api/v1/reset`;

class PasswordResetService {
  /**
   * Validar y resetear contraseña usando el token
   * POST /api/v1/reset/reset-password
   * @param {string} token - Token de reseteo recibido por email
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Resultado de la operación
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${RESET_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        }),
      });

      const data = await response.text(); // El backend devuelve String

      if (response.ok) {
        return {
          success: true,
          message: data || 'Contraseña actualizada exitosamente'
        };
      } else {
        return {
          success: false,
          error: data || 'Error al resetear la contraseña'
        };
      }
    } catch (error) {
      console.error('Error en resetPassword:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Solicitar reset de contraseña por email/username
   * POST /api/v1/reset/request-password-reset
   * @param {string} emailOrUsername - Email o username del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  async requestPasswordReset(emailOrUsername) {
    try {
      const response = await fetch(`${RESET_URL}/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername
        }),
      });

      const data = await response.text();

      if (response.ok) {
        return {
          success: true,
          message: data || 'Si el usuario existe, recibirás un enlace por email'
        };
      } else {
        return {
          success: false,
          error: data || 'Error al solicitar reset de contraseña'
        };
      }
    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Generar token de reseteo para un usuario
   * POST /api/v1/reset/generate-reset-token/{keycloakId}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Resultado de la operación
   */
  async generateResetToken(keycloakId) {
    try {
      const response = await fetch(`${RESET_URL}/generate-reset-token/${keycloakId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.text();

      if (response.ok) {
        return {
          success: true,
          message: data || 'Token generado y enviado por email'
        };
      } else {
        return {
          success: false,
          error: data || 'Error al generar token'
        };
      }
    } catch (error) {
      console.error('Error en generateResetToken:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Obtener el estado de la contraseña de un usuario
   * GET /api/v1/reset/password-status/{keycloakId}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Estado de la contraseña
   */
  async getPasswordStatus(keycloakId) {
    try {
      const response = await fetch(`${RESET_URL}/password-status/${keycloakId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          isTemporary: data.isTemporary,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error al obtener estado de contraseña'
        };
      }
    } catch (error) {
      console.error('Error en getPasswordStatus:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Forzar cambio de contraseña (usuario debe proporcionar contraseña actual)
   * POST /api/v1/reset/force-password-change
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Resultado de la operación
   */
  async forcePasswordChange(keycloakId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${RESET_URL}/force-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keycloakId: keycloakId,
          currentPassword: currentPassword,
          newPassword: newPassword
        }),
      });

      const data = await response.text();

      if (response.ok) {
        return {
          success: true,
          message: data || 'Contraseña cambiada exitosamente'
        };
      } else {
        return {
          success: false,
          error: data || 'Error al cambiar la contraseña'
        };
      }
    } catch (error) {
      console.error('Error en forcePasswordChange:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Validar requisitos de contraseña (cliente-side)
   * @param {string} password - Contraseña a validar
   * @returns {Object} Objeto con validaciones
   */
  validatePasswordRequirements(password) {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: 
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }
}

export default new PasswordResetService();
