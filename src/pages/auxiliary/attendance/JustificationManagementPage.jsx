/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import FeatherIcon from "feather-icons-react/build/FeatherIcon";
import Select from 'react-select';
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import attendanceService from "../../../services/attendance/attendanceService";
import { 
  JUSTIFICATION_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  JustificationType 
} from "../../../types/attendance";
import { pdficon, pdficon2, pdficon3, pdficon4, plusicon, refreshicon, searchnormal } from "../../../components/imagepath";

const JustificationManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  
  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'approve' o 'reject'
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    attendanceId: '',
    justificationType: 'MEDICAL',
    justificationReason: '',
    submittedBy: '',
    approvalComments: ''
  });
  
  // Obtener datos del estado de navegación si viene de AttendanceListPage
  useEffect(() => {
    if (location.state?.createMode && location.state?.student) {
      setFormData(prev => ({
        ...prev,
        attendanceId: location.state.student.studentEnrollmentId || '',
        submittedBy: 'Sistema' // o el usuario actual
      }));
      setShowCreateModal(true);
    }
  }, [location.state]);

  // Cargar justificaciones al montar el componente y cuando cambie el tab activo
  useEffect(() => {
    loadJustifications(activeTab);
  }, [activeTab]);

  /**
   * Carga justificaciones según el tipo seleccionado
   */
  const loadJustifications = async (type = 'all') => {
    setLoading(true);
    try {
      let response;
      
      switch (type) {
        case 'pending':
          response = await attendanceService.getPendingJustifications();
          break;
        case 'inactive':
          response = await attendanceService.getInactiveJustifications();
          break;
        default:
          response = await attendanceService.getAllJustifications();
      }
      
      if (response.success) {
        setJustifications(response.data);
        if (response.data.length === 0) {
          const tabName = type === 'all' ? 'justificaciones' : 
                         type === 'pending' ? 'justificaciones pendientes' : 
                         'justificaciones eliminadas';
          showAlert({
            title: 'Sin resultados',
            message: `No se encontraron ${tabName}`,
            type: 'info',
            showCancel: false,
            confirmText: 'Entendido'
          });
        }
      } else {
        showError(response.error);
        setJustifications([]);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al cargar justificaciones');
      setJustifications([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio de tab
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  /**
   * Abre modal para editar justificación
   */
  const handleEdit = (justification) => {
    setSelectedJustification(justification);
    setFormData({
      attendanceId: justification.attendanceId,
      justificationType: justification.justificationType,
      justificationReason: justification.justificationReason,
      submittedBy: justification.submittedBy,
      approvalComments: justification.approvalComments || ''
    });
    setShowEditModal(true);
  };

  /**
   * Abre modal para aprobar/rechazar justificación
   */
  const handleApproval = (justification, action) => {
    setSelectedJustification(justification);
    setModalAction(action);
    setFormData({
      ...formData,
      approvalComments: ''
    });
    setShowApprovalModal(true);
  };

  /**
   * Procesa la aprobación o rechazo de justificación
   */
  const processApproval = async () => {
    if (!selectedJustification) return;
    
    try {
      const approvalData = {
        approvedBy: 'Usuario Actual', // Aquí debería ir el usuario actual
        approvalComments: formData.approvalComments
      };

      let response;
      if (modalAction === 'approve') {
        response = await attendanceService.approveJustification(selectedJustification.id, approvalData);
      } else {
        response = await attendanceService.rejectJustification(selectedJustification.id, approvalData);
      }

      if (response.success) {
        showSuccess(`Justificación ${modalAction === 'approve' ? 'aprobada' : 'rechazada'} correctamente`);
        setShowApprovalModal(false);
        loadJustifications(activeTab);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError(`Error al ${modalAction === 'approve' ? 'aprobar' : 'rechazar'} la justificación`);
    }
  };

  /**
   * Guarda una justificación (crear o editar)
   */
  const saveJustification = async () => {
    try {
      let response;
      
      if (selectedJustification) {
        // Editar justificación existente
        response = await attendanceService.updateJustification(selectedJustification.id, formData);
      } else {
        // Crear nueva justificación
        response = await attendanceService.createJustification({
          ...formData,
          submissionDate: new Date().toISOString()
        });
      }

      if (response.success) {
        showSuccess(selectedJustification ? 'Justificación actualizada correctamente' : 'Justificación creada correctamente');
        setShowEditModal(false);
        setShowCreateModal(false);
        setSelectedJustification(null);
        loadJustifications(activeTab);
      } else {
        if (response.validationErrors) {
          const errors = Object.values(response.validationErrors).join(', ');
          showError(`Errores de validación: ${errors}`);
        } else {
          showError(response.error);
        }
      }
    } catch (error) {
      showError('Error al guardar la justificación');
    }
  };

  /**
   * Elimina una justificación
   */
  const deleteJustification = async (justification) => {
    showAlert({
      title: '¿Eliminar justificación?',
      message: `Se eliminará la justificación para "${justification.attendanceId}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await attendanceService.deleteJustification(justification.id);
          if (response.success) {
            showSuccess('Justificación eliminada correctamente');
            loadJustifications(activeTab);
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar la justificación');
        }
      },
    });
  };

  /**
   * Restaura una justificación eliminada
   */
  const restoreJustification = async (justification) => {
    showAlert({
      title: '¿Restaurar justificación?',
      message: `Se restaurará la justificación para "${justification.attendanceId}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await attendanceService.restoreJustification(justification.id);
          if (response.success) {
            showSuccess('Justificación restaurada correctamente');
            loadJustifications(activeTab);
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar la justificación');
        }
      },
    });
  };

  /**
   * Obtiene el badge de estado
   */
  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'badge badge-warning',
      APPROVED: 'badge badge-success',
      REJECTED: 'badge badge-danger',
    };
    
    return (
      <span className={statusClasses[status] || 'badge badge-secondary'}>
        {APPROVAL_STATUS_LABELS[status] || status}
      </span>
    );
  };

  /**
   * Filtrar justificaciones por texto de búsqueda
   */
  const filteredJustifications = justifications.filter(justification => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      justification.attendanceId?.toLowerCase().includes(search) ||
      justification.justificationReason?.toLowerCase().includes(search) ||
      justification.submittedBy?.toLowerCase().includes(search) ||
      JUSTIFICATION_TYPE_LABELS[justification.justificationType]?.toLowerCase().includes(search)
    );
  });

  // Opciones para el select de tipo de justificación
  const justificationTypeOptions = Object.entries(JUSTIFICATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <>
      <div className="main-wrapper">
        <Header />
        <Sidebar id='menu-item-justifications' id1='menu-items-justifications' activeClassName='justification-management'/>
        <div className="page-wrapper">
          <div className="content container-fluid">
            
            {/* Page Header */}
            <div className="page-header">
              <div className="row">
                <div className="col-sm-12">
                  <div className="page-sub-header">
                    <h3 className="page-title">📋 Gestión de Justificaciones</h3>
                    <ul className="breadcrumb">
                      <li className="breadcrumb-item">
                        <Link to="/dashboard">Dashboard</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <i className="feather-chevron-right">
                          <FeatherIcon icon="chevron-right" />
                        </i>
                      </li>
                      <li className="breadcrumb-item active">Justificaciones</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* /Page Header */}

            <div className="row">
              <div className="col-sm-12">
                <div className="card card-table show-entire">
                  <div className="card-body">
                    
                    {/* Table Header */}
                    <div className="page-table-header mb-2">
                      <div className="row align-items-center">
                        <div className="col">
                          <div className="doctor-table-blk">
                            <h3>Gestión de Justificaciones</h3>
                            <div className="doctor-search-blk">
                              <div className="top-nav-search table-search-blk">
                                <form onSubmit={(e) => e.preventDefault()}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por ID, motivo, enviado por..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                  />
                                  <Link className="btn" onClick={(e) => e.preventDefault()}>
                                    <img src={searchnormal} alt="Search" />
                                  </Link>
                                </form>
                              </div>
                              <div className="add-group">
                                <Link
                                  to="#"
                                  className="btn btn-primary add-pluss ms-2"
                                  onClick={() => setShowCreateModal(true)}
                                  title="Nueva Justificación"
                                >
                                  <img src={plusicon} alt="Add" />
                                </Link>
                                <Link
                                  to="#"
                                  className="btn btn-primary doctor-refresh ms-2"
                                  onClick={() => loadJustifications(activeTab)}
                                  title="Actualizar datos"
                                >
                                  <img src={refreshicon} alt="Refresh" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-auto text-end float-end ms-auto download-grp">
                          <Link to="/auxiliary/attendance" className="btn btn-outline-primary me-2">
                            🔍 Buscar Estudiantes
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* /Table Header */}

                    {/* Tabs */}
                    <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded">
                      <li className="nav-item">
                        <Link 
                          className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                          to="#"
                          onClick={(e) => { e.preventDefault(); handleTabChange('all'); }}
                        >
                          📋 Todas las Justificaciones
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                          to="#"
                          onClick={(e) => { e.preventDefault(); handleTabChange('pending'); }}
                        >
                          ⏳ Pendientes
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                          to="#"
                          onClick={(e) => { e.preventDefault(); handleTabChange('inactive'); }}
                        >
                          🗑️ Eliminadas
                        </Link>
                      </li>
                    </ul>

                    {/* Contenido de tabs */}
                    <div className="tab-content">
                      <div className="table-responsive">
                        <table className="table border-0 star-student table-hover table-center mb-0 datatable table-striped">
                          <thead className="student-thread">
                            <tr>
                              <th>ID Asistencia</th>
                              <th>Tipo</th>
                              <th>Motivo</th>
                              <th>Fecha Envío</th>
                              <th>Estado</th>
                              <th>Enviado por</th>
                              <th className="text-end">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredJustifications.length > 0 ? (
                              filteredJustifications.map((justification, index) => (
                                <tr key={justification.id || index}>
                                  <td>
                                    <h2 className="table-avatar">
                                      <span className="student-avatar-text">
                                        {justification.attendanceId?.charAt(0)?.toUpperCase() || 'J'}
                                      </span>
                                      <span className="ml-2">{justification.attendanceId || 'N/A'}</span>
                                    </h2>
                                  </td>
                                  <td>
                                    <span className="badge badge-info">
                                      {JUSTIFICATION_TYPE_LABELS[justification.justificationType] || justification.justificationType}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="text-truncate" style={{maxWidth: '200px', display: 'inline-block'}}>
                                      {justification.justificationReason || 'Sin motivo'}
                                    </span>
                                  </td>
                                  <td>
                                    {justification.submissionDate ? 
                                      new Date(justification.submissionDate).toLocaleDateString('es-ES') : 
                                      'N/A'
                                    }
                                  </td>
                                  <td>{getStatusBadge(justification.approvalStatus)}</td>
                                  <td>{justification.submittedBy || 'N/A'}</td>
                                  <td className="text-end">
                                    <div className="actions">
                                      {/* Acciones según el estado y tab activo */}
                                      {activeTab === 'inactive' ? (
                                        <button
                                          className="btn btn-sm bg-success-light me-2"
                                          onClick={() => restoreJustification(justification)}
                                          title="Restaurar justificación"
                                        >
                                          <i className="feather-refresh-cw">
                                            <FeatherIcon icon="refresh-cw" />
                                          </i>
                                        </button>
                                      ) : (
                                        <>
                                          {justification.approvalStatus === 'PENDING' && (
                                            <>
                                              <button
                                                className="btn btn-sm bg-success-light me-2"
                                                onClick={() => handleApproval(justification, 'approve')}
                                                title="Aprobar justificación"
                                              >
                                                <i className="feather-check">
                                                  <FeatherIcon icon="check" />
                                                </i>
                                              </button>
                                              <button
                                                className="btn btn-sm bg-danger-light me-2"
                                                onClick={() => handleApproval(justification, 'reject')}
                                                title="Rechazar justificación"
                                              >
                                                <i className="feather-x">
                                                  <FeatherIcon icon="x" />
                                                </i>
                                              </button>
                                            </>
                                          )}
                                          <button
                                            className="btn btn-sm bg-primary-light me-2"
                                            onClick={() => handleEdit(justification)}
                                            title="Editar justificación"
                                          >
                                            <i className="feather-edit">
                                              <FeatherIcon icon="edit" />
                                            </i>
                                          </button>
                                          <button
                                            className="btn btn-sm bg-danger-light"
                                            onClick={() => deleteJustification(justification)}
                                            title="Eliminar justificación"
                                          >
                                            <i className="feather-trash-2">
                                              <FeatherIcon icon="trash-2" />
                                            </i>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="text-center py-4">
                                  {loading ? (
                                    <div>
                                      <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Cargando...</span>
                                      </div>
                                      <p className="mt-2 text-muted">Cargando justificaciones...</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <i className="feather-file-text mb-2" style={{fontSize: '48px', color: '#ccc'}}>
                                        <FeatherIcon icon="file-text" size={48} />
                                      </i>
                                      <p className="text-muted">
                                        No se encontraron justificaciones
                                      </p>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Información adicional */}
                      {filteredJustifications.length > 0 && (
                        <div className="row mt-3">
                          <div className="col-sm-12">
                            <div className="float-end">
                              <p className="text-muted">
                                Mostrando {filteredJustifications.length} de {justifications.length} justificación(es)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALES */}
      
      {/* Modal Crear/Editar Justificación */}
      {(showCreateModal || showEditModal) && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {selectedJustification ? '✏️ Editar Justificación' : '📝 Nueva Justificación'}
                </h4>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedJustification(null);
                  }}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>ID de Asistencia <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.attendanceId}
                          onChange={(e) => setFormData({...formData, attendanceId: e.target.value})}
                          placeholder="ID de asistencia"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Tipo de Justificación <span className="text-danger">*</span></label>
                        <Select
                          value={justificationTypeOptions.find(option => option.value === formData.justificationType)}
                          onChange={(selectedOption) => setFormData({...formData, justificationType: selectedOption.value})}
                          options={justificationTypeOptions}
                          menuPortalTarget={document.body}
                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          components={{
                            IndicatorSeparator: () => null
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Motivo de la Justificación <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.justificationReason}
                          onChange={(e) => setFormData({...formData, justificationReason: e.target.value})}
                          placeholder="Explique el motivo de la justificación..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Enviado por <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.submittedBy}
                          onChange={(e) => setFormData({...formData, submittedBy: e.target.value})}
                          placeholder="Nombre de quien envía la justificación"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedJustification(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={saveJustification}
                >
                  {selectedJustification ? 'Actualizar' : 'Crear'} Justificación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aprobar/Rechazar */}
      {showApprovalModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {modalAction === 'approve' ? '✅ Aprobar Justificación' : '❌ Rechazar Justificación'}
                </h4>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowApprovalModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  ¿Estás seguro de que deseas {modalAction === 'approve' ? 'aprobar' : 'rechazar'} esta justificación?
                </p>
                {selectedJustification && (
                  <div className="alert alert-info">
                    <strong>ID:</strong> {selectedJustification.attendanceId}<br/>
                    <strong>Tipo:</strong> {JUSTIFICATION_TYPE_LABELS[selectedJustification.justificationType]}<br/>
                    <strong>Motivo:</strong> {selectedJustification.justificationReason}
                  </div>
                )}
                <div className="form-group">
                  <label>Comentarios {modalAction === 'reject' ? '(Requerido para rechazo)' : '(Opcional)'}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.approvalComments}
                    onChange={(e) => setFormData({...formData, approvalComments: e.target.value})}
                    placeholder={modalAction === 'approve' ? 'Comentarios adicionales...' : 'Explique el motivo del rechazo...'}
                    required={modalAction === 'reject'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={`btn ${modalAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  onClick={processApproval}
                >
                  {modalAction === 'approve' ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AlertModal para confirmaciones y alertas */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default JustificationManagementPage;