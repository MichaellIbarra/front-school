import React, { useState } from 'react';
import PropTypes from 'prop-types';
import justificationsService from '../../../services/justifications/justificationsService';
import { 
  formatDate, 
  formatDateTime, 
  getStatusColor 
} from '../../../utils/justifications/justificationsHelpers';
import { 
  JustificationTypeLabels,
  JustificationStatusLabels,
  SubmittedByLabels
} from '../../../types/justifications';
import './Justifications.css';

export const JustificationDetailsModal = ({ justification, isOpen, onClose, onUpdate, userRole }) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Verificar permisos y estado antes del return
  const canReview = userRole === 'DIRECTOR' || userRole === 'ADMIN';
  const isPending = justification?.status === 'PENDING';

  if (!isOpen || !justification) return null;

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleReview = async (newStatus) => {
    if (isReviewing && !reviewComments.trim()) {
      showToast('❌ Por favor agrega un comentario', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await justificationsService.reviewJustification(
        justification.id,
        newStatus,
        reviewComments.trim()
      );

      if (result.success) {
        showToast(`✅ Justificación ${newStatus === 'APPROVED' ? 'aprobada' : 'rechazada'} exitosamente`, 'success');
        setTimeout(() => {
          if (onUpdate) onUpdate();
          onClose();
        }, 1500);
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Error al revisar la justificación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast de Notificación */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>📋 Detalles de Justificación</h2>
              <p className="modal-subtitle">
                Revisión de solicitud • ID: ...{justification.id.slice(-8)}
              </p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        
          <div className="modal-body">
            <div className="justification-form">
              {/* Estado */}
              <div className="form-group">
                <label>Estado Actual</label>
                <div>
                  <span 
                    className={`status-badge ${justification.status.toLowerCase()}`}
                    style={{ 
                      backgroundColor: getStatusColor(justification.status) + '20',
                      color: getStatusColor(justification.status),
                      fontSize: '13px',
                      padding: '6px 12px'
                    }}
                  >
                    {JustificationStatusLabels[justification.status] || justification.status}
                  </span>
                </div>
              </div>

              {/* Tipo y Razón */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Tipo de Justificación</label>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#262626'
                  }}>
                    {JustificationTypeLabels[justification.justificationType] || justification.justificationType}
                  </div>
                </div>

                <div className="form-group">
                  <label>Razón Detallada</label>
                  <div className="justification-reason-box">
                    {justification.justificationReason}
                  </div>
                </div>
              </div>

              {/* Información del solicitante */}
              <div className="form-group">
                <label style={{ marginBottom: '12px', display: 'block' }}>Información del Solicitante</label>
                <div className="justification-details-grid">
                  <div className="justification-info-card">
                    <div className="info-card-icon">👤</div>
                    <div className="info-card-label">Enviado por</div>
                    <div className="info-card-value">
                      {SubmittedByLabels[justification.submittedBy] || justification.submittedBy}
                    </div>
                  </div>

                  <div className="justification-info-card">
                    <div className="info-card-icon">📛</div>
                    <div className="info-card-label">Nombre</div>
                    <div className="info-card-value">{justification.submitterName}</div>
                  </div>

                  {justification.submitterContact && (
                    <div className="justification-info-card">
                      <div className="info-card-icon">📞</div>
                      <div className="info-card-label">Contacto</div>
                      <div className="info-card-value">{justification.submitterContact}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="form-group">
                <label style={{ marginBottom: '12px', display: 'block' }}>Fechas</label>
                <div className="justification-details-grid">
                  <div className="justification-info-card">
                    <div className="info-card-icon">📅</div>
                    <div className="info-card-label">Fecha de Envío</div>
                    <div className="info-card-value">{formatDate(justification.submissionDate)}</div>
                  </div>

                  <div className="justification-info-card">
                    <div className="info-card-icon">⏰</div>
                    <div className="info-card-label">Creado</div>
                    <div className="info-card-value">{formatDateTime(justification.createdAt)}</div>
                  </div>
                </div>
              </div>

            {/* Información de revisión (si está aprobada o rechazada) */}
            {(justification.status === 'APPROVED' || justification.status === 'REJECTED') && (
              <>
                <div style={{ 
                  height: '1px', 
                  background: 'linear-gradient(90deg, transparent, #e8e8e8, transparent)', 
                  margin: '24px 0' 
                }} />
                
                <div className="review-info-section">
                  <div className="section-title">
                    Información de Revisión
                  </div>
                  
                  <div className="justification-details-grid">
                    {justification.reviewedBy && (
                      <div className="justification-info-card">
                        <div className="info-card-icon">👤</div>
                        <div className="info-card-label">Revisado por</div>
                        <div className="info-card-value">{justification.reviewedBy}</div>
                      </div>
                    )}
                    {justification.reviewedAt && (
                      <div className="justification-info-card">
                        <div className="info-card-icon">📅</div>
                        <div className="info-card-label">Fecha de revisión</div>
                        <div className="info-card-value">{formatDateTime(justification.reviewedAt)}</div>
                      </div>
                    )}
                  </div>
                  
                  {justification.reviewComments && (
                    <div className="justification-reason-box">
                      <div className="info-card-label">Comentarios de revisión</div>
                      <div className="info-card-value">{justification.reviewComments}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sección de revisión (solo para directores/admin y justificaciones pendientes) */}
            {canReview && isPending && (
              <>
                <div style={{ 
                  height: '1px', 
                  background: 'linear-gradient(90deg, transparent, #e8e8e8, transparent)', 
                  margin: '24px 0' 
                }} />
                
                <div className="review-section">
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#262626',
                    marginBottom: '16px'
                  }}>
                    {isReviewing ? '✍️ Agregar Comentarios de Revisión' : '📝 Revisar Justificación'}
                  </h4>
                  
                  {isReviewing ? (
                    <div>
                      <div className="form-group">
                        <label>Comentarios <span style={{ color: '#8c8c8c', fontWeight: '400' }}>(opcional)</span></label>
                        <textarea
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Escribe comentarios sobre esta justificación..."
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            transition: 'border-color 0.3s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#40a9ff'}
                          onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginTop: '20px',
                        flexWrap: 'wrap'
                      }}>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            setIsReviewing(false);
                            setReviewComments('');
                          }}
                          disabled={isSubmitting}
                          style={{ flex: '1', minWidth: '120px' }}
                        >
                          ← Volver
                        </button>
                        <button 
                          className="btn-success btn-review"
                          onClick={() => handleReview('APPROVED')}
                          disabled={isSubmitting}
                          style={{ flex: '1', minWidth: '140px' }}
                        >
                          {isSubmitting ? '⏳ Procesando...' : '✓ Aprobar'}
                        </button>
                        <button 
                          className="btn-danger btn-review"
                          onClick={() => handleReview('REJECTED')}
                          disabled={isSubmitting}
                          style={{ flex: '1', minWidth: '140px' }}
                        >
                          {isSubmitting ? '⏳ Procesando...' : '✕ Rechazar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <button 
                        className="btn-success btn-review"
                        onClick={() => setIsReviewing(true)}
                        style={{ flex: '1', minWidth: '200px' }}
                      >
                        ✓ Aprobar Justificación
                      </button>
                      <button 
                        className="btn-danger btn-review"
                        onClick={() => setIsReviewing(true)}
                        style={{ flex: '1', minWidth: '200px' }}
                      >
                        ✕ Rechazar Justificación
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* IDs del sistema */}
            <div className="technical-info">
              <div className="info-label">🔍 Información Técnica</div>
              <div>ID Justificación: {justification.id}</div>
              <div>ID Registro Asistencia: {justification.attendanceRecordId}</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

JustificationDetailsModal.propTypes = {
  justification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    attendanceRecordId: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    justificationType: PropTypes.string.isRequired,
    justificationReason: PropTypes.string.isRequired,
    submittedBy: PropTypes.string.isRequired,
    submitterName: PropTypes.string.isRequired,
    submitterContact: PropTypes.string,
    submissionDate: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    reviewedBy: PropTypes.string,
    reviewedAt: PropTypes.string,
    reviewComments: PropTypes.string
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
  userRole: PropTypes.string
};

export default JustificationDetailsModal;
