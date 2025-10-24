import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Tag } from 'antd';
import { HomeOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import useAlert from '../../../hooks/useAlert';
import AlertModal from '../../../components/AlertModal';
import { classroomService } from '../../../services/attendance';

const MyClassrooms = () => {
  const navigate = useNavigate();
  const { alertState, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  /**
   * Cargar aulas del auxiliar usando el servicio
   */
  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const classroomsData = await classroomService.getAuxiliaryClassrooms();
      console.log('✅ Aulas cargadas:', classroomsData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('❌ Error al cargar aulas:', error);
      showError('Error al cargar las aulas: ' + error.message);
      setClassrooms([]);
    }
    setLoading(false);
  };

  /**
   * Navegar a la página de registro de asistencias
   */
  const handleClassroomClick = (classroom) => {
    navigate(`/auxiliary/attendance/register/${classroom.id}`);
  };

  /**
   * Renderizar tarjeta de aula estilo Google Classroom
   */
  const renderClassroomCard = (classroom) => {
    const backgroundColor = classroomService.getGradeColor(classroom.grade);
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={classroom.id}>
        <Card
          hoverable
          onClick={() => handleClassroomClick(classroom)}
          className="classroom-card"
          style={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            height: '280px',
            border: 'none',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }}
        >
          {/* Header con color de fondo */}
          <div 
            style={{ 
              height: '100px',
              background: backgroundColor,
              marginTop: '-24px',
              marginLeft: '-24px',
              marginRight: '-24px',
              padding: '16px 24px',
              color: 'white',
              position: 'relative'
            }}
          >
            <h3 style={{ 
              color: 'white', 
              margin: 0,
              fontSize: '20px',
              fontWeight: '500'
            }}>
              {classroom.classroomName}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: '4px 0 0 0',
              fontSize: '14px'
            }}>
              {classroom.shiftName}
            </p>
          </div>

          {/* Contenido */}
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '12px' }}>
              <HomeOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Grado: <strong>{classroom.grade}°</strong>
              </span>
              <span style={{ marginLeft: '8px', fontSize: '14px', color: '#374151' }}>
                Sección: <strong>{classroom.section}</strong>
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <BookOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Turno: <strong>{classroom.shiftName}</strong>
              </span>
            </div>

            <div>
              <Tag color={classroom.status === 'A' ? 'green' : 'red'}>
                {classroom.statusName}
              </Tag>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <>
      <Header />
      <Sidebar activeClassName="my-classrooms" />
      
      <div className="page-wrapper">
        <div className="content">
          {/* Encabezado */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Mis Aulas</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/auxiliary/dashboard">Dashboard</a>
                  </li>
                  <li className="breadcrumb-item active">Mis Aulas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Grid de aulas */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando aulas...</p>
            </div>
          ) : classrooms.length === 0 ? (
            <Empty
              description="No tienes aulas asignadas"
              style={{ marginTop: '50px' }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {classrooms.map(classroom => renderClassroomCard(classroom))}
            </Row>
          )}
        </div>
      </div>

      <AlertModal alert={alertState} onConfirm={alertConfirm} onCancel={alertCancel} />
    </>
  );
};

export default MyClassrooms;
