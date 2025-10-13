import { Enrollment, validateEnrollment, validateBulkEnrollments, formatDateForBackend, generateEnrollmentNumber } from '../../types/enrollments/enrollments';
import { refreshTokenKeycloak } from '../../auth/authService';

class EnrollmentService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/enrollments`;
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
   * Obtiene todas las matrículas
   * GET /api/v1/enrollments
   */
  async getAllEnrollments() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
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
      console.error('Error al obtener matrículas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las matrículas',
        data: []
      };
    }
  }

  /**
   * Obtiene una matrícula por ID
   * GET /api/v1/enrollments/{id}
   */
  async getEnrollmentById(id) {
    try {
      if (!id) {
        throw new Error('ID de matrícula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrícula encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la matrícula',
        data: null
      };
    }
  }

  /**
   * Crea una nueva matrícula
   * POST /api/v1/enrollments
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

      // Crear el payload sin el ID (se genera en el backend)
      const payload = {
        studentId: enrollmentData.studentId,
        classroomId: enrollmentData.classroomId,
        enrollmentNumber: enrollmentData.enrollmentNumber,
        enrollmentDate: formatDateForBackend(enrollmentData.enrollmentDate)
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
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
   * Actualiza el estado de una matrícula
   * PUT /api/v1/enrollments/{id}/status/{status}
   */
  async updateEnrollmentStatus(id, status) {
    try {
      if (!id) {
        throw new Error('ID de matrícula requerido');
      }

      if (!status) {
        throw new Error('Estado requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/status/${status}`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Estado de matrícula actualizado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar estado de matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el estado de la matrícula'
      };
    }
  }

  /**
   * Elimina una matrícula (inactiva)
   * DELETE /api/v1/enrollments/{id}
   */
  async deleteEnrollment(id) {
    try {
      if (!id) {
        throw new Error('ID de matrícula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrícula eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la matrícula'
      };
    }
  }

  /**
   * Restaura una matrícula eliminada
   * PUT /api/v1/enrollments/{id}/restore
   */
  async restoreEnrollment(id) {
    try {
      if (!id) {
        throw new Error('ID de matrícula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}/restore`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrícula restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la matrícula'
      };
    }
  }

  /**
   * Carga masiva de matrículas
   * POST /api/v1/enrollments/bulk
   */
  async bulkCreateEnrollments(enrollmentsData) {
    try {
      if (!Array.isArray(enrollmentsData) || enrollmentsData.length === 0) {
        throw new Error('Se requiere un array de matrículas');
      }

      // Validar datos
      const validation = validateBulkEnrollments(enrollmentsData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Errores de validación en los datos',
          validationErrors: validation.errors
        };
      }

      // Preparar payload
      const payload = enrollmentsData.map(enrollment => ({
        studentId: enrollment.studentId,
        classroomId: enrollment.classroomId,
        enrollmentNumber: enrollment.enrollmentNumber,
        enrollmentDate: formatDateForBackend(enrollment.enrollmentDate)
      }));

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/bulk`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Matrículas creadas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error en carga masiva de matrículas:', error);
      return {
        success: false,
        error: error.message || 'Error en la carga masiva de matrículas'
      };
    }
  }

  /**
   * Obtiene las matrículas de un estudiante específico
   * GET /api/v1/enrollments?studentId={studentId}
   */
  async getEnrollmentsByStudent(studentId) {
    try {
      const response = await fetch(`${this.baseURL}?studentId=${studentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        // Reintentar después del refresh del token
        return this.getEnrollmentsByStudent(studentId);
      }
      console.error('Error al obtener matrículas del estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener matrículas del estudiante'
      };
    }
  }

  /**
   * Genera el próximo número de matrícula disponible
   * @returns {Promise<string>} - Número de matrícula generado
   */
  async generateNextEnrollmentNumber() {
    try {
      // Obtener todas las matrículas para calcular el correlativo
      const response = await this.getAllEnrollments();
      
      if (response.success) {
        const existingEnrollments = response.data || [];
        return generateEnrollmentNumber(existingEnrollments);
      } else {
        // Si no se pueden obtener las matrículas, generar con correlativo 0001
        const currentYear = new Date().getFullYear();
        return `MAT-${currentYear}-0001`;
      }
    } catch (error) {
      console.error('Error al generar número de matrícula:', error);
      // Fallback: generar con correlativo 0001
      const currentYear = new Date().getFullYear();
      return `MAT-${currentYear}-0001`;
    }
  }

  /**
   * GET /api/v1/enrollments/classroom/{classroomId} - Busca matrículas por ID de aula
   */
  async getEnrollmentsByClassroom(classroomId) {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseURL}/classroom/${classroomId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        data: result.data || [],
        message: `Matrículas del aula ${classroomId} obtenidas exitosamente`,
        metadata: result.metadata
      };
    });
  }

  /**
   * GET /api/v1/enrollments/enrollment-number/{enrollmentNumber} - Busca matrícula por número
   */
  async getEnrollmentByNumber(enrollmentNumber) {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseURL}/enrollment-number/${enrollmentNumber}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        data: result.data,
        message: `Matrícula ${enrollmentNumber} encontrada`,
        metadata: result.metadata
      };
    });
  }

  /**
   * GET /api/v1/enrollments/status/{status} - Filtra matrículas por estado
   */
  async getEnrollmentsByStatus(status) {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseURL}/status/${status}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        data: result.data || [],
        message: `Matrículas con estado ${status} obtenidas exitosamente`,
        metadata: result.metadata
      };
    });
  }

  /**
   * PUT /api/v1/enrollments/{id} - Actualiza una matrícula completa
   */
  async updateEnrollment(id, enrollmentData) {
    try {
      // Validar datos de entrada
      const validation = validateEnrollment(enrollmentData);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de matrícula inválidos',
          validationErrors: validation.errors
        };
      }

      const payload = {
        classroomId: enrollmentData.classroomId,
        enrollmentDate: formatDateForBackend(enrollmentData.enrollmentDate),
        status: enrollmentData.status || 'ACTIVE'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          message: 'Matrícula actualizada exitosamente',
          metadata: result.metadata
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
   * GET /api/v1/enrollments/analytics/classroom/{classroomId}/stats - Obtiene estadísticas de un aula
   */
  async getClassroomStats(classroomId) {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseURL}/analytics/classroom/${classroomId}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        data: result.data,
        message: `Estadísticas del aula ${classroomId} obtenidas exitosamente`,
        metadata: result.metadata
      };
    });
  }

  /**
   * GET /api/v1/enrollments/analytics/enrollment-distribution - Obtiene distribución de matrículas
   */
  async getEnrollmentDistribution() {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseURL}/analytics/enrollment-distribution`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        data: result.data,
        message: 'Distribución de matrículas obtenida exitosamente',
        metadata: result.metadata
      };
    });
  }

  /**
   * Obtiene el último número de matrícula para generar el siguiente
   */
  async getLastEnrollmentNumber() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/last-number`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          message: 'Último número obtenido exitosamente'
        };
      });
    } catch (error) {
      // Método alternativo si falla el endpoint principal
      console.warn('⚠️ Endpoint /last-number falló, intentando método alternativo:', error.message);
      
      try {
        console.log('🔄 Intentando obtener último número desde matrículas existentes...');
        const enrollmentsResult = await this.getAllEnrollments();
        
        if (enrollmentsResult.success) {
          console.log(`📊 Procesando ${enrollmentsResult.data.length} matrículas para encontrar último número...`);
          
          const currentYear = new Date().getFullYear();
          const enrollmentNumbers = enrollmentsResult.data
            .filter(enrollment => enrollment.enrollmentNumber && enrollment.enrollmentNumber.includes(`MAT-${currentYear}-`))
            .map(enrollment => {
              // Extraer el número correlativo de formatos como "MAT-2025-0001"
              const parts = enrollment.enrollmentNumber.split('-');
              if (parts.length >= 3) {
                const correlative = parseInt(parts[2]);
                return isNaN(correlative) ? 0 : correlative;
              }
              return 0;
            })
            .filter(num => num > 0);
          
          const lastNumber = enrollmentNumbers.length > 0 ? Math.max(...enrollmentNumbers) : 0;
          
          console.log(`✅ Último número de matrícula encontrado: ${lastNumber} (de ${enrollmentNumbers.length} números válidos) usando método alternativo`);
          
          return {
            success: true,
            data: lastNumber,
            message: 'Último número obtenido exitosamente (método alternativo)'
          };
        }
      } catch (alternativeError) {
        console.error('❌ También falló el método alternativo:', alternativeError);
      }
      
      console.error('❌ Error al obtener último número de matrícula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el último número de matrícula',
        data: 0
      };
    }
  }

  /**
   * Obtiene las aulas disponibles para matrícula
   */
  async getAvailableClassrooms() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/classrooms/available`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          message: 'Aulas obtenidas exitosamente'
        };
      });
    } catch (error) {
      // Método alternativo si falla el endpoint principal
      console.warn('⚠️ Endpoint /classrooms/available falló, intentando método alternativo:', error.message);
      
      try {
        console.log('🔄 Intentando obtener aulas desde matrículas existentes...');
        const enrollmentsResult = await this.getAllEnrollments();
        
        if (enrollmentsResult.success) {
          console.log(`📊 Procesando ${enrollmentsResult.data.length} matrículas para extraer aulas...`);
          const uniqueClassrooms = {};
          
          enrollmentsResult.data.forEach(enrollment => {
            if (enrollment.classroomId) {
              uniqueClassrooms[enrollment.classroomId] = {
                id: enrollment.classroomId,
                name: enrollment.classroomName || `Aula ${enrollment.classroomId}`,
                status: 'ACTIVE'
              };
            }
          });
          
          const classroomsArray = Object.values(uniqueClassrooms);
          console.log(`✅ Encontradas ${classroomsArray.length} aulas únicas usando método alternativo:`, classroomsArray.map(c => c.name));
          
          return {
            success: true,
            data: classroomsArray,
            message: 'Aulas obtenidas exitosamente (método alternativo)'
          };
        } else {
          console.error('❌ Falló también el método alternativo para obtener matrículas');
        }
      } catch (alternativeError) {
        console.error('❌ También falló el método alternativo:', alternativeError);
      }
      
      console.error('❌ Error al obtener aulas disponibles:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las aulas disponibles',
        data: []
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