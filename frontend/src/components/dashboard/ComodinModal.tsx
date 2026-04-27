import React from 'react';
import { X, Zap, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../api/config';

interface ComodinModalProps {
  isOpen: boolean;
  onClose: () => void;
  comodinOptions: {
    hoy: { etiqueta: string; valor: string };
    ayer: { etiqueta: string; valor: string };
  } | null;
  coacheeId: string;
  cicloId: string;
  onSuccess: () => void;
}

export const ComodinModal: React.FC<ComodinModalProps> = ({
  isOpen,
  onClose,
  comodinOptions,
  coacheeId,
  cicloId,
  onSuccess
}) => {
  if (!isOpen || !comodinOptions) return null;

  const handleConfirmWildcard = async (fechaObjetivo: string) => {
    try {
      const res = await apiFetch(`/coachees/${coacheeId}/ciclos/${cicloId}/comodines/usar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaObjetivo })
      });

      if (res.ok) {
        onClose();
        onSuccess();
        toast.success('¡Comodín aplicado exitosamente!');
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error al usar comodín:', error);
      toast.error('Error interno al aplicar el comodín.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
          <Zap className="w-6 h-6 fill-current" />
        </div>
        <h3 className="text-xl font-black text-[#1B254B] mb-2">Usar Comodín</h3>
        <p className="text-sm text-gray-500 mb-6">
          ¿Para qué día deseas usar este comodín? Esto excusará todas tus tareas de ese día.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => handleConfirmWildcard(comodinOptions.hoy.valor)}
            className="w-full py-3.5 bg-gray-50 hover:bg-[#1B254B] hover:text-white text-[#1B254B] font-bold rounded-xl transition-all shadow-sm border border-gray-100 flex items-center justify-between px-4"
          >
            <span>{comodinOptions.hoy.etiqueta}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          <button 
            onClick={() => handleConfirmWildcard(comodinOptions.ayer.valor)}
            className="w-full py-3.5 bg-gray-50 hover:bg-[#1B254B] hover:text-white text-[#1B254B] font-bold rounded-xl transition-all shadow-sm border border-gray-100 flex items-center justify-between px-4"
          >
            <span>{comodinOptions.ayer.etiqueta}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );
};
