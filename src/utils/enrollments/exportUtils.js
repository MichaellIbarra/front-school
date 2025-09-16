import { formatEnrollmentDate, getEnrollmentStatusText } from '../../types/enrollments/enrollments';

/**
 * Utilidades para exportar datos de matrículas
 */
class EnrollmentExportUtils {
  
  /**
   * Exporta datos de matrículas a CSV
   */
  static exportEnrollmentsToCSV(enrollments, filename = 'matriculas') {
    try {
      // Preparar los datos para CSV
      const csvData = enrollments.map(enrollment => ({
        'Numero_Matricula': enrollment.enrollmentNumber,
        'ID_Estudiante': enrollment.studentId,
        'ID_Aula': enrollment.classroomId,
        'Fecha_Matricula': formatEnrollmentDate(enrollment.enrollmentDate),
        'Estado': getEnrollmentStatusText(enrollment.status),
        'Fecha_Registro': new Date(enrollment.createdAt).toLocaleDateString(),
        'Ultima_Actualizacion': enrollment.updatedAt ? new Date(enrollment.updatedAt).toLocaleDateString() : ''
      }));

      // Crear el contenido CSV
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar comillas y envolver en comillas si contiene comas
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `${filename}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: 'Archivo CSV descargado correctamente' };
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      return { success: false, error: 'Error al generar el archivo CSV' };
    }
  }
  
  /**
   * Imprime el reporte usando la función nativa del navegador
   */
  static printEnrollmentsReport(enrollments) {
    try {
      // Crear el contenido HTML para imprimir
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Matrículas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Reporte de Matrículas</h2>
          </div>
          <div class="info">
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total de matrículas:</strong> ${enrollments.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>ID Estudiante</th>
                <th>ID Aula</th>
                <th>F. Matrícula</th>
                <th>Estado</th>
                <th>F. Registro</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.map(enrollment => `
                <tr>
                  <td>${enrollment.enrollmentNumber}</td>
                  <td>${enrollment.studentId}</td>
                  <td>${enrollment.classroomId}</td>
                  <td>${formatEnrollmentDate(enrollment.enrollmentDate)}</td>
                  <td>${getEnrollmentStatusText(enrollment.status)}</td>
                  <td>${new Date(enrollment.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      return { success: true, message: 'Reporte enviado a impresión' };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: 'Error al imprimir el reporte' };
    }
  }

  /**
   * Genera estadísticas básicas de las matrículas
   */
  static generateEnrollmentStats(enrollments) {
    const stats = {
      total: enrollments.length,
      byStatus: {},
      byMonth: {},
      byClassroom: {}
    };

    // Estadísticas por estado
    const statuses = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED'];
    statuses.forEach(status => {
      stats.byStatus[status] = enrollments.filter(e => e.status === status).length;
    });

    // Estadísticas por mes
    enrollments.forEach(enrollment => {
      let month;
      if (Array.isArray(enrollment.enrollmentDate)) {
        month = `${enrollment.enrollmentDate[0]}-${enrollment.enrollmentDate[1].toString().padStart(2, '0')}`;
      } else {
        const date = new Date(enrollment.enrollmentDate);
        month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    // Estadísticas por aula
    enrollments.forEach(enrollment => {
      const classroom = enrollment.classroomId;
      stats.byClassroom[classroom] = (stats.byClassroom[classroom] || 0) + 1;
    });

    return stats;
  }

  /**
   * Exporta plantilla para carga masiva de matrículas
   */
  static exportEnrollmentTemplate(filename = 'plantilla_matriculas') {
    try {
      // Datos de ejemplo para la plantilla
      const templateData = [
        {
          'studentId': 'ID_DEL_ESTUDIANTE',
          'classroomId': 'ID_DEL_AULA',
          'enrollmentNumber': 'NUMERO_MATRICULA',
          'enrollmentDate': 'YYYY-MM-DD'
        },
        {
          'studentId': 'ejemplo-student-id-1',
          'classroomId': 'aula-2025-primero-a',
          'enrollmentNumber': 'MAT-2025-001',
          'enrollmentDate': '2025-03-01'
        }
      ];

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Ajustar el ancho de las columnas
      const colWidths = [
        { wch: 25 }, // studentId
        { wch: 20 }, // classroomId
        { wch: 15 }, // enrollmentNumber
        { wch: 12 }  // enrollmentDate
      ];
      ws['!cols'] = colWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Matrículas');

      // Descargar el archivo
      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

      return { success: true, message: 'Plantilla descargada correctamente' };
    } catch (error) {
      console.error('Error al exportar plantilla:', error);
      return { success: false, error: 'Error al generar la plantilla' };
    }
  }
}

export default EnrollmentExportUtils;