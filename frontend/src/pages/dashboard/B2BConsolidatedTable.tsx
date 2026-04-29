import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/config';
import { Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { InfoPopover } from '../../components/ui/InfoPopover';

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
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

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

      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Ejecutivo</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Empresa / Cargo</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">
                <div className="flex items-center justify-center gap-2">
                  Consistencia
                  <InfoPopover content="Nivel de cumplimiento histórico individual del ejecutivo frente a su carga total." position="bottom" />
                </div>
              </th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">
                <div className="flex items-center justify-center gap-2">
                  Rango
                  <InfoPopover content="Nivel actual del ejecutivo dentro del sistema gamificado, basado en su constancia acumulada." position="bottom" />
                </div>
              </th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">
                <div className="flex items-center justify-end gap-2">
                  Estado
                  <InfoPopover content="Clasificación automática del rendimiento basada en su porcentaje de Consistencia (Incumplimiento, Intermedio, Cumpliendo)." position="bottom" align="end" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {metrics.map((m) => (
              <React.Fragment key={m.id}>
                <tr 
                  onClick={() => setExpandedRowId(expandedRowId === m.id ? null : m.id)}
                  className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedRowId === m.id ? 'bg-gray-50/30' : ''}`}
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#1B254B] flex items-center gap-2">
                      {m.nombre}
                      {expandedRowId === m.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </span>
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
                    {(() => {
                      let statusBg = 'bg-red-50';
                      let statusText = 'text-red-600';
                      let statusLabel = 'Incumplimiento';
                      let StatusIcon = AlertCircle;
                      
                      if (m.consistencia > 80) {
                        statusBg = 'bg-[#eef7d5]';
                        statusText = 'text-[#A9D42C]';
                        statusLabel = 'Cumpliendo';
                        StatusIcon = Check;
                      } else if (m.consistencia > 50) {
                        statusBg = 'bg-amber-50';
                        statusText = 'text-[#F59E0B]';
                        statusLabel = 'Intermedio';
                        StatusIcon = AlertCircle;
                      }
                      
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${statusBg} ${statusText}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-xs font-bold">{statusLabel}</span>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
                {expandedRowId === m.id && (
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-gray-100">
                      <DrillDownPanel userId={m.id} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
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

const DrillDownPanel = ({ userId }: { userId: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string>('Todas las Tareas');

  useEffect(() => {
    const fetchDrillDown = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/admin/metrics/drilldown/${userId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrillDown();
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-gray-400 font-bold bg-[#F9FAFB] shadow-inner">Analizando tendencia y benchmark del cargo...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-400 font-bold bg-[#F9FAFB] shadow-inner">Este usuario no tiene tareas activas para comparar.</div>;
  }

  const isGrouped = selectedTask === 'Todas las Tareas';
  let chartData: any[] = [];

  if (isGrouped) {
    chartData = data.map(d => ({
      name: d.nombre,
      usuario: d.consistenciaUsuario,
      benchmark: d.consistenciaBenchmark
    }));
    
    const avgUser = Math.round(data.reduce((acc, d) => acc + d.consistenciaUsuario, 0) / data.length);
    const avgBench = Math.round(data.reduce((acc, d) => acc + d.consistenciaBenchmark, 0) / data.length);
    
    chartData.push({
      name: 'Promedio General',
      usuario: avgUser,
      benchmark: avgBench
    });
  } else {
    chartData = data.filter(d => d.nombre === selectedTask).map(d => {
      let userColor = '#EF4444';
      if (d.consistenciaUsuario >= 80) userColor = '#A9D42C';
      else if (d.consistenciaUsuario >= 50) userColor = '#F59E0B';
      
      return [
        {
          name: 'Usuario',
          consistencia: d.consistenciaUsuario,
          fill: userColor
        },
        {
          name: 'Promedio del Cargo',
          consistencia: d.consistenciaBenchmark,
          fill: '#E5E7EB'
        }
      ];
    }).flat();
  }

  return (
    <div className="p-6 bg-[#F9FAFB] shadow-inner animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-[#1B254B] font-black text-lg flex items-center gap-2">
            La Lupa de Diagnóstico
          </h3>
          <p className="text-gray-500 text-sm font-medium mt-1">Comparativa de rendimiento de este usuario frente a sus pares de cargo.</p>
        </div>
        <div className="mt-4 md:mt-0 min-w-[250px] relative">
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="block w-full pl-4 pr-10 py-2.5 text-sm border-2 border-gray-200 bg-white focus:outline-none focus:ring-0 focus:border-[#A9D42C] rounded-xl font-bold text-[#1B254B] transition-colors appearance-none cursor-pointer shadow-sm"
          >
            <option value="Todas las Tareas">Todas las Tareas</option>
            {data.map(d => (
              <option key={d.id} value={d.nombre}>{d.nombre}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 'bold' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [`${value}%`, name === 'usuario' ? 'Usuario' : name === 'benchmark' ? 'Promedio del Cargo' : name === 'consistencia' ? 'Consistencia' : name]}
            />
            {isGrouped ? (
              <>
                <Bar dataKey="usuario" name="Usuario" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="usuario" position="top" formatter={(val: number) => `${val}%`} fill="#1B254B" fontSize={11} fontWeight="bold" />
                  {chartData.map((entry, index) => {
                    let color = '#EF4444';
                    if (entry.usuario >= 80) color = '#A9D42C';
                    else if (entry.usuario >= 50) color = '#F59E0B';
                    return <Cell key={`cell-user-${index}`} fill={color} />;
                  })}
                </Bar>
                <Bar dataKey="benchmark" name="Promedio del Cargo" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="benchmark" position="top" formatter={(val: number) => `${val}%`} fill="#9CA3AF" fontSize={11} fontWeight="bold" />
                </Bar>
              </>
            ) : (
              <Bar dataKey="consistencia" name="consistencia" radius={[8, 8, 0, 0]} barSize={80}>
                <LabelList dataKey="consistencia" position="top" formatter={(val: number) => `${val}%`} fill="#1B254B" fontSize={12} fontWeight="bold" />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
