// Tipos y validaciones para matrículas

// Enums para matrículas
export const EnrollmentStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE", 
  COMPLETED: "COMPLETED",
  TRANSFERRED: "TRANSFERRED",
  WITHDRAWN: "WITHDRAWN",
  SUSPENDED: "SUSPENDED",
};

// Estructura base de una matrícula
export const Enrollment = {
  id: "",
  studentId: "",
  classroomId: "",
  enrollmentNumber: "",
  enrollmentDate: "",
  status: EnrollmentStatus.ACTIVE,
  createdAt: null,
  updatedAt: null,
  // Datos del estudiante (cuando se incluye en la respuesta)
  student: null,
};

/**
 * Valida los datos de una matrícula
 * @param {Object} enrollment - Datos de la matrícula a validar
 * @returns {Object} - Resultado de la validación
 */
export const validateEnrollment = (enrollment) => {
  const errors = [];

  // Validaciones requeridas
  if (!enrollment.studentId?.trim()) {
    errors.push("El ID del estudiante es requerido");
  }

  if (!enrollment.classroomId?.trim()) {
    errors.push("El ID del aula es requerido");
  }

  if (!enrollment.enrollmentNumber?.trim()) {
    errors.push("El número de matrícula es requerido");
  }

  if (!enrollment.enrollmentDate) {
    errors.push("La fecha de matrícula es requerida");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida los datos para matrícula masiva
 * @param {Array} enrollments - Array de matrículas a validar
 * @returns {Object} - Resultado de la validación
 */
export const validateBulkEnrollments = (enrollments) => {
  const errors = [];

  if (!Array.isArray(enrollments) || enrollments.length === 0) {
    errors.push("Se requiere al menos una matrícula");
    return { isValid: false, errors };
  }

  enrollments.forEach((enrollment, index) => {
    const validation = validateEnrollment(enrollment);
    if (!validation.isValid) {
      errors.push(`Matrícula ${index + 1}: ${validation.errors.join(", ")}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formatea la fecha de matrícula para mostrar
 * @param {Array|string} enrollmentDate - Fecha en formato array [año, mes, día] o string
 * @returns {string} - Fecha formateada
 */
export const formatEnrollmentDate = (enrollmentDate) => {
  if (!enrollmentDate) return "";

  if (Array.isArray(enrollmentDate) && enrollmentDate.length === 3) {
    const [year, month, day] = enrollmentDate;
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  }

  if (typeof enrollmentDate === "string") {
    const date = new Date(enrollmentDate);
    return date.toLocaleDateString("es-PE");
  }

  return "";
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
  if (!dateString) return "";
  return dateString; // El backend espera formato YYYY-MM-DD
};

/**
 * Obtiene el texto del estado de la matrícula
 * @param {string} status - Estado de la matrícula
 * @returns {string} - Texto del estado
 */
export const getEnrollmentStatusText = (status) => {
  const statusTexts = {
    [EnrollmentStatus.ACTIVE]: "Activa",
    [EnrollmentStatus.INACTIVE]: "Inactiva",
    [EnrollmentStatus.COMPLETED]: "Completada",
    [EnrollmentStatus.TRANSFERRED]: "Transferida",
    [EnrollmentStatus.WITHDRAWN]: "Retirada",
    [EnrollmentStatus.SUSPENDED]: "Suspendida",
  };

  return statusTexts[status] || status;
};

/**
 * Obtiene el color del estado de la matrícula para mostrar en tags
 * @param {string} status - Estado de la matrícula
 * @returns {string} - Color del tag
 */
export const getEnrollmentStatusColor = (status) => {
  const statusColors = {
    [EnrollmentStatus.ACTIVE]: "green",
    [EnrollmentStatus.INACTIVE]: "red",
    [EnrollmentStatus.COMPLETED]: "blue",
    [EnrollmentStatus.TRANSFERRED]: "purple",
    [EnrollmentStatus.WITHDRAWN]: "orange",
    [EnrollmentStatus.SUSPENDED]: "volcano",
  };

  return statusColors[status] || "default";
};

/**
 * Genera un número de matrícula automático basado en el año y correlativo
 * @param {Array} existingEnrollments - Lista de matrículas existentes para calcular el correlativo
 * @returns {string} - Número de matrícula generado (ej: MAT-2025-001)
 */
export const generateEnrollmentNumber = (existingEnrollments = []) => {
  const currentYear = new Date().getFullYear();
  
  // Filtrar matrículas del año actual
  const currentYearEnrollments = existingEnrollments.filter(enrollment => {
    if (!enrollment.enrollmentNumber) return false;
    
    // Extraer el año del número de matrícula (formato: MAT-YYYY-XXX)
    const parts = enrollment.enrollmentNumber.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[1]);
      return year === currentYear;
    }
    return false;
  });
  
  // Calcular el próximo número correlativo
  const nextCorrelative = currentYearEnrollments.length + 1;
  
  // Formatear con ceros a la izquierda (4 dígitos)
  const correlativeFormatted = nextCorrelative.toString().padStart(4, "0");
  
  return `MAT-${currentYear}-${correlativeFormatted}`;
};

/**
 * Formatea el estado de la matrícula
 * @param {string} status - Estado de la matrícula
 * @returns {string} - Estado formateado
 */
export const formatEnrollmentStatus = (status) => {
  return getEnrollmentStatusText(status);
};
