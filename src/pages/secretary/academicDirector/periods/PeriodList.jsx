import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { periodService } from '../../../../services/academic/periodService';
import Header from '../../../../components/Header';
import Sidebar from '../../../../components/Sidebar';

/**
 * Componente para listar períodos académicos
 * Usado en el rol de Secretary para la gestión de períodos
 */
const PeriodList = () => {
  // Estados del componente
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para filtros
  const [filters, setFilters] = useState({
    academicYear: '',
    level: '',
    periodType: '',
    status: ''
  });

  // Estados para ordenamiento
  const [sortConfig, setSortConfig] = useState({
    key: 'academicYear',
    direction: 'desc'
  });

  // Cargar períodos al montar el componente
  useEffect(() => {
    loadPeriods();
  }, []);

  /**
   * Cargar lista de períodos desde el servidor
   */
  const loadPeriods = async () => {
    setLoading(true);
    try {
      const result = await periodService.getAllPeriods();
      if (result.success) {
        setPeriods(result.data || []);
        if (result.data?.length === 0) {
          // No mostrar alerta para lista vacía, solo mostrar mensaje en la tabla
        }
      } else {
        alert('Error: ' + (result.message || 'Error al cargar períodos'));
        setPeriods([]);
      }
    } catch (error) {
      console.error('Error al cargar períodos:', error);
      alert('Error: Error de conexión al cargar períodos');
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar eliminación lógica de un período
   */
  const handleDelete = async (periodId, periodName) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el período "${periodName}"?`)) {
      try {
        const result = await periodService.logicalDelete(periodId);
        if (result.success) {
          alert('Período eliminado exitosamente');
          loadPeriods(); // Recargar la lista
        } else {
          alert('Error: ' + (result.message || 'Error al eliminar período'));
        }
      } catch (error) {
        console.error('Error al eliminar período:', error);
        alert('Error: Error de conexión al eliminar período');
      }
    }
  };

  /**
   * Manejar restauración de un período
   */
  const handleRestore = async (periodId, periodName) => {
    if (window.confirm(`¿Desea restaurar el período "${periodName}"?`)) {
      try {
        const result = await periodService.restorePeriod(periodId);
        if (result.success) {
          alert('Período restaurado exitosamente');
          loadPeriods(); // Recargar la lista
        } else {
          alert('Error: ' + (result.message || 'Error al restaurar período'));
        }
      } catch (error) {
        console.error('Error al restaurar período:', error);
        alert('Error: Error de conexión al restaurar período');
      }
    }
  };

  /**
   * Filtrar períodos según término de búsqueda y filtros
   */
  const getFilteredPeriods = () => {
    let filtered = periods;

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(period =>
        period.academicYear.toLowerCase().includes(term) ||
        period.level.toLowerCase().includes(term) ||
        period.periodType.toLowerCase().includes(term) ||
        period.description?.toLowerCase().includes(term)
      );
    }

    // Filtros específicos
    if (filters.academicYear) {
      filtered = filtered.filter(period => period.academicYear === filters.academicYear);
    }
    if (filters.level) {
      filtered = filtered.filter(period => period.level === filters.level);
    }
    if (filters.periodType) {
      filtered = filtered.filter(period => period.periodType === filters.periodType);
    }
    if (filters.status) {
      filtered = filtered.filter(period => period.status === filters.status);
    }

    return filtered;
  };

  /**
   * Ordenar períodos según configuración
   */
  const getSortedPeriods = (filteredPeriods) => {
    return [...filteredPeriods].sort((a, b) => {
      const { key, direction } = sortConfig;
      
      let aValue = a[key];
      let bValue = b[key];

      // Manejar casos especiales de ordenamiento
      if (key === 'startDate' || key === 'endDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  /**
   * Manejar cambio en ordenamiento
   */
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Obtener icono de ordenamiento
   */
  const getSortIcon = (column) => {
    if (sortConfig.key !== column) {
      return <i className="fas fa-sort text-muted"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up text-primary"></i>
      : <i className="fas fa-sort-down text-primary"></i>;
  };

  // Obtener períodos procesados (filtrados y ordenados)
  const filteredPeriods = getFilteredPeriods();
  const sortedPeriods = getSortedPeriods(filteredPeriods);

  // Paginación
  const totalItems = sortedPeriods.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPeriods = sortedPeriods.slice(startIndex, endIndex);

  // Obtener valores únicos para filtros
  const uniqueAcademicYears = [...new Set(periods.map(p => p.academicYear))].sort((a, b) => b.localeCompare(a));
  const uniqueLevels = [...new Set(periods.map(p => p.level))].sort();
  const uniquePeriodTypes = [...new Set(periods.map(p => p.periodType))].sort();

  /**
   * Formatear fecha para mostrar
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Obtener badge de estado
   */
  const getStatusBadge = (status, period) => {
    if (status === 'A') {
      // Verificar si está en curso
      if (period.isCurrent) {
        return <span className="badge badge-success">En Curso</span>;
      }
      return <span className="badge badge-info">Activo</span>;
    }
    return <span className="badge badge-warning text-dark">INACTIVO</span>;
  };

  if (loading) {
    return (
      <div className="content container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Sidebar activeClassName="period-list" />
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Encabezado */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title">Períodos Académicos</h3>
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/secretary">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active">Períodos Académicos</li>
                </ul>
              </div>
              <div className="col-auto float-right ml-auto">
                <Link to="/secretary/periods/add" className="btn add-btn">
                  <i className="fa fa-plus"></i> Agregar Período
                </Link>
              </div>
            </div>
          </div>

      {/* Controles de filtrado y búsqueda */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <div className="row">
                {/* Barra de búsqueda */}
                <div className="col-md-3 mb-3">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar períodos..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Filtro por Año Académico */}
                <div className="col-md-2 mb-3">
                  <select
                    className="form-control"
                    value={filters.academicYear}
                    onChange={(e) => {
                      setFilters({ ...filters, academicYear: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los años</option>
                    {uniqueAcademicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Nivel */}
                <div className="col-md-2 mb-3">
                  <select
                    className="form-control"
                    value={filters.level}
                    onChange={(e) => {
                      setFilters({ ...filters, level: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los niveles</option>
                    {uniqueLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Tipo de Período */}
                <div className="col-md-2 mb-3">
                  <select
                    className="form-control"
                    value={filters.periodType}
                    onChange={(e) => {
                      setFilters({ ...filters, periodType: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los tipos</option>
                    {uniquePeriodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div className="col-md-2 mb-3">
                  <select
                    className="form-control"
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="A">Activo</option>
                    <option value="I">Inactivo</option>
                  </select>
                </div>

                {/* Botón limpiar filtros */}
                <div className="col-md-1 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Limpiar filtros"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({
                        academicYear: '',
                        level: '',
                        periodType: '',
                        status: ''
                      });
                      setCurrentPage(1);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>

              {/* Información de resultados */}
              <div className="row">
                <div className="col-md-6">
                  <p className="text-muted mb-0">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} período(s)
                    {(searchTerm || Object.values(filters).some(f => f)) && ` (filtrado de ${periods.length} total)`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de períodos */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th 
                        className="sortable-header"
                        onClick={() => handleSort('academicYear')}
                        style={{ cursor: 'pointer' }}
                      >
                        Año Académico {getSortIcon('academicYear')}
                      </th>
                      <th 
                        className="sortable-header"
                        onClick={() => handleSort('level')}
                        style={{ cursor: 'pointer' }}
                      >
                        Nivel {getSortIcon('level')}
                      </th>
                      <th 
                        className="sortable-header"
                        onClick={() => handleSort('periodType')}
                        style={{ cursor: 'pointer' }}
                      >
                        Tipo {getSortIcon('periodType')}
                      </th>
                      <th 
                        className="sortable-header"
                        onClick={() => handleSort('startDate')}
                        style={{ cursor: 'pointer' }}
                      >
                        Fecha Inicio {getSortIcon('startDate')}
                      </th>
                      <th 
                        className="sortable-header"
                        onClick={() => handleSort('endDate')}
                        style={{ cursor: 'pointer' }}
                      >
                        Fecha Fin {getSortIcon('endDate')}
                      </th>
                      <th>Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeriods.length > 0 ? (
                      currentPeriods.map((period) => (
                        <tr key={period.id}>
                          <td>
                            <strong>{period.academicYear}</strong>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {period.level || 'Sin nivel'}
                            </span>
                          </td>
                          <td>
                            {period.periodType}
                          </td>
                          <td>
                            {formatDate(period.startDate)}
                          </td>
                          <td>
                            {formatDate(period.endDate)}
                          </td>
                          <td>
                            {getStatusBadge(period.status, period)}
                          </td>
                          <td className="text-right">
                            <div className="actions">
                              {/* Editar - Solo si el período NO está eliminado lógicamente */}
                              {period.status !== 'I' && (
                                <Link
                                  to={`/secretary/periods/edit/${period.id}`}
                                  className="btn btn-sm btn-success mr-2"
                                  title="Editar período"
                                >
                                  <i className="fas fa-pencil-alt"></i>
                                </Link>
                              )}
                              
                              {period.status === 'A' ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  title="Eliminar período"
                                  onClick={() => handleDelete(period.id, `${period.level} - ${period.periodType} (${period.academicYear})`)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-info"
                                  title="Restaurar período"
                                  onClick={() => handleRestore(period.id, `${period.level} - ${period.periodType} (${period.academicYear})`)}
                                >
                                  <i className="fas fa-undo"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          {(searchTerm || Object.values(filters).some(f => f)) 
                            ? 'No se encontraron períodos que coincidan con los criterios de búsqueda.' 
                            : 'No hay períodos académicos registrados.'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación Bootstrap */}
              {totalPages > 1 && (
                <div className="row mt-3">
                  <div className="col-md-12 d-flex justify-content-center">
                    <nav aria-label="Page navigation">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </button>
                        </li>
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          return (
                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Componente simplificado - usando alertas básicas por ahora */}
        </div>
      </div>
    </>
  );
};

export default PeriodList;