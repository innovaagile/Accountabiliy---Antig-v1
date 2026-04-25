import { apiFetch } from '../api/config';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const CambiarPassword = () => {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);
  
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    if (nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          passwordActual,
          nuevaPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      // Si tiene diagnostico completado va al dashboard, sino al diagnostico
      if (user?.hasDiagnostico === true || user?.hasCompletedDiagnostic === true) {
        navigate('/dashboard');
      } else {
        navigate('/diagnostico');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 max-w-md w-full mx-auto relative">
        
        {/* Logo Container */}
        <div className="bg-white rounded-3xl shadow-sm p-4 w-24 h-24 mx-auto flex items-center justify-center mb-6 absolute -top-12 left-1/2 transform -translate-x-1/2">
          <img src="/logo.png" alt="InnovaAgile Logo" className="max-w-full max-h-full object-contain" />
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-black text-[#1B254B] text-center mb-2">
            Personaliza tu Acceso
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold text-center mb-8">
            Paso de Seguridad Obligatorio
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-3 text-center mb-4">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="passwordActual" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Contraseña Temporal
            </label>
            <div className="mt-1 relative">
              <input
                id="passwordActual"
                type={showPassword1 ? "text" : "password"}
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="bg-[#F4F7FE] outline-none border-none rounded-2xl p-4 w-full text-[#1B254B] font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#A9D42C] transition-all pr-12"
                placeholder="La que recibiste por email"
              />
              <button
                type="button"
                onClick={() => setShowPassword1(!showPassword1)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#1B254B] transition-colors focus:outline-none"
              >
                {showPassword1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="nuevaPassword" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Nueva Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                id="nuevaPassword"
                type={showPassword2 ? "text" : "password"}
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="bg-[#F4F7FE] outline-none border-none rounded-2xl p-4 w-full text-[#1B254B] font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#A9D42C] transition-all pr-12"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#1B254B] transition-colors focus:outline-none"
              >
                {showPassword2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmarPassword" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Confirmar Nueva Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmarPassword"
                type={showPassword3 ? "text" : "password"}
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="bg-[#F4F7FE] outline-none border-none rounded-2xl p-4 w-full text-[#1B254B] font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#A9D42C] transition-all pr-12"
                placeholder="Repite tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword3(!showPassword3)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#1B254B] transition-colors focus:outline-none"
              >
                {showPassword3 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2A355A] hover:bg-[#1B254B] text-white font-bold rounded-2xl w-full py-4 mt-6 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Actualizar y Continuar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPassword;
