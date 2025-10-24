import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Row, Col, Card, Tag, Descriptions } from 'antd';
import { EyeOutlined, UserOutlined, BookOutlined, HomeOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const TeacherAssignmentDetailModal = ({ visible, onCancel, assignmentData }) => {
  if (!assignmentData) return null;

  const getStatusColor = (status) => {
    return status === 'A' ? 'green' : 'red';
  };

  const getStatusText = (status) => {
    return status === 'A' ? 'Activo' : 'Inactivo';
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColor = getStatusColor(assignmentData.status);

  return (
    <Modal
      title={
        <div className="d-flex align-items-center">
          <EyeOutlined className="me-2 text-primary" />
          <span>Detalles de Asignación de Profesor</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={null}
      destroyOnClose={true}
    >
      <Row gutter={[16, 16]}>
        {/* Header con estado */}
        <Col span={24}>
          <Card className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">
                  <UserOutlined className="me-2" />
                  Asignación de Profesor
                </h4>
                <p className="text-muted mb-0">
                  ID de Asignación: <strong>{assignmentData.id}</strong>
                </p>
              </div>
              <Tag color={statusColor} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText(assignmentData.status)}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Información del Profesor */}
        <Col span={24}>
          <Card title={<><UserOutlined className="me-2" />Información del Profesor</>} size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Nombre del Profesor">
                <UserOutlined className="me-1 text-primary" />
                <strong>{assignmentData.teacherName || assignmentData.teacherId}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Información del Curso y Aula */}
        <Col span={12}>
          <Card title={<><BookOutlined className="me-2" />Curso Asignado</>} size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Nombre del Curso">
                <BookOutlined className="me-1 text-success" />
                <strong>{assignmentData.courseName || assignmentData.courseId}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card title={<><HomeOutlined className="me-2" />Aula Asignada</>} size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Nombre del Aula">
                <HomeOutlined className="me-1 text-info" />
                <strong>{assignmentData.classroomName || assignmentData.classroomId}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Estado de la Asignación */}
        <Col span={24}>
          <Card title={<><InfoCircleOutlined className="me-2" />Estado</>} size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Estado Actual">
                <Tag color={statusColor} style={{ fontSize: '14px', padding: '6px 16px' }}>
                  {getStatusText(assignmentData.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Fechas de Registro */}
        <Col span={24}>
          <Card title={<><ClockCircleOutlined className="me-2" />Información de Registro</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Fecha de Creación" span={1}>
                {assignmentData.createdAt ? formatDateTime(assignmentData.createdAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización" span={1}>
                {assignmentData.updatedAt ? formatDateTime(assignmentData.updatedAt) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

TeacherAssignmentDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  assignmentData: PropTypes.object,
};

TeacherAssignmentDetailModal.defaultProps = {
  assignmentData: null,
};

export default TeacherAssignmentDetailModal;
