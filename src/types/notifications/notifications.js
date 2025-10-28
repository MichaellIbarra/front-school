/**
 * Tipos y utilidades para notificaciones WhatsApp del director
 */

/**
 * Estados de instancia WhatsApp
 */
export const WhatsAppInstanceStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};

/**
 * Estados de conexión WhatsApp
 */
export const ConnectionStatus = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  FAILED: 'FAILED',
  SCANNING: 'SCANNING'
};

/**
 * Tipo para instancia WhatsApp
 */
export class WhatsAppInstance {
  constructor(data = {}) {
    this.id = data.id || null;
    this.status = data.status || WhatsAppInstanceStatus.ACTIVE;
    this.institutionId = data.institution_id || data.institutionId || '';
    this.instanceName = data.instance_name || data.instanceName || '';
    this.instanceCode = data.instance_code || data.instanceCode || '';
    this.phoneNumber = data.phone_number || data.phoneNumber || '';
    this.base64 = data.base64 || '';
    this.connectionStatus = data.connection_status || data.connectionStatus || ConnectionStatus.DISCONNECTED;
    this.createdBy = data.created_by || data.createdBy || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  // Método para mapear los datos del API al formato del frontend
  static fromApiResponse(apiData) {
    return new WhatsAppInstance({
      id: apiData.id,
      status: apiData.status,
      institutionId: apiData.institution_id,
      instanceName: apiData.instance_name,
      instanceCode: apiData.instance_code,
      phoneNumber: apiData.phone_number,
      base64: apiData.base64,
      connectionStatus: apiData.connection_status,
      createdBy: apiData.created_by,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at
    });
  }
}

/**
 * Tipo para solicitud de creación de instancia
 */
export class CreateInstanceRequest {
  constructor(data = {}) {
    this.instanceName = data.instanceName || data.instance_name || '';
    this.phoneNumber = data.phoneNumber || data.phone_number || '';
  }
}

/**
 * Tipo para solicitud de reset de instancia
 */
export class ResetInstanceRequest {
  constructor(data = {}) {
    this.phoneNumber = data.phoneNumber || data.phone_number || null; // Opcional
  }
}

/**
 * Obtiene el color del badge según el estado de la instancia
 */
export const getInstanceStatusColor = (status) => {
  switch (status) {
    case WhatsAppInstanceStatus.ACTIVE:
      return 'green';
    case WhatsAppInstanceStatus.INACTIVE:
      return 'red';
    default:
      return 'default';
  }
};

/**
 * Obtiene el texto del estado de la instancia
 */
export const getInstanceStatusText = (status) => {
  switch (status) {
    case WhatsAppInstanceStatus.ACTIVE:
      return 'Activa';
    case WhatsAppInstanceStatus.INACTIVE:
      return 'Inactiva';
    default:
      return 'Desconocido';
  }
};

/**
 * Obtiene el color del badge según el estado de conexión
 */
export const getConnectionStatusColor = (connectionStatus) => {
  switch (connectionStatus) {
    case ConnectionStatus.CONNECTED:
      return 'green';
    case ConnectionStatus.CONNECTING:
    case ConnectionStatus.SCANNING:
      return 'orange';
    case ConnectionStatus.DISCONNECTED:
      return 'red';
    case ConnectionStatus.FAILED:
      return 'red';
    default:
      return 'default';
  }
};

/**
 * Obtiene el texto del estado de conexión
 */
export const getConnectionStatusText = (connectionStatus) => {
  switch (connectionStatus) {
    case ConnectionStatus.CONNECTED:
      return 'Conectado';
    case ConnectionStatus.CONNECTING:
      return 'Conectando';
    case ConnectionStatus.SCANNING:
      return 'Escaneando QR';
    case ConnectionStatus.DISCONNECTED:
      return 'Desconectado';
    case ConnectionStatus.FAILED:
      return 'Error de conexión';
    default:
      return 'Desconocido';
  }
};

/**
 * Obtiene el icono según el estado de conexión
 */
export const getConnectionStatusIcon = (connectionStatus) => {
  switch (connectionStatus) {
    case ConnectionStatus.CONNECTED:
      return '✅';
    case ConnectionStatus.CONNECTING:
      return '🔄';
    case ConnectionStatus.SCANNING:
      return '📱';
    case ConnectionStatus.DISCONNECTED:
      return '❌';
    case ConnectionStatus.FAILED:
      return '⚠️';
    default:
      return '❓';
  }
};

/**
 * Valida el nombre de instancia
 */
export const validateInstanceName = (instanceName) => {
  if (!instanceName || instanceName.trim() === '') {
    return 'El nombre de la instancia es obligatorio';
  }

  if (instanceName.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }

  if (instanceName.length > 50) {
    return 'El nombre no puede exceder 50 caracteres';
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(instanceName)) {
    return 'El nombre solo puede contener letras, números, guiones y guiones bajos';
  }

  return null;
};

/**
 * Valida el número de teléfono
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return 'El número de teléfono es obligatorio';
  }

  // Validar formato peruano: 51XXXXXXXXX (código país + 9 dígitos)
  if (!/^51\d{9}$/.test(phoneNumber)) {
    return 'El número debe tener formato peruano: 51XXXXXXXXX (código país + 9 dígitos)';
  }

  return null;
};

/**
 * Formatea la fecha para mostrar
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea fecha y hora para mostrar
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea el número de teléfono para mostrar
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Si es formato peruano (51XXXXXXXXX), formatear como +51 XXX XXX XXX
  if (/^51\d{9}$/.test(phoneNumber)) {
    const country = phoneNumber.substring(0, 2);
    const number = phoneNumber.substring(2);
    return `+${country} ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  
  return phoneNumber;
};

/**
 * Genera un código de instancia aleatorio (simulación)
 */
export const generateInstanceCode = () => {
  const chars = 'ABCDEF0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 8; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};