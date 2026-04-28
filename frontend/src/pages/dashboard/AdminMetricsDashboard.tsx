import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/config';
import { MisAvances } from './MisAvances';
import { Users, ChartBar, Building, LayoutDashboard } from 'lucide-react';
import { B2BConsolidatedTable } from './B2BConsolidatedTable';

interface CoacheeLight {
  id: string;
  nombre: string;
  email: string;
  company: {
    nombre: string;
  };
}

export const AdminMetricsDashboard = () => {
  const [users, setUsers] = useState<CoacheeLight[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'individual' | 'consolidated'>('individual');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiFetch('/admin/users/list');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users for admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Header and Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1B254B] flex items-center gap-2">
            <ChartBar className="w-8 h-8 text-[#A9D42C]" />
            Panel de Reportabilidad
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            Audita el progreso individual y la salud corporativa
          </p>
        </div>

        {/* Tabs System */}
        <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'individual' 
                ? 'bg-white text-[#1B254B] shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Auditoría Individual
          </button>
          <button
            onClick={() => setActiveTab('consolidated')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'consolidated' 
                ? 'bg-white text-[#1B254B] shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Building className="w-4 h-4" />
            Consolidado Corporativo
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {activeTab === 'individual' && (
          <div className="animate-in fade-in duration-300">
            {/* Selector de Usuario */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-black text-[#1B254B]">Vista Espejo</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Selecciona un ejecutivo para cargar su dashboard en vivo.</p>
              </div>
              <div className="w-full md:w-auto min-w-[300px]">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={selectedUserId}
                    onChange={handleUserChange}
                    disabled={loading || users.length === 0}
                    className="block w-full pl-10 pr-10 py-3 text-base border-2 border-gray-100 bg-gray-50 focus:outline-none focus:ring-0 focus:border-[#A9D42C] sm:text-sm rounded-xl font-bold text-[#1B254B] transition-colors appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>Directorio de Coachees...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.company.nombre})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <p className="text-gray-400 font-bold animate-pulse">Cargando directorio de coachees...</p>
              </div>
            ) : selectedUserId ? (
              <div className="animate-in fade-in duration-500">
                <div className="-mx-4 md:-mx-8">
                  <MisAvances targetUserId={selectedUserId} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <LayoutDashboard className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-400 font-bold text-lg">Selecciona un coachee para previsualizar su dashboard.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consolidated' && (
          <div className="animate-in fade-in duration-300">
            <B2BConsolidatedTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMetricsDashboard;
