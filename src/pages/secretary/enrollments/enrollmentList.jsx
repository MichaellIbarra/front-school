/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Input, Select, Space, Dropdown, Tag, Tooltip, Menu } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import FeatherIcon from "feather-icons-react";
import { MoreHorizontal, Filter } from "react-feather";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import { EnrollmentStatus, getEnrollmentStatusText, getEnrollmentStatusColor, formatEnrollmentDate, formatDateTime, arrayToDate } from "../../../types/enrollments/enrollments";

const { Option } = Select;

const EnrollmentList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);

  // Cargar matrículas al montar el componente
  useEffect(() => {
    loadEnrollments();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [enrollments, searchText, statusFilter]);

  /**
   * Carga todas las matrículas desde el servicio
   */
  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const response = await enrollmentService.getAllEnrollments();
      if (response.success) {
        setEnrollments(response.data);
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setEnrollments([]);
      }
    } catch (error) {
      showError('Error al cargar las matrículas');
      setEnrollments([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...enrollments];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(enrollment => 
        enrollment.enrollmentNumber?.toLowerCase().includes(search) ||
        enrollment.classroomId?.toLowerCase().includes(search) ||
        enrollment.studentId?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    setFilteredEnrollments(filtered);
  };

  /**
   * Navega al formulario de crear nueva matrícula
   */
  const handleCreate = () => {
    navigate('/secretary/enrollments/add');
  };

  /**
   * Navega al formulario de editar matrícula
   */
  const handleEdit = (enrollment) => {
    navigate(`/secretary/enrollments/edit/${enrollment.id}`, { 
      state: { enrollment } 
    });
  };

  /**
   * Muestra detalles de la matrícula
   */
  const handleView = (enrollment) => {
    const details = `
Número de Matrícula: ${enrollment.enrollmentNumber}
ID del Estudiante: ${enrollment.studentId}
ID del Aula: ${enrollment.classroomId}
Fecha de Matrícula: ${formatEnrollmentDate(enrollment.enrollmentDate)}
Estado: ${getEnrollmentStatusText(enrollment.status)}
Creado: ${formatDateTime(enrollment.createdAt)}
    `.trim();

    showAlert({
      title: `Detalles de Matrícula ${enrollment.enrollmentNumber}`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Cambia el estado de una matrícula
   */
  const handleChangeStatus = (enrollment, newStatus) => {
    const statusText = getEnrollmentStatusText(newStatus);
    
    showAlert({
      title: `¿Cambiar estado a ${statusText}?`,
      message: `Se cambiará el estado de la matrícula "${enrollment.enrollmentNumber}" a ${statusText}`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.updateEnrollmentStatus(enrollment.id, newStatus);
          if (response.success) {
            showSuccess(`Estado actualizado a ${statusText} correctamente`);
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al actualizar el estado');
        }
      },
    });
  };

  /**
   * Elimina una matrícula
   */
  const handleDelete = async (enrollment) => {
    showAlert({
      title: '¿Eliminar esta matrícula?',
      message: `Se eliminará la matrícula "${enrollment.enrollmentNumber}". Esta acción se puede revertir.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.deleteEnrollment(enrollment.id);
          if (response.success) {
            showSuccess('Matrícula eliminada correctamente');
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar la matrícula');
        }
      },
    });
  };

  /**
   * Restaura una matrícula eliminada
   */
  const handleRestore = async (enrollment) => {
    showAlert({
      title: '¿Restaurar esta matrícula?',
      message: `Se restaurará la matrícula "${enrollment.enrollmentNumber}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await enrollmentService.restoreEnrollment(enrollment.id);
          if (response.success) {
            showSuccess('Matrícula restaurada correctamente');
            loadEnrollments();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar la matrícula');
        }
      },
    });
  };

  /**
   * Elimina múltiples matrículas seleccionadas
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos una matrícula');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} matrícula(s)?`,
      message: 'Las matrículas seleccionadas serán eliminadas. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await enrollmentService.deleteEnrollment(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} matrícula(s) eliminada(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} matrícula(s)`);
          }

          setSelectedRowKeys([]);
          loadEnrollments();
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
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Número de Matrícula',
      dataIndex: 'enrollmentNumber',
      key: 'enrollmentNumber',
      sorter: (a, b) => a.enrollmentNumber.localeCompare(b.enrollmentNumber),
    },
    {
      title: 'Estudiante',
      dataIndex: 'studentId',
      key: 'studentId',
      render: (studentId) => (
        <div>
          <small className="text-muted">ID: {studentId}</small>
        </div>
      ),
    },
    {
      title: 'Aula',
      dataIndex: 'classroomId',
      key: 'classroomId',
      render: (classroomId) => (
        <div>
          <small>{classroomId}</small>
        </div>
      ),
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
            type: 'divider',
          },
          {
            key: 'active',
            label: 'Marcar como Activa',
            icon: <CheckOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.ACTIVE),
            disabled: record.status === EnrollmentStatus.ACTIVE,
          },
          {
            key: 'completed',
            label: 'Marcar como Completada',
            icon: <CheckOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.COMPLETED),
            disabled: record.status === EnrollmentStatus.COMPLETED,
          },
          {
            key: 'cancelled',
            label: 'Cancelar',
            icon: <CloseOutlined />,
            onClick: () => handleChangeStatus(record, EnrollmentStatus.CANCELLED),
            disabled: record.status === EnrollmentStatus.CANCELLED,
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record),
            danger: true,
          },
        ];

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
                  <h3 className="page-title">Gestión de Matrículas</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Matrículas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card card-table">
                <div className="card-body">
                  <div className="row mb-3 mt-3">
                    <div className="col-lg-4 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por número, estudiante, aula..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Filtrar por estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value={EnrollmentStatus.ACTIVE}>Activa</Option>
                        <Option value={EnrollmentStatus.INACTIVE}>Inactiva</Option>
                        <Option value={EnrollmentStatus.COMPLETED}>Completada</Option>
                        <Option value={EnrollmentStatus.CANCELLED}>Cancelada</Option>
                      </Select>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          className="btn-sm"
                        >
                          Nueva Matrícula
                        </Button>
                        <Button
                          icon={<UserOutlined />}
                          onClick={() => navigate('/secretary/students')}
                          className="btn-sm"
                        >
                          Estudiantes
                        </Button>
                        <Button
                          icon={<FileTextOutlined />}
                          onClick={() => navigate('/secretary/enrollments/bulk')}
                          className="btn-sm"
                        >
                          Carga Masiva
                        </Button>
                        {selectedRowKeys.length > 0 && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDelete}
                            className="btn-sm"
                          >
                            Eliminar ({selectedRowKeys.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de matrículas */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredEnrollments}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredEnrollments.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} matrículas`,
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
    </>
  );
};

export default EnrollmentList;