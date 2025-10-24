import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select, InputNumber, Button, Modal, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import classroomService from '../../../services/academic/classroomService';
import periodService from '../../../services/academic/periodService';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { ClassroomRequest, validateClassroom, ShiftEnum, getShiftText } from '../../../types/academic/classroom.types';

const { Option } = Select;

const ClassroomFormModal = ({
  visible,
  onCancel,
  onSuccess,
  classroomData = null,
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');
  const [periods, setPeriods] = useState([]);
  const [headquarters, setHeadquarters] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (visible) {
      const initializeModal = async () => {
        // Primero cargar los datos (sedes y períodos)
        await loadInitialData();
        
        // Luego poblar el formulario si es edición
        if (classroomData && mode === 'edit') {
          setIsEdit(true);
          populateForm(classroomData);
        } else {
          setIsEdit(false);
          resetForm();
        }
      };
      
      initializeModal();
    }
  }, [visible, classroomData, mode]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Cargar sedes desde el endpoint personal
      console.log('🔄 Iniciando carga de sedes...');
      const headquartersResponse = await fetch(
        'https://lab.vallegrande.edu.pe/school/gateway/api/v1/headquarters/personal',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      console.log('📡 Respuesta de sedes - Status:', headquartersResponse.status);

      if (headquartersResponse.ok) {
        const headquartersData = await headquartersResponse.json();
        console.log('📍 Datos completos de sedes:', headquartersData);
        console.log('📍 Estructura completa:', JSON.stringify(headquartersData, null, 2));
        
        // El endpoint puede retornar diferentes estructuras, verificar ambas
        let sedesArray = [];
        
        // Opción 1: { data: [...] }
        if (headquartersData.data && Array.isArray(headquartersData.data)) {
          sedesArray = headquartersData.data;
          console.log('📍 Usando estructura: data array');
        }
        // Opción 2: { headquarters: [...] }
        else if (headquartersData.headquarters && Array.isArray(headquartersData.headquarters)) {
          sedesArray = headquartersData.headquarters;
          console.log('📍 Usando estructura: headquarters array');
        }
        // Opción 3: El objeto mismo es un array
        else if (Array.isArray(headquartersData)) {
          sedesArray = headquartersData;
          console.log('📍 Usando estructura: array directo');
        }
        
        console.log('📍 Array de sedes extraído:', sedesArray);
        console.log('📍 Cantidad de sedes:', sedesArray.length);
        
        setHeadquarters(sedesArray);
        console.log('✅ Sedes guardadas en estado:', sedesArray);
        
        if (sedesArray.length === 0) {
          console.warn('⚠️ No se encontraron sedes en la respuesta');
        }
      } else {
        console.error('❌ Error al cargar sedes - Status:', headquartersResponse.status);
        const errorText = await headquartersResponse.text();
        console.error('❌ Error detalle:', errorText);
        showError('Error al cargar las sedes');
      }

      // Cargar períodos desde el backend
      console.log('🔄 Iniciando carga de períodos...');
      const periodResponse = await periodService.getAllPeriods();
      if (periodResponse.success) {
        // Construir nombres de períodos
        const periodsWithNames = (periodResponse.data || []).map(period => {
          const periodTypeMap = {
            'BIMESTER': 'Bimestre',
            'TRIMESTER': 'Trimestre',
            'SEMESTER': 'Semestre',
            'ANNUAL': 'Anual'
          };
          const periodTypeName = periodTypeMap[period.periodType] || period.periodType;
          const name = `${period.period} ${periodTypeName} - ${period.academicYear} (${period.level})`;
          return {
            ...period,
            name: name
          };
        });
        setPeriods(periodsWithNames);
        console.log('✅ Períodos guardados:', periodsWithNames.length);
      }
    } catch (err) {
      console.error('❌ Error al cargar datos iniciales:', err);
      showError('Error al cargar los datos necesarios');
    }
    setLoadingData(false);
  };

  const resetForm = () => {
    form.resetFields();
  };

  const populateForm = (classroom) => {
    form.setFieldsValue({
      headquarterId: classroom.headquarterId,
      periodId: classroom.periodId,
      section: classroom.section,
      grade: classroom.grade,
      shift: classroom.shift,
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const classroomPayload = new ClassroomRequest({
        headquarterId: values.headquarterId,
        periodId: values.periodId,
        section: values.section.toUpperCase(),
        grade: values.grade,
        shift: values.shift,
      });

      console.log('📤 Enviando payload al backend:', {
        isEdit,
        classroomId: classroomData?.id,
        payload: classroomPayload,
        formValues: values
      });

      const validationError = validateClassroom(classroomPayload);
      if (validationError) {
        showError(validationError);
        setLoading(false);
        return;
      }

      let response;
      if (isEdit && classroomData?.id) {
        console.log('🔄 Actualizando aula con ID:', classroomData.id);
        response = await classroomService.updateClassroom(classroomData.id, classroomPayload);
      } else {
        console.log('➕ Creando nueva aula');
        response = await classroomService.createClassroom(classroomPayload);
      }

      console.log('📥 Respuesta del backend:', response);

      if (response.success) {
        form.resetFields();
        
        // Preparar datos para actualización local en el frontend
        const updatedData = {
          ...(response.data || {}),
          id: isEdit ? classroomData.id : (response.data?.id || null),
          headquarterId: classroomPayload.headquarterId,
          periodId: classroomPayload.periodId,
          section: classroomPayload.section,
          grade: classroomPayload.grade,
          shift: classroomPayload.shift,
          status: classroomPayload.status
        };
        
        console.log('📤 Datos para actualización local:', updatedData);
        onSuccess && onSuccess(updatedData, isEdit);
        onCancel();
      } else {
        showError(response.error || `Error al ${isEdit ? 'actualizar' : 'crear'} aula`);
      }
    } catch (err) {
      console.error('❌ Error en handleSubmit:', err);
      showError(`Error al ${isEdit ? 'actualizar' : 'crear'} aula: ` + err.message);
    }
    setLoading(false);
  };

  const handleModalCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <>
      <Modal
        title={isEdit ? 'Editar Aula' : 'Nueva Aula'}
        open={visible}
        onCancel={handleModalCancel}
        width={700}
        footer={null}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Sede"
                name="headquarterId"
                rules={[
                  { required: true, message: 'La sede es obligatoria' }
                ]}
              >
                <Select
                  placeholder="Seleccione una sede"
                  showSearch
                  optionFilterProp="children"
                  loading={loadingData}
                  disabled={loadingData}
                  onDropdownVisibleChange={(open) => {
                    if (open) {
                      console.log('🔍 Select de sedes abierto. Sedes disponibles:', headquarters);
                      console.log('🔍 Cantidad:', headquarters.length);
                    }
                  }}
                >
                  {headquarters.map(hq => {
                    console.log('🏢 Renderizando sede:', hq);
                    const displayName = hq.name || hq.headquartersName || hq.id;
                    return (
                      <Option key={hq.id} value={hq.id}>
                        {displayName}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Período Académico"
                name="periodId"
                rules={[
                  { required: true, message: 'El período es obligatorio' }
                ]}
              >
                <Select
                  placeholder="Seleccione un período"
                  loading={loadingData}
                  disabled={loadingData}
                  showSearch
                  optionFilterProp="children"
                >
                  {periods.map(period => (
                    <Option key={period.id} value={period.id}>
                      {period.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                label="Grado"
                name="grade"
                rules={[
                  { required: true, message: 'El grado es obligatorio' }
                ]}
              >
                <InputNumber
                  placeholder="1-6"
                  min={1}
                  max={6}
                  className="w-100"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                label="Sección"
                name="section"
                rules={[
                  { required: true, message: 'La sección es obligatoria' },
                  { pattern: /^[A-Za-z]$/, message: 'Debe ser una letra (A, B, C, etc.)' }
                ]}
              >
                <Input
                  placeholder="A, B, C..."
                  maxLength={1}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                label="Turno"
                name="shift"
                rules={[
                  { required: true, message: 'El turno es obligatorio' }
                ]}
              >
                <Select placeholder="Seleccione un turno">
                  <Option value={ShiftEnum.MORNING}>{getShiftText(ShiftEnum.MORNING)}</Option>
                  <Option value={ShiftEnum.AFTERNOON}>{getShiftText(ShiftEnum.AFTERNOON)}</Option>
                  <Option value={ShiftEnum.NIGHT}>{getShiftText(ShiftEnum.NIGHT)}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button onClick={handleModalCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
            </Button>
          </div>
        </Form>
      </Modal>

      <AlertModal alert={alertState} onConfirm={alertConfirm} onCancel={alertCancel} />
    </>
  );
};

ClassroomFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  classroomData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

ClassroomFormModal.defaultProps = {
  onSuccess: null,
  classroomData: null,
};

export default ClassroomFormModal;
