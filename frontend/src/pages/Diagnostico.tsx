import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preguntasMES } from '../data/preguntasMES';
import { Check, ChevronRight, Loader2, ArrowRight, Zap } from 'lucide-react';

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

    if (user?.role === 'ADMIN') {
      alert("Fin de la prueba QA");
      navigate('/dashboard');
      return;
    }

    setIsLoading(true);

    try {
      const dimensionGanadora = topDimensions[0];
      const podioFinal = podio.map(id => preguntasMES.find(q => q.id === id)?.texto || '');

      const response = await fetch('/api/diagnostico/finalizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ podioFinal, dimensionGanadora })
      });

      const data = await response.json();

      if (data.action === 'REDIRECT_TIDYCAL') {
        window.location.href = 'https://tidycal.com/innovaagile/executive-mastery';
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al procesar el diagnóstico. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1B254B] mb-2 tracking-tight">
            Auditoría de Fricción Operativa
          </h1>
          <p className="text-gray-500 text-lg">
            Diagnóstico M.E.S. - Paso {step} de 3
          </p>
        </div>

        {step > 0 && (
          <div className="w-full mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-[#1B254B] tracking-widest uppercase">
                FASE {step} DE 3
              </span>
              <span className="text-xs font-bold text-gray-400">
                {Math.round((step / 3) * 100)}% COMPLETADO
              </span>
            </div>
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#A9D42C] transition-all duration-500 ease-out" 
                style={{ width: `${(step / 3) * 100}%` }}
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
                onClick={handleFinish}
                className={`flex items-center gap-2 font-bold py-4 px-8 rounded-full transition duration-300 shadow-lg 
                  ${canFinish 
                    ? 'bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] shadow-[#A9D42C]/30' 
                    : 'bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed shadow-none'}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>VER DIAGNÓSTICO <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Diagnostico;
