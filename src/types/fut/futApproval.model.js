/**
 * Modelo de datos para FutApproval
 * Representa la revisión y entrega de un FUT
 */
export const FutApproval = {
  id: null,
  futRequestId: null,
  reviewedBy: '',
  reviewDate: null,
  decision: '', // A = Approved, R = Rejected
  reviewComments: '',
  generatedDocuments: {}, // Documentos generados (mapa clave-valor)
  deliveryMethod: '', // P = Pickup, E = Email, PO = Postal, DP = Digital Platform
  deliveryAddress: '',
  deliveredAt: null,
  deliveredBy: '',
  receivedBy: '',
  createdAt: null
};

/**
 * Estados posibles para la decisión del FUT
 */
export const FutApprovalDecision = {
  APPROVED: 'A',
  REJECTED: 'R'
};

/**
 * Métodos de entrega posibles para el FUT
 */
export const FutDeliveryMethod = {
  PICKUP: 'P',
  EMAIL: 'E',
  POSTAL: 'PO',
  DIGITAL_PLATFORM: 'DP'
};

/**
 * Validación básica para el modelo FutApproval
 * Basado en las reglas del backend
 */
export const validateFutApproval = (approval) => {
  const errors = {};

  if (!approval.futRequestId) {
    errors.futRequestId = 'El ID de la solicitud FUT es obligatorio';
  }

  if (!approval.reviewedBy || approval.reviewedBy.trim() === '') {
    errors.reviewedBy = 'El revisor es obligatorio';
  }

  if (!approval.decision || !['A', 'R'].includes(approval.decision)) {
    errors.decision = 'La decisión debe ser "A" (Aprobado) o "R" (Rechazado)';
  }

  if (!approval.deliveryMethod || !['P', 'E', 'PO', 'DP'].includes(approval.deliveryMethod)) {
    errors.deliveryMethod =
      'El método de entrega debe ser P (Recojo), E (Email), PO (Postal) o DP (Plataforma Digital)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Función helper para crear un nuevo FutApproval
 */
export const createNewFutApproval = (futRequestId) => ({
  ...FutApproval,
  futRequestId,
  createdAt: new Date().toISOString()
});

/**
 * Función helper para formatear la información de entrega
 */
export const formatFutDeliveryInfo = (approval) => {
  return {
    method: approval.deliveryMethod,
    address: approval.deliveryAddress,
    deliveredBy: approval.deliveredBy,
    deliveredAt: approval.deliveredAt,
    receivedBy: approval.receivedBy
  };
};
