import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import Header from "../../../components/Header"
import Sidebar from "../../../components/Sidebar"
import FutFormProfessional from "./FutFormProfessional"
import StudentService from "../../../services/students/studentService"
import FutRequestService from "../../../services/fut/FutRequestService"
import { validateFutRequest, generateRequestNumber } from "../../../types/fut/fut-request.model"
import useAlert from "../../../hooks/useAlert"

/**
 * Función personalizada para generar un número de solicitud basado en:
 * 2 dígitos del DNI del estudiante + 2 letras del nombre del estudiante + 2 letras del nombre del apoderado
 */
const generateCustomRequestNumber = (studentDni, studentName, guardianName) => {
  if (!studentDni || !studentName) {
    // Si no hay información suficiente, usar el generador por defecto
    return generateRequestNumber()
  }
  
  // Obtener 2 dígitos del DNI (los últimos 2)
  const dniDigits = studentDni.slice(-2)
  
  // Obtener 2 letras del nombre del estudiante (primeras letras de las primeras 2 palabras)
  const studentLetters = studentName.split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
  
  // Obtener 2 letras del nombre del apoderado (primeras letras de las primeras 2 palabras)
  const guardianLetters = guardianName 
    ? guardianName.split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
    : 'XX'
  
  // Combinar todo para formar el número de solicitud
  return `${dniDigits}${studentLetters}${guardianLetters}`
}

const FutFormPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = location.state?.isEdit || false
  const initialFutRequest = location.state?.futRequest || null
  
  const [formData, setFormData] = useState({
    studentEnrollmentId: "",
    requestType: "",
    requestSubject: "",
    requestDescription: "",
    requestedBy: "",
    contactPhone: "",
    contactEmail: "",
    guardianFullName: "",
    guardianPhone: "",
    guardianDni: "",
    guardianAddress: "",
    guardianDistrict: "",
    guardianProvince: "",
    urgencyLevel: "BAJA",
    estimatedDeliveryDate: "",
    attachedDocuments: {},
    adminNotes: "",
    status: "PENDIENTE",
  })
  
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const { showError, showSuccess } = useAlert()
  
  // Cargar estudiantes al montar el componente
  useEffect(() => {
    loadStudents()
  }, [])
  
  // Si es edición, cargar los datos de la solicitud después de que los estudiantes se hayan cargado
  useEffect(() => {
    if (isEdit && initialFutRequest && students.length > 0) {
      loadFutRequestData(initialFutRequest)
    }
  }, [isEdit, initialFutRequest, students])
  
  /**
   * Carga todos los estudiantes para el selector
   */
  const loadStudents = async () => {
    try {
      setStudentsLoading(true)
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
    } finally {
      setStudentsLoading(false)
    }
  }
  
  /**
   * Cargar los datos de la solicitud para edición
   */
  const loadFutRequestData = (futRequest) => {
    // Buscar el estudiante correspondiente
    const student = students.find((s) => s.id === futRequest.studentEnrollmentId)
    setSelectedStudent(student)

    // Llenar el formulario con los datos de la solicitud
    setFormData({
      studentEnrollmentId: futRequest.studentEnrollmentId || "",
      requestType: futRequest.requestType || "",
      requestSubject: futRequest.requestSubject || "",
      requestDescription: futRequest.requestDescription || "",
      requestedBy: futRequest.requestedBy || "",
      contactPhone: futRequest.contactPhone || "",
      contactEmail: futRequest.contactEmail || "",
      guardianFullName: futRequest.guardianFullName || "",
      guardianPhone: futRequest.guardianPhone || "",
      guardianDni: futRequest.guardianDni || "",
      guardianAddress: futRequest.guardianAddress || "",
      guardianDistrict: futRequest.guardianDistrict || "",
      guardianProvince: futRequest.guardianProvince || "",
      urgencyLevel: futRequest.urgencyLevel || "BAJA",
      estimatedDeliveryDate: futRequest.estimatedDeliveryDate ? futRequest.estimatedDeliveryDate.split("T")[0] : "",
      attachedDocuments: futRequest.attachedDocuments || {},
      adminNotes: futRequest.adminNotes || "",
      status: futRequest.status || "PENDIENTE",
    })
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
        contactPhone: prev.contactPhone || student.phone,
        contactEmail: prev.contactEmail || student.email,
        // Auto-completar datos del apoderado si están disponibles
        guardianFullName: prev.guardianFullName || `${student.guardianName || ''} ${student.guardianLastName || ''}`.trim(),
        guardianPhone: prev.guardianPhone || student.phone,
        guardianDni: prev.guardianDni || "",
        guardianAddress: prev.guardianAddress || student.address || "",
        guardianDistrict: prev.guardianDistrict || "",
        guardianProvince: prev.guardianProvince || "",
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
      requestType: "",
      requestSubject: "",
      requestDescription: "",
      requestedBy: "",
      contactPhone: "",
      contactEmail: "",
      guardianFullName: "",
      guardianPhone: "",
      guardianDni: "",
      guardianAddress: "",
      guardianDistrict: "",
      guardianProvince: "",
      urgencyLevel: "BAJA",
      estimatedDeliveryDate: "",
      attachedDocuments: {},
      adminNotes: "",
      status: "PENDIENTE",
    })
    setSelectedStudent(null)
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  
  /**
   * Maneja el envío del formulario de creación
   */
  const handleCreateSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Generar automáticamente el número de solicitud
      let requestData = { ...formData }
      
      // Obtener información del estudiante seleccionado
      const student = students.find(s => s.id === requestData.studentEnrollmentId)
      if (student) {
        requestData.requestNumber = generateCustomRequestNumber(
          student.documentNumber,
          `${student.firstName} ${student.lastName}`,
          requestData.guardianFullName
        )
      } else {
        requestData.requestNumber = generateRequestNumber()
      }

      const validation = validateFutRequest(requestData)

      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(", ")
        showError("Errores de validación", errorMessages)
        setLoading(false)
        return
      }

      const dataToSend = {
        ...requestData,
        requestNumber: requestData.requestNumber,
      }

      const response = await FutRequestService.create(dataToSend)

      if (response.success) {
        resetForm()
        showSuccess("Solicitud FUT creada", "Solicitud FUT creada exitosamente")
        // Redirigir a la lista de FUT
        navigate("/fut")
      } else {
        console.error("Error creating FUT:", response)
        showError("Error al crear solicitud", response.error || "Error al crear la solicitud FUT")
      }
    } catch (err) {
      console.error("Error creating FUT:", err)
      showError("Error inesperado", "Error inesperado al crear la solicitud")
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Maneja el envío del formulario de edición
   */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()

    if (!initialFutRequest?.id) {
      showError("Error", "No se ha seleccionado ninguna solicitud para editar")
      return
    }

    try {
      setLoading(true)

      // Asegurarse de que el número de solicitud esté presente
      const requestData = {
        ...formData,
        requestNumber: formData.requestNumber || initialFutRequest.requestNumber
      };

      const response = await FutRequestService.update(initialFutRequest.id, requestData)

      if (response.success) {
        showSuccess("Solicitud FUT actualizada", "Solicitud FUT actualizada exitosamente")
        // Redirigir a la lista de FUT
        navigate("/fut")
      } else {
        console.error("Error updating FUT:", response)
        showError("Error al actualizar solicitud", response.error || "Error al actualizar la solicitud FUT")
      }
    } catch (err) {
      console.error("Error updating FUT:", err)
      showError("Error inesperado", "Error inesperado al actualizar la solicitud")
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Maneja el envío del formulario (creación o edición)
   */
  const handleSubmit = isEdit ? handleUpdateSubmit : handleCreateSubmit
  
  return (
    <div className="main-wrapper">
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar id="menu-item-fut" id1="menu-items-fut" activeClassName="fut-list" />

      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title">
              <h4>{isEdit ? "Editar Solicitud FUT" : "Nueva Solicitud FUT"}</h4>
              <h6>{isEdit ? "Modificar una solicitud existente" : "Crear una nueva solicitud FUT"}</h6>
            </div>
            <div className="page-btn">
              <button 
                className="btn btn-outline-secondary btn-lg"
                onClick={() => navigate("/fut")}
              >
                <i className="feather-arrow-left me-2"></i>
                Volver a la lista
              </button>
            </div>
          </div>
          
          {/* Form */}
          <div className="card">
            <div className="card-body">
              <FutFormProfessional
                isEdit={isEdit}
                formData={formData}
                students={students}
                studentsLoading={studentsLoading}
                loading={loading}
                selectedStudent={selectedStudent}
                onClose={() => navigate("/fut")}
                onSubmit={handleSubmit}
                onInputChange={handleInputChange}
                onStudentSelect={handleStudentSelect}
                onFileUpload={handleFileUpload}
                onRemoveFile={removeAttachedDocument}
                formatFileSize={formatFileSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FutFormPage