import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTitle from '../../hooks/useTitle';

const Unauthorized = () => {
  useTitle('Acceso No Autorizado');
  const { user, logout } = useAuth();

  return (
    <div className="main-wrapper login-body">
      <div className="container-fluid px-0">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="error-page text-center">
              <div className="error-box">
                <h1 className="error-number">403</h1>
                <h3 className="h2 mb-3">
                  <i className="fas fa-exclamation-triangle"></i> Acceso No Autorizado
                </h3>
                <p className="h4 font-weight-normal">
                  Lo sentimos, no tienes permisos para acceder a esta página.
                </p>
                
                {user && (
                  <div className="alert alert-info mt-4">
                    <strong>Usuario actual:</strong> {user.name}<br />
                    <strong>Rol:</strong> {user.primaryRole}
                  </div>
                )}

                <div className="mt-4">
                  <Link to="/dashboard" className="btn btn-primary me-3">
                    <i className="fas fa-home"></i> Ir al Dashboard
                  </Link>
                  
                  <button 
                    onClick={logout} 
                    className="btn btn-outline-secondary"
                  >
                    <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-muted">
                    Si crees que esto es un error, contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;