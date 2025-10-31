import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Tag, Button, message } from 'antd';
import { HomeOutlined, BookOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { classroomService } from '../../../services/attendance';
import attendanceService from '../../../services/attendance/attendanceService';
import AttendanceCalendarExporter from '../../../utils/attendance/attendanceCalendarExporter';
import './AttendanceCalendar.css';

const AttendanceCalendar = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('classrooms'); // 'classrooms' o 'calendar'

  useEffect(() => {
    loadClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassroom && view === 'calendar') {
      loadStudents();
      loadMonthAttendances();
    }
  }, [selectedClassroom, currentMonth, view]);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const data = await classroomService.getAuxiliaryClassrooms();
      setClassrooms(data);
    } catch (error) {
      setClassrooms([]);
    }
    setLoading(false);
  };

  const handleClassroomClick = (classroom) => {
    setSelectedClassroom(classroom);
    setView('calendar');
  };

  const handleBackToClassrooms = () => {
    setView('classrooms');
    setSelectedClassroom(null);
    setStudents([]);
    setAttendances({});
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await classroomService.getStudentsByClassroom(selectedClassroom.id);
      setStudents(data);
    } catch (error) {
      // Error al cargar estudiantes
    } finally {
      setLoading(false);
    }
  };

  const loadMonthAttendances = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const attendanceData = {};
      
      // Cargar asistencias de todos los días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        const response = await attendanceService.getAttendancesByClassroom(
          selectedClassroom.id,
          dateStr
        );
        
        if (response.success && response.data.length > 0) {
          response.data.forEach(att => {
            if (!attendanceData[att.studentId]) {
              attendanceData[att.studentId] = {};
            }
            attendanceData[att.studentId][day] = att.status;
          });
        }
      }
      
      setAttendances(attendanceData);
    } catch (error) {
      // Error al cargar asistencias
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'P': return 'P';
      case 'A': return 'F';
      case 'L': return 'T';
      case 'J': return 'J';
      default: return '-';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'P': return '#52c41a';
      case 'A': return '#ff4d4f';
      case 'L': return '#faad14';
      case 'J': return '#722ed1';
      default: return '#d9d9d9';
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  /**
   * Exportar calendario a PDF
   */
  const handleExportPDF = () => {
    if (!selectedClassroom) {
      message.warning('Selecciona un aula primero');
      return;
    }
    if (students.length === 0) {
      message.warning('No hay estudiantes para exportar');
      return;
    }
    
    const result = AttendanceCalendarExporter.exportCalendarToPDF(
      students,
      attendances,
      currentMonth,
      selectedClassroom
    );
    
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.error);
    }
  };

  /**
   * Exportar calendario a CSV
   */
  const handleExportCSV = () => {
    if (!selectedClassroom) {
      message.warning('Selecciona un aula primero');
      return;
    }
    if (students.length === 0) {
      message.warning('No hay estudiantes para exportar');
      return;
    }
    
    const result = AttendanceCalendarExporter.exportCalendarToCSV(
      students,
      attendances,
      currentMonth,
      selectedClassroom
    );
    
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.error);
    }
  };

  /**
   * Renderizar tarjeta de aula estilo Google Classroom
   */
  const renderClassroomCard = (classroom) => {
    const backgroundColor = classroomService.getRandomClassroomColor();
    
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
              {classroom.classroomName || `Aula ${classroom.section}`}
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
                {classroom.status === 'A' ? 'Activo' : 'Inactivo'}
              </Tag>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  // Vista de selección de aulas
  if (view === 'classrooms') {
    return (
      <>
        <Header />
        <Sidebar activeClassName="attendance-calendar" />
        
        <div className="page-wrapper">
          <div className="content">
            {/* Encabezado */}
            <div className="page-header">
              <div className="row align-items-center">
                <div className="col">
                  <h3 className="page-title">📅 Calendario de Asistencias</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/auxiliary/dashboard">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item active">Calendario de Asistencias</li>
                  </ul>
                  <p style={{ color: '#6b7280', marginTop: '8px' }}>
                    Selecciona un aula para ver el calendario de asistencias
                  </p>
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
      </>
    );
  }

  // Vista de calendario
  return (
    <>
      <Header />
      <Sidebar activeClassName="attendance-calendar" />
      
      <div className="page-wrapper">
        <div className="content attendance-calendar-page">
          {/* Encabezado */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToClassrooms}
                  style={{ marginBottom: '10px' }}
                >
                  Volver a Mis Aulas
                </Button>
                <h3 className="page-title">📅 Calendario de Asistencias</h3>
                {selectedClassroom && (
                  <div style={{ marginTop: '8px' }}>
                    <Tag color={classroomService.getRandomClassroomColor()}>
                      {selectedClassroom.classroomName || `Aula ${selectedClassroom.section}`} - {selectedClassroom.shiftName}
                    </Tag>
                    <Tag>Sección: {selectedClassroom.section}</Tag>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controles del Mes */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <Button
                icon={<LeftOutlined />}
                onClick={previousMonth}
                size="large"
              >
                Mes Anterior
              </Button>
              
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1890ff' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              
              <Button
                icon={<RightOutlined />}
                onClick={nextMonth}
                size="large"
                iconPosition="end"
              >
                Mes Siguiente
              </Button>
            </div>

            {/* Botones de Exportación */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                type="primary"
                danger
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                disabled={students.length === 0}
                size="large"
              >
                Exportar PDF
              </Button>
              <Button
                type="primary"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<FileExcelOutlined />}
                onClick={handleExportCSV}
                disabled={students.length === 0}
                size="large"
              >
                Exportar CSV
              </Button>
            </div>

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  textAlign: 'center',
                  lineHeight: '32px',
                  fontWeight: 'bold'
                }}>P</span>
                <span style={{ fontWeight: '500' }}>Presente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  textAlign: 'center',
                  lineHeight: '32px',
                  fontWeight: 'bold'
                }}>F</span>
                <span style={{ fontWeight: '500' }}>Falta</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#faad14',
                  color: 'white',
                  textAlign: 'center',
                  lineHeight: '32px',
                  fontWeight: 'bold'
                }}>T</span>
                <span style={{ fontWeight: '500' }}>Tardanza</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#722ed1',
                  color: 'white',
                  textAlign: 'center',
                  lineHeight: '32px',
                  fontWeight: 'bold'
                }}>J</span>
                <span style={{ fontWeight: '500' }}>Justificado</span>
              </div>
            </div>
          </Card>

          {/* Tabla Calendario */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Cargando asistencias...</p>
            </div>
          ) : (
            <Card>
              <div className="calendar-container">
                <table className="calendar-table">
                  <thead>
                    <tr>
                      <th className="student-column">Estudiante</th>
                      {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => (
                        <th key={day} className="day-column">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.studentId}>
                        <td className="student-cell">
                          <div className="student-name">{student.studentName || 'Sin nombre'}</div>
                          <div className="student-id">ID: ...{student.studentId.slice(-8)}</div>
                        </td>
                        {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => {
                          const status = attendances[student.studentId]?.[day];
                          return (
                            <td 
                              key={day} 
                              className="day-cell"
                              style={{ 
                                backgroundColor: status ? getStatusColor(status) + '20' : 'transparent'
                              }}
                            >
                              {status && (
                                <span 
                                  className="status-icon"
                                  style={{ 
                                    backgroundColor: getStatusColor(status),
                                    color: '#fff'
                                  }}
                                >
                                  {getStatusIcon(status)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {students.length === 0 && (
                  <Empty
                    description="No hay estudiantes en esta aula"
                    style={{ marginTop: '50px', marginBottom: '50px' }}
                  >
                    <p style={{ color: '#6b7280' }}>Selecciona otra aula o verifica que haya estudiantes matriculados</p>
                  </Empty>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AttendanceCalendar;
