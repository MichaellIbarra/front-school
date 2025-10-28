/**
 * Servicio para la gestión de asignaciones WhatsApp de la secretaria
 * Conecta únicamente al backend local
 */

class NotificationsSecretaryService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_DOMAIN}/api/v1/notifications/secretary`;
  }

  /**
   * Obtiene el token de acceso del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene los headers de autorización para las peticiones
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Crear nueva asignación de aula
   * POST /api/v1/notifications/secretary/assignments/create
   */
  async createAssignment(assignmentData) {
    try {
      console.log('📤 Creando nueva asignación de aula:', assignmentData);

      const requestBody = {
        instance_id: assignmentData.instance_id,
        classroom_id: assignmentData.classroom_id,
        assignment_type: assignmentData.assignment_type || 'BROADCAST', // Valor predeterminado
        assignment_date: assignmentData.assignment_date || new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
      };

      console.log('🔗 URL:', `${this.baseURL}/assignments/create`);
      console.log('📦 Request body:', requestBody);

      const response = await fetch(`${this.baseURL}/assignments/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Asignación creada exitosamente:', result);

      return {
        success: true,
        message: result.message || 'Asignación creada exitosamente',
        data: result.assignment
      };

    } catch (error) {
      console.error('❌ Error al crear asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la asignación',
        data: null
      };
    }
  }

  /**
   * Listar todas las asignaciones
   * GET /api/v1/notifications/secretary/assignments
   */
  async getAssignments() {
    try {
      console.log('📤 Obteniendo todas las asignaciones');

      const response = await fetch(`${this.baseURL}/assignments`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Asignaciones obtenidas exitosamente:', result);

      return {
        success: true,
        message: result.message || 'Asignaciones cargadas exitosamente',
        data: {
          assignments: result.assignments || [],
          institutionId: result.institution_id,
          totalAssignments: result.total_assignments || 0
        }
      };

    } catch (error) {
      console.error('❌ Error al obtener asignaciones:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las asignaciones',
        data: { assignments: [], totalAssignments: 0 }
      };
    }
  }

  /**
   * Listar todas las instancias WhatsApp disponibles
   * GET /api/v1/notifications/secretary/assignments/instances
   */
  async getInstances() {
    try {
      console.log('📤 Obteniendo instancias WhatsApp disponibles');

      const response = await fetch(`${this.baseURL}/assignments/instances`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Instancias obtenidas exitosamente:', result);

      return {
        success: true,
        message: result.message || 'Instancias cargadas exitosamente',
        data: {
          instances: result.instances || [],
          institutionId: result.institution_id,
          totalInstances: result.total_instances || 0
        }
      };

    } catch (error) {
      console.error('❌ Error al obtener instancias:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las instancias',
        data: { instances: [], totalInstances: 0 }
      };
    }
  }

  /**
   * Obtener todas las aulas disponibles
   * GET /api/v1/academics/classrooms/secretary/classrooms
   */
  async getClassrooms() {
    try {
      console.log('📤 Obteniendo aulas disponibles');

      const response = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/academics/classrooms/secretary/classrooms`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Aulas obtenidas exitosamente:', result);

      return {
        success: true,
        message: result.message || 'Aulas cargadas exitosamente',
        data: {
          classrooms: result.data || [],
          institutionId: result.institutionId,
          totalClassrooms: result.total || 0
        }
      };

    } catch (error) {
      console.error('❌ Error al obtener aulas:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las aulas',
        data: { classrooms: [], totalClassrooms: 0 }
      };
    }
  }

  /**
   * Obtener asignaciones por aula específica
   * GET /api/v1/notifications/secretary/assignments/by-classroom/{classroom_id}
   */
  async getAssignmentsByClassroom(classroomId) {
    try {
      console.log(`📤 Obteniendo asignaciones para aula: ${classroomId}`);

      const response = await fetch(`${this.baseURL}/assignments/by-classroom/${classroomId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Asignaciones por aula obtenidas:', result);

      return {
        success: true,
        message: result.message || 'Asignaciones por aula cargadas exitosamente',
        data: {
          assignments: result.assignments || [],
          institutionId: result.institution_id,
          totalAssignments: result.total_assignments || 0
        }
      };

    } catch (error) {
      console.error('❌ Error al obtener asignaciones por aula:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las asignaciones por aula',
        data: { assignments: [], totalAssignments: 0 }
      };
    }
  }

  /**
   * Actualizar asignación existente
   * PUT /api/v1/notifications/secretary/assignments/update/{assignment_id}
   */
  async updateAssignment(assignmentId, updateData) {
    try {
      console.log(`📤 Actualizando asignación: ${assignmentId}`, updateData);

      const requestBody = {
        instance_id: updateData.instance_id,
        assignment_date: updateData.assignment_date
      };

      console.log('🔗 URL:', `${this.baseURL}/assignments/update/${assignmentId}`);
      console.log('📦 Request body:', requestBody);

      const response = await fetch(`${this.baseURL}/assignments/update/${assignmentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Asignación actualizada exitosamente:', result);

      return {
        success: true,
        message: result.message || 'Asignación actualizada exitosamente',
        data: result.assignment
      };

    } catch (error) {
      console.error('❌ Error al actualizar asignación:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la asignación',
        data: null
      };
    }
  }

  /**
   * Validar datos de asignación
   */
  validateAssignmentData(assignmentData) {
    const errors = [];

    if (!assignmentData.instance_id || assignmentData.instance_id.trim() === '') {
      errors.push('La instancia WhatsApp es obligatoria');
    }

    if (!assignmentData.classroom_id || assignmentData.classroom_id.trim() === '') {
      errors.push('El aula es obligatoria');
    }

    return errors;
  }

  /**
   * Formatear respuesta de error
   */
  formatError(message, data = null) {
    return {
      success: false,
      error: message,
      data: data
    };
  }

  /**
   * Formatear respuesta de éxito
   */
  formatSuccess(message, data = null) {
    return {
      success: true,
      message: message,
      data: data
    };
  }
}

export default new NotificationsSecretaryService();