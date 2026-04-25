import React from 'react';

const CoacheeDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 max-w-4xl mx-auto mt-10 relative text-center">
        <h2 className="text-3xl font-black text-[#1B254B] mb-4">
          Bienvenido a tu Panel de Resultados
        </h2>
        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
          Tu plan de acción y métricas están siendo configurados. Pronto verás aquí tus compromisos.
        </p>
      </div>
    </div>
  );
};

export default CoacheeDashboard;
