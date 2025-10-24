/**
 * Tipos y utilidades para TeacherAssignment (Asignaciones de Profesores)
 */

/**
 * Tipo para TeacherAssignment
 */
export class TeacherAssignment {
    constructor(data = {}) {
        this.id = data.id || null;
        this.teacherId = data.teacherId || '';
        this.courseId = data.courseId || '';
        this.classroomId = data.classroomId || '';
        this.periodId = data.periodId || '';
        this.status = data.status || 'A';
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }
}

/**
 * Tipo para solicitud de creación/actualización de TeacherAssignment
 */
export class TeacherAssignmentRequest {
    constructor(data = {}) {
        this.teacherId = data.teacherId || '';
        this.courseId = data.courseId || '';
        this.classroomId = data.classroomId || '';
        this.assignmentDate = data.assignmentDate || '';
        this.assignmentType = data.assignmentType || 'REGULAR';
    }
}

/**
 * Estados disponibles
 */
export const StatusEnum = {
    ACTIVE: 'A',
    INACTIVE: 'I'
};

/**
 * Obtiene el badge class según el estado
 */
export const getStatusBadgeClass = (status) => {
    switch (status) {
        case StatusEnum.ACTIVE:
            return 'badge-success';
        case StatusEnum.INACTIVE:
            return 'badge-danger';
        default:
            return 'badge-secondary';
    }
};

/**
 * Obtiene el texto del estado
 */
export const getStatusText = (status) => {
    switch (status) {
        case StatusEnum.ACTIVE:
            return 'Activo';
        case StatusEnum.INACTIVE:
            return 'Inactivo';
        default:
            return 'Desconocido';
    }
};

/**
 * Validación del modelo TeacherAssignment
 */
export const validateTeacherAssignment = (assignment) => {
    if (!assignment.teacherId || assignment.teacherId.trim() === '') {
        return 'El ID del profesor es obligatorio';
    }

    if (assignment.teacherId.length > 50) {
        return 'El ID del profesor no puede exceder 50 caracteres';
    }

    if (!assignment.courseId || assignment.courseId.trim() === '') {
        return 'El curso es obligatorio';
    }

    if (!assignment.classroomId || assignment.classroomId.trim() === '') {
        return 'El aula es obligatoria';
    }

    if (!assignment.assignmentDate || assignment.assignmentDate.trim() === '') {
        return 'La fecha de asignación es obligatoria';
    }

    return null;
};

/**
 * Formatea la fecha para mostrar
 */
export const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formatea fecha y hora para mostrar
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
