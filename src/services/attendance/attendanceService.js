import { refreshTokenKeycloak } from '../auth/authService';

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
   * Determina si un estudiante está ausente basándose en observaciones y estado
   * @param {Object} student - Objeto del estudiante con información de asistencia
   * @returns {boolean} - true si el estudiante está ausente
   */
  isStudentAbsent(student) {
    if (!student) return false;
    
    const observations = (student.observations || '').toLowerCase();
    
    // PRIORIDAD 1: Verificar palabras clave de ausencia en observaciones
    const absentKeywords = ['falto', 'faltó', 'ausente', 'no asistio', 'no asistió', 'no registr', 'no registro', 'no vino', 'inasistencia'];
    if (absentKeywords.some(keyword => observations.includes(keyword))) {
      return true;
    }
    
    // PRIORIDAD 2: Verificar el campo de estado explícito
    const status = (student.attendanceStatus || student.status || '').toUpperCase();
    if (status === 'ABSENT' || status === 'AUSENTE') {
      return true;
    }
    
    // PRIORIDAD 3: Si es registro automático sin hora de entrada, probablemente ausente
    const registrationMethod = (student.registrationMethod || '').toUpperCase();
    if (registrationMethod === 'AUTOMATIC' && !student.entryTime) {
      return true;
    }
    
    return false;
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
      // 1° Secundaria - Sección A
      {
        id: 1,
        studentEnrollmentId: '23343445',
        studentName: 'Alexis Huapaya Martínez Ruiz',
        email: 'alexis.huapaya@email.com',
        phone: '987654301',
        grade: '1',
        section: 'A',
        course: 'Matemáticas',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT', // Inconsistente a propósito para testing
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 2,
        studentEnrollmentId: '29290909',
        studentName: 'Ana María Carla López García',
        email: 'ana.lopez@email.com',
        phone: '987654302',
        grade: '1',
        section: 'A',
        course: 'Matemáticas',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      // 1° Secundaria - Sección B
      {
        id: 3,
        studentEnrollmentId: '66778899',
        studentName: 'Camila Vargas Flores',
        email: 'camila.vargas@email.com',
        phone: '987654303',
        grade: '1',
        section: 'B',
        course: 'Comunicación',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 4,
        studentEnrollmentId: '90202022',
        studentName: 'Carla Andreaa',
        email: 'carla.andreaa@email.com',
        phone: '987654304',
        grade: '1',
        section: 'B',
        course: 'Comunicación',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      // 2° Secundaria - Sección A
      {
        id: 5,
        studentEnrollmentId: '23456789',
        studentName: 'Diego Andrés Castillo Ramos',
        email: 'diego.castillo@email.com',
        phone: '987654305',
        grade: '2',
        section: 'A',
        course: 'Ciencias',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 6,
        studentEnrollmentId: '99001122',
        studentName: 'Emilio Cruz Huamán',
        email: 'emilio.cruz@email.com',
        phone: '987654306',
        grade: '2',
        section: 'A',
        course: 'Ciencias',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      // 2° Secundaria - Sección B
      {
        id: 7,
        studentEnrollmentId: '12123434',
        studentName: 'Fabricio Huapaya Ramírez Torres',
        email: 'fabricio.ramirez@email.com',
        phone: '987654307',
        grade: '2',
        section: 'B',
        course: 'Historia',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 8,
        studentEnrollmentId: '55667788',
        studentName: 'Gabriel Salazar Chávez',
        email: 'gabriel.salazar@email.com',
        phone: '987654308',
        grade: '2',
        section: 'B',
        course: 'Historia',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      // 3° Secundaria - Sección A
      {
        id: 9,
        studentEnrollmentId: '78901234',
        studentName: 'Ibarra Rojas González Pérez',
        email: 'ibarra.rojas@email.com',
        phone: '987654309',
        grade: '3',
        section: 'A',
        course: 'Física',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 10,
        studentEnrollmentId: '14151617',
        studentName: 'Isabella Pamelaa Morales Peña',
        email: 'isabella.morales@email.com',
        phone: '987654310',
        grade: '3',
        section: 'A',
        course: 'Física',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:26:50',
        observations: 'falto',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'AUTOMATIC'
      },
      {
        id: 11,
        studentEnrollmentId: '88990011',
        studentName: 'Mariana Paredes León',
        email: 'mariana.paredes@email.com',
        phone: '987654311',
        grade: '3',
        section: 'A',
        course: 'Química',
        entryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        entryTime: '17:19:59',
        observations: 'falto',
        attendanceStatus: 'ABSENT',
        registrationMethod: 'AUTOMATIC'
      },
      // Estudiantes presentes de hoy
      {
        id: 12,
        studentEnrollmentId: '11223344',
        studentName: 'Pedro Luis Fernández',
        email: 'pedro.fernandez@email.com',
        phone: '987654312',
        grade: '1',
        section: 'A',
        course: 'Matemáticas',
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '08:15:00',
        observations: 'Presente',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'MANUAL'
      },
      {
        id: 13,
        studentEnrollmentId: '22334455',
        studentName: 'Sofía Valentina Torres',
        email: 'sofia.torres@email.com',
        phone: '987654313',
        grade: '2',
        section: 'A',
        course: 'Ciencias',
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '08:20:00',
        observations: 'Presente',
        attendanceStatus: 'PRESENT',
        registrationMethod: 'BIOMETRIC'
      }
    ];

    // Filtrar según el tipo de búsqueda
    if (type === 'present') {
      return mockStudents.filter(s => 
        !this.isStudentAbsent(s) && 
        s.entryDate === new Date().toISOString().split('T')[0]
      );
    } else if (type === 'absent') {
      return mockStudents.filter(s => this.isStudentAbsent(s));
    }
    
    return mockStudents; // Retornar todos si no se especifica tipo
  }

  /**
   * Asigna automáticamente datos académicos a estudiantes que no los tienen
   * Distribuye equitativamente entre grados, secciones y cursos
   * Los estudiantes del mismo grado y sección tendrán el mismo curso
   */
  assignAcademicData(students) {
    const grades = ['1', '2', '3'];
    const sections = ['A', 'B'];
    const courses = ['Matemáticas', 'Comunicación', 'Ciencias', 'Historia', 'Física', 'Química'];
    
    // Mapa para asignar cursos por grado+sección
    // Cada combinación de grado-sección tendrá un curso específico
    const gradeSectionCourses = {
      '1-A': 'Matemáticas',
      '1-B': 'Comunicación',
      '2-A': 'Ciencias',
      '2-B': 'Historia',
      '3-A': 'Física',
      '3-B': 'Química'
    };
    
    let gradeIndex = 0;
    let sectionIndex = 0;
    
    return students.map(student => {
      // Si ya tiene datos académicos completos, no modificar
      if (student.grade && student.section && student.course) {
        return student;
      }
      
      // Asignar grado y sección de forma rotativa
      const assignedGrade = student.grade || grades[gradeIndex % grades.length];
      const assignedSection = student.section || sections[sectionIndex % sections.length];
      
      // Asignar curso basado en la combinación grado-sección
      const gradeSecKey = `${assignedGrade}-${assignedSection}`;
      const assignedCourse = student.course || gradeSectionCourses[gradeSecKey] || courses[0];
      
      // Rotar índices para distribuir equitativamente
      gradeIndex++;
      if (gradeIndex % grades.length === 0) sectionIndex++;
      
      return {
        ...student,
        grade: assignedGrade,
        section: assignedSection,
        course: assignedCourse
      };
    });
  }

  /**
   * Genera datos mock de estudiantes locales para crear asistencias
   */
  getMockLocalStudents() {
    return [
      // 1° Secundaria - Sección A
      {
        id: '1',
        name: 'Alexis Huapaya Martínez Ruiz',
        enrollmentId: '23343445',
        dni: '76543210',
        email: 'alexis.huapaya@email.com',
        phone: '987654301',
        grade: '1',
        section: 'A',
        course: 'Matemáticas'
      },
      {
        id: '2',
        name: 'Ana María Carla López García',
        enrollmentId: '29290909',
        dni: '76543211',
        email: 'ana.lopez@email.com',
        phone: '987654302',
        grade: '1',
        section: 'A',
        course: 'Matemáticas'
      },
      {
        id: '3',
        name: 'Pedro Luis Fernández',
        enrollmentId: '11223344',
        dni: '76543212',
        email: 'pedro.fernandez@email.com',
        phone: '987654312',
        grade: '1',
        section: 'A',
        course: 'Comunicación'
      },
      // 1° Secundaria - Sección B
      {
        id: '4',
        name: 'Camila Vargas Flores',
        enrollmentId: '66778899',
        dni: '76543213',
        email: 'camila.vargas@email.com',
        phone: '987654303',
        grade: '1',
        section: 'B',
        course: 'Comunicación'
      },
      {
        id: '5',
        name: 'Carla Andreaa',
        enrollmentId: '90202022',
        dni: '76543214',
        email: 'carla.andreaa@email.com',
        phone: '987654304',
        grade: '1',
        section: 'B',
        course: 'Matemáticas'
      },
      // 2° Secundaria - Sección A
      {
        id: '6',
        name: 'Diego Andrés Castillo Ramos',
        enrollmentId: '23456789',
        dni: '76543215',
        email: 'diego.castillo@email.com',
        phone: '987654305',
        grade: '2',
        section: 'A',
        course: 'Ciencias'
      },
      {
        id: '7',
        name: 'Emilio Cruz Huamán',
        enrollmentId: '99001122',
        dni: '76543216',
        email: 'emilio.cruz@email.com',
        phone: '987654306',
        grade: '2',
        section: 'A',
        course: 'Ciencias'
      },
      {
        id: '8',
        name: 'Sofía Valentina Torres',
        enrollmentId: '22334455',
        dni: '76543217',
        email: 'sofia.torres@email.com',
        phone: '987654313',
        grade: '2',
        section: 'A',
        course: 'Matemáticas'
      },
      // 2° Secundaria - Sección B
      {
        id: '9',
        name: 'Fabricio Huapaya Ramírez Torres',
        enrollmentId: '12123434',
        dni: '76543218',
        email: 'fabricio.ramirez@email.com',
        phone: '987654307',
        grade: '2',
        section: 'B',
        course: 'Historia'
      },
      {
        id: '10',
        name: 'Gabriel Salazar Chávez',
        enrollmentId: '55667788',
        dni: '76543219',
        email: 'gabriel.salazar@email.com',
        phone: '987654308',
        grade: '2',
        section: 'B',
        course: 'Historia'
      },
      // 3° Secundaria - Sección A
      {
        id: '11',
        name: 'Ibarra Rojas González Pérez',
        enrollmentId: '78901234',
        dni: '76543220',
        email: 'ibarra.rojas@email.com',
        phone: '987654309',
        grade: '3',
        section: 'A',
        course: 'Física'
      },
      {
        id: '12',
        name: 'Isabella Pamelaa Morales Peña',
        enrollmentId: '14151617',
        dni: '76543221',
        email: 'isabella.morales@email.com',
        phone: '987654310',
        grade: '3',
        section: 'A',
        course: 'Física'
      },
      {
        id: '13',
        name: 'Mariana Paredes León',
        enrollmentId: '88990011',
        dni: '76543222',
        email: 'mariana.paredes@email.com',
        phone: '987654311',
        grade: '3',
        section: 'A',
        course: 'Química'
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
        
        // Obtener datos mock para referencia de datos académicos
        const mockStudents = this.getMockLocalStudents();
        
        // Transformar y limpiar los datos
        const students = (result.data || [])
          .map(student => {
            // Buscar datos académicos del mock si no vienen del API
            const mockMatch = mockStudents.find(m => 
              m.enrollmentId === (student.studentEnrollmentId || student.enrollmentId) ||
              m.name === (student.studentName || student.name)
            );
            
            return {
              id: student.id || student.studentEnrollmentId,
              name: (student.studentName || student.name || '').trim(),
              enrollmentId: (student.studentEnrollmentId || student.enrollmentId || '').trim(),
              dni: (student.dni || '').trim(),
              email: (student.email || '').trim().toLowerCase(),
              phone: (student.phone || '').trim(),
              // Si no vienen del API, usar datos del mock
              grade: (student.grade || mockMatch?.grade || '').trim(),
              section: (student.section || mockMatch?.section || '').trim(),
              course: (student.course || mockMatch?.course || '').trim()
            };
          })
          .filter(student => student.name && student.enrollmentId) // Eliminar estudiantes sin datos esenciales
          .sort((a, b) => {
            // Ordenar por grado, luego sección, luego nombre
            const gradeCompare = a.grade.localeCompare(b.grade);
            if (gradeCompare !== 0) return gradeCompare;
            
            const sectionCompare = a.section.localeCompare(b.section);
            if (sectionCompare !== 0) return sectionCompare;
            
            return a.name.localeCompare(b.name);
          });

        // Eliminar duplicados por enrollmentId
        const uniqueStudents = students.reduce((acc, current) => {
          const exists = acc.find(item => item.enrollmentId === current.enrollmentId);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Asignar automáticamente datos académicos a estudiantes que no los tienen
        const studentsWithAcademicData = this.assignAcademicData(uniqueStudents);
        
        return {
          success: true,
          data: studentsWithAcademicData,
          metadata: {
            ...result.metadata,
            total: studentsWithAcademicData.length,
            message: result.metadata?.message || `${studentsWithAcademicData.length} estudiante(s) local(es) encontrado(s)`
          },
          message: `${studentsWithAcademicData.length} estudiante(s) local(es) encontrado(s)`
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
          metadata: { 
            total: mockData.length,
            message: '📡 Modo desarrollo: Datos de prueba cargados' 
          },
          message: `📡 Modo desarrollo: ${mockData.length} estudiante(s) local(es) (datos de prueba)`
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

      console.log('📅 getAbsentStudentsByDate - Fecha recibida:', date);

      // Obtener TODAS las asistencias y filtrar manualmente
      const allAttendancesResponse = await this.getAllAttendances();
      
      if (!allAttendancesResponse.success) {
        throw new Error(allAttendancesResponse.error || 'Error al obtener asistencias');
      }
      
      const allAttendances = allAttendancesResponse.data || [];
      console.log('📋 Total de registros:', allAttendances.length);
      
      // Filtrar por fecha Y por ausencia usando el helper
      const absentStudents = allAttendances.filter(student => {
        // Verificar fecha
        const studentDate = student.entryDate || student.date || student.attendanceDate || '';
        const matchesDate = studentDate.startsWith(date);
        
        // Verificar ausencia
        const isAbsent = this.isStudentAbsent(student);
        
        return matchesDate && isAbsent;
      });
      
      console.log('👥 Estudiantes ausentes filtrados:', absentStudents.length);
        
      return {
        success: true,
        data: absentStudents,
        metadata: {
          total: absentStudents.length,
          date: date,
          message: `${absentStudents.length} estudiante(s) ausente(s) encontrado(s) para ${date}`
        },
        message: `Estudiantes ausentes obtenidos exitosamente: ${absentStudents.length}`
      };
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
      // Validar datos básicos
      if (!justificationData.attendanceId || !justificationData.justificationType || !justificationData.justificationReason) {
        return {
          success: false,
          error: 'Datos de justificación inválidos: faltan campos requeridos'
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

      // Validar datos básicos
      if (!justificationData.attendanceId || !justificationData.justificationType || !justificationData.justificationReason) {
        return {
          success: false,
          error: 'Datos de justificación inválidos: faltan campos requeridos'
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
        
        // Obtener datos mock para referencia de datos académicos
        const mockStudents = this.getMockLocalStudents();
        
        // Procesar y limpiar datos de asistencias
        let attendances = (result.data || [])
          .map(attendance => {
            // Buscar datos académicos del mock si no vienen del API
            const mockMatch = mockStudents.find(m => 
              m.enrollmentId === attendance.studentEnrollmentId ||
              m.name === attendance.studentName
            );
            
            return {
              ...attendance,
              // Normalizar nombres de estudiantes
              studentName: attendance.studentName?.trim() || 'Sin nombre',
              // Asegurar que observations existe
              observations: (attendance.observations || '').trim(),
              // Normalizar estado de asistencia
              attendanceStatus: attendance.attendanceStatus || attendance.status || 'UNKNOWN',
              // Asegurar que email existe
              email: (attendance.email || '').trim().toLowerCase(),
              // Formatear fecha
              entryDate: attendance.entryDate || attendance.attendanceDate || attendance.createdAt,
              // Método de registro
              registrationMethod: attendance.registrationMethod || 'UNKNOWN',
              // ID único para deduplicación
              uniqueId: attendance.id || attendance.studentEnrollmentId,
              // Datos académicos (usar mock si no vienen del API)
              grade: (attendance.grade || mockMatch?.grade || '').trim(),
              section: (attendance.section || mockMatch?.section || '').trim(),
              course: (attendance.course || mockMatch?.course || '').trim()
            };
          })
          .filter(attendance => attendance.studentName && attendance.studentName !== 'Sin nombre')
        
        // Deduplicar por ID de matrícula (mantener el más reciente)
        const seenEnrollmentIds = new Map();
        attendances = attendances.filter(attendance => {
          const enrollmentId = attendance.studentEnrollmentId;
          if (!enrollmentId) return true; // Mantener si no tiene ID
          
          const existing = seenEnrollmentIds.get(enrollmentId);
          if (!existing) {
            seenEnrollmentIds.set(enrollmentId, attendance);
            return true;
          }
          
          // Comparar fechas y mantener el más reciente
          const existingDate = new Date(existing.entryDate || 0);
          const currentDate = new Date(attendance.entryDate || 0);
          if (currentDate > existingDate) {
            seenEnrollmentIds.set(enrollmentId, attendance);
            return true;
          }
          
          return false;
        });
        
        // Ordenar
        attendances = attendances
          // Ordenar por fecha (más recientes primero), luego por grado, sección y nombre
          .sort((a, b) => {
            // Primero por fecha (más recientes primero)
            const dateA = new Date(a.entryDate || 0);
            const dateB = new Date(b.entryDate || 0);
            const dateDiff = dateB.getTime() - dateA.getTime();
            if (dateDiff !== 0) return dateDiff;
            
            // Luego por grado
            const gradeA = a.grade || '';
            const gradeB = b.grade || '';
            const gradeDiff = gradeA.localeCompare(gradeB, 'es', { numeric: true });
            if (gradeDiff !== 0) return gradeDiff;
            
            // Luego por sección
            const sectionA = a.section || '';
            const sectionB = b.section || '';
            const sectionDiff = sectionA.localeCompare(sectionB, 'es');
            if (sectionDiff !== 0) return sectionDiff;
            
            // Finalmente por nombre
            const nameA = a.studentName || '';
            const nameB = b.studentName || '';
            return nameA.localeCompare(nameB, 'es');
          });
        
        // Asignar automáticamente datos académicos a estudiantes que no los tienen
        attendances = this.assignAcademicData(attendances);
        
        return {
          success: true,
          data: attendances,
          metadata: {
            ...result.metadata,
            total: attendances.length,
            message: `${attendances.length} asistencia(s) encontrada(s)`
          },
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
        
        // Obtener datos mock para referencia de datos académicos
        const mockStudents = this.getMockLocalStudents();
        
        // Enriquecer datos con información académica del mock
        const enrichedData = (result.data || []).map(student => {
          const mockMatch = mockStudents.find(m => 
            m.enrollmentId === student.studentEnrollmentId ||
            m.name === student.studentName
          );
          
          return {
            ...student,
            grade: student.grade || mockMatch?.grade || '',
            section: student.section || mockMatch?.section || '',
            course: student.course || mockMatch?.course || ''
          };
        });
        
        // Asignar automáticamente datos académicos a estudiantes que no los tienen
        const studentsWithAcademicData = this.assignAcademicData(enrichedData);
        
        return {
          success: true,
          data: studentsWithAcademicData,
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
      attendanceId,
      justificationType: '',
      justificationReason: '',
      submissionDate: new Date().toISOString(),
      submittedBy: '',
      approvalStatus: 'PENDING',
      approvalComments: '',
      supportingDocuments: [],
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Crea un nuevo estudiante con valores por defecto
   */
  createNewStudent() {
    return {
      id: '',
      name: '',
      enrollmentId: '',
      dni: '',
      email: '',
      phone: '',
      grade: '',
      section: '',
      course: '',
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

  // ==========================================
  // MÉTODOS PARA REGISTRO QR DE ASISTENCIAS
  // ==========================================

  /**
   * Registra asistencia mediante escaneo de código QR
   * POST /api/v1/attendances/auxiliary/qr-register
   * @param {Object} qrData - Datos del QR escaneado
   * @param {string} qrData.studentId - UUID del estudiante
   * @param {string} qrData.classroomId - UUID del aula
   * @param {string} attendanceDate - Fecha de registro (YYYY-MM-DD)
   * @param {string} observations - Observaciones opcionales
   * @returns {Promise<Object>} - Respuesta del registro
   */
  async registerAttendanceByQR(qrData, attendanceDate, observations = 'Registro via QR scan') {
    try {
      if (!qrData || !qrData.student_id || !qrData.classroom_id) {
        throw new Error('Datos del QR inválidos. Debe contener student_id y classroom_id');
      }

      if (!attendanceDate) {
        throw new Error('La fecha de asistencia es requerida');
      }

      const payload = {
        studentId: qrData.student_id,
        classroomId: qrData.classroom_id,
        attendanceDate: attendanceDate,
        status: 'P', // Presente por defecto
        observations: observations
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/attendances/auxiliary/qr-register`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || result,
          metadata: result.metadata,
          message: result.metadata?.message || 'Asistencia registrada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al registrar asistencia por QR:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la asistencia'
      };
    }
  }

  /**
   * Obtiene las asistencias de un aula específica por fecha
   * GET /api/v1/attendances/auxiliary/by-classroom/{classroomId}?date={date}
   * @param {string} classroomId - UUID del aula
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} - Lista de asistencias del aula
   */
  async getAttendancesByClassroom(classroomId, date) {
    try {
      if (!classroomId) {
        throw new Error('El ID del aula es requerido');
      }

      if (!date) {
        throw new Error('La fecha es requerida');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(
          `${this.baseURL}/attendances/auxiliary/by-classroom/${classroomId}?date=${date}`,
          {
            method: 'GET',
            headers: this.getAuthHeaders()
          }
        );

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : (result.data || []),
          metadata: result.metadata || { total: result.length || 0 },
          message: 'Asistencias del aula obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener asistencias del aula:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las asistencias del aula',
        data: []
      };
    }
  }

  /**
   * Valida los datos del código QR
   * @param {string} qrCode - Código QR escaneado en formato JSON string
   * @returns {Object|null} - Datos parseados o null si son inválidos
   */
  /**
   * Valida los datos del código QR (versión simplificada y optimizada)
   * @param {string} qrCode - Código QR escaneado en formato JSON string
   * @returns {Object|null} - Datos parseados o null si son inválidos
   */
  validateQRCode(qrCode) {
    // Verificación básica de entrada
    if (!qrCode || typeof qrCode !== 'string' || qrCode.trim() === '') {
      return null;
    }

    try {
      // Parsear JSON
      const data = JSON.parse(qrCode.trim());
      
      // Verificar estructura básica
      if (!data || typeof data !== 'object') {
        return null;
      }

      // Verificar campos requeridos
      if (!data.student_id || !data.classroom_id) {
        return null;
      }

      // Validar que sean strings válidos
      if (typeof data.student_id !== 'string' || typeof data.classroom_id !== 'string') {
        return null;
      }

      // Retornar datos limpios
      return {
        student_id: data.student_id.trim(),
        classroom_id: data.classroom_id.trim(),
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error validando QR:', error.message);
      return null;
    }
  }
}

export default new AttendanceService();