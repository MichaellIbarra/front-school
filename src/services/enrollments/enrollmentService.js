import { Enrollment, validateEnrollment, formatDateForBackend } from '../../types/enrollments/enrollments';
import { refreshTokenKeycloak } from '../auth/authService';

class EnrollmentService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_BASE_API_URL}`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene la institución del usuario desde localStorage
   */
  getUserInstitution() {
    try {
      const institutionData = localStorage.getItem('institution');
      return institutionData ? JSON.parse(institutionData) : null;
    } catch (error) {
      console.error('Error al obtener institución desde localStorage:', error);
      return null;
    }
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    const institution = this.getUserInstitution();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Agregar headers adicionales si existen
    if (institution && institution.id) {
      headers['X-Institution-Id'] = institution.id;
    }
    
    // Agregar role y user id del token
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (userInfo.id) {
      headers['X-User-Id'] = userInfo.id;
    }
    headers['X-User-Roles'] = 'secretary';
    
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
        try {
          // Agregar timeout al refresh para evitar cuelgues
          const refreshPromise = refreshTokenKeycloak(refreshToken);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 10000)
          );
          
          const refreshResult = await Promise.race([refreshPromise, timeoutPromise]);
          
          if (refreshResult && refreshResult.success) {
            console.log('✅ Token refrescado correctamente, reintentando petición...');
            throw new Error('TOKEN_REFRESHED'); // Señal especial para reintentar
          } else {
            console.log('❌ Error al refrescar token:', refreshResult?.error || 'Unknown error');
            this.clearTokensAndRedirect();
          }
        } catch (error) {
          if (error.message === 'REFRESH_TIMEOUT') {
            console.log('⏰ Timeout al refrescar token, limpiando sesión...');
          } else {
            console.log('❌ Error al refrescar token:', error.message);
          }
          this.clearTokensAndRedirect();
          throw new Error('Sesión expirada. Redirigiendo al login...');
        }
      } else {
        console.log('❌ No hay refresh token disponible');
        this.clearTokensAndRedirect();
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
   * Limpia tokens y redirige al login
   */
  clearTokensAndRedirect() {
    // Limpiar tokens inválidos
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires');
    console.log('🚪 Tokens limpiados, redirigiendo al login...');
    // Redirigir al login con un pequeño delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
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
   * Crea una nueva matrícula
   * POST /enrollments/secretary/create
   */
  async createEnrollment(enrollmentData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateEnrollment(enrollmentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de matrícula inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload con la nueva estructura
      const payload = {
        studentId: enrollmentData.studentId,
        classroomId: enrollmentData.classroomId,
        enrollmentDate: formatDateForBackend(enrollmentData.enrollmentDate),
        enrollmentType: enrollmentData.enrollmentType || 'REGULAR'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary/create`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrícula creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la matrícula'
      };
    }
  }

  /**
   * Actualiza una matrícula existente
   * PUT /enrollments/secretary/update/{id}
   */
  async updateEnrollment(id, enrollmentData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateEnrollment(enrollmentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de matrícula inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload con la nueva estructura
      const payload = {
        studentId: enrollmentData.studentId,
        classroomId: enrollmentData.classroomId,
        enrollmentDate: formatDateForBackend(enrollmentData.enrollmentDate),
        enrollmentType: enrollmentData.enrollmentType || 'REGULAR',
        status: enrollmentData.status,
        transferReason: enrollmentData.transferReason || null,
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary/update/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.metadata?.message || errorText;
            throw new Error(errorMessage);
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrícula actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la matrícula'
      };
    }
  }

  /**
   * Obtiene todas las matrículas del secretary
   * GET /enrollments/secretary
   */
  async getAllEnrollments() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        // Normalizar posibles estructuras de respuesta
        let data = [];
        if (Array.isArray(result.data)) {
          data = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          data = result.data.data;
        } else if (Array.isArray(result)) {
          data = result;
        }

        return {
          success: true,
          data,
          metadata: result.metadata,
          message: result.metadata?.message || result.message || 'Matrículas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener matrículas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las matrículas',
        data: []
      };
    }
  }

  /**
   * Obtiene las aulas usando el endpoint de academics
   * GET /academics/classrooms/secretary/classrooms
   */
  async getClassrooms() {
    try {
      return await this.executeWithRetry(async () => {
        const url = `${process.env.REACT_APP_ACADEMICS_API_URL}/academics/classrooms/secretary/classrooms`;
        console.log('[DEBUG] Requesting classrooms from URL (via enrollmentService):', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);

        // Normalizar estructuras posibles: { total, data: [...] } o { data: { data: [...] } }
        let data = [];
        if (Array.isArray(result.data)) {
          data = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          data = result.data.data;
        } else if (Array.isArray(result)) {
          data = result;
        }

        return {
          success: true,
          data,
          metadata: result.metadata || { total: result.total },
          message: result.metadata?.message || result.message || 'Aulas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener aulas (enrollmentService):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las aulas',
        data: []
      };
    }
  }

  /**
   * Obtiene las matrículas de un aula específica
   * GET /enrollments/secretary/by-classroom/{classroomId}
   */
  async getEnrollmentsByClassroom(classroomId) {
    try {
      if (!classroomId) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/enrollments/secretary/by-classroom/${classroomId}`;
        console.log('[DEBUG] Requesting enrollments from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrículas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener matrículas por aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las matrículas',
        data: []
      };
    }
  }

  /**
   * Crea múltiples matrículas de forma masiva
   * POST /enrollments/secretary/bulk-create
   */
  async bulkCreateEnrollments(enrollmentsData) {
    try {
      if (!Array.isArray(enrollmentsData) || enrollmentsData.length === 0) {
        return {
          success: false,
          error: 'Se requiere un array de matrículas válido'
        };
      }

      // Validar cada matrícula
      const validationErrors = [];
      const validEnrollments = [];

      enrollmentsData.forEach((enrollment, index) => {
        const validation = validateEnrollment(enrollment);
        if (!validation.isValid) {
          validationErrors.push(`Matrícula ${index + 1}: ${validation.errors.join(', ')}`);
        } else {
          validEnrollments.push({
            studentId: enrollment.studentId,
            classroomId: enrollment.classroomId,
            enrollmentDate: enrollment.enrollmentDate, // Formato yyyy-mm-dd esperado
            enrollmentType: enrollment.enrollmentType || 'REGULAR'
          });
        }
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Errores de validación encontrados',
          validationErrors
        };
      }

      const payload = {
        enrollments: validEnrollments
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary/bulk-create`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.metadata?.message || errorJson.message || errorText;
            throw new Error(errorMessage);
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || result.message || 'Matrículas creadas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear matrículas masivamente:', error);
      return {
        success: false,
        error: error.message || 'Error al crear las matrículas'
      };
    }
  }

  /**
   * Obtiene matrículas por estado
   * GET /enrollments/secretary/by-status/{status}
   */
  async getEnrollmentsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Estado requerido');
      }

      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/enrollments/secretary/by-status/${status}`;
        console.log('[DEBUG] Requesting enrollments by status from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        let data = [];
        if (Array.isArray(result.data)) {
          data = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          data = result.data.data;
        } else if (Array.isArray(result)) {
          data = result;
        }

        return {
          success: true,
          data,
          metadata: result.metadata,
          message: result.message || `Matrículas con estado ${status} obtenidas exitosamente`
        };
      });
    } catch (error) {
      console.error('Error al obtener matrículas por estado:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las matrículas por estado',
        data: []
      };
    }
  }

  /**
   * Obtiene estadísticas de matrículas
   * GET /enrollments/secretary/statistics
   */
  async getEnrollmentStatistics() {
    try {
      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/enrollments/secretary/statistics`;
        console.log('[DEBUG] Requesting enrollment statistics from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          metadata: result.metadata,
          message: result.message || 'Estadísticas de matrículas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de matrículas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las estadísticas de matrículas',
        data: {}
      };
    }
  }

  /**
   * Transfiere un estudiante a otra aula
   * PUT /enrollments/secretary/transfer/{enrollmentId}
   */
  async transferStudent(enrollmentId, newClassroomId) {
    try {
      if (!enrollmentId) {
        throw new Error('ID de matrícula requerido');
      }
      if (!newClassroomId) {
        throw new Error('ID de nueva aula requerido');
      }

      const payload = {
        newClassroomId: newClassroomId
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary/transfer/${enrollmentId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.metadata?.message || errorJson.message || errorText;
            throw new Error(errorMessage);
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || result.message || 'Estudiante transferido exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al transferir estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al transferir el estudiante'
      };
    }
  }

  /**
   * Obtiene matrículas por estudiante
   * GET /enrollments/secretary/by-student/{studentId}
   */
  async getEnrollmentsByStudent(studentId) {
    try {
      if (!studentId) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/enrollments/secretary/by-student/${studentId}`;
        console.log('[DEBUG] Requesting enrollments by student from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        let data = [];
        if (Array.isArray(result.data)) {
          data = result.data;
        } else if (result.data && Array.isArray(result.data.data)) {
          data = result.data.data;
        } else if (Array.isArray(result)) {
          data = result;
        }

        return {
          success: true,
          data,
          metadata: result.metadata,
          message: result.message || 'Matrículas del estudiante obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener matrículas por estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las matrículas del estudiante',
        data: []
      };
    }
  }

  /**
   * Cancela una matrícula
   * PUT /enrollments/secretary/cancel/{enrollmentId}
   */
  async cancelEnrollment(enrollmentId) {
    try {
      if (!enrollmentId) {
        throw new Error('ID de matrícula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollments/secretary/cancel/${enrollmentId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.metadata?.message || errorJson.message || errorText;
            throw new Error(errorMessage);
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || result.message || 'Matrícula cancelada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al cancelar matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al cancelar la matrícula'
      };
    }
  }

  /**
   * Crea una nueva matrícula con valores por defecto
   */
  createNewEnrollment() {
    return {
      ...Enrollment,
      createdAt: new Date().toISOString()
    };
  }
}

export default new EnrollmentService();