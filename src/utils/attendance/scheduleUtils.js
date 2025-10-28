/**
 * Utilidades para el manejo de horarios y fechas en asistencia
 */
import dayjs from 'dayjs';

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export const getCurrentDate = () => {
  return dayjs().format('YYYY-MM-DD');
};

/**
 * Obtiene la hora actual en formato HH:mm:ss
 */
export const getCurrentTime = () => {
  return dayjs().format('HH:mm:ss');
};

/**
 * Obtiene la fecha y hora actual en formato ISO
 */
export const getCurrentDateTime = () => {
  return dayjs().toISOString();
};

/**
 * Verifica si una fecha está en el rango permitido para registro de asistencia
 */
export const isDateInAllowedRange = (date, maxDaysBack = 7) => {
  const targetDate = dayjs(date);
  const today = dayjs();
  const earliestDate = today.subtract(maxDaysBack, 'day');
  
  return targetDate.isBetween(earliestDate, today, 'day', '[]');
};

/**
 * Formatea una fecha para mostrar
 */
export const formatDisplayDate = (date) => {
  return dayjs(date).format('DD/MM/YYYY');
};

/**
 * Formatea fecha y hora para mostrar
 */
export const formatDisplayDateTime = (datetime) => {
  return dayjs(datetime).format('DD/MM/YYYY HH:mm');
};

/**
 * Calcula si un registro es tardío basado en la hora de entrada
 */
export const isLateEntry = (entryTime, scheduleStartTime = '08:00') => {
  const entry = dayjs(entryTime);
  const scheduled = dayjs(entryTime).hour(parseInt(scheduleStartTime.split(':')[0]))
                                   .minute(parseInt(scheduleStartTime.split(':')[1]));
  
  return entry.isAfter(scheduled);
};

/**
 * Obtiene el rango de fechas de la semana actual
 */
export const getCurrentWeekRange = () => {
  const today = dayjs();
  const startOfWeek = today.startOf('week');
  const endOfWeek = today.endOf('week');
  
  return {
    start: startOfWeek.format('YYYY-MM-DD'),
    end: endOfWeek.format('YYYY-MM-DD')
  };
};

/**
 * Obtiene el rango de fechas del mes actual
 */
export const getCurrentMonthRange = () => {
  const today = dayjs();
  const startOfMonth = today.startOf('month');
  const endOfMonth = today.endOf('month');
  
  return {
    start: startOfMonth.format('YYYY-MM-DD'),
    end: endOfMonth.format('YYYY-MM-DD')
  };
};

/**
 * Definición de turnos institucionales
 */
export const SHIFT_SCHEDULES = {
  M: { // Mañana
    name: 'Mañana',
    startTime: '08:00',
    endTime: '12:00',
    toleranceMinutes: 15
  },
  T: { // Tarde
    name: 'Tarde', 
    startTime: '14:00',
    endTime: '18:00',
    toleranceMinutes: 15
  },
  N: { // Noche
    name: 'Noche',
    startTime: '19:00', 
    endTime: '22:00',
    toleranceMinutes: 15
  }
};

/**
 * Obtiene la configuración de horarios desde la institución guardada en localStorage
 */
export const getInstitutionScheduleSettings = () => {
  try {
    const institutionData = localStorage.getItem('institution');
    if (institutionData) {
      const institution = JSON.parse(institutionData);
      return institution.scheduleSettings || null;
    }
  } catch (error) {
    console.error('Error obteniendo configuración de horarios de la institución:', error);
  }
  return null;
};

/**
 * Obtiene los turnos basados en la configuración de la institución
 */
export const getInstitutionShiftSchedules = () => {
  const scheduleSettings = getInstitutionScheduleSettings();
  
  if (!scheduleSettings) {
    console.log('⚠️ No hay configuración de horarios, usando valores por defecto');
    // Valores por defecto si no hay configuración
    return SHIFT_SCHEDULES;
  }

  console.log('🏫 Configuración de horarios de la institución:', scheduleSettings);

  // Función helper para convertir formato HH:MM:SS a HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return '00:00';
    return timeString.substring(0, 5); // Tomar solo HH:MM
  };

  return {
    M: {
      name: 'Mañana',
      startTime: formatTime(scheduleSettings.morningStartTime),
      endTime: formatTime(scheduleSettings.morningEndTime),
      toleranceMinutes: scheduleSettings.morningToleranceMinutes || 15
    },
    T: {
      name: 'Tarde',
      startTime: formatTime(scheduleSettings.afternoonStartTime),
      endTime: formatTime(scheduleSettings.afternoonEndTime),
      toleranceMinutes: scheduleSettings.afternoonToleranceMinutes || 15
    },
    N: {
      name: 'Noche',
      startTime: formatTime(scheduleSettings.nightStartTime),
      endTime: formatTime(scheduleSettings.nightEndTime),
      toleranceMinutes: scheduleSettings.nightToleranceMinutes || 15
    }
  };
};

/**
 * Obtiene el turno actual basado en la hora del sistema
 */
export const getCurrentShift = () => {
  const now = dayjs();
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const currentTime = currentHour * 60 + currentMinute; // Minutos desde medianoche
  
  let activeShift = null;
  let status = 'A'; // Ausente por defecto
  let isWithinTolerance = false;
  let isEstimated = false;
  
  // Obtener horarios de la institución
  const INSTITUTION_SCHEDULES = getInstitutionShiftSchedules();
  
  console.log('🏫 Horarios de la institución:', INSTITUTION_SCHEDULES);
  console.log('🕒 Hora actual:', now.format('HH:mm:ss'), `(${currentTime} min desde medianoche)`);
  
  // Determinar turno actual basado en horarios
  for (const [shiftCode, schedule] of Object.entries(INSTITUTION_SCHEDULES)) {
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    const startMinute = parseInt(schedule.startTime.split(':')[1]);
    const endHour = parseInt(schedule.endTime.split(':')[0]);
    const endMinute = parseInt(schedule.endTime.split(':')[1]);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const toleranceTime = startTime + schedule.toleranceMinutes;
    
    // Verificar si estamos en el rango del turno (con tolerancia extendida)
    const extendedStart = startTime - 30; // 30 min antes
    const extendedEnd = endTime + 30; // 30 min después
    
    if (currentTime >= extendedStart && currentTime <= extendedEnd) {
      activeShift = {
        code: shiftCode,
        name: schedule.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        toleranceMinutes: schedule.toleranceMinutes
      };
      
      // Determinar estado basado en la hora actual
      if (currentTime <= toleranceTime) {
        status = 'P'; // Presente (dentro de tolerancia)
        isWithinTolerance = true;
      } else if (currentTime <= endTime) {
        status = 'L'; // Late (tarde pero dentro del horario)
        isWithinTolerance = false;
      } else {
        status = 'A'; // Ausente (fuera del horario)
        isWithinTolerance = false;
      }
      
      break;
    }
  }
  
  // Si no hay turno activo, usar estimación basada en los horarios de la institución
  if (!activeShift) {
    isEstimated = true;
    
    // Determinar el turno más cercano basado en los horarios reales
    const morningStart = parseInt(INSTITUTION_SCHEDULES.M.startTime.split(':')[0]);
    const afternoonStart = parseInt(INSTITUTION_SCHEDULES.T.startTime.split(':')[0]);
    const nightStart = parseInt(INSTITUTION_SCHEDULES.N.startTime.split(':')[0]);
    
    console.log('🤔 Estimando turno. Hora actual:', currentHour, 'Inicios de turnos:', {
      mañana: morningStart,
      tarde: afternoonStart, 
      noche: nightStart
    });
    
    // Estimar turno más probable
    if (Math.abs(currentHour - morningStart) <= Math.abs(currentHour - afternoonStart) && 
        Math.abs(currentHour - morningStart) <= Math.abs(currentHour - nightStart)) {
      activeShift = { ...INSTITUTION_SCHEDULES.M, code: 'M' };
    } else if (Math.abs(currentHour - afternoonStart) <= Math.abs(currentHour - nightStart)) {
      activeShift = { ...INSTITUTION_SCHEDULES.T, code: 'T' };
    } else {
      activeShift = { ...INSTITUTION_SCHEDULES.N, code: 'N' };
    }
    
    status = 'A'; // Ausente si es estimación
    console.log('📊 Turno estimado:', activeShift.name);
  }
  
  const result = {
    shift: activeShift.code,
    shiftName: activeShift.name,
    startTime: activeShift.startTime,
    endTime: activeShift.endTime,
    toleranceMinutes: activeShift.toleranceMinutes || 15, // Incluir tolerancia con valor por defecto
    status,
    isWithinTolerance,
    isEstimated,
    statusText: status === 'P' ? 'Presente' : status === 'L' ? 'Tardanza' : 'Ausente',
    currentTime: now.format('HH:mm:ss')
  };
  
  console.log('📋 Resultado final del turno:', result);
  
  return result;
};

/**
 * Obtiene información detallada del turno para mostrar en la UI
 */
export const getShiftDisplayInfo = () => {
  const shiftInfo = getCurrentShift();
  
  let badgeColor = 'default';
  let displayMessage = '';
  let toleranceMessage = '';
  
  // Determinar color y mensaje basado en el estado
  if (shiftInfo.isEstimated) {
    badgeColor = 'warning';
    displayMessage = `${shiftInfo.shiftName} (Estimado)`;
    toleranceMessage = 'Horario estimado - fuera de horarios oficiales';
  } else {
    switch (shiftInfo.status) {
      case 'P':
        badgeColor = 'success';
        displayMessage = `${shiftInfo.shiftName} - A Tiempo`;
        toleranceMessage = `Dentro del horario (${shiftInfo.startTime} - ${shiftInfo.endTime})`;
        break;
      case 'L':
        badgeColor = 'warning';
        displayMessage = `${shiftInfo.shiftName} - Tardanza`;
        toleranceMessage = `Fuera de tolerancia (${shiftInfo.toleranceMinutes} min)`;
        break;
      case 'A':
        badgeColor = 'error';
        displayMessage = `${shiftInfo.shiftName} - Fuera de Horario`;
        toleranceMessage = `Horario: ${shiftInfo.startTime} - ${shiftInfo.endTime}`;
        break;
    }
  }
  
  return {
    ...shiftInfo,
    badgeColor,
    displayMessage,
    toleranceMessage
  };
};
