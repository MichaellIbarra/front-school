import { Student, validateStudent, formatDateForBackend } from '../../types/students/students';
import { refreshTokenKeycloak } from '../auth/authService';

class StudentService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_STUDENTS_API_URL}`;
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
    // Normalizar role en lowercase para compatibilidad con backend
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
        // Si la respuesta no es OK, pero es JSON, usar el mensaje del backend
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        throw error; // Re-lanzar la señal especial
      }
      
      // Si hay un error de parsing JSON o la respuesta no es JSON
      if (!response.ok) {
        // Si la respuesta no es OK y no es JSON, o hubo error de parsing, usar el status
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
   * Crea un nuevo estudiante
   * POST /students/secretary/create
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

      // Crear el payload con la nueva estructura
      const payload = {
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        documentType: studentData.documentType || 'DNI',
        documentNumber: studentData.documentNumber || '',
        birthDate: formatDateForBackend(studentData.birthDate),
        gender: studentData.gender || 'MALE',
        address: studentData.address || '',
        phone: studentData.phone || '',
        parentName: studentData.parentName || '',
        parentPhone: studentData.parentPhone || '',
        parentEmail: studentData.parentEmail || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${process.env.REACT_APP_STUDENTS_API_URL}/students/secretary/create`, {
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
   * Obtiene un estudiante por su ID
   * GET /students/secretary/{id}
   */
  async getStudentById(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/students/secretary/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiante obtenido exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiante por ID:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el estudiante',
        data: null
      };
    }
  }

  /**
   * Actualiza un estudiante existente
   * PUT /students/secretary/update/{id}
   */
  async updateStudent(id, studentData) {
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

      // Crear el payload con la nueva estructura
      const payload = {
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        documentType: studentData.documentType || 'DNI',
        documentNumber: studentData.documentNumber || '',
        birthDate: formatDateForBackend(studentData.birthDate),
        gender: studentData.gender || 'MALE',
        address: studentData.address || '',
        phone: studentData.phone || '',
        parentName: studentData.parentName || '',
        parentPhone: studentData.parentPhone || '',
        parentEmail: studentData.parentEmail || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/students/secretary/update/${id}`, {
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
   * Obtiene estudiantes por aula
   * GET /students/secretary/by-classroom/{classroomId}
   */
  async getStudentsByClassroom(classroomId) {
    try {
      if (!classroomId) {
        throw new Error('ID de aula requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${process.env.REACT_APP_STUDENTS_API_URL}/students/secretary/by-classroom/${classroomId}`, {
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
      console.error('Error al obtener estudiantes por aula:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los estudiantes',
        data: []
      };
    }
  }

  /**
   * Obtiene todos los estudiantes de la institución del usuario
   * GET /students/secretary
   */
  async getStudentsByInstitution() {
    try {
      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/students/secretary`;
        console.log('[DEBUG] Requesting students from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        // Normalizar estructuras posibles de respuesta:
        // - { success: true, data: [...] }
        // - { success: true, data: { data: [...] , total } }
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
          message: result.metadata?.message || result.message || 'Estudiantes obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes por institución:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los estudiantes',
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
        console.log('[DEBUG] Requesting classrooms from URL (via studentService):', url);
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
      console.error('Error al obtener aulas (studentService):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las aulas',
        data: []
      };
    }
  }

  /**
   * Obtiene estudiantes no matriculados
   * GET /students/secretary/unenrolled
   */
  async getUnenrolledStudents() {
    try {
      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/students/secretary/unenrolled`;
        console.log('[DEBUG] Requesting unenrolled students from URL:', url);
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
          message: result.message || 'Estudiantes no matriculados obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes no matriculados:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los estudiantes no matriculados',
        data: []
      };
    }
  }

  /**
   * Crea múltiples estudiantes de forma masiva
   * POST /students/secretary/bulk-create
   */
  async bulkCreateStudents(studentsData) {
    try {
      if (!Array.isArray(studentsData) || studentsData.length === 0) {
        return {
          success: false,
          error: 'Se requiere un array de estudiantes válido'
        };
      }

      // Validar cada estudiante
      const validationErrors = [];
      const validStudents = [];

      studentsData.forEach((student, index) => {
        const validation = validateStudent(student);
        if (!validation.isValid) {
          validationErrors.push(`Estudiante ${index + 1}: ${validation.errors.join(', ')}`);
        } else {
          // Construir objeto de estudiante en el formato exacto del backend
          const studentPayload = {
            firstName: student.firstName?.trim(),
            lastName: student.lastName?.trim(),
            documentType: student.documentType || 'DNI',
            documentNumber: student.documentNumber?.trim(),
            birthDate: student.birthDate, // Formato yyyy-mm-dd esperado
            gender: student.gender,
            address: student.address?.trim(),
            parentName: student.parentName?.trim()
          };

          // Agregar campos opcionales solo si tienen valor
          if (student.phone?.trim()) {
            studentPayload.phone = student.phone.trim();
          }
          if (student.parentPhone?.trim()) {
            studentPayload.parentPhone = student.parentPhone.trim();
          }
          if (student.parentEmail?.trim()) {
            studentPayload.parentEmail = student.parentEmail.trim();
          }

          // Si no hay parentName pero hay guardianName/guardianLastName, usar esos
          if (!studentPayload.parentName && (student.guardianName || student.guardianLastName)) {
            studentPayload.parentName = `${student.guardianName || ''} ${student.guardianLastName || ''}`.trim();
          }
          
          // Si no hay parentPhone pero hay guardianPhone, usar ese
          if (!studentPayload.parentPhone && student.guardianPhone) {
            studentPayload.parentPhone = student.guardianPhone.trim();
          }
          
          // Si no hay parentEmail pero hay guardianEmail, usar ese
          if (!studentPayload.parentEmail && student.guardianEmail) {
            studentPayload.parentEmail = student.guardianEmail.trim();
          }

          validStudents.push(studentPayload);
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
        students: validStudents
      };

      console.log('Payload enviado al servidor:', payload); // Debug
      console.log('URL completa:', `${this.baseURL}/students/secretary/bulk-create`); // Debug

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/students/secretary/bulk-create`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        console.log('Status de respuesta:', response.status); // Debug

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
          message: result.metadata?.message || result.message || 'Estudiantes creados exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear estudiantes masivamente:', error);
      return {
        success: false,
        error: error.message || 'Error al crear los estudiantes'
      };
    }
  }

  /**
   * Obtiene estudiantes por estado
   * GET /students/secretary/by-status/{status}
   */
  async getStudentsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Estado requerido');
      }

      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/students/secretary/by-status/${status}`;
        console.log('[DEBUG] Requesting students by status from URL:', url);
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
          message: result.message || `Estudiantes con estado ${status} obtenidos exitosamente`
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes por estado:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los estudiantes por estado',
        data: []
      };
    }
  }

  /**
   * Obtiene estadísticas de estudiantes
   * GET /students/secretary/statistics
   */
  async getStudentStatistics() {
    try {
      return await this.executeWithRetry(async () => {
        const url = `${this.baseURL}/students/secretary/statistics`;
        console.log('[DEBUG] Requesting student statistics from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          metadata: result.metadata,
          message: result.message || 'Estadísticas de estudiantes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de estudiantes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las estadísticas de estudiantes',
        data: {}
      };
    }
  }

  /**
   * Activa un estudiante
   * PUT /students/secretary/activate/{id}
   */
  async activateStudent(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/students/secretary/activate/${id}`, {
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
          message: result.metadata?.message || result.message || 'Estudiante activado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al activar estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al activar el estudiante'
      };
    }
  }

  /**
   * Desactiva un estudiante
   * PUT /students/secretary/deactivate/{id}
   */
  async deactivateStudent(id) {
    try {
      if (!id) {
        throw new Error('ID de estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/students/secretary/deactivate/${id}`, {
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
          message: result.metadata?.message || result.message || 'Estudiante desactivado exitosamente'
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