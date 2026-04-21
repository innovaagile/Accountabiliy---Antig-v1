import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preguntasMES } from '../data/preguntasMES';
import { Check, ChevronRight, Loader2, ArrowRight } from 'lucide-react';

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
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Selección de checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Step 2: Calificación de 1 a 5
  const [scores, setScores] = useState<Record<string, number>>({});

  // Step 3: Podio de 3 frases
  const [podio, setPodio] = useState<string[]>([]);

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

  const handleTogglePodio = (id: string) => {
    setPodio(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length < 3) return [...prev, id];
      return prev;
    });
  };

  const canFinish = podio.length === 3;

  const handleFinish = async () => {
    if (!canFinish) return;
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

        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-bold text-[#1B254B] mb-6">
              Selecciona las situaciones que ocurren frecuentemente en tu entorno.
            </h2>
            <p className="text-sm text-gray-400 mb-8">Selecciona al menos 4 para poder continuar.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preguntasMES.map(q => {
                const isSelected = selectedIds.includes(q.id);
                return (
                  <div 
                    key={q.id}
                    onClick={() => handleToggleQuestion(q.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-4 transition-all duration-200 flex items-start gap-4 
                      ${isSelected ? 'border-[#A9D42C] bg-[#F7FBEA]' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                  >
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center
                      ${isSelected ? 'bg-[#A9D42C] border-[#A9D42C]' : 'border-gray-300'}`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-base leading-snug ${isSelected ? 'text-[#1B254B] font-medium' : 'text-gray-600'}`}>
                      {q.texto}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                disabled={!canAdvanceStep1}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-[#A9D42C] hover:bg-[#97C026] text-[#1B254B] font-bold py-3 px-8 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A9D42C]/30"
              >
                Siguiente Paso <ChevronRight className="w-5 h-5" />
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
                  <div className="flex gap-2 sm:gap-4 flex-wrap">
                    {[1, 2, 3, 4, 5].map(val => {
                      const isSelected = scores[q.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleSetScore(q.id, val)}
                          className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? 'bg-[#1B254B] text-white shadow-md transform scale-110' 
                              : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
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
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-bold text-[#1B254B] mb-2">
              Decisión Estratégica
            </h2>
            <p className="text-gray-500 mb-8">
              Selecciona tus 3 mayores dolores operacionales de la lista final (en orden de prioridad).
            </p>

            <div className="space-y-4 mb-10">
              {finalCandidates.map(q => {
                const isSelected = podio.includes(q.id);
                const podioIndex = podio.indexOf(q.id) + 1;

                return (
                  <div 
                    key={q.id}
                    onClick={() => handleTogglePodio(q.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-200 flex items-center gap-5
                      ${isSelected ? 'border-[#1B254B] bg-slate-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                      ${isSelected ? 'bg-[#A9D42C] text-[#1B254B]' : 'bg-gray-100 text-gray-400'}`}>
                      {isSelected ? podioIndex : ''}
                    </div>
                    <span className={`text-lg leading-snug flex-1 ${isSelected ? 'text-[#1B254B] font-semibold' : 'text-gray-600'}`}>
                      {q.texto}
                    </span>
                  </div>
                );
              })}
            </div>

            {canFinish && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl mb-10">
                <h3 className="font-bold text-[#1B254B] mb-2">
                  Diagnóstico Predominante: {topDimensions[0]}
                </h3>
                <p className="text-gray-700 text-sm">
                  Basado en tus respuestas, el principal cuello de botella en este momento se encuentra en el área de {topDimensions[0]}. 
                  Al resolver esta dimensión, se desbloqueará una mejora considerable en el resto de los procesos operativos.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setStep(2)}
                className="text-gray-500 hover:text-[#1B254B] font-medium px-4 py-2"
              >
                Volver
              </button>
              <button
                disabled={!canFinish || isLoading}
                onClick={handleFinish}
                className="flex items-center gap-2 bg-[#1B254B] hover:bg-[#0F1633] text-white font-bold py-4 px-8 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#1B254B]/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Comenzar mi programa <ArrowRight className="w-5 h-5" /></>
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
