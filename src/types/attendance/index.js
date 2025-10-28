/**
 * Tipos y enumeraciones para el módulo de asistencia
 */

/**
 * Estados de asistencia para lotes (batch)
 */
export const BatchAttendanceStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

/**
 * Métodos de registro de asistencia
 */
export const RegistrationMethod = {
  MANUAL: 'MANUAL',
  QR_SCAN: 'QR_SCAN',
  BIOMETRIC: 'BIOMETRIC'
};

/**
 * Estados de asistencia individual
 */
export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
};

/**
 * Tipo de registro de asistencia
 */
export class AttendanceRecord {
  constructor(data = {}) {
    this.id = data.id || null;
    this.studentId = data.studentId || '';
    this.classroomId = data.classroomId || '';
    this.attendanceDate = data.attendanceDate || '';
    this.status = data.status || AttendanceStatus.ABSENT;
    this.method = data.method || RegistrationMethod.MANUAL;
    this.registeredAt = data.registeredAt || null;
    this.registeredBy = data.registeredBy || '';
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

/**
 * Tipo para lote de asistencia
 */
export class BatchAttendance {
  constructor(data = {}) {
    this.id = data.id || null;
    this.classroomId = data.classroomId || '';
    this.attendanceDate = data.attendanceDate || '';
    this.status = data.status || BatchAttendanceStatus.PENDING;
    this.totalStudents = data.totalStudents || 0;
    this.processedStudents = data.processedStudents || 0;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.records = data.records || [];
  }
}

/**
 * Obtiene el color del badge según el estado de asistencia
 */
export const getAttendanceStatusColor = (status) => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 'green';
    case AttendanceStatus.LATE:
      return 'orange';
    case AttendanceStatus.EXCUSED:
      return 'blue';
    case AttendanceStatus.ABSENT:
      return 'red';
    default:
      return 'default';
  }
};

/**
 * Obtiene el texto del estado de asistencia
 */
export const getAttendanceStatusText = (status) => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return 'Presente';
    case AttendanceStatus.LATE:
      return 'Tardanza';
    case AttendanceStatus.EXCUSED:
      return 'Justificado';
    case AttendanceStatus.ABSENT:
      return 'Ausente';
    default:
      return 'Desconocido';
  }
};

/**
 * Tipo de aula
 */
export class Classroom {
  constructor(data = {}) {
    this.id = data.id || null;
    this.headquarterId = data.headquarterId || '';
    this.periodId = data.periodId || '';
    this.section = data.section || '';
    this.classroomName = data.classroomName || null;
    this.shift = data.shift || '';
    this.shiftName = data.shiftName || '';
    this.status = data.status || 'A';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

/**
 * Colores disponibles para las tarjetas de aulas
 */
export const CLASSROOM_COLORS = [
  '#f59e0b', // Naranja
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#06b6d4', // Cian
  '#ef4444', // Rojo
  '#84cc16', // Lima
  '#f97316', // Naranja brillante
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#f43f5e', // Rosa intenso
];

/**
 * Genera un color aleatorio para las tarjetas de aulas
 * @returns {string} Color hexadecimal aleatorio
 */
export const getRandomClassroomColor = () => {
  return CLASSROOM_COLORS[Math.floor(Math.random() * CLASSROOM_COLORS.length)];
};

/**
 * Obtiene el texto del método de registro
 */
export const getRegistrationMethodText = (method) => {
  switch (method) {
    case RegistrationMethod.MANUAL:
      return 'Manual';
    case RegistrationMethod.QR_SCAN:
      return 'Código QR';
    case RegistrationMethod.BIOMETRIC:
      return 'Biométrico';
    default:
      return 'Desconocido';
  }
};
