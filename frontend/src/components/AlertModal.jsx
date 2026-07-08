import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null;

  const icons = {
    error: <AlertCircle className="text-rose-500 w-8 h-8" />,
    success: <CheckCircle2 className="text-emerald-500 w-8 h-8" />,
    info: <Info className="text-indigo-500 w-8 h-8" />
  };

  const bgColors = {
    error: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    info: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200`}>
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${bgColors[type]}`}>
            {icons[type]}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
