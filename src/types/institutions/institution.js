/**
 * Modelo de datos para Institution
 * Representa una institución educativa con su configuración
 */
export const Institution = {
  id: null,
  name: '',
  codeName: '',
  logo: '',
  modularCode: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  status: 'A', // A = Active, I = Inactive
  uiSettings: {
    color: '#3498DB',
    logoPosition: 'LEFT', // LEFT, CENTER, RIGHT
    showStudentPhotos: false
  },
  evaluationSystem: {
    gradeScale: 'NUMERICAL_0_100', // NUMERICAL_0_100, NUMERICAL_0_20, LETTER_GRADE
    minimumPassingGrade: 60.0,
    showDecimals: false
  },
  scheduleSettings: {
    morningStartTime: '07:30:00',
    morningEndTime: '11:30:00',
    afternoonStartTime: '13:00:00',
    afternoonEndTime: '17:00:00'
  },
  createdAt: null,
  updatedAt: null
};

/**
 * Estados posibles para una institución
 */
export const InstitutionStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};

/**
 * Posiciones del logo en la UI
 */
export const LogoPosition = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT'
};

/**
 * Escalas de calificación disponibles
 */
export const GradeScale = {
  NUMERICAL_0_100: 'NUMERICAL_0_100',
  NUMERICAL_0_20: 'NUMERICAL_0_20',
  LETTER_GRADE: 'LETTER_GRADE'
};

/**
 * Validación básica para el modelo Institution
 * Basado en las anotaciones de validación del backend
 */
export const validateInstitution = (institution) => {
  const errors = {};
  
  // Validación del nombre
  if (!institution.name || institution.name.trim() === '') {
    errors.name = 'El nombre de la institución es obligatorio';
  } else if (institution.name.trim().length < 3 || institution.name.trim().length > 100) {
    errors.name = 'El nombre debe tener entre 3 y 100 caracteres';
  }
  
  // Validación del código de la institución
  if (!institution.codeName || institution.codeName.trim() === '') {
    errors.codeName = 'El código de la institución es obligatorio';
  } else if (institution.codeName.trim().length < 2 || institution.codeName.trim().length > 10) {
    errors.codeName = 'El código debe tener entre 2 y 10 caracteres';
  } else if (!/^[A-Z0-9]+$/.test(institution.codeName.trim())) {
    errors.codeName = 'El código solo puede contener letras mayúsculas y números';
  }
  
  // Validación del código modular
  if (!institution.modularCode || institution.modularCode.trim() === '') {
    errors.modularCode = 'El código modular es obligatorio';
  } else if (institution.modularCode.trim().length < 5 || institution.modularCode.trim().length > 10) {
    errors.modularCode = 'El código modular debe tener entre 5 y 10 caracteres';
  }
  
  // Validación de la dirección
  if (!institution.address || institution.address.trim() === '') {
    errors.address = 'La dirección no puede estar vacía';
  }
  
  // Validación del email de contacto
  if (!institution.contactEmail || institution.contactEmail.trim() === '') {
    errors.contactEmail = 'El correo de contacto es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institution.contactEmail.trim())) {
    errors.contactEmail = 'Formato de correo inválido';
  }
  
  // Validación del teléfono de contacto
  if (!institution.contactPhone || institution.contactPhone.trim() === '') {
    errors.contactPhone = 'El teléfono de contacto es obligatorio';
  } else if (!/^[0-9]{9,12}$/.test(institution.contactPhone.trim())) {
    errors.contactPhone = 'El teléfono debe contener entre 9 y 12 dígitos';
  }
  
  // Validación del estado
  if (!institution.status || !/^[AI]$/.test(institution.status)) {
    errors.status = 'El estado debe ser \'A\' (activo) o \'I\' (inactivo)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};