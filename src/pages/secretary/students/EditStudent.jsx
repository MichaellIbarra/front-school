import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Form, Input, Button, Select, DatePicker, Radio } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, CalendarOutlined, ManOutlined, WomanOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import { StudentStatus, Gender, DocumentType } from "../../../types/students/students";

const { Option } = Select;

const EditStudent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false); // Set to false initially as data comes from state

  useEffect(() => {
    if (location.state && location.state.student) {
      const student = location.state.student;
      form.setFieldsValue({
        ...student,
        birthDate: student.birthDate ? moment(student.birthDate.join('-')) : null,
      });
    } else {
      showError("No se encontraron datos del estudiante para editar.");
      navigate("/secretary/students");
    }
  }, [location.state, form, navigate, showError]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : null,
      };
      const response = await studentService.updateStudent(id, formattedValues);
      if (response.success) {
        showSuccess("Estudiante actualizado exitosamente");
        navigate("/secretary/students");
      } else {
        showError(response.error || "Error al actualizar el estudiante");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showError("Error de red al actualizar el estudiante");
    }
    setLoading(false);
  };

  // No need for loading spinner for initial fetch as data is from state
  // if (loading) {
  //   return (
  //     <div className="page-wrapper">
  //       <div className="content">
  //         <Spin size="large" tip="Cargando estudiante..." />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Editar Estudiante</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/students">Estudiantes</Link>
                    </li>
                    <li className="breadcrumb-item active">Editar Estudiante</li>
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
                    initialValues={{
                      gender: Gender.MALE, // Default value
                      documentType: DocumentType.DNI, // Default value
                      status: StudentStatus.ACTIVE, // Default value
                    }}
                  >
                    <h6 className="form-section-title">Información Personal</h6>
                    <div className="row">
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Nombres"
                          name="firstName"
                          rules={[{ required: true, message: "Por favor ingrese los nombres" }]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Nombres" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Apellidos"
                          name="lastName"
                          rules={[{ required: true, message: "Por favor ingrese los apellidos" }]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Apellidos" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Tipo de Documento"
                          name="documentType"
                          rules={[{ required: true, message: "Por favor seleccione el tipo de documento" }]}
                        >
                          <Select placeholder="Seleccione tipo">
                            {Object.values(DocumentType).map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Número de Documento"
                          name="documentNumber"
                          rules={[{ required: true, message: "Por favor ingrese el número de documento" }]}
                        >
                          <Input prefix={<IdcardOutlined />} placeholder="Número de Documento" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Fecha de Nacimiento"
                          name="birthDate"
                          rules={[{ required: true, message: "Por favor seleccione la fecha de nacimiento" }]}
                        >
                          <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} prefix={<CalendarOutlined />} />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Género"
                          name="gender"
                          rules={[{ required: true, message: "Por favor seleccione el género" }]}
                        >
                          <Radio.Group>
                            <Radio value={Gender.MALE}><ManOutlined /> Masculino</Radio>
                            <Radio value={Gender.FEMALE}><WomanOutlined /> Femenino</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </div>
                    </div>

                    <h6 className="form-section-title mt-4">Información de Contacto</h6>
                    <div className="row">
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Dirección"
                          name="address"
                          rules={[{ required: true, message: "Por favor ingrese la dirección" }]}
                        >
                          <Input prefix={<HomeOutlined />} placeholder="Dirección" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Teléfono"
                          name="phone"
                          rules={[{ required: true, message: "Por favor ingrese el teléfono" }]}
                        >
                          <Input prefix={<PhoneOutlined />} placeholder="Teléfono" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[{ type: "email", message: "El email no es válido" }]}
                        >
                          <Input prefix={<MailOutlined />} placeholder="Email" />
                        </Form.Item>
                      </div>
                    </div>

                    <h6 className="form-section-title mt-4">Información del Apoderado</h6>
                    <div className="row">
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Nombre del Apoderado"
                          name="parentName"
                          rules={[{ required: true, message: "Por favor ingrese el nombre del apoderado" }]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Nombre del Apoderado" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Teléfono del Apoderado"
                          name="parentPhone"
                          rules={[{ required: true, message: "Por favor ingrese el teléfono del apoderado" }]}
                        >
                          <Input prefix={<PhoneOutlined />} placeholder="Teléfono del Apoderado" />
                        </Form.Item>
                      </div>
                      <div className="col-12 col-sm-4">
                        <Form.Item
                          label="Email del Apoderado"
                          name="parentEmail"
                          rules={[{ type: "email", message: "El email no es válido" }]}
                        >
                          <Input prefix={<MailOutlined />} placeholder="Email del Apoderado" />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="col-12">
                      <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                          Actualizar Estudiante
                        </Button>
                        <Button onClick={() => navigate("/secretary/students")} style={{ marginLeft: 8 }}>
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

export default EditStudent;