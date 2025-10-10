/**
 * Utilidades para exportar datos de reportes
 * Facilita la exportación a diferentes formatos
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ReportExporter {
  
  /**
   * Exporta datos de instituciones y sedes a Excel
   */
  static exportToExcel(institutions, reportData) {
    try {
      // Crear un nuevo workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Resumen General
      const summaryData = [
        ['Métrica', 'Valor'],
        ['Total Instituciones', reportData.totalInstitutions],
        ['Total Sedes', reportData.totalHeadquarters],
        ['Instituciones Activas', reportData.activeInstitutions],
        ['Instituciones Inactivas', reportData.inactiveInstitutions],
        ['Sedes Activas', reportData.activeHeadquarters],
        ['Sedes Inactivas', reportData.inactiveHeadquarters],
        ['Promedio Sedes por Institución', reportData.averageHeadquartersPerInstitution],
        ['Fecha de Generación', new Date().toLocaleDateString()]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
      
      // Hoja 2: Detalle por Institución
      const detailData = [
        [
          'ID', 'Nombre', 'Código', 'Estado',
          'Total Sedes', 'Sedes Activas', 'Sedes Inactivas',
          'Email Contacto', 'Teléfono', 'Dirección', 'Fecha Creación'
        ]
      ];
      
      institutions.forEach(inst => {
        detailData.push([
          inst.id,
          inst.name,
          inst.codeInstitution,
          inst.status === 'A' ? 'Activo' : 'Inactivo',
          inst.headquartersCount,
          inst.activeHeadquarters,
          inst.inactiveHeadquarters,
          inst.contactEmail,
          inst.contactPhone,
          inst.address,
          inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : ''
        ]);
      });
      
      const detailWs = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Detalle Instituciones');
      
      // Hoja 3: Sedes por Institución
      const headquartersData = [
        [
          'Institución', 'ID Sede', 'Nombre Sede',
          'Códigos Modulares', 'Estado Sede', 'Dirección', 'Teléfono'
        ]
      ];
      
      institutions.forEach(inst => {
        if (inst.headquarters && inst.headquarters.length > 0) {
          inst.headquarters.forEach(hq => {
            // Procesar códigos modulares
            let modularCodesText = 'Sin códigos';
            if (Array.isArray(hq.modularCode) && hq.modularCode.length > 0) {
              modularCodesText = hq.modularCode.join(', ');
            }

            headquartersData.push([
              inst.name,
              hq.id,
              hq.name,
              modularCodesText,
              hq.status === 'A' ? 'Activo' : 'Inactivo',
              hq.address,
              hq.phone
            ]);
          });
        }
      });
      
      const headquartersWs = XLSX.utils.aoa_to_sheet(headquartersData);
      XLSX.utils.book_append_sheet(wb, headquartersWs, 'Detalle Sedes');
      
      // Generar y descargar el archivo
      const fileName = `reporte_instituciones_sedes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Exporta datos a PDF
   */
  static exportToPDF(institutions, reportData) {
    try {
      const doc = new jsPDF();
      
      // Título del documento
      doc.setFontSize(20);
      doc.text('Reporte de Instituciones y Sedes', 20, 20);
      
      // Fecha de generación
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 20, 30);
      
      // Resumen estadístico
      doc.setFontSize(14);
      doc.text('Resumen Estadístico', 20, 45);
      
      const summaryData = [
        ['Métrica', 'Valor'],
        ['Total Instituciones', reportData.totalInstitutions.toString()],
        ['Total Sedes', reportData.totalHeadquarters.toString()],
        ['Instituciones Activas', reportData.activeInstitutions.toString()],
        ['Instituciones Inactivas', reportData.inactiveInstitutions.toString()],
        ['Sedes Activas', reportData.activeHeadquarters.toString()],
        ['Sedes Inactivas', reportData.inactiveHeadquarters.toString()],
        ['Promedio Sedes/Institución', reportData.averageHeadquartersPerInstitution.toString()]
      ];
      
      doc.autoTable({
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: 55,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Nueva página para el detalle
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Detalle por Institución', 20, 20);
      
      const institutionData = institutions.map(inst => [
        inst.name.substring(0, 25) + (inst.name.length > 25 ? '...' : ''),
        inst.codeInstitution,
        inst.status === 'A' ? 'Activo' : 'Inactivo',
        inst.headquartersCount.toString(),
        inst.activeHeadquarters.toString(),
        inst.inactiveHeadquarters.toString()
      ]);
      
      doc.autoTable({
        head: [['Institución', 'Código', 'Estado', 'Total Sedes', 'Activas', 'Inactivas']],
        body: institutionData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });
      
      // Guardar el PDF
      const fileName = `reporte_instituciones_sedes_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Exporta datos a CSV
   */
  static exportToCSV(institutions) {
    try {
      const headers = [
        'ID', 'Nombre', 'Código', 'Estado',
        'Total Sedes', 'Sedes Activas', 'Sedes Inactivas',
        'Email Contacto', 'Teléfono', 'Dirección', 'Fecha Creación'
      ];
      
      const csvContent = [
        headers.join(','),
        ...institutions.map(inst => [
          inst.id,
          `"${inst.name}"`,
          inst.codeInstitution,
          inst.status === 'A' ? 'Activo' : 'Inactivo',
          inst.headquartersCount,
          inst.activeHeadquarters,
          inst.inactiveHeadquarters,
          `"${inst.contactEmail}"`,
          inst.contactPhone,
          `"${inst.address}"`,
          inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');
      
      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_instituciones_sedes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, fileName: link.getAttribute('download') };
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Imprime el reporte usando la función nativa del navegador
   */
  static printReport() {
    try {
      // Crear estilos específicos para impresión
      const printStyles = `
        @media print {
          body * { visibility: hidden; }
          .page-wrapper, .page-wrapper * { visibility: visible; }
          .page-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          .btn, .ant-btn, .ant-select { display: none !important; }
          .sidebar, .header { display: none !important; }
          .card { border: 1px solid #333 !important; box-shadow: none !important; }
          .table th { background-color: #f5f5f5 !important; }
          .chart-container { page-break-inside: avoid; }
        }
      `;
      
      // Agregar estilos temporalmente
      const styleElement = document.createElement('style');
      styleElement.textContent = printStyles;
      document.head.appendChild(styleElement);
      
      // Imprimir
      window.print();
      
      // Remover estilos después de un delay
      setTimeout(() => {
        document.head.removeChild(styleElement);
      }, 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Error al imprimir:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ReportExporter;