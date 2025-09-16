/**
 * Modelo de datos para Director
 * Representa un director asignado a una institución educativa
 */
export const Director = {
  id: null,
  userId: null,
  institutionAssignments: [],
  createdAt: null,
  updatedAt: null,
  status: 'A',
  userDetails: {
    id: null,
    keycloakId: null,
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    roles: null,
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    status: 'A',
    passwordStatus: 'TEMPORARY',
    passwordCreatedAt: null,
    passwordResetToken: null,
    createdAt: null,
    updatedAt: null
  }
};

/**
 * Estados posibles para un director
 */
export const DirectorStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};

/**
 * Tipos de documento disponibles para directores
 */
export const DirectorDocumentType = {
  DNI: 'DNI',
  PASSPORT: 'PASSPORT',
  CARNET_EXTRANJERIA: 'CARNET_EXTRANJERIA',
  RUC: 'RUC'
};

/**
 * Estados de contraseña para directores
 */
export const DirectorPasswordStatus = {
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT',
  EXPIRED: 'EXPIRED'
};

/**
 * Modelo para crear/asignar un nuevo director
 */
export const CreateDirectorModel = {
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  documentType: 'DNI',
  documentNumber: '',
  phone: ''
};

/**
 * Validación básica para el modelo de director
 */
export const validateDirector = (director) => {
  const errors = {};
  
  // Validación del username
  if (!director.username || director.username.trim() === '') {
    errors.username = 'El nombre de usuario es obligatorio';
  } else if (director.username.trim().length < 3 || director.username.trim().length > 50) {
    errors.username = 'El nombre de usuario debe tener entre 3 y 50 caracteres';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(director.username.trim())) {
    errors.username = 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos';
  }
  
  // Validación del email
  if (!director.email || director.email.trim() === '') {
    errors.email = 'El correo electrónico es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(director.email.trim())) {
    errors.email = 'Formato de correo inválido';
  }
  
  // Validación del firstname
  if (!director.firstname || director.firstname.trim() === '') {
    errors.firstname = 'El nombre es obligatorio';
  } else if (director.firstname.trim().length > 100) {
    errors.firstname = 'El nombre no puede exceder 100 caracteres';
  }
  
  // Validación del lastname
  if (!director.lastname || director.lastname.trim() === '') {
    errors.lastname = 'El apellido es obligatorio';
  } else if (director.lastname.trim().length > 100) {
    errors.lastname = 'El apellido no puede exceder 100 caracteres';
  }
  
  // Validación del número de documento
  if (!director.documentNumber || director.documentNumber.trim() === '') {
    errors.documentNumber = 'El número de documento es obligatorio';
  } else if (!/^[0-9]{6,20}$/.test(director.documentNumber.trim())) {
    errors.documentNumber = 'El número de documento debe tener entre 6 y 20 dígitos';
  }
  
  // Validación del teléfono (opcional)
  if (director.phone && director.phone.trim() !== '' && !/^[0-9+\-\s]{7,15}$/.test(director.phone.trim())) {
    errors.phone = 'El número de teléfono debe tener entre 7 y 15 dígitos';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Función helper para crear un nuevo director
 */
export const createNewDirector = () => ({
  ...CreateDirectorModel,
  createdAt: new Date().toISOString()
});

/**
 * Función helper para formatear el nombre completo del director
 */
export const formatDirectorFullName = (director) => {
  if (!director || !director.userDetails) return '';
  const { firstname, lastname, username } = director.userDetails;
  
  if (firstname && lastname) {
    return `${firstname} ${lastname}`;
  }
  return firstname || lastname || username || 'N/A';
};

/**
 * Función helper para obtener el estado de la asignación del director
 */
export const getDirectorAssignmentStatus = (director, institutionId) => {
  if (!director.institutionAssignments || director.institutionAssignments.length === 0) {
    return 'No asignado';
  }
  
  const assignment = director.institutionAssignments.find(
    assignment => assignment.institutionId === institutionId
  );
  
  if (!assignment) {
    return 'No asignado';
  }
  
  return assignment.status === 'A' ? 'Activo' : 'Inactivo';
};

/**
 * Función helper para obtener la fecha de asignación del director
 */
export const getDirectorAssignmentDate = (director, institutionId) => {
  if (!director.institutionAssignments || director.institutionAssignments.length === 0) {
    return null;
  }
  
  const assignment = director.institutionAssignments.find(
    assignment => assignment.institutionId === institutionId
  );
  
  return assignment ? assignment.assignmentDate : null;
};

/**
 * Labels para mostrar en la UI
 */
export const DirectorStatusLabels = {
  [DirectorStatus.ACTIVE]: 'Activo',
  [DirectorStatus.INACTIVE]: 'Inactivo'
};

export const DirectorDocumentTypeLabels = {
  [DirectorDocumentType.DNI]: 'DNI',
  [DirectorDocumentType.PASSPORT]: 'Pasaporte',
  [DirectorDocumentType.CARNET_EXTRANJERIA]: 'Carnet de Extranjería',
  [DirectorDocumentType.RUC]: 'RUC'
};

export const DirectorPasswordStatusLabels = {
  [DirectorPasswordStatus.TEMPORARY]: 'Temporal',
  [DirectorPasswordStatus.PERMANENT]: 'Permanente',
  [DirectorPasswordStatus.EXPIRED]: 'Expirada'
};

/**
 * Funciones de utilidad para colores de estado
 */
export const getDirectorStatusColor = (status) => {
  const colors = {
    [DirectorStatus.ACTIVE]: 'success',
    [DirectorStatus.INACTIVE]: 'danger'
  };
  return colors[status] || 'secondary';
};

export const getDirectorPasswordStatusColor = (status) => {
  const colors = {
    [DirectorPasswordStatus.TEMPORARY]: 'warning',
    [DirectorPasswordStatus.PERMANENT]: 'success',
    [DirectorPasswordStatus.EXPIRED]: 'danger'
  };
  return colors[status] || 'secondary';
};