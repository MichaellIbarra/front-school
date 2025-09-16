import axios from 'axios';
import { Period, PeriodRequest } from '../../types/academic/period.types';
import { refreshTokenKeycloak } from '../../auth/authService';

// Configuración del cliente API para el microservicio académico
const academicApiClient = axios.create({
  baseURL: `${process.env.REACT_APP_DOMAIN}/api/v1`, // URL del gateway
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejar errores globalmente y refresh token
academicApiClient.interceptors.response.use(
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
                        originalRequest.headers.Authorization = `Bearer ${refreshResult.data.access_token}`;
                        return academicApiClient(originalRequest);
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
        
        console.error('Error en PeriodService:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Interceptor para agregar token de autenticación si existe
academicApiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

const periodService = {
    /**
     * Crear un nuevo período académico
     * POST /api/v1/periods
     * @param {PeriodRequest} periodData - Datos del período a crear
     * @returns {Promise<{success: boolean, message: string, data?: Period}>}
     */
    async createPeriod(periodData) {
        try {
            const periodRequest = new PeriodRequest(periodData);
            const validation = periodRequest.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            const response = await academicApiClient.post('/periods', periodRequest);
            
            if (response.data.success && response.data.data) {
                const period = new Period(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Período creado exitosamente',
                    data: period
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al crear el período'
            };
        } catch (error) {
            console.error('Error al crear período:', error);
            return this.handleError(error, 'Error al crear el período');
        }
    },

    /**
     * Obtener todos los períodos
     * GET /api/v1/periods
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getAllPeriods() {
        try {
            const response = await academicApiClient.get('/periods');
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se pudieron obtener los períodos',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error('Error al obtener períodos:', error);
            const errorResult = this.handleError(error, 'Error al obtener períodos');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener período por ID
     * GET /api/v1/periods/{id}
     * @param {string} id - ID del período
     * @returns {Promise<{success: boolean, message: string, data?: Period}>}
     */
    async getPeriodById(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del período es requerido'
                };
            }

            const response = await academicApiClient.get(`/periods/${id}`);
            
            if (response.data.success && response.data.data) {
                const period = new Period(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Período encontrado',
                    data: period
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Período no encontrado'
            };
        } catch (error) {
            console.error(`Error al obtener período ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Período no encontrado'
                };
            }
            
            const errorResult = this.handleError(error, 'Error al obtener período');
            return {
                success: false,
                message: errorResult.message
            };
        }
    },

    /**
     * Obtener períodos por institución
     * GET /api/v1/periods/by-institution/{institutionId}
     * @param {string} institutionId - ID de la institución
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getPeriodsByInstitution(institutionId) {
        try {
            if (!institutionId?.trim()) {
                return {
                    success: false,
                    message: 'ID de institución es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/periods/by-institution/${institutionId}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron períodos para esta institución',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener períodos de institución ${institutionId}:`, error);
            const errorResult = this.handleError(error, 'Error al obtener períodos por institución');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener períodos por institución y nivel
     * GET /api/v1/periods/by-institution/{institutionId}/level/{level}
     * @param {string} institutionId - ID de la institución
     * @param {string} level - Nivel educativo
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getPeriodsByInstitutionAndLevel(institutionId, level) {
        try {
            if (!institutionId?.trim() || !level?.trim()) {
                return {
                    success: false,
                    message: 'ID de institución y nivel son requeridos',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/periods/by-institution/${institutionId}/level/${level}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron períodos para esta institución y nivel',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener períodos de institución ${institutionId} y nivel ${level}:`, error);
            const errorResult = this.handleError(error, 'Error al obtener períodos por institución y nivel');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener períodos por año académico
     * GET /api/v1/periods/academic-year/{academicYear}
     * @param {string} academicYear - Año académico
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getPeriodsByAcademicYear(academicYear) {
        try {
            if (!academicYear?.trim()) {
                return {
                    success: false,
                    message: 'Año académico es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/periods/academic-year/${academicYear}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron períodos para este año académico',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener períodos por año académico ${academicYear}:`, error);
            const errorResult = this.handleError(error, 'Error al obtener períodos por año académico');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener períodos por tipo
     * GET /api/v1/periods/type/{periodType}
     * @param {string} periodType - Tipo de período
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getPeriodsByType(periodType) {
        try {
            if (!periodType?.trim()) {
                return {
                    success: false,
                    message: 'Tipo de período es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/periods/type/${periodType}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron períodos de este tipo',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener períodos por tipo ${periodType}:`, error);
            const errorResult = this.handleError(error, 'Error al obtener períodos por tipo');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener períodos por estado
     * GET /api/v1/periods/status/{status}
     * @param {string} status - Estado del período (A/I)
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getPeriodsByStatus(status) {
        try {
            if (!status?.trim()) {
                return {
                    success: false,
                    message: 'Estado es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/periods/status/${status}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const periods = response.data.data.map(periodData => new Period(periodData));
                return {
                    success: true,
                    message: response.data.message || 'Períodos obtenidos exitosamente',
                    data: periods,
                    total: periods.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron períodos con este estado',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener períodos por estado ${status}:`, error);
            const errorResult = this.handleError(error, 'Error al obtener períodos por estado');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Actualizar un período
     * PUT /api/v1/periods/{id}
     * @param {string} id - ID del período
     * @param {PeriodRequest} periodData - Datos actualizados del período
     * @returns {Promise<{success: boolean, message: string, data?: Period}>}
     */
    async updatePeriod(id, periodData) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del período es requerido'
                };
            }

            const periodRequest = new PeriodRequest(periodData);
            const validation = periodRequest.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            const response = await academicApiClient.put(`/periods/${id}`, periodRequest);
            
            if (response.data.success && response.data.data) {
                const period = new Period(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Período actualizado exitosamente',
                    data: period
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al actualizar el período'
            };
        } catch (error) {
            console.error(`Error al actualizar período ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Período no encontrado'
                };
            }
            
            const errorResult = this.handleError(error, 'Error al actualizar período');
            return {
                success: false,
                message: errorResult.message
            };
        }
    },

    /**
     * Eliminado lógico - cambiar estado a 'I'
     * PATCH /api/v1/periods/{id}/delete
     * @param {string} id - ID del período
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async logicalDelete(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del período es requerido'
                };
            }

            const response = await academicApiClient.patch(`/periods/${id}/delete`);
            
            return {
                success: response.data.success || false,
                message: response.data.message || 'Operación completada'
            };
        } catch (error) {
            console.error(`Error al eliminar período ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Período no encontrado'
                };
            }
            
            const errorResult = this.handleError(error, 'Error al eliminar período');
            return {
                success: false,
                message: errorResult.message
            };
        }
    },

    /**
     * Restaurar período - cambiar estado a 'A'
     * PATCH /api/v1/periods/{id}/restore
     * @param {string} id - ID del período
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async restorePeriod(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del período es requerido'
                };
            }

            const response = await academicApiClient.patch(`/periods/${id}/restore`);
            
            return {
                success: response.data.success || false,
                message: response.data.message || 'Operación completada'
            };
        } catch (error) {
            console.error(`Error al restaurar período ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Período no encontrado'
                };
            }
            
            const errorResult = this.handleError(error, 'Error al restaurar período');
            return {
                success: false,
                message: errorResult.message
            };
        }
    },

    /**
     * Verificar si existe un período con los datos especificados
     * GET /api/v1/periods/exists?institutionId={}&level={}&period={}&academicYear={}
     * @param {string} institutionId - ID de la institución
     * @param {string} level - Nivel educativo
     * @param {string} period - Período
     * @param {string} academicYear - Año académico
     * @returns {Promise<{success: boolean, exists: boolean, message: string}>}
     */
    async existsPeriod(institutionId, level, period, academicYear) {
        try {
            if (!institutionId?.trim() || !level?.trim() || !period?.trim() || !academicYear?.trim()) {
                return {
                    success: false,
                    exists: false,
                    message: 'Todos los parámetros son requeridos'
                };
            }

            const params = new URLSearchParams({
                institutionId,
                level,
                period,
                academicYear
            });

            const response = await academicApiClient.get(`/periods/exists?${params}`);
            
            return {
                success: response.data.success || false,
                exists: response.data.exists || false,
                message: response.data.message || 'Consulta completada'
            };
        } catch (error) {
            console.error('Error al verificar existencia del período:', error);
            const errorResult = this.handleError(error, 'Error al verificar período');
            return {
                success: false,
                exists: false,
                message: errorResult.message
            };
        }
    },

    // Métodos utilitarios adicionales para el frontend

    /**
     * Obtener períodos activos de una institución
     * @param {string} institutionId - ID de la institución
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getActivePeriodsByInstitution(institutionId) {
        const result = await this.getPeriodsByInstitution(institutionId);
        if (result.success && result.data) {
            const activePeriods = result.data.filter(period => period.isActive);
            return {
                ...result,
                data: activePeriods,
                total: activePeriods.length
            };
        }
        return result;
    },

    /**
     * Obtener períodos en curso (fechas actuales dentro del rango)
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async getCurrentPeriods() {
        const result = await this.getAllPeriods();
        if (result.success && result.data) {
            const currentPeriods = result.data.filter(period => period.isCurrent);
            return {
                ...result,
                data: currentPeriods,
                total: currentPeriods.length,
                message: `Se encontraron ${currentPeriods.length} período(s) en curso`
            };
        }
        return result;
    },

    /**
     * Buscar períodos por múltiples criterios
     * @param {Object} searchCriteria - Criterios de búsqueda
     * @param {string} searchCriteria.institutionId - ID de la institución (opcional)
     * @param {string} searchCriteria.level - Nivel (opcional)
     * @param {string} searchCriteria.academicYear - Año académico (opcional)
     * @param {string} searchCriteria.periodType - Tipo de período (opcional)
     * @returns {Promise<{success: boolean, message: string, data?: Period[], total?: number}>}
     */
    async searchPeriods(searchCriteria) {
        try {
            let result;
            
            // Usar el endpoint más específico disponible
            if (searchCriteria.institutionId && searchCriteria.level) {
                result = await this.getPeriodsByInstitutionAndLevel(searchCriteria.institutionId, searchCriteria.level);
            } else if (searchCriteria.institutionId) {
                result = await this.getPeriodsByInstitution(searchCriteria.institutionId);
            } else if (searchCriteria.academicYear) {
                result = await this.getPeriodsByAcademicYear(searchCriteria.academicYear);
            } else if (searchCriteria.periodType) {
                result = await this.getPeriodsByType(searchCriteria.periodType);
            } else {
                result = await this.getAllPeriods();
            }

            if (!result.success || !result.data) {
                return result;
            }

            // Filtrar adicionales en el frontend
            let filteredPeriods = result.data;

            if (searchCriteria.academicYear && !searchCriteria.institutionId) {
                filteredPeriods = filteredPeriods.filter(period => 
                    period.academicYear === searchCriteria.academicYear
                );
            }

            if (searchCriteria.periodType && !searchCriteria.academicYear && !searchCriteria.institutionId) {
                filteredPeriods = filteredPeriods.filter(period => 
                    period.periodType === searchCriteria.periodType
                );
            }

            return {
                success: true,
                message: `Se encontraron ${filteredPeriods.length} período(s) que coinciden con los criterios`,
                data: filteredPeriods,
                total: filteredPeriods.length
            };
        } catch (error) {
            console.error('Error en búsqueda de períodos:', error);
            const errorResult = this.handleError(error, 'Error en la búsqueda');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Manejo centralizado de errores
     * @param {Error} error - Error capturado
     * @param {string} defaultMessage - Mensaje por defecto
     * @returns {Object} Error procesado con success: false y message
     */
    handleError(error, defaultMessage) {
        if (error.response) {
            // Error del servidor
            const { status, data } = error.response;
            const message = data?.message || data || defaultMessage;
            
            switch (status) {
                case 400:
                    return { success: false, message: `Solicitud incorrecta: ${message}` };
                case 401:
                    return { success: false, message: 'No autorizado. Por favor, inicie sesión nuevamente.' };
                case 403:
                    return { success: false, message: 'No tiene permisos para realizar esta acción.' };
                case 404:
                    return { success: false, message: 'Recurso no encontrado.' };
                case 409:
                    return { success: false, message: `Conflicto: ${message}` };
                case 500:
                    return { success: false, message: 'Error interno del servidor. Intente más tarde.' };
                default:
                    return { success: false, message: `Error ${status}: ${message}` };
            }
        } else if (error.request) {
            return { success: false, message: 'Error de conexión. Verifique su conexión a internet.' };
        } else {
            return { success: false, message: error.message || defaultMessage };
        }
    }
};

export { periodService };
