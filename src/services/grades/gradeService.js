import { Grade, validateGrade } from '../../types/grades/grade';
import { refreshTokenKeycloak } from '../auth/authService';

class GradeService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/grades`;
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
   * Obtiene todas las calificaciones
   * GET /api/v1/grades
   */
  async getAllGrades() {
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
          message: 'Calificaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones',
        data: []
      };
    }
  }

  /**
   * Obtiene una calificación por ID
   * GET /api/v1/grades/{id}
   */
  async getGradeById(id) {
    try {
      if (!id) {
        throw new Error('ID de calificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data || null,
          message: 'Calificación encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la calificación',
        data: null
      };
    }
  }

  /**
   * Obtiene calificaciones por ID de estudiante
   * GET /api/v1/grades/student/{studentId}
   */
  async getGradesByStudentId(studentId) {
    try {
      if (!studentId) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/student/${studentId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Calificaciones del estudiante obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificaciones del estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones del estudiante',
        data: []
      };
    }
  }

  /**
   * Obtiene calificaciones por ID de curso
   * GET /api/v1/grades/course/{courseId}
   */
  async getGradesByCourseId(courseId) {
    try {
      if (!courseId) {
        throw new Error('ID de curso requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/course/${courseId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Calificaciones del curso obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificaciones del curso:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones del curso',
        data: []
      };
    }
  }

  /**
   * Obtiene calificaciones por estudiante y curso
   * GET /api/v1/grades/student/{studentId}/course/{courseId}
   */
  async getGradesByStudentIdAndCourseId(studentId, courseId) {
    try {
      if (!studentId || !courseId) {
        throw new Error('ID de estudiante y curso requeridos');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/student/${studentId}/course/${courseId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Calificaciones específicas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificaciones específicas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones específicas',
        data: []
      };
    }
  }

  /**
   * Obtiene notificaciones relacionadas con una calificación
   * GET /api/v1/grades/{id}/notifications
   */
  async getGradeNotifications(id) {
    try {
      if (!id) {
        throw new Error('ID de calificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/notifications`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Notificaciones de calificación obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener notificaciones de calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las notificaciones de la calificación',
        data: []
      };
    }
  }

  /**
   * Crea una nueva calificación
   * POST /api/v1/grades
   */
  async createGrade(gradeData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateGrade(gradeData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de calificación inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        studentId: gradeData.studentId,
        courseId: gradeData.courseId,
        academicPeriod: gradeData.academicPeriod,
        evaluationType: gradeData.evaluationType,
        achievementLevel: gradeData.achievementLevel,
        evaluationDate: gradeData.evaluationDate,
        remarks: gradeData.remarks || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data,
          message: 'Calificación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la calificación'
      };
    }
  }

  /**
   * Actualiza una calificación existente
   * PUT /api/v1/grades/{id}
   */
  async updateGrade(id, gradeData) {
    try {
      if (!id) {
        throw new Error('ID de calificación requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateGrade(gradeData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de calificación inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        studentId: gradeData.studentId,
        courseId: gradeData.courseId,
        academicPeriod: gradeData.academicPeriod,
        evaluationType: gradeData.evaluationType,
        achievementLevel: gradeData.achievementLevel,
        evaluationDate: gradeData.evaluationDate,
        remarks: gradeData.remarks || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data,
          message: 'Calificación actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la calificación'
      };
    }
  }

  /**
   * Elimina una calificación (eliminación lógica)
   * DELETE /api/v1/grades/{id}
   */
  async deleteGrade(id) {
    try {
      if (!id) {
        throw new Error('ID de calificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data,
          message: 'Calificación eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la calificación'
      };
    }
  }

  /**
   * Restaura una calificación eliminada
   * PUT /api/v1/grades/{id}/restore
   */
  async restoreGrade(id) {
    try {
      if (!id) {
        throw new Error('ID de calificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/restore`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data,
          message: 'Calificación restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la calificación'
      };
    }
  }

  /**
   * Obtiene todas las calificaciones inactivas
   * GET /api/v1/grades/inactive
   */
  async getAllInactiveGrades() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/inactive`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Calificaciones inactivas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener calificaciones inactivas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones inactivas',
        data: []
      };
    }
  }

  /**
   * Obtiene todas las calificaciones incluyendo activas e inactivas
   * GET /api/v1/grades/all
   */
  async getAllGradesIncludingInactive() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/all`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
          message: 'Todas las calificaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener todas las calificaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener todas las calificaciones',
        data: []
      };
    }
  }

  /**
   * Crea una nueva calificación con valores por defecto
   */
  createNewGrade() {
    return {
      ...Grade,
      evaluationDate: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
    };
  }
}

export default new GradeService();