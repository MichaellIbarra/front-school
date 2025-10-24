// Servicio de autenticación Gateway
const AUTH_URL = `${process.env.REACT_APP_DOMAIN}/api/v1/auth`;
const REFRESH_URL = `${process.env.REACT_APP_DOMAIN}/api/v1/auth/refresh`;

// Importar servicio de director (se importa dinámicamente para evitar dependencias circulares)

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

// Roles educativos válidos que nos interesan
const VALID_EDUCATIONAL_ROLES = ['admin', 'director', 'teacher', 'auxiliary', 'secretary'];

// Función para filtrar solo los roles educativos relevantes
function getEducationalRoles(allRoles) {
  if (!Array.isArray(allRoles)) return [];
  return allRoles.filter(role => VALID_EDUCATIONAL_ROLES.includes(role));
}

// Caché para evitar decodificar el JWT múltiples veces
let cachedUserInfo = null;
let lastToken = null;

// Función para obtener información del usuario desde el token
export function getUserInfo() {
  const token = localStorage.getItem('access_token');
   
  if (!token) {
    // Limpiar caché si no hay token
    cachedUserInfo = null;
    lastToken = null;
    return null;
  }
  
  // Si el token no ha cambiado y tenemos caché, devolverlo
  if (token === lastToken && cachedUserInfo) {
    return cachedUserInfo;
  }
  
  const decoded = decodeJWT(token);
  
  if (!decoded) {
    // Limpiar caché si el token es inválido
    cachedUserInfo = null;
    lastToken = null;
    return null;
  }
  
  // Filtrar solo los roles educativos relevantes
  const allRoles = decoded.realm_access?.roles || [];
  const educationalRoles = getEducationalRoles(allRoles);
  
  const userInfo = {
    name: decoded.name || decoded.preferred_username || 'Usuario',
    email: decoded.email || '',
    roles: educationalRoles, // Solo roles educativos
    allRoles: allRoles, // Todos los roles (por si se necesitan)
    primaryRole: educationalRoles[0] || 'user', // Primer rol educativo
    username: decoded.preferred_username || '',
    givenName: decoded.given_name || '',
    familyName: decoded.family_name || '',
    emailVerified: decoded.email_verified || false
  };
  
  // Actualizar caché
  lastToken = token;
  cachedUserInfo = userInfo;
  
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

// Función para formatear roles para mostrar en la UI
export function formatUserRoles(user, maxRoles = 2) {
  if (!user || !user.roles || user.roles.length === 0) {
    return 'User';
  }
  
  // Función helper para capitalizar
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
  // Mapeo de roles para mostrar nombres más amigables
  const roleNames = {
    admin: 'Administrador',
    director: 'Director',
    teacher: 'Profesor',
    auxiliary: 'Auxiliar',
    secretary: 'Secretario'
  };
  
  // Formatear roles
  const formattedRoles = user.roles.map(role => roleNames[role] || capitalize(role));
  
  if (formattedRoles.length === 1) {
    return formattedRoles[0];
  } else if (formattedRoles.length <= maxRoles) {
    return formattedRoles.join(', ');
  } else {
    return `${formattedRoles.slice(0, maxRoles).join(', ')} (+${formattedRoles.length - maxRoles})`;
  }
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

// Función más robusta para verificar autenticación completa
export function isFullyAuthenticated() {
  const token = localStorage.getItem('access_token');
  const userInfo = getUserInfo();
  const tokenValid = isTokenValid();
  
  // Debe tener token, información de usuario válida y token no expirado
  return !!(token && userInfo && tokenValid);
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
      // Limpiar caché para forzar re-decodificación con el nuevo token
      clearUserCache();
      return { success: true, data };
    } else {
      // Si el refresh falla, limpiar tokens automáticamente
      console.log('🔑 Refresh token inválido, limpiando localStorage');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires');
      clearInstitutionData();
      return { success: false, error: data.error_description || 'No se pudo refrescar el token' };
    }
  } catch (error) {
    // En caso de error de red, también limpiar tokens
    console.error('❌ Error de red en refresh, limpiando tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires');
    clearInstitutionData();
    return { success: false, error: 'Error de red o servidor' };
  }
}

// Función para manejar el login del director y cargar su institución
export async function handleDirectorLogin() {
  const userInfo = getUserInfo();
  
  if (!userInfo || !isDirector()) {
    return { success: false, error: 'Usuario no es director' };
  }

  try {
    // Importación dinámica para evitar dependencias circulares
    const { default: institutionDirectorService } = await import('../institutions/institutionDirectorService');
    
    console.log('🏢 Director detectado, obteniendo institución...');
    const institutionResult = await institutionDirectorService.getDirectorInstitution();
    
    if (institutionResult.success) {
      console.log('✅ Institución del director obtenida:', institutionResult.data);
      
      // Guardar información de la institución en localStorage con clave genérica
      if (institutionResult.data) {
        localStorage.setItem('institution', JSON.stringify(institutionResult.data));
      }
      
      return {
        success: true,
        institution: institutionResult.data,
        message: 'Institución del director cargada exitosamente'
      };
    } else {
      console.error('❌ Error al obtener institución del director:', institutionResult.error);
      return {
        success: false,
        error: institutionResult.error || 'No se pudo cargar la institución del director'
      };
    }
  } catch (error) {
    console.error('Error en handleDirectorLogin:', error);
    return {
      success: false,
      error: 'Error al cargar la institución del director'
    };
  }
}

// Función para manejar el login del personal y cargar su institución
export async function handlePersonalLogin() {
  const userInfo = getUserInfo();
  
  if (!userInfo || !hasAnyRole(['teacher', 'auxiliary', 'secretary'])) {
    return { success: false, error: 'Usuario no es personal educativo' };
  }

  try {
    // Importación dinámica para evitar dependencias circulares
    const { default: institutionPersonalService } = await import('../institutions/institutionPersonalService');
    
    console.log('🏫 Personal detectado, obteniendo institución...');
    const institutionResult = await institutionPersonalService.getPersonalInstitution();
    
    if (institutionResult.success) {
      console.log('✅ Institución del personal obtenida:', institutionResult.data);
      
      // Guardar información de la institución en localStorage con clave genérica
      if (institutionResult.data) {
        localStorage.setItem('institution', JSON.stringify(institutionResult.data));
      }
      
      return {
        success: true,
        institution: institutionResult.data,
        message: 'Institución del personal cargada exitosamente'
      };
    } else {
      console.error('❌ Error al obtener institución del personal:', institutionResult.error);
      return {
        success: false,
        error: institutionResult.error || 'No se pudo cargar la institución del personal'
      };
    }
  } catch (error) {
    console.error('Error en handlePersonalLogin:', error);
    return {
      success: false,
      error: 'Error al cargar la institución del personal'
    };
  }
}

// Función genérica para obtener la institución desde localStorage
export function getUserInstitution() {
  try {
    const institutionData = localStorage.getItem('institution');
    return institutionData ? JSON.parse(institutionData) : null;
  } catch (error) {
    console.error('Error al obtener institución desde localStorage:', error);
    return null;
  }
}

// Función para obtener la institución del director (mantener compatibilidad)
export function getDirectorInstitution() {
  return getUserInstitution();
}

// Función para limpiar la caché de usuario
export function clearUserCache() {
  cachedUserInfo = null;
  lastToken = null;
}

// Función para limpiar datos de institución al hacer logout
export function clearInstitutionData() {
  localStorage.removeItem('institution');
  // Mantener compatibilidad con el sistema anterior
  localStorage.removeItem('director_institution');
  // Limpiar también la caché de usuario
  clearUserCache();
}

// Función legacy para mantener compatibilidad
export function clearDirectorData() {
  clearInstitutionData();
}
