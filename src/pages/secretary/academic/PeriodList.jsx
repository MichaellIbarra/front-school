import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Select, Dropdown, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import periodService from '../../../services/academic/periodService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { periodTypeFromBackend } from '../../../types/academic/period.types';
import academicExporter from '../../../utils/academic/academicExporter';
import { filterByStatus, searchItems, getStatusColor, getStatusText } from '../../../utils/academic/academicHelpers';
import PeriodFormModal from './PeriodFormModal';
import PeriodDetailModal from './PeriodDetailModal';

const { Option } = Select;

const PeriodList = () => {
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [filteredPeriods, setFilteredPeriods] = useState([]);
  
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  
  // Estados para el modal de detalle
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPeriodForDetail, setSelectedPeriodForDetail] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [periods, searchTerm, statusFilter, levelFilter]);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const response = await periodService.getAllPeriods();
      if (response.success) {
        // Convertir los tipos de período del backend al frontend
        const periodsWithConvertedTypes = (response.data || []).map(period => ({
          ...period,
          periodType: periodTypeFromBackend[period.periodType] || period.periodType
        }));
        setPeriods(periodsWithConvertedTypes);
      } else {
        showError(response.error || 'Error al cargar períodos académicos');
        setPeriods([]);
      }
    } catch (err) {
      showError('Error al cargar períodos académicos: ' + err.message);
      setPeriods([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...periods];
    filtered = filterByStatus(filtered, statusFilter);
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(p => p.level === levelFilter);
    }
    
    if (searchTerm) {
      filtered = searchItems(filtered, searchTerm, ['academicYear', 'period', 'level', 'periodType']);
    }

    setFilteredPeriods(filtered);
  };

  const handleDeletePeriod = async (id, displayName) => {
    showAlert({
      title: '¿Está seguro de eliminar este período?',
      message: `Se eliminará el período "${displayName}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await periodService.deletePeriod(id);
          if (response.success) {
            showSuccess('Período eliminado correctamente');
            loadPeriods();
          } else {
            showError(response.error || 'Error al eliminar período');
          }
        } catch (err) {
          showError('Error al eliminar período: ' + err.message);
        }
      }
    });
  };

  const handleExport = () => {
    try {
      const success = academicExporter.exportPeriods(filteredPeriods);
      if (success) {
        showSuccess('Períodos exportados exitosamente');
      } else {
        showError('Error al exportar períodos');
      }
    } catch (error) {
      showError('Error al exportar períodos: ' + error.message);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedPeriod(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenEditModal = (period) => {
    setSelectedPeriod(period);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPeriod(null);
  };

  const handleModalSuccess = () => {
    loadPeriods();
  };
  
  const handleOpenDetailModal = (period) => {
    setSelectedPeriodForDetail(period);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedPeriodForDetail(null);
  };

  const columns = [
    {
      title: 'Año Académico',
      dataIndex: 'academicYear',
      key: 'academicYear',
      width: 120,
      sorter: (a, b) => (a.academicYear || '').localeCompare(b.academicYear || ''),
    },
    {
      title: 'Nivel',
      dataIndex: 'level',
      key: 'level',
      width: 120,
    },
    {
      title: 'Período',
      dataIndex: 'period',
      key: 'period',
      width: 80,
      align: 'center',
    },
    {
      title: 'Tipo',
      dataIndex: 'periodType',
      key: 'periodType',
      width: 120,
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('es-PE') : '-',
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('es-PE') : '-',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Ver Detalles',
            icon: <EyeOutlined />,
            onClick: () => handleOpenDetailModal(record),
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleOpenEditModal(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeletePeriod(record.id, `${record.period}° ${record.periodType} - ${record.academicYear}`),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreHorizontal size={16} />} onClick={(e) => e.preventDefault()} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Gestión de Períodos Académicos</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                    <li className="breadcrumb-item active">Períodos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-4 col-md-6 col-sm-12 mb-2">
                      <Input
                        placeholder="Buscar por año, nivel, tipo..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select value={levelFilter} onChange={setLevelFilter} className="w-100">
                        <Option value="all">Todos los niveles</Option>
                        <Option value="INICIAL">Inicial</Option>
                        <Option value="PRIMARIA">Primaria</Option>
                        <Option value="SECUNDARIA">Secundaria</Option>
                        <Option value="SUPERIOR">Superior</Option>
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select value={statusFilter} onChange={setStatusFilter} className="w-100">
                        <Option value="all">Todos los estados</Option>
                        <Option value="A">Activo</Option>
                        <Option value="I">Inactivo</Option>
                      </Select>
                    </div>
                    <div className="col-lg-4 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={filteredPeriods.length === 0}>
                          Exportar
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                          Nuevo Período
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredPeriods}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredPeriods.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} períodos`,
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sidebar />
      <Header />
      <AlertModal alert={alertState} onConfirm={alertConfirm} onCancel={alertCancel} />
      
      <PeriodFormModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
        periodData={selectedPeriod}
        mode={modalMode}
      />
      
      <PeriodDetailModal
        visible={detailModalVisible}
        onCancel={handleCloseDetailModal}
        periodData={selectedPeriodForDetail}
      />
    </>
  );
};

export default PeriodList;
