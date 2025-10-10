import axios from 'axios';
import { Classroom, ClassroomRequest } from '../../types/academic/classroom.types';
import { refreshTokenKeycloak } from '../../auth/authService';

// Configuración del cliente API para el microservicio académico
const academicApiClient = axios.create({
  baseURL: `${process.env.REACT_APP_DOMAIN}/api/v1`,
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
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        console.error('Error en ClassroomService:', error.response?.data || error.message);
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

const classroomService = {
    /**
     * Crear un nuevo aula
     * POST /api/v1/classroom
     * @param {ClassroomRequest} classroomData - Datos del aula a crear
     * @returns {Promise<{success: boolean, message: string, data?: Classroom}>}
     */
    async createClassroom(classroomData) {
        try {
            const classroomRequest = new ClassroomRequest(classroomData);
            
            const response = await academicApiClient.post('/classroom', classroomRequest);
            
            if (response.data.success && response.data.data) {
                const classroom = new Classroom(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Aula creada exitosamente',
                    data: classroom
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al crear el aula'
            };
        } catch (error) {
            console.error('Error al crear aula:', error);
            return this.handleError(error, 'Error al crear el aula');
        }
    },

    /**
     * Obtener todos los aulas activas
     * GET /api/v1/classroom/actives
     * @returns {Promise<{success: boolean, message: string, data?: Classroom[]}>}
     */
    async getAllClassrooms() {
        try {
            const response = await academicApiClient.get('/classroom/actives');
            
            if (response.data.success) {
                const classrooms = response.data.data.map(item => new Classroom(item));
                return {
                    success: true,
                    message: response.data.message || 'Aulas obtenidas exitosamente',
                    data: classrooms,
                    total: classrooms.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las aulas',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener aulas:', error);
            return this.handleError(error, 'Error al obtener las aulas');
        }
    },

    /**
     * Obtener todos los aulas inactivas
     * GET /api/v1/classroom/inactives
     * @returns {Promise<{success: boolean, message: string, data?: Classroom[]}>}
     */
    async getInactiveClassrooms() {
        try {
            const response = await academicApiClient.get('/classroom/inactives');
            
            if (response.data.success) {
                const classrooms = response.data.data.map(item => new Classroom(item));
                return {
                    success: true,
                    message: response.data.message || 'Aulas inactivas obtenidas exitosamente',
                    data: classrooms,
                    total: classrooms.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las aulas inactivas',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener aulas inactivas:', error);
            return this.handleError(error, 'Error al obtener las aulas inactivas');
        }
    },

    /**
     * Obtener un aula por ID
     * GET /api/v1/classroom/{id}
     * @param {string} id - ID del aula
     * @returns {Promise<{success: boolean, message: string, data?: Classroom}>}
     */
    async getClassroomById(id) {
        try {
            const response = await academicApiClient.get(`/classroom/${id}`);
            
            if (response.data.success && response.data.data) {
                const classroom = new Classroom(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Aula obtenida exitosamente',
                    data: classroom
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener el aula'
            };
        } catch (error) {
            console.error('Error al obtener aula por ID:', error);
            return this.handleError(error, 'Error al obtener el aula');
        }
    },

    /**
     * Actualizar un aula
     * PUT /api/v1/classroom/{id}
     * @param {string} id - ID del aula
     * @param {ClassroomRequest} classroomData - Datos actualizados del aula
     * @returns {Promise<{success: boolean, message: string, data?: Classroom}>}
     */
    async updateClassroom(id, classroomData) {
        try {
            const classroomRequest = new ClassroomRequest(classroomData);
            
            const response = await academicApiClient.put(`/classroom/${id}`, classroomRequest);
            
            if (response.data.success && response.data.data) {
                const classroom = new Classroom(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Aula actualizada exitosamente',
                    data: classroom
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al actualizar el aula'
            };
        } catch (error) {
            console.error('Error al actualizar aula:', error);
            return this.handleError(error, 'Error al actualizar el aula');
        }
    },

    /**
     * Eliminar (desactivar) un aula
     * DELETE /api/v1/classroom/{id}
     * @param {string} id - ID del aula
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteClassroom(id) {
        try {
            const response = await academicApiClient.delete(`/classroom/${id}`);
            
            return {
                success: response.data.success || true,
                message: response.data.message || 'Aula eliminada exitosamente'
            };
        } catch (error) {
            console.error('Error al eliminar aula:', error);
            return this.handleError(error, 'Error al eliminar el aula');
        }
    },

    /**
     * Reactivar un aula
     * PUT /api/v1/classroom/activate/{id}
     * @param {string} id - ID del aula
     * @returns {Promise<{success: boolean, message: string, data?: Classroom}>}
     */
    async reactivateClassroom(id) {
        try {
            const response = await academicApiClient.put(`/classroom/activate/${id}`);
            
            if (response.data.success && response.data.data) {
                const classroom = new Classroom(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Aula reactivada exitosamente',
                    data: classroom
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al reactivar el aula'
            };
        } catch (error) {
            console.error('Error al reactivar aula:', error);
            return this.handleError(error, 'Error al reactivar el aula');
        }
    },

    /**
     * Manejo centralizado de errores
     * @private
     */
    handleError(error, defaultMessage) {
        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 400:
                    return {
                        success: false,
                        message: data.message || 'Solicitud inválida. Por favor verifica los datos ingresados.',
                        data: []
                    };
                case 404:
                    return {
                        success: false,
                        message: data.message || 'Aula no encontrada.',
                        data: []
                    };
                case 409:
                    return {
                        success: false,
                        message: data.message || 'Ya existe un aula con estos datos.',
                        data: []
                    };
                case 500:
                    return {
                        success: false,
                        message: data.message || 'Error interno del servidor. Por favor intenta más tarde.',
                        data: []
                    };
                default:
                    return {
                        success: false,
                        message: data.message || defaultMessage,
                        data: []
                    };
            }
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            return {
                success: false,
                message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                data: []
            };
        } else {
            // Algo sucedió al configurar la solicitud
            return {
                success: false,
                message: error.message || defaultMessage,
                data: []
            };
        }
    }
};

export { classroomService };
