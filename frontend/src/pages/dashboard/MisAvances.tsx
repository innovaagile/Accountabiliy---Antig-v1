import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/config';
import { Award, Zap, Activity, Target, Flame, Compass, Quote, Check, Clock, Calendar, Info, ListChecks, BookOpen, Bell, ChevronDown, ChevronUp, Star, Shield, Trophy, MinusCircle } from 'lucide-react';
import { ComodinModal } from '../../components/dashboard/ComodinModal';
import { formatearFechaOpcionesComodin } from '../../utils/dateUtils';

export const MisAvances = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
    
    // El estado de recordatorio se inicializa con el useEffect cuando llegan los datos
    const [recordatorio, setRecordatorio] = useState('UNA_VEZ');

    const [showComodinModal, setShowComodinModal] = useState(false);
    const [comodinOptions, setComodinOptions] = useState<any>(null);

    const cargarAvances = async () => {
        try {
            // La ruta debe ser limpia. El prefijo global (ej. /api) 
            // debe ser inyectado automáticamente por la utilidad apiFetch.
            const res = await apiFetch(`/coachees/${user.id}/avances`);
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
            console.error("Error al cargar datos de avances:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            cargarAvances();
        }
    }, [user?.id]);

    if (!data || loading) {
        return (
            <div className="min-h-screen bg-[#E6E9E1] flex items-center justify-center">
                Cargando tus avances...
            </div>
        );
    }

    if (!data) return null;

    const { 
        xpTotal = 0, 
        rachaActual = 0, 
        nivelDetalle, 
        activeCiclo,
        heatmapDays = [],
        porcentajeCompromiso = 0,
        tareasMock = [],
        sabiduriasMock = [],
        medallasMock = [],
        comodinesUsados = 0,
        totalComodines = 3,
        completadasHoy = 0,
        tareasHoy = 3
    } = data;

    const calculateProgress = (xp: number) => {
        let min = 0; let max = 150;
        if (xp >= 580) { min = 580; max = 580; }
        else if (xp >= 320) { min = 320; max = 580; }
        else if (xp >= 150) { min = 150; max = 320; }
        else { min = 0; max = 150; }

        let progress = 100;
        if (max > min) {
            progress = Math.min(100, Math.max(0, ((xp - min) / (max - min)) * 100));
        }
        return { progress, max, faltante: xp >= 580 ? 0 : max - xp };
    };

    const { progress, max, faltante } = calculateProgress(xpTotal);
    
    const formatMes = (date: Date) => date.toLocaleString('es-ES', { month: 'long' });
    const fechaInicioStr = activeCiclo ? new Date(activeCiclo.fechaInicio) : new Date();
    const hoyStr = new Date();

    const userPlan = data.servicioContratado || user?.servicioContratado || "SPRINT_4S";
    const isExecutive = userPlan === 'EXECUTIVE';

    const toggleTask = (id: number) => {
        setExpandedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    const handleUseWildcard = () => {
        setComodinOptions(formatearFechaOpcionesComodin());
        setShowComodinModal(true);
    };

    const getEstadoDiaMessage = (tarea: any) => {
        if (tarea.isSemanal && !tarea.esHoy) {
            return (
                <div className="flex items-center gap-2">
                    <MinusCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-bold">Hoy no toca</span>
                </div>
            );
        }

        if (tarea.completadaHoy) {
            return (
                <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#A9D42C]" />
                    <span className="text-[#A9D42C] font-black">Listo</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-500 font-bold">No lo olvides</span>
                </div>
            );
        }
    };

    const getColorClass = (porcentaje: number) => {
        if (porcentaje > 0 && porcentaje < 34) return 'text-red-500';
        if (porcentaje >= 34 && porcentaje < 68) return 'text-yellow-500';
        if (porcentaje >= 68) return 'text-[#A9D42C]';
        return 'text-gray-400'; // Default para 0%
    };

    const getBarColor = (porcentaje: number) => {
        if (porcentaje <= 0) return "bg-gray-200"; // Vacío
        if (porcentaje > 0 && porcentaje < 34) return "bg-red-500"; 
        if (porcentaje >= 34 && porcentaje < 68) return "bg-yellow-500";
        return "bg-[#A9D42C]"; // 68 a 100
    };

    const medallasGanadas = medallasMock.filter((m: any) => m.ganada);

    const getMedalIcon = (iconName: string) => {
        switch (iconName) {
            case 'Star': return Star;
            case 'Flame': return Flame;
            case 'Activity': return Activity;
            case 'Shield': return Shield;
            case 'Trophy': return Trophy;
            default: return Star;
        }
    };

    return (
        <div className="min-h-screen bg-[#E6E9E1] text-[#1B254B] font-['Plus_Jakarta_Sans',_sans-serif]">
            <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
                {/* MARCO 1: Cabecera y Rango */}
                <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative">
                    {/* Contenedor seguro para decoración sin afectar el overflow del Tooltip */}
                    <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
                        <div 
                            className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                            style={{ backgroundColor: nivelDetalle?.color || '#9CA3AF' }}
                        ></div>
                    </div>

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
                            <div className="relative group flex items-center">
                                <span 
                                    className="px-4 py-1.5 rounded-full text-sm font-black text-white shadow-sm cursor-help"
                                    style={{ backgroundColor: nivelDetalle?.color || '#9CA3AF' }}
                                >
                                    Rango: {nivelDetalle?.nivel || 'Novato'}
                                </span>
                                {/* Tooltip Escala de Rangos */}
                                <div className="absolute top-full mt-2 left-0 w-48 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                    <p className="font-bold mb-1">Escala de Rangos:</p>
                                    <ul className="list-disc pl-4 space-y-1 text-gray-200">
                                        <li>Iniciado (0 XP)</li>
                                        <li>Constante (150 XP)</li>
                                        <li>Ejecutivo (320 XP)</li>
                                        <li>Maestro (580 XP)</li>
                                    </ul>
                                </div>
                            </div>
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
                        {Array.from({ length: totalComodines }).map((_, i) => {
                            const isUsed = i < comodinesUsados;
                            return (
                                <button 
                                    key={i} 
                                    disabled={isWeekend || isUsed}
                                    onClick={handleUseWildcard}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                                        isUsed 
                                            ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                                            : isWeekend
                                                ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                                : 'bg-white border-[#A9D42C] shadow-sm shadow-[#A9D42C]/20 hover:bg-[#eef7d5]'
                                    }`}
                                >
                                    <Zap className={`w-6 h-6 ${isUsed ? 'text-gray-300' : 'text-[#A9D42C] fill-[#A9D42C]'}`} />
                                </button>
                            );
                        })}
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
                                {(() => {
                                    const maxTareas = Math.max(...(heatmapDays || []).map((d: any) => d.total), 1);
                                    
                                    return heatmapDays?.map((day: any, idx: number) => {
                                        // Altura visual proporcional al máximo de tareas del ciclo. Techo de 10rem.
                                        const heightRem = day.total > 0 ? (day.total / maxTareas) * 10 : 0.5; // Altura mínima de 0.5rem si es 0
                                    
                                    return (
                                        <div key={idx} className="flex flex-col items-center w-[11%] min-w-[70px] max-w-[90px] shrink-0">
                                            
                                            {/* Etiqueta Superior */}
                                            <span className="text-xs font-bold text-gray-500 mb-2">
                                                {day.isFuture ? '-' : `${day.realizadas}/${day.total}`}
                                            </span>

                                            {/* Barra Vertical (Altura Dinámica según total de tareas) */}
                                            <div 
                                                className={`w-14 bg-gray-100 rounded-full overflow-hidden relative shadow-inner mb-4 flex items-end justify-center ${day.total === 0 ? 'opacity-30' : ''}`}
                                                style={{ height: `${heightRem}rem` }}
                                            >
                                                <div 
                                                    className={`w-full rounded-full transition-all duration-500 flex flex-col justify-end pb-2 ${getBarColor(day.porcentaje)}`}
                                                    style={{ height: day.isFuture ? '0%' : `${Math.min(day.porcentaje, 100)}%` }}
                                                >
                                                    {!day.isFuture && day.porcentaje > 20 && (
                                                        <span className="text-[10px] font-black text-white text-center w-full block drop-shadow-sm">
                                                            {Math.min(day.porcentaje, 100)}%
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
                                });
                            })()}
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
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm w-1/4">Estado del día</th>
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm text-center w-1/4">Consistencia</th>
                                    <th className="pb-4 font-bold text-gray-400 uppercase tracking-wider text-sm text-center w-1/4">Tendencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tareasMock?.map((tarea: any, idx: number) => {
                                    // Protect against division by zero
                                    const aLaFechaPorcentaje = tarea.aLaFechaTotal > 0 ? Math.round((tarea.aLaFechaRealizadas / tarea.aLaFechaTotal) * 100) : 0;

                                    return (
                                        <tr key={tarea.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5 pr-4">
                                                <span className="font-bold text-[#1B254B] block">{tarea.nombre}</span>
                                                <span className="text-xs font-bold text-gray-400">{tarea.isSemanal ? "Semanal - Viernes" : "Diaria"}</span>
                                            </td>
                                            <td className="py-5 pr-4 text-sm font-medium">
                                                {getEstadoDiaMessage(tarea)}
                                            </td>
                                            <td className="py-5 px-2 text-center">
                                                {tarea.aLaFechaTotal === 0 ? (
                                                    <span className="text-gray-400 font-bold">-</span>
                                                ) : (
                                                    <>
                                                        <div className={`text-2xl font-black ${getColorClass(aLaFechaPorcentaje)}`}>{aLaFechaPorcentaje}%</div>
                                                        <div className="text-xs font-bold text-gray-400">{tarea.aLaFechaRealizadas}/{tarea.aLaFechaTotal}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="py-5 px-2">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {tarea.tendencia?.map((color: string, index: number) => (
                                                        <div key={index} className={`w-3 h-3 rounded-full shadow-sm ${color}`}></div>
                                                    ))}
                                                </div>
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
                            {sabiduriasMock?.map((tarea: any) => {
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
                                                        {tarea.reflexiones?.map((ref: any, idx: number) => (
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
                                    const IconComponent = getMedalIcon(m.icono);
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
                            {medallasMock.map((m: any) => {
                                const IconComponent = getMedalIcon(m.icono);
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

            <ComodinModal 
                isOpen={showComodinModal}
                onClose={() => setShowComodinModal(false)}
                comodinOptions={comodinOptions}
                coacheeId={user?.id || ''}
                cicloId={activeCiclo?.id}
                onSuccess={cargarAvances}
            />
        </div>
    );
};
