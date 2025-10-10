// Utilidades de exportación para notificaciones
import { message } from 'antd';
import { 
  formatDateTime
} from '../../types/grades/notification';

export class NotificationExportUtils {
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
      message.success('Archivo CSV descargado correctamente');
    } catch (error) {
      message.error('Error al generar el archivo CSV');
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
      // Generar estadísticas resumidas
      const summary = NotificationExportUtils.generateNotificationsSummary(data);
      const currentDate = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
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
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
            }
            h1 { 
              color: #333; 
              font-size: 22px;
              margin: 0 0 8px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 { 
              color: #666; 
              font-size: 16px;
              margin: 0 0 8px 0;
              font-weight: normal;
            }
            .report-info {
              background-color: #f8f9fa;
              padding: 15px;
              margin-bottom: 20px;
              border-left: 4px solid #333;
              border-radius: 3px;
            }
            .info-row {
              display: inline-block;
              margin-right: 30px;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .summary-section {
              background-color: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 5px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .summary-title {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            .summary-grid {
              display: table;
              width: 100%;
              margin-top: 10px;
            }
            .summary-item {
              display: table-row;
            }
            .summary-label {
              display: table-cell;
              padding: 8px;
              font-weight: bold;
              color: #555;
              width: 60%;
              border-bottom: 1px solid #eee;
            }
            .summary-value {
              display: table-cell;
              padding: 8px;
              text-align: right;
              color: #333;
              font-size: 14px;
              border-bottom: 1px solid #eee;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 11px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 10px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #333; 
              color: white;
              font-weight: bold; 
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover {
              background-color: #f0f0f0;
            }
            tbody tr td:first-child {
              font-weight: 600;
            }
            .status-pending { 
              color: #F39C12; 
              font-weight: bold; 
              background-color: #fff3cd;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .status-sent { 
              color: #3498DB; 
              font-weight: bold; 
              background-color: #d1ecf1;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .status-delivered { 
              color: #17A2B8; 
              font-weight: bold; 
              background-color: #d1ecf1;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .status-read { 
              color: #2ECC71; 
              font-weight: bold; 
              background-color: #d4edda;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .status-failed { 
              color: #E74C3C; 
              font-weight: bold; 
              background-color: #f8d7da;
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
            }
            .type-badge {
              padding: 3px 8px;
              border-radius: 3px;
              display: inline-block;
              font-size: 10px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #333;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
              .summary-section { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          </div>
          
          <div class="report-info">
            <div class="info-row">
              <span class="info-label">📅 Fecha:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📊 Total de registros:</span>
              <span class="info-value">${data.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">👥 Destinatarios únicos:</span>
              <span class="info-value">${summary.uniqueRecipients}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📬 Tipos de notificación:</span>
              <span class="info-value">${summary.uniqueTypes}</span>
            </div>
          </div>

          <div class="summary-section">
            <div class="summary-title">📈 Distribución por Estado</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">⏳ Pendiente</span>
                <span class="summary-value">${summary.statusDistribution.Pendiente || 0} (${((summary.statusDistribution.Pendiente || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">📤 Enviado</span>
                <span class="summary-value">${summary.statusDistribution.Enviado || 0} (${((summary.statusDistribution.Enviado || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">📬 Entregado</span>
                <span class="summary-value">${summary.statusDistribution.Entregado || 0} (${((summary.statusDistribution.Entregado || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">✅ Leído</span>
                <span class="summary-value">${summary.statusDistribution.Leído || 0} (${((summary.statusDistribution.Leído || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">❌ Fallido</span>
                <span class="summary-value">${summary.statusDistribution.Fallido || 0} (${((summary.statusDistribution.Fallido || 0) / data.length * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          ${Object.keys(summary.typeDistribution).length > 0 ? `
          <div class="summary-section">
            <div class="summary-title">📋 Distribución por Tipo de Notificación</div>
            <div class="summary-grid">
              ${Object.entries(summary.typeDistribution).map(([type, count]) => `
                <div class="summary-item">
                  <span class="summary-label">${type}</span>
                  <span class="summary-value">${count} notificaciones</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${Object.keys(summary.recipientTypeDistribution).length > 0 ? `
          <div class="summary-section">
            <div class="summary-title">👥 Distribución por Tipo de Destinatario</div>
            <div class="summary-grid">
              ${Object.entries(summary.recipientTypeDistribution).map(([type, count]) => `
                <div class="summary-item">
                  <span class="summary-label">${type}</span>
                  <span class="summary-value">${count} notificaciones</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

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
          
          <div class="footer">
            <p><strong>Sistema de Gestión Académica - Notificaciones</strong></p>
            <p>Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
            <p>Total de ${data.length} ${data.length === 1 ? 'registro' : 'registros'} | ${summary.uniqueRecipients} ${summary.uniqueRecipients === 1 ? 'destinatario' : 'destinatarios'}</p>
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
        message.success('PDF generado para impresión');
      } else {
        message.error('No se pudo abrir la ventana de impresión. Verifique que el bloqueador de ventanas emergentes esté deshabilitado.');
      }
    } catch (error) {
      message.error('Error al generar el PDF');
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
      message.success('Archivo Excel descargado correctamente');
    } catch (error) {
      message.error('Error al generar el archivo Excel');
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
   * Obtiene la clase CSS para el estado de notificación
   * @param {string} status - Estado de la notificación
   * @returns {string} Clase CSS
   */
  static getNotificationStatusClass(status) {
    switch (status) {
      case 'Pendiente': return 'status-pending';
      case 'Enviado': return 'status-sent';
      case 'Entregado': return 'status-delivered';
      case 'Leído': return 'status-read';
      case 'Fallido': return 'status-failed';
      default: return '';
    }
  }

  /**
   * Funciones específicas para notificaciones
   */

  /**
   * Exporta listado de notificaciones a CSV
   */
  static exportNotificationsToCSV(notifications) {
    const headers = [
      'ID', 'Destinatario', 'Tipo Destinatario', 'Tipo Notificación', 
      'Estado', 'Canal', 'Mensaje', 'Fecha Creación', 'Fecha Envío'
    ];

    const mapFunction = (notification) => [
      NotificationExportUtils.sanitizeCSV(notification.id || ''),
      NotificationExportUtils.sanitizeCSV(notification.recipientId || ''),
      NotificationExportUtils.sanitizeCSV(notification.recipientType || ''),
      NotificationExportUtils.sanitizeCSV(notification.notificationType || ''),
      NotificationExportUtils.sanitizeCSV(notification.status || ''),
      NotificationExportUtils.sanitizeCSV(notification.channel || ''),
      NotificationExportUtils.sanitizeCSV(notification.message || ''),
      NotificationExportUtils.sanitizeCSV(notification.createdAt ? formatDateTime(notification.createdAt) : ''),
      NotificationExportUtils.sanitizeCSV(notification.sentAt ? formatDateTime(notification.sentAt) : '')
    ];

    NotificationExportUtils.exportToCSV(notifications, headers, mapFunction, 'notificaciones');
  }

  /**
   * Exporta listado de notificaciones a PDF
   */
  static exportNotificationsToPDF(notifications) {
    const headers = [
      'Destinatario', 'Tipo Destinatario', 'Tipo Notificación', 'Estado', 'Canal', 'Mensaje', 'Fecha'
    ];

    const mapFunction = (notification) => {
      const statusClass = NotificationExportUtils.getNotificationStatusClass(notification.status);
      const message = notification.message && notification.message.length > 60 
        ? notification.message.substring(0, 60) + '...' 
        : (notification.message || '-');
      
      const dateToShow = notification.sentAt || notification.createdAt;
      const formattedDate = dateToShow ? formatDateTime(dateToShow) : '-';
      
      return `
        <td style="font-weight: 600;">${NotificationExportUtils.sanitizeHTML(notification.recipientId || '-')}</td>
        <td style="text-align: center; font-size: 10px;">${NotificationExportUtils.sanitizeHTML(notification.recipientType || '-')}</td>
        <td style="font-size: 9px;">${NotificationExportUtils.sanitizeHTML(notification.notificationType || '-')}</td>
        <td style="text-align: center;">
          <span class="${statusClass}">
            ${notification.status || '-'}
          </span>
        </td>
        <td style="text-align: center; font-size: 10px;">${NotificationExportUtils.sanitizeHTML(notification.channel || '-')}</td>
        <td style="font-size: 9px; max-width: 180px;">${NotificationExportUtils.sanitizeHTML(message)}</td>
        <td style="text-align: center; font-size: 9px;">${NotificationExportUtils.sanitizeHTML(formattedDate)}</td>
      `;
    };

    NotificationExportUtils.exportToPDF(
      notifications, 
      headers, 
      mapFunction, 
      'Reporte de Notificaciones',
      'Sistema de Comunicación Académica'
    );
  }

  /**
   * Exporta listado de notificaciones a Excel
   */
  static exportNotificationsToExcel(notifications) {
    const headers = [
      'ID', 'Destinatario', 'Tipo Destinatario', 'Tipo Notificación', 
      'Estado', 'Canal', 'Mensaje', 'Fecha Creación', 'Fecha Envío'
    ];

    const mapFunction = (notification) => [
      notification.id || '',
      notification.recipientId || '',
      notification.recipientType || '',
      notification.notificationType || '',
      notification.status || '',
      notification.channel || '',
      notification.message || '',
      notification.createdAt ? formatDateTime(notification.createdAt) : '',
      notification.sentAt ? formatDateTime(notification.sentAt) : ''
    ];

    NotificationExportUtils.exportToExcel(notifications, headers, mapFunction, 'notificaciones', 'Notificaciones');
  }

  /**
   * Exporta reporte por estado
   */
  static exportNotificationsByStatusToCSV(notifications, status) {
    const filteredNotifications = notifications.filter(n => n.status === status);
    
    const headers = [
      'Destinatario', 'Tipo Notificación', 'Canal', 'Mensaje', 'Fecha Creación'
    ];

    const mapFunction = (notification) => [
      NotificationExportUtils.sanitizeCSV(notification.recipientId),
      NotificationExportUtils.sanitizeCSV(notification.notificationType),
      NotificationExportUtils.sanitizeCSV(notification.channel),
      NotificationExportUtils.sanitizeCSV(notification.message),
      NotificationExportUtils.sanitizeCSV(formatDateTime(notification.createdAt))
    ];

    NotificationExportUtils.exportToCSV(
      filteredNotifications, 
      headers, 
      mapFunction, 
      `notificaciones_${status.toLowerCase().replace(/\s+/g, '_')}`
    );
  }

  /**
   * Exporta reporte por destinatario
   */
  static exportNotificationsByRecipientToCSV(notifications, recipientId) {
    const recipientNotifications = notifications.filter(n => n.recipientId === recipientId);
    
    const headers = [
      'Tipo Notificación', 'Estado', 'Canal', 'Mensaje', 'Fecha Creación', 'Fecha Envío'
    ];

    const mapFunction = (notification) => [
      NotificationExportUtils.sanitizeCSV(notification.notificationType),
      NotificationExportUtils.sanitizeCSV(notification.status),
      NotificationExportUtils.sanitizeCSV(notification.channel),
      NotificationExportUtils.sanitizeCSV(notification.message),
      NotificationExportUtils.sanitizeCSV(formatDateTime(notification.createdAt)),
      NotificationExportUtils.sanitizeCSV(formatDateTime(notification.sentAt))
    ];

    NotificationExportUtils.exportToCSV(
      recipientNotifications, 
      headers, 
      mapFunction, 
      `notificaciones_destinatario_${recipientId.replace(/\s+/g, '_')}`
    );
  }

  /**
   * Genera resumen estadístico de notificaciones
   */
  static generateNotificationsSummary(notifications) {
    const totalNotifications = notifications.length;
    const uniqueRecipients = new Set(notifications.map(n => n.recipientId)).size;
    const uniqueTypes = new Set(notifications.map(n => n.notificationType)).size;
    
    // Distribución por estado
    const statusDistribution = {};
    notifications.forEach(notification => {
      const status = notification.status || 'Sin estado';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });
    
    // Distribución por tipo
    const typeDistribution = {};
    notifications.forEach(notification => {
      const type = notification.notificationType || 'Sin tipo';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });
    
    // Distribución por tipo de destinatario
    const recipientTypeDistribution = {};
    notifications.forEach(notification => {
      const type = notification.recipientType || 'Sin tipo';
      recipientTypeDistribution[type] = (recipientTypeDistribution[type] || 0) + 1;
    });
    
    // Distribución por canal
    const channelDistribution = {};
    notifications.forEach(notification => {
      const channel = notification.channel || 'Sin canal';
      channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
    });

    return {
      totalNotifications,
      uniqueRecipients,
      uniqueTypes,
      statusDistribution,
      typeDistribution,
      recipientTypeDistribution,
      channelDistribution
    };
  }
}

export default NotificationExportUtils;
