import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Spin } from 'antd';
import { 
  BookOutlined, 
  HomeOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';
import classroomService from '../../../services/academic/classroomService';
import courseService from '../../../services/academic/courseService';
import periodService from '../../../services/academic/periodService';
import teacherAssignmentService from '../../../services/academic/teacherAssignmentService';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { generateStats } from '../../../utils/academic/academicHelpers';

const AcademicDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    classrooms: { total: 0, active: 0 },
    courses: { total: 0, active: 0 },
    periods: { total: 0, active: 0 },
    assignments: { total: 0, active: 0 }
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [classroomsRes, coursesRes, periodsRes, assignmentsRes] = await Promise.all([
        classroomService.getAllClassrooms(),
        courseService.getAllCourses(),
        periodService.getAllPeriods(),
        teacherAssignmentService.getAllTeacherAssignments()
      ]);

      const classroomStats = classroomsRes.success ? generateStats(classroomsRes.data) : { total: 0, active: 0 };
      const courseStats = coursesRes.success ? generateStats(coursesRes.data) : { total: 0, active: 0 };
      const periodStats = periodsRes.success ? generateStats(periodsRes.data) : { total: 0, active: 0 };
      const assignmentStats = assignmentsRes.success ? generateStats(assignmentsRes.data) : { total: 0, active: 0 };

      setStats({
        classrooms: classroomStats,
        courses: courseStats,
        periods: periodStats,
        assignments: assignmentStats
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
    setLoading(false);
  };

  const moduleCards = [
    {
      title: 'Aulas',
      icon: <HomeOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      total: stats.classrooms.total,
      active: stats.classrooms.active,
      color: '#1890ff',
      path: '/secretary/academic/classrooms',
      description: 'Gestionar aulas de la institución'
    },
    {
      title: 'Cursos',
      icon: <BookOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      total: stats.courses.total,
      active: stats.courses.active,
      color: '#52c41a',
      path: '/secretary/academic/courses',
      description: 'Gestionar cursos académicos'
    },
    {
      title: 'Períodos',
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      total: stats.periods.total,
      active: stats.periods.active,
      color: '#faad14',
      path: '/secretary/academic/periods',
      description: 'Gestionar períodos académicos'
    },
    {
      title: 'Asignaciones',
      icon: <TeamOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      total: stats.assignments.total,
      active: stats.assignments.active,
      color: '#722ed1',
      path: '/secretary/academic/teacher-assignments',
      description: 'Gestionar asignaciones docentes'
    }
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
                  <h3 className="page-title">Gestión Académica</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Académico</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <Row gutter={[16, 16]}>
                {moduleCards.map((module, index) => (
                  <Col xs={24} sm={12} md={12} lg={6} key={index}>
                    <Card 
                      hoverable
                      onClick={() => navigate(module.path)}
                      style={{ borderTop: `4px solid ${module.color}` }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="text-muted mb-1">{module.title}</p>
                          <Statistic 
                            value={module.total} 
                            valueStyle={{ fontSize: 28 }}
                          />
                          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                            {module.active} activos
                          </p>
                        </div>
                        <div>{module.icon}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Module Cards */}
              <Row gutter={[16, 16]} className="mt-4">
                {moduleCards.map((module, index) => (
                  <Col xs={24} sm={12} md={12} lg={6} key={index}>
                    <Card 
                      title={
                        <div className="d-flex align-items-center">
                          {module.icon}
                          <span className="ms-2">{module.title}</span>
                        </div>
                      }
                      extra={
                        <Button 
                          type="link" 
                          icon={<ArrowRightOutlined />}
                          onClick={() => navigate(module.path)}
                        >
                          Ver más
                        </Button>
                      }
                    >
                      <p className="text-muted">{module.description}</p>
                      <div className="mt-3">
                        <Button 
                          type="primary" 
                          block
                          onClick={() => navigate(`${module.path}/create`)}
                        >
                          Crear {module.title.slice(0, -1)}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Quick Info */}
              <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24}>
                  <Card title="Información Rápida">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <div className="text-center">
                          <h4>{stats.classrooms.total}</h4>
                          <p className="text-muted mb-0">Total de Aulas</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="text-center">
                          <h4>{stats.courses.total}</h4>
                          <p className="text-muted mb-0">Total de Cursos</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="text-center">
                          <h4>{stats.periods.total}</h4>
                          <p className="text-muted mb-0">Total de Períodos</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="text-center">
                          <h4>{stats.assignments.total}</h4>
                          <p className="text-muted mb-0">Total de Asignaciones</p>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
    </>
  );
};

export default AcademicDashboard;
