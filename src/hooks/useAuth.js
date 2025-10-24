import { useState, useEffect, useCallback } from 'react';
import { getUserInfo, isTokenValid, refreshTokenKeycloak, clearInstitutionData } from '../services/auth/authService';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Función para intentar refresh automático del token
  const attemptTokenRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.log('🔑 No hay refresh token disponible');
      return false;
    }

    console.log('🔄 Intentando refresh automático del token...');
    try {
      const refreshResult = await refreshTokenKeycloak(refreshToken);
      if (refreshResult.success) {
        console.log('✅ Token refrescado automáticamente');
        return true;
      } else {
        console.log('❌ Error en refresh automático:', refreshResult.error);
        // Limpiar tokens inválidos inmediatamente
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires');
        clearInstitutionData();
        return false;
      }
    } catch (error) {
      console.error('❌ Exception en refresh automático:', error);
      // Limpiar tokens en caso de excepción también
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires');
      clearInstitutionData();
      return false;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    // Primero intentar obtener la información del usuario
    const userInfo = getUserInfo();
    
    if (userInfo) {
      // Si tenemos info del usuario, verificar si el token es válido
      const tokenValid = isTokenValid();
      
      if (tokenValid) {
        setUser(userInfo);
        setIsAuthenticated(true);
      } else {
        // Token expirado, intentar refresh automático
        const refreshSuccess = await attemptTokenRefresh();
        
        if (refreshSuccess) {
          // Token refrescado exitosamente, obtener nueva info del usuario
          const newUserInfo = getUserInfo();
          setUser(newUserInfo);
          setIsAuthenticated(true);
        } else {
          // No se pudo refrescar el token, limpiar todo y desautenticar
          console.log('🔑 Refresh token inválido, limpiando datos de autenticación');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expires');
          clearInstitutionData(); // Limpiar también datos de institución
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [attemptTokenRefresh]);

  useEffect(() => {
    // Ejecutar inmediatamente
    checkAuth();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'refresh_token' || e.key === 'token_expires') {
        checkAuth();
      }
    };

    // Escuchar cambios de foco en la ventana (para detectar cambios de otras pestañas)
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires');
    
    // Limpiar datos de institución (director y personal)
    clearInstitutionData();
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserInfo = async () => {
    await checkAuth();
  };

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    updateUserInfo,
    attemptTokenRefresh
  };
};

export default useAuth;