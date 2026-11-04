import React, { useState } from 'react';
import { Product, Batch } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';
import { Printer, X, LayoutGrid, Check, QrCode } from 'lucide-react';

interface PrintableStickersModalProps {
  initialProduct?: Product;
  initialBatch?: Batch;
  onClose: () => void;
}

export const PrintableStickersModal: React.FC<PrintableStickersModalProps> = ({
  initialProduct,
  initialBatch,
  onClose,
}) => {
  const products = store.getProducts();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  
  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatch?.id || currentProduct?.batches[0]?.id || ''
  );

  const [sheetLayout, setSheetLayout] = useState<'single' | 'sheet_8' | 'sheet_16'>('sheet_8');

  const currentBatch = currentProduct?.batches.find(b => b.id === selectedBatchId) || currentProduct?.batches[0];

  const tox = currentProduct ? getToxicityDisplay(currentProduct.toxicityClass) : null;
  const days = currentBatch ? getDaysUntilExpiration(currentBatch.expiryDate) : 0;

  const count = sheetLayout === 'single' ? 1 : sheetLayout === 'sheet_8' ? 8 : 16;
  const stickerArray = Array.from({ length: count });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        
        {/* Controls Bar (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Dynamic QR Adhesive Sticker Generator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate standardized scannable QR labels with chemical toxicity classification &amp; license info.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticker Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Selectors (No Print) */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find(p => p.id === e.target.value);
                if (prod && prod.batches.length > 0) {
                  setSelectedBatchId(prod.batches[0].id);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Select Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium font-mono"
            >
              {currentProduct?.batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} (Exp: {b.expiryDate} - {b.currentQuantity} units)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Print Sheet Layout</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSheetLayout('single')}
                className={`flex-1 py-1.5 rounded font-semibold border ${
                  sheetLayout === 'single' ? 'bg-white border-emerald-600 text-emerald-800 shadow-2xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                1 Label
              </button>
              <button
                onClick={() => setSheetLayout('sheet_8')}
                className={`flex-1 py-1.5 rounded font-semibold border ${
                  sheetLayout === 'sheet_8' ? 'bg-white border-emerald-600 text-emerald-800 shadow-2xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                8 (2×4)
              </button>
              <button
                onClick={() => setSheetLayout('sheet_16')}
                className={`flex-1 py-1.5 rounded font-semibold border ${
                  sheetLayout === 'sheet_16' ? 'bg-white border-emerald-600 text-emerald-800 shadow-2xs' : 'border-slate-200 text-slate-600'
                }`}
              >
                16 (4×4)
              </button>
            </div>
          </div>
        </div>

        {/* Printable Label Sheet Preview */}
        {currentProduct && currentBatch && (
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
            <div className={`grid gap-4 bg-white p-6 shadow-sm rounded-lg ${
              sheetLayout === 'single' ? 'grid-cols-1 max-w-sm mx-auto' :
              sheetLayout === 'sheet_8' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {stickerArray.map((_, i) => (
                <div 
                  key={i}
                  className="printable-sheet border-2 border-dashed border-slate-300 p-3 rounded-lg flex items-start gap-3 bg-white text-slate-900"
                >
                  {/* Dynamic QR Code */}
                  <div className="shrink-0 flex flex-col items-center">
                    {currentBatch.qrCodeDataUrl ? (
                      <img 
                        src={currentBatch.qrCodeDataUrl} 
                        alt="Dynamic Batch QR" 
                        className="w-20 h-20 border border-slate-300 rounded p-0.5" 
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                        Generating...
                      </div>
                    )}
                    <span className="text-[8px] font-mono font-bold mt-1 text-slate-500">
                      SCAN FOR POS
                    </span>
                  </div>

                  {/* Sticker Label Typography & Details */}
                  <div className="flex-1 min-w-0 space-y-0.5 text-[10px]">
                    <div className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                      {currentProduct.name}
                    </div>
                    
                    <div className="text-[9px] text-slate-600 font-semibold truncate">
                      {currentProduct.activeIngredient}
                    </div>

                    <div className="font-mono text-[9px] text-slate-500">
                      Mfg: {currentProduct.brand}
                    </div>

                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between font-mono">
                      <span>B: <strong className="text-slate-900">{currentBatch.batchNumber}</strong></span>
                      <span className="font-bold text-slate-900 text-xs">₹{currentBatch.retailPrice}</span>
                    </div>

                    <div className="font-mono text-[9px] flex items-center justify-between text-slate-600">
                      <span>Exp: {currentBatch.expiryDate}</span>
                      {tox && (
                        <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${tox.colorClass}`}>
                          {tox.short}
                        </span>
                      )}
                    </div>

                    <div className="text-[7.5px] text-slate-400 font-mono truncate pt-0.5">
                      Lic: {currentProduct.governmentLicenseNo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
