/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POSScanner } from './components/POSScanner';
import { InventoryManager } from './components/InventoryManager';
import { SupplierLedger } from './components/SupplierLedger';
import { FarmerKhata } from './components/FarmerKhata';
import { StaffManagement } from './components/StaffManagement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MobileCompanionView } from './components/MobileCompanionView';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal';
import { InvoiceModal } from './components/InvoiceModal';
import { PrintableStickersModal } from './components/PrintableStickersModal';
import { NewBatchModal } from './components/NewBatchModal';
import { ChangePinModal } from './components/ChangePinModal';
import { QuickProductModal } from './components/QuickProductModal';
import { ScannerTestModeModal } from './components/ScannerTestModeModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { UserRole, Invoice, Product, Batch, StaffMember } from './types';
import { store } from './services/store';
import { Menu, Plus, Layers, AlertTriangle, FlaskConical, Store } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(store.getSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Modals state
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [selectedStickerProduct, setSelectedStickerProduct] = useState<Product | undefined>(undefined);
  const [selectedStickerBatch, setSelectedStickerBatch] = useState<Batch | undefined>(undefined);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [newBatchProductId, setNewBatchProductId] = useState<string | undefined>(undefined);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Quick Product & Stock Adjust Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddQrCode, setQuickAddQrCode] = useState('');
  const [quickAddMode, setQuickAddMode] = useState<'ADD_PRODUCT' | 'ADJUST_STOCK'>('ADD_PRODUCT');
  const [quickAddProductId, setQuickAddProductId] = useState<string | undefined>(undefined);

  // Scanner Test Lab & Business Settings Modals State
  const [isScannerTestLabOpen, setIsScannerTestLabOpen] = useState(false);
  const [isShopSettingsOpen, setIsShopSettingsOpen] = useState(false);

  // Sync session on mount and ensure workers cannot access admin tabs
  useEffect(() => {
    const current = store.getSession();
    setSession(current);
    if (current.role === 'WORKER' && (activeTab === 'suppliers' || activeTab === 'analytics' || activeTab === 'architecture')) {
      setActiveTab('pos');
    }
  }, [activeTab]);

  const handleLoginSuccess = (user: StaffMember, role: UserRole) => {
    const newSession = store.getSession();
    setSession(newSession);
    if (role === 'WORKER') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    store.logout();
    setSession(store.getSession());
  };

  const handleOpenStickerModal = (product?: Product, batch?: Batch) => {
    setSelectedStickerProduct(product);
    setSelectedStickerBatch(batch);
    setIsStickerModalOpen(true);
  };

  const handleOpenNewBatchModal = (productId?: string) => {
    setNewBatchProductId(productId);
    setIsNewBatchModalOpen(true);
  };

  const handleOpenQuickAdd = () => {
    setQuickAddBarcode('');
    setQuickAddQrCode('');
    setQuickAddMode('ADD_PRODUCT');
    setQuickAddProductId(undefined);
    setIsQuickAddOpen(true);
  };

  const handleOpenStockAdjust = (productId?: string) => {
    setQuickAddBarcode('');
    setQuickAddQrCode('');
    setQuickAddMode('ADJUST_STOCK');
    setQuickAddProductId(productId);
    setIsQuickAddOpen(true);
  };

  const handleOpenQuickAddWithBarcode = (barcode: string) => {
    setQuickAddBarcode(barcode);
    setQuickAddQrCode('');
    setQuickAddMode('ADD_PRODUCT');
    setQuickAddProductId(undefined);
    setIsQuickAddOpen(true);
  };

  const handleSaleComplete = (invoice: Invoice) => {
    setActiveInvoice(invoice);
  };

  // If not authenticated, present the secure LoginScreen
  if (!session.isAuthenticated || !session.user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const currentRole = session.role;
  const lowStockCount = store.getLowStockProducts().length;

  const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard & Store Overview', subtitle: 'Live inventory metrics, sales velocity, and critical alerts' },
    pos: { title: 'Smart POS & Barcode Scanner', subtitle: 'Fast billing, instant inventory deduction & clean tax invoices' },
    inventory: { title: 'Inventory & Stock Management', subtitle: 'Real-time stock counts, quick adjustments, and chemical badges' },
    suppliers: { title: 'Supplier Accounts & AP', subtitle: 'Manufacturer ledgers, inward consignments, and credit balances' },
    khata: { title: 'Farmer Khata & Credit Ledger', subtitle: 'Crop-cycle credit tracking, outstanding dues, and payments' },
    staff: { title: 'Staff Accounts & Terminal PINs', subtitle: 'Role-based access control and security credentials' },
    analytics: { title: 'Business Analytics & Reports', subtitle: 'Margins, seasonal demand forecasting, and compliance logs' },
    mobile: { title: 'Mobile Field Companion', subtitle: 'Field scout view for on-farm consultations and orders' },
    architecture: { title: 'System Architecture Blueprint', subtitle: 'Technical documentation, data schema, and security rules' },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-row font-sans">
      
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        onLogout={handleLogout}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenShopSettings={() => setIsShopSettingsOpen(true)}
        onOpenScannerTestLab={() => setIsScannerTestLabOpen(true)}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpenMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {tabTitles[activeTab]?.title || 'AgroPulse ERP'}
                </h1>
                {activeTab === 'inventory' && lowStockCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{lowStockCount} low stock</span>
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 font-medium">
                {tabTitles[activeTab]?.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Scanner Test Lab Shortcut */}
            <button
              onClick={() => setIsScannerTestLabOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-2xs transition-colors"
              title="Test QR & Barcode scanner reliability across multiple manufacturers"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
              <span>Scanner Lab</span>
            </button>

            {currentRole === 'ADMIN' && (
              <button
                onClick={() => setIsShopSettingsOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                title="Edit your real shop name, address and contact number"
              >
                <Store className="w-3.5 h-3.5 text-slate-600" />
                <span>Shop Info</span>
              </button>
            )}

            <button
              onClick={() => handleOpenStockAdjust()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              title="Quickly add or deduct stock for any product"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>+/- Stock</span>
            </button>

            <button
              onClick={handleOpenQuickAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Add a new product in 10 seconds"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onOpenNewBatchModal={() => handleOpenNewBatchModal()}
              onOpenQuickAdd={handleOpenQuickAdd}
              onOpenStockAdjust={handleOpenStockAdjust}
              onOpenStickerModal={handleOpenStickerModal}
              onViewInvoice={(inv) => setActiveInvoice(inv)}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'pos' && (
            <POSScanner
              onSaleComplete={handleSaleComplete}
              onOpenStickers={handleOpenStickerModal}
              onOpenQuickAddWithBarcode={handleOpenQuickAddWithBarcode}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager
              currentRole={currentRole}
              onOpenNewBatchModal={handleOpenNewBatchModal}
              onOpenQuickAdd={handleOpenQuickAdd}
              onOpenStockAdjust={handleOpenStockAdjust}
              onOpenStickerModal={handleOpenStickerModal}
            />
          )}

          {activeTab === 'suppliers' && currentRole === 'ADMIN' && (
            <SupplierLedger />
          )}

          {activeTab === 'khata' && (
            <FarmerKhata currentRole={currentRole} />
          )}

          {activeTab === 'staff' && (
            <StaffManagement 
              currentRole={currentRole} 
              onOpenChangePin={() => setIsChangePinOpen(true)}
            />
          )}

          {activeTab === 'analytics' && currentRole === 'ADMIN' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'mobile' && (
            <MobileCompanionView />
          )}

          {activeTab === 'architecture' && currentRole === 'ADMIN' && (
            <ArchitectureBlueprintModal />
          )}

        </main>

        {/* Footer */}
        <footer className="no-print bg-white border-t border-slate-200 py-3.5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span>AgroPulse ERP</span> · Signed in as <strong className="text-slate-800">{session.user.name}</strong> ({session.role})
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Real-Time Inventory &amp; Clean Billing System</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {isStickerModalOpen && (
        <PrintableStickersModal
          initialProduct={selectedStickerProduct}
          initialBatch={selectedStickerBatch}
          onClose={() => setIsStickerModalOpen(false)}
        />
      )}

      {isNewBatchModalOpen && (
        <NewBatchModal
          initialProductId={newBatchProductId}
          onClose={() => setIsNewBatchModalOpen(false)}
          onBatchCreated={() => {
            // Re-render
          }}
        />
      )}

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      <QuickProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialBarcode={quickAddBarcode}
        initialQrCode={quickAddQrCode}
        initialMode={quickAddMode}
        initialProductId={quickAddProductId}
        onProductCreated={() => {
          // Re-render
        }}
      />

      <ScannerTestModeModal
        isOpen={isScannerTestLabOpen}
        onClose={() => setIsScannerTestLabOpen(false)}
      />

      <ShopSettingsModal
        isOpen={isShopSettingsOpen}
        onClose={() => setIsShopSettingsOpen(false)}
      />

    </div>
  );
}
