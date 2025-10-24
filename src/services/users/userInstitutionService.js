import axios from 'axios';
import { refreshTokenKeycloak } from '../auth/authService';

// Configuración del cliente API para el microservicio de usuarios - endpoint user-institution
const userInstitutionApiClient = axios.create({
  baseURL:  `${process.env.REACT_APP_DOMAIN}/api/v1/user-institution`, // URL del gateway
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejar errores globalmente y refresh token
userInstitutionApiClient.interceptors.response.use(
  response => {
    console.log('Response interceptor - Success:', {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      data: response.data
    });
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResult = await refreshTokenKeycloak(refreshToken);
          if (refreshResult.success) {
            // Actualizar el header con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
            return userInstitutionApiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        // Opcional: redirigir al login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    console.error('Error en UserInstitutionService:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interceptor para agregar token de autenticación si existe
userInstitutionApiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token'); // Consume el token del authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Asegurar que siempre se envíen los headers correctos
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    
    console.log('Request interceptor:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  error => Promise.reject(error)
);

class UserInstitutionService {

  async getAllRelations() {
    try {
      const response = await userInstitutionApiClient.get('');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener las relaciones usuario-institución');
    }
  }

  async assignUserToInstitution(userId, assignmentData) {
    try {
      console.log('Enviando solicitud de asignación:', {
        userId,
        assignmentData,
        url: `/users/${userId}/assign-institution`
      });
      
      const response = await userInstitutionApiClient.post(`/users/${userId}/assign-institution`, assignmentData);
      console.log('Respuesta exitosa de asignación:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error detallado en assignUserToInstitution:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        userId,
        assignmentData
      });
      throw this.handleError(error, 'Error al asignar usuario a institución');
    }
  }

  async getUsersByInstitution(institutionId) {
    try {
      const response = await userInstitutionApiClient.get(`/users/by-institution/${institutionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuarios por institución');
    }
  }

  async updateUserRole(userId, institutionId, roleData) {
    try {
      console.log('Enviando solicitud de actualización de rol:', {
        userId,
        institutionId,
        roleData,
        url: `/users/${userId}/institutions/${institutionId}/roles`
      });
      
      const response = await userInstitutionApiClient.put(`/users/${userId}/institutions/${institutionId}/roles`, roleData);
      console.log('Respuesta exitosa de actualización de rol:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error detallado en updateUserRole:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        userId,
        institutionId,
        roleData
      });
      throw this.handleError(error, 'Error al actualizar rol del usuario');
    }
  }

  async deactivateAssignment(userId, institutionId) {
    try {
      const response = await userInstitutionApiClient.patch(`/users/${userId}/institutions/${institutionId}/deactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al desactivar asignación');
    }
  }

  async activateAssignment(userId, institutionId) {
    try {
      const response = await userInstitutionApiClient.patch(`/users/${userId}/institutions/${institutionId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al activar asignación');
    }
  }

  async deleteAllRelations(userId) {
    try {
      const response = await userInstitutionApiClient.delete(`/users/${userId}/institutions/all`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar todas las relaciones');
    }
  }

  async deleteSpecificAssignment(userId, institutionId) {
    try {
      const response = await userInstitutionApiClient.delete(`/users/${userId}/institutions/${institutionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar asignación específica');
    }
  }

  async getUserInstitutionRelation(userId, institutionId) {
    try {
      const response = await userInstitutionApiClient.get(`/users/${userId}/institutions/${institutionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener relación específica');
    }
  }

  async getUserRelations(userId) {
    try {
      console.log('Obteniendo relaciones para usuario:', {
        userId,
        url: `/users/${userId}/institutions`
      });
      
      const response = await userInstitutionApiClient.get(`/users/${userId}/institutions`);
      console.log('Relaciones obtenidas exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error detallado en getUserRelations:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        userId
      });
      throw this.handleError(error, 'Error al obtener relaciones del usuario');
    }
  }

  async checkUserRelationsExist(userId) {
    try {
      const response = await userInstitutionApiClient.get(`/users/${userId}/institutions/exists`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al verificar relaciones existentes');
    }
  }

  /**
   * Método para testear la conexión con el backend
   */
  async testConnection() {
    try {
      console.log('Testeando conexión con el backend...');
      const response = await userInstitutionApiClient.get('');
      console.log('Test de conexión exitoso:', {
        status: response.status,
        dataCount: Array.isArray(response.data) ? response.data.length : 'No es array',
        data: response.data
      });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Test de conexión fallido:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  async changeRelationStatus(userId, status) {
    try {
      // Convertir el status al formato esperado por el backend (A o I)
      const backendStatus = this.convertStatusToBackend(status);
      const response = await userInstitutionApiClient.patch(`/users/${userId}/institutions/status`, null, {
        params: { status: backendStatus }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al cambiar estado de la relación');
    }
  }

  async deactivateAllAssignments(userId) {
    try {
      const response = await userInstitutionApiClient.patch(`/users/${userId}/institutions/deactivate-all`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al desactivar todas las asignaciones');
    }
  }

  async activateAllAssignments(userId) {
    try {
      const response = await userInstitutionApiClient.patch(`/users/${userId}/institutions/activate-all`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al activar todas las asignaciones');
    }
  }

  /**
   * Convierte el estado del frontend al formato del backend
   * @param {string} status - Estado del frontend (ACTIVE, INACTIVE, A, I)
   * @returns {string} Estado para el backend (A o I)
   */
  convertStatusToBackend(status) {
    switch (status) {
      case 'ACTIVE':
      case 'A':
        return 'A';
      case 'INACTIVE':
      case 'I':
        return 'I';
      default:
        return 'I'; // Por defecto inactivo si no reconoce el estado
    }
  }

  /**
   * Convierte el estado del backend al formato del frontend
   * @param {string} status - Estado del backend (A o I)
   * @returns {string} Estado para el frontend (ACTIVE o INACTIVE)
   */
  convertStatusToFrontend(status) {
    switch (status) {
      case 'A':
        return 'ACTIVE';
      case 'I':
        return 'INACTIVE';
      default:
        return 'INACTIVE';
    }
  }

  handleError(error, defaultMessage) {
    console.error('Manejando error en UserInstitutionService:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message,
      config: error.config
    });

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || data || defaultMessage;
      
      switch (status) {
        case 400: {
          const detailedMessage = typeof data === 'string' ? data : 
            data?.message || 'Datos de solicitud inválidos. Verifique los campos requeridos.';
          throw new Error(`Solicitud inválida: ${detailedMessage}`);
        }
        case 401:
          throw new Error('No autorizado. Inicie sesión nuevamente.');
        case 403:
          throw new Error('Sin permisos para realizar esta operación o el usuario no está activo.');
        case 404:
          throw new Error('Usuario o institución no encontrado.');
        case 409:
          throw new Error(`El usuario ya está asignado a esta institución: ${message}`);
        case 500:
          throw new Error('Error interno del servidor. Intente más tarde.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('Sin conexión al servidor. Verifique su conexión a internet.');
    } else {
      throw new Error(defaultMessage);
    }
  }

  validateAssignmentData(data) {
    const errors = [];

    if (!data.institutionId) {
      errors.push('ID de institución es requerido');
    }

    if (!data.role) {
      errors.push('Rol es requerido');
    }

    const validRoles = ['TEACHER', 'AUXILIARY', 'DIRECTOR', 'ADMINISTRATIVE', 'COORDINATOR', 'STUDENT', 'VISITOR'];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push('Rol inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  formatUserDataForSubmit(userData) {
    const status = userData.status || 'A';
    return {
      institutionId: userData.institutionId,
      role: userData.role,
      isActive: status === 'A' || status === 'ACTIVE' || userData.isActive === true
    };
  }

  getRoleLabels() {
    return {
      'TEACHER': 'Profesor',
      'AUXILIARY': 'Auxiliar',
      'DIRECTOR': 'Director',
      'ADMINISTRATIVE': 'Administrativo',

    };
  }

  getStatusLabels() {
    return {
      'A': 'Activo',
      'I': 'Inactivo',
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'SUSPENDED': 'Suspendido'
    };
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      // Crear fecha directamente desde la cadena ISO para evitar conversión de zona horaria
      const date = new Date(dateString);
      
      // Si es una fecha ISO, usar UTC para evitar desfase de zona horaria
      if (dateString.includes('T')) {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC'
        });
      } else {
        // Para fechas sin tiempo, solo mostrar la fecha
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Formatea fecha para inputs HTML de tipo date (formato YYYY-MM-DD)
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Usar toLocaleDateString con formato en-CA para obtener YYYY-MM-DD
      return date.toLocaleDateString('en-CA');
    } catch (error) {
      return '';
    }
  }

  /**
   * Convierte fecha de input (YYYY-MM-DD) a ISO string para el backend
   * @param {string} dateInput - Fecha en formato YYYY-MM-DD
   * @param {boolean} isEndDate - Si es fecha de fin (agregar 23:59:59)
   * @returns {string} Fecha en formato ISO
   */
  convertDateInputToISO(dateInput, isEndDate = false) {
    if (!dateInput) return '';
    
    try {
      const timeToAdd = isEndDate ? 'T23:59:59' : 'T00:00:00';
      return `${dateInput}${timeToAdd}`;
    } catch (error) {
      return '';
    }
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'A':
      case 'ACTIVE':
        return 'badge-success';
      case 'I':
      case 'INACTIVE':
        return 'badge-secondary';
      case 'SUSPENDED':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getRoleBadgeClass(role) {
    switch (role) {
      case 'DIRECTOR':
        return 'badge-danger';
      case 'ADMINISTRATIVE':
        return 'badge-warning';
      case 'TEACHER':
        return 'badge-info';
      case 'AUXILIARY':
        return 'badge-success';
      case 'COORDINATOR':
        return 'badge-primary';
      case 'STUDENT':
        return 'badge-light';
      case 'VISITOR':
        return 'badge-dark';
      default:
        return 'badge-secondary';
    }
  }
}

const userInstitutionService = new UserInstitutionService();
export { userInstitutionService };
