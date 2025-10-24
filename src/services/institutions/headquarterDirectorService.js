import { refreshTokenKeycloak } from '../auth/authService';

class HeadquarterDirectorService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/headquarters/director`;
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
          console.log('✅ Token refrescado exitosamente');
          // Lanzar señal especial para reintentar la petición
          throw new Error('TOKEN_REFRESHED');
        } else {
          console.log('❌ Error en refresh del token:', refreshResult.error);
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          
          // Redirigir al login después de un breve delay
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
        // Extraer mensaje de error más específico del backend
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
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
        throw error; // Re-lanzar la señal especial
      }
      
      // Error de parsing JSON
      if (!response.ok) {
        const statusMessage = `Error del servidor (${response.status}): ${error.message || 'Respuesta no válida'}`;
        console.error('🚨 Error de respuesta:', statusMessage);
        throw new Error(statusMessage);
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
   * Crea una nueva sede en la institución del director
   * POST /api/v1/headquarters/director/create
   */
  async createHeadquarter(headquarterData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Creando sede:', this.baseURL + '/create');
        console.log('📦 Datos de sede:', headquarterData);
        
        const response = await fetch(this.baseURL + '/create', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(headquarterData)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarter || null,
          message: result.message || 'Sede creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear sede:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la sede',
        data: null
      };
    }
  }

  /**
   * Obtiene todas las sedes de la institución del director
   * GET /api/v1/headquarters/director
   */
  async getDirectorHeadquarters() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo sedes del director:', this.baseURL);
        
        const response = await fetch(this.baseURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarters || [],
          totalHeadquarters: result.totalHeadquarters || 0,
          message: result.message || 'Sedes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sedes del director:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las sedes',
        data: [],
        totalHeadquarters: 0
      };
    }
  }

  /**
   * Obtiene una sede específica por ID
   * GET /api/v1/headquarters/director/{headquarter_id}
   */
  async getHeadquarterById(headquarterId) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo sede por ID:', this.baseURL + '/' + headquarterId);
        
        const response = await fetch(this.baseURL + '/' + headquarterId, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarter || null,
          message: result.message || 'Sede obtenida exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sede por ID:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la sede',
        data: null
      };
    }
  }

  /**
   * Actualiza una sede existente
   * PUT /api/v1/headquarters/director/update/{headquarter_id}
   */
  async updateHeadquarter(headquarterId, headquarterData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Actualizando sede:', this.baseURL + '/update/' + headquarterId);
        console.log('📦 Datos de actualización:', headquarterData);
        
        const response = await fetch(this.baseURL + '/update/' + headquarterId, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(headquarterData)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarter || null,
          message: result.message || 'Sede actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar sede:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la sede',
        data: null
      };
    }
  }

  /**
   * Elimina (desactiva) una sede
   * DELETE /api/v1/headquarters/director/delete/{headquarter_id}
   */
  async deleteHeadquarter(headquarterId) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Eliminando sede:', this.baseURL + '/delete/' + headquarterId);
        
        const response = await fetch(this.baseURL + '/delete/' + headquarterId, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Sede eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar sede:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la sede'
      };
    }
  }

  /**
   * Restaura una sede eliminada
   * PATCH /api/v1/headquarters/director/restore/{headquarter_id}
   */
  async restoreHeadquarter(headquarterId) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Restaurando sede:', this.baseURL + '/restore/' + headquarterId);
        
        const response = await fetch(this.baseURL + '/restore/' + headquarterId, {
          method: 'PATCH',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Sede restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar sede:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la sede'
      };
    }
  }
}

export default new HeadquarterDirectorService();