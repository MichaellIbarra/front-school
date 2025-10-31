import {
  FileText,
  Eye,
  User,
  Hash,
  Calendar,
  Phone,
  Mail,
  Tag,
  Edit,
  X,
  Clock,
  File,
  Folder,
  MessageCircle,
  MessageSquare,
  Edit3,
  Info,
  Download
} from "feather-icons-react"
import PropTypes from "prop-types"

const FutDetailModal = ({
  futRequest,
  students,
  onClose,
  onEdit,
  onExportToOfficialPDF,
  getStatusConfig,
  getUrgencyConfig,
  getRequestTypeConfig,
  getStudentNameById,
  formatDate,
  formatFileSize,
}) => {
  if (!futRequest) return null

  const statusConfig = getStatusConfig(futRequest.status)
  const urgencyConfig = getUrgencyConfig(futRequest.urgencyLevel)
  const typeConfig = getRequestTypeConfig(futRequest.requestType)

  const StatusIcon = statusConfig.icon
  const UrgencyIcon = urgencyConfig.icon
  const TypeIcon = typeConfig.icon

  // Find the student data
  const requestStudent = students.find((s) => s.id === futRequest.studentEnrollmentId);

  return (
    <div className="modal fade show" style={{ display: "block" }} aria-modal="true" role="dialog">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <FileText size={20} className="me-2" />
              Detalle de Solicitud FUT
            </h5>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => onExportToOfficialPDF(futRequest, requestStudent)}
                title="Exportar a PDF Oficial"
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={onEdit}
                title="Editar solicitud"
              >
                <Edit size={16} />
              </button>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>
          <div className="modal-body">
            <div className="row">
              {/* Header con estado y urgencia */}
              <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <span className={`badge ${statusConfig.class} me-3`}>
                      <StatusIcon size={16} className="me-1" />
                      {statusConfig.text}
                    </span>
                    <span className={`badge ${urgencyConfig.class}`}>
                      <UrgencyIcon size={16} className="me-1" />
                      Urgencia {urgencyConfig.text}
                    </span>
                  </div>
                  <div className="text-muted">
                    <small>
                      <Calendar size={14} className="me-1" />
                      Creado: {formatDate(futRequest.createdAt)}
                    </small>
                  </div>
                </div>
              </div>

              {/* Información del estudiante */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">
                      <User size={16} className="me-2" />
                      Información del Estudiante
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="text-muted small">Estudiante Seleccionado</label>
                      <div className="fw-bold">
                        <User size={16} className="me-1 text-muted" />
                        {requestStudent
                          ? `${requestStudent.firstName} ${requestStudent.lastName}`
                          : getStudentNameById(futRequest.studentEnrollmentId)}
                      </div>
                      {requestStudent && (
                        <div className="mt-2">
                          <small className="text-muted d-block">
                            <Hash size={14} className="me-1" />
                            {requestStudent.documentType}: {requestStudent.documentNumber}
                          </small>
                          {requestStudent.phone && (
                            <small className="text-muted d-block">
                              <Phone size={14} className="me-1" />
                              {requestStudent.phone}
                            </small>
                          )}
                          {requestStudent.email && (
                            <small className="text-muted d-block">
                              <Mail size={14} className="me-1" />
                              {requestStudent.email}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la solicitud */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">
                      <Folder size={16} className="me-2" />
                      Tipo de Solicitud
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className={`fw-bold ${typeConfig.color}`}>
                        <TypeIcon size={20} className="me-2" />
                        {futRequest.requestType}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asunto y descripción */}
              <div className="col-12 mt-3">
                <div className="card">
                  <div className="card-header bg-secondary text-white">
                    <h6 className="mb-0">
                      <MessageCircle size={16} className="me-2" />
                      Detalles de la Solicitud
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="text-muted small">Asunto</label>
                      <div className="fw-bold">
                        <Tag size={16} className="me-1 text-muted" />
                        {futRequest.requestSubject}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Descripción</label>
                      <div className="border-start border-primary ps-3">{futRequest.requestDescription}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentos Adjuntos */}
              {futRequest.attachedDocuments &&
                Object.keys(futRequest.attachedDocuments).length > 0 && (
                  <div className="col-12 mt-3">
                    <div className="card">
                      <div className="card-header bg-warning text-dark">
                        <h6 className="mb-0">
                          <File size={16} className="me-2" />
                          Documentos Adjuntos ({Object.keys(futRequest.attachedDocuments).length})
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {Object.entries(futRequest.attachedDocuments).map(([fileId, fileData]) => (
                            <div key={fileId} className="col-md-6 mb-2">
                              <div className="d-flex align-items-center p-2 border rounded bg-light">
                                <File size={16} className="me-2 text-primary" />
                                <div className="flex-grow-1">
                                  <div className="fw-medium small">{fileData.name}</div>
                                  <small className="text-muted">
                                    {formatFileSize(fileData.size)} • {fileData.type}
                                  </small>
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-primary ms-2"
                                  title="Descargar archivo"
                                  onClick={() => {
                                    // En una aplicación real, aquí implementarías la descarga
                                    alert(`Descargando: ${fileData.name}`)
                                  }}
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Información de contacto */}
              <div className="col-md-6 mt-3">
                <div className="card h-100">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                      <Phone size={16} className="me-2" />
                      Información de Contacto
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="text-muted small">Solicitante</label>
                      <div className="fw-bold">
                        <User size={16} className="me-1 text-muted" />
                        {futRequest.requestedBy}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Teléfono</label>
                      <div>
                        <Phone size={16} className="me-1 text-muted" />
                        <a href={`tel:${futRequest.contactPhone}`} className="text-decoration-none">
                          {futRequest.contactPhone}
                        </a>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Email</label>
                      <div>
                        <Mail size={16} className="me-1 text-muted" />
                        <a href={`mailto:${futRequest.contactEmail}`} className="text-decoration-none">
                          {futRequest.contactEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="col-md-6 mt-3">
                <div className="card h-100">
                  <div className="card-header bg-warning text-dark">
                    <h6 className="mb-0">
                      <Info size={16} className="me-2" />
                      Información Adicional
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="text-muted small">Fecha Estimada de Entrega</label>
                      <div className="fw-bold">
                        <Calendar size={16} className="me-1 text-muted" />
                        {futRequest.estimatedDeliveryDate
                          ? formatDate(futRequest.estimatedDeliveryDate)
                          : "No especificada"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Última Actualización</label>
                      <div>
                        <Clock size={16} className="me-1 text-muted" />
                        {formatDate(futRequest.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas administrativas */}
              {futRequest.adminNotes && (
                <div className="col-12 mt-3">
                  <div className="card">
                    <div className="card-header bg-dark text-white">
                      <h6 className="mb-0">
                        <MessageSquare size={16} className="me-2" />
                        Notas Administrativas
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="alert alert-light mb-0">
                        <Edit3 size={16} className="me-2" />
                        {futRequest.adminNotes}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              <X size={16} className="me-2" />
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onEdit}
            >
              <Edit size={16} className="me-2" />
              Editar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

FutDetailModal.propTypes = {
  futRequest: PropTypes.shape({
    id: PropTypes.string.isRequired,
    requestNumber: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    urgencyLevel: PropTypes.string.isRequired,
    requestType: PropTypes.string.isRequired,
    requestSubject: PropTypes.string.isRequired,
    requestDescription: PropTypes.string.isRequired,
    requestedBy: PropTypes.string.isRequired,
    contactPhone: PropTypes.string.isRequired,
    contactEmail: PropTypes.string.isRequired,
    estimatedDeliveryDate: PropTypes.string,
    updatedAt: PropTypes.string.isRequired,
    adminNotes: PropTypes.string,
    studentEnrollmentId: PropTypes.string.isRequired,
    attachedDocuments: PropTypes.object,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    documentType: PropTypes.string,
    documentNumber: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    guardianName: PropTypes.string,
    guardianLastName: PropTypes.string
  })).isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onExportToOfficialPDF: PropTypes.func.isRequired,
  getStatusConfig: PropTypes.func.isRequired,
  getUrgencyConfig: PropTypes.func.isRequired,
  getRequestTypeConfig: PropTypes.func.isRequired,
  getStudentNameById: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired
}

export default FutDetailModal