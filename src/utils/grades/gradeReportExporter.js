/**
 * Utilidades para exportar reportes de calificaciones
 * Sigue el estándar de los reportes institucionales
 */

export class GradeReportExporter {
  
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
   * Formatea fecha para display
   */
  static formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Formatea fecha con mes en texto
   */
  static formatDateWithMonth(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  /**
   * Exporta calificaciones a CSV
   */
  static exportGradesToCSV(gradesList, students, assignmentData) {
    try {
      const headers = [
        'N°',
        'Estudiante',
        'DNI',
        'Competencia',
        'Capacidad Evaluada',
        'Tipo de Evaluación',
        'Calificación',
        'Nota Numérica',
        'Fecha de Evaluación',
        'Observaciones'
      ];

      const csvContent = [
        headers.join(','),
        ...gradesList.map((grade, index) => {
          const student = students.find(s => s.id === grade.studentId);
          return [
            index + 1,
            this.sanitizeCSV(student ? student.fullName : 'N/A'),
            this.sanitizeCSV(student ? student.documentNumber : 'N/A'),
            this.sanitizeCSV(grade.competenceName),
            this.sanitizeCSV(grade.capacityEvaluated || 'N/A'),
            this.sanitizeCSV(grade.evaluationType),
            this.sanitizeCSV(grade.gradeScale),
            this.sanitizeCSV(grade.numericGrade || 'N/A'),
            this.sanitizeCSV(this.formatDate(grade.evaluationDate)),
            this.sanitizeCSV(grade.observations || 'Sin observaciones')
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filename = `calificaciones_${assignmentData.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
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
   * Exporta calificaciones a PDF (formato libreta MINEDU 2025)
   */
  static exportGradesToPDF(gradesList, students, assignmentData) {
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
      const currentYear = new Date().getFullYear();
      
      // Preparar datos
      const courseName = assignmentData.courseName || 'N/A';
      const classroomName = assignmentData.classroomName || 'N/A';
      
      // Agrupar calificaciones por estudiante
      const studentGradesMap = {};
      gradesList.forEach(grade => {
        if (!studentGradesMap[grade.studentId]) {
          studentGradesMap[grade.studentId] = [];
        }
        studentGradesMap[grade.studentId].push(grade);
      });

      // Filtrar students para incluir solo aquellos que tienen calificaciones en gradesList
      const studentsWithGrades = students.filter(student => 
        studentGradesMap[student.id] && studentGradesMap[student.id].length > 0
      );

      // Si no hay estudiantes con calificaciones, retornar error
      if (studentsWithGrades.length === 0) {
        return { success: false, error: 'No hay estudiantes con calificaciones para exportar' };
      }

      // Obtener todas las competencias únicas
      const competencies = [...new Set(gradesList.map(g => g.competenceName))];
      
      /**
       * Función auxiliar para obtener el número de período
       * Extrae el número romano o arábigo del tipo de período
       * Ej: I_TRIMESTRE -> 1, II_BIMESTRE -> 2, III_TRIMESTRE -> 3, IV_BIMESTRE -> 4
       */
      const getPeriodNumber = (typePeriod) => {
        if (!typePeriod) return 1;
        
        // Mapeo de números romanos a arábigos
        const romanToNumber = {
          'I': 1,
          'II': 2,
          'III': 3,
          'IV': 4
        };
        
        // Extraer el número romano del código (ej: "I_TRIMESTRE" -> "I")
        const match = typePeriod.match(/^([IV]+)_/);
        if (match && romanToNumber[match[1]]) {
          return romanToNumber[match[1]];
        }
        
        // Si no encuentra patrón romano, buscar número arábigo
        const numMatch = typePeriod.match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1]) : 1;
      };
      
      /**
       * Función auxiliar para calcular promedio de calificaciones
       * AD=4, A=3, B=2, C=1
       */
      const calculateAverage = (grades) => {
        if (!grades || grades.length === 0) return '-';
        const gradeValues = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
        const sum = grades.reduce((acc, grade) => {
          return acc + (gradeValues[grade] || 0);
        }, 0);
        const avg = sum / grades.length;
        
        // Convertir promedio numérico a escala literal
        if (avg >= 3.5) return 'AD';
        if (avg >= 2.5) return 'A';
        if (avg >= 1.5) return 'B';
        return 'C';
      };
      
      // Crear contenido HTML del reporte (formato MINEDU 2025)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Informe de Progreso del Aprendizaje del Estudiante - ${currentYear}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 15px;
                font-size: 8pt;
              }
              
              /* Encabezado institucional */
              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 3px solid ${institutionColor};
                padding-bottom: 8px;
              }
              
              .logo-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 8px;
              }
              
              .logo-container img {
                max-width: 80px;
                max-height: 80px;
                object-fit: contain;
              }
              
              .header h2 {
                margin: 3px 0;
                font-size: 10pt;
                text-transform: uppercase;
                font-weight: bold;
                color: ${institutionColor};
              }
              
              .header h3 {
                margin: 2px 0;
                font-size: 9pt;
                font-weight: normal;
                color: #666;
              }
              
              /* Información del estudiante */
              .student-info {
                margin: 10px 0;
                font-size: 7pt;
              }
              
              .student-info table {
                width: 100%;
                border-collapse: collapse;
              }
              
              .student-info td {
                padding: 2px 5px;
                border: 1px solid #000;
              }
              
              .student-info .label {
                font-weight: bold;
                background-color: #f0f0f0;
                width: 120px;
              }
              
              /* Tabla de competencias */
              .competencies-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 7pt;
                page-break-inside: avoid;
              }
              
              .competencies-table th,
              .competencies-table td {
                border: 1px solid #000;
                padding: 3px;
                vertical-align: top;
              }
              
              .competencies-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
              }
              
              .competencies-table .area-header {
                background-color: #e0e0e0;
                font-weight: bold;
                text-align: left;
                padding: 4px;
              }
              
              .competencies-table .competency-cell {
                text-align: left;
                font-size: 6.5pt;
                line-height: 1.2;
              }
              
              .competencies-table .grade-cell {
                text-align: center;
                font-weight: bold;
                font-size: 9pt;
              }
              
              /* Escala de calificación */
              .scale-section {
                margin: 15px 0;
                font-size: 7pt;
                page-break-inside: avoid;
              }
              
              .scale-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
              }
              
              .scale-table th,
              .scale-table td {
                border: 1px solid #000;
                padding: 4px;
                text-align: left;
              }
              
              .scale-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                width: 80px;
                text-align: center;
              }
              
              .scale-table .scale-label {
                font-weight: bold;
                text-align: center;
              }
              
              /* Firmas */
              .signatures {
                margin-top: 30px;
                display: table;
                width: 100%;
                page-break-inside: avoid;
              }
              
              .signature {
                display: table-cell;
                text-align: center;
                padding: 0 15px;
                font-size: 7pt;
              }
              
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 40px;
                padding-top: 3px;
              }
              
              /* Footer */
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 6pt;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 5px;
              }
              
              /* Configuración de impresión */
              @media print {
                body {
                  margin: 0;
                  padding: 10mm;
                }
                @page {
                  size: A4;
                  margin: 10mm;
                }
                .page-break {
                  page-break-before: always;
                }
              }
            </style>
          </head>
          <body>
            ${studentsWithGrades.map((student, studentIndex) => {
              const grades = studentGradesMap[student.id];
              if (!grades || grades.length === 0) return '';
              
              return `
                ${studentIndex > 0 ? '<div class="page-break"></div>' : ''}
                
                <!-- Encabezado Institucional -->
                <div class="header">
                  ${institutionLogo ? `
                    <div class="logo-container">
                      <img src="${this.sanitizeHTML(institutionLogo)}" alt="Logo Institución" />
                    </div>
                  ` : ''}
                  <h2>${this.sanitizeHTML(institutionName)}</h2>
                  <h3>INFORME DE PROGRESO DEL APRENDIZAJE DEL ESTUDIANTE - ${currentYear}</h3>
                </div>

                <!-- Información del Estudiante -->
                <div class="student-info">
                  <table>
                    <tr>
                      <td class="label">DRE:</td>
                      <td colspan="3">${this.sanitizeHTML(institutionName)}</td>
                    </tr>
                    <tr>
                      <td class="label">Nivel:</td>
                      <td>Primaria</td>
                      <td class="label">UGEL:</td>
                      <td>Código Modular:</td>
                    </tr>
                    <tr>
                      <td class="label">Institución Educativa:</td>
                      <td colspan="3">${this.sanitizeHTML(institutionName)}</td>
                    </tr>
                    <tr>
                      <td class="label">Grado:</td>
                      <td>${this.sanitizeHTML(classroomName)}</td>
                      <td class="label">Sección:</td>
                      <td>${this.sanitizeHTML(courseName)}</td>
                    </tr>
                    <tr>
                      <td class="label">Apellidos y nombres:</td>
                      <td colspan="3"><strong>${this.sanitizeHTML(student.fullName)}</strong></td>
                    </tr>
                    <tr>
                      <td class="label">Código del estudiante:</td>
                      <td>${this.sanitizeHTML(student.documentNumber)}</td>
                      <td class="label">DNI:</td>
                      <td>${this.sanitizeHTML(student.documentNumber)}</td>
                    </tr>
                  </table>
                </div>

                <!-- Tabla de Competencias y Calificaciones -->
                <table class="competencies-table">
                  <thead>
                    <tr>
                      <th rowspan="2" style="width: 140px;">ÁREA CURRICULAR</th>
                      <th rowspan="2">COMPETENCIAS</th>
                      <th colspan="4">CALIFICATIVO<br>POR PERIODO</th>
                      <th rowspan="2" style="width: 60px;">Calif. anual de competencia</th>
                      <th rowspan="2" style="width: 60px;">Calif. final del área</th>
                    </tr>
                    <tr>
                      <th style="width: 35px;">1</th>
                      <th style="width: 35px;">2</th>
                      <th style="width: 35px;">3</th>
                      <th style="width: 35px;">4</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(() => {
                      // Array para almacenar las calificaciones anuales de cada competencia
                      const competencyAnnualGrades = [];
                      
                      // Generar las filas
                      const rows = competencies.map((competency, compIndex) => {
                        // Buscar todas las calificaciones para esta competencia
                        const competencyGrades = grades.filter(g => g.competenceName === competency);
                        
                        // Organizar calificaciones por período (1-4)
                        // Cada período puede tener múltiples calificaciones, así que usamos arrays
                        const gradesByPeriod = {
                          1: [],
                          2: [],
                          3: [],
                          4: []
                        };
                        
                        // Asignar cada calificación a su período correspondiente
                        competencyGrades.forEach(grade => {
                          const periodNum = getPeriodNumber(grade.typePeriod);
                          if (periodNum >= 1 && periodNum <= 4) {
                            gradesByPeriod[periodNum].push(grade.gradeScale);
                          }
                        });
                        
                        // Calcular el promedio para cada período que tenga calificaciones
                        const periodAverages = {
                          1: gradesByPeriod[1].length > 0 ? calculateAverage(gradesByPeriod[1]) : '-',
                          2: gradesByPeriod[2].length > 0 ? calculateAverage(gradesByPeriod[2]) : '-',
                          3: gradesByPeriod[3].length > 0 ? calculateAverage(gradesByPeriod[3]) : '-',
                          4: gradesByPeriod[4].length > 0 ? calculateAverage(gradesByPeriod[4]) : '-'
                        };
                        
                        // Calcular calificación anual de esta competencia (promedio de los 4 períodos)
                        const validPeriodGrades = Object.values(periodAverages).filter(g => g !== '-');
                        const competencyAnnualGrade = calculateAverage(validPeriodGrades);
                        
                        // Guardar la calificación anual de esta competencia para calcular el promedio del área
                        competencyAnnualGrades.push(competencyAnnualGrade);
                        
                        return `
                          ${compIndex === 0 ? `
                            <tr>
                              <td class="area-header" rowspan="${competencies.length}">${this.sanitizeHTML(courseName)}</td>
                              <td class="competency-cell">${this.sanitizeHTML(competency)}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[1])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[2])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[3])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[4])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(competencyAnnualGrade)}</td>
                              <td class="grade-cell" rowspan="${competencies.length}">${this.sanitizeHTML(calculateAverage(competencyAnnualGrades.filter(g => g !== '-')))}</td>
                            </tr>
                          ` : `
                            <tr>
                              <td class="competency-cell">${this.sanitizeHTML(competency)}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[1])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[2])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[3])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(periodAverages[4])}</td>
                              <td class="grade-cell">${this.sanitizeHTML(competencyAnnualGrade)}</td>
                            </tr>
                          `}
                        `;
                      });
                      
                      return rows.join('');
                    })()}
                  </tbody>
                </table>

                <!-- Escala de Calificaciones -->
                <div class="scale-section">
                  <h4 style="margin: 5px 0; font-size: 8pt;">ESCALA DE CALIFICACIONES DEL CNEB</h4>
                  <table class="scale-table">
                    <tr>
                      <th>AD<br>Logro destacado</th>
                      <td style="font-size: 6.5pt;">Cuando el estudiante evidencia un nivel superior a lo esperado respecto a la competencia. Esto quiere decir que demuestra aprendizajes que van más allá del nivel esperado.</td>
                    </tr>
                    <tr>
                      <th>A<br>Logro esperado</th>
                      <td style="font-size: 6.5pt;">Cuando el estudiante evidencia el nivel esperado respecto a la competencia, demostrando manejo satisfactorio en todas las tareas propuestas y en el tiempo programado.</td>
                    </tr>
                    <tr>
                      <th>B<br>En proceso</th>
                      <td style="font-size: 6.5pt;">Cuando el estudiante está próximo o cerca al nivel esperado respecto a la competencia, para lo cual requiere acompañamiento durante un tiempo razonable para lograrlo.</td>
                    </tr>
                    <tr>
                      <th>C<br>En inicio</th>
                      <td style="font-size: 6.5pt;">Cuando el estudiante muestra un progreso mínimo en una competencia de acuerdo al nivel esperado. Evidencia con frecuencia dificultades en el desarrollo de las tareas, por lo que necesita mayor tiempo de acompañamiento e intervención del docente.</td>
                    </tr>
                  </table>
                </div>

                <!-- Firmas -->
                <div class="signatures">
                  <div class="signature">
                    <div class="signature-line">
                      Firma y sello del Docente Tutor(a)
                    </div>
                  </div>
                  <div class="signature">
                    <div class="signature-line">
                      Firma y sello del Director(a)
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  Documento Oficial - Generado: ${this.formatDateWithMonth(new Date().toISOString())}
                </div>
              `;
            }).join('')}
          </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        return { success: false, error: 'No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.' };
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido antes de imprimir
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      };

      return { success: true, message: 'Generando PDF... Use "Guardar como PDF" en la ventana de impresión' };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: 'Error al generar el archivo PDF' };
    }
  }

  /**
   * Exporta a Excel (formato HTML que Excel puede abrir)
   */
  static exportGradesToExcel(gradesList, students, assignmentData) {
    try {
      const courseName = assignmentData.courseName || 'N/A';
      const classroomName = assignmentData.classroomName || 'N/A';
      const periodName = assignmentData.periodName || 'N/A';

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid black; padding: 8px; text-align: left; }
              th { background-color: #4CAF50; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h2>Reporte de Calificaciones</h2>
            <p><strong>Curso:</strong> ${this.sanitizeHTML(courseName)}</p>
            <p><strong>Aula:</strong> ${this.sanitizeHTML(classroomName)}</p>
            <p><strong>Período:</strong> ${this.sanitizeHTML(periodName)}</p>
            <p><strong>Fecha de generación:</strong> ${this.formatDateWithMonth(new Date().toISOString())}</p>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>DNI</th>
                  <th>Competencia</th>
                  <th>Capacidad</th>
                  <th>Tipo</th>
                  <th>Calificación</th>
                  <th>Nota Numérica</th>
                  <th>Fecha</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${gradesList.map((grade, index) => {
                  const student = students.find(s => s.id === grade.studentId);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${this.sanitizeHTML(student ? student.fullName : 'N/A')}</td>
                      <td>${this.sanitizeHTML(student ? student.documentNumber : 'N/A')}</td>
                      <td>${this.sanitizeHTML(grade.competenceName)}</td>
                      <td>${this.sanitizeHTML(grade.capacityEvaluated || 'N/A')}</td>
                      <td>${this.sanitizeHTML(grade.evaluationType)}</td>
                      <td style="text-align: center; font-weight: bold;">${this.sanitizeHTML(grade.gradeScale)}</td>
                      <td style="text-align: center;">${this.sanitizeHTML(grade.numericGrade || 'N/A')}</td>
                      <td>${this.formatDate(grade.evaluationDate)}</td>
                      <td>${this.sanitizeHTML(grade.observations || 'Sin observaciones')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `calificaciones_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      
      return { success: true, message: 'Archivo Excel descargado correctamente' };
    } catch (error) {
      console.error('Excel Export Error:', error);
      return { success: false, error: 'Error al generar el archivo Excel' };
    }
  }
}

export default GradeReportExporter;
