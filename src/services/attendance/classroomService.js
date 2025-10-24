/**
 * Servicio para la gestión de aulas del auxiliar
 */

const API_BASE_URL = 'https://lab.vallegrande.edu.pe/school/gateway/api/v1/academics';

/**
 * Obtener el token de autenticación
 */
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Obtener las aulas asignadas al auxiliar actual
 * @returns {Promise<Array>} Lista de aulas asignadas
 */
export const getAuxiliaryClassrooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auxiliary/classroom`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al cargar las aulas: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('❌ Error en getAuxiliaryClassrooms:', error);
    throw error;
  }
};

/**
 * Obtener información de un aula específica buscando en la lista de aulas
 * @param {string} classroomId - ID del aula
 * @returns {Promise<Object>} Información del aula
 */
export const getClassroomById = async (classroomId) => {
  try {
    // Obtener todas las aulas y buscar la específica
    const classrooms = await getAuxiliaryClassrooms();
    const classroom = classrooms.find(c => c.id === classroomId);
    
    if (!classroom) {
      throw new Error(`No se encontró el aula con ID: ${classroomId}`);
    }
    
    return classroom;
  } catch (error) {
    console.error('❌ Error en getClassroomById:', error);
    throw error;
  }
};

/**
 * Obtener color de fondo según el grado (función helper)
 * @param {number} grade - Grado del aula (1-6)
 * @returns {string} Color hexadecimal
 */
export const getGradeColor = (grade) => {
  const colors = [
    '#f59e0b', // Naranja - 1°
    '#3b82f6', // Azul - 2°
    '#10b981', // Verde - 3°
    '#8b5cf6', // Púrpura - 4°
    '#ec4899', // Rosa - 5°
    '#06b6d4', // Cian - 6°
  ];
  return colors[(grade - 1) % colors.length];
};

const classroomService = {
  getAuxiliaryClassrooms,
  getClassroomById,
  getGradeColor
};

export default classroomService;
