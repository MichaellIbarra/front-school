// Utilidades de exportación para reportes de asistencias y justificaciones

export class AttendanceReportUtils {
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
      console.log('Archivo CSV descargado correctamente');
    } catch (error) {
      console.error('Error al generar el archivo CSV');
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
            .approved { 
              color: #28a745; 
              font-weight: bold; 
            }
            .rejected { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .pending { 
              color: #ffc107; 
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
        console.log('PDF generado para impresión');
      } else {
        console.error('No se pudo abrir la ventana de impresión. Verifique que el bloqueador de ventanas emergentes esté deshabilitado.');
      }
    } catch (error) {
      console.error('Error al generar el PDF');
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
      console.log('Archivo Excel descargado correctamente');
    } catch (error) {
      console.error('Error al generar el archivo Excel');
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
   * Funciones específicas para estudiantes ausentes
   */

  /**
   * Exporta listado de estudiantes ausentes a CSV
   */
  static exportAbsentStudentsToCSV(students, searchType = '') {
    const headers = [
      'ID Matrícula', 'Nombre Estudiante', 'Email', 'Teléfono',
      'Fecha', 'Observaciones'
    ];

    const mapFunction = (student) => [
      AttendanceReportUtils.sanitizeCSV(student.studentEnrollmentId || ''),
      AttendanceReportUtils.sanitizeCSV(student.studentName || ''),
      AttendanceReportUtils.sanitizeCSV(student.email || ''),
      AttendanceReportUtils.sanitizeCSV(student.phone || ''),
      AttendanceReportUtils.sanitizeCSV(student.entryDate ? new Date(student.entryDate).toLocaleDateString('es-ES') : ''),
      AttendanceReportUtils.sanitizeCSV(student.observations || '')
    ];

    const filename = `estudiantes_ausentes${searchType ? `_${searchType}` : ''}`;
    AttendanceReportUtils.exportToCSV(students, headers, mapFunction, filename);
  }

  /**
   * Exporta listado de estudiantes ausentes a PDF
   */
  static exportAbsentStudentsToPDF(students, searchType = '') {
    // Agrupar estudiantes por grado y sección
    const groupedStudents = students.reduce((acc, student) => {
      const grade = student.grade || 'Sin Grado';
      const section = student.section || 'Sin Sección';
      const key = `${grade}-${section}`;
      
      if (!acc[key]) {
        acc[key] = {
          grade,
          section,
          students: []
        };
      }
      acc[key].students.push(student);
      return acc;
    }, {});

    // Ordenar estudiantes alfabéticamente dentro de cada grupo
    Object.values(groupedStudents).forEach(group => {
      group.students.sort((a, b) => {
        const nameA = (a.studentName || '').toLowerCase();
        const nameB = (b.studentName || '').toLowerCase();
        return nameA.localeCompare(nameB, 'es');
      });
    });

    const headers = [
      '#', 'ID Matrícula', 'Nombre Estudiante', 'Grado', 'Sección', 'Curso', 'Fecha', 'Observaciones'
    ];

    // Generar filas HTML por grupo
    let groupsHTML = '';
    let globalIndex = 1;
    
    Object.keys(groupedStudents).sort().forEach(key => {
      const group = groupedStudents[key];
      const aula = `${group.grade}° Secundaria - Sección ${group.section}`;
      
      groupsHTML += `
        <div class="group-section">
          <h3 class="group-title">📚 Aula: ${aula}</h3>
          <p class="group-info">Total de estudiantes: ${group.students.length}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${group.students.map((student) => `
                <tr>
                  <td class="text-center"><strong>${globalIndex++}</strong></td>
                  <td>${AttendanceReportUtils.sanitizeHTML(student.studentEnrollmentId || '-')}</td>
                  <td><strong>${AttendanceReportUtils.sanitizeHTML(student.studentName || 'Sin nombre')}</strong></td>
                  <td class="text-center">${AttendanceReportUtils.sanitizeHTML(student.grade ? student.grade + '°' : '-')}</td>
                  <td class="text-center">${AttendanceReportUtils.sanitizeHTML(student.section || '-')}</td>
                  <td>${AttendanceReportUtils.sanitizeHTML(student.course || '-')}</td>
                  <td class="text-center">${student.entryDate ? new Date(student.entryDate).toLocaleDateString('es-ES') : '-'}</td>
                  <td>${AttendanceReportUtils.sanitizeHTML(student.observations || 'Sin observaciones')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Asistencias</title>
        <style>
          @page { 
            size: A4 landscape; 
            margin: 15mm; 
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            font-size: 11px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 15px;
          }
          .header h1 { 
            color: #2c3e50; 
            font-size: 24px;
            margin: 5px 0;
            font-weight: 700;
          }
          .header h2 { 
            color: #34495e; 
            font-size: 16px;
            margin: 5px 0;
            font-weight: 500;
          }
          .school-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #4CAF50;
          }
          .school-info h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 16px;
          }
          .school-info p {
            margin: 5px 0;
            color: #555;
            font-size: 12px;
          }
          .report-info {
            text-align: right;
            margin-bottom: 20px;
            font-size: 11px;
            color: #666;
          }
          .group-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .group-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            margin: 0 0 5px 0;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
          }
          .group-info {
            background: #e3f2fd;
            padding: 8px 20px;
            margin: 0 0 15px 0;
            border-left: 4px solid #2196F3;
            font-size: 11px;
            color: #1976D2;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: 1px solid #5a67d8;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td { 
            border: 1px solid #dee2e6;
            padding: 8px;
            vertical-align: middle;
          }
          tr:nth-child(even) { 
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e7f3ff;
          }
          .text-center {
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
          }
          .summary {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .summary h3 {
            margin: 0 0 10px 0;
            color: #856404;
            font-size: 14px;
          }
          .summary p {
            margin: 5px 0;
            font-size: 12px;
            color: #856404;
          }
          @media print {
            body { 
              margin: 0;
              padding: 15mm;
            }
            .group-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏫 REPORTE DE ASISTENCIAS</h1>
          <h2>Sistema de Gestión Educativa</h2>
        </div>

        <div class="school-info">
          <h3>🏛️ Información de la Institución</h3>
          <p><strong>Colegio:</strong> Virgen de Guadalupe</p>
          <p><strong>Nivel:</strong> Educación Secundaria</p>
          <p><strong>Dirección:</strong> Av. Principal #123, Lima - Perú</p>
        </div>

        <div class="report-info">
          <p><strong>Tipo de Reporte:</strong> ${searchType || 'Listado de Estudiantes'}</p>
          <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>Total de Registros:</strong> ${students.length}</p>
        </div>

        <div class="summary">
          <h3>📊 Resumen del Reporte</h3>
          <p><strong>Total de estudiantes:</strong> ${students.length}</p>
          <p><strong>Grados involucrados:</strong> ${Object.keys(groupedStudents).length} aula(s)</p>
        </div>

        ${groupsHTML}

        <div class="footer">
          <p><strong>Virgen de Guadalupe</strong> - Sistema de Gestión Educativa</p>
          <p>Este documento ha sido generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
          <p>📞 Contacto: (01) 234-5678 | ✉️ info@virgenguadalupe.edu.pe | 🌐 www.virgenguadalupe.edu.pe</p>
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
      console.log('✅ Reporte PDF generado exitosamente');
    } else {
      console.error('❌ No se pudo abrir la ventana de impresión. Verifique el bloqueador de ventanas emergentes.');
      alert('Por favor, permita ventanas emergentes para generar el reporte PDF');
    }
  }

  /**
   * Exporta listado de estudiantes ausentes a Excel
   */
  static exportAbsentStudentsToExcel(students, searchType = '') {
    const headers = [
      'ID Matrícula', 'Nombre Estudiante', 'Email', 'Teléfono',
      'Fecha', 'Observaciones'
    ];

    const mapFunction = (student) => [
      student.studentEnrollmentId || '',
      student.studentName || '',
      student.email || '',
      student.phone || '',
      student.entryDate ? new Date(student.entryDate).toLocaleDateString('es-ES') : '',
      student.observations || ''
    ];

    const filename = `estudiantes_ausentes${searchType ? `_${searchType}` : ''}`;
    AttendanceReportUtils.exportToExcel(students, headers, mapFunction, filename, 'Estudiantes Ausentes');
  }

  /**
   * Funciones específicas para justificaciones
   */

  /**
   * Exporta listado de justificaciones a CSV
   */
  static exportJustificationsToCSV(justifications, tabType = '') {
    const headers = [
      'ID', 'ID Asistencia', 'Tipo Justificación', 'Motivo',
      'Fecha Envío', 'Enviado Por', 'Estado Aprobación',
      'Comentarios Aprobación', 'Aprobado Por', 'Fecha Aprobación'
    ];

    const mapFunction = (justification) => [
      AttendanceReportUtils.sanitizeCSV(justification.id || ''),
      AttendanceReportUtils.sanitizeCSV(justification.attendanceId || ''),
      AttendanceReportUtils.sanitizeCSV(justification.justificationType || ''),
      AttendanceReportUtils.sanitizeCSV(justification.justificationReason || ''),
      AttendanceReportUtils.sanitizeCSV(justification.submissionDate ? new Date(justification.submissionDate).toLocaleDateString('es-ES') : ''),
      AttendanceReportUtils.sanitizeCSV(justification.submittedBy || ''),
      AttendanceReportUtils.sanitizeCSV(justification.approvalStatus || ''),
      AttendanceReportUtils.sanitizeCSV(justification.approvalComments || ''),
      AttendanceReportUtils.sanitizeCSV(justification.approvedBy || ''),
      AttendanceReportUtils.sanitizeCSV(justification.approvalDate ? new Date(justification.approvalDate).toLocaleDateString('es-ES') : '')
    ];

    const filename = `justificaciones${tabType ? `_${tabType}` : ''}`;
    AttendanceReportUtils.exportToCSV(justifications, headers, mapFunction, filename);
  }

  /**
   * Exporta listado de justificaciones a PDF
   */
  static exportJustificationsToPDF(justifications, tabType = '') {
    const headers = [
      'ID Asistencia', 'Tipo', 'Motivo', 'Fecha Envío', 'Estado', 'Enviado Por'
    ];

    const mapFunction = (justification) => {
      let statusClass = '';
      switch (justification.approvalStatus) {
        case 'APPROVED':
          statusClass = 'approved';
          break;
        case 'REJECTED':
          statusClass = 'rejected';
          break;
        case 'PENDING':
          statusClass = 'pending';
          break;
        default:
          statusClass = '';
      }

      return `
        <td>${AttendanceReportUtils.sanitizeHTML(justification.attendanceId || '')}</td>
        <td>${AttendanceReportUtils.sanitizeHTML(justification.justificationType || '')}</td>
        <td style="max-width: 200px; word-wrap: break-word;">${AttendanceReportUtils.sanitizeHTML(justification.justificationReason || '')}</td>
        <td>${justification.submissionDate ? new Date(justification.submissionDate).toLocaleDateString('es-ES') : ''}</td>
        <td class="${statusClass}">${AttendanceReportUtils.sanitizeHTML(justification.approvalStatus || '')}</td>
        <td>${AttendanceReportUtils.sanitizeHTML(justification.submittedBy || '')}</td>
      `;
    };

    const title = 'Reporte de Justificaciones';
    const subtitle = tabType ? `Categoría: ${tabType}` : '';
    
    AttendanceReportUtils.exportToPDF(justifications, headers, mapFunction, title, subtitle);
  }

  /**
   * Exporta listado de justificaciones a Excel
   */
  static exportJustificationsToExcel(justifications, tabType = '') {
    const headers = [
      'ID', 'ID Asistencia', 'Tipo Justificación', 'Motivo',
      'Fecha Envío', 'Enviado Por', 'Estado Aprobación',
      'Comentarios Aprobación', 'Aprobado Por', 'Fecha Aprobación'
    ];

    const mapFunction = (justification) => [
      justification.id || '',
      justification.attendanceId || '',
      justification.justificationType || '',
      justification.justificationReason || '',
      justification.submissionDate ? new Date(justification.submissionDate).toLocaleDateString('es-ES') : '',
      justification.submittedBy || '',
      justification.approvalStatus || '',
      justification.approvalComments || '',
      justification.approvedBy || '',
      justification.approvalDate ? new Date(justification.approvalDate).toLocaleDateString('es-ES') : ''
    ];

    const filename = `justificaciones${tabType ? `_${tabType}` : ''}`;
    AttendanceReportUtils.exportToExcel(justifications, headers, mapFunction, filename, 'Justificaciones');
  }

  /**
   * Genera reporte de resumen de asistencias
   */
  static generateAttendanceSummaryReport(students, justifications) {
    try {
      const summary = {
        totalStudentsAbsent: students.length,
        totalJustifications: justifications.length,
        justificationsByStatus: {
          pending: justifications.filter(j => j.approvalStatus === 'PENDING').length,
          approved: justifications.filter(j => j.approvalStatus === 'APPROVED').length,
          rejected: justifications.filter(j => j.approvalStatus === 'REJECTED').length
        },
        justificationsByType: {}
      };

      // Contar justificaciones por tipo
      justifications.forEach(j => {
        const type = j.justificationType || 'OTHER';
        summary.justificationsByType[type] = (summary.justificationsByType[type] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('Error generando reporte de resumen:', error);
      return null;
    }
  }

  /**
   * Exporta reporte de resumen a PDF
   */
  static exportSummaryReportToPDF(summary) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Resumen - Asistencias</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .summary-card { 
              background: #f8f9fa; 
              border: 1px solid #dee2e6; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 10px 0; 
            }
            .metric { 
              display: inline-block; 
              margin: 10px; 
              padding: 15px; 
              background: white; 
              border-radius: 5px; 
              border-left: 4px solid #007bff; 
            }
            .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
            .metric-label { font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <h1>📊 Reporte de Resumen - Asistencias</h1>
          <div class="summary-card">
            <h2>Resumen General</h2>
            <div class="metric">
              <div class="metric-value">${summary.totalStudentsAbsent}</div>
              <div class="metric-label">Estudiantes Ausentes</div>
            </div>
            <div class="metric">
              <div class="metric-value">${summary.totalJustifications}</div>
              <div class="metric-label">Total Justificaciones</div>
            </div>
          </div>
          
          <div class="summary-card">
            <h2>Justificaciones por Estado</h2>
            <div class="metric">
              <div class="metric-value">${summary.justificationsByStatus.pending}</div>
              <div class="metric-label">Pendientes</div>
            </div>
            <div class="metric">
              <div class="metric-value">${summary.justificationsByStatus.approved}</div>
              <div class="metric-label">Aprobadas</div>
            </div>
            <div class="metric">
              <div class="metric-value">${summary.justificationsByStatus.rejected}</div>
              <div class="metric-label">Rechazadas</div>
            </div>
          </div>

          <div class="summary-card">
            <h2>Justificaciones por Tipo</h2>
            ${Object.entries(summary.justificationsByType).map(([type, count]) => `
              <div class="metric">
                <div class="metric-value">${count}</div>
                <div class="metric-label">${type}</div>
              </div>
            `).join('')}
          </div>
          
          <p style="text-align: center; margin-top: 30px; color: #666;">
            Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
          </p>
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
        console.log('Reporte de resumen generado para impresión');
      }
    } catch (error) {
      console.error('Error al generar reporte de resumen:', error);
    }
  }
}

export default AttendanceReportUtils;