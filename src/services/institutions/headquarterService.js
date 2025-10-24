import { Headquarter, validateHeadquarter } from '../../types/institutions';
import { refreshTokenKeycloak } from '../auth/authService';

class HeadquarterService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1`;
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
        // Extraer mensaje de error más específico del backend
        const errorMessage = data.metadata?.message || data.message || `HTTP error! status: ${response.status}`;
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
   * Obtiene todas las sedes de una institución
   * GET /api/v1/institutions/{institutionId}/headquarters
   */
  async getHeadquartersByInstitutionId(institutionId) {
    try {
      if (!institutionId) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/institutions/${institutionId}/headquarters`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Sedes obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener sedes por institución:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las sedes',
        data: []
      };
    }
  }

  /**
   * Obtiene una sede por ID
   * GET /api/v1/headquarters/{id}
   */
  async getHeadquarterById(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/headquarters/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null, // El backend retorna array, tomamos el primer elemento
          metadata: result.metadata,
          message: result.metadata?.message || 'Sede encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener sede:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la sede',
        data: null
      };
    }
  }

  /**
   * Crea una nueva sede
   * POST /api/v1/headquarters
   */
  async createHeadquarter(headquarterData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateHeadquarter(headquarterData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de sede inválidos',
          validationErrors: validation.errors
        };
      }

      // Función para limpiar y validar texto
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remover caracteres no imprimibles
          .replace(/[\t\n\r\f\v]/g, ' ')  // Remover espacios problemáticos
          .replace(/\s+/g, ' ')            // Múltiples espacios a uno
          .trim();
      };

      // Asegurar que modularCode sea un array válido
      let modularCodeArray = [];
      if (Array.isArray(headquarterData.modularCode)) {
        modularCodeArray = headquarterData.modularCode;
      } else if (typeof headquarterData.modularCode === 'string') {
        try {
          modularCodeArray = JSON.parse(headquarterData.modularCode);
        } catch (e) {
          modularCodeArray = [];
        }
      }

      // Crear el payload sin el ID (se genera en el backend) con datos limpiados
      const payload = {
        institutionId: String(headquarterData.institutionId || '').trim(),
        headquartersName: cleanText(headquarterData.headquartersName) || '',
        headquartersCode: cleanText(headquarterData.headquartersCode) || '',
        modularCode: modularCodeArray, // Enviar como array JSON, no como string
        address: cleanText(headquarterData.address) || '',
        contactPerson: cleanText(headquarterData.contactPerson) || '',
        contactEmail: String(headquarterData.contactEmail || '').trim().toLowerCase(),
        contactPhone: String(headquarterData.contactPhone || '').replace(/\D/g, ''),
        status: String(headquarterData.status || 'A')
      };

      // Asegurar que no hay valores null o undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          if (key === 'modularCode') {
            payload[key] = [];
          } else {
            payload[key] = '';
          }
        }
      });

      // Validación adicional antes de enviar
      if (!payload.institutionId || !payload.headquartersName || !payload.headquartersCode) {
        return {
          success: false,
          error: 'Faltan datos obligatorios: institutionId, headquartersName, headquartersCode'
        };
      }

      console.log('📝 Payload a enviar:', payload);
      console.log('🔍 Códigos modulares (array):', payload.modularCode);

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/headquarters`;
        console.log('📤 Enviando request POST:', {
          url: fullURL,
          method: 'POST',
          headers: this.getAuthHeaders(),
          bodySize: JSON.stringify(payload).length,
          payloadPreview: {
            ...payload,
            modularCode: `[${payload.modularCode.length} códigos]`
          }
        });

        const response = await fetch(fullURL, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null, // El backend retorna array, tomamos el primer elemento
          metadata: result.metadata,
          message: result.metadata?.message || 'Sede creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear sede:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al crear la sede';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con el servidor';
      } else if (error.message.includes('400')) {
        errorMessage = `Error del servidor (400): ${error.message}`;
      } else if (error.message.includes('500')) {
        errorMessage = `Error del servidor (500): ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
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
   * Actualiza una sede existente
   * PUT /api/v1/headquarters/{id}
   */
  async updateHeadquarter(id, headquarterData) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateHeadquarter(headquarterData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de sede inválidos',
          validationErrors: validation.errors
        };
      }

      // Función para limpiar y validar texto
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remover caracteres no imprimibles
          .replace(/[\t\n\r\f\v]/g, ' ')  // Remover espacios problemáticos
          .replace(/\s+/g, ' ')            // Múltiples espacios a uno
          .trim();
      };

      // Asegurar que modularCode sea un array válido
      let modularCodeArray = [];
      if (Array.isArray(headquarterData.modularCode)) {
        modularCodeArray = headquarterData.modularCode;
      } else if (typeof headquarterData.modularCode === 'string') {
        try {
          modularCodeArray = JSON.parse(headquarterData.modularCode);
        } catch (e) {
          modularCodeArray = [];
        }
      }

      // Crear el payload sin el ID
      const payload = {
        institutionId: String(headquarterData.institutionId || '').trim(),
        headquartersName: cleanText(headquarterData.headquartersName) || '',
        headquartersCode: cleanText(headquarterData.headquartersCode) || '',
        modularCode: modularCodeArray, // Enviar como array JSON, no como string
        address: cleanText(headquarterData.address) || '',
        contactPerson: cleanText(headquarterData.contactPerson) || '',
        contactEmail: String(headquarterData.contactEmail || '').trim().toLowerCase(),
        contactPhone: String(headquarterData.contactPhone || '').replace(/\D/g, ''),
        status: String(headquarterData.status || 'A')
      };

      // Asegurar que no hay valores null o undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          if (key === 'modularCode') {
            payload[key] = [];
          } else {
            payload[key] = '';
          }
        }
      });

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/headquarters/${id}`;
        console.log('📤 Enviando request PUT:', {
          url: fullURL,
          method: 'PUT',
          headers: this.getAuthHeaders(),
          bodySize: JSON.stringify(payload).length,
          payloadPreview: {
            ...payload,
            modularCode: `[${payload.modularCode.length} códigos]`
          }
        });

        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: {
            ...this.getAuthHeaders(),
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null, // El backend retorna array, tomamos el primer elemento
          metadata: result.metadata,
          message: result.metadata?.message || 'Sede actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar sede:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al actualizar la sede';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con el servidor';
      } else if (error.message.includes('400')) {
        errorMessage = `Error del servidor (400): ${error.message}`;
      } else if (error.message.includes('500')) {
        errorMessage = `Error del servidor (500): ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
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
   * Elimina una sede
   * DELETE /api/v1/headquarters/{id}
   */
  async deleteHeadquarter(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/headquarters/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Sede eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar sede:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la sede'
      };
    }
  }

  /**
   * Restaura una sede eliminada
   * PUT /api/v1/headquarters/restore/{id}
   */
  async restoreHeadquarter(id) {
    try {
      if (!id) {
        throw new Error('ID de sede requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/headquarters/restore/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Sede restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar sede:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la sede'
      };
    }
  }

  /**
   * Cambia el estado de una sede (Activo/Inactivo)
   */
  async toggleHeadquarterStatus(id, currentStatus) {
    try {
      // Primero obtener la sede actual
      const headquarterResult = await this.getHeadquarterById(id);
      
      if (!headquarterResult.success) {
        return headquarterResult;
      }

      const headquarter = headquarterResult.data;
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
      
      // Actualizar solo el estado
      return await this.updateHeadquarter(id, {
        ...headquarter,
        status: newStatus
      });
    } catch (error) {
      console.error('Error al cambiar estado de sede:', error);
      return {
        success: false,
        error: error.message || 'Error al cambiar el estado de la sede'
      };
    }
  }

  /**
   * Crea una nueva sede con valores por defecto
   */
  createNewHeadquarter(institutionId) {
    return {
      ...Headquarter,
      institutionId,
      createdAt: new Date().toISOString()
    };
  }
}

export default new HeadquarterService();