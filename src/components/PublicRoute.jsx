import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PublicRoute = ({ 
  children, 
  redirectPath = "/dashboard",
  allowAuthenticated = false 
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Solo redirigir si está REALMENTE autenticado (con user válido) y no se permite acceso autenticado
  if (isAuthenticated && user && !allowAuthenticated) {
    console.log('🔄 Usuario autenticado redirigiendo desde ruta pública a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Si no está autenticado o se permite acceso autenticado, mostrar el componente
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectPath: PropTypes.string,
  allowAuthenticated: PropTypes.bool
};

PublicRoute.defaultProps = {
  redirectPath: "/dashboard",
  allowAuthenticated: false
};

export default PublicRoute;