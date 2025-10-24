import { refreshTokenKeycloak } from '../auth/authService';

class CourseService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/academics/courses`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   * Incluye los headers requeridos por CourseRest.java (Headers HTTP v5.0)
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

    // Headers requeridos según CourseRest.java (SECRETARY endpoints)
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
   * Crear un nuevo curso
   * POST /create
   */
  async createCourse(courseData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Creando curso:', courseData);
        
        const fullURL = `${this.baseURL}/create`;
        
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(courseData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Curso creado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al crear curso:', error);
      return {
        success: false,
        error: error.message || 'Error al crear curso'
      };
    }
  }

  /**
   * Obtener todos los cursos de la institución
   * GET /secretary/courses
   */
  async getAllCourses() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todos los cursos');
        const fullURL = `${this.baseURL}/secretary/courses`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Cursos obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener cursos:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener cursos',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener cursos por nivel
   * GET /secretary/courses/level/{level}
   */
  async getCoursesByLevel(level) {
    try {
      if (!level) {
        throw new Error('Nivel requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo cursos por nivel:', level);
        const fullURL = `${this.baseURL}/secretary/courses/level/${level}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Cursos obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener cursos por nivel:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener cursos por nivel',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Actualizar un curso
   * PUT /{id}
   */
  async updateCourse(id, courseData) {
    try {
      if (!id) {
        throw new Error('ID de curso requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando curso:', { id, courseData });
        
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(courseData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Curso actualizado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar curso:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar curso'
      };
    }
  }

  /**
   * Eliminar (desactivar) un curso
   * DELETE /{id}
   */
  async deleteCourse(id) {
    try {
      if (!id) {
        throw new Error('ID de curso requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando curso:', id);
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Curso eliminado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar curso:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar curso'
      };
    }
  }

  /**
   * Validar disponibilidad de código de curso
   * GET /validate-code/{courseCode}
   */
  async validateCourseCode(courseCode) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🔍 Validando código de curso:', courseCode);
        const fullURL = `${this.baseURL}/validate-code/${courseCode}`;
        
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
      console.error('❌ Error al validar código de curso:', error);
      return {
        success: false,
        error: error.message || 'Error al validar código de curso'
      };
    }
  }
}

// Exportar instancia única del servicio
const courseService = new CourseService();
export default courseService;
export { courseService };
