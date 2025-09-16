/**
 * Modelo de datos para Student (Estudiante para asistencias)
 * Representa un estudiante en el contexto de asistencias
 */
export const Student = {
  studentEnrollmentId: '',
  studentName: '',
  email: '',
  phone: '',
  entryDate: '',
  observations: ''
};

/**
 * Modelo de datos para Attendance (Asistencia)
 * Representa un registro de asistencia de un estudiante
 */
export const Attendance = {
  id: null,
  studentEnrollmentId: '',
  studentName: '',
  entryDate: '',
  entryTime: '',
  registeredBy: '',
  observations: '',
  isActive: true,
  createdAt: null,
  updatedAt: null
};

/**
 * Modelo de datos para Justification (Justificación)
 * Representa una justificación de ausencia
 */
export const Justification = {
  id: null,
  attendanceId: '',
  justificationType: 'MEDICAL',
  justificationReason: '',
  submissionDate: '',
  submittedBy: '',
  approvalStatus: 'PENDING',
  approvalComments: '',
  approvedBy: '',
  approvalDate: '',
  supportingDocuments: [],
  isActive: true,
  createdAt: null,
  updatedAt: null
};

/**
 * Tipos de justificación disponibles
 */
export const JustificationType = {
  MEDICAL: 'MEDICAL',
  FAMILY_EMERGENCY: 'FAMILY_EMERGENCY',
  INSTITUTIONAL: 'INSTITUTIONAL',
  TRANSPORTATION: 'TRANSPORTATION',
  WEATHER: 'WEATHER',
  PERSONAL: 'PERSONAL',
  ACADEMIC_ACTIVITY: 'ACADEMIC_ACTIVITY',
  OTHER: 'OTHER'
};

/**
 * Estados de aprobación para justificaciones
 */
export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

/**
 * Tipos de búsqueda de estudiantes
 */
export const SearchType = {
  BY_DATE: 'by-date',
  GENERAL: 'general',
  AUTOMATICALLY_MARKED: 'automatically-marked',
  FALTARON: 'faltaron',
  ALL_ATTENDANCE: 'all-attendance',
  PRESENT_BY_DATE: 'present-by-date',
  ATTENDANCE_REPORT: 'attendance-report'
};

/**
 * Labels en español para tipos de justificación
 */
export const JUSTIFICATION_TYPE_LABELS = {
  MEDICAL: 'Médica',
  FAMILY_EMERGENCY: 'Emergencia Familiar',
  INSTITUTIONAL: 'Institucional',
  TRANSPORTATION: 'Transporte',
  WEATHER: 'Clima',
  PERSONAL: 'Personal',
  ACADEMIC_ACTIVITY: 'Actividad Académica',
  OTHER: 'Otro'
};

/**
 * Labels en español para estados de aprobación
 */
export const APPROVAL_STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada'
};

/**
 * Labels en español para tipos de búsqueda
 */
export const SEARCH_TYPE_LABELS = {
  'by-date': 'Por Fecha Específica (Ausentes)',
  'general': 'Estudiantes Elegibles',
  'automatically-marked': 'Marcados Automáticamente',
  'faltaron': 'Estudiantes que Faltaron',
  'all-attendance': 'Todas las Asistencias',
  'present-by-date': 'Presentes por Fecha',
  'attendance-report': 'Reporte de Asistencias'
};

/**
 * Validación básica para el modelo Student
 */
export const validateStudent = (student) => {
  const errors = {};
  
  if (!student.studentEnrollmentId || student.studentEnrollmentId.trim() === '') {
    errors.studentEnrollmentId = 'El ID de matrícula es obligatorio';
  }
  
  if (!student.studentName || student.studentName.trim() === '') {
    errors.studentName = 'El nombre del estudiante es obligatorio';
  } else if (student.studentName.trim().length < 2 || student.studentName.trim().length > 100) {
    errors.studentName = 'El nombre debe tener entre 2 y 100 caracteres';
  }
  
  if (student.email && student.email.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email.trim())) {
      errors.email = 'Formato de correo inválido';
    }
  }
  
  if (student.phone && student.phone.trim() !== '') {
    if (!/^[0-9]{9,12}$/.test(student.phone.trim())) {
      errors.phone = 'El teléfono debe contener entre 9 y 12 dígitos';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validación básica para el modelo Justification
 */
export const validateJustification = (justification) => {
  const errors = {};
  
  if (!justification.attendanceId || justification.attendanceId.trim() === '') {
    errors.attendanceId = 'El ID de asistencia es obligatorio';
  }
  
  if (!justification.justificationType || !Object.values(JustificationType).includes(justification.justificationType)) {
    errors.justificationType = 'Tipo de justificación inválido';
  }
  
  if (!justification.justificationReason || justification.justificationReason.trim() === '') {
    errors.justificationReason = 'El motivo de la justificación es obligatorio';
  } else if (justification.justificationReason.trim().length < 10 || justification.justificationReason.trim().length > 500) {
    errors.justificationReason = 'El motivo debe tener entre 10 y 500 caracteres';
  }
  
  if (!justification.submittedBy || justification.submittedBy.trim() === '') {
    errors.submittedBy = 'El campo "enviado por" es obligatorio';
  }
  
  if (!justification.approvalStatus || !Object.values(ApprovalStatus).includes(justification.approvalStatus)) {
    errors.approvalStatus = 'Estado de aprobación inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Función para crear un nuevo estudiante con valores por defecto
 */
export const createNewStudent = () => {
  return {
    ...Student,
    entryDate: new Date().toISOString().split('T')[0]
  };
};

/**
 * Función para crear una nueva justificación con valores por defecto
 */
export const createNewJustification = (attendanceId = '') => {
  return {
    ...Justification,
    attendanceId,
    submissionDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
};