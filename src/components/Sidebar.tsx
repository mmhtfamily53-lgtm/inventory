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
  KeyRound,
  PlusCircle,
  AlertTriangle,
  X,
  ChevronRight,
  FlaskConical,
  Store
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

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: UserRole;
  onLogout: () => void;
  onOpenChangePin: () => void;
  onOpenQuickAdd: () => void;
  onOpenShopSettings: () => void;
  onOpenScannerTestLab: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onLogout,
  onOpenChangePin,
  onOpenQuickAdd,
  onOpenShopSettings,
  onOpenScannerTestLab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const currentUser = store.getCurrentUser();
  const lowStockCount = store.getLowStockProducts().length;

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly: boolean;
    badge: string | null;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Sprout, adminOnly: false, badge: null },
    { id: 'pos', label: 'POS Billing', icon: ScanLine, adminOnly: false, badge: 'Scan' },
    { 
      id: 'inventory', 
      label: 'Inventory & Stock', 
      icon: Package, 
      adminOnly: false, 
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    { id: 'suppliers', label: 'Suppliers (AP)', icon: Building2, adminOnly: true, badge: null },
    { id: 'khata', label: 'Farmer Khata', icon: BookOpen, adminOnly: false, badge: null },
    { id: 'staff', label: 'Staff & PINs', icon: Users, adminOnly: false, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: true, badge: null },
    { id: 'mobile', label: 'Mobile Field App', icon: Smartphone, adminOnly: false, badge: null },
    { id: 'architecture', label: 'System Blueprint', icon: FileCode2, adminOnly: true, badge: null },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 w-64 border-r border-slate-800 shadow-xl select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Sprout className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>AgroPulse</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                ERP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Agrochemical &amp; Seed Retail
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Button in Sidebar */}
      <div className="p-3">
        <button
          onClick={() => {
            onOpenQuickAdd();
            setIsOpenMobile(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-none text-xs">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Store Operations
        </div>

        {navItems.map((item) => {
          if (currentRole === 'WORKER' && item.adminOnly) {
            return null;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.badgeColor 
                    ? item.badgeColor 
                    : isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Scanner Reliability Lab Shortcut */}
        <div className="pt-2">
          <button
            onClick={() => {
              onOpenScannerTestLab();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 transition-all font-semibold"
          >
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Scanner Test Lab</span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
              3+ Tests
            </span>
          </button>
        </div>
      </nav>

      {/* Low Stock Quick Banner in Sidebar if any */}
      {lowStockCount > 0 && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold">{lowStockCount} items low stock</span>
          </div>
          <button
            onClick={() => handleSelectTab('inventory')}
            className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-2 py-0.5 rounded"
          >
            View
          </button>
        </div>
      )}

      {/* User Session & Footer in Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              currentRole === 'ADMIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {currentRole === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentRole === 'ADMIN' ? 'Owner (Full Access)' : 'Counter Worker'}
              </div>
            </div>
          </div>

          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
            currentRole === 'ADMIN' ? 'bg-emerald-500 text-slate-950' : 'bg-blue-600 text-white'
          }`}>
            {currentRole}
          </span>
        </div>

        {/* Shop Business Settings Button (Admin) */}
        {currentRole === 'ADMIN' && (
          <button
            onClick={() => {
              onOpenShopSettings();
              setIsOpenMobile(false);
            }}
            title="Edit your real shop name, address and contact number"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shop Details &amp; Bill Settings</span>
          </button>
        )}

        {/* Action Buttons: Change PIN & Sign Out */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            onClick={onOpenChangePin}
            title="Update your 4-digit security PIN"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium border border-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>PIN</span>
          </button>

          <button
            onClick={onLogout}
            title="Sign out of this shop terminal"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 font-medium border border-rose-900/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsOpenMobile(false)} 
          />
          <div className="relative z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
