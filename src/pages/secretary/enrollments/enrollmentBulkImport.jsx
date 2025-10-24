import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";

const EnrollmentBulkImport = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Sidebar />
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-sub-header">
                  <h3 className="page-title">Importación Masiva de Matrículas</h3>
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/secretary/dashboard">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/secretary/enrollments">Matrículas</Link>
                    </li>
                    <li className="breadcrumb-item active">Importación Masiva</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de regreso */}
          <div className="row mb-3">
            <div className="col-12">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/secretary/enrollments')}
              >
                Volver a Matrículas
              </Button>
            </div>
          </div>

          {/* Contenido temporal */}
          <div className="row">
            <div className="col-12">
              <Card title="Importación Masiva de Matrículas">
                <p>Esta funcionalidad estará disponible próximamente.</p>
                <p>Podrá importar múltiples matrículas desde un archivo CSV o JSON.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnrollmentBulkImport;