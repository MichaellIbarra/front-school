/**
 * Modelo de datos para Institution
 * Representa una institución educativa con su configuración
 */
export const Institution = {
  id: null,
  name: '',
  codeInstitution: '',
  logo: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  status: 'A', // A = Active, I = Inactive
  uiSettings: {
    color: '#FF0000',
    logoPosition: 'LEFT', // LEFT, CENTER, RIGHT
    showStudentPhotos: false
  },
  evaluationSystem: {
    gradeScale: 'NUMERICAL_0_20', // NUMERICAL_0_100, NUMERICAL_0_20, LETTER_GRADE
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
  if (!institution.codeInstitution || institution.codeInstitution.trim() === '') {
    errors.codeInstitution = 'El código de la institución es obligatorio';
  } else if (institution.codeInstitution.trim().length < 6 || institution.codeInstitution.trim().length > 12) {
    errors.codeInstitution = 'El código debe tener entre 6 y 12 caracteres';
  } else if (!/^[0-9]+$/.test(institution.codeInstitution.trim())) {
    errors.codeInstitution = 'El código de institución debe contener solo números';
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
  } else {
    // Extraer solo números del teléfono para validar
    const phoneNumbers = institution.contactPhone.replace(/\D/g, '');
    if (phoneNumbers.length < 9 || phoneNumbers.length > 12) {
      errors.contactPhone = 'El teléfono debe contener entre 9 y 12 dígitos';
    }
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