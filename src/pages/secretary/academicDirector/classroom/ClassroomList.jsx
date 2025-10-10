import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Form, InputGroup, Spinner, Modal, Card, Row, Col, Badge } from 'react-bootstrap';
import { classroomService } from '../../../../services/academic/classroomService';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';
import AlertModal from '../../../../components/AlertModal';
import useAlert from '../../../../hooks/useAlert';

const ClassroomList = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filters, setFilters] = useState({
    status: 'A'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const { alertState, handleConfirm, handleCancel, showSuccess, showError, showConfirm } = useAlert();

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await classroomService.getAllClassrooms();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleDelete = async (id, classroomCode) => {
    try {
      setProcessingAction(true);
      showConfirm(
        '¿Está seguro?',
        `Esta acción desactivará el aula "${classroomCode}" temporalmente`,
        async () => {
          try {
            const result = await classroomService.deleteClassroom(id);
            if (result.success) {
              setClassrooms(prevClassrooms => 
                prevClassrooms.map(classroom => 
                  classroom.id === id 
                    ? { ...classroom, status: 'I' }
                    : classroom
                )
              );
              showSuccess('Desactivado', 'El aula ha sido desactivada correctamente');
            } else {
              showError('Error', result.message);
            }
          } catch (error) {
            showError('Error', 'No se pudo desactivar el aula');
          }
        }
      );
    } catch (error) {
      console.error('Error al desactivar aula:', error);
      showError('Error', 'No se pudo desactivar el aula');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRestore = async (id, classroomCode) => {
    try {
      setProcessingAction(true);
      const result = await classroomService.reactivateClassroom(id);
      if (result.success) {
        setClassrooms(prevClassrooms => 
          prevClassrooms.map(classroom => 
            classroom.id === id 
              ? { ...classroom, status: 'A' }
              : classroom
          )
        );
        showSuccess('Restaurado', `El aula "${classroomCode}" ha sido restaurada correctamente`);
      } else {
        showError('Error', result.message);
      }
    } catch (error) {
      console.error('Error al restaurar aula:', error);
      showError('Error', 'No se pudo restaurar el aula');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDetails = (classroom) => {
    setSelectedClassroom(classroom);
    setShowDetails(true);
  };

  const filteredClassrooms = classrooms.filter(classroom => {
    const matchesSearch = searchTerm === '' || 
      classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classroom.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classroom.description && classroom.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || classroom.status === filters.status;
    
    return matchesSearch && matchesStatus;
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
      <Sidebar activeClassName="classroom-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Gestión de Aulas</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#" onClick={(e) => e.preventDefault()}>Director Académico</a>
                  </li>
                  <li className="breadcrumb-item active">Aulas</li>
                </ul>
              </div>
              <div className="col-auto">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/secretary/classrooms/add')}
                  disabled={processingAction}
                >
                  <i className="fas fa-plus"></i> Agregar Aula
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle"></i> {error}
              <Button 
                variant="link" 
                onClick={loadClassrooms}
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
                <Col md={6}>
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
                    <Form.Label>&nbsp;</Form.Label>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilters({ status: 'A' });
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
                Lista de Aulas 
                <Badge bg="info" className="ms-2">{filteredClassrooms.length}</Badge>
              </h5>
            </Card.Header>
            <Card.Body>
              {filteredClassrooms.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-door-open fa-3x text-muted mb-3"></i>
                  <h5>No se encontraron aulas</h5>
                  <p className="text-muted">
                    {classrooms.length === 0 
                      ? 'No hay aulas registradas en el sistema.' 
                      : 'No hay aulas que coincidan con los filtros aplicados.'
                    }
                  </p>
                  {classrooms.length === 0 && (
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/secretary/classrooms/add')}
                    >
                      Crear Primera Aula
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
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClassrooms.map((classroom) => (
                        <tr key={classroom.id}>
                          <td>
                            <strong>{classroom.code}</strong>
                          </td>
                          <td>{classroom.name}</td>
                          <td>
                            {classroom.description ? (
                              <>
                                {classroom.description.substring(0, 50)}
                                {classroom.description.length > 50 && '...'}
                              </>
                            ) : (
                              <span className="text-muted">Sin descripción</span>
                            )}
                          </td>
                          <td>{getStatusBadge(classroom.status)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetails(classroom)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              {classroom.status !== 'I' && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => navigate(`/secretary/classrooms/edit/${classroom.id}`)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              )}
                              {classroom.status === 'A' ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(classroom.id, classroom.code)}
                                  disabled={processingAction}
                                  title="Desactivar"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleRestore(classroom.id, classroom.code)}
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
          <Modal.Title>Detalles del Aula</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClassroom && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Código:</strong> {selectedClassroom.code}</p>
                  <p><strong>Nombre:</strong> {selectedClassroom.name}</p>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedClassroom.status)}</p>
                </Col>
                <Col md={6}>
                  {selectedClassroom.createdAt && (
                    <p><strong>Creado:</strong> {new Date(selectedClassroom.createdAt).toLocaleString()}</p>
                  )}
                  {selectedClassroom.updatedAt && (
                    <p><strong>Actualizado:</strong> {new Date(selectedClassroom.updatedAt).toLocaleString()}</p>
                  )}
                </Col>
              </Row>
              {selectedClassroom.description && (
                <div className="mt-3">
                  <h6>Descripción:</h6>
                  <p>{selectedClassroom.description}</p>
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

export default ClassroomList;
