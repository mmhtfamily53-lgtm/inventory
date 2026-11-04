import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Lock, 
  Eye, 
  Calendar, 
  Building2, 
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Product, Batch, ProductType, ToxicityClass, UserRole } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';

interface InventoryManagerProps {
  currentRole: UserRole;
  onOpenNewBatchModal: (productId?: string) => void;
  onOpenStickerModal: (product: Product, batch: Batch) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  currentRole,
  onOpenNewBatchModal,
  onOpenStickerModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState<'ALL' | 'EXPIRED' | 'EXPIRING_SOON' | 'HEALTHY'>('ALL');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const products = store.getProducts();

  // Filter products and their batches
  const filteredProducts = products.filter(product => {
    // Type Filter
    if (selectedType !== 'ALL' && product.type !== selectedType) {
      return false;
    }

    // Search query matches product name, active ingredient, brand, license, or batch numbers
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase()) ||
      product.governmentLicenseNo.toLowerCase().includes(search.toLowerCase()) ||
      product.batches.some(b => b.batchNumber.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    // Expiry filter
    if (selectedExpiryFilter === 'EXPIRED') {
      return product.batches.some(b => getDaysUntilExpiration(b.expiryDate) <= 0);
    }
    if (selectedExpiryFilter === 'EXPIRING_SOON') {
      return product.batches.some(b => {
        const days = getDaysUntilExpiration(b.expiryDate);
        return days > 0 && days <= 60;
      });
    }
    if (selectedExpiryFilter === 'HEALTHY') {
      return product.batches.every(b => getDaysUntilExpiration(b.expiryDate) > 60);
    }

    return true;
  });

  const productTypes: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Insecticides', value: 'INSECTICIDE' },
    { label: 'Fungicides', value: 'FUNGICIDE' },
    { label: 'Herbicides', value: 'HERBICIDE' },
    { label: 'Hybrid Seeds', value: 'HYBRID_SEED' },
    { label: 'Bio-stimulants', value: 'BIO_STIMULANT' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory &amp; Dynamic Batch QR Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking agrochemical active ingredients, CIB&amp;RC statutory permits, seed germination certificates, and unique dynamic batch QR tags.
          </p>
        </div>

        {currentRole === 'ADMIN' ? (
          <button
            onClick={() => onOpenNewBatchModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Inbound Batch &amp; QR</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Worker Read-Only Inventory Mode</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Active Ingredient (e.g. Carbendazim), Product Name, Brand, or Batch No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full md:w-44 text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {productTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Expiry Segmented Buttons */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedExpiryFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedExpiryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Expiry
              </button>
              <button
                onClick={() => setSelectedExpiryFilter('EXPIRING_SOON')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedExpiryFilter === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                &lt; 60 Days
              </button>
              <button
                onClick={() => setSelectedExpiryFilter('EXPIRED')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedExpiryFilter === 'EXPIRED' ? 'bg-rose-100 text-rose-900 font-bold' : 'text-slate-600 hover:text-rose-800'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Products & Batches List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No products matching your search criteria.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const tox = getToxicityDisplay(product.toxicityClass);
            const totalStock = product.batches.reduce((acc, b) => acc + b.currentQuantity, 0);
            const isLowStock = totalStock <= product.minStockThreshold;
            const isExpanded = expandedProductId === product.id;

            return (
              <div 
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-sm"
              >
                {/* Main Product Card Header */}
                <div 
                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                  className="p-4 hover:bg-slate-50/70 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button className="mt-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{product.name}</span>
                        <span className="text-xs text-slate-500 font-medium">by {product.brand}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tox.colorClass}`}>
                          {tox.label}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Low Stock Alert
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-emerald-800">Active: {product.activeIngredient}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">Lic: {product.governmentLicenseNo}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">HSN: {product.hsnCode} (GST: {product.gstRate}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Batch Summary */}
                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Live Stock</div>
                      <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        {totalStock} Units ({product.batches.length} Batches)
                      </div>
                    </div>

                    {currentRole === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewBatchModal(product.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                      >
                        + Add Batch
                      </button>
                    )}
                  </div>
                </div>

                {/* Batches Table (Always open if matches or expanded) */}
                <div className="bg-slate-50/50 p-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dynamic Registered Batches &amp; QR Labels</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                          <th className="py-2 px-3 font-semibold">QR Code</th>
                          <th className="py-2 px-3 font-semibold">Batch No.</th>
                          <th className="py-2 px-3 font-semibold">Mfg / Expiry Date</th>
                          <th className="py-2 px-3 font-semibold">Stock Quantity</th>
                          <th className="py-2 px-3 font-semibold">MRP (Retail)</th>
                          {currentRole === 'ADMIN' && (
                            <th className="py-2 px-3 font-semibold">Cost Price / Margin</th>
                          )}
                          <th className="py-2 px-3 font-semibold">Special Specs</th>
                          <th className="py-2 px-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {product.batches.map(batch => {
                          const days = getDaysUntilExpiration(batch.expiryDate);
                          const isExpired = days <= 0;
                          const isNearExpiry = days > 0 && days <= 60;
                          const profitMargin = ((batch.retailPrice - batch.costPrice) / batch.retailPrice) * 100;

                          return (
                            <tr key={batch.id} className="hover:bg-white transition-colors">
                              {/* QR Thumbnail */}
                              <td className="py-2.5 px-3">
                                {batch.qrCodeDataUrl ? (
                                  <img 
                                    src={batch.qrCodeDataUrl} 
                                    alt="Batch QR Code" 
                                    className="w-10 h-10 border border-slate-200 rounded bg-white p-0.5" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500">
                                    QR
                                  </div>
                                )}
                              </td>

                              {/* Batch No */}
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Invoice: {batch.supplierInvoiceNo}</div>
                              </td>

                              {/* Mfg & Expiry */}
                              <td className="py-2.5 px-3">
                                <div className="font-mono text-slate-600">Mfg: {batch.manufacturingDate}</div>
                                <div className="font-mono flex items-center gap-1 mt-0.5">
                                  <span>Exp: {batch.expiryDate}</span>
                                  {isExpired ? (
                                    <span className="text-[10px] font-bold text-rose-600">(Expired)</span>
                                  ) : isNearExpiry ? (
                                    <span className="text-[10px] font-bold text-amber-600">({days}d left)</span>
                                  ) : null}
                                </div>
                              </td>

                              {/* Stock */}
                              <td className="py-2.5 px-3">
                                <span className={`font-mono font-bold tabular-nums ${
                                  batch.currentQuantity === 0 ? 'text-rose-600' : 'text-slate-900'
                                }`}>
                                  {batch.currentQuantity} / {batch.initialQuantity} {batch.unit}
                                </span>
                              </td>

                              {/* MRP */}
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                                ₹{batch.retailPrice}
                              </td>

                              {/* Cost Price & Margin (ADMIN ONLY) */}
                              {currentRole === 'ADMIN' ? (
                                <td className="py-2.5 px-3">
                                  <div className="font-mono text-slate-700">₹{batch.costPrice}</div>
                                  <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                                    +{profitMargin.toFixed(1)}% margin
                                  </div>
                                </td>
                              ) : null}

                              {/* Special Seed Specs if seed */}
                              <td className="py-2.5 px-3 text-[11px] text-slate-500">
                                {batch.seedGerminationRate ? (
                                  <div className="font-mono">
                                    Germ: <span className="font-bold text-emerald-700">{batch.seedGerminationRate}%</span> · Purity: {batch.seedPurityRate}%
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => onOpenStickerModal(product, batch)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors shadow-2xs"
                                >
                                  <Printer className="w-3 h-3 text-slate-500" />
                                  <span>Print Label</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
