/**
 * Servicio para administración de sedes
 * Maneja todas las operaciones CRUD para sedes de instituciones educativas
 */

import { validateHeadquarter } from '../../types/institutions';
import { refreshTokenKeycloak } from '../auth/authService';

class HeadquarterAdminService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/headquarters/admin`;
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
          console.log('✅ Token renovado exitosamente');
          throw new Error('TOKEN_REFRESHED'); // Señal especial para reintento
        } else {
          console.log('❌ Error al renovar token:', refreshResult.error);
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          
          // Redirigir al login después de un pequeño delay
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
   * Obtiene todas las sedes (para administradores)
   * GET /api/v1/headquarters/admin
   */
  async getAllHeadquarters() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo todas las sedes (admin):', this.baseURL);
        
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
        
        return {
          success: true,
          data: result.headquarters || [],
          totalHeadquarters: result.totalHeadquarters || 0,
          message: result.message || 'Sedes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sedes (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las sedes',
        data: [],
        totalHeadquarters: 0
      };
    }
  }

  /**
   * Obtiene una sede por ID (para administradores)
   * GET /api/v1/headquarters/admin/{id}
   */
  async getHeadquarterById(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido');
      }

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/${id}`;
        console.log('📤 Obteniendo sede por ID (admin):', fullURL);

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
          data: result.headquarter || null,
          message: result.message || 'Sede obtenida exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sede (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la sede',
        data: null
      };
    }
  }

  /**
   * Crea una nueva sede (para administradores)
   * POST /api/v1/headquarters/admin/create
   */
  async createHeadquarter(headquarterData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateHeadquarter(headquarterData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        console.error('🚨 Errores de validación:', validation.errors);
        throw new Error(errorMessages);
      }

      // Función para limpiar texto y remover caracteres problemáticos
      const cleanText = (text) => {
        if (!text) return '';
        return String(text)
          .trim()
          .replace(/\s+/g, ' '); // Normalizar espacios
      };

      // Crear el payload con los datos limpiados (sin ID, se genera en el backend)
      const payload = {
        institutionId: String(headquarterData.institutionId || '').trim(),
        name: cleanText(headquarterData.name),
        modularCode: Array.isArray(headquarterData.modularCode) ? 
          headquarterData.modularCode.map(code => String(code).trim()) : [],
        address: cleanText(headquarterData.address),
        phone: String(headquarterData.phone || '').replace(/\D/g, '') // Solo números
      };

      // Asegurar que no hay valores null o undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          payload[key] = '';
        }
      });

      console.log('📋 Datos a enviar:', payload);

      return await this.executeWithRetry(async () => {
        const createURL = `${this.baseURL}/create`;
        console.log('📤 Creando sede (admin):', createURL);

        const response = await fetch(createURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta de creación:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarter || result,
          message: result.message || 'Sede creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear sede (admin):', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al crear la sede';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message.includes('validation') || error.message.includes('requer')) {
        errorMessage = error.message;
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'Ya existe una sede con estos datos. Verifica el código modular.';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: {
          originalError: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Actualiza una sede existente (para administradores)
   * PUT /api/v1/headquarters/admin/update/{id}
   */
  async updateHeadquarter(id, headquarterData) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido para actualización');
      }

      // Validar los datos antes de enviar
      const validation = validateHeadquarter(headquarterData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        console.error('🚨 Errores de validación:', validation.errors);
        throw new Error(errorMessages);
      }

      // Función para limpiar texto
      const cleanText = (text) => {
        if (!text) return '';
        return String(text)
          .trim()
          .replace(/\s+/g, ' '); // Normalizar espacios
      };

      // Crear el payload con los datos limpiados
      const payload = {
        name: cleanText(headquarterData.name),
        modularCode: Array.isArray(headquarterData.modularCode) ? 
          headquarterData.modularCode.map(code => String(code).trim()) : [],
        address: cleanText(headquarterData.address),
        phone: String(headquarterData.phone || '').replace(/\D/g, '') // Solo números
      };

      console.log('📋 Datos a actualizar:', payload);

      return await this.executeWithRetry(async () => {
        const updateURL = `${this.baseURL}/update/${id}`;
        console.log('📤 Actualizando sede (admin):', updateURL);

        const response = await fetch(updateURL, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta de actualización:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.headquarter || result,
          message: result.message || 'Sede actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar sede (admin):', error);
      
      let errorMessage = 'Error al actualizar la sede';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message.includes('validation') || error.message.includes('requer')) {
        errorMessage = error.message;
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'Ya existe una sede con estos datos. Verifica el código modular.';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: {
          originalError: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Desactiva una sede (soft delete)
   * DELETE /api/v1/headquarters/admin/delete/{id}
   */
  async deleteHeadquarter(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido para eliminación');
      }

      return await this.executeWithRetry(async () => {
        const deleteURL = `${this.baseURL}/delete/${id}`;
        console.log('📤 Desactivando sede (admin):', deleteURL);

        const response = await fetch(deleteURL, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta de eliminación:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Sede desactivada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al desactivar sede (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al desactivar la sede'
      };
    }
  }

  /**
   * Restaura una sede (activar)
   * PUT /api/v1/headquarters/admin/restore/{id}
   */
  async restoreHeadquarter(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido para restauración');
      }

      return await this.executeWithRetry(async () => {
        const restoreURL = `${this.baseURL}/restore/${id}`;
        console.log('📤 Restaurando sede (admin):', restoreURL);

        const response = await fetch(restoreURL, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta de restauración:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Sede restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar sede (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la sede'
      };
    }
  }

  /**
   * Obtiene sedes por ID de institución
   * GET /api/v1/headquarters/admin/institution/{institutionId}
   */
  async getHeadquartersByInstitution(institutionId) {
    try {
      if (!institutionId) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const institutionURL = `${this.baseURL}/institution/${institutionId}`;
        console.log('📤 Obteniendo sedes por institución (admin):', institutionURL);

        const response = await fetch(institutionURL, {
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
          data: result.headquarters || [],
          totalHeadquarters: result.totalHeadquarters || 0,
          message: result.message || 'Sedes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sedes por institución (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las sedes de la institución',
        data: [],
        totalHeadquarters: 0
      };
    }
  }

  /**
   * Crea una nueva sede con valores por defecto
   */
  createNewHeadquarter(institutionId) {
    return {
      id: null,
      institutionId: institutionId || null,
      name: '',
      modularCode: [],
      address: '',
      phone: '',
      status: 'A',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Valida códigos modulares
   */
  validateModularCodes(codes) {
    if (!Array.isArray(codes)) {
      return { valid: false, error: 'Los códigos modulares deben ser un array' };
    }
    
    if (codes.length === 0) {
      return { valid: false, error: 'Debe contener al menos un código modular' };
    }

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (typeof code !== 'string' || code.trim().length < 5 || code.trim().length > 10) {
        return { 
          valid: false, 
          error: `El código modular "${code}" debe tener entre 5 y 10 caracteres` 
        };
      }
    }

    return { valid: true };
  }
}

export default new HeadquarterAdminService();