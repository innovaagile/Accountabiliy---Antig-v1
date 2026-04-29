import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/config';
import { GlobalHealthPanel } from '../../pages/dashboard/GlobalHealthPanel';

interface ReporteEjecutivoPDFProps {
  filters: any;
  onReadyToPrint: () => void;
  onClose: () => void;
}

export const ReporteEjecutivoPDF: React.FC<ReporteEjecutivoPDFProps> = ({ filters, onReadyToPrint, onClose }) => {
  const [globalMetrics, setGlobalMetrics] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.empresas?.length > 0) queryParams.append('empresas', filters.empresas.join(','));
        if (filters.cargos?.length > 0) queryParams.append('cargos', filters.cargos.join(','));
        if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
        if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);

        // Fetch Global Metrics
        const resGlobal = await apiFetch(`/admin/metrics/executive?${queryParams.toString()}`);
        const dataGlobal = await resGlobal.json();
        setGlobalMetrics(dataGlobal);

        // Fetch Table Metrics
        const resTable = await apiFetch(`/admin/metrics/consolidated?${queryParams.toString()}`);
        const dataTable = await resTable.json();
        setTableData(dataTable);

      } catch (error) {
        console.error('Error fetching data for PDF:', error);
      } finally {
        setLoading(false);
        // Damos tiempo a Recharts para que renderice los gráficos
        setTimeout(() => {
          onReadyToPrint();
        }, 1500);
      }
    };

    fetchData();

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [filters, onReadyToPrint, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#A9D42C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#1B254B] font-bold text-lg">Generando Informe Gerencial...</p>
        <p className="text-gray-400 font-medium text-sm mt-2">Recopilando datos y formateando páginas.</p>
      </div>
    );
  }

  const equipo = (filters.empresas?.length > 0 ? filters.empresas.join(', ') : 'Todas las Empresas') + ' - ' + (filters.cargos?.length > 0 ? filters.cargos.join(', ') : 'Todos los Cargos');
  const periodo = `${filters.fechaInicio ? filters.fechaInicio : 'Inicio del ciclo'} al ${filters.fechaFin ? filters.fechaFin : 'Fin del ciclo'}`;
  const emision = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-[99999] bg-white overflow-auto print:absolute print:inset-0">
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-8 md:p-[20mm] text-[#1B254B] font-['Plus_Jakarta_Sans',_sans-serif]">
        
        {/* PORTADA / CABECERA FORMAL */}
        <div className="mb-10">
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight text-[#1B254B]">Reporte de Auditoría de Ejecución</h1>
            <div className="w-24 h-1.5 bg-[#A9D42C] mt-6 mb-2 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente / Equipo Evaluado</p>
              <p className="text-sm font-bold text-[#1B254B]">{equipo}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Programa Activo</p>
              <p className="text-sm font-bold text-[#1B254B]">Accountability Coaching B2B</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventana de Tiempo</p>
              <p className="text-sm font-bold text-[#1B254B]">{periodo}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
              <p className="text-sm font-bold text-[#1B254B]">{emision}</p>
            </div>
          </div>
        </div>

        {/* CUERPO DE MÉTRICAS */}
        <div className="mb-12" style={{ pageBreakInside: 'avoid' }}>
          <h2 className="text-xl font-black text-[#1B254B] mb-6 border-b border-gray-100 pb-2">1. Resumen Ejecutivo (Global Health)</h2>
          {/* Reutilizamos el panel pero sin sombras agresivas para impresión */}
          <div className="print:shadow-none">
            <GlobalHealthPanel data={globalMetrics} />
          </div>
        </div>

        {/* TABLA DE DATOS A4 */}
        <div style={{ pageBreakInside: 'auto', pageBreakBefore: 'auto' }}>
          <h2 className="text-xl font-black text-[#1B254B] mb-6 border-b border-gray-100 pb-2">2. Desglose de Rendimiento Individual</h2>
          
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-[#1B254B]">
                <th className="py-3 px-4 font-black text-[#1B254B] uppercase tracking-wider text-xs">Ejecutivo</th>
                <th className="py-3 px-4 font-black text-[#1B254B] uppercase tracking-wider text-xs">Cargo</th>
                <th className="py-3 px-4 font-black text-[#1B254B] uppercase tracking-wider text-xs text-center">Consistencia</th>
                <th className="py-3 px-4 font-black text-[#1B254B] uppercase tracking-wider text-xs text-center">Rango</th>
                <th className="py-3 px-4 font-black text-[#1B254B] uppercase tracking-wider text-xs text-right">Estado</th>
              </tr>
            </thead>
            <tbody style={{ pageBreakInside: 'auto' }}>
              {tableData.map((row, idx) => (
                <tr key={row.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{ pageBreakInside: 'avoid' }}>
                  <td className="py-3 px-4 font-bold text-[#1B254B]">
                    {row.nombre}
                    <span className="block text-xs text-gray-500 font-medium">{row.email}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{row.cargo}</td>
                  <td className="py-3 px-4 text-center font-black">
                    <span className={row.consistencia >= 70 ? 'text-[#A9D42C]' : row.consistencia >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                      {row.consistencia}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-600">{row.rango}</td>
                  <td className="py-3 px-4 text-right font-black">
                    {row.consistencia >= 80 ? 'Cumpliendo' : row.consistencia >= 50 ? 'Intermedio' : 'Incumplimiento'}
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">No hay registros para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* APÉNDICE: GLOSARIO (ÚLTIMA PÁGINA) */}
        <div style={{ pageBreakBefore: 'always' }} className="pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[#1B254B]">Apéndice Técnico</h1>
            <div className="w-16 h-1.5 bg-[#A9D42C] mt-4 mb-2 rounded-full"></div>
          </div>
          
          <h2 className="text-xl font-black text-[#1B254B] mb-6 border-b border-gray-100 pb-2">Glosario de Indicadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm">
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Racha Promedio</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Promedio de días consecutivos en los que el equipo filtrado ha completado al menos una tarea.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Compromiso Global</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Porcentaje de cumplimiento total de tareas del grupo filtrado. Por defecto, muestra la adherencia del ciclo activo actual.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Distribución de Rachas</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Agrupación estadística de los ejecutivos según la longitud en días de su racha activa actual.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Tendencia Semanal</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Evolución histórica del porcentaje de tareas completadas frente a las programadas, agrupado por semanas reales.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Mix Operativo</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Distribución de la carga de tareas asignadas (Diarias vs. Semanales). Es un indicador del diseño del programa, no de la ejecución del usuario.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Consistencia (Individual)</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Nivel de cumplimiento histórico e individual del ejecutivo frente a su carga operativa total asignada.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Rango (Gamificación)</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Nivel de prestigio actual del ejecutivo dentro del ecosistema, otorgado en base a su XP (puntos de experiencia) y constancia acumulada.</span>
            </div>
            <div>
              <span className="font-black text-[#1B254B] block mb-1 text-base">Estado de Rendimiento</span> 
              <span className="text-gray-600 font-medium leading-relaxed">Clasificación paramétrica y automática del progreso basada estrictamente en su porcentaje de Consistencia (Cumpliendo: &gt;80%, Intermedio: 50-79%, Incumplimiento: &lt;50%).</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
