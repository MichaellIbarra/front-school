import { Notification, validateNotification } from '../../types/grades/notification';
import { refreshTokenKeycloak } from '../auth/authService';

class NotificationService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/notifications`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Maneja las respuestas de la API con refresh automático de token
   */
  async handleResponse(response) {
    // Si es 401 (No autorizado), intentar refresh del token
    if (response.status === 401) {
      console.log('🔄 Token expirado (401), intentando refresh automático...');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        const refreshResult = await refreshTokenKeycloak(refreshToken);
        if (refreshResult.success) {
          console.log('✅ Token refrescado correctamente, reintentando petición...');
          throw new Error('TOKEN_REFRESHED'); // Señal especial para reintentar
        } else {
          console.log('❌ Error al refrescar token:', refreshResult.error);
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          console.log('🚪 Redirigiendo al login...');
          // Redirigir al login
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          throw new Error('Sesión expirada. Redirigiendo al login...');
        }
      } else {
        console.log('❌ No hay refresh token disponible');
        // No hay refresh token, redirigir al login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        throw new Error('Sesión expirada. Redirigiendo al login...');
      }
    }

    // Verificar si la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return {}; // Respuesta vacía pero exitosa
    }

    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        throw error; // Re-lanzar la señal especial
      }
      
      // Error de parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.error('Error parsing JSON response:', error);
      return {}; // Respuesta vacía en caso de error de parsing
    }
  }

  /**
   * Ejecuta una petición con retry automático en caso de refresh de token
   */
  async executeWithRetry(requestFunction, maxRetries = 1) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        return await requestFunction();
      } catch (error) {
        if (error.message === 'TOKEN_REFRESHED' && retries < maxRetries) {
          console.log('🔄 Reintentando petición con nuevo token...');
          retries++;
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Obtiene todas las notificaciones
   * GET /api/v1/notifications
   */
  async getAllNotifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Notificaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las notificaciones',
        data: []
      };
    }
  }

  /**
   * Obtiene una notificación por ID
   * GET /api/v1/notifications/{id}
   */
  async getNotificationById(id) {
    try {
      if (!id) {
        throw new Error('ID de notificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result || null,
          message: 'Notificación encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener notificación:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la notificación',
        data: null
      };
    }
  }

  /**
   * Crea una nueva notificación
   * POST /api/v1/notifications
   */
  async createNotification(notificationData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateNotification(notificationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de notificación inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        recipientId: notificationData.recipientId,
        recipientType: notificationData.recipientType || '',
        message: notificationData.message,
        notificationType: notificationData.notificationType || 'General',
        status: notificationData.status || 'Pendiente',
        channel: notificationData.channel || 'Correo'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result || null,
          message: 'Notificación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la notificación'
      };
    }
  }

  /**
   * Actualiza una notificación existente
   * PUT /api/v1/notifications/{id}
   */
  async updateNotification(id, notificationData) {
    try {
      if (!id) {
        throw new Error('ID de notificación requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateNotification(notificationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de notificación inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        recipientId: notificationData.recipientId,
        recipientType: notificationData.recipientType,
        message: notificationData.message,
        notificationType: notificationData.notificationType,
        status: notificationData.status,
        channel: notificationData.channel
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result || null,
          message: 'Notificación actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la notificación'
      };
    }
  }

  /**
   * Elimina una notificación (eliminación lógica)
   * DELETE /api/v1/notifications/{id}
   */
  async deleteNotification(id) {
    try {
      if (!id) {
        throw new Error('ID de notificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result || null,
          message: 'Notificación eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la notificación'
      };
    }
  }

  /**
   * Restaura una notificación eliminada
   * PUT /api/v1/notifications/{id}/restore
   */
  async restoreNotification(id) {
    try {
      if (!id) {
        throw new Error('ID de notificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/restore`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result || null,
          message: 'Notificación restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar notificación:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la notificación'
      };
    }
  }

  /**
   * Obtiene notificaciones por destinatario
   */
  async getNotificationsByRecipient(recipientId) {
    try {
      if (!recipientId) {
        throw new Error('ID de destinatario requerido');
      }

      // Obtener todas las notificaciones y filtrar en el frontend
      // TODO: Implementar filtro en el backend para mejor performance
      const result = await this.getAllNotifications();
      
      if (!result.success) {
        return result;
      }

      const filteredData = result.data.filter(notification => 
        notification.recipientId === recipientId
      );

      return {
        success: true,
        data: filteredData,
        message: 'Notificaciones del destinatario obtenidas exitosamente'
      };
    } catch (error) {
      console.error('Error al obtener notificaciones del destinatario:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las notificaciones del destinatario',
        data: []
      };
    }
  }

  /**
   * Obtiene notificaciones por tipo
   */
  async getNotificationsByType(notificationType) {
    try {
      if (!notificationType) {
        throw new Error('Tipo de notificación requerido');
      }

      // Obtener todas las notificaciones y filtrar en el frontend
      // TODO: Implementar filtro en el backend para mejor performance
      const result = await this.getAllNotifications();
      
      if (!result.success) {
        return result;
      }

      const filteredData = result.data.filter(notification => 
        notification.notificationType === notificationType
      );

      return {
        success: true,
        data: filteredData,
        message: 'Notificaciones por tipo obtenidas exitosamente'
      };
    } catch (error) {
      console.error('Error al obtener notificaciones por tipo:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las notificaciones por tipo',
        data: []
      };
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id) {
    try {
      // Primero obtener la notificación actual
      const notificationResult = await this.getNotificationById(id);
      
      if (!notificationResult.success) {
        return notificationResult;
      }

      const notification = notificationResult.data;
      
      // Actualizar solo el estado a 'Leído'
      return await this.updateNotification(id, {
        ...notification,
        status: 'Leído'
      });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return {
        success: false,
        error: error.message || 'Error al marcar la notificación como leída'
      };
    }
  }

  /**
   * Marca una notificación como enviada
   */
  async markAsSent(id) {
    try {
      // Primero obtener la notificación actual
      const notificationResult = await this.getNotificationById(id);
      
      if (!notificationResult.success) {
        return notificationResult;
      }

      const notification = notificationResult.data;
      
      // Actualizar el estado a 'Enviado'
      return await this.updateNotification(id, {
        ...notification,
        status: 'Enviado'
      });
    } catch (error) {
      console.error('Error al marcar notificación como enviada:', error);
      return {
        success: false,
        error: error.message || 'Error al marcar la notificación como enviada'
      };
    }
  }

  /**
   * Crea una nueva notificación con valores por defecto
   */
  createNewNotification() {
    return {
      ...Notification
    };
  }
}

export default new NotificationService();