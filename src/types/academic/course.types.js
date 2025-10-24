/**
 * @typedef {Object} Course
 * @property {string} id - ID único del curso
 * @property {string} institutionId - ID de la institución
 * @property {string} courseCode - Código del curso
 * @property {string} courseName - Nombre del curso
 * @property {string} level - Nivel educativo
 * @property {string} description - Descripción del curso
 * @property {number} hoursPerWeek - Horas por semana
 * @property {string} status - Estado (A: Activo, I: Inactivo)
 * @property {string} createdAt - Fecha de creación
 * @property {string} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} CourseRequest
 * @property {string} courseCode - Código del curso
 * @property {string} courseName - Nombre del curso
 * @property {string} level - Nivel educativo
 * @property {string} description - Descripción del curso
 * @property {number} hoursPerWeek - Horas por semana
 * @property {string} status - Estado (A: Activo, I: Inactivo)
 * @note institutionId se envía en headers HTTP (X-Institution-Id), no en el body
 */

/**
 * Crea una nueva instancia de Course con los datos proporcionados
 * @param {Object} data - Datos del curso
 * @returns {Course} Nueva instancia de Course
 */
export class Course {
    constructor(data) {
        this.id = data.id;
        this.institutionId = data.institutionId;
        this.courseCode = data.courseCode;
        this.courseName = data.courseName;
        this.level = data.level;
        this.description = data.description;
        this.hoursPerWeek = data.hoursPerWeek;
        this.status = data.status;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Obtiene el nombre completo del curso con código
     * @returns {string} Formato: "CODIGO - Nombre del Curso"
     */
    get displayName() {
        return `${this.courseCode} - ${this.courseName}`;
    }

    /**
     * Verifica si el curso está activo
     * @returns {boolean} true si el estado es 'A'
     */
    get isActive() {
        return this.status === 'A';
    }

    /**
     * Obtiene la información básica del curso para mostrar en listas
     * @returns {Object} Información básica del curso
     */
    get basicInfo() {
        return {
            id: this.id,
            courseCode: this.courseCode,
            courseName: this.courseName,
            level: this.level,
            hoursPerWeek: this.hoursPerWeek,
            status: this.status,
            displayName: this.displayName,
            isActive: this.isActive
        };
    }
}

/**
 * Crea una nueva instancia de CourseRequest con los datos proporcionados
 * @param {Object} data - Datos de la solicitud del curso
 * @returns {CourseRequest} Nueva instancia de CourseRequest
 */
export class CourseRequest {
    constructor(data) {
        // institutionId se envía en headers, NO en el body
        // Removido según CourseRequestDto.java del backend
        this.courseCode = data.courseCode;
        this.courseName = data.courseName;
        this.level = data.level;
        this.description = data.description || '';
        this.hoursPerWeek = data.hoursPerWeek;
        this.status = data.status || 'A';
    }

    /**
     * Valida que todos los campos requeridos estén presentes
     * @returns {Object} Objeto con isValid y errores
     */
    validate() {
        const errors = [];

        if (!this.courseCode?.trim()) {
            errors.push('El código del curso es obligatorio');
        }

        if (!this.courseName?.trim()) {
            errors.push('El nombre del curso es obligatorio');
        }

        if (!this.level?.trim()) {
            errors.push('El nivel es obligatorio');
        }

        if (!this.hoursPerWeek || this.hoursPerWeek <= 0) {
            errors.push('Las horas por semana deben ser mayor a 0');
        }

        if (!Object.values(CourseStatus).includes(this.status)) {
            errors.push('El estado debe ser válido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export const CourseStatus = {
    ACTIVE: 'A',
    INACTIVE: 'I'
};

export const CourseLevels = {
    INICIAL: 'INICIAL',
    PRIMARIA: 'PRIMARIA', 
    SECUNDARIA: 'SECUNDARIA',
    SUPERIOR: 'SUPERIOR'
};

export const CourseValidationMessages = {
    INSTITUTION_ID_REQUIRED: 'El ID de la institución es obligatorio',
    COURSE_CODE_REQUIRED: 'El código del curso es obligatorio',
    COURSE_NAME_REQUIRED: 'El nombre del curso es obligatorio',
    LEVEL_REQUIRED: 'El nivel es obligatorio',
    HOURS_PER_WEEK_REQUIRED: 'Las horas por semana son obligatorias',
    HOURS_PER_WEEK_POSITIVE: 'Las horas por semana deben ser mayor a 0',
    STATUS_REQUIRED: 'El estado es obligatorio'
};

/**
 * Función utilitaria para crear un curso vacío con valores por defecto
 * @returns {CourseRequest} Curso con valores por defecto
 */
export const createEmptyCourse = () => {
    return new CourseRequest({
        courseCode: '',
        courseName: '',
        level: '',
        description: '',
        hoursPerWeek: 1,
        status: 'A'
    });
};

/**
 * Función utilitaria para filtrar cursos por estado
 * @param {Course[]} courses - Lista de cursos
 * @param {string} status - Estado a filtrar
 * @returns {Course[]} Cursos filtrados
 */
export const filterCoursesByStatus = (courses, status) => {
    return courses.filter(course => course.status === status);
};

/**
 * Función utilitaria para filtrar cursos por nivel
 * @param {Course[]} courses - Lista de cursos
 * @param {string} level - Nivel a filtrar
 * @returns {Course[]} Cursos filtrados
 */
export const filterCoursesByLevel = (courses, level) => {
    return courses.filter(course => course.level === level);
};

/**
 * Función utilitaria para ordenar cursos por código
 * @param {Course[]} courses - Lista de cursos
 * @returns {Course[]} Cursos ordenados
 */
export const sortCoursesByCode = (courses) => {
    return courses.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
};

/**
 * Función utilitaria para ordenar cursos por nombre
 * @param {Course[]} courses - Lista de cursos
 * @returns {Course[]} Cursos ordenados
 */
export const sortCoursesByName = (courses) => {
    return courses.sort((a, b) => a.courseName.localeCompare(b.courseName));
};