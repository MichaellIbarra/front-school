class EscaleMinduService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:5000/instituciones';
  }

  /**
   * Busca una institución por código modular en ESCALE MINEDU
   * @param {string} codmod - Código modular de la institución
   * @returns {Promise<Object>} Respuesta con los datos de la institución
   */
  async searchInstitutionByCode(codmod) {
    try {
      if (!codmod || codmod.trim().length === 0) {
        throw new Error('Código modular es requerido');
      }

      const params = new URLSearchParams({
        nombreIE: '',
        codmod: codmod.trim()
      });

      const url = `${this.baseURL}?${params.toString()}`;
      
      console.log('🔍 ESCALE Service - Buscando institución con código:', codmod);
      console.log('🌐 URL de petición:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 ESCALE Service - Respuesta recibida:', data);

      // La API retorna un objeto único cuando busca por código
      if (data.items && typeof data.items === 'object') {
        return {
          success: true,
          data: data.items,
          message: 'Institución encontrada en ESCALE MINEDU'
        };
      } else {
        return {
          success: false,
          error: 'No se encontró la institución con el código proporcionado',
          data: null
        };
      }
    } catch (error) {
      console.error('❌ Error en ESCALE Service:', error);
      return {
        success: false,
        error: error.message || 'Error al consultar ESCALE MINEDU',
        data: null
      };
    }
  }

  /**
   * Extrae y formatea los datos relevantes de una institución de ESCALE
   * @param {Object} escaleinstitution - Datos de la institución desde ESCALE
   * @returns {Object} Datos formateados para el formulario
   */
  formatInstitutionData(escaleinstitution) {
    if (!escaleinstitution) return null;

    try {
      // Construir dirección completa
      let address = '';
      
      if (escaleinstitution.dirCen) {
        address = escaleinstitution.dirCen;
      }

      if (escaleinstitution.distrito?.nombreDistrito) {
        address += address ? `, ${escaleinstitution.distrito.nombreDistrito}` : escaleinstitution.distrito.nombreDistrito;
      }

      if (escaleinstitution.distrito?.provincia?.nombreProvincia) {
        address += `, ${escaleinstitution.distrito.provincia.nombreProvincia}`;
      }

      if (escaleinstitution.distrito?.provincia?.region?.nombreRegion) {
        address += `, ${escaleinstitution.distrito.provincia.region.nombreRegion}`;
      }

      return {
        name: escaleinstitution.cenEdu || '',
        address: address.trim(),
        modularCode: escaleinstitution.codMod || '',
        // Datos adicionales que podrían ser útiles
        director: escaleinstitution.director || '',
        phone: escaleinstitution.telefono || '',
        ugel: escaleinstitution.ugel?.nombreUgel || '',
        nivel: escaleinstitution.nivelModalidad?.valor || '',
        gestion: escaleinstitution.gestion || '',
        estado: escaleinstitution.estado?.valor || ''
      };
    } catch (error) {
      console.error('❌ Error al formatear datos de institución:', error);
      return null;
    }
  }

  /**
   * Verifica si el código modular es válido (solo números, longitud apropiada)
   * @param {string} codmod - Código modular a validar
   * @returns {boolean} True si es válido
   */
  isValidModularCode(codmod) {
    if (!codmod) return false;
    
    const cleanCode = codmod.trim();
    
    // Debe ser solo números y tener entre 5 y 10 caracteres
    return /^\d{5,10}$/.test(cleanCode);
  }
}

export default new EscaleMinduService();