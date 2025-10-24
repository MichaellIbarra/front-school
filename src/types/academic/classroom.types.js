/**
 * Tipos y utilidades para Classroom (Aulas)
 */

/**
 * Tipo para Classroom
 */
export class Classroom {
    constructor(data = {}) {
        this.id = data.id || null;
        this.headquarterId = data.headquarterId || '';
        this.periodId = data.periodId || '';
        this.section = data.section || '';
        this.grade = data.grade || null;
        this.shift = data.shift || '';
        this.status = data.status || 'A';
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
        // Campos populados del backend
        this.headquarterName = data.headquarterName || '';
        this.periodName = data.periodName || '';
    }
}

/**
 * Tipo para solicitud de creación/actualización de Classroom
 */
export class ClassroomRequest {
    constructor(data = {}) {
        this.headquarterId = data.headquarterId || '';
        this.periodId = data.periodId || '';
        this.section = data.section || '';
        this.grade = data.grade || null;
        this.shift = data.shift || '';
        this.status = data.status || 'A';
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
 * Turnos disponibles
 */
export const ShiftEnum = {
    MORNING: 'M',
    AFTERNOON: 'T',
    NIGHT: 'N'
};

/**
 * Obtiene el texto del turno
 */
export const getShiftText = (shift) => {
    switch (shift) {
        case ShiftEnum.MORNING:
            return 'Mañana';
        case ShiftEnum.AFTERNOON:
            return 'Tarde';
        case ShiftEnum.NIGHT:
            return 'Noche';
        default:
            return 'Desconocido';
    }
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
 * Validación del modelo Classroom
 */
export const validateClassroom = (classroom) => {
    if (!classroom.headquarterId || classroom.headquarterId.trim() === '') {
        return 'El ID de la sede es obligatorio';
    }

    if (!classroom.periodId || classroom.periodId.trim() === '') {
        return 'El ID del período es obligatorio';
    }

    if (!classroom.section || classroom.section.trim() === '') {
        return 'La sección es obligatoria';
    }

    if (!/^[A-Z]$/.test(classroom.section)) {
        return 'La sección debe ser una letra mayúscula (A, B, C, etc.)';
    }

    if (!classroom.grade || classroom.grade < 1 || classroom.grade > 6) {
        return 'El grado debe estar entre 1 y 6';
    }

    if (!classroom.shift || !/^(M|T|N)$/.test(classroom.shift)) {
        return 'El turno debe ser M (Mañana), T (Tarde) o N (Noche)';
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
