import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null;

  const icons = {
    error: <AlertCircle className="text-rose-600 w-6 h-6" />,
    success: <CheckCircle2 className="text-emerald-600 w-6 h-6" />,
    info: <Info className="text-blue-600 w-6 h-6" />
  };

  const bgColors = {
    error: 'bg-rose-50 border-rose-200',
    success: 'bg-emerald-50 border-emerald-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="p-5 text-center">
          <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-3 border ${bgColors[type]}`}>
            {icons[type]}
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-slate-500 text-sm leading-normal">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
