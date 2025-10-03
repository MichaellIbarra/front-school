
import { Institution, validateInstitution } from '../../types/institutions';
import { refreshTokenKeycloak } from '../../auth/authService';

class InstitutionService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/institutions`;
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
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.message === 'TOKEN_REFRESHED') {
        throw error; // Re-lanzar la señal especial
      }
      
      // Error de parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
   * Obtiene todas las instituciones
   * GET /api/v1/institutions
   */
  async getAllInstitutions() {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Instituciones obtenidas exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al obtener instituciones:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener las instituciones',
        data: []
      };
    }
  }

  /**
   * Obtiene una institución por ID
   * GET /api/v1/institutions/{id}
   */
  async getInstitutionById(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null, // El backend retorna array, tomamos el primer elemento
          metadata: result.metadata,
          message: result.metadata?.message || 'Institución encontrada'
        };
      });
    } catch (error) {
      console.error('Error al obtener institución:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la institución',
        data: null
      };
    }
  }

  /**
   * Crea una nueva institución
   * POST /api/v1/institutions
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

      // Crear el payload sin el ID (se genera en el backend)
      const payload = {
        name: institutionData.name,
        codeName: institutionData.codeName,
        logo: institutionData.logo || '',
        modularCode: institutionData.modularCode,
        address: institutionData.address,
        contactEmail: institutionData.contactEmail,
        contactPhone: institutionData.contactPhone,
        status: institutionData.status || 'A',
        uiSettings: institutionData.uiSettings || {
          color: '#3498DB',
          logoPosition: 'LEFT',
          showStudentPhotos: false
        },
        evaluationSystem: institutionData.evaluationSystem || {
          gradeScale: 'NUMERICAL_0_100',
          minimumPassingGrade: 60.0,
          showDecimals: false
        },
        scheduleSettings: institutionData.scheduleSettings || {
          morningStartTime: '07:30:00',
          morningEndTime: '11:30:00',
          afternoonStartTime: '13:00:00',
          afternoonEndTime: '17:00:00'
        }
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data,
          metadata: result.metadata,
          message: result.metadata?.message || 'Institución creada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al crear institución:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la institución'
      };
    }
  }

  /**
   * Actualiza una institución existente
   * PUT /api/v1/institutions/{id}
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

      // Crear el payload sin el ID
      const payload = {
        name: institutionData.name,
        codeName: institutionData.codeName,
        logo: institutionData.logo || '',
        modularCode: institutionData.modularCode,
        address: institutionData.address,
        contactEmail: institutionData.contactEmail,
        contactPhone: institutionData.contactPhone,
        status: institutionData.status,
        uiSettings: institutionData.uiSettings,
        evaluationSystem: institutionData.evaluationSystem,
        scheduleSettings: institutionData.scheduleSettings
      };

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data?.[0] || null, // El backend retorna array, tomamos el primer elemento
          metadata: result.metadata,
          message: result.metadata?.message || 'Institución actualizada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al actualizar institución:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la institución'
      };
    }
  }

  /**
   * Elimina una institución
   * DELETE /api/v1/institutions/{id}
   */
  async deleteInstitution(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Institución eliminada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al eliminar institución:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la institución'
      };
    }
  }

  /**
   * Restaura una institución eliminada
   * PUT /api/v1/institutions/restore/{id}
   */
  async restoreInstitution(id) {
    try {
      if (!id) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/restore/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders()
        });

        const result = await this.handleResponse(response);
        
        return {
          success: true,
          data: result.data || [],
          metadata: result.metadata,
          message: result.metadata?.message || 'Institución restaurada exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al restaurar institución:', error);
      return {
        success: false,
        error: error.message || 'Error al restaurar la institución'
      };
    }
  }

  /**
   * Cambia el estado de una institución (Activo/Inactivo)
   */
  async toggleInstitutionStatus(id, currentStatus) {
    try {
      // Primero obtener la institución actual
      const institutionResult = await this.getInstitutionById(id);
      
      if (!institutionResult.success) {
        return institutionResult;
      }

      const institution = institutionResult.data;
      const newStatus = currentStatus === 'A' ? 'I' : 'A';
      
      // Actualizar solo el estado
      return await this.updateInstitution(id, {
        ...institution,
        status: newStatus
      });
    } catch (error) {
      console.error('Error al cambiar estado de institución:', error);
      return {
        success: false,
        error: error.message || 'Error al cambiar el estado de la institución'
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

  /**
   * Obtiene todos los directores de una institución
   * GET /api/v1/institutions/{institutionId}/directors
   */
  async getDirectorsByInstitutionId(institutionId) {
    try {
      if (!institutionId) {
        throw new Error('ID de institución requerido');
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseURL}/${institutionId}/directors`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        const data = await this.handleResponse(response);
        return {
          success: true,
          data: data || []
        };
      });
    } catch (error) {
      console.error('Error al obtener directores por institución:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los directores',
        data: []
      };
    }
  }

  /**
   * Asigna un director a una institución
   * POST /api/v1/user-admin/users
   */
  async assignDirector(institutionId, directorData) {
    try {
      if (!institutionId) {
        throw new Error('ID de institución requerido');
      }

      // Validar los datos del director
      if (!directorData.username || !directorData.email || !directorData.firstname || 
          !directorData.lastname || !directorData.documentNumber) {
        throw new Error('Todos los campos del director son requeridos');
      }

      const payload = {
        institutionId: institutionId, // Mover al principio para asegurar prioridad
        username: directorData.username,
        email: directorData.email,
        firstname: directorData.firstname,
        lastname: directorData.lastname,
        roles: directorData.roles || ['director'],
        documentType: directorData.documentType || 'DNI',
        documentNumber: directorData.documentNumber,
        phone: directorData.phone || '',
        status: directorData.status || 'A'
      };

      console.log('🔍 SERVICE - Institution ID received:', institutionId);
      console.log('🔍 SERVICE - Director data received:', directorData);
      console.log('🚀 SERVICE - Final payload:', JSON.stringify(payload, null, 2));

      return await this.executeWithRetry(async () => {
        const response = await fetch(`https://lab.vallegrande.edu.pe/school/userdos/api/v1/user-admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // Sin Authorization - la API no lo requiere
          },
          body: JSON.stringify(payload),
        });

        console.log('🔍 SERVICE - Response status:', response.status);
        console.log('🔍 SERVICE - Response headers:', response.headers);

        const data = await this.handleResponse(response);
        console.log('🔍 SERVICE - Response data:', data);
        
        return {
          success: true,
          data: data,
          message: data.data?.createMessage || data.message || 'Director asignado exitosamente'
        };
      });
    } catch (error) {
      console.error('Error al asignar director:', error);
      return {
        success: false,
        error: error.message || 'Error al asignar el director'
      };
    }
  }
}

export default new InstitutionService();