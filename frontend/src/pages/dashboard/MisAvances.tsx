import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/config';
import { Award, Zap, Activity, Target, Flame, Compass, Quote, Check, Clock, Calendar, Info } from 'lucide-react';

export const MisAvances = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const res = await apiFetch(`/coachees/${user.id}`);
                const result = await res.json();
                setData(result);
            } catch (error) {
                console.error("Error al cargar datos del coachee:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#E6E9E1] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#A9D42C] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return null;

    const { xpTotal = 0, rachaActual = 0, nivelDetalle } = data;
    const activeCiclo = data.ciclos?.find((c: any) => c.estado === 'ACTIVO' && c.activo);

    // Calcular XP para el siguiente nivel
    const calculateProgress = (xp: number) => {
        let min = 0; let max = 100;
        if (xp >= 1500) { min = 1500; max = 3000; }
        else if (xp >= 700) { min = 700; max = 1500; }
        else if (xp >= 300) { min = 300; max = 700; }
        else if (xp >= 100) { min = 100; max = 300; }
        else { min = 0; max = 100; }

        const progress = Math.min(100, Math.max(0, ((xp - min) / (max - min)) * 100));
        return { progress, max, faltante: max - xp };
    };

    const { progress, max, faltante } = calculateProgress(xpTotal);

    // Tracción de Hoy (Simplificada para el MVP visual)
    const tareasHoy = 3; // Placeholder para la UI (idealmente se calcularía filtrando tareas activas)
    const completadasHoy = 1; // Placeholder
    
    // Comodines
    const totalComodines = activeCiclo ? Math.round((activeCiclo.totalDias / 20) * 3) : 3;
    const comodinesUsados = activeCiclo?.comodinesUsados || 0;
    const cicloProgreso = activeCiclo ? Math.round((activeCiclo.diaHabilActual / activeCiclo.totalDias) * 100) : 0;

    // Lógica para Mapa de Calor (Marco 5)
    const generateHeatmapDays = () => {
        if (!activeCiclo) return [];
        const days = [];
        const today = new Date();
        const diasSemanas = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
        
        // Mock data forces scenarios
        const mockScenarios = [
            { total: 3, realizadas: 1 }, // Día X: < 33% (Rojo)
            { total: 3, realizadas: 2 }, // Día Y: ~66% (Amarillo)
            { total: 3, realizadas: 3 }, // Día Z: 100% (Verde)
            { total: 4, realizadas: 1 }, // 25% (Rojo)
            { total: 4, realizadas: 4 }, // 100% (Verde)
            { total: 2, realizadas: 2 }, // 100% (Hoy)
            { total: 3, realizadas: 0 }, // Futuro
            { total: 3, realizadas: 0 }  // Futuro
        ];

        let baseDate = new Date(today);
        baseDate.setDate(today.getDate() - 5);

        for (let i = 0; i < 8; i++) {
            // Avanzar fecha saltando fines de semana
            while (baseDate.getDay() === 0 || baseDate.getDay() === 6) {
                baseDate.setDate(baseDate.getDate() + 1);
            }
            const dateObj = new Date(baseDate);

            const isPast = i < 5;
            const isToday = i === 5;
            const isFuture = i > 5;
            
            const total = mockScenarios[i].total;
            const realizadas = isFuture ? 0 : mockScenarios[i].realizadas;
            const porcentaje = isFuture ? 0 : Math.round((realizadas / total) * 100);
            
            let colorClass = 'bg-gray-200';
            if (!isFuture) {
                if (porcentaje < 33) colorClass = 'bg-red-500';
                else if (porcentaje <= 66) colorClass = 'bg-yellow-400';
                else colorClass = 'bg-[#A9D42C]';
            }

            days.push({
                date: dateObj,
                labelDia: diasSemanas[dateObj.getDay()],
                labelNum: dateObj.getDate(),
                isPast,
                isToday,
                isFuture,
                total,
                realizadas,
                porcentaje,
                colorClass
            });
            baseDate.setDate(baseDate.getDate() + 1);
        }
        return days;
    };
    
    const heatmapDays = generateHeatmapDays();
    const pastAndToday = heatmapDays.filter(d => d.isPast || d.isToday);
    const realizadasTotales = pastAndToday.reduce((acc, d) => acc + d.realizadas, 0);
    const tareasDebidasTotales = pastAndToday.reduce((acc, d) => acc + d.total, 0);
    const porcentajeCompromiso = tareasDebidasTotales > 0 ? Math.round((realizadasTotales / tareasDebidasTotales) * 100) : 0;
    
    const formatMes = (date: Date) => date.toLocaleString('es-ES', { month: 'long' });
    const fechaInicioStr = activeCiclo ? new Date(activeCiclo.fechaInicio) : new Date();
    const hoyStr = new Date();

    return (
        <div className="min-h-screen bg-[#E6E9E1] text-[#1B254B] font-['Plus_Jakarta_Sans',_sans-serif]">
            <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
                {/* MARCO 1: Cabecera y Rango */}
                <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    {/* Decoración */}
                    <div 
                        className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                        style={{ backgroundColor: nivelDetalle?.color || '#9CA3AF' }}
                    ></div>

                    <div className="w-24 h-24 rounded-full bg-[#eef7d5] border-4 shadow-sm flex items-center justify-center flex-shrink-0 z-10" style={{ borderColor: '#A9D42C' }}>
                        <Award className="w-10 h-10 text-[#A9D42C]" />
                    </div>
                    
                    <div className="flex-1 z-10 text-center md:text-left w-full">
                        <h2 className="text-3xl font-black mb-2">
                            <span className="text-gray-900">¡Hola, </span>
                            <span className="text-[#A9D42C]">{data.nombre}</span>
                            <span className="text-gray-900">!</span>
                        </h2>
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                            <span 
                                className="px-4 py-1.5 rounded-full text-sm font-black text-white shadow-sm"
                                style={{ backgroundColor: nivelDetalle?.color || '#9CA3AF' }}
                            >
                                Rango: {nivelDetalle?.nivel || 'Novato'}
                            </span>
                            <span className="text-sm font-bold text-gray-500">{xpTotal} XP Total</span>
                        </div>
                        
                        <div className="w-full">
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                <span>Progreso al siguiente nivel</span>
                                <span>{faltante > 0 ? `${faltante} XP restantes` : '¡Nivel Máximo!'}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out bg-[#A9D42C]"
                                    style={{ 
                                        width: `${progress}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MARCO 2: Frase Motivacional */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-4">
                    <Quote className="w-8 h-8 text-[#A9D42C] opacity-80 shrink-0" />
                    <p className="text-gray-600 text-lg font-bold italic">
                        "El éxito es la suma de pequeños esfuerzos repetidos día tras día."
                    </p>
                </div>

                {/* Grid Inferior - Marco 3: Tarjetas de Estado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Racha */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">RACHA ACTUAL</h3>
                            <div className="text-4xl font-black text-[#1B254B] mb-2">{rachaActual}</div>
                            <p className="text-xs text-gray-400 font-bold">Días seguidos con al menos 1 tarea realizada</p>
                        </div>

                        {/* Tracción */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-[#eef7d5] rounded-full flex items-center justify-center mb-4">
                                <Activity className="w-6 h-6 text-[#A9D42C]" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">TRACCIÓN DE HOY</h3>
                            <div className="text-4xl font-black text-[#1B254B] mb-2">{completadasHoy}/{tareasHoy}</div>
                            <p className="text-xs text-gray-400 font-bold">Tareas completadas hoy</p>
                        </div>

                        {/* Avance Ciclo */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <Compass className="w-6 h-6 text-purple-500" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">DÍAS QUE LLEVAS DEL CICLO</h3>
                            <div className="text-4xl font-black text-[#1B254B] mb-2">
                                {activeCiclo?.diaHabilActual || 0} <span className="text-2xl text-gray-400">/ {activeCiclo?.totalDias || 0}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-bold">Progreso en días hábiles</p>
                        </div>
                    </div>

                {/* MARCO 4: Comodines (Horizontal Full Width) */}
                <div className="bg-white w-full rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-black text-[#1B254B] mb-1 flex items-center justify-center md:justify-start gap-2">
                            <Zap className="w-5 h-5 text-[#A9D42C]" />
                            Comodines del Ciclo
                        </h3>
                        <p className="text-sm text-gray-500 font-bold">
                            Úsalos con cuidado pero con libertad en caso de que tengas un día difícil
                        </p>
                    </div>
                    
                    <div className="flex gap-4 shrink-0">
                        {Array.from({ length: totalComodines }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                                    i < comodinesUsados 
                                        ? 'bg-gray-100 border-gray-200 opacity-50' 
                                        : 'bg-white border-[#A9D42C] shadow-sm shadow-[#A9D42C]/20'
                                }`}
                            >
                                <Zap className={`w-6 h-6 ${i < comodinesUsados ? 'text-gray-300' : 'text-[#A9D42C] fill-[#A9D42C]'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MARCO 5: Heatmap de Compromiso */}
                {activeCiclo && (
                    <div className="bg-white w-full rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                        {/* Cabecera Heatmap */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h3 className="text-xl font-black text-[#1B254B] mb-2 flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-[#A9D42C]" />
                                    Compromiso: Porcentaje al día de hoy
                                </h3>
                                <p className="text-sm text-gray-500 font-bold">
                                    Progreso desde el {fechaInicioStr.getDate()} de {formatMes(fechaInicioStr)} al {hoyStr.getDate()} de {formatMes(hoyStr)}
                                </p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl px-6 py-4 border border-gray-100 shrink-0 text-center flex flex-col items-center justify-center relative group">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Compromiso</span>
                                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                </div>
                                <span className="text-3xl font-black text-[#A9D42C] leading-none">{porcentajeCompromiso}%</span>
                                
                                {/* Tooltip on hover */}
                                <div className="absolute top-full mt-2 w-64 bg-[#1B254B] text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg pointer-events-none">
                                    Cálculo: Total de tareas logradas dividido por las tareas que debías hacer hasta hoy.
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1B254B] rotate-45"></div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfico Heatmap */}
                        <div className="w-full overflow-x-auto pb-6 custom-scrollbar relative">
                            {/* Líneas de Fondo (Guías Horizontales) */}
                            <div className="absolute inset-0 w-full min-w-max pointer-events-none z-0">
                                <div className="absolute w-full border-b border-dashed border-gray-200 bottom-[calc(4.5rem+10rem)]"></div>
                                <div className="absolute w-full border-b border-dashed border-gray-200 bottom-[calc(4.5rem+7.5rem)]"></div>
                                <div className="absolute w-full border-b border-dashed border-gray-200 bottom-[calc(4.5rem+5rem)]"></div>
                                <div className="absolute w-full border-b border-dashed border-gray-200 bottom-[calc(4.5rem+2.5rem)]"></div>
                            </div>

                            <div className="flex gap-8 min-w-max items-end relative z-10 pt-8">
                                {heatmapDays.map((day, idx) => {
                                    // Altura base: 2.5rem por cada tarea.
                                    const heightRem = day.total * 2.5;
                                    
                                    return (
                                        <div key={idx} className="flex flex-col items-center w-[11%] min-w-[70px] max-w-[90px] shrink-0">
                                            
                                            {/* Etiqueta Superior */}
                                            <span className="text-xs font-bold text-gray-500 mb-2">
                                                {day.isFuture ? '-' : `${day.realizadas}/${day.total}`}
                                            </span>

                                            {/* Barra Vertical (Altura Dinámica según total de tareas) */}
                                            <div 
                                                className="w-14 bg-gray-100 rounded-full overflow-hidden relative shadow-inner mb-4 flex items-end justify-center"
                                                style={{ height: `${heightRem}rem` }}
                                            >
                                                <div 
                                                    className={`w-full rounded-full transition-all duration-500 flex flex-col justify-end pb-2 ${day.colorClass}`}
                                                    style={{ height: day.isFuture ? '0%' : `${day.porcentaje}%` }}
                                                >
                                                    {!day.isFuture && day.porcentaje > 20 && (
                                                        <span className="text-[10px] font-black text-white text-center w-full block drop-shadow-sm">
                                                            {day.porcentaje}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Fecha Inferior */}
                                            <span className={`text-xs font-black mb-2 text-center text-blue-900`}>
                                                {day.labelDia} <br/> {day.labelNum}
                                            </span>

                                            {/* Ícono de Estado */}
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                {day.isPast && <Check className="w-5 h-5 text-[#A9D42C]" />}
                                                {day.isToday && <div className="w-3 h-3 bg-white border-2 border-blue-900 rounded-full shadow-sm"></div>}
                                                {day.isFuture && <Clock className="w-4 h-4 text-gray-300" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
