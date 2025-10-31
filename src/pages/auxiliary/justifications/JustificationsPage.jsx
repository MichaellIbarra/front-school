import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { useJustifications } from '../../../hooks/useJustifications';
import JustificationDetailsModal from './JustificationDetailsModal';
import { 
  formatDate, 
  getStatusColor,
  filterJustifications
} from '../../../utils/justifications/justificationsHelpers';
import { 
  JustificationTypeLabels,
  JustificationStatusLabels
} from '../../../types/justifications';
import './Justifications.css';

const JustificationsPage = () => {
  // Tab activa
  const [activeTab, setActiveTab] = useState('pendientes');
  
  // Estados de modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState(null);
  
  // Obtener rol del usuario
  const [userRole, setUserRole] = useState('');
  
  useEffect(() => {
    const role = localStorage.getItem('roles');
    setUserRole(role || '');
  }, []);
  
  // Hook de justificaciones
  const {
    pendingJustifications,
    allJustifications,
    loading,
    error,
    loadPendingJustifications,
    loadAllJustifications
  } = useJustifications();

  // Estados de filtros
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    startDate: '',
    endDate: '',
    searchText: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadPendingJustifications(),
      loadAllJustifications()
    ]);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      status: 'ALL',
      type: 'ALL',
      startDate: '',
      endDate: '',
      searchText: ''
    });
  };

  // Abrir modal de detalles
  const handleViewDetails = (justification) => {
    setSelectedJustification(justification);
    setIsDetailsModalOpen(true);
  };

  // Filtrar justificaciones según tab activa
  const getFilteredJustifications = () => {
    let data = [];
    
    if (activeTab === 'pendientes') {
      data = pendingJustifications;
    } else if (activeTab === 'historial') {
      data = allJustifications;
    }
    
    return filterJustifications(data, filters);
  };

  const filteredData = getFilteredJustifications();

  return (
    <>
      <Header />
      <Sidebar activeClassName="justifications" />
      
      <div className="page-wrapper">
        <div className="content justifications-page">
          {/* Encabezado */}
          <h1>📋 Gestión de Justificaciones</h1>

          {/* Tabs */}
          <div className="justifications-tabs">
            <button
              className={`justifications-tab-btn ${activeTab === 'pendientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendientes')}
            >
              Pendientes
              <span className="count-badge">{pendingJustifications.length}</span>
            </button>
            <button
              className={`justifications-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              Historial
              <span className="count-badge">{allJustifications.length}</span>
            </button>
          </div>

          {/* Filtros (solo mostrar en pestañas de justificaciones) */}
          {(activeTab === 'pendientes' || activeTab === 'historial') && (
            <div className="justifications-filters">
              <div className="filters-row">
                <div className="filter-group">
                  <label>Estado</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="ALL">Todos</option>
                    {Object.entries(JustificationStatusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="ALL">Todos</option>
                    {Object.entries(JustificationTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Desde</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Hasta</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Buscar</label>
                  <input
                    type="text"
                    placeholder="Buscar por razón o nombre..."
                    value={filters.searchText}
                    onChange={(e) => handleFilterChange('searchText', e.target.value)}
                  />
                </div>

                <div className="filter-actions">
                  <button className="btn-secondary btn-small" onClick={handleClearFilters}>
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenido según tab */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <h3>Error al cargar datos</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Tab: Pendientes */}
              {activeTab === 'pendientes' && (
                <div className="justifications-table-container">
                  {filteredData.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <h3>No hay justificaciones pendientes</h3>
                      <p>No se encontraron justificaciones con los filtros aplicados</p>
                    </div>
                  ) : (
                    <table className="justifications-table">
                      <thead>
                        <tr>
                          <th>Fecha Falta</th>
                          <th>Tipo</th>
                          <th>Razón</th>
                          <th>Enviado por</th>
                          <th>Fecha Envío</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((just) => (
                          <tr key={just.id}>
                            <td>{formatDate(just.submissionDate)}</td>
                            <td>{JustificationTypeLabels[just.justificationType] || just.justificationType}</td>
                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {just.justificationReason}
                            </td>
                            <td>{just.submitterName}</td>
                            <td>{formatDate(just.submissionDate)}</td>
                            <td>
                              <button 
                                className="btn-secondary btn-small"
                                onClick={() => handleViewDetails(just)}
                              >
                                Ver Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab: Historial */}
              {activeTab === 'historial' && (
                <div className="justifications-table-container">
                  {filteredData.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📂</div>
                      <h3>No hay justificaciones en el historial</h3>
                      <p>No se encontraron justificaciones con los filtros aplicados</p>
                    </div>
                  ) : (
                    <table className="justifications-table">
                      <thead>
                        <tr>
                          <th>Fecha Falta</th>
                          <th>Tipo</th>
                          <th>Razón</th>
                          <th>Estado</th>
                          <th>Enviado por</th>
                          <th>Fecha Envío</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((just) => (
                          <tr key={just.id}>
                            <td>{formatDate(just.submissionDate)}</td>
                            <td>{JustificationTypeLabels[just.justificationType] || just.justificationType}</td>
                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {just.justificationReason}
                            </td>
                            <td>
                              <span 
                                className={`status-badge ${just.status.toLowerCase()}`}
                                style={{ 
                                  backgroundColor: getStatusColor(just.status) + '20',
                                  color: getStatusColor(just.status)
                                }}
                              >
                                {JustificationStatusLabels[just.status] || just.status}
                              </span>
                            </td>
                            <td>{just.submitterName}</td>
                            <td>{formatDate(just.submissionDate)}</td>
                            <td>
                              <button 
                                className="btn-secondary btn-small"
                                onClick={() => handleViewDetails(just)}
                              >
                                Ver Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {selectedJustification && (
        <JustificationDetailsModal
          justification={selectedJustification}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedJustification(null);
          }}
          onUpdate={loadInitialData}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default JustificationsPage;
