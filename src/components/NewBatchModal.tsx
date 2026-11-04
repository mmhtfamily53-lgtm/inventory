import React, { useState } from 'react';
import { Product, Batch, ProductType, ToxicityClass } from '../types';
import { store } from '../services/store';
import { X, Plus, QrCode, CheckCircle2 } from 'lucide-react';

interface NewBatchModalProps {
  initialProductId?: string;
  onClose: () => void;
  onBatchCreated: (batch: Batch) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  initialProductId,
  onClose,
  onBatchCreated,
}) => {
  const products = store.getProducts();
  const suppliers = store.getSuppliers();

  const [mode, setMode] = useState<'NEW_BATCH' | 'NEW_PRODUCT'>(initialProductId ? 'NEW_BATCH' : 'NEW_BATCH');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || products[0]?.id || '');

  // New Product fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Bayer CropScience');
  const [type, setType] = useState<ProductType>('INSECTICIDE');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [toxicityClass, setToxicityClass] = useState<ToxicityClass>('YELLOW');
  const [governmentLicenseNo, setGovernmentLicenseNo] = useState('CIB-RC/2024/PEST-');
  const [minStockThreshold, setMinStockThreshold] = useState<number>(15);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState('38089190');
  const [description, setDescription] = useState('');

  // Batch fields
  const [batchNumber, setBatchNumber] = useState(`BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [manufacturingDate, setManufacturingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('2027-04-30');
  const [initialQuantity, setInitialQuantity] = useState<number>(50);
  const [unit, setUnit] = useState<Batch['unit']>('BOTTLE');
  const [costPrice, setCostPrice] = useState<number>(550);
  const [retailPrice, setRetailPrice] = useState<number>(750);
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || 'sup-001');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [germinationRate, setGerminationRate] = useState<number>(90);
  const [purityRate, setPurityRate] = useState<number>(98);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let targetProductId = selectedProductId;

      if (mode === 'NEW_PRODUCT') {
        const createdProd = await store.addProduct({
          name,
          brand,
          type,
          activeIngredient,
          toxicityClass,
          governmentLicenseNo,
          minStockThreshold,
          gstRate,
          hsnCode,
          description,
        });
        targetProductId = createdProd.id;
      }

      const newBatch = await store.addBatchToProduct(targetProductId, {
        batchNumber,
        manufacturingDate,
        expiryDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        unit,
        costPrice,
        retailPrice,
        supplierId,
        supplierInvoiceNo,
        seedGerminationRate: type === 'HYBRID_SEED' ? germinationRate : undefined,
        seedPurityRate: type === 'HYBRID_SEED' ? purityRate : undefined,
      });

      onBatchCreated(newBatch);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Register Inbound Batch &amp; Generate Dynamic QR Code
            </h2>
            <p className="text-xs text-slate-500">
              Encodes active chemical ingredient, batch number, license, and toxicity category.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMode('NEW_BATCH')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
              mode === 'NEW_BATCH' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Add Batch to Existing Product
          </button>
          <button
            type="button"
            onClick={() => setMode('NEW_PRODUCT')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-all ${
              mode === 'NEW_PRODUCT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Register Brand New Product &amp; Batch
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {mode === 'NEW_BATCH' ? (
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Select Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand}) - Active: {p.activeIngredient}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs">1. Product Specifications</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Product Commercial Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coragen 18.5% SC"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Manufacturer / Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FMC India"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Chemical Active Ingredient *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chlorantraniliprole 18.5% w/w"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Category *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProductType)}
                    className="w-full px-2 py-1.5 border rounded"
                  >
                    <option value="INSECTICIDE">Insecticide</option>
                    <option value="HERBICIDE">Herbicide</option>
                    <option value="FUNGICIDE">Fungicide</option>
                    <option value="HYBRID_SEED">Hybrid Seed</option>
                    <option value="BIO_STIMULANT">Bio-stimulant</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Toxicity Triangle *</label>
                  <select
                    value={toxicityClass}
                    onChange={(e) => setToxicityClass(e.target.value as ToxicityClass)}
                    className="w-full px-2 py-1.5 border rounded font-semibold"
                  >
                    <option value="RED">Red (Extremely Toxic)</option>
                    <option value="YELLOW">Yellow (Highly Toxic)</option>
                    <option value="BLUE">Blue (Moderately Toxic)</option>
                    <option value="GREEN">Green (Slightly Toxic)</option>
                    <option value="NONE">None / Certified Seed</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded"
                  >
                    <option value={0}>0% (Seeds)</option>
                    <option value={5}>5% (Bio)</option>
                    <option value={12}>12% (Nutrients)</option>
                    <option value={18}>18% (Agrochemicals)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Govt License / CIB Registration</label>
                  <input
                    type="text"
                    value={governmentLicenseNo}
                    onChange={(e) => setGovernmentLicenseNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Batch Specifics */}
          <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block text-xs">2. Inbound Consignment Batch &amp; QR Data</span>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-600 block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Mfg Date *</label>
                <input
                  type="date"
                  required
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded font-mono"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-slate-600 block mb-1">Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border rounded font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full px-2 py-1.5 border rounded font-mono"
                >
                  <option value="BOTTLE">Bottle</option>
                  <option value="PACKET">Packet</option>
                  <option value="BAG">Bag</option>
                  <option value="KG">Kg</option>
                  <option value="LITRE">Litre</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border rounded font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Retail MRP (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border rounded font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-600 block mb-1">Wholesale Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Supplier Inward Invoice No</label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>{isSubmitting ? 'Generating Dynamic QR...' : 'Save & Generate QR Label'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
