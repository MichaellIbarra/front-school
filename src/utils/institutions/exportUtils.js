// Utilidades de exportación para tablas de instituciones
import { message } from 'antd';

export class ExportUtils {
  /**
   * Exporta datos a formato CSV
   * @param {Array} data - Array de objetos con los datos
   * @param {Array} headers - Array con los headers de las columnas
   * @param {Function} mapFunction - Función para mapear los datos
   * @param {string} filename - Nombre del archivo
   */
  static exportToCSV(data, headers, mapFunction, filename) {
    try {
      const csvContent = [
        // Headers
        headers.join(','),
        // Data
        ...data.map(item => mapFunction(item).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Archivo CSV descargado correctamente');
    } catch (error) {
      message.error('Error al generar el archivo CSV');
      console.error('CSV Export Error:', error);
    }
  }

  /**
   * Exporta datos a formato PDF (para impresión)
   * @param {Array} data - Array de objetos con los datos
   * @param {Array} headers - Array con los headers de las columnas
   * @param {Function} mapFunction - Función para mapear los datos a HTML
   * @param {string} title - Título del reporte
   * @param {string} subtitle - Subtítulo del reporte (opcional)
   */
  static exportToPDF(data, headers, mapFunction, title, subtitle = '') {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px; 
            }
            h1 { 
              color: #333; 
              text-align: center; 
              font-size: 18px;
              margin-bottom: 10px;
            }
            h2 { 
              color: #666; 
              text-align: center; 
              font-size: 14px;
              margin-bottom: 20px; 
            }
            .info {
              text-align: center;
              margin-bottom: 20px;
              font-size: 11px;
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
              font-size: 10px;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .active { 
              color: #28a745; 
              font-weight: bold; 
            }
            .inactive { 
              color: #dc3545; 
              font-weight: bold; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          <div class="info">
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')} | Total de registros: ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `<tr>${mapFunction(item)}</tr>`).join('')}
            </tbody>
          </table>
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
        message.success('PDF generado para impresión');
      } else {
        message.error('No se pudo abrir la ventana de impresión. Verifique que el bloqueador de ventanas emergentes esté deshabilitado.');
      }
    } catch (error) {
      message.error('Error al generar el PDF');
      console.error('PDF Export Error:', error);
    }
  }

  /**
   * Exporta datos a formato Excel
   * @param {Array} data - Array de objetos con los datos
   * @param {Array} headers - Array con los headers de las columnas
   * @param {Function} mapFunction - Función para mapear los datos
   * @param {string} filename - Nombre del archivo
   * @param {string} sheetName - Nombre de la hoja
   */
  static exportToExcel(data, headers, mapFunction, filename, sheetName = 'Datos') {
    try {
      const excelContent = `
        <?xml version="1.0"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:html="http://www.w3.org/TR/REC-html40">
          <Worksheet ss:Name="${sheetName}">
            <Table>
              <Row>
                ${headers.map(header => `<Cell><Data ss:Type="String">${header}</Data></Cell>`).join('')}
              </Row>
              ${data.map(item => `
                <Row>
                  ${mapFunction(item).map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}
                </Row>
              `).join('')}
            </Table>
          </Worksheet>
        </Workbook>
      `;

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Archivo Excel descargado correctamente');
    } catch (error) {
      message.error('Error al generar el archivo Excel');
      console.error('Excel Export Error:', error);
    }
  }

  /**
   * Sanitiza texto para CSV (escapa comillas y agrega comillas si es necesario)
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  static sanitizeCSV(text) {
    if (text === null || text === undefined) return '';
    const stringValue = String(text);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * Sanitiza texto para HTML (escapa caracteres especiales)
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  static sanitizeHTML(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Funciones específicas para instituciones
   */

  /**
   * Exporta listado de instituciones a CSV
   */
  static exportInstitutionsToCSV(institutions) {
    const headers = [
      'ID', 'Nombre', 'Código', 'Estado',
      'Email Contacto', 'Teléfono', 'Dirección', 'Fecha Creación'
    ];

    const mapFunction = (institution) => [
      ExportUtils.sanitizeCSV(institution.id),
      ExportUtils.sanitizeCSV(institution.name),
      ExportUtils.sanitizeCSV(institution.codeInstitution),
      ExportUtils.sanitizeCSV(institution.status === 'A' ? 'Activo' : 'Inactivo'),
      ExportUtils.sanitizeCSV(institution.contactEmail),
      ExportUtils.sanitizeCSV(institution.contactPhone),
      ExportUtils.sanitizeCSV(institution.address),
      ExportUtils.sanitizeCSV(institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : '')
    ];

    ExportUtils.exportToCSV(institutions, headers, mapFunction, 'instituciones');
  }

  /**
   * Exporta listado de instituciones a PDF
   */
  static exportInstitutionsToPDF(institutions) {
    const headers = [
      'Nombre', 'Código', 'Estado', 'Email', 'Teléfono'
    ];

    const mapFunction = (institution) => `
      <td>${ExportUtils.sanitizeHTML(institution.name)}</td>
      <td>${ExportUtils.sanitizeHTML(institution.codeInstitution)}</td>
      <td class="${institution.status === 'A' ? 'active' : 'inactive'}">
        ${institution.status === 'A' ? 'Activo' : 'Inactivo'}
      </td>
      <td>${ExportUtils.sanitizeHTML(institution.contactEmail)}</td>
      <td>${ExportUtils.sanitizeHTML(institution.contactPhone)}</td>
    `;

    ExportUtils.exportToPDF(
      institutions, 
      headers, 
      mapFunction, 
      'Listado de Instituciones',
      'Reporte de Instituciones Educativas'
    );
  }

  /**
   * Exporta listado de instituciones a Excel
   */
  static exportInstitutionsToExcel(institutions) {
    const headers = [
      'ID', 'Nombre', 'Código', 'Estado',
      'Email Contacto', 'Teléfono', 'Dirección', 'Fecha Creación'
    ];

    const mapFunction = (institution) => [
      institution.id,
      institution.name,
      institution.codeInstitution,
      institution.status === 'A' ? 'Activo' : 'Inactivo',
      institution.contactEmail,
      institution.contactPhone,
      institution.address,
      institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : ''
    ];

    ExportUtils.exportToExcel(institutions, headers, mapFunction, 'instituciones', 'Instituciones');
  }

  /**
   * Exporta listado de sedes a CSV
   */
  static exportHeadquartersToCSV(headquarters, institutionName) {
    const headers = [
      'ID', 'Nombre Sede', 'Códigos Modulares', 'Estado', 'Dirección',
      'Teléfono', 'Fecha Creación'
    ];

    const mapFunction = (hq) => {
      // Procesar códigos modulares
      let modularCodesText = 'Sin códigos';
      if (Array.isArray(hq.modularCode) && hq.modularCode.length > 0) {
        modularCodesText = hq.modularCode.join(', ');
      }

      return [
        ExportUtils.sanitizeCSV(hq.id),
        ExportUtils.sanitizeCSV(hq.name),
        ExportUtils.sanitizeCSV(modularCodesText),
        ExportUtils.sanitizeCSV(hq.status === 'A' ? 'Activo' : 'Inactivo'),
        ExportUtils.sanitizeCSV(hq.address),
        ExportUtils.sanitizeCSV(hq.phone),
        ExportUtils.sanitizeCSV(hq.createdAt ? new Date(hq.createdAt).toLocaleDateString() : '')
      ];
    };

    ExportUtils.exportToCSV(headquarters, headers, mapFunction, `sedes_${institutionName || 'institucion'}`);
  }

  /**
   * Exporta listado de sedes a PDF
   */
  static exportHeadquartersToPDF(headquarters, institutionName) {
    const headers = [
      'Nombre Sede', 'Códigos Modulares', 'Estado', 'Teléfono'
    ];

    const mapFunction = (hq) => {
      // Procesar códigos modulares
      let modularCodesText = 'Sin códigos';
      if (Array.isArray(hq.modularCode) && hq.modularCode.length > 0) {
        modularCodesText = hq.modularCode.join(', ');
      }

      return `
        <td>${ExportUtils.sanitizeHTML(hq.name)}</td>
        <td>${ExportUtils.sanitizeHTML(modularCodesText)}</td>
        <td class="${hq.status === 'A' ? 'active' : 'inactive'}">
          ${hq.status === 'A' ? 'Activo' : 'Inactivo'}
        </td>
        <td>${ExportUtils.sanitizeHTML(hq.phone)}</td>
      `;
    };

    ExportUtils.exportToPDF(
      headquarters, 
      headers, 
      mapFunction, 
      `Listado de Sedes - ${institutionName || 'Institución'}`,
      'Reporte de Sedes Educativas'
    );
  }

  /**
   * Exporta listado de sedes a Excel
   */
  static exportHeadquartersToExcel(headquarters, institutionName) {
    const headers = [
      'ID', 'Nombre Sede', 'Códigos Modulares', 'Estado', 'Dirección',
      'Teléfono', 'Fecha Creación'
    ];

    const mapFunction = (hq) => {
      // Procesar códigos modulares
      let modularCodesText = 'Sin códigos';
      if (Array.isArray(hq.modularCode) && hq.modularCode.length > 0) {
        modularCodesText = hq.modularCode.join(', ');
      }

      return [
        hq.id,
        hq.name,
        modularCodesText,
        hq.status === 'A' ? 'Activo' : 'Inactivo',
        hq.address,
        hq.phone,
        hq.createdAt ? new Date(hq.createdAt).toLocaleDateString() : ''
      ];
    };

    ExportUtils.exportToExcel(headquarters, headers, mapFunction, `sedes_${institutionName || 'institucion'}`, 'Sedes');
  }
}

export default ExportUtils;