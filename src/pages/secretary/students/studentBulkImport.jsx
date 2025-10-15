/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button, Upload, Table, Alert, Progress, Steps, Input, Form, Row, Col } from "antd";
import { UploadOutlined, DownloadOutlined, ArrowLeftOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import AlertModal from "../../../components/AlertModal";
import useAlert from "../../../hooks/useAlert";
import studentService from "../../../services/students/studentService";
import { DocumentType, Gender, GuardianRelationship, validateStudent } from "../../../types/students/students";

const { Step } = Steps;
const { TextArea } = Input;

const StudentBulkImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { alertState, showAlert, showSuccess, showError, showWarning, handleConfirm: alertConfirm, handleCancel: alertCancel } = useAlert();
  
  // Estados
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [jsonInput, setJsonInput] = useState('');

  /**
   * Template de estudiantes para descarga
   */
  const studentTemplate = [
    {
      firstName: "Luis Alberto",
      lastName: "Ramírez Torres",
      documentType: "DNI",
      documentNumber: "65432109",
      birthDate: "2011-01-10",
      gender: "MALE",
      address: "Calle Los Cedros 456",
      district: "San Juan",
      province: "Lima",
      department: "Lima",
      phone: "912458963",
      email: "luis.ramirez@email.com",
      guardianName: "María",
      guardianLastName: "Torres",
      guardianDocumentType: "DNI",
      guardianDocumentNumber: "22223333",
      guardianPhone: "921456987",
      guardianEmail: "maria.torres@email.com",
      guardianRelationship: "MOTHER"
    },
    {
      firstName: "Sofía Isabel",
      lastName: "Martínez Ruiz",
      documentType: "DNI",
      documentNumber: "34567890",
      birthDate: "2011-04-20",
      gender: "FEMALE",
      address: "Av. El Sol 789",
      district: "Miraflores",
      province: "Lima",
      department: "Lima",
      phone: "913456789",
      email: "sofia.martinez@email.com",
      guardianName: "José",
      guardianLastName: "Martínez",
      guardianDocumentType: "DNI",
      guardianDocumentNumber: "44445555",
      guardianPhone: "922345678",
      guardianEmail: "jose.martinez@email.com",
      guardianRelationship: "FATHER"
    },
    {
      firstName: "Diego Andrés",
      lastName: "Castillo Ramos",
      documentType: "DNI",
      documentNumber: "23456789",
      birthDate: "2009-11-05",
      gender: "MALE",
      address: "Jr. Las Flores 222",
      district: "Comas",
      province: "Lima",
      department: "Lima",
      phone: "914567890",
      email: "diego.castillo@email.com",
      guardianName: "Lucía",
      guardianLastName: "Ramos",
      guardianDocumentType: "DNI",
      guardianDocumentNumber: "55556666",
      guardianPhone: "933456789",
      guardianEmail: "lucia.ramos@email.com",
      guardianRelationship: "MOTHER"
    }
  ];

  /**
   * Descarga el template de ejemplo en formato CSV
   */
  const handleDownloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'documentType', 'documentNumber', 'birthDate',
      'gender', 'address', 'district', 'province', 'department', 'phone', 'email',
      'guardianName', 'guardianLastName', 'guardianDocumentType', 'guardianDocumentNumber',
      'guardianPhone', 'guardianEmail', 'guardianRelationship'
    ];
    
    // Función para escapar valores CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Si contiene comas, comillas o saltos de línea, envolver en comillas
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvData = studentTemplate.map(student => [
      student.firstName, student.lastName, student.documentType, student.documentNumber,
      student.birthDate, student.gender, student.address, student.district,
      student.province, student.department, student.phone || '', student.email || '',
      student.guardianName, student.guardianLastName, student.guardianDocumentType,
      student.guardianDocumentNumber, student.guardianPhone || '', student.guardianEmail || '',
      student.guardianRelationship
    ]);
    
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...csvData.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estudiantes_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess('Template CSV descargado exitosamente. Abra el archivo en Excel para editar.');
  };

  /**
   * Convierte CSV a JSON
   */
  const csvToJson = (csvText) => {
    console.log('CSV Text length:', csvText.length); // Debug
    
    const lines = csvText.trim().split('\n');
    console.log('Total lines:', lines.length); // Debug
    
    if (lines.length < 2) throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    
    // Procesar headers de la primera línea
    const headerLine = lines[0];
    console.log('Header line:', headerLine); // Debug
    
    const headers = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim().replace(/^"|"$/g, '')); // Agregar el último header
    
    console.log('Headers encontrados:', headers); // Debug
    
    const expectedHeaders = [
      'firstName', 'lastName', 'documentType', 'documentNumber', 'birthDate',
      'gender', 'address', 'district', 'province', 'department', 'phone', 'email',
      'guardianName', 'guardianLastName', 'guardianDocumentType', 'guardianDocumentNumber',
      'guardianPhone', 'guardianEmail', 'guardianRelationship'
    ];
    
    // Verificar que los headers sean correctos
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      console.error('Headers faltantes:', missingHeaders); // Debug
      throw new Error(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Saltar líneas vacías
      
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, '')); // Agregar el último valor
      
      if (values.length !== headers.length) {
        console.warn(`Fila ${i + 1} tiene ${values.length} columnas, esperadas ${headers.length}. Saltando.`);
        continue;
      }
      
      const student = {};
      headers.forEach((header, index) => {
        student[header] = values[index] || '';
      });
      data.push(student);
    }
    
    if (data.length === 0) {
      throw new Error('No se encontraron datos válidos en el archivo CSV');
    }
    
    console.log(`Datos procesados: ${data.length} estudiantes`); // Debug
    return data;
  };

  /**
   * Maneja el upload de archivo CSV
   */
  const handleFileUpload = (file) => {
    const fileName = file.name || '';
    
    if (!fileName.toLowerCase().endsWith('.csv')) {
      showError('Solo se permiten archivos CSV (.csv)');
      return false;
    }
    
    setLoading(true);
    showSuccess('Procesando archivo CSV...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        console.log('CSV Text:', csvText); // Debug
        
        const jsonData = csvToJson(csvText);
        console.log('Parsed Data:', jsonData); // Debug
        
        if (jsonData.length === 0) {
          showError('El archivo CSV no contiene datos válidos');
          setLoading(false);
          return;
        }
        
        setUploadedFile(file);
        setParsedData(jsonData);
        setCurrentStep(1);
        validateData(jsonData);
        showSuccess(`✅ ${jsonData.length} estudiantes cargados exitosamente desde CSV`);
        setLoading(false);
      } catch (error) {
        console.error('Error procesando CSV:', error);
        showError(`❌ Error al procesar CSV: ${error.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      showError('Error al leer el archivo');
      setLoading(false);
    };
    
    reader.readAsText(file);
    return false; // Prevenir upload automático a servidor
  };

  /**
   * Procesa datos desde JSON input
   */
  const handleJsonSubmit = () => {
    if (!jsonInput.trim()) {
      showError('Por favor ingrese datos JSON');
      return;
    }
    
    try {
      setLoading(true);
      showSuccess('Procesando datos JSON...');
      
      const jsonData = JSON.parse(jsonInput);
      if (Array.isArray(jsonData)) {
        if (jsonData.length === 0) {
          showError('El JSON no contiene datos de estudiantes');
          setLoading(false);
          return;
        }
        
        setParsedData(jsonData);
        setCurrentStep(1);
        validateData(jsonData);
        showSuccess(`✅ ${jsonData.length} estudiantes cargados desde JSON`);
        setLoading(false);
      } else {
        showError('El JSON debe ser un array de estudiantes');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      showError('❌ JSON inválido. Verifique el formato.');
      setLoading(false);
    }
  };

  /**
   * Valida los datos parseados
   */
  const validateData = (data) => {
    console.log('Validando datos:', data); // Debug
    const errors = [];
    
    data.forEach((student, index) => {
      const validation = validateStudent(student);
      if (!validation.isValid) {
        errors.push({
          row: index + 1,
          errors: validation.errors
        });
      }
    });
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      showWarning(`⚠️ Se encontraron ${errors.length} errores de validación. Revise y corrija antes de importar.`);
    } else {
      showSuccess(`✅ Todos los ${data.length} estudiantes pasaron la validación. Listos para importar.`);
    }
    
    console.log('Errores de validación:', errors); // Debug
  };

  /**
   * Ejecuta la importación
   */
  const handleImport = async () => {
    if (validationErrors.length > 0) {
      showError('Corrija los errores de validación antes de continuar');
      return;
    }

    setLoading(true);
    try {
      const response = await studentService.bulkCreateStudents(parsedData);
      
      if (response.success) {
        setImportResults({
          success: true,
          total: parsedData.length,
          imported: response.data?.length || parsedData.length,
          errors: 0
        });
        setCurrentStep(2);
        showSuccess(`${parsedData.length} estudiantes importados exitosamente`);
      } else {
        setImportResults({
          success: false,
          total: parsedData.length,
          imported: 0,
          errors: parsedData.length,
          errorMessage: response.error
        });
        setCurrentStep(2);
        showError(response.error || 'Error en la importación');
      }
    } catch (error) {
      setImportResults({
        success: false,
        total: parsedData.length,
        imported: 0,
        errors: parsedData.length,
        errorMessage: error.message
      });
      setCurrentStep(2);
      showError('Error en la importación');
    }
    setLoading(false);
  };

  /**
   * Columnas para preview de datos
   */
  const previewColumns = [
    {
      title: 'Nombre',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Documento',
      key: 'document',
      render: (_, record) => `${record.documentType}: ${record.documentNumber}`,
    },
    {
      title: 'Fecha Nac.',
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: 'Género',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: 'Apoderado',
      key: 'guardian',
      render: (_, record) => `${record.guardianName} ${record.guardianLastName}`,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Importación Masiva de Estudiantes</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/students">Estudiantes</Link>
                    </li>
                    <li className="breadcrumb-item active">Importar Lote</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="row">
            <div className="col-12">
              <Card>
                <Steps current={currentStep} className="mb-4">
                  <Step title="Cargar Datos" description="Subir archivo CSV o pegar JSON" />
                  <Step title="Validar" description="Revisar y corregir errores" />
                  <Step title="Importar" description="Crear estudiantes" />
                </Steps>
              </Card>
            </div>
          </div>

          {/* Paso 1: Cargar datos */}
          {currentStep === 0 && (
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Card title="Opción 1: Subir Archivo CSV" className="mb-3">
                  <div className="text-center mb-3">
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownloadTemplate}
                      type="dashed"
                      className="mb-3"
                    >
                      Descargar Template CSV
                    </Button>
                  </div>
                  
                  <Upload.Dragger
                    accept=".csv"
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                    multiple={false}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <p className="ant-upload-drag-icon">
                          <Progress type="circle" percent={50} showInfo={false} />
                        </p>
                        <p className="ant-upload-text">
                          Procesando archivo CSV...
                        </p>
                        <p className="ant-upload-hint">
                          Por favor espere mientras se procesa el archivo
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Haz clic o arrastra un archivo CSV aquí
                        </p>
                        <p className="ant-upload-hint">
                          Archivo debe ser formato CSV con las columnas requeridas
                        </p>
                      </>
                    )}
                  </Upload.Dragger>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Opción 2: Pegar JSON Directamente">
                  <Form onFinish={handleJsonSubmit} layout="vertical">
                    <Form.Item
                      label="JSON de Estudiantes (Opcional)"
                      help="Solo para usuarios avanzados - use preferiblemente CSV"
                    >
                      <TextArea
                        rows={8}
                        placeholder='[{"firstName": "Luis", "lastName": "Pérez", ...}]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="default" 
                        htmlType="submit" 
                        block
                        loading={loading}
                        disabled={loading}
                      >
                        {loading ? 'Procesando...' : 'Procesar JSON'}
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          )}

          {/* Paso 2: Validación */}
          {currentStep === 1 && (
            <div className="row">
              <div className="col-12">
                <Card title={`Vista Previa - ${parsedData.length} estudiantes`}>
                  {validationErrors.length > 0 && (
                    <Alert
                      message="Errores de Validación"
                      description={
                        <ul>
                          {validationErrors.map((error, index) => (
                            <li key={index}>
                              <strong>Fila {error.row}:</strong> {error.errors.join(', ')}
                            </li>
                          ))}
                        </ul>
                      }
                      type="error"
                      showIcon
                      className="mb-3"
                    />
                  )}

                  <Table
                    columns={previewColumns}
                    dataSource={parsedData}
                    rowKey={(record, index) => index}
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: 800 }}
                    size="small"
                  />

                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setCurrentStep(0)}
                    >
                      Volver
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleImport}
                      loading={loading}
                      disabled={validationErrors.length > 0}
                    >
                      Importar {parsedData.length} Estudiantes
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Paso 3: Resultados */}
          {currentStep === 2 && importResults && (
            <div className="row">
              <div className="col-12">
                <Card title="Resultado de Importación">
                  {importResults.success ? (
                    <Alert
                      message="Importación Exitosa"
                      description={`Se han importado ${importResults.imported} estudiantes de ${importResults.total} registros.`}
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      className="mb-3"
                    />
                  ) : (
                    <Alert
                      message="Error en Importación"
                      description={importResults.errorMessage || `Error al importar ${importResults.errors} de ${importResults.total} registros.`}
                      type="error"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                      className="mb-3"
                    />
                  )}

                  <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button onClick={() => {
                      setCurrentStep(0);
                      setParsedData([]);
                      setValidationErrors([]);
                      setImportResults(null);
                      setUploadedFile(null);
                      setJsonInput('');
                    }}>
                      Nueva Importación
                    </Button>
                    <Button 
                      type="primary"
                      onClick={() => navigate('/secretary/students')}
                    >
                      Ver Estudiantes
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar y Header */}
      <Sidebar />
      <Header />
      
      {/* AlertModal */}
      <AlertModal 
        alert={alertState} 
        onConfirm={alertConfirm} 
        onCancel={alertCancel} 
      />
    </>
  );
};

export default StudentBulkImport;