/**
 * Servicio para consultar datos de RENIEC
 */

class ReniecService {
  constructor() {
    this.baseURL = 'https://reniec.matichain.dev';
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

      // Construir la URL directa a la API de RENIEC
      const apiUrl = `${this.baseURL}/dni?dni=${dni}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // 15 segundos de timeout
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

      // Verificar que tengamos datos válidos en data.datos
      if (!data || !data.datos || !data.datos.nombres) {
        return {
          success: false,
          error: 'No se encontraron datos para este DNI'
        };
      }

      // Formatear y retornar los datos
      // La API matichain.dev devuelve la estructura en data.datos
      const reniecData = data.datos;
      return {
        success: true,
        data: {
          dni: reniecData.dni || dni,
          nombres: reniecData.nombres || '',
          apellidoPaterno: reniecData.ap_pat || '',
          apellidoMaterno: reniecData.ap_mat || '',
          nombreCompleto: this.formatFullName({
            nombres: reniecData.nombres,
            apellidoPaterno: reniecData.ap_pat,
            apellidoMaterno: reniecData.ap_mat
          }),
          // Datos adicionales de la nueva API
          fechaNacimiento: reniecData.fecha_nac || null,
          sexo: reniecData.sexo || null,
          estadoCivil: reniecData.est_civil || null,
          direccion: reniecData.direccion || '',
          ubigeoDir: reniecData.ubigeo_dir || '',
          madre: reniecData.madre || '',
          padre: reniecData.padre || '',
          fechaEmision: reniecData.fch_emision || null,
          fechaCaducidad: reniecData.fch_caducidad || null
        },
        mensaje: data.mensaje || 'Consulta exitosa'
      };

    } catch (error) {
      console.error('❌ Error al consultar RENIEC:', error);
      
      let errorMessage = 'Error al conectar con el servicio de RENIEC';
      
      if (error.name === 'AbortError') {
        // Timeout del AbortSignal
        errorMessage = 'La consulta a RENIEC tomó demasiado tiempo. Intenta nuevamente.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        // Error de conectividad
        errorMessage = 'No se pudo conectar con RENIEC. Intenta nuevamente.';
      } else if (error instanceof TypeError) {
        // Error de red o CORS
        errorMessage = 'Error de conexión con RENIEC. Verifica tu conexión a internet.';
      }
      
      return {
        success: false,
        error: errorMessage
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
