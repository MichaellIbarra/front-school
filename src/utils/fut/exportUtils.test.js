import { FutExportUtils } from './exportUtils';

// Mock data for testing
const mockFutRequests = [
  {
    id: '1',
    studentEnrollmentId: 'student1',
    requestNumber: 'FUT-2023-001',
    requestType: 'CERTIFICADO',
    requestSubject: 'Solicitud de Certificado de Estudios',
    requestDescription: 'Solicitud de certificado de estudios para trámite de beca',
    requestedBy: 'María López',
    contactPhone: '987654321',
    contactEmail: 'maria.lopez@email.com',
    urgencyLevel: 'MEDIA',
    estimatedDeliveryDate: '2023-12-01T00:00:00Z',
    status: 'PENDIENTE',
    createdAt: '2023-11-01T10:00:00Z'
  }
];

const mockStudents = [
  {
    id: 'student1',
    firstName: 'Juan',
    lastName: 'Pérez',
    documentType: 'DNI',
    documentNumber: '12345678',
    grade: '5to grado',
    address: 'Av. Los Álamos 123',
    district: 'San Isidro',
    province: 'Lima',
    phone: '987654321',
    email: 'juan.perez@email.com',
    parentName: 'María López'
  }
];

const mockInstitution = {
  name: 'Institución Educativa Demo',
  address: 'Av. Educación 123',
  district: 'Distrito Ejemplo',
  province: 'Provincia Ejemplo',
  phone: '(01) 123-4567'
};

describe('FutExportUtils', () => {
  describe('formatDate', () => {
    it('should format a valid date string correctly', () => {
      const dateString = '2023-10-15T10:30:00Z';
      const result = FutExportUtils.formatDate(dateString);
      expect(result).toContain('2023');
    });

    it('should return "N/A" for null or undefined input', () => {
      expect(FutExportUtils.formatDate(null)).toBe('N/A');
      expect(FutExportUtils.formatDate(undefined)).toBe('N/A');
    });

    it('should return "Fecha inválida" for invalid date strings', () => {
      const result = FutExportUtils.formatDate('invalid-date');
      expect(result).toBe('Fecha inválida');
    });
  });

  describe('getStatusText', () => {
    it('should return the correct status text for valid status codes', () => {
      expect(FutExportUtils.getStatusText('PENDIENTE')).toBe('Pendiente');
      expect(FutExportUtils.getStatusText('APROBADO')).toBe('Aprobado');
      expect(FutExportUtils.getStatusText('RECHAZADO')).toBe('Rechazado');
      expect(FutExportUtils.getStatusText('COMPLETADO')).toBe('Completado');
    });

    it('should return the original status for unknown status codes', () => {
      expect(FutExportUtils.getStatusText('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getUrgencyText', () => {
    it('should return the correct urgency text for valid urgency codes', () => {
      expect(FutExportUtils.getUrgencyText('ALTA')).toBe('Alta');
      expect(FutExportUtils.getUrgencyText('MEDIA')).toBe('Media');
      expect(FutExportUtils.getUrgencyText('BAJA')).toBe('Baja');
    });

    it('should return the original urgency for unknown urgency codes', () => {
      expect(FutExportUtils.getUrgencyText('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('export functions', () => {
    it('should generate HTML content without errors', () => {
      // This test ensures that the export functions don't throw errors
      // Note: We can't actually test the window.open functionality in Jest
      expect(() => {
        FutExportUtils.exportFutRequestsToPDF(mockFutRequests, mockStudents, mockInstitution);
      }).not.toThrow();
      
      expect(() => {
        FutExportUtils.exportFutRequestToOfficialPDF(mockFutRequests[0], mockStudents[0], mockInstitution);
      }).not.toThrow();
    });
  });
});