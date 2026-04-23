import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preguntasMES } from '../data/preguntasMES';
import { diagnosticosMES } from '../data/diagnosticosMES';
import { Check, ChevronRight, Loader2, ArrowRight, Zap, AlertTriangle, Sparkles, Calendar } from 'lucide-react';

// Nivel 1 = 1pt, Nivel 2 = 2pts, Nivel 3 = 5pts, Nivel 4 = 10pts, Nivel 5 = 20pts
const SCORE_MAP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 5,
  4: 10,
  5: 20
};

const Diagnostico: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleDashboardRedirectAttempt = () => {
    alert("Atención: El diagnóstico inicial es un paso obligatorio para personalizar tu Dashboard. Por favor complétalo para continuar.");
  };

  const [shuffledQuestions, setShuffledQuestions] = useState(preguntasMES);

  useEffect(() => {
    const shuffled = [...preguntasMES].sort(() => 0.5 - Math.random());
    setShuffledQuestions(shuffled);
  }, []);

  // Step 1: Selección de checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Step 2: Calificación de 1 a 5
  const [scores, setScores] = useState<Record<string, number>>({});

  // Step 3: Podio de 3 frases
  const [podio, setPodio] = useState<(string | null)[]>([null, null, null]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [progress, setProgress] = useState(0);
  const [planGenerado, setPlanGenerado] = useState<any>(null);
  const [firma, setFirma] = useState('');
  const isFirmaValida = firma.trim().length > 3;
  const tipoServicio = (user as any)?.tipoServicio || 'Executive Mastery';

  useEffect(() => {
    if (step === 7 && planGenerado) {
      // Llamada silenciosa al backend para enviar el email con el PDF
      fetch('/api/contrato/enviar-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planGenerado, firma, usuario: user })
      }).catch(console.error); // Falla silenciosa permitida aquí
    }
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoadingPlan) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.floor(Math.random() * 11) + 5; // 5 a 15
          const newProgress = prev + increment;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoadingPlan]);

  const asignarAlPodio = (id: string) => {
    setPodio(prev => {
      const idx = prev.indexOf(null);
      if (idx === -1) return prev; // Lleno
      const nuevo = [...prev];
      nuevo[idx] = id;
      return nuevo;
    });
  };

  const removerDelPodio = (index: number) => {
    setPodio(prev => {
      const nuevo = [...prev];
      nuevo[index] = null;
      return nuevo;
    });
  };

  const handleToggleQuestion = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const handleSetScore = (id: string, score: number) => {
    setScores(prev => ({ ...prev, [id]: score }));
  };

  const selectedQuestions = useMemo(() => {
    return preguntasMES.filter(q => selectedIds.includes(q.id));
  }, [selectedIds]);

  const canAdvanceStep1 = selectedIds.length >= 4;
  const canAdvanceStep2 = selectedQuestions.every(q => scores[q.id] !== undefined);
  
  // Calculate Step 3 Data
  const { topDimensions, finalCandidates } = useMemo(() => {
    if (step < 3) return { topDimensions: [], finalCandidates: [] };

    const scoreByDimension: Record<string, number> = {};
    const maxPhraseByDimension: Record<string, { id: string, highestScore: number }> = {};

    selectedQuestions.forEach(q => {
      const rawScore = scores[q.id];
      const points = SCORE_MAP[rawScore] || 0;
      
      scoreByDimension[q.dimension] = (scoreByDimension[q.dimension] || 0) + points;

      if (!maxPhraseByDimension[q.dimension] || points > maxPhraseByDimension[q.dimension].highestScore) {
        maxPhraseByDimension[q.dimension] = { id: q.id, highestScore: points };
      }
    });

    const sortedDimensions = Object.entries(scoreByDimension)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 4);

    const candidates = sortedDimensions.map(dim => {
      const qId = maxPhraseByDimension[dim].id;
      return preguntasMES.find(q => q.id === qId)!;
    });

    return { topDimensions: sortedDimensions, finalCandidates: candidates };
  }, [step, selectedQuestions, scores]);

  const canFinish = podio.every(p => p !== null);

  const handleFinish = async () => {
    if (!canFinish) return;

    setIsLoadingPlan(true);

    try {
      const q1 = finalCandidates.find(q => q.id === podio[0]);
      if (!q1) throw new Error("No hay síntoma principal seleccionado");
      
      const problemaElegido = q1.texto;
      const nombreUsuario = user?.name || 'Participante';

      const response = await fetch('/api/ia/generar-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombreUsuario, problemaElegido })
      });

      if (!response.ok) {
         throw new Error("Error en la respuesta del servidor IA");
      }

      const data = await response.json();
      
      console.log("=== JSON DE GEMINI ===");
      console.log(data);
      console.log("======================");

      setPlanGenerado(data);
      setIsLoadingPlan(false);
      setStep(5);

    } catch (error) {
      console.error(error);
      setIsLoadingPlan(false);
      alert('Ocurrió un error al procesar el diagnóstico con la IA. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl">
        
        {isLoadingPlan ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500 mt-10">
            <div className="bg-[#1B254B] rounded-3xl w-24 h-24 flex items-center justify-center shadow-[0_0_40px_rgba(169,212,44,0.3)] mb-8">
              <span className="text-white text-5xl font-black italic">I</span>
            </div>
            <h2 className="text-3xl font-black text-[#1B254B] mb-2 text-center leading-tight">
              GENERANDO TU <br/>
              <span className="text-[#A9D42C]">DIAGNÓSTICO</span>
            </h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 mt-2">
              DEFINIENDO LAS ACCIONES CON EL MODELO DE IA DE INNOVAAGILE
            </p>
            <p className="text-gray-500 text-sm max-w-md text-center leading-relaxed">
              Estamos analizando tu patrón operativo y calculando los gaps de fricción para crear tu hoja de ruta personalizada.
            </p>
            
            <div className="w-64 h-1 bg-gray-200 mt-10 rounded-full overflow-hidden">
              <div className="h-full bg-[#A9D42C] transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-[#1B254B] mb-2 tracking-tight">
                Auditoría de Fricción Operativa
              </h1>
              <p className="text-gray-500 text-lg">
                Diagnóstico M.E.S. - Paso {step} de 4
              </p>
            </div>

            {step > 0 && step < 5 && (
              <div className="w-full mb-8">
                <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-[#1B254B] tracking-widest uppercase">
                FASE {step} DE 4
              </span>
              <span className="text-xs font-bold text-gray-400">
                {Math.round((step / 4) * 100)}% COMPLETADO
              </span>
            </div>
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#A9D42C] transition-all duration-500 ease-out" 
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 mb-8 text-center max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-50 rounded-xl p-4 inline-flex items-center justify-center">
                <span className="text-4xl leading-none">🚀</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-black mb-2">
              <span className="text-[#1B254B]">¡Bienvenido, </span>
              <span className="text-[#A9D42C]">{user?.nombre?.split(' ')[0] || 'Usuario'}</span>
              <span className="text-[#1B254B]">!</span>
            </h1>
            
            <p className="text-gray-500 text-lg mb-8">
              Tu diagnóstico de fricción operativa está listo.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 mb-8 relative overflow-hidden mt-6">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#A9D42C]/10 text-[#A9D42C] text-xs font-bold py-1 px-4 rounded-full mt-4 flex items-center justify-center gap-1 whitespace-nowrap">
                <span>✅</span> AUDITORÍA V6.1
              </div>
              
              <h3 className="text-2xl font-bold text-[#1B254B] mt-5 mb-3">
                Comienza el Proceso
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                En los próximos 10 minutos identificaremos los puntos ciegos que están frenando tu ejecución.
              </p>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 bg-[#1B254B] hover:bg-[#0F1633] text-white font-bold py-4 px-8 rounded-full transition duration-300 shadow-xl shadow-[#1B254B]/20"
              >
                <span>🎯</span> COMENZAR MI DIAGNÓSTICO
              </button>
            </div>

            <button 
              onClick={handleDashboardRedirectAttempt}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-colors tracking-wide uppercase"
            >
              ¿YA TIENES UNA CUENTA? ACCEDER AL DASHBOARD <span>→</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col mb-8">
            <div className="p-8 md:p-12 pb-6 border-b border-gray-50 flex-shrink-0">
              <h2 className="text-4xl font-black text-[#1B254B] mb-2">
                Identificación
              </h2>
              <p className="text-[#8F9BBA] text-lg">
                Selecciona únicamente las situaciones que han sido reales en tu equipo en los últimos 30 días. (Mínimo 4)
              </p>
            </div>
            
            <div className="p-8 md:px-12 md:py-8 flex-1 bg-gray-50/30">
              <div className="flex flex-col gap-3 md:gap-4">
                {shuffledQuestions.map(q => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <label 
                      key={q.id}
                      className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-4 border select-none
                        ${isSelected ? 'border-[#A9D42C] bg-[#F7FBEA] shadow-sm' : 'border-transparent hover:border-gray-200 bg-white shadow-sm'}`}
                    >
                      <input 
                         type="checkbox" 
                         className="hidden" 
                         checked={isSelected}
                         onChange={() => handleToggleQuestion(q.id)}
                      />
                      <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-[#A9D42C] border-[#A9D42C]' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-base flex-1 ${isSelected ? 'text-[#1B254B] font-semibold' : 'text-[#8F9BBA] font-medium'}`}>
                        {q.texto}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:px-12 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0 sticky bottom-0 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1">SELECCIONADOS</p>
                <div className="text-3xl font-black text-[#A9D42C] leading-none">
                  {selectedIds.length}
                </div>
              </div>
              <button
                disabled={!canAdvanceStep1}
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg 
                  ${canAdvanceStep1 
                    ? 'bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] shadow-[#A9D42C]/30' 
                    : 'bg-gray-200 text-gray-400 opacity-70 cursor-not-allowed shadow-none'}`}
              >
                CONTINUAR <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-bold text-[#1B254B] mb-2">
              Evalúa el nivel de impacto
            </h2>
            <p className="text-gray-500 mb-8">
              Para cada situación, califica cuánto afecta tus resultados (1 = Bajo Impacto, 5 = Altísimo Impacto).
            </p>

            <div className="space-y-6">
              {selectedQuestions.map(q => (
                <div key={q.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <p className="font-semibold text-[#1B254B] mb-4">{q.texto}</p>
                  <div className="grid grid-cols-5 gap-2 w-full">
                    {[1, 2, 3, 4, 5].map(val => {
                      const isSelected = scores[q.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleSetScore(q.id, val)}
                          className={`py-3 rounded-xl border-2 transition-all cursor-pointer font-bold flex items-center justify-center text-lg
                            ${isSelected 
                              ? 'border-[#A9D42C] bg-[#A9D42C] text-[#1B254B] shadow-md transform scale-[1.02]' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600'}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-[#1B254B] font-medium px-4 py-2"
              >
                Volver
              </button>
              <button
                disabled={!canAdvanceStep2}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] font-bold py-3 px-8 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A9D42C]/30"
              >
                Siguiente Paso <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col mb-8">
            <div className="p-8 md:p-12 pb-6 border-b border-gray-50 flex-shrink-0">
              <h2 className="text-4xl font-black text-[#1B254B] mb-2">
                Podio Estratégico
              </h2>
              <p className="text-[#8F9BBA] text-lg">
                El motor de IA ha detectado tus {finalCandidates.length} síntomas raíz. Como líder, priorízalos en el podio de resolución.
              </p>
            </div>

            <div className="p-8 md:px-12 bg-white flex-1">
              <div className="space-y-4 mb-8">
                {[0, 1, 2].map(index => {
                  const itemId = podio[index];
                  const item = finalCandidates.find(q => q.id === itemId);

                  if (!item) {
                    return (
                      <div key={index} className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-4 flex items-center gap-4 transition-all h-[90px]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-500">
                          {index + 1}
                        </div>
                        <span className="text-sm font-semibold tracking-wide text-gray-400">
                          TOCA UN ELEMENTO ABAJO PARA EL SLOT #{index + 1}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="border-2 border-[#A9D42C] bg-[#A9D42C]/5 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_10px_40px_rgba(112,144,176,0.2)] hover:-translate-y-1 transition-all duration-300 min-h-[90px]">
                      <div className="flex items-center gap-4 flex-1 pr-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[#A9D42C] text-white shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-bold text-[#1B254B] block leading-snug">
                            {item.texto}
                          </span>
                          <button 
                            onClick={() => removerDelPodio(index)}
                            className="text-[10px] uppercase font-bold text-[#A9D42C] hover:text-[#97C026] mt-2 transition-colors inline-block tracking-wider"
                          >
                            ELIMINAR DE LA PRIORIDAD
                          </button>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Zap className="w-5 h-5 text-[#A9D42C]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-8 pb-4">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-4">| PUNTOS CRÍTICOS DETECTADOS:</p>
                <div className="flex flex-col gap-3">
                  {finalCandidates.filter(q => !podio.includes(q.id)).map(q => (
                    <div 
                      key={q.id}
                      onClick={() => asignarAlPodio(q.id)}
                      className="cursor-pointer border border-gray-100 bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-gray-200 rounded-2xl p-4 flex items-center gap-4 transition-all"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center font-black pb-0.5 text-lg leading-none transition-colors">
                        +
                      </div>
                      <span className="text-sm font-medium text-gray-600 flex-1">
                        {q.texto}
                      </span>
                    </div>
                  ))}
                  {finalCandidates.filter(q => !podio.includes(q.id)).length === 0 && (
                     <div className="text-center text-sm font-medium text-[#A9D42C] py-6 border border-transparent rounded-xl bg-[#F7FBEA]">
                       Has completado tu podio exitosamente.
                     </div>
                  )}
                </div>
              </div>
            </div>

            {canFinish && (
              <div className="mx-8 md:mx-12 mb-6 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <h3 className="font-bold text-[#1B254B] mb-2">
                  Diagnóstico Predominante: {topDimensions[0]}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Basado en tus respuestas, el principal cuello de botella operativo en este momento se encuentra en el área de <strong>{topDimensions[0]}</strong>. 
                  Al resolver esta dimensión, se desbloqueará una mejora considerable en todo el resto de tu organización.
                </p>
              </div>
            )}

            <div className="p-6 md:px-12 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0 sticky bottom-0 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setStep(2)}
                className="text-gray-400 hover:text-[#1B254B] font-bold px-4 py-2 text-xs uppercase tracking-wider transition-colors"
              >
                Volver
              </button>
              <button
                disabled={!canFinish || isLoading}
                onClick={() => setStep(4)}
                className={`flex items-center gap-2 font-bold py-4 px-8 rounded-full transition duration-300 shadow-lg 
                  ${canFinish 
                    ? 'bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] shadow-[#A9D42C]/30' 
                    : 'bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed shadow-none'}`}
              >
                VER DIAGNÓSTICO <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && podio.every(p => p !== null) && (
          <div className="w-full flex flex-col gap-8 animate-in fade-in zoom-in duration-500 mb-12">
            
            {/* Cabecera Dark */}
            <div className="bg-[#1B254B] text-white rounded-3xl p-8 md:p-10 text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] relative overflow-hidden">
              <h2 className="text-4xl font-black mb-2 relative z-10">
                Soft Skill Gap
              </h2>
              <p className="text-[#8F9BBA] text-sm uppercase tracking-widest font-bold relative z-10">
                CAUSA RAÍZ DE LA FRICCIÓN OPERATIVA DETECTADA
              </p>
            </div>

            {(() => {
              // Assert no podio content is null here based on logical pre-check
              const q1 = finalCandidates.find(q => q.id === podio[0])!;
              const diag1 = diagnosticosMES[q1.dimension] || { problema: "Contexto no detectado", solucion: "Contacte soporte experto" };
              
              const q2 = finalCandidates.find(q => q.id === podio[1])!;
              const diag2 = diagnosticosMES[q2.dimension] || { problema: "Contexto no detectado", solucion: "Contacte soporte experto" };

              const q3 = finalCandidates.find(q => q.id === podio[2])!;
              const diag3 = diagnosticosMES[q3.dimension] || { problema: "Contexto no detectado", solucion: "Contacte soporte experto" };

              return (
                <>
                  {/* Prioridad #1 Card */}
                  <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12">
                    <div className="mb-12 text-center">
                      <p className="text-[10px] uppercase font-bold text-[#A9D42C] tracking-wider mb-4">PRIORIDAD #1:</p>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#1B254B] leading-snug max-w-3xl mx-auto">
                        "{q1.texto}"
                      </h3>
                      
                      {/* Brecha Estructural */}
                      <div className="mt-10 mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">BRECHA ESTRUCTURAL DE COMPORTAMIENTO:</p>
                        <div className="bg-[#A9D42C]/10 rounded-2xl py-6 px-8 inline-block w-full max-w-2xl border border-[#A9D42C]/20">
                          <span className="text-2xl md:text-3xl font-black text-[#1B254B] block tracking-tight">{q1.dimension}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 shadow-sm">
                        <h4 className="text-red-600 font-bold flex items-center gap-2 mb-3 tracking-wide uppercase text-sm">
                          <AlertTriangle className="w-5 h-5" /> EL PROBLEMA
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {diag1.problema}
                        </p>
                      </div>
                      <div className="bg-[#A9D42C]/5 border border-[#A9D42C]/30 rounded-3xl p-6 shadow-sm">
                        <h4 className="text-[#1B254B] font-bold flex items-center gap-2 mb-3 tracking-wide uppercase text-sm">
                          <Sparkles className="w-5 h-5 text-[#A9D42C]" /> SOLUCIÓN DE INGENIERÍA DE EJECUCIÓN
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {diag1.solucion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mapa de Fricción Systemica */}
                  <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12">
                    <div className="text-center mb-10">
                      <h3 className="text-2xl font-black text-[#1B254B] tracking-tight">
                        Mapa de Fricción Sistémica
                      </h3>
                    </div>
                    
                    <div className="space-y-6">
                      {[q2, q3].map((q, idx) => {
                        const diag = idx === 0 ? diag2 : diag3;
                        const dolor = idx === 0 ? "4/5" : "5/5";
                        return (
                          <div key={q.id} className="border-none rounded-2xl p-6 md:p-8 bg-white shadow-[0_10px_40px_rgba(112,144,176,0.12)] transition-shadow relative overflow-hidden">
                            <div className="absolute top-6 right-6 bg-[#1B254B] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md tracking-widest z-10">
                              DOLOR: {dolor}
                            </div>
                            
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pr-24">
                              <span className="text-[#A9D42C] font-black mr-2">|</span> PRIORIDAD #{idx + 2}: {q.dimension}
                            </p>
                            <h4 className="text-xl font-bold text-[#1B254B] leading-snug mb-5 max-w-2xl pr-16 md:pr-24">
                              "{q.texto}"
                            </h4>
                            <div className="bg-[#F4F7FE] border-l-4 border-l-[#A9D42C] rounded-r-2xl rounded-l-sm p-6">
                              <span className="block mb-3 text-[#A9D42C] text-[10px] uppercase font-bold tracking-widest">
                                INGENIERÍA DE COMPORTAMIENTO:
                              </span>
                              <p className="text-sm text-[#1B254B] leading-relaxed font-medium">
                                {diag.solucion}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* CTA Flotante */}
            <div className="bg-[#1B254B] rounded-3xl p-10 md:p-14 text-center shadow-2xl relative overflow-hidden mt-2">
              <h3 className="text-white text-2xl md:text-3xl font-bold mb-8 leading-tight">
                ¿Siguiente Paso Estratégico? <br/>
                <span className="text-[#A9D42C] font-black mt-2 inline-block">GENERA TU PLAN TÉCNICO DETALLADO CON NUESTRA IA.</span>
              </h3>
              
              <button
                disabled={isLoadingPlan}
                onClick={handleFinish}
                className="w-full md:w-auto mx-auto flex items-center justify-center gap-3 bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] font-black py-5 px-12 rounded-full transition duration-300 shadow-lg shadow-[#A9D42C]/20 text-lg hover:-translate-y-1"
              >
                {isLoadingPlan ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>VER EL PLAN DE ACCIÓN <ArrowRight className="w-6 h-6" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 5 && planGenerado && (
          <div className="w-full animate-in fade-in zoom-in duration-500 pb-20">
            {/* Tarjeta Hero */}
            <div className="bg-[#1B254B] rounded-[40px] p-12 text-center shadow-2xl mx-auto max-w-4xl mt-8">
              <h1 className="text-5xl font-black text-white tracking-tight lowercase">
                {planGenerado.nombre_coachee}
              </h1>
              <p className="text-[#A9D42C] text-sm font-bold tracking-[0.2em] uppercase mt-4">
                PLAN DE MEJORA SIN FRICCIÓN
              </p>
              
              <div className="border-t border-white/10 my-8"></div>
              
              <div className="flex divide-x divide-white/10">
                <div className="flex-1 px-4">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">NIVEL DE RESISTENCIA</p>
                  <p className="text-white text-3xl font-black">78%</p>
                </div>
                <div className="flex-1 px-4">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">ENFOQUE PRIORITARIO</p>
                  <p className="text-[#A9D42C] font-bold text-xl">{planGenerado.diagnostico_problema}</p>
                </div>
              </div>
            </div>

            {/* Acciones Diarias */}
            <div className="bg-[#A9D42C]/10 border-2 border-[#A9D42C]/20 text-[#1B254B] rounded-full py-4 px-10 text-3xl font-black mx-auto w-max my-16 shadow-sm uppercase">
              ACCIONES DIARIAS
            </div>
            
            {planGenerado.micro_habitos_diarios?.map((habito: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[32px] p-8 mb-8 shadow-[0_10px_40px_rgba(112,144,176,0.08)] flex flex-col md:flex-row gap-6">
                <div className="bg-[#1B254B] text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1B254B] border-b-2 border-[#A9D42C] pb-2 inline-block mb-6">
                    {habito.titulo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">ACCIÓN</p>
                      <p className="text-[#1B254B] text-sm font-medium">{habito.accion}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">DISPARADOR</p>
                      <p className="text-[#1B254B] text-sm font-medium">{habito.disparador}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">MEDICIÓN</p>
                      <p className="text-[#1B254B] text-sm font-medium">{habito.medicion}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Acciones Semanales */}
            <div className="bg-[#A9D42C]/10 border-2 border-[#A9D42C]/20 text-[#1B254B] rounded-full py-4 px-10 text-3xl font-black mx-auto w-max my-16 shadow-sm uppercase">
              ACCIONES SEMANALES
            </div>

            {planGenerado.micro_habito_semanal && (
              <div className="bg-white rounded-[32px] p-8 mb-8 shadow-[0_10px_40px_rgba(112,144,176,0.08)] flex flex-col md:flex-row gap-6">
                <div className="bg-[#1B254B] text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1B254B] border-b-2 border-[#A9D42C] pb-2 inline-block mb-6">
                    {planGenerado.micro_habito_semanal.titulo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">ACCIÓN</p>
                      <p className="text-[#1B254B] text-sm font-medium">{planGenerado.micro_habito_semanal.accion}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">DISPARADOR</p>
                      <p className="text-[#1B254B] text-sm font-medium">{planGenerado.micro_habito_semanal.disparador}</p>
                    </div>
                    <div className="bg-[#F4F7FE] rounded-2xl p-5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">MEDICIÓN</p>
                      <p className="text-[#1B254B] text-sm font-medium">{planGenerado.micro_habito_semanal.medicion}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Respaldo Científico */}
            <div className="bg-[#A9D42C]/10 border-2 border-[#A9D42C]/20 text-[#1B254B] rounded-full py-4 px-10 text-3xl font-black mx-auto w-max my-16 shadow-sm uppercase">
              RESPALDO CIENTÍFICO CONDUCTUAL
            </div>

            {planGenerado.criterios_cientificos?.map((criterio: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[32px] p-8 mb-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-[#A9D42C]/20 text-[#1B254B] w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-lg shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1B254B] uppercase mb-2">{criterio.titulo}</h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {criterio.explicacion}
                  </p>
                </div>
              </div>
            ))}

            {/* Footer CTA */}
            <div className="bg-[#1B254B] rounded-[40px] p-12 text-center shadow-2xl mx-auto max-w-2xl mt-20">
              <h3 className="text-white text-3xl font-black mb-4">¿Siguiente Paso Estratégico?</h3>
              <p className="text-gray-400 text-sm tracking-[0.1em] font-bold">CONFIRMA TU COMPROMISO PARA ACTIVAR EL SEGUIMIENTO.</p>
              <button 
                onClick={() => setStep(6)}
                className="bg-[#A9D42C] text-[#1B254B] font-black rounded-full px-8 py-4 mt-8 hover:scale-105 transition-transform flex items-center justify-center mx-auto gap-2 text-lg"
              >
                FIRMA DEL CONTRATO DE EXCELENCIA <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 6 && planGenerado && (
          <div className="w-full animate-in fade-in zoom-in duration-500 pb-20">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-3xl mx-auto overflow-hidden border border-gray-100 mb-20">
              
              {/* Cabecera Oscura */}
              <div className="bg-[#1B254B] py-10 text-center">
                <div className="w-12 h-1 bg-[#A9D42C] mb-6 mx-auto"></div>
                <h2 className="text-4xl font-black text-white">
                  CONTRATO DE <span className="text-[#A9D42C]">EXCELENCIA</span>
                </h2>
                <p className="text-[#A9D42C] text-xs font-bold tracking-widest mt-2">
                  INNOVAAGILE COACHING
                </p>
              </div>

              {/* Datos del Usuario */}
              <div className="px-10 pb-10">
                <h3 className="font-black text-4xl text-[#1B254B] mt-10 text-center lowercase">
                  {planGenerado.nombre_coachee}
                </h3>
                <p className="text-center text-[#A9D42C] font-bold mt-2 uppercase tracking-widest text-sm mb-8">
                  PLAN DE ALTO RENDIMIENTO
                </p>

                {/* Tarjetas de Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-[#F4F7FE] rounded-2xl p-6 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">NIVEL DE RESISTENCIA</p>
                    <p className="text-[#1B254B] text-3xl font-black">78%</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-2 px-4">
                      Este porcentaje mide la intensidad de los bloqueos detectados. Un nivel alto indica fricción operativa que está drenando la capacidad de ejecución de tu equipo.
                    </p>
                  </div>
                  <div className="bg-[#F4F7FE] rounded-2xl p-6 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">ENFOQUE PRIORITARIO</p>
                    <p className="text-[#A9D42C] font-bold text-xl leading-tight">{planGenerado.diagnostico_problema}</p>
                  </div>
                </div>

                {/* Resumen de Acciones */}
                <div className="mb-12">
                  <h4 className="text-[#1B254B] font-black text-xl mb-6 uppercase border-b-2 border-gray-100 pb-2 inline-block">
                    ACCIONES DIARIAS
                  </h4>
                  <div className="space-y-4">
                    {planGenerado.micro_habitos_diarios?.map((habito: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-center shadow-sm">
                        <div className="bg-[#A9D42C]/10 text-[#A9D42C] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1B254B] text-lg">{habito.titulo}</p>
                          <p className="text-gray-500 text-sm mt-1">{habito.accion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-12">
                  <h4 className="text-[#1B254B] font-black text-xl mb-6 uppercase border-b-2 border-gray-100 pb-2 inline-block">
                    ACCIONES SEMANALES
                  </h4>
                  {planGenerado.micro_habito_semanal && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-center shadow-sm">
                      <div className="bg-[#1B254B]/10 text-[#1B254B] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1B254B] text-lg">{planGenerado.micro_habito_semanal.titulo}</p>
                        <p className="text-gray-500 text-sm mt-1">{planGenerado.micro_habito_semanal.accion}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zona de Firma */}
                <div className="border-t border-gray-100 pt-10">
                  <p className="text-gray-500 italic text-sm text-center px-4 md:px-10 mb-8">
                    "Entiendo que este compromiso es conmigo mismo. Al firmar este documento, acepto que mi progreso sea medido exclusivamente bajo la lógica 1/0, sin excusas, solo resultados."
                  </p>

                  <div className="max-w-md mx-auto">
                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 text-center">
                      FIRMA DIGITAL (ESCRIBE TU NOMBRE COMPLETO)
                    </label>
                    <input 
                      type="text" 
                      value={firma}
                      onChange={(e) => setFirma(e.target.value)}
                      className="w-full bg-[#F4F7FE] border-2 border-transparent focus:border-[#A9D42C] rounded-2xl px-6 py-4 text-center text-[#1B254B] font-bold text-lg outline-none transition-colors mb-8"
                      placeholder="Ej. Juan Pérez"
                    />

                    <button 
                      disabled={!isFirmaValida}
                      onClick={() => setStep(7)}
                      className={`w-full font-black rounded-full px-8 py-5 transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-lg
                        ${isFirmaValida 
                          ? 'bg-[#A9D42C] text-[#1B254B] hover:scale-[1.02] cursor-pointer shadow-[#A9D42C]/30' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                      SELLAR COMPROMISO <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {step === 7 && planGenerado && (
          <div className="w-full animate-in fade-in zoom-in duration-500 pb-20 pt-10 relative">
            <div className="text-center relative max-w-4xl mx-auto">
              <h1 className="text-4xl font-black text-[#1B254B]">MI COMPROMISO FIRMADO</h1>
              <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Documento legal de integridad y alto rendimiento</p>
              <button className="bg-[#A9D42C] text-[#1B254B] font-bold px-6 py-2 rounded-full absolute top-2 right-0 shadow-md hover:bg-[#97C026] transition-colors hidden md:block">
                DESCARGAR PDF
              </button>
            </div>

            <div className="bg-white max-w-4xl mx-auto mt-10 h-[600px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-md border border-gray-200 p-8 md:p-16 custom-scrollbar relative">
              <h2 className="text-2xl font-black text-center mb-10 text-[#1B254B] uppercase underline underline-offset-8 decoration-2">
                CONTRATO DE EXCELENCIA ESTRATÉGICA
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Yo, <strong>{planGenerado.nombre_coachee}</strong>, por medio del presente documento, me comprometo formalmente a elevar mis estándares operativos y erradicar la fricción detectada en mi diagnóstico.
              </p>
              
              <h3 className="font-bold text-[#1B254B] mt-8 mb-4">I. ALCANCE DEL COMPROMISO</h3>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                Acepto que mi progreso está determinado por mis acciones. Este contrato establece los nuevos micro-hábitos de poder que ejecutaré con precisión quirúrgica, sin excusas y con orientación 100% a resultados.
              </p>

              <h3 className="font-bold text-[#1B254B] mt-8 mb-4">II. FOCO ESTRATÉGICO</h3>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                Fricción detectada: <strong>{planGenerado.diagnostico_problema}</strong>. Nivel de severidad técnica en el patrón actual de ejecución: Crítico.
              </p>

              <h3 className="font-bold text-[#1B254B] mt-8 mb-4">III. CONDICIONES DE ÉXITO</h3>
              <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                El éxito será medido de forma binaria (1/0). La ejecución repetida de las siguientes acciones reconstruirá el circuito dopaminérgico y optimizará la carga cognitiva del equipo.
              </p>

              <h3 className="font-bold text-[#1B254B] mt-10 mb-6 border-b border-gray-200 pb-2">IV. LOS MICRO-HÁBITOS DE PODER</h3>
              
              <h4 className="font-bold text-gray-500 text-xs tracking-widest uppercase mb-4">A. RUTINA DIARIA</h4>
              <ul className="space-y-6 mb-8">
                {planGenerado.micro_habitos_diarios?.map((h: any, i: number) => (
                  <li key={i} className="pl-4 border-l-2 border-[#A9D42C]">
                    <p className="font-bold text-[#1B254B]">{i + 1}. {h.titulo}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Disparador:</strong> {h.disparador}</p>
                    <p className="text-sm text-gray-600"><strong>Medición:</strong> {h.medicion}</p>
                  </li>
                ))}
              </ul>

              <h4 className="font-bold text-gray-500 text-xs tracking-widest uppercase mb-4">B. RUTINA SEMANAL</h4>
              {planGenerado.micro_habito_semanal && (
                <ul className="space-y-6">
                  <li className="pl-4 border-l-2 border-[#1B254B]">
                    <p className="font-bold text-[#1B254B]">1. {planGenerado.micro_habito_semanal.titulo}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Disparador:</strong> {planGenerado.micro_habito_semanal.disparador}</p>
                    <p className="text-sm text-gray-600"><strong>Medición:</strong> {planGenerado.micro_habito_semanal.medicion}</p>
                  </li>
                </ul>
              )}

              <div className="mt-16 pt-10 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-2">Firmado digitalmente bajo el protocolo de InnovaAgile Coaching</p>
                <p className="text-3xl font-black text-[#1B254B] uppercase opacity-80">{firma}</p>
                <div className="w-48 h-px bg-[#1B254B] mx-auto mt-2"></div>
              </div>
            </div>

            {/* Footer Flotante Condicional */}
            <div className="bg-[#1B254B] rounded-3xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between mt-8 shadow-2xl gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-[#2A355A] p-4 rounded-xl text-[#A9D42C] shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <p className="text-white text-sm md:text-base font-medium leading-relaxed">
                  Tu compromiso está blindado. El sistema ya está midiendo tu integridad operativa.
                </p>
              </div>
              
              <div className="shrink-0 w-full md:w-auto text-center">
                {tipoServicio === 'Executive Mastery' ? (
                  <a href="https://tidycal.com/cristianbrionesm/sesion-1-coachtoring" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto bg-white text-[#1B254B] font-black rounded-full px-8 py-4 hover:scale-105 transition-transform inline-block shadow-lg">
                    Agenda tu sesión de diagnóstico
                  </a>
                ) : (
                  <button onClick={() => navigate('/dashboard')} className="w-full md:w-auto bg-white text-[#1B254B] font-black rounded-full px-8 py-4 hover:scale-105 transition-transform inline-block shadow-lg">
                    IR AL DASHBOARD <ArrowRight className="w-5 h-5 inline-block ml-1 -mt-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default Diagnostico;
