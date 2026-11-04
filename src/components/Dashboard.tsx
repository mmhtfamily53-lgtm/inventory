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
  FileText
} from 'lucide-react';
import { Product, Batch, Invoice, UserRole } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';
import { ActiveTab } from './Navbar';

interface DashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewBatchModal: () => void;
  onOpenStickerModal: (product?: Product, batch?: Batch) => void;
  onViewInvoice: (invoice: Invoice) => void;
  currentRole: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewBatchModal,
  onOpenStickerModal,
  onViewInvoice,
  currentRole,
}) => {
  const products = store.getProducts();
  const invoices = store.getInvoices();
  const suppliers = store.getSuppliers();
  const farmers = store.getFarmers();

  // Aggregate batch statistics
  const allBatches: { product: Product; batch: Batch; daysLeft: number }[] = [];
  let totalStockCount = 0;
  let lowStockProductsCount = 0;

  products.forEach(p => {
    let productTotalStock = 0;
    p.batches.forEach(b => {
      totalStockCount += b.currentQuantity;
      productTotalStock += b.currentQuantity;
      const daysLeft = getDaysUntilExpiration(b.expiryDate);
      allBatches.push({ product: p, batch: b, daysLeft });
    });
    if (productTotalStock <= p.minStockThreshold) {
      lowStockProductsCount++;
    }
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
      
      {/* Top Banner / Role Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Operational Command Center
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active Season: Rabi 2024-25
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance monitoring for seed germination certificates and CIB&amp;RC pesticide batches.
          </p>
        </div>

        {/* Quick Action Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span>Launch POS Scanner</span>
          </button>
          
          {currentRole === 'ADMIN' && (
            <button
              onClick={onOpenNewBatchModal}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>Inbound Stock QR</span>
            </button>
          )}

          <button
            onClick={() => onOpenStickerModal()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Batch Stickers</span>
          </button>
        </div>
      </div>

      {/* Role Restriction Banner if Worker */}
      {currentRole === 'WORKER' && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="font-semibold">Worker / Cashier Session Active:</span> Financial margins, wholesale supplier purchase prices, and company balance sheets are masked under security policy. POS billing, customer ledger updates, and dynamic QR verification remain fully enabled.
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Revenue or Today's Sales Count */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
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

        {/* Metric 2: Expiry Risk Alert (Critical for Seeds/Pesticides) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
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
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Inventory Thresholds</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {lowStockProductsCount} Products
            </span>
            <span className="text-xs text-slate-500">
              ({totalStockCount} units live)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reorder triggered based on seasonal surge
          </p>
        </div>

        {/* Metric 4: Farmer Khata Debt Ledger */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
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
            {currentRole === 'ADMIN' ? 'Pending post-harvest recovery register' : 'Customer credit verification active'}
          </p>
        </div>

      </div>

      {/* Two Column Section: Expiration Radar & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Batch Expiration Radar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Chemical &amp; Seed Expiration Radar
                </h2>
                <p className="text-xs text-slate-500">
                  Batches nearing chemical efficacy or seed germination degradation
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>View All Batches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Product &amp; Active Ingredient</th>
                  <th className="py-2.5 px-3 font-semibold">Batch No.</th>
                  <th className="py-2.5 px-3 font-semibold">Available</th>
                  <th className="py-2.5 px-3 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-3 font-semibold">Status / Days</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentBatches.map(({ product, batch, daysLeft }) => {
                  const tox = getToxicityDisplay(product.toxicityClass);
                  const isExpired = daysLeft <= 0;
                  const isNearExpiry = daysLeft > 0 && daysLeft <= 60;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-[11px] text-slate-500">{product.activeIngredient}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-800 font-medium">
                        {batch.currentQuantity} {batch.unit}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {batch.expiryDate}
                      </td>
                      <td className="py-3 px-3">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Expired ({Math.abs(daysLeft)}d ago)
                          </span>
                        ) : isNearExpiry ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {daysLeft} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {daysLeft} days valid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenStickerModal(product, batch)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Print QR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent POS Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent POS Invoices
                </h2>
                <p className="text-xs text-slate-500">Live stock-out deductions</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              New Bill
            </button>
          </div>

          <div className="space-y-3">
            {invoices.slice(0, 5).map(inv => (
              <div 
                key={inv.id}
                onClick={() => onViewInvoice(inv)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/60 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">₹{inv.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{inv.customerName} ({inv.customerVillage})</span>
                  <span className="uppercase font-semibold text-emerald-700">{inv.paymentMethod}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{inv.items.length} items deducted</span>
                  <span>{inv.date}</span>
                </div>
              </div>
            ))}
          </div>

          {currentRole === 'ADMIN' && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => onNavigate('analytics')}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Advanced Analytics Hub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
