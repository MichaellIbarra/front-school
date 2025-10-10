import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Form, InputGroup, Spinner, Modal, Card, Row, Col, Badge } from 'react-bootstrap';
import { teacherAssignmentService } from '../../../../services/academic/teacherAssignmentService';
import { courseService } from '../../../../services/academic/courseService';
import { classroomService } from '../../../../services/academic/classroomService';
import { periodService } from '../../../../services/academic/periodService';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const TeacherAssignmentList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filters, setFilters] = useState({
    status: 'A',
    courseId: 'all',
    classroomId: 'all',
    periodId: 'all'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const { alertState, handleConfirm, handleCancel, showSuccess, showError, showConfirm } = useAlert();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [assignmentsResult, coursesResult, classroomsResult, periodsResult] = await Promise.all([
        teacherAssignmentService.getAllAssignments(),
        courseService.getAllCourses(),
        classroomService.getAllClassrooms(),
        periodService.getAllPeriods()
      ]);
      
      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data);
      } else {
        setError(assignmentsResult.message);
      }
      
      if (coursesResult.success) {
        setCourses(coursesResult.data);
      }
      
      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data);
      }
      
      if (periodsResult.success) {
        setPeriods(periodsResult.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id, teacherId) => {
    try {
      setProcessingAction(true);
      showConfirm(
        '¿Está seguro?',
        `Esta acción desactivará la asignación del profesor "${teacherId}" temporalmente`,
        async () => {
          try {
            const result = await teacherAssignmentService.deleteAssignment(id);
            if (result.success) {
              setAssignments(prevAssignments => 
                prevAssignments.map(assignment => 
                  assignment.id === id 
                    ? { ...assignment, status: 'I' }
                    : assignment
                )
              );
              showSuccess('Desactivado', 'La asignación ha sido desactivada correctamente');
            } else {
              showError('Error', result.message);
            }
          } catch (error) {
            showError('Error', 'No se pudo desactivar la asignación');
          }
        }
      );
    } catch (error) {
      console.error('Error al desactivar asignación:', error);
      showError('Error', 'No se pudo desactivar la asignación');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRestore = async (id, teacherId) => {
    try {
      setProcessingAction(true);
      const result = await teacherAssignmentService.reactivateAssignment(id);
      if (result.success) {
        setAssignments(prevAssignments => 
          prevAssignments.map(assignment => 
            assignment.id === id 
              ? { ...assignment, status: 'A' }
              : assignment
          )
        );
        showSuccess('Restaurado', `La asignación del profesor "${teacherId}" ha sido restaurada correctamente`);
      } else {
        showError('Error', result.message);
      }
    } catch (error) {
      console.error('Error al restaurar asignación:', error);
      showError('Error', 'No se pudo restaurar la asignación');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetails(true);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.courseName : courseId;
  };

  const getClassroomName = (classroomId) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    return classroom ? classroom.name : classroomId;
  };

  const getPeriodName = (periodId) => {
    const period = periods.find(p => p.id === periodId);
    return period ? period.periodName : periodId;
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === '' || 
      assignment.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCourseName(assignment.courseId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClassroomName(assignment.classroomId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || assignment.status === filters.status;
    const matchesCourse = filters.courseId === 'all' || assignment.courseId === filters.courseId;
    const matchesClassroom = filters.classroomId === 'all' || assignment.classroomId === filters.classroomId;
    const matchesPeriod = filters.periodId === 'all' || assignment.periodId === filters.periodId;
    
    return matchesSearch && matchesStatus && matchesCourse && matchesClassroom && matchesPeriod;
  });

  const getStatusBadge = (status) => {
    return status === 'A' ? (
      <Badge bg="success">Activo</Badge>
    ) : (
      <Badge bg="danger">Inactivo</Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="teacher-assignment-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Gestión de Asignaciones de Profesores</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item active">Asignaciones de Profesores</li>
                </ul>
              </div>
              <div className="col-auto">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/secretary/teacher-assignments/add')}
                  disabled={processingAction}
                >
                  <i className="fas fa-plus"></i> Agregar Asignación
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error}
              <Button 
                variant="link" 
                onClick={loadData}
                className="float-end"
              >
                Reintentar
              </Button>
            </div>
          )}

          <Card>
            <Card.Header>
              <h5 className="card-title">Filtros y Búsqueda</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Buscar</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por profesor, curso, aula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">Todos</option>
                      <option value="A">Activos</option>
                      <option value="I">Inactivos</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Curso</Form.Label>
                    <Form.Select
                      value={filters.courseId}
                      onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                    >
                      <option value="all">Todos</option>
                      {courses.filter(c => c.status === 'A').map(course => (
                        <option key={course.id} value={course.id}>{course.courseName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Aula</Form.Label>
                    <Form.Select
                      value={filters.classroomId}
                      onChange={(e) => setFilters(prev => ({ ...prev, classroomId: e.target.value }))}
                    >
                      <option value="all">Todas</option>
                      {classrooms.filter(c => c.status === 'A').map(classroom => (
                        <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Período</Form.Label>
                    <Form.Select
                      value={filters.periodId}
                      onChange={(e) => setFilters(prev => ({ ...prev, periodId: e.target.value }))}
                    >
                      <option value="all">Todos</option>
                      {periods.filter(p => p.status === 'A').map(period => (
                        <option key={period.id} value={period.id}>{period.periodName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Form.Group className="mb-3">
                    <Form.Label>&nbsp;</Form.Label>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({ status: 'A', courseId: 'all', classroomId: 'all', periodId: 'all' });
                        }}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="card-title">
                Lista de Asignaciones 
                <Badge bg="info" className="ms-2">{filteredAssignments.length}</Badge>
              </h5>
            </Card.Header>
            <Card.Body>
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-user-tie fa-3x text-muted mb-3"></i>
                  <h5>No se encontraron asignaciones</h5>
                  <p className="text-muted">
                    {assignments.length === 0 
                      ? 'No hay asignaciones registradas en el sistema.' 
                      : 'No hay asignaciones que coincidan con los filtros aplicados.'
                    }
                  </p>
                  {assignments.length === 0 && (
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/secretary/teacher-assignments/add')}
                    >
                      Crear Primera Asignación
                    </Button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Profesor</th>
                        <th>Curso</th>
                        <th>Aula</th>
                        <th>Período</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <strong>{assignment.teacherId}</strong>
                          </td>
                          <td>{getCourseName(assignment.courseId)}</td>
                          <td>{getClassroomName(assignment.classroomId)}</td>
                          <td>{getPeriodName(assignment.periodId)}</td>
                          <td>{getStatusBadge(assignment.status)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetails(assignment)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              {assignment.status !== 'I' && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => navigate(`/secretary/teacher-assignments/edit/${assignment.id}`)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              )}
                              {assignment.status === 'A' ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(assignment.id, assignment.teacherId)}
                                  disabled={processingAction}
                                  title="Desactivar"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleRestore(assignment.id, assignment.teacherId)}
                                  disabled={processingAction}
                                  title="Restaurar"
                                >
                                  <i className="fas fa-undo"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modal de detalles */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Asignación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Profesor:</strong> {selectedAssignment.teacherId}</p>
                  <p><strong>Curso:</strong> {getCourseName(selectedAssignment.courseId)}</p>
                  <p><strong>Aula:</strong> {getClassroomName(selectedAssignment.classroomId)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Período:</strong> {getPeriodName(selectedAssignment.periodId)}</p>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedAssignment.status)}</p>
                  {selectedAssignment.createdAt && (
                    <p><strong>Creado:</strong> {new Date(selectedAssignment.createdAt).toLocaleString()}</p>
                  )}
                  {selectedAssignment.updatedAt && (
                    <p><strong>Actualizado:</strong> {new Date(selectedAssignment.updatedAt).toLocaleString()}</p>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert personalizado */}
      <AlertModal
        alert={alertState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default TeacherAssignmentList;
