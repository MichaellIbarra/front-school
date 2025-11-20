/**
 * Utilidades para exportar reportes de matriculaciones
 * Exportación de datos de matriculaciones para gestión académica
 */

export class EnrollmentReportExporter {
  
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
    switch(status) {
      case 'A': return 'Activa';
      case 'C': return 'Completada';
      case 'T': return 'Transferida';
      case 'R': return 'Retirada';
      case 'I': return 'Inactiva';
      // Casos de compatibilidad hacia atrás
      case 'ACTIVE': return 'Activa';
      case 'COMPLETED': return 'Completada';
      case 'TRANSFER': return 'Transferida';
      case 'RETIRED': return 'Retirada';
      case 'INACTIVE': return 'Inactiva';
      default: 
        console.log('Estado desconocido:', status); // Debug
        return status || 'Sin estado';
    }
  }

  /**
   * Obtiene la etiqueta del estado académico (mismo que estado para esta estructura)
   */
  static getAcademicStatusLabel(status) {
    switch(status) {
      case 'A': return 'Matriculado';
      case 'R': return 'Retirado';
      case 'T': return 'Trasladado';
      case 'C': return 'Completado';
      default: return 'Sin definir';
    }
  }

  /**
   * Formatea fecha para display
   */
  static formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      let dateToFormat;
      
      // Si viene como array (formato de la API), convertir a fecha
      if (Array.isArray(dateString)) {
        // Array formato [año, mes, día] -> convertir a ISO string
        if (dateString.length >= 3) {
          const [year, month, day] = dateString;
          dateToFormat = new Date(year, month - 1, day); // mes es 0-indexed en JS
        } else {
          console.log('Array de fecha inválido:', dateString);
          return 'Fecha inválida';
        }
      } else if (typeof dateString === 'string') {
        // String ISO o formato estándar
        dateToFormat = new Date(dateString);
      } else {
        console.log('Tipo de fecha no reconocido:', typeof dateString, dateString);
        return 'Formato no válido';
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateToFormat.getTime())) {
        console.log('Fecha inválida después de conversión:', dateString);
        return 'Fecha inválida';
      }
      
      return dateToFormat.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
    } catch (error) {
      console.log('Error formateando fecha:', dateString, error);
      return 'Error en fecha';
    }
  }

  /**
   * Formatea año académico
   */
  static formatAcademicYear(year) {
    if (!year) return 'N/A';
    return `${year}`;
  }

  /**
   * Obtiene el nombre completo del estudiante
   */
  static getStudentFullName(enrollment) {
    console.log('getStudentFullName - enrollment:', enrollment); // Debug
    if (enrollment.student && enrollment.student.firstName && enrollment.student.lastName) {
      return `${enrollment.student.firstName} ${enrollment.student.lastName}`;
    }
    // Fallback: si no hay objeto student, intentar con el studentId directamente
    return enrollment.studentName || enrollment.studentId || 'Estudiante no especificado';
  }

  /**
   * Obtiene el DNI del estudiante
   */
  static getStudentDocument(enrollment) {
    console.log('getStudentDocument - enrollment.student:', enrollment.student); // Debug
    if (enrollment.student && enrollment.student.documentNumber) {
      const docType = enrollment.student.documentType || 'DNI';
      return `${docType}: ${enrollment.student.documentNumber}`;
    }
    return enrollment.studentDocument || 'Documento no disponible';
  }

  /**
   * Obtiene el nombre del aula
   */
  static getClassroomName(enrollment) {
    console.log('getClassroomName - enrollment.classroom:', enrollment.classroom); // Debug
    if (enrollment.classroom && enrollment.classroom.classroomName) {
      // Formato: "Nombre del aula (Sección)" si hay sección
      let name = enrollment.classroom.classroomName;
      if (enrollment.classroom.section) {
        name += ` (${enrollment.classroom.section})`;
      }
      return name;
    }
    return enrollment.classroomName || enrollment.classroomId || 'Aula no especificada';
  }

  /**
   * Exporta la lista de matriculaciones a CSV
   */
  static exportEnrollmentsToCSV(enrollmentsList, institutionName = '') {
    try {
      console.log('Exportando CSV - enrollmentsList:', enrollmentsList); // Debug
      
      const headers = [
        'N°',
        'Estudiante',
        'Documento Estudiante',
        'Aula/Grado',
        'Tipo Matrícula',
        'Fecha Matrícula',
        'Estado',
        'Fecha Creación',
        'Última Actualización'
      ];

      const csvContent = [
        headers.join(','),
        ...enrollmentsList.map((enrollment, index) => {
          console.log(`Procesando enrollment ${index + 1}:`, enrollment); // Debug
          return [
            index + 1,
            this.sanitizeCSV(this.getStudentFullName(enrollment)),
            this.sanitizeCSV(this.getStudentDocument(enrollment)),
            this.sanitizeCSV(this.getClassroomName(enrollment)),
            this.sanitizeCSV(enrollment.enrollmentType || 'REGULAR'),
            this.sanitizeCSV(this.formatDate(enrollment.enrollmentDate)),
            this.sanitizeCSV(this.getStatusLabel(enrollment.status)),
            this.sanitizeCSV(this.formatDate(enrollment.createdAt)),
            this.sanitizeCSV(this.formatDate(enrollment.updatedAt))
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = institutionName 
        ? `matriculaciones_${institutionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        : `matriculaciones_${new Date().toISOString().split('T')[0]}.csv`;
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
   * Exporta la lista de matriculaciones a PDF (para impresión)
   */
  static exportEnrollmentsToPDF(enrollmentsList, institutionName = '') {
    try {
      // Importar authService dinámicamente
      let institutionData = null;
      try {
        // Intentar obtener la institución desde authService
        const authServiceModule = require('../../services/auth/authService');
        institutionData = authServiceModule.getUserInstitution();
      } catch (error) {
        console.log('No se pudo cargar authService, usando datos de localStorage');
      }

      // Extraer datos de la institución
      const finalInstitutionName = institutionName || institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#2c3e50';
      const currentUser = localStorage.getItem('user_fullname') || 'Administrador';
      
      // Calcular estadísticas
      const totalEnrollments = enrollmentsList.length;
      const activeEnrollments = enrollmentsList.filter(e => e.status === 'A').length;
      const completedEnrollments = enrollmentsList.filter(e => e.status === 'C').length;
      const transferredEnrollments = enrollmentsList.filter(e => e.status === 'T').length;
      const retiredEnrollments = enrollmentsList.filter(e => e.status === 'R').length;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Matriculaciones</title>
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
              font-size: 18px;
              font-weight: bold;
              color: ${institutionColor};
            }
            .stat-item .label {
              font-size: 9px;
              color: #666;
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 8px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 3px 2px; 
              text-align: left; 
              vertical-align: middle;
            }
            th { 
              background-color: ${institutionColor}; 
              color: white;
              font-weight: bold; 
              font-size: 8px;
              text-transform: uppercase;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover {
              background-color: #f0f0f0;
            }
            .status-active { 
              color: #28a745; 
              font-weight: bold; 
            }
            .status-pending { 
              color: #ffc107; 
              font-weight: bold; 
            }
            .status-cancelled { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .status-transferred { 
              color: #6f42c1; 
              font-weight: bold; 
            }
            .academic-enrolled {
              color: #28a745;
              font-weight: bold;
            }
            .academic-withdrawn {
              color: #dc3545;
              font-weight: bold;
            }
            .academic-transferred {
              color: #6f42c1;
              font-weight: bold;
            }
            .academic-graduated {
              color: #17a2b8;
              font-weight: bold;
            }
            .document-cell {
              font-size: 7px;
            }
            .date-cell {
              font-size: 7px;
              text-align: center;
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
            <h1>${this.sanitizeHTML(finalInstitutionName)}</h1>
            <h2>Reporte de Matriculaciones - ${new Date().getFullYear()}</h2>
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
              <p><strong>Total de Registros:</strong> ${totalEnrollments}</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="number">${totalEnrollments}</div>
              <div class="label">Total Matrículas</div>
            </div>
            <div class="stat-item">
              <div class="number">${activeEnrollments}</div>
              <div class="label">Activas</div>
            </div>
            <div class="stat-item">
              <div class="number">${completedEnrollments}</div>
              <div class="label">Completadas</div>
            </div>
            <div class="stat-item">
              <div class="number">${transferredEnrollments}</div>
              <div class="label">Transferidas</div>
            </div>
            <div class="stat-item">
              <div class="number">${retiredEnrollments}</div>
              <div class="label">Retiradas</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">N°</th>
                <th style="width: 140px;">Estudiante</th>
                <th style="width: 80px;">Documento</th>
                <th style="width: 90px;">Aula/Grado</th>
                <th style="width: 70px;">Tipo Mat.</th>
                <th style="width: 70px;">Fecha Mat.</th>
                <th style="width: 60px;">Estado</th>
                <th style="width: 70px;">Fecha Creación</th>
                <th style="width: 70px;">Última Actualiz.</th>
              </tr>
            </thead>
            <tbody>
              ${enrollmentsList.map((enrollment, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td><strong>${this.sanitizeHTML(this.getStudentFullName(enrollment))}</strong></td>
                  <td class="document-cell">${this.sanitizeHTML(this.getStudentDocument(enrollment))}</td>
                  <td>${this.sanitizeHTML(this.getClassroomName(enrollment))}</td>
                  <td style="text-align: center;">${this.sanitizeHTML(enrollment.enrollmentType || 'REGULAR')}</td>
                  <td class="date-cell">${this.formatDate(enrollment.enrollmentDate)}</td>
                  <td class="status-${enrollment.status === 'A' ? 'active' : enrollment.status === 'C' ? 'completed' : enrollment.status === 'T' ? 'transferred' : 'retired'}" style="text-align: center;">
                    ${this.getStatusLabel(enrollment.status)}
                  </td>
                  <td class="date-cell">${this.formatDate(enrollment.createdAt)}</td>
                  <td class="date-cell">${this.formatDate(enrollment.updatedAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Secretaría Académica<br/>
                ${this.sanitizeHTML(currentUser)}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Dirección Académica
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Reporte de Matriculaciones
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
        message: 'Diálogo de impresión abierto. Seleccione "Guardar como PDF" y luego "Guardar".' 
      };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: 'Error al generar el reporte PDF' };
    }
  }

  /**
   * Exporta solo matriculaciones activas
   */
  static exportActiveEnrollments(enrollmentsList, institutionName = '') {
    const activeEnrollments = enrollmentsList.filter(enrollment => 
      enrollment.status === 'A' || enrollment.status === 'ACTIVE'
    );
    
    if (activeEnrollments.length === 0) {
      return { success: false, error: 'No hay matrículas activas para exportar' };
    }

    return this.exportEnrollmentsToPDF(activeEnrollments, institutionName);
  }

  /**
   * Exporta solo matriculaciones retiradas
   */
  static exportRetiredEnrollments(enrollmentsList, institutionName = '') {
    const retiredEnrollments = enrollmentsList.filter(enrollment => enrollment.status === 'R');
    
    if (retiredEnrollments.length === 0) {
      return { success: false, error: 'No hay matriculaciones retiradas para exportar' };
    }

    return this.exportEnrollmentsToPDF(retiredEnrollments, institutionName);
  }

  /**
   * Exporta matriculaciones por año académico
   */
  static exportEnrollmentsByAcademicYear(enrollmentsList, academicYear, institutionName = '') {
    const filteredEnrollments = enrollmentsList.filter(enrollment => enrollment.academicYear === academicYear);
    
    if (filteredEnrollments.length === 0) {
      return { success: false, error: `No hay matriculaciones para el año académico ${academicYear}` };
    }

    return this.exportEnrollmentsToPDF(filteredEnrollments, institutionName);
  }

  /**
   * Exporta matriculaciones por estado específico
   */
  static exportEnrollmentsByStatus(enrollmentsList, status, institutionName = '') {
    const filteredEnrollments = enrollmentsList.filter(enrollment => enrollment.status === status);
    
    if (filteredEnrollments.length === 0) {
      const statusLabel = this.getStatusLabel(status);
      return { success: false, error: `No hay matrículas con estado: ${statusLabel}` };
    }

    return this.exportEnrollmentsToPDF(filteredEnrollments, institutionName);
  }

  /**
   * Imprime el reporte actual directamente
   */
  static printCurrentView() {
    window.print();
    return { success: true, message: 'Imprimiendo...' };
  }
}

export default EnrollmentReportExporter;