import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${isDestructive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-slate-500 text-sm leading-normal">{message}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-xs text-white transition-colors shadow-sm ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-slate-950 hover:bg-slate-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
