import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      if (user.debeCambiarPassword) {
        navigate('/cambiar-password');
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else if (user.role === 'COACHEE') {
        if (user.hasDiagnostico === false) {
          navigate('/diagnostico');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
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
            Accountability Coaching
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold text-center mb-8">
            Inicia sesión para continuar
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-3 text-center mb-4">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Correo Electrónico
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F4F7FE] outline-none border-none rounded-2xl p-4 w-full text-[#1B254B] font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#A9D42C] transition-all"
                placeholder="admin@innovaagile.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Contraseña
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#F4F7FE] outline-none border-none rounded-2xl p-4 w-full text-[#1B254B] font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#A9D42C] transition-all"
                placeholder="••••••••"
              />
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
                'Iniciar Sesión'
              )}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-[#4A5568] font-medium hover:text-[#2A355A] cursor-pointer inline-block transition-colors">
              ¿Olvidaste tu contraseña?
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
