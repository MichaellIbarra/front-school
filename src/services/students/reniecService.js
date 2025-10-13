/**
 * Servicio para consultar datos de RENIEC
 * API: https://reniec.matichain.dev
 * Usando proxy CORS para evitar problemas de CORS
 */

import axios from 'axios';

// Proxy CORS para evitar bloqueos
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const RENIEC_API_BASE_URL = 'https://reniec.matichain.dev';

class ReniecService {
  /**
   * Busca una persona por DNI en RENIEC
   * @param {string} dni - Número de DNI (8 dígitos)
   * @returns {Promise<Object>} Datos de la persona
   */
  async searchByDNI(dni) {
    try {
      // Validar que el DNI tenga 8 dígitos
      if (!dni || !/^\d{8}$/.test(dni)) {
        return {
          success: false,
          error: 'El DNI debe tener 8 dígitos numéricos'
        };
      }

      // Construir la URL con el proxy CORS
      const apiUrl = `${RENIEC_API_BASE_URL}/personas/dni?dni=${dni}`;
      const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;

      const response = await axios.get(proxiedUrl, {
        timeout: 15000, // 15 segundos de timeout
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = response.data;

      // Verificar si hay datos
      if (!data.datos) {
        return {
          success: false,
          error: 'No se encontraron datos para este DNI'
        };
      }

      // Transformar los datos de RENIEC al formato del estudiante
      const personData = this.transformReniecData(data.datos);

      return {
        success: true,
        data: personData,
        raw: data // Datos originales por si se necesitan
      };

    } catch (error) {
      let errorMessage = 'Error al conectar con el servicio de RENIEC';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = `Error ${error.response.status}: ${error.response.data?.message || 'No se pudo consultar RENIEC'}`;
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con RENIEC. Intenta nuevamente.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'La consulta a RENIEC tomó demasiado tiempo. Intenta nuevamente.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Transforma los datos de RENIEC al formato del formulario de estudiante
   * @param {Object} reniecData - Datos de RENIEC
   * @returns {Object} Datos transformados
   */
  transformReniecData(reniecData) {
    // Parsear fecha de nacimiento
    let birthDate = null;
    if (reniecData.fecha_nac) {
      const date = new Date(reniecData.fecha_nac);
      if (!isNaN(date.getTime())) {
        // Formato YYYY-MM-DD para el input type="date"
        birthDate = date.toISOString().split('T')[0];
      }
    }

    // Determinar género (1 = Masculino, 6 = Femenino según RENIEC)
    let gender = null;
    if (reniecData.sexo === '1') {
      gender = 'MALE';
    } else if (reniecData.sexo === '6') {
      gender = 'FEMALE';
    }

    // Parsear dirección y ubigeo
    const address = reniecData.direccion || '';
    const ubigeo = reniecData.ubigeo_dir || '';

    // Determinar apoderado (preferir padre, si no hay usar madre)
    const nombrePadre = reniecData.padre ? reniecData.padre.trim() : '';
    const nombreMadre = reniecData.madre ? reniecData.madre.trim() : '';
    
    // Separar nombres y apellidos del apoderado
    let guardianFirstName = '';
    let guardianRelationship = '';
    
    if (nombrePadre) {
      // Usar el padre como apoderado
      guardianFirstName = nombrePadre;
      guardianRelationship = 'FATHER';
    } else if (nombreMadre) {
      // Usar la madre como apoderado
      guardianFirstName = nombreMadre;
      guardianRelationship = 'MOTHER';
    }

    return {
      // Datos personales del estudiante
      firstName: reniecData.nombres || '',
      lastName: `${reniecData.ap_pat || ''} ${reniecData.ap_mat || ''}`.trim(),
      documentType: 'DNI',
      documentNumber: reniecData.dni || '',
      birthDate: birthDate,
      gender: gender,
      
      // Dirección
      address: address,
      
      // Datos del apoderado (usando guardianName en lugar de guardianFirstName)
      guardianName: guardianFirstName,
      guardianLastName: '', // RENIEC no proporciona apellidos del apoderado
      guardianRelationship: guardianRelationship,
      guardianDocumentType: 'DNI', // Asumir DNI por defecto
      guardianDocumentNumber: '', // RENIEC no proporciona DNI del apoderado
      
      // Datos adicionales de RENIEC (para referencia)
      reniecData: {
        estadoCivil: reniecData.est_civil || '',
        ubigeoNacimiento: reniecData.ubigeo_nac || '',
        ubicacionDireccion: ubigeo,
        nombreMadre: nombreMadre,
        nombrePadre: nombrePadre,
        fechaEmision: reniecData.fch_emision || '',
        fechaCaducidad: reniecData.fch_caducidad || ''
      }
    };
  }

  /**
   * Valida si un DNI tiene el formato correcto
   * @param {string} dni - DNI a validar
   * @returns {boolean}
   */
  isValidDNI(dni) {
    return /^\d{8}$/.test(dni);
  }
}

export default new ReniecService();
