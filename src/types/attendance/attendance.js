/**
 * @typedef {Object} AttendanceQRData
 * @property {string} student_id - UUID del estudiante
 * @property {string} classroom_id - UUID del aula
 */

/**
 * @typedef {Object} AttendanceRegisterRequest
 * @property {string} studentId - UUID del estudiante
 * @property {string} classroomId - UUID del aula
 * @property {string} attendanceDate - Fecha de asistencia (YYYY-MM-DD)
 * @property {string} status - Estado de asistencia: 'P' (Presente), 'A' (Ausente), 'T' (Tardanza), 'J' (Justificado)
 * @property {string} [observations] - Observaciones opcionales
 */

/**
 * @typedef {Object} Attendance
 * @property {string} id - UUID único de la asistencia
 * @property {string} studentId - UUID del estudiante
 * @property {string} classroomId - UUID del aula
 * @property {string} institutionId - UUID de la institución
 * @property {string} attendanceDate - Fecha de asistencia (YYYY-MM-DD)
 * @property {string} attendanceTime - Hora de registro (HH:mm:ss.SSS)
 * @property {string} status - Estado: 'P' (Presente), 'A' (Ausente), 'T' (Tardanza), 'J' (Justificado)
 * @property {string|null} observations - Observaciones
 * @property {boolean} parentNotified - Si el padre fue notificado
 * @property {string|null} notificationMethod - Método de notificación usado
 * @property {string} registeredBy - UUID del usuario que registró
 * @property {string} createdAt - Fecha y hora de creación (ISO 8601)
 * @property {string} updatedAt - Fecha y hora de última actualización (ISO 8601)
 */

/**
 * @typedef {Object} AttendanceListResponse
 * @property {Attendance[]} data - Lista de asistencias
 */

/**
 * Estado de asistencia
 * @enum {string}
 */
export const AttendanceStatus = {
  PRESENT: 'P',      // Presente
  ABSENT: 'A',       // Ausente
  LATE: 'T',         // Tardanza
  JUSTIFIED: 'J'     // Justificado
};

/**
 * Nombres de los estados de asistencia
 * @type {Object.<string, string>}
 */
export const AttendanceStatusNames = {
  P: 'Presente',
  A: 'Ausente',
  T: 'Tardanza',
  J: 'Justificado'
};

/**
 * Colores para los estados de asistencia
 * @type {Object.<string, string>}
 */
export const AttendanceStatusColors = {
  P: 'green',
  A: 'red',
  T: 'orange',
  J: 'blue'
};

export default {
  AttendanceStatus,
  AttendanceStatusNames,
  AttendanceStatusColors
};
