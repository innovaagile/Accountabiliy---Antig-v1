import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, UploadCloud, FileSpreadsheet, BarChart2, MessageSquare,
  Search, Eye, ListTodo, RefreshCw, Info, UserMinus, Briefcase, Clock, Smartphone
} from 'lucide-react';
import CrearCoacheeModal from '../../components/coachees/CrearCoacheeModal';
import CargaMasivaModal from '../../components/coachees/CargaMasivaModal';
import ExportarExcelModal from '../../components/coachees/ExportarExcelModal';

const DashboardHome = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCargaMasivaOpen, setIsCargaMasivaOpen] = useState(false);
  const [isExportarOpen, setIsExportarOpen] = useState(false);
  const [coachees, setCoachees] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [servicio, setServicio] = useState('');
  const [estado, setEstado] = useState('');

  // Efecto que llama a la Base de Datos con debounce
  useEffect(() => {
    const fetchCoachees = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (empresa) queryParams.append('empresa', empresa);
        if (cargo) queryParams.append('cargo', cargo);
        if (servicio) queryParams.append('servicio', servicio);
        if (estado) queryParams.append('estado', estado);

        const response = await fetch(`http://localhost:3000/api/coachees?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCoachees(data);
        }
      } catch (error) {
        console.error('Error al cargar la BD:', error);
      }
    };

    const timer = setTimeout(() => {
      fetchCoachees();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, empresa, cargo, servicio, estado]);

  const handleAgregarCoachee = (nuevoCoachee: any) => {
    setCoachees([...coachees, nuevoCoachee]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">Total Coachees</p>
          <p className="text-3xl font-bold text-lime-500 mt-1">{coachees.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col justify-center border-t-4 border-t-teal-500">
          <p className="text-sm font-medium text-gray-500">Puntualidad Promedio</p>
          <p className="text-3xl font-bold text-teal-500 mt-1">0%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col justify-center border-t-4 border-t-gray-800">
          <p className="text-sm font-medium text-gray-500">Consistencia Promedio</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">0%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"><UserPlus className="w-4 h-4" />+ Crear Nuevo Coachee</button>
        <button onClick={() => setIsCargaMasivaOpen(true)} className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"><UploadCloud className="w-4 h-4" />Carga Masiva</button>
        <button onClick={() => setIsExportarOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"><FileSpreadsheet className="w-4 h-4" />Exportar Excel</button>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"><BarChart2 className="w-4 h-4" />Métricas</button>
        <Link to="/dashboard/frases" className="flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"><MessageSquare className="w-4 h-4" />Gestionar Frases</Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600" value={empresa} onChange={e=>setEmpresa(e.target.value)}>
            <option value="">Empresa (Todas)</option>
            <option value="InnovaAgile">InnovaAgile</option>
            <option value="Cliente A">Cliente A</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600" value={cargo} onChange={e=>setCargo(e.target.value)}>
            <option value="">Cargo (Todos)</option>
            <option value="Gerente">Gerente</option>
            <option value="Director">Director</option>
            <option value="Jefe de Área">Jefe de Área</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600" value={servicio} onChange={e=>setServicio(e.target.value)}>
            <option value="">Servicio (Todos)</option>
            <option value="SPRINT_4S">Sprint 4S</option>
            <option value="SPRINT EJECUTIVO">Sprint Ejecutivo</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600" value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="">Estado (Todos)</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-semibold text-gray-800">Mis Coachees</h3></div>
        <div className="divide-y divide-gray-200">
          {coachees.map((coachee) => (
            <div key={coachee.id} className="p-6 flex flex-col xl:flex-row xl:items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex-1 mb-4 xl:mb-0">
                <h4 className="text-md font-bold text-gray-900">{coachee.nombre}</h4>
                <p className="text-sm text-gray-500">{coachee.email}</p>
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1 mt-1"><Smartphone className="w-3.5 h-3.5 text-gray-400" /> {coachee.telefono}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><Briefcase className="w-3.5 h-3.5" /> {coachee.plan}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100"><Clock className="w-3.5 h-3.5" /> {coachee.frecuencia}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap justify-end">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${coachee.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{coachee.estado}</span>
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /> Ver Página</button>
                <Link to={`/dashboard/coachee/${coachee.id}?action=new-task`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"><ListTodo className="w-4 h-4" /> Hábitos</Link>
                <Link to={`/dashboard/coachee/${coachee.id}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"><Info className="w-4 h-4" /> Info</Link>
                <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"><UserMinus className="w-4 h-4" /> Desact.</button>
              </div>
            </div>
          ))}
          {coachees.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No hay coachees registrados en la base de datos.</p>}
        </div>
      </div>

      <CrearCoacheeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onGuardar={handleAgregarCoachee} />
      <CargaMasivaModal isOpen={isCargaMasivaOpen} onClose={() => setIsCargaMasivaOpen(false)} />
      <ExportarExcelModal isOpen={isExportarOpen} onClose={() => setIsExportarOpen(false)} />
    </div>
  );
};
export default DashboardHome;