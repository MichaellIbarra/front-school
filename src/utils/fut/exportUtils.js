// Utilidades de exportación para solicitudes FUT
import { message } from 'antd';
import { logo } from '../../components/imagepath'; // Import the school logo

export class FutExportUtils {
  /**
   * Exporta solicitudes FUT a formato PDF con diseño de documento oficial peruano
   * @param {Array} futRequests - Array de solicitudes FUT
   * @param {Array} students - Array de estudiantes
   * @param {Object} institution - Datos de la institución educativa
   */
  static exportFutRequestsToPDF(futRequests, students, institution = null) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Solicitudes FUT</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif;
              margin: 0; 
              padding: 0;
              font-size: 12pt;
              background-color: #fff;
              color: #000;
            }
            @page {
              margin: 2cm;
            }
            .fut-document {
              width: 100%;
              max-width: 21cm;
              margin: 0 auto;
              background-color: #fff;
              page-break-after: always;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 3px double #000;
              padding-bottom: 15px;
            }
            .logo-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .logo-box {
              width: 80px;
              height: 80px;
              border: 1px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
            }
            .institution-header {
              text-align: center;
              margin: 10px 0;
            }
            .institution-name {
              font-size: 16pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .institution-details {
              font-size: 12pt;
              margin-bottom: 10px;
            }
            .document-title {
              font-size: 18pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 20px 0;
              text-decoration: underline;
            }
            .document-subtitle {
              font-size: 14pt;
              margin-bottom: 20px;
            }
            .request-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .request-table th,
            .request-table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
              vertical-align: top;
            }
            .request-table th {
              background-color: #e0e0e0;
              font-weight: bold;
              text-align: center;
            }
            .request-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              margin-top: 80px;
              border-top: 1px solid #000;
              padding-top: 5px;
              font-size: 11pt;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10pt;
              color: #666;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .mb-10 { margin-bottom: 10px; }
            .mb-20 { margin-bottom: 20px; }
            .mt-20 { margin-top: 20px; }
            .page-break {
              page-break-before: always;
            }
            .student-photo {
              width: 100px;
              height: 100px;
              border: 1px solid #000;
              background-color: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
              margin: 0 auto 10px;
            }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 20px 0 10px 0;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
          </style>
        </head>
        <body>
          ${futRequests.map((futRequest, index) => {
            const student = students.find(s => s.id === futRequest.studentEnrollmentId);
            const studentName = student ? `${student.firstName} ${student.lastName}` : 'N/A';
            const studentDocument = student ? `${student.documentType}: ${student.documentNumber}` : 'N/A';
            
            return `
              <div class="fut-document">
                <div class="header">
                  <div class="logo-container">
                    <div class="logo-box">
                      ESCUDO<br>DEL<br>PERÚ
                    </div>
                    <div class="institution-header">
                      <div class="institution-name">
                        ${institution?.name || 'INSTITUCIÓN EDUCATIVA'}
                      </div>
                      <div class="institution-details">
                        ${institution?.address || 'Dirección de la Institución'}<br>
                        ${institution?.district || 'Distrito'}, ${institution?.province || 'Provincia'}<br>
                        ${institution?.phone ? `Teléfono: ${institution?.phone}` : ''}
                      </div>
                    </div>
                    <div class="logo-box">
                      <img src="${logo}" alt="Logo" style="max-width: 70px; max-height: 70px;">
                    </div>
                  </div>
                  
                  <div class="document-title">
                    FORMATO ÚNICO DE TRÁMITES (FUT)
                  </div>
                  
                  <div class="document-subtitle">
                    SOLICITUD DE TRÁMITES ADMINISTRATIVOS
                  </div>
                </div>
                
                <div class="section-title">I. DATOS DE LA SOLICITUD</div>
                
                <table class="request-table">
                  <tr>
                    <td class="text-bold" style="width: 30%;">Número de Solicitud:</td>
                    <td>${futRequest.requestNumber}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Fecha de Registro:</td>
                    <td>${this.formatDate(futRequest.createdAt)}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Tipo de Solicitud:</td>
                    <td>${futRequest.requestType}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Asunto:</td>
                    <td>${futRequest.requestSubject}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Descripción:</td>
                    <td>${futRequest.requestDescription}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Urgencia:</td>
                    <td>${this.getUrgencyText(futRequest.urgencyLevel)}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Fecha Estimada de Entrega:</td>
                    <td>${futRequest.estimatedDeliveryDate ? this.formatDate(futRequest.estimatedDeliveryDate) : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Estado:</td>
                    <td>${this.getStatusText(futRequest.status)}</td>
                  </tr>
                </table>
                
                <div class="section-title">II. DATOS DEL ESTUDIANTE</div>
                
                <table class="request-table">
                  <tr>
                    <td class="text-center" colspan="2">
                      <div class="student-photo">
                        FOTO DEL<br>ESTUDIANTE
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="text-bold" style="width: 30%;">Apellidos y Nombres:</td>
                    <td>${studentName}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Documento de Identidad:</td>
                    <td>${studentDocument}</td>
                  </tr>

                  <tr>
                    <td class="text-bold">Provincia:</td>
                    <td>${student ? (student.province || 'N/A') : 'N/A'}</td>
                  </tr>
                </table>
                
                <div class="section-title">III. DATOS DEL SOLICITANTE (APODERADO)</div>
                
                <table class="request-table">
                  <tr>
                    <td class="text-bold" style="width: 30%;">Apellidos y Nombres:</td>
                    <td>${futRequest.requestedBy}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Teléfono de Contacto:</td>
                    <td>${futRequest.contactPhone}</td>
                  </tr>
                  <tr>
                    <td class="text-bold">Correo Electrónico:</td>
                    <td>${futRequest.contactEmail}</td>
                  </tr>
                </table>
                
                <div class="signature-section">
                  <div class="signature-box">
                    <div class="signature-line">
                      FIRMA DEL SOLICITANTE<br>
                      ${futRequest.requestedBy}
                    </div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-line">
                      FIRMA Y SELLO DE LA INSTITUCIÓN<br>
                      RESPONSABLE DEL TRÁMITE
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  <p><strong>NOTA:</strong> Este documento es una copia digital del Formato Único de Trámites (FUT) utilizado en instituciones públicas peruanas.</p>
                  <p>Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
                </div>
              </div>
              ${index < futRequests.length - 1 ? '<div class="page-break"></div>' : ''}
            `;
          }).join('')}
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
              URL.revokeObjectURL(url);
            }, 1000);
          }, 500);
        });
        message.success('Documento FUT generado para impresión');
      } else {
        message.error('No se pudo abrir la ventana de impresión. Verifique que el bloqueador de ventanas emergentes esté deshabilitado.');
      }
    } catch (error) {
      message.error('Error al generar el documento FUT');
      console.error('FUT Export Error:', error);
    }
  }

  /**
   * Exporta una solicitud FUT individual a formato PDF oficial
   * @param {Object} futRequest - Solicitud FUT
   * @param {Object} student - Datos del estudiante
   * @param {Object} institution - Datos de la institución educativa
   */
  static exportFutRequestToOfficialPDF(futRequest, student, institution = null) {
    try {
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'N/A';
      const studentDocument = student ? `${student.documentType}: ${student.documentNumber}` : 'N/A';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>FUT - ${futRequest.requestNumber}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif;
              margin: 0;
              padding: 0;
              font-size: 12pt;
              background-color: #fff;
              color: #000;
            }
            @page {
              margin: 2cm;
            }
            .fut-official {
              width: 100%;
              max-width: 21cm;
              margin: 0 auto;
              background-color: #fff;
            }
            .header-official {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .logo-box {
              width: 80px;
              height: 80px;
              border: 1px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
            }
            .institution-header {
              text-align: center;
              margin: 10px 0;
            }
            .institution-name {
              font-size: 16pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .institution-details {
              font-size: 12pt;
              margin-bottom: 10px;
            }
            .document-title {
              font-size: 18pt;
              font-weight: bold;
              text-transform: uppercase;
              text-decoration: underline;
              margin: 20px 0;
            }
            .document-code {
              text-align: right;
              font-size: 12pt;
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 20px 0 10px 0;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            .data-table th,
            .data-table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
              vertical-align: top;
            }
            .data-table th {
              background-color: #e0e0e0;
              font-weight: bold;
              text-align: center;
            }
            .field-label {
              font-weight: bold;
              width: 30%;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              margin-top: 80px;
              border-top: 1px solid #000;
              padding-top: 5px;
              font-size: 11pt;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 10pt;
              color: #666;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .mb-10 { margin-bottom: 10px; }
            .mb-20 { margin-bottom: 20px; }
            .mt-20 { margin-top: 20px; }
            .student-photo {
              width: 120px;
              height: 120px;
              border: 1px solid #000;
              background-color: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
              margin: 0 auto 10px;
            }
          </style>
        </head>
        <body>
          <div class="fut-official">
            <div class="header-official">
              <div class="logo-container">
                <div class="logo-box">
                  ESCUDO<br>DEL<br>PERÚ
                </div>
                <div class="institution-header">
                  <div class="institution-name">
                    ${institution?.name || 'INSTITUCIÓN EDUCATIVA'}
                  </div>
                  <div class="institution-details">
                    ${institution?.address || 'Dirección de la Institución'}<br>
                    ${institution?.district || 'Distrito'}, ${institution?.province || 'Provincia'}<br>
                    ${institution?.phone ? `Teléfono: ${institution?.phone}` : ''}
                  </div>
                </div>
                <div class="logo-box">
                  <img src="${logo}" alt="Logo" style="max-width: 70px; max-height: 70px;">
                </div>
              </div>
              
              <div class="document-title">
                FORMATO ÚNICO DE TRÁMITES (FUT)
              </div>
              
              <div class="document-code">
                Código: ${futRequest.requestNumber}<br>
                Fecha: ${this.formatDate(futRequest.createdAt)}
              </div>
            </div>
            
            <div class="section-title">I. DATOS GENERALES DE LA SOLICITUD</div>
            
            <table class="data-table">
              <tr>
                <td class="field-label">Tipo de Trámite:</td>
                <td>${futRequest.requestType}</td>
              </tr>
              <tr>
                <td class="field-label">Asunto:</td>
                <td>${futRequest.requestSubject}</td>
              </tr>
              <tr>
                <td class="field-label">Descripción Detallada:</td>
                <td>${futRequest.requestDescription}</td>
              </tr>
              <tr>
                <td class="field-label">Nivel de Urgencia:</td>
                <td>${this.getUrgencyText(futRequest.urgencyLevel)}</td>
              </tr>
              <tr>
                <td class="field-label">Fecha Estimada de Entrega:</td>
                <td>${futRequest.estimatedDeliveryDate ? this.formatDate(futRequest.estimatedDeliveryDate) : 'N/A'}</td>
              </tr>
              <tr>
                <td class="field-label">Estado Actual:</td>
                <td>${this.getStatusText(futRequest.status)}</td>
              </tr>
            </table>
            
            <div class="section-title">II. DATOS DEL ESTUDIANTE</div>
            
            <table class="data-table">
              <tr>
                <td class="text-center" colspan="2">
                  <div class="student-photo">
                    FOTO DEL<br>ESTUDIANTE
                  </div>
                </td>
              </tr>
              <tr>
                <td class="field-label">Apellidos y Nombres:</td>
                <td>${studentName}</td>
              </tr>
              <tr>
                <td class="field-label">Número de Documento:</td>
                <td>${studentDocument}</td>
              </tr>

              <tr>
                <td class="field-label">Provincia:</td>
                <td>${student ? (student.province || 'N/A') : 'N/A'}</td>
              </tr>
            </table>
            
            <div class="section-title">III. DATOS DEL SOLICITANTE</div>
            
            <table class="data-table">
              <tr>
                <td class="field-label">Apellidos y Nombres:</td>
                <td>${futRequest.requestedBy}</td>
              </tr>
              <tr>
                <td class="field-label">Número de Documento:</td>
                <td>${studentDocument}</td>
              </tr>
              <tr>
                <td class="field-label">Teléfono de Contacto:</td>
                <td>${futRequest.contactPhone}</td>
              </tr>
              <tr>
                <td class="field-label">Correo Electrónico:</td>
                <td>${futRequest.contactEmail}</td>
              </tr>
            </table>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">
                  FIRMA DEL SOLICITANTE<br>
                  ${futRequest.requestedBy}
                </div>
              </div>
              <div class="signature-box">
                <div class="signature-line">
                  FIRMA Y SELLO DE LA INSTITUCIÓN<br>
                  RESPONSABLE DEL TRÁMITE
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>NOTA:</strong> Este documento es un Formato Único de Trámites (FUT) que cumple con los estándares establecidos para instituciones públicas peruanas.</p>
              <p>Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
              URL.revokeObjectURL(url);
            }, 1000);
          }, 500);
        });
        message.success('Documento FUT oficial generado para impresión');
      } else {
        message.error('No se pudo abrir la ventana de impresión. Verifique que el bloqueador de ventanas emergentes esté deshabilitado.');
      }
    } catch (error) {
      message.error('Error al generar el documento FUT oficial');
      console.error('FUT Official Export Error:', error);
    }
  }

  /**
   * Formatea la fecha para mostrar
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha formateada
   */
  static formatDate(dateString) {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (error) {
      return "Fecha inválida";
    }
  }

  /**
   * Obtiene el texto del estado
   * @param {string} status - Código del estado
   * @returns {string} Texto del estado
   */
  static getStatusText(status) {
    const statusMap = {
      "PENDIENTE": "Pendiente",
      "APROBADO": "Aprobado",
      "RECHAZADO": "Rechazado",
      "COMPLETADO": "Completado"
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene el texto del nivel de urgencia
   * @param {string} urgency - Código de urgencia
   * @returns {string} Texto de urgencia
   */
  static getUrgencyText(urgency) {
    const urgencyMap = {
      "ALTA": "Alta",
      "MEDIA": "Media",
      "BAJA": "Baja"
    };
    return urgencyMap[urgency] || urgency;
  }
}

export default FutExportUtils;