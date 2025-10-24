import { refreshTokenKeycloak } from '../auth/authService';

class AdminUserService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/users`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   * Incluye los headers requeridos por AdminUserRest.java (Headers HTTP v5.0)
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    const userId = localStorage.getItem('user_id');
    const userRoles = localStorage.getItem('user_roles');
    
    // Obtener institutionId del objeto institution guardado en localStorage
    let institutionId = null;
    const institutionData = localStorage.getItem('institution');
    if (institutionData) {
      try {
        const institution = JSON.parse(institutionData);
        institutionId = institution?.id || institution?.institutionId;
      } catch (parseError) {
        console.error('Error al parsear datos de institución:', parseError);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Headers requeridos según AdminUserRest.java
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (userRoles) {
      headers['X-User-Roles'] = userRoles;
    }
    // Para endpoints ADMIN, X-Institution-Id debe ser null (no se envía el header)
    // Solo se envía para otros roles que no sean ADMIN
    if (institutionId && !userRoles?.includes('ADMIN')) {
      headers['X-Institution-Id'] = institutionId;
    }

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
        const refreshResult = await refreshTokenKeycloak(refreshToken);
        if (refreshResult.success) {
          console.log('✅ Token refrescado correctamente, reintentando petición...');
          throw new Error('TOKEN_REFRESHED'); // Señal especial para reintentar
        } else {
          console.log('❌ Error al refrescar token:', refreshResult.error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          console.log('🚪 Redirigiendo al login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          throw new Error('Sesión expirada. Redirigiendo al login...');
        }
      } else {
        console.log('❌ No hay refresh token disponible');
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
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
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
        throw error;
      }
      
      if (!response.ok) {
        const statusMessage = `Error del servidor (${response.status}): ${error.message || 'Respuesta no válida'}`;
        console.error('🚨 Error de respuesta:', statusMessage);
        throw new Error(statusMessage);
      }
      
      console.error('Error parsing JSON response:', error);
      return {};
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
   * Crear un nuevo usuario admin/director
   * POST /admin/create
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async createAdminUser(userData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Iniciando creación de usuario admin/director:', {
          timestamp: new Date().toISOString(),
          userData: { ...userData, password: '[HIDDEN]' }
        });
        
        const fullURL = `${this.baseURL}/admin/create`;
        console.log('📤 Request:', fullURL);

        const response = await fetch(fullURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(userData)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.user || result,
          message: result.message || 'Usuario creado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al crear usuario admin/director:', error);
      return {
        success: false,
        error: error.message || 'Error al crear usuario admin/director'
      };
    }
  }

  /**
   * Obtener todos los usuarios admin del sistema
   * GET /admin
   * @returns {Promise<Object>} Respuesta con lista de usuarios admin
   */
  async getAllAdminUsers() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todos los usuarios admin');
        const fullURL = `${this.baseURL}/admin`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.users || [],
          total_users: result.total_users || 0,
          message: result.message || 'Usuarios admin obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener usuarios admin:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener usuarios admin',
        data: [],
        total_users: 0
      };
    }
  }

  /**
   * Obtener todos los directores de todas las instituciones
   * GET /admin/directors
   * @returns {Promise<Object>} Respuesta con lista de directores
   */
  async getAllDirectors() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todos los directores');
        const fullURL = `${this.baseURL}/admin/directors`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.users || [],
          total_users: result.total_users || 0,
          message: result.message || 'Directores obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener directores:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener directores',
        data: [],
        total_users: 0
      };
    }
  }

  /**
   * Obtener un usuario admin/director por su keycloakId
   * Busca en ambos endpoints (admins y directores) y retorna el usuario encontrado
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario
   */
  async getAdminUserByKeycloakId(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      console.log('👤 Buscando usuario por keycloakId:', keycloakId);
      
      // Obtener todos los usuarios (admins y directores)
      const response = await this.getAllUsersComplete();
      
      if (!response.success) {
        throw new Error(response.error || 'Error al obtener usuarios');
      }
      
      // Buscar el usuario específico por keycloakId
      const userData = response.data.find(user => user.keycloakId === keycloakId);
      
      if (!userData) {
        console.error('❌ Usuario no encontrado con keycloakId:', keycloakId);
        return {
          success: false,
          error: 'Usuario no encontrado',
          data: null
        };
      }
      
      console.log('✅ Usuario encontrado:', userData.username);
      
      return {
        success: true,
        data: userData,
        message: 'Usuario obtenido exitosamente'
      };
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener usuario',
        data: null
      };
    }
  }

  /**
   * Obtener directores de una institución específica
   * GET /admin/directors/{institution_id}
   * @param {string} institutionId - ID de la institución
   * @returns {Promise<Object>} Respuesta con lista de directores de la institución
   */
  async getDirectorsByInstitution(institutionId) {
    try {
      if (!institutionId) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo directores de institución:', institutionId);
        const fullURL = `${this.baseURL}/admin/directors/${institutionId}`;
        
        const response = await fetch(fullURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.users || [],
          total_users: result.total_users || 0,
          message: result.message || 'Directores de institución obtenidos exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener directores de institución:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener directores de la institución',
        data: [],
        total_users: 0
      };
    }
  }

  /**
   * Actualizar usuario admin/director
   * PUT /admin/update/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<Object>} Datos del usuario actualizado
   */
  async updateAdminUser(keycloakId, userData) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando usuario admin/director:', {
          keycloakId,
          userData: { ...userData, password: '[HIDDEN]' }
        });
        
        const fullURL = `${this.baseURL}/admin/update/${keycloakId}`;
        
        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(userData)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.user || result,
          message: result.message || 'Usuario actualizado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar usuario admin/director'
      };
    }
  }

  /**
   * Eliminar usuario admin/director (eliminación física)
   * DELETE /admin/delete/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Mensaje de respuesta
   */
  async deleteAdminUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando usuario admin/director:', keycloakId);
        const fullURL = `${this.baseURL}/admin/delete/${keycloakId}`;
        
        const response = await fetch(fullURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Usuario eliminado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar usuario admin/director'
      };
    }
  }

  /**
   * Desactivar usuario admin/director
   * PATCH /admin/deactivate/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario desactivado
   */
  async deactivateAdminUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Desactivando usuario admin/director:', keycloakId);
        const fullURL = `${this.baseURL}/admin/deactivate/${keycloakId}`;
        
        const response = await fetch(fullURL, {
          method: 'PATCH',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.user || result,
          message: result.message || 'Usuario desactivado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al desactivar usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al desactivar usuario admin/director'
      };
    }
  }

  /**
   * Activar usuario admin/director
   * PATCH /admin/activate/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario activado
   */
  async activateAdminUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Activando usuario admin/director:', keycloakId);
        const fullURL = `${this.baseURL}/admin/activate/${keycloakId}`;
        
        const response = await fetch(fullURL, {
          method: 'PATCH',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.user || result,
          message: result.message || 'Usuario activado exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al activar usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al activar usuario admin/director'
      };
    }
  }

  /**
   * Cambiar estado de usuario admin/director (método auxiliar)
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {string} status - Nuevo estado del usuario ('activate' o 'deactivate')
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async changeAdminUserStatus(keycloakId, status) {
    try {
      if (status === 'activate' || status === 'ACTIVE') {
        return await this.activateAdminUser(keycloakId);
      } else if (status === 'deactivate' || status === 'INACTIVE') {
        return await this.deactivateAdminUser(keycloakId);
      } else {
        return {
          success: false,
          error: 'Estado inválido. Use "activate" o "deactivate"'
        };
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado del usuario:', error);
      return {
        success: false,
        error: error.message || 'Error al cambiar estado del usuario'
      };
    }
  }

  /**
   * Obtener información completa de usuarios (combinando admins y directores)
   * Elimina duplicados por keycloakId
   * @returns {Promise<Object>} Objeto con todos los usuarios combinados sin duplicados
   */
  async getAllUsersComplete() {
    try {
      console.log('📊 Obteniendo información completa de usuarios');
      
      const [adminsResponse, directorsResponse] = await Promise.all([
        this.getAllAdminUsers(),
        this.getAllDirectors()
      ]);
      
      // Combinar los datos de ambas respuestas en un solo array
      const adminsData = Array.isArray(adminsResponse?.data) ? adminsResponse.data : [];
      const directorsData = Array.isArray(directorsResponse?.data) ? directorsResponse.data : [];
      
      // Usar un Map para eliminar duplicados por keycloakId
      const usersMap = new Map();
      
      // Agregar admins al mapa
      adminsData.forEach(user => {
        if (user.keycloakId) {
          usersMap.set(user.keycloakId, user);
        }
      });
      
      // Agregar directores al mapa (si ya existe, se sobrescribe con la info más completa)
      directorsData.forEach(user => {
        if (user.keycloakId) {
          // Si el usuario ya existe, combinar roles
          if (usersMap.has(user.keycloakId)) {
            const existingUser = usersMap.get(user.keycloakId);
            const combinedRoles = [...new Set([...(existingUser.roles || []), ...(user.roles || [])])];
            usersMap.set(user.keycloakId, { ...existingUser, ...user, roles: combinedRoles });
          } else {
            usersMap.set(user.keycloakId, user);
          }
        }
      });
      
      // Convertir el Map a array
      const allUsers = Array.from(usersMap.values());
      
      console.log('✅ Usuarios sin duplicados:', {
        totalAdmins: adminsData.length,
        totalDirectors: directorsData.length,
        totalUnique: allUsers.length
      });
      
      return {
        success: true,
        data: allUsers,
        total_users: allUsers.length,
        totalAdmins: adminsResponse?.total_users || 0,
        totalDirectors: directorsResponse?.total_users || 0,
        message: 'Usuarios obtenidos exitosamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al obtener información completa:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener información completa de usuarios',
        data: [],
        total_users: 0
      };
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
      status: userData.status || 'A',
      institutionId: userData.institutionId || null // Incluir institutionId (requerido para directores)
    };

    // No incluir password para que se genere automáticamente
    // delete formattedData.password;

    return formattedData;
  }
}

// Exportar instancia única del servicio
const adminUserService = new AdminUserService();
export default adminUserService;