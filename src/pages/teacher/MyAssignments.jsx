import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Empty, Spin, Row, Col } from 'antd';
import { 
  ReloadOutlined, 
  BookOutlined, 
  HomeOutlined, 
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import teacherAssignmentService from '../../services/academic/teacherAssignmentService';
import AlertModal from '../../components/AlertModal';
import useAlert from '../../hooks/useAlert';
import useTitle from '../../hooks/useTitle';

/**
 * Vista para que el docente vea sus asignaciones (TEACHER ROLE ONLY)
 * Basado en AcademicTeacherRest.java - GET /api/v1/teacher/my-assignments
 */
const MyAssignments = () => {
  useTitle('Mis Asignaciones - Docente');
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({
    teacherId: null,
    institutionId: null,
    total: 0
  });
  
  const { 
    alertState, 
    showError, 
    handleConfirm: alertConfirm, 
    handleCancel: alertCancel 
  } = useAlert();

  useEffect(() => {
    loadMyAssignments();
  }, []);

  /**
   * Cargar mis asignaciones como docente
   */
  const loadMyAssignments = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando mis asignaciones como docente...');
      const response = await teacherAssignmentService.getMyAssignments();
      
      if (response.success) {
        setAssignments(response.data || []);
        setTeacherInfo({
          teacherId: response.teacherId,
          institutionId: response.institutionId,
          total: response.total || 0
        });
        console.log('✅ Asignaciones cargadas:', response.data);
      } else {
        showError(response.error || 'Error al cargar asignaciones');
        setAssignments([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar asignaciones:', error);
      showError('Error al cargar las asignaciones');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener color para el card basado en el índice
   */
  const getCardColor = (index) => {
    const colors = [
      '#1976d2', // Azul
      '#388e3c', // Verde
      '#d32f2f', // Rojo
      '#f57c00', // Naranja
      '#7b1fa2', // Púrpura
      '#0097a7', // Cyan
    ];
    return colors[index % colors.length];
  };

  /**
   * Renderizar tag de estado
   */
  const renderStatusTag = (status) => {
    const statusMap = {
      'A': { color: 'success', text: 'ACTIVO' },
      'I': { color: 'default', text: 'INACTIVO' },
      'P': { color: 'warning', text: 'PENDIENTE' },
      'C': { color: 'error', text: 'CANCELADO' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <>
      <Header />
      <Sidebar activeClassName="my-assignments" />
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Mis Asignaciones</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/teacher/dashboard">Docente</Link>
                    </li>
                    <li className="breadcrumb-item active">Mis Asignaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        {/* Header con botón de recarga */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">
            <BookOutlined className="me-2" />
            Mis Cursos ({teacherInfo.total})
          </h4>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadMyAssignments}
            loading={loading}
          >
            Recargar
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spin size="large" tip="Cargando mis asignaciones..." />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <Empty
              description="No tienes asignaciones registradas"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <p className="text-muted mt-3">
                No se encontraron asignaciones para tu usuario.
                <br />
                Contacta con la secretaría académica si crees que esto es un error.
              </p>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {assignments.map((assignment, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={assignment.id}>
                <Card
                  hoverable
                  className="h-100"
                  cover={
                    <div 
                      className="p-4 text-white d-flex align-items-end"
                      style={{ 
                        background: getCardColor(index),
                        minHeight: '120px',
                        borderRadius: '8px 8px 0 0'
                      }}
                    >
                      <div className="w-100">
                        <h5 className="text-white mb-1 fw-bold">
                          {assignment.courseName || `Curso ${assignment.courseId}`}
                        </h5>
                        <p className="text-white mb-0 opacity-75">
                          <HomeOutlined className="me-1" />
                          {assignment.classroomName || `Aula ${assignment.classroomId}`}
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Período</small>
                      {renderStatusTag(assignment.status)}
                    </div>
                    <div className="fw-bold">
                      {assignment.periodName || `Período ${assignment.periodId}`}
                    </div>
                  </div>

                  {assignment.scheduleInfo && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">
                        <ClockCircleOutlined className="me-1" />
                        Horario
                      </small>
                      <div className="text-dark">{assignment.scheduleInfo}</div>
                    </div>
                  )}

                  <div className="border-top pt-3 mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <Button type="link" className="p-0">
                        <BookOutlined className="me-1" />
                        Ver detalles
                      </Button>
                      <small className="text-muted">
                        ID: {assignment.id}
                      </small>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </div>
    </>
  );
};

export default MyAssignments;
