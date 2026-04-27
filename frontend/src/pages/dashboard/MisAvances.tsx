import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/config';
import { Award, Zap, Activity, Target, Flame, Compass, Quote, Check, Clock, Calendar, Info, ListChecks, BookOpen, Bell, ChevronDown, ChevronUp, Star, Shield, Trophy } from 'lucide-react';

export const MisAvances = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
    
    // El estado de recordatorio se inicializa con el useEffect cuando llegan los datos
    const [recordatorio, setRecordatorio] = useState('UNA_VEZ');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const res = await apiFetch(`/coachees/${user.id}`);
                const result = await res.json();
                setData(result);
                
                // Inicializar lógica de recordatorios según el plan
                const plan = result.servicioContratado || user.servicioContratado || "SPRINT_4S";
                if (plan === 'EXECUTIVE') {
                    setRecordatorio('CADA_VEZ');
                } else {
                    setRecordatorio('UNA_VEZ');
                }
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

    const userPlan = data.servicioContratado || user?.servicioContratado || "SPRINT_4S";
    const isExecutive = userPlan === 'EXECUTIVE';

    const toggleTask = (id: number) => {
        setExpandedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    // MOCK DE DATOS: Tareas (Marco 6)
    const tareasMock = [
        { id: 1, nombre: "Tomar 2 litros de agua", esHoy: true, completadaHoy: true, semanaRealizadas: 4, semanaTotal: 5, cicloRealizadas: 12, cicloTotal: 17, isSemanal: false },
        { id: 2, nombre: "Leer 10 páginas", esHoy: true, completadaHoy: false, semanaRealizadas: 1, semanaTotal: 5, cicloRealizadas: 5, cicloTotal: 17, isSemanal: false },
        { id: 3, nombre: "Meditar 10 mins", esHoy: true, completadaHoy: false, semanaRealizadas: 3, semanaTotal: 5, cicloRealizadas: 10, cicloTotal: 17, isSemanal: false },
        { id: 4, nombre: "Revisión semanal", esHoy: false, fechaProximoDia: 'VIE 30', completadaHoy: false, semanaRealizadas: 1, semanaTotal: 1, cicloRealizadas: 3, cicloTotal: 3, isSemanal: true }
    ];

    const getEstadoDiaMessage = (tarea: any) => {
        if (!tarea.esHoy) {
            return <span className="text-gray-500">Tranquilo, esta tarea es para el día {tarea.fechaProximoDia} 🗓️</span>;
        }
        if (completadasHoy === 0) {
            return <span className="text-gray-600">Recuerda no dejar para mañana lo que debes hacer hoy 📋</span>;
        } else if (completadasHoy > 0 && completadasHoy < tareasHoy) {
            return <span className="text-blue-600">¡Felicitaciones, ya empezaste! Solo falta un poco de esfuerzo hoy 🚀</span>;
        } else {
            return <span className="text-[#A9D42C]">¡Lo lograste! La práctica y consistencia es la clave para alcanzar tus objetivos ✅</span>;
        }
    };

    const getColorClass = (porcentaje: number) => {
        if (porcentaje < 33) return 'text-red-500';
        if (porcentaje <= 66) return 'text-yellow-500';
        return 'text-[#A9D42C]';
    };

    // MOCK DE DATOS: Sabidurías (Marco 7)
    const sabiduriasMock = [
        { id: 1, nombre: "Tomar 2 litros de agua", reflexiones: [ { fecha: '12 de Abril', texto: 'Me costó en la mañana, pero logré terminar la botella antes de cenar.' }, { fecha: '14 de Abril', texto: 'Hoy fue más fácil, combiné el agua con rodajas de limón.' } ] },
        { id: 2, nombre: "Leer 10 páginas", reflexiones: [ { fecha: '13 de Abril', texto: 'Leí un capítulo extra porque la historia estaba interesante.' } ] },
        { id: 3, nombre: "Meditar 10 mins", reflexiones: [] },
        { id: 4, nombre: "Revisión semanal", reflexiones: [ { fecha: '15 de Abril', texto: 'Anoté todos mis gastos. Siento más control sobre mi presupuesto.' } ] }
    ];

    // MOCK DE DATOS: Medallas (Marco 9)
    const medallasMock = [
        { id: 1, nombre: "Primeros Pasos", descripcion: "Lograste romper la inercia y completaste las tareas de tu primer día.", icono: Star, colorBase: "bg-blue-50", colorIcono: "text-blue-500", ganada: true },
        { id: 2, nombre: "Semana de Fuego", descripcion: "Alcanzaste una racha de 7 días ininterrumpidos.", icono: Flame, colorBase: "bg-orange-50", colorIcono: "text-orange-500", ganada: true },
        { id: 3, nombre: "Constancia Pura", descripcion: "Completaste el 80% de tus tareas en la primera mitad del ciclo.", icono: Activity, colorBase: "bg-[#eef7d5]", colorIcono: "text-[#A9D42C]", ganada: false },
        { id: 4, nombre: "Maestro del Hábito", descripcion: "Conseguiste completar todas tus tareas diarias y semanales durante 14 días.", icono: Shield, colorBase: "bg-purple-50", colorIcono: "text-purple-500", ganada: false },
        { id: 5, nombre: "Leyenda", descripcion: "Terminaste el ciclo con el 100% de compromiso y sin usar comodines.", icono: Trophy, colorBase: "bg-yellow-50", colorIcono: "text-yellow-500", ganada: false }
    ];

    const medallasGanadas = medallasMock.filter(m => m.ganada);

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

                {/* MARCO 6: Análisis de Tareas */}
                <div className="bg-white w-full rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                    <h3 className="text-xl font-black text-[#1B254B] mb-6 flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-[#A9D42C]" />
                        Análisis Detallado por Tarea
                    </h3>
                    
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-1/4">Tarea</th>
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-2/5">Estado del día</th>
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm text-center w-1/6">Última Semana</th>
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm text-center w-1/6">Ciclo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tareasMock.map((tarea, idx) => {
                                    const semPorcentaje = Math.round((tarea.semanaRealizadas / tarea.semanaTotal) * 100);
                                    const cicloPorcentaje = Math.round((tarea.cicloRealizadas / tarea.cicloTotal) * 100);

                                    return (
                                        <tr key={tarea.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5 pr-4">
                                                <span className="font-bold text-[#1B254B] block">{tarea.nombre}</span>
                                                {tarea.isSemanal && <span className="text-xs font-bold text-gray-400">Semanal</span>}
                                            </td>
                                            <td className="py-5 pr-4 text-sm font-medium">
                                                {getEstadoDiaMessage(tarea)}
                                            </td>
                                            <td className="py-5 px-2 text-center">
                                                <div className={`text-2xl font-black ${getColorClass(semPorcentaje)}`}>{semPorcentaje}%</div>
                                                <div className="text-xs font-bold text-gray-400">{tarea.semanaRealizadas}/{tarea.semanaTotal}</div>
                                            </td>
                                            <td className="py-5 px-2 text-center">
                                                <div className={`text-2xl font-black ${getColorClass(cicloPorcentaje)}`}>{cicloPorcentaje}%</div>
                                                <div className="text-xs font-bold text-gray-400">{tarea.cicloRealizadas}/{tarea.cicloTotal}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MARCO 7: Tus Sabidurías (Full Width) */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col w-full">
                        <h3 className="text-xl font-black text-[#1B254B] mb-1 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-[#A9D42C]" />
                            Tus Sabidurías
                        </h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">
                            Historial de aprendizajes y reflexiones
                        </p>

                        <div className="space-y-4 flex-1">
                            {sabiduriasMock.map((tarea) => {
                                const isExpanded = expandedTasks.includes(tarea.id);
                                return (
                                    <div key={tarea.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                        <button 
                                            onClick={() => toggleTask(tarea.id)}
                                            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
                                        >
                                            <span className="font-bold text-[#1B254B] text-left">{tarea.nombre}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                                    {tarea.reflexiones.length} entradas
                                                </span>
                                                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
                                                {tarea.reflexiones.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {tarea.reflexiones.map((ref, idx) => (
                                                            <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block">
                                                                    {ref.fecha}
                                                                </span>
                                                                <p className="text-sm text-gray-600 font-medium italic">
                                                                    "{ref.texto}"
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic py-2 text-center">
                                                        Aún no has registrado aprendizajes para esta tarea.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                {/* GRID INFERIOR: Marcos 8 y 9 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* MARCO 8: Recordatorios */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col h-full">
                        <h3 className="text-xl font-black text-[#1B254B] mb-6 flex items-center gap-2">
                            <Bell className="w-6 h-6 text-[#A9D42C]" />
                            Recordatorios
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                            {/* Opción A */}
                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${recordatorio === 'CADA_VEZ' ? 'border-[#A9D42C] bg-[#eef7d5]/50' : 'border-gray-100 bg-white'} ${!isExecutive ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <div className="mt-0.5">
                                    <input 
                                        type="radio" 
                                        name="recordatorio" 
                                        value="CADA_VEZ"
                                        checked={recordatorio === 'CADA_VEZ'}
                                        onChange={() => setRecordatorio('CADA_VEZ')}
                                        disabled={!isExecutive}
                                        className="w-5 h-5 accent-[#A9D42C] border-gray-300 focus:ring-[#A9D42C] cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <span className={`block font-bold ${recordatorio === 'CADA_VEZ' ? 'text-[#1B254B]' : 'text-gray-500'}`}>
                                        Cada vez que debo hacer uno de mis compromisos
                                    </span>
                                    {isExecutive && recordatorio === 'CADA_VEZ' && (
                                        <span className="text-xs text-[#A9D42C] font-bold mt-1 block">Opción recomendada</span>
                                    )}
                                </div>
                            </label>

                            {/* Opción B */}
                            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${recordatorio === 'UNA_VEZ' ? 'border-[#A9D42C] bg-[#eef7d5]/50' : 'border-gray-100 bg-white'}`}>
                                <div className="mt-0.5">
                                    <input 
                                        type="radio" 
                                        name="recordatorio" 
                                        value="UNA_VEZ"
                                        checked={recordatorio === 'UNA_VEZ'}
                                        onChange={() => setRecordatorio('UNA_VEZ')}
                                        className="w-5 h-5 accent-[#A9D42C] border-gray-300 focus:ring-[#A9D42C] cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <span className={`block font-bold ${recordatorio === 'UNA_VEZ' ? 'text-[#1B254B]' : 'text-gray-500'}`}>
                                        Una vez al día
                                    </span>
                                    {!isExecutive && recordatorio === 'UNA_VEZ' && (
                                        <span className="text-xs text-gray-400 font-bold mt-1 block">Configuración predeterminada de tu plan</span>
                                    )}
                                </div>
                            </label>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed italic">
                                «Entiendo que puede ser aburrido recibir un mensaje cada vez, pero en el peor escenario será 5 veces al día. Nuestro cerebro prioriza lo que ve, por eso te aconsejo sinceramente mantener la opción "Cada vez que debo hacer uno de mis compromisos".»
                            </p>
                        </div>
                    </div>

                {/* MARCO 9: Tus Medallas */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col h-full">
                    <h3 className="text-xl font-black text-[#1B254B] mb-2 flex items-center gap-2">
                        <Award className="w-6 h-6 text-[#A9D42C]" />
                        Tus Medallas
                    </h3>
                    <p className="text-sm text-gray-500 font-bold mb-8">
                        Reconocimientos por tus logros excepcionales
                    </p>

                    {/* Vitrina Superior (Medallas Ganadas) */}
                    <div className="bg-[#F4F5F7] rounded-2xl p-8 mb-8 border border-gray-100 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
                        {medallasGanadas.length === 0 ? (
                            <div className="text-center opacity-60">
                                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest block">Sin medallas aún</span>
                            </div>
                        ) : (
                            <div className="w-full flex flex-wrap justify-center items-center gap-8 relative z-10">
                                {medallasGanadas.map(m => {
                                    const IconComponent = m.icono;
                                    return (
                                        <div key={m.id} className="flex flex-col items-center group">
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md mb-3 transition-transform group-hover:scale-110 ${m.colorBase}`}>
                                                <IconComponent className={`w-10 h-10 ${m.colorIcono}`} />
                                            </div>
                                            <span className="text-xs font-black text-[#1B254B] text-center max-w-[90px] uppercase tracking-wider">{m.nombre}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* Decoración de fondo de la vitrina */}
                        {medallasGanadas.length > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
                        )}
                    </div>

                    {/* Guía Inferior (Glosario de Medallas) */}
                    <div>
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">
                            Guía de Trofeos
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {medallasMock.map(m => {
                                const IconComponent = m.icono;
                                const isLocked = !m.ganada;
                                
                                return (
                                    <div key={m.id} className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-50 bg-white transition-all group ${isLocked ? 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100' : 'shadow-sm'}`}>
                                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${m.colorBase}`}>
                                            <IconComponent className={`w-5 h-5 ${m.colorIcono}`} />
                                        </div>
                                        <span className="block text-center font-black text-[#1B254B] text-[10px] uppercase tracking-wider">{m.nombre}</span>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1B254B] text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl pointer-events-none text-center font-medium leading-relaxed">
                                            {m.descripcion}
                                            {/* Triangulito del tooltip */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1B254B]"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* CIERRE DEL GRID INFERIOR */}
                </div>

            </div>
        </div>
    );
};
