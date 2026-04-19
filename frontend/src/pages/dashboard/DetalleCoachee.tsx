import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, KeyRound, Trash2, PlayCircle, FileText, ChevronDown } from 'lucide-react';
import { contarDiasHabiles } from '../../utils/dateUtils';

const DetalleCoachee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [coachee, setCoachee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    
    // Modal de Eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Modal de Reseteo
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Contrato
    const [sendingContract, setSendingContract] = useState(false);
    const [contractSuccess, setContractSuccess] = useState(false);

    // Modal Universal de Ciclos (Crear / Continuar / Editar)
    const [cicloModalState, setCicloModalState] = useState<{
        isOpen: boolean;
        mode: 'CREATE' | 'CONTINUE' | 'EDIT';
        data: {
            id?: string;
            nombre: string;
            fechaInicio: string;
            fechaFin: string;
        }
    }>({
        isOpen: false,
        mode: 'CREATE',
        data: { nombre: '', fechaInicio: '', fechaFin: '' }
    });
    
    const [processingCiclo, setProcessingCiclo] = useState(false);
    const [cicloSuccessMessage, setCicloSuccessMessage] = useState<string | null>(null);

    const [expandedCiclo, setExpandedCiclo] = useState<string | null>(null);
    const [filtroCiclos, setFiltroCiclos] = useState<'activo' | 'todos'>('activo');

    const toggleCiclo = (cicloId: string) => {
        if (expandedCiclo === cicloId) setExpandedCiclo(null);
        else setExpandedCiclo(cicloId);
    };

    const handleDeleteCiclo = async (e: React.MouseEvent, cicloId: string) => {
        e.stopPropagation();
        if (window.confirm("¿Estás seguro de eliminar este ciclo?")) {
            try {
                const res = await fetch(`/api/coachees/${id}/ciclos/${cicloId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (res.ok) {
                    await fetchCoachee();
                } else {
                    console.error("Error al eliminar ciclo");
                }
            } catch (error) {
                console.error("Error en conexión:", error);
            }
        }
    };

    const openCicloModal = (mode: 'CREATE' | 'CONTINUE' | 'EDIT', cicloToEdit?: any, defaultName?: string) => {
        let defaultData = {
            id: '',
            nombre: `Ciclo ${coachee?.ciclos ? coachee.ciclos.length + 1 : 1}`,
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: '' // No usado en CREATE/CONTINUE visualmente, pero alojado aquí
        };

        if (mode === 'EDIT' && cicloToEdit) {
            defaultData = {
                id: cicloToEdit.id,
                nombre: cicloToEdit.nombre || defaultName || 'Ciclo',
                fechaInicio: new Date(cicloToEdit.fechaInicio).toISOString().split('T')[0],
                fechaFin: new Date(cicloToEdit.fechaFin).toISOString().split('T')[0]
            };
        } else if (mode === 'CONTINUE') {
            defaultData.nombre = `Ciclo ${coachee?.ciclos ? coachee.ciclos.length + 1 : 1}`;
        }

        setCicloModalState({
            isOpen: true,
            mode,
            data: defaultData
        });
    };

    const handleSaveCicloModal = async () => {
        setProcessingCiclo(true);
        try {
            let endpoint = '';
            let method = '';
            let bodyData: any = {
                nombre: cicloModalState.data.nombre,
                fechaInicio: cicloModalState.data.fechaInicio
            };

            if (cicloModalState.mode === 'CREATE') {
                endpoint = `/api/coachees/${id}/ciclos`;
                method = 'POST';
                if(cicloModalState.data.fechaFin) {
                    bodyData.fechaFin = cicloModalState.data.fechaFin;
                }
            } else if (cicloModalState.mode === 'CONTINUE') {
                endpoint = `/api/coachees/${id}/ciclos/continuar`;
                method = 'POST';
            } else if (cicloModalState.mode === 'EDIT') {
                endpoint = `/api/coachees/${id}/ciclos/${cicloModalState.data.id}`;
                method = 'PUT';
                bodyData.fechaFin = cicloModalState.data.fechaFin;
            }

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                setCicloModalState({ ...cicloModalState, isOpen: false });
                if (cicloModalState.mode === 'EDIT') setCicloSuccessMessage("Ciclo actualizado correctamente");
                else if (cicloModalState.mode === 'CONTINUE') setCicloSuccessMessage("Ciclo continuado exitosamente. Tareas clonadas y en estado pendiente.");
                else setCicloSuccessMessage("Ciclo generado correctamente");
                
                setTimeout(() => setCicloSuccessMessage(null), 4000);
                await fetchCoachee();
            } else {
                console.error("Error al procesar el ciclo");
            }
        } catch (err) {
            console.error("Error en conexión:", err);
        } finally {
            setProcessingCiclo(false);
        }
    };

    const fetchCoachee = async () => {
        try {
            const res = await fetch(`/api/coachees/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoachee(data);
                
                const servicioReal = data.servicioContratado || data.contracts?.[0]?.content?.plan || data.ciclos?.[data.ciclos.length - 1]?.producto || 'Sprint Digital 4S';

                setEditData({
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    email: data.email || '',
                    pais: data.pais || '',
                    telefono: data.telefono || '',
                    empresa: data.empresa || '',
                    cargo: data.cargo || '',
                    servicioContratado: servicioReal,
                    frecuenciaRecordatorios: data.frecuenciaRecordatorios || 'Cada vez que debe hacer un compromiso',
                    diagnosticoRealizado: data.hasDiagnostico || false,
                    activo: data.activo
                });
            }
        } catch (err) {
            console.error("Error de conexión:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoachee();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                nombre: editData.nombre,
                apellido: editData.apellido,
                email: editData.email,
                pais: editData.pais,
                telefono: editData.telefono,
                empresa: editData.empresa,
                cargo: editData.cargo,
                activo: editData.activo,
                servicioContratado: editData.servicioContratado,
                frecuenciaRecordatorios: editData.frecuenciaRecordatorios,
                hasDiagnostico: editData.diagnosticoRealizado
            };

            const res = await fetch(`/api/coachees/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsEditing(false);
                await fetchCoachee();
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/coachees/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                navigate('/dashboard');
            } else {
                console.error("Error al eliminar coachee");
            }
        } catch (err) {
            console.error("Error en conexión:", err);
        } finally {
            setDeleting(false);
        }
    };

    const handleResetPassword = async () => {
        setResetting(true);
        try {
            const res = await fetch(`/api/coachees/${id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setIsResetModalOpen(false);
                setResetSuccess(true);
                setTimeout(() => setResetSuccess(false), 4000);
            } else {
                console.error("Error al resetear contraseña");
            }
        } catch (err) {
            console.error("Error en conexión:", err);
        } finally {
            setResetting(false);
        }
    };

    const handleSendContract = async () => {
        setSendingContract(true);
        try {
            const res = await fetch(`/api/coachees/${id}/enviar-contrato`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setContractSuccess(true);
                setTimeout(() => setContractSuccess(false), 4000);
            } else {
                console.error("Error al enviar contrato");
            }
        } catch (err) {
            console.error("Error en conexión al enviar contrato:", err);
        } finally {
            setSendingContract(false);
        }
    };

    const handleGenerateCiclo = async () => {
        setGeneratingCiclo(true);
        try {
            const res = await fetch(`/api/coachees/${id}/ciclos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nombre: newCicloData.nombre,
                    fechaInicio: newCicloData.fechaInicio
                })
            });

            if (res.ok) {
                setIsNewCicloModalOpen(false);
                setCicloSuccess(true);
                setTimeout(() => setCicloSuccess(false), 4000);
                await fetchCoachee();
            } else {
                console.error("Error al generar ciclo");
            }
        } catch (err) {
            console.error("Error en conexión:", err);
        } finally {
            setGeneratingCiclo(false);
        }
    };

    if (loading || !coachee) return (
        <div className="min-h-screen flex items-center justify-center p-10 font-black text-[#1B254B]">
            Cargando el perfil...
        </div>
    );

    const planContratado = coachee.servicioContratado || "Sin Plan";

    return (
        /* LAYOUT PRINCIPAL: UNA SOLA COLUMNA */
        <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-6 pb-20">
            
            {/* 3. CABECERA */}
            <div>
                {/* Fila Superior */}
                <div className="flex justify-between items-center border-b-4 border-[#A9D42C] pb-4">
                    <div className="flex items-center gap-4">
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            className="h-8 object-contain" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-xl font-black text-[#1B254B]">InnovaAgile</span>'; }} 
                        />
                        <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest pl-4 border-l-4 border-[#A9D42C]">
                            Detalle del Coachee
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center gap-2 text-[#1B254B] font-bold hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" /> Volver al Panel
                    </button>
                </div>

                {/* Fila Inferior */}
                <div className="flex items-center gap-4 mt-4">
                    <h1 className="text-2xl font-black text-[#1B254B] tracking-tight">
                        {coachee.nombre} {coachee.apellido}
                    </h1>
                    
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 transition-colors">
                        <span className={`text-xs font-black ${editData.activo ? 'text-[#1B254B]' : 'text-gray-400'}`}>
                            {editData.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${editData.activo ? 'bg-[#A9D42C]' : 'bg-gray-300'}`}>
                            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${editData.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={editData.activo} onChange={(e) => {
                            if(isEditing) setEditData({...editData, activo: e.target.checked})
                        }} disabled={!isEditing} />
                    </label>

                    <span className="px-4 py-1.5 bg-[#F4F7FE] text-[#1B254B] text-sm font-black rounded-full border border-gray-200 uppercase tracking-widest">
                        {planContratado}
                    </span>
                </div>
            </div>

            {/* NIVEL 1: TARJETA INFORMACIÓN PERSONAL */}
            <div className="w-full bg-white rounded-2xl p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[#A9D42C]">
                    <h2 className="text-xl font-black text-[#1B254B] tracking-tight">Información Personal</h2>
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-[#A9D42C] p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Nombre Completo" value={`${coachee.nombre} ${coachee.apellido}`} />
                        <InfoField label="Correo Electrónico" value={coachee.email} />
                        <InfoField label="País / Región" value={coachee.pais} />
                        <InfoField label="Teléfono de Contacto" value={coachee.telefono} />
                        <InfoField label="Empresa" value={coachee.empresa} />
                        <InfoField label="Cargo Actual" value={coachee.cargo} />
                        <InfoField label="Servicio Contratado" value={coachee.servicioContratado || 'Sin Plan'} />
                        <InfoField label="Frecuencia Recordatorios" value={coachee?.frecuenciaRecordatorios || 'No especificada'} />
                        <InfoField label="Diagnóstico Inicial" value={coachee.hasDiagnostico ? 'REALIZADO' : 'PENDIENTE'} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <EditField label="Nombre" value={editData.nombre} onChange={(v:any) => setEditData({...editData, nombre: v})} />
                            <EditField label="Apellido" value={editData.apellido} onChange={(v:any) => setEditData({...editData, apellido: v})} />
                            <EditField label="Correo Electrónico" value={editData.email} onChange={(v:any) => setEditData({...editData, email: v})} />
                            <EditField label="País / Región" value={editData.pais} onChange={(v:any) => setEditData({...editData, pais: v})} />
                            <EditField label="Teléfono" value={editData.telefono} onChange={(v:any) => setEditData({...editData, telefono: v})} />
                            <EditField label="Empresa" value={editData.empresa} onChange={(v:any) => setEditData({...editData, empresa: v})} />
                            <EditField label="Cargo" value={editData.cargo} onChange={(v:any) => setEditData({...editData, cargo: v})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Servicio Contratado</label>
                                <select 
                                    name="servicioContratado"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
                                    value={editData.servicioContratado}
                                    onChange={(e) => setEditData({...editData, servicioContratado: e.target.value})}
                                >
                                    <option value="Audit Toolkit">Audit Toolkit</option>
                                    <option value="Sprint Digital 4S">Sprint Digital 4S</option>
                                    <option value="Executive Mastery">Executive Mastery</option>
                                    <option value="Enterprise Execution">Enterprise Execution</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Frecuencia Recordatorios</label>
                                <select 
                                    name="frecuenciaRecordatorios"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
                                    value={editData.frecuenciaRecordatorios}
                                    onChange={(e) => setEditData({...editData, frecuenciaRecordatorios: e.target.value})}
                                >
                                    <option value="Cada vez que debe hacer un compromiso">Cada vez que debe hacer un compromiso</option>
                                    <option value="Una vez al día en la mañana">Una vez al día en la mañana</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-4 p-4 rounded-xl bg-[#F4F7FE] cursor-pointer w-full md:w-1/2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${editData.diagnosticoRealizado ? 'bg-[#A9D42C]' : 'bg-gray-300'}`}>
                                {editData.diagnosticoRealizado && <span className="text-white text-sm font-black">✓</span>}
                            </div>
                            <span className="text-sm font-bold text-[#1B254B]">Sesión de Diagnóstico Realizada</span>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={editData.diagnosticoRealizado}
                                onChange={(e) => setEditData({...editData, diagnosticoRealizado: e.target.checked})}
                            />
                        </label>

                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-[#A9D42C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8eb825]"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ESTADO DE FEEDBACK TEMPORAL (TOAST) */}
            {resetSuccess && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-[#A9D42C] text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-bounce">
                    Contraseña reseteada con éxito
                </div>
            )}
            
            {contractSuccess && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-bounce">
                    Contrato enviado con éxito al correo del coachee
                </div>
            )}

            {cicloSuccessMessage && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-[#A9D42C] text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-bounce text-center">
                    {cicloSuccessMessage}
                </div>
            )}

            {/* NIVEL 2: FILA DE BOTONES INFERIORES */}
            <div className="flex flex-row gap-4">
                <button 
                    onClick={() => setIsResetModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm"
                >
                    <KeyRound className="w-5 h-5" /> Resetear Contraseña
                </button>
                <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm"
                >
                    <Trash2 className="w-5 h-5" /> Eliminar Coachee
                </button>
                <button 
                    onClick={() => openCicloModal('CONTINUE')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                    <PlayCircle className="w-5 h-5" /> Continuar Ciclo
                </button>
            </div>

            {/* NIVEL 3: TARJETA CICLOS DE TRABAJO */}
            <div className="w-full bg-white rounded-2xl p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-[#1B254B] tracking-tight">Ciclos de Trabajo</h2>
                    
                    <div className="flex gap-2 mr-auto ml-4">
                        <button 
                            onClick={() => setFiltroCiclos('activo')}
                            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors ${filtroCiclos === 'activo' ? 'bg-[#1B254B] text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            Solo Activos
                        </button>
                        <button 
                            onClick={() => setFiltroCiclos('todos')}
                            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors ${filtroCiclos === 'todos' ? 'bg-[#1B254B] text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            Ver Historial
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => openCicloModal('CREATE')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#A9D42C] hover:bg-[#8eb825] text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                        >
                            + Nuevo Ciclo
                        </button>
                        <button 
                            onClick={handleSendContract}
                            disabled={sendingContract}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-sm transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            {sendingContract ? 'Enviando...' : 'Enviar Contrato'}
                        </button>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {coachee.ciclos && coachee.ciclos.length > 0 ? (
                        [...coachee.ciclos]
                            .sort((a: any, b: any) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
                            .filter((c: any) => filtroCiclos === 'todos' || c.activo === true)
                            .map((ciclo: any, index: number) => {
                            const isExpanded = expandedCiclo === ciclo.id;
                            const tareasTotal = ciclo.tareas ? ciclo.tareas.length : 0;
                            const tareasCompletadas = ciclo.tareas ? ciclo.tareas.filter((t:any) => !t.activa).length : 0; 
                            
                            // To accurately compute enumerations even when filtering, we compute it based on the original structure.
                            // The true index of the cycle in the history is based on how many cycles there are in total 
                            // assuming the backend returns them all. But we can just use the unsorted/unfiltered length.
                            const cicloNumeration = coachee.ciclos.length - coachee.ciclos.findIndex((c: any) => c.id === ciclo.id);
                            const isActivo = ciclo.estado === 'ACTIVO' || ciclo.activo === true;
                            
                            return (
                                <div key={ciclo.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
                                    <div 
                                        className={`px-6 py-4 flex justify-between items-center cursor-pointer select-none transition-colors ${isExpanded ? 'bg-[#F4F7FE]' : 'bg-white hover:bg-gray-50'}`}
                                        onClick={() => toggleCiclo(ciclo.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="text-gray-400 w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-black text-[#1B254B] text-lg">
                                                        {ciclo.nombre ? ciclo.nombre : `Ciclo ${cicloNumeration}: ${ciclo.producto}`}
                                                    </span>
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-2 ${isActivo ? 'bg-[#A9D42C] bg-opacity-20 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                        {isActivo ? 'ACTIVO' : 'COMPLETADO'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-widest">
                                                        {contarDiasHabiles(ciclo.fechaInicio, ciclo.fechaFin)} días hábiles
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-400">
                                                    Inicio: {new Date(ciclo.fechaInicio).toLocaleDateString()} | Término: {new Date(ciclo.fechaFin).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                Tareas ({tareasCompletadas}/{tareasTotal})
                                            </span>
                                            <button 
                                                onClick={(e) => handleDeleteCiclo(e, ciclo.id)}
                                                className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-6 border-t border-gray-100 bg-white">
                                            <div className="flex justify-between items-end mb-4">
                                                <h4 className="font-bold text-gray-400 uppercase tracking-widest text-xs">Progreso</h4>
                                                <button 
                                                    onClick={() => openCicloModal('EDIT', ciclo, `Ciclo ${cicloNumeration}`)}
                                                    className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" /> Editar Ciclo
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {ciclo.tareas && ciclo.tareas.map((tarea: any) => (
                                                    <TaskItem key={tarea.id} label={tarea.nombre} completed={!tarea.activa} />
                                                ))}
                                                {(!ciclo.tareas || ciclo.tareas.length === 0) && (
                                                    <div className="col-span-2 text-sm text-gray-400 font-bold py-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                                                        No hay tareas configuradas para este ciclo. Usa "Continuar Ciclo" para administrarlas.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-400 font-bold bg-[#F4F7FE] rounded-xl border border-gray-200">
                            Sin ciclos activos registrados.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ELIMINACIÓN (Soft UI Estricto) */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B254B] mb-4 font-['Plus_Jakarta_Sans',_sans-serif]">
                            Eliminar Coachee
                        </h2>
                        <p className="text-gray-500 font-bold mb-8">
                            ⚠️ ESTA ACCIÓN ES IRREVERSIBLE. ¿Realmente deseas eliminar a {coachee.nombre} {coachee.apellido} y todo su historial?
                        </p>
                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1B254B] font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                            >
                                {deleting ? 'Eliminando...' : 'Sí, ELIMINAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE RESETEO DE CONTRASEÑA */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                            <KeyRound className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B254B] mb-4 font-['Plus_Jakarta_Sans',_sans-serif] tracking-tight">
                            Resetear Contraseña
                        </h2>
                        <p className="text-gray-500 font-bold mb-8">
                            ¿Estás seguro de que deseas resetear la contraseña de {coachee.nombre}? El usuario recibirá una nueva clave temporal por correo electrónico.
                        </p>
                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setIsResetModalOpen(false)}
                                disabled={resetting}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1B254B] font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleResetPassword}
                                disabled={resetting}
                                className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-sm"
                            >
                                {resetting ? 'Reseteando...' : 'Sí, Resetear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL UNIVERSAL GESTION DE CICLOS (CREAR / CONTINUAR / EDITAR) */}
            {cicloModalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col">
                        <h2 className="text-2xl font-black text-[#1B254B] mb-6 font-['Plus_Jakarta_Sans',_sans-serif] tracking-tight">
                            {cicloModalState.mode === 'CREATE' && 'Generar Nuevo Ciclo'}
                            {cicloModalState.mode === 'CONTINUE' && 'Continuar Ciclo Existente'}
                            {cicloModalState.mode === 'EDIT' && 'Editar Ciclo'}
                        </h2>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre del Ciclo</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
                                    value={cicloModalState.data.nombre}
                                    onChange={(e) => setCicloModalState({
                                        ...cicloModalState, 
                                        data: { ...cicloModalState.data, nombre: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Fecha de Inicio</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
                                    value={cicloModalState.data.fechaInicio}
                                    onChange={(e) => setCicloModalState({
                                        ...cicloModalState, 
                                        data: { ...cicloModalState.data, fechaInicio: e.target.value }
                                    })}
                                />
                            </div>
                            
                            {(cicloModalState.mode === 'EDIT' || cicloModalState.mode === 'CREATE') && (
                                <>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Fecha de Término</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
                                            value={cicloModalState.data.fechaFin}
                                            onChange={(e) => setCicloModalState({
                                                ...cicloModalState, 
                                                data: { ...cicloModalState.data, fechaFin: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed pt-2">
                                        Modificar estas fechas sobrescribirá el cálculo automático del sistema. Úselo con precaución.
                                    </p>
                                </>
                            )}
                            
                            {cicloModalState.mode === 'CONTINUE' && (
                                <p className="text-[10px] text-blue-500 font-bold leading-relaxed pt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    💡 Se clonará la estructura de tareas del ciclo anterior dejándolas pendiente de cumplimiento. El ciclo previo pasará a estado COMPLETADO.
                                </p>
                            )}
                        </div>

                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setCicloModalState({ ...cicloModalState, isOpen: false })}
                                disabled={processingCiclo}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1B254B] font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveCicloModal}
                                disabled={processingCiclo}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#A9D42C] hover:bg-[#8eb825] text-white font-bold transition-colors shadow-sm"
                            >
                                {processingCiclo ? 'Guardando...' : (cicloModalState.mode === 'EDIT' ? 'Guardar Cambios' : 'Generar Ciclo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoField = ({ label, value }: { label: string, value: string }) => (
    <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[15px] text-[#1B254B] font-bold">{value || '---'}</p>
    </div>
);

const EditField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>
        <input 
            type="text" 
            className="w-full px-4 py-2.5 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const TaskItem = ({ label, completed }: { label: string, completed: boolean }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F7FE]">
        <div className={`w-5 h-5 rounded-full flex flex-shrink-0 items-center justify-center text-[10px] font-black ${completed ? 'bg-[#A9D42C] text-white' : 'bg-gray-300 text-transparent'}`}>
            ✓
        </div>
        <span className={`text-sm font-bold ${completed ? 'text-gray-400 line-through' : 'text-[#1B254B]'}`}>{label}</span>
    </div>
);

export default DetalleCoachee;