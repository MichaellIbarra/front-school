/**
 * Servicio para gestionar el reseteo de contraseñas
 * Consume los endpoints del microservicio vg-ms-user
 */

class PasswordResetService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/reset`;
  }

  /**
   * Obtiene los headers básicos para las peticiones
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Maneja las respuestas de la API
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    try {
      // Si la respuesta contiene JSON, parsearlo
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          return {
            success: false,
            error: data.message || data.error || `Error ${response.status}: ${response.statusText}`
          };
        }
        
        return {
          success: true,
          data: data
        };
      } else {
        // Si la respuesta es texto plano
        const text = await response.text();
        
        if (!response.ok) {
          return {
            success: false,
            error: text || `Error ${response.status}: ${response.statusText}`
          };
        }
        
        return {
          success: true,
          message: text
        };
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      
      if (!response.ok) {
        return {
          success: false,
          error: `Error ${response.status}: ${response.statusText}`
        };
      }
      
      return {
        success: true,
        message: 'Operación completada exitosamente'
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
      console.log('🔄 Enviando solicitud de reset de contraseña para:', emailOrUsername);
      
      const response = await fetch(`${this.baseURL}/request-password-reset`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          emailOrUsername: emailOrUsername
        })
      });

      const result = await this.handleResponse(response);
      
      if (result.success) {
        console.log('✅ Solicitud de reset enviada exitosamente');
        return {
          success: true,
          message: result.message || result.data || 'Si el usuario existe, recibirás un enlace por email'
        };
      } else {
        console.error('❌ Error en solicitud de reset:', result.error);
        return {
          success: false,
          error: result.error || 'Error al solicitar reset de contraseña'
        };
      }
    } catch (error) {
      console.error('💥 Error de conexión en requestPasswordReset:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Validar y resetear contraseña usando el token
   * POST /api/v1/reset/reset-password
   * @param {string} token - Token de reseteo recibido por email
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Resultado de la operación
   */
  async resetPassword(token, newPassword) {
    try {
      console.log('🔄 Reseteando contraseña con token:', token);
      console.log('📤 URL:', `${this.baseURL}/reset-password`);
      console.log('📤 Body:', JSON.stringify({ token, newPassword: '***' }));
      
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      console.log('📥 Response Status:', response.status, response.statusText);
      console.log('📥 Response Headers:', Array.from(response.headers.entries()));

      const result = await this.handleResponse(response);
      
      console.log('📥 Result procesado:', result);
      
      if (result.success) {
        console.log('✅ Contraseña reseteada exitosamente');
        return {
          success: true,
          message: result.message || result.data || 'Contraseña actualizada exitosamente'
        };
      } else {
        console.error('❌ Error al resetear contraseña:', result.error);
        return {
          success: false,
          error: result.error || 'Error al resetear la contraseña'
        };
      }
    } catch (error) {
      console.error('💥 Error de conexión en resetPassword:', error);
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
      console.log('🔄 Generando token de reset para usuario:', keycloakId);
      
      const response = await fetch(`${this.baseURL}/generate-reset-token/${keycloakId}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const result = await this.handleResponse(response);
      
      if (result.success) {
        console.log('✅ Token generado exitosamente');
        return {
          success: true,
          message: result.message || result.data || 'Token generado y enviado por email'
        };
      } else {
        console.error('❌ Error al generar token:', result.error);
        return {
          success: false,
          error: result.error || 'Error al generar token'
        };
      }
    } catch (error) {
      console.error('💥 Error de conexión en generateResetToken:', error);
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
      console.log('🔄 Obteniendo estado de contraseña para usuario:', keycloakId);
      
      const response = await fetch(`${this.baseURL}/password-status/${keycloakId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await this.handleResponse(response);
      
      if (result.success) {
        console.log('✅ Estado de contraseña obtenido exitosamente');
        return {
          success: true,
          isTemporary: result.data.isTemporary,
          message: result.data.message
        };
      } else {
        console.error('❌ Error al obtener estado de contraseña:', result.error);
        return {
          success: false,
          error: result.error || 'Error al obtener estado de contraseña'
        };
      }
    } catch (error) {
      console.error('💥 Error de conexión en getPasswordStatus:', error);
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
      console.log('🔄 Forzando cambio de contraseña para usuario:', keycloakId);
      
      const response = await fetch(`${this.baseURL}/force-password-change`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          keycloakId: keycloakId,
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const result = await this.handleResponse(response);
      
      if (result.success) {
        console.log('✅ Contraseña cambiada exitosamente');
        return {
          success: true,
          message: result.message || result.data || 'Contraseña cambiada exitosamente'
        };
      } else {
        console.error('❌ Error al cambiar contraseña:', result.error);
        return {
          success: false,
          error: result.error || 'Error al cambiar la contraseña'
        };
      }
    } catch (error) {
      console.error('💥 Error de conexión en forcePasswordChange:', error);
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

// Exportar instancia única del servicio
const passwordResetService = new PasswordResetService();
export default passwordResetService;
