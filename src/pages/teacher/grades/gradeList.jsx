/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Tabs } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined, BellOutlined, DownloadOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import gradeService from "../../../services/grades/gradeService";
import { 
  AchievementLevel, 
  AcademicPeriod, 
  EvaluationType, 
  formatDate, 
  getAchievementLevelBadgeClass 
} from "../../../types/grades/grade";
import GradeFormModal from "./GradeFormModal";
import GradeReportExporter from "../../../utils/grades/reportExporter";

const { Option } = Select;
const { TabPane } = Tabs;

const GradeList = () => {
  // eslint-disable-next-line
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [grades, setGrades] = useState([]);
  const [inactiveGrades, setInactiveGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [achievementLevelFilter, setAchievementLevelFilter] = useState('all');
  const [academicPeriodFilter, setAcademicPeriodFilter] = useState('all');
  const [filteredGrades, setFilteredGrades] = useState([]);
  
  // Estados para modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Cargar calificaciones al montar el componente
  useEffect(() => {
    loadGrades();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [grades, inactiveGrades, searchText, achievementLevelFilter, academicPeriodFilter, activeTab]);

  /**
   * Carga todas las calificaciones desde el servicio
   */
  const loadGrades = async () => {
    setLoading(true);
    try {
      // Cargar calificaciones activas
      const activeResponse = await gradeService.getAllGrades();
      if (activeResponse.success) {
        setGrades(activeResponse.data);
      } else {
        showError(activeResponse.error);
        setGrades([]);
      }

      // Cargar calificaciones inactivas
      const inactiveResponse = await gradeService.getAllInactiveGrades();
      if (inactiveResponse.success) {
        setInactiveGrades(inactiveResponse.data);
      } else {
        setInactiveGrades([]);
      }
    } catch (error) {
      showError('Error al cargar las calificaciones');
      setGrades([]);
      setInactiveGrades([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = activeTab === 'active' ? [...grades] : [...inactiveGrades];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(grade => 
        grade.studentId?.toLowerCase().includes(search) ||
        grade.courseId?.toLowerCase().includes(search) ||
        grade.academicPeriod?.toLowerCase().includes(search) ||
        grade.evaluationType?.toLowerCase().includes(search) ||
        grade.remarks?.toLowerCase().includes(search)
      );
    }

    // Filtro por nivel de logro
    if (achievementLevelFilter !== 'all') {
      filtered = filtered.filter(grade => grade.achievementLevel === achievementLevelFilter);
    }

    // Filtro por período académico
    if (academicPeriodFilter !== 'all') {
      filtered = filtered.filter(grade => grade.academicPeriod === academicPeriodFilter);
    }

    setFilteredGrades(filtered);
  };

  /**
   * Abre modal para crear nueva calificación
   */
  const handleCreate = () => {
    setModalMode('create');
    setSelectedGrade(null);
    setModalVisible(true);
  };

  /**
   * Abre modal para editar calificación
   */
  const handleEdit = (grade) => {
    setModalMode('edit');
    setSelectedGrade(grade);
    setModalVisible(true);
  };

  /**
   * Muestra detalles de la calificación
   */
  const handleView = (grade) => {
    const levelInfo = AchievementLevel[grade.achievementLevel];
    const badgeClass = getAchievementLevelBadgeClass(grade.achievementLevel);
    
    // Crear contenido HTML estructurado para mejor visualización
    const details = (
      <div className="notification-details-preview">
        <div className="card mb-3">
          <div className="card-header text-white bg-primary">
            <h5 className="mb-0">
              <i className="fa fa-graduation-cap me-2"></i>
              Información del Estudiante
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-user me-2"></i>Estudiante:</strong>
                <p className="mb-0 text-muted">{grade.studentId}</p>
              </div>
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-book me-2"></i>Curso:</strong>
                <p className="mb-0 text-muted">{grade.courseId}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-calendar me-2"></i>Período Académico:</strong>
                <p className="mb-0 text-muted">{grade.academicPeriod}</p>
              </div>
              <div className="col-md-6 mb-2">
                <strong><i className="fa fa-clipboard-check me-2"></i>Tipo de Evaluación:</strong>
                <p className="mb-0 text-muted">{grade.evaluationType}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0"><i className="fa fa-chart-line me-2"></i>Nivel de Logro</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-12 mb-2">
                <strong>Calificación Obtenida:</strong>
                <p className="mb-2">
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '14px' }}>
                    {grade.achievementLevel} - {levelInfo?.name || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            <div className="alert alert-light border" style={{ 
              backgroundColor: '#f8f9fa',
              lineHeight: '1.6'
            }}>
              <strong>Descripción:</strong><br/>
              {levelInfo?.description || 'Sin descripción disponible'}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0"><i className="fa fa-comment me-2"></i>Observaciones</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-light border" style={{ 
              backgroundColor: '#f8f9fa',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {grade.remarks || 'Sin observaciones registradas'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-warning text-white">
            <h5 className="mb-0"><i className="fa fa-clock me-2"></i>Fecha de Evaluación</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12 mb-2">
                <strong>Fecha de Evaluación:</strong>
                <p className="mb-0 text-muted">{formatDate(grade.evaluationDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    showAlert({
      title: `Detalles de Calificación`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Ver notificaciones relacionadas con la calificación
   */
  const handleViewNotifications = (grade) => {
    navigate('/teacher/notifications');
  };

  /**
   * Maneja el cambio de pestañas
   */
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
  };

  /**
   * Elimina una calificación
   */
  const handleDelete = async (grade) => {
    showAlert({
      title: '¿Eliminar esta calificación?',
      message: `Se eliminará la calificación del estudiante "${grade.studentId}" en el curso "${grade.courseId}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await gradeService.deleteGrade(grade.id);
          if (response.success) {
            showSuccess('Calificación eliminada correctamente');
            loadGrades();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar la calificación');
        }
      },
    });
  };

  /**
   * Restaura una calificación eliminada
   */
  const handleRestore = async (grade) => {
    showAlert({
      title: '¿Restaurar esta calificación?',
      message: `Se restaurará la calificación del estudiante "${grade.studentId}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await gradeService.restoreGrade(grade.id);
          if (response.success) {
            showSuccess('Calificación restaurada correctamente');
            loadGrades();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar la calificación');
        }
      },
    });
  };

  /**
   * Restaura múltiples calificaciones seleccionadas
   */
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una calificación');
      return;
    }

    showAlert({
      title: `¿Restaurar ${selectedRowKeys.length} calificación(es)?`,
      message: 'Las calificaciones seleccionadas serán restauradas y volverán a estar disponibles.',
      type: 'info',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await gradeService.restoreGrade(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} calificación(es) restaurada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al restaurar ${errorCount} calificación(es)`);
          }

          setSelectedRowKeys([]);
          loadGrades();
        } catch (error) {
          showError('Error en la restauración masiva');
        }
      },
    });
  };

  /**
   * Maneja el éxito del modal (crear/editar)
   */
  const handleModalSuccess = (gradeData) => {
    loadGrades();
  };

  /**
   * Maneja la cancelación del modal
   */
  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedGrade(null);
  };

  /**
   * Exporta a Excel
   */
  const handleExportExcel = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToExcel(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a Excel');
    }
  };

  /**
   * Exporta a PDF
   */
  const handleExportPDF = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToPDF(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a PDF');
    }
  };

  /**
   * Exporta a CSV
   */
  const handleExportCSV = async () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = await GradeReportExporter.exportToCSV(dataToExport);
      if (result.success) {
        showSuccess(`Archivo ${result.fileName} descargado correctamente`);
      } else {
        showError('Error al exportar', result.error);
      }
    } catch (error) {
      showError('Error al exportar a CSV');
    }
  };

  /**
   * Imprime el reporte
   */
  const handlePrint = () => {
    try {
      const dataToExport = activeTab === 'active' ? grades : inactiveGrades;
      const result = GradeReportExporter.printReport(dataToExport);
      if (result.success) {
        showSuccess('Reporte enviado a impresión');
      } else {
        showError('Error al imprimir', result.error);
      }
    } catch (error) {
      showError('Error al imprimir el reporte');
    }
  };

  /**
   * Elimina múltiples calificaciones seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una calificación');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} calificación(es)?`,
      message: 'Las calificaciones seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await gradeService.deleteGrade(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} calificación(es) eliminada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} calificación(es)`);
          }

          setSelectedRowKeys([]);
          loadGrades();
        } catch (error) {
          showError('Error en la eliminación masiva');
        }
      },
    });
  };

  // Configuración de selección de filas
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
    }),
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Estudiante',
      dataIndex: 'studentId',
      key: 'studentId',
      sorter: (a, b) => a.studentId.localeCompare(b.studentId),
      render: (studentId) => (
        <div>
          <strong>{studentId}</strong>
        </div>
      ),
    },
    {
      title: 'Curso',
      dataIndex: 'courseId',
      key: 'courseId',
      sorter: (a, b) => a.courseId.localeCompare(b.courseId),
    },
    {
      title: 'Período',
      dataIndex: 'academicPeriod',
      key: 'academicPeriod',
      filters: Object.values(AcademicPeriod).map(period => ({
        text: period,
        value: period,
      })),
      onFilter: (value, record) => record.academicPeriod === value,
    },
    {
      title: 'Tipo Evaluación',
      dataIndex: 'evaluationType',
      key: 'evaluationType',
      render: (type) => (
        <span className="badge badge-info">{type}</span>
      ),
    },
    {
      title: 'Nivel de Logro',
      dataIndex: 'achievementLevel',
      key: 'achievementLevel',
      render: (level) => {
        const badgeClass = getAchievementLevelBadgeClass(level);
        const levelInfo = AchievementLevel[level];
        return (
          <Tooltip title={levelInfo?.description}>
            <span className={`badge ${badgeClass}`}>
              {level} - {levelInfo?.name}
            </span>
          </Tooltip>
        );
      },
      filters: Object.values(AchievementLevel).map(level => ({
        text: `${level.code} - ${level.name}`,
        value: level.code,
      })),
      onFilter: (value, record) => record.achievementLevel === value,
    },
    {
      title: 'Fecha Evaluación',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => handleView(record),
          }
        ];

        // Solo mostrar opciones de edición y eliminación para elementos activos
        if (activeTab === 'active') {
          items.push(
            {
              key: 'edit',
              label: 'Editar',
              icon: <EditOutlined />,
              onClick: () => handleEdit(record),
            },
            {
              key: 'notifications',
              label: 'Ver Notificaciones',
              icon: <BellOutlined />,
              onClick: () => handleViewNotifications(record),
            },
            {
              type: 'divider',
            },
            {
              key: 'delete',
              label: 'Eliminar',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            }
          );
        } else {
          // Solo mostrar restaurar para elementos inactivos
          items.push(
            {
              type: 'divider',
            },
            {
              key: 'restore',
              label: 'Restaurar',
              icon: <UndoOutlined />,
              onClick: () => handleRestore(record),
            }
          );
        }

        return (
          <Space size="middle">
            <Dropdown
              menu={{ items }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                icon={<MoreHorizontal size={16} />}
                onClick={(e) => e.preventDefault()}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Gestión de Calificaciones</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Calificaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas y filtros */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  {/* Pestañas para activos/inactivos */}
                  <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-3">
                    <TabPane tab={`Activas (${grades.length})`} key="active">
                    </TabPane>
                    <TabPane tab={`Eliminadas (${inactiveGrades.length})`} key="inactive">
                    </TabPane>
                  </Tabs>
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-3 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por estudiante, curso..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Nivel de logro"
                        value={achievementLevelFilter}
                        onChange={setAchievementLevelFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los niveles</Option>
                        {Object.values(AchievementLevel).map(level => (
                          <Option key={level.code} value={level.code}>
                            {level.code} - {level.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Período académico"
                        value={academicPeriodFilter}
                        onChange={setAcademicPeriodFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los períodos</Option>
                        {Object.values(AcademicPeriod).map(period => (
                          <Option key={period} value={period}>{period}</Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-5 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        {activeTab === 'active' && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            className="btn-sm"
                          >
                            Nueva Calificación
                          </Button>
                        )}
                        
                        {/* Botones de exportación */}
                        <Button.Group>
                          <Button 
                            icon={<i className="fa fa-file-excel" />}
                            onClick={handleExportExcel}
                            title="Exportar a Excel"
                            className="btn-sm"
                          >
                            Excel
                          </Button>
                          <Button 
                            icon={<i className="fa fa-file-pdf" />}
                            onClick={handleExportPDF}
                            title="Exportar a PDF"
                            className="btn-sm"
                          >
                            PDF
                          </Button>
                          <Button 
                            icon={<i className="fa fa-file-text" />}
                            onClick={handleExportCSV}
                            title="Exportar a CSV"
                            className="btn-sm"
                          >
                            CSV
                          </Button>
                          <Button 
                            icon={<i className="fa fa-print" />}
                            onClick={handlePrint}
                            title="Imprimir"
                            className="btn-sm"
                          >
                            Imprimir
                          </Button>
                        </Button.Group>
                        <Button
                          icon={<BellOutlined />}
                          onClick={() => navigate('/teacher/notifications')}
                          className="btn-sm"
                        >
                          Notificaciones
                        </Button>
                        {selectedRowKeys.length > 0 && activeTab === 'active' && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDelete}
                            className="btn-sm"
                          >
                            Eliminar ({selectedRowKeys.length})
                          </Button>
                        )}
                        {selectedRowKeys.length > 0 && activeTab === 'inactive' && (
                          <Button
                            type="primary"
                            icon={<UndoOutlined />}
                            onClick={handleBulkRestore}
                            className="btn-sm"
                          >
                            Restaurar ({selectedRowKeys.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de calificaciones */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredGrades}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredGrades.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} calificaciones`,
                      }}
                      scroll={{ x: 1000 }}
                      size="middle"
                    />
                  </div>
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

      {/* Modal de formulario */}
      <GradeFormModal
        visible={modalVisible}
        mode={modalMode}
        gradeData={selectedGrade}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />
    </>
  );
};

export default GradeList;