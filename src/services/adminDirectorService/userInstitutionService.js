import axios from 'axios';
import { refreshTokenKeycloak } from '../../auth/authService';

// Configuración del cliente API para el microservicio de usuarios - endpoint user-institution
const userInstitutionApiClient = axios.create({
  baseURL: `${process.env.REACT_APP_DOMAIN}/api/v1/user-institution`, // URL del gateway
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejar errores globalmente y refresh token
userInstitutionApiClient.interceptors.response.use(
  response => response,
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
      const response = await userInstitutionApiClient.post(`/users/${userId}/assign-institution`, assignmentData);
      return response.data;
    } catch (error) {
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
      const response = await userInstitutionApiClient.put(`/users/${userId}/institutions/${institutionId}/roles`, roleData);
      return response.data;
    } catch (error) {
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
      const response = await userInstitutionApiClient.get(`/users/${userId}/institutions`);
      return response.data;
    } catch (error) {
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
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data || defaultMessage;
      
      switch (status) {
        case 400:
          throw new Error(`Solicitud inválida: ${message}`);
        case 401:
          throw new Error('No autorizado. Inicie sesión nuevamente.');
        case 403:
          throw new Error('Sin permisos para realizar esta operación.');
        case 404:
          throw new Error('Recurso no encontrado.');
        case 409:
          throw new Error(`Conflicto: ${message}`);
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

    const validRoles = ['TEACHER', 'AUXILIARY', 'DIRECTOR', 'ADMINISTRATIVE'];
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
      'ADMINISTRATIVE': 'Administrativo'
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
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
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
      default:
        return 'badge-secondary';
    }
  }
}

const userInstitutionService = new UserInstitutionService();
export { userInstitutionService };
