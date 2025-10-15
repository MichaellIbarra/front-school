// Enums basados en el backend
export const UserStatus = {
  A: 'A',           // Active (simplificado)
  I: 'I',           // Inactive (simplificado)
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
};

export const DocumentType = {
  DNI: 'DNI',
  PASSPORT: 'PASSPORT',
  CARNET_EXTRANJERIA: 'CARNET_EXTRANJERIA',
  RUC: 'RUC'
};

export const PasswordStatus = {
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT',
  VALID: 'VALID',
  EXPIRED: 'EXPIRED'
};

// Tipos para formularios y validaciones
export const UserRoles = {
  ADMIN: 'admin',
  DIRECTOR: 'director'
};

// Roles específicos para personal director
export const DirectorPersonalRoles = {
  TEACHER: 'teacher',
  AUXILIARY: 'auxiliary', 
  SECRETARY: 'secretary'
};

// Estructura del modelo User para crear/actualizar
export const createUserModel = () => ({
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  password: '',
  roles: [],
  documentType: DocumentType.DNI,
  documentNumber: '',
  phone: '',
  status: UserStatus.A,
  institutionId: null // Solo se usa cuando el rol es DIRECTOR
});

// Estructura del modelo UserProfile (respuesta del servidor)
export const createUserProfileModel = () => ({
  id: '',
  keycloakId: '',
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  documentType: DocumentType.DNI,
  documentNumber: '',
  phone: '',
  status: UserStatus.A,
  passwordStatus: PasswordStatus.TEMPORARY,
  passwordCreatedAt: null,
  passwordResetToken: '',
  createdAt: null,
  updatedAt: null
});

// Validaciones para formularios
export const userValidationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'El nombre de usuario debe tener entre 3-50 caracteres y solo puede contener letras, números, guiones y guiones bajos'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Debe ser un email válido'
  },
  firstname: {
    required: false,
    maxLength: 100,
    message: 'El nombre no puede exceder 100 caracteres'
  },
  lastname: {
    required: false,
    maxLength: 100,
    message: 'El apellido no puede exceder 100 caracteres'
  },
  documentNumber: {
    required: true,
    minLength: 6,
    maxLength: 20,
    pattern: /^[0-9]{6,20}$/,
    message: 'El número de documento debe tener entre 6-20 dígitos'
  },
  phone: {
    required: false,
    pattern: /^[0-9+\-\s]{7,15}$/,
    message: 'El número de teléfono debe tener entre 7-15 dígitos'
  }
};

// Etiquetas para mostrar en la UI
export const UserStatusLabels = {
  [UserStatus.A]: 'Activo',
  [UserStatus.I]: 'Inactivo',
  [UserStatus.PENDING]: 'Pendiente',
  [UserStatus.SUSPENDED]: 'Suspendido'
};

export const DocumentTypeLabels = {
  [DocumentType.DNI]: 'DNI',
  [DocumentType.PASSPORT]: 'Pasaporte',
  [DocumentType.CARNET_EXTRANJERIA]: 'Carnet de Extranjería',
  [DocumentType.RUC]: 'RUC'
};

export const PasswordStatusLabels = {
  [PasswordStatus.TEMPORARY]: 'Temporal',
  [PasswordStatus.PERMANENT]: 'Permanente',
  [PasswordStatus.VALID]: 'Válida',
  [PasswordStatus.EXPIRED]: 'Expirada'
};

export const UserRoleLabels = {
  [UserRoles.ADMIN]: 'Administrador',
  [UserRoles.DIRECTOR]: 'Director'
};

export const DirectorPersonalRoleLabels = {
  [DirectorPersonalRoles.TEACHER]: 'Profesor',
  [DirectorPersonalRoles.AUXILIARY]: 'Auxiliar',
  [DirectorPersonalRoles.SECRETARY]: 'Secretario'
};

// Funciones de utilidad
export const formatUserFullName = (user) => {
  if (!user) return '';
  const { firstname, lastname } = user;
  if (firstname && lastname) {
    return `${firstname} ${lastname}`;
  }
  return firstname || lastname || user.username || 'N/A';
};

export const getUserStatusColor = (status) => {
  const colors = {
    [UserStatus.A]: 'success',
    [UserStatus.I]: 'danger',
    [UserStatus.PENDING]: 'warning',
    [UserStatus.SUSPENDED]: 'danger'
  };
  return colors[status] || 'secondary';
};

export const getPasswordStatusColor = (status) => {
  const colors = {
    [PasswordStatus.TEMPORARY]: 'warning',
    [PasswordStatus.PERMANENT]: 'success',
    [PasswordStatus.VALID]: 'success',
    [PasswordStatus.EXPIRED]: 'danger'
  };
  return colors[status] || 'secondary';
};