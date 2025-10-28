import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Tag,
  Dropdown,
  Card,
  Row,
  Col,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { MoreHorizontal, MessageSquare, Calendar, Users } from 'react-feather';
import { Link } from 'react-router-dom';

// Componentes locales
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AlertModal from '../../../components/AlertModal';
import AssignmentFormModal from './AssignmentFormModal';

// Hooks y servicios
import useAlert from '../../../hooks/useAlert';
import notificationsSecretaryService from '../../../services/notification/notificationsSecretaryService';

// Utilidades
import { formatDate, formatDateTime } from '../../../utils/dateUtils';

const { Option } = Select;

const AssignmentList = () => {
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados principales
  const [assignments, setAssignments] = useState([]);
  const [instances, setInstances] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [classroomFilter, setClassroomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros cuando cambien los datos o filtros
  useEffect(() => {
    applyFilters();
  }, [assignments, searchTerm, instanceFilter, classroomFilter, statusFilter]);

  /**
   * Cargar todos los datos iniciales
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🚀 Cargando datos iniciales...');
      
      // Cargar en paralelo todos los datos necesarios
      const [assignmentsResponse, instancesResponse, classroomsResponse] = await Promise.all([
        notificationsSecretaryService.getAssignments(),
        notificationsSecretaryService.getInstances(),
        notificationsSecretaryService.getClassrooms()
      ]);

      console.log('📋 Respuestas obtenidas:', {
        assignments: assignmentsResponse,
        instances: instancesResponse,
        classrooms: classroomsResponse
      });

      // Procesar asignaciones
      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data.assignments || []);
        console.log('✅ Asignaciones cargadas:', assignmentsResponse.data.assignments?.length || 0);
      } else {
        showError('Error al cargar asignaciones: ' + assignmentsResponse.error);
        setAssignments([]);
      }

      // Procesar instancias
      if (instancesResponse.success) {
        setInstances(instancesResponse.data.instances || []);
        console.log('✅ Instancias cargadas:', instancesResponse.data.instances?.length || 0);
      } else {
        showError('Error al cargar instancias: ' + instancesResponse.error);
        setInstances([]);
      }

      // Procesar aulas
      if (classroomsResponse.success) {
        setClassrooms(classroomsResponse.data.classrooms || []);
        console.log('✅ Aulas cargadas:', classroomsResponse.data.classrooms?.length || 0);
      } else {
        showError('Error al cargar aulas: ' + classroomsResponse.error);
        setClassrooms([]);
      }

    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      showError('Error al cargar los datos: ' + error.message);
    }
    setLoading(false);
  };

  /**
   * Aplicar filtros a las asignaciones
   */
  const applyFilters = () => {
    let filtered = [...assignments];

    // Filtro por instancia
    if (instanceFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.instance_id === instanceFilter);
    }

    // Filtro por aula
    if (classroomFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.classroom_id === classroomFilter);
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Filtro por texto de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => {
        const instance = getInstanceName(assignment.instance_id);
        const classroom = getClassroomName(assignment.classroom_id);
        
        return (
          instance.toLowerCase().includes(searchLower) ||
          classroom.toLowerCase().includes(searchLower) ||
          assignment.assignment_type.toLowerCase().includes(searchLower) ||
          assignment.assignment_date.includes(searchTerm)
        );
      });
    }

    setFilteredAssignments(filtered);
  };

  /**
   * Obtener nombre de instancia por ID
   */
  const getInstanceName = (instanceId) => {
    const instance = instances.find(inst => inst.id === instanceId);
    return instance ? instance.instance_name : 'Instancia no encontrada';
  };

  /**
   * Obtener nombre de aula por ID
   */
  const getClassroomName = (classroomId) => {
    const classroom = classrooms.find(cls => cls.id === classroomId);
    return classroom ? `Sección ${classroom.section} - ${classroom.classroomName}` : 'Aula no encontrada';
  };

  /**
   * Obtener objeto completo de instancia por ID
   */
  const getInstanceById = (instanceId) => {
    return instances.find(inst => inst.id === instanceId);
  };

  /**
   * Obtener objeto completo de aula por ID
   */
  const getClassroomById = (classroomId) => {
    return classrooms.find(cls => cls.id === classroomId);
  };

  /**
   * Abrir modal para crear nueva asignación
   */
  const handleOpenCreateModal = () => {
    setSelectedAssignment(null);
    setModalMode('create');
    setModalVisible(true);
  };

  /**
   * Abrir modal para editar asignación
   */
  const handleOpenEditModal = (assignment) => {
    setSelectedAssignment(assignment);
    setModalMode('edit');
    setModalVisible(true);
  };

  /**
   * Cerrar modal
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAssignment(null);
  };

  /**
   * Manejar éxito del modal
   */
  const handleModalSuccess = (updatedAssignment, isEdit) => {
    console.log('✅ Modal cerrado con éxito:', { updatedAssignment, isEdit });
    
    if (isEdit && updatedAssignment) {
      // Actualizar asignación localmente
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === updatedAssignment.id ? updatedAssignment : assignment
        )
      );
      showSuccess('Asignación actualizada exitosamente');
    } else {
      // Recargar todas las asignaciones para nuevas creaciones
      loadInitialData();
      showSuccess('Asignación creada exitosamente');
    }
    
    handleCloseModal();
  };

  /**
   * Eliminar asignación
   */
  const handleDeleteAssignment = async (assignmentId, instanceName, classroomName) => {
    showAlert({
      title: '¿Está seguro de eliminar esta asignación?',
      message: `Se eliminará la asignación de "${instanceName}" con "${classroomName}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Aquí iría la lógica de eliminación cuando esté implementada en el servicio
          console.log('🗑️ Eliminando asignación:', assignmentId);
          showSuccess('Asignación eliminada exitosamente');
          loadInitialData();
        } catch (error) {
          showError('Error al eliminar asignación: ' + error.message);
        }
      }
    });
  };

  /**
   * Recargar datos
   */
  const handleReload = () => {
    loadInitialData();
  };

  /**
   * Exportar asignaciones (placeholder)
   */
  const handleExport = () => {
    console.log('📊 Exportando asignaciones...', filteredAssignments);
    showSuccess('Función de exportación en desarrollo');
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Instancia WhatsApp',
      dataIndex: 'instance_id',
      key: 'instance_id',
      render: (instanceId) => {
        const instance = getInstanceById(instanceId);
        return (
          <div>
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              <MessageSquare size={14} style={{ marginRight: 6 }} />
              {getInstanceName(instanceId)}
            </div>
            {instance && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {instance.phone_number}
              </div>
            )}
          </div>
        );
      },
      width: 200,
      sorter: (a, b) => getInstanceName(a.instance_id).localeCompare(getInstanceName(b.instance_id)),
    },
    {
      title: 'Aula Asignada',
      dataIndex: 'classroom_id',
      key: 'classroom_id',
      render: (classroomId) => {
        const classroom = getClassroomById(classroomId);
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              <Users size={14} style={{ marginRight: 6 }} />
              {getClassroomName(classroomId)}
            </div>
            {classroom && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Turno: {classroom.shift === 'M' ? 'Mañana' : classroom.shift === 'T' ? 'Tarde' : 'Noche'}
              </div>
            )}
          </div>
        );
      },
      width: 200,
      sorter: (a, b) => getClassroomName(a.classroom_id).localeCompare(getClassroomName(b.classroom_id)),
    },
    {
      title: 'Tipo Asignación',
      dataIndex: 'assignment_type',
      key: 'assignment_type',
      render: (type) => (
        <Tag color={type === 'BROADCAST' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
      width: 130,
      align: 'center',
      sorter: (a, b) => a.assignment_type.localeCompare(b.assignment_type),
    },
    {
      title: 'Fecha Asignación',
      dataIndex: 'assignment_date',
      key: 'assignment_date',
      render: (date) => (
        <div>
          <Calendar size={14} style={{ marginRight: 6 }} />
          {formatDate(date)}
        </div>
      ),
      width: 150,
      sorter: (a, b) => new Date(a.assignment_date) - new Date(b.assignment_date),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'A' ? 'green' : 'red'}>
          {status === 'A' ? 'Activa' : 'Inactiva'}
        </Tag>
      ),
      width: 100,
      align: 'center',
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? formatDateTime(date) : '-',
      width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const instanceName = getInstanceName(record.instance_id);
        const classroomName = getClassroomName(record.classroom_id);
        
        const items = [
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
            onClick: () => handleDeleteAssignment(record.id, instanceName, classroomName),
          },
        ];

        return (
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
                  <h3 className="page-title">Asignaciones WhatsApp - Aulas</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/notifications">Notificaciones</Link>
                    </li>
                    <li className="breadcrumb-item active">Asignaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <Badge count={assignments.length} style={{ backgroundColor: '#52c41a' }}>
                      <div className="avatar avatar-md bg-success-light">
                        <i className="feather-users"></i>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="data-info">
                      <h6>Total Asignaciones</h6>
                      <h4>{assignments.length}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <Badge count={instances.length} style={{ backgroundColor: '#1890ff' }}>
                      <div className="avatar avatar-md bg-primary-light">
                        <MessageSquare size={20} />
                      </div>
                    </Badge>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="data-info">
                      <h6>Instancias Disponibles</h6>
                      <h4>{instances.length}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <Badge count={classrooms.length} style={{ backgroundColor: '#faad14' }}>
                      <div className="avatar avatar-md bg-warning-light">
                        <Users size={20} />
                      </div>
                    </Badge>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="data-info">
                      <h6>Aulas Disponibles</h6>
                      <h4>{classrooms.length}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <Badge count={assignments.filter(a => a.status === 'A').length} style={{ backgroundColor: '#52c41a' }}>
                      <div className="avatar avatar-md bg-success-light">
                        <i className="feather-check-circle"></i>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="data-info">
                      <h6>Asignaciones Activas</h6>
                      <h4>{assignments.filter(a => a.status === 'A').length}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Filtros y tabla */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  
                  {/* Filtros */}
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-3 col-md-6 col-sm-12 mb-2">
                      <Input
                        placeholder="Buscar asignaciones..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-100"
                      />
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por instancia"
                        value={instanceFilter}
                        onChange={setInstanceFilter}
                        className="w-100"
                      >
                        <Option value="all">Todas las instancias</Option>
                        {instances.map(instance => (
                          <Option key={instance.id} value={instance.id}>
                            {instance.instance_name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por aula"
                        value={classroomFilter}
                        onChange={setClassroomFilter}
                        className="w-100"
                      >
                        <Option value="all">Todas las aulas</Option>
                        {classrooms.map(classroom => (
                          <Option key={classroom.id} value={classroom.id}>
                            Sección {classroom.section} - {classroom.classroomName}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value="A">Activa</Option>
                        <Option value="I">Inactiva</Option>
                      </Select>
                    </div>
                    <div className="col-lg-3 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Tooltip title="Recargar datos">
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReload}
                            loading={loading}
                            className="btn-sm"
                          />
                        </Tooltip>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleExport}
                          disabled={filteredAssignments.length === 0}
                          className="btn-sm"
                        >
                          Exportar
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleOpenCreateModal}
                          className="btn-sm"
                        >
                          Nueva Asignación
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de asignaciones */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredAssignments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredAssignments.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} asignaciones`,
                      }}
                      scroll={{ x: 1200 }}
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
      <AssignmentFormModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
        assignmentData={selectedAssignment}
        mode={modalMode}
        instances={instances}
        classrooms={classrooms}
      />
    </>
  );
};

export default AssignmentList;