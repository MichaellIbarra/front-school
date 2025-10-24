/**
 * Utilidades para exportar reportes de nómina de personal
 * Profesores, Auxiliares y Secretarios
 */

export class StaffReportExporter {
  
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
   * Obtiene el nombre completo del usuario
   */
  static getFullName(user) {
    const firstname = user.firstname || '';
    const lastname = user.lastname || '';
    return `${firstname} ${lastname}`.trim() || user.username || 'Sin nombre';
  }

  /**
   * Obtiene la etiqueta del rol en español
   */
  static getRoleLabel(roles) {
    if (!roles || roles.length === 0) return 'Sin rol';
    const roleLabels = {
      'TEACHER': 'Profesor',
      'AUXILIARY': 'Auxiliar',
      'SECRETARY': 'Secretario',
      'DIRECTOR': 'Director',
      'ADMIN': 'Administrador'
    };
    return roles.map(role => roleLabels[role] || role).join(', ');
  }

  /**
   * Obtiene la etiqueta del estado
   */
  static getStatusLabel(status) {
    return status === 'A' ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la etiqueta del tipo de documento
   */
  static getDocumentTypeLabel(docType) {
    const labels = {
      'DNI': 'DNI',
      'CE': 'Carné de Extranjería',
      'PASSPORT': 'Pasaporte',
      'RUC': 'RUC'
    };
    return labels[docType] || docType || 'N/A';
  }

  /**
   * Exporta la nómina completa de personal a CSV
   */
  static exportStaffToCSV(staffList) {
    try {
      const headers = [
        'N°',
        'Nombre Completo',
        'Usuario',
        'Rol',
        'Documento',
        'N° Documento',
        'Email',
        'Teléfono',
        'Estado'
      ];

      const csvContent = [
        headers.join(','),
        ...staffList.map((user, index) => [
          index + 1,
          this.sanitizeCSV(this.getFullName(user)),
          this.sanitizeCSV(user.username),
          this.sanitizeCSV(this.getRoleLabel(user.roles)),
          this.sanitizeCSV(this.getDocumentTypeLabel(user.documentType)),
          this.sanitizeCSV(user.documentNumber),
          this.sanitizeCSV(user.email),
          this.sanitizeCSV(user.phone || 'N/A'),
          this.sanitizeCSV(this.getStatusLabel(user.status))
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nomina_personal_${new Date().toISOString().split('T')[0]}.csv`);
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
   * Exporta la nómina de personal a PDF (para impresión)
   */
  static exportStaffToPDF(staffList) {
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
      const institutionName = institutionData?.name || localStorage.getItem('institution_name') || 'Institución Educativa';
      const institutionLogo = institutionData?.logo || '';
      const institutionColor = institutionData?.uiSettings?.color || '#2c3e50';
      const currentUser = localStorage.getItem('user_fullname') || 'Director';
      
      // Calcular estadísticas
      const totalStaff = staffList.length;
      const activeStaff = staffList.filter(u => u.status === 'A').length;
      const inactiveStaff = staffList.filter(u => u.status === 'I').length;
      const teachers = staffList.filter(u => u.roles?.includes('TEACHER')).length;
      const auxiliaries = staffList.filter(u => u.roles?.includes('AUXILIARY')).length;
      const secretaries = staffList.filter(u => u.roles?.includes('SECRETARY')).length;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nómina de Personal</title>
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
            .role-badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: bold;
            }
            .role-teacher { background: #e3f2fd; color: #1976d2; }
            .role-auxiliary { background: #fff3e0; color: #f57c00; }
            .role-secretary { background: #f3e5f5; color: #7b1fa2; }
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
            <h2>Nómina de Personal - ${new Date().getFullYear()}</h2>
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
              <p><strong>Total de Registros:</strong> ${totalStaff}</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="number">${totalStaff}</div>
              <div class="label">Total Personal</div>
            </div>
            <div class="stat-item">
              <div class="number">${teachers}</div>
              <div class="label">Profesores</div>
            </div>
            <div class="stat-item">
              <div class="number">${auxiliaries}</div>
              <div class="label">Auxiliares</div>
            </div>
            <div class="stat-item">
              <div class="number">${secretaries}</div>
              <div class="label">Secretarios</div>
            </div>
            <div class="stat-item">
              <div class="number">${activeStaff}</div>
              <div class="label">Activos</div>
            </div>
            <div class="stat-item">
              <div class="number">${inactiveStaff}</div>
              <div class="label">Inactivos</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">N°</th>
                <th style="width: 150px;">Nombre Completo</th>
                <th style="width: 80px;">Rol</th>
                <th style="width: 80px;">Documento</th>
                <th style="width: 130px;">Email</th>
                <th style="width: 80px;">Teléfono</th>
                <th style="width: 60px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${staffList.map((user, index) => {
                const roleClass = user.roles?.includes('TEACHER') ? 'role-teacher' : 
                                 user.roles?.includes('AUXILIARY') ? 'role-auxiliary' : 
                                 'role-secretary';
                return `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td><strong>${this.sanitizeHTML(this.getFullName(user))}</strong></td>
                    <td>
                      <span class="role-badge ${roleClass}">
                        ${this.sanitizeHTML(this.getRoleLabel(user.roles))}
                      </span>
                    </td>
                    <td>
                      ${this.sanitizeHTML(this.getDocumentTypeLabel(user.documentType))}:
                      <strong>${this.sanitizeHTML(user.documentNumber)}</strong>
                    </td>
                    <td style="font-size: 8px;">${this.sanitizeHTML(user.email)}</td>
                    <td>${this.sanitizeHTML(user.phone || 'N/A')}</td>
                    <td class="${user.status === 'A' ? 'active' : 'inactive'}" style="text-align: center;">
                      ${this.getStatusLabel(user.status)}
                    </td>
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
                Recursos Humanos
              </div>
            </div>
          </div>

          <div class="footer">
            <div>
              <strong>Documento Oficial</strong> - Nómina de Personal
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
      return { success: false, error: 'Error al generar el PDF' };
    }
  }

  /**
   * Exporta nómina por rol específico
   */
  static exportByRole(staffList, role) {
    const filteredStaff = staffList.filter(user => user.roles?.includes(role));
    const roleName = this.getRoleLabel([role]);
    
    if (filteredStaff.length === 0) {
      return { success: false, error: `No hay personal con el rol de ${roleName}` };
    }

    return this.exportStaffToPDF(filteredStaff, { role: roleName });
  }

  /**
   * Exporta solo personal activo
   */
  static exportActiveStaff(staffList) {
    const activeStaff = staffList.filter(user => user.status === 'A');
    
    if (activeStaff.length === 0) {
      return { success: false, error: 'No hay personal activo' };
    }

    return this.exportStaffToPDF(activeStaff, { statusFilter: 'Activos' });
  }

  /**
   * Imprime el reporte actual directamente
   */
  static printCurrentView() {
    window.print();
    return { success: true, message: 'Imprimiendo...' };
  }
}

export default StaffReportExporter;
