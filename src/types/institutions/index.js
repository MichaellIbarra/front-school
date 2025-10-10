/**
 * Índice de tipos para el módulo de administración
 * Facilita la importación de modelos y tipos
 */

// Modelos de Institution
export {
  Institution,
  InstitutionStatus,
  LogoPosition,
  GradeScale,
  validateInstitution
} from './institution';

// Modelos de Headquarter
export {
  Headquarter,
  HeadquarterStatus,
  validateHeadquarter,
  createNewHeadquarter,
  formatHeadquarterContact,
  parseModularCodes,
  stringifyModularCodes,
  addModularCode,
  removeModularCode,
  formatModularCodesDisplay,
  parseModularCodesFromInput,
  formatModularCodesForInput,
  isHeadquarterActive,
  getHeadquarterStatusText,
  formatHeadquarterDate
} from './headquarter';


// Tipos comunes para administración
export const AdminModuleConstants = {
  MAX_INSTITUTIONS_PER_PAGE: 10,
  MAX_HEADQUARTERS_PER_INSTITUTION: 50,
  DEFAULT_COLORS: ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'],
  
  // Expresiones regulares de validación (basadas en backend)
  PHONE_REGEX: /^[0-9]{9,12}$/,
  CODE_INSTITUTION_REGEX: /^[0-9]+$/,
  STATUS_REGEX: /^[AI]$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Límites de caracteres
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  CODE_INSTITUTION_MIN_LENGTH: 6,
  CODE_INSTITUTION_MAX_LENGTH: 12,
  MODULAR_CODE_MIN_LENGTH: 5,
  MODULAR_CODE_MAX_LENGTH: 10,
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 12
};

/**
 * Estados generales del sistema
 */
export const SystemStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I',
  PENDING: 'P',
  SUSPENDED: 'S',
  MAINTENANCE: 'M'
};

/**
 * Configuraciones por defecto
 */
export const DefaultConfigs = {
  INSTITUTION: {
    uiSettings: {
      color: '#FF0000',
      logoPosition: 'LEFT',
      showStudentPhotos: false
    },
    evaluationSystem: {
      gradeScale: 'NUMERICAL_0_20',
      minimumPassingGrade: 10.5,
      showDecimals: true
    },
    scheduleSettings: {
      morningStartTime: '08:00:00',
      morningEndTime: '12:00:00',
      afternoonStartTime: '14:00:00',
      afternoonEndTime: '18:00:00',
      nightStartTime: '19:00:00',
      nightEndTime: '22:00:00'
    }
  }
};

/**
 * Funciones de validación reutilizables
 */
export const ValidationHelpers = {
  /**
   * Valida un nombre (3-100 caracteres)
   */
  validateName: (name, fieldName = 'nombre') => {
    if (!name || name.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (name.trim().length < AdminModuleConstants.NAME_MIN_LENGTH || 
        name.trim().length > AdminModuleConstants.NAME_MAX_LENGTH) {
      return `El ${fieldName} debe tener entre ${AdminModuleConstants.NAME_MIN_LENGTH} y ${AdminModuleConstants.NAME_MAX_LENGTH} caracteres`;
    }
    return null;
  },

  /**
   * Valida un código de institución (6-12 caracteres, solo números)
   */
  validateInstitutionCode: (code, fieldName = 'código de institución') => {
    if (!code || code.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (code.trim().length < AdminModuleConstants.CODE_INSTITUTION_MIN_LENGTH || 
        code.trim().length > AdminModuleConstants.CODE_INSTITUTION_MAX_LENGTH) {
      return `El ${fieldName} debe tener entre ${AdminModuleConstants.CODE_INSTITUTION_MIN_LENGTH} y ${AdminModuleConstants.CODE_INSTITUTION_MAX_LENGTH} caracteres`;
    }
    if (!AdminModuleConstants.CODE_INSTITUTION_REGEX.test(code.trim())) {
      return `El ${fieldName} debe contener solo números`;
    }
    return null;
  },

  /**
   * Valida códigos modulares (array de códigos de 5-10 caracteres)
   */
  validateModularCodes: (codes, fieldName = 'códigos modulares') => {
    if (!codes || !Array.isArray(codes)) {
      return `Los ${fieldName} deben ser un array válido`;
    }
    if (codes.length === 0) {
      return `Debe contener al menos un código modular`;
    }
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (typeof code !== 'string' || code.trim().length < AdminModuleConstants.MODULAR_CODE_MIN_LENGTH || 
          code.trim().length > AdminModuleConstants.MODULAR_CODE_MAX_LENGTH) {
        return `Cada código modular debe tener entre ${AdminModuleConstants.MODULAR_CODE_MIN_LENGTH} y ${AdminModuleConstants.MODULAR_CODE_MAX_LENGTH} caracteres`;
      }
    }
    return null;
  },

  /**
   * Valida un email
   */
  validateEmail: (email, fieldName = 'correo') => {
    if (!email || email.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (!AdminModuleConstants.EMAIL_REGEX.test(email.trim())) {
      return 'Formato de correo inválido';
    }
    return null;
  },

  /**
   * Valida un teléfono (9-12 dígitos)
   */
  validatePhone: (phone, fieldName = 'teléfono') => {
    if (!phone || phone.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    // Extraer solo números del teléfono para validar
    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < AdminModuleConstants.PHONE_MIN_LENGTH || 
        phoneNumbers.length > AdminModuleConstants.PHONE_MAX_LENGTH) {
      return `El ${fieldName} debe contener entre ${AdminModuleConstants.PHONE_MIN_LENGTH} y ${AdminModuleConstants.PHONE_MAX_LENGTH} dígitos`;
    }
    return null;
  },

  /**
   * Valida un estado (A o I)
   */
  validateStatus: (status) => {
    if (!status || !AdminModuleConstants.STATUS_REGEX.test(status)) {
      return 'El estado debe ser \'A\' (activo) o \'I\' (inactivo)';
    }
    return null;
  },

  /**
   * Valida un campo no vacío
   */
  validateNotBlank: (value, fieldName) => {
    if (!value || value.trim() === '') {
      return `${fieldName} no puede estar vacío`;
    }
    return null;
  }
};

/**
 * Constantes específicas para el manejo de sedes
 */
export const HeadquarterConstants = {
  // Estados de sede
  STATUS: {
    ACTIVE: 'A',
    INACTIVE: 'I'
  },
  
  // Límites para códigos modulares
  MODULAR_CODE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 10,
    MAX_CODES_PER_HEADQUARTER: 20,
    DISPLAY_LIMIT: 2
  },
  
  // Mensajes de validación
  VALIDATION_MESSAGES: {
    NAME_REQUIRED: 'El nombre de la sede es obligatorio',
    NAME_MIN_LENGTH: 'El nombre debe tener al menos 3 caracteres',
    NAME_MAX_LENGTH: 'El nombre no puede exceder 100 caracteres',
    MODULAR_CODE_REQUIRED: 'Debe ingresar al menos un código modular',
    MODULAR_CODE_INVALID: 'Los códigos modulares deben tener entre 5 y 10 caracteres',
    PHONE_REQUIRED: 'El teléfono es obligatorio',
    PHONE_INVALID: 'El teléfono debe contener entre 9 y 12 dígitos',
    ADDRESS_REQUIRED: 'La dirección es obligatoria',
    INSTITUTION_ID_REQUIRED: 'El ID de la institución es obligatorio'
  },
  
  // Configuración de exportación
  EXPORT: {
    CSV_HEADERS: ['ID', 'Nombre Sede', 'Códigos Modulares', 'Estado', 'Dirección', 'Teléfono', 'Fecha Creación'],
    PDF_TITLE: 'Listado de Sedes',
    EXCEL_SHEET_NAME: 'Sedes'
  }
};

/**
 * Tipos de respuesta de la API para sedes
 */
export const HeadquarterApiTypes = {
  // Estructura base de una sede desde la API
  BASE_HEADQUARTER: {
    id: '',
    institutionId: '',
    name: '',
    address: '',
    phone: '',
    status: 'A',
    createdAt: '',
    modularCode: []
  },
  
  // Respuesta al crear una sede
  CREATE_RESPONSE: {
    message: '',
    headquarter: null
  },
  
  // Respuesta al listar sedes
  LIST_RESPONSE: {
    message: '',
    totalHeadquarters: 0,
    headquarters: []
  },
  
  // Respuesta al obtener una sede
  GET_RESPONSE: {
    message: '',
    headquarter: null
  },
  
  // Respuesta al actualizar una sede
  UPDATE_RESPONSE: {
    message: '',
    headquarter: null
  },
  
  // Respuesta al eliminar/restaurar una sede
  ACTION_RESPONSE: {
    message: ''
  }
};