/**
 * Utilidades para exportar reportes de asignaciones
 * Exportación de datos de asignaciones para directores
 */

export class AssignmentsReportExporter {

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
   * Formatea códigos modulares para display
   */
  static formatModularCodes(modularCodes) {
    if (!Array.isArray(modularCodes) || modularCodes.length === 0) {
      return 'Sin códigos';
    }
    return modularCodes.join(', ');
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
   * Formatea fecha y hora para display
   */
  static formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  static getUserFullName(user) {
    if (!user) return 'Usuario no encontrado';
    const firstName = user.firstname || '';
    const lastName = user.lastname || '';
    return `${firstName} ${lastName}`.trim() || user.username || 'Sin nombre';
  }

  /**
   * Formatea roles del usuario
   */
  static formatUserRoles(roles) {
    if (!Array.isArray(roles) || roles.length === 0) {
      return 'Sin roles';
    }

    // Filtrar roles por defecto que no son relevantes para mostrar
    const relevantRoles = roles.filter(role =>
      !role.startsWith('default-roles-') &&
      role !== 'offline_access' &&
      role !== 'uma_authorization'
    );

    if (relevantRoles.length === 0) {
      return 'Sin roles específicos';
    }

    return relevantRoles.join(', ');
  }

  /**
   * Exporta la lista de asignaciones a CSV
   */
  static exportAssignmentsToCSV(assignmentsList, usersList = [], institutionName = '') {
    try {
      const headers = [
        'N°',
        'Usuario',
        'Username',
        'Email',
        'Roles',
        'Sede Asignada',
        'Dirección Sede',
        'Códigos Modulares',
        'Fecha Asignación',
        'Fecha Creación'
      ];

      const csvContent = [
        headers.join(','),
        ...assignmentsList.map((assignment, index) => {
          const user = usersList.find(u => u.keycloakId === assignment.userId);

          return [
            index + 1,
            this.sanitizeCSV(this.getUserFullName(user)),
            this.sanitizeCSV(user?.username || 'N/A'),
            this.sanitizeCSV(user?.email || 'N/A'),
            this.sanitizeCSV(this.formatUserRoles(user?.roles || [])),
            this.sanitizeCSV(assignment.headquarterName || 'Sin sede'),
            this.sanitizeCSV(assignment.headquarterAddress || 'N/A'),
            this.sanitizeCSV(this.formatModularCodes(assignment.headquarterCode || [])),
            this.sanitizeCSV(this.formatDateTime(assignment.assignmentDate)),
            this.sanitizeCSV(this.formatDateTime(assignment.createdAt))
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = institutionName
        ? `asignaciones_${institutionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        : `asignaciones_${new Date().toISOString().split('T')[0]}.csv`;
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
   * Exporta la lista de asignaciones a PDF (para impresión)
   */
  static exportAssignmentsToPDF(assignmentsList, usersList = [], institutionName = '') {
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
      const finalInstitutionName = institutionName || institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#2c3e50';
      const currentUser = localStorage.getItem('user_fullname') || 'Director';
      
      // Calcular estadísticas
      const totalAssignments = assignmentsList.length;
      const uniqueUsers = new Set(assignmentsList.map(a => a.userId)).size;
      const uniqueHeadquarters = new Set(assignmentsList.map(a => a.headquarterId)).size;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Asignaciones</title>
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
            .user-info {
              font-weight: bold;
              font-size: 9px;
            }
            .headquarter-info {
              font-style: italic;
              color: #666;
              font-size: 8px;
            }
            .date-info {
              font-size: 8px;
              color: #888;
            }
            .modular-codes {
              font-size: 8px;
              color: #666;
              max-width: 120px;
              word-break: break-all;
            }
            .address-cell {
              max-width: 150px;
              word-break: break-word;
              font-size: 8px;
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
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid ${institutionColor};
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #666;
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
            <h2>Reporte de Asignaciones - ${new Date().getFullYear()}</h2>
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
              <div class="number">${uniqueUsers}</div>
              <div class="label">Usuarios Asignados</div>
            </div>
            <div class="stat-item">
              <div class="number">${uniqueHeadquarters}</div>
              <div class="label">Sedes Utilizadas</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">N°</th>
                <th style="width: 150px;">Usuario</th>
                <th style="width: 120px;">Sede Asignada</th>
                <th style="width: 200px;">Dirección</th>
                <th style="width: 120px;">Códigos Modulares</th>
                <th style="width: 80px;">Fecha Asignación</th>
                <th style="width: 80px;">Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              ${assignmentsList.map((assignment, index) => {
                const user = usersList.find(u => u.keycloakId === assignment.userId);
                return `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>
                      <div class="user-info">${this.sanitizeHTML(this.getUserFullName(user))}</div>
                      <div style="font-size: 8px; color: #666;">${this.sanitizeHTML(user?.username || 'N/A')}</div>
                      <div style="font-size: 8px; color: #888;">${this.sanitizeHTML(user?.email || 'N/A')}</div>
                      <div style="font-size: 8px; color: #666;">Roles: ${this.sanitizeHTML(this.formatUserRoles(user?.roles || []))}</div>
                    </td>
                    <td>
                      <div class="headquarter-info">${this.sanitizeHTML(assignment.headquarterName || 'Sin sede')}</div>
                    </td>
                    <td class="address-cell">
                      ${this.sanitizeHTML(assignment.headquarterAddress || 'N/A')}
                    </td>
                    <td class="modular-codes">
                      ${this.sanitizeHTML(this.formatModularCodes(assignment.headquarterCode || []))}
                    </td>
                    <td>${this.formatDate(assignment.assignmentDate)}</td>
                    <td>${this.formatDate(assignment.createdAt)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                Director(a)<br/>
                ${this.sanitizeHTML(currentUser)}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                Administración
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Reporte de Asignaciones
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
      return { success: false, error: 'Error al generar el archivo PDF' };
    }
  }

  /**
   * Exporta solo asignaciones activas
   */
  static exportActiveAssignments(assignmentsList, usersList = [], institutionName = '') {
    // Para este caso, asumimos que todas las asignaciones en la lista son "activas"
    // Si hay un campo de estado en el futuro, filtrar por él
    return this.exportAssignmentsToPDF(assignmentsList, usersList, institutionName);
  }

  /**
   * Imprime el reporte actual directamente
   */
  static printCurrentView() {
    window.print();
    return { success: true, message: 'Imprimiendo...' };
  }
}

export default AssignmentsReportExporter;