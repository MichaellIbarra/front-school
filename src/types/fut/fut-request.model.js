/**
 * Modelo de datos para FutRequest
 * Representa una solicitud FUT en el sistema
 */
export const FutRequest = {
  id: null,
  studentEnrollmentId: "",
  requestNumber: "",
  requestType: "",
  requestSubject: "",
  requestDescription: "",
  requestedBy: "",
  contactPhone: "",
  contactEmail: "",
  urgencyLevel: "",
  estimatedDeliveryDate: "",
  attachedDocuments: {}, // Archivos adjuntos (clave-valor)
  adminNotes: "",
  status: "PENDIENTE", // PENDIENTE | APROBADO | RECHAZADO | COMPLETADO
  createdAt: null,
  updatedAt: null,
}

/**
 * Estados posibles para una solicitud FUT
 */
export const FutRequestStatus = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  COMPLETADO: "COMPLETADO",
}

/**
 * Validación básica para el modelo FutRequest
 * Basado en las anotaciones y campos del backend
 */
export const validateFutRequest = (futRequest) => {
  const errors = {}

  // Validación de matrícula del estudiante
  if (!futRequest.studentEnrollmentId || futRequest.studentEnrollmentId.trim() === "") {
    errors.studentEnrollmentId = "El ID de matrícula del estudiante es obligatorio"
  }

  // Validación del número de solicitud
  if (!futRequest.requestNumber || futRequest.requestNumber.trim() === "") {
    errors.requestNumber = "El número de solicitud es obligatorio"
  }

  // Validación del tipo de solicitud
  if (!futRequest.requestType || futRequest.requestType.trim() === "") {
    errors.requestType = "El tipo de solicitud es obligatorio"
  }

  // Validación del asunto
  if (!futRequest.requestSubject || futRequest.requestSubject.trim() === "") {
    errors.requestSubject = "El asunto de la solicitud es obligatorio"
  } else if (futRequest.requestSubject.trim().length < 3 || futRequest.requestSubject.trim().length > 150) {
    errors.requestSubject = "El asunto debe tener entre 3 y 150 caracteres"
  }

  // Validación de la descripción
  if (!futRequest.requestDescription || futRequest.requestDescription.trim() === "") {
    errors.requestDescription = "La descripción de la solicitud es obligatoria"
  }

  // Validación del solicitante
  if (!futRequest.requestedBy || futRequest.requestedBy.trim() === "") {
    errors.requestedBy = "El nombre del solicitante es obligatorio"
  }

  // Validación del teléfono de contacto
  if (!futRequest.contactPhone || futRequest.contactPhone.trim() === "") {
    errors.contactPhone = "El teléfono de contacto es obligatorio"
  } else if (!/^[0-9]{9,12}$/.test(futRequest.contactPhone.trim())) {
    errors.contactPhone = "El teléfono debe contener entre 9 y 12 dígitos"
  }

  // Validación del correo electrónico
  if (!futRequest.contactEmail || futRequest.contactEmail.trim() === "") {
    errors.contactEmail = "El correo de contacto es obligatorio"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(futRequest.contactEmail.trim())) {
    errors.contactEmail = "Formato de correo inválido"
  }

  // Validación del nivel de urgencia
  if (!futRequest.urgencyLevel || futRequest.urgencyLevel.trim() === "") {
    errors.urgencyLevel = "El nivel de urgencia es obligatorio"
  }

  // Validación del estado
  const validStatuses = Object.values(FutRequestStatus)
  if (!futRequest.status || !validStatuses.includes(futRequest.status)) {
    errors.status = "El estado debe ser uno de: 'PENDIENTE', 'APROBADO', 'RECHAZADO' o 'COMPLETADO'"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Función helper para crear una nueva solicitud FUT
 */
export const createNewFutRequest = (studentEnrollmentId) => ({
  ...FutRequest,
  studentEnrollmentId,
  requestNumber: generateRequestNumber(),
  createdAt: new Date().toISOString(),
})

/**
 * Función helper para formatear la información de contacto
 */
export const formatFutRequestContact = (futRequest) => {
  return {
    solicitante: futRequest.requestedBy,
    telefono: futRequest.contactPhone,
    correo: futRequest.contactEmail,
  }
}

/**
 * Función helper para generar un número de solicitud único
 */
export const generateRequestNumber = () => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase()
  return `FUT-${timestamp}-${randomStr}`
}
