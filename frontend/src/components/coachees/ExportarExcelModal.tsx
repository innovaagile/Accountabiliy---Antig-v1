import React, { useState } from 'react';
import { X, FileSpreadsheet, Download } from 'lucide-react';

interface ExportarExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportarExcelModal: React.FC<ExportarExcelModalProps> = ({ isOpen, onClose }) => {
  const [filtros, setFiltros] = useState({
    empresa: 'Todas',
    cargo: 'Todos',
    desde: '',
    hasta: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleExportar = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica futura para solicitar el Excel al backend con estos filtros
    console.log('Exportando reporte con filtros:', filtros);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Exportar Reporte Excel</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleExportar} className="p-6 space-y-5">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select 
                name="empresa" 
                value={filtros.empresa} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Todas">Todas</option>
                <option value="InnovaAgile">InnovaAgile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select 
                name="cargo" 
                value={filtros.cargo} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Todos">Todos</option>
                <option value="Gerente">Gerente</option>
                <option value="Jefe de Área">Jefe de Área</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input 
                type="date" 
                name="desde" 
                value={filtros.desde} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-600" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input 
                type="date" 
                name="hasta" 
                value={filtros.hasta} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-600" 
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button 
              type="submit"
              className="flex items-center gap-2 px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Excel
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ExportarExcelModal;