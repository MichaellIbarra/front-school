import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Alert,
  Divider,
  Card,
  Row,
  Col,
  Tag,
  Badge
} from 'antd';
import {
  MessageSquare,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'react-feather';
import dayjs from 'dayjs';

// Servicios
import notificationsSecretaryService from '../../../services/notification/notificationsSecretaryService';

const { Option } = Select;

const AssignmentFormModal = ({
  visible,
  onCancel,
  onSuccess,
  assignmentData,
  mode = 'create',
  instances = [],
  classrooms = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Estados para previsualización
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && assignmentData) {
        // Llenar formulario para edición
        form.setFieldsValue({
          instance_id: assignmentData.instance_id,
          classroom_id: assignmentData.classroom_id,
          assignment_type: assignmentData.assignment_type,
          assignment_date: assignmentData.assignment_date ? dayjs(assignmentData.assignment_date) : dayjs()
        });

        // Establecer previsualización
        setSelectedInstance(instances.find(inst => inst.id === assignmentData.instance_id));
        setSelectedClassroom(classrooms.find(cls => cls.id === assignmentData.classroom_id));
      } else {
        // Limpiar formulario para creación
        form.resetFields();
        form.setFieldsValue({
          assignment_type: 'BROADCAST',
          assignment_date: dayjs()
        });
        setSelectedInstance(null);
        setSelectedClassroom(null);
      }
      setErrors([]);
    }
  }, [visible, mode, assignmentData, form, instances, classrooms]);

  /**
   * Manejar cambio de instancia seleccionada
   */
  const handleInstanceChange = (instanceId) => {
    const instance = instances.find(inst => inst.id === instanceId);
    setSelectedInstance(instance);
  };

  /**
   * Manejar cambio de aula seleccionada
   */
  const handleClassroomChange = (classroomId) => {
    const classroom = classrooms.find(cls => cls.id === classroomId);
    setSelectedClassroom(classroom);
  };

  /**
   * Validar formulario
   */
  const validateForm = (values) => {
    const validationErrors = [];

    if (!values.instance_id) {
      validationErrors.push('Debe seleccionar una instancia WhatsApp');
    }

    if (!values.classroom_id) {
      validationErrors.push('Debe seleccionar un aula');
    }

    if (!values.assignment_date) {
      validationErrors.push('Debe seleccionar una fecha de asignación');
    }

    // Validar que la fecha no sea anterior a hoy
    if (values.assignment_date && values.assignment_date.isBefore(dayjs(), 'day')) {
      validationErrors.push('La fecha de asignación no puede ser anterior a hoy');
    }

    return validationErrors;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('📝 Valores del formulario:', values);

      // Validaciones personalizadas
      const validationErrors = validateForm(values);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);
      setErrors([]);

      // Preparar datos para envío
      const assignmentDataToSend = {
        instance_id: values.instance_id,
        classroom_id: values.classroom_id,
        assignment_type: values.assignment_type || 'BROADCAST',
        assignment_date: values.assignment_date.format('YYYY-MM-DD')
      };

      console.log('📤 Enviando datos:', assignmentDataToSend);

      let response;
      if (mode === 'edit') {
        // Actualizar asignación existente
        response = await notificationsSecretaryService.updateAssignment(
          assignmentData.id,
          assignmentDataToSend
        );
      } else {
        // Crear nueva asignación
        response = await notificationsSecretaryService.createAssignment(assignmentDataToSend);
      }

      console.log('📊 Respuesta del servicio:', response);

      if (response.success) {
        console.log('✅ Asignación procesada exitosamente');
        onSuccess(response.data, mode === 'edit');
      } else {
        console.error('❌ Error en el servicio:', response.error);
        setErrors([response.error || 'Error al procesar la asignación']);
      }

    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      if (error.errorFields && error.errorFields.length > 0) {
        // Errores de validación de Ant Design
        const formErrors = error.errorFields.map(field => field.errors[0]);
        setErrors(formErrors);
      } else {
        setErrors([error.message || 'Error inesperado al procesar la asignación']);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedInstance(null);
    setSelectedClassroom(null);
    setErrors([]);
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {mode === 'edit' ? '✏️ Editar Asignación' : '➕ Nueva Asignación'}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {mode === 'edit' ? 'Actualizar' : 'Crear'} Asignación
        </Button>,
      ]}
      destroyOnClose
    >
      {/* Errores */}
      {errors.length > 0 && (
        <Alert
          message="Errores de validación"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          closable
          onClose={() => setErrors([])}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Row gutter={16}>
          {/* Selección de Instancia WhatsApp */}
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 'bold' }}>
                  <MessageSquare size={16} style={{ marginRight: 6 }} />
                  Instancia WhatsApp
                </span>
              }
              name="instance_id"
              rules={[{ required: true, message: 'Seleccione una instancia' }]}
            >
              <Select
                placeholder="Seleccionar instancia WhatsApp"
                onChange={handleInstanceChange}
                disabled={mode === 'edit'} // No permitir cambiar instancia en edición
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {instances.map(instance => (
                  <Option key={instance.id} value={instance.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{instance.instance_name}</span>
                      <Tag 
                        color={instance.connection_status === 'CONNECTED' ? 'green' : 'orange'}
                        style={{ marginLeft: 8 }}
                      >
                        {instance.connection_status}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Selección de Aula */}
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 'bold' }}>
                  <Users size={16} style={{ marginRight: 6 }} />
                  Aula
                </span>
              }
              name="classroom_id"
              rules={[{ required: true, message: 'Seleccione un aula' }]}
            >
              <Select
                placeholder="Seleccionar aula"
                onChange={handleClassroomChange}
                disabled={mode === 'edit'} // No permitir cambiar aula en edición
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {classrooms.map(classroom => (
                  <Option key={classroom.id} value={classroom.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Sección {classroom.section} - {classroom.classroomName}</span>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {classroom.shift === 'M' ? 'Mañana' : classroom.shift === 'T' ? 'Tarde' : 'Noche'}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Tipo de Asignación */}
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 'bold' }}>
                  <CheckCircle size={16} style={{ marginRight: 6 }} />
                  Tipo de Asignación
                </span>
              }
              name="assignment_type"
              rules={[{ required: true, message: 'Seleccione el tipo' }]}
            >
              <Select placeholder="Seleccionar tipo">
                <Option value="BROADCAST">
                  <Tag color="blue">BROADCAST</Tag>
                  <span style={{ marginLeft: 8 }}>Difusión masiva</span>
                </Option>
                <Option value="INDIVIDUAL">
                  <Tag color="green">INDIVIDUAL</Tag>
                  <span style={{ marginLeft: 8 }}>Mensajes individuales</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Fecha de Asignación */}
          <Col span={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 'bold' }}>
                  <Calendar size={16} style={{ marginRight: 6 }} />
                  Fecha de Asignación
                </span>
              }
              name="assignment_date"
              rules={[{ required: true, message: 'Seleccione una fecha' }]}
            >
              <DatePicker
                placeholder="Seleccionar fecha"
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().endOf('day')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* Previsualización */}
      {(selectedInstance || selectedClassroom) && (
        <>
          <Divider orientation="left">
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              👁️ Previsualización
            </span>
          </Divider>

          <Row gutter={16}>
            {/* Previsualización de Instancia */}
            {selectedInstance && (
              <Col span={12}>
                <Card size="small" title="📱 Instancia Seleccionada">
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Nombre:</strong> {selectedInstance.instance_name}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Teléfono:</strong> {selectedInstance.phone_number}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Estado:</strong>{' '}
                      <Tag color={selectedInstance.status === 'A' ? 'green' : 'red'}>
                        {selectedInstance.status === 'A' ? 'Activa' : 'Inactiva'}
                      </Tag>
                    </div>
                    <div>
                      <strong>Conexión:</strong>{' '}
                      <Badge
                        status={selectedInstance.connection_status === 'CONNECTED' ? 'success' : 'processing'}
                        text={selectedInstance.connection_status}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            )}

            {/* Previsualización de Aula */}
            {selectedClassroom && (
              <Col span={12}>
                <Card size="small" title="🏫 Aula Seleccionada">
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Sección:</strong> {selectedClassroom.section}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Nombre:</strong> {selectedClassroom.classroomName}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Turno:</strong>{' '}
                      <Tag color="blue">
                        {selectedClassroom.shift === 'M' ? 'Mañana' : 
                         selectedClassroom.shift === 'T' ? 'Tarde' : 'Noche'}
                      </Tag>
                    </div>
                    <div>
                      <strong>Estado:</strong>{' '}
                      <Tag color={selectedClassroom.status === 'A' ? 'green' : 'red'}>
                        {selectedClassroom.status === 'A' ? 'Activa' : 'Inactiva'}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Información adicional */}
      <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f6f6f6', borderRadius: '6px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <AlertCircle size={14} style={{ marginRight: 6 }} />
          <strong>Nota:</strong> Esta asignación permitirá enviar notificaciones WhatsApp a todos los estudiantes 
          del aula seleccionada utilizando la instancia configurada.
        </div>
      </div>
    </Modal>
  );
};

// PropTypes para validación de props
AssignmentFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  assignmentData: PropTypes.shape({
    id: PropTypes.string,
    instance_id: PropTypes.string,
    classroom_id: PropTypes.string,
    assignment_type: PropTypes.string,
    assignment_date: PropTypes.string
  }),
  mode: PropTypes.oneOf(['create', 'edit']),
  instances: PropTypes.arrayOf(PropTypes.object),
  classrooms: PropTypes.arrayOf(PropTypes.object)
};

// Valores por defecto
AssignmentFormModal.defaultProps = {
  assignmentData: null,
  mode: 'create',
  instances: [],
  classrooms: []
};

export default AssignmentFormModal;