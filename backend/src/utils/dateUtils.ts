export const calcularFechaFinHabil = (fechaInicio: Date, diasHabiles: number): Date => {
  const fechaFin = new Date(fechaInicio);
  let diasSumados = 0;

  while (diasSumados < diasHabiles) {
    fechaFin.setDate(fechaFin.getDate() + 1);
    const day = fechaFin.getDay();
    // 0 es Domingo, 6 es Sabado
    if (day !== 0 && day !== 6) {
      diasSumados++;
    }
  }

  return fechaFin;
};

export const calcularDiaHabilActual = (fechaInicio: Date, fechaActual: Date): number => {
  let count = 0;
  let currentDate = new Date(fechaInicio);
  currentDate.setHours(0, 0, 0, 0);
  const endDate = new Date(fechaActual);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < currentDate) return 0;

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};
