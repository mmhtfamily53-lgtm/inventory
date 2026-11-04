import React, { useState } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Building2, 
  BookOpen, 
  ScanLine, 
  PlusCircle, 
  Printer, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldAlert, 
  Lock,
  ChevronRight,
  TrendingUp,
  FileText,
  Plus,
  Package
} from 'lucide-react';
import { Product, Batch, Invoice, UserRole } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewBatchModal: () => void;
  onOpenQuickAdd: () => void;
  onOpenStockAdjust: (productId?: string) => void;
  onOpenStickerModal: (product?: Product, batch?: Batch) => void;
  onViewInvoice: (invoice: Invoice) => void;
  currentRole: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewBatchModal,
  onOpenQuickAdd,
  onOpenStockAdjust,
  onOpenStickerModal,
  onViewInvoice,
  currentRole,
}) => {
  const products = store.getProducts();
  const invoices = store.getInvoices();
  const suppliers = store.getSuppliers();
  const farmers = store.getFarmers();
  const lowStockList = store.getLowStockProducts();

  // Aggregate batch statistics
  const allBatches: { product: Product; batch: Batch; daysLeft: number }[] = [];
  let totalStockCount = 0;

  products.forEach(p => {
    p.batches.forEach(b => {
      totalStockCount += b.currentQuantity;
      const daysLeft = getDaysUntilExpiration(b.expiryDate);
      allBatches.push({ product: p, batch: b, daysLeft });
    });
  });

  // Expired and Expiring Batches
  const expiredBatches = allBatches.filter(item => item.daysLeft <= 0);
  const expiringSoonBatches = allBatches.filter(item => item.daysLeft > 0 && item.daysLeft <= 60);

  // Financial totals (Admin only)
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const supplierDues = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);
  const farmerReceivables = farmers.reduce((acc, f) => acc + f.outstandingDebt, 0);

  // Sort batches by urgency
  const urgentBatches = [...allBatches].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Operational Command Center
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active Season: Rabi 2024-25
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance monitoring, dynamic barcode tracking, and automated stock deduction.
          </p>
        </div>

        {/* Quick Action Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>

          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-slate-600" />
            <span>POS Billing</span>
          </button>
          
          <button
            onClick={() => onOpenStockAdjust()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <span>+/- Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* Role Restriction Banner if Worker */}
      {currentRole === 'WORKER' && (
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Worker / Cashier Session Active:</span> Financial wholesale costs, supplier balance sheets, and store margins are masked. POS billing, barcode scanning, and inventory stock views remain active.
          </div>
        </div>
      )}

      {/* DEDICATED LOW STOCK TRACKER NOTIFICATION PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          lowStockList.length > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              lowStockList.length > 0 ? 'bg-rose-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {lowStockList.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Low Stock &amp; Reorder Notification Tracker
                </h2>
                {lowStockList.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-600 text-white shadow-xs">
                    {lowStockList.length} Products Below Safe Threshold
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    All Inventory Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically monitors all inventory items and triggers reorder notices when stock dips below threshold.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenStockAdjust()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+/- Adjust Stock</span>
          </button>
        </div>

        {lowStockList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {lowStockList.map(({ product, totalStock, minThreshold, isOutOfStock }) => (
              <div key={product.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900">
                      {product.name} ({product.brand})
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Stock: {totalStock} units
                    </span>
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                        Out of Stock (0 units)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                        Low Stock Warning ({totalStock} units left)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Active: {product.activeIngredient}</span>
                    <span>·</span>
                    <span className="font-semibold text-rose-700">Minimum Safe Threshold: {minThreshold} units</span>
                    {product.customBarcode && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-slate-600">Barcode: {product.customBarcode}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenStockAdjust(product.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Restock Units</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-slate-800">All registered items are above minimum stock thresholds.</span>
            <span>When stock dips below threshold, red warning badges and restock shortcuts will appear here automatically.</span>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Revenue or Today's Sales Count */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{currentRole === 'ADMIN' ? 'Total Sales Revenue' : 'Total Invoices Billed'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {currentRole === 'ADMIN' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {currentRole === 'ADMIN' ? `₹${totalRevenue.toLocaleString()}` : `${invoices.length} Bills`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">100% Tax Compliant</span> · GST Breakup Logged
          </p>
        </div>

        {/* Metric 2: Expiry Risk Alert */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chemical &amp; Seed Expiry Alert</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              expiredBatches.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-600">
              {expiredBatches.length} Expired
            </span>
            <span className="text-xs text-amber-600 font-mono font-medium">
              +{expiringSoonBatches.length} &lt; 60 days
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Automated POS lockout prevents illegal dispensation
          </p>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Live Stock Count</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalStockCount} Units
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({products.length} Products)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {lowStockList.length > 0 ? `${lowStockList.length} items need restock` : 'Stock healthy across store'}
          </p>
        </div>

        {/* Metric 4: Farmer Khata Debt Ledger */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{currentRole === 'ADMIN' ? 'Farmer Khata (Receivables)' : 'Farmer Khata Accounts'}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {currentRole === 'ADMIN' ? `₹${farmerReceivables.toLocaleString()}` : `${farmers.length} Accounts`}
            </span>
            {currentRole === 'ADMIN' && (
              <span className="text-xs text-amber-700 font-medium">
                {farmers.filter(f => f.outstandingDebt > 0).length} Farmers
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {currentRole === 'ADMIN' ? 'Pending customer credit recovery' : 'Customer credit verification active'}
          </p>
        </div>

      </div>

      {/* Two Column Section: Expiration Radar & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Active Inventory Stock Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Inventory &amp; Stock Levels
                </h2>
                <p className="text-xs text-slate-500">
                  Current stock counts, company brands, and selling prices
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>View All Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Product Name &amp; Company</th>
                  <th className="py-2.5 px-3 font-semibold text-center">In-Store Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Selling Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No products added yet. Click "+ Add Product" to get started.
                    </td>
                  </tr>
                ) : (
                  products.slice(0, 6).map((product) => {
                    const totalStock = product.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
                    const sampleBatch = product.batches[0];

                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            by {product.brand} · {product.activeIngredient}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                            totalStock === 0 
                              ? 'bg-rose-100 text-rose-800' 
                              : totalStock <= product.minStockThreshold 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {totalStock} units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{sampleBatch ? sampleBatch.retailPrice : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenStockAdjust(product.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors mr-1.5"
                          >
                            +/- Stock
                          </button>
                          {sampleBatch && (
                            <button
                              onClick={() => onOpenStickerModal(product, sampleBatch)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Tag
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent POS Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent POS Invoices
                </h2>
                <p className="text-xs text-slate-500">
                  Live counter sales stream
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              New Sale
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No invoices billed yet today.
              </div>
            ) : (
              invoices.slice(0, 5).map(inv => (
                <div
                  key={inv.id}
                  onClick={() => onViewInvoice(inv)}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200/80 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="font-mono font-bold text-emerald-800 tabular-nums">
                      ₹{inv.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{inv.customerName}</span>
                    <span className="font-mono uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                      {inv.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
