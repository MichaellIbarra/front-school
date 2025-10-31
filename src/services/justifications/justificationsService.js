import { refreshTokenKeycloak, getUserInfo } from '../auth/authService';

class JustificationsService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/justifications`;
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
    
    // Obtener información del usuario desde el token JWT
    const userInfo = getUserInfo();
    
    // Construir headers base
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Agregar headers personalizados si están disponibles en el token
    if (userInfo) {
      if (userInfo.sub) {
        headers['X-User-Id'] = userInfo.sub; // UUID del usuario
      }
      if (userInfo.roles && userInfo.roles.length > 0) {
        // Enviar el primer rol educativo (auxiliary, teacher, director, etc.)
        headers['X-User-Roles'] = userInfo.roles[0];
      }
      if (userInfo.institutionId) {
        headers['X-Institution-Id'] = userInfo.institutionId;
      }
    }
    
    // DEBUG: Verificar headers finales
    console.log('🔍 DEBUG - Headers finales:', headers);
    console.log('🔍 DEBUG - UserInfo:', userInfo);
    
    return headers;
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
          console.log('✅ Token refrescado exitosamente');
          throw new Error('TOKEN_REFRESHED');
        } else {
          console.log('❌ Error en refresh del token:', refreshResult.error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          throw new Error('Sesión expirada. Redirigiendo al login...');
        }
      } else {
        console.log('❌ No hay refresh token disponible');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        throw new Error('Sesión expirada. Redirigiendo al login...');
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return {};
    }

    try {
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        console.error('🚨 Error del backend:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          fullData: data,
          url: response.url
        });
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        throw error;
      }
      
      if (!response.ok) {
        const statusMessage = `Error del servidor (${response.status}): ${error.message || 'Respuesta no válida'}`;
        console.error('🚨 Error de respuesta:', statusMessage);
        throw new Error(statusMessage);
      }
      
      console.error('Error parsing JSON response:', error);
      return {};
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

  // ==========================================
  // MÉTODOS PARA JUSTIFICACIONES
  // ==========================================

  /**
   * Crea una nueva justificación
   * POST /api/v1/justifications/auxiliary/create
   */
  async createJustification(payload) {
    try {
      // DEBUG: Log de payload y headers
      console.log('🔍 DEBUG SERVICE - Payload:', payload);
      console.log('🔍 DEBUG SERVICE - URL:', `${this.baseURL}/auxiliary/create`);
      console.log('🔍 DEBUG SERVICE - Headers:', this.getAuthHeaders());

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/create`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        console.log('🔍 DEBUG SERVICE - Response status:', response.status);
        console.log('🔍 DEBUG SERVICE - Response headers:', Object.fromEntries(response.headers.entries()));

        // Si es error 500, intentar leer el body para ver el error del servidor
        if (response.status === 500) {
          const errorText = await response.text();
          console.error('🔍 DEBUG SERVICE - Error 500 body:', errorText);
          throw new Error(`Error del servidor (500): ${errorText || 'Sin detalles'}`);
        }

        const result = await this.handleResponse(response);
        
        console.log('🔍 DEBUG SERVICE - Result:', result);
        return {
          success: true,
          message: result.message || 'Justificación creada exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      console.error('🔍 DEBUG SERVICE - Error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la justificación',
        data: null
      };
    }
  }

  /**
   * Obtiene justificaciones por registro de asistencia
   * GET /api/v1/justifications/auxiliary/by-attendance-record/{attendanceRecordId}
   */
  async getJustificationsByAttendanceRecord(attendanceRecordId) {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/by-attendance-record/${attendanceRecordId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        const justifications = Array.isArray(result) ? result : (result.data || []);
        
        return {
          success: true,
          message: 'Justificaciones cargadas exitosamente',
          data: justifications
        };
      });

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al cargar las justificaciones',
        data: []
      };
    }
  }

  /**
   * Obtiene justificaciones pendientes
   * GET /api/v1/justifications/auxiliary/pending
   */
  async getPendingJustifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/pending`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        const justifications = Array.isArray(result) ? result : (result.data || []);
        
        return {
          success: true,
          message: 'Justificaciones pendientes cargadas exitosamente',
          data: justifications
        };
      });

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al cargar las justificaciones pendientes',
        data: []
      };
    }
  }

  /**
   * Obtiene todas las justificaciones de la institución
   * GET /api/v1/justifications/auxiliary/all
   */
  async getAllJustifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/all`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        const justifications = Array.isArray(result) ? result : (result.data || []);
        
        return {
          success: true,
          message: 'Todas las justificaciones cargadas exitosamente',
          data: justifications
        };
      });

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al cargar todas las justificaciones',
        data: []
      };
    }
  }

  /**
   * Revisa una justificación (aprobar o rechazar)
   * PUT /api/v1/justifications/director/review/{justificationId}
   * NOTA: Este endpoint debe ser implementado en el backend
   */
  async reviewJustification(justificationId, status, comments = '') {
    try {
      const payload = {
        status,
        reviewComments: comments
      };

      return await this.executeWithRetry(async () => {
        // IMPORTANTE: Verifica que este endpoint exista en tu backend
        // Según el Postman solo hay endpoints /auxiliary/*
        // Puede que necesites usar un endpoint diferente o crearlo en el backend
        const response = await fetch(`${this.baseURL}/director/review/${justificationId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Justificación revisada exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      // Si el endpoint no existe (404), mostrar mensaje específico
      if (error.message.includes('404')) {
        return {
          success: false,
          error: 'Endpoint de revisión no disponible. Contacta al administrador del sistema.',
          data: null
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al revisar la justificación',
        data: null
      };
    }
  }
}

export default new JustificationsService();
