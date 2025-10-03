// Utilidades de exportación para estudiantes
import { message } from 'antd';
import { StudentStatus, formatBirthDate, calculateAge } from '../../types/students/students';

export class ExportUtils {
  /**
   * Exporta estudiantes a formato CSV
   * @param {Array} students - Array de estudiantes
   * @param {string} filename - Nombre del archivo (opcional)
   */
  static exportStudentsToCSV(students, filename = 'estudiantes') {
    const headers = [
      'Nombre',
      'Apellido',
      'Tipo Documento',
      'Número Documento',
      'Fecha Nacimiento',
      'Edad',
      'Género',
      'Dirección',
      'Distrito',
      'Provincia',
      'Departamento',
      'Teléfono',
      'Email',
      'Apoderado',
      'Teléfono Apoderado',
      'Email Apoderado',
      'Relación',
      'Estado',
      'Fecha Registro'
    ];

    const mapFunction = (student) => [
      `"${student.firstName || ''}"`,
      `"${student.lastName || ''}"`,
      `"${student.documentType || ''}"`,
      `"${student.documentNumber || ''}"`,
      `"${formatBirthDate(student.birthDate) || ''}"`,
      `"${calculateAge(student.birthDate) || ''}"`,
      `"${student.gender === 'MALE' ? 'Masculino' : 'Femenino'}"`,
      `"${student.address || ''}"`,
      `"${student.district || ''}"`,
      `"${student.province || ''}"`,
      `"${student.department || ''}"`,
      `"${student.phone || ''}"`,
      `"${student.email || ''}"`,
      `"${student.guardianName || ''} ${student.guardianLastName || ''}"`,
      `"${student.guardianPhone || ''}"`,
      `"${student.guardianEmail || ''}"`,
      `"${student.guardianRelationship || ''}"`,
      `"${this.getStatusText(student.status)}"`,
      `"${this.formatDateTime(student.createdAt) || ''}"`
    ];

    this.exportToCSV(students, headers, mapFunction, filename);
  }
  /**
   * Exporta estudiantes a formato PDF
   * @param {Array} students - Array de estudiantes
   * @param {string} title - Título del reporte
   */
  static exportStudentsToPDF(students, title = 'Reporte de Estudiantes') {
    const headers = ['Nombre Completo', 'Documento', 'Edad', 'Género', 'Apoderado', 'Estado'];
    
    const mapFunction = (student) => `
      <tr>
        <td>${student.firstName} ${student.lastName}</td>
        <td>${student.documentType}: ${student.documentNumber}</td>
        <td>${calculateAge(student.birthDate)} años</td>
        <td>${student.gender === 'MALE' ? 'Masculino' : 'Femenino'}</td>
        <td>${student.guardianName} ${student.guardianLastName}</td>
        <td>${this.getStatusText(student.status)}</td>
      </tr>
    `;

    const subtitle = `Total de estudiantes: ${students.length}`;
    this.exportToPDF(students, headers, mapFunction, title, subtitle);
  }

  /**
   * Genera template de estudiantes para importación
   */
  static downloadStudentTemplate() {
    const templateData = [
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
      }
    ];

    const jsonContent = JSON.stringify(templateData, null, 2);
    this.downloadJSON(jsonContent, 'template_estudiantes');
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
      [StudentStatus.ACTIVE]: 'Activo',
      [StudentStatus.INACTIVE]: 'Inactivo',
      [StudentStatus.TRANSFERRED]: 'Transferido',
      [StudentStatus.GRADUATED]: 'Graduado',
      [StudentStatus.DECEASED]: 'Retirado'
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

export default ExportUtils;