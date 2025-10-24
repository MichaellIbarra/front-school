import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Row, Col, Card, Tag, Descriptions } from 'antd';
import { EyeOutlined, CalendarOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const PeriodDetailModal = ({ visible, onCancel, periodData }) => {
  if (!periodData) return null;

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

  const getPeriodTypeText = (type) => {
    const types = {
      'BIMESTRE': 'Bimestre',
      'TRIMESTRE': 'Trimestre',
      'SEMESTRE': 'Semestre',
      'ANUAL': 'Anual'
    };
    return types[type] || type;
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

  const statusColor = getStatusColor(periodData.status);

  return (
    <Modal
      title={
        <div className="d-flex align-items-center">
          <EyeOutlined className="me-2 text-primary" />
          <span>Detalles del Período Académico</span>
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
                <h4 className="mb-1">{periodData.name}</h4>
                <p className="text-muted mb-0">
                  <CalendarOutlined className="me-1" />
                  {getLevelText(periodData.level)} - {getPeriodTypeText(periodData.periodType)}
                </p>
              </div>
              <Tag color={statusColor} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText(periodData.status)}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Información Principal */}
        <Col span={24}>
          <Card title={<><InfoCircleOutlined className="me-2" />Información General</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Nombre del Período" span={2}>
                <strong>{periodData.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Nivel" span={1}>
                <Tag color="blue">{getLevelText(periodData.level)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo de Período" span={1}>
                <Tag color="purple">{getPeriodTypeText(periodData.periodType)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Estado" span={2}>
                <Tag color={statusColor}>
                  {getStatusText(periodData.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Fechas del Período */}
        <Col span={24}>
          <Card title={<><CalendarOutlined className="me-2" />Fechas del Período</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Fecha de Inicio" span={1}>
                <CalendarOutlined className="me-1 text-success" />
                {periodData.startDate ? new Date(periodData.startDate).toLocaleDateString('es-PE') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Fin" span={1}>
                <CalendarOutlined className="me-1 text-danger" />
                {periodData.endDate ? new Date(periodData.endDate).toLocaleDateString('es-PE') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Fechas de Registro */}
        <Col span={24}>
          <Card title={<><ClockCircleOutlined className="me-2" />Información de Registro</>} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Fecha de Creación" span={1}>
                {periodData.createdAt ? formatDateTime(periodData.createdAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización" span={1}>
                {periodData.updatedAt ? formatDateTime(periodData.updatedAt) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

PeriodDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  periodData: PropTypes.object,
};

PeriodDetailModal.defaultProps = {
  periodData: null,
};

export default PeriodDetailModal;
