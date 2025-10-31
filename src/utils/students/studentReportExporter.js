/**
 * Utilidades para exportar reportes de estudiantes
 * Exportación de datos de estudiantes para gestión académica
 */

export class StudentReportExporter {
  
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
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'TRANSFER': return 'Transferido';
      case 'GRADUATED': return 'Graduado';
      default: return 'No especificado';
    }
  }

  /**
   * Obtiene la etiqueta del género
   */
  static getGenderLabel(gender) {
    switch(gender) {
      case 'MALE': return 'Masculino';
      case 'FEMALE': return 'Femenino';
      case 'OTHER': return 'Otro';
      default: return 'No especificado';
    }
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
   * Calcula la edad a partir de la fecha de nacimiento
   */
  static calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Exporta la lista de estudiantes a CSV
   */
  static exportStudentsToCSV(studentsList, institutionName = '') {
    try {
      const headers = [
        'N°',
        'Nombres',
        'Apellidos',
        'Documento',
        'Fecha Nacimiento',
        'Edad',
        'Género',
        'Teléfono',
        'Dirección',
        'Estado',
        'Fecha de Registro'
      ];

      const csvContent = [
        headers.join(','),
        ...studentsList.map((student, index) => [
          index + 1,
          this.sanitizeCSV(student.firstName),
          this.sanitizeCSV(student.lastName),
          this.sanitizeCSV(`${student.documentType || 'DNI'}: ${student.documentNumber}`),
          this.sanitizeCSV(this.formatDate(student.birthDate)),
          this.sanitizeCSV(this.calculateAge(student.birthDate)),
          this.sanitizeCSV(this.getGenderLabel(student.gender)),
          this.sanitizeCSV(student.phone || 'N/A'),
          this.sanitizeCSV(student.address || 'N/A'),
          this.sanitizeCSV(this.getStatusLabel(student.status)),
          this.sanitizeCSV(this.formatDate(student.createdAt))
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = institutionName 
        ? `estudiantes_${institutionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        : `estudiantes_${new Date().toISOString().split('T')[0]}.csv`;
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
   * Exporta la lista de estudiantes a PDF (para impresión)
   */
  static exportStudentsToPDF(studentsList, institutionName = '') {
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
      const totalStudents = studentsList.length;
      const activeStudents = studentsList.filter(s => s.status === 'ACTIVE').length;
      const inactiveStudents = studentsList.filter(s => s.status === 'INACTIVE').length;
      const maleStudents = studentsList.filter(s => s.gender === 'MALE').length;
      const femaleStudents = studentsList.filter(s => s.gender === 'FEMALE').length;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Estudiantes</title>
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
              font-size: 20px;
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
              font-size: 8px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 4px 2px; 
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
            .active { 
              color: #28a745; 
              font-weight: bold; 
            }
            .inactive { 
              color: #dc3545; 
              font-weight: bold; 
            }
            .gender-male {
              color: #007bff;
            }
            .gender-female {
              color: #e83e8c;
            }
            .contact-cell {
              max-width: 100px;
              word-break: break-word;
              font-size: 7px;
            }
            .address-cell {
              max-width: 120px;
              word-break: break-word;
              font-size: 7px;
            }
            .document-cell {
              font-size: 7px;
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
            <h2>Reporte de Estudiantes - ${new Date().getFullYear()}</h2>
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
              <p><strong>Total de Registros:</strong> ${totalStudents}</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="number">${totalStudents}</div>
              <div class="label">Total Estudiantes</div>
            </div>
            <div class="stat-item">
              <div class="number">${activeStudents}</div>
              <div class="label">Activos</div>
            </div>
            <div class="stat-item">
              <div class="number">${inactiveStudents}</div>
              <div class="label">Inactivos</div>
            </div>
            <div class="stat-item">
              <div class="number">${maleStudents}</div>
              <div class="label">Masculino</div>
            </div>
            <div class="stat-item">
              <div class="number">${femaleStudents}</div>
              <div class="label">Femenino</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">N°</th>
                <th style="width: 140px;">Nombres y Apellidos</th>
                <th style="width: 80px;">Documento</th>
                <th style="width: 70px;">Fecha Nac.</th>
                <th style="width: 35px;">Edad</th>
                <th style="width: 60px;">Género</th>
                <th style="width: 80px;">Teléfono</th>
                <th style="width: 120px;">Dirección</th>
                <th style="width: 50px;">Estado</th>
                <th style="width: 70px;">Registro</th>
              </tr>
            </thead>
            <tbody>
              ${studentsList.map((student, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td><strong>${this.sanitizeHTML(student.firstName + ' ' + student.lastName)}</strong></td>
                  <td class="document-cell">${this.sanitizeHTML((student.documentType || 'DNI') + ': ' + (student.documentNumber || 'N/A'))}</td>
                  <td>${this.formatDate(student.birthDate)}</td>
                  <td style="text-align: center;">${this.calculateAge(student.birthDate)}</td>
                  <td class="gender-${student.gender?.toLowerCase()}" style="text-align: center;">
                    ${this.getGenderLabel(student.gender)}
                  </td>
                  <td class="contact-cell">${this.sanitizeHTML(student.phone || 'N/A')}</td>
                  <td class="address-cell">${this.sanitizeHTML(student.address || 'N/A')}</td>
                  <td class="${student.status === 'ACTIVE' ? 'active' : 'inactive'}" style="text-align: center;">
                    ${this.getStatusLabel(student.status)}
                  </td>
                  <td>${this.formatDate(student.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Administrador(a)<br/>
                ${this.sanitizeHTML(currentUser)}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Secretaría Académica
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Reporte de Estudiantes
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
   * Exporta solo estudiantes activos
   */
  static exportActiveStudents(studentsList, institutionName = '') {
    const activeStudents = studentsList.filter(student => student.status === 'ACTIVE');
    
    if (activeStudents.length === 0) {
      return { success: false, error: 'No hay estudiantes activos para exportar' };
    }

    return this.exportStudentsToPDF(activeStudents, institutionName);
  }

  /**
   * Exporta solo estudiantes inactivos
   */
  static exportInactiveStudents(studentsList, institutionName = '') {
    const inactiveStudents = studentsList.filter(student => student.status === 'INACTIVE');
    
    if (inactiveStudents.length === 0) {
      return { success: false, error: 'No hay estudiantes inactivos para exportar' };
    }

    return this.exportStudentsToPDF(inactiveStudents, institutionName);
  }

  /**
   * Exporta estudiantes por género
   */
  static exportStudentsByGender(studentsList, gender, institutionName = '') {
    const filteredStudents = studentsList.filter(student => student.gender === gender);
    
    if (filteredStudents.length === 0) {
      const genderLabel = this.getGenderLabel(gender);
      return { success: false, error: `No hay estudiantes de género ${genderLabel} para exportar` };
    }

    return this.exportStudentsToPDF(filteredStudents, institutionName);
  }

  /**
   * Imprime el reporte actual directamente
   */
  static printCurrentView() {
    window.print();
    return { success: true, message: 'Imprimiendo...' };
  }
}

export default StudentReportExporter;