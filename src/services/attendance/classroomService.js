/**
 * Servicio para la gestión de aulas del auxiliar
 */

const API_BASE_URL = 'https://lab.vallegrande.edu.pe/school/gateway/api/v1/academics';
const ENROLLMENTS_API_BASE_URL = 'https://lab.vallegrande.edu.pe/school/gateway/api/v1/enrollments';

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
 * Obtener estudiantes matriculados en un aula específica
 * @param {string} classroomId - ID del aula
 * @returns {Promise<Array>} Lista de estudiantes matriculados con sus datos completos
 */
export const getStudentsByClassroom = async (classroomId) => {
  try {
    console.log(`📤 Obteniendo estudiantes del aula ${classroomId}`);
    
    const response = await fetch(`${ENROLLMENTS_API_BASE_URL}/auxiliary/by-classroom/${classroomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al cargar los estudiantes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const students = Array.isArray(data.data) ? data.data : [];
    
    console.log(`✅ Estudiantes cargados: ${students.length}`);
    
    // Transformar datos para incluir el nombre completo concatenado
    return students.map(student => ({
      ...student,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      studentName: `${student.firstName} ${student.lastName}`.trim()
    }));
    
  } catch (error) {
    console.error('❌ Error en getStudentsByClassroom:', error);
    throw error;
  }
};

/**
 * Obtener color de fondo aleatorio para las tarjetas de aulas
 * @returns {string} Color hexadecimal aleatorio
 */
export const getRandomClassroomColor = () => {
  const colors = [
    '#f59e0b', // Naranja
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#8b5cf6', // Púrpura
    '#ec4899', // Rosa
    '#06b6d4', // Cian
    '#ef4444', // Rojo
    '#84cc16', // Lima
    '#f97316', // Naranja brillante
    '#6366f1', // Índigo
    '#14b8a6', // Teal
    '#f43f5e', // Rosa intenso
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const classroomService = {
  getAuxiliaryClassrooms,
  getClassroomById,
  getStudentsByClassroom,
  getRandomClassroomColor
};

export default classroomService;
