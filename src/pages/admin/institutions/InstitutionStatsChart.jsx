/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
import { Card } from 'antd';
import { InstitutionStatus, HeadquarterStatus } from "../../../types/institutions";

const InstitutionStatsChart = ({ institutions = [] }) => {
  
  // Preparar datos para el gráfico
  const chartData = {
    series: [
      {
        name: 'Sedes Activas',
        data: institutions.map(inst => inst.activeHeadquarters || 0)
      },
      {
        name: 'Sedes Inactivas',
        data: institutions.map(inst => inst.inactiveHeadquarters || 0)
      },
      {
        name: 'Total Sedes',
        data: institutions.map(inst => inst.headquartersCount || 0)
      }
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        stacked: false,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '10px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: institutions.map(inst => inst.codeInstitution || inst.name.substring(0, 10)),
        title: {
          text: 'Instituciones'
        },
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cantidad de Sedes'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val, { series, seriesIndex, dataPointIndex, w }) {
            const institution = institutions[dataPointIndex];
            if (institution) {
              return `${val} sedes - ${institution.name}`;
            }
            return val;
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetX: 40
      },
      colors: ['#28a745', '#dc3545', '#007bff']
    }
  };

  // Gráfico de pastel para distribución por estado de institución
  const pieChartData = {
    series: [
      institutions.filter(inst => inst.status === InstitutionStatus.ACTIVE).length,
      institutions.filter(inst => inst.status === InstitutionStatus.INACTIVE).length
    ],
    options: {
      chart: {
        width: 380,
        type: 'pie',
      },
      labels: ['Instituciones Activas', 'Instituciones Inactivas'],
      colors: ['#28a745', '#dc3545'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      tooltip: {
        y: {
          formatter: function (val) {
            return `${val} instituciones`;
          }
        }
      }
    }
  };

  // Gráfico radial para promedio de sedes
  const totalHeadquarters = institutions.reduce((sum, inst) => sum + (inst.headquartersCount || 0), 0);
  const averageHeadquarters = institutions.length > 0 ? (totalHeadquarters / institutions.length) : 0;
  const maxPossibleSedes = 10; // Valor máximo esperado para normalizar el porcentaje

  const radialChartData = {
    series: [Math.round((averageHeadquarters / maxPossibleSedes) * 100)],
    options: {
      chart: {
        height: 350,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '70%',
          },
          dataLabels: {
            name: {
              fontSize: '16px',
            },
            value: {
              fontSize: '16px',
              formatter: function (val) {
                return averageHeadquarters.toFixed(1);
              }
            },
            total: {
              show: true,
              label: 'Promedio',
              formatter: function (w) {
                return `${averageHeadquarters.toFixed(1)} sedes`;
              }
            }
          }
        }
      },
      labels: ['Sedes por Institución'],
      colors: ['#1890ff']
    }
  };

  return (
    <div className="row">
      {/* Gráfico principal de barras */}
      <div className="col-lg-8 col-md-12">
        <Card 
          title="Distribución de Sedes por Institución" 
          className="mb-4"
          extra={<span className="text-muted">Comparativa detallada</span>}
        >
          <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={350}
          />
        </Card>
      </div>

      {/* Gráficos secundarios */}
      <div className="col-lg-4 col-md-12">
        <div className="row">
          {/* Gráfico de pastel */}
          <div className="col-12">
            <Card 
              title="Estado de Instituciones" 
              className="mb-4"
              size="small"
            >
              <ReactApexChart
                options={pieChartData.options}
                series={pieChartData.series}
                type="pie"
                width={320}
              />
            </Card>
          </div>

          {/* Gráfico radial */}
          <div className="col-12">
            <Card 
              title="Promedio de Sedes" 
              className="mb-4"
              size="small"
            >
              <ReactApexChart
                options={radialChartData.options}
                series={radialChartData.series}
                type="radialBar"
                height={300}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="col-12">
        <Card title="Resumen Estadístico" className="mb-4">
          <div className="row text-center">
            <div className="col-md-3 col-sm-6">
              <div className="stats-item">
                <h4 className="text-primary">{institutions.length}</h4>
                <p className="text-muted mb-0">Total Instituciones</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stats-item">
                <h4 className="text-success">{totalHeadquarters}</h4>
                <p className="text-muted mb-0">Total Sedes</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stats-item">
                <h4 className="text-info">{averageHeadquarters.toFixed(1)}</h4>
                <p className="text-muted mb-0">Promedio Sedes/Institución</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stats-item">
                <h4 className="text-warning">
                  {institutions.length > 0 ? Math.max(...institutions.map(i => i.headquartersCount || 0)) : 0}
                </h4>
                <p className="text-muted mb-0">Máximo Sedes</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

InstitutionStatsChart.propTypes = {
  institutions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      codeInstitution: PropTypes.number,
      status: PropTypes.string,
      headquartersCount: PropTypes.number,
      activeHeadquarters: PropTypes.number,
      inactiveHeadquarters: PropTypes.number,
      totalHeadquarters: PropTypes.number
    })
  )
};

export default InstitutionStatsChart;