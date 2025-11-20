/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu, Card, Descriptions } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import { EnrollmentStatus, getEnrollmentStatusText, getEnrollmentStatusColor, formatEnrollmentDate, formatDateTime, arrayToDate } from "../../../types/enrollments/enrollments";
import { formatBirthDate, calculateAge } from "../../../types/students/students";

const { Option } = Select;

const StudentEnrollments = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (studentId) {
      loadStudentData();
      loadStudentEnrollments();
    }
  }, [studentId]);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [enrollments, searchText, statusFilter]);

  // Limpiar estados al desmontar el componente
  useEffect(() => {
    return () => {
      setStudent(null);
      setEnrollments([]);
      setFilteredEnrollments([]);
      setSelectedRowKeys([]);
    };
  }, []);

  /**
   * Carga los datos del estudiante
   */
  const loadStudentData = async () => {
    if (!studentId) return;
    
    try {
      const response = await studentService.getStudentById(studentId);
      if (response.success && response.data) {
        setStudent(response.data);
      } else {
        showError(`Error al cargar datos del estudiante: ${response.error}`);
        setStudent(null);
      }
    } catch (error) {
      console.error('Error al cargar datos del estudiante:', error);
      showError('Error al cargar datos del estudiante');
      setStudent(null);
    }
  };

  /**
   * Carga las matrículas del estudiante
   */
  const loadStudentEnrollments = async () => {
    if (!studentId) {
      console.warn('No se puede cargar matrículas sin ID de estudiante');
      return;
    }
    
    setLoading(true);
    try {
      const response = await enrollmentService.getEnrollmentsByStudent(studentId);
      if (response && response.success) {
        const enrollmentsData = Array.isArray(response.data) ? response.data : [];
        
        // Validar que cada matrícula tenga los campos requeridos
        const validEnrollments = enrollmentsData.filter(enrollment => 
          enrollment && 
          typeof enrollment === 'object' && 
          enrollment.id !== undefined && 
          enrollment.id !== null
        );
        
        setEnrollments(validEnrollments);
      } else {
        showError(`Error al cargar matrículas: ${response?.error || 'Respuesta inválida del servidor'}`);
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error al cargar matrículas:', error);
      showError('Error al cargar matrículas del estudiante: ' + (error.message || 'Error desconocido'));
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    if (!Array.isArray(enrollments)) {
      setFilteredEnrollments([]);
      return;
    }
    
    let filtered = [...enrollments];

    // Filtro por texto de búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(enrollment =>
        enrollment?.enrollmentNumber?.toLowerCase().includes(searchLower) ||
        enrollment?.classroomId?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment?.status === statusFilter);
    }

    setFilteredEnrollments(filtered);
  };

  /**
   * Maneja el cambio de estado de una matrícula
   */
  const handleStatusChange = async (enrollment, newStatus) => {
    if (!enrollment || !enrollment.id) {
      showError('Error: No se puede cambiar el estado de una matrícula sin ID válido');
      return;
    }

    const action = newStatus === EnrollmentStatus.ACTIVE ? 'activar' : 'cambiar estado de';
    
    showAlert(
      'Cambiar Estado',
      `¿Está seguro que desea ${action} la matrícula "${enrollment.enrollmentNumber}"?`,
      'warning',
      async () => {
        try {
          const response = await enrollmentService.updateEnrollmentStatus(enrollment.id, newStatus);
          if (response.success) {
            showSuccess(`Matrícula ${action === 'activar' ? 'activada' : 'actualizada'} exitosamente`);
            
            // Actualizar estado local inmediatamente para evitar problemas de DOM
            const updateEnrollment = (prev) => prev.map(e => 
              e.id === enrollment.id ? { ...e, status: newStatus } : e
            );
            setEnrollments(updateEnrollment);
            setFilteredEnrollments(updateEnrollment);
            
          } else {
            showError(`Error al ${action} la matrícula: ${response.error || 'Error desconocido'}`);
          }
        } catch (error) {
          console.error(`Error al ${action} matrícula:`, error);
          showError(`Error al ${action} la matrícula: ${error.message || 'Error desconocido'}`);
        }
      }
    );
  };

  /**
   * Navega a la vista de edición de matrícula
   */
  const handleEdit = (enrollment) => {
    navigate(`/secretary/enrollments/edit/${enrollment.id}`);
  };

  /**
   * Navega a la vista de detalles de matrícula
   */
  const handleView = (enrollment) => {
    navigate(`/secretary/enrollments/${enrollment.id}`);
  };

  /**
   * Maneja la eliminación de matrícula
   */
  const handleDelete = async (enrollment) => {
    if (!enrollment || !enrollment.id) {
      showError('Error: No se puede eliminar una matrícula sin ID válido');
      return;
    }

    showAlert(
      'Eliminar Matrícula',
      `¿Está seguro que desea eliminar la matrícula "${enrollment.enrollmentNumber}"? Esta acción no se puede deshacer.`,
      'error',
      async () => {
        try {
          const response = await enrollmentService.deleteEnrollment(enrollment.id);
          if (response.success) {
            showSuccess('Matrícula eliminada exitosamente');
            
            // Actualizar estado local inmediatamente para evitar problemas de DOM
            setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
            setFilteredEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
            
          } else {
            showError(`Error al eliminar la matrícula: ${response.error || 'Error desconocido'}`);
          }
        } catch (error) {
          console.error('Error al eliminar matrícula:', error);
          showError('Error al eliminar la matrícula: ' + (error.message || 'Error desconocido'));
        }
      }
    );
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      title: 'Número de Matrícula',
      dataIndex: 'enrollmentNumber',
      key: 'enrollmentNumber',
      sorter: (a, b) => a.enrollmentNumber.localeCompare(b.enrollmentNumber),
    },
    {
      title: 'Aula',
      dataIndex: 'classroomId',
      key: 'classroomId',
      sorter: (a, b) => a.classroomId.localeCompare(b.classroomId),
    },
    {
      title: 'Fecha de Matrícula',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      render: (date) => formatEnrollmentDate(date),
      sorter: (a, b) => {
        const dateA = arrayToDate(a.enrollmentDate);
        const dateB = arrayToDate(b.enrollmentDate);
        return dateA && dateB ? dateA - dateB : 0;
      },
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getEnrollmentStatusColor(status)}>
          {getEnrollmentStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'Activa', value: EnrollmentStatus.ACTIVE },
        { text: 'Inactiva', value: EnrollmentStatus.INACTIVE },
        { text: 'Completada', value: EnrollmentStatus.COMPLETED },
        { text: 'Transferida', value: EnrollmentStatus.TRANSFERRED },
        { text: 'Retirada', value: EnrollmentStatus.WITHDRAWN },
        { text: 'Suspendida', value: EnrollmentStatus.SUSPENDED },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date),
      sorter: (a, b) => {
        const dateA = arrayToDate(a.createdAt);
        const dateB = arrayToDate(b.createdAt);
        return dateA && dateB ? dateA - dateB : 0;
      },
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
          },
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'status',
            label: record.status === EnrollmentStatus.ACTIVE ? 'Desactivar' : 'Activar',
            icon: record.status === EnrollmentStatus.ACTIVE ? <CloseOutlined /> : <CheckOutlined />,
            onClick: () => handleStatusChange(record, record.status === EnrollmentStatus.ACTIVE ? EnrollmentStatus.INACTIVE : EnrollmentStatus.ACTIVE),
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <>
      <Header />
      <Sidebar activeClassName="enrollment-list" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Header con información del estudiante */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/secretary/students')}
                  style={{ marginBottom: 16 }}
                >
                  Volver a Estudiantes
                </Button>
                
                <h3 className="page-title">Matrículas del Estudiante</h3>
                
                {student && (
                  <Card style={{ marginBottom: 20 }}>
                    <Descriptions title="Información del Estudiante" column={2}>
                      <Descriptions.Item label="Nombre Completo">
                        {student.firstName} {student.lastName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Documento">
                        {student.documentType}: {student.documentNumber}
                      </Descriptions.Item>
                      <Descriptions.Item label="Fecha de Nacimiento">
                        {formatBirthDate(student.birthDate)} ({calculateAge(student.birthDate)} años)
                      </Descriptions.Item>
                      <Descriptions.Item label="Estado">
                        <Tag color={student.status === 'A' ? 'green' : 'red'}>
                          {student.status === 'A' ? 'Activo' : 'Inactivo'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
              </div>
              <div className="col-auto float-end ms-auto">
                <div className="btn-group btn-group-sm">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/secretary/enrollments/add?studentId=${studentId}`)}
                  >
                    Nueva Matrícula
                  </Button>
                  <Button 
                    onClick={() => navigate('/secretary/enrollments')}
                  >
                    Ver Todas las Matrículas
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  <div className="table-top">
                    <div className="search-set">
                      <div className="search-input">
                        <Input
                          placeholder="Buscar por número de matrícula o aula..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: 300 }}
                        />
                      </div>
                    </div>
                    <div className="wordset">
                      <Select
                        placeholder="Filtrar por estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 200 }}
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value={EnrollmentStatus.ACTIVE}>Activa</Option>
                        <Option value={EnrollmentStatus.INACTIVE}>Inactiva</Option>
                        <Option value={EnrollmentStatus.COMPLETED}>Completada</Option>
                        <Option value={EnrollmentStatus.TRANSFERRED}>Transferida</Option>
                        <Option value={EnrollmentStatus.WITHDRAWN}>Retirada</Option>
                        <Option value={EnrollmentStatus.SUSPENDED}>Suspendida</Option>
                      </Select>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredEnrollments}
                      rowKey={(record) => `enrollment-${record.id}`}
                      loading={loading}
                      rowSelection={rowSelection}
                      pagination={{
                        total: filteredEnrollments.length,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} matrículas`,
                        hideOnSinglePage: false,
                      }}
                      scroll={{ x: 1200 }}
                      locale={{
                        emptyText: 'No hay matrículas para mostrar'
                      }}
                      size="middle"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertConfirm}
        onCancel={alertCancel}
      />
    </>
  );
};

export default StudentEnrollments;