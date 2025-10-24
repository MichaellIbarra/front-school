import { FutRequest, validateFutRequest } from '../../types/fut/fut-request.model';
import { refreshTokenKeycloak } from '../auth/authService';

class FutRequestService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/fut`;
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
   * Crea una nueva solicitud FUT
   * POST /api/v1/fut
   */
  async create(futRequestData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateFutRequest(futRequestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de solicitud FUT inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload sin el ID (se genera en el backend)
      const payload = {
        studentEnrollmentId: futRequestData.studentEnrollmentId,
        requestNumber: futRequestData.requestNumber,
        requestType: futRequestData.requestType,
        requestSubject: futRequestData.requestSubject,
        requestDescription: futRequestData.requestDescription,
        requestedBy: futRequestData.requestedBy,
        contactPhone: futRequestData.contactPhone,
        contactEmail: futRequestData.contactEmail,
        urgencyLevel: futRequestData.urgencyLevel,
        estimatedDeliveryDate: futRequestData.estimatedDeliveryDate,
        attachedDocuments: futRequestData.attachedDocuments || {},
        adminNotes: futRequestData.adminNotes || '',
        status: futRequestData.status || 'PENDIENTE'
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Solicitud FUT creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear solicitud FUT:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la solicitud FUT'
      };
    }
  }

  /**
   * Obtiene una solicitud FUT por ID
   * GET /api/v1/fut/{id}
   */
  async getById(id) {
    try {
      if (!id) {
        throw new Error('ID de solicitud FUT requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result,
          message: 'Solicitud FUT encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener solicitud FUT:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la solicitud FUT',
        data: null
      };
    }
  }

  /**
   * Obtiene todas las solicitudes FUT
   * GET /api/v1/fut
   */
  async getAll() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : [],
          message: 'Solicitudes FUT obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener solicitudes FUT:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las solicitudes FUT',
        data: []
      };
    }
  }

  /**
   * Actualiza una solicitud FUT existente
   * PUT /api/v1/fut/{id}
   */
  async update(id, futRequestData) {
    try {
      if (!id) {
        throw new Error('ID de solicitud FUT requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateFutRequest(futRequestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de solicitud FUT inválidos',
          validationErrors: validation.errors
        };
      }

      // Crear el payload sin el ID
      const payload = {
        studentEnrollmentId: futRequestData.studentEnrollmentId,
        requestNumber: futRequestData.requestNumber,
        requestType: futRequestData.requestType,
        requestSubject: futRequestData.requestSubject,
        requestDescription: futRequestData.requestDescription,
        requestedBy: futRequestData.requestedBy,
        contactPhone: futRequestData.contactPhone,
        contactEmail: futRequestData.contactEmail,
        urgencyLevel: futRequestData.urgencyLevel,
        estimatedDeliveryDate: futRequestData.estimatedDeliveryDate,
        attachedDocuments: futRequestData.attachedDocuments || {},
        adminNotes: futRequestData.adminNotes || '',
        status: futRequestData.status
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
          data: result,
          message: 'Solicitud FUT actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar solicitud FUT:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la solicitud FUT'
      };
    }
  }

  /**
   * Elimina una solicitud FUT
   * DELETE /api/v1/fut/{id}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID de solicitud FUT requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        await this.handleResponse(response);
        
        return {
          success: true,
          message: 'Solicitud FUT eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar solicitud FUT:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la solicitud FUT'
      };
    }
  }

  /**
   * Busca solicitudes FUT por asunto
   * GET /api/v1/fut/search/subject?subject={subject}
   */
  async searchBySubject(subject) {
    try {
      if (!subject || subject.trim() === '') {
        throw new Error('Asunto de búsqueda requerido');
      }

      return await this.executeWithRetry(async () => {
        const encodedSubject = encodeURIComponent(subject);
        const response = await fetch(`${this.baseURL}/search/subject?subject=${encodedSubject}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : [],
          message: 'Búsqueda completada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al buscar solicitudes FUT por asunto:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar solicitudes FUT',
        data: []
      };
    }
  }

  /**
   * Busca solicitudes FUT por matrícula de estudiante
   * GET /api/v1/fut/by-enrollment/student?studentEnrollmentId={studentEnrollmentId}
   */
  async searchByStudent(studentEnrollmentId) {
    try {
      if (!studentEnrollmentId || studentEnrollmentId.trim() === '') {
        throw new Error('ID de matrícula del estudiante requerido');
      }

      return await this.executeWithRetry(async () => {
        const encodedStudentId = encodeURIComponent(studentEnrollmentId);
        const response = await fetch(`${this.baseURL}/by-enrollment/student?studentEnrollmentId=${encodedStudentId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: Array.isArray(result) ? result : [],
          message: 'Solicitudes del estudiante obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al buscar solicitudes FUT por estudiante:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar solicitudes del estudiante',
        data: []
      };
    }
  }

  /**
   * Crea una nueva solicitud FUT con valores por defecto
   */
  createNewFutRequest(studentEnrollmentId) {
    return {
      ...FutRequest,
      studentEnrollmentId,
      createdAt: new Date().toISOString()
    };
  }
}

export default new FutRequestService();