/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import InstitutionStatsChart from './InstitutionStatsChart';
import InstitutionAdminService from '../../../services/institutions/institutionAdminService';
import headquarterService from '../../../services/institutions/headquarterService';
import { InstitutionStatus, HeadquarterStatus, AdminModuleConstants } from '../../../types/institutions';
import ReportExporter from '../../../utils/institutions/reportExporter';
import { Spin, Card, Row, Col, Statistic, Select, DatePicker, Button, Tooltip as AntTooltip, Dropdown, Menu } from 'antd';
import { ReloadOutlined, DownloadOutlined, PrinterOutlined, BarChartOutlined } from '@ant-design/icons';

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
const { RangePicker } = DatePicker;

const InstitutionHeadquartersReport = () => {
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
      
      // Obtener todas las instituciones
      const institutionsResponse = await InstitutionAdminService.getAllInstitutions();
      
      if (!institutionsResponse.success) {
        showError('Error al cargar datos', institutionsResponse.error);
        return;
      }

      const institutionsData = institutionsResponse.data || [];
      
      const reportInfo = {
        totalInstitutions: institutionsData.length,
        totalHeadquarters: 0,
        activeInstitutions: institutionsData.filter(inst => inst.status === InstitutionStatus.ACTIVE).length,
        inactiveInstitutions: institutionsData.filter(inst => inst.status === InstitutionStatus.INACTIVE).length,
        activeHeadquarters: 0,
        inactiveHeadquarters: 0,
        institutionsData: [],
        averageHeadquartersPerInstitution: 0,
        institutionsWithMostHeadquarters: null,
        institutionsWithLeastHeadquarters: null
      };

      // Obtener datos de sedes para cada institución
      const institutionsWithHeadquarters = await Promise.all(
        institutionsData.map(async (institution) => {
          try {
            const headquartersResponse = await headquarterService.getHeadquartersByInstitutionId(institution.id);
            
            if (headquartersResponse.success) {
              const headquarters = headquartersResponse.data || [];
              const activeHeadquarters = headquarters.filter(hq => hq.status === HeadquarterStatus.ACTIVE).length;
              const inactiveHeadquarters = headquarters.filter(hq => hq.status === HeadquarterStatus.INACTIVE).length;
              
              // Acumular estadísticas globales
              reportInfo.totalHeadquarters += headquarters.length;
              reportInfo.activeHeadquarters += activeHeadquarters;
              reportInfo.inactiveHeadquarters += inactiveHeadquarters;
              
              return {
                id: institution.id,
                name: institution.name,
                codeInstitution: institution.codeInstitution,
                status: institution.status,
                contactEmail: institution.contactEmail,
                contactPhone: institution.contactPhone,
                address: institution.address,
                headquartersCount: headquarters.length,
                activeHeadquarters: activeHeadquarters,
                inactiveHeadquarters: inactiveHeadquarters,
                headquarters: headquarters,
                createdAt: institution.createdAt
              };
            } else {
              console.warn(`Error loading headquarters for institution ${institution.id}:`, headquartersResponse.error);
              return {
                id: institution.id,
                name: institution.name,
                codeInstitution: institution.codeInstitution,
                status: institution.status,
                contactEmail: institution.contactEmail,
                contactPhone: institution.contactPhone,
                address: institution.address,
                headquartersCount: 0,
                activeHeadquarters: 0,
                inactiveHeadquarters: 0,
                headquarters: [],
                createdAt: institution.createdAt
              };
            }
          } catch (error) {
            console.error(`Error loading headquarters for institution ${institution.id}:`, error);
            return {
              id: institution.id,
              name: institution.name,
              codeInstitution: institution.codeInstitution,
              status: institution.status,
              contactEmail: institution.contactEmail,
              contactPhone: institution.contactPhone,
              address: institution.address,
              headquartersCount: 0,
              activeHeadquarters: 0,
              inactiveHeadquarters: 0,
              headquarters: [],
              createdAt: institution.createdAt
            };
          }
        })
      );

      // Calcular estadísticas adicionales
      reportInfo.averageHeadquartersPerInstitution = reportInfo.totalInstitutions > 0 
        ? (reportInfo.totalHeadquarters / reportInfo.totalInstitutions).toFixed(1)
        : 0;

      // Encontrar instituciones con más y menos sedes
      const sortedByHeadquarters = [...institutionsWithHeadquarters].sort((a, b) => b.headquartersCount - a.headquartersCount);
      reportInfo.institutionsWithMostHeadquarters = sortedByHeadquarters[0] || null;
      reportInfo.institutionsWithLeastHeadquarters = sortedByHeadquarters[sortedByHeadquarters.length - 1] || null;

      reportInfo.institutionsData = institutionsWithHeadquarters;
      setReportData(reportInfo);
      setInstitutions(institutionsWithHeadquarters);
      
      showSuccess('Datos cargados', 'Reporte actualizado exitosamente');
    } catch (error) {
      console.error('Error loading report data:', error);
      showError('Error de conexión', 'No se pudieron cargar los datos del reporte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
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
    const filteredInstitutions = getFilteredInstitutions();
    const labels = filteredInstitutions.map(inst => inst.codeInstitution || inst.name.substring(0, 15));
    const activeData = filteredInstitutions.map(inst => inst.activeHeadquarters);
    const inactiveData = filteredInstitutions.map(inst => inst.inactiveHeadquarters);

    return {
      labels,
      datasets: [
        {
          label: 'Sedes Activas',
          data: activeData,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Sedes Inactivas',
          data: inactiveData,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  // Configuración del gráfico circular
  const getDoughnutChartData = () => {
    const filteredInstitutions = getFilteredInstitutions();
    const labels = filteredInstitutions.map(inst => inst.codeInstitution || inst.name.substring(0, 20));
    const data = filteredInstitutions.map(inst => inst.headquartersCount);
    
    const colors = AdminModuleConstants.DEFAULT_COLORS.concat([
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#C9CBCF'
    ]);

    return {
      labels,
      datasets: [
        {
          label: 'Total de Sedes',
          data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    };
  };

  // Configuración del gráfico de líneas
  const getLineChartData = () => {
    const filteredInstitutions = getFilteredInstitutions();
    const labels = filteredInstitutions.map((inst, index) => `${inst.codeInstitution || `Inst ${index + 1}`}`);
    const totalData = filteredInstitutions.map(inst => inst.headquartersCount);
    const activeData = filteredInstitutions.map(inst => inst.activeHeadquarters);

    return {
      labels,
      datasets: [
        {
          label: 'Total Sedes',
          data: totalData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: 'Sedes Activas',
          data: activeData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
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
            const institution = getFilteredInstitutions()[context.dataIndex];
            if (institution) {
              return [
                `Total: ${institution.headquartersCount} sedes`,
                `Activas: ${institution.activeHeadquarters}`,
                `Inactivas: ${institution.inactiveHeadquarters}`
              ];
            }
            return '';
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

  const handleExportReport = () => {
    const exportMenu = (
      <Menu onClick={handleMenuClick}>
        <Menu.Item key="excel" icon={<DownloadOutlined />}>
          Exportar a Excel
        </Menu.Item>
        <Menu.Item key="pdf" icon={<DownloadOutlined />}>
          Exportar a PDF
        </Menu.Item>
        <Menu.Item key="csv" icon={<DownloadOutlined />}>
          Exportar a CSV
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown overlay={exportMenu} placement="bottomRight">
        <Button icon={<DownloadOutlined />} type="primary">
          Exportar
        </Button>
      </Dropdown>
    );
  };

  const handleMenuClick = async ({ key }) => {
    try {
      setRefreshing(true);
      let result;
      
      switch (key) {
        case 'excel':
          result = ReportExporter.exportToExcel(institutions, reportData);
          break;
        case 'pdf':
          result = ReportExporter.exportToPDF(institutions, reportData);
          break;
        case 'csv':
          result = ReportExporter.exportToCSV(institutions);
          break;
        default:
          return;
      }
      
      if (result.success) {
        showSuccess('Exportación exitosa', `Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error de exportación', result.error);
      }
    } catch (error) {
      showError('Error de exportación', 'No se pudo exportar el reporte');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrintReport = () => {
    const result = ReportExporter.printReport();
    if (!result.success) {
      showError('Error de impresión', result.error);
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <Spin size="large" tip="Cargando datos del reporte..." />
            </div>
          </div>
        </div>
        <Header />
        <Sidebar />
      </>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Reporte de Instituciones y Sedes</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/admin/institution">Instituciones</Link>
                    </li>
                    <li className="breadcrumb-item active">
                      Reportes
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="d-flex justify-content-end gap-2">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={refreshing}
                >
                  Actualizar
                </Button>
                {handleExportReport()}
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={handlePrintReport}
                >
                  Imprimir
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <Row gutter={16} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Instituciones"
                  value={reportData.totalInstitutions}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<i className="fas fa-building" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Sedes"
                  value={reportData.totalHeadquarters}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<i className="fas fa-map-marker-alt" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Sedes Activas"
                  value={reportData.activeHeadquarters}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<i className="fas fa-check-circle" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Promedio Sedes/Institución"
                  value={reportData.averageHeadquartersPerInstitution}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<i className="fas fa-chart-line" />}
                />
              </Card>
            </Col>
          </Row>

          {/* Additional Stats */}
          <Row gutter={16} className="mb-4">
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Instituciones Activas"
                  value={reportData.activeInstitutions}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<i className="fas fa-check" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Instituciones Inactivas"
                  value={reportData.inactiveInstitutions}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<i className="fas fa-times" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Sedes Inactivas"
                  value={reportData.inactiveHeadquarters}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<i className="fas fa-times-circle" />}
                />
              </Card>
            </Col>
          </Row>

          {/* ApexCharts Comparative Chart */}
          <div className="row mb-4">
            <div className="col-md-12">
              <InstitutionStatsChart institutions={getFilteredInstitutions()} />
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <div className="row align-items-center">
                    <div className="col">
                      <h5 className="card-title d-flex align-items-center">
                        <BarChartOutlined className="me-2" />
                        Gráfico de Distribución
                      </h5>
                    </div>
                    <div className="col-auto d-flex gap-2">
                      <Select
                        value={selectedInstitutionStatus}
                        onChange={setSelectedInstitutionStatus}
                        style={{ width: 150 }}
                        placeholder="Filtrar por estado"
                      >
                        <Option value="all">Todas</Option>
                        <Option value={InstitutionStatus.ACTIVE}>Activas</Option>
                        <Option value={InstitutionStatus.INACTIVE}>Inactivas</Option>
                      </Select>
                      <Select
                        value={chartType}
                        onChange={setChartType}
                        style={{ width: 150 }}
                        placeholder="Tipo de gráfico"
                      >
                        <Option value="bar">Barras</Option>
                        <Option value="doughnut">Circular</Option>
                        <Option value="line">Líneas</Option>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ height: '400px', position: 'relative' }}>
                    {renderChart()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Detalle por Institución</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Institución</th>
                          <th>Código</th>
                          <th>Sedes Activas</th>
                          <th>Sedes Inactivas</th>
                          <th>Total Sedes</th>
                          <th>Estado</th>
                          <th>Contacto</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredInstitutions().map((institution, index) => (
                          <tr key={institution.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="avatar avatar-sm me-2 d-flex align-items-center justify-content-center rounded-circle text-white"
                                  style={{ 
                                    backgroundColor: index % 2 === 0 ? '#007bff' : '#28a745',
                                    minWidth: '35px',
                                    height: '35px'
                                  }}
                                >
                                  {institution.name.charAt(0)}
                                </div>
                                <div>
                                  <h6 className="mb-0">{institution.name}</h6>
                                  <small className="text-muted">{institution.address}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {institution.codeInstitution}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="me-2 text-success fw-bold">{institution.activeHeadquarters}</span>
                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    style={{ 
                                      width: `${Math.max((institution.activeHeadquarters / Math.max(...institutions.map(i => i.headquartersCount), 1)) * 100, 5)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-danger fw-bold">{institution.inactiveHeadquarters}</span>
                            </td>
                            <td>
                              <span className="fw-bold">{institution.headquartersCount}</span>
                            </td>
                            <td>
                              <span className={`badge ${institution.status === InstitutionStatus.ACTIVE ? 'bg-success' : 'bg-danger'}`}>
                                {institution.status === InstitutionStatus.ACTIVE ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td>
                              <div>
                                <small className="d-block">{institution.contactEmail}</small>
                                <small className="text-muted">{institution.contactPhone}</small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <AntTooltip title="Ver institución">
                                  <Link 
                                    to={`/admin/institution/edit/${institution.id}`} 
                                    className="btn btn-sm btn-outline-info"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Link>
                                </AntTooltip>
                                <AntTooltip title="Ver sedes">
                                  <Link 
                                    to={`/admin/institution/${institution.id}/headquarters`} 
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="fas fa-map-marker-alt"></i>
                                  </Link>
                                </AntTooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {getFilteredInstitutions().length === 0 && (
                    <div className="text-center py-4">
                      <i className="fas fa-search fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No hay datos para mostrar</h5>
                      <p className="text-muted">
                        {selectedInstitutionStatus === 'all' 
                          ? 'No se encontraron instituciones registradas'
                          : `No se encontraron instituciones con estado: ${selectedInstitutionStatus === InstitutionStatus.ACTIVE ? 'Activo' : 'Inactivo'}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default InstitutionHeadquartersReport;