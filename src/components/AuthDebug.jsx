import React from 'react';
import useAuth from '../hooks/useAuth';
import { isTokenValid, getUserInfo } from '../auth/authService';

const AuthDebug = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  const debugInfo = {
    localStorage: {
      access_token: localStorage.getItem('access_token') ? 'EXISTS' : 'NULL',
      refresh_token: localStorage.getItem('refresh_token') ? 'EXISTS' : 'NULL',
      token_expires: localStorage.getItem('token_expires'),
    },
    authService: {
      isTokenValid: isTokenValid(),
      getUserInfo: getUserInfo(),
    },
    useAuth: {
      user,
      isAuthenticated,
      loading,
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h6>🐛 Auth Debug</h6>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      <button 
        onClick={() => window.location.reload()} 
        style={{ marginTop: '5px', fontSize: '10px' }}
      >
        🔄 Recargar
      </button>
    </div>
  );
};

export default AuthDebug;