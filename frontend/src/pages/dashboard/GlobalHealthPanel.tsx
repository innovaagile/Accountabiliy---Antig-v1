import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Activity, Zap } from 'lucide-react';

interface MetricData {
  rachaPromedio: number;
  compromisoPromedio: number;
  histogramaRacha: { name: string; value: number }[];
  mixOperativo: { name: string; value: number }[];
}

export const GlobalHealthPanel: React.FC<{ data: MetricData | null }> = ({ data }) => {
  if (!data) return null;

  // Mock datos para la tendencia semanal (Requerimiento Hito 1)
  const tendenciaMock = [
    { semana: 'Sem 1', consistencia: 65 },
    { semana: 'Sem 2', consistencia: 72 },
    { semana: 'Sem 3', consistencia: 68 },
    { semana: 'Sem 4', consistencia: data.compromisoPromedio }
  ];

  const pieColors = ['#A9D42C', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Racha Promedio</p>
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
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Compromiso Global</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-[#1B254B]">{data.compromisoPromedio}%</span>
              <span className="text-sm font-bold text-[#A9D42C] mb-2 bg-[#A9D42C]/10 px-2 py-0.5 rounded-full">On Track</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histograma */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <h3 className="text-sm font-black text-[#1B254B] mb-6 uppercase tracking-wider">Distribución de Rachas</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.histogramaRacha}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencia Semanal */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <h3 className="text-sm font-black text-[#1B254B] mb-6 uppercase tracking-wider">Tendencia Semanal (%)</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tendenciaMock}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="consistencia" fill="#A9D42C" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mix Operativo */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <h3 className="text-sm font-black text-[#1B254B] mb-2 uppercase tracking-wider">Mix Operativo</h3>
          <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
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
