import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const TIPOS_FRASE = {
  BIENVENIDA: 'Frases de Bienvenida',
  DESPEDIDA: 'Frases de Despedida',
  MOTIVACIONAL_ALTA: 'Alta (+70%)',
  MOTIVACIONAL_MEDIA: 'Media (40-69%)',
  MOTIVACIONAL_BAJA: 'Baja (<40%)',
};

type TipoFrase = keyof typeof TIPOS_FRASE;

interface Frase {
  id: string;
  texto: string;
  tipo: TipoFrase;
  activa: boolean;
  createdAt: string;
}

export default function GestionFrases() {
  const [frases, setFrases] = useState<Frase[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fraseToDelete, setFraseToDelete] = useState<string | null>(null);

  // Modal state
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoFrase>('MOTIVACIONAL_ALTA');

  const fetchFrases = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/frases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // asumiendo que el token se guarda aquí
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFrases(data);
      }
    } catch (error) {
      console.error('Error fetching frases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrases();
  }, []);

  const handleCrearFrase = async () => {
    if (!nuevoTexto.trim()) return;
    try {
      const response = await fetch('http://localhost:3000/api/frases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ texto: nuevoTexto, tipo: nuevoTipo })
      });
      if (response.ok) {
        setIsModalOpen(false);
        setNuevoTexto('');
        fetchFrases();
      }
    } catch (error) {
      console.error('Error creating frase:', error);
    }
  };

  const promptDeleteFrase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFraseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteFrase = async () => {
    if (!fraseToDelete) return;
    try {
      const response = await fetch(`http://localhost:3000/api/frases/${fraseToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setFrases(prev => prev.filter(f => f.id !== fraseToDelete));
        setIsDeleteModalOpen(false);
        setFraseToDelete(null);
      } else {
        console.error('Error al borrar la frase');
      }
    } catch (error) {
      console.error('Error al borrar la frase:', error);
    }
  };

  const agrupadas = frases.reduce((acc, frase) => {
    if (!acc[frase.tipo]) acc[frase.tipo] = [];
    acc[frase.tipo].push(frase);
    return acc;
  }, {} as Record<TipoFrase, Frase[]>);

  return (
    <div 
      className="p-8 text-[#1B254B] bg-[#F4F7FE] min-h-[calc(100vh-80px)] rounded-3xl" 
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Frases</h1>
            <p className="text-gray-500 mt-2 font-medium">Administra las frases dinámicas del dashboard</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#A9D42C] text-white px-8 py-3.5 rounded-2xl font-black transition-transform hover:scale-105 active:scale-95"
            style={{ boxShadow: '0px 4px 10px rgba(169,212,44,0.2)' }}
          >
            + Crear Nueva Frase
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 font-bold text-gray-400">
            Cargando frases dinámicas...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {(Object.keys(TIPOS_FRASE) as TipoFrase[]).map(tipo => (
              <div 
                key={tipo} 
                className="bg-white p-6 rounded-2xl"
                style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)' }}
              >
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                  <h2 className="font-bold text-lg">{TIPOS_FRASE[tipo]}</h2>
                  <span className="bg-[#F4F7FE] text-[#1B254B] px-3 py-1 rounded-lg text-xs font-bold">
                    {agrupadas[tipo]?.length || 0}
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {agrupadas[tipo]?.length > 0 ? (
                    agrupadas[tipo].map(frase => (
                      <div key={frase.id} className="p-5 rounded-2xl relative group bg-[#F4F7FE] hover:shadow-[0px_4px_15px_rgba(0,0,0,0.03)] transition-all border border-transparent hover:border-gray-100 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[15px] font-medium pr-12 leading-relaxed text-[#1B254B]/90">{frase.texto}</p>
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${frase.activa ? 'bg-[#A9D42C]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                          <button 
                            onClick={(e) => promptDeleteFrase(frase.id, e)}
                            className="text-gray-400 hover:text-red-400 bg-white shadow-sm p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Eliminar Frase"
                          >
                            <Trash2 className="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-medium text-gray-400 text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                      Aún no hay frases aquí
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Glassmorphism overlay */}
          <div 
            className="absolute inset-0 bg-white/40 backdrop-blur-[6px]"
            onClick={() => setIsModalOpen(false)}
          />
          {/* Modal Content */}
          <div 
            className="relative bg-white w-full max-w-lg rounded-[28px] p-8 transform transition-all"
            style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.15)' }}
          >
            <h2 className="text-2xl font-bold mb-7">Crear Nueva Frase</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Tipo de Frase</label>
                <select 
                  className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-[#A9D42C] bg-[#F4F7FE] bg-opacity-50 text-sm font-bold text-[#1B254B] transition-all cursor-pointer"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as TipoFrase)}
                >
                  {Object.entries(TIPOS_FRASE).map(([key, label]) => (
                    <option key={key} value={key} className="font-medium text-[#1B254B]">{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Texto de la frase</label>
                <textarea 
                  className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-[#A9D42C] bg-[#F4F7FE] bg-opacity-50 text-[15px] font-medium resize-none h-36 transition-all"
                  placeholder="Inspira al coachee con un buen mensaje..."
                  value={nuevoTexto}
                  onChange={(e) => setNuevoTexto(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl font-bold text-gray-500 bg-[#F4F7FE] hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearFrase}
                disabled={!nuevoTexto.trim()}
                className="flex-[2] bg-[#A9D42C] text-white px-4 py-4 rounded-2xl font-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                style={{ boxShadow: '0px 4px 10px rgba(169,212,44,0.2)' }}
              >
                Crear Frase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-white/40 backdrop-blur-[6px]"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div 
            className="relative bg-white w-full max-w-sm rounded-[28px] p-8 text-center transform transition-all"
            style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.15)' }}
          >
            <div className="mx-auto w-[68px] h-[68px] bg-red-50 rounded-full flex flex-col items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-[22px] font-black text-[#1B254B] mb-3">Eliminar Frase</h2>
            <p className="text-[15px] text-gray-500 mb-8 leading-relaxed font-medium">
              ¿Estás seguro de que deseas eliminar esta frase permanentemente?
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl font-bold text-[#1B254B] bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.02)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteFrase}
                className="flex-1 bg-red-500 text-white px-4 py-4 rounded-2xl font-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: '0px 4px 10px rgba(239,68,68,0.2)' }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
