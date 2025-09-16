import { formatBirthDate, getStatusText, calculateAge } from '../../types/students/students';

/**
 * Utilidades para exportar datos de estudiantes
 */
class StudentExportUtils {
  
  /**
   * Exporta datos de estudiantes a CSV
   */
  static exportStudentsToCSV(students, filename = 'estudiantes') {
    try {
      // Preparar los datos para CSV
      const csvData = students.map(student => ({
        'Nombres': student.firstName,
        'Apellidos': student.lastName,
        'Tipo_Documento': student.documentType,
        'Numero_Documento': student.documentNumber,
        'Fecha_Nacimiento': formatBirthDate(student.birthDate),
        'Edad': calculateAge(student.birthDate),
        'Genero': student.gender === 'MALE' ? 'Masculino' : 'Femenino',
        'Direccion': student.address,
        'Distrito': student.district,
        'Provincia': student.province,
        'Departamento': student.department,
        'Telefono': student.phone || '',
        'Email': student.email || '',
        'Apoderado': `${student.guardianName} ${student.guardianLastName}`,
        'Documento_Apoderado': `${student.guardianDocumentType} ${student.guardianDocumentNumber}`,
        'Telefono_Apoderado': student.guardianPhone || '',
        'Email_Apoderado': student.guardianEmail || '',
        'Relacion': student.guardianRelationship,
        'Estado': getStatusText(student.status),
        'Fecha_Registro': new Date(student.createdAt).toLocaleDateString()
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
  static printStudentsReport(students) {
    try {
      // Crear el contenido HTML para imprimir
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Estudiantes</title>
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
            <h2>Reporte de Estudiantes</h2>
          </div>
          <div class="info">
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total de estudiantes:</strong> ${students.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>F. Nacimiento</th>
                <th>Edad</th>
                <th>Género</th>
                <th>Ubicación</th>
                <th>Apoderado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td>${student.firstName} ${student.lastName}</td>
                  <td>${student.documentType} ${student.documentNumber}</td>
                  <td>${formatBirthDate(student.birthDate)}</td>
                  <td>${calculateAge(student.birthDate)}</td>
                  <td>${student.gender === 'MALE' ? 'Masculino' : 'Femenino'}</td>
                  <td>${student.district}, ${student.province}</td>
                  <td>${student.guardianName} ${student.guardianLastName}</td>
                  <td>${getStatusText(student.status)}</td>
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
   * Genera estadísticas básicas de los estudiantes
   */
  static generateStudentStats(students) {
    const stats = {
      total: students.length,
      byGender: {
        male: students.filter(s => s.gender === 'MALE').length,
        female: students.filter(s => s.gender === 'FEMALE').length
      },
      byStatus: {},
      byAge: {
        '0-5': 0,
        '6-11': 0,
        '12-17': 0,
        '18+': 0
      },
      averageAge: 0
    };

    // Estadísticas por estado
    const statuses = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DECEASED'];
    statuses.forEach(status => {
      stats.byStatus[status] = students.filter(s => s.status === status).length;
    });

    // Estadísticas por edad
    let totalAge = 0;
    students.forEach(student => {
      const age = calculateAge(student.birthDate);
      totalAge += age;
      
      if (age <= 5) stats.byAge['0-5']++;
      else if (age <= 11) stats.byAge['6-11']++;
      else if (age <= 17) stats.byAge['12-17']++;
      else stats.byAge['18+']++;
    });

    stats.averageAge = students.length > 0 ? Math.round(totalAge / students.length * 10) / 10 : 0;

    return stats;
  }
}

export default StudentExportUtils;