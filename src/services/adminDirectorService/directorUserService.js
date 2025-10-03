import axios from 'axios';
import { refreshTokenKeycloak } from '../../auth/authService';

// Configuración del cliente API para el microservicio de gestión de usuarios director
const directorUserApiClient = axios.create({
  baseURL:  `${process.env.REACT_APP_DOMAIN}/api/v1/user-director`, // URL del gateway
  timeout: 60000, // 60 segundos de timeout para operaciones de creación
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejar errores globalmente y refresh token
directorUserApiClient.interceptors.response.use(
  response => {
    console.log('📥 Response DirectorUserService:', {
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
            return directorUserApiClient(originalRequest);
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
    
    console.error('Error en DirectorUserService:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interceptor para agregar token de autenticación si existe
directorUserApiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token'); // Consume el token del authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Request DirectorUserService:', {
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

class DirectorUserService {
  
  /**
   * Crear un nuevo usuario completo
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<string>} Mensaje de respuesta
   */
  async createCompleteUser(userData) {
    try {
      console.log('🚀 Iniciando creación de usuario completo (director personal):', {
        timestamp: new Date().toISOString(),
        userData: { ...userData, password: userData.password ? '[HIDDEN]' : undefined }
      });
      
      const response = await directorUserApiClient.post('/users', userData);
      
      console.log('✅ Usuario completo creado exitosamente:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error detallado en createCompleteUser:', {
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
      
      throw this.handleError(error, 'Error al crear usuario completo');
    }
  }

  /**
   * Obtener todos los usuarios completos
   * @returns {Promise<Array>} Lista de usuarios completos
   */
  async getAllCompleteUsers() {
    try {
      const response = await directorUserApiClient.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuarios completos');
    }
  }

  /**
   * Obtener usuario completo por ID de Keycloak
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario
   */
  async getCompleteUserByKeycloakId(keycloakId) {
    try {
      const response = await directorUserApiClient.get(`/users/keycloak/${keycloakId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuario por ID de Keycloak');
    }
  }

  /**
   * Obtener usuario completo por nombre de usuario
   * @param {string} username - Nombre de usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getCompleteUserByUsername(username) {
    try {
      const response = await directorUserApiClient.get(`/users/username/${username}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener usuario por nombre de usuario');
    }
  }

  /**
   * Actualizar usuario completo
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<string>} Mensaje de respuesta
   */
  async updateCompleteUser(keycloakId, userData) {
    try {
      const response = await directorUserApiClient.put(`/users/${keycloakId}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al actualizar usuario completo');
    }
  }

  /**
   * Eliminar usuario completo
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<string>} Mensaje de respuesta
   */
  async deleteCompleteUser(keycloakId) {
    try {
      const response = await directorUserApiClient.delete(`/users/${keycloakId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar usuario completo');
    }
  }

  /**
   * Cambiar estado de usuario
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {string} status - Nuevo estado del usuario
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async changeUserStatus(keycloakId, status) {
    try {
      const response = await directorUserApiClient.patch(`/users/${keycloakId}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al cambiar estado del usuario');
    }
  }

  /**
   * Activar usuario
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async activateUser(keycloakId) {
    try {
      const response = await directorUserApiClient.patch(`/users/${keycloakId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al activar usuario');
    }
  }

  /**
   * Desactivar usuario
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async deactivateUser(keycloakId) {
    try {
      const response = await directorUserApiClient.patch(`/users/${keycloakId}/deactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al desactivar usuario');
    }
  }

  /**
   * Obtener usuarios por estado
   * @param {string} status - Estado de los usuarios a buscar
   * @returns {Promise<Array>} Lista de usuarios filtrados por estado
   */
  async getUsersByStatus(status) {
    try {
      const response = await directorUserApiClient.get(`/users/status/${status}`);
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
    return {
      username: userData.username?.trim(),
      email: userData.email?.trim().toLowerCase(),
      firstname: userData.firstname?.trim() || null,
      lastname: userData.lastname?.trim() || null,
      password: userData.password || null,
      roles: Array.isArray(userData.roles) ? userData.roles : [userData.roles],
      documentType: userData.documentType,
      documentNumber: userData.documentNumber?.trim(),
      phone: userData.phone?.trim() || null,
      status: userData.status || 'A'
    };
  }
}

// Exportar instancia única del servicio
const directorUserService = new DirectorUserService();
export default directorUserService;
