import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DetalleCoachee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [coachee, setCoachee] = useState<any>(null);

    useEffect(() => {
        // Petición directa al backend
        fetch(`/api/coachees/${id}`)
            .then(res => res.json())
            .then(data => setCoachee(data))
            .catch(err => console.error("Error de conexión:", err));
    }, [id]);

    if (!coachee) return <div className="p-10 text-center font-medium">Cargando perfil del cliente...</div>;

    return (
        <div className="bg-white min-h-screen">
            {/* Barra de Navegación Superior */}
            <div className="px-8 py-4 border-b flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-blue-600 transition-colors">
                        <span className="text-2xl">←</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{coachee.nombre} {coachee.apellido}</h1>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 uppercase">
                            {coachee.estado}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="text-sm font-bold border px-4 py-2 rounded hover:bg-gray-100 transition-all">
                        Resetear Contraseña
                    </button>
                    <button className="text-sm font-bold bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow-sm transition-all">
                        Eliminar Coachee
                    </button>
                </div>
            </div>

            <div className="p-8 grid grid-cols-12 gap-8">
                {/* Bloque Izquierdo: Ficha Técnica (Página 13) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <section className="border rounded-xl p-6 shadow-sm">
                        <h2 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-6 border-b pb-2">Información Personal</h2>
                        <div className="grid grid-cols-1 gap-5">
                            <InfoField label="Nombre Completo" value={`${coachee.nombre} ${coachee.apellido}`} />
                            <InfoField label="Email de contacto" value={coachee.email} />
                            <InfoField label="País / Región" value={coachee.pais} />
                            <InfoField label="Teléfono" value={coachee.telefono} />
                            <InfoField label="Empresa" value={coachee.empresa} />
                            <InfoField label="Cargo Actual" value={coachee.cargo} />
                            <InfoField label="Servicio Contratado" value={coachee.plan} isHighlight />
                        </div>
                    </section>

                    {/* Widget de Consistencia (Métrica clave del PDF) */}
                    <section className="border rounded-xl p-6 bg-blue-50 border-blue-100">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-sm font-bold text-blue-800 uppercase">Consistencia Actual</h3>
                            <span className="text-2xl font-black text-blue-900">85%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </section>
                </div>

                {/* Bloque Derecho: Ciclos y Tareas */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Ciclos de Trabajo</h2>
                        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all">
                            Continuar Ciclo
                        </button>
                    </div>

                    {/* Tarjeta de Ciclo Activo */}
                    <div className="border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between">
                            <span className="font-black text-blue-800">CICLO ACTUAL: SPRINT 4S</span>
                            <span className="text-sm font-medium text-blue-600 italic">Iniciado: 17-04-2026</span>
                        </div>
                        <div className="p-6 bg-white">
                            <h4 className="font-bold text-gray-700 mb-4">Progreso de Compromisos (4/5)</h4>
                            <div className="space-y-3">
                                <TaskItem label="Conexión Proactiva Breve" completed />
                                <TaskItem label="Resumen de Calidad Semanal" completed />
                                <TaskItem label="Definición Rápida Post-Reunión" completed />
                                <TaskItem label="Check-in Emocional" completed />
                                <TaskItem label="Microcompromiso Diario" completed={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Componentes Auxiliares para Limpiar el Código */
const InfoField = ({ label, value, isHighlight = false }: any) => (
    <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
        <p className={`text-sm ${isHighlight ? 'text-blue-700 font-bold' : 'text-gray-800 font-medium'}`}>
            {value || 'No especificado'}
        </p>
    </div>
);

const TaskItem = ({ label, completed }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${completed ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
            {completed ? '✓' : ''}
        </div>
        <span className={`text-sm font-medium ${completed ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </div>
);

export default DetalleCoachee;