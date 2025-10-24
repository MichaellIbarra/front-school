import { refreshTokenKeycloak } from '../auth/authService';
import { 
  validateAssignmentPost, 
  mapApiAssignmentToModel,
  mapApiUserToModel,
  mapModelToPostPayload 
} from '../../types/institutions/assignments';

class AssignmentsService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/assignments/director`;
    this.usersBaseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/users/director`;
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
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        console.error('🚨 Error del backend:', {
          status: response.status,
          message: errorMessage,
          data: data
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

  /**
   * Obtiene todas las asignaciones del director
   * GET /api/v1/assignments/director
   */
  async getDirectorAssignments() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo asignaciones del director:', this.baseURL);
        
        const response = await fetch(this.baseURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        // Mapear las asignaciones usando el helper del tipo
        const mappedAssignments = result.assignments 
          ? result.assignments.map(mapApiAssignmentToModel)
          : [];
        
        return {
          success: true,
          data: mappedAssignments,
          totalAssignments: result.totalAssignments || 0,
          requesterId: result.requesterId || null,
          institutionId: result.institutionId || null,
          endpoint: result.endpoint || '',
          message: result.message || 'Asignaciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener asignaciones del director:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las asignaciones',
        data: [],
        totalAssignments: 0,
        requesterId: null,
        institutionId: null,
        endpoint: ''
      };
    }
  }

  /**
   * Crea una nueva asignación
   * POST /api/v1/assignments/director/create
   */
  async createAssignment(assignmentData) {
    try {
      // Validar el payload antes de enviarlo
      const validation = validateAssignmentPost(assignmentData);
      if (!validation.isValid) {
        console.error('❌ Validación fallida:', validation.errors);
        return {
          success: false,
          error: 'Datos de asignación inválidos: ' + Object.values(validation.errors).join(', '),
          data: null,
          validationErrors: validation.errors
        };
      }

      return await this.executeWithRetry(async () => {
        console.log('📤 Creando asignación:', this.baseURL + '/create');
        console.log('📦 Datos de asignación:', assignmentData);
        
        const response = await fetch(this.baseURL + '/create', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(assignmentData)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        // Mapear la asignación creada usando el helper del tipo
        const mappedAssignment = result.assignment 
          ? mapApiAssignmentToModel(result.assignment)
          : null;
        
        return {
          success: true,
          data: mappedAssignment,
          message: result.message || 'Asignación creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la asignación',
        data: null
      };
    }
  }

  /**
   * Helper para crear una asignación desde el modelo local
   * Convierte el modelo a payload y luego hace la petición
   */
  async createAssignmentFromModel(assignmentModel) {
    const payload = mapModelToPostPayload(assignmentModel);
    return await this.createAssignment(payload);
  }

  /**
   * Obtiene la lista del personal (staff) de la institución del director
   * GET /api/v1/users/director/staff
   */
  async getDirectorStaff() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo personal del director:', this.usersBaseURL + '/staff');
        
        const response = await fetch(this.usersBaseURL + '/staff', {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        // Mapear los usuarios usando el helper del tipo
        const mappedUsers = result.users 
          ? result.users.map(mapApiUserToModel)
          : [];
        
        return {
          success: true,
          data: mappedUsers,
          totalUsers: result.total_users || 0,
          message: result.message || 'Personal obtenido exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener personal del director:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el personal',
        data: [],
        totalUsers: 0
      };
    }
  }

  /**
   * Helper para validar un payload de asignación sin hacer la petición
   */
  validateAssignmentPayload(payload) {
    return validateAssignmentPost(payload);
  }
}

export default new AssignmentsService();