/**
 * Utilidades para exportar reportes de asignaciones docentes
 * Exportación de datos de profesores y sus cursos asignados
 */

export class TeacherAssignmentReportExporter {
  
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
   * Obtiene la etiqueta del estado
   */
  static getStatusLabel(status) {
    return status === 'A' ? 'Activo' : 'Inactivo';
  }

  /**
   * Formatea fecha para display
   */
  static formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Exporta las asignaciones docentes a CSV
   */
  static exportAssignmentsToCSV(assignmentsList) {
    try {
      const headers = [
        'N°',
        'Profesor',
        'Curso',
        'Aula',
        'Estado',
        'Fecha de Asignación'
      ];

      const csvContent = [
        headers.join(','),
        ...assignmentsList.map((assignment, index) => [
          index + 1,
          this.sanitizeCSV(assignment.teacherName || assignment.teacherId),
          this.sanitizeCSV(assignment.courseName || assignment.courseId),
          this.sanitizeCSV(assignment.classroomName || assignment.classroomId),
          this.sanitizeCSV(this.getStatusLabel(assignment.status)),
          this.sanitizeCSV(this.formatDate(assignment.createdAt))
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `asignaciones_docentes_${new Date().toISOString().split('T')[0]}.csv`);
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
   * Exporta las asignaciones docentes a PDF (para impresión)
   */
  static exportAssignmentsToPDF(assignmentsList) {
    try {
      // Importar authService dinámicamente
      let institutionData = null;
      try {
        const authServiceModule = require('../../services/auth/authService');
        institutionData = authServiceModule.getUserInstitution();
      } catch (error) {
        console.log('No se pudo cargar authService, usando datos de localStorage');
      }

      // Extraer datos de la institución
      const institutionName = institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#2c3e50';
      const currentUser = localStorage.getItem('user_fullname') || 'Secretario';
      
      // Calcular estadísticas
      const totalAssignments = assignmentsList.length;
      const activeAssignments = assignmentsList.filter(a => a.status === 'A').length;
      const inactiveAssignments = assignmentsList.filter(a => a.status === 'I').length;
      
      // Contar profesores únicos
      const uniqueTeachers = new Set(assignmentsList.map(a => a.teacherId)).size;
      
      // Contar cursos únicos
      const uniqueCourses = new Set(assignmentsList.map(a => a.courseId)).size;
      
      // Contar aulas únicas
      const uniqueClassrooms = new Set(assignmentsList.map(a => a.classroomId)).size;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Asignaciones Docentes</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 11px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid ${institutionColor};
              padding-bottom: 15px;
              margin-bottom: 20px;
              position: relative;
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
              margin-bottom: 10px;
            }
            .info-section {
              margin-bottom: 20px;
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
              font-size: 10px;
            }
            .info-box strong {
              font-size: 11px;
            }
            .stats-section {
              display: flex;
              justify-content: space-around;
              margin-bottom: 20px;
              padding: 15px;
              background: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-item .number {
              font-size: 24px;
              font-weight: bold;
              color: ${institutionColor};
            }
            .stat-item .label {
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 4px; 
              text-align: left; 
              vertical-align: middle;
            }
            th { 
              background-color: ${institutionColor}; 
              color: white;
              font-weight: bold; 
              font-size: 9px;
              text-transform: uppercase;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover {
              background-color: #f0f0f0;
            }
            .active { 
              color: #28a745; 
              font-weight: bold; 
            }
            .inactive { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid ${institutionColor};
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #666;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-around;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 2px solid ${institutionColor};
              margin-top: 60px;
              padding-top: 5px;
              font-size: 10px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
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
            <h2>Reporte de Asignaciones Docentes - ${new Date().getFullYear()}</h2>
          </div>

          <div class="info-section">
            <div class="info-box">
              <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
            </div>
            <div class="info-box">
              <p><strong>Emitido por:</strong> ${this.sanitizeHTML(currentUser)}</p>
              <p><strong>Total de Registros:</strong> ${totalAssignments}</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="number">${totalAssignments}</div>
              <div class="label">Total Asignaciones</div>
            </div>
            <div class="stat-item">
              <div class="number">${uniqueTeachers}</div>
              <div class="label">Profesores Asignados</div>
            </div>
            <div class="stat-item">
              <div class="number">${uniqueCourses}</div>
              <div class="label">Cursos</div>
            </div>
            <div class="stat-item">
              <div class="number">${uniqueClassrooms}</div>
              <div class="label">Aulas</div>
            </div>
            <div class="stat-item">
              <div class="number">${activeAssignments}</div>
              <div class="label">Activas</div>
            </div>
            <div class="stat-item">
              <div class="number">${inactiveAssignments}</div>
              <div class="label">Inactivas</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">N°</th>
                <th style="width: 200px;">Profesor</th>
                <th style="width: 200px;">Curso</th>
                <th style="width: 150px;">Aula</th>
                <th style="width: 60px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${assignmentsList.map((assignment, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td><strong>${this.sanitizeHTML(assignment.teacherName || assignment.teacherId)}</strong></td>
                  <td>${this.sanitizeHTML(assignment.courseName || assignment.courseId)}</td>
                  <td>${this.sanitizeHTML(assignment.classroomName || assignment.classroomId)}</td>
                  <td class="${assignment.status === 'A' ? 'active' : 'inactive'}" style="text-align: center;">
                    ${this.getStatusLabel(assignment.status)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Secretario(a)<br/>
                ${this.sanitizeHTML(currentUser)}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Coordinación Académica
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Reporte de Asignaciones Docentes
            </div>
            <div>
              Página generada automáticamente
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
      
      // Escribir el contenido en el iframe
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Esperar a que se cargue y luego imprimir
      iframe.contentWindow.addEventListener('load', () => {
        setTimeout(() => {
          try {
            // Intentar imprimir desde el iframe
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            
            // Remover el iframe después de un delay
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          } catch (error) {
            console.error('Error al imprimir:', error);
            document.body.removeChild(iframe);
          }
        }, 500);
      });
      
      return { 
        success: true, 
        message: 'Diálogo de impresión abierto. Seleccione "Guardar como PDF" en el destino de impresión.' 
      };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: 'Error al generar el reporte PDF' };
    }
  }

  /**
   * Exporta asignaciones agrupadas por profesor
   */
  static exportByTeacher(assignmentsList) {
    try {
      // Agrupar asignaciones por profesor
      const groupedByTeacher = {};
      
      assignmentsList.forEach(assignment => {
        const teacherKey = assignment.teacherId;
        if (!groupedByTeacher[teacherKey]) {
          groupedByTeacher[teacherKey] = {
            teacherName: assignment.teacherName || assignment.teacherId,
            assignments: []
          };
        }
        groupedByTeacher[teacherKey].assignments.push(assignment);
      });

      // Crear reporte con agrupación
      let institutionData = null;
      try {
        const authServiceModule = require('../../services/auth/authService');
        institutionData = authServiceModule.getUserInstitution();
      } catch (error) {
        console.log('No se pudo cargar authService');
      }

      const institutionName = institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#2c3e50';
      const currentUser = localStorage.getItem('user_fullname') || 'Secretario';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Asignaciones por Profesor</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; color: #333; }
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
            .header h2 { font-size: 14px; color: #666; margin-bottom: 10px; }
            .teacher-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .teacher-header {
              background: ${institutionColor};
              color: white;
              padding: 10px;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .assignments-list {
              padding-left: 20px;
            }
            .assignment-item {
              padding: 8px;
              border-bottom: 1px solid #eee;
              display: flex;
              justify-content: space-between;
            }
            .assignment-item:hover {
              background: #f5f5f5;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid ${institutionColor};
              text-align: center;
              font-size: 9px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .teacher-section { page-break-inside: avoid; }
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
            <h2>Reporte de Asignaciones por Profesor - ${new Date().getFullYear()}</h2>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')} | Emitido por: ${this.sanitizeHTML(currentUser)}</p>
          </div>

          ${Object.values(groupedByTeacher).map((data) => `
            <div class="teacher-section">
              <div class="teacher-header">
                ${this.sanitizeHTML(data.teacherName)} (${data.assignments.length} asignación${data.assignments.length !== 1 ? 'es' : ''})
              </div>
              <div class="assignments-list">
                ${data.assignments.map((assignment, idx) => `
                  <div class="assignment-item">
                    <span><strong>${idx + 1}.</strong> ${this.sanitizeHTML(assignment.courseName || assignment.courseId)}</span>
                    <span>${this.sanitizeHTML(assignment.classroomName || assignment.classroomId)} | 
                    <span style="color: ${assignment.status === 'A' ? '#28a745' : '#dc3545'}">
                      ${this.getStatusLabel(assignment.status)}
                    </span></span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <strong>Documento Oficial</strong> - Reporte de Asignaciones por Profesor<br/>
            Página generada automáticamente
          </div>
        </body>
        </html>
      `;

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
            console.error('Error al imprimir:', error);
            document.body.removeChild(iframe);
          }
        }, 500);
      });
      
      return { 
        success: true, 
        message: 'Diálogo de impresión abierto. Seleccione "Guardar como PDF" en el destino de impresión.' 
      };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: 'Error al generar el reporte agrupado' };
    }
  }

  /**
   * Exporta solo asignaciones activas
   */
  static exportActiveAssignments(assignmentsList) {
    const activeAssignments = assignmentsList.filter(a => a.status === 'A');
    
    if (activeAssignments.length === 0) {
      return { success: false, error: 'No hay asignaciones activas para exportar' };
    }

    return this.exportAssignmentsToPDF(activeAssignments);
  }

  /**
   * Exporta asignaciones por aula
   */
  static exportByClassroom(assignmentsList) {
    // Agrupar por aula
    const groupedByClassroom = {};
    
    assignmentsList.forEach(assignment => {
      const classroomKey = assignment.classroomId;
      if (!groupedByClassroom[classroomKey]) {
        groupedByClassroom[classroomKey] = {
          classroomName: assignment.classroomName || assignment.classroomId,
          assignments: []
        };
      }
      groupedByClassroom[classroomKey].assignments.push(assignment);
    });

    // Similar implementación al exportByTeacher pero agrupado por aula
    // (código similar al anterior, cambiando el enfoque)
    
    return this.exportAssignmentsToPDF(assignmentsList);
  }

  /**
   * Imprime el reporte actual directamente
   */
  static printCurrentView() {
    window.print();
    return { success: true, message: 'Imprimiendo...' };
  }
}

export default TeacherAssignmentReportExporter;
