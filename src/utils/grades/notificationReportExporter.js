/**
 * Utilidades para exportar datos de reportes de notificaciones
 * Facilita la exportación a diferentes formatos
 */

import NotificationExportUtils from './notificationExportUtils';
import { 
  formatDateTime
} from '../../types/grades/notification';

export class NotificationReportExporter {
  /**
   * Exporta datos de notificaciones a Excel
   */
  static exportToExcel(notifications) {
    try {
      NotificationExportUtils.exportNotificationsToExcel(notifications);
      return { 
        success: true, 
        fileName: `notificaciones_${new Date().toISOString().split('T')[0]}.xls`,
        message: 'Archivo Excel generado correctamente'
      };
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Exporta datos de notificaciones a PDF
   */
  static exportToPDF(notifications) {
    try {
      NotificationExportUtils.exportNotificationsToPDF(notifications);
      return { 
        success: true, 
        fileName: `notificaciones_${new Date().toISOString().split('T')[0]}.pdf`,
        message: 'Archivo PDF generado correctamente'
      };
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Exporta datos de notificaciones a CSV
   */
  static exportToCSV(notifications) {
    try {
      NotificationExportUtils.exportNotificationsToCSV(notifications);
      return { 
        success: true, 
        fileName: `notificaciones_${new Date().toISOString().split('T')[0]}.csv`,
        message: 'Archivo CSV generado correctamente'
      };
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Imprime el reporte de notificaciones
   */
  static printReport(notifications = []) {
    try {
      // Si no hay datos, mostrar mensaje
      if (!notifications || notifications.length === 0) {
        const emptyContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Notificaciones</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                text-align: center; 
                background-color: #f8f9fa;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              h1 { 
                color: #333; 
                margin-bottom: 20px;
              }
              .no-data { 
                color: #666; 
                font-style: italic; 
                font-size: 18px;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">📬</div>
              <h1>Reporte de Notificaciones</h1>
              <p class="no-data">No hay notificaciones para mostrar en este momento</p>
            </div>
          </body>
          </html>
        `;
        
        const blob = new Blob([emptyContent], { type: 'text/html' });
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
        }
        return { success: true };
      }

      // Usar la función de exportToPDF mejorada para imprimir
      NotificationExportUtils.exportToPDF(
        notifications,
        ['Destinatario', 'Tipo Destinatario', 'Tipo Notificación', 'Estado', 'Canal', 'Mensaje', 'Fecha'],
        (notification) => {
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
        },
        'Reporte de Notificaciones',
        'Sistema de Comunicación Académica'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporta reporte por estado
   */
  static exportByStatus(notifications, status) {
    try {
      NotificationExportUtils.exportNotificationsByStatusToCSV(notifications, status);
      return { 
        success: true, 
        fileName: `notificaciones_${status.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        message: 'Reporte por estado exportado correctamente'
      };
    } catch (error) {
      console.error('Error exportando reporte por estado:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Exporta reporte individual de destinatario
   */
  static exportRecipientReport(notifications, recipientId) {
    try {
      NotificationExportUtils.exportNotificationsByRecipientToCSV(notifications, recipientId);
      return { 
        success: true, 
        fileName: `notificaciones_destinatario_${recipientId.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        message: 'Reporte del destinatario exportado correctamente'
      };
    } catch (error) {
      console.error('Error exportando reporte de destinatario:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Genera resumen estadístico
   */
  static generateSummaryReport(notifications) {
    try {
      const summary = NotificationExportUtils.generateNotificationsSummary(notifications);
      return { 
        success: true, 
        data: summary
      };
    } catch (error) {
      console.error('Error generando resumen:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

export default NotificationReportExporter;
