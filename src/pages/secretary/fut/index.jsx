"use client"
// pages/secretary/fut/index.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../../components/Header"
import Sidebar from "../../../components/Sidebar"
import FutList from "./FutList"
import FutDetailModal from "./FutDetailModal"
import AlertModal from "../../../components/AlertModal"
import FutRequestService from "../../../services/fut/FutRequestService"
import StudentService from "../../../services/students/studentService"
import useAlert from "../../../hooks/useAlert"
import FutExportUtils from "../../../utils/fut/exportUtils"

/**
 * Componente principal de FUT con diseño mejorado y selector de estudiantes
 * Lista todas las solicitudes FUT con opciones de crear, editar y eliminar
 */
export default function Fut() {
  const navigate = useNavigate()
  const [futRequests, setFutRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedFutRequest, setSelectedFutRequest] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("subject")
  const [statusFilter, setStatusFilter] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Estados para estudiantes
  const [students, setStudents] = useState([])

  // Initialize the useAlert hook
  const { 
    alertState, 
    showError, 
    showSuccess,
    showConfirm,
    handleConfirm: alertConfirm, 
    handleCancel: alertCancel 
  } = useAlert()

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
      const response = await StudentService.getStudentsByInstitution()

      if (response.success) {
        // Transform student data to match the expected format
        const transformedStudents = response.data.map(student => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          documentType: student.documentType || 'DNI',
          documentNumber: student.documentNumber,
          phone: student.phone || student.parentPhone,
          email: student.parentEmail,
          guardianName: student.parentName?.split(' ')[0] || '',
          guardianLastName: student.parentName?.split(' ').slice(1).join(' ') || ''
        }));
        setStudents(transformedStudents)
      } else {
        console.error("Error loading students:", response.error)
        showError("Error al cargar los estudiantes", response.error)
      }
    } catch (err) {
      console.error("Error loading students:", err)
      showError("Error inesperado al cargar estudiantes", err.message)
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
        showError("Error al cargar solicitudes", response.error || "Error al cargar las solicitudes FUT")
      }
    } catch (err) {
      setError("Error inesperado al cargar las solicitudes")
      showError("Error inesperado", "Error inesperado al cargar las solicitudes")
      console.error("Error loading FUT requests:", err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Maneja el clic en ver detalles
   */
  const handleViewDetails = (futRequest) => {
    setSelectedFutRequest(futRequest)
    setShowDetailModal(true)
  }

  /**
   * Confirma la eliminación de la solicitud
   */
  const confirmDelete = async () => {
    if (!selectedFutRequest?.id) {
      showError("Error", "No se ha seleccionado ninguna solicitud para eliminar")
      return
    }

    try {
      const response = await FutRequestService.delete(selectedFutRequest.id)

      if (response.success) {
        setSelectedFutRequest(null)
        await loadFutRequests()

        showSuccess("Solicitud FUT eliminada", "Solicitud FUT eliminada exitosamente")
      } else {
        console.error("Error deleting FUT:", response)
        showError("Error al eliminar solicitud", response.error || "Error al eliminar la solicitud FUT")
      }
    } catch (err) {
      console.error("Error deleting FUT:", err)
      showError("Error inesperado", "Error inesperado al eliminar la solicitud")
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
        showError("Error en búsqueda", response?.error || "Error al realizar la búsqueda")
      }
    } catch (err) {
      setError("Error inesperado al buscar las solicitudes")
      showError("Error inesperado", "Error inesperado al buscar las solicitudes")
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
      PENDIENTE: { class: "bg-warning text-dark", icon: "Clock", text: "Pendiente" },
      APROBADO: { class: "bg-success", icon: "CheckCircle", text: "Aprobado" },
      RECHAZADO: { class: "bg-danger", icon: "XCircle", text: "Rechazado" },
      COMPLETADO: { class: "bg-info", icon: "CheckSquare", text: "Completado" },
    }
    return configs[status] || { class: "bg-secondary", icon: "HelpCircle", text: status }
  }

  /**
   * Obtiene la configuración para el nivel de urgencia
   */
  const getUrgencyConfig = (urgency) => {
    const configs = {
      ALTA: { class: "bg-danger", icon: "AlertTriangle", text: "Alta" },
      MEDIA: { class: "bg-warning text-dark", icon: "AlertCircle", text: "Media" },
      BAJA: { class: "bg-success", icon: "CheckCircle", text: "Baja" },
    }
    return configs[urgency] || { class: "bg-secondary", icon: "HelpCircle", text: urgency }
  }

  /**
   * Obtiene la configuración del tipo de solicitud
   */
  const getRequestTypeConfig = (type) => {
    const configs = {
      CERTIFICADO: { icon: "Award", color: "text-primary" },
      CONSTANCIA: { icon: "FileText", color: "text-info" },
      TRASLADO: { icon: "ArrowRightCircle", color: "text-warning" },
      RECTIFICACION: { icon: "Edit3", color: "text-success" },
      OTROS: { icon: "MoreHorizontal", color: "text-secondary" },
    }
    return configs[type] || { icon: "File", color: "text-muted" }
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
   * Formatea el tamaño del archivo
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * Exporta una solicitud FUT individual a PDF
   */
  const handleExportToPDF = (futRequest, student) => {
    try {
      // For now, we'll use a generic institution object
      // In a real implementation, you would fetch this from the institution service
      const institution = {
        name: "Institución Educativa Demo",
        address: "Av. Educación 123",
        district: "Distrito Ejemplo",
        province: "Provincia Ejemplo",
        phone: "(01) 123-4567"
      };
      
      FutExportUtils.exportFutRequestToOfficialPDF(futRequest, student, institution);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      showError("Error al exportar", "Error al generar el documento PDF");
    }
  };

  const filteredRequests = getFilteredRequests()
  const paginatedRequests = getPaginatedRequests()
  const totalPages = getTotalPages()
  const statistics = getStatistics()

  return (
    <div className="main-wrapper">
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar id="menu-item-fut" id1="menu-items-fut" activeClassName="fut-list" />

      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <FutList
            futRequests={paginatedRequests}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
            searchType={searchType}
            statusFilter={statusFilter}
            urgencyFilter={urgencyFilter}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            totalRequests={filteredRequests.length}
            statistics={statistics}
            students={students}
            onSearch={handleSearch}
            onClearSearch={clearSearch}
            onSearchTermChange={setSearchTerm}
            onSearchTypeChange={setSearchType}
            onStatusFilterChange={setStatusFilter}
            onUrgencyFilterChange={setUrgencyFilter}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onCreateNew={() => {
              // Navigate to the new form page
              navigate("/fut/form")
            }}
            onViewDetails={handleViewDetails}
            onEdit={(futRequest) => {
              // Navigate to the edit form page
              navigate("/fut/form", { state: { isEdit: true, futRequest } })
            }}
            onDelete={(futRequest) => {
              setSelectedFutRequest(futRequest)
              showConfirm(
                "Confirmar eliminación",
                `¿Está seguro que desea eliminar la solicitud FUT #${futRequest.requestNumber}? Esta acción no se puede deshacer.`,
                confirmDelete
              )
            }}
            onRefresh={loadFutRequests}
            onExportToPDF={handleExportToPDF} // Add this new handler
            getStatusConfig={getStatusConfig}
            getUrgencyConfig={getUrgencyConfig}
            getRequestTypeConfig={getRequestTypeConfig}
            getStudentNameById={getStudentNameById}
            formatDate={formatDate}
          />

          {/* Modal de Detalles */}
          {showDetailModal && selectedFutRequest && (
            <FutDetailModal
              futRequest={selectedFutRequest}
              students={students}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedFutRequest(null)
              }}
              onEdit={() => {
                setShowDetailModal(false)
                // Navigate to the edit form page
                navigate("/fut/form", { state: { isEdit: true, futRequest: selectedFutRequest } })
              }}
              onExportToOfficialPDF={handleExportToPDF} // Reuse the same handler
              getStatusConfig={getStatusConfig}
              getUrgencyConfig={getUrgencyConfig}
              getRequestTypeConfig={getRequestTypeConfig}
              getStudentNameById={getStudentNameById}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
            />
          )}

          {/* AlertModal para notificaciones */}
          <AlertModal 
            alert={alertState} 
            onConfirm={alertConfirm} 
            onCancel={alertCancel} 
          />
        </div>
      </div>
    </div>
  )
}