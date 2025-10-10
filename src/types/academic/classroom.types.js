/**
 * Tipos y utilidades para Classroom (Aulas)
 */

/**
 * Tipo para Classroom
 */
export class Classroom {
    constructor(data = {}) {
        this.id = data.id || null;
        this.code = data.code || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.status = data.status || 'A';
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }
}

/**
 * Tipo para solicitud de creación/actualización de Classroom
 */
export class ClassroomRequest {
    constructor(data = {}) {
        this.code = data.code || '';
        this.name = data.name || '';
        this.description = data.description || null;
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
 * Validación del modelo Classroom
 */
export const validateClassroom = (classroom) => {
    if (!classroom.code || classroom.code.trim() === '') {
        return 'El código del aula es obligatorio';
    }

    if (classroom.code.length > 20) {
        return 'El código no puede exceder 20 caracteres';
    }

    if (!classroom.name || classroom.name.trim() === '') {
        return 'El nombre del aula es obligatorio';
    }

    if (classroom.name.length > 100) {
        return 'El nombre no puede exceder 100 caracteres';
    }

    if (classroom.description && classroom.description.length > 255) {
        return 'La descripción no puede exceder 255 caracteres';
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
