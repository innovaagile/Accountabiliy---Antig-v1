import { apiFetch } from '../../api/config';
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CrearCoacheeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (nuevoCoachee: any) => void;
}

const CrearCoacheeModal: React.FC<CrearCoacheeModalProps> = ({ isOpen, onClose, onGuardar }) => {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', pais: 'Chile', telefono: '',
    empresa: '', cargo: '', servicio: 'Sprint Digital 4S', frecuencia: 'Cada vez que debe hacer un compromiso'});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      console.log("🚀 Disparando fetch directamente a: http://localhost:3000/api/coachees");
      const response = await apiFetch('/coachees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar. Verifica los permisos.');
      }

      const nuevoCoacheeBackend = await response.json();
      onGuardar(nuevoCoacheeBackend);
      
      setFormData({
        nombre: '', apellido: '', email: '', pais: 'Chile', telefono: '',
        empresa: '', cargo: '', servicio: 'Sprint Digital 4S', frecuencia: 'Cada vez que debe hacer un compromiso'
      });
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Crear Nuevo Coachee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label><input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido <span className="text-red-500">*</span></label><input required type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label><input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">País</label><input type="text" name="pais" value={formData.pais} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">+56</span><input required type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="flex-1 w-full border border-gray-300 rounded-none rounded-r-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label><input type="text" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label><input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Configuración del Producto</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Servicio Contratado <span className="text-red-500">*</span></label><select required name="servicio" value={formData.servicio} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option value="Audit Toolkit">Audit Toolkit</option><option value="Sprint Digital 4S">Sprint Digital 4S</option><option value="Executive Mastery">Executive Mastery</option><option value="Enterprise Execution">Enterprise Execution</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de Recordatorios <span className="text-red-500">*</span></label><select required name="frecuencia" value={formData.frecuencia} onChange={handleChange} className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option value="Cada vez que debe hacer un compromiso">Cada vez que debe hacer un compromiso</option><option value="Una vez al día en la mañana">Una vez al día en la mañana</option></select></div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 pt-6 pb-2">
            {errorMsg && <div className="text-red-500 font-bold text-sm w-full text-right">{errorMsg}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-lime-500 hover:bg-lime-600 disabled:opacity-50">{loading ? 'Guardando...' : 'Crear Coachee'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CrearCoacheeModal;