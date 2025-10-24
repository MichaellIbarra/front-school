import { refreshTokenKeycloak } from '../auth/authService';

class TeacherAssignmentService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/academics/teacher-assignments`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   * Incluye los headers requeridos por TeacherAssignmentRest.java (Headers HTTP v5.0)
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

    // Headers requeridos según TeacherAssignmentRest.java (SECRETARY endpoints)
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
   * Crear una nueva asignación de docente
   * POST /create
   */
  async createTeacherAssignment(assignmentData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Creando asignación de docente:', assignmentData);
        
        const fullURL = `${this.baseURL}/create`;
        
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(assignmentData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Asignación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al crear asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear asignación'
      };
    }
  }

  /**
   * Obtener todas las asignaciones de la institución
   * GET /secretary/assignments
   */
  async getAllTeacherAssignments() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todas las asignaciones');
        const fullURL = `${this.baseURL}/secretary/assignments`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Asignaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener asignaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener asignaciones',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener asignaciones por aula
   * GET /secretary/assignments/classroom/{classroomId}
   */
  async getAssignmentsByClassroom(classroomId) {
    try {
      if (!classroomId) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo asignaciones por aula:', classroomId);
        const fullURL = `${this.baseURL}/secretary/assignments/classroom/${classroomId}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Asignaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener asignaciones por aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener asignaciones por aula',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Obtener asignaciones por docente
   * GET /secretary/assignments/teacher/{teacherId}
   */
  async getAssignmentsByTeacher(teacherId) {
    try {
      if (!teacherId) {
        throw new Error('ID de docente requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo asignaciones por docente:', teacherId);
        const fullURL = `${this.baseURL}/secretary/assignments/teacher/${teacherId}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          message: result.message || 'Asignaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener asignaciones por docente:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener asignaciones por docente',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Actualizar una asignación
   * PUT /{id}
   */
  async updateTeacherAssignment(id, assignmentData) {
    try {
      if (!id) {
        throw new Error('ID de asignación requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando asignación:', { id, assignmentData });
        
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(assignmentData)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Asignación actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar asignación'
      };
    }
  }

  /**
   * Eliminar (desactivar) una asignación
   * DELETE /{id}
   */
  async deleteTeacherAssignment(id) {
    try {
      if (!id) {
        throw new Error('ID de asignación requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando asignación:', id);
        const fullURL = `${this.baseURL}/${id}`;
        
        const response = await fetch(fullURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Asignación eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar asignación'
      };
    }
  }

  /**
   * Validar asignación (verificar conflictos)
   * GET /validate-assignment
   */
  async validateAssignment(teacherId, classroomId, courseId) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🔍 Validando asignación');
        const params = new URLSearchParams({
          teacherId,
          classroomId,
          courseId
        });
        const fullURL = `${this.baseURL}/validate-assignment?${params}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          valid: result.valid,
          message: result.message
        };
      });
    } catch (error) {
      console.error('❌ Error al validar asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al validar asignación'
      };
    }
  }

  /**
   * Obtener mis asignaciones (TEACHER ONLY) - AcademicTeacherRest.java v1.0
   * El teacher_id se obtiene automáticamente del X-User-Id
   * GET /api/v1/academics/teacher/my-assignments
   */
  async getMyAssignments() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📚 Obteniendo mis asignaciones como docente');
        
        // Endpoint específico para docentes (AcademicTeacherRest.java)
        // REACT_APP_DOMAIN ya incluye /school/gateway
        const teacherURL = `${process.env.REACT_APP_DOMAIN}/api/v1/academics/teacher/my-assignments`;
        
        console.log('🔗 URL del endpoint:', teacherURL);
        
        const response = await fetch(teacherURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          total: result.total || 0,
          teacherId: result.teacherId,
          institutionId: result.institutionId,
          message: result.message || 'Mis asignaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener mis asignaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener mis asignaciones',
        data: [],
        total: 0
      };
    }
  }
}

// Exportar instancia única del servicio
const teacherAssignmentService = new TeacherAssignmentService();
export default teacherAssignmentService;
export { teacherAssignmentService };
