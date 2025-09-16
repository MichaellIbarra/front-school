// Servicio de autenticación Gateway
const AUTH_URL = `${process.env.REACT_APP_DOMAIN}/api/v1/auth`;
const REFRESH_URL = `${process.env.REACT_APP_DOMAIN}/api/v1/auth/refresh`;

// Función para decodificar JWT
export function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

// Función para obtener información del usuario desde el token
export function getUserInfo() {
  const token = localStorage.getItem('access_token');
   
  if (!token) {
    return null;
  }
  
  const decoded = decodeJWT(token);
  
  if (!decoded) {
    return null;
  }
  
  const userInfo = {
    name: decoded.name || decoded.preferred_username || 'Usuario',
    email: decoded.email || '',
    roles: decoded.realm_access?.roles || [],
    primaryRole: decoded.realm_access?.roles?.[0] || 'user',
    username: decoded.preferred_username || '',
    givenName: decoded.given_name || '',
    familyName: decoded.family_name || '',
    emailVerified: decoded.email_verified || false
  };
  
  return userInfo;
}

// Función para verificar si el usuario tiene un rol específico
export function hasRole(role) {
  const userInfo = getUserInfo();
  return userInfo?.roles?.includes(role) || false;
}

// Función para verificar si el usuario tiene alguno de los roles especificados
export function hasAnyRole(roles) {
  const userInfo = getUserInfo();
  if (!userInfo?.roles) return false;
  return roles.some(role => userInfo.roles.includes(role));
}

// Funciones específicas para cada rol
export function isAdmin() {
  return hasRole('admin');
}

export function isDirector() {
  return hasRole('director');
}

export function isTeacher() {
  return hasRole('teacher');
}

export function isAuxiliary() {
  return hasRole('auxiliary');
}

export function isSecretary() {
  return hasRole('secretary');
}

// Función para verificar si el usuario puede acceder a una ruta específica
export function canAccessRoute(requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) {
    // Si no se requieren roles específicos, solo verificar autenticación
    return getUserInfo() !== null;
  }
  return hasAnyRole(requiredRoles);
}

// Función para verificar si el token es válido
export function isTokenValid() {
  const token = localStorage.getItem('access_token');
  const expires = localStorage.getItem('token_expires');
  
  if (!token || !expires) {
    return false;
  }
  
  const now = Date.now();
  const expiresTime = parseInt(expires);
  const isValid = now < expiresTime;
  
  // Solo log si hay problemas
  if (!isValid) {
    console.log('⚠️ Token expirado:');
    console.log('   - Ahora:', new Date(now).toLocaleString());
    console.log('   - Expira:', new Date(expiresTime).toLocaleString());
  }
  
  return isValid;
}

export async function loginKeycloak(username, password) {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      }),
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expires', Date.now() + data.expires_in * 1000);
      return { success: true, data };
    } else {
      return { success: false, error: data.error_description || 'Credenciales inválidas' };
    }
  } catch (error) {
    return { success: false, error: 'Error de red o servidor' };
  }
}

export async function refreshTokenKeycloak(refreshToken) {
  try {
    const response = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expires', Date.now() + data.expires_in * 1000);
      return { success: true, data };
    } else {
      return { success: false, error: data.error_description || 'No se pudo refrescar el token' };
    }
  } catch (error) {
    return { success: false, error: 'Error de red o servidor' };
  }
}
