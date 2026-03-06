import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import {
    X, Save, Upload, Trash2, Edit3, Image as ImageIcon,
    Settings, History, Utensils, Layout, MapPin,
    AlertCircle, Loader2, Plus, Globe, Sparkles,
    Calendar, CheckCircle, Clock, Users, Phone, Mail, MessageCircle, ChevronLeft, ChevronRight, LogOut, Lock
} from 'lucide-react';

interface AdminProps {
    onClose: () => void;
    config: any;
    onUpdate: (newConfig: any) => void;
}

export default function Admin({ onClose, config, onUpdate }: AdminProps) {
    const [activeTab, setActiveTab] = useState('general');
    const [localConfig, setLocalConfig] = useState(config);
    const [isSaving, setIsSaving] = useState(false);
    const [reservations, setReservations] = useState<any[]>([]);
    const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    // Check Auth Session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        fetchReservations();

        // Realtime subscription
        const channel = supabase
            .channel('reservations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                fetchReservations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchReservations = async () => {
        const { data } = await supabase
            .from('reservations')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setReservations(data);
            setUnreadCount(data.filter(r => !r.is_read).length);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase.from('reservations').update({ is_read: true }).eq('id', id);
        fetchReservations();
    };

    const updateReservationStatus = async (id: string, newStatus: string) => {
        await supabase.from('reservations').update({ status: newStatus }).eq('id', id);
        if (selectedReservation?.id === id) {
            setSelectedReservation({ ...selectedReservation, status: newStatus });
        }
        fetchReservations();
    };

    const deleteReservation = async (id: string) => {
        if (window.confirm('Eliminar esta reserva?')) {
            await supabase.from('reservations').delete().eq('id', id);
            if (selectedReservation?.id === id) {
                setSelectedReservation(null);
            }
            fetchReservations();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('settings')
                .update({ config: localConfig })
                .eq('id', 1);

            if (error) throw error;

            onUpdate(localConfig);
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: string[]) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            const newUrl = data.publicUrl;

            setLocalConfig(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                let current = updated;
                for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]];
                }
                current[path[path.length - 1]] = newUrl;

                if (path[0] === 'logo') {
                    updated.logoIsImage = true;
                }

                return updated;
            });

            setMessage({ type: 'success', text: 'Imagem enviada!' });
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro no upload: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (path: string[], value: any) => {
        setLocalConfig(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            let current = updated;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return updated;
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Email ou senha incorretos' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const tabs = [
        { id: 'general', label: 'Geral', icon: Settings },
        { id: 'hero', label: 'Banner Principal', icon: ImageIcon },
        { id: 'history', label: 'A Nossa História', icon: History },
        { id: 'menu', label: 'Menu & Destaques', icon: Utensils },
        { id: 'gallery', label: 'Galeria', icon: ImageIcon },
        { id: 'contact', label: 'Contato', icon: MapPin },
        { id: 'reservations', label: 'Reservas', icon: Calendar },
    ];

    if (authLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep/90 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="fixed inset-0 z-[100] bg-deep overflow-hidden flex items-center justify-center p-4">
                <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-4 border border-gold/20">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-white">Área Admin</h2>
                        <p className="text-xs text-gray-400 mt-1">Faça login para gerenciar o site</p>
                    </div>

                    {message && (
                        <div className="p-3 rounded-lg mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-deep border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                                placeholder="Seu email"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-deep border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3.5 mt-2 bg-gradient-to-r from-gold via-flame to-ember text-white rounded-xl font-black text-sm shadow-lg shadow-flame/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Painel'}
                        </button>
                    </form>

                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        Voltar para o site
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Container */}
            <div className="relative bg-surface w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col md:flex-row">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-deep/50 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col shrink-0">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-gold" />
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Painel Adm</h2>
                    </div>

                    <nav className="space-y-1.5 flex-1 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'reservations' && unreadCount > 0) {
                                        // Optional: mark all as read when opening tab
                                    }
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-gold/10 text-gold shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] border border-gold/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </div>
                                {tab.id === 'reservations' && unreadCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair da Conta
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Fechar Visualização
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header Area */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white capitalize">{tabs.find(t => t.id === activeTab)?.label}</h3>
                            <p className="text-xs text-gray-400 mt-1">Gerencie o conteúdo e configurações desta seção.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-gradient-to-r from-gold to-flame text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-flame/20 hover:shadow-flame/40 transition-all disabled:opacity-50 group shrink-0"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Alterações
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {message.type === 'success' ? <Edit3 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Site Logo (Icone ou Foto)</label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-deep border border-white/10 rounded-xl flex items-center justify-center text-2xl overflow-hidden shadow-inner">
                                                    {localConfig.logoIsImage ? (
                                                        <img src={localConfig.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{localConfig.logo || '🔥'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={localConfig.logoIsImage ? '' : localConfig.logo}
                                                        onChange={(e) => {
                                                            updateField(['logo'], e.target.value);
                                                            updateField(['logoIsImage'], false);
                                                        }}
                                                        placeholder="Emoji ou Texto"
                                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none disabled:opacity-50"
                                                        disabled={localConfig.logoIsImage}
                                                    />
                                                    <div className="flex gap-2">
                                                        <label className="flex-1 flex items-center justify-center gap-2 bg-gold text-deep py-2.5 rounded-xl cursor-pointer text-xs font-black transition-all hover:scale-[1.02] shadow-lg shadow-gold/20">
                                                            <Upload className="w-3.5 h-3.5" />
                                                            {localConfig.logoIsImage ? 'Trocar PNG' : 'Subir PNG'}
                                                            <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageUpload(e, ['logo'])} />
                                                        </label>
                                                        {localConfig.logoIsImage && (
                                                            <button
                                                                onClick={() => {
                                                                    updateField(['logo'], '🔥');
                                                                    updateField(['logoIsImage'], false);
                                                                }}
                                                                className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors"
                                                                title="Remover Foto e usar Emoji"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 italic pl-1">
                                                        {localConfig.logoIsImage ? 'Usando imagem PNG/JPG' : 'Insira um emoji ou texto acima'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome Principal (Site)</label>
                                        <input
                                            type="text"
                                            value={localConfig.hero?.title || ''}
                                            onChange={(e) => updateField(['hero', 'title'], e.target.value)}
                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hero' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto Principal (Hero)</label>
                                    <input
                                        type="text"
                                        value={localConfig.hero?.title || ''}
                                        onChange={(e) => updateField(['hero', 'title'], e.target.value)}
                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                        placeholder="Churrasqueira Amores"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtítulo</label>
                                    <textarea
                                        value={localConfig.hero?.subtitle || ''}
                                        onChange={(e) => updateField(['hero', 'subtitle'], e.target.value)}
                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagem de Fundo</label>
                                    <div className="relative group rounded-2xl overflow-hidden aspect-video bg-deep border border-white/5 flex items-center justify-center">
                                        {localConfig.hero?.bgImage ? (
                                            <img src={localConfig.hero.bgImage} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-30" />
                                        ) : (
                                            <ImageIcon className="w-12 h-12 text-gray-700" />
                                        )}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-3">
                                            <label className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition-transform text-sm font-bold shadow-lg">
                                                <Upload className="w-4 h-4" />
                                                Tracar Fundo
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, ['hero', 'bgImage'])} />
                                            </label>

                                            {localConfig.hero?.bgImage !== 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&q=80' && (
                                                <button
                                                    onClick={() => updateField(['hero', 'bgImage'], 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&q=80')}
                                                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-bold shadow-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Remover Imagem
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título (Badge)</label>
                                        <input
                                            type="text"
                                            value={localConfig.about?.badge || 'A Nossa História'}
                                            onChange={(e) => updateField(['about', 'badge'], e.target.value)}
                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título Principal</label>
                                        <input
                                            type="text"
                                            value={localConfig.about?.title || ''}
                                            onChange={(e) => updateField(['about', 'title'], e.target.value)}
                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto 1</label>
                                    <textarea
                                        value={localConfig.about?.text1 || ''}
                                        onChange={(e) => updateField(['about', 'text1'], e.target.value)}
                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto 2</label>
                                    <textarea
                                        value={localConfig.about?.text2 || ''}
                                        onChange={(e) => updateField(['about', 'text2'], e.target.value)}
                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagem da História</label>
                                    <div className="relative group rounded-2xl overflow-hidden h-64 bg-deep border border-white/5 flex items-center justify-center">
                                        {localConfig.about?.image ? (
                                            <img src={localConfig.about.image} className="w-full h-full object-cover opacity-50" />
                                        ) : (
                                            <ImageIcon className="w-12 h-12 text-gray-700" />
                                        )}
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                            <Upload className="w-8 h-8 text-white mb-2" />
                                            <span className="text-sm font-bold">Trocar Foto</span>
                                            <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, ['about', 'image'])} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'menu' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gold/10 border border-gold/20 p-4 rounded-2xl">
                                    <div className="flex items-center gap-3 text-gold">
                                        <Utensils className="w-5 h-5" />
                                        <span className="text-sm font-bold">Gestão de Menu</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newItem = {
                                                id: Date.now(),
                                                name: 'Novo Prato',
                                                description: 'Descrição do prato...',
                                                price: '0,00€',
                                                image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&q=80',
                                                tag: '✨ Recomendado',
                                                category: 'Pratos'
                                            };
                                            updateField(['menuItems'], [...localConfig.menuItems, newItem]);
                                        }}
                                        className="flex items-center gap-2 bg-gold text-deep font-black px-5 py-2.5 rounded-xl text-xs hover:scale-105 transition-all shadow-lg shadow-gold/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Novo Item no Menu
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {localConfig.menuItems?.map((item: any, idx: number) => (
                                        <div key={item.id} className="glass rounded-2xl border border-white/5 flex flex-col group/item relative">
                                            <div className="relative h-40 rounded-t-2xl overflow-hidden shrink-0">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                                {/* Tag Preview in Admin */}
                                                {item.tag && (
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-deep/80 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/10 z-10 shadow-lg">
                                                        {item.tag}
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover/item:opacity-100 cursor-pointer transition-opacity z-20">
                                                    <Upload className="w-8 h-8 text-white mb-2" />
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Trocar Imagem</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, ['menuItems', idx.toString(), 'image'])} />
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        const items = localConfig.menuItems.filter((_: any, i: number) => i !== idx);
                                                        updateField(['menuItems'], items);
                                                    }}
                                                    className="absolute top-3 right-3 p-2 bg-red-500 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:scale-110"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                            <div className="p-5 space-y-4 bg-deep/40 flex-1">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nome</label>
                                                        <input
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const items = [...localConfig.menuItems];
                                                                items[idx].name = e.target.value;
                                                                updateField(['menuItems'], items);
                                                            }}
                                                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-gold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Preço (€)</label>
                                                        <div className="relative">
                                                            <input
                                                                value={item.price.replace('€', '')}
                                                                onChange={(e) => {
                                                                    const items = [...localConfig.menuItems];
                                                                    const val = e.target.value.trim();
                                                                    items[idx].price = val ? `${val}€` : '';
                                                                    updateField(['menuItems'], items);
                                                                }}
                                                                className="w-full bg-surface border border-white/10 rounded-lg pr-8 pl-3 py-2 text-sm font-bold text-gold outline-none focus:border-gold"
                                                                placeholder="0,00"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold font-bold text-sm pointer-events-none">€</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Descrição</label>
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const items = [...localConfig.menuItems];
                                                            items[idx].description = e.target.value;
                                                            updateField(['menuItems'], items);
                                                        }}
                                                        className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 min-h-[60px] outline-none focus:border-gold"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center pl-1">
                                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tag (Emoji + Texto)</label>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const suggestions = {
                                                                        'Pratos': ['🔥 Especialidade', '✨ Recomendado', '🥘 Novo', '👨‍🍳 Sugestão do Chef', '🥩 Premium', '⭐ Favorito', '🥧 Tradicional', '🥓 Crocante'],
                                                                        'Acompanhamentos': ['🌱 Vegetariano', '🥖 Caseiro', '🍟 Popular', '🌿 Orgânico', '🧀 Artesanal'],
                                                                        'Bebidas': ['🥤 Gelado', '🍷 Seleção', '🍋 Refrescante', '🍹 Exclusivo'],
                                                                        'default': ['✨ Disponível', '📦 Take Away', '🕒 Limitado']
                                                                    };
                                                                    const pool = suggestions[item.category as keyof typeof suggestions] || suggestions.default;
                                                                    const randomTag = pool[Math.floor(Math.random() * pool.length)];
                                                                    const items = [...localConfig.menuItems];
                                                                    items[idx].tag = randomTag;
                                                                    updateField(['menuItems'], items);
                                                                }}
                                                                className="text-[9px] font-bold text-gold hover:text-white transition-colors flex items-center gap-1"
                                                                title="Sugerir Tag Automática"
                                                            >
                                                                <Sparkles className="w-3 h-3" /> Auto-Sugerir
                                                            </button>
                                                        </div>
                                                        <div className="relative group/tag">
                                                            <input
                                                                value={item.tag}
                                                                onChange={(e) => {
                                                                    const items = [...localConfig.menuItems];
                                                                    items[idx].tag = e.target.value;
                                                                    updateField(['menuItems'], items);
                                                                }}
                                                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                                                                placeholder="Digite ou escolha..."
                                                            />
                                                            <div className="absolute left-0 bottom-full mb-1 w-full bg-deep border border-gold/30 rounded-xl p-2 hidden group-focus-within/tag:block z-[100] shadow-[0_0_30px_rgba(245,158,11,0.2)] max-h-48 overflow-y-auto custom-scrollbar transition-all scale-100 origin-bottom">
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    {[
                                                                        '🔥 Especialidade', '✨ Recomendado', '🥘 Novo', '🌱 Vegetariano',
                                                                        '🌶️ Picante', '⭐ Favorito', '🥩 Premium', '👨‍🍳 Sugestão do Chef',
                                                                        '🥤 Gelado', '🥖 Caseiro', '🦐 Marisco', '🍰 Sobremesa',
                                                                        '🍷 Seleção', '🍽️ Popular', '📦 Take Away', '🕒 Limitado',
                                                                        '🍋 Refrescante', '🥓 Crocante', '🍫 Irresistível', '🌿 Orgânico',
                                                                        '🧀 Artesanal', '🥧 Tradicional'
                                                                    ].map(t => (
                                                                        <button
                                                                            key={t}
                                                                            type="button"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                const items = [...localConfig.menuItems];
                                                                                items[idx].tag = t;
                                                                                updateField(['menuItems'], items);
                                                                            }}
                                                                            className="text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-[10px] text-gray-300 transition-colors"
                                                                        >
                                                                            {t}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Categoria</label>
                                                        <select
                                                            value={item.category}
                                                            onChange={(e) => {
                                                                const items = [...localConfig.menuItems];
                                                                items[idx].category = e.target.value;
                                                                updateField(['menuItems'], items);
                                                            }}
                                                            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold appearance-none cursor-pointer"
                                                        >
                                                            <option value="Pratos">Pratos</option>
                                                            <option value="Acompanhamentos">Acompanhamentos</option>
                                                            <option value="Bebidas">Bebidas</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gold/10 border border-gold/20 p-5 rounded-2xl shadow-lg shadow-gold/5">
                                    <div className="flex items-center gap-3 text-gold">
                                        <ImageIcon className="w-6 h-6" />
                                        <div>
                                            <span className="block text-sm font-bold">Galeria de Fotos</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Gestão de imagens e legendas</span>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 bg-gold text-deep font-black px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:scale-105 transition-all shadow-lg shadow-gold/20">
                                        <Plus className="w-4 h-4" />
                                        Upload em Massa
                                        <input type="file" className="hidden" multiple onChange={async (e) => {
                                            const files = e.target.files;
                                            if (!files) return;

                                            setIsSaving(true);
                                            const newImages = [...localConfig.gallery];
                                            for (let i = 0; i < files.length; i++) {
                                                const file = files[i];
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${Math.random()}.${fileExt}`;
                                                const filePath = `gallery/${fileName}`;

                                                const { error } = await supabase.storage.from('site-assets').upload(filePath, file);
                                                if (!error) {
                                                    const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath);
                                                    newImages.push({ url: data.publicUrl, label: 'Momento Especial' });
                                                }
                                            }
                                            updateField(['gallery'], newImages);
                                            setIsSaving(false);
                                        }} />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {localConfig.gallery?.map((img: any, idx: number) => (
                                        <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/5 bg-deep/50 shadow-xl transition-all hover:border-gold/30">
                                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                            {/* Legend Overlay (Bottom) */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-3 z-10 pointer-events-none group-hover:pointer-events-auto">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Legenda</label>
                                                    <input
                                                        value={img.label}
                                                        onChange={(e) => {
                                                            const gal = [...localConfig.gallery];
                                                            gal[idx].label = e.target.value;
                                                            updateField(['gallery'], gal);
                                                        }}
                                                        className="w-full bg-deep/95 text-white text-xs p-2.5 rounded-xl border border-white/10 outline-none focus:border-gold pointer-events-auto"
                                                        placeholder="Legenda da foto..."
                                                    />
                                                </div>
                                                <label className="flex items-center justify-center gap-2 bg-white/10 hover:bg-gold hover:text-deep border border-white/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer pointer-events-auto">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Trocar Foto
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(e, ['gallery', idx.toString(), 'url'])}
                                                    />
                                                </label>
                                            </div>

                                            {/* Action Controls (Top) - Higher Z-Index */}
                                            <div className="absolute top-3 right-3 z-30 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Delete clicked for index:", idx);
                                                        if (window.confirm('Tem certeza que deseja excluir esta foto da galeria?')) {
                                                            const gal = localConfig.gallery.filter((_: any, i: number) => i !== idx);
                                                            updateField(['gallery'], [...gal]);
                                                        }
                                                    }}
                                                    className="p-3 bg-red-600 text-white rounded-2xl shadow-2xl hover:bg-red-700 hover:scale-110 active:scale-95 transition-all border border-white/10"
                                                    title="Excluir Foto"
                                                >
                                                    <Trash2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add New Card */}
                                    <label className="group relative rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-gold/5 hover:border-gold/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[280px]">
                                        <div className="w-14 h-14 rounded-full bg-deep/50 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-gold/30 transition-all">
                                            <Plus className="w-7 h-7 text-gray-400 group-hover:text-gold" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Nova Foto</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Clique para adicionar</span>
                                        </div>
                                        <input type="file" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setIsSaving(true);
                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${Math.random()}.${fileExt}`;
                                                const filePath = `gallery/${fileName}`;

                                                const { error } = await supabase.storage.from('site-assets').upload(filePath, file);
                                                if (error) throw error;

                                                const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath);
                                                const newImages = [...localConfig.gallery, { url: data.publicUrl, label: 'Novo Momento' }];
                                                updateField(['gallery'], newImages);
                                            } catch (err: any) {
                                                console.error(err);
                                                setMessage({ type: 'error', text: 'Erro no upload: ' + err.message });
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-10 pb-10">
                                {/* Top Content */}
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título da Seção (Venha Conhecer-nos)</label>
                                            <input
                                                type="text"
                                                value={localConfig.contact?.title || ''}
                                                onChange={(e) => updateField(['contact', 'title'], e.target.value)}
                                                className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto Auxiliar</label>
                                            <input
                                                type="text"
                                                value={localConfig.contact?.text || ''}
                                                onChange={(e) => updateField(['contact', 'text'], e.target.value)}
                                                className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5" />

                                {/* Detailed Info */}
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-gold flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> Localização & Contato
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Endereço Completo</label>
                                                    <textarea
                                                        value={localConfig.contact?.address || ''}
                                                        onChange={(e) => updateField(['contact', 'address'], e.target.value)}
                                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none min-h-[80px]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Link Google Maps</label>
                                                    <input
                                                        type="text"
                                                        value={localConfig.contact?.googleMapsUrl || ''}
                                                        onChange={(e) => updateField(['contact', 'googleMapsUrl'], e.target.value)}
                                                        className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">📱 Telemóvel</label>
                                                        <input
                                                            type="text"
                                                            value={localConfig.contact?.phone || ''}
                                                            onChange={(e) => updateField(['contact', 'phone'], e.target.value)}
                                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">📘 Facebook</label>
                                                        <input
                                                            type="text"
                                                            value={localConfig.contact?.facebook || ''}
                                                            onChange={(e) => updateField(['contact', 'facebook'], e.target.value)}
                                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">📧 Email</label>
                                                        <input
                                                            type="email"
                                                            placeholder="ex: geral@restaurante.pt"
                                                            value={localConfig.contact?.email || ''}
                                                            onChange={(e) => updateField(['contact', 'email'], e.target.value)}
                                                            className="w-full bg-deep border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-gold flex items-center gap-2">
                                                <History className="w-4 h-4" /> Horário de Funcionamento
                                            </h4>
                                            <div className="space-y-3">
                                                {localConfig.contact?.hours?.map((h: any, idx: number) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            value={h.day}
                                                            onChange={(e) => {
                                                                const hours = [...localConfig.contact.hours];
                                                                hours[idx].day = e.target.value;
                                                                updateField(['contact', 'hours'], hours);
                                                            }}
                                                            className="flex-1 bg-deep border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                                                            placeholder="Dias"
                                                        />
                                                        <input
                                                            value={h.time}
                                                            onChange={(e) => {
                                                                const hours = [...localConfig.contact.hours];
                                                                hours[idx].time = e.target.value;
                                                                updateField(['contact', 'hours'], hours);
                                                            }}
                                                            className="flex-1 bg-deep border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                                                            placeholder="Horas"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5" />

                                {/* Footer Lists */}
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-royal flex items-center gap-2">
                                            <Globe className="w-4 h-4" /> Informações (Rodapé)
                                        </h4>
                                        <div className="space-y-2">
                                            {localConfig.footer?.info?.map((info: string, idx: number) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        value={info}
                                                        onChange={(e) => {
                                                            const list = [...localConfig.footer.info];
                                                            list[idx] = e.target.value;
                                                            updateField(['footer', 'info'], list);
                                                        }}
                                                        className="flex-1 bg-deep border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-royal"
                                                    />
                                                    <button onClick={() => {
                                                        const list = localConfig.footer.info.filter((_: any, i: number) => i !== idx);
                                                        updateField(['footer', 'info'], list);
                                                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => updateField(['footer', 'info'], [...localConfig.footer.info, '📍 Nova Informação'])}
                                                className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-royal hover:border-royal/30 transition-all"
                                            >
                                                + Adicionar Informação
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-royal flex items-center gap-2">
                                            <Settings className="w-4 h-4" /> Serviços (Rodapé)
                                        </h4>
                                        <div className="space-y-2">
                                            {localConfig.footer?.services?.map((svc: string, idx: number) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        value={svc}
                                                        onChange={(e) => {
                                                            const list = [...localConfig.footer.services];
                                                            list[idx] = e.target.value;
                                                            updateField(['footer', 'services'], list);
                                                        }}
                                                        className="flex-1 bg-deep border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-royal"
                                                    />
                                                    <button onClick={() => {
                                                        const list = localConfig.footer.services.filter((_: any, i: number) => i !== idx);
                                                        updateField(['footer', 'services'], list);
                                                    }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => updateField(['footer', 'services'], [...localConfig.footer.services, '🍽️ Novo Serviço'])}
                                                className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-royal hover:border-royal/30 transition-all"
                                            >
                                                + Adicionar Serviço
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reservations' && (
                            <div className="space-y-6 h-full flex flex-col">
                                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-white">Reservas de Clientes</h3>
                                            {unreadCount > 0 && !selectedReservation && (
                                                <span className="px-2 py-0.5 bg-red-600 text-[10px] font-bold text-white rounded-full animate-pulse shadow-lg shadow-red-600/20">
                                                    {unreadCount} Novas
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Controle de mesas e pedidos</span>
                                    </div>
                                    {!selectedReservation && unreadCount > 0 && (
                                        <button
                                            onClick={async () => {
                                                await supabase.from('reservations').update({ is_read: true }).eq('is_read', false);
                                                fetchReservations();
                                            }}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                                        >
                                            Limpar Notificações
                                        </button>
                                    )}
                                </div>

                                {selectedReservation ? (
                                    /* DETAILED RESERVATION VIEW */
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => setSelectedReservation(null)}
                                            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white mb-6 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Voltar para a lista
                                        </button>

                                        <div className="glass p-8 rounded-3xl border border-white/5 relative">
                                            <div className="flex flex-col md:flex-row justify-between gap-8">

                                                {/* Client Info Section */}
                                                <div className="flex-1 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-flame/20 flex items-center justify-center text-gold font-black text-2xl border border-gold/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                                            {selectedReservation.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-white text-2xl mb-1">{selectedReservation.name}</h4>
                                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                                Criado em {new Date(selectedReservation.created_at).toLocaleString('pt-PT')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 bg-deep/50 p-5 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                                                                <Phone className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-medium">{selectedReservation.phone}</span>
                                                        </div>
                                                        {selectedReservation.email && (
                                                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                                                                    <Mail className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-medium">{selectedReservation.email}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            const msg = `Olá ${selectedReservation.name}, entrando em contato referente à sua reserva na Churrasqueira Amores para o dia ${new Date(selectedReservation.date).toLocaleDateString('pt-PT')} às ${selectedReservation.time.slice(0, 5)}.\n\nSE ESTÁ TUDO CERTO COM A RESERVA, SE PODEMOS CONCLUIR A RESERVA SOLICITADA?`;
                                                            window.open(`https://wa.me/351${selectedReservation.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        <MessageCircle className="w-5 h-5" /> Conversar no WhatsApp
                                                    </button>
                                                </div>

                                                {/* Reservation Details Section */}
                                                <div className="flex-1 space-y-6">
                                                    <h5 className="font-bold text-white text-sm uppercase tracking-widest border-b border-white/5 pb-3">Detalhes do Pedido</h5>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="glass p-4 rounded-xl border border-white/5">
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                                                <Calendar className="w-3.5 h-3.5" /> Data
                                                            </span>
                                                            <div className="font-bold text-gray-200">
                                                                {new Date(selectedReservation.date).toLocaleDateString('pt-PT')}
                                                            </div>
                                                        </div>
                                                        <div className="glass p-4 rounded-xl border border-white/5">
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                                                <Clock className="w-3.5 h-3.5" /> Hora
                                                            </span>
                                                            <div className="font-bold text-gray-200">
                                                                {selectedReservation.time.slice(0, 5)}
                                                            </div>
                                                        </div>
                                                        <div className="glass p-4 rounded-xl border border-white/5">
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                                                <Users className="w-3.5 h-3.5" /> Pessoas
                                                            </span>
                                                            <div className="font-bold text-gray-200">
                                                                {selectedReservation.people}
                                                            </div>
                                                        </div>
                                                        <div className="glass p-4 rounded-xl border border-gold/20 relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-colors" />
                                                            <span className="relative flex items-center gap-1.5 text-[10px] font-bold text-gold uppercase tracking-widest mb-2">
                                                                <Utensils className="w-3.5 h-3.5" /> Prato
                                                            </span>
                                                            <div className="relative font-bold text-white truncate">
                                                                {selectedReservation.menu_item || 'Geral'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 p-5 glass rounded-2xl border border-white/5 bg-deep/30">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                                                            Status da Reserva
                                                        </label>
                                                        <select
                                                            value={selectedReservation.status || 'Esperando Resposta'}
                                                            onChange={(e) => updateReservationStatus(selectedReservation.id, e.target.value)}
                                                            className={`w-full p-3 rounded-xl border text-sm font-bold appearance-none cursor-pointer outline-none transition-all ${!selectedReservation.status || selectedReservation.status === 'Esperando Resposta'
                                                                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 focus:border-yellow-500'
                                                                : selectedReservation.status === 'Concluída'
                                                                    ? 'bg-green-500/10 border-green-500/30 text-green-500 focus:border-green-500'
                                                                    : 'bg-red-500/10 border-red-500/30 text-red-500 focus:border-red-500'
                                                                }`}
                                                        >
                                                            <option value="Esperando Resposta" className="bg-deep text-yellow-500">⏳ Esperando Resposta</option>
                                                            <option value="Concluída" className="bg-deep text-green-500">✅ Concluída</option>
                                                            <option value="Cancelamento de Reserva" className="bg-deep text-red-500">❌ Cancelamento de Reserva</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-6">
                                                        {!selectedReservation.is_read ? (
                                                            <button
                                                                onClick={() => {
                                                                    markAsRead(selectedReservation.id);
                                                                    setSelectedReservation({ ...selectedReservation, is_read: true });
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-gold/10 text-gray-300 hover:text-gold rounded-lg font-bold text-xs transition-colors border border-white/5 hover:border-gold/20 flex-1 justify-center relative overflow-hidden group"
                                                            >
                                                                <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/5 blur-md" />
                                                                <CheckCircle className="w-4 h-4 relative z-10" /> <span className="relative z-10">Marcar como Lido</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 px-4 py-2 bg-deep/50 text-gray-500 rounded-lg font-bold text-xs border border-white/5 flex-1 justify-center">
                                                                <CheckCircle className="w-4 h-4" /> Visto
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => deleteReservation(selectedReservation.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-xs transition-colors border border-red-500/20 hover:border-red-500/40 relative overflow-hidden group"
                                                        >
                                                            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 blur-md" />
                                                            <Trash2 className="w-4 h-4 relative z-10" /> <span className="relative z-10">Eliminar</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* LIST RESERVATION VIEW */
                                    <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                        {reservations.length === 0 ? (
                                            <div className="text-center py-20 bg-deep/20 rounded-3xl border border-white/5">
                                                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                                                <p className="text-gray-500 font-medium">Nenhuma reserva encontrada.</p>
                                            </div>
                                        ) : (
                                            reservations.map((res) => (
                                                <div
                                                    key={res.id}
                                                    onClick={() => {
                                                        setSelectedReservation(res);
                                                        if (!res.is_read) markAsRead(res.id);
                                                    }}
                                                    className={`glass relative p-5 rounded-2xl border transition-all cursor-pointer hover:border-gold/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] group ${!res.is_read ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}
                                                >
                                                    {!res.is_read && (
                                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-red-600 text-[9px] font-black text-white rounded uppercase tracking-tighter animate-bounce">Novo</span>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                        {/* Client Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-black border border-gold/20 group-hover:bg-gold text-white transition-colors duration-300">
                                                                    {res.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                                        {res.name}
                                                                        {(!res.status || res.status === 'Esperando Resposta') && (
                                                                            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" title="Esperando Resposta" />
                                                                        )}
                                                                        {res.status === 'Concluída' && (
                                                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Concluída" />
                                                                        )}
                                                                        {res.status === 'Cancelamento de Reserva' && (
                                                                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" title="Cancelada" />
                                                                        )}
                                                                    </h4>
                                                                    <div className="space-y-1 mt-1">
                                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                                            <Phone className="w-3 h-3" /> {res.phone}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Reservation Details Simplified for List */}
                                                        <div className="flex-[2] grid grid-cols-3 gap-4">
                                                            <div className="space-y-1">
                                                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Data / Hora</span>
                                                                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-200">
                                                                    <Calendar className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                                                                    {new Date(res.date).toLocaleDateString('pt-PT')} <span className="opacity-50">às</span> {res.time.slice(0, 5)}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pessoas</span>
                                                                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-200">
                                                                    <Users className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                                                                    {res.people} {res.people === 1 ? 'Pessoa' : 'Pessoas'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Ação</span>
                                                                <div className="text-[11px] font-bold text-gold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                    Ver Detalhes &nbsp;<ChevronLeft className="w-3 h-3 animate-pulse rotate-180" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
