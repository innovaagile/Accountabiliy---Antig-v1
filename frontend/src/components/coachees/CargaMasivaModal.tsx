import React, { useState } from 'react';
import { X, UploadCloud, FileType, DownloadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api/config';

interface CargaMasivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CargaMasivaModal: React.FC<CargaMasivaModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSuccess(null);
      setError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiFetch('/coachees/export/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "plantilla_carga_masiva.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error descargando plantilla", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/coachees/import/masivo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setFile(null);
        // Podríamos recargar la página o avisar al padre, pero esto está bien.
      } else {
        setError(data.error || 'Error procesando el archivo.');
      }
    } catch (err) {
      setError('Error de red al intentar importar el archivo.');
    } finally {
      setLoading(false);
    }
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div>
              <p className="font-bold text-gray-900 mb-1">1. Descarga la plantilla oficial</p>
              <p className="text-sm text-gray-600">Completa las filas donde cada una representa una TAREA, y agrupa a los usuarios por su Email o Teléfono.</p>
            </div>
            <button 
              type="button" 
              onClick={handleDownloadTemplate}
              className="flex items-center shrink-0 gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <DownloadCloud className="w-4 h-4 text-blue-600" />
              Descargar Template
            </button>
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
                  {file ? file.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                {success}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-4">
              <button 
                type="submit"
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                {loading ? 'Procesando...' : 'Iniciar Carga'}
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