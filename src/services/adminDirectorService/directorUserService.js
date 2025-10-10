import { refreshTokenKeycloak } from '../../auth/authService';

class DirectorUserService {
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
   * Incluye los headers requeridos por UserManagementRest.java (Headers HTTP v5.0)
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    const userId = localStorage.getItem('user_id');
    const userRoles = localStorage.getItem('user_roles');
    const institutionId = localStorage.getItem('institution_id');

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Headers requeridos según UserManagementRest.java (DIRECTOR endpoints)
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (userRoles) {
      headers['X-User-Roles'] = userRoles;
    }
    // Para endpoints DIRECTOR, X-Institution-Id es OBLIGATORIO
    if (institutionId) {
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
          console.log('✅ Token renovado exitosamente');
          // Guardar el nuevo token
          localStorage.setItem('access_token', refreshResult.access_token);
          // Señal especial para que executeWithRetry reintente la petición
          throw new Error('TOKEN_REFRESHED');
        } else {
          console.log('❌ Error al renovar token, redirigiendo al login...');
          localStorage.clear();
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
        console.error('� Error del backend:', {
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
   * Crear un nuevo usuario staff (TEACHER, AUXILIARY, SECRETARY)
   * POST /director/create
   * @param {Object} userData - Datos del usuario a crear
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async createStaffUser(userData) {
    try {
      return await this.executeWithRetry(async () => {
        console.log('🚀 Iniciando creación de usuario staff (director):', {
          timestamp: new Date().toISOString(),
          userData: { ...userData, password: '[HIDDEN]' }
        });
        
        const fullURL = `${this.baseURL}/director/create`;
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
      console.error('❌ Error al crear usuario staff:', error);
      return {
        success: false,
        error: error.message || 'Error al crear usuario staff'
      };
    }
  }

  /**
   * Obtener todos los usuarios staff de la institución
   * GET /director/staff
   * @returns {Promise<Object>} Respuesta con lista de usuarios staff
   */
  async getAllStaff() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo todo el personal staff');
        const fullURL = `${this.baseURL}/director/staff`;
        
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
          message: result.message || 'Personal obtenido exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener personal staff:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener personal staff',
        data: [],
        total_users: 0
      };
    }
  }

  /**
   * Obtener usuarios staff por rol
   * GET /director/by-role/{role}
   * @param {string} role - Rol a filtrar (TEACHER, AUXILIARY, SECRETARY)
   * @returns {Promise<Object>} Respuesta con lista de usuarios por rol
   */
  async getStaffByRole(role) {
    try {
      if (!role) {
        throw new Error('Rol requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('📋 Obteniendo personal por rol:', role);
        const fullURL = `${this.baseURL}/director/by-role/${role}`;
        
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
          message: result.message || 'Personal por rol obtenido exitosamente'
        };
      });
    } catch (error) {
      console.error('❌ Error al obtener personal por rol:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener personal por rol',
        data: [],
        total_users: 0
      };
    }
  }

  /**
   * Actualizar usuario staff
   * PUT /director/update/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<Object>} Datos del usuario actualizado
   */
  async updateStaffUser(keycloakId, userData) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Actualizando usuario staff:', {
          keycloakId,
          userData: { ...userData, password: '[HIDDEN]' }
        });
        
        const fullURL = `${this.baseURL}/director/update/${keycloakId}`;
        
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
        error: error.message || 'Error al actualizar usuario staff'
      };
    }
  }

  /**
   * Eliminar usuario staff (eliminación física)
   * DELETE /director/delete/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Mensaje de respuesta
   */
  async deleteStaffUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🗑️ Eliminando usuario staff:', keycloakId);
        const fullURL = `${this.baseURL}/director/delete/${keycloakId}`;
        
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
        error: error.message || 'Error al eliminar usuario staff'
      };
    }
  }

  /**
   * Desactivar usuario staff
   * PATCH /director/deactivate/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario desactivado
   */
  async deactivateStaffUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Desactivando usuario staff:', keycloakId);
        const fullURL = `${this.baseURL}/director/deactivate/${keycloakId}`;
        
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
        error: error.message || 'Error al desactivar usuario staff'
      };
    }
  }

  /**
   * Activar usuario staff
   * PATCH /director/activate/{user_id}
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @returns {Promise<Object>} Datos del usuario activado
   */
  async activateStaffUser(keycloakId) {
    try {
      if (!keycloakId) {
        throw new Error('ID de usuario requerido');
      }

      return await this.executeWithRetry(async () => {
        console.log('🔄 Activando usuario staff:', keycloakId);
        const fullURL = `${this.baseURL}/director/activate/${keycloakId}`;
        
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
        error: error.message || 'Error al activar usuario staff'
      };
    }
  }

  /**
   * Cambiar estado de usuario staff (método auxiliar)
   * @param {string} keycloakId - ID del usuario en Keycloak
   * @param {string} status - Nuevo estado del usuario ('activate' o 'deactivate')
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  async changeStaffUserStatus(keycloakId, status) {
    try {
      if (status === 'activate' || status === 'ACTIVE') {
        return await this.activateStaffUser(keycloakId);
      } else if (status === 'deactivate' || status === 'INACTIVE') {
        return await this.deactivateStaffUser(keycloakId);
      } else {
        throw new Error(`Estado inválido: ${status}`);
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

    // Validar que el rol sea permitido para director (TEACHER, AUXILIARY, SECRETARY)
    const allowedRoles = ['TEACHER', 'AUXILIARY', 'SECRETARY'];
    const userRoles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
    const hasInvalidRole = userRoles.some(role => !allowedRoles.includes(role));
    
    if (hasInvalidRole) {
      errors.push('Solo puede crear usuarios con roles: TEACHER, AUXILIARY, SECRETARY');
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

    // NO incluir institutionId ya que se asigna automáticamente en el backend
    // NO incluir password para que se genere automáticamente
    
    return formattedData;
  }

  /**
   * Obtener información completa de usuarios staff por rol
   * @returns {Promise<Object>} Objeto con teachers, auxiliaries y secretaries separados
   */
  async getAllStaffComplete() {
    try {
      console.log('📊 Obteniendo información completa de usuarios staff');
      
      const [teachersResponse, auxiliariesResponse, secretariesResponse] = await Promise.all([
        this.getStaffByRole('TEACHER'),
        this.getStaffByRole('AUXILIARY'),
        this.getStaffByRole('SECRETARY')
      ]);
      
      return {
        success: true,
        teachers: teachersResponse,
        auxiliaries: auxiliariesResponse,
        secretaries: secretariesResponse,
        totalTeachers: teachersResponse?.total_users || 0,
        totalAuxiliaries: auxiliariesResponse?.total_users || 0,
        totalSecretaries: secretariesResponse?.total_users || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al obtener información completa:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener información completa de usuarios staff'
      };
    }
  }

  // ========================================
  // Métodos de compatibilidad con versión anterior
  // Para mantener compatibilidad con componentes existentes
  // ========================================

  /**
   * MÉTODO DE COMPATIBILIDAD: Obtener todos los usuarios staff
   * Alias de getAllStaff() para compatibilidad
   * @deprecated Use getAllStaff() en su lugar
   */
  async getAllCompleteUsers() {
    console.warn('⚠️ getAllCompleteUsers() está deprecado, use getAllStaff()');
    const response = await this.getAllStaff();
    // Retornar solo los datos para compatibilidad con código anterior
    return response.data || [];
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Obtener usuario por Keycloak ID
   * @deprecated Este endpoint ya no existe en el backend, devuelve null
   */
  async getCompleteUserByKeycloakId(keycloakId) {
    console.warn('⚠️ getCompleteUserByKeycloakId() ya no está disponible en el backend');
    // Buscar el usuario en la lista de todos los staff
    const response = await this.getAllStaff();
    if (response.success && Array.isArray(response.data)) {
      const user = response.data.find(u => u.keycloakId === keycloakId);
      return user || null;
    }
    return null;
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Obtener usuario por username
   * @deprecated Este endpoint ya no existe en el backend, devuelve null
   */
  async getCompleteUserByUsername(username) {
    console.warn('⚠️ getCompleteUserByUsername() ya no está disponible en el backend');
    // Buscar el usuario en la lista de todos los staff
    const response = await this.getAllStaff();
    if (response.success && Array.isArray(response.data)) {
      const user = response.data.find(u => u.username === username);
      return user || null;
    }
    return null;
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Crear usuario completo
   * Alias de createStaffUser() para compatibilidad
   * @deprecated Use createStaffUser() en su lugar
   */
  async createCompleteUser(userData) {
    console.warn('⚠️ createCompleteUser() está deprecado, use createStaffUser()');
    return await this.createStaffUser(userData);
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Actualizar usuario completo
   * Alias de updateStaffUser() para compatibilidad
   * @deprecated Use updateStaffUser() en su lugar
   */
  async updateCompleteUser(keycloakId, userData) {
    console.warn('⚠️ updateCompleteUser() está deprecado, use updateStaffUser()');
    return await this.updateStaffUser(keycloakId, userData);
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Eliminar usuario completo
   * Alias de deleteStaffUser() para compatibilidad
   * @deprecated Use deleteStaffUser() en su lugar
   */
  async deleteCompleteUser(keycloakId) {
    console.warn('⚠️ deleteCompleteUser() está deprecado, use deleteStaffUser()');
    return await this.deleteStaffUser(keycloakId);
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Activar usuario
   * Alias de activateStaffUser() para compatibilidad
   * @deprecated Use activateStaffUser() en su lugar
   */
  async activateUser(keycloakId) {
    console.warn('⚠️ activateUser() está deprecado, use activateStaffUser()');
    return await this.activateStaffUser(keycloakId);
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Desactivar usuario
   * Alias de deactivateStaffUser() para compatibilidad
   * @deprecated Use deactivateStaffUser() en su lugar
   */
  async deactivateUser(keycloakId) {
    console.warn('⚠️ deactivateUser() está deprecado, use deactivateStaffUser()');
    return await this.deactivateStaffUser(keycloakId);
  }

  /**
   * MÉTODO DE COMPATIBILIDAD: Cambiar estado de usuario
   * Alias de changeStaffUserStatus() para compatibilidad
   * @deprecated Use changeStaffUserStatus() en su lugar
   */
  async changeUserStatus(keycloakId, status) {
    console.warn('⚠️ changeUserStatus() está deprecado, use changeStaffUserStatus()');
    return await this.changeStaffUserStatus(keycloakId, status);
  }
}

// Exportar instancia única del servicio
const directorUserService = new DirectorUserService();
export default directorUserService;
