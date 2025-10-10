import axios from 'axios';
import { TeacherAssignment, TeacherAssignmentRequest } from '../../types/academic/teacherAssignment.types';
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
        
        console.error('Error en TeacherAssignmentService:', error.response?.data || error.message);
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

const teacherAssignmentService = {
    /**
     * Crear una nueva asignación
     * POST /api/v1/teacher-assignment
     * @param {TeacherAssignmentRequest} assignmentData - Datos de la asignación a crear
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment}>}
     */
    async createAssignment(assignmentData) {
        try {
            const assignmentRequest = new TeacherAssignmentRequest(assignmentData);
            
            const response = await academicApiClient.post('/teacher-assignment', assignmentRequest);
            
            if (response.data.success && response.data.data) {
                const assignment = new TeacherAssignment(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Asignación creada exitosamente',
                    data: assignment
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al crear la asignación'
            };
        } catch (error) {
            console.error('Error al crear asignación:', error);
            return this.handleError(error, 'Error al crear la asignación');
        }
    },

    /**
     * Obtener todas las asignaciones activas
     * GET /api/v1/teacher-assignment/actives
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment[]}>}
     */
    async getAllAssignments() {
        try {
            const response = await academicApiClient.get('/teacher-assignment/actives');
            
            if (response.data.success) {
                const assignments = response.data.data.map(item => new TeacherAssignment(item));
                return {
                    success: true,
                    message: response.data.message || 'Asignaciones obtenidas exitosamente',
                    data: assignments,
                    total: assignments.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las asignaciones',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones:', error);
            return this.handleError(error, 'Error al obtener las asignaciones');
        }
    },

    /**
     * Obtener todas las asignaciones inactivas
     * GET /api/v1/teacher-assignment/inactives
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment[]}>}
     */
    async getInactiveAssignments() {
        try {
            const response = await academicApiClient.get('/teacher-assignment/inactives');
            
            if (response.data.success) {
                const assignments = response.data.data.map(item => new TeacherAssignment(item));
                return {
                    success: true,
                    message: response.data.message || 'Asignaciones inactivas obtenidas exitosamente',
                    data: assignments,
                    total: assignments.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las asignaciones inactivas',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones inactivas:', error);
            return this.handleError(error, 'Error al obtener las asignaciones inactivas');
        }
    },

    /**
     * Obtener una asignación por ID
     * GET /api/v1/teacher-assignment/{id}
     * @param {string} id - ID de la asignación
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment}>}
     */
    async getAssignmentById(id) {
        try {
            const response = await academicApiClient.get(`/teacher-assignment/${id}`);
            
            if (response.data.success && response.data.data) {
                const assignment = new TeacherAssignment(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Asignación obtenida exitosamente',
                    data: assignment
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener la asignación'
            };
        } catch (error) {
            console.error('Error al obtener asignación por ID:', error);
            return this.handleError(error, 'Error al obtener la asignación');
        }
    },

    /**
     * Obtener asignaciones por profesor
     * GET /api/v1/teacher-assignment/teacher/{teacherId}
     * @param {string} teacherId - ID del profesor
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment[]}>}
     */
    async getAssignmentsByTeacher(teacherId) {
        try {
            const response = await academicApiClient.get(`/teacher-assignment/teacher/${teacherId}`);
            
            if (response.data.success) {
                const assignments = response.data.data.map(item => new TeacherAssignment(item));
                return {
                    success: true,
                    message: response.data.message || 'Asignaciones del profesor obtenidas exitosamente',
                    data: assignments,
                    total: assignments.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las asignaciones del profesor',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones por profesor:', error);
            return this.handleError(error, 'Error al obtener las asignaciones del profesor');
        }
    },

    /**
     * Obtener asignaciones por aula
     * GET /api/v1/teacher-assignment/classroom/{classroomId}
     * @param {string} classroomId - ID del aula
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment[]}>}
     */
    async getAssignmentsByClassroom(classroomId) {
        try {
            const response = await academicApiClient.get(`/teacher-assignment/classroom/${classroomId}`);
            
            if (response.data.success) {
                const assignments = response.data.data.map(item => new TeacherAssignment(item));
                return {
                    success: true,
                    message: response.data.message || 'Asignaciones del aula obtenidas exitosamente',
                    data: assignments,
                    total: assignments.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las asignaciones del aula',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones por aula:', error);
            return this.handleError(error, 'Error al obtener las asignaciones del aula');
        }
    },

    /**
     * Obtener asignaciones por curso
     * GET /api/v1/teacher-assignment/course/{courseId}
     * @param {string} courseId - ID del curso
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment[]}>}
     */
    async getAssignmentsByCourse(courseId) {
        try {
            const response = await academicApiClient.get(`/teacher-assignment/course/${courseId}`);
            
            if (response.data.success) {
                const assignments = response.data.data.map(item => new TeacherAssignment(item));
                return {
                    success: true,
                    message: response.data.message || 'Asignaciones del curso obtenidas exitosamente',
                    data: assignments,
                    total: assignments.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al obtener las asignaciones del curso',
                data: []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones por curso:', error);
            return this.handleError(error, 'Error al obtener las asignaciones del curso');
        }
    },

    /**
     * Actualizar una asignación
     * PUT /api/v1/teacher-assignment/{id}
     * @param {string} id - ID de la asignación
     * @param {TeacherAssignmentRequest} assignmentData - Datos actualizados de la asignación
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment}>}
     */
    async updateAssignment(id, assignmentData) {
        try {
            const assignmentRequest = new TeacherAssignmentRequest(assignmentData);
            
            const response = await academicApiClient.put(`/teacher-assignment/${id}`, assignmentRequest);
            
            if (response.data.success && response.data.data) {
                const assignment = new TeacherAssignment(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Asignación actualizada exitosamente',
                    data: assignment
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al actualizar la asignación'
            };
        } catch (error) {
            console.error('Error al actualizar asignación:', error);
            return this.handleError(error, 'Error al actualizar la asignación');
        }
    },

    /**
     * Eliminar (desactivar) una asignación
     * DELETE /api/v1/teacher-assignment/{id}
     * @param {string} id - ID de la asignación
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteAssignment(id) {
        try {
            const response = await academicApiClient.delete(`/teacher-assignment/${id}`);
            
            return {
                success: response.data.success || true,
                message: response.data.message || 'Asignación eliminada exitosamente'
            };
        } catch (error) {
            console.error('Error al eliminar asignación:', error);
            return this.handleError(error, 'Error al eliminar la asignación');
        }
    },

    /**
     * Reactivar una asignación
     * PUT /api/v1/teacher-assignment/activate/{id}
     * @param {string} id - ID de la asignación
     * @returns {Promise<{success: boolean, message: string, data?: TeacherAssignment}>}
     */
    async reactivateAssignment(id) {
        try {
            const response = await academicApiClient.put(`/teacher-assignment/activate/${id}`);
            
            if (response.data.success && response.data.data) {
                const assignment = new TeacherAssignment(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Asignación reactivada exitosamente',
                    data: assignment
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al reactivar la asignación'
            };
        } catch (error) {
            console.error('Error al reactivar asignación:', error);
            return this.handleError(error, 'Error al reactivar la asignación');
        }
    },

    /**
     * Manejo centralizado de errores
     * @private
     */
    handleError(error, defaultMessage) {
        if (error.response) {
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
                        message: data.message || 'Asignación no encontrada.',
                        data: []
                    };
                case 409:
                    return {
                        success: false,
                        message: data.message || 'Ya existe una asignación con estos datos.',
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
            return {
                success: false,
                message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                data: []
            };
        } else {
            return {
                success: false,
                message: error.message || defaultMessage,
                data: []
            };
        }
    }
};

export { teacherAssignmentService };
