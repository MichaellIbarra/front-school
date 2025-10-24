import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Select, Button, DatePicker, Modal, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/es_ES';
import periodService from '../../../services/academic/periodService';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { PeriodRequest, periodTypeToBackend, periodTypeFromBackend, getPeriodsForLevel, generateAcademicYears } from '../../../types/academic/period.types';

const { Option } = Select;

const PeriodFormModal = ({
  visible,
  onCancel,
  onSuccess,
  periodData = null,
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  useEffect(() => {
    if (visible) {
      if (periodData && mode === 'edit') {
        setIsEdit(true);
        populateForm(periodData);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, periodData, mode]);

  const resetForm = () => {
    form.resetFields();
    // Establecer "ANUAL" como valor por defecto
    form.setFieldsValue({
      periodType: 'ANUAL'
    });
    setSelectedLevel('');
    setAvailablePeriods([]);
  };

  const populateForm = (period) => {
    const convertedPeriodType = periodTypeFromBackend[period.periodType] || period.periodType;
    setSelectedLevel(period.level);
    setAvailablePeriods(getPeriodsForLevel(period.level));
    
    form.setFieldsValue({
      level: period.level,
      period: [period.period], // Envolver en array para el modo tags
      academicYear: period.academicYear,
      periodType: convertedPeriodType,
      startDate: period.startDate ? dayjs(period.startDate) : null,
      endDate: period.endDate ? dayjs(period.endDate) : null,
    });
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setAvailablePeriods(getPeriodsForLevel(level));
    form.setFieldsValue({ period: undefined });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // El institutionId se envía automáticamente en los headers por el servicio
      // No es necesario incluirlo en el payload según PeriodRequestDto del backend
      
      // Convertir el tipo de período al formato del backend
      const backendPeriodType = periodTypeToBackend[values.periodType] || values.periodType;
      
      // Si el período viene como array (modo tags), tomar el primer elemento
      const periodValue = Array.isArray(values.period) ? values.period[0] : values.period;
      
      const periodPayload = new PeriodRequest({
        level: values.level,
        period: periodValue,
        academicYear: values.academicYear,
        periodType: backendPeriodType,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
        status: 'A'
      });

      const validation = periodPayload.validate();
      if (!validation.isValid) {
        showError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      let response;
      if (isEdit && periodData?.id) {
        response = await periodService.updatePeriod(periodData.id, periodPayload);
      } else {
        response = await periodService.createPeriod(periodPayload);
      }

      if (response.success) {
        showSuccess(isEdit ? 'Período actualizado exitosamente' : 'Período creado exitosamente');
        form.resetFields();
        onSuccess && onSuccess(response.data);
        onCancel();
      } else {
        showError(response.error || `Error al ${isEdit ? 'actualizar' : 'crear'} período`);
      }
    } catch (err) {
      showError(`Error al ${isEdit ? 'actualizar' : 'crear'} período: ` + err.message);
    }
    setLoading(false);
  };

  const handleModalCancel = () => {
    form.resetFields();
    setSelectedLevel('');
    setAvailablePeriods([]);
    onCancel();
  };

  const academicYears = generateAcademicYears(2, 5);

  return (
    <>
      <Modal
        title={isEdit ? 'Editar Período Académico' : 'Nuevo Período Académico'}
        open={visible}
        onCancel={handleModalCancel}
        width={800}
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
                label="Nivel"
                name="level"
                rules={[{ required: true, message: 'El nivel es obligatorio' }]}
              >
                <Select placeholder="Seleccione un nivel" onChange={handleLevelChange}>
                  <Option value="INICIAL">Inicial</Option>
                  <Option value="PRIMARIA">Primaria</Option>
                  <Option value="SECUNDARIA">Secundaria</Option>
                  <Option value="SUPERIOR">Superior</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Período"
                name="period"
                rules={[{ required: true, message: 'El período es obligatorio' }]}
              >
                <Select 
                  placeholder="Seleccione un período" 
                  disabled={!selectedLevel}
                  showSearch
                  mode="tags"
                  maxCount={1}
                  tokenSeparators={[]}
                  dropdownStyle={{ display: selectedLevel ? 'block' : 'none' }}
                >
                  {availablePeriods.map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Año Académico"
                name="academicYear"
                rules={[{ required: true, message: 'El año es obligatorio' }]}
              >
                <Select placeholder="Seleccione un año">
                  {academicYears.map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Tipo de Período"
                name="periodType"
                rules={[{ required: true, message: 'El tipo es obligatorio' }]}
                initialValue="ANUAL"
              >
                <Select 
                  placeholder="Seleccione un tipo" 
                  disabled={true}
                  defaultValue="ANUAL"
                >
                  <Option value="BIMESTRE">Bimestre</Option>
                  <Option value="TRIMESTRE">Trimestre</Option>
                  <Option value="SEMESTRE">Semestre</Option>
                  <Option value="ANUAL">Anual</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Fecha de Inicio"
                name="startDate"
                rules={[{ required: true, message: 'La fecha de inicio es obligatoria' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Seleccione fecha"
                  className="w-100"
                  locale={locale}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Fecha de Fin"
                name="endDate"
                dependencies={['startDate']}
                rules={[
                  { required: true, message: 'La fecha de fin es obligatoria' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate) {
                        return Promise.resolve();
                      }
                      if (value.isBefore(startDate)) {
                        return Promise.reject(new Error('La fecha de fin no puede ser menor a la fecha de inicio'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Seleccione fecha"
                  className="w-100"
                  locale={locale}
                  disabledDate={(current) => {
                    const startDate = form.getFieldValue('startDate');
                    if (!startDate) return false;
                    return current && current.isBefore(startDate, 'day');
                  }}
                />
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

PeriodFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  periodData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

PeriodFormModal.defaultProps = {
  onSuccess: null,
  periodData: null,
};

export default PeriodFormModal;
