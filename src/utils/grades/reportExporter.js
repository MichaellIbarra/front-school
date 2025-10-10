/**
 * Utilidades para exportar datos de reportes de calificaciones
 * Facilita la exportación a diferentes formatos
 */

import GradeExportUtils from './exportUtils';
import { 
  AchievementLevel,
  formatDate
} from '../../types/grades/grade';

export class GradeReportExporter {
  /**
   * Exporta datos de calificaciones a Excel
   */
  static exportToExcel(grades) {
    try {
      GradeExportUtils.exportGradesToExcel(grades);
      return { 
        success: true, 
        fileName: `calificaciones_${new Date().toISOString().split('T')[0]}.xls`,
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
   * Exporta datos de calificaciones a PDF
   */
  static exportToPDF(grades) {
    try {
      GradeExportUtils.exportGradesToPDF(grades);
      return { 
        success: true, 
        fileName: `calificaciones_${new Date().toISOString().split('T')[0]}.pdf`,
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
   * Exporta datos de calificaciones a CSV
   */
  static exportToCSV(grades) {
    try {
      GradeExportUtils.exportGradesToCSV(grades);
      return { 
        success: true, 
        fileName: `calificaciones_${new Date().toISOString().split('T')[0]}.csv`,
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
   * Imprime el reporte de calificaciones
   */
  static printReport(grades = []) {
    try {
      // Si no hay datos, mostrar mensaje
      if (!grades || grades.length === 0) {
        const emptyContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Calificaciones</title>
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
              <div class="icon">📋</div>
              <h1>Reporte de Calificaciones</h1>
              <p class="no-data">No hay datos para mostrar en este momento</p>
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
      GradeExportUtils.exportToPDF(
        grades,
        ['Estudiante', 'Curso', 'Período', 'Tipo Evaluación', 'Nivel de Logro', 'Fecha', 'Observaciones'],
        (grade) => {
          const levelInfo = AchievementLevel[grade.achievementLevel];
          const levelClass = GradeExportUtils.getAchievementLevelClass(grade.achievementLevel);
          const observations = grade.remarks ? GradeExportUtils.sanitizeHTML(grade.remarks) : '-';
          
          return `
            <td style="font-weight: 600;">${GradeExportUtils.sanitizeHTML(grade.studentId)}</td>
            <td>${GradeExportUtils.sanitizeHTML(grade.courseId)}</td>
            <td style="text-align: center;">${GradeExportUtils.sanitizeHTML(grade.academicPeriod)}</td>
            <td style="font-size: 9px;">${GradeExportUtils.sanitizeHTML(grade.evaluationType)}</td>
            <td style="text-align: center;">
              <span class="${levelClass}">
                ${grade.achievementLevel} - ${levelInfo?.name || ''}
              </span>
            </td>
            <td style="text-align: center;">${GradeExportUtils.sanitizeHTML(formatDate(grade.evaluationDate))}</td>
            <td style="font-size: 9px; max-width: 150px;">${observations}</td>
          `;
        },
        'Reporte de Calificaciones Académicas',
        'Sistema de Evaluación Educativa'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporta reporte de rendimiento por período
   */
  static exportPerformanceByPeriod(grades, period) {
    try {
      GradeExportUtils.exportGradesByPeriodToCSV(grades, period);
      return { 
        success: true, 
        fileName: `calificaciones_${period.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        message: 'Reporte por período exportado correctamente'
      };
    } catch (error) {
      console.error('Error exportando reporte por período:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Exporta reporte individual de estudiante
   */
  static exportStudentReport(grades, studentId) {
    try {
      GradeExportUtils.exportGradesByStudentToCSV(grades, studentId);
      return { 
        success: true, 
        fileName: `calificaciones_estudiante_${studentId.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        message: 'Reporte del estudiante exportado correctamente'
      };
    } catch (error) {
      console.error('Error exportando reporte de estudiante:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Genera resumen estadístico
   */
  static generateSummaryReport(grades) {
    try {
      const summary = GradeExportUtils.generateGradesSummary(grades);
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

export default GradeReportExporter;