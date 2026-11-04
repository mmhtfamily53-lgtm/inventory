import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Phone, 
  MapPin, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { store } from '../services/store';
import { ShopSettings } from '../types';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: ShopSettings) => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const currentSettings = store.getShopSettings();

  const [shopName, setShopName] = useState(currentSettings.shopName || '');
  const [shopAddress, setShopAddress] = useState(currentSettings.shopAddress || '');
  const [shopPhone, setShopPhone] = useState(currentSettings.shopPhone || '');
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shopName.trim()) {
      setError('Please enter your Shop Name.');
      return;
    }

    const updated = store.updateShopSettings({
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
      shopPhone: shopPhone.trim(),
    });

    setSuccess(true);
    if (onSaved) onSaved(updated);

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Store className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Business &amp; Bill Settings
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure your real shop details printed on customer receipts.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Shop details saved successfully!</span>
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Shop Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Kisan Agro Center, Patel Seeds &amp; Pesticides"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Shop Address */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Shop Address
            </label>
            <textarea
              rows={2}
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="e.g. Shop No. 12, Main Market Yard, Tehsil Road"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Enter your actual physical location. No fake or dummy addresses.
            </span>
          </div>

          {/* Shop Contact Number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Actual Shop Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Customers can call this number for support.
            </span>
          </div>

          {/* Notice Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clean Customer Bill Guarantee</span>
            </div>
            <p>
              Only your shop name, address, contact number, and purchased product totals are shown to customers. Internal batch numbers, technical chemical codes, and inventory IDs are never printed on customer receipts.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold bg-slate-100 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Details</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
