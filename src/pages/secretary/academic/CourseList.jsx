import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Select, Dropdown, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import courseService from '../../../services/academic/courseService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import academicExporter from '../../../utils/academic/academicExporter';
import { filterByStatus, searchItems, getStatusColor, getStatusText } from '../../../utils/academic/academicHelpers';
import CourseFormModal from './CourseFormModal';
import CourseDetailModal from './CourseDetailModal';

const { Option } = Select;

const CourseList = () => {
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [filteredCourses, setFilteredCourses] = useState([]);
  
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  
  // Estados para el modal de detalle
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, statusFilter, levelFilter]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAllCourses();
      if (response.success) {
        setCourses(Array.isArray(response.data) ? response.data : []);
      } else {
        showError(response.error || 'Error al cargar cursos');
        setCourses([]);
      }
    } catch (err) {
      showError('Error al cargar cursos: ' + err.message);
      setCourses([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...courses];
    filtered = filterByStatus(filtered, statusFilter);
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(c => c.level === levelFilter);
    }
    
    if (searchTerm) {
      filtered = searchItems(filtered, searchTerm, ['courseCode', 'courseName', 'description']);
    }

    setFilteredCourses(filtered);
  };

  const handleDeleteCourse = async (id, name) => {
    showAlert({
      title: '¿Está seguro de eliminar este curso?',
      message: `Se eliminará el curso "${name}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await courseService.deleteCourse(id);
          if (response.success) {
            showSuccess('Curso eliminado correctamente');
            loadCourses();
          } else {
            showError(response.error || 'Error al eliminar curso');
          }
        } catch (err) {
          showError('Error al eliminar curso: ' + err.message);
        }
      }
    });
  };

  const handleExport = () => {
    try {
      const success = academicExporter.exportCourses(filteredCourses);
      if (success) {
        showSuccess('Cursos exportados exitosamente');
      } else {
        showError('Error al exportar cursos');
      }
    } catch (error) {
      showError('Error al exportar cursos: ' + error.message);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedCourse(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourse(course);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
  };

  const handleModalSuccess = () => {
    loadCourses();
  };
  
  const handleOpenDetailModal = (course) => {
    setSelectedCourseForDetail(course);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedCourseForDetail(null);
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'courseCode',
      key: 'courseCode',
      sorter: (a, b) => (a.courseCode || '').localeCompare(b.courseCode || ''),
      width: 100,
    },
    {
      title: 'Nombre',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          {record.description && (
            <>
              <br />
              <small className="text-muted">{record.description}</small>
            </>
          )}
        </div>
      ),
      sorter: (a, b) => (a.courseName || '').localeCompare(b.courseName || ''),
      ellipsis: true,
    },
    {
      title: 'Nivel',
      dataIndex: 'level',
      key: 'level',
      width: 150,
      sorter: (a, b) => (a.level || '').localeCompare(b.level || ''),
    },
    {
      title: 'Horas/Semana',
      dataIndex: 'hoursPerWeek',
      key: 'hoursPerWeek',
      width: 140,
      align: 'center',
      sorter: (a, b) => (a.hoursPerWeek || 0) - (b.hoursPerWeek || 0),
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
      align: 'center',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'right',
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
            onClick: () => handleDeleteCourse(record.id, record.courseName),
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
                  <h3 className="page-title">Gestión de Cursos</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                    <li className="breadcrumb-item active">Cursos</li>
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
                        placeholder="Buscar por código, nombre..."
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
                        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={filteredCourses.length === 0}>
                          Exportar
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                          Nuevo Curso
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredCourses}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredCourses.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} cursos`,
                      }}
                      scroll={{ x: 900 }}
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
      
      <CourseFormModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
        courseData={selectedCourse}
        mode={modalMode}
      />
      
      <CourseDetailModal
        visible={detailModalVisible}
        onCancel={handleCloseDetailModal}
        courseData={selectedCourseForDetail}
      />
    </>
  );
};

export default CourseList;
