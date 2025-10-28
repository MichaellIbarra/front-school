/**
 * Servicio simplificado para la gestión de notificaciones WhatsApp del director
 * Conecta directamente a la API externa
 */

class NotificationsDirectorService {
  constructor() {
    this.baseURL = 'https://terrible-cackle-97q7xwvqv7xfqxx-9002.app.github.dev';
    this.apiKey = 'EU87YUEY272UQU';
  }

  /**
   * Obtiene los headers para las peticiones a la API externa
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey
    };
  }

  /**
   * Crear nueva instancia WhatsApp
   * POST /instance/create (API externa) + POST local
   */
  async createInstance(instanceData) {
    try {
      console.log('📤 Creando nueva instancia WhatsApp:', instanceData);

      const requestBody = {
        instanceName: instanceData.instanceName || instanceData.instance_name,
        number: instanceData.phoneNumber || instanceData.phone_number,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      console.log('🔗 URL API externa:', `${this.baseURL}/instance/create`);
      console.log('📦 Request body API externa:', requestBody);

      // Paso 1: Crear instancia en la API externa
      const externalResponse = await fetch(`${this.baseURL}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status API externa:', externalResponse.status);

      if (!externalResponse.ok) {
        throw new Error(`Error en API externa! status: ${externalResponse.status}`);
      }

      const externalResult = await externalResponse.json();
      console.log('✅ Instancia creada en API externa:', externalResult);

      // Paso 2: Preparar datos para el backend local
      const localRequestBody = {
        ...externalResult,
        phone_number: requestBody.number
      };

      console.log('🔗 URL backend local:', `${process.env.REACT_APP_DOMAIN}/api/v1/notifications/director/instances/create`);
      console.log('📦 Request body backend local:', localRequestBody);

      // Paso 3: Registrar instancia en el backend local
      const localResponse = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/notifications/director/instances/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(localRequestBody)
      });

      console.log('📊 Response status backend local:', localResponse.status);

      if (!localResponse.ok) {
        throw new Error(`Error en backend local! status: ${localResponse.status}`);
      }

      const localResult = await localResponse.json();
      console.log('✅ Instancia registrada en backend local:', localResult);

      // Paso 4: Mapear la respuesta final para el frontend
      return {
        success: true,
        message: localResult.message || 'Instancia creada exitosamente',
        data: {
          // Datos del backend local (formato final)
          id: localResult.instance.id,
          instanceName: localResult.instance.instance_name,
          instanceId: externalResult.instance.instanceId,
          instanceCode: localResult.instance.instance_code,
          phoneNumber: localResult.instance.phone_number,
          status: localResult.instance.status,
          connectionStatus: localResult.instance.connection_status,
          base64: localResult.instance.base64,
          pairingCode: externalResult.qrcode.pairingCode,
          createdAt: localResult.instance.created_at,
          updatedAt: localResult.instance.updated_at
        }
      };

    } catch (error) {
      console.error('❌ Error al crear instancia WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la instancia WhatsApp',
        data: null
      };
    }
  }

  // Métodos implementados
  async getInstances() {
    try {
      console.log('📤 Obteniendo instancias WhatsApp');

      const response = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/notifications/director/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
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
      console.error('❌ Error al obtener instancias WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar las instancias WhatsApp',
        data: { instances: [], totalInstances: 0 }
      };
    }
  }

  async getInstanceDetails(instanceId) {
    try {
      console.log(`📤 Obteniendo detalles de instancia: ${instanceId}`);

      const response = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/notifications/director/instances/${instanceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Detalles de instancia obtenidos:', result);

      return {
        success: true,
        message: result.message || 'Detalles obtenidos exitosamente',
        data: result.instance
      };

    } catch (error) {
      console.error('❌ Error al obtener detalles de instancia:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar los detalles de la instancia',
        data: null
      };
    }
  }

  async deleteInstance() {
    return {
      success: false,
      error: 'Función no implementada aún',
      data: null
    };
  }

  async getDeletedInstances() {
    return {
      success: true,
      message: 'Instancias eliminadas cargadas exitosamente',
      data: { instances: [], totalInstances: 0 }
    };
  }

  async restoreInstance() {
    return {
      success: false,
      error: 'Función no implementada aún',
      data: null
    };
  }

  async getInstanceStatus() {
    return {
      success: false,
      error: 'Función no implementada aún',
      data: null
    };
  }

  async resetInstance(instanceData) {
    try {
      console.log('🔄 Reiniciando instancia WhatsApp:', instanceData);

      // Paso 1: Eliminar instancia del API externo
      console.log(`🗑️ Eliminando instancia externa: ${instanceData.instanceName}`);
      
      const deleteResponse = await fetch(`${this.baseURL}/instance/delete/${instanceData.instanceName}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      console.log('📊 Delete response status:', deleteResponse.status);

      if (!deleteResponse.ok) {
        throw new Error(`Error al eliminar instancia externa! status: ${deleteResponse.status}`);
      }

      const deleteResult = await deleteResponse.json();
      console.log('✅ Instancia eliminada del API externo:', deleteResult);

      // Esperar unos segundos antes de recrear
      console.log('⏳ Esperando antes de recrear la instancia...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos

      // Paso 2: Recrear instancia en API externa
      const createRequestBody = {
        instanceName: instanceData.instanceName,
        number: instanceData.phoneNumber || instanceData.phone_number, // Usar el número proporcionado o el original
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      console.log('🔗 Recreando instancia en API externa:', createRequestBody);

      const createResponse = await fetch(`${this.baseURL}/instance/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(createRequestBody)
      });

      console.log('📊 Create response status:', createResponse.status);

      if (!createResponse.ok) {
        throw new Error(`Error al recrear instancia externa! status: ${createResponse.status}`);
      }

      const createResult = await createResponse.json();
      console.log('✅ Instancia recreada en API externa:', createResult);

      // Paso 3: Actualizar instancia en backend local usando PUT
      const localUpdateBody = {
        instance: {
          instanceName: createResult.instance.instanceName,
          instanceId: createResult.instance.instanceId,
          integration: "WHATSAPP-BAILEYS",
          webhookWaBusiness: null,
          accessTokenWaBusiness: "",
          status: "connecting"
        },
        hash: createResult.hash,
        webhook: {},
        websocket: {},
        rabbitmq: {},
        sqs: {},
        settings: {
          rejectCall: false,
          msgCall: "",
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
          wavoipToken: ""
        },
        qrcode: {
          pairingCode: createResult.qrcode.pairingCode,
          code: createResult.qrcode.code,
          base64: createResult.qrcode.base64
        },
        phoneNumber: createRequestBody.number
      };

      console.log('🔗 Actualizando instancia en backend local:', localUpdateBody);

      const localResponse = await fetch(`${process.env.REACT_APP_DOMAIN}/api/v1/notifications/director/instances/${instanceData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(localUpdateBody)
      });

      console.log('📊 Local update response status:', localResponse.status);

      if (!localResponse.ok) {
        throw new Error(`Error al actualizar backend local! status: ${localResponse.status}`);
      }

      const localResult = await localResponse.json();
      console.log('✅ Backend local actualizado exitosamente:', localResult);

      // Paso 4: Retornar respuesta final con datos combinados
      return {
        success: true,
        message: 'Instancia reiniciada exitosamente',
        data: {
          // Datos combinados del API externo y backend local
          id: instanceData.id, // ID original del backend local
          instanceName: createResult.instance.instanceName,
          instanceId: createResult.instance.instanceId,
          instanceCode: instanceData.instanceCode, // Mantener el código original
          phoneNumber: createRequestBody.number,
          base64: createResult.qrcode.base64,
          pairingCode: createResult.qrcode.pairingCode,
          status: 'ACTIVE',
          connectionStatus: 'SCANNING'
        }
      };

    } catch (error) {
      console.error('❌ Error al reiniciar instancia WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error al reiniciar la instancia WhatsApp',
        data: null
      };
    }
  }

  validateInstanceData(instanceData) {
    const errors = [];

    if (!instanceData.instanceName || instanceData.instanceName.trim() === '') {
      errors.push('El nombre de la instancia es obligatorio');
    }

    if (!instanceData.phoneNumber || instanceData.phoneNumber.trim() === '') {
      errors.push('El número de teléfono es obligatorio');
    } else if (!/^51\d{9}$/.test(instanceData.phoneNumber)) {
      errors.push('El número debe tener formato peruano: 51XXXXXXXXX');
    }

    return errors;
  }

  formatError(message, data = null) {
    return {
      success: false,
      error: message,
      data: data
    };
  }

  formatSuccess(message, data = null) {
    return {
      success: true,
      message: message,
      data: data
    };
  }
}

export default new NotificationsDirectorService();