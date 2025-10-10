/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Button, Select, Space, Typography } from 'antd';
import { 
  ReloadOutlined, 
  BankOutlined, 
  HomeOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import InstitutionAdminService from '../../../services/institutions/institutionAdminService';
import headquarterService from '../../../services/institutions/headquarterService';
import { InstitutionStatus, HeadquarterStatus } from '../../../types/institutions';
import useAlert from '../../../hooks/useAlert';
import AlertModal from '../../../components/AlertModal';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import InstitutionStatsChart from './InstitutionStatsChart';
import '../../../assets/css/institution-reports.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { Title: AntTitle } = Typography;

const InstitutionHeadquartersReport = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState({
    totalInstitutions: 0,
    totalHeadquarters: 0,
    activeInstitutions: 0,
    inactiveInstitutions: 0,
    activeHeadquarters: 0,
    inactiveHeadquarters: 0,
    institutionsData: [],
    averageHeadquartersPerInstitution: 0,
    institutionsWithMostHeadquarters: null,
    institutionsWithLeastHeadquarters: null
  });
  const [chartType, setChartType] = useState('bar');
  const [selectedInstitutionStatus, setSelectedInstitutionStatus] = useState('all');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos para reportes...');
      
      // Cargar instituciones
      const institutionsResponse = await InstitutionAdminService.getAllInstitutions();
      
      if (institutionsResponse.success && institutionsResponse.data) {
        const institutionsData = institutionsResponse.data;
        console.log('✅ Instituciones cargadas:', institutionsData.length);
        
        // Cargar sedes para cada institución
        const institutionsWithHeadquarters = await Promise.all(
          institutionsData.map(async (institution) => {
            try {
              const headquartersResponse = await headquarterService.getHeadquartersByInstitutionId(institution.id);
              const headquarters = headquartersResponse.success && headquartersResponse.data ? headquartersResponse.data : [];
              
              const activeHeadquarters = headquarters.filter(hq => hq.status === HeadquarterStatus.ACTIVE).length;
              const inactiveHeadquarters = headquarters.filter(hq => hq.status === HeadquarterStatus.INACTIVE).length;
              
              return {
                ...institution,
                headquarters,
                headquartersCount: headquarters.length,
                activeHeadquarters,
                inactiveHeadquarters,
                totalHeadquarters: headquarters.length
              };
            } catch (error) {
              console.error(`❌ Error cargando sedes para institución ${institution.id}:`, error);
              return {
                ...institution,
                headquarters: [],
                headquartersCount: 0,
                activeHeadquarters: 0,
                inactiveHeadquarters: 0,
                totalHeadquarters: 0
              };
            }
          })
        );

        setInstitutions(institutionsWithHeadquarters);

        // Calcular estadísticas
        const totalInstitutions = institutionsWithHeadquarters.length;
        const activeInstitutions = institutionsWithHeadquarters.filter(inst => inst.status === InstitutionStatus.ACTIVE).length;
        const inactiveInstitutions = institutionsWithHeadquarters.filter(inst => inst.status === InstitutionStatus.INACTIVE).length;
        
        const totalHeadquarters = institutionsWithHeadquarters.reduce((sum, inst) => sum + inst.headquartersCount, 0);
        const activeHeadquarters = institutionsWithHeadquarters.reduce((sum, inst) => sum + inst.activeHeadquarters, 0);
        const inactiveHeadquarters = institutionsWithHeadquarters.reduce((sum, inst) => sum + inst.inactiveHeadquarters, 0);
        
        const averageHeadquartersPerInstitution = totalInstitutions > 0 ? (totalHeadquarters / totalInstitutions).toFixed(2) : 0;

        // Encontrar instituciones con más y menos sedes
        const institutionsWithMostHeadquarters = institutionsWithHeadquarters.reduce((prev, current) => 
          (prev.headquartersCount > current.headquartersCount) ? prev : current, institutionsWithHeadquarters[0]);
        
        const institutionsWithLeastHeadquarters = institutionsWithHeadquarters.reduce((prev, current) => 
          (prev.headquartersCount < current.headquartersCount) ? prev : current, institutionsWithHeadquarters[0]);

        setReportData({
          totalInstitutions,
          totalHeadquarters,
          activeInstitutions,
          inactiveInstitutions,
          activeHeadquarters,
          inactiveHeadquarters,
          institutionsData: institutionsWithHeadquarters,
          averageHeadquartersPerInstitution: parseFloat(averageHeadquartersPerInstitution),
          institutionsWithMostHeadquarters,
          institutionsWithLeastHeadquarters
        });

        console.log('✅ Datos de reporte calculados:', {
          totalInstitutions,
          totalHeadquarters,
          activeInstitutions,
          inactiveInstitutions
        });

      } else {
        throw new Error('No se pudieron cargar las instituciones');
      }
    } catch (error) {
      console.error('❌ Error cargando datos del reporte:', error);
      showError('Error al cargar los datos del reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  // Filtrar instituciones por estado
  const getFilteredInstitutions = () => {
    if (selectedInstitutionStatus === 'all') {
      return institutions;
    }
    return institutions.filter(inst => inst.status === selectedInstitutionStatus);
  };

  // Configuración del gráfico de barras
  const getBarChartData = () => {
    const filteredData = getFilteredInstitutions();
    return {
      labels: filteredData.map(inst => inst.codeInstitution || inst.name.substring(0, 10)),
      datasets: [
        {
          label: 'Sedes Activas',
          data: filteredData.map(inst => inst.activeHeadquarters),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
        },
        {
          label: 'Sedes Inactivas',
          data: filteredData.map(inst => inst.inactiveHeadquarters),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1,
        }
      ],
    };
  };

  // Configuración del gráfico circular
  const getDoughnutChartData = () => {
    return {
      labels: ['Instituciones Activas', 'Instituciones Inactivas'],
      datasets: [
        {
          data: [reportData.activeInstitutions, reportData.inactiveInstitutions],
          backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)'],
          borderColor: ['rgba(40, 167, 69, 1)', 'rgba(220, 53, 69, 1)'],
          borderWidth: 2,
        },
      ],
    };
  };

  // Configuración del gráfico de líneas
  const getLineChartData = () => {
    const filteredData = getFilteredInstitutions();
    return {
      labels: filteredData.map(inst => inst.codeInstitution || inst.name.substring(0, 10)),
      datasets: [
        {
          label: 'Total de Sedes por Institución',
          data: filteredData.map(inst => inst.headquartersCount),
          borderColor: 'rgba(0, 123, 255, 1)',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Reporte de Sedes por Institución',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${percentage}% del total`;
          }
        }
      }
    },
    scales: chartType === 'doughnut' ? {} : {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar data={getBarChartData()} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={getDoughnutChartData()} options={chartOptions} />;
      case 'line':
        return <Line data={getLineChartData()} options={chartOptions} />;
      default:
        return <Bar data={getBarChartData()} options={chartOptions} />;
    }
  };

  const handleBack = () => {
    navigate('/admin/institution');
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spin size="large" />
            <span className="ms-3">Cargando datos del reporte...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <div className="page-wrapper">
        <div className="content">
          <AlertModal
            visible={alertState.visible}
            type={alertState.type}
            title={alertState.title}
            message={alertState.message}
            onConfirm={alertConfirm}
            onCancel={alertCancel}
            showCancel={alertState.showCancel}
            confirmText={alertState.confirmText}
            cancelText={alertState.cancelText}
          />

          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <AntTitle level={3} className="page-title">Reportes de Instituciones y Sedes</AntTitle>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Button type="link" onClick={handleBack} icon={<ArrowLeftOutlined />}>
                        Instituciones
                      </Button>
                    </li>
                    <li className="breadcrumb-item active">Reportes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <Row gutter={16} className="mb-4">
            <Col span={24}>
              <Card>
                <Space wrap>
                  <Button 
                    icon={<ReloadOutlined spin={refreshing} />} 
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
                  </Button>
                  
                  <Select
                    value={selectedInstitutionStatus}
                    onChange={setSelectedInstitutionStatus}
                    style={{ width: 200 }}
                  >
                    <Option value="all">Todas las Instituciones</Option>
                    <Option value="A">Solo Activas</Option>
                    <Option value="I">Solo Inactivas</Option>
                  </Select>

                  <Select
                    value={chartType}
                    onChange={setChartType}
                    style={{ width: 200 }}
                  >
                    <Option value="bar">Gráfico de Barras</Option>
                    <Option value="doughnut">Gráfico Circular</Option>
                    <Option value="line">Gráfico de Líneas</Option>
                  </Select>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Estadísticas */}
          <Row gutter={16} className="institution-report-stats mb-4">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Instituciones"
                  value={reportData.totalInstitutions}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Sedes"
                  value={reportData.totalHeadquarters}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Instituciones Activas"
                  value={reportData.activeInstitutions}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Sedes Promedio"
                  value={reportData.averageHeadquartersPerInstitution}
                  precision={2}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Gráficos */}
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <div className="chart-container">
                <div className="chart-header">
                  <h5>Distribución de Sedes por Institución</h5>
                </div>
                <div style={{ height: '400px' }}>
                  {renderChart()}
                </div>
              </div>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card title="Estadísticas Adicionales">
                <div className="stats-item">
                  <Statistic
                    title="Sedes Activas"
                    value={reportData.activeHeadquarters}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </div>
                <div className="stats-item">
                  <Statistic
                    title="Sedes Inactivas"
                    value={reportData.inactiveHeadquarters}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </div>
                {reportData.institutionsWithMostHeadquarters && (
                  <div className="stats-item">
                    <h6>Institución con más sedes:</h6>
                    <p><strong>{reportData.institutionsWithMostHeadquarters.name}</strong></p>
                    <p>{reportData.institutionsWithMostHeadquarters.headquartersCount} sedes</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Gráfico especializado con ApexCharts */}
          <Row gutter={16} className="mt-4">
            <Col span={24}>
              <Card title="Análisis Detallado de Instituciones">
                <InstitutionStatsChart institutions={getFilteredInstitutions()} />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
};

export default InstitutionHeadquartersReport;