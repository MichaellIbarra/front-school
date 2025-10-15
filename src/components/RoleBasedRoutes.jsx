import React from 'react';
import PropTypes from 'prop-types';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Componente para rutas de Admin
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas de Director
export const DirectorRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['director']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas de Teacher
export const TeacherRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['teacher']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas de Auxiliary
export const AuxiliaryRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['auxiliary']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas de Secretary
export const SecretaryRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['secretary']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas que requieren cualquier tipo de autenticación
export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={[]}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas de gestión (Admin + Director)
export const ManagementRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'director']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas académicas (Teacher + Director + Admin)
export const AcademicRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['teacher', 'director', 'admin']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas administrativas (Admin + Secretary)
export const AdministrativeRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'secretary']}>
    {children}
  </ProtectedRoute>
);

// PropTypes para todos los componentes
const routePropTypes = {
  children: PropTypes.node.isRequired
};

AdminRoute.propTypes = routePropTypes;
DirectorRoute.propTypes = routePropTypes;
TeacherRoute.propTypes = routePropTypes;
AuxiliaryRoute.propTypes = routePropTypes;
SecretaryRoute.propTypes = routePropTypes;
AuthenticatedRoute.propTypes = routePropTypes;
ManagementRoute.propTypes = routePropTypes;
AcademicRoute.propTypes = routePropTypes;
AdministrativeRoute.propTypes = routePropTypes;

// Export PublicRoute for convenience
export { PublicRoute };