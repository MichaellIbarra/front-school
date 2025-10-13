/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Modal, Table, Select, Button, DatePicker, message, Spin, Tag, Divider } from "antd";
import { UsergroupAddOutlined, CheckOutlined, UserOutlined, CalendarOutlined, HomeOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";

const { Option } = Select;

const BulkEnrollmentModal = ({ visible, onCancel, onSuccess }) => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados de datos
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [enrollmentDate, setEnrollmentDate] = useState(dayjs());

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (visible) {
      loadUnEnrolledStudents();
      loadAvailableClassrooms();
      resetForm();
    }
  }, [visible]);

  /**
   * Resetea el formulario
   */
  const resetForm = () => {
    setSelectedStudentIds([]);
    setSelectedClassroom(null);
    setEnrollmentDate(dayjs());
  };

  /**
   * Carga las aulas disponibles desde el servidor
   */
  const loadAvailableClassrooms = async () => {
    console.log('🏫 Cargando aulas disponibles desde servidor...');
    
    try {
      const response = await enrollmentService.getAvailableClassrooms();
      
      if (response.success && response.data) {
        setClassrooms(response.data);
        console.log(`✅ Cargadas ${response.data.length} aulas disponibles`);
      } else {
        console.warn('⚠️ No se pudieron cargar aulas del servidor');
        setClassrooms([]);
        message.warning('No se pudieron cargar las aulas disponibles');
      }
    } catch (error) {
      console.error('❌ Error al cargar aulas:', error);
      setClassrooms([]);
      message.error('Error al cargar las aulas disponibles');
    }
  };

  /**
   * Carga estudiantes NO matriculados usando la misma lógica del formulario individual
   */
  const loadUnEnrolledStudents = async () => {
    setLoading(true);
    console.log('🔍 Cargando estudiantes NO matriculados usando lógica del formulario individual...');
    
    try {
      // Usar la misma función del servicio que usa el formulario individual
      const response = await studentService.getStudentsNotEnrolled();
      
      if (response.success) {
        const studentsData = response.data || [];
        
        console.log(`✅ Servicio getStudentsNotEnrolled(): ${studentsData.length} estudiantes NO matriculados`);
        setStudents(studentsData);
        
        if (studentsData.length === 0) {
          message.success('🎉 ¡Perfecto! Todos los estudiantes activos ya están matriculados');
        } else {
          message.success(`📋 ${studentsData.length} estudiantes sin matricular listos para seleccionar`);
        }
      } else {
        console.error('❌ Error en getStudentsNotEnrolled():', response.error);
        message.error(`Error al cargar estudiantes sin matricular: ${response.error}`);
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ Error crítico al cargar estudiantes:', error);
      message.error('Error de conexión. Verifica que el servidor esté disponible.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };



  /**
   * Maneja la selección de estudiantes en la tabla
   */
  const handleStudentSelection = (selectedRowKeys) => {
    setSelectedStudentIds(selectedRowKeys);
    console.log(`👥 Seleccionados ${selectedRowKeys.length} estudiantes:`, selectedRowKeys);
  };


  /**
   * Realiza la matrícula masiva usando el endpoint /api/v1/enrollments/bulk
   */
  const handleBulkEnrollment = async () => {
    // Validaciones
    if (selectedStudentIds.length === 0) {
      message.warning('⚠️ Selecciona al menos un estudiante para matricular');
      return;
    }

    if (!selectedClassroom) {
      message.warning('⚠️ Selecciona un aula para la matrícula');
      return;
    }

    setSubmitting(true);
    console.log(`🔄 Iniciando matrícula masiva de ${selectedStudentIds.length} estudiantes...`);

    try {
      // Generar números de matrícula correlativos de forma segura
      console.log(`🔄 Obteniendo último número antes de generar ${selectedStudentIds.length} matrículas...`);
      
      const lastNumberResponse = await enrollmentService.getLastEnrollmentNumber();
      let startingNumber = 1;
      
      if (lastNumberResponse.success && typeof lastNumberResponse.data === 'number' && lastNumberResponse.data > 0) {
        startingNumber = lastNumberResponse.data + 1;
        console.log(`📊 Último número correlativo encontrado: ${lastNumberResponse.data}, siguiente será: ${startingNumber}`);
      } else {
        console.log(`⚠️ No hay matrículas previas o error al obtener último número, iniciando desde: ${startingNumber}`);
      }
      
      const currentYear = dayjs().year();
      
      // Preparar datos para la matrícula masiva con números únicos garantizados
      const enrollments = selectedStudentIds.map((studentId, index) => {
        const correlativeNumber = startingNumber + index;
        const formattedNumber = correlativeNumber.toString().padStart(4, "0");
        const enrollmentNumber = `MAT-${currentYear}-${formattedNumber}`;
        
        return {
          studentId: studentId,
          classroomId: selectedClassroom,
          enrollmentNumber: enrollmentNumber,
          enrollmentDate: enrollmentDate.format('YYYY-MM-DD'),
          status: 'ACTIVE'
        };
      });
      
      console.log(`📋 Números de matrícula a crear:`, enrollments.map(e => e.enrollmentNumber));

      console.log('📤 Datos de matrícula masiva para /api/v1/enrollments/bulk:', enrollments);

      // Llamar al endpoint de matrícula masiva específico
      const response = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/enrollments/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ enrollments })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Matrícula masiva exitosa desde API directa:', result);
        
        message.success({
          content: `🎉 ${selectedStudentIds.length} estudiantes matriculados exitosamente en ${classrooms.find(c => c.id === selectedClassroom)?.name}`,
          duration: 5
        });
        
        // Cerrar modal y notificar éxito
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.warn('⚠️ API específica /api/v1/enrollments/bulk falló, usando método alternativo...');
        
        // Si falla la API específica, usar el método alternativo del servicio
        const serviceResponse = await enrollmentService.bulkCreateEnrollments(enrollments);
        
        if (serviceResponse.success) {
          message.success({
            content: `🎉 ${selectedStudentIds.length} estudiantes matriculados exitosamente (método alternativo)`,
            duration: 5
          });
          handleClose();
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error(serviceResponse.error || 'Error en matrícula masiva alternativa');
        }
      }
    } catch (error) {
      console.error('❌ Error en matrícula masiva:', error);
      message.error({
        content: `❌ Error al matricular estudiantes: ${error.message}`,
        duration: 8
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Cierra el modal y resetea estados
   */
  const handleClose = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  // Configuración de la tabla de estudiantes
  const columns = [
    {
      title: 'Estudiante',
      dataIndex: 'firstName',
      key: 'student',
      render: (firstName, record) => (
        <div>
          <div className="fw-bold text-primary">
            {firstName} {record.lastName}
          </div>
          <small className="text-muted">
            {record.documentType}: {record.documentNumber}
          </small>
        </div>
      ),
      width: 250,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || <span className="text-muted">No registrado</span>,
      width: 200,
    },
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || <span className="text-muted">No registrado</span>,
      width: 150,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>
          {status === 'ACTIVE' ? '✅ Activo' : status}
        </Tag>
      ),
      width: 100,
    },
  ];

  // Configuración de selección de filas
  const rowSelection = {
    selectedRowKeys: selectedStudentIds,
    onChange: handleStudentSelection,
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'ACTIVE', // Solo estudiantes activos
    }),
  };

  return (
    <Modal
      title={
        <div>
          <UsergroupAddOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
          <strong>Matrícula Masiva de Estudiantes</strong>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={null}
      destroyOnClose
      maskClosable={false}
    >
      <Spin spinning={loading}>
        <div className="bulk-enrollment-content">
          
          {/* Información del proceso */}
          <div className="mb-4 p-3 bg-light rounded border">
            <h6 className="mb-2 text-primary">
              <UserOutlined style={{ marginRight: '6px' }} />
              <strong>Proceso de Matrícula Masiva</strong>
            </h6>
            <p className="mb-1 text-muted">
              📋 Selecciona los estudiantes que deseas matricular y configura los detalles.
            </p>
            <p className="mb-0">
              <small className="text-info">
                💡 <strong>Tip:</strong> Solo se muestran estudiantes que NO están matriculados actualmente.
              </small>
            </p>
          </div>

          {/* Configuración de la matrícula */}
          <div className="mb-4">
            <h6 className="mb-3 text-secondary">
              <CalendarOutlined style={{ marginRight: '6px' }} />
              <strong>Configuración de Matrícula</strong>
            </h6>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">
                  <HomeOutlined style={{ marginRight: '6px' }} />
                  Aula de Destino *
                </label>
                <Select
                  placeholder="Selecciona un aula para matricular"
                  value={selectedClassroom}
                  onChange={setSelectedClassroom}
                  className="w-100"
                  size="large"
                  showSearch
                  loading={classrooms.length === 0}
                  notFoundContent={classrooms.length === 0 ? "Cargando aulas..." : "No hay aulas disponibles"}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {classrooms.map(classroom => (
                    <Option key={classroom.id} value={classroom.id}>
                      🏫 {classroom.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">
                  <CalendarOutlined style={{ marginRight: '6px' }} />
                  Fecha de Matrícula *
                </label>
                <DatePicker
                  value={enrollmentDate}
                  onChange={setEnrollmentDate}
                  className="w-100"
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder="Selecciona la fecha de matrícula"
                />
              </div>
            </div>
          </div>

          <Divider />

          {/* Tabla de estudiantes disponibles */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 text-secondary">
                <UserOutlined style={{ marginRight: '6px' }} />
                <strong>Estudiantes Disponibles para Matricular</strong>
              </h6>
              
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted">
                  📊 Total: <strong>{students.length}</strong> estudiantes
                </span>
                {selectedStudentIds.length > 0 && (
                  <Tag color="blue" style={{ fontSize: '12px', padding: '4px 8px' }}>
                    ✅ {selectedStudentIds.length} seleccionados
                  </Tag>
                )}
              </div>
            </div>

            <div className="border rounded">
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={students}
                rowKey="id"
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `📋 ${range[0]}-${range[1]} de ${total} estudiantes sin matricular`,
                }}
                scroll={{ x: 700 }}
                size="middle"
                locale={{
                  emptyText: loading 
                    ? '🔄 Cargando estudiantes...' 
                    : '🎉 ¡Excelente! No hay estudiantes sin matricular'
                }}
                className="mb-0"
              />
            </div>

            {students.length > 0 && selectedStudentIds.length === 0 && (
              <div className="text-center mt-3 p-2 bg-light rounded">
                <small className="text-muted">
                  💡 Selecciona los estudiantes usando las casillas de verificación para continuar
                </small>
              </div>
            )}
          </div>

          {/* Resumen de selección */}
          {selectedStudentIds.length > 0 && selectedClassroom && (
            <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25">
              <h6 className="text-primary mb-2">
                📋 <strong>Resumen de Matrícula</strong>
              </h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">Estudiantes seleccionados:</small><br/>
                  <strong className="text-primary">{selectedStudentIds.length} estudiantes</strong>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Aula de destino:</small><br/>
                  <strong className="text-success">
                    {classrooms.find(c => c.id === selectedClassroom)?.name || selectedClassroom}
                  </strong>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Fecha de matrícula:</small><br/>
                  <strong className="text-info">{enrollmentDate.format('DD/MM/YYYY')}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <Button 
              size="large" 
              onClick={handleClose}
              disabled={submitting}
            >
              ❌ Cancelar
            </Button>
            
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={submitting}
              disabled={selectedStudentIds.length === 0 || !selectedClassroom || submitting}
              onClick={handleBulkEnrollment}
              style={{ 
                backgroundColor: selectedStudentIds.length > 0 && selectedClassroom ? '#52c41a' : undefined,
                borderColor: selectedStudentIds.length > 0 && selectedClassroom ? '#52c41a' : undefined
              }}
            >
              {submitting 
                ? '⏳ Matriculando...' 
                : selectedStudentIds.length > 0 
                  ? `🎯 Matricular ${selectedStudentIds.length} Estudiantes` 
                  : '📋 Matricular Estudiantes'
              }
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default BulkEnrollmentModal;