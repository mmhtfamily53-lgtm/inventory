import React, { useState } from 'react';
import { 
  Sprout, 
  Lock, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { store } from '../services/store';
import { StaffMember, UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: StaffMember, role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = store.login(identifier, pin);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.user.role);
      } else {
        setError(res.error || 'Login failed. Please verify your phone number or username and 4-digit PIN.');
      }
      setIsLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-xl bg-emerald-600 items-center justify-center text-white shadow-md">
          <Sprout className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          AgroPulse Terminal
        </h1>
        <p className="text-xs text-slate-500">
          Agrochemical, Pesticide &amp; Seed Retail Store Management
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-5">
          
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Sign In to Counter Terminal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered username, phone, or email and 4-digit security PIN.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            
            {/* Phone or Email Input */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Username / Phone Number / Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter username or registered phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* 4-digit PIN */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                4-Digit Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 font-mono tracking-widest text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">Remember this shop device</span>
              </label>

              <span className="text-[11px] text-slate-400">
                Token saved locally
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !identifier || !pin}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isLoading || !identifier || !pin
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <span>{isLoading ? 'Verifying PIN...' : 'Authenticate & Open Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Persistent JWT authentication active. Employees remain locked in Worker mode on their device.
        </p>
      </div>

    </div>
  );
};
