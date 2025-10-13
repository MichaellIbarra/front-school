import { Student, validateStudent, formatDateForBackend } from '../../types/students/students';
import { refreshTokenKeycloak } from '../../auth/authService';

class StudentService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/students`;
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
   * Obtiene todos los estudiantes
   * GET /api/v1/students
   */
  async getAllStudents() {
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
          message: result.metadata?.message || 'Estudiantes obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los estudiantes',
        data: []
      };
    }
  }

  /**
   * Obtiene un estudiante por ID
   * GET /api/v1/students/{id}
   */
  async getStudentById(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiante encontrado'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el estudiante',
        data: null
      };
    }
  }

  /**
   * Obtiene múltiples estudiantes por sus IDs usando llamadas individuales
   */
  async getStudentsByIds(studentIds) {
    try {
      if (!studentIds || studentIds.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No hay estudiantes para consultar'
        };
      }

      console.log(`📥 Cargando ${studentIds.length} estudiantes individualmente...`);
      
      const studentsData = [];
      const errors = [];
      
      // Cargar estudiantes de forma individual pero con control de concurrencia
      const loadStudent = async (studentId) => {
        try {
          const response = await this.getStudentById(studentId);
          if (response.success && response.data) {
            return response.data;
          } else {
            // Solo agregamos a errores, logging al final
            errors.push(studentId);
            return null;
          }
        } catch (error) {
          console.error(`❌ Error cargando estudiante ${studentId}:`, error);
          errors.push(studentId);
          return null;
        }
      };

      // Procesar en lotes de 3 para no sobrecargar el servidor
      const batchSize = 3;
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => loadStudent(id));
        const batchResults = await Promise.all(batchPromises);
        
        // Agregar solo los estudiantes válidos
        batchResults.forEach(student => {
          if (student) {
            studentsData.push(student);
          }
        });
        
        // Pausa pequeña entre lotes
        if (i + batchSize < studentIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Logging resumido y útil
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} estudiantes no encontrados de ${studentIds.length} solicitados`);
        console.log(`✅ ${studentsData.length} estudiantes cargados exitosamente`);
        if (errors.length <= 5) {
          console.log('📋 IDs no encontrados:', errors.map(id => id.substring(0, 8) + '...').join(', '));
        }
      } else {
        console.log(`✅ Todos los estudiantes cargados: ${studentsData.length}/${studentIds.length}`);
      }
      
      return {
        success: true,
        data: studentsData,
        message: `${studentsData.length} de ${studentIds.length} estudiantes cargados`,
        errors: errors.length > 0 ? errors : undefined,
        notFoundIds: errors // Para fácil acceso a los IDs no encontrados
      };
      
    } catch (error) {
      console.error('💥 Error general al obtener estudiantes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes',
        data: []
      };
    }
  }

  /**
   * Crea un nuevo estudiante
   * POST /api/v1/students
   */
  async createStudent(studentData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateStudent(studentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de estudiante inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload sin el ID (se genera en el backend)
      const payload = {
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        documentType: studentData.documentType || 'DNI',
        documentNumber: studentData.documentNumber || '',
        birthDate: formatDateForBackend(studentData.birthDate),
        gender: studentData.gender || 'MALE',
        address: studentData.address || '',
        district: studentData.district || '',
        province: studentData.province || '',
        department: studentData.department || '',
        phone: studentData.phone || '',
        email: studentData.email || '',
        guardianName: studentData.guardianName || '',
        guardianLastName: studentData.guardianLastName || '',
        guardianDocumentType: studentData.guardianDocumentType || 'DNI',
        guardianDocumentNumber: studentData.guardianDocumentNumber || '',
        guardianPhone: studentData.guardianPhone || '',
        guardianEmail: studentData.guardianEmail || '',
        guardianRelationship: studentData.guardianRelationship || 'FATHER'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Parsear el error para obtener el mensaje
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
          message: result.metadata?.message || 'Estudiante creado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al crear el estudiante'
      };
    }
  }

  /**
   * Actualiza un estudiante existente
   * PUT /api/v1/students/{id}
   */
  async updateStudent(id, studentData) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateStudent(studentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de estudiante inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload sin el ID
      const payload = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        documentType: studentData.documentType,
        documentNumber: studentData.documentNumber,
        birthDate: formatDateForBackend(studentData.birthDate),
        gender: studentData.gender,
        address: studentData.address,
        district: studentData.district,
        province: studentData.province,
        department: studentData.department,
        phone: studentData.phone || '',
        email: studentData.email || '',
        guardianName: studentData.guardianName,
        guardianLastName: studentData.guardianLastName,
        guardianDocumentType: studentData.guardianDocumentType,
        guardianDocumentNumber: studentData.guardianDocumentNumber,
        guardianPhone: studentData.guardianPhone || '',
        guardianEmail: studentData.guardianEmail || '',
        guardianRelationship: studentData.guardianRelationship
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
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiante actualizado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el estudiante'
      };
    }
  }

  /**
   * Elimina un estudiante (lógico)
   * DELETE /api/v1/students/{id}
   */
  async deleteStudent(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
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
          message: result.metadata?.message || 'Estudiante eliminado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar el estudiante'
      };
    }
  }

  /**
   * Desactiva un estudiante (equivalente a eliminación lógica)
   * DELETE /api/v1/students/{id}
   */
  async deactivateStudent(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
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
          message: result.metadata?.message || 'Estudiante desactivado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al desactivar estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al desactivar el estudiante'
      };
    }
  }

  /**
   * Restaura un estudiante eliminado
   * PUT /api/v1/students/{id}/restore
   */
  async restoreStudent(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
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
          message: result.metadata?.message || 'Estudiante restaurado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar el estudiante'
      };
    }
  }

  /**
   * Busca estudiante por número de documento
   * GET /api/v1/students/document/{documentNumber}
   */
  async getStudentByDocument(documentNumber) {
    try {
      if (!documentNumber) {
        throw new Error('Número de documento requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/document/${documentNumber}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Búsqueda completada'
        };
      });
    } catch (error) {
      console.error('Error al buscar estudiante por documento:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar el estudiante',
        data: []
      };
    }
  }

  /**
   * Filtra estudiantes por estado
   * GET /api/v1/students/status/{status}
   */
  async getStudentsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Estado requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/status/${status}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes filtrados exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al filtrar estudiantes por estado:', error);
      return {
        success: false,
        error: error.message || 'Error al filtrar estudiantes',
        data: []
      };
    }
  }

  /**
   * Filtra estudiantes por género
   * GET /api/v1/students/gender/{gender}
   */
  async getStudentsByGender(gender) {
    try {
      if (!gender) {
        throw new Error('Género requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/gender/${gender}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes filtrados exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al filtrar estudiantes por género:', error);
      return {
        success: false,
        error: error.message || 'Error al filtrar estudiantes',
        data: []
      };
    }
  }

  /**
   * Busca estudiantes por nombre
   * GET /api/v1/students/search/firstname/{firstName}
   */
  async searchStudentsByFirstName(firstName) {
    try {
      if (!firstName) {
        throw new Error('Nombre requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/search/firstname/${encodeURIComponent(firstName)}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Búsqueda completada'
        };
      });
    } catch (error) {
      console.error('Error al buscar estudiantes por nombre:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar estudiantes',
        data: []
      };
    }
  }

  /**
   * Busca estudiantes por apellido
   * GET /api/v1/students/search/lastname/{lastName}
   */
  async searchStudentsByLastName(lastName) {
    try {
      if (!lastName) {
        throw new Error('Apellido requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/search/lastname/${encodeURIComponent(lastName)}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Búsqueda completada'
        };
      });
    } catch (error) {
      console.error('Error al buscar estudiantes por apellido:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar estudiantes',
        data: []
      };
    }
  }

  /**
   * Obtiene estudiantes no matriculados
   * GET /api/v1/students/not-enrolled
   */
  async getStudentsNotEnrolled() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/not-enrolled`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes no matriculados obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes no matriculados:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes no matriculados',
        data: []
      };
    }
  }

  /**
   * Obtiene estudiantes no matriculados en un aula específica
   * GET /api/v1/students/not-enrolled/classroom/{classroomId}
   */
  async getStudentsNotEnrolledInClassroom(classroomId) {
    try {
      if (!classroomId) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/not-enrolled/classroom/${classroomId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes no matriculados en el aula obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes no matriculados en aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes no matriculados en el aula',
        data: []
      };
    }
  }

  /**
   * Obtiene estadísticas de matrícula
   * GET /api/v1/students/enrollment-stats
   */
  async getEnrollmentStats() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/enrollment-stats`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || {},
          metadata: result.metadata,
          message: result.metadata?.message || 'Estadísticas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las estadísticas',
        data: {}
      };
    }
  }

  /**
   * Carga masiva de estudiantes
   * POST /api/v1/students/bulk
   */
  async bulkCreateStudents(studentsData) {
    try {
      if (!Array.isArray(studentsData) || studentsData.length === 0) {
        throw new Error('Se requiere un array de estudiantes');
      }

      // Validar cada estudiante
      const validationErrors = [];
      studentsData.forEach((student, index) => {
        const validation = validateStudent(student);
        if (!validation.isValid) {
          validationErrors.push(`Estudiante ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Errores de validación en los datos',
          validationErrors
        };
      }

      // Preparar payload
      const payload = studentsData.map(student => ({
        firstName: student.firstName,
        lastName: student.lastName,
        documentType: student.documentType,
        documentNumber: student.documentNumber,
        birthDate: formatDateForBackend(student.birthDate),
        gender: student.gender,
        address: student.address,
        district: student.district,
        province: student.province,
        department: student.department,
        phone: student.phone || '',
        email: student.email || '',
        guardianName: student.guardianName,
        guardianLastName: student.guardianLastName,
        guardianDocumentType: student.guardianDocumentType,
        guardianDocumentNumber: student.guardianDocumentNumber,
        guardianPhone: student.guardianPhone || '',
        guardianEmail: student.guardianEmail || '',
        guardianRelationship: student.guardianRelationship
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
          message: result.metadata?.message || 'Estudiantes creados exitosamente'
        };
      });
    } catch (error) {
      console.error('Error en carga masiva de estudiantes:', error);
      return {
        success: false,
        error: error.message || 'Error en la carga masiva de estudiantes'
      };
    }
  }

  /**
   * Eliminación masiva de estudiantes
   * DELETE /api/v1/students/bulk
   */
  async bulkDeleteStudents(studentIds) {
    try {
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        throw new Error('Se requiere un array de IDs de estudiantes');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/bulk`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ids: studentIds })
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes eliminados exitosamente'
        };
      });
    } catch (error) {
      console.error('Error en eliminación masiva de estudiantes:', error);
      return {
        success: false,
        error: error.message || 'Error en la eliminación masiva de estudiantes'
      };
    }
  }

  /**
   * Obtiene estudiantes no matriculados
   * GET /api/v1/students/not-enrolled
   */
  async getNotEnrolledStudents() {
    try {
      const response = await fetch(`${this.baseURL}/not-enrolled`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        // Reintentar después del refresh del token
        return this.getNotEnrolledStudents();
      }
      console.error('Error al obtener estudiantes no matriculados:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes no matriculados'
      };
    }
  }

  /**
   * Obtiene estudiantes no matriculados para un aula específica
   * GET /api/v1/students/not-enrolled/classroom/{classroomId}
   */
  async getNotEnrolledStudentsForClassroom(classroomId) {
    try {
      const response = await fetch(`${this.baseURL}/not-enrolled/classroom/${classroomId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        // Reintentar después del refresh del token
        return this.getNotEnrolledStudentsForClassroom(classroomId);
      }
      console.error('Error al obtener estudiantes no matriculados para el aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes no matriculados para el aula'
      };
    }
  }

  /**
   * Obtiene estudiantes que no están matriculados (para matrícula masiva)
   * GET /api/v1/students/not-enrolled
   */
  async getUnEnrolledStudents() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/not-enrolled`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: 'Estudiantes no matriculados obtenidos exitosamente'
        };
      });
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        // Reintentar después del refresh del token
        return this.getUnEnrolledStudents();
      }
      
      // Método alternativo si falla el endpoint principal
      console.warn('⚠️ Endpoint /not-enrolled falló, intentando método alternativo:', error.message);
      
      try {
        console.log('🔄 Intentando obtener estudiantes no matriculados desde todos los estudiantes...');
        const allStudentsResult = await this.getAllStudents();
        
        if (allStudentsResult.success) {
          console.log(`📊 Procesando ${allStudentsResult.data.length} estudiantes para filtrar no matriculados...`);
          const unEnrolledStudents = allStudentsResult.data.filter(student => 
            student.status === 'ACTIVE' && (!student.isEnrolled || student.isEnrolled === false)
          );
          
          console.log(`✅ Encontrados ${unEnrolledStudents.length} estudiantes no matriculados (de ${allStudentsResult.data.length} totales) usando filtro alternativo`);
          
          return {
            success: true,
            data: unEnrolledStudents,
            metadata: { total: unEnrolledStudents.length },
            message: 'Estudiantes no matriculados obtenidos exitosamente (método alternativo)'
          };
        } else {
          console.error('❌ Falló también el método alternativo para obtener todos los estudiantes');
        }
      } catch (alternativeError) {
        console.error('❌ También falló el método alternativo:', alternativeError);
      }
      
      console.error('❌ Error al obtener estudiantes no matriculados:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes no matriculados',
        data: []
      };
    }
  }

  /**
   * Crea un nuevo estudiante con valores por defecto
   */
  createNewStudent() {
    return {
      ...Student,
      createdAt: new Date().toISOString()
    };
  }
}

export default new StudentService();