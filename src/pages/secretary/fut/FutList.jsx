import {
  FileText,
  User,
  Hash,
  Calendar,
  Phone,
  Tag,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  File,
  Folder,
  MessageCircle,
  Flag,
  Info,
  List,
  Inbox,
  Settings,
  Download
} from "feather-icons-react"
import PropTypes from "prop-types"

const FutList = ({
  futRequests,
  loading,
  error,
  searchTerm,
  searchType,
  statusFilter,
  urgencyFilter,
  currentPage,
  itemsPerPage,
  totalPages,
  totalRequests,
  students,
  onSearch,
  onClearSearch,
  onSearchTermChange,
  onSearchTypeChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
  onPageChange,
  onItemsPerPageChange,
  onCreateNew,
  onViewDetails,
  onEdit,
  onDelete,
  onRefresh,
  onExportToPDF, // Add this new prop
  getStatusConfig,
  getUrgencyConfig,
  getRequestTypeConfig,
  getStudentNameById,
  formatDate,
}) => {
  return (
    <>
      {/* Encabezado */}
      <div className="page-header">
        <div className="page-title">
          <h4>
            <FileText size={24} className="me-2 text-primary" />
            Gestión de Solicitudes FUT
          </h4>
          <h6>Administrar todas las solicitudes del Formato Único de Trámites</h6>
        </div>
        <div className="page-btn">
          <button className="btn btn-primary btn-lg" onClick={onCreateNew}>
            <Plus size={20} className="me-2" />
            Nueva Solicitud FUT
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                <Search size={16} className="me-1" />
                Tipo de búsqueda
              </label>
              <select className="form-control" value={searchType} onChange={(e) => onSearchTypeChange(e.target.value)}>
                <option value="subject">🔍 Buscar por Asunto</option>
                <option value="student">👤 Buscar por Estudiante</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <Search size={16} className="me-1" />
                Término de búsqueda
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={searchType === "subject" ? "Buscar por asunto..." : "Buscar por ID de matrícula..."}
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      onSearch()
                    }
                  }}
                />
                <button className="btn btn-outline-primary" onClick={onSearch} disabled={loading}>
                  <Search size={16} />
                </button>
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <Filter size={16} className="me-1" />
                Estado
              </label>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">⏳ Pendiente</option>
                <option value="APROBADO">✅ Aprobado</option>
                <option value="RECHAZADO">❌ Rechazado</option>
                <option value="COMPLETADO">✔️ Completado</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <AlertTriangle size={16} className="me-1" />
                Urgencia
              </label>
              <select
                className="form-control"
                value={urgencyFilter}
                onChange={(e) => onUrgencyFilterChange(e.target.value)}
              >
                <option value="">Todas las urgencias</option>
                <option value="ALTA">🔴 Alta</option>
                <option value="MEDIA">🟡 Media</option>
                <option value="BAJA">🟢 Baja</option>
              </select>
            </div>

            <div className="col-md-1">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={onClearSearch}
                  disabled={loading}
                  title="Limpiar filtros"
                >
                  <X size={16} />
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={onRefresh}
                  disabled={loading}
                  title="Actualizar lista"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal - Listado */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <List size={20} className="me-2 text-primary" />
              Lista de Solicitudes FUT
            </h5>
            <div className="text-muted">
              <small>
                Mostrando {futRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                {Math.min(currentPage * itemsPerPage, totalRequests)} de {totalRequests} solicitudes
              </small>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Mensaje de error */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <div className="d-flex align-items-center">
                <AlertCircle size={20} className="me-2" />
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {/* Estado de carga */}
          {loading && (
            <div className="text-center p-5">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              <h5 className="text-muted">Cargando solicitudes FUT...</h5>
              <p className="text-muted">Por favor espere un momento</p>
            </div>
          )}

          {/* Tabla de solicitudes */}
          {!loading && !error && (
            <>
              {futRequests.length === 0 ? (
                <div className="text-center p-5">
                  <div className="mb-4">
                    <Inbox size={64} style={{ color: "#e0e0e0" }} />
                  </div>
                  <h5 className="text-muted mb-3">
                    {searchTerm || statusFilter || urgencyFilter
                      ? "No se encontraron resultados"
                      : "No hay solicitudes FUT registradas"}
                  </h5>
                  <p className="text-muted mb-4">
                    {searchTerm || statusFilter || urgencyFilter
                      ? "Intenta ajustar los filtros de búsqueda para encontrar lo que buscas"
                      : "Comience creando una nueva solicitud FUT para empezar a gestionar los trámites"}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    {(searchTerm || statusFilter || urgencyFilter) && (
                      <button className="btn btn-outline-primary" onClick={onClearSearch}>
                        <X size={16} className="me-2" />
                        Limpiar Filtros
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={onCreateNew}>
                      <Plus size={16} className="me-2" />
                      Crear Primera Solicitud
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <label className="form-label me-2 mb-0">Mostrar:</label>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number.parseInt(e.target.value))}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-muted ms-2">por página</span>
                    </div>
                    <div className="text-muted">
                      <small>
                        Página {currentPage} de {totalPages}
                      </small>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>
                            <Hash size={16} className="me-1" />
                            Nº Solicitud
                          </th>
                          <th>
                            <User size={16} className="me-1" />
                            Estudiante
                          </th>
                          <th>
                            <Tag size={16} className="me-1" />
                            Asunto
                          </th>
                          <th>
                            <Folder size={16} className="me-1" />
                            Tipo
                          </th>
                          <th>
                            <Phone size={16} className="me-1" />
                            Solicitante
                          </th>
                          <th>
                            <File size={16} className="me-1" />
                            Documentos
                          </th>
                          <th>
                            <AlertTriangle size={16} className="me-1" />
                            Urgencia
                          </th>
                          <th>
                            <Flag size={16} className="me-1" />
                            Estado
                          </th>
                          <th>
                            <Calendar size={16} className="me-1" />
                            Fecha
                          </th>
                          <th>
                            <Settings size={16} className="me-1" />
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {futRequests.map((futRequest) => {
                          const statusConfig = getStatusConfig(futRequest.status)
                          const urgencyConfig = getUrgencyConfig(futRequest.urgencyLevel)
                          const typeConfig = getRequestTypeConfig(futRequest.requestType)

                          const StatusIcon = statusConfig.icon
                          const UrgencyIcon = urgencyConfig.icon
                          const TypeIcon = typeConfig.icon

                          const requestStudent = students.find((s) => s.id === futRequest.studentEnrollmentId)

                          return (
                            <tr key={futRequest.id} className="align-middle">
                              <td>
                                <div className="d-flex align-items-center">
                                  <FileText size={16} className="me-2 text-primary" />
                                  <span className="fw-bold text-primary">{futRequest.requestNumber}</span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <User size={16} className="me-1 text-muted" />
                                  <div>
                                    <div className="fw-medium">
                                      {requestStudent
                                        ? `${requestStudent.firstName} ${requestStudent.lastName}`
                                        : getStudentNameById(futRequest.studentEnrollmentId)}
                                    </div>
                                    {requestStudent && (
                                      <small className="text-muted">
                                        {requestStudent.documentType}: {requestStudent.documentNumber}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div
                                  className="text-truncate"
                                  style={{ maxWidth: "200px" }}
                                  title={futRequest.requestSubject}
                                >
                                  <MessageCircle size={16} className="me-1 text-muted" />
                                  {futRequest.requestSubject}
                                </div>
                              </td>
                              <td>
                                <span className={`badge bg-light text-dark border ${typeConfig.color}`}>
                                  <TypeIcon size={16} className="me-1" />
                                  {futRequest.requestType}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <User size={16} className="me-1 text-muted" />
                                  <div>
                                    <div className="fw-medium">{futRequest.requestedBy}</div>
                                    <small className="text-muted">
                                      <Phone size={14} className="me-1" />
                                      {futRequest.contactPhone}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {futRequest.attachedDocuments &&
                                  Object.keys(futRequest.attachedDocuments).length > 0 ? (
                                    <div className="d-flex align-items-center">
                                      <File size={16} className="me-1 text-success" />
                                      <span className="badge bg-success">
                                        {Object.keys(futRequest.attachedDocuments).length}
                                      </span>
                                      <small className="text-muted ms-1">archivos</small>
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center text-muted">
                                      <File size={16} className="me-1" />
                                      <small>Sin archivos</small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${urgencyConfig.class}`}>
                                  <UrgencyIcon size={16} className="me-1" />
                                  {urgencyConfig.text}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${statusConfig.class}`}>
                                  <StatusIcon size={16} className="me-1" />
                                  {statusConfig.text}
                                </span>
                              </td>
                              <td>
                                <div className="text-muted small">
                                  <div>
                                    <Calendar size={14} className="me-1" />
                                    {formatDate(futRequest.createdAt)}
                                  </div>
                                  {futRequest.estimatedDeliveryDate && (
                                    <div className="text-success">
                                      <Clock size={14} className="me-1" />
                                      Est: {formatDate(futRequest.estimatedDeliveryDate)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => onViewDetails(futRequest)}
                                    title="Ver detalles"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => onEdit(futRequest)}
                                    title="Editar"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => onExportToPDF(futRequest, requestStudent)}
                                    title="Exportar a PDF"
                                  >
                                    <Download size={16} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => onDelete(futRequest)}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <nav aria-label="Paginación de solicitudes FUT" className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                          >
                            Primera
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </button>
                        </li>

                        {/* Page numbers */}
                        {(() => {
                          const pages = []
                          const startPage = Math.max(1, currentPage - 2)
                          const endPage = Math.min(totalPages, currentPage + 2)

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                                <button className="page-link" onClick={() => onPageChange(i)}>
                                  {i}
                                </button>
                              </li>,
                            )
                          }
                          return pages
                        })()}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            Última
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}

              {/* Footer de la tabla */}
              {futRequests.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <div className="text-muted">
                    <Info size={16} className="me-1" />
                    Mostrando {futRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                    {Math.min(currentPage * itemsPerPage, totalRequests)} de {totalRequests} solicitudes
                  </div>

                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={onRefresh} disabled={loading}>
                      <RefreshCw size={16} className="me-1" />
                      Actualizar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

FutList.propTypes = {
  futRequests: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    requestNumber: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    urgencyLevel: PropTypes.string.isRequired,
    requestType: PropTypes.string.isRequired,
    requestSubject: PropTypes.string.isRequired,
    requestedBy: PropTypes.string.isRequired,
    contactPhone: PropTypes.string.isRequired,
    estimatedDeliveryDate: PropTypes.string,
    attachedDocuments: PropTypes.object,
    studentEnrollmentId: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  searchTerm: PropTypes.string.isRequired,
  searchType: PropTypes.string.isRequired,
  statusFilter: PropTypes.string.isRequired,
  urgencyFilter: PropTypes.string.isRequired,
  currentPage: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalRequests: PropTypes.number.isRequired,
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    documentType: PropTypes.string,
    documentNumber: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string
  })).isRequired,
  onSearch: PropTypes.func.isRequired,
  onClearSearch: PropTypes.func.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onSearchTypeChange: PropTypes.func.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onUrgencyFilterChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExportToPDF: PropTypes.func.isRequired, // Add this new prop
  getStatusConfig: PropTypes.func.isRequired,
  getUrgencyConfig: PropTypes.func.isRequired,
  getRequestTypeConfig: PropTypes.func.isRequired,
  getStudentNameById: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired
}

export default FutList