import { FutApproval, validateFutApproval } from '../../types/fut/futApproval.model';
import { refreshTokenKeycloak } from '../auth/authService';

class FutApprovalService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/futapprovals`;
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
   * Crear aprobación
   * POST /api/v1/futapprovals
   */
  async createApproval(approvalData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateFutApproval(approvalData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de aprobación inválidos',
          validationErrors: validation.errors
        };
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(approvalData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Aprobación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear aprobación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la aprobación'
      };
    }
  }

  /**
   * Obtener aprobación por ID
   * GET /api/v1/futapprovals/{id}
   */
  async getApprovalById(id) {
    try {
      if (!id) {
        throw new Error('ID de aprobación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Aprobación encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener aprobación:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la aprobación',
        data: null
      };
    }
  }

  /**
   * Obtener todas las aprobaciones
   * GET /api/v1/futapprovals
   */
  async getAllApprovals() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : [],
          message: 'Aprobaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener aprobaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las aprobaciones',
        data: []
      };
    }
  }

  /**
   * Actualizar revisión de aprobación
   * PUT /api/v1/futapprovals/{id}/review
   */
  async reviewApproval(id, approvalData) {
    try {
      if (!id) {
        throw new Error('ID de aprobación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/review`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(approvalData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Revisión actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al revisar aprobación:', error);
      return {
        success: false,
        error: error.message || 'Error al revisar la aprobación'
      };
    }
  }

  /**
   * Registrar entrega de aprobación
   * POST /api/v1/futapprovals/{id}/deliver
   */
  async deliverApproval(id, approvalData) {
    try {
      if (!id) {
        throw new Error('ID de aprobación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/deliver`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(approvalData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Entrega registrada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la entrega'
      };
    }
  }

  /**
   * Buscar aprobaciones por FUT Request ID
   * GET /api/v1/futapprovals/by-enrollment/{futRequestId}
   */
  async getApprovalsByFutRequestId(futRequestId) {
    try {
      if (!futRequestId) {
        throw new Error('ID de solicitud FUT requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/by-enrollment/${futRequestId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : [],
          message: 'Aprobaciones encontradas'
        };
      });
    } catch (error) {
      console.error('Error al obtener aprobaciones por FUT Request ID:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las aprobaciones',
        data: []
      };
    }
  }

  /**
   * Eliminar aprobación
   * DELETE /api/v1/futapprovals/{id}
   */
  async deleteApproval(id) {
    try {
      if (!id) {
        throw new Error('ID de aprobación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Aprobación eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar aprobación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la aprobación'
      };
    }
  }

  /**
   * Crea una nueva aprobación con valores por defecto
   */
  createNewApproval(futRequestId) {
    return {
      ...FutApproval,
      futRequestId,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Aprueba una solicitud FUT
   */
  async approveFutRequest(id, reviewData) {
    const approvalData = {
      ...reviewData,
      decision: 'A', // Aprobado
      reviewDate: new Date().toISOString()
    };
    
    return await this.reviewApproval(id, approvalData);
  }

  /**
   * Rechaza una solicitud FUT
   */
  async rejectFutRequest(id, reviewData) {
    const approvalData = {
      ...reviewData,
      decision: 'R', // Rechazado
      reviewDate: new Date().toISOString()
    };
    
    return await this.reviewApproval(id, approvalData);
  }

  /**
   * Marca como entregado por recojo
   */
  async markAsPickedUp(id, deliveryData) {
    const approvalData = {
      ...deliveryData,
      deliveryMethod: 'P', // Pickup
      deliveredAt: new Date().toISOString()
    };
    
    return await this.deliverApproval(id, approvalData);
  }

  /**
   * Marca como entregado por email
   */
  async markAsEmailDelivered(id, deliveryData) {
    const approvalData = {
      ...deliveryData,
      deliveryMethod: 'E', // Email
      deliveredAt: new Date().toISOString()
    };
    
    return await this.deliverApproval(id, approvalData);
  }
}

export default new FutApprovalService();