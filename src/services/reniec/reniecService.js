/**
 * Servicio para consultar datos de RENIEC
 */

class ReniecService {
  constructor() {
    this.baseURL = 'https://dniruc.apisperu.com/api/v1/dni';
    this.token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1pY2hhZWxsLmliYXJyYUB2YWxsZWdyYW5kZS5lZHUucGUifQ.g06VWXFGCGt1fYra5VT6_WtOlmBCqY8esWCpYd705zc';
  }

  /**
   * Buscar persona por DNI en RENIEC
   * @param {string} dni - Número de DNI (8 dígitos)
   * @returns {Promise<Object>} Datos de la persona
   */
  async searchByDNI(dni) {
    try {
      // Validar formato de DNI
      if (!dni || dni.length !== 8 || !/^\d{8}$/.test(dni)) {
        return {
          success: false,
          error: 'El DNI debe tener exactamente 8 dígitos numéricos'
        };
      }

      console.log('🔍 Buscando DNI en RENIEC:', dni);

      const response = await fetch(`${this.baseURL}/${dni}?token=${this.token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('📥 Respuesta RENIEC:', {
        status: response.status,
        statusText: response.statusText
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'DNI no encontrado en RENIEC'
          };
        }
        return {
          success: false,
          error: `Error del servidor RENIEC: ${response.status} - ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('✅ Datos obtenidos de RENIEC:', data);

      // Verificar que tengamos datos válidos
      if (!data || !data.nombres) {
        return {
          success: false,
          error: 'No se encontraron datos para este DNI'
        };
      }

      // Formatear y retornar los datos
      // La API apisperu.com devuelve: dni, nombres, apellidoPaterno, apellidoMaterno
      return {
        success: true,
        data: {
          dni: data.dni || dni,
          nombres: data.nombres || '',
          apellidoPaterno: data.apellidoPaterno || '',
          apellidoMaterno: data.apellidoMaterno || '',
          nombreCompleto: this.formatFullName(data)
        }
      };

    } catch (error) {
      console.error('❌ Error al consultar RENIEC:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión con RENIEC'
      };
    }
  }

  /**
   * Formatear nombre completo
   * @param {Object} data - Datos de RENIEC
   * @returns {string} Nombre completo formateado
   */
  formatFullName(data) {
    const nombres = data.nombres || '';
    const paterno = data.apellidoPaterno || '';
    const materno = data.apellidoMaterno || '';
    return `${paterno} ${materno} ${nombres}`.trim();
  }

  /**
   * Validar formato de DNI
   * @param {string} dni - DNI a validar
   * @returns {Object} Resultado de validación
   */
  validateDNI(dni) {
    if (!dni) {
      return {
        isValid: false,
        error: 'Debe ingresar un DNI'
      };
    }

    if (!/^\d+$/.test(dni)) {
      return {
        isValid: false,
        error: 'El DNI solo debe contener números'
      };
    }

    if (dni.length !== 8) {
      return {
        isValid: false,
        error: 'El DNI debe tener exactamente 8 dígitos'
      };
    }

    return {
      isValid: true
    };
  }
}

// Exportar instancia única del servicio
const reniecService = new ReniecService();
export default reniecService;
