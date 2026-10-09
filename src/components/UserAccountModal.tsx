import React, { useState, useRef } from 'react';
import {
  X, User, LogOut, Mail, Check, Key, ShieldCheck,
  Camera, Upload, Trash2, Eye, EyeOff, Lock, CheckCircle2,
  AlertCircle, Car, Sparkles
} from 'lucide-react';
import { signOutSupabase } from '../utils/supabaseClient';
import { performSignOut, performChangePassword, getStoredActiveUser } from '../utils/firebaseAuth';
import { getActiveVehicleState, saveActiveVehicleState, UNIFIED_VEHICLE_CATALOG } from '../utils/vehicleCatalog';
import { Sedan3D, Suv3D, Compacto3D, Pickup3D, Van3D, Custom3D } from './Vehicle3DIcons';

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
  const activeVehicle = getActiveVehicleState();
  const [carPhoto, setCarPhoto] = useState<string | null>(activeVehicle.carPhotoUrl);

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // File upload refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    try {
      await signOutSupabase();
    } catch (_) {}
    try {
      await performSignOut();
    } catch (_) {}
    onLogout();
    onClose();
  };

  const handleCarPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La foto debe ser menor a 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCarPhoto(base64);
      saveActiveVehicleState({ carPhotoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCarPhoto = () => {
    setCarPhoto(null);
    saveActiveVehicleState({ carPhotoUrl: null });
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await performChangePassword(newPassword);
      setPasswordSuccess(res.message);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const userName =
    currentUser?.displayName ||
    currentUser?.user_metadata?.nombre ||
    localStorage.getItem('wazer_nickname') ||
    currentUser?.email?.split('@')[0] ||
    'Conductor LitroMetrik';

  const userEmail = currentUser?.email || 'conductor@litrometrik.pro';

  // Render appropriate 3D Vehicle icon based on vehicle category
  const renderVehicle3DIcon = () => {
    const vType = activeVehicle.vehicleType;
    if (vType === 'sedan') return <Sedan3D size={52} />;
    if (vType === 'suv') return <Suv3D size={52} />;
    if (vType === 'compact') return <Compacto3D size={52} />;
    if (vType === 'pickup') return <Pickup3D size={52} />;
    if (vType === 'van') return <Van3D size={52} />;
    return <Custom3D size={52} />;
  };

  const categoryLabel = UNIFIED_VEHICLE_CATALOG[activeVehicle.vehicleType]?.label || 'Sedán Mediano';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4F00] to-[#FF8000] flex items-center justify-center shadow-lg shadow-[#FF4F00]/25">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Cuenta del Conductor</h2>
              <p className="text-[10px] text-slate-400 font-medium">Gestión de Perfil, Contraseña y Vehículo</p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
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
                  <span>Sesión Verificada</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                  LitroMetrik Cloud
                </span>
              </div>
            </div>
          </div>

          {/* FOTO DEL CARRO: Opción para subir de galería o tomar foto con cámara */}
          <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Foto de tu Carro
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Sincronizado con Garaje</span>
              </span>
            </div>

            <div className="flex items-center space-x-3.5">
              {/* Photo or 3D Render Preview */}
              <div className="w-20 h-20 rounded-2xl bg-[#080B11] border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                {carPhoto ? (
                  <img
                    src={carPhoto}
                    alt="Foto del Carro"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="p-1 flex items-center justify-center">
                    {renderVehicle3DIcon()}
                  </div>
                )}
              </div>

              {/* Action Buttons for Car Photo */}
              <div className="flex-1 space-y-1.5">
                <div className="text-xs font-bold text-white truncate">
                  {activeVehicle.vehicleModelName || categoryLabel}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeVehicle.engineName}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  {/* Tomar Foto (Cámara) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                    title="Tomar foto con la cámara"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Cámara</span>
                  </button>

                  {/* Subir de Galería */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                    title="Subir foto desde la galería"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Galería</span>
                  </button>

                  {/* Quitar Foto */}
                  {carPhoto && (
                    <button
                      type="button"
                      onClick={handleRemoveCarPhoto}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                      title="Eliminar foto personalizada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs de archivo ocultos */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCarPhotoUpload}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCarPhotoUpload}
            />
          </div>

          {/* CAMBIAR CONTRASEÑA CON TODAS SUS VARIABLES */}
          <div className="p-4 rounded-2xl bg-[#0D131F] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Seguridad & Cambio de Contraseña</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer flex items-center space-x-1"
              >
                <span>{showPasswordSection ? 'Ocultar' : 'Cambiar Clave'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Puedes actualizar tu contraseña en cualquier momento. La nueva contraseña se verificará para que puedas volver a ingresar con ella en todos tus dispositivos.
            </p>

            {showPasswordSection && (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-1 border-t border-slate-800/80 animate-in fade-in duration-200">
                {/* Nueva Contraseña */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres..."
                      className="w-full bg-[#161D2B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña..."
                      className="w-full bg-[#161D2B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist de Validación en Vivo */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[10px] space-y-1 text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span className={newPassword.length >= 6 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {newPassword.length >= 6 ? '✓' : '•'} Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={newPassword && newPassword === confirmPassword ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {newPassword && newPassword === confirmPassword ? '✓' : '•'} Ambas contraseñas coinciden exactamente
                    </span>
                  </div>
                </div>

                {/* Mensaje de Error */}
                {passwordError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Mensaje de Éxito y Aprobación */}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Botón de Enviar */}
                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-98"
                >
                  {passwordLoading ? (
                    <span>Verificando y guardando...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verificar y Aprobar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer with Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0E18] flex items-center justify-between gap-3 shrink-0">
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
