// Utilidades de exportación para tablas de calificaciones
import { message } from 'antd';
import { 
  GradeScale,
  formatDate
} from '../../types/grades/grade';

export class GradeExportUtils {
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
      // Generar estadísticas resumidas
      const summary = GradeExportUtils.generateGradesSummary(data);
      const currentDate = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
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
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
            }
            h1 { 
              color: #333; 
              font-size: 22px;
              margin: 0 0 8px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 { 
              color: #666; 
              font-size: 16px;
              margin: 0 0 8px 0;
              font-weight: normal;
            }
            .report-info {
              background-color: #f8f9fa;
              padding: 15px;
              margin-bottom: 20px;
              border-left: 4px solid #333;
              border-radius: 3px;
            }
            .info-row {
              display: inline-block;
              margin-right: 30px;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .summary-section {
              background-color: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 5px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .summary-title {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            .summary-grid {
              display: table;
              width: 100%;
              margin-top: 10px;
            }
            .summary-item {
              display: table-row;
            }
            .summary-label {
              display: table-cell;
              padding: 8px;
              font-weight: bold;
              color: #555;
              width: 60%;
              border-bottom: 1px solid #eee;
            }
            .summary-value {
              display: table-cell;
              padding: 8px;
              text-align: right;
              color: #333;
              font-size: 14px;
              border-bottom: 1px solid #eee;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 11px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 10px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #333; 
              color: white;
              font-weight: bold; 
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover {
              background-color: #f0f0f0;
            }
            tbody tr td:first-child {
              font-weight: 600;
            }
            .level-ad { 
              color: #2ECC71; 
              font-weight: bold; 
              background-color: #d4edda;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .level-a { 
              color: #3498DB; 
              font-weight: bold; 
              background-color: #d1ecf1;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .level-b { 
              color: #F39C12; 
              font-weight: bold; 
              background-color: #fff3cd;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .level-c { 
              color: #E74C3C; 
              font-weight: bold; 
              background-color: #f8d7da;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #333;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
              .summary-section { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          </div>
          
          <div class="report-info">
            <div class="info-row">
              <span class="info-label">📅 Fecha:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📊 Total de registros:</span>
              <span class="info-value">${data.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">👥 Estudiantes:</span>
              <span class="info-value">${summary.uniqueStudents}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📚 Cursos:</span>
              <span class="info-value">${summary.uniqueCourses}</span>
            </div>
          </div>

          <div class="summary-section">
            <div class="summary-title">📈 Distribución por Nivel de Logro</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">🌟 AD - Logro Destacado</span>
                <span class="summary-value">${summary.levelDistribution.AD || 0} (${((summary.levelDistribution.AD || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">✅ A - Logro Esperado</span>
                <span class="summary-value">${summary.levelDistribution.A || 0} (${((summary.levelDistribution.A || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">⚠️ B - En Proceso</span>
                <span class="summary-value">${summary.levelDistribution.B || 0} (${((summary.levelDistribution.B || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">❌ C - En Inicio</span>
                <span class="summary-value">${summary.levelDistribution.C || 0} (${((summary.levelDistribution.C || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          ${Object.keys(summary.periodDistribution).length > 0 ? `
          <div class="summary-section">
            <div class="summary-title">📅 Distribución por Período Académico</div>
            <div class="summary-grid">
              ${Object.entries(summary.periodDistribution).map(([period, count]) => `
                <div class="summary-item">
                  <span class="summary-label">${period}</span>
                  <span class="summary-value">${count} calificaciones</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

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
          
          <div class="footer">
            <p><strong>Sistema de Gestión Académica - Calificaciones</strong></p>
            <p>Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
            <p>Total de ${data.length} ${data.length === 1 ? 'registro' : 'registros'} | ${summary.uniqueStudents} ${summary.uniqueStudents === 1 ? 'estudiante' : 'estudiantes'} | ${summary.uniqueCourses} ${summary.uniqueCourses === 1 ? 'curso' : 'cursos'}</p>
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
   * Obtiene la clase CSS para la escala de calificación
   * @param {string} scale - Código de la escala de calificación
   * @returns {string} Clase CSS
   */
  static getGradeScaleClass(scale) {
    switch (scale) {
      case 'AD': return 'level-ad';
      case 'A': return 'level-a';
      case 'B': return 'level-b';
      case 'C': return 'level-c';
      case 'LOGRADO': return 'level-logrado';
      case 'PROCESO': return 'level-proceso';
      case 'INICIO': return 'level-inicio';
      default: return '';
    }
  }

  /**
   * Funciones específicas para calificaciones
   */

  /**
   * Exporta listado de calificaciones a CSV
   */
  static exportGradesToCSV(grades) {
    const headers = [
      'ID', 'Estudiante', 'Curso', 'Tipo Período', 'Tipo Evaluación',
      'Escala Calificación', 'Descripción Escala', 'Fecha Evaluación', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.id),
      GradeExportUtils.sanitizeCSV(grade.studentId),
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.typePeriod),
      GradeExportUtils.sanitizeCSV(grade.evaluationType),
      GradeExportUtils.sanitizeCSV(grade.gradeScale),
      GradeExportUtils.sanitizeCSV(GradeScale[grade.gradeScale]?.name || ''),
      GradeExportUtils.sanitizeCSV(formatDate(grade.evaluationDate)),
      GradeExportUtils.sanitizeCSV(grade.observations)
    ];

    GradeExportUtils.exportToCSV(grades, headers, mapFunction, 'calificaciones');
  }

  /**
   * Exporta listado de calificaciones a PDF
   */
  static exportGradesToPDF(grades) {
    const headers = [
      'Estudiante', 'Curso', 'Tipo Período', 'Tipo Evaluación', 'Escala Calificación', 'Fecha', 'Observaciones'
    ];

    const mapFunction = (grade) => {
      const scaleInfo = GradeScale[grade.gradeScale];
      const scaleClass = GradeExportUtils.getGradeScaleClass(grade.gradeScale);
      const observations = grade.observations ? GradeExportUtils.sanitizeHTML(grade.observations) : '-';
      
      return `
        <td style="font-weight: 600;">${GradeExportUtils.sanitizeHTML(grade.studentId)}</td>
        <td>${GradeExportUtils.sanitizeHTML(grade.courseId)}</td>
        <td style="text-align: center;">${GradeExportUtils.sanitizeHTML(grade.typePeriod)}</td>
        <td style="font-size: 9px;">${GradeExportUtils.sanitizeHTML(grade.evaluationType)}</td>
        <td style="text-align: center;">
          <span class="${scaleClass}">
            ${grade.gradeScale} - ${scaleInfo?.name || ''}
          </span>
        </td>
        <td style="text-align: center;">${GradeExportUtils.sanitizeHTML(formatDate(grade.evaluationDate))}</td>
        <td style="font-size: 9px; max-width: 150px;">${observations}</td>
      `;
    };

    GradeExportUtils.exportToPDF(
      grades, 
      headers, 
      mapFunction, 
      'Reporte de Calificaciones Académicas',
      'Sistema de Evaluación Educativa'
    );
  }

  /**
   * Exporta listado de calificaciones a Excel
   */
  static exportGradesToExcel(grades) {
    const headers = [
      'ID', 'Estudiante', 'Curso', 'Tipo Período', 'Tipo Evaluación',
      'Escala Calificación', 'Descripción Escala', 'Fecha Evaluación', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      grade.id,
      grade.studentId,
      grade.courseId,
      grade.typePeriod,
      grade.evaluationType,
      grade.gradeScale,
      GradeScale[grade.gradeScale]?.name || '',
      formatDate(grade.evaluationDate),
      grade.observations
    ];

    GradeExportUtils.exportToExcel(grades, headers, mapFunction, 'calificaciones', 'Calificaciones');
  }

  /**
   * Exporta reporte por tipo de período
   */
  static exportGradesByPeriodToCSV(grades, period) {
    const filteredGrades = grades.filter(grade => grade.typePeriod === period);
    
    const headers = [
      'Estudiante', 'Curso', 'Escala Calificación', 'Descripción', 'Fecha Evaluación'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.studentId),
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.gradeScale),
      GradeExportUtils.sanitizeCSV(GradeScale[grade.gradeScale]?.name || ''),
      GradeExportUtils.sanitizeCSV(formatDate(grade.evaluationDate))
    ];

    GradeExportUtils.exportToCSV(
      filteredGrades, 
      headers, 
      mapFunction, 
      `calificaciones_${period.toLowerCase().replace(/\s+/g, '_')}`
    );
  }

  /**
   * Exporta reporte por estudiante
   */
  static exportGradesByStudentToCSV(grades, studentId) {
    const studentGrades = grades.filter(grade => grade.studentId === studentId);
    
    const headers = [
      'Curso', 'Tipo Período', 'Tipo Evaluación', 'Escala Calificación', 'Descripción', 'Fecha', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.typePeriod),
      GradeExportUtils.sanitizeCSV(grade.evaluationType),
      GradeExportUtils.sanitizeCSV(grade.gradeScale),
      GradeExportUtils.sanitizeCSV(GradeScale[grade.gradeScale]?.name || ''),
      GradeExportUtils.sanitizeCSV(formatDate(grade.evaluationDate)),
      GradeExportUtils.sanitizeCSV(grade.observations)
    ];

    GradeExportUtils.exportToCSV(
      studentGrades, 
      headers, 
      mapFunction, 
      `calificaciones_estudiante_${studentId.replace(/\s+/g, '_')}`
    );
  }

  /**
   * Genera resumen estadístico de calificaciones
   */
  static generateGradesSummary(grades) {
    const totalGrades = grades.length;
    const uniqueStudents = new Set(grades.map(g => g.studentId)).size;
    const uniqueCourses = new Set(grades.map(g => g.courseId)).size;
    
    // Distribución por escala de calificación
    const scaleDistribution = {};
    Object.keys(GradeScale).forEach(scale => {
      scaleDistribution[scale] = grades.filter(g => g.gradeScale === scale).length;
    });
    
    // Distribución por tipo de período
    const periodDistribution = {};
    grades.forEach(grade => {
      const period = grade.typePeriod || 'Sin período';
      periodDistribution[period] = (periodDistribution[period] || 0) + 1;
    });

    return {
      totalGrades,
      uniqueStudents,
      uniqueCourses,
      scaleDistribution,
      periodDistribution
    };
  }
}

export default GradeExportUtils;