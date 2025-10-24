import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Button, Select, DatePicker } from "antd";
import { SaveOutlined, UserOutlined } from "@ant-design/icons";
import moment from "moment";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import useAlert from "../../../hooks/useAlert";
import enrollmentService from "../../../services/enrollments/enrollmentService";
import studentService from "../../../services/students/studentService";
import classroomService from "../../../services/academic/classroomService";
import { EnrollmentStatus, EnrollmentType } from "../../../types/enrollments/enrollments";

const { Option } = Select;

const EditEnrollment = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (location.state && location.state.enrollment) {
        const enrollment = location.state.enrollment;
        form.setFieldsValue({
          ...enrollment,
          enrollmentDate: enrollment.enrollmentDate ? moment(enrollment.enrollmentDate.join('-')) : null,
        });

        // Fetch student details
        const studentResponse = await studentService.getStudentById(enrollment.studentId);
        if (studentResponse.success) {
          setStudentDetails(studentResponse.data);
        } else {
          showError(studentResponse.error || "Error al cargar los datos del estudiante");
        }

        // Fetch classrooms
        const classroomsResponse = await classroomService.getAllClassrooms();
        if (classroomsResponse.success) {
          setClassrooms(classroomsResponse.data);
        } else {
          showError(classroomsResponse.error || "Error al cargar las aulas");
        }
      } else {
        showError("No se encontraron datos de la matrícula para editar.");
        navigate("/secretary/enrollments");
      }
    };

    fetchData();
  }, [location.state, form, navigate, showError, id]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        enrollmentDate: values.enrollmentDate ? values.enrollmentDate.format("YYYY-MM-DD") : null,
      };
      const response = await enrollmentService.updateEnrollment(id, formattedValues);
      if (response.success) {
        showSuccess("Matrícula actualizada exitosamente");
        navigate("/secretary/enrollments");
      } else {
        showError(response.error || "Error al actualizar la matrícula");
      }
    } catch (error) {
      console.error("Error updating enrollment:", error);
      showError("Error de red al actualizar la matrícula");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Editar Matrícula</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/enrollments">Matrículas</Link>
                    </li>
                    <li className="breadcrumb-item active">Editar Matrícula</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                  >
                    <h6 className="form-section-title">Información de la Matrícula</h6>
                    <div className="row">
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Estudiante"
                          name="studentId"
                        >
                          <Input
                            disabled
                            value={studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName} (${studentDetails.documentType}: ${studentDetails.documentNumber})` : 'Cargando...'}
                            prefix={<UserOutlined />}
                          />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Aula"
                          name="classroomId"
                          rules={[{ required: true, message: "Por favor seleccione el aula" }]}
                        >
                          <Select
                            showSearch
                            placeholder="Seleccione un aula"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {classrooms.map(classroom => (
                              <Option key={classroom.id} value={classroom.id}>
                                {classroom.name} ({classroom.id})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Tipo de Matrícula"
                          name="enrollmentType"
                          rules={[{ required: true, message: "Por favor seleccione el tipo de matrícula" }]}
                        >
                          <Select placeholder="Seleccione tipo">
                            {Object.values(EnrollmentType).map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Fecha de Matrícula"
                          name="enrollmentDate"
                          rules={[{ required: true, message: "Por favor seleccione la fecha de matrícula" }]}
                        >
                          <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Estado"
                          name="status"
                          rules={[{ required: true, message: "Por favor seleccione el estado" }]}
                        >
                          <Select placeholder="Seleccione estado">
                            {Object.values(EnrollmentStatus).map(status => (
                              <Option key={status} value={status}>{status}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Razón de Transferencia"
                          name="transferReason"
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (getFieldValue('status') === EnrollmentStatus.TRANSFER && !value) {
                                  return Promise.reject(new Error('La razón de transferencia es requerida cuando el estado es Transferido'));
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input.TextArea rows={1} placeholder="Razón de Transferencia" disabled={form.getFieldValue('status') !== EnrollmentStatus.TRANSFER} />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="col-12">
                      <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                          Actualizar Matrícula
                        </Button>
                        <Button onClick={() => navigate("/secretary/enrollments")} style={{ marginLeft: 8 }}>
                          Cancelar
                        </Button>
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Sidebar />
      <Header />
    </>
  );
};

export default EditEnrollment;