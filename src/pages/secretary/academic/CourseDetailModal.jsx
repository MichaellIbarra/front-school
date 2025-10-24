import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Row, Col, Card, Tag, Descriptions } from 'antd';
import { EyeOutlined, BookOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';

const CourseDetailModal = ({ visible, onCancel, courseData }) => {
  if (!courseData) return null;

  const getStatusColor = (status) => {
    return status === 'A' ? 'green' : 'red';
  };

  const getStatusText = (status) => {
    return status === 'A' ? 'Activo' : 'Inactivo';
  };

  const getLevelText = (level) => {
    const levels = {
      'INICIAL': 'Inicial',
      'PRIMARIA': 'Primaria',
      'SECUNDARIA': 'Secundaria',
      'SUPERIOR': 'Superior'
    };
    return levels[level] || level;
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

  const statusColor = getStatusColor(courseData.status);

  return (
    <Modal
      title={
        <div className="d-flex align-items-center">
          <EyeOutlined className="me-2 text-primary" />
          <span>Detalles del Curso</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose={true}
    >
      <Row gutter={[16, 16]}>
        {/* Header con estado */}
        <Col span={24}>
          <Card className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">{courseData.courseName}</h4>
                <p className="text-muted mb-0">
                  <BookOutlined className="me-1" />
                  Código: <strong>{courseData.courseCode}</strong>
                </p>
              </div>
              <Tag color={statusColor} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText(courseData.status)}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Información Principal */}
        <Col span={24}>
          <Card title={<><FileTextOutlined className="me-2" />Información General</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Código del Curso" span={1}>
                <strong>{courseData.courseCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Nivel" span={1}>
                <Tag color="blue">{getLevelText(courseData.level)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nombre del Curso" span={2}>
                <strong>{courseData.courseName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Horas por Semana" span={1}>
                <ClockCircleOutlined className="me-1" />
                {courseData.hoursPerWeek} horas
              </Descriptions.Item>
              <Descriptions.Item label="Estado" span={1}>
                <Tag color={statusColor}>
                  {getStatusText(courseData.status)}
                </Tag>
              </Descriptions.Item>
              {courseData.description && (
                <Descriptions.Item label="Descripción" span={2}>
                  <div className="border-start border-primary ps-3">
                    {courseData.description}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Fechas */}
        <Col span={24}>
          <Card title={<><ClockCircleOutlined className="me-2" />Información de Registro</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Fecha de Creación" span={1}>
                {courseData.createdAt ? formatDateTime(courseData.createdAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización" span={1}>
                {courseData.updatedAt ? formatDateTime(courseData.updatedAt) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

CourseDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  courseData: PropTypes.object,
};

CourseDetailModal.defaultProps = {
  courseData: null,
};

export default CourseDetailModal;
