// Utilidades de exportación para tablas de calificaciones
import { message } from 'antd';
import { 
  AchievementLevel,
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
            .level-ad { color: #2ECC71; font-weight: bold; }
            .level-a { color: #3498DB; font-weight: bold; }
            .level-b { color: #F39C12; font-weight: bold; }
            .level-c { color: #E74C3C; font-weight: bold; }
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
   * Obtiene la clase CSS para el nivel de logro
   * @param {string} level - Código del nivel de logro
   * @returns {string} Clase CSS
   */
  static getAchievementLevelClass(level) {
    switch (level) {
      case 'AD': return 'level-ad';
      case 'A': return 'level-a';
      case 'B': return 'level-b';
      case 'C': return 'level-c';
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
      'ID', 'Estudiante', 'Curso', 'Período Académico', 'Tipo Evaluación',
      'Nivel de Logro', 'Descripción Logro', 'Fecha Evaluación', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.id),
      GradeExportUtils.sanitizeCSV(grade.studentId),
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.academicPeriod),
      GradeExportUtils.sanitizeCSV(grade.evaluationType),
      GradeExportUtils.sanitizeCSV(grade.achievementLevel),
      GradeExportUtils.sanitizeCSV(AchievementLevel[grade.achievementLevel]?.name || ''),
      GradeExportUtils.sanitizeCSV(formatDate(grade.evaluationDate)),
      GradeExportUtils.sanitizeCSV(grade.remarks)
    ];

    GradeExportUtils.exportToCSV(grades, headers, mapFunction, 'calificaciones');
  }

  /**
   * Exporta listado de calificaciones a PDF
   */
  static exportGradesToPDF(grades) {
    const headers = [
      'Estudiante', 'Curso', 'Período', 'Nivel de Logro', 'Fecha'
    ];

    const mapFunction = (grade) => {
      const levelInfo = AchievementLevel[grade.achievementLevel];
      const levelClass = GradeExportUtils.getAchievementLevelClass(grade.achievementLevel);
      
      return `
        <td>${GradeExportUtils.sanitizeHTML(grade.studentId)}</td>
        <td>${GradeExportUtils.sanitizeHTML(grade.courseId)}</td>
        <td>${GradeExportUtils.sanitizeHTML(grade.academicPeriod)}</td>
        <td class="${levelClass}">
          ${grade.achievementLevel} - ${levelInfo?.name || ''}
        </td>
        <td>${GradeExportUtils.sanitizeHTML(formatDate(grade.evaluationDate))}</td>
      `;
    };

    GradeExportUtils.exportToPDF(
      grades, 
      headers, 
      mapFunction, 
      'Listado de Calificaciones',
      'Reporte de Evaluaciones Académicas'
    );
  }

  /**
   * Exporta listado de calificaciones a Excel
   */
  static exportGradesToExcel(grades) {
    const headers = [
      'ID', 'Estudiante', 'Curso', 'Período Académico', 'Tipo Evaluación',
      'Nivel de Logro', 'Descripción Logro', 'Fecha Evaluación', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      grade.id,
      grade.studentId,
      grade.courseId,
      grade.academicPeriod,
      grade.evaluationType,
      grade.achievementLevel,
      AchievementLevel[grade.achievementLevel]?.name || '',
      formatDate(grade.evaluationDate),
      grade.remarks
    ];

    GradeExportUtils.exportToExcel(grades, headers, mapFunction, 'calificaciones', 'Calificaciones');
  }

  /**
   * Exporta reporte por período académico
   */
  static exportGradesByPeriodToCSV(grades, period) {
    const filteredGrades = grades.filter(grade => grade.academicPeriod === period);
    
    const headers = [
      'Estudiante', 'Curso', 'Nivel de Logro', 'Descripción', 'Fecha Evaluación'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.studentId),
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.achievementLevel),
      GradeExportUtils.sanitizeCSV(AchievementLevel[grade.achievementLevel]?.name || ''),
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
      'Curso', 'Período', 'Tipo Evaluación', 'Nivel de Logro', 'Descripción', 'Fecha', 'Observaciones'
    ];

    const mapFunction = (grade) => [
      GradeExportUtils.sanitizeCSV(grade.courseId),
      GradeExportUtils.sanitizeCSV(grade.academicPeriod),
      GradeExportUtils.sanitizeCSV(grade.evaluationType),
      GradeExportUtils.sanitizeCSV(grade.achievementLevel),
      GradeExportUtils.sanitizeCSV(AchievementLevel[grade.achievementLevel]?.name || ''),
      GradeExportUtils.sanitizeCSV(formatDate(grade.evaluationDate)),
      GradeExportUtils.sanitizeCSV(grade.remarks)
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
    
    // Distribución por niveles de logro
    const levelDistribution = {};
    Object.keys(AchievementLevel).forEach(level => {
      levelDistribution[level] = grades.filter(g => g.achievementLevel === level).length;
    });
    
    // Distribución por período
    const periodDistribution = {};
    grades.forEach(grade => {
      const period = grade.academicPeriod || 'Sin período';
      periodDistribution[period] = (periodDistribution[period] || 0) + 1;
    });

    return {
      totalGrades,
      uniqueStudents,
      uniqueCourses,
      levelDistribution,
      periodDistribution
    };
  }
}

export default GradeExportUtils;