/**
 * Utilidades para exportar reportes de calendario de asistencias
 * Exportación de datos de asistencias en formato calendario
 */

export class AttendanceCalendarExporter {
  
  /**
   * Sanitiza texto para CSV
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
   * Sanitiza texto para HTML
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
   * Obtiene el nombre del mes
   */
  static getMonthName(monthIndex) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  }

  /**
   * Obtiene el símbolo de estado
   */
  static getStatusSymbol(status) {
    switch(status) {
      case 'P': return 'P';
      case 'A': return 'F';
      case 'L': return 'T';
      case 'J': return 'J';
      default: return '-';
    }
  }

  /**
   * Obtiene el nombre completo del estado
   */
  static getStatusName(status) {
    switch(status) {
      case 'P': return 'Presente';
      case 'A': return 'Falta';
      case 'L': return 'Tardanza';
      case 'J': return 'Justificado';
      default: return 'Sin registro';
    }
  }

  /**
   * Obtiene el color del estado
   */
  static getStatusColor(status) {
    switch(status) {
      case 'P': return '#52c41a';
      case 'A': return '#ff4d4f';
      case 'L': return '#faad14';
      case 'J': return '#722ed1';
      default: return '#d9d9d9';
    }
  }

  /**
   * Calcula estadísticas de asistencia de un estudiante
   */
  static calculateStudentStats(attendances) {
    const stats = {
      presente: 0,
      falta: 0,
      tardanza: 0,
      justificado: 0,
      total: 0
    };

    Object.values(attendances).forEach(status => {
      stats.total++;
      switch(status) {
        case 'P': stats.presente++; break;
        case 'A': stats.falta++; break;
        case 'L': stats.tardanza++; break;
        case 'J': stats.justificado++; break;
      }
    });

    return stats;
  }

  /**
   * Calcula estadísticas generales del aula
   */
  static calculateClassroomStats(students, attendances) {
    const totalStudents = students.length;
    const stats = {
      totalStudents,
      presente: 0,
      falta: 0,
      tardanza: 0,
      justificado: 0,
      totalRegistros: 0
    };

    students.forEach(student => {
      const studentAttendances = attendances[student.studentId] || {};
      const studentStats = this.calculateStudentStats(studentAttendances);
      stats.presente += studentStats.presente;
      stats.falta += studentStats.falta;
      stats.tardanza += studentStats.tardanza;
      stats.justificado += studentStats.justificado;
      stats.totalRegistros += studentStats.total;
    });

    return stats;
  }

  /**
   * Exporta calendario de asistencias a CSV
   */
  static exportCalendarToCSV(students, attendances, currentMonth, classroom) {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Crear encabezados
      const headers = ['Estudiante', 'ID'];
      for (let day = 1; day <= daysInMonth; day++) {
        headers.push(`Día ${day}`);
      }
      headers.push('Presente', 'Falta', 'Tardanza', 'Justificado', 'Total');

      // Crear filas de datos
      const rows = students.map(student => {
        const studentAttendances = attendances[student.studentId] || {};
        const stats = this.calculateStudentStats(studentAttendances);
        
        const row = [
          this.sanitizeCSV(student.studentName || 'Sin nombre'),
          this.sanitizeCSV(student.studentId.slice(-8))
        ];

        // Agregar asistencias por día
        for (let day = 1; day <= daysInMonth; day++) {
          const status = studentAttendances[day];
          row.push(this.sanitizeCSV(status ? this.getStatusSymbol(status) : '-'));
        }

        // Agregar estadísticas
        row.push(
          stats.presente,
          stats.falta,
          stats.tardanza,
          stats.justificado,
          stats.total
        );

        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      // Descargar archivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = `calendario_asistencias_${classroom.classroomName.replace(/[^a-zA-Z0-9]/g, '_')}_${this.getMonthName(month)}_${year}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, message: 'Archivo CSV descargado correctamente' };
    } catch (error) {
      console.error('CSV Export Error:', error);
      return { success: false, error: 'Error al generar el archivo CSV' };
    }
  }

  /**
   * Exporta calendario de asistencias a PDF
   */
  static exportCalendarToPDF(students, attendances, currentMonth, classroom) {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthName = this.getMonthName(month);

      // Calcular estadísticas generales
      const classroomStats = this.calculateClassroomStats(students, attendances);

      // Obtener datos de institución y usuario
      let institutionData = null;
      try {
        const authServiceModule = require('../../services/auth/authService');
        institutionData = authServiceModule.getUserInstitution();
      } catch (error) {
        // Si no se puede cargar authService, usar datos de localStorage
      }

      const institutionName = institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#1890ff';
      const currentUser = localStorage.getItem('user_fullname') || 'Auxiliar';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Calendario de Asistencias</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px;
              font-size: 10px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid ${institutionColor};
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 10px;
            }
            .logo-container img {
              max-width: 80px;
              max-height: 80px;
              object-fit: contain;
            }
            .header h1 { 
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
              color: ${institutionColor};
            }
            .header h2 { 
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .header h3 { 
              font-size: 12px;
              color: #888;
            }
            .info-section {
              margin-bottom: 15px;
              display: flex;
              justify-content: space-between;
            }
            .info-box {
              background: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              flex: 1;
              margin: 0 5px;
            }
            .info-box p {
              margin: 3px 0;
              font-size: 9px;
            }
            .stats-section {
              display: flex;
              justify-content: space-around;
              margin-bottom: 15px;
              padding: 12px;
              background: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-item .number {
              font-size: 20px;
              font-weight: bold;
              color: ${institutionColor};
            }
            .stat-item .label {
              font-size: 9px;
              color: #666;
              margin-top: 3px;
            }
            .legend {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 15px;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .legend-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 9px;
            }
            .legend-icon {
              width: 20px;
              height: 20px;
              border-radius: 3px;
              color: white;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
            }
            .calendar-table { 
              width: 100%; 
              border-collapse: collapse;
              font-size: 8px;
              margin-bottom: 20px;
            }
            .calendar-table th, .calendar-table td { 
              border: 1px solid #ddd; 
              padding: 4px 2px; 
              text-align: center;
            }
            .calendar-table th { 
              background-color: ${institutionColor}; 
              color: white;
              font-weight: bold;
              font-size: 8px;
            }
            .calendar-table .student-column {
              text-align: left;
              max-width: 120px;
              font-size: 8px;
              background: #f5f5f5;
            }
            .calendar-table .student-name {
              font-weight: bold;
              font-size: 8px;
            }
            .calendar-table .student-id {
              font-size: 7px;
              color: #666;
            }
            .calendar-table .day-cell {
              width: 18px;
              height: 18px;
              padding: 2px;
            }
            .status-badge {
              display: inline-block;
              width: 14px;
              height: 14px;
              border-radius: 2px;
              color: white;
              font-weight: bold;
              font-size: 7px;
              line-height: 14px;
              text-align: center;
            }
            .status-P { background-color: #52c41a; }
            .status-A { background-color: #ff4d4f; }
            .status-L { background-color: #faad14; }
            .status-J { background-color: #722ed1; }
            .stats-column {
              background: #f9f9f9;
              font-weight: bold;
              font-size: 7px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px solid ${institutionColor};
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #666;
            }
            .signature-section {
              margin-top: 30px;
              display: flex;
              justify-content: space-around;
            }
            .signature-box {
              text-align: center;
              width: 180px;
            }
            .signature-line {
              border-top: 2px solid ${institutionColor};
              margin-top: 50px;
              padding-top: 5px;
              font-size: 9px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${institutionLogo ? `
              <div class="logo-container">
                <img src="${this.sanitizeHTML(institutionLogo)}" alt="Logo Institución" />
              </div>
            ` : ''}
            <h1>${this.sanitizeHTML(institutionName)}</h1>
            <h2>Calendario de Asistencias - ${monthName} ${year}</h2>
            <h3>${this.sanitizeHTML(classroom.classroomName || classroom.section)} - ${this.sanitizeHTML(classroom.shiftName)}</h3>
          </div>

          <div class="info-section">
            <div class="info-box">
              <p><strong>Aula:</strong> ${this.sanitizeHTML(classroom.classroomName || classroom.section)}</p>
              <p><strong>Sección:</strong> ${this.sanitizeHTML(classroom.section)}</p>
              <p><strong>Turno:</strong> ${this.sanitizeHTML(classroom.shiftName)}</p>
            </div>
            <div class="info-box">
              <p><strong>Mes:</strong> ${monthName} ${year}</p>
              <p><strong>Total Estudiantes:</strong> ${classroomStats.totalStudents}</p>
              <p><strong>Registros:</strong> ${classroomStats.totalRegistros}</p>
            </div>
            <div class="info-box">
              <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
              <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
              <p><strong>Emitido por:</strong> ${this.sanitizeHTML(currentUser)}</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="number" style="color: #52c41a;">${classroomStats.presente}</div>
              <div class="label">Presentes</div>
            </div>
            <div class="stat-item">
              <div class="number" style="color: #ff4d4f;">${classroomStats.falta}</div>
              <div class="label">Faltas</div>
            </div>
            <div class="stat-item">
              <div class="number" style="color: #faad14;">${classroomStats.tardanza}</div>
              <div class="label">Tardanzas</div>
            </div>
            <div class="stat-item">
              <div class="number" style="color: #722ed1;">${classroomStats.justificado}</div>
              <div class="label">Justificados</div>
            </div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-icon" style="background-color: #52c41a;">P</div>
              <span>Presente</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon" style="background-color: #ff4d4f;">F</div>
              <span>Falta</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon" style="background-color: #faad14;">T</div>
              <span>Tardanza</span>
            </div>
            <div class="legend-item">
              <div class="legend-icon" style="background-color: #722ed1;">J</div>
              <span>Justificado</span>
            </div>
          </div>

          <table class="calendar-table">
            <thead>
              <tr>
                <th class="student-column">Estudiante</th>
                ${Array.from({ length: daysInMonth }, (_, i) => `<th>${i + 1}</th>`).join('')}
                <th>P</th>
                <th>F</th>
                <th>T</th>
                <th>J</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => {
                const studentAttendances = attendances[student.studentId] || {};
                const stats = this.calculateStudentStats(studentAttendances);
                
                return `
                  <tr>
                    <td class="student-column">
                      <div class="student-name">${this.sanitizeHTML(student.studentName || 'Sin nombre')}</div>
                      <div class="student-id">ID: ...${this.sanitizeHTML(student.studentId.slice(-8))}</div>
                    </td>
                    ${Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const status = studentAttendances[day];
                      if (status) {
                        return `<td class="day-cell">
                          <span class="status-badge status-${status}">${this.getStatusSymbol(status)}</span>
                        </td>`;
                      }
                      return '<td class="day-cell">-</td>';
                    }).join('')}
                    <td class="stats-column">${stats.presente}</td>
                    <td class="stats-column">${stats.falta}</td>
                    <td class="stats-column">${stats.tardanza}</td>
                    <td class="stats-column">${stats.justificado}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Auxiliar<br/>
                ${this.sanitizeHTML(currentUser)}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Director(a)
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Calendario de Asistencias
            </div>
            <div>
              Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}
            </div>
          </div>
        </body>
        </html>
      `;

      // Crear iframe oculto para imprimir
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      iframe.contentWindow.addEventListener('load', () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          } catch (error) {
            document.body.removeChild(iframe);
          }
        }, 500);
      });
      
      return { 
        success: true, 
        message: 'Diálogo de impresión abierto. Seleccione "Guardar como PDF".' 
      };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: 'Error al generar el reporte PDF' };
    }
  }
}

export default AttendanceCalendarExporter;
