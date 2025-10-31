// Tipos de justificación
export const JustificationType = {
  MEDICAL: 'MEDICAL',
  FAMILY_EMERGENCY: 'FAMILY_EMERGENCY',
  INSTITUTIONAL: 'INSTITUTIONAL',
  TRANSPORTATION: 'TRANSPORTATION',
  WEATHER: 'WEATHER',
  PERSONAL: 'PERSONAL',
  OTHER: 'OTHER'
};

// Estados de justificación
export const JustificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Quién envió la justificación
export const SubmittedBy = {
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  AUXILIARY: 'AUXILIARY'
};

// Estados de asistencia
export const AttendanceStatus = {
  PRESENT: 'P',      // Presente
  ABSENT: 'A',       // Ausente
  LATE: 'L',         // Tardanza
  EXCUSED: 'E',      // Excusado
  JUSTIFIED: 'J'     // Justificado
};

// Mapeos de etiquetas
export const JustificationTypeLabels = {
  MEDICAL: '🏥 Médica',
  FAMILY_EMERGENCY: '👨‍👩‍👧 Emergencia Familiar',
  INSTITUTIONAL: '🏛️ Institucional',
  TRANSPORTATION: '🚌 Transporte',
  WEATHER: '🌧️ Clima',
  PERSONAL: '👤 Personal',
  OTHER: '📝 Otro'
};

export const JustificationStatusLabels = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada'
};

export const SubmittedByLabels = {
  PARENT: 'Padre/Madre',
  STUDENT: 'Estudiante',
  AUXILIARY: 'Auxiliar'
};

export const AttendanceStatusLabels = {
  P: 'Presente',
  A: 'Ausente',
  L: 'Tardanza',
  E: 'Excusado',
  J: 'Justificado'
};
