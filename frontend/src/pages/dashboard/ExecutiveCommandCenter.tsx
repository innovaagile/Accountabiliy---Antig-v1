import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/config';
import { MasterFilterBar } from './MasterFilterBar';
import { GlobalHealthPanel } from './GlobalHealthPanel';
import { B2BConsolidatedTable } from './B2BConsolidatedTable';
import { ReporteEjecutivoPDF } from '../../components/reportes/ReporteEjecutivoPDF';
import { Printer } from 'lucide-react';

interface ExecutiveFilters {
  search: string;
  empresas: string[];
  cargos: string[];
  fechaInicio: string;
  fechaFin: string;
}

export const ExecutiveCommandCenter = () => {
  const [filters, setFilters] = useState<ExecutiveFilters>({
    search: '',
    empresas: [],
    cargos: [],
    fechaInicio: '',
    fechaFin: ''
  });

  const [globalMetrics, setGlobalMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const [baseUsers, setBaseUsers] = useState<any[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchBaseUsers = async () => {
      try {
        const response = await apiFetch('/admin/users/list');
        const data = await response.json();
        setBaseUsers(data);
        
        // Extract unique companies
        const companies = Array.from(new Set(data.map((u: any) => u.company.nombre))).filter(Boolean) as string[];
        setAvailableCompanies(companies.sort());
      } catch (error) {
        console.error('Error fetching base users for filters:', error);
      }
    };
    fetchBaseUsers();
  }, []);

  useEffect(() => {
    // Dynamic role filtering based on selected company
    if (filters.empresas.length > 0 && filters.empresas[0]) {
      const selectedCompany = filters.empresas[0];
      const rolesInCompany = baseUsers
        .filter(u => u.company.nombre === selectedCompany)
        .map(u => u.cargo)
        .filter(Boolean);
      setAvailableRoles(Array.from(new Set(rolesInCompany)).sort() as string[]);
      
      // Clear selected role if it doesn't exist in new company
      if (filters.cargos.length > 0 && !rolesInCompany.includes(filters.cargos[0])) {
        setFilters(prev => ({ ...prev, cargos: [] }));
      }
    } else {
      const allRoles = baseUsers.map(u => u.cargo).filter(Boolean);
      setAvailableRoles(Array.from(new Set(allRoles)).sort() as string[]);
    }
  }, [filters.empresas, baseUsers]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.empresas.length > 0) queryParams.append('empresas', filters.empresas.join(','));
        if (filters.cargos.length > 0) queryParams.append('cargos', filters.cargos.join(','));
        if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
        if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);

        const response = await apiFetch(`/admin/metrics/executive?${queryParams.toString()}`);
        const data = await response.json();
        setGlobalMetrics(data);
      } catch (error) {
        console.error('Error fetching executive metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce simple
    const timeoutId = setTimeout(() => {
      fetchMetrics();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return (
    <div className="animate-in fade-in duration-300">
      
      {isPrinting && (
        <ReporteEjecutivoPDF 
          filters={filters}
          onReadyToPrint={() => window.print()}
          onClose={() => setIsPrinting(false)}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1B254B]">Executive Command Center</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Supervisión en tiempo real del progreso de todos los ejecutivos.</p>
        </div>
        <button 
          onClick={() => setIsPrinting(true)}
          className="bg-white border border-[#A9D42C] text-[#A9D42C] hover:bg-[#eef7d5] transition-colors px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-5 h-5" />
          Exportar a PDF
        </button>
      </div>

      <MasterFilterBar 
        filters={filters} 
        setFilters={setFilters} 
        availableCompanies={availableCompanies}
        availableRoles={availableRoles}
      />

      {loading ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>
                <div className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>
                <div className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>
                <div className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>
            </div>
            <div className="h-96 bg-gray-100 animate-pulse rounded-2xl mt-6"></div>
        </div>
      ) : (
        <>
            <GlobalHealthPanel data={globalMetrics} />
            <div className="mt-8">
                {/* Reutilizamos la tabla que ya armamos antes, asumiendo que después la conectaremos a los mismos filtros */}
                <B2BConsolidatedTable filters={filters} />
            </div>
        </>
      )}
    </div>
  );
};
