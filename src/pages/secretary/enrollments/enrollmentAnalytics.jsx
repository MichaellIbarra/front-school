import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Select, Spin, Alert, DatePicker } from "antd";
import { UserOutlined, BookOutlined, CalendarOutlined, BarChartOutlined } from "@ant-design/icons";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import useTitle from "../../../hooks/useTitle";

const { Option } = Select;
const { RangePicker } = DatePicker;

const EnrollmentAnalytics = () => {
  useTitle("Analíticas de Matrículas");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    distributionData: [],
    classroomStats: [],
    totalEnrollments: 0,
    activeEnrollments: 0,
    inactiveEnrollments: 0,
    pendingEnrollments: 0
  });

  const [filters, setFilters] = useState({
    classroom: null,
    status: null,
    dateRange: null
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar distribución de matrículas
      const distributionResponse = await enrollmentService.getEnrollmentDistribution(filters);
      
      // Cargar estadísticas por aula si hay filtro de aula
      let classroomStatsData = [];
      if (filters.classroom) {
        classroomStatsData = await enrollmentService.getClassroomStats(filters.classroom);
      }

      // Cargar todas las matrículas para calcular estadísticas generales
      const allEnrollments = await enrollmentService.getAllEnrollments();
      
      // Calcular estadísticas generales
      const totalEnrollments = allEnrollments.length;
      const activeEnrollments = allEnrollments.filter(e => e.status === 'active').length;
      const inactiveEnrollments = allEnrollments.filter(e => e.status === 'inactive').length;
      const pendingEnrollments = allEnrollments.filter(e => e.status === 'pending').length;

      setAnalytics({
        distributionData: distributionResponse || [],
        classroomStats: classroomStatsData,
        totalEnrollments,
        activeEnrollments,
        inactiveEnrollments,
        pendingEnrollments
      });

    } catch (error) {
      console.error("Error al cargar analíticas:", error);
      setError("Error al cargar las analíticas de matrículas");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'inactive':
        return '#ff4d4f';
      case 'pending':
        return '#faad14';
      default:
        return '#1890ff';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Cargando analíticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        {/* Header */}
        <div className="page-header">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="page-title">Analíticas de Matrículas</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/secretary/enrollments">Matrículas</a>
                </li>
                <li className="breadcrumb-item active">Analíticas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="row mb-4">
          <div className="col-12">
            <Card title="Filtros" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Select
                    placeholder="Seleccionar aula"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.classroom}
                    onChange={(value) => handleFilterChange('classroom', value)}
                  >
                    <Option value="1A">1A</Option>
                    <Option value="1B">1B</Option>
                    <Option value="2A">2A</Option>
                    <Option value="2B">2B</Option>
                    <Option value="3A">3A</Option>
                    <Option value="3B">3B</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <Select
                    placeholder="Estado"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                  >
                    <Option value="active">Activo</Option>
                    <Option value="inactive">Inactivo</Option>
                    <Option value="pending">Pendiente</Option>
                  </Select>
                </Col>
                <Col span={12}>
                  <RangePicker
                    style={{ width: '100%' }}
                    placeholder={['Fecha inicio', 'Fecha fin']}
                    value={filters.dateRange}
                    onChange={(dates) => handleFilterChange('dateRange', dates)}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="row mb-4">
          <div className="col-xl-3 col-sm-6 col-12">
            <Card>
              <Statistic
                title="Total de Matrículas"
                value={analytics.totalEnrollments}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </div>
          <div className="col-xl-3 col-sm-6 col-12">
            <Card>
              <Statistic
                title="Matrículas Activas"
                value={analytics.activeEnrollments}
                prefix={<BookOutlined />}
                valueStyle={{ color: getStatusColor('active') }}
              />
            </Card>
          </div>
          <div className="col-xl-3 col-sm-6 col-12">
            <Card>
              <Statistic
                title="Matrículas Inactivas"
                value={analytics.inactiveEnrollments}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: getStatusColor('inactive') }}
              />
            </Card>
          </div>
          <div className="col-xl-3 col-sm-6 col-12">
            <Card>
              <Statistic
                title="Matrículas Pendientes"
                value={analytics.pendingEnrollments}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: getStatusColor('pending') }}
              />
            </Card>
          </div>
        </div>

        {/* Distribución por Estado */}
        <div className="row mb-4">
          <div className="col-12">
            <Card title="Distribución por Estado">
              <Row gutter={16}>
                {analytics.distributionData.length > 0 ? (
                  analytics.distributionData.map((item, index) => (
                    <Col span={8} key={index}>
                      <Card size="small">
                        <Statistic
                          title={`Estado: ${item.status}`}
                          value={item.count}
                          valueStyle={{ color: getStatusColor(item.status) }}
                          suffix={`(${((item.count / analytics.totalEnrollments) * 100).toFixed(1)}%)`}
                        />
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col span={24}>
                    <p style={{ textAlign: 'center', color: '#999' }}>
                      No hay datos de distribución disponibles
                    </p>
                  </Col>
                )}
              </Row>
            </Card>
          </div>
        </div>

        {/* Estadísticas por Aula */}
        {filters.classroom && analytics.classroomStats.length > 0 && (
          <div className="row">
            <div className="col-12">
              <Card title={`Estadísticas del Aula: ${filters.classroom}`}>
                <Row gutter={16}>
                  {analytics.classroomStats.map((stat, index) => (
                    <Col span={6} key={index}>
                      <Card size="small">
                        <Statistic
                          title={stat.label}
                          value={stat.value}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </div>
          </div>
        )}

        {/* Mensaje si no hay datos */}
        {analytics.totalEnrollments === 0 && (
          <div className="row">
            <div className="col-12">
              <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <BarChartOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <h3 style={{ color: '#999', marginTop: '16px' }}>
                    No hay matrículas registradas
                  </h3>
                  <p style={{ color: '#999' }}>
                    Cuando se registren matrículas, aparecerán las analíticas aquí.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentAnalytics;