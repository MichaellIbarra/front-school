/**
 * Valida el formulario de justificación
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateJustificationForm = (formData) => {
  const errors = {};

  // Validar tipo de justificación
  if (!formData.justificationType) {
    errors.justificationType = 'El tipo de justificación es requerido';
  }

  // Validar razón (mínimo 10 caracteres)
  if (!formData.justificationReason) {
    errors.justificationReason = 'La razón es requerida';
  } else if (formData.justificationReason.trim().length < 10) {
    errors.justificationReason = 'La razón debe tener al menos 10 caracteres';
  }

  // Validar submittedBy
  if (!formData.submittedBy) {
    errors.submittedBy = 'Debe seleccionar quién envía la justificación';
  }

  // Validar nombre
  if (!formData.submitterName) {
    errors.submitterName = 'El nombre es requerido';
  } else if (formData.submitterName.trim().length < 3) {
    errors.submitterName = 'El nombre debe tener al menos 3 caracteres';
  }

  // Validar fecha de envío
  if (!formData.submissionDate) {
    errors.submissionDate = 'La fecha de envío es requerida';
  } else {
    const submissionDate = new Date(formData.submissionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (submissionDate > today) {
      errors.submissionDate = 'La fecha de envío no puede ser futura';
    }
  }

  // Validar contacto si se proporciona
  if (formData.submitterContact && formData.submitterContact.trim()) {
    const contact = formData.submitterContact.trim();
    // Validar formato de teléfono (9 dígitos) o email
    const phoneRegex = /^[0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!phoneRegex.test(contact) && !emailRegex.test(contact)) {
      errors.submitterContact = 'Ingrese un teléfono válido (9 dígitos) o email válido';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formatea una fecha ISO a formato legible
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '---';
  
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return isoDate;
  }
};

/**
 * Formatea una fecha ISO a formato legible con hora
 * @param {string} isoDateTime - Fecha-hora en formato ISO
 * @returns {string} - Fecha-hora formateada (DD/MM/YYYY HH:mm)
 */
export const formatDateTime = (isoDateTime) => {
  if (!isoDateTime) return '---';
  
  try {
    const date = new Date(isoDateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return isoDateTime;
  }
};

/**
 * Obtiene el color del badge según el estado
 * @param {string} status - Estado de la justificación
 * @returns {string} - Color del badge
 */
export const getStatusColor = (status) => {
  const colors = {
    PENDING: '#faad14',    // Amarillo/warning
    APPROVED: '#52c41a',   // Verde/success
    REJECTED: '#ff4d4f'    // Rojo/danger
  };
  
  return colors[status] || '#d9d9d9';
};

/**
 * Obtiene el color del badge según el estado de asistencia
 * @param {string} status - Estado de asistencia (P, A, L, E, J)
 * @returns {string} - Color del badge
 */
export const getAttendanceStatusColor = (status) => {
  const colors = {
    P: '#52c41a',  // Verde - Presente
    A: '#ff4d4f',  // Rojo - Ausente
    L: '#faad14',  // Amarillo - Tardanza
    E: '#1890ff',  // Azul - Excusado
    J: '#722ed1'   // Púrpura - Justificado
  };
  
  return colors[status] || '#d9d9d9';
};

/**
 * Filtra justificaciones según criterios
 * @param {Array} justifications - Array de justificaciones
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} - Justificaciones filtradas
 */
export const filterJustifications = (justifications, filters) => {
  if (!justifications || !Array.isArray(justifications)) {
    return [];
  }

  let filtered = [...justifications];

  // Filtrar por estado
  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter(j => j.status === filters.status);
  }

  // Filtrar por tipo
  if (filters.type && filters.type !== 'ALL') {
    filtered = filtered.filter(j => j.justificationType === filters.type);
  }

  // Filtrar por rango de fechas
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(j => {
      const jDate = new Date(j.submissionDate);
      jDate.setHours(0, 0, 0, 0);
      return jDate >= startDate;
    });
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(j => {
      const jDate = new Date(j.submissionDate);
      return jDate <= endDate;
    });
  }

  // Filtrar por búsqueda de texto
  if (filters.searchText && filters.searchText.trim()) {
    const searchLower = filters.searchText.toLowerCase().trim();
    filtered = filtered.filter(j => 
      (j.justificationReason && j.justificationReason.toLowerCase().includes(searchLower)) ||
      (j.submitterName && j.submitterName.toLowerCase().includes(searchLower)) ||
      (j.reviewComments && j.reviewComments.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
};
