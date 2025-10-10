/**
 * Modelo de datos para Headquarter
 * Representa una sede de una institución educativa
 */
export const Headquarter = {
  id: null,
  institutionId: null,
  name: '',
  modularCode: [], // Array de códigos modulares
  address: '',
  phone: '',
  status: 'A', // A = Active, I = Inactive
  createdAt: null
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
  if (!headquarter.name || headquarter.name.trim() === '') {
    errors.name = 'El nombre de la sede es obligatorio';
  } else if (headquarter.name.trim().length < 3 || headquarter.name.trim().length > 100) {
    errors.name = 'El nombre debe tener entre 3 y 100 caracteres';
  }
  
  // Validación del código modular (array)
  if (!headquarter.modularCode) {
    errors.modularCode = 'El código modular es obligatorio';
  } else if (!Array.isArray(headquarter.modularCode)) {
    errors.modularCode = 'El código modular debe ser un array válido';
  } else if (headquarter.modularCode.length === 0) {
    errors.modularCode = 'Debe contener al menos un código modular';
  } else {
    // Validar cada código modular
    for (let i = 0; i < headquarter.modularCode.length; i++) {
      const code = headquarter.modularCode[i];
      if (typeof code !== 'string' || code.trim().length < 5 || code.trim().length > 10) {
        errors.modularCode = 'Cada código modular debe tener entre 5 y 10 caracteres';
        break;
      }
    }
  }
  
  // Validación de la dirección
  if (!headquarter.address || headquarter.address.trim() === '') {
    errors.address = 'La dirección es obligatoria';
  }
  
  // Validación del teléfono
  if (!headquarter.phone || headquarter.phone.trim() === '') {
    errors.phone = 'El teléfono es obligatorio';
  } else if (!/^[0-9]{9,12}$/.test(headquarter.phone.replace(/\D/g, ''))) {
    errors.phone = 'El teléfono debe contener entre 9 y 12 dígitos';
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
    name: headquarter.name,
    phone: headquarter.phone,
    address: headquarter.address
  };
};

/**
 * Funciones helper para manejar códigos modulares como arrays
 */
export const parseModularCodes = (modularCodeArray) => {
  return Array.isArray(modularCodeArray) ? modularCodeArray : [];
};

export const stringifyModularCodes = (modularCodesArray) => {
  return Array.isArray(modularCodesArray) ? modularCodesArray : [];
};

export const addModularCode = (headquarter, newCode) => {
  const currentCodes = parseModularCodes(headquarter.modularCode);
  if (!currentCodes.includes(newCode)) {
    currentCodes.push(newCode);
  }
  return {
    ...headquarter,
    modularCode: [...currentCodes] // Crear nueva copia del array
  };
};

export const removeModularCode = (headquarter, codeToRemove) => {
  const currentCodes = parseModularCodes(headquarter.modularCode);
  const filteredCodes = currentCodes.filter(code => code !== codeToRemove);
  return {
    ...headquarter,
    modularCode: filteredCodes
  };
};

/**
 * Función helper para formatear códigos modulares para mostrar
 */
export const formatModularCodesDisplay = (modularCodes, maxCodes = 2) => {
  if (!Array.isArray(modularCodes) || modularCodes.length === 0) {
    return 'Sin códigos modulares';
  }
  
  if (modularCodes.length <= maxCodes) {
    return `Códigos: ${modularCodes.join(', ')}`;
  }
  
  return `Códigos: ${modularCodes.slice(0, maxCodes).join(', ')}... (+${modularCodes.length - maxCodes} más)`;
};

/**
 * Función helper para validar y limpiar input de códigos modulares
 * Ahora no permite espacios, solo números y comas
 */
export const parseModularCodesFromInput = (input) => {
  if (!input || typeof input !== 'string') {
    return [];
  }
  
  // Validar que solo contenga números y comas
  if (!/^[0-9,]+$/.test(input)) {
    return [];
  }
  
  return input
    .split(',')
    .filter(code => code.length >= 5 && code.length <= 10)
    .filter((code, index, array) => array.indexOf(code) === index); // Eliminar duplicados
};

/**
 * Función helper para convertir array de códigos a string para input
 * Ahora sin espacios, solo comas separadoras
 */
export const formatModularCodesForInput = (modularCodes) => {
  if (!Array.isArray(modularCodes)) {
    return '';
  }
  return modularCodes.join(',');
};

/**
 * Función helper para verificar si una sede está activa
 */
export const isHeadquarterActive = (headquarter) => {
  return headquarter && headquarter.status === 'A';
};

/**
 * Función helper para obtener el texto del estado
 */
export const getHeadquarterStatusText = (status) => {
  return status === 'A' ? 'Activo' : 'Inactivo';
};

/**
 * Función helper para formatear la fecha de creación
 */
export const formatHeadquarterDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};