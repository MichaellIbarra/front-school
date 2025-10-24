// Utilidades de exportación para matrículas
import { message } from 'antd';
import { EnrollmentStatus } from '../../types/enrollments/enrollments';

export class EnrollmentExportUtils {
  /**
   * Exporta matrículas a formato CSV
   * @param {Array} enrollments - Array de matrículas
   * @param {string} filename - Nombre del archivo (opcional)
   */
  static exportEnrollmentsToCSV(enrollments, filename = 'matriculas') {
    const headers = [
      'ID de Estudiante',
      'ID de Aula',
      'Fecha de Matrícula',
      'Tipo de Matrícula',
      'Estado'
    ];

    const mapFunction = (enrollment) => [
      `"${enrollment.studentId || ''}"`,
      `"${enrollment.classroomId || ''}"`,
      `"${this.formatDateTime(enrollment.enrollmentDate) || ''}"`,
      `"${enrollment.enrollmentType || ''}"`,
      `"${this.getStatusText(enrollment.status)}"`
    ];

    this.exportToCSV(enrollments, headers, mapFunction, filename);
  }
  /**
   * Exporta matrículas a formato PDF
   * @param {Array} enrollments - Array de matrículas
   * @param {string} title - Título del reporte
   */
  static exportEnrollmentsToPDF(enrollments, title = 'Reporte de Matrículas') {
    const headers = ['ID de Estudiante', 'ID de Aula', 'Fecha de Matrícula', 'Tipo', 'Estado'];
    
    const mapFunction = (enrollment) => `
      <tr>
        <td>${enrollment.studentId}</td>
        <td>${enrollment.classroomId}</td>
        <td>${this.formatDateTime(enrollment.enrollmentDate)}</td>
        <td>${enrollment.enrollmentType}</td>
        <td>${this.getStatusText(enrollment.status)}</td>
      </tr>
    `;

    const subtitle = `Total de matrículas: ${enrollments.length}`;
    this.exportToPDF(enrollments, headers, mapFunction, title, subtitle);
  }

  /**
   * Genera template de matrículas para importación
   */
  static downloadEnrollmentTemplate() {
    const templateData = [
      {
        studentId: "c4becc23-96b7-46c2-ad52-271b71bf6ae2",
        classroomId: "classroom-uuid-001",
        enrollmentDate: "2025-03-01",
        enrollmentType: "REGULAR"
      }
    ];

    const jsonContent = JSON.stringify(templateData, null, 2);
    this.downloadJSON(jsonContent, 'template_matriculas');
  }

  /**
   * Exporta estadísticas de matrículas a PDF
   */
  static exportEnrollmentStatsToPDF(stats, title = 'Estadísticas de Matrículas') {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          .stats-container { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 200px; }
          .stat-title { font-weight: bold; color: #666; margin-bottom: 10px; }
          .stat-value { font-size: 24px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-title">Total de Matrículas</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Matrículas Activas</div>
            <div class="stat-value">${stats.byStatus.ACTIVE || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Matrículas Inactivas</div>
            <div class="stat-value">${stats.byStatus.INACTIVE || 0}</div>
          </div>
        </div>

        ${stats.byGrade ? `
        <table>
          <thead>
            <tr><th>Grado</th><th>Cantidad de Matrículas</th></tr>
          </thead>
          <tbody>
            ${Object.entries(stats.byGrade).map(([grade, count]) => 
              `<tr><td>${grade}</td><td>${count}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema de Gestión Educativa
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    this.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
    message.success('Reporte de estadísticas generado correctamente');
  }

  /**
   * Exporta datos a formato CSV
   */
  static exportToCSV(data, headers, mapFunction, filename) {
    try {
      const csvContent = [
        headers.join(','),
        ...data.map(item => mapFunction(item).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      message.success('Archivo CSV descargado correctamente');
    } catch (error) {
      message.error('Error al generar el archivo CSV');
      console.error('CSV Export Error:', error);
    }
  }

  /**
   * Exporta datos a formato PDF
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
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            h2 { color: #666; text-align: center; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          <table>
            <thead>
              <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(mapFunction).join('')}
            </tbody>
          </table>
          <div class="footer">
            Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema de Gestión Educativa
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      this.downloadBlob(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
      message.success('Reporte HTML generado correctamente');
    } catch (error) {
      message.error('Error al generar el reporte PDF');
      console.error('PDF Export Error:', error);
    }
  }

  /**
   * Descarga contenido JSON
   */
  static downloadJSON(content, filename) {
    try {
      const blob = new Blob([content], { type: 'application/json' });
      this.downloadBlob(blob, `${filename}.json`);
      message.success('Template JSON descargado correctamente');
    } catch (error) {
      message.error('Error al descargar el template');
      console.error('JSON Download Error:', error);
    }
  }

  /**
   * Descarga un blob como archivo
   */
  static downloadBlob(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Obtiene el texto del estado
   */
  static getStatusText(status) {
    const statusMap = {
      [EnrollmentStatus.ACTIVE]: 'Activa',
      [EnrollmentStatus.INACTIVE]: 'Inactiva',
      [EnrollmentStatus.TRANSFERRED]: 'Transferida',
      [EnrollmentStatus.WITHDRAWN]: 'Retirada',
      [EnrollmentStatus.COMPLETED]: 'Completada'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatea fecha y hora
   */
  static formatDateTime(dateArray) {
    if (!Array.isArray(dateArray) || dateArray.length < 6) return '';
    
    const [year, month, day, hour, minute] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute);
    return date.toLocaleString('es-ES');
  }
}

export default EnrollmentExportUtils;