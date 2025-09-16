"use client"
// pages/secretary/fut.jsx
import { useState, useEffect } from "react"
import {
  FileText,
  User,
  Hash,
  Calendar,
  Phone,
  Mail,
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
  CheckCircle,
  XCircle,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  Award,
  ArrowRightCircle,
  Edit3,
  MoreHorizontal,
  File,
  Folder,
  MessageCircle,
  MessageSquare,
  Flag,
  Info,
  Save,
  Check,
  HelpCircle,
  List,
  Inbox,
  Settings,
} from "feather-icons-react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import FutRequestService from "../../services/fut/FutRequestService"
import { validateFutRequest, generateRequestNumber } from "../../types/fut/fut-request.model"
import StudentService from "../../services/students/studentService"

/**
 * Componente Fut con diseño mejorado y selector de estudiantes
 * Lista todas las solicitudes FUT con opciones de crear, editar y eliminar
 */
export default function Fut() {
  const [futRequests, setFutRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedFutRequest, setSelectedFutRequest] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("subject")
  const [statusFilter, setStatusFilter] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Estados para estudiantes
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [formData, setFormData] = useState({
    studentEnrollmentId: "",
    requestNumber: "",
    requestType: "",
    requestSubject: "",
    requestDescription: "",
    requestedBy: "",
    contactPhone: "",
    contactEmail: "",
    urgencyLevel: "BAJA",
    estimatedDeliveryDate: "",
    attachedDocuments: {},
    adminNotes: "",
    status: "PENDIENTE",
  })

  // Cargar solicitudes FUT al montar el componente
  useEffect(() => {
    loadFutRequests()
    loadStudents()
  }, [])

  /**
   * Carga todos los estudiantes para el selector
   */
  const loadStudents = async () => {
    try {
      setStudentsLoading(true)
      const response = await StudentService.getAllStudents()

      if (response.success) {
        setStudents(response.data)
      } else {
        console.error("Error loading students:", response.error)
        showToast("Error al cargar los estudiantes", "error")
      }
    } catch (err) {
      console.error("Error loading students:", err)
      showToast("Error inesperado al cargar estudiantes", "error")
    } finally {
      setStudentsLoading(false)
    }
  }

  /**
   * Carga todas las solicitudes FUT
   */
  const loadFutRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await FutRequestService.getAll()

      if (response.success) {
        setFutRequests(response.data)
      } else {
        setError(response.error || "Error al cargar las solicitudes FUT")
      }
    } catch (err) {
      setError("Error inesperado al cargar las solicitudes")
      console.error("Error loading FUT requests:", err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Maneja los cambios en el formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Maneja la selección de estudiante
   */
  const handleStudentSelect = (e) => {
    const studentId = e.target.value
    const student = students.find((s) => s.id === studentId)

    if (student) {
      setSelectedStudent(student)
      setFormData((prev) => ({
        ...prev,
        studentEnrollmentId: studentId,
        // Auto-completar datos de contacto si están disponibles
        requestedBy: prev.requestedBy || `${student.firstName} ${student.lastName}`,
        contactPhone: prev.contactPhone || student.phone || student.guardianPhone,
        contactEmail: prev.contactEmail || student.email || student.guardianEmail,
      }))
    } else {
      setSelectedStudent(null)
      setFormData((prev) => ({
        ...prev,
        studentEnrollmentId: "",
      }))
    }
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  const resetForm = () => {
    setFormData({
      studentEnrollmentId: "",
      requestNumber: "",
      requestType: "",
      requestSubject: "",
      requestDescription: "",
      requestedBy: "",
      contactPhone: "",
      contactEmail: "",
      urgencyLevel: "BAJA",
      estimatedDeliveryDate: "",
      attachedDocuments: {},
      adminNotes: "",
      status: "PENDIENTE",
    })
    setSelectedStudent(null)
  }

  /**
   * Maneja el envío del formulario de creación
   */
  const handleCreateSubmit = async (e) => {
    e.preventDefault()

    try {
      setCreateLoading(true)

      const validation = validateFutRequest(formData)

      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(", ")
        showToast(`Errores de validación: ${errorMessages}`, "error")
        setCreateLoading(false)
        return
      }

      const dataToSend = {
        ...formData,
        requestNumber: formData.requestNumber || generateRequestNumber(),
      }

      const response = await FutRequestService.create(dataToSend)

      if (response.success) {
        resetForm()
        setShowCreateModal(false)
        await loadFutRequests()

        // Toast de éxito
        showToast("Solicitud FUT creada exitosamente", "success")
      } else {
        console.error("Error creating FUT:", response)
        showToast(response.error || "Error al crear la solicitud FUT", "error")
      }
    } catch (err) {
      console.error("Error creating FUT:", err)
      showToast("Error inesperado al crear la solicitud", "error")
    } finally {
      setCreateLoading(false)
    }
  }

  /**
   * Maneja el envío del formulario de edición
   */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()

    if (!selectedFutRequest?.id) {
      showToast("Error: No se ha seleccionado ninguna solicitud para editar", "error")
      return
    }

    try {
      setUpdateLoading(true)

      const response = await FutRequestService.update(selectedFutRequest.id, formData)

      if (response.success) {
        setShowEditModal(false)
        setSelectedFutRequest(null)
        resetForm()
        await loadFutRequests()

        showToast("Solicitud FUT actualizada exitosamente", "success")
      } else {
        console.error("Error updating FUT:", response)
        showToast(response.error || "Error al actualizar la solicitud FUT", "error")
      }
    } catch (err) {
      console.error("Error updating FUT:", err)
      showToast("Error inesperado al actualizar la solicitud", "error")
    } finally {
      setUpdateLoading(false)
    }
  }

  /**
   * Maneja el clic en el botón editar
   */
  const handleEdit = (futRequest) => {
    setSelectedFutRequest(futRequest)

    // Buscar el estudiante correspondiente
    const student = students.find((s) => s.id === futRequest.studentEnrollmentId)
    setSelectedStudent(student)

    // Llenar el formulario con los datos de la solicitud seleccionada
    setFormData({
      studentEnrollmentId: futRequest.studentEnrollmentId || "",
      requestNumber: futRequest.requestNumber || "",
      requestType: futRequest.requestType || "",
      requestSubject: futRequest.requestSubject || "",
      requestDescription: futRequest.requestDescription || "",
      requestedBy: futRequest.requestedBy || "",
      contactPhone: futRequest.contactPhone || "",
      contactEmail: futRequest.contactEmail || "",
      urgencyLevel: futRequest.urgencyLevel || "BAJA",
      estimatedDeliveryDate: futRequest.estimatedDeliveryDate ? futRequest.estimatedDeliveryDate.split("T")[0] : "",
      attachedDocuments: futRequest.attachedDocuments || {},
      adminNotes: futRequest.adminNotes || "",
      status: futRequest.status || "PENDIENTE",
    })

    setShowEditModal(true)
  }

  /**
   * Maneja el clic en ver detalles
   */
  const handleViewDetails = (futRequest) => {
    setSelectedFutRequest(futRequest)
    setShowDetailModal(true)
  }

  /**
   * Maneja el clic en el botón eliminar
   */
  const handleDelete = (futRequest) => {
    setSelectedFutRequest(futRequest)
    setShowDeleteModal(true)
  }

  /**
   * Confirma la eliminación de la solicitud
   */
  const confirmDelete = async () => {
    if (!selectedFutRequest?.id) {
      showToast("Error: No se ha seleccionado ninguna solicitud para eliminar", "error")
      return
    }

    try {
      setDeleteLoading(true)

      const response = await FutRequestService.delete(selectedFutRequest.id)

      if (response.success) {
        setShowDeleteModal(false)
        setSelectedFutRequest(null)
        await loadFutRequests()

        showToast("Solicitud FUT eliminada exitosamente", "success")
      } else {
        console.error("Error deleting FUT:", response)
        showToast(response.error || "Error al eliminar la solicitud FUT", "error")
      }
    } catch (err) {
      console.error("Error deleting FUT:", err)
      showToast("Error inesperado al eliminar la solicitud", "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  /**
   * Maneja la búsqueda de solicitudes
   */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadFutRequests()
      return
    }

    try {
      setLoading(true)
      setError(null)

      let response

      if (searchType === "subject") {
        response = await FutRequestService.searchBySubject(searchTerm)
      } else if (searchType === "student") {
        response = await FutRequestService.searchByStudent(searchTerm)
      }

      if (response && response.success) {
        setFutRequests(response.data)
      } else {
        setError(response?.error || "Error al realizar la búsqueda")
      }
    } catch (err) {
      setError("Error inesperado al buscar las solicitudes")
      console.error("Error searching FUT requests:", err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Limpia la búsqueda y recarga todas las solicitudes
   */
  const clearSearch = () => {
    setSearchTerm("")
    setStatusFilter("")
    setUrgencyFilter("")
    loadFutRequests()
  }

  /**
   * Filtra las solicitudes por estado y urgencia
   */
  const getFilteredRequests = () => {
    let filtered = [...futRequests]

    if (statusFilter) {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    if (urgencyFilter) {
      filtered = filtered.filter((req) => req.urgencyLevel === urgencyFilter)
    }

    return filtered
  }

  const getPaginatedRequests = () => {
    const filtered = getFilteredRequests()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    const filtered = getFilteredRequests()
    return Math.ceil(filtered.length / itemsPerPage)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  /**
   * Obtiene el nombre completo del estudiante por ID
   */
  const getStudentNameById = (studentId) => {
    const student = students.find((s) => s.id === studentId)
    return student ? `${student.firstName} ${student.lastName}` : studentId
  }

  /**
   * Obtiene la clase CSS para el estado
   */
  const getStatusConfig = (status) => {
    const configs = {
      PENDIENTE: { class: "bg-warning text-dark", icon: Clock, text: "Pendiente" },
      APROBADO: { class: "bg-success", icon: CheckCircle, text: "Aprobado" },
      RECHAZADO: { class: "bg-danger", icon: XCircle, text: "Rechazado" },
      COMPLETADO: { class: "bg-info", icon: CheckSquare, text: "Completado" },
    }
    return configs[status] || { class: "bg-secondary", icon: HelpCircle, text: status }
  }

  /**
   * Obtiene la configuración para el nivel de urgencia
   */
  const getUrgencyConfig = (urgency) => {
    const configs = {
      ALTA: { class: "bg-danger", icon: AlertTriangle, text: "Alta" },
      MEDIA: { class: "bg-warning text-dark", icon: AlertCircle, text: "Media" },
      BAJA: { class: "bg-success", icon: CheckCircle, text: "Baja" },
    }
    return configs[urgency] || { class: "bg-secondary", icon: HelpCircle, text: urgency }
  }

  /**
   * Obtiene la configuración del tipo de solicitud
   */
  const getRequestTypeConfig = (type) => {
    const configs = {
      CERTIFICADO: { icon: Award, color: "text-primary" },
      CONSTANCIA: { icon: FileText, color: "text-info" },
      TRASLADO: { icon: ArrowRightCircle, color: "text-warning" },
      RECTIFICACION: { icon: Edit3, color: "text-success" },
      OTROS: { icon: MoreHorizontal, color: "text-secondary" },
    }
    return configs[type] || { icon: File, color: "text-muted" }
  }

  /**
   * Formatea la fecha para mostrar
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  /**
   * Muestra notificaciones toast
   */
  const showToast = (message) => {
    // Por simplicidad, usamos alert. En una aplicación real usarías una librería de toast
    alert(message)
  }

  /**
   * Obtiene estadísticas de las solicitudes
   */
  const getStatistics = () => {
    const total = futRequests.length
    const pending = futRequests.filter((req) => req.status === "PENDIENTE").length
    const approved = futRequests.filter((req) => req.status === "APROBADO").length
    const completed = futRequests.filter((req) => req.status === "COMPLETADO").length
    const rejected = futRequests.filter((req) => req.status === "RECHAZADO").length

    return { total, pending, approved, completed, rejected }
  }

  /**
   * Renderiza las tarjetas de estadísticas
   */
  const renderStatistics = () => {
    const stats = getStatistics()

    return (
      <div className="row mb-4">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="dash-count">
            <div className="dash-counts">
              <h4>{stats.total}</h4>
              <h5>Total de Solicitudes</h5>
            </div>
            <div className="dash-imgs">
              <FileText size={32} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="dash-count das1">
            <div className="dash-counts">
              <h4>{stats.pending}</h4>
              <h5>Pendientes</h5>
            </div>
            <div className="dash-imgs">
              <Clock size={32} className="text-warning" />
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="dash-count das2">
            <div className="dash-counts">
              <h4>{stats.approved}</h4>
              <h5>Aprobadas</h5>
            </div>
            <div className="dash-imgs">
              <CheckCircle size={32} className="text-success" />
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="dash-count das3">
            <div className="dash-counts">
              <h4>{stats.completed}</h4>
              <h5>Completadas</h5>
            </div>
            <div className="dash-imgs">
              <CheckSquare size={32} className="text-info" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Maneja la carga de archivos
   */
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachedDocuments = { ...formData.attachedDocuments }

    files.forEach((file) => {
      // Crear un identificador único para el archivo
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      newAttachedDocuments[fileId] = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        file: file, // En una aplicación real, aquí subirías el archivo a un servidor
      }
    })

    setFormData((prev) => ({
      ...prev,
      attachedDocuments: newAttachedDocuments,
    }))
  }

  /**
   * Elimina un archivo adjunto
   */
  const removeAttachedDocument = (fileId) => {
    const newAttachedDocuments = { ...formData.attachedDocuments }
    delete newAttachedDocuments[fileId]

    setFormData((prev) => ({
      ...prev,
      attachedDocuments: newAttachedDocuments,
    }))
  }

  /**
   * Formatea el tamaño del archivo
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * Renderiza el formulario (usado tanto para crear como editar)
   */
  const renderForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdateSubmit : handleCreateSubmit}>
      <div className="modal-body">
        <div className="row">
          {/* Información del Estudiante */}
          <div className="col-12 mb-3">
            <div className="d-flex align-items-center border-bottom pb-2 mb-3">
              <User size={20} className="me-2 text-primary" />
              <h6 className="text-primary mb-0">Información del Estudiante</h6>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <User size={16} className="me-1" />
                Seleccionar Estudiante <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                name="studentEnrollmentId"
                value={formData.studentEnrollmentId}
                onChange={handleStudentSelect}
                required
                disabled={studentsLoading}
              >
                <option value="">{studentsLoading ? "Cargando estudiantes..." : "Seleccionar estudiante"}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} - {student.documentNumber}
                  </option>
                ))}
              </select>
              {studentsLoading && (
                <small className="text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Cargando lista de estudiantes...
                </small>
              )}
            </div>

            {/* Información del estudiante seleccionado */}
            {selectedStudent && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-primary mb-2">
                  <Info size={16} className="me-1" />
                  Información del Estudiante Seleccionado
                </h6>
                <div className="row">
                  <div className="col-12">
                    <small className="text-muted d-block">
                      <strong>Nombre:</strong> {selectedStudent.firstName} {selectedStudent.lastName}
                    </small>
                    <small className="text-muted d-block">
                      <strong>Documento:</strong> {selectedStudent.documentType} - {selectedStudent.documentNumber}
                    </small>
                    {selectedStudent.phone && (
                      <small className="text-muted d-block">
                        <strong>Teléfono:</strong> {selectedStudent.phone}
                      </small>
                    )}
                    {selectedStudent.email && (
                      <small className="text-muted d-block">
                        <strong>Email:</strong> {selectedStudent.email}
                      </small>
                    )}
                    {selectedStudent.guardianName && (
                      <small className="text-muted d-block">
                        <strong>Apoderado:</strong> {selectedStudent.guardianName} {selectedStudent.guardianLastName}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <Hash size={16} className="me-1" />
                Número de Solicitud <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="requestNumber"
                value={formData.requestNumber}
                onChange={handleInputChange}
                placeholder="Se generará automáticamente si se deja vacío"
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                Si se deja vacío, se generará automáticamente
              </small>
            </div>
          </div>

          {/* Status field removed - defaults to PENDIENTE */}

          {/* Información de la Solicitud */}
          <div className="col-12 mb-3 mt-3">
            <div className="d-flex align-items-center border-bottom pb-2 mb-3">
              <FileText size={20} className="me-2 text-primary" />
              <h6 className="text-primary mb-0">Detalles de la Solicitud</h6>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <Folder size={16} className="me-1" />
                Tipo de Solicitud <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                name="requestType"
                value={formData.requestType}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar tipo</option>
                <option value="CERTIFICADO">🏆 Certificado</option>
                <option value="CONSTANCIA">📄 Constancia</option>
                <option value="TRASLADO">➡️ Traslado</option>
                <option value="RECTIFICACION">✏️ Rectificación</option>
                <option value="OTROS">📋 Otros</option>
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <AlertTriangle size={16} className="me-1" />
                Nivel de Urgencia <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                name="urgencyLevel"
                value={formData.urgencyLevel}
                onChange={handleInputChange}
                required
              >
                <option value="BAJA">🟢 Baja</option>
                <option value="MEDIA">🟡 Media</option>
                <option value="ALTA">🔴 Alta</option>
              </select>
            </div>
          </div>

          <div className="col-12">
            <div className="form-group">
              <label className="form-label">
                <Tag size={16} className="me-1" />
                Asunto de la Solicitud <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="requestSubject"
                value={formData.requestSubject}
                onChange={handleInputChange}
                placeholder="Ingrese el asunto de la solicitud"
                maxLength="150"
                required
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                {formData.requestSubject.length}/150 caracteres
              </small>
            </div>
          </div>

          <div className="col-12">
            <div className="form-group">
              <label className="form-label">
                <Edit size={16} className="me-1" />
                Descripción de la Solicitud <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                name="requestDescription"
                value={formData.requestDescription}
                onChange={handleInputChange}
                placeholder="Describa detalladamente su solicitud"
                rows="4"
                required
              ></textarea>
            </div>
          </div>

          {/* Documentos Adjuntos */}
          <div className="col-12 mb-3 mt-3">
            <div className="d-flex align-items-center border-bottom pb-2 mb-3">
              <File size={20} className="me-2 text-primary" />
              <h6 className="text-primary mb-0">Documentos Adjuntos</h6>
            </div>
          </div>

          <div className="col-12">
            <div className="form-group">
              <label className="form-label">
                <File size={16} className="me-1" />
                Subir Documentos
              </label>
              <input
                type="file"
                className="form-control"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT. Máximo 10MB por archivo.
              </small>
            </div>

            {/* Lista de archivos adjuntos */}
            {Object.keys(formData.attachedDocuments).length > 0 && (
              <div className="mt-3">
                <h6 className="text-muted mb-2">
                  <File size={16} className="me-1" />
                  Archivos Adjuntos ({Object.keys(formData.attachedDocuments).length})
                </h6>
                <div className="border rounded p-3 bg-light">
                  {Object.entries(formData.attachedDocuments).map(([fileId, fileData]) => (
                    <div
                      key={fileId}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border"
                    >
                      <div className="d-flex align-items-center">
                        <File size={16} className="me-2 text-primary" />
                        <div>
                          <div className="fw-medium">{fileData.name}</div>
                          <small className="text-muted">
                            {formatFileSize(fileData.size)} • {fileData.type}
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeAttachedDocument(fileId)}
                        title="Eliminar archivo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Información de Contacto */}
          <div className="col-12 mb-3 mt-3">
            <div className="d-flex align-items-center border-bottom pb-2 mb-3">
              <Phone size={20} className="me-2 text-primary" />
              <h6 className="text-primary mb-0">Información de Contacto</h6>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <User size={16} className="me-1" />
                Nombre del Solicitante <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="requestedBy"
                value={formData.requestedBy}
                onChange={handleInputChange}
                placeholder="Nombre completo"
                required
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                Se auto-completa al seleccionar estudiante
              </small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <Phone size={16} className="me-1" />
                Teléfono de Contacto <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                className="form-control"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="999999999"
                pattern="[0-9]{9,12}"
                minLength="9"
                maxLength="12"
                required
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                Se auto-completa al seleccionar estudiante
              </small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} className="me-1" />
                Correo Electrónico <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                required
              />
              <small className="text-muted">
                <Info size={14} className="me-1" />
                Se auto-completa al seleccionar estudiante
              </small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} className="me-1" />
                Fecha Estimada de Entrega
              </label>
              <input
                type="date"
                className="form-control"
                name="estimatedDeliveryDate"
                value={formData.estimatedDeliveryDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="form-group">
              <label className="form-label">
                <MessageSquare size={16} className="me-1" />
                Notas Administrativas
              </label>
              <textarea
                className="form-control"
                name="adminNotes"
                value={formData.adminNotes}
                onChange={handleInputChange}
                placeholder="Notas adicionales (opcional)"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false)
              setSelectedFutRequest(null)
            } else {
              setShowCreateModal(false)
            }
            resetForm()
          }}
          disabled={isEdit ? updateLoading : createLoading}
        >
          <X size={16} className="me-2" />
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isEdit ? updateLoading : createLoading}>
          {(isEdit ? updateLoading : createLoading) ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              {isEdit ? "Actualizando..." : "Creando..."}
            </>
          ) : (
            <>
              {isEdit ? <Save size={16} className="me-2" /> : <Check size={16} className="me-2" />}
              {isEdit ? "Actualizar Solicitud" : "Crear Solicitud"}
            </>
          )}
        </button>
      </div>
    </form>
  )

  /**
   * Renderiza el modal de detalles
   */
  const renderDetailModal = () => {
    if (!selectedFutRequest) return null

    const statusConfig = getStatusConfig(selectedFutRequest.status)
    const urgencyConfig = getUrgencyConfig(selectedFutRequest.urgencyLevel)
    const typeConfig = getRequestTypeConfig(selectedFutRequest.requestType)

    const StatusIcon = statusConfig.icon
    const UrgencyIcon = urgencyConfig.icon
    const TypeIcon = typeConfig.icon

    const requestStudent = students.find((s) => s.id === selectedFutRequest.studentEnrollmentId)

    return (
      <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <div className="d-flex align-items-center">
                <Eye size={20} className="me-2 text-primary" />
                <h5 className="modal-title mb-0">Detalles de Solicitud FUT #{selectedFutRequest.requestNumber}</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedFutRequest(null)
                }}
              ></button>
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
                        Creado: {formatDate(selectedFutRequest.createdAt)}
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
                            : getStudentNameById(selectedFutRequest.studentEnrollmentId)}
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
                        <FileText size={16} className="me-2" />
                        Tipo de Solicitud
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className={`fw-bold ${typeConfig.color}`}>
                          <TypeIcon size={20} className="me-2" />
                          {selectedFutRequest.requestType}
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
                          {selectedFutRequest.requestSubject}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted small">Descripción</label>
                        <div className="border-start border-primary ps-3">{selectedFutRequest.requestDescription}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentos Adjuntos */}
                {selectedFutRequest.attachedDocuments &&
                  Object.keys(selectedFutRequest.attachedDocuments).length > 0 && (
                    <div className="col-12 mt-3">
                      <div className="card">
                        <div className="card-header bg-warning text-dark">
                          <h6 className="mb-0">
                            <File size={16} className="me-2" />
                            Documentos Adjuntos ({Object.keys(selectedFutRequest.attachedDocuments).length})
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {Object.entries(selectedFutRequest.attachedDocuments).map(([fileId, fileData]) => (
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
                          {selectedFutRequest.requestedBy}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted small">Teléfono</label>
                        <div>
                          <Phone size={16} className="me-1 text-muted" />
                          <a href={`tel:${selectedFutRequest.contactPhone}`} className="text-decoration-none">
                            {selectedFutRequest.contactPhone}
                          </a>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted small">Email</label>
                        <div>
                          <Mail size={16} className="me-1 text-muted" />
                          <a href={`mailto:${selectedFutRequest.contactEmail}`} className="text-decoration-none">
                            {selectedFutRequest.contactEmail}
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
                          {selectedFutRequest.estimatedDeliveryDate
                            ? formatDate(selectedFutRequest.estimatedDeliveryDate)
                            : "No especificada"}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted small">Última Actualización</label>
                        <div>
                          <Clock size={16} className="me-1 text-muted" />
                          {formatDate(selectedFutRequest.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas administrativas */}
                {selectedFutRequest.adminNotes && (
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
                          {selectedFutRequest.adminNotes}
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
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedFutRequest(null)
                }}
              >
                <X size={16} className="me-2" />
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowDetailModal(false)
                  handleEdit(selectedFutRequest)
                }}
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

  const filteredRequests = getFilteredRequests()
  const paginatedRequests = getPaginatedRequests()
  const totalPages = getTotalPages()

  return (
    <div className="main-wrapper">
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar id="menu-item-fut" id1="menu-items-fut" activeClassName="fut-list" />

      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
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
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
              >
                <Plus size={20} className="me-2" />
                Nueva Solicitud FUT
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {!loading && renderStatistics()}

          {/* Filtros y búsqueda */}
          <div className="card">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">
                    <Search size={16} className="me-1" />
                    Tipo de búsqueda
                  </label>
                  <select className="form-control" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch()
                        }
                      }}
                    />
                    <button className="btn btn-outline-primary" onClick={handleSearch} disabled={loading}>
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
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    onChange={(e) => setUrgencyFilter(e.target.value)}
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
                      onClick={clearSearch}
                      disabled={loading}
                      title="Limpiar filtros"
                    >
                      <X size={16} />
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={loadFutRequests}
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

          {/* Modal de Creación */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <Plus size={20} className="me-2" />
                      Crear Nueva Solicitud FUT
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setShowCreateModal(false)
                        resetForm()
                      }}
                    ></button>
                  </div>
                  {renderForm(false)}
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edición */}
          {showEditModal && selectedFutRequest && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-info text-white">
                    <h5 className="modal-title">
                      <Edit size={20} className="me-2" />
                      Editar Solicitud FUT #{selectedFutRequest.requestNumber}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setShowEditModal(false)
                        setSelectedFutRequest(null)
                        resetForm()
                      }}
                    ></button>
                  </div>
                  {renderForm(true)}
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          {showDetailModal && selectedFutRequest && renderDetailModal()}

          {/* Modal de Confirmación de Eliminación */}
          {showDeleteModal && selectedFutRequest && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <Trash2 size={20} className="me-2" />
                      Confirmar Eliminación
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setSelectedFutRequest(null)
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="text-center">
                      <div className="mb-4">
                        <AlertTriangle size={64} className="text-warning" />
                      </div>
                      <h4 className="text-danger mb-3">¿Estás seguro?</h4>
                      <div className="alert alert-warning">
                        <div className="mb-2">
                          <strong>Solicitud:</strong> #{selectedFutRequest.requestNumber}
                        </div>
                        <div className="mb-2">
                          <strong>Asunto:</strong> {selectedFutRequest.requestSubject}
                        </div>
                        <div>
                          <strong>Estudiante:</strong> {getStudentNameById(selectedFutRequest.studentEnrollmentId)}
                        </div>
                      </div>
                      <div className="alert alert-danger">
                        <Info size={16} className="me-2" />
                        <strong>¡Atención!</strong> Esta acción no se puede deshacer. La solicitud será eliminada
                        permanentemente del sistema.
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setSelectedFutRequest(null)
                      }}
                      disabled={deleteLoading}
                    >
                      <X size={16} className="me-2" />
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteLoading}>
                      {deleteLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} className="me-2" />
                          Sí, Eliminar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    Mostrando {paginatedRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                    {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de {filteredRequests.length}{" "}
                    solicitudes
                    {futRequests.length !== filteredRequests.length && <span> (de {futRequests.length} total)</span>}
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
                  {filteredRequests.length === 0 ? (
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
                          <button className="btn btn-outline-primary" onClick={clearSearch}>
                            <X size={16} className="me-2" />
                            Limpiar Filtros
                          </button>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            resetForm()
                            setShowCreateModal(true)
                          }}
                        >
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
                            onChange={(e) => handleItemsPerPageChange(Number.parseInt(e.target.value))}
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
                            {paginatedRequests.map((futRequest) => {
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
                                        onClick={() => handleViewDetails(futRequest)}
                                        title="Ver detalles"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleEdit(futRequest)}
                                        title="Editar"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDelete(futRequest)}
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
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                              >
                                Primera
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage - 1)}
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
                                    <button className="page-link" onClick={() => handlePageChange(i)}>
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
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Siguiente
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(totalPages)}
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
                  {filteredRequests.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <div className="text-muted">
                        <Info size={16} className="me-1" />
                        Mostrando {paginatedRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                        {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de {filteredRequests.length}{" "}
                        solicitudes
                        {(searchTerm || statusFilter || urgencyFilter) && (
                          <span className="text-primary"> (filtradas)</span>
                        )}
                        {futRequests.length !== filteredRequests.length && (
                          <span className="text-muted"> de {futRequests.length} total</span>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={loadFutRequests} disabled={loading}>
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
        </div>
      </div>
    </div>
  )
}
