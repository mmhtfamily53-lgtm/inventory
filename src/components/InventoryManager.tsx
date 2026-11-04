import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Minus,
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
  ChevronRight,
  PlusCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Product, Batch, ProductType, ToxicityClass, UserRole } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';

interface InventoryManagerProps {
  currentRole: UserRole;
  onOpenNewBatchModal: (productId?: string) => void;
  onOpenQuickAdd: () => void;
  onOpenStockAdjust: (productId?: string) => void;
  onOpenStickerModal: (product: Product, batch: Batch) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  currentRole,
  onOpenNewBatchModal,
  onOpenQuickAdd,
  onOpenStockAdjust,
  onOpenStickerModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState<'ALL' | 'EXPIRED' | 'EXPIRING_SOON' | 'HEALTHY'>('ALL');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(store.getProducts());

  const refreshProducts = () => {
    setProducts(store.getProducts());
  };

  const handleQuickDelta = (productId: string, delta: number) => {
    try {
      const res = store.quickAdjustStock(productId, undefined, delta);
      refreshProducts();
      setFeedbackMsg(`Updated ${res.productName}! Current Stock: ${res.newQuantity} units.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating stock');
    }
  };

  // Filter products and their batches
  const filteredProducts = products.filter(product => {
    if (selectedType !== 'ALL' && product.type !== selectedType) {
      return false;
    }

    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase()) ||
      product.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      (product.customBarcode && product.customBarcode.toLowerCase().includes(search.toLowerCase())) ||
      product.governmentLicenseNo.toLowerCase().includes(search.toLowerCase()) ||
      product.batches.some(b => 
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        (b.customBarcode && b.customBarcode.toLowerCase().includes(search.toLowerCase()))
      );

    if (!matchesSearch) return false;

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
    { label: 'Fertilizers', value: 'FERTILIZER' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast message */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory &amp; Product Stock Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying live product stock counts, active ingredients, and custom barcodes/QR codes.
          </p>
        </div>

        {currentRole === 'ADMIN' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Quick Add Product</span>
            </button>

            <button
              onClick={() => onOpenStockAdjust()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
            >
              <Package className="w-4 h-4 text-slate-600" />
              <span>+/- Adjust Stock</span>
            </button>

            <button
              onClick={() => onOpenNewBatchModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <span>+ Consignment Batch</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Worker Read-Only Inventory Mode</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Product Name, Company (e.g. Bayer), Barcode/QR, or Active Ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full md:w-44 text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {productTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Expiry Segmented Buttons */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setSelectedExpiryFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedExpiryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Expiry
              </button>
              <button
                onClick={() => setSelectedExpiryFilter('EXPIRING_SOON')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedExpiryFilter === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                &lt; 60 Days
              </button>
              <button
                onClick={() => setSelectedExpiryFilter('EXPIRED')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedExpiryFilter === 'EXPIRED' ? 'bg-rose-100 text-rose-900 font-bold' : 'text-slate-600 hover:text-rose-800'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">
              No products found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search 
                ? 'No inventory items match your search filter.' 
                : 'Your store database is ready for real-world products. Click "+ Quick Add Product" above to add your first item.'}
            </p>
            {currentRole === 'ADMIN' && (
              <button
                onClick={onOpenQuickAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Product Now</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map(product => {
            const totalStock = product.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
            const isLowStock = totalStock <= product.minStockThreshold;
            const isOutOfStock = totalStock === 0;
            const tox = getToxicityDisplay(product.toxicityClass);
            const isExpanded = expandedProductId === product.id || search.length > 0;

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:border-slate-300"
              >
                {/* Product Card Top Row */}
                <div 
                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    <div>
                      {/* Product Name (Company) — Stock: X units */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-slate-900">
                          {product.name} ({product.brand}) — <span className="text-emerald-700 font-mono">Stock: {totalStock} units</span>
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tox.colorClass}`}>
                          {tox.label}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            Low Stock Alert (&lt; {product.minStockThreshold})
                          </span>
                        ) : null}

                        {product.customBarcode && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-slate-500" />
                            <span>Barcode: {product.customBarcode}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700">Active: {product.activeIngredient}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">Threshold: {product.minStockThreshold} units</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">GST: {product.gstRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Inline Stock Adjust Buttons (+ / -) */}
                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                    
                    {currentRole === 'ADMIN' && (
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickDelta(product.id, -1);
                          }}
                          disabled={totalStock <= 0}
                          title="Subtract 1 unit"
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs transition-colors shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 text-slate-900">
                          {totalStock} units
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickDelta(product.id, 1);
                          }}
                          title="Add 1 unit"
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center font-bold text-xs transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {currentRole === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStockAdjust(product.id);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
                      >
                        +/- Adjust
                      </button>
                    )}
                  </div>
                </div>

                {/* Batches Table (Always open if matches or expanded) */}
                <div className="bg-slate-50/50 p-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registered Batches, Barcodes &amp; Stickers</span>
                    </div>

                    {currentRole === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewBatchModal(product.id);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        + Add Custom Batch
                      </button>
                    )}
                  </div>

                  {product.batches.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No batch entries recorded. Use "+/- Adjust" or "+ Quick Add Product" to add stock.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                            <th className="py-2 px-3 font-semibold">QR Code</th>
                            <th className="py-2 px-3 font-semibold">Batch No. &amp; Barcode</th>
                            <th className="py-2 px-3 font-semibold">Mfg / Expiry Date</th>
                            <th className="py-2 px-3 font-semibold">Current Stock</th>
                            <th className="py-2 px-3 font-semibold">MRP (Retail)</th>
                            {currentRole === 'ADMIN' && (
                              <th className="py-2 px-3 font-semibold">Cost Price / Margin</th>
                            )}
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
                                
                                {/* Dynamic QR Thumbnail */}
                                <td className="py-2.5 px-3">
                                  {batch.qrCodeDataUrl ? (
                                    <img 
                                      src={batch.qrCodeDataUrl} 
                                      alt="Batch QR" 
                                      className="w-9 h-9 border border-slate-200 rounded p-0.5 bg-white shadow-2xs"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                                      <QrCode className="w-5 h-5" />
                                    </div>
                                  )}
                                </td>

                                {/* Batch No. & Barcode */}
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                                  {batch.customBarcode ? (
                                    <div className="text-[10px] text-emerald-800 font-mono font-semibold">
                                      Barcode: {batch.customBarcode}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-mono">Invoice: {batch.supplierInvoiceNo}</div>
                                  )}
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

                                {/* Stock Quantity */}
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

                                {/* Actions */}
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => onOpenStickerModal(product, batch)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                                  >
                                    <Printer className="w-3 h-3 text-slate-500" />
                                    <span>Print Sticker</span>
                                  </button>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
