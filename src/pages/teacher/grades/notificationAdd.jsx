/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Form, Input, Button, Select, Card, Row, Col } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
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

const NotificationAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [notificationData, setNotificationData] = useState(Notification);

  // Verificar si es modo edición
  useEffect(() => {
    if (id && id !== 'add') {
      setIsEdit(true);
      loadNotification(id);
    } else if (location.state?.notification) {
      setIsEdit(true);
      const notification = location.state.notification;
      setNotificationData(notification);
      populateForm(notification);
    } else {
      // Modo creación
      setIsEdit(false);
      const newNotification = notificationService.createNewNotification();
      setNotificationData(newNotification);
      populateForm(newNotification);
    }
  }, [id, location.state]);

  /**
   * Carga una notificación específica para edición
   */
  const loadNotification = async (notificationId) => {
    setLoading(true);
    try {
      const response = await notificationService.getNotificationById(notificationId);
      if (response.success && response.data) {
        setNotificationData(response.data);
        populateForm(response.data);
      } else {
        showError('Notificación no encontrada');
        navigate('/teacher/notifications');
      }
    } catch (error) {
      showError('Error al cargar la notificación');
      navigate('/teacher/notifications');
    }
    setLoading(false);
  };

  /**
   * Popula el formulario con los datos de la notificación
   */
  const populateForm = (notification) => {
    form.setFieldsValue({
      recipientId: notification.recipientId,
      recipientType: notification.recipientType,
      message: notification.message,
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
        showError('Errores de validación:\n' + errorMessages);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit) {
        response = await notificationService.updateNotification(notificationData.id, notificationPayload);
      } else {
        response = await notificationService.createNotification(notificationPayload);
      }

      if (response.success) {
        showSuccess(response.message);
        navigate('/teacher/notifications');
      } else {
        if (response.validationErrors) {
          const errorMessages = Object.values(response.validationErrors).join('\n');
          showError('Errores de validación:\n' + errorMessages);
        } else {
          showError(response.error || 'Error al guardar la notificación');
        }
      }
    } catch (error) {
      showError('Error al guardar la notificación');
    }
    
    setLoading(false);
  };

  /**
   * Cancela la operación y regresa al listado
   */
  const handleCancel = () => {
    navigate('/teacher/notifications');
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
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">
                    {isEdit ? 'Editar Notificación' : 'Nueva Notificación'}
                  </h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/teacher/notifications">Notificaciones</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      {isEdit ? 'Editar' : 'Agregar'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    className="row"
                  >
                    {/* Información del Destinatario */}
                    <Card title="Información del Destinatario" className="col-12 mb-4">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={8}>
                          <Form.Item
                            name="recipientId"
                            label="ID del Destinatario"
                            rules={[
                              { required: true, message: 'El ID del destinatario es obligatorio' },
                              { min: 3, message: 'El ID debe tener al menos 3 caracteres' }
                            ]}
                          >
                            <Input 
                              placeholder="Ingrese el ID del destinatario" 
                              maxLength={50}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
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

                        <Col xs={24} sm={12} lg={8}>
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
                    <Card title="Configuración de la Notificación" className="col-12 mb-4">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={8}>
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

                        <Col xs={24} sm={12} lg={8}>
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

                        <Col xs={24} lg={8}>
                          {/* Información adicional */}
                          <div className="form-group">
                            <label>Información</label>
                            <div className="alert alert-info">
                              <div style={{ fontSize: '13px' }}>
                                <strong>Tip:</strong> Selecciona un tipo de notificación para cargar un mensaje predefinido.
                              </div>
                            </div>
                          </div>
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
                    <Card title="Vista Previa" className="col-12 mb-4">
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
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button 
                          onClick={handleCancel}
                          disabled={loading}
                          icon={<ArrowLeftOutlined />}
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
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* AlertModal para confirmaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default NotificationAdd;