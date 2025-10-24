import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Row, Col, Card, Tag, Descriptions } from 'antd';
import { EyeOutlined, HomeOutlined, CalendarOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const ClassroomDetailModal = ({ visible, onCancel, classroomData }) => {
  if (!classroomData) return null;

  const getStatusColor = (status) => {
    return status === 'A' ? 'green' : 'red';
  };

  const getStatusText = (status) => {
    return status === 'A' ? 'Activo' : 'Inactivo';
  };

  const getShiftText = (shift) => {
    const shifts = {
      'M': 'Mañana',
      'T': 'Tarde',
      'N': 'Noche'
    };
    return shifts[shift] || shift;
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

  const statusColor = getStatusColor(classroomData.status);

  return (
    <Modal
      title={
        <div className="d-flex align-items-center">
          <EyeOutlined className="me-2 text-primary" />
          <span>Detalles del Aula</span>
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
                <h4 className="mb-1">
                  <HomeOutlined className="me-2" />
                  {classroomData.grade}° Grado - Sección {classroomData.section}
                </h4>
                <p className="text-muted mb-0">
                  Turno: <strong>{getShiftText(classroomData.shift)}</strong>
                </p>
              </div>
              <Tag color={statusColor} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText(classroomData.status)}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Información Principal */}
        <Col span={24}>
          <Card title={<><InfoCircleOutlined className="me-2" />Información General</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Grado" span={1}>
                <Tag color="blue" style={{ fontSize: '16px', padding: '6px 16px' }}>
                  {classroomData.grade}°
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sección" span={1}>
                <Tag color="green" style={{ fontSize: '16px', padding: '6px 16px' }}>
                  {classroomData.section}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Turno" span={1}>
                <Tag color="orange">{getShiftText(classroomData.shift)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Estado" span={1}>
                <Tag color={statusColor}>
                  {getStatusText(classroomData.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Información de Sede y Período */}
        <Col span={24}>
          <Card title={<><CalendarOutlined className="me-2" />Sede y Período</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Sede" span={1}>
                <HomeOutlined className="me-1 text-primary" />
                {classroomData.headquarterName || 'Sede no especificada'}
              </Descriptions.Item>
              <Descriptions.Item label="Período Académico" span={1}>
                <CalendarOutlined className="me-1 text-success" />
                {classroomData.periodName || 'Período no especificado'}
              </Descriptions.Item>
              {!classroomData.periodName && classroomData.periodId && (
                <Descriptions.Item label="ID del Período (No resuelto)" span={2}>
                  <Tag color="orange">{classroomData.periodId}</Tag>
                </Descriptions.Item>
              )}
              {!classroomData.headquarterName && classroomData.headquarterId && (
                <Descriptions.Item label="ID de la Sede (No resuelto)" span={2}>
                  <Tag color="orange">{classroomData.headquarterId}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Fechas de Registro */}
        <Col span={24}>
          <Card title={<><ClockCircleOutlined className="me-2" />Información de Registro</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Fecha de Creación" span={1}>
                {classroomData.createdAt ? formatDateTime(classroomData.createdAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización" span={1}>
                {classroomData.updatedAt ? formatDateTime(classroomData.updatedAt) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

ClassroomDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  classroomData: PropTypes.object,
};

ClassroomDetailModal.defaultProps = {
  classroomData: null,
};

export default ClassroomDetailModal;
