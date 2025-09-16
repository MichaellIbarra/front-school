/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Input, Button, Select, Card, Row, Col, Modal } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import useAlert from "../../../hooks/useAlert";
import AlertModal from "../../../components/AlertModal";
import notificationService from "../../../services/grades/notificationService";
import { 
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  RecipientType,
  validateNotification,
  generateGradeNotificationMessage
} from "../../../types/grades/notification";

const { Option } = Select;
const { TextArea } = Input;

const NotificationFormModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  notificationData = null,
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');

  // Efectos
  useEffect(() => {
    if (visible) {
      if (notificationData && mode === 'edit') {
        setIsEdit(true);
        populateForm(notificationData);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, notificationData, mode]);

  /**
   * Resetea el formulario con valores por defecto
   */
  const resetForm = () => {
    const newNotification = notificationService.createNewNotification();
    form.setFieldsValue({
      recipientId: '',
      recipientType: undefined,
      message: '',
      notificationType: undefined,
      status: NotificationStatus.PENDING,
      channel: undefined,
    });
  };

  /**
   * Popula el formulario con los datos de la notificación
   */
  const populateForm = (notification) => {
    form.setFieldsValue({
      recipientId: notification.recipientId || '',
      recipientType: notification.recipientType,
      message: notification.message || '',
      notificationType: notification.notificationType,
      status: notification.status,
      channel: notification.channel,
    });
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Preparar datos para envío
      const notificationPayload = {
        recipientId: values.recipientId.trim(),
        recipientType: values.recipientType,
        message: values.message.trim(),
        notificationType: values.notificationType,
        status: values.status,
        channel: values.channel,
      };

      // Validar antes de enviar
      const validation = validateNotification(notificationPayload);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join('\n');
        showError('Errores de validación', errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit && notificationData?.id) {
        response = await notificationService.updateNotification(notificationData.id, notificationPayload);
      } else {
        response = await notificationService.createNotification(notificationPayload);
      }

      if (response.success) {
        showSuccess(response.message);
        form.resetFields();
        onSuccess && onSuccess(response.data);
        onCancel();
      } else {
        if (response.validationErrors) {
          const errorMessages = Object.values(response.validationErrors).join('\n');
          showError('Errores de validación', errorMessages);
        } else {
          showError('Error al guardar', response.error || 'Los datos deben ser válidos y únicos');
        }
      }
    } catch (error) {
      showError('Error al guardar la notificación');
    }
    
    setLoading(false);
  };

  /**
   * Maneja la cancelación del modal
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  /**
   * Genera mensaje automático basado en el tipo de notificación
   */
  const handleTypeChange = (type) => {
    let defaultMessage = '';
    
    switch (type) {
      case NotificationType.GRADE_PUBLISHED:
        defaultMessage = 'Su calificación ha sido publicada. Puede revisarla en el sistema.';
        break;
      case NotificationType.GRADE_UPDATED:
        defaultMessage = 'Su calificación ha sido actualizada. Por favor, revise los cambios.';
        break;
      case NotificationType.LOW_PERFORMANCE:
        defaultMessage = 'Se ha detectado bajo rendimiento académico. Le recomendamos buscar apoyo adicional.';
        break;
      case NotificationType.ACHIEVEMENT_RECOGNITION:
        defaultMessage = '¡Felicidades! Su excelente rendimiento académico ha sido reconocido.';
        break;
      case NotificationType.REMINDER:
        defaultMessage = 'Recordatorio: Tiene pendiente revisar sus calificaciones.';
        break;
      default:
        defaultMessage = '';
    }

    if (defaultMessage) {
      form.setFieldsValue({ message: defaultMessage });
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Notificación' : 'Nueva Notificación'}
      open={visible}
      onCancel={handleCancel}
      width={1000}
      footer={null}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Información del Destinatario */}
        <Card title="Información del Destinatario" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="recipientId"
                label="Nombre del Destinatario"
                rules={[
                  { required: true, message: 'El nombre del destinatario es obligatorio' },
                  { min: 3, message: 'El nombre debe tener al menos 3 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Ingrese el nombre completo del destinatario" 
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="recipientType"
                label="Tipo de Destinatario"
                rules={[{ required: true, message: 'El tipo de destinatario es obligatorio' }]}
              >
                <Select placeholder="Seleccione el tipo de destinatario">
                  {Object.entries(RecipientType).map(([key, value]) => (
                    <Option key={key} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="channel"
                label="Canal de Envío"
                rules={[{ required: true, message: 'El canal de envío es obligatorio' }]}
              >
                <Select placeholder="Seleccione el canal de envío">
                  {Object.entries(NotificationChannel).map(([key, value]) => (
                    <Option key={key} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Configuración de la Notificación */}
        <Card title="Configuración de la Notificación" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="notificationType"
                label="Tipo de Notificación"
                rules={[{ required: true, message: 'El tipo de notificación es obligatorio' }]}
              >
                <Select 
                  placeholder="Seleccione el tipo de notificación"
                  onChange={handleTypeChange}
                >
                  {Object.entries(NotificationType).map(([key, value]) => (
                    <Option key={key} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Estado"
                rules={[{ required: true, message: 'El estado es obligatorio' }]}
              >
                <Select placeholder="Seleccione el estado">
                  {Object.entries(NotificationStatus).map(([key, value]) => (
                    <Option key={key} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="message"
                label="Mensaje"
                rules={[
                  { required: true, message: 'El mensaje es obligatorio' },
                  { min: 10, message: 'El mensaje debe tener al menos 10 caracteres' },
                  { max: 1000, message: 'El mensaje no puede exceder 1000 caracteres' }
                ]}
              >
                <TextArea 
                  rows={6}
                  placeholder="Ingrese el contenido del mensaje"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Vista previa del mensaje */}
        <Card title="Vista Previa" className="mb-4">
          <div className="alert alert-light">
            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
              prevValues.message !== currentValues.message || 
              prevValues.notificationType !== currentValues.notificationType
            }>
              {({ getFieldValue }) => {
                const message = getFieldValue('message');
                const type = getFieldValue('notificationType');
                
                return (
                  <div>
                    <h6>Mensaje a enviar:</h6>
                    <div className="p-3 border rounded bg-white">
                      {message || 'Escriba un mensaje para ver la vista previa...'}
                    </div>
                    {type && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <strong>Tipo:</strong> {type}
                        </small>
                      </div>
                    )}
                  </div>
                );
              }}
            </Form.Item>
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
          >
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
          </Button>
        </div>
      </Form>

      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </Modal>
  );
};

NotificationFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  notificationData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

NotificationFormModal.defaultProps = {
  onSuccess: null,
  notificationData: null,
};

export default NotificationFormModal;
