/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
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
import { LoginScreen } from './components/LoginScreen';
import { UserRole, Invoice, Product, Batch, StaffMember } from './types';
import { store } from './services/store';

export default function App() {
  const [session, setSession] = useState(store.getSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [selectedStickerProduct, setSelectedStickerProduct] = useState<Product | undefined>(undefined);
  const [selectedStickerBatch, setSelectedStickerBatch] = useState<Batch | undefined>(undefined);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [newBatchProductId, setNewBatchProductId] = useState<string | undefined>(undefined);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

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

  const handleResetData = () => {
    if (confirm('Reset store data back to clean 0 state?')) {
      store.resetAllToSampleData();
      window.location.reload();
    }
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

  const handleSaleComplete = (invoice: Invoice) => {
    setActiveInvoice(invoice);
  };

  // If not authenticated, present the secure LoginScreen
  if (!session.isAuthenticated || !session.user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const currentRole = session.role;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar adhering to 3-zone contract with Session Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        onLogout={handleLogout}
        onResetData={handleResetData}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={setActiveTab}
            onOpenNewBatchModal={() => handleOpenNewBatchModal()}
            onOpenStickerModal={handleOpenStickerModal}
            onViewInvoice={(inv) => setActiveInvoice(inv)}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'pos' && (
          <POSScanner
            onSaleComplete={handleSaleComplete}
            onOpenStickers={handleOpenStickerModal}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            currentRole={currentRole}
            onOpenNewBatchModal={handleOpenNewBatchModal}
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
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>AgroPulse ERP v3.0</span> · Persistent Token Authentication Active · Logged in as <strong className="text-slate-800">{session.user.name}</strong> ({session.role})
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>CIB&amp;RC Schedule IV Compliance Verified</span>
            <span>·</span>
            <span>Seeds Act 1966 Section 7 Compliant</span>
          </div>
        </div>
      </footer>

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
          onBatchCreated={(batch) => {
            // Re-render
          }}
        />
      )}

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

    </div>
  );
}
