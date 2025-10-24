import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select, Button, InputNumber, Modal, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import courseService from '../../../services/academic/courseService';
import AlertModal from '../../../components/AlertModal';
import useAlert from '../../../hooks/useAlert';
import { CourseRequest } from '../../../types/academic/course.types';

const { Option } = Select;
const { TextArea } = Input;

const CourseFormModal = ({
  visible,
  onCancel,
  onSuccess,
  courseData = null,
  mode = 'create' // 'create' o 'edit'
}) => {
  const [form] = Form.useForm();
  const { alertState, showSuccess, showError, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(mode === 'edit');

  useEffect(() => {
    if (visible) {
      if (courseData && mode === 'edit') {
        setIsEdit(true);
        populateForm(courseData);
      } else {
        setIsEdit(false);
        resetForm();
      }
    }
  }, [visible, courseData, mode]);

  const resetForm = () => {
    form.resetFields();
  };

  const populateForm = (course) => {
    form.setFieldsValue({
      courseCode: course.courseCode,
      courseName: course.courseName,
      level: course.level,
      hoursPerWeek: course.hoursPerWeek,
      description: course.description || '',
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // El institutionId se envía automáticamente en los headers por el servicio
      // No es necesario incluirlo en el payload según CourseRequestDto del backend
      const coursePayload = new CourseRequest({
        courseCode: values.courseCode,
        courseName: values.courseName,
        level: values.level,
        hoursPerWeek: values.hoursPerWeek,
        description: values.description || '',
        status: 'A'
      });

      const validation = coursePayload.validate();
      if (!validation.isValid) {
        showError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      let response;
      if (isEdit && courseData?.id) {
        response = await courseService.updateCourse(courseData.id, coursePayload);
      } else {
        response = await courseService.createCourse(coursePayload);
      }

      if (response.success) {
        showSuccess(isEdit ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente');
        form.resetFields();
        onSuccess && onSuccess(response.data);
        onCancel();
      } else {
        showError(response.error || `Error al ${isEdit ? 'actualizar' : 'crear'} curso`);
      }
    } catch (err) {
      showError(`Error al ${isEdit ? 'actualizar' : 'crear'} curso: ` + err.message);
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
        title={isEdit ? 'Editar Curso' : 'Nuevo Curso'}
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
                label="Código del Curso"
                name="courseCode"
                rules={[
                  { required: true, message: 'El código es obligatorio' },
                  { min: 2, message: 'El código debe tener al menos 2 caracteres' },
                  { max: 20, message: 'El código no puede exceder 20 caracteres' }
                ]}
              >
                <Input placeholder="Ej: MAT-101" maxLength={20} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Nombre del Curso"
                name="courseName"
                rules={[
                  { required: true, message: 'El nombre es obligatorio' },
                  { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                  { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                ]}
              >
                <Input placeholder="Ej: Matemáticas" maxLength={100} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Nivel"
                name="level"
                rules={[{ required: true, message: 'El nivel es obligatorio' }]}
              >
                <Select placeholder="Seleccione un nivel">
                  <Option value="INICIAL">Inicial</Option>
                  <Option value="PRIMARIA">Primaria</Option>
                  <Option value="SECUNDARIA">Secundaria</Option>
                  <Option value="SUPERIOR">Superior</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Horas por Semana"
                name="hoursPerWeek"
                rules={[
                  { required: true, message: 'Las horas son obligatorias' },
                  { type: 'number', min: 1, max: 40, message: 'Debe estar entre 1 y 40 horas' }
                ]}
              >
                <InputNumber min={1} max={40} placeholder="Ej: 4" className="w-100" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Descripción"
                name="description"
                rules={[
                  { max: 255, message: 'La descripción no puede exceder 255 caracteres' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Descripción del curso (opcional)"
                  maxLength={255}
                  showCount
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

CourseFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  courseData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

CourseFormModal.defaultProps = {
  onSuccess: null,
  courseData: null,
};

export default CourseFormModal;
