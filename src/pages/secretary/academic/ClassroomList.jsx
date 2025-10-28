import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Dropdown, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { MoreHorizontal } from 'react-feather';
import classroomService from '../../../services/academic/classroomService';
import periodService from '../../../services/academic/periodService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { getStatusBadgeClass, getStatusText, getShiftText, formatDateTime } from '../../../types/academic/classroom.types';
import academicExporter from '../../../utils/academic/academicExporter';
import { filterByStatus, searchItems } from '../../../utils/academic/academicHelpers';
import ClassroomFormModal from './ClassroomFormModal';
import ClassroomDetailModal from './ClassroomDetailModal';

const { Option } = Select;

const ClassroomList = () => {
  const { alertState, showAlert, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredClassrooms, setFilteredClassrooms] = useState([]);
  const [headquarters, setHeadquarters] = useState({});
  
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  
  // Estados para el modal de detalle
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedClassroomForDetail, setSelectedClassroomForDetail] = useState(null);

  // Cargar aulas al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros cuando cambien los datos, búsqueda o filtros
  useEffect(() => {
    applyFilters();
  }, [classrooms, searchTerm, statusFilter]);

  /**
   * Cargar datos iniciales en el orden correcto
   */
  const loadInitialData = async () => {
    console.log('🚀 Iniciando loadInitialData...');
    try {
      // Primero cargar las sedes
      console.log('📍 Paso 1: Cargando sedes...');
      const headquartersMap = await loadHeadquarters();
      console.log('✅ Sedes cargadas, continuando con aulas...');
      
      // Luego cargar las aulas (que dependen de las sedes)
      console.log('🏫 Paso 2: Cargando aulas...');
      await loadClassrooms(headquartersMap);
      console.log('✅ Aulas cargadas completamente');
    } catch (error) {
      console.error('❌ Error en loadInitialData:', error);
    }
  };

  /**
   * Cargar sedes desde el endpoint
   * @returns {Promise<Object>} Mapa de sedes con ID como clave y nombre como valor
   */
  const loadHeadquarters = async () => {
    try {
      const response = await fetch(
        'https://lab.vallegrande.edu.pe/school/gateway/api/v1/headquarters/personal',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📍 Sedes cargadas:', data);
        
        // El endpoint puede retornar diferentes estructuras, verificar ambas
        let sedesArray = [];
        
        // Opción 1: { data: [...] }
        if (data.data && Array.isArray(data.data)) {
          sedesArray = data.data;
        }
        // Opción 2: { headquarters: [...] }
        else if (data.headquarters && Array.isArray(data.headquarters)) {
          sedesArray = data.headquarters;
        }
        // Opción 3: El objeto mismo es un array
        else if (Array.isArray(data)) {
          sedesArray = data;
        }
        
        // Convertir array a objeto para búsqueda rápida
        const headquartersMap = {};
        sedesArray.forEach(hq => {
          const displayName = hq.name || hq.headquartersName || hq.id;
          headquartersMap[hq.id] = displayName;
        });
        setHeadquarters(headquartersMap);
        console.log('🏢 Mapa de sedes:', headquartersMap);
        return headquartersMap; // Retornar el mapa para uso inmediato
      } else {
        console.error('Error al cargar sedes:', response.status);
        return {}; // Retornar objeto vacío en caso de error
      }
    } catch (err) {
      console.error('Error al cargar sedes:', err);
      return {}; // Retornar objeto vacío en caso de error
    }
  };

  /**
   * Cargar todas las aulas
   * @param {Object} headquartersMap - Mapa opcional de sedes (ID -> nombre)
   */
  const loadClassrooms = async (headquartersMap = null) => {
    console.log('🏫 === INICIO loadClassrooms ===');
    setLoading(true);
    try {
      // Usar el mapa pasado como parámetro o el del estado
      const sedesMap = headquartersMap || headquarters;
      console.log('🏢 Usando mapa de sedes:', sedesMap);
      console.log('🏢 Sedes disponibles (keys):', Object.keys(sedesMap));
      
      // Verificar headers antes de la llamada
      const userId = localStorage.getItem('user_id');
      const userRoles = localStorage.getItem('user_roles');
      const institutionData = localStorage.getItem('institution');
      
      console.log('🔍 Verificando datos de localStorage:', {
        userId,
        userRoles,
        institutionData: institutionData ? JSON.parse(institutionData) : null
      });
      
      // Cargar aulas
      const response = await classroomService.getAllClassrooms();
      console.log('📋 Respuesta completa de aulas:', response);
      console.log('📋 response.success:', response.success);
      console.log('📋 response.data:', response.data);
      console.log('📋 Array.isArray(response.data):', Array.isArray(response.data));
      
      if (response.success) {
        const classroomsData = Array.isArray(response.data) ? response.data : [];
        console.log('🏫 Aulas cargadas (length):', classroomsData.length);
        console.log('🏫 Aulas cargadas (data):', classroomsData);
        
        // Cargar períodos para enriquecer los datos
        const periodResponse = await periodService.getAllPeriods();
        const periods = periodResponse.success ? periodResponse.data : [];
        console.log('📅 Períodos cargados:', periods);
        
        // Enriquecer las aulas con los nombres de período y sede
        const enrichedClassrooms = classroomsData.map(classroom => {
          // Normalizar el periodId (trim y convertir a string)
          const classroomPeriodId = classroom.periodId ? String(classroom.periodId).trim() : null;
          
          // Buscar el período con normalización
          const period = periods.find(p => {
            const pId = p.id ? String(p.id).trim() : null;
            return pId === classroomPeriodId;
          });
          
          // Construir el nombre del período a partir de sus campos
          let periodName = null;
          if (period) {
            const periodTypeMap = {
              'BIMESTER': 'Bimestre',
              'TRIMESTER': 'Trimestre',
              'SEMESTER': 'Semestre',
              'ANNUAL': 'Anual'
            };
            const periodTypeName = periodTypeMap[period.periodType] || period.periodType;
            periodName = `${period.periodName} ${periodTypeName} - ${period.academicYear} (${period.level})`;
          }
          
          // Normalizar el headquarterId - COMPARACIÓN EXACTA
          const normalizedHeadquarterId = classroom.headquarterId ? String(classroom.headquarterId).trim() : null;
          const headquarterName = normalizedHeadquarterId ? (sedesMap[normalizedHeadquarterId] || 'Sede Desconocida') : 'Sede Desconocida';
          
          console.log(`🔍 Enriqueciendo aula sección ${classroom.section}:`, {
            headquarterIdOriginal: classroom.headquarterId,
            normalizedHeadquarterId: normalizedHeadquarterId,
            headquarterName: headquarterName,
            sedesMapKeys: Object.keys(sedesMap),
            found: !!sedesMap[normalizedHeadquarterId]
          });
          
          return {
            ...classroom,
            periodName: periodName,
            periodId: classroomPeriodId, // Asegurar que esté normalizado
            headquarterName: headquarterName
          };
        });
        
        console.log('✅ Aulas enriquecidas:', enrichedClassrooms);
        setClassrooms(enrichedClassrooms);
      } else {
        showError(response.error || 'Error al cargar aulas');
        setClassrooms([]);
      }
    } catch (err) {
      showError('Error al cargar aulas: ' + err.message);
      setClassrooms([]);
    }
    setLoading(false);
  };

  /**
   * Aplica filtros de búsqueda y estado
   */
  const applyFilters = () => {
    let filtered = [...classrooms];

    // Filtro por estado
    filtered = filterByStatus(filtered, statusFilter);

    // Filtro por texto de búsqueda
    if (searchTerm) {
      filtered = searchItems(filtered, searchTerm, ['section', 'classroomName', 'headquarterName', 'periodName']);
    }

    setFilteredClassrooms(filtered);
  };

  /**
   * Eliminar un aula
   */
  const handleDeleteClassroom = async (id, name) => {
    showAlert({
      title: '¿Está seguro de eliminar esta aula?',
      message: `Se eliminará el aula "${name}". Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await classroomService.deleteClassroom(id);
          if (response.success) {
            showSuccess('Aula eliminada correctamente');
            loadClassrooms();
          } else {
            showError(response.error || 'Error al eliminar aula');
          }
        } catch (err) {
          showError('Error al eliminar aula: ' + err.message);
        }
      }
    });
  };

  /**
   * Exportar aulas a Excel
   */
  const handleExport = () => {
    try {
      const success = academicExporter.exportClassrooms(filteredClassrooms);
      if (success) {
        showSuccess('Aulas exportadas exitosamente');
      } else {
        showError('Error al exportar aulas');
      }
    } catch (error) {
      showError('Error al exportar aulas: ' + error.message);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedClassroom(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const handleOpenEditModal = (classroom) => {
    setSelectedClassroom(classroom);
    setModalMode('edit');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedClassroom(null);
  };

  const handleModalSuccess = (updatedClassroom, isEdit) => {
    console.log('✅ Modal cerrado con éxito, actualizando datos...', { updatedClassroom, isEdit });
    
    if (isEdit && updatedClassroom && updatedClassroom.id) {
      // Actualizar el aula localmente en el estado
      setClassrooms(prevClassrooms => {
        return prevClassrooms.map(classroom => {
          if (classroom.id === updatedClassroom.id) {
            // Construir nombre del período si está disponible
            let periodName = classroom.periodName; // Mantener el existente por defecto
            
            return {
              ...classroom,
              ...updatedClassroom,
              // Resolver el nombre de la sede desde headquarters
              headquarterName: headquarters[updatedClassroom.headquarterId] || 'Sede Desconocida',
              // Mantener el periodName existente ya que no se está actualizando
              periodName: periodName
            };
          }
          return classroom;
        });
      });
      
      showSuccess('Aula actualizada exitosamente');
    } else {
      // Si es una creación nueva, recargar toda la lista
      showSuccess('Aula creada exitosamente');
      loadClassrooms();
    }
  };
  
  const handleOpenDetailModal = (classroom) => {
    setSelectedClassroomForDetail(classroom);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedClassroomForDetail(null);
  };

  // Configuración de columnas de la tabla
  const columns = [
    {
      title: 'Sección',
      dataIndex: 'section',
      key: 'section',
      render: (section) => (
        <strong>Sección {section}</strong>
      ),
      sorter: (a, b) => (a.section || '').localeCompare(b.section || ''),
      width: 100,
    },
    {
      title: 'Nombre del Aula',
      dataIndex: 'classroomName',
      key: 'classroomName',
      render: (text) => text || <span style={{color: '#999', fontStyle: 'italic'}}>Sin nombre</span>,
      sorter: (a, b) => (a.classroomName || '').localeCompare(b.classroomName || ''),
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Período',
      dataIndex: 'periodName',
      key: 'periodName',
      render: (text, record) => {
        // Debug temporal
        if (!text) {
          console.log('⚠️ Período no encontrado para aula:', {
            classroomId: record.id,
            section: record.section,
            periodId: record.periodId,
            periodName: record.periodName,
            fullRecord: record
          });
        }
        return text || <span style={{color: '#ff4d4f'}}>Sin período</span>;
      },
      sorter: (a, b) => (a.periodName || '').localeCompare(b.periodName || ''),
      ellipsis: true,
    },
    {
      title: 'Sede',
      dataIndex: 'headquarterName',
      key: 'headquarterName',
      render: (text) => text || '-',
      sorter: (a, b) => (a.headquarterName || '').localeCompare(b.headquarterName || ''),
      width: 140,
    },
    {
      title: 'Turno',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift) => getShiftText(shift),
      sorter: (a, b) => getShiftText(a.shift).localeCompare(getShiftText(b.shift)),
      width: 100,
      align: 'center',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusBadgeClass(status) === 'badge-success' ? 'green' : 'red'}>
          {getStatusText(status)}
        </Tag>
      ),
      sorter: (a, b) => (getStatusText(a.status) || '').localeCompare(getStatusText(b.status) || ''),
      width: 100,
      align: 'center',
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? formatDateTime(date) : '-',
      sorter: (a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      },
      width: 170,
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
            onClick: () => handleDeleteClassroom(record.id, `Sección ${record.section}`),
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
                  <h3 className="page-title">Gestión de Aulas</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Aulas</li>
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
                    <div className="col-lg-5 col-md-6 col-sm-12 mb-2">
                      <div className="top-nav-search">
                        <Input
                          placeholder="Buscar por sección, nombre, período o sede..."
                          prefix={<SearchOutlined />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
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
                        <Option value="A">Activo</Option>
                        <Option value="I">Inactivo</Option>
                      </Select>
                    </div>
                    <div className="col-lg-5 col-md-12 col-sm-12 mb-2">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleExport}
                          disabled={filteredClassrooms.length === 0}
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
                          Nueva Aula
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de aulas */}
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredClassrooms}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        total: filteredClassrooms.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} de ${total} aulas`,
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
      <ClassroomFormModal
        visible={modalVisible}
        onCancel={handleCloseModal}
        onSuccess={handleModalSuccess}
        classroomData={selectedClassroom}
        mode={modalMode}
      />
      
      {/* Modal de detalle */}
      <ClassroomDetailModal
        visible={detailModalVisible}
        onCancel={handleCloseDetailModal}
        classroomData={selectedClassroomForDetail}
      />
    </>
  );
};

export default ClassroomList;
