export const contarDiasHabiles = (fechaInicio: string | Date, fechaFin: string | Date): number => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let dias = 0;
    
    // Reset time to avoid edge cases
    inicio.setHours(0,0,0,0);
    fin.setHours(0,0,0,0);

    if (fin < inicio) return 0;

    const actual = new Date(inicio);
    
    while (actual <= fin) {
        const d = actual.getDay();
        // 0 = Sunday, 6 = Saturday
        if (d !== 0 && d !== 6) {
            dias++;
        }
        actual.setDate(actual.getDate() + 1);
    }
    
    return dias;
};

export const obtenerDiaHabilAnterior = (fechaActual: Date = new Date()): Date => {
  const diaAnterior = new Date(fechaActual);
  diaAnterior.setHours(0, 0, 0, 0);

  do {
    diaAnterior.setDate(diaAnterior.getDate() - 1);
  } while (diaAnterior.getDay() === 0 || diaAnterior.getDay() === 6);

  return diaAnterior;
};

export const formatearFechaOpcionesComodin = () => {
  const hoy = new Date();
  const ayer = obtenerDiaHabilAnterior(hoy);

  const opciones = { month: 'short', day: 'numeric' } as const;

  return {
    hoy: {
      etiqueta: `Hoy, ${hoy.toLocaleDateString('es-ES', opciones)}`,
      valor: hoy.toISOString()
    },
    ayer: {
      etiqueta: `Ayer, ${ayer.toLocaleDateString('es-ES', opciones)}`,
      valor: ayer.toISOString()
    }
  };
};
