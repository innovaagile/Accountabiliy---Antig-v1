import Holidays from 'date-holidays';

export const getCountryCodeFromPhone = (phone?: string | null): string => {
    if (!phone) return 'CL';
    const cleanPhone = phone.replace(/\\D/g, '');
    if (cleanPhone.startsWith('56')) return 'CL';
    if (cleanPhone.startsWith('52')) return 'MX';
    if (cleanPhone.startsWith('54')) return 'AR';
    if (cleanPhone.startsWith('51')) return 'PE';
    if (cleanPhone.startsWith('57')) return 'CO';
    if (cleanPhone.startsWith('34')) return 'ES';
    if (cleanPhone.startsWith('1')) return 'US';
    return 'CL';
};

export const isRestDay = (date: Date, phone?: string | null): boolean => {
    // --- TEMPORARY MOCK PARA PRUEBA DE FERIADO EN PRODUCCIÓN ---
    // Forzamos que retorne true para simular un feriado legal.
    return true;
    // -----------------------------------------------------------

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
    }
    
    const countryCode = getCountryCodeFromPhone(phone);
    const hd = new Holidays(countryCode);
    const holidays = hd.isHoliday(date);
    
    if (!holidays) return false;
    
    return (holidays as any[]).some((h: any) => h.type === 'public');
};

export const calcularFechaFinHabil = (fechaInicio: Date, diasHabiles: number, phone?: string | null): Date => {
  const fechaFin = new Date(fechaInicio);
  let diasSumados = 0;

  while (diasSumados < diasHabiles) {
    fechaFin.setDate(fechaFin.getDate() + 1);
    if (!isRestDay(fechaFin, phone)) {
      diasSumados++;
    }
  }

  return fechaFin;
};

export const calcularDiaHabilActual = (fechaInicio: Date, fechaActual: Date, phone?: string | null): number => {
  let count = 0;
  let currentDate = new Date(fechaInicio);
  currentDate.setHours(0, 0, 0, 0);
  const endDate = new Date(fechaActual);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < currentDate) return 0;

  while (currentDate <= endDate) {
    if (!isRestDay(currentDate, phone)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};
