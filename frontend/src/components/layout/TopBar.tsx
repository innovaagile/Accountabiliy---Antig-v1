import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const TopBar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 fixed top-0 right-0 left-64 z-10 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{user?.nombre}</span>
            <span className="text-xs text-gray-500 font-medium">{user?.role}</span>
          </div>
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
