import { useState, useEffect, useCallback } from 'react';
import { justificationsService } from '../services/justifications';
import attendanceService from '../services/attendance/attendanceService';

/**
 * Hook para gestionar justificaciones
 */
export const useJustifications = () => {
  const [pendingJustifications, setPendingJustifications] = useState([]);
  const [allJustifications, setAllJustifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar justificaciones pendientes
  const loadPendingJustifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsService.getPendingJustifications();
      if (response.success) {
        setPendingJustifications(response.data);
      } else {
        setError(response.error);
        setPendingJustifications([]);
      }
    } catch (err) {
      setError(err.message);
      setPendingJustifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar todas las justificaciones
  const loadAllJustifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsService.getAllJustifications();
      if (response.success) {
        setAllJustifications(response.data);
      } else {
        setError(response.error);
        setAllJustifications([]);
      }
    } catch (err) {
      setError(err.message);
      setAllJustifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear justificación
  const createJustification = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsService.createJustification(payload);
      
      if (response.success) {
        // Recargar listas después de crear
        await Promise.all([
          loadPendingJustifications(),
          loadAllJustifications()
        ]);
        return { success: true, data: response.data };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingJustifications,
    allJustifications,
    loading,
    error,
    loadPendingJustifications,
    loadAllJustifications,
    createJustification
  };
};

/**
 * Hook para obtener asistencias sin justificar de un estudiante
 * Usa el endpoint: GET /api/v1/attendances/auxiliary/by-student/{studentId}
 */
export const useAttendancesWithoutJustification = (studentId) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAttendances = useCallback(async () => {
    if (!studentId) {
      setAttendances([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Usar el método correcto del servicio para obtener asistencias por estudiante
      // Nota: Este método debe estar implementado en attendanceService.js
      const response = await attendanceService.getAttendancesByStudent?.(studentId) 
        || await attendanceService.getStudentAttendances?.(studentId);
      
      if (response && response.success) {
        // Filtrar solo ausencias (A) o tardanzas (L) que no estén justificadas (J)
        const faltasSinJustificar = response.data.filter(
          (att) => (att.status === 'A' || att.status === 'L') && att.status !== 'J'
        );
        setAttendances(faltasSinJustificar);
      } else {
        setError(response?.error || 'Error al cargar asistencias');
        setAttendances([]);
      }
    } catch (err) {
      setError(err.message);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAttendances();
  }, [loadAttendances]);

  return {
    attendances,
    loading,
    error,
    reload: loadAttendances
  };
};

/**
 * Hook para obtener justificaciones de un registro de asistencia específico
 */
export const useJustificationsByAttendanceRecord = (attendanceRecordId) => {
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadJustifications = useCallback(async () => {
    if (!attendanceRecordId) {
      setJustifications([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsService.getJustificationsByAttendanceRecord(attendanceRecordId);
      
      if (response.success) {
        setJustifications(response.data);
      } else {
        setError(response.error);
        setJustifications([]);
      }
    } catch (err) {
      setError(err.message);
      setJustifications([]);
    } finally {
      setLoading(false);
    }
  }, [attendanceRecordId]);

  useEffect(() => {
    loadJustifications();
  }, [loadJustifications]);

  return {
    justifications,
    loading,
    error,
    reload: loadJustifications
  };
};
