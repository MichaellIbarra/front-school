// Tipos y validaciones para estudiantes

// Enums para estudiantes
export const DocumentType = {
  DNI: 'DNI',
  PASSPORT: 'PASSPORT',
  CE: 'CE'
};

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
};

export const StudentStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I',
  TRANSFER: 'T',
  GRADUATED: 'G'
};

export const GuardianRelationship = {
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  GUARDIAN: "GUARDIAN",
  GRANDPARENT: "GRANDPARENT",
  OTHER: "OTHER",
};

// Estructura base de un estudiante (nueva estructura simplificada)
export const Student = {
  id: '',
  firstName: '',
  lastName: '',
  documentType: DocumentType.DNI,
  documentNumber: '',
  birthDate: '',
  gender: Gender.MALE,
  address: '',
  phone: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  status: StudentStatus.ACTIVE,
  createdAt: null,
  updatedAt: null
};

/**
 * Valida los datos de un estudiante
 * @param {Object} student - Datos del estudiante a validar
 * @returns {Object} - Resultado de la validación
 */
export const validateStudent = (student) => {
  const errors = [];

  // Validaciones requeridas
  if (!student.firstName?.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!student.lastName?.trim()) {
    errors.push('El apellido es requerido');
  }

  if (!student.documentType) {
    errors.push('El tipo de documento es requerido');
  }

  if (!student.documentNumber?.trim()) {
    errors.push('El número de documento es requerido');
  } else if (student.documentType === DocumentType.DNI && !/^\d{8}$/.test(student.documentNumber)) {
    errors.push('El DNI debe tener 8 dígitos');
  }

  if (!student.birthDate) {
    errors.push('La fecha de nacimiento es requerida');
  }

  if (!student.gender) {
    errors.push('El género es requerido');
  }

  if (!student.address?.trim()) {
    errors.push('La dirección es requerida');
  }

  // Validaciones del apoderado
  if (!student.parentName?.trim()) {
    errors.push('El nombre del apoderado es requerido');
  }

  // Validaciones de formato
  if (student.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.parentEmail)) {
    errors.push('El formato del email del apoderado es inválido');
  }

  if (student.phone && !/^\d{9}$/.test(student.phone)) {
    errors.push('El teléfono debe tener 9 dígitos');
  }

  if (student.parentPhone && !/^\d{9}$/.test(student.parentPhone)) {
    errors.push('El teléfono del apoderado debe tener 9 dígitos');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formatea la fecha de nacimiento para mostrar
 * @param {Array|string} birthDate - Fecha en formato array [año, mes, día] o string
 * @returns {string} - Fecha formateada
 */
export const formatBirthDate = (birthDate) => {
  if (!birthDate) return '';
  
  if (Array.isArray(birthDate) && birthDate.length === 3) {
    const [year, month, day] = birthDate;
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }
  
  if (typeof birthDate === 'string') {
    const date = new Date(birthDate);
    return date.toLocaleDateString('es-PE');
  }
  
  return '';
};

/**
 * Convierte array de fecha del backend a Date object
 * @param {Array} dateArray - Array en formato [año, mes, día, hora, minuto, segundo, nanosegundo]
 * @returns {Date|null} - Objeto Date o null si no es válido
 */
export const arrayToDate = (dateArray) => {
  if (!Array.isArray(dateArray) || dateArray.length < 3) return null;
  
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
  // JavaScript Date usa meses de 0-11, pero el backend envía 1-12
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Formatea fecha de creación/actualización para mostrar
 * @param {Array|string} dateValue - Fecha en formato array o string
 * @returns {string} - Fecha formateada
 */
export const formatDateTime = (dateValue) => {
  if (!dateValue) return '';
  
  let date;
  if (Array.isArray(dateValue)) {
    date = arrayToDate(dateValue);
    if (!date) return '';
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return '';
  }
  
  return date.toLocaleDateString('es-PE');
};

/**
 * Convierte fecha de string a formato requerido por el backend
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha en formato ISO
 */
export const formatDateForBackend = (dateString) => {
  if (!dateString) return '';
  return dateString; // El backend espera formato YYYY-MM-DD
};

/**
 * Obtiene la edad a partir de la fecha de nacimiento
 * @param {Array|string} birthDate - Fecha de nacimiento
 * @returns {number} - Edad en años
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  
  let date;
  if (Array.isArray(birthDate)) {
    date = arrayToDate(birthDate);
    if (!date) return 0;
  } else if (typeof birthDate === 'string') {
    date = new Date(birthDate);
  } else {
    return 0;
  }
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Obtiene el texto del estado del estudiante
 * @param {string} status - Estado del estudiante
 * @returns {string} - Texto del estado
 */
export const getStatusText = (status) => {
  const statusTexts = {
    'A': 'Activo',
    'I': 'Inactivo', 
    'T': 'Transferido',
    'G': 'Graduado',
    // Para compatibilidad hacia atrás
    'ACTIVE': 'Activo',
    'INACTIVE': 'Inactivo',
    'TRANSFER': 'Transferido', 
    'GRADUATED': 'Graduado'
  };
  
  return statusTexts[status] || status;
};

/**
 * Obtiene el color del estado del estudiante para mostrar en tags
 * @param {string} status - Estado del estudiante
 * @returns {string} - Color del tag
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'A': 'green',
    'I': 'red',
    'T': 'purple', 
    'G': 'blue',
    // Para compatibilidad hacia atrás
    'ACTIVE': 'green',
    'INACTIVE': 'red',
    'TRANSFER': 'purple',
    'GRADUATED': 'blue'
  };
  
  return statusColors[status] || 'default';
};

// Funciones adicionales que pueden ser útiles
export const getStudentFullName = (student) => {
  return `${student.firstName} ${student.lastName}`.trim();
};

export const getParentFullName = (student) => {
  return student.parentName?.trim() || '';
};

export const getStudentAge = (student) => {
  return calculateAge(student.birthDate);
};

export const formatStudentStatus = (status) => {
  return getStatusText(status);
};

export const formatGender = (gender) => {
  switch (gender) {
    case Gender.MALE:
      return 'Masculino';
    case Gender.FEMALE:
      return 'Femenino';
    case Gender.OTHER:
      return 'Otro';
    default:
      return gender;
  }
};