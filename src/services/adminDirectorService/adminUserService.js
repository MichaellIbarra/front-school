import axios from 'axios';
import { refreshTokenKeycloak } from '../../auth/authService';
// Configuración del cliente API para el microservicio de usuarios
const userApiClient = axios.create({
  baseURL: `${process.env.REACT_APP_DOMAIN}/api/v1/user-admin`, // URL del gateway
  timeout: 60000, // 60 segundos de timeout para operaciones de creación
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejar errores globalmente y refresh token
userApiClient.interceptors.response.use(
  response => {
    console.log('📥 Response AdminUserService:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      timestamp: new Date().toISOString()
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
            return userApiClient(originalRequest);
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
    
    console.error('Error en AdminUserService:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interceptor para agregar token de autenticación si existe
userApiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token'); // Consume el token del authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Request AdminUserService:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: { ...config.headers, Authorization: config.headers.Authorization ? '[TOKEN_PRESENT]' : '[NO_TOKEN]' },
      timeout: config.timeout,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  error => Promise.reject(error)
);

class AdminUserService {
  
  /**
   * Crear un nuevo usuario admin/director
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async createAdminUser(userData) {
    try {
      console.log('🚀 Iniciando creación de usuario admin/director:', {
        timestamp: new Date().toISOString(),
        userData: { ...userData, password: '[HIDDEN]' }
      });
      
      const response = await userApiClient.post('/users', userData);
      
      console.log('✅ Usuario admin/director creado exitosamente:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error detallado en createAdminUser:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        },
        timestamp: new Date().toISOString()
      });
      
      throw this.handleError(error, 'Error al crear usuario admin/director');
    }
  }

  /**
   * Obtener todos los usuarios admin/director
   * @returns {Promise<Array>} Lista de usuarios admin/director
   */
  async getAllAdminUsers() {
    try {
      const response = await userApiClient.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuarios admin/director');
    }
  }

  /**
   * Obtener usuario admin/director por ID de Keycloak
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario
   */
  async getAdminUserByKeycloakId(keycloakId) {
    try {
      const response = await userApiClient.get(`/users/keycloak/${keycloakId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuario por ID de Keycloak');
    }
  }

  /**
   * Obtener usuario admin/director por nombre de usuario
   * @param {string} username - Nombre de usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getAdminUserByUsername(username) {
    try {
      const response = await userApiClient.get(`/users/username/${username}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuario por nombre de usuario');
    }
  }

  /**
   * Actualizar usuario admin/director
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<string>} Mensaje de respuesta
   */
  async updateAdminUser(keycloakId, userData) {
    try {
      const response = await userApiClient.put(`/users/${keycloakId}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al actualizar usuario admin/director');
    }
  }

  /**
   * Eliminar usuario admin/director
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<string>} Mensaje de respuesta
   */
  async deleteAdminUser(keycloakId) {
    try {
      const response = await userApiClient.delete(`/users/${keycloakId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar usuario admin/director');
    }
  }

  /**
   * Cambiar estado de usuario admin/director
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {string} status - Nuevo estado del usuario
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async changeAdminUserStatus(keycloakId, status) {
    try {
      const response = await userApiClient.patch(`/users/${keycloakId}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al cambiar estado del usuario');
    }
  }

  /**
   * Activar usuario admin/director
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async activateAdminUser(keycloakId) {
    try {
      const response = await userApiClient.patch(`/users/${keycloakId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al activar usuario admin/director');
    }
  }

  /**
   * Desactivar usuario admin/director
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async deactivateAdminUser(keycloakId) {
    try {
      const response = await userApiClient.patch(`/users/${keycloakId}/deactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al desactivar usuario admin/director');
    }
  }

  /**
   * Obtener usuarios admin/director por estado
   * @param {string} status - Estado de los usuarios a buscar
   * @returns {Promise<Array>} Lista de usuarios filtrados por estado
   */
  async getAdminUsersByStatus(status) {
    try {
      const response = await userApiClient.get(`/users/status/${status}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuarios por estado');
    }
  }

  /**
   * Manejo centralizado de errores
   * @param {Error} error - Error capturado
   * @param {string} defaultMessage - Mensaje por defecto
   * @returns {Error} Error procesado
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      // Error del servidor
      const { status, data } = error.response;
      const message = data?.message || data || defaultMessage;
      
      switch (status) {
        case 400:
          return new Error(`Datos inválidos: ${message}`);
        case 401:
          return new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        case 403:
          return new Error('No tiene permisos para realizar esta acción.');
        case 404:
          return new Error('Usuario no encontrado.');
        case 409:
          return new Error('El usuario ya existe o hay un conflicto de datos.');
        case 500:
          return new Error('Error interno del servidor. Intente más tarde.');
        default:
          return new Error(`Error ${status}: ${message}`);
      }
    } else if (error.request) {
      // Error de red
      return new Error('Error de conexión. Verifique su conexión a internet.');
    } else {
      // Error de configuración
      return new Error(error.message || defaultMessage);
    }
  }

  /**
   * Validar datos de usuario antes de enviar
   * @param {Object} userData - Datos del usuario a validar
   * @returns {Object} Objeto con isValid y errores
   */
  validateUserData(userData) {
    const errors = [];

    if (!userData.username || userData.username.trim().length < 3) {
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    }

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Debe proporcionar un email válido');
    }

    if (!userData.documentType) {
      errors.push('Debe seleccionar un tipo de documento');
    }

    if (!userData.documentNumber || userData.documentNumber.trim().length < 8) {
      errors.push('El número de documento debe tener al menos 8 caracteres');
    }

    if (userData.phone && !/^\+?[1-9]\d{1,14}$/.test(userData.phone)) {
      errors.push('El formato del teléfono no es válido');
    }

    if (!userData.roles || userData.roles.length === 0) {
      errors.push('Debe asignar al menos un rol al usuario');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatear datos del usuario para envío
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Datos formateados
   */
  formatUserDataForSubmit(userData) {
    const formattedData = {
      username: userData.username?.trim(),
      email: userData.email?.trim().toLowerCase(),
      firstname: userData.firstname?.trim() || null,
      lastname: userData.lastname?.trim() || null,
      roles: Array.isArray(userData.roles) ? userData.roles : [userData.roles],
      documentType: userData.documentType,
      documentNumber: userData.documentNumber?.trim(),
      phone: userData.phone?.trim() || null,
      status: userData.status || 'A'
    };

    // No incluir password para que se genere automáticamente
    // delete formattedData.password;

    return formattedData;
  }
}

// Exportar instancia única del servicio
const adminUserService = new AdminUserService();
export default adminUserService;