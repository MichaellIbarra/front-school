import { FileText, User, Hash, Calendar, Phone, Mail, Tag, Edit, X, Info, Save, Check, AlertTriangle, File, Folder, MessageSquare, Upload, Trash2, CheckCircle, Eye, EyeOff } from "feather-icons-react"
import PropTypes from "prop-types"
import { useState, useEffect, useRef } from "react"

const FutFormProfessional = ({
  isEdit,
  formData,
  students,
  studentsLoading,
  loading,
  selectedStudent,
  onClose,
  onSubmit,
  onInputChange,
  onStudentSelect,
  onFileUpload,
  onRemoveFile,
  formatFileSize,
}) => {
  const [activeSection, setActiveSection] = useState("student-info")
  const [isDragging, setIsDragging] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const fileInputRef = useRef(null)

  // Sections configuration
  const sections = [
    { id: "student-info", title: "Estudiante", icon: <User size={18} />, color: "primary" },
    { id: "request-details", title: "Solicitud", icon: <FileText size={18} />, color: "success" },
    { id: "documents", title: "Documentos", icon: <File size={18} />, color: "info" },
    { id: "contact", title: "Contacto", icon: <Phone size={18} />, color: "warning" },
    { id: "guardian", title: "Apoderado", icon: <User size={18} />, color: "danger" },
    { id: "notes", title: "Notas", icon: <MessageSquare size={18} />, color: "secondary" },
  ]

  // Calculate form completion percentage
  useEffect(() => {
    const requiredFields = [
      'studentEnrollmentId',
      'requestType',
      'requestSubject',
      'requestDescription',
      'requestedBy',
      'contactPhone',
      'contactEmail',
      'urgencyLevel',
      'guardianFullName',
      'guardianPhone',
      'guardianDni',
      'guardianAddress',
      'guardianDistrict',
      'guardianProvince'
    ]
    
    const filledFields = requiredFields.filter(field => 
      formData[field] && formData[field].toString().trim() !== ''
    )
    
    const percentage = Math.round((filledFields.length / requiredFields.length) * 100)
    setCompletionPercentage(percentage)
  }, [formData])

  // Scroll to the section when active section changes
  useEffect(() => {
    const element = document.getElementById(`section-${activeSection}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeSection])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = {
        target: {
          files: e.dataTransfer.files
        }
      }
      onFileUpload(fakeEvent)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  // Get section completion status
  const getSectionStatus = (sectionId) => {
    switch (sectionId) {
      case "student-info":
        return formData.studentEnrollmentId ? "complete" : "pending"
      case "request-details":
        return formData.requestType && formData.requestSubject && formData.requestDescription ? "complete" : "pending"
      case "documents":
        return Object.keys(formData.attachedDocuments).length > 0 ? "complete" : "optional"
      case "contact":
        return formData.requestedBy && formData.contactPhone && formData.contactEmail ? "complete" : "pending"
      case "guardian":
        return formData.guardianFullName && formData.guardianPhone && formData.guardianDni ? "complete" : "pending"
      case "notes":
        return "optional"
      default:
        return "pending"
    }
  }

  return (
    <div className="row">
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .form-content-animated {
          animation: slideUp 0.4s ease-out;
        }

        .section-header {
          position: relative;
          padding-left: 20px;
          margin-bottom: 1.5rem;
        }

        .section-header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }

        .form-control:focus, .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .sidebar-nav-item {
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          cursor: pointer;
          position: relative;
        }

        .sidebar-nav-item:hover:not(.active) {
          background-color: rgba(102, 126, 234, 0.05);
          border-left-color: #667eea;
          transform: translateX(2px);
        }

        .sidebar-nav-item.active {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0.05) 100%);
          border-left-color: #667eea;
          font-weight: 600;
        }

        .sidebar-nav-item .status-indicator {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-complete {
          background-color: #28a745;
        }

        .status-pending {
          background-color: #ffc107;
        }

        .status-optional {
          background-color: #6c757d;
        }

        .info-card {
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
          animation: fadeIn 0.5s ease;
        }

        .info-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .icon-wrapper {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .upload-zone {
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px dashed #dee2e6;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        .upload-zone:hover {
          border-color: #667eea;
          background: linear-gradient(135deg, #f0f3ff 0%, #ffffff 100%);
          transform: scale(1.01);
        }

        .upload-zone.dragging {
          border-color: #667eea;
          background: linear-gradient(135deg, #e8edff 0%, #f0f3ff 100%);
          transform: scale(1.02);
        }

        .file-item {
          transition: all 0.3s ease;
          animation: fadeIn 0.3s ease;
        }

        .file-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateX(4px);
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          background: linear-gradient(135deg, #5568d3 0%, #64398b 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          color: white;
        }

        .btn-gradient:active {
          transform: translateY(0);
        }

        .badge-custom {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .input-group-text {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-color: #dee2e6;
        }

        .header-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .header-gradient-edit {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5568d3 0%, #64398b 100%);
        }

        .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .required-asterisk {
          color: #dc3545;
          margin-left: 4px;
        }

        .progress-bar-custom {
          height: 8px;
          border-radius: 4px;
          background-color: #e9ecef;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.4s ease;
        }

        .completion-badge {
          animation: pulse 2s infinite;
        }

        .student-info-item {
          transition: all 0.3s ease;
        }

        .student-info-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }

        .section-title {
          font-weight: 600;
          color: #212529;
        }

        .section-subtitle {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .form-section {
          padding: 2rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-card {
          border-radius: 12px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .form-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .field-hint {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .file-upload-icon {
          transition: all 0.3s ease;
        }

        .upload-zone:hover .file-upload-icon {
          transform: scale(1.1);
        }

        .document-preview {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .action-button {
          transition: all 0.2s ease;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button:active {
          transform: translateY(0);
        }

        .form-group-with-hint {
          margin-bottom: 1.5rem;
        }
      `}</style>
      
      <form onSubmit={onSubmit} className="d-flex flex-column h-100">
        <div className="col-12">
          {/* Progress bar */}
          <div className="mb-4 p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                {isEdit ? "Editar Solicitud FUT" : "Nueva Solicitud FUT"}
              </h5>
              <span className={`badge bg-primary completion-badge`}>
                {completionPercentage}% completado
              </span>
            </div>
            <div className="progress-bar-custom">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="row g-0 h-100">
            {/* Sidebar Navigation Mejorado */}
            <div className="col-md-3 col-lg-2" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)' }}>
              <div className="border-end h-100 py-4">
                <div className="px-3 mb-3">
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                    Secciones
                  </small>
                </div>
                <div className="list-group list-group-flush">
                  {sections.map((section) => {
                    const status = getSectionStatus(section.id)
                    return (
                      <button
                        key={section.id}
                        type="button"
                        className={`list-group-item list-group-item-action border-0 sidebar-nav-item py-3 ${
                          activeSection === section.id ? "active" : ""
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="d-flex align-items-center px-2">
                          <span className={`me-3 text-${section.color}`}>
                            {section.icon}
                          </span>
                          <span style={{ fontSize: '0.95rem' }}>{section.title}</span>
                          <span className={`status-indicator status-${status}`}></span>
                          {activeSection === section.id && (
                            <CheckCircle size={14} className="ms-auto text-success" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Form Content Mejorado */}
            <div className="col-md-9 col-lg-10">
              <div className="p-4 scrollbar-custom" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                
                {/* Información del Estudiante */}
                <div id="section-student-info" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3">
                        <User size={20} className="text-white" />
                      </div>
                      Información del Estudiante
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Seleccione el estudiante para quien se realiza la solicitud</p>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <div className="form-group mb-4">
                        <label className="form-label">
                          <User size={16} className="me-2" />
                          Estudiante
                          <span className="required-asterisk">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          name="studentEnrollmentId"
                          value={formData.studentEnrollmentId}
                          onChange={onStudentSelect}
                          required
                          disabled={studentsLoading}
                          style={{ borderRadius: '10px' }}
                        >
                          <option value="">{studentsLoading ? "Cargando estudiantes..." : "-- Seleccionar estudiante --"}</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} - {student.documentNumber}
                            </option>
                          ))}
                        </select>
                        {studentsLoading && (
                          <div className="mt-2">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                            <small className="text-muted">Cargando lista de estudiantes...</small>
                          </div>
                        )}
                      </div>

                      {/* Información del estudiante seleccionado */}
                      {selectedStudent && (
                        <div className="mt-4 p-4 info-card rounded-3 form-card">
                          <h6 className="text-primary mb-4 d-flex align-items-center fw-bold">
                            <Info size={18} className="me-2" />
                            Datos del Estudiante
                          </h6>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="d-flex align-items-start student-info-item p-3 rounded-3 bg-white border">
                                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3" style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User size={18} className="text-primary" />
                                </div>
                                <div>
                                  <small className="text-muted d-block mb-1">Nombre Completo</small>
                                  <strong className="text-dark">{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="d-flex align-items-start student-info-item p-3 rounded-3 bg-white border">
                                <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3" style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Hash size={18} className="text-success" />
                                </div>
                                <div>
                                  <small className="text-muted d-block mb-1">Documento</small>
                                  <strong className="text-dark">{selectedStudent.documentType} - {selectedStudent.documentNumber}</strong>
                                </div>
                              </div>
                            </div>
                            {selectedStudent.phone && (
                              <div className="col-md-6">
                                <div className="d-flex align-items-start student-info-item p-3 rounded-3 bg-white border">
                                  <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3" style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone size={18} className="text-info" />
                                  </div>
                                  <div>
                                    <small className="text-muted d-block mb-1">Teléfono</small>
                                    <strong className="text-dark">{selectedStudent.phone}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedStudent.email && (
                              <div className="col-md-6">
                                <div className="d-flex align-items-start student-info-item p-3 rounded-3 bg-white border">
                                  <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3" style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail size={18} className="text-warning" />
                                  </div>
                                  <div>
                                    <small className="text-muted d-block mb-1">Email</small>
                                    <strong className="text-dark">{selectedStudent.email}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedStudent.guardianName && (
                              <div className="col-md-6">
                                <div className="d-flex align-items-start student-info-item p-3 rounded-3 bg-white border">
                                  <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-3" style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} className="text-danger" />
                                  </div>
                                  <div>
                                    <small className="text-muted d-block mb-1">Apoderado</small>
                                    <strong className="text-dark">{selectedStudent.guardianName} {selectedStudent.guardianLastName}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalles de la Solicitud */}
                <div id="section-request-details" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}>
                        <FileText size={20} className="text-white" />
                      </div>
                      Detalles de la Solicitud
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Especifique el tipo y detalles de la solicitud</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Folder size={16} className="me-2" />
                          Tipo de Solicitud
                          <span className="required-asterisk">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          name="requestType"
                          value={formData.requestType}
                          onChange={onInputChange}
                          required
                          style={{ borderRadius: '10px' }}
                        >
                          <option value="">-- Seleccionar tipo --</option>
                          <option value="CERTIFICADO">🏆 Certificado</option>
                          <option value="CONSTANCIA">📄 Constancia</option>
                          <option value="TRASLADO">➡️ Traslado</option>
                          <option value="RECTIFICACION">✏️ Rectificación</option>
                          <option value="OTROS">📋 Otros</option>
                        </select>
                        <small className="field-hint">Seleccione el tipo de documento que necesita</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <AlertTriangle size={16} className="me-2" />
                          Nivel de Urgencia
                          <span className="required-asterisk">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          name="urgencyLevel"
                          value={formData.urgencyLevel}
                          onChange={onInputChange}
                          required
                          style={{ borderRadius: '10px' }}
                        >
                          <option value="BAJA">🟢 Baja</option>
                          <option value="MEDIA">🟡 Media</option>
                          <option value="ALTA">🔴 Alta</option>
                        </select>
                        <small className="field-hint">Indique qué tan urgente es su solicitud</small>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Tag size={16} className="me-2" />
                          Asunto de la Solicitud
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="requestSubject"
                          value={formData.requestSubject}
                          onChange={onInputChange}
                          placeholder="Ej: Solicitud de certificado de estudios 2024"
                          maxLength="150"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <div className="d-flex justify-content-between mt-2">
                          <small className="field-hint">
                            <Info size={14} className="me-1" />
                            Resuma el motivo de la solicitud
                          </small>
                          <small className={`${formData.requestSubject.length > 130 ? 'text-warning' : 'text-muted'}`}>
                            {formData.requestSubject.length}/150
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Edit size={16} className="me-2" />
                          Descripción Detallada
                          <span className="required-asterisk">*</span>
                        </label>
                        <textarea
                          className="form-control form-control-lg"
                          name="requestDescription"
                          value={formData.requestDescription}
                          onChange={onInputChange}
                          placeholder="Describa con detalle su solicitud, incluyendo información relevante..."
                          rows="5"
                          required
                          style={{ borderRadius: '10px' }}
                        ></textarea>
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Sea lo más específico posible para agilizar el proceso
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentos Adjuntos */}
                <div id="section-documents" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)' }}>
                        <File size={20} className="text-white" />
                      </div>
                      Documentos Adjuntos
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Adjunte los documentos necesarios para su solicitud</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-group mb-3">
                        <label className="form-label">
                          <Upload size={16} className="me-2" />
                          Cargar Archivos
                        </label>
                        <div 
                          className={`upload-zone rounded-3 p-4 text-center ${isDragging ? 'dragging' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={triggerFileInput}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="d-none"
                            multiple
                            onChange={onFileUpload}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          />
                          <div className="mb-3">
                            <div className="d-inline-block p-3 rounded-circle file-upload-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                              <Upload size={28} className="text-white" />
                            </div>
                          </div>
                          <h6 className="mb-2 fw-bold">Arrastra archivos aquí</h6>
                          <p className="text-muted mb-3 small">o haz clic para seleccionar</p>
                          <button 
                            type="button" 
                            className="btn btn-gradient px-4 action-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              triggerFileInput()
                            }}
                          >
                            <Upload size={16} className="me-2" />
                            Seleccionar Archivos
                          </button>
                          <p className="text-muted mt-3 mb-0">
                            <small>📎 PDF, DOC, DOCX, JPG, PNG, TXT • Máximo 10MB</small>
                          </p>
                        </div>
                      </div>

                      {/* Lista de archivos adjuntos */}
                      {Object.keys(formData.attachedDocuments).length > 0 && (
                        <div className="mt-4">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="text-dark mb-0 fw-bold">
                              <File size={16} className="me-2" />
                              Archivos Cargados
                            </h6>
                            <span className="badge bg-primary rounded-pill px-3 py-2">
                              {Object.keys(formData.attachedDocuments).length} archivo(s)
                            </span>
                          </div>
                          <div className="border rounded-3 p-3 form-card">
                            {Object.entries(formData.attachedDocuments).map(([fileId, fileData]) => (
                              <div
                                key={fileId}
                                className="file-item d-flex justify-content-between align-items-center mb-2 p-3 bg-white rounded-3 border"
                              >
                                <div className="d-flex align-items-center flex-grow-1">
                                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                                    <File size={18} className="text-primary" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="fw-medium text-dark">{fileData.name}</div>
                                    <small className="text-muted">
                                      {formatFileSize(fileData.size)} • {fileData.type}
                                    </small>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger rounded-circle action-button"
                                  onClick={() => onRemoveFile(fileId)}
                                  title="Eliminar archivo"
                                  style={{ width: '32px', height: '32px', padding: '0' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div id="section-contact" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' }}>
                        <Phone size={20} className="text-white" />
                      </div>
                      Información de Contacto
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Datos para notificaciones y seguimiento</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <User size={16} className="me-2" />
                          Solicitante
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="requestedBy"
                          value={formData.requestedBy}
                          onChange={onInputChange}
                          placeholder="Nombre completo del solicitante"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Se completa automáticamente con los datos del estudiante
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Phone size={16} className="me-2" />
                          Teléfono
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={onInputChange}
                          placeholder="999 999 999"
                          pattern="[0-9]{9,12}"
                          minLength="9"
                          maxLength="12"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Se completa automáticamente con los datos del estudiante
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Mail size={16} className="me-2" />
                          Correo Electrónico
                          <span className="required-asterisk">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "email"}
                            className="form-control form-control-lg"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={onInputChange}
                            placeholder="correo@ejemplo.com"
                            required
                            style={{ borderRadius: '10px 0 0 10px' }}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ borderRadius: '0 10px 10px 0' }}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Se completa automáticamente con los datos del estudiante
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Calendar size={16} className="me-2" />
                          Fecha Estimada de Entrega
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-lg"
                          name="estimatedDeliveryDate"
                          value={formData.estimatedDeliveryDate}
                          onChange={onInputChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Fecha estimada para la entrega del documento
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Apoderado */}
                <div id="section-guardian" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
                        <User size={20} className="text-white" />
                      </div>
                      Información del Apoderado
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Datos del apoderado o tutor legal</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <User size={16} className="me-2" />
                          Nombres y Apellidos
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="guardianFullName"
                          value={formData.guardianFullName}
                          onChange={onInputChange}
                          placeholder="Nombres y apellidos completos"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Nombre completo del padre, madre o apoderado legal
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Phone size={16} className="me-2" />
                          Teléfono
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          name="guardianPhone"
                          value={formData.guardianPhone}
                          onChange={onInputChange}
                          placeholder="999 999 999"
                          pattern="[0-9]{9,12}"
                          minLength="9"
                          maxLength="12"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Número de contacto del apoderado
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Hash size={16} className="me-2" />
                          DNI
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="guardianDni"
                          value={formData.guardianDni}
                          onChange={onInputChange}
                          placeholder="12345678"
                          maxLength="8"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Documento de identidad del apoderado
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Tag size={16} className="me-2" />
                          Domicilio
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="guardianAddress"
                          value={formData.guardianAddress}
                          onChange={onInputChange}
                          placeholder="Dirección completa"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Dirección de residencia del apoderado
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Tag size={16} className="me-2" />
                          Distrito
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="guardianDistrict"
                          value={formData.guardianDistrict}
                          onChange={onInputChange}
                          placeholder="Distrito"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Distrito de residencia del apoderado
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <Tag size={16} className="me-2" />
                          Provincia
                          <span className="required-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="guardianProvince"
                          value={formData.guardianProvince}
                          onChange={onInputChange}
                          placeholder="Provincia"
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Provincia de residencia del apoderado
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas Administrativas */}
                <div id="section-notes" className="form-section">
                  <div className="section-header mb-4">
                    <h5 className="text-dark fw-bold mb-2 d-flex align-items-center">
                      <div className="icon-wrapper me-3" style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
                        <MessageSquare size={20} className="text-white" />
                      </div>
                      Notas Administrativas
                    </h5>
                    <p className="text-muted small mb-0 ms-5 ps-2">Observaciones internas para el personal administrativo</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="form-group-with-hint">
                        <label className="form-label">
                          <MessageSquare size={16} className="me-2" />
                          Notas Internas
                        </label>
                        <textarea
                          className="form-control form-control-lg"
                          name="adminNotes"
                          value={formData.adminNotes}
                          onChange={onInputChange}
                          placeholder="Agregue aquí cualquier observación interna que considere relevante..."
                          rows="4"
                          style={{ borderRadius: '10px' }}
                        ></textarea>
                        <small className="field-hint mt-1 d-block">
                          <Info size={14} className="me-1" />
                          Este campo es opcional y solo visible para el personal administrativo
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer mejorado */}
        <div className="mt-4 d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary px-4 py-2"
            onClick={onClose}
            disabled={loading}
            style={{ borderRadius: '10px' }}
          >
            <X size={16} className="me-2" />
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-gradient px-4 py-2 action-button" 
            disabled={loading}
            style={{ borderRadius: '10px' }}
          >
            {loading ? (
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
    </div>
  )
}

FutFormProfessional.propTypes = {
  isEdit: PropTypes.bool.isRequired,
  formData: PropTypes.shape({
    studentEnrollmentId: PropTypes.string,
    requestNumber: PropTypes.string,
    requestType: PropTypes.string,
    requestSubject: PropTypes.string,
    requestDescription: PropTypes.string,
    requestedBy: PropTypes.string,
    contactPhone: PropTypes.string,
    contactEmail: PropTypes.string,
    urgencyLevel: PropTypes.string,
    estimatedDeliveryDate: PropTypes.string,
    attachedDocuments: PropTypes.object,
    adminNotes: PropTypes.string,
    status: PropTypes.string,
    guardianFullName: PropTypes.string,
    guardianPhone: PropTypes.string,
    guardianDni: PropTypes.string,
    guardianAddress: PropTypes.string,
    guardianDistrict: PropTypes.string,
    guardianProvince: PropTypes.string
  }).isRequired,
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    documentNumber: PropTypes.string
  })).isRequired,
  studentsLoading: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  selectedStudent: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    documentType: PropTypes.string,
    documentNumber: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    guardianName: PropTypes.string,
    guardianLastName: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onStudentSelect: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired
}

export default FutFormProfessional