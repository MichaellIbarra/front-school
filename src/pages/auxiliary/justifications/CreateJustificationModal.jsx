import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { validateJustificationForm } from '../../../utils/justifications/justificationsHelpers';
import { useJustifications } from '../../../hooks/useJustifications';
import { 
  JustificationTypeLabels, 
  SubmittedByLabels 
} from '../../../types/justifications';
import './Justifications.css';

export const CreateJustificationModal = ({ attendance, isOpen, onClose, onSuccess }) => {
  const { createJustification } = useJustifications();
  
  const [formData, setFormData] = useState({
    justificationType: '',
    justificationReason: '',
    submittedBy: 'STUDENT',
    submitterName: '',
    submitterContact: '',
    submissionDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [currentStep, setCurrentStep] = useState(1);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        justificationType: '',
        justificationReason: '',
        submittedBy: 'STUDENT',
        submitterName: '',
        submitterContact: '',
        submissionDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const validation = validateJustificationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('❌ Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createJustification({
        ...formData,
        attendanceRecordId: attendance.id,
      });

      if (result.success) {
        showToast('✅ Justificación enviada exitosamente', 'success');
        
        // Llamar callback de éxito si existe
        if (onSuccess) {
          onSuccess();
        }
        
        // Cerrar modal después de 1.5 segundos
        setTimeout(() => onClose(), 1500);
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Error al enviar la justificación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validar paso actual antes de avanzar
    if (currentStep === 1) {
      if (!formData.justificationType) {
        setErrors({ justificationType: 'Selecciona un tipo de justificación' });
        return;
      }
      if (!formData.justificationReason || formData.justificationReason.length < 10) {
        setErrors({ justificationReason: 'La razón debe tener al menos 10 caracteres' });
        return;
      }
    }
    setErrors({});
    setCurrentStep(2);
  };

  const prevStep = () => {
    setErrors({});
    setCurrentStep(1);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast de Notificación */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>📝 Justificar Ausencia</h2>
              <p className="modal-subtitle">
                Estudiante: <strong>{attendance.studentName || 'Sin nombre'}</strong> • 
                Fecha: <strong>{attendance.attendanceDate}</strong>
              </p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          {/* Progress Steps */}
          <div className="modal-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
              <div className="step-label">Motivo</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Datos de Contacto</div>
            </div>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit} className="justification-form">
              
              {/* PASO 1: Motivo de la justificación */}
              {currentStep === 1 && (
                <div className="form-step">
                  <h3 className="step-title">¿Por qué faltó el estudiante?</h3>
                  
                  {/* Tipo de Justificación - Grid de tarjetas */}
                  <div className="form-group">
                    <label>Selecciona el motivo de la ausencia *</label>
                    <div className="justification-types-grid">
                      {Object.entries(JustificationTypeLabels).map(([key, label]) => {
                        const icons = {
                          MEDICAL: '🏥',
                          FAMILY_EMERGENCY: '👨‍👩‍👧‍👦',
                          PERSONAL_EMERGENCY: '🚨',
                          OFFICIAL_PROCEDURES: '📄',
                          NATURAL_DISASTER: '🌪️',
                          TRANSPORTATION_ISSUES: '🚗',
                          OTHER: '📝'
                        };
                        
                        return (
                          <div
                            key={key}
                            className={`justification-type-card ${formData.justificationType === key ? 'selected' : ''}`}
                            onClick={() => {
                              handleChange({ target: { name: 'justificationType', value: key } });
                            }}
                          >
                            <div className="card-icon">{icons[key]}</div>
                            <div className="card-label">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {errors.justificationType && (
                      <span className="error-message">{errors.justificationType}</span>
                    )}
                  </div>

                  {/* Razón Detallada */}
                  <div className="form-group">
                    <label htmlFor="justificationReason">
                      Describe detalladamente el motivo *
                      <span className="label-hint">(mínimo 10 caracteres)</span>
                    </label>
                    <textarea
                      id="justificationReason"
                      name="justificationReason"
                      value={formData.justificationReason}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Ejemplo: El estudiante presentó fiebre alta y malestar general, por lo que tuvo que quedarse en casa para recuperarse..."
                      className={errors.justificationReason ? 'error' : ''}
                    />
                    <div className="char-counter">
                      {formData.justificationReason.length} caracteres
                    </div>
                    {errors.justificationReason && (
                      <span className="error-message">{errors.justificationReason}</span>
                    )}
                  </div>

                  {/* Botones Paso 1 */}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={nextStep}>
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: Datos de contacto */}
              {currentStep === 2 && (
                <div className="form-step">
                  <h3 className="step-title">Datos de quien envía la justificación</h3>
                  
                  {/* Enviado por */}
                  <div className="form-group">
                    <label htmlFor="submittedBy">¿Quién envía esta justificación? *</label>
                    <div className="radio-group">
                      {Object.entries(SubmittedByLabels).map(([key, label]) => {
                        const icons = {
                          STUDENT: '👨‍🎓',
                          PARENT: '👨‍👩‍👧',
                          GUARDIAN: '🤝',
                          OTHER: '👤'
                        };
                        
                        return (
                          <label key={key} className="radio-card">
                            <input
                              type="radio"
                              name="submittedBy"
                              value={key}
                              checked={formData.submittedBy === key}
                              onChange={handleChange}
                            />
                            <span className="radio-content">
                              <span className="radio-icon">{icons[key]}</span>
                              <span className="radio-label">{label}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.submittedBy && (
                      <span className="error-message">{errors.submittedBy}</span>
                    )}
                  </div>

                  {/* Nombre */}
                  <div className="form-group">
                    <label htmlFor="submitterName">Nombre completo *</label>
                    <input
                      type="text"
                      id="submitterName"
                      name="submitterName"
                      value={formData.submitterName}
                      onChange={handleChange}
                      placeholder="Ej: Juan Carlos Pérez García"
                      className={errors.submitterName ? 'error' : ''}
                    />
                    {errors.submitterName && (
                      <span className="error-message">{errors.submitterName}</span>
                    )}
                  </div>

                  {/* Contacto */}
                  <div className="form-group">
                    <label htmlFor="submitterContact">
                      Teléfono o Email
                      <span className="label-hint">(opcional, pero recomendado)</span>
                    </label>
                    <input
                      type="text"
                      id="submitterContact"
                      name="submitterContact"
                      value={formData.submitterContact}
                      onChange={handleChange}
                      placeholder="987654321 o correo@ejemplo.com"
                      className={errors.submitterContact ? 'error' : ''}
                    />
                    {errors.submitterContact && (
                      <span className="error-message">{errors.submitterContact}</span>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="form-group">
                    <label htmlFor="submissionDate">Fecha de envío *</label>
                    <input
                      type="date"
                      id="submissionDate"
                      name="submissionDate"
                      value={formData.submissionDate}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={errors.submissionDate ? 'error' : ''}
                    />
                    {errors.submissionDate && (
                      <span className="error-message">{errors.submissionDate}</span>
                    )}
                  </div>

                  {/* Resumen */}
                  <div className="justification-summary">
                    <h4>📋 Resumen de la justificación</h4>
                    <div className="summary-item">
                      <strong>Motivo:</strong> {JustificationTypeLabels[formData.justificationType]}
                    </div>
                    <div className="summary-item">
                      <strong>Descripción:</strong> {formData.justificationReason.substring(0, 100)}{formData.justificationReason.length > 100 ? '...' : ''}
                    </div>
                  </div>

                  {/* Botones Paso 2 */}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={prevStep}>
                      ← Atrás
                    </button>
                    <button type="submit" className="btn-primary btn-large" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          ✓ Enviar Justificación
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

CreateJustificationModal.propTypes = {
  attendance: PropTypes.shape({
    id: PropTypes.string.isRequired,
    attendanceDate: PropTypes.string.isRequired,
    studentName: PropTypes.string
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default CreateJustificationModal;
