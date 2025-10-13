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
import studentService from "../../../services/students/studentService";
import { StudentStatus, Gender, getStatusText, getStatusColor, formatBirthDate, calculateAge, formatDateTime, arrayToDate } from "../../../types/students/students";

// Suprimir warning de compatibilidad de Ant Design con React 19
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('antd: compatible')) return;
  originalWarn(...args);
};

const { Option } = Select;

const StudentList = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    loadStudents();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [students, searchText, statusFilter, genderFilter]);

  /**
   * Carga todos los estudiantes desde el servicio
   */
  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await studentService.getAllStudents();
      if (response.success) {
        setStudents(response.data);
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError(response.error);
        setStudents([]);
      }
    } catch (error) {
      showError('Error al cargar los estudiantes');
      setStudents([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda, estado y género
   */
  const applyFilters = () => {
    let filtered = [...students];

    // Filtro por texto de búsqueda
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName?.toLowerCase().includes(search) ||
        student.lastName?.toLowerCase().includes(search) ||
        student.documentNumber?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Filtro por género
    if (genderFilter !== 'all') {
      filtered = filtered.filter(student => student.gender === genderFilter);
    }

    setFilteredStudents(filtered);
  };

  /**
   * Navega al formulario de crear nuevo estudiante
   */
  const handleCreate = () => {
    navigate('/secretary/students/add');
  };

  /**
   * Navega al formulario de editar estudiante
   */
  const handleEdit = (student) => {
    navigate(`/secretary/students/edit/${student.id}`, { 
      state: { student } 
    });
  };

  /**
   * Muestra detalles del estudiante
   */
  const handleView = (student) => {
    const age = calculateAge(student.birthDate);
    const details = `
Documento: ${student.documentType} ${student.documentNumber}
Fecha de Nacimiento: ${formatBirthDate(student.birthDate)} (${age} años)
Género: ${student.gender === 'MALE' ? 'Masculino' : 'Femenino'}
Dirección: ${student.address}
Distrito: ${student.district}, ${student.province}, ${student.department}
Teléfono: ${student.phone || 'No registrado'}
Email: ${student.email || 'No registrado'}

APODERADO:
Nombre: ${student.guardianName} ${student.guardianLastName}
Documento: ${student.guardianDocumentType} ${student.guardianDocumentNumber}
Teléfono: ${student.guardianPhone || 'No registrado'}
Email: ${student.guardianEmail || 'No registrado'}
Relación: ${student.guardianRelationship}

Estado: ${getStatusText(student.status)}
Creado: ${formatDateTime(student.createdAt)}
    `.trim();

    showAlert({
      title: `Detalles de ${student.firstName} ${student.lastName}`,
      message: details,
      type: 'info',
      showCancel: false,
      confirmText: 'Cerrar'
    });
  };

  /**
   * Cambia el estado de un estudiante
   */
  const handleToggleStatus = async (student) => {
    const newStatus = student.status === StudentStatus.ACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE;
    const action = newStatus === StudentStatus.ACTIVE ? 'activar' : 'desactivar';
    
    showAlert({
      title: `¿Estás seguro de ${action} este estudiante?`,
      message: `Se ${action}á al estudiante "${student.firstName} ${student.lastName}"`,
      type: 'warning',
      onConfirm: async () => {
        try {
          let response;
          
          if (newStatus === StudentStatus.ACTIVE) {
            // Para activar, usar restoreStudent
            response = await studentService.restoreStudent(student.id);
          } else {
            // Para desactivar, usar deactivateStudent
            response = await studentService.deactivateStudent(student.id);
          }
          
          if (response.success) {
            showSuccess(`Estudiante ${action}do correctamente`);
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          console.error(`Error al ${action} estudiante:`, error);
          showError(`Error al ${action} el estudiante`);
        }
      },
    });
  };

  /**
   * Elimina un estudiante
   */
  const handleDelete = async (student) => {
    showAlert({
      title: '¿Eliminar este estudiante?',
      message: `Se eliminará al estudiante "${student.firstName} ${student.lastName}". Esta acción se puede revertir.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await studentService.deleteStudent(student.id);
          if (response.success) {
            showSuccess('Estudiante eliminado correctamente');
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al eliminar el estudiante');
        }
      },
    });
  };

  /**
   * Restaura un estudiante eliminado
   */
  const handleRestore = async (student) => {
    showAlert({
      title: '¿Restaurar este estudiante?',
      message: `Se restaurará al estudiante "${student.firstName} ${student.lastName}"`,
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await studentService.restoreStudent(student.id);
          if (response.success) {
            showSuccess('Estudiante restaurado correctamente');
            loadStudents();
          } else {
            showError(response.error);
          }
        } catch (error) {
          showError('Error al restaurar el estudiante');
        }
      },
    });
  };

  /**
   * Elimina múltiples estudiantes seleccionados
   */
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      showWarning('Selecciona al menos un estudiante');
      return;
    }

    showAlert({
      title: `¿Eliminar ${selectedRowKeys.length} estudiante(s)?`,
      message: 'Los estudiantes seleccionados serán eliminados. Esta acción se puede revertir.',
      type: 'warning',
      onConfirm: async () => {
        try {
          let successCount = 0;
          let errorCount = 0;

          for (const id of selectedRowKeys) {
            const response = await studentService.deleteStudent(id);
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showSuccess(`${successCount} estudiante(s) eliminado(s) correctamente`);
          }
          if (errorCount > 0) {
            showError(`Error al eliminar ${errorCount} estudiante(s)`);
          }

          setSelectedRowKeys([]);
          loadStudents();
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
      title: 'Estudiante',
      dataIndex: 'firstName',
      key: 'student',
      render: (text, record) => (
        <div>
          <strong>{record.firstName} {record.lastName}</strong>
          <br />
          <small className="text-muted">{record.documentType}: {record.documentNumber}</small>
        </div>
      ),
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Edad/Género',
      key: 'ageGender',
      render: (_, record) => {
        const age = calculateAge(record.birthDate);
        return (
          <div>
            <div>{age} años</div>
            <small className="text-muted">{record.gender === 'MALE' ? 'Masculino' : 'Femenino'}</small>
          </div>
        );
      },
      sorter: (a, b) => calculateAge(a.birthDate) - calculateAge(b.birthDate),
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><small>{record.email || 'Sin email'}</small></div>
          <div><small>{record.phone || 'Sin teléfono'}</small></div>
        </div>
      ),
    },
    {
      title: 'Apoderado',
      key: 'guardian',
      render: (_, record) => (
        <div>
          <div><small>{record.guardianName} {record.guardianLastName}</small></div>
          <div><small>{record.guardianPhone || 'Sin teléfono'}</small></div>
        </div>
      ),
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
      filters: [
        { text: 'Activo', value: StudentStatus.ACTIVE },
        { text: 'Inactivo', value: StudentStatus.INACTIVE },
        { text: 'Transferido', value: StudentStatus.TRANSFERRED },
        { text: 'Graduado', value: StudentStatus.GRADUATED },
        { text: 'Fallecido', value: StudentStatus.DECEASED },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Fecha Registro',
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
            key: 'enrollments',
            label: 'Matrículas',
            icon: <UserOutlined />,
            onClick: () => navigate(`/secretary/students/${record.id}/enrollments`),
          },
          {
            key: 'toggle',
            label: record.status === StudentStatus.ACTIVE ? 'Desactivar' : 'Activar',
            icon: record.status === StudentStatus.ACTIVE ? <CloseOutlined /> : <CheckOutlined />,
            onClick: () => handleToggleStatus(record),
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
                  <h3 className="page-title">Gestión de Estudiantes</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Estudiantes</li>
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
                    <div className="col-lg-3 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por nombre, documento, email..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-100"
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los estados</Option>
                        <Option value={StudentStatus.ACTIVE}>Activo</Option>
                        <Option value={StudentStatus.INACTIVE}>Inactivo</Option>
                        <Option value={StudentStatus.TRANSFERRED}>Transferido</Option>
                        <Option value={StudentStatus.GRADUATED}>Graduado</Option>
                        <Option value={StudentStatus.DECEASED}>Fallecido</Option>
                      </Select>
                    </div>
                    <div className="col-lg-2 col-md-3 col-sm-6 mb-2">
                      <Select
                        placeholder="Género"
                        value={genderFilter}
                        onChange={setGenderFilter}
                        className="w-100"
                      >
                        <Option value="all">Todos los géneros</Option>
                        <Option value={Gender.MALE}>Masculino</Option>
                        <Option value={Gender.FEMALE}>Femenino</Option>
                      </Select>
                    </div>
                    <div className="col-lg-5 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleCreate}
                          className="btn-sm"
                        >
                          Nuevo Estudiante
                        </Button>
                        <Button
                          icon={<UserOutlined />}
                          onClick={() => navigate('/secretary/enrollments')}
                          className="btn-sm"
                        >
                          Matrículas
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

                  {/* Tabla de estudiantes */}
                  <div className="table-responsive">
                    <Table
                      rowSelection={rowSelection}
                      columns={columns}
                      dataSource={filteredStudents}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredStudents.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} estudiantes`,
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
    </>
  );
};

export default StudentList;