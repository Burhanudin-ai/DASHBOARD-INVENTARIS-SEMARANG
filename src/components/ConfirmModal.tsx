import React from 'react';
import { X, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getThemeClasses = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-rose-50 border-rose-100',
          iconColor: 'text-rose-600',
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20 shadow-rose-500/10 hover:shadow-rose-500/20',
          icon: <Trash2 className="w-6 h-6 text-rose-600" />,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 border-amber-100',
          iconColor: 'text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20 shadow-amber-500/10 hover:shadow-amber-500/20',
          icon: <RotateCcw className="w-6 h-6 text-amber-600" />,
        };
      default:
        return {
          iconBg: 'bg-blue-50 border-blue-100',
          iconColor: 'text-blue-600',
          btnBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20 shadow-blue-500/10 hover:shadow-blue-500/20',
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
        id="confirm-modal"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 border rounded-xl flex items-center justify-center ${theme.iconBg}`}>
              {theme.icon}
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Text Content */}
          <h3 className="text-base font-black text-gray-900 leading-tight uppercase tracking-wide mb-2">
            {title}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl font-bold transition-colors text-xs cursor-pointer text-center"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 py-2.5 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md text-center ${theme.btnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
