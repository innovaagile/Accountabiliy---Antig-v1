import React from 'react';
import { Search, Building, Briefcase, Calendar } from 'lucide-react';

interface FilterProps {
  filters: {
    search: string;
    empresas: string[];
    cargos: string[];
    fechaInicio: string;
    fechaFin: string;
  };
  setFilters: (f: any) => void;
  availableCompanies: string[];
  availableRoles: string[];
}

export const MasterFilterBar: React.FC<FilterProps> = ({ filters, setFilters, availableCompanies, availableRoles }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Para simplificar V1, tomaremos 1 o todas.
    const val = e.target.value;
    setFilters({ ...filters, empresas: val ? [val] : [] });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters({ ...filters, cargos: val ? [val] : [] });
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-4 md:p-6 mb-8 flex flex-wrap gap-4 items-center">
      
      {/* Buscador */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Buscar</label>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Nombre, email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A9D42C]/20 focus:border-[#A9D42C] transition-all font-medium text-[#1B254B]"
          />
        </div>
      </div>

      {/* Empresas */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Empresa</label>
        <div className="relative">
          <Building className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select 
            value={filters.empresas[0] || ''}
            onChange={handleCompanyChange}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A9D42C]/20 focus:border-[#A9D42C] transition-all font-bold text-[#1B254B] appearance-none"
          >
            <option value="">Todas</option>
            {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cargos */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cargo</label>
        <div className="relative">
          <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select 
            value={filters.cargos[0] || ''}
            onChange={handleRoleChange}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A9D42C]/20 focus:border-[#A9D42C] transition-all font-bold text-[#1B254B] appearance-none"
          >
            <option value="">Todos</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Rango de Fechas */}
      <div className="flex-1 min-w-[320px]">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Periodo</label>
        <div className="flex gap-3">
          <div className="relative flex-1 min-w-[140px]">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters({...filters, fechaInicio: e.target.value})}
              className="w-full pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A9D42C]/20 focus:border-[#A9D42C] transition-all text-sm font-medium text-[#1B254B]"
            />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters({...filters, fechaFin: e.target.value})}
              className="w-full pl-9 pr-2 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A9D42C]/20 focus:border-[#A9D42C] transition-all text-sm font-medium text-[#1B254B]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
