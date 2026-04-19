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
