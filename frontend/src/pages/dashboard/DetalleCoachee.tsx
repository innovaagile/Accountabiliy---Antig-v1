import { apiFetch } from '../../api/config';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit2, KeyRound, Trash2, PlayCircle, FileText, ChevronDown, CheckCircle, Activity, Target, Zap, Heart, Star, Book, Coffee, Bell, Award, Anchor, Briefcase } from 'lucide-react';
import { contarDiasHabiles } from '../../utils/dateUtils';

export const AVAILABLE_ICONS = [
    { name: 'CheckCircle', icon: CheckCircle }, { name: 'Activity', icon: Activity },
    { name: 'Target', icon: Target }, { name: 'Zap', icon: Zap },
    { name: 'Heart', icon: Heart }, { name: 'Star', icon: Star },
    { name: 'Book', icon: Book }, { name: 'Coffee', icon: Coffee },
    { name: 'Bell', icon: Bell }, { name: 'Award', icon: Award },
    { name: 'Anchor', icon: Anchor }, { name: 'Briefcase', icon: Briefcase }
];

interface Tarea {
    id: string;
    nombre: string;
    momento?: string;
    accion?: string;
    descripcion?: string;
    periodicidad: string;
    fechasMensuales?: string[];
    diasSemana?: string[];
    horaSugerida?: string;
    horaProgramada?: string;
    icono?: string;
    activa: boolean;
}

interface Ciclo {
    id: string;
    nombre?: string;
    fechaInicio: string;
    fechaFin: string;
    producto: string;
    estado: string;
    activo: boolean;
    tareas: Tarea[];
}

interface Coachee {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    pais?: string;
    telefono?: string;
    empresa?: string;
    cargo?: string;
    activo: boolean;
    servicioContratado?: string;
    frecuenciaRecordatorios?: string;
    hasDiagnostico?: boolean;
    ciclos?: Ciclo[];
    contracts?: any[];
}

const DetalleCoachee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [coachee, setCoachee] = useState<Coachee | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Coachee>>({});
    const [saving, setSaving] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Modal de Eliminación de Ciclo
    const [cicloAEliminar, setCicloAEliminar] = useState<string | null>(null);

    // Modal de Reseteo
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Contrato
    const [sendingContract, setSendingContract] = useState(false);
    const [contractSuccess, setContractSuccess] = useState(false);

    const [showToggleModal, setShowToggleModal] = useState(false);

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

    const handleConfirmDeleteCiclo = async () => {
        if (!cicloAEliminar) return;
        setProcessingCiclo(true);
        try {
            const res = await apiFetch(`/coachees/${id}/ciclos/${cicloAEliminar}`, {
                method: 'DELETE'});
            if (res.ok) {
                setCicloAEliminar(null);
                await fetchCoachee();
            } else {
                console.error("Error al eliminar ciclo");
            }
        } catch (error) {
            console.error("Error en conexión:", error);
        } finally {
            setProcessingCiclo(false);
        }
    };

    const openCicloModal = (mode: 'CREATE' | 'CONTINUE' | 'EDIT', cicloToEdit?: Ciclo, defaultName?: string) => {
        let defaultData: any = {
            id: '',
            nombre: `Ciclo ${coachee?.ciclos ? coachee.ciclos.length + 1 : 1}`,
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: '', // No usado en CREATE/CONTINUE visualmente, pero alojado aquí
            totalDias: 20
        };

        if (mode === 'EDIT' && cicloToEdit) {
            defaultData = {
                id: cicloToEdit.id,
                nombre: cicloToEdit.nombre || defaultName || 'Ciclo',
                fechaInicio: new Date(cicloToEdit.fechaInicio).toISOString().split('T')[0],
                fechaFin: new Date(cicloToEdit.fechaFin).toISOString().split('T')[0],
                totalDias: cicloToEdit.totalDias || 20
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

    const [tareaAEliminar, setTareaAEliminar] = useState<string | null>(null);
    const [cicloPadreDeTarea, setCicloPadreDeTarea] = useState<string | null>(null);
    const [processingTarea, setProcessingTarea] = useState(false);
    
    const [tareaModalState, setTareaModalState] = useState<{
        isOpen: boolean;
        mode: 'CREATE' | 'EDIT';
        cicloId: string;
        limitesCiclo: { inicio: string, fin: string };
        data: Partial<Tarea>;
    }>({
        isOpen: false,
        mode: 'CREATE',
        cicloId: '',
        limitesCiclo: { inicio: '', fin: '' },
        data: {
            nombre: '', momento: '', accion: '', periodicidad: 'DIARIA',
            diasSemana: [], fechasMensuales: [], horaSugerida: '', horaProgramada: '', icono: 'CheckCircle'
        }
    });

    const openTareaModal = (mode: 'CREATE' | 'EDIT', ciclo: Ciclo, tareaToEdit?: Tarea) => {
        setTareaModalState({
            isOpen: true,
            mode,
            cicloId: ciclo.id,
            limitesCiclo: { inicio: new Date(ciclo.fechaInicio).toISOString().split('T')[0], fin: new Date(ciclo.fechaFin).toISOString().split('T')[0] },
            data: mode === 'EDIT' && tareaToEdit ? { ...tareaToEdit } : {
                nombre: '', momento: '', accion: '', periodicidad: 'DIARIA',
                diasSemana: [], fechasMensuales: [], horaSugerida: '', horaProgramada: '', icono: 'CheckCircle'
            }
        });
    };

    const handleDeleteTarea = async () => {
        if (!tareaAEliminar || !cicloPadreDeTarea) return;
        setProcessingTarea(true);
        try {
            const res = await apiFetch(`/coachees/${id}/ciclos/${cicloPadreDeTarea}/tareas/${tareaAEliminar}`, {
                method: 'DELETE'});
            if (res.ok) {
                setTareaAEliminar(null);
                setCicloPadreDeTarea(null);
                await fetchCoachee();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessingTarea(false);
        }
    };

    const handleSaveTareaModal = async () => {
        setProcessingTarea(true);
        try {
            const endpoint = tareaModalState.mode === 'EDIT' 
                ? `/coachees/${id}/ciclos/${tareaModalState.cicloId}/tareas/${tareaModalState.data.id}`
                : `/coachees/${id}/ciclos/${tareaModalState.cicloId}/tareas`;
            const method = tareaModalState.mode === 'EDIT' ? 'PUT' : 'POST';

            const payloadData = {
                ...tareaModalState.data,
                // Normalizing dates for timezone matching
                fechasMensuales: tareaModalState.data.periodicidad === 'MENSUAL' && tareaModalState.data.fechasMensuales?.length
                    ? tareaModalState.data.fechasMensuales.map(f => new Date(f).toISOString())
                    : undefined
            };

            const res = await apiFetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData)
            });

            if (res.ok) {
                setTareaModalState({ ...tareaModalState, isOpen: false });
                await fetchCoachee();
            }
        } catch (error) {
            console.error('Error al guardar tarea', error);
        } finally {
            setProcessingTarea(false);
        }
    };

    const handleSaveCicloModal = async () => {
        setProcessingCiclo(true);
        try {
            let endpoint = '';
            let method = '';
            const bodyData: Record<string, any> = {
                nombre: cicloModalState.data.nombre,
                fechaInicio: cicloModalState.data.fechaInicio
            };

            if (cicloModalState.mode === 'CREATE') {
                endpoint = `/coachees/${id}/ciclos`;
                method = 'POST';
                if(cicloModalState.data.fechaFin) {
                    bodyData.fechaFin = cicloModalState.data.fechaFin;
                }
            } else if (cicloModalState.mode === 'CONTINUE') {
                endpoint = `/coachees/${id}/ciclos/continuar`;
                method = 'POST';
            } else if (cicloModalState.mode === 'EDIT') {
                endpoint = `/coachees/${id}/ciclos/${cicloModalState.data.id}`;
                method = 'PUT';
                bodyData.fechaFin = cicloModalState.data.fechaFin;
                bodyData.totalDias = cicloModalState.data.totalDias;
            }

            console.log("Enviando PUT:", bodyData);

            const res = await apiFetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
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
            const res = await apiFetch(`/coachees/${id}`, {
                
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
                    hasDiagnostico: data.hasDiagnostico || false,
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
                hasDiagnostico: editData.hasDiagnostico
            };

            const res = await apiFetch(`/coachees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await apiFetch(`/coachees/${id}`, {
                method: 'DELETE'});

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
            const res = await apiFetch(`/coachees/${id}/reset-password`, {
                method: 'POST'});

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
            const res = await apiFetch(`/coachees/${id}/enviar-contrato`, {
                method: 'POST'});

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

    const handleToggleModalOpen = () => setShowToggleModal(true);

    const handleToggleEstadoConfirm = async () => {
        if (!coachee) return;
        
        try {
            const res = await apiFetch(`/coachees/${id}/toggle-estado`, {
                method: 'PATCH'});

            if (res.ok) {
                setShowToggleModal(false);
                await fetchCoachee();
            } else {
                console.error("Error al actualizar estado");
            }
        } catch (err) {
            console.error("Error en conexión:", err);
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
                        <span className={`text-xs font-black ${coachee.activo ? 'text-[#1B254B]' : 'text-gray-400'}`}>
                            {coachee.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${coachee.activo ? 'bg-[#A9D42C]' : 'bg-gray-300'}`}>
                            <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${coachee.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={coachee.activo} onChange={handleToggleModalOpen} />
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
                        <InfoField label="Correo Electrónico" value={coachee.email || ''} />
                        <InfoField label="País / Región" value={coachee.pais || ''} />
                        <InfoField label="Teléfono de Contacto" value={coachee.telefono || ''} />
                        <InfoField label="Empresa" value={coachee.empresa || ''} />
                        <InfoField label="Cargo Actual" value={coachee.cargo || ''} />
                        <InfoField label="Servicio Contratado" value={coachee.servicioContratado || 'Sin Plan'} />
                        <InfoField label="Frecuencia Recordatorios" value={coachee?.frecuenciaRecordatorios || 'No especificada'} />
                        <InfoField label="Diagnóstico Inicial" value={coachee.hasDiagnostico ? 'REALIZADO' : 'PENDIENTE'} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <EditField label="Nombre" value={editData.nombre || ''} onChange={(v:any) => setEditData({...editData, nombre: v})} />
                            <EditField label="Apellido" value={editData.apellido || ''} onChange={(v:any) => setEditData({...editData, apellido: v})} />
                            <EditField label="Correo Electrónico" value={editData.email || ''} onChange={(v:any) => setEditData({...editData, email: v})} />
                            <EditField label="País / Región" value={editData.pais || ''} onChange={(v:any) => setEditData({...editData, pais: v})} />
                            <EditField label="Teléfono" value={editData.telefono || ''} onChange={(v:any) => setEditData({...editData, telefono: v})} />
                            <EditField label="Empresa" value={editData.empresa || ''} onChange={(v:any) => setEditData({...editData, empresa: v})} />
                            <EditField label="Cargo" value={editData.cargo || ''} onChange={(v:any) => setEditData({...editData, cargo: v})} />
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
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${editData.hasDiagnostico ? 'bg-[#A9D42C]' : 'bg-gray-300'}`}>
                                {editData.hasDiagnostico && <span className="text-white text-sm font-black">✓</span>}
                            </div>
                            <span className="text-sm font-bold text-[#1B254B]">Sesión de Diagnóstico Realizada</span>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={editData.hasDiagnostico}
                                onChange={(e) => setEditData({...editData, hasDiagnostico: e.target.checked})}
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
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-[#A9D42C] text-white px-8 py-3 rounded-xl font-bold shadow-lg animate-bounce">
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
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#A9D42C] hover:bg-[#8eb825] text-white rounded-xl font-bold shadow-sm"
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
                            .sort((a: Ciclo, b: Ciclo) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
                            .filter((c: Ciclo) => filtroCiclos === 'todos' || c.activo === true)
                            .map((ciclo: Ciclo, index: number) => {
                            const isExpanded = expandedCiclo === ciclo.id;
                            const tareasTotal = ciclo.tareas ? ciclo.tareas.length : 0;
                            const tareasCompletadas = ciclo.tareas ? ciclo.tareas.filter((t: Tarea) => !t.activa).length : 0; 
                            
                            // To accurately compute enumerations even when filtering, we compute it based on the original structure.
                            // The true index of the cycle in the history is based on how many cycles there are in total 
                            // assuming the backend returns them all. But we can just use the unsorted/unfiltered length.
                            const cicloNumeration = coachee.ciclos!.length - coachee.ciclos!.findIndex((c: Ciclo) => c.id === ciclo.id);
                            const isActivo = ciclo.estado === 'ACTIVO' || ciclo.activo === true;
                            
                            return (
                                <div key={ciclo.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
                                    <div 
                                        className={`px-6 py-4 flex justify-between items-center cursor-pointer select-none transition-colors ${isExpanded ? 'bg-[#F4F6F0]' : 'bg-[#F4F6F0] hover:bg-gray-50'}`}
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
                                                Tareas ({ciclo.tareas?.length || 0}/5)
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setCicloAEliminar(ciclo.id); }}
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
                                                <div className="flex gap-4">
                                                    {isActivo && (
                                                        <button 
                                                            onClick={() => openTareaModal('CREATE', ciclo)}
                                                            className="flex items-center gap-2 text-[12px] font-bold text-[#A9D42C] hover:text-[#8eb825] transition-colors"
                                                        >
                                                            + Agregar Tarea
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => openCicloModal('EDIT', ciclo, `Ciclo ${cicloNumeration}`)}
                                                        className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-[#A9D42C] transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Editar Ciclo
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                {ciclo.tareas && ciclo.tareas.map((tarea: Tarea) => (
                                                    <TaskItem 
                                                        key={tarea.id} 
                                                        tarea={tarea} 
                                                        onEdit={() => openTareaModal('EDIT', ciclo, tarea)} 
                                                        onDelete={() => {
                                                            setTareaAEliminar(tarea.id);
                                                            setCicloPadreDeTarea(ciclo.id);
                                                        }} 
                                                        isActivo={isActivo} 
                                                    />
                                                ))}
                                                {(!ciclo.tareas || ciclo.tareas.length === 0) && (
                                                    <div className="col-span-2 text-sm text-gray-400 font-bold py-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                                                        No hay tareas configuradas para este ciclo. Usa "+ Agregar Tarea" para crearlas.
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
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        const calculated = (newVal && cicloModalState.data.fechaFin) 
                                            ? contarDiasHabiles(newVal, cicloModalState.data.fechaFin) 
                                            : cicloModalState.data.totalDias;
                                        setCicloModalState({
                                            ...cicloModalState, 
                                            data: { ...cicloModalState.data, fechaInicio: newVal, totalDias: calculated }
                                        });
                                    }}
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
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                const calculated = (cicloModalState.data.fechaInicio && newVal) 
                                                    ? contarDiasHabiles(cicloModalState.data.fechaInicio, newVal) 
                                                    : cicloModalState.data.totalDias;
                                                setCicloModalState({
                                                    ...cicloModalState, 
                                                    data: { ...cicloModalState.data, fechaFin: newVal, totalDias: calculated }
                                                });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Total de Días Hábiles</label>
                                        <input 
                                            type="number" 
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border-none bg-gray-100 text-gray-500 outline-none text-sm font-bold cursor-not-allowed"
                                            value={cicloModalState.data.totalDias || 0}
                                            readOnly
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed pt-2">
                                        Modificar estas fechas sobrescribirá el cálculo automático del sistema. Úselo con precaución.
                                    </p>
                                </>
                            )}
                            
                            {cicloModalState.mode === 'CONTINUE' && (
                                <p className="text-[10px] text-gray-500 font-bold leading-relaxed pt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
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

            {/* MODAL DE ELIMINACIÓN DE CICLO (Soft UI) */}
            {cicloAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B254B] mb-4 font-['Plus_Jakarta_Sans',_sans-serif]">
                            Eliminar Ciclo
                        </h2>
                        <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                            ⚠️ ¿Estás seguro de que deseas eliminar este ciclo y todas las tareas asociadas? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setCicloAEliminar(null)}
                                disabled={processingCiclo}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmDeleteCiclo}
                                disabled={processingCiclo}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-md"
                            >
                                {processingCiclo ? 'Eliminando...' : 'Sí, ELIMINAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE TAREAS (Soft UI) */}
            {tareaModalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl p-10 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] my-8">
                        <h2 className="text-3xl font-black text-[#1B254B] mb-8 font-['Plus_Jakarta_Sans',_sans-serif] tracking-tight">
                            {tareaModalState.mode === 'CREATE' ? 'Nuevo Compromiso' : 'Editar Compromiso'}
                        </h2>
                        
                        <div className="space-y-6 mb-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nombre de la Tarea <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full px-5 py-4 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] transition-all"
                                        value={tareaModalState.data.nombre || ''}
                                        onChange={e => setTareaModalState(s => ({...s, data: {...s.data, nombre: e.target.value}}))}
                                        placeholder="Ej. Realizar seguimiento"
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Acción (Opcional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-5 py-4 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] transition-all"
                                        value={tareaModalState.data.accion || ''}
                                        onChange={e => setTareaModalState(s => ({...s, data: {...s.data, accion: e.target.value}}))}
                                        placeholder="Verbo o meta"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Descripción</label>
                                <textarea 
                                    className="w-full px-5 py-4 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] min-h-[100px] resize-none transition-all"
                                    value={tareaModalState.data.descripcion || ''}
                                    onChange={e => setTareaModalState(s => ({...s, data: {...s.data, descripcion: e.target.value}}))}
                                    placeholder="Contexto o detalles extensos para esta tarea..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Periodicidad</label>
                                    <select 
                                        className="w-full px-5 py-4 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] appearance-none cursor-pointer"
                                        value={tareaModalState.data.periodicidad}
                                        onChange={e => setTareaModalState(s => ({...s, data: {...s.data, periodicidad: e.target.value as any}}))}
                                    >
                                        <option value="DIARIA">Diaria</option>
                                        <option value="SEMANAL">Semanal</option>
                                        <option value="MENSUAL">Mensual (Eventos Específicos)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Hora Sugerida</label>
                                    <select 
                                        className="w-full px-5 py-4 rounded-xl border-none bg-[#F4F7FE] focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] appearance-none cursor-pointer"
                                        value={tareaModalState.data.horaProgramada || '09:00'}
                                        onChange={e => setTareaModalState(s => ({...s, data: {...s.data, horaProgramada: e.target.value}}))}
                                    >
                                        {Array.from({length: 24 * 4}).map((_, i) => {
                                            const hr = Math.floor(i / 4).toString().padStart(2, '0');
                                            const min = ((i % 4) * 15).toString().padStart(2, '0');
                                            const val = `${hr}:${min}`;
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Selector de Íconos (Refuerzo Visual)</label>
                                <div className="grid grid-cols-6 gap-3 bg-[#F4F7FE] p-4 rounded-[20px] border border-gray-100">
                                    {AVAILABLE_ICONS.map(i => {
                                        const Icon = i.icon;
                                        const isSelected = tareaModalState.data.icono === i.name;
                                        return (
                                            <button 
                                                key={i.name} 
                                                onClick={() => setTareaModalState(s => ({...s, data: {...s.data, icono: i.name}}))} 
                                                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${isSelected ? 'bg-[#A9D42C] text-white shadow-md scale-105' : 'bg-white text-gray-400 hover:text-[#1B254B] hover:shadow-sm'}`}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SELECTOR SEMANAL */}
                            {tareaModalState.data.periodicidad === 'SEMANAL' && (
                                <div className="p-5 bg-gray-50 border border-gray-100 rounded-[20px]">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Días de la semana</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => {
                                            const isSelected = (tareaModalState.data.diasSemana || []).includes(dia);
                                            return (
                                                <button
                                                    key={dia}
                                                    onClick={() => {
                                                        const current = [...(tareaModalState.data.diasSemana || [])];
                                                        if (isSelected) current.splice(current.indexOf(dia), 1);
                                                        else current.push(dia);
                                                        setTareaModalState(s => ({...s, data: {...s.data, diasSemana: current}}));
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-[#A9D42C] text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    {dia.substring(0,3)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SELECTOR MENSUAL */}
                            {tareaModalState.data.periodicidad === 'MENSUAL' && (
                                <div className="p-5 bg-gray-50 border border-gray-100 rounded-[20px]">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Fechas Específicas (Máximo 3)</label>
                                        <button 
                                            disabled={(tareaModalState.data.fechasMensuales || []).length >= 3}
                                            onClick={() => setTareaModalState(s => ({...s, data: {...s.data, fechasMensuales: [...(s.data.fechasMensuales || []), '']}}))}
                                            className="text-xs font-bold text-[#A9D42C] hover:text-[#8eb825] disabled:opacity-50"
                                        >
                                            + Añadir Fecha
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(tareaModalState.data.fechasMensuales || []).map((fecha, idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <input 
                                                    type="date" 
                                                    min={tareaModalState.limitesCiclo.inicio}
                                                    max={tareaModalState.limitesCiclo.fin}
                                                    className="flex-1 px-4 py-3 rounded-xl border-none bg-white focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] shadow-sm"
                                                    value={fecha ? fecha.split('T')[0] : ''}
                                                    onChange={e => {
                                                        const current = [...(tareaModalState.data.fechasMensuales || [])];
                                                        const currentT = fecha.includes('T') ? fecha.split('T')[1] : '09:00';
                                                        current[idx] = `${e.target.value}T${currentT}`;
                                                        setTareaModalState(s => ({...s, data: {...s.data, fechasMensuales: current}}));
                                                    }}
                                                />
                                                <div className="flex gap-1 w-[100px]">
                                                    <select 
                                                        className="px-2 py-3 rounded-xl border-none bg-white focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] w-full shadow-sm"
                                                        value={fecha.includes('T') ? fecha.split('T')[1].split(':')[0] : '09'}
                                                        onChange={e => {
                                                            const current = [...(tareaModalState.data.fechasMensuales || [])];
                                                            const d = fecha.split('T')[0] || tareaModalState.limitesCiclo.inicio;
                                                            const m = fecha.includes('T') ? fecha.split('T')[1].split(':')[1] : '00';
                                                            current[idx] = `${d}T${e.target.value}:${m}`;
                                                            setTareaModalState(s => ({...s, data: {...s.data, fechasMensuales: current}}));
                                                        }}
                                                    >
                                                        {Array.from({length: 24}).map((_, i) => {
                                                            const h = i.toString().padStart(2, '0');
                                                            return <option key={h} value={h}>{h}</option>;
                                                        })}
                                                    </select>
                                                    <span className="self-center font-bold text-gray-400">:</span>
                                                    <select 
                                                        className="px-2 py-3 rounded-xl border-none bg-white focus:ring-2 focus:ring-[#A9D42C] outline-none text-sm font-bold text-[#1B254B] w-full shadow-sm"
                                                        value={fecha.includes('T') ? fecha.split('T')[1].split(':')[1] : '00'}
                                                        onChange={e => {
                                                            const current = [...(tareaModalState.data.fechasMensuales || [])];
                                                            const d = fecha.split('T')[0] || tareaModalState.limitesCiclo.inicio;
                                                            const h = fecha.includes('T') ? fecha.split('T')[1].split(':')[0] : '09';
                                                            current[idx] = `${d}T${h}:${e.target.value}`;
                                                            setTareaModalState(s => ({...s, data: {...s.data, fechasMensuales: current}}));
                                                        }}
                                                    >
                                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const current = [...(tareaModalState.data.fechasMensuales || [])];
                                                        current.splice(idx, 1);
                                                        setTareaModalState(s => ({...s, data: {...s.data, fechasMensuales: current}}));
                                                    }}
                                                    className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-xl shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        {!(tareaModalState.data.fechasMensuales?.length) && <p className="text-xs text-gray-400 font-bold">No hay fechas configuradas.</p>}
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setTareaModalState({ ...tareaModalState, isOpen: false })}
                                disabled={processingTarea}
                                className="flex-1 py-4 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveTareaModal}
                                disabled={processingTarea || !tareaModalState.data.nombre}
                                className="flex-1 py-4 px-6 rounded-xl bg-[#A9D42C] hover:bg-[#8eb825] text-white font-bold transition-colors shadow-lg shadow-green-200 disabled:opacity-50"
                            >
                                {processingTarea ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN DE TAREA (Soft UI) */}
            {tareaAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B254B] mb-4 font-['Plus_Jakarta_Sans',_sans-serif]">
                            Borrar Tarea
                        </h2>
                        <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                            ¿Eliminar esta tarea y su historial de cumplimiento?
                        </p>
                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => { setTareaAEliminar(null); setCicloPadreDeTarea(null); }}
                                disabled={processingTarea}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold transition-colors shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteTarea}
                                disabled={processingTarea}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-md"
                            >
                                {processingTarea ? 'Borrando...' : 'Sí, ELIMINAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL DE CAMBIO DE ESTADO (Soft UI) */}
            {showToggleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#F4F7FE] rounded-[20px] flex items-center justify-center mb-6">
                            <Activity className="w-8 h-8 text-[#1B254B]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1B254B] mb-4">¿Cambiar estado del usuario?</h2>
                        <p className="text-sm text-gray-500 font-bold mb-8">
                            {coachee?.activo 
                                ? "Al desactivarlo perderá el acceso y se cerrará su ciclo actual." 
                                : "Al activarlo se restaurará su ciclo más reciente."}
                        </p>
                        <div className="flex w-full gap-4">
                            <button 
                                onClick={() => setShowToggleModal(false)}
                                className="flex-1 py-4 border-2 border-gray-100 rounded-xl bg-white hover:bg-gray-50 text-gray-400 font-bold transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleToggleEstadoConfirm}
                                className={`flex-1 py-4 rounded-xl font-bold transition-all shadow-lg text-white ${coachee?.activo ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-[#A9D42C] hover:bg-[#8eb825] shadow-green-200'}`}
                            >
                                Aceptar
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
const TaskItem = ({ tarea, onEdit, onDelete, isActivo }: { tarea: Tarea, onEdit: () => void, onDelete: () => void, isActivo: boolean }) => {
    const IconComponent = AVAILABLE_ICONS.find(i => i.name === tarea.icono)?.icon || CheckCircle;
    
    let infoDias = '';
    if (tarea.periodicidad === 'SEMANAL' && tarea.diasSemana?.length) {
        infoDias = tarea.diasSemana.map(d => d.substring(0,3)).join(', ');
    } else if (tarea.periodicidad === 'MENSUAL' && tarea.fechasMensuales?.length) {
        infoDias = `${tarea.fechasMensuales.length} fechas`;
    } else if (tarea.periodicidad === 'DIARIA') {
        infoDias = 'L-D';
    } else {
        infoDias = tarea.periodicidad;
    }
    
    const hora = tarea.horaProgramada || tarea.horaSugerida || '--:--';

    return (
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center shadow-sm ${!tarea.activa ? 'bg-[#A9D42C] text-white' : 'bg-[#F4F7FE] text-[#1B254B]'}`}>
                    <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                   <div className="flex items-center gap-2 mb-1">
                       <span className={`text-lg font-black block leading-tight truncate ${!tarea.activa ? 'text-gray-400 line-through' : 'text-[#1B254B]'}`}>
                           {tarea.nombre} {tarea.accion ? `- ${tarea.accion}` : ''}
                       </span>
                   </div>
                   {tarea.descripcion && (
                       <p className="text-sm text-gray-500 font-medium mb-2 line-clamp-1">
                           {tarea.descripcion}
                       </p>
                   )}
                   <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                       <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-500">{tarea.periodicidad}</span>
                       <span>|</span>
                       <span>{infoDias}</span>
                       <span>|</span>
                       <span className="text-[#A9D42C]">{hora}</span>
                   </p>
                </div>
            </div>
            {isActivo && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button onClick={onEdit} className="p-2 text-gray-300 hover:text-[#A9D42C] hover:bg-green-50 rounded-xl transition-colors"><Edit2 className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
            )}
        </div>
    );
};

export default DetalleCoachee;