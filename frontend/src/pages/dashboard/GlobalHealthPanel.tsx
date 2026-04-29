import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LabelList } from 'recharts';
import { Activity, Zap } from 'lucide-react';
import { InfoPopover } from '../../components/ui/InfoPopover';

interface MetricData {
  rachaPromedio: number;
  compromisoPromedio: number;
  tendenciaSemanal: { semana: string; consistencia: number }[];
  histogramaRacha: { name: string; value: number }[];
  mixOperativo: { name: string; value: number }[];
}

export const GlobalHealthPanel: React.FC<{ data: MetricData | null }> = ({ data }) => {
  if (!data) return null;

  const pieColors = ['#A9D42C', '#F59E0B'];

  let compromisBg = 'bg-red-50';
  let compromisText = 'text-red-600';
  let compromisLabel = 'Incumplimiento';
  
  if (data.compromisoPromedio > 80) {
    compromisBg = 'bg-[#eef7d5]';
    compromisText = 'text-[#A9D42C]';
    compromisLabel = 'Cumpliendo';
  } else if (data.compromisoPromedio > 50) {
    compromisBg = 'bg-amber-50';
    compromisText = 'text-[#F59E0B]';
    compromisLabel = 'Intermedio';
  }

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Racha Promedio</p>
              <InfoPopover content="Promedio de días consecutivos en los que el equipo filtrado ha completado al menos una tarea." position="bottom" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-[#1B254B]">{data.rachaPromedio}</span>
              <span className="text-lg font-bold text-gray-400 mb-1">días</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#eef7d5] flex items-center justify-center shrink-0">
            <Activity className="w-8 h-8 text-[#A9D42C]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Compromiso Global</p>
              <InfoPopover content="% de cumplimiento de tareas del grupo filtrado. Por defecto, muestra el ciclo activo actual." position="bottom" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-[#1B254B]">{data.compromisoPromedio}%</span>
              <span className={`text-sm font-bold ${compromisText} mb-2 ${compromisBg} px-2 py-0.5 rounded-full`}>{compromisLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histograma */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-black text-[#1B254B] uppercase tracking-wider">Distribución de Rachas</h3>
            <InfoPopover content="Agrupación de los ejecutivos según la longitud de su racha activa actual." position="bottom" />
          </div>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.histogramaRacha}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} barSize={32}>
                  <LabelList dataKey="value" position="top" fill="#1B254B" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia Semanal */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-black text-[#1B254B] uppercase tracking-wider">Tendencia Semanal (%)</h3>
            <InfoPopover content="Evolución del porcentaje de tareas completadas frente a las programadas, agrupado por semanas reales." position="bottom" />
          </div>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.tendenciaSemanal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="consistencia" radius={[6, 6, 0, 0]} barSize={32}>
                  <LabelList dataKey="consistencia" position="top" formatter={(val: number) => `${val}%`} fill="#1B254B" fontSize={12} fontWeight="bold" />
                  {data.tendenciaSemanal.map((entry, index) => {
                    let color = '#EF4444';
                    if (entry.consistencia >= 80) color = '#A9D42C';
                    else if (entry.consistencia >= 50) color = '#F59E0B';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mix Operativo */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-black text-[#1B254B] uppercase tracking-wider">Mix Operativo</h3>
            <InfoPopover content="Distribución de la carga de tareas asignadas (Diarias vs. Semanales). Es un indicador de diseño, no de ejecución." position="bottom" />
          </div>
          <div className="flex-1 w-full mt-4 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.mixOperativo}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.mixOperativo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  wrapperStyle={{ zIndex: 1000 }}
                  formatter={(value: any) => [`${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend central */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-2xl font-black text-[#1B254B]">{data.mixOperativo[0]?.value}%</span>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diarias</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#A9D42C]"></div>
              <span className="text-xs font-bold text-gray-500">Diarias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
              <span className="text-xs font-bold text-gray-500">Semanales</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
