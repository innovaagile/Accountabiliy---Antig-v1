import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/config';
import { Check, AlertCircle } from 'lucide-react';

interface B2BMetric {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  cargo: string;
  consistencia: number;
  rango: string;
  estadoHealth: "On Track" | "At Risk";
}

export const B2BConsolidatedTable = ({ filters }: { filters?: any }) => {
  const [metrics, setMetrics] = useState<B2BMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters?.search) queryParams.append('search', filters.search);
        if (filters?.empresas?.length > 0) queryParams.append('empresas', filters.empresas.join(','));
        if (filters?.cargos?.length > 0) queryParams.append('cargos', filters.cargos.join(','));

        const response = await apiFetch(`/admin/metrics/consolidated?${queryParams.toString()}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching consolidated metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchMetrics();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-gray-50 shadow-sm mt-6">
        <p className="text-gray-400 font-bold animate-pulse">Calculando métricas corporativas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-[#1B254B]">Salud Global de la Cartera</h2>
          <p className="text-sm text-gray-400 font-medium">Estado de adopción y uso en tiempo real</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Ejecutivo</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Empresa / Cargo</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">Consistencia</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">Rango</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {metrics.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold text-[#1B254B] block">{m.nombre}</span>
                  <span className="text-xs font-medium text-gray-400">{m.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-[#1B254B] block">{m.empresa}</span>
                  <span className="text-xs font-medium text-gray-400">{m.cargo}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center">
                    <span className={`text-xl font-black ${m.consistencia >= 70 ? 'text-[#A9D42C]' : m.consistencia >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {m.consistencia}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F4F5F7] text-gray-600 border border-gray-200">
                    {m.rango}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {m.estadoHealth === 'On Track' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#eef7d5] text-[#A9D42C]">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-bold">On Track</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">At Risk</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {metrics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-gray-400 font-bold">No hay usuarios que coincidan con los filtros.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
