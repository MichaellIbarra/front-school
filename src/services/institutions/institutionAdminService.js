import { Institution, validateInstitution } from '../../types/institutions';
import { refreshTokenKeycloak } from '../../auth/authService';

class InstitutionAdminService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/institutions/admin`;
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
   * Obtiene todas las instituciones (para administradores)
   * GET /api/v1/institutions/admin
   */
  async getAllInstitutions() {
    try {
      return await this.executeWithRetry(async () => {
        console.log('📤 Obteniendo todas las instituciones (admin):', this.baseURL);
        
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
          data: result.institutions || [],
          totalInstitutions: result.totalInstitutions || 0,
          message: result.message || 'Instituciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener instituciones (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las instituciones',
        data: [],
        totalInstitutions: 0
      };
    }
  }

  /**
   * Obtiene una institución por ID (para administradores)
   * GET /api/v1/institutions/admin/{id}
   */
  async getInstitutionById(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/${id}`;
        console.log('📤 Obteniendo institución por ID (admin):', fullURL);

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
          data: result.institution || null,
          message: result.message || 'Institución encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener institución (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la institución',
        data: null
      };
    }
  }

  /**
   * Crea una nueva institución (para administradores)
   * POST /api/v1/institutions/admin/create
   */
  async createInstitution(institutionData) {
    try {
      // Validar los datos antes de enviar
      const validation = validateInstitution(institutionData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de institución inválidos',
          validationErrors: validation.errors
        };
      }

      // Función para limpiar texto y remover caracteres problemáticos
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/[\t\n\r\f\v]/g, ' ')  // Remover espacios problemáticos
          .replace(/\s+/g, ' ')            // Múltiples espacios a uno
          .trim();
      };

      // Crear el payload con los datos limpiados (sin ID, se genera en el backend)
      const payload = {
        name: cleanText(institutionData.name),
        codeInstitution: String(institutionData.codeInstitution || '').trim(),
        logo: String(institutionData.logo || '').trim(),
        address: cleanText(institutionData.address),
        contactEmail: String(institutionData.contactEmail || '').trim().toLowerCase(),
        contactPhone: String(institutionData.contactPhone || '').replace(/\D/g, ''),
        uiSettings: {
          color: institutionData.uiSettings?.color || '#FF0000',
          logoPosition: institutionData.uiSettings?.logoPosition || 'LEFT',
          showStudentPhotos: Boolean(institutionData.uiSettings?.showStudentPhotos)
        },
        evaluationSystem: {
          gradeScale: institutionData.evaluationSystem?.gradeScale || 'NUMERICAL_0_20',
          minimumPassingGrade: Number(institutionData.evaluationSystem?.minimumPassingGrade) || 10.5,
          showDecimals: Boolean(institutionData.evaluationSystem?.showDecimals)
        },
        scheduleSettings: {
          morningStartTime: institutionData.scheduleSettings?.morningStartTime || '08:00',
          morningEndTime: institutionData.scheduleSettings?.morningEndTime || '12:00',
          afternoonStartTime: institutionData.scheduleSettings?.afternoonStartTime || '14:00',
          afternoonEndTime: institutionData.scheduleSettings?.afternoonEndTime || '18:00',
          nightStartTime: institutionData.scheduleSettings?.nightStartTime || '19:00',
          nightEndTime: institutionData.scheduleSettings?.nightEndTime || '22:00'
        }
      };

      // Asegurar que no hay valores null o undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          payload[key] = '';
        }
      });

      console.log('📋 Datos a enviar:', payload);

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/create`;
        console.log('📤 Creando institución (admin):', {
          url: fullURL,
          method: 'POST',
          bodySize: JSON.stringify(payload).length
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
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.institution || null,
          message: result.message || 'Institución creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear institución (admin):', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al crear la institución';
      
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
   * Actualiza una institución existente (para administradores)
   * PUT /api/v1/institutions/admin/{id}
   */
  async updateInstitution(id, institutionData) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      // Validar los datos antes de enviar
      const validation = validateInstitution(institutionData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos de institución inválidos',
          validationErrors: validation.errors
        };
      }

      // Función para limpiar texto
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .trim()
          .replace(/[\t\n\r\f\v]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Crear el payload con los datos limpiados
      const payload = {
        name: cleanText(institutionData.name),
        codeInstitution: String(institutionData.codeInstitution || '').trim(),
        logo: String(institutionData.logo || '').trim(),
        address: cleanText(institutionData.address),
        contactEmail: String(institutionData.contactEmail || '').trim().toLowerCase(),
        contactPhone: String(institutionData.contactPhone || '').replace(/\D/g, ''),
        status: institutionData.status || 'A',
        uiSettings: institutionData.uiSettings || {},
        evaluationSystem: institutionData.evaluationSystem || {},
        scheduleSettings: institutionData.scheduleSettings || {}
      };

      console.log('📋 Datos a actualizar:', payload);

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/update/${id}`;
        console.log('📤 Actualizando institución (admin):', {
          url: fullURL,
          method: 'PUT',
          bodySize: JSON.stringify(payload).length
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
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.institution || null,
          message: result.message || 'Institución actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar institución (admin):', error);
      
      let errorMessage = 'Error al actualizar la institución';
      
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
   * Desactiva una institución (soft delete)
   * POST /api/v1/institutions/admin/delete/{id}
   */
  async deleteInstitution(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/delete/${id}`;
        console.log('📤 Desactivando institución (admin):', fullURL);

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
          message: result.message || 'Institución desactivada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al desactivar institución (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al desactivar la institución'
      };
    }
  }
   async restoreInstitution(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/restore/${id}`;
        console.log('📤 Desactivando institución (admin):', fullURL);

        const response = await fetch(fullURL, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          message: result.message || 'Institución desactivada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al desactivar institución (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al desactivar la institución'
      };
    }
  }


  /**
   * Sube el logo de una institución
   * POST /api/v1/institutions/admin/{id}/upload-logo
   */
  async uploadLogo(id, logoFile) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      if (!logoFile) {
        throw new Error('Archivo de logo requerido');
      }

      // Crear FormData para el archivo
      const formData = new FormData();
      formData.append('logo', logoFile);

      return await this.executeWithRetry(async () => {
        const fullURL = `${this.baseURL}/${id}/upload-logo`;
        console.log('📤 Subiendo logo (admin):', {
          url: fullURL,
          fileName: logoFile.name,
          fileSize: logoFile.size
        });

        const response = await fetch(fullURL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
            // No incluir Content-Type para FormData, el navegador lo maneja automáticamente
          },
          body: formData
        });

        console.log('📥 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText
        });

        const result = await this.handleResponse(response);
        console.log('🔍 Datos parseados del upload:', result);
        
        return {
          success: true,
          data: result.institution || result, // Maneja ambos casos: {institution: {...}} o directamente {...}
          message: result.message || 'Logo subido exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al subir logo (admin):', error);
      return {
        success: false,
        error: error.message || 'Error al subir el logo'
      };
    }
  }

//   Buscar instituciones en MINEDU por código (mínimo 6 caracteres)
    async searchMinEduInstitutions(codInstitution) {
      try {
        if (!codInstitution || codInstitution.length < 6) {
          return {
            success: false,
            error: 'El código de institución debe tener al menos 6 caracteres',
            data: []
          };
        }
  
        const response = await fetch(`https://matichain.dev/instituciones?codinst=${codInstitution}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        
        console.log('🔍 Datos recibidos de MINEDU:', data);
        
        return {
          success: true,
          data: data, // Devolver toda la estructura de datos
          message: `${data.data?.items?.length || 0} instituciones encontradas`
        };
      } catch (error) {
        console.error('Error al buscar instituciones en MINEDU:', error);
        return {
          success: false,
          error: error.message || 'Error al buscar instituciones en MINEDU',
          data: []
        };
      }
    }
  
  /**
   * Crea una nueva institución con valores por defecto
   */
  createNewInstitution() {
    return {
      ...Institution,
      createdAt: new Date().toISOString()
    };
  }
}

export default new InstitutionAdminService();