"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularDiaHabilActual = exports.calcularFechaFinHabil = void 0;
const calcularFechaFinHabil = (fechaInicio, diasHabiles) => {
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
exports.calcularFechaFinHabil = calcularFechaFinHabil;
const calcularDiaHabilActual = (fechaInicio, fechaActual) => {
    let count = 0;
    let currentDate = new Date(fechaInicio);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(fechaActual);
    endDate.setHours(0, 0, 0, 0);
    if (endDate < currentDate)
        return 0;
    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
};
exports.calcularDiaHabilActual = calcularDiaHabilActual;
