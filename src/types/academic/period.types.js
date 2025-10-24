/**
 * @typedef {Object} Period
 * @property {string} id - ID único del período
 * @property {string} institutionId - ID de la institución
 * @property {string} level - Nivel educativo (INICIAL, PRIMARIA, SECUNDARIA, SUPERIOR)
 * @property {string} period - Período (1-5 para primaria, 1-6 para secundaria)
 * @property {string} academicYear - Año académico
 * @property {string} periodType - Tipo de período en frontend: BIMESTRE, TRIMESTRE, SEMESTRE, ANUAL (convertido al backend)
 * @property {string} startDate - Fecha de inicio
 * @property {string} endDate - Fecha de fin
 * @property {string} status - Estado (A: Activo, I: Inactivo)
 * @property {string} createdAt - Fecha de creación
 * @property {string} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} PeriodRequest
 * @property {string} level - Nivel educativo
 * @property {string} period - Período
 * @property {string} academicYear - Año académico
 * @property {string} periodType - Tipo de período
 * @property {string} startDate - Fecha de inicio
 * @property {string} endDate - Fecha de fin
 * @property {string} status - Estado (A: Activo, I: Inactivo)
 * @note institutionId se envía en headers HTTP (X-Institution-Id), no en el body
 */

/**
 * Crea una nueva instancia de Period con los datos proporcionados
 * @param {Object} data - Datos del período
 * @returns {Period} Nueva instancia de Period
 */
export class Period {
    constructor(data) {
        this.id = data.id;
        this.institutionId = data.institutionId;
        this.level = data.level;
        this.period = data.period;
        this.academicYear = data.academicYear;
        this.periodType = data.periodType;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.status = data.status;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Obtiene el nombre completo del período
     * @returns {string} Formato: "Período X - Año YYYY"
     */
    get displayName() {
        return `${this.period}° ${this.periodType} - ${this.academicYear}`;
    }

    /**
     * Verifica si el período está activo
     * @returns {boolean} true si el estado es 'A'
     */
    get isActive() {
        return this.status === 'A';
    }

    /**
     * Obtiene la información básica del período para mostrar en listas
     * @returns {Object} Información básica del período
     */
    get basicInfo() {
        return {
            id: this.id,
            level: this.level,
            period: this.period,
            academicYear: this.academicYear,
            periodType: this.periodType,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            displayName: this.displayName,
            isActive: this.isActive
        };
    }

    /**
     * Verifica si el período está en curso
     * @returns {boolean} true si la fecha actual está entre startDate y endDate
     */
    get isCurrent() {
        if (!this.startDate || !this.endDate) return false;
        const now = new Date();
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        return now >= start && now <= end;
    }
}

/**
 * Crea una nueva instancia de PeriodRequest con los datos proporcionados
 * @param {Object} data - Datos de la solicitud del período
 * @returns {PeriodRequest} Nueva instancia de PeriodRequest
 */
export class PeriodRequest {
    constructor(data) {
        // institutionId se envía en headers, NO en el body
        // Removido según PeriodRequestDto.java del backend
        this.level = data.level;
        this.period = data.period;
        this.academicYear = data.academicYear;
        this.periodType = data.periodType;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.status = data.status || 'A';
    }

    /**
     * Valida que todos los campos requeridos estén presentes
     * @returns {Object} Objeto con isValid y errores
     */
    validate() {
        const errors = [];

        if (!this.level?.trim()) {
            errors.push('El nivel educativo es obligatorio');
        }

        if (!this.period?.trim()) {
            errors.push('El período es obligatorio');
        }

        if (!this.academicYear?.trim()) {
            errors.push('El año académico es obligatorio');
        }

        if (!this.periodType?.trim()) {
            errors.push('El tipo de período es obligatorio');
        }

        if (!this.startDate?.trim()) {
            errors.push('La fecha de inicio es obligatoria');
        }

        if (!this.endDate?.trim()) {
            errors.push('La fecha de fin es obligatoria');
        }

        // Validar que la fecha de fin sea posterior a la de inicio
        if (this.startDate && this.endDate) {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            if (end <= start) {
                errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        }

        if (!Object.values(PeriodStatus).includes(this.status)) {
            errors.push('El estado debe ser válido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export const PeriodStatus = {
    ACTIVE: 'A',
    INACTIVE: 'I'
};

export const PeriodLevels = {
    INICIAL: 'INICIAL',
    PRIMARIA: 'PRIMARIA',
    SECUNDARIA: 'SECUNDARIA',
    SUPERIOR: 'SUPERIOR'
};

export const PeriodTypes = {
    // Valores para el frontend (español)
    BIMESTRE: 'BIMESTRE',
    TRIMESTRE: 'TRIMESTRE', 
    SEMESTRE: 'SEMESTRE',
    ANUAL: 'ANUAL',
    // Valores para el backend (inglés)  
    BIMESTER: 'BIMESTER',
    TRIMESTER: 'TRIMESTER',
    SEMESTER: 'SEMESTER',
    ANNUAL: 'ANNUAL'
};

// Mapeo para conversión frontend -> backend
export const periodTypeToBackend = {
    'BIMESTRE': 'BIMESTER',
    'TRIMESTRE': 'TRIMESTER',
    'SEMESTRE': 'SEMESTER',
    'ANUAL': 'ANNUAL'
};

// Mapeo para conversión backend -> frontend  
export const periodTypeFromBackend = {
    'BIMESTER': 'BIMESTRE',
    'TRIMESTER': 'TRIMESTRE',
    'SEMESTER': 'SEMESTRE',
    'ANNUAL': 'ANUAL'
};

export const PeriodValidationMessages = {
    INSTITUTION_ID_REQUIRED: 'El ID de la institución es obligatorio',
    LEVEL_REQUIRED: 'El nivel educativo es obligatorio',
    PERIOD_REQUIRED: 'El período es obligatorio',
    ACADEMIC_YEAR_REQUIRED: 'El año académico es obligatorio',
    PERIOD_TYPE_REQUIRED: 'El tipo de período es obligatorio',
    START_DATE_REQUIRED: 'La fecha de inicio es obligatoria',
    END_DATE_REQUIRED: 'La fecha de fin es obligatoria',
    END_DATE_AFTER_START: 'La fecha de fin debe ser posterior a la fecha de inicio',
    STATUS_REQUIRED: 'El estado es obligatorio'
};

/**
 * Función utilitaria para crear un período vacío con valores por defecto
 * @returns {PeriodRequest} Período con valores por defecto
 */
export const createEmptyPeriod = () => {
    const currentYear = new Date().getFullYear();
    return new PeriodRequest({
        level: '',
        period: '',
        academicYear: currentYear.toString(),
        periodType: '',
        startDate: '',
        endDate: '',
        status: 'A'
    });
};

/**
 * Función utilitaria para filtrar períodos por estado
 * @param {Period[]} periods - Lista de períodos
 * @param {string} status - Estado a filtrar
 * @returns {Period[]} Períodos filtrados
 */
export const filterPeriodsByStatus = (periods, status) => {
    return periods.filter(period => period.status === status);
};

/**
 * Función utilitaria para filtrar períodos por nivel
 * @param {Period[]} periods - Lista de períodos
 * @param {string} level - Nivel a filtrar
 * @returns {Period[]} Períodos filtrados
 */
export const filterPeriodsByLevel = (periods, level) => {
    return periods.filter(period => period.level === level);
};

/**
 * Función utilitaria para filtrar períodos por tipo
 * @param {Period[]} periods - Lista de períodos
 * @param {string} periodType - Tipo de período a filtrar
 * @returns {Period[]} Períodos filtrados
 */
export const filterPeriodsByType = (periods, periodType) => {
    return periods.filter(period => period.periodType === periodType);
};

/**
 * Función utilitaria para filtrar períodos por año académico
 * @param {Period[]} periods - Lista de períodos
 * @param {string} academicYear - Año académico a filtrar
 * @returns {Period[]} Períodos filtrados
 */
export const filterPeriodsByAcademicYear = (periods, academicYear) => {
    return periods.filter(period => period.academicYear === academicYear);
};

/**
 * Función utilitaria para ordenar períodos por año académico y período
 * @param {Period[]} periods - Lista de períodos
 * @returns {Period[]} Períodos ordenados
 */
export const sortPeriodsByAcademicYear = (periods) => {
    return periods.sort((a, b) => {
        // Primero por año académico descendente
        const yearCompare = b.academicYear.localeCompare(a.academicYear);
        if (yearCompare !== 0) return yearCompare;
        
        // Luego por período ascendente
        return a.period.localeCompare(b.period);
    });
};

/**
 * Función utilitaria para ordenar períodos por fecha de inicio
 * @param {Period[]} periods - Lista de períodos
 * @returns {Period[]} Períodos ordenados
 */
export const sortPeriodsByStartDate = (periods) => {
    return periods.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return new Date(b.startDate) - new Date(a.startDate);
    });
};

/**
 * Función utilitaria para obtener períodos disponibles según el nivel
 * Backend espera: "1ro", "2do", "3ro", "4to", "5to", "6to"
 * @param {string} level - Nivel educativo
 * @returns {Array} Array de períodos disponibles
 */
export const getPeriodsForLevel = (level) => {
    switch (level) {
        case 'INICIAL':
            return ['1ro', '2do'];
        case 'PRIMARIA':
            return ['1ro', '2do', '3ro', '4to', '5to', '6to'];
        case 'SECUNDARIA':
            return ['1ro', '2do', '3ro', '4to', '5to'];
        case 'SUPERIOR':
            return ['1ro', '2do', '3ro', '4to', '5to', '6to'];
        default:
            return [];
    }
};

/**
 * Función utilitaria para generar años académicos
 * @param {number} yearsBack - Años hacia atrás desde el año actual
 * @param {number} yearsForward - Años hacia adelante desde el año actual
 * @returns {Array} Array de años académicos
 */
export const generateAcademicYears = (yearsBack = 2, yearsForward = 5) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = yearsBack; i >= -yearsForward; i--) {
        years.push((currentYear - i).toString());
    }
    
    return years;
};
