// Tipos y validaciones para matrículas

// Enums para matrículas
export const EnrollmentStatus = {
  ACTIVE: "A",
  COMPLETED: "C",
  TRANSFER: "T",
  RETIRED: "R",
};

export const EnrollmentType = {
  REGULAR: "REGULAR",
  TRANSFER: "TRANSFER",
  REPEAT: "REPEAT",
};

// Estructura base de una matrícula (nueva estructura simplificada)
export const Enrollment = {
  id: "",
  studentId: "",
  classroomId: "",
  enrollmentDate: "",
  enrollmentType: EnrollmentType.REGULAR,
  status: EnrollmentStatus.ACTIVE,
  qrCode: "",
  createdAt: null,
  updatedAt: null
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

  if (!enrollment.enrollmentDate) {
    errors.push("La fecha de matrícula es requerida");
  }

  if (!enrollment.enrollmentType) {
    errors.push("El tipo de matrícula es requerido");
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
    [EnrollmentStatus.COMPLETED]: "Completada",
    [EnrollmentStatus.TRANSFER]: "Transferida",
    [EnrollmentStatus.RETIRED]: "Retirada",
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
    [EnrollmentStatus.COMPLETED]: "blue",
    [EnrollmentStatus.TRANSFER]: "purple",
    [EnrollmentStatus.RETIRED]: "orange",
  };

  return statusColors[status] || "default";
};

/**
 * Formatea el estado de la matrícula
 * @param {string} status - Estado de la matrícula
 * @returns {string} - Estado formateado
 */
export const formatEnrollmentStatus = (status) => {
  return getEnrollmentStatusText(status);
};