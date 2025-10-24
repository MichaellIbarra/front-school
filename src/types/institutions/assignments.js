/**
 * Modelo y helpers para Assignments (asignaciones de usuarios a sedes)
 * Representa tanto el payload de creación (POST) como las respuestas de la API (GET, LIST)
 */
export const Assignment = {
  id: null,
  userId: null,
  headquarterId: null,
  headquarterName: null,
  headquarterCode: [],
  headquarterAddress: null,
  institutionName: null,
  assignmentDate: null,
  createdAt: null,
  updatedAt: null
};

/**
 * Modelo para User (personal de la institución)
 * Representa un usuario del staff que puede ser asignado a sedes
 */
export const User = {
  keycloakId: null,
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  documentType: null,
  documentNumber: null,
  phone: null,
  status: 'A',
  passwordStatus: null,
  passwordCreatedAt: null,
  passwordResetToken: null,
  institutionId: null,
  roles: [],
  enabled: true,
  createdAt: null,
  updatedAt: null
};

/**
 * Payload esperado para POST /assignments
 */
export const AssignmentPostPayload = {
  userId: null,
  headquarterId: null
};

/**
 * Respuesta esperada al crear una asignación
 */
export const AssignmentCreateResponse = {
  message: '',
  assignment: Assignment
};

/**
 * Respuesta esperada al listar asignaciones
 */
export const AssignmentListResponse = {
  message: '',
  requesterId: null,
  institutionId: null,
  endpoint: '',
  totalAssignments: 0,
  assignments: []
};

/**
 * Respuesta esperada al listar usuarios staff
 */
export const UserListResponse = {
  message: '',
  total_users: 0,
  users: []
};

/**
 * Validación básica para el payload de creación
 */
export const validateAssignmentPost = (payload) => {
  const errors = {};

  if (!payload) {
    errors.payload = 'Payload es requerido';
    return { isValid: false, errors };
  }

  if (!payload.userId || typeof payload.userId !== 'string') {
    errors.userId = 'El userId es obligatorio y debe ser un string (UUID)';
  }

  if (!payload.headquarterId || typeof payload.headquarterId !== 'string') {
    errors.headquarterId = 'El headquarterId es obligatorio y debe ser un string (UUID)';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Helper para parsear `headquarterCode` que a veces llega como JSON-string o como array
 */
export const parseHeadquarterCode = (code) => {
  if (!code) return [];
  if (Array.isArray(code)) return code;
  if (typeof code === 'string') {
    try {
      const parsed = JSON.parse(code);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // si no es JSON, intentar separar por comas
      return code.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * Helper para formatear una asignación recibida de la API a nuestro modelo local
 */
export const mapApiAssignmentToModel = (apiItem) => ({
  id: apiItem.id || null,
  userId: apiItem.userId || null,
  headquarterId: apiItem.headquarterId || null,
  headquarterName: apiItem.headquarterName || null,
  headquarterCode: parseHeadquarterCode(apiItem.headquarterCode),
  headquarterAddress: apiItem.headquarterAddress || null,
  institutionName: apiItem.institutionName || null,
  assignmentDate: apiItem.assignmentDate || null,
  createdAt: apiItem.createdAt || null,
  updatedAt: apiItem.updatedAt || null
});

/**
 * Helper para formatear un usuario recibido de la API a nuestro modelo local
 */
export const mapApiUserToModel = (apiUser) => ({
  keycloakId: apiUser.keycloakId || null,
  username: apiUser.username || '',
  email: apiUser.email || '',
  firstname: apiUser.firstname || '',
  lastname: apiUser.lastname || '',
  documentType: apiUser.documentType || null,
  documentNumber: apiUser.documentNumber || null,
  phone: apiUser.phone || null,
  status: apiUser.status || 'A',
  passwordStatus: apiUser.passwordStatus || null,
  passwordCreatedAt: apiUser.passwordCreatedAt || null,
  passwordResetToken: apiUser.passwordResetToken || null,
  institutionId: apiUser.institutionId || null,
  roles: Array.isArray(apiUser.roles) ? apiUser.roles : [],
  enabled: apiUser.enabled !== undefined ? apiUser.enabled : true,
  createdAt: apiUser.createdAt || null,
  updatedAt: apiUser.updatedAt || null
});

/**
 * Helper para convertir el modelo local en el payload para POST
 */
export const mapModelToPostPayload = (model) => ({
  userId: model.userId,
  headquarterId: model.headquarterId
});

/**
 * Helper para obtener el nombre completo de un usuario
 */
export const getUserFullName = (user) => {
  if (!user) return '';
  const firstName = user.firstname || '';
  const lastName = user.lastname || '';
  return `${firstName} ${lastName}`.trim();
};

/**
 * Helper para verificar si un usuario está activo
 */
export const isUserActive = (user) => {
  return user && user.status === 'A' && user.enabled === true;
};

/**
 * Helper para obtener el texto del estado del usuario
 */
export const getUserStatusText = (user) => {
  if (!user) return 'Desconocido';
  if (!user.enabled) return 'Deshabilitado';
  return user.status === 'A' ? 'Activo' : 'Inactivo';
};

/**
 * Helper para formatear los roles de un usuario
 */
export const formatUserRoles = (roles, maxRoles = 2) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'Sin roles';
  }
  
  // Filtrar roles por defecto que no son relevantes para mostrar
  const relevantRoles = roles.filter(role => 
    !role.startsWith('default-roles-') && 
    role !== 'offline_access' && 
    role !== 'uma_authorization'
  );
  
  if (relevantRoles.length === 0) {
    return 'Sin roles específicos';
  }
  
  if (relevantRoles.length <= maxRoles) {
    return relevantRoles.join(', ');
  }
  
  return `${relevantRoles.slice(0, maxRoles).join(', ')}... (+${relevantRoles.length - maxRoles} más)`;
};

/**
 * Helper para formatear la fecha de creación del usuario
 */
export const formatUserDate = (dateString) => {
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

/**
 * Función para formatear la fecha de assignment similar a otros tipos
 */
export const formatAssignmentDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

export default {
  Assignment,
  User,
  AssignmentPostPayload,
  AssignmentCreateResponse,
  AssignmentListResponse,
  UserListResponse,
  validateAssignmentPost,
  parseHeadquarterCode,
  mapApiAssignmentToModel,
  mapApiUserToModel,
  mapModelToPostPayload,
  formatAssignmentDate,
  getUserFullName,
  isUserActive,
  getUserStatusText,
  formatUserRoles,
  formatUserDate
};