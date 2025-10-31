import { Grade, validateGrade } from '../../types/grades/grade';
import { refreshTokenKeycloak } from '../auth/authService';

class GradeService {
  constructor() {
    // URL del gateway
    const gatewayURL = 'https://lab.vallegrande.edu.pe/school/gateway';
    this.baseURL = `${gatewayURL}/api/v1/grades`;
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
    const userId = localStorage.getItem('user_id');
    const userRoles = localStorage.getItem('user_roles') || 'teacher';
    const institutionId = localStorage.getItem('institution_id');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId || '',
      'X-User-Roles': userRoles,
      'X-Institution-Id': institutionId || ''
    };

    console.log('🔑 Headers enviados:', {
      'X-User-Id': userId,
      'X-User-Roles': userRoles,
      'X-Institution-Id': institutionId,
      'Authorization': token ? 'Bearer ***' : 'No token'
    });

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
   * Registra una calificación individual por competencia MINEDU
   * POST /api/v1/grades/teacher/register-grade
   */
  async registerGrade(gradeData) {
    try {
      console.log('📝 Intentando registrar calificación con datos:', gradeData);
      
      // Validar los datos antes de enviar
      const validation = validateGrade(gradeData);
      if (!validation.isValid) {
        console.error('❌ Validación fallida:', validation.errors);
        return {
          success: false,
          error: 'Datos de calificación inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        studentId: gradeData.studentId,
        courseId: gradeData.courseId,
        classroomId: gradeData.classroomId,
        periodId: gradeData.periodId,
        typePeriod: gradeData.typePeriod,
        competenceName: gradeData.competenceName,
        capacityEvaluated: gradeData.capacityEvaluated || '',
        gradeScale: gradeData.gradeScale,
        numericGrade: gradeData.numericGrade || null,
        evaluationType: gradeData.evaluationType,
        evaluationDate: gradeData.evaluationDate,
        observations: gradeData.observations || ''
      };

      console.log('📤 Payload a enviar:', payload);
      console.log('🌐 URL:', `${this.baseURL}/teacher/register-grade`);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/register-grade`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await this.handleResponse(response);
        
        console.log('✅ Respuesta del backend (register-grade):', data);
        
        return {
          success: true,
          data: data.grade || data,
          message: data.message || 'Calificación registrada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al registrar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la calificación'
      };
    }
  }

  /**
   * Registra calificaciones en lote por aula y período
   * POST /api/v1/grades/teacher/register-batch-grades
   */
  async registerBatchGrades(grades) {
    try {
      if (!Array.isArray(grades) || grades.length === 0) {
        return {
          success: false,
          error: 'Debe proporcionar al menos una calificación'
        };
      }

      const payload = { grades };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/register-batch-grades`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data,
          message: data.message || 'Calificaciones en lote registradas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al registrar calificaciones en lote:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar las calificaciones en lote'
      };
    }
  }

  /**
   * Actualiza una calificación existente
   * PUT /api/v1/grades/teacher/update-grade/{gradeId}
   */
  async updateGrade(gradeId, gradeData) {
    try {
      if (!gradeId) {
        throw new Error('ID de calificación requerido');
      }

      console.log('📝 Intentando actualizar calificación con ID:', gradeId);
      console.log('📤 Datos a actualizar:', gradeData);

      // Para actualización, solo enviar los 7 campos editables
      // NO enviar IDs de referencia (studentId, courseId, classroomId, periodId, typePeriod)
      // ya que estos definen la identidad de la calificación y no deben cambiar
      const payload = {
        competenceName: gradeData.competenceName,
        capacityEvaluated: gradeData.capacityEvaluated || 'Capacidad no especificada',
        gradeScale: gradeData.gradeScale,
        numericGrade: gradeData.numericGrade || null,
        evaluationType: gradeData.evaluationType,
        evaluationDate: gradeData.evaluationDate,
        observations: gradeData.observations || ''
      };

      console.log('📤 Payload a enviar (solo campos editables):', payload);
      console.log('🌐 URL:', `${this.baseURL}/teacher/update-grade/${gradeId}`);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/update-grade/${gradeId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await this.handleResponse(response);
        
        console.log('✅ Respuesta del backend (update-grade):', data);
        
        return {
          success: true,
          data: data.grade || data,
          message: data.message || 'Calificación actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la calificación'
      };
    }
  }

  /**
   * Obtiene todas las calificaciones del teacher actual
   * GET /api/v1/grades/teacher/my-grades
   */
  async getMyGrades() {
    try {
      console.log('📊 Cargando calificaciones del teacher...');
      console.log('🌐 URL completa:', `${this.baseURL}/teacher/my-grades`);
      
      const headers = this.getAuthHeaders();
      console.log('🔑 Headers que se enviarán:', headers);
      
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/my-grades`, {
          method: 'GET',
          headers: headers
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        const data = await this.handleResponse(response);
        
        console.log('📊 RAW Respuesta del backend (my-grades):', JSON.stringify(data, null, 2));
        console.log('📊 Tipo de data:', typeof data);
        console.log('📊 data.grades existe?', data.grades !== undefined);
        console.log('📊 data es array?', Array.isArray(data));
        
        // Manejar diferentes formatos de respuesta
        let grades = [];
        if (data.grades && Array.isArray(data.grades)) {
          grades = data.grades;
          console.log('✅ Extrayendo grades de data.grades');
        } else if (Array.isArray(data)) {
          grades = data;
          console.log('✅ data es directamente un array');
        } else {
          console.warn('⚠️ Formato de respuesta no reconocido');
        }
        
        console.log('✅ Total de calificaciones extraídas:', grades.length);
        if (grades.length > 0) {
          console.log('📋 Primera calificación:', grades[0]);
        } else {
          console.warn('⚠️ No se encontraron calificaciones para este teacher');
        }
        
        return {
          success: true,
          data: grades,
          message: data.message || 'Mis calificaciones obtenidas exitosamente',
          total: data.total_grades || grades.length
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener mis calificaciones:', error);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      console.error('❌ Stack trace:', error.stack);
      return {
        success: false,
        error: error.message || 'Error al obtener las calificaciones',
        data: []
      };
    }
  }

  /**
   * Obtiene reporte consolidado de aula por período evaluativo específico
   * GET /api/v1/grades/teacher/classroom/{classroomId}/period/{periodId}/type/{typePeriod}/report
   */
  async getClassroomPeriodReport(classroomId, periodId, typePeriod) {
    try {
      if (!classroomId || !periodId || !typePeriod) {
        throw new Error('ID de aula, período y tipo de período requeridos');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(
          `${this.baseURL}/teacher/classroom/${classroomId}/period/${periodId}/type/${typePeriod}/report`,
          {
            method: 'GET',
            headers: this.getAuthHeaders()
          }
        );

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data.courses_summary || data,
          message: data.message || 'Reporte de aula obtenido exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener reporte de aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el reporte de aula',
        data: []
      };
    }
  }

  /**
   * Obtiene historial de calificaciones de estudiante en aulas del teacher
   * GET /api/v1/grades/teacher/student/{studentId}/grades
   */
  async getStudentGradesByTeacher(studentId) {
    try {
      if (!studentId) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/student/${studentId}/grades`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        return {
          success: true,
          data: data.grades || Array.isArray(data) ? data : [],
          message: data.message || 'Historial de estudiante obtenido exitosamente',
          total: data.total_grades || (Array.isArray(data) ? data.length : 0)
        };
      });
    } catch (error) {
      console.error('Error al obtener historial del estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el historial del estudiante',
        data: []
      };
    }
  }

  /**
   * Elimina lógicamente una calificación (cambia estado a I=Inactive)
   * DELETE /api/v1/grades/teacher/delete-grade/{gradeId}
   */
  async deleteGrade(gradeId) {
    try {
      if (!gradeId) {
        throw new Error('ID de calificación requerido');
      }

      console.log('🗑️ Intentando eliminar calificación con ID:', gradeId);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/delete-grade/${gradeId}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        console.log('✅ Respuesta del backend (delete-grade):', data);
        
        return {
          success: true,
          data: data.grade || data,
          message: data.message || 'Calificación eliminada lógicamente exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la calificación'
      };
    }
  }

  /**
   * Restaura una calificación eliminada (cambia estado de I=Inactive a A=Active)
   * PATCH /api/v1/grades/teacher/restore-grade/{gradeId}
   */
  async restoreGrade(gradeId) {
    try {
      if (!gradeId) {
        throw new Error('ID de calificación requerido');
      }

      console.log('♻️ Intentando restaurar calificación con ID:', gradeId);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/teacher/restore-grade/${gradeId}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        
        console.log('✅ Respuesta del backend (restore-grade):', data);
        
        return {
          success: true,
          data: data.grade || data,
          message: data.message || 'Calificación restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al restaurar calificación:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la calificación'
      };
    }
  }

  /**
   * Crea una nueva calificación con valores por defecto
   */
  createNewGrade() {
    return {
      ...Grade,
      evaluationDate: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
      status: 'A'
    };
  }
}

export default new GradeService();