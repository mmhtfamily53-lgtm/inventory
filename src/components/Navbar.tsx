import React from 'react';
import { 
  Sprout, 
  ScanLine, 
  Package, 
  Building2, 
  BookOpen, 
  Users, 
  BarChart3, 
  Smartphone, 
  FileCode2, 
  ShieldCheck, 
  UserCheck, 
  LogOut,
  RefreshCw,
  KeyRound 
} from 'lucide-react';
import { UserRole } from '../types';
import { store } from '../services/store';

export type ActiveTab = 
  | 'dashboard' 
  | 'pos' 
  | 'inventory' 
  | 'suppliers' 
  | 'khata' 
  | 'staff' 
  | 'analytics' 
  | 'mobile' 
  | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: UserRole;
  onLogout: () => void;
  onResetData: () => void;
  onOpenChangePin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onLogout,
  onResetData,
  onOpenChangePin,
}) => {
  const currentUser = store.getCurrentUser();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sprout, adminOnly: false },
    { id: 'pos', label: 'POS Billing', icon: ScanLine, adminOnly: false },
    { id: 'inventory', label: 'Inventory & QR', icon: Package, adminOnly: false },
    { id: 'suppliers', label: 'Suppliers (AP)', icon: Building2, adminOnly: true },
    { id: 'khata', label: 'Farmer Khata', icon: BookOpen, adminOnly: false },
    { id: 'staff', label: 'Staff & Credentials', icon: Users, adminOnly: false },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
    { id: 'mobile', label: 'Mobile Field App', icon: Smartphone, adminOnly: false },
    { id: 'architecture', label: 'System Blueprint', icon: FileCode2, adminOnly: true },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                AgroPulse
              </span>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                Agrochemical &amp; Seed ERP
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              if (currentRole === 'WORKER' && item.adminOnly) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Authenticated User Profile, Change PIN & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Authenticated Role Tag */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 text-xs">
              {currentRole === 'ADMIN' ? (
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Worker</span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentRole === 'ADMIN' ? 'Owner Session' : 'Cashier Counter'}
              </span>
            </div>

            {/* Change PIN Button (Accessible to all authenticated staff & admins) */}
            <button
              onClick={onOpenChangePin}
              title="Change your 4-digit security PIN"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Change PIN</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              title="Sign out of this device"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Sub-Navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            if (currentRole === 'WORKER' && item.adminOnly) {
              return null;
            }
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
