import { refreshTokenKeycloak } from '../auth/authService';

class PeriodService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/academics/periods`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   * Incluye los headers requeridos por PeriodRest.java (Headers HTTP v5.0)
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    const userId = localStorage.getItem('user_id');
    const userRoles = localStorage.getItem('user_roles');
    
    // Obtener institutionId del objeto institution guardado en localStorage
    let institutionId = null;
    const institutionData = localStorage.getItem('institution');
    if (institutionData) {
      try {
        const institution = JSON.parse(institutionData);
        institutionId = institution?.id || institution?.institutionId;
      } catch (parseError) {
        console.error('Error al parsear datos de institución:', parseError);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Headers requeridos según PeriodRest.java (SECRETARY endpoints)
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (userRoles) {
      headers['X-User-Roles'] = userRoles;
    }
    // Para endpoints SECRETARY, X-Institution-Id es OBLIGATORIO
    if (institutionId) {
      headers['X-Institution-Id'] = institutionId;
    }

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
          console.log('✅ Token refrescado correctamente, reintentando petición...');
          throw new Error('TOKEN_REFRESHED'); // Señal especial para reintentar
        } else {
          console.log('❌ Error al refrescar token:', refreshResult.error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          console.log('🚪 Redirigiendo al login...');
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
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('🚨 Error del backend:', {
          status: response.status,
          message: errorMessage,
          data: data
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

  /**
   * Crear un nuevo período académico
   * POST /create
   */
  async createPeriod(periodData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Creando período académico:', periodData);
        
        const fullURL = `${this.baseURL}/create`;
        
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(periodData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Período académico creado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al crear período académico:', error);
      return {
        success: false,
        error: error.message || 'Error al crear período académico'
      };
    }
  }

  /**
   * Obtener todos los períodos de la institución
   * GET /secretary/periods
   */
  async getAllPeriods() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todos los períodos académicos');
        const fullURL = `${this.baseURL}/secretary/periods`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Períodos académicos obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener períodos académicos:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener períodos académicos',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener períodos por nivel
   * GET /secretary/periods/level/{level}
   */
  async getPeriodsByLevel(level) {
    try {
      if (!level) {
        throw new Error('Nivel requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo períodos por nivel:', level);
        const fullURL = `${this.baseURL}/secretary/periods/level/${level}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Períodos académicos obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener períodos por nivel:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener períodos por nivel',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Actualizar un período académico
   * PUT /{id}
   */
  async updatePeriod(id, periodData) {
    try {
      if (!id) {
        throw new Error('ID de período requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando período académico:', { id, periodData });
        
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(periodData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Período académico actualizado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar período académico:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar período académico'
      };
    }
  }

  /**
   * Eliminar (desactivar) un período académico
   * DELETE /{id}
   */
  async deletePeriod(id) {
    try {
      if (!id) {
        throw new Error('ID de período requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando período académico:', id);
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Período académico eliminado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar período académico:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar período académico'
      };
    }
  }

  /**
   * Validar disponibilidad de período
   * GET /validate-period
   */
  async validatePeriod(level, period, academicYear) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🔍 Validando disponibilidad de período');
        const params = new URLSearchParams({
          level,
          period,
          academicYear
        });
        const fullURL = `${this.baseURL}/validate-period?${params}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          available: result.available,
          message: result.message
        };
      });
    } catch (error) {
      console.error('❌ Error al validar período:', error);
      return {
        success: false,
        error: error.message || 'Error al validar período'
      };
    }
  }
}

// Exportar instancia única del servicio
const periodService = new PeriodService();
export default periodService;
export { periodService };
