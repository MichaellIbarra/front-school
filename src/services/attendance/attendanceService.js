import { 
  Student, 
  Justification,
  validateJustification 
} from '../../types/attendance';
import { refreshTokenKeycloak } from '../../auth/authService';

class AttendanceService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1`;
    this.studentsURL = `${this.baseURL}/students`;
    this.attendancesURL = `${this.baseURL}/attendances`;
    this.justificationsURL = `${this.baseURL}/justifications`;
    this.isDevelopment = process.env.REACT_APP_ENVIRONMENT === 'development';
    this.useMockData = false; // Se activará automáticamente si falla la conexión
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
   * Genera datos mock para desarrollo cuando la API no está disponible
   */
  getMockStudents(type = 'absent') {
    const mockStudents = [
      {
        studentEnrollmentId: 'EST001',
        studentName: 'Juan Carlos Pérez',
        email: 'juan.perez@email.com',
        phone: '987654321',
        entryDate: new Date().toISOString(),
        observations: 'Falta justificada por motivos médicos'
      },
      {
        studentEnrollmentId: 'EST002', 
        studentName: 'María Elena García',
        email: 'maria.garcia@email.com',
        phone: '987654322',
        entryDate: new Date().toISOString(),
        observations: 'Ausencia sin justificar'
      },
      {
        studentEnrollmentId: 'EST003',
        studentName: 'Carlos Roberto Silva',
        email: 'carlos.silva@email.com', 
        phone: '987654323',
        entryDate: new Date().toISOString(),
        observations: 'Presente en clase'
      },
      {
        studentEnrollmentId: 'EST004',
        studentName: 'Ana Isabel Rodríguez',
        email: 'ana.rodriguez@email.com',
        phone: '987654324', 
        entryDate: new Date().toISOString(),
        observations: 'Tardanza justificada'
      }
    ];

    // Filtrar según el tipo de búsqueda
    if (type === 'present') {
      return mockStudents.filter(s => s.observations.includes('Presente') || s.observations.includes('Tardanza'));
    } else if (type === 'absent') {
      return mockStudents.filter(s => s.observations.includes('Falta') || s.observations.includes('Ausencia'));
    }
    
    return mockStudents; // Retornar todos si no se especifica tipo
  }

  /**
   * Genera datos mock de estudiantes locales para crear asistencias
   */
  getMockLocalStudents() {
    return [
      {
        id: '1',
        name: 'Juan Carlos Pérez',
        enrollmentId: 'EST001',
        dni: '12345678',
        email: 'juan.perez@email.com',
        phone: '987654321',
        grade: '5to Secundaria',
        section: 'A'
      },
      {
        id: '2',
        name: 'María Elena García',
        enrollmentId: 'EST002',
        dni: '12345679',
        email: 'maria.garcia@email.com',
        phone: '987654322',
        grade: '5to Secundaria',
        section: 'A'
      },
      {
        id: '3',
        name: 'Carlos Roberto Silva',
        enrollmentId: 'EST003',
        dni: '12345680',
        email: 'carlos.silva@email.com',
        phone: '987654323',
        grade: '5to Secundaria',
        section: 'B'
      },
      {
        id: '4',
        name: 'Ana Isabel Rodríguez',
        enrollmentId: 'EST004',
        dni: '12345681',
        email: 'ana.rodriguez@email.com',
        phone: '987654324',
        grade: '5to Secundaria',
        section: 'B'
      },
      {
        id: '5',
        name: 'Pedro Miguel Torres',
        enrollmentId: 'EST005',
        dni: '12345682',
        email: 'pedro.torres@email.com',
        phone: '987654325',
        grade: '4to Secundaria',
        section: 'A'
      }
    ];
  }

  /**
   * Genera justificaciones mock
   */
  getMockJustifications() {
    return [
      {
        id: 1,
        attendanceId: 'EST001',
        justificationType: 'MEDICAL',
        justificationReason: 'Cita médica programada con especialista',
        submissionDate: new Date().toISOString(),
        submittedBy: 'Padre de familia',
        approvalStatus: 'PENDING',
        approvalComments: '',
        approvedBy: '',
        approvalDate: '',
        isActive: true
      },
      {
        id: 2,
        attendanceId: 'EST002',
        justificationType: 'FAMILY_EMERGENCY',
        justificationReason: 'Emergencia familiar requería atención inmediata',
        submissionDate: new Date().toISOString(),
        submittedBy: 'Estudiante',
        approvalStatus: 'APPROVED',
        approvalComments: 'Justificación válida',
        approvedBy: 'Director Académico',
        approvalDate: new Date().toISOString(),
        isActive: true
      }
    ];
  }

  /**
   * Maneja errores de conexión y activa modo mock si es necesario
   */
  async handleConnectionError(error, methodName) {
    console.warn(`🔌 Error de conexión en ${methodName}:`, error.message);
    
    if (this.isDevelopment && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      console.log('🔄 Activando modo de desarrollo con datos mock...');
      this.useMockData = true;
      return true; // Indica que se debe usar datos mock
    }
    
    return false; // No usar datos mock
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

  // ============= MÉTODOS PARA ESTUDIANTES =============

  /**
   * Obtiene estudiantes locales para crear asistencias
   * GET /api/v1/sync/students/local
   */
  async getLocalStudents() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/sync/students/local`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        // Transformar los datos al formato esperado por el componente
        const transformedData = (result.data || []).map(student => ({
          id: student.id || student.studentEnrollmentId,
          name: student.studentName || student.name,
          enrollmentId: student.studentEnrollmentId || student.enrollmentId,
          dni: student.dni || student.studentEnrollmentId, // Usar enrollmentId como DNI si no hay DNI
          email: student.email || '',
          phone: student.phone || '',
          grade: student.grade || '',
          section: student.section || ''
        }));
        
        return {
          success: true,
          data: transformedData,
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes locales obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes locales:', error);
      
      // Verificar si es error de conexión y activar modo mock
      const shouldUseMock = await this.handleConnectionError(error, 'getLocalStudents');
      
      if (shouldUseMock) {
        const mockData = this.getMockLocalStudents();
        return {
          success: true,
          data: mockData,
          metadata: { message: '📡 Modo desarrollo: Datos de prueba cargados' },
          message: `📡 Modo desarrollo: Se encontraron ${mockData.length} estudiante(s) local(es) (datos de prueba)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes locales',
        data: []
      };
    }
  }

  /**
   * Crea una nueva asistencia
   * POST /api/v1/attendances
   */
  async createAttendance(attendanceData) {
    try {
      if (!attendanceData.studentEnrollmentId || !attendanceData.entryDate) {
        throw new Error('Student Enrollment ID y fecha son requeridos para crear asistencia');
      }

      const currentDateTime = new Date();
      const currentTime = currentDateTime.toTimeString().split(' ')[0] + '.' + currentDateTime.getMilliseconds();
      
      const payload = {
        studentEnrollmentId: attendanceData.studentEnrollmentId,
        studentName: attendanceData.studentName,
        entryDate: attendanceData.entryDate,
        entryTime: currentTime,
        registeredBy: attendanceData.registeredBy || 'USUARIO_MANUAL',
        observations: attendanceData.observations || '',
        registrationMethod: attendanceData.registrationMethod || 'MANUAL',
        entryTimestamp: currentDateTime.toISOString(),
        deviceInfo: attendanceData.deviceInfo || `IP: ${window.location.hostname}, Agent: ${navigator.userAgent}`
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.attendancesURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Asistencia creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear asistencia:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la asistencia'
      };
    }
  }

  /**
   * Actualiza una asistencia existente
   * PUT /api/v1/attendances/{id}
   */
  async updateAttendance(id, attendanceData) {
    try {
      if (!id) {
        throw new Error('ID de asistencia requerido');
      }

      const payload = {
        entryDate: attendanceData.entryDate,
        attendanceStatus: attendanceData.attendanceStatus,
        observations: attendanceData.observations || '',
        registrationMethod: attendanceData.registrationMethod || 'MANUAL'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.attendancesURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Asistencia actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar asistencia:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la asistencia'
      };
    }
  }

  // ============= MÉTODOS PARA ESTUDIANTES AUSENTES =============

  /**
   * Obtiene estudiantes ausentes por fecha
   * GET /api/v1/students/by-attendance-status?status=no&date={date}
   */
  async getAbsentStudentsByDate(date) {
    try {
      if (!date) {
        throw new Error('Fecha requerida');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(
          `${this.studentsURL}/by-attendance-status?status=no&date=${date}`,
          {
            method: 'GET',
            headers: this.getAuthHeaders()
          }
        );

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes ausentes obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes ausentes por fecha:', error);
      
      // Verificar si es error de conexión y activar modo mock
      const shouldUseMock = await this.handleConnectionError(error, 'getAbsentStudentsByDate');
      
      if (shouldUseMock) {
        const mockData = this.getMockStudents('absent');
        return {
          success: true,
          data: mockData,
          metadata: { message: '📡 Modo desarrollo: Datos de prueba cargados' },
          message: `📡 Modo desarrollo: Se encontraron ${mockData.length} estudiante(s) ausente(s) (datos de prueba)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes ausentes',
        data: []
      };
    }
  }

  /**
   * Obtiene todos los estudiantes ausentes/elegibles
   * GET /api/v1/students/absent
   */
  async getAllAbsentStudents() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.studentsURL}/absent`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes elegibles obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes elegibles:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes elegibles',
        data: []
      };
    }
  }

  /**
   * Obtiene estudiantes marcados automáticamente como ausentes
   * GET /api/v1/attendances/automatically-marked-absent?date={date}
   */
  async getAutomaticallyMarkedAbsent(date) {
    try {
      let url = `${this.attendancesURL}/automatically-marked-absent`;
      if (date && date.trim()) {
        url += `?date=${date}`;
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes marcados automáticamente obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes marcados automáticamente:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes marcados automáticamente',
        data: []
      };
    }
  }

  /**
   * Obtiene estudiantes que faltaron
   * GET /api/v1/attendances/faltaron?date={date}
   */
  async getStudentsWhoMissed(date = '') {
    try {
      let url = `${this.attendancesURL}/faltaron`;
      if (date && date.trim()) {
        url += `?date=${date}`;
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes que faltaron obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes que faltaron:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estudiantes que faltaron',
        data: []
      };
    }
  }

  // ============= MÉTODOS PARA JUSTIFICACIONES =============

  /**
   * Crea una nueva justificación
   * POST /api/v1/justifications
   */
  async createJustification(justificationData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateJustification(justificationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de justificación inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload
      const payload = {
        attendanceId: justificationData.attendanceId,
        justificationType: justificationData.justificationType,
        justificationReason: justificationData.justificationReason,
        submissionDate: justificationData.submissionDate || new Date().toISOString(),
        submittedBy: justificationData.submittedBy,
        approvalStatus: justificationData.approvalStatus || 'PENDING',
        approvalComments: justificationData.approvalComments || '',
        supportingDocuments: justificationData.supportingDocuments || []
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.justificationsURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la justificación'
      };
    }
  }

  /**
   * Obtiene todas las justificaciones
   * GET /api/v1/justifications
   */
  async getAllJustifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(this.justificationsURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener justificaciones:', error);
      
      // Verificar si es error de conexión y activar modo mock
      const shouldUseMock = await this.handleConnectionError(error, 'getAllJustifications');
      
      if (shouldUseMock) {
        const mockData = this.getMockJustifications();
        return {
          success: true,
          data: mockData,
          metadata: { message: '📡 Modo desarrollo: Datos de prueba cargados' },
          message: `📡 Modo desarrollo: Se encontraron ${mockData.length} justificación(es) (datos de prueba)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al obtener las justificaciones',
        data: []
      };
    }
  }

  /**
   * Obtiene justificaciones pendientes
   * GET /api/v1/justifications/pending
   */
  async getPendingJustifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/pending`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificaciones pendientes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener justificaciones pendientes:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener justificaciones pendientes',
        data: []
      };
    }
  }

  /**
   * Obtiene justificaciones inactivas/eliminadas
   * GET /api/v1/justifications/inactive
   */
  async getInactiveJustifications() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/inactive`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificaciones eliminadas obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener justificaciones eliminadas:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener justificaciones eliminadas',
        data: []
      };
    }
  }

  /**
   * Actualiza una justificación existente
   * PUT /api/v1/justifications/{id}
   */
  async updateJustification(id, justificationData) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateJustification(justificationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de justificación inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload sin el ID
      const payload = {
        attendanceId: justificationData.attendanceId,
        justificationType: justificationData.justificationType,
        justificationReason: justificationData.justificationReason,
        submissionDate: justificationData.submissionDate,
        submittedBy: justificationData.submittedBy,
        approvalStatus: justificationData.approvalStatus,
        approvalComments: justificationData.approvalComments,
        supportingDocuments: justificationData.supportingDocuments
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la justificación'
      };
    }
  }

  /**
   * Aprueba una justificación
   * PUT /api/v1/justifications/{id}/approve
   */
  async approveJustification(id, approvalData) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      const payload = {
        approvedBy: approvalData.approvedBy,
        approvalComments: approvalData.approvalComments || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}/approve`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación aprobada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al aprobar justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al aprobar la justificación'
      };
    }
  }

  /**
   * Rechaza una justificación
   * PUT /api/v1/justifications/{id}/reject
   */
  async rejectJustification(id, rejectionData) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      const payload = {
        approvedBy: rejectionData.approvedBy,
        approvalComments: rejectionData.approvalComments || ''
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}/reject`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación rechazada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al rechazar justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al rechazar la justificación'
      };
    }
  }

  /**
   * Elimina una justificación
   * DELETE /api/v1/justifications/{id}
   */
  async deleteJustification(id) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la justificación'
      };
    }
  }

  /**
   * Restaura una justificación eliminada
   * POST /api/v1/justifications/{id}/restore
   */
  async restoreJustification(id) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}/restore`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar justificación:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la justificación'
      };
    }
  }

  /**
   * Obtiene una justificación específica por ID
   * GET /api/v1/justifications/{id}
   */
  async getJustificationById(id) {
    try {
      if (!id) {
        throw new Error('ID de justificación requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || null,
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificación obtenida exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener justificación por ID:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la justificación'
      };
    }
  }

  /**
   * Obtiene justificaciones por ID de asistencia
   * GET /api/v1/justifications/attendance/{attendanceId}
   */
  async getJustificationsByAttendanceId(attendanceId) {
    try {
      if (!attendanceId) {
        throw new Error('ID de asistencia requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.justificationsURL}/attendance/${attendanceId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Justificaciones por asistencia obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener justificaciones por ID de asistencia:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener justificaciones por asistencia'
      };
    }
  }

  // ==========================================
  // MÉTODOS PARA LISTADO DE ASISTENCIAS
  // ==========================================

  /**
   * Obtiene todas las asistencias (presentes y ausentes)
   * @param {string} date - Fecha opcional para filtrar
   * @returns {Promise<Object>} - Respuesta con lista de asistencias
   */
  async getAllAttendances(date = null) {
    try {
      let url = this.attendancesURL; // Usar endpoint base /attendances
      if (date) {
        url += `?date=${date}`;
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Asistencias obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener todas las asistencias:', error);
      
      // Verificar si es error de conexión y activar modo mock
      const shouldUseMock = await this.handleConnectionError(error, 'getAllAttendances');
      
      if (shouldUseMock) {
        const mockData = this.getMockStudents('all'); // Todos los estudiantes
        return {
          success: true,
          data: mockData,
          metadata: { message: '📡 Modo desarrollo: Datos de prueba cargados' },
          message: `📡 Modo desarrollo: Se encontraron ${mockData.length} registro(s) de asistencia (datos de prueba)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al cargar las asistencias'
      };
    }
  }

  /**
   * Obtiene estudiantes presentes por fecha
   * @param {string} date - Fecha para filtrar
   * @returns {Promise<Object>} - Respuesta con lista de estudiantes presentes
   */
  async getPresentStudentsByDate(date) {
    try {
      if (!date) {
        throw new Error('Fecha requerida para obtener estudiantes presentes');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.attendancesURL}/present?date=${date}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Estudiantes presentes obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener estudiantes presentes:', error);
      
      // Verificar si es error de conexión y activar modo mock
      const shouldUseMock = await this.handleConnectionError(error, 'getPresentStudentsByDate');
      
      if (shouldUseMock) {
        const mockData = this.getMockStudents('present');
        return {
          success: true,
          data: mockData,
          metadata: { message: '📡 Modo desarrollo: Datos de prueba cargados' },
          message: `📡 Modo desarrollo: Se encontraron ${mockData.length} estudiante(s) presente(s) (datos de prueba)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al cargar estudiantes presentes'
      };
    }
  }

  /**
   * Obtiene reporte de asistencias con estadísticas
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @returns {Promise<Object>} - Respuesta con reporte detallado
   */
  async getAttendanceReport(startDate, endDate) {
    try {
      let url = `${this.attendancesURL}/report`;
      const params = [];
      
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Reporte de asistencias generado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener reporte de asistencias:', error);
      return {
        success: false,
        error: error.message || 'Error al generar reporte de asistencias'
      };
    }
  }

  /**
   * Obtiene estadísticas generales de asistencias
   * @returns {Promise<Object>} - Respuesta con estadísticas generales
   */
  async getAttendanceStatistics() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.attendancesURL}/statistics`, {
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
      console.error('Error al obtener estadísticas de asistencias:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar estadísticas'
      };
    }
  }

  /**
   * Crea una nueva justificación con valores por defecto
   */
  createNewJustification(attendanceId = '') {
    return {
      ...Justification,
      attendanceId,
      submissionDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Crea un nuevo estudiante con valores por defecto
   */
  createNewStudent() {
    return {
      ...Student,
      entryDate: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Marca las ausencias automáticamente para una fecha específica
   * POST /api/v1/absences/mark-for-date?date={date}
   */
  async markAbsencesForDate(date) {
    try {
      if (!date) {
        throw new Error('La fecha es requerida para marcar ausencias');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/absences/mark-for-date?date=${date}`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || {},
          metadata: result.metadata,
          message: result.metadata?.message || `Ausencias marcadas exitosamente para ${date}`
        };
      });
    } catch (error) {
      console.error('Error al marcar ausencias para la fecha:', error);
      
      // En caso de error, devolver datos mock para desarrollo
      if (this.isDevelopment) {
        return {
          success: true,
          data: {
            markedAbsences: 5,
            date: date,
            studentsMarked: ['EST001', 'EST002', 'EST003', 'EST004', 'EST005']
          },
          metadata: { message: '📡 Modo desarrollo: Ausencias marcadas (simulado)' },
          message: `Ausencias marcadas exitosamente para ${date} (modo desarrollo)`
        };
      }
      
      return {
        success: false,
        error: error.message || 'Error al marcar ausencias',
        data: null
      };
    }
  }
}

export default new AttendanceService();