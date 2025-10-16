/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button, Tag, Space, Divider, Row, Col, Descriptions } from "antd";
import { EyeOutlined, HomeOutlined, SettingOutlined, PhoneOutlined, MailOutlined, BankOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import institutionDirectorService from "../../../services/institutions/institutionDirectorService";

const DirectorInstitutionView = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados para manejo de datos
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar institución al montar el componente
  useEffect(() => {
    loadInstitution();
  }, []);

  /**
   * Carga la institución del director desde el servicio
   */
  const loadInstitution = async () => {
    setLoading(true);
    try {
      const response = await institutionDirectorService.getDirectorInstitution();
      
      if (response.success) {
        setInstitution(response.data);
        if (response.message) {
          showSuccess(response.message);
        }
      } else {
        showError('Error al cargar institución', response.error);
        setInstitution(null);
      }
    } catch (error) {
      showError('Error de conexión', 'No se pudo cargar la información de la institución');
      setInstitution(null);
    }
    setLoading(false);
  };

  /**
   * Navega a la gestión de sedes
   */
  const handleManageHeadquarters = () => {
    if (institution) {
      navigate(`/director/headquarters`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <h5>No se pudo cargar la información de la institución</h5>
          <Button type="primary" onClick={loadInstitution}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Mi Institución</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active">Mi Institución</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Institución */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    {/* Logo e Información Principal */}
                    <div className="col-md-4">
                      <div className="text-center mb-4">
                        {institution.logo ? (
                          <img 
                            src={institution.logo} 
                            alt={institution.name}
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '150px', 
                              objectFit: 'contain',
                              border: '2px solid #f0f0f0',
                              borderRadius: '8px',
                              padding: '10px'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '200px', 
                            height: '150px', 
                            border: '2px dashed #d9d9d9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}>
                            <BankOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                          </div>
                        )}
                        <h4 className="mt-3">{institution.name}</h4>
                        <Tag color={institution.status === 'A' ? 'green' : 'red'} style={{ fontSize: '12px' }}>
                          {institution.status === 'A' ? 'ACTIVA' : 'INACTIVA'}
                        </Tag>
                      </div>
                    </div>

                    {/* Información Detallada */}
                    <div className="col-md-8">
                      <Descriptions title="Información General" column={1} bordered>
                        <Descriptions.Item label="Código de Institución">
                          <Tag color="blue">{institution.codeInstitution}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Dirección">
                          {institution.address}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email de Contacto">
                          <Space>
                            <MailOutlined />
                            {institution.contactEmail}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Teléfono de Contacto">
                          <Space>
                            <PhoneOutlined />
                            {institution.contactPhone}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Fecha de Creación">
                          {new Date(institution.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>

                  <Divider />

                  {/* Configuraciones */}
                  <Row gutter={16}>
                    {/* Configuración UI */}
                    <Col md={8}>
                      <Card title="Configuración de Interfaz" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <strong>Color Principal:</strong>
                            <div style={{ 
                              display: 'inline-block', 
                              width: '30px', 
                              height: '20px', 
                              backgroundColor: institution.uiSettings?.color || '#FF0000',
                              marginLeft: '10px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px'
                            }}></div>
                            <span style={{ marginLeft: '10px' }}>
                              {institution.uiSettings?.color || '#FF0000'}
                            </span>
                          </div>
                          <div>
                            <strong>Posición del Logo:</strong> {institution.uiSettings?.logoPosition || 'LEFT'}
                          </div>
                          <div>
                            <strong>Mostrar Fotos de Estudiantes:</strong>{' '}
                            <Tag color={institution.uiSettings?.showStudentPhotos ? 'green' : 'red'}>
                              {institution.uiSettings?.showStudentPhotos ? 'SÍ' : 'NO'}
                            </Tag>
                          </div>
                        </Space>
                      </Card>
                    </Col>

                    {/* Sistema de Evaluación */}
                    <Col md={8}>
                      <Card title="Sistema de Evaluación" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <strong>Escala de Calificación:</strong> {institution.evaluationSystem?.gradeScale || 'No definida'}
                          </div>
                          <div>
                            <strong>Nota Mínima Aprobatoria:</strong> {institution.evaluationSystem?.minimumPassingGrade || 'No definida'}
                          </div>
                          <div>
                            <strong>Mostrar Decimales:</strong>{' '}
                            <Tag color={institution.evaluationSystem?.showDecimals ? 'green' : 'red'}>
                              {institution.evaluationSystem?.showDecimals ? 'SÍ' : 'NO'}
                            </Tag>
                          </div>
                        </Space>
                      </Card>
                    </Col>

                    {/* Horarios */}
                    <Col md={8}>
                      <Card title="Configuración de Horarios" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <strong>Mañana:</strong> {institution.scheduleSettings?.morningStartTime} - {institution.scheduleSettings?.morningEndTime}
                          </div>
                          <div>
                            <strong>Tarde:</strong> {institution.scheduleSettings?.afternoonStartTime} - {institution.scheduleSettings?.afternoonEndTime}
                          </div>
                          <div>
                            <strong>Noche:</strong> {institution.scheduleSettings?.nightStartTime} - {institution.scheduleSettings?.nightEndTime}
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Divider />

                  {/* Acciones */}
                  <div className="text-center">
                    <Space size="large">
                      <Button 
                        type="primary" 
                        icon={<HomeOutlined />}
                        onClick={handleManageHeadquarters}
                        size="large"
                      >
                        Gestionar Sedes
                      </Button>
                      <Button 
                        icon={<EyeOutlined />}
                        onClick={() => navigate('/dashboard')}
                        size="large"
                      >
                        Ir al Dashboard
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* AlertModal para notificaciones */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default DirectorInstitutionView;