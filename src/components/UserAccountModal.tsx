import React, { useState } from 'react';
import {
  X, User, LogOut, ShieldCheck, Mail, Database, Copy, Check,
  Key, Globe, Car, Settings, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  signOutSupabase,
  SUPABASE_SETUP_SQL,
  isSupabaseConfigured,
  getSupabaseConfig,
  updateSupabaseCredentials,
} from '../utils/supabaseClient';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLogout: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const initialConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(initialConfig.url);
  const [customKey, setCustomKey] = useState(initialConfig.anonKey);
  const [configSaved, setConfigSaved] = useState(false);

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(customUrl, customKey);
    setConfigSaved(true);
  };

  const handleSignOut = async () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    await signOutSupabase();
    onLogout();
    onClose();
  };

  const userName =
    currentUser?.displayName ||
    currentUser?.user_metadata?.nombre ||
    localStorage.getItem('wazer_nickname') ||
    currentUser?.email?.split('@')[0] ||
    'Conductor LitroMetrik';

  const userEmail = currentUser?.email || 'conductor@litrometrik.pro';
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4F00] to-[#FF8000] flex items-center justify-center shadow-lg shadow-[#FF4F00]/25">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Cuenta de Conductor</h2>
              <p className="text-[10px] text-slate-400 font-medium">Información de Perfil & Supabase</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* User Card */}
          <div className="p-4 rounded-2xl bg-[#1A2234] border border-slate-700/70 flex items-center space-x-3.5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#080B11] border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🚗
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white truncate">{userName}</div>
              <div className="text-xs text-slate-400 font-medium truncate flex items-center space-x-1 mt-0.5">
                <Mail className="w-3 h-3 text-[#FF4F00] shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <div className="mt-1.5 flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sesión Activa</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                  Moneda: PLN
                </span>
              </div>
            </div>
          </div>

          {/* Supabase Status Box */}
          <div className="p-4 rounded-2xl bg-[#0D131F] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Backend: Supabase Cloud</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isConfigured ? 'Conectado' : 'Modo Estándar'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Autenticación oficial con Supabase Auth y persistencia segura de viajes, tanqueos y precios en la nube.
            </p>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSqlModal(!showSqlModal)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Script SQL (RLS)</span>
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-emerald-500/40"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado' : 'Copiar SQL'}</span>
              </button>
            </div>
          </div>

          {/* SQL Modal Drawer Accordion */}
          {showSqlModal && (
            <div className="p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Script de Creación de Tablas (Supabase SQL Editor):</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-black/60 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-40 border border-slate-800/80 leading-relaxed">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>
          )}

          {/* Supabase Custom Keys Config Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full text-left py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Configurar llaves de Supabase (Opcional)</span>
              </span>
              <span>{showConfig ? '▲' : '▼'}</span>
            </button>

            {showConfig && (
              <form onSubmit={handleSaveCredentials} className="mt-2 p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">VITE_SUPABASE_URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-[#121620] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">VITE_SUPABASE_ANON_KEY</label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                    className="w-full bg-[#121620] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
                >
                  Guardar y Recargar Cliente
                </button>
                {configSaved && (
                  <p className="text-[10px] text-emerald-400 text-center font-bold">¡Credenciales guardadas!</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer with Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0E18] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className={`flex-1 py-2.5 rounded-xl text-white font-black text-xs transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer active:scale-95 ${
              confirmSignOut
                ? 'bg-rose-700 hover:bg-rose-600 ring-2 ring-rose-400 shadow-rose-700/50 animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>{confirmSignOut ? '¿Confirmar Cerrar Sesión?' : 'Cerrar Sesión'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
