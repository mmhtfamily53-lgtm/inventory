import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, X, Lock } from 'lucide-react';
import { store } from '../services/store';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentUser = store.getCurrentUser();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPin) {
      setError('Please enter your current 4-digit security PIN.');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and Confirmation PIN do not match.');
      return;
    }

    if (newPin === currentPin) {
      setError('New PIN must be different from your current PIN.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = store.changeMyPin(currentUser.id, currentPin, newPin);
      if (!res.success) {
        setError(res.error || 'Failed to update security PIN.');
        setIsSubmitting(false);
        return;
      }

      setSuccess('Security PIN successfully updated! Your device persistent token has been refreshed.');
      setIsSubmitting(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');

      if (onSuccess) {
        onSuccess('Security PIN updated successfully.');
      }

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Account Security &amp; PIN</h3>
              <p className="text-xs text-slate-500">Update the 4-digit PIN for this shop device</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Context Banner */}
        <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-100/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">Logged in as <strong>{currentUser.name}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 uppercase">
            {currentUser.role}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Current PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current 4-Digit Security PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Initial Master Admin PIN on setup is <span className="font-mono text-slate-600 font-bold">5253</span></p>
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New 4-Digit Security PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Must be exactly 4 numeric digits (e.g. 8492)</p>
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New 4-Digit Security PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Device Security Note:</span>
            </div>
            <p className="leading-normal">
              Updating your PIN will immediately update the credentials for this staff record and refresh your persistent device token.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || newPin.length !== 4 || confirmPin.length !== 4}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating PIN...' : 'Save New PIN'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
