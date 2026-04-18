import React, { useState } from 'react';
import { X, UploadCloud, FileType } from 'lucide-react';

interface CargaMasivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CargaMasivaModal: React.FC<CargaMasivaModalProps> = ({ isOpen, onClose }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;
    // Lógica futura para procesar el Excel en el backend
    console.log('Procesando archivo:', fileName);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">Carga Masiva de Coachees</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Sube un archivo Excel (.xlsx) o CSV con las siguientes columnas:
          </p>

          {/* Caja de instrucciones de columnas */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs text-gray-700 space-y-3 shadow-inner">
            <div>
              <p className="font-bold text-gray-900 mb-1">Columnas requeridas:</p>
              <p>nombre | apellido | email | pais | empresa | cargo | objetivoProceso</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Columnas opcionales (para crear ciclo y tareas):</p>
              <p>FechaInicioProceso | DuracionProceso | FechaTerminoProceso</p>
              <p>Tarea1 | Periodicidad1 | Hora1 | Tarea2 | Periodicidad2 | Hora2 | ...</p>
              <p className="text-gray-500 italic mt-1">(Hasta 5 tareas por coachee)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <FileType className="w-4 h-4 mr-2 text-blue-600" />
                  Seleccionar archivo
                  <input type="file" accept=".xlsx, .csv" className="hidden" onChange={handleFileChange} />
                </label>
                <span className="text-sm text-gray-500">
                  {fileName ? fileName : 'Ningún archivo seleccionado'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button 
                type="submit"
                disabled={!fileName}
                className="flex items-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                Iniciar Carga
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default CargaMasivaModal;