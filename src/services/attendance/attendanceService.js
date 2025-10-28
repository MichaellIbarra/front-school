import { refreshTokenKeycloak } from '../auth/authService';

class AttendanceService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/attendances`;
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
          console.log('✅ Token refrescado exitosamente');
          // Lanzar señal especial para reintentar la petición
          throw new Error('TOKEN_REFRESHED');
        } else {
          console.log('❌ Error en refresh del token:', refreshResult.error);
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          
          // Redirigir al login después de un breve delay
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
        // Extraer mensaje de error más específico del backend
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        console.error('🚨 Error del backend:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          fullData: data,
          url: response.url
        });
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        throw error; // Re-lanzar la señal especial
      }
      
      // Error de parsing JSON
      if (!response.ok) {
        const statusMessage = `Error del servidor (${response.status}): ${error.message || 'Respuesta no válida'}`;
        console.error('🚨 Error de respuesta:', statusMessage);
        throw new Error(statusMessage);
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

  // ==========================================
  // MÉTODOS PARA LISTADO DE ASISTENCIAS
  // ==========================================

  /**
   * Obtiene las asistencias de un aula específica por fecha
   * GET /api/v1/attendances/auxiliary/by-classroom/{classroomId}?date={date}
   * @param {string} classroomId - UUID del aula
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} - Lista de asistencias del aula
   */
  async getAttendancesByClassroom(classroomId, date) {
    try {
      console.log(`📤 Obteniendo asistencias del aula ${classroomId} para fecha ${date}`);
      
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/by-classroom/${classroomId}?date=${date}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        console.log('📥 Asistencias obtenidas:', result);
        
        // El backend devuelve directamente un array, no un objeto con propiedad data
        const attendances = Array.isArray(result) ? result : (result.data || []);
        
        return {
          success: true,
          message: 'Asistencias cargadas exitosamente',
          data: attendances
        };
      });

    } catch (error) {
      console.error('❌ Error al obtener asistencias del aula:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las asistencias del aula',
        data: []
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
      console.log('📤 Registrando asistencia por QR:', { qrData, attendanceDate, observations });

      // Importar dinámicamente para evitar dependencias circulares
      const { getCurrentShift } = await import('../../utils/attendance');
      
      // Obtener el estado automático basado en el horario institucional
      const shiftInfo = getCurrentShift();
      const automaticStatus = shiftInfo.status || 'P';
      
      console.log('⏰ Estado automático basado en horario:', {
        turno: shiftInfo.shiftName,
        estado: automaticStatus === 'P' ? 'PRESENTE' : 'TARDE',
        dentroDeTolerancia: shiftInfo.isWithinTolerance,
        horarioEstimado: shiftInfo.isEstimated || false,
        fecha: attendanceDate,
        horaActualSistema: new Date().toTimeString().slice(0, 8),
        horaActualLima: 'Ver logs de scheduleUtils para hora Lima exacta',
        turnoCompleto: shiftInfo
      });

      const payload = {
        studentId: qrData.student_id,
        classroomId: qrData.classroom_id,
        attendanceDate: attendanceDate,
        status: automaticStatus, // Estado automático basado en horario
        observations: observations + (automaticStatus === 'L' ? ' - TARDANZA detectada automáticamente' : '')
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/qr-register`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        console.log('✅ Asistencia registrada exitosamente:', result);
        return {
          success: true,
          message: result.message || 'Asistencia registrada exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      console.error('❌ Error registrando asistencia por QR:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la asistencia',
        data: null
      };
    }
  }

  /**
   * Registra la salida de un estudiante mediante escaneo de código QR
   * POST /api/v1/attendances/auxiliary/exit-register
   * @param {Object} qrData - Datos del QR escaneado
   * @param {string} qrData.studentId - UUID del estudiante
   * @param {string} qrData.classroomId - UUID del aula
   * @param {string} exitDate - Fecha de salida (YYYY-MM-DD)
   * @param {string} observations - Observaciones opcionales
   * @returns {Promise<Object>} - Respuesta del registro de salida
   */
  async registerExitByQR(qrData, exitDate, observations = 'Salida via QR scan') {
    try {
      console.log('�➡️ MÉTODO registerExitByQR EJECUTADO');
      console.log('�📤 Registrando salida por QR:', { qrData, exitDate, observations });

      // Usar la misma estructura que registerExit (que funciona correctamente)
      const exitData = {
        studentId: qrData.student_id,
        classroomId: qrData.classroom_id,
        exitDate: exitDate,
        observations: observations
      };

      // Llamar al método registerExit para mantener consistencia
      return await this.registerExit(exitData);

    } catch (error) {
      console.error('❌ Error registrando salida por QR:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la salida',
        data: null
      };
    }
  }

  /**
   * Registra la salida de un estudiante (método genérico)
   * POST /api/v1/attendances/auxiliary/exit-register
   * @param {Object} exitData - Datos de la salida
   * @param {string} exitData.studentId - UUID del estudiante
   * @param {string} exitData.classroomId - UUID del aula
   * @param {string} exitData.exitDate - Fecha de salida (YYYY-MM-DD)
   * @param {string} exitData.observations - Observaciones opcionales
   * @returns {Promise<Object>} - Respuesta del registro
   */
  async registerExit(exitData) {
    try {
      console.log('📤 Registrando salida:', exitData);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/exit-register`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(exitData)
        });

        const result = await this.handleResponse(response);
        
        console.log('✅ Salida registrada exitosamente:', result);
        return {
          success: true,
          message: result.message || 'Salida registrada exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      console.error('❌ Error registrando salida:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar la salida',
        data: null
      };
    }
  }

  // ==========================================
  // MÉTODO PARA ENVÍO DE LOTE DE ASISTENCIAS
  // ==========================================

  /**
   * Envía un lote de asistencias al servidor
   * POST /api/v1/attendances/auxiliary/qr-register (lote)
   * @param {Object} batchData - Lote de asistencias estructurado
   * @returns {Promise<Object>} - Respuesta del envío
   */
  async sendBatchAttendances(batchData) {
    try {
      console.log('📤 Enviando lote de asistencias:', batchData);

      // Validar que el lote tenga asistencias
      if (!batchData.attendances || batchData.attendances.length === 0) {
        throw new Error('El lote debe contener al menos una asistencia');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/qr-register`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(batchData)
        });

        const result = await this.handleResponse(response);
        
        console.log('✅ Lote enviado exitosamente:', result);
        return {
          success: true,
          message: result.message || 'Lote de asistencias enviado exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      console.error('❌ Error enviando lote de asistencias:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar el lote de asistencias',
        data: null
      };
    }
  }

  /**
   * Envía un lote de salidas al servidor
   * POST /api/v1/attendances/auxiliary/qr-exit-register (lote)
   * @param {Object} batchData - Lote de salidas estructurado
   * @returns {Promise<Object>} - Respuesta del envío
   */
  async sendBatchExits(batchData) {
    try {
      console.log('📤 Enviando lote de salidas:', batchData);

      // Validar que el lote tenga salidas
      if (!batchData.exits || batchData.exits.length === 0) {
        throw new Error('El lote debe contener al menos una salida');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/auxiliary/qr-exit-register`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(batchData)
        });

        const result = await this.handleResponse(response);
        
        console.log('✅ Lote de salidas enviado exitosamente:', result);
        return {
          success: true,
          message: result.message || 'Lote de salidas enviado exitosamente',
          data: result.data || result
        };
      });

    } catch (error) {
      console.error('❌ Error enviando lote de salidas:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar el lote de salidas',
        data: null
      };
    }
  }

  /**
   * Valida los datos del código QR
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