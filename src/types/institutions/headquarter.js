/**
 * Modelo de datos para Headquarter
 * Representa una sede de una institución educativa
 */
export const Headquarter = {
  id: null,
  institutionId: null,
  headquartersName: '',
  headquartersCode: '',
  address: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  status: 'A', // A = Active, I = Inactive
  createdAt: null,
  updatedAt: null
};

/**
 * Estados posibles para una sede
 * Basado en las validaciones del backend
 */
export const HeadquarterStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};

/**
 * Validación básica para el modelo Headquarter
 * Basado en las anotaciones de validación del backend
 */
export const validateHeadquarter = (headquarter) => {
  const errors = {};
  
  // Validación del ID de la institución
  if (!headquarter.institutionId) {
    errors.institutionId = 'El ID de la institución es obligatorio';
  }
  
  // Validación del nombre de la sede
  if (!headquarter.headquartersName || headquarter.headquartersName.trim() === '') {
    errors.headquartersName = 'El nombre de la sede es obligatorio';
  } else if (headquarter.headquartersName.trim().length < 3 || headquarter.headquartersName.trim().length > 100) {
    errors.headquartersName = 'El nombre debe tener entre 3 y 100 caracteres';
  }
  
  // Validación del código de la sede
  if (!headquarter.headquartersCode || headquarter.headquartersCode.trim() === '') {
    errors.headquartersCode = 'El código de la sede es obligatorio';
  } else if (headquarter.headquartersCode.trim().length < 2 || headquarter.headquartersCode.trim().length > 15) {
    errors.headquartersCode = 'El código debe tener entre 2 y 15 caracteres';
  }
  
  // Validación de la dirección
  if (!headquarter.address || headquarter.address.trim() === '') {
    errors.address = 'La dirección no puede estar vacía';
  }
  
  // Validación de la persona de contacto
  if (!headquarter.contactPerson || headquarter.contactPerson.trim() === '') {
    errors.contactPerson = 'El nombre de la persona de contacto es obligatorio';
  }
  
  // Validación del email de contacto
  if (!headquarter.contactEmail || headquarter.contactEmail.trim() === '') {
    errors.contactEmail = 'El correo de contacto es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(headquarter.contactEmail.trim())) {
    errors.contactEmail = 'Formato de correo inválido';
  }
  
  // Validación del teléfono de contacto
  if (!headquarter.contactPhone || headquarter.contactPhone.trim() === '') {
    errors.contactPhone = 'El teléfono de contacto es obligatorio';
  } else if (!/^[0-9]{9,12}$/.test(headquarter.contactPhone.trim())) {
    errors.contactPhone = 'El teléfono debe contener entre 9 y 12 dígitos';
  }
  
  // Validación del estado
  if (!headquarter.status || !/^[AI]$/.test(headquarter.status)) {
    errors.status = 'El estado debe ser \'A\' (activo) o \'I\' (inactivo)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Función helper para crear una nueva sede
 */
export const createNewHeadquarter = (institutionId) => ({
  ...Headquarter,
  institutionId,
  createdAt: new Date().toISOString()
});

/**
 * Función helper para formatear información de contacto
 */
export const formatHeadquarterContact = (headquarter) => {
  return {
    name: headquarter.headquartersName,
    contact: headquarter.contactPerson,
    email: headquarter.contactEmail,
    phone: headquarter.contactPhone,
    address: headquarter.address
  };
};