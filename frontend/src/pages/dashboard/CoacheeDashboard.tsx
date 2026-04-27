import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/config';
import { 
  CheckCircle2, Clock, Calendar, Star, Target, Zap, 
  ChevronRight, Check, Briefcase, Smile, MessageCircle, AlertTriangle 
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const CoacheeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coachee, setCoachee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Normalizar hoy para comparar cumplimientos
  const hoyStr = new Date().toISOString().split('T')[0];
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  const isFriday = new Date().getDay() === 5;

  useEffect(() => {
    if (user?.id) {
      fetchCoacheeData();
    }
  }, [user]);

  const fetchCoacheeData = async () => {
    try {
      const res = await apiFetch(`/coachees/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setCoachee(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (tareaId: string, cicloId: string, completada: boolean) => {
    try {
      // Optimistic update
      setCoachee((prev: any) => {
        if (!prev) return prev;
        const newCoachee = { ...prev };
        const ciclo = newCoachee.ciclos.find((c: any) => c.id === cicloId);
        if (ciclo) {
          const tarea = ciclo.tareas.find((t: any) => t.id === tareaId);
          if (tarea) {
            let cumpl = tarea.cumplimientos?.find((c: any) => c.fecha.startsWith(hoyStr));
            if (cumpl) {
              cumpl.completada = completada;
            } else {
              if (!tarea.cumplimientos) tarea.cumplimientos = [];
              tarea.cumplimientos.push({
                fecha: new Date().toISOString(),
                completada,
                aprendizajeDia: ''
              });
            }
          }
        }
        return newCoachee;
      });

      await apiFetch(`/coachees/${user?.id}/ciclos/${cicloId}/tareas/${tareaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada })
      });
    } catch (error) {
      console.error('Error toggling task:', error);
      fetchCoacheeData(); // Revert on error
    }
  };

  const handleSaveReflection = async (tareaId: string, cicloId: string, aprendizajeDia: string) => {
    try {
      await apiFetch(`/coachees/${user?.id}/ciclos/${cicloId}/tareas/${tareaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprendizajeDia })
      });
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  const handleUseWildcard = async () => {
    // Evita la mutación doble en modo estricto creando un objeto inmutable
    setCoachee((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        ciclos: prev.ciclos.map((c: any) => 
          c.activo ? { ...c, comodinesUsados: c.comodinesUsados + 1 } : c
        )
      };
    });
    // Se debería enviar al backend si tuviéramos un endpoint para comodines
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A9D42C]"></div>
      </div>
    );
  }

  const activeCiclo = coachee?.ciclos?.find((c: any) => c.activo);
  const totalDias = activeCiclo?.totalDias ?? 0;
  const diaHabilActual = activeCiclo?.diaHabilActual ?? 0;
  const comodinesUsados = activeCiclo?.comodinesUsados ?? 0;
  
  // Cálculo matemático de comodines: 3 por cada 20 días
  const totalComodines = totalDias > 0 ? Math.round((totalDias / 20) * 3) : 3;

  const tareasDiarias = activeCiclo?.tareas?.filter((t: any) => t.periodicidad === 'DIARIA' && t.activa) || [];
  const tareasSemanales = activeCiclo?.tareas?.filter((t: any) => t.periodicidad === 'SEMANAL' && t.activa) || [];

  const getCumplimientoHoy = (tarea: any) => {
    return tarea.cumplimientos?.find((c: any) => c.fecha.startsWith(hoyStr)) || { completada: false, aprendizajeDia: '' };
  };

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || CheckCircle2;
    return <Icon className="w-5 h-5 text-gray-500" />;
  };

  const renderTareas = (titulo: string, tareas: any[]) => {
    if (tareas.length === 0) return null;
    
    const completadasHoy = tareas.filter(t => getCumplimientoHoy(t).completada).length;
    
    return (
      <div className="mb-10 mt-0">
        <h3 className="text-xl font-black text-[#1B254B] mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
          <div className="flex items-center gap-2">
            {titulo === 'DIARIA' ? <Target className="text-[#A9D42C]" /> : <Calendar className="text-[#A9D42C]" />}
            {titulo === 'DIARIA' ? 'Tus tareas diarias' : 'Las tareas de la semana'}
          </div>
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">
            {completadasHoy}/{tareas.length}
          </span>
        </h3>
        <div className="space-y-4">
          {tareas.map(tarea => {
            const cumplimiento = getCumplimientoHoy(tarea);
            const isCompleted = cumplimiento.completada;

            return (
              <div key={tarea.id} className="bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(112,144,176,0.08)] border border-gray-50 flex gap-4 transition-all hover:shadow-[0_15px_40px_rgba(112,144,176,0.12)]">
                <button 
                  onClick={() => handleToggleTask(tarea.id, activeCiclo.id, !isCompleted)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${isCompleted ? 'bg-[#A9D42C] border-[#A9D42C]' : 'border-gray-300 hover:border-[#A9D42C]'}`}
                >
                  {isCompleted && <Check className="w-5 h-5 text-white" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-50 rounded-lg">
                        {renderIcon(tarea.icono || 'CheckCircle')}
                      </div>
                      <h4 className={`text-lg font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-[#1B254B]'}`}>
                        {tarea.nombre}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded-md mb-1">
                        {titulo === 'DIARIA' ? 'DIARIA' : 'SEMANAL'}
                      </span>
                      {tarea.horaProgramada && (
                        <span className="text-sm font-semibold text-[#A9D42C] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {tarea.horaProgramada}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Estructura Visual de la Tarea Mejorada */}
                  <div className="mt-2 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-[#1B254B]">Acción:</span> {tarea.accion || tarea.descripcion}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-[#1B254B]">Forma de medir:</span> {tarea.medicion || 'Registro de aprendizaje'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <input 
                      type="text" 
                      placeholder="Anota tus aprendizajes del día aquí..." 
                      defaultValue={cumplimiento.aprendizajeDia || ''}
                      onBlur={(e) => handleSaveReflection(tarea.id, activeCiclo.id, e.target.value)}
                      className="w-full text-sm text-gray-600 outline-none border-b border-gray-200 focus:border-[#A9D42C] py-2 bg-transparent transition-colors placeholder-gray-300"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-10 mt-8">
        <h1 className="text-3xl font-black text-[#1B254B]">
            Hola, {user?.nombre || 'Coachee'} 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Este es tu Panel Estratégico. Mantén la consistencia y registra tu progreso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: OPERATIVA */}
          <div className="lg:col-span-2 w-full">
            {isWeekend ? (
              <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-12 text-center border border-gray-50">
                <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smile className="w-10 h-10 text-[#A9D42C]" />
                </div>
                <h2 className="text-3xl font-black text-[#1B254B] mb-4">
                  Día de Descanso y Planificación
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
                  Felicidades por tu consistencia. Los fines de semana son para descansar y preparar la siguiente semana de alto impacto. Disfruta tu tiempo libre.
                </p>
              </div>
            ) : !activeCiclo ? (
               <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                  <p className="text-gray-500">Aún no tienes un ciclo activo configurado.</p>
               </div>
            ) : (
              <>
                {renderTareas('DIARIA', tareasDiarias)}
                {isFriday && renderTareas('SEMANAL', tareasSemanales)}
                
                {tareasDiarias.length === 0 && (!isFriday || tareasSemanales.length === 0) && (
                  <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No hay tareas programadas para hoy.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* COLUMNA DERECHA: WIDGETS ESTRATÉGICOS */}
          <div className="space-y-6 w-full">
            
            {/* Progreso del Ciclo */}
            {activeCiclo && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-24 h-24" />
                </div>
                <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2">Progreso del Ciclo</h3>
                <p className="text-3xl font-black text-[#1B254B]">
                  Día <span className="text-[#A9D42C]">{diaHabilActual}</span> <span className="text-lg text-gray-400">de {totalDias} días hábiles</span>
                </p>
              </div>
            )}

            {/* Comodines */}
            <div className="bg-[#1B254B] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-[11px] font-black text-[#A9D42C] tracking-widest uppercase mb-4">Tus Comodines</h3>
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: totalComodines }).map((_, i) => {
                  const isUsed = i < comodinesUsados;
                  return (
                    <button
                      key={i}
                      disabled={isWeekend || isUsed}
                      onClick={handleUseWildcard}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isUsed 
                          ? 'bg-[#A9D42C] text-[#1B254B] opacity-100' 
                          : isWeekend
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${isUsed ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-white/60 text-xs mt-4 leading-relaxed">
                Úsalos para excusar una tarea diaria sin afectar tu racha. {isWeekend && 'Deshabilitados en fin de semana.'}
              </p>
            </div>

            {/* Mi Avance */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-lime-50 text-[#A9D42C] rounded-full flex items-center justify-center mb-3">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1B254B] mb-2">Mi Avance</h3>
              <p className="text-sm text-gray-500 mb-5">Visualiza tu mapa de cumplimiento y rachas.</p>
              <button 
                onClick={() => navigate('/dashboard/avances')}
                className="w-full py-3 bg-[#A9D42C] hover:bg-lime-500 text-[#1B254B] font-bold rounded-xl transition-colors text-sm shadow-md"
              >
                Ver mis logros
              </button>
            </div>

            {/* Soporte Upsell */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-[#1B254B] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> ¿Bloqueado?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Agenda una sesión de Coaching personal con Cristián Briones para resolver bloqueos o cualquier duda que tengas.
              </p>
              <a 
                href="https://tidycal.com/cristianbrionesm/mentoring-1we20dr-368lgre-m7vwq5l"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 bg-[#A9D42C] hover:bg-lime-500 text-[#1B254B] font-bold rounded-xl transition-colors text-sm shadow-md"
              >
                Agendar Sesión de Soporte
              </a>
            </div>

            {/* Sesión Actual / Coach */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
              <h3 className="text-[11px] font-black text-gray-400 tracking-widest uppercase mb-4">Coach Responsable</h3>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1B254B] text-white flex items-center justify-center font-bold text-sm">
                  CB
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B254B]">Cristián Briones</p>
                  <p className="text-xs text-gray-400">cristian.briones@innovaagile.com</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};

export default CoacheeDashboard;
