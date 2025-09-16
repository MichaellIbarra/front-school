import axios from 'axios';
import { Course, CourseRequest } from '../../types/academic/course.types';
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
        
        console.error('Error en CourseService:', error.response?.data || error.message);
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

const courseService = {
    /**
     * Crear un nuevo curso
     * POST /api/v1/courses
     * @param {CourseRequest} courseData - Datos del curso a crear
     * @returns {Promise<{success: boolean, message: string, data?: Course}>}
     */
    async createCourse(courseData) {
        try {
            const courseRequest = new CourseRequest(courseData);
            const validation = courseRequest.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            const response = await academicApiClient.post('/courses', courseRequest);
            
            if (response.data.success && response.data.data) {
                const course = new Course(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Curso creado exitosamente',
                    data: course
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al crear el curso'
            };
        } catch (error) {
            console.error('Error al crear curso:', error);
            return this.handleError(error, 'Error al crear el curso');
        }
    },

    /**
     * Obtener todos los cursos
     * GET /api/v1/courses
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async getAllCourses() {
        try {
            const response = await academicApiClient.get('/courses');
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const courses = response.data.data.map(courseData => new Course(courseData));
                return {
                    success: true,
                    message: response.data.message || 'Cursos obtenidos exitosamente',
                    data: courses,
                    total: courses.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se pudieron obtener los cursos',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error('Error al obtener cursos:', error);
            const errorResult = this.handleError(error, 'Error al obtener cursos');
            return {
                success: false,
                message: errorResult.message,
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener curso por ID
     * GET /api/v1/courses/{id}
     * @param {string} id - ID del curso
     * @returns {Promise<{success: boolean, message: string, data?: Course}>}
     */
    async getCourseById(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del curso es requerido'
                };
            }

            const response = await academicApiClient.get(`/courses/${id}`);
            
            if (response.data.success && response.data.data) {
                const course = new Course(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Curso encontrado',
                    data: course
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Curso no encontrado'
            };
        } catch (error) {
            console.error(`Error al obtener curso ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Curso no encontrado'
                };
            }
            
            return {
                success: false,
                message: 'Error de conexión al servidor'
            };
        }
    },

    /**
     * Obtener cursos por institución
     * GET /api/v1/courses/by-institution/{institutionId}
     * @param {string} institutionId - ID de la institución
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async getCoursesByInstitution(institutionId) {
        try {
            if (!institutionId?.trim()) {
                return {
                    success: false,
                    message: 'ID de institución es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/courses/by-institution/${institutionId}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const courses = response.data.data.map(courseData => new Course(courseData));
                return {
                    success: true,
                    message: response.data.message || 'Cursos obtenidos exitosamente',
                    data: courses,
                    total: courses.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron cursos para esta institución',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener cursos de institución ${institutionId}:`, error);
            return {
                success: false,
                message: 'Error de conexión al servidor',
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener cursos por institución y nivel
     * GET /api/v1/courses/by-institution/{institutionId}/level/{level}
     * @param {string} institutionId - ID de la institución
     * @param {string} level - Nivel educativo
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async getCoursesByInstitutionAndLevel(institutionId, level) {
        try {
            if (!institutionId?.trim() || !level?.trim()) {
                return {
                    success: false,
                    message: 'ID de institución y nivel son requeridos',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/courses/by-institution/${institutionId}/level/${level}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const courses = response.data.data.map(courseData => new Course(courseData));
                return {
                    success: true,
                    message: response.data.message || 'Cursos obtenidos exitosamente',
                    data: courses,
                    total: courses.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron cursos para esta institución y nivel',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener cursos de institución ${institutionId} y nivel ${level}:`, error);
            return {
                success: false,
                message: 'Error de conexión al servidor',
                data: [],
                total: 0
            };
        }
    },

    /**
     * Obtener cursos por estado
     * GET /api/v1/courses/status/{status}
     * @param {string} status - Estado del curso (A/I)
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async getCoursesByStatus(status) {
        try {
            if (!status?.trim()) {
                return {
                    success: false,
                    message: 'Estado es requerido',
                    data: [],
                    total: 0
                };
            }

            const response = await academicApiClient.get(`/courses/status/${status}`);
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const courses = response.data.data.map(courseData => new Course(courseData));
                return {
                    success: true,
                    message: response.data.message || 'Cursos obtenidos exitosamente',
                    data: courses,
                    total: courses.length
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'No se encontraron cursos con este estado',
                data: [],
                total: 0
            };
        } catch (error) {
            console.error(`Error al obtener cursos por estado ${status}:`, error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión al servidor',
                data: [],
                total: 0
            };
        }
    },

    /**
     * Actualizar un curso
     * PUT /api/v1/courses/{id}
     * @param {string} id - ID del curso
     * @param {CourseRequest} courseData - Datos actualizados del curso
     * @returns {Promise<{success: boolean, message: string, data?: Course}>}
     */
    async updateCourse(id, courseData) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del curso es requerido'
                };
            }

            const courseRequest = new CourseRequest(courseData);
            const validation = courseRequest.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    message: validation.errors.join(', ')
                };
            }

            const response = await academicApiClient.put(`/courses/${id}`, courseRequest);
            
            if (response.data.success && response.data.data) {
                const course = new Course(response.data.data);
                return {
                    success: true,
                    message: response.data.message || 'Curso actualizado exitosamente',
                    data: course
                };
            }
            
            return {
                success: false,
                message: response.data.message || 'Error al actualizar el curso'
            };
        } catch (error) {
            console.error(`Error al actualizar curso ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Curso no encontrado'
                };
            }
            
            if (error.response?.data?.message) {
                return {
                    success: false,
                    message: error.response.data.message
                };
            }
            
            return {
                success: false,
                message: 'Error de conexión al servidor'
            };
        }
    },

    /**
     * Eliminado lógico - cambiar estado a 'I'
     * PATCH /api/v1/courses/{id}/delete
     * @param {string} id - ID del curso
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async logicalDelete(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del curso es requerido'
                };
            }

            const response = await academicApiClient.patch(`/courses/${id}/delete`);
            
            return {
                success: response.data.success || false,
                message: response.data.message || 'Operación completada'
            };
        } catch (error) {
            console.error(`Error al eliminar curso ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Curso no encontrado'
                };
            }
            
            return {
                success: false,
                message: 'Error de conexión al servidor'
            };
        }
    },

    /**
     * Restaurar curso - cambiar estado a 'A'
     * PATCH /api/v1/courses/{id}/restore
     * @param {string} id - ID del curso
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async restoreCourse(id) {
        try {
            if (!id?.trim()) {
                return {
                    success: false,
                    message: 'ID del curso es requerido'
                };
            }

            const response = await academicApiClient.patch(`/courses/${id}/restore`);
            
            return {
                success: response.data.success || false,
                message: response.data.message || 'Operación completada'
            };
        } catch (error) {
            console.error(`Error al restaurar curso ${id}:`, error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Curso no encontrado'
                };
            }
            
            return {
                success: false,
                message: 'Error de conexión al servidor'
            };
        }
    },

    /**
     * Verificar si existe un curso con el código especificado
     * GET /api/v1/courses/exists/{courseCode}
     * @param {string} courseCode - Código del curso
     * @returns {Promise<{success: boolean, exists: boolean, message: string}>}
     */
    async existsByCourseCode(courseCode) {
        try {
            if (!courseCode?.trim()) {
                return {
                    success: false,
                    exists: false,
                    message: 'Código del curso es requerido'
                };
            }

            const response = await academicApiClient.get(`/courses/exists/${courseCode}`);
            
            return {
                success: response.data.success || false,
                exists: response.data.exists || false,
                message: response.data.message || 'Consulta completada'
            };
        } catch (error) {
            console.error(`Error al verificar existencia del curso ${courseCode}:`, error);
            return {
                success: false,
                exists: false,
                message: 'Error de conexión al servidor'
            };
        }
    },

    // Métodos utilitarios adicionales para el frontend

    /**
     * Obtener cursos activos de una institución
     * @param {string} institutionId - ID de la institución
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async getActiveCoursesByInstitution(institutionId) {
        const result = await this.getCoursesByInstitution(institutionId);
        if (result.success && result.data) {
            const activeCourses = result.data.filter(course => course.isActive);
            return {
                ...result,
                data: activeCourses,
                total: activeCourses.length
            };
        }
        return result;
    },

    /**
     * Buscar cursos por nombre o código
     * @param {string} searchTerm - Término de búsqueda
     * @param {string} institutionId - ID de la institución (opcional)
     * @returns {Promise<{success: boolean, message: string, data?: Course[], total?: number}>}
     */
    async searchCourses(searchTerm, institutionId = null) {
        try {
            let result;
            if (institutionId) {
                result = await this.getCoursesByInstitution(institutionId);
            } else {
                result = await this.getAllCourses();
            }

            if (!result.success || !result.data) {
                return result;
            }

            const searchTermLower = searchTerm.toLowerCase().trim();
            const filteredCourses = result.data.filter(course => 
                course.courseName.toLowerCase().includes(searchTermLower) ||
                course.courseCode.toLowerCase().includes(searchTermLower) ||
                course.description?.toLowerCase().includes(searchTermLower)
            );

            return {
                success: true,
                message: `Se encontraron ${filteredCourses.length} curso(s) que coinciden con la búsqueda`,
                data: filteredCourses,
                total: filteredCourses.length
            };
        } catch (error) {
            console.error('Error al buscar cursos:', error);
            return {
                success: false,
                message: 'Error en la búsqueda',
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

export { courseService };