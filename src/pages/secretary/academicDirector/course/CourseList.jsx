import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Form, InputGroup, Spinner, Modal, Card, Row, Col, Badge } from 'react-bootstrap';
import { courseService } from '../../../../services/academic/courseService';
import { CourseLevels, sortCoursesByCode } from '../../../../types/academic/course.types';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filters, setFilters] = useState({
    status: 'A',
    level: 'all',
    institutionId: ''
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { alertState, handleConfirm, handleCancel, showSuccess, showError, showConfirm } = useAlert();

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await courseService.getAllCourses();
      if (result.success) {
        setCourses(sortCoursesByCode(result.data));
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (id, courseCode) => {
    try {
      setProcessingAction(true);
      showConfirm(
        '¿Está seguro?',
        `Esta acción desactivará el curso "${courseCode}" temporalmente`,
        async () => {
          try {
            const result = await courseService.logicalDelete(id);
            if (result.success) {
              setCourses(prevCourses => 
                prevCourses.map(course => 
                  course.id === id 
                    ? { ...course, status: 'I' }
                    : course
                )
              );
              showSuccess('Desactivado', 'El curso ha sido desactivado correctamente');
            } else {
              showError('Error', result.message);
            }
          } catch (error) {
            showError('Error', 'No se pudo desactivar el curso');
          }
        }
      );
    } catch (error) {
      console.error('Error al desactivar curso:', error);
      showError('Error', 'No se pudo desactivar el curso');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRestore = async (id, courseCode) => {
    try {
      setProcessingAction(true);
      const result = await courseService.restoreCourse(id);
      if (result.success) {
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === id 
              ? { ...course, status: 'A' }
              : course
          )
        );
        showSuccess('Restaurado', `El curso "${courseCode}" ha sido restaurado correctamente`);
      } else {
        showError('Error', result.message);
      }
    } catch (error) {
      console.error('Error al restaurar curso:', error);
      showError('Error', 'No se pudo restaurar el curso');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setShowDetails(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || course.status === filters.status;
    const matchesLevel = filters.level === 'all' || course.level === filters.level;
    
    return matchesSearch && matchesStatus && matchesLevel;
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
      <Sidebar activeClassName="course-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Gestión de Cursos</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item active">Cursos</li>
                </ul>
              </div>
              <div className="col-auto">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/secretary/courses/add')}
                  disabled={processingAction}
                >
                  <i className="fas fa-plus"></i> Agregar Curso
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error}
              <Button 
                variant="link" 
                onClick={loadCourses}
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Buscar</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por código, nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
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
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nivel</Form.Label>
                    <Form.Select
                      value={filters.level}
                      onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                    >
                      <option value="all">Todos</option>
                      {Object.values(CourseLevels).map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>&nbsp;</Form.Label>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({ status: 'A', level: 'all', institutionId: '' });
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
                Lista de Cursos 
                <Badge bg="info" className="ms-2">{filteredCourses.length}</Badge>
              </h5>
            </Card.Header>
            <Card.Body>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h5>No se encontraron cursos</h5>
                  <p className="text-muted">
                    {courses.length === 0 
                      ? 'No hay cursos registrados en el sistema.' 
                      : 'No hay cursos que coincidan con los filtros aplicados.'
                    }
                  </p>
                  {courses.length === 0 && (
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/secretary/courses/add')}
                    >
                      Crear Primer Curso
                    </Button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Horas/Semana</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <strong>{course.courseCode}</strong>
                          </td>
                          <td>
                            {course.courseName}
                            {course.description && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {course.description.substring(0, 50)}
                                  {course.description.length > 50 && '...'}
                                </small>
                              </>
                            )}
                          </td>
                          <td>
                            <Badge bg="info">{course.level}</Badge>
                          </td>
                          <td className="text-center">{course.hoursPerWeek}</td>
                          <td>{getStatusBadge(course.status)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetails(course)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              {/* Editar - Solo si el curso NO está eliminado lógicamente */}
                              {course.status !== 'I' && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => navigate(`/secretary/courses/edit/${course.id}`)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              )}
                              {course.status === 'A' ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(course.id, course.courseCode)}
                                  disabled={processingAction}
                                  title="Desactivar"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleRestore(course.id, course.courseCode)}
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
          <Modal.Title>Detalles del Curso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Código:</strong> {selectedCourse.courseCode}</p>
                  <p><strong>Nombre:</strong> {selectedCourse.courseName}</p>
                  <p><strong>Nivel:</strong> {selectedCourse.level}</p>
                  <p><strong>Horas por Semana:</strong> {selectedCourse.hoursPerWeek}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedCourse.status)}</p>
                  <p><strong>ID Institución:</strong> {selectedCourse.institutionId}</p>
                  {selectedCourse.createdAt && (
                    <p><strong>Creado:</strong> {new Date(selectedCourse.createdAt).toLocaleString()}</p>
                  )}
                  {selectedCourse.updatedAt && (
                    <p><strong>Actualizado:</strong> {new Date(selectedCourse.updatedAt).toLocaleString()}</p>
                  )}
                </Col>
              </Row>
              {selectedCourse.description && (
                <div className="mt-3">
                  <h6>Descripción:</h6>
                  <p>{selectedCourse.description}</p>
                </div>
              )}
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

export default CourseList;