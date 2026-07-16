import React, { useState } from 'react';
import { X, Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  reason?: string;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  reason,
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default password for GA Semarang
    if (password === 'adminsemarang') {
      onLoginSuccess();
      setPassword('');
      onClose();
    } else {
      setError('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
        id="admin-login-modal"
      >
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white text-center relative">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          
          <h3 className="text-base font-black uppercase tracking-wider">Login Administrator</h3>
          <p className="text-[11px] text-slate-300 mt-1 leading-normal font-medium">
            Masuk untuk mendapatkan otorisasi penginputan, pengeditan, dan penghapusan data barang.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Reason Alert (if provided) */}
          {reason && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl flex gap-2 items-start">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] font-bold leading-normal">
                {reason}
              </div>
            </div>
          )}
          
          {/* Info Mode */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start text-blue-900">
            <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed">
              <span className="font-bold">Informasi Akses:</span> Gunakan sandi bawaan <code className="bg-blue-100/80 px-1 py-0.5 rounded-sm font-mono text-blue-800 font-bold">adminsemarang</code> untuk masuk ke mode admin.
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Masukkan Kata Sandi Admin
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold text-center tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="input-admin-password"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-center text-red-700 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span className="text-[11px] font-medium leading-tight">{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-colors text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
            >
              Konfirmasi Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
