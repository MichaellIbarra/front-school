import { refreshTokenKeycloak } from '../auth/authService';

class ClassroomService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/academics/classrooms`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   * Incluye los headers requeridos por ClassroomRest.java (Headers HTTP v5.0)
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

    // Headers requeridos según ClassroomRest.java (SECRETARY endpoints)
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
   * Crear una nueva aula
   * POST /create
   */
  async createClassroom(classroomData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Creando aula:', classroomData);
        
        const fullURL = `${this.baseURL}/create`;
        
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(classroomData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Aula creada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al crear aula:', error);
      return {
        success: false,
        error: error.message || 'Error al crear aula'
      };
    }
  }

  /**
   * Obtener todas las aulas de la institución
   * GET /secretary/classrooms
   */
  async getAllClassrooms() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todas las aulas');
        const fullURL = `${this.baseURL}/secretary/classrooms`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Aulas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener aulas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener aulas',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener aulas por período
   * GET /secretary/classrooms/period/{periodId}
   */
  async getClassroomsByPeriod(periodId) {
    try {
      if (!periodId) {
        throw new Error('ID de período requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo aulas por período:', periodId);
        const fullURL = `${this.baseURL}/secretary/classrooms/period/${periodId}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Aulas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener aulas por período:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener aulas por período',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener aulas por grado
   * GET /secretary/classrooms/grade/{grade}
   */
  async getClassroomsByGrade(grade) {
    try {
      if (!grade) {
        throw new Error('Grado requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo aulas por grado:', grade);
        const fullURL = `${this.baseURL}/secretary/classrooms/grade/${grade}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Aulas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener aulas por grado:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener aulas por grado',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Actualizar un aula
   * PUT /{id}
   */
  async updateClassroom(id, classroomData) {
    try {
      if (!id) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando aula:', { id, classroomData });
        
        const fullURL = `${this.baseURL}/${id}`;
        const payload = JSON.stringify(classroomData);
        
        console.log('📤 URL:', fullURL);
        console.log('📤 Headers:', this.getAuthHeaders());
        console.log('📤 Payload JSON:', payload);
        
        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: payload
        });

        console.log('📥 Response status:', response.status);
        const result = await this.handleResponse(response);
        console.log('📥 Response result:', result);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Aula actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar aula:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar aula'
      };
    }
  }

  /**
   * Eliminar (desactivar) un aula
   * DELETE /{id}
   */
  async deleteClassroom(id) {
    try {
      if (!id) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando aula:', id);
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Aula eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar aula:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar aula'
      };
    }
  }

  /**
   * Validar disponibilidad de aula
   * GET /validate-classroom
   */
  async validateClassroom(periodId, grade, section) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🔍 Validando disponibilidad de aula');
        const params = new URLSearchParams({
          periodId,
          grade: grade.toString(),
          section
        });
        const fullURL = `${this.baseURL}/validate-classroom?${params}`;
        
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
      console.error('❌ Error al validar aula:', error);
      return {
        success: false,
        error: error.message || 'Error al validar aula'
      };
    }
  }
}

// Exportar instancia única del servicio
const classroomService = new ClassroomService();
export default classroomService;
export { classroomService };
