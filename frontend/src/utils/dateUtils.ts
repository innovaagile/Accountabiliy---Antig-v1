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
