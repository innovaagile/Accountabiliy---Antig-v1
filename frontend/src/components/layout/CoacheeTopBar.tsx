import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const CoacheeTopBar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
        
        {/* Izquierda: Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="InnovaAgile" className="h-8 object-contain" />
        </div>
        
        {/* Centro: Navegación */}
        <div className="hidden md:flex gap-8 h-full">
          <button className="text-[#A9D42C] font-black text-sm uppercase tracking-wide border-b-2 border-[#A9D42C] h-full flex items-center">
            Marca tus tareas
          </button>
          <button className="text-gray-400 font-bold text-sm hover:text-[#1B254B] uppercase tracking-wide transition-colors h-full flex items-center">
            Mis avances
          </button>
          <button className="text-gray-400 font-bold text-sm hover:text-[#1B254B] uppercase tracking-wide transition-colors h-full flex items-center">
            Mi compromiso
          </button>
        </div>
        
        {/* Derecha: Perfil y Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1B254B] leading-none">{user?.nombre} {user?.apellido}</p>
            <p className="text-[10px] font-black text-[#A9D42C] uppercase tracking-wider mt-1">{user?.role}</p>
          </div>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#1B254B] font-bold text-xs uppercase sm:hidden">
            {user?.nombre?.[0]}{user?.apellido?.[0]}
          </div>
          <button 
            onClick={logout} 
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-50 flex items-center gap-2"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold hidden lg:inline">Salir</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CoacheeTopBar;
