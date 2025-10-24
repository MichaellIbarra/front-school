import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { canAccessRoute } from '../services/auth/authService';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized" 
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

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si está autenticado pero no tiene los roles necesarios
  if (requiredRoles.length > 0 && !canAccessRoute(requiredRoles)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // Si todo está bien, mostrar el componente
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  fallbackPath: PropTypes.string,
  unauthorizedPath: PropTypes.string
};

ProtectedRoute.defaultProps = {
  requiredRoles: [],
  fallbackPath: "/login",
  unauthorizedPath: "/unauthorized"
};

export default ProtectedRoute;