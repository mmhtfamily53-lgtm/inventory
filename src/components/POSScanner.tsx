import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  User, 
  Search, 
  X, 
  AlertTriangle, 
  QrCode, 
  Percent,
  Link,
  PlusCircle,
  Package
} from 'lucide-react';
import { Product, Batch, CartItem, PaymentMethod, Invoice, FarmerCustomer } from '../types';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface POSScannerProps {
  onSaleComplete: (invoice: Invoice) => void;
  onOpenStickers: (product?: Product, batch?: Batch) => void;
  onOpenQuickAddWithBarcode?: (barcode: string) => void;
}

export const POSScanner: React.FC<POSScannerProps> = ({
  onSaleComplete,
  onOpenStickers,
  onOpenQuickAddWithBarcode,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual Barcode Input state
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');

  // Unlinked barcode scanned state
  const [unlinkedScan, setUnlinkedScan] = useState<{
    code: string;
    isOpen: boolean;
    selectedProductId: string;
  } | null>(null);

  // Manual / quick product search state
  const [searchQuery, setSearchQuery] = useState('');

  const products = store.getProducts();
  const farmers = store.getFarmers();

  // Clear scanner feedback after 4 seconds
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => setScanFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  // When a farmer is selected from Khata dropdown, autofill contact info
  const handleFarmerSelect = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    if (!farmerId) return;
    const f = farmers.find(item => item.id === farmerId);
    if (f) {
      setCustomerName(f.name);
      setCustomerPhone(f.phone);
      setCustomerVillage(f.village);
    }
  };

  // Add a validated batch to cart
  const handleAddBatchToCart = (product: Product, batch: Batch) => {
    // 1. Stock Check
    const existingIndex = cart.findIndex(item => item.batch.id === batch.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (existingQty + 1 > batch.currentQuantity) {
      setScanFeedback({
        type: 'error',
        message: `Insufficient stock for ${product.name}. Available: ${batch.currentQuantity} units`,
      });
      return;
    }

    // 2. Add or Increment
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        product,
        batch,
        quantity: 1,
        unitPrice: batch.retailPrice,
        gstRate: product.gstRate,
        taxAmount: (batch.retailPrice * product.gstRate) / (100 + product.gstRate),
        total: batch.retailPrice,
      };
      setCart([...cart, newItem]);
    }

    setScanFeedback({
      type: 'success',
      message: `Added to Cart: ${product.name} (${product.brand}) — Stock: ${batch.currentQuantity} units remaining.`,
    });
  };

  // Process raw scanned text from Camera or Manual Input
  const processScannedCode = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    try {
      // 1. Look up using the universal barcode/QR matcher
      const match = store.findProductOrBatchByCode(cleanCode);

      if (match) {
        handleAddBatchToCart(match.product, match.batch);
        return;
      }

      // 2. If not matched, open the Link or Quick Add modal
      setUnlinkedScan({
        code: cleanCode,
        isOpen: true,
        selectedProductId: products[0]?.id || '',
      });

      setScanFeedback({
        type: 'warning',
        message: `Scanned code "${cleanCode}" is not yet linked to any product. Link it below or add a new product.`,
      });

    } catch (e: any) {
      setScanFeedback({
        type: 'error',
        message: e.message || 'Error processing barcode/QR code.',
      });
    }
  };

  // Handle Manual Barcode / QR Submit
  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcodeInput.trim()) return;
    processScannedCode(manualBarcodeInput);
    setManualBarcodeInput('');
  };

  // Link Unrecognized Barcode to an Existing Product
  const handleConfirmLinkProduct = () => {
    if (!unlinkedScan || !unlinkedScan.selectedProductId) return;

    const success = store.linkBarcodeToProduct(unlinkedScan.selectedProductId, unlinkedScan.code);
    if (success) {
      const prod = store.getProductById(unlinkedScan.selectedProductId);
      if (prod && prod.batches.length > 0) {
        handleAddBatchToCart(prod, prod.batches[0]);
        setScanFeedback({
          type: 'success',
          message: `Linked barcode "${unlinkedScan.code}" to ${prod.name}! Added to cart.`,
        });
      }
    }
    setUnlinkedScan(null);
  };

  // Start / Stop Camera Scanner (Supporting ALL 1D barcodes and 2D QR codes)
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);

      setTimeout(async () => {
        try {
          const qrCodeScanner = new Html5Qrcode('qr-reader-viewport', {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
              Html5QrcodeSupportedFormats.ITF,
            ],
            verbose: false,
          });
          html5QrCodeRef.current = qrCodeScanner;

          await qrCodeScanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              processScannedCode(decodedText);
            },
            () => {
              // Frame parse ignore
            }
          );
        } catch (err: any) {
          console.error('Camera init error:', err);
          setCameraError(err?.message || 'Unable to access camera. Check device camera permissions.');
          setIsCameraActive(false);
        }
      }, 100);
    } catch (err: any) {
      setCameraError(err.message || 'Camera start failed');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  // Update item quantity
  const updateQuantity = (batchId: string, delta: number) => {
    const itemIndex = cart.findIndex(i => i.batch.id === batchId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter(i => i.batch.id !== batchId));
      return;
    }

    if (newQty > item.batch.currentQuantity) {
      setScanFeedback({
        type: 'error',
        message: `Maximum stock reached: Only ${item.batch.currentQuantity} units available for ${item.product.name}.`,
      });
      return;
    }

    const updated = [...cart];
    updated[itemIndex].quantity = newQty;
    updated[itemIndex].total = newQty * updated[itemIndex].unitPrice;
    setCart(updated);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const taxTotal = cart.reduce((acc, item) => {
    const tax = (item.unitPrice * item.quantity * item.gstRate) / (100 + item.gstRate);
    return acc + tax;
  }, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Filter products for direct catalog search
  const filteredProducts = products.flatMap(p => 
    p.batches.map(b => ({ product: p, batch: b }))
  ).filter(({ product, batch }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.activeIngredient.toLowerCase().includes(q) ||
      batch.batchNumber.toLowerCase().includes(q) ||
      (product.customBarcode && product.customBarcode.toLowerCase().includes(q)) ||
      (batch.customBarcode && batch.customBarcode.toLowerCase().includes(q))
    );
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      setScanFeedback({ type: 'error', message: 'Cart is empty. Scan or select products first.' });
      return;
    }

    if (paymentMethod === 'KHATA_CREDIT' && !selectedFarmerId && !customerName) {
      setScanFeedback({ type: 'error', message: 'Farmer account or name is required for Credit / Khata sale.' });
      return;
    }

    try {
      const { invoice } = store.processSale({
        items: cart,
        customerName: customerName || 'Walk-in Farmer',
        customerPhone: customerPhone || '9999999999',
        customerVillage: customerVillage || 'Local',
        farmerId: selectedFarmerId || undefined,
        paymentMethod,
        discount,
        notes,
      });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerVillage('');
      setSelectedFarmerId('');
      setDiscount(0);
      setNotes('');
      setScanFeedback({
        type: 'success',
        message: `Invoice #${invoice.invoiceNumber} generated! Total: ₹${invoice.grandTotal.toLocaleString()}`,
      });

      onSaleComplete(invoice);
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: err.message || 'Transaction failed. Stock check violation.',
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback Toast */}
      {scanFeedback && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in slide-in-from-top-2 duration-150 ${
          scanFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : scanFeedback.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {scanFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {scanFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {scanFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{scanFeedback.message}</span>
          </div>
          <button onClick={() => setScanFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Scanner & Search, Right Cart & Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Camera Scanner, Manual Barcode Field & Catalog */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Universal Barcode / QR Code Scanner Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Product Barcode &amp; QR Scanner
                  </h2>
                  <p className="text-xs text-slate-500">
                    Scans any existing manufacturer barcode, QR code, or custom store label
                  </p>
                </div>
              </div>

              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scanner</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start sm:self-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Fast Manual Barcode / USB Gun Input Field */}
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Scan with barcode gun or type product Barcode / QR Code..."
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add / Scan</span>
              </button>
            </form>

            {/* Camera Viewport */}
            {isCameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex flex-col items-center justify-center">
                <div id="qr-reader-viewport" className="w-full h-full max-h-[300px]" />
                <div className="absolute bottom-2 text-center text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full">
                  Align camera with any product barcode or QR code
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Camera Access Note:</span> {cameraError}
                  <div className="mt-0.5 text-slate-600">
                    You can still type/scan barcodes above or select from the live catalog below.
                  </div>
                </div>
              </div>
            )}

            {/* Quick Add In-Stock Batches Bar */}
            {products.some(p => p.batches.length > 0) && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold flex items-center gap-1 text-slate-700">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    Frequent In-Stock Items (Click to Add):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {products.flatMap(p => p.batches.slice(0, 1).map(b => ({ p, b }))).map(({ p, b }) => {
                    const days = getDaysUntilExpiration(b.expiryDate);
                    const isExp = days <= 0;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleAddBatchToCart(p, b)}
                        disabled={isExp || b.currentQuantity <= 0}
                        className={`text-left p-2 rounded-xl border text-xs transition-all ${
                          isExp 
                            ? 'bg-rose-50/50 border-rose-200 opacity-60 cursor-not-allowed'
                            : 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200'
                        }`}
                      >
                        <div className="font-bold text-slate-900 leading-tight truncate max-w-[190px]">
                          {p.name} ({p.brand}) — Stock: {b.currentQuantity} units
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span>{b.batchNumber}</span>
                          <span>·</span>
                          <span className="font-bold text-slate-900">₹{b.retailPrice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Search & Manual Product Lookup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Direct Inventory Catalog Lookup
              </h3>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {filteredProducts.length} items available
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Product Name, Company (e.g. Bayer), Active Chemical, or Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No products matched your search.
                </div>
              ) : (
                filteredProducts.map(({ product, batch }) => {
                  const tox = getToxicityDisplay(product.toxicityClass);
                  const daysLeft = getDaysUntilExpiration(batch.expiryDate);
                  const isExp = daysLeft <= 0;

                  return (
                    <div 
                      key={batch.id} 
                      className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900">
                            {product.name} ({product.brand}) — <span className="text-emerald-700 font-mono">Stock: {batch.currentQuantity} units</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${tox.colorClass}`}>
                            {tox.short}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{product.activeIngredient}</div>
                        {product.customBarcode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Barcode: {product.customBarcode}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          ₹{batch.retailPrice}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddBatchToCart(product, batch)}
                          disabled={batch.currentQuantity <= 0}
                          className={`mt-1 px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            batch.currentQuantity <= 0
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {batch.currentQuantity <= 0 ? 'Out of Stock' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Billing Cart, Farmer Details & Ledger Settlement */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs sticky top-20">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Counter Bill Terminal
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
            </span>
          </div>

          {/* Customer / Farmer Khata Selector */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Customer / Farmer Account
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </div>

            <select
              value={selectedFarmerId}
              onChange={(e) => handleFarmerSelect(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900"
            >
              <option value="">Walk-in Farmer (Immediate Cash/UPI)</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.village}) — Due: ₹{f.outstandingDebt}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                placeholder="Farmer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
              />
              <input
                type="text"
                placeholder="Phone (10 digits)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Cart Line Items */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No items scanned yet. Scan any barcode/QR or select from catalog.
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.batch.id} 
                  className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">
                      {item.product.name} ({item.product.brand}) — <span className="text-emerald-700 font-mono">Stock: {item.batch.currentQuantity} units</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Batch: {item.batch.batchNumber} · GST: {item.gstRate}%
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                      ₹{item.unitPrice} × {item.quantity} = <span className="font-bold text-slate-900">₹{item.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.batch.id, -1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono tabular-nums text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.batch.id, 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.batch.id, -9999)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Payment Settlement Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 mb-0.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-0.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('KHATA_CREDIT')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'KHATA_CREDIT'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-0.5" />
                <span>Khata Credit</span>
              </button>
            </div>
          </div>

          {/* Bill Calculation Summary */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Subtotal:</span>
              <span>₹{(subtotal - taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST Tax Amount:</span>
              <span>₹{taxTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200 font-sans">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-800 text-base">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate Tax Invoice &amp; Deduct Stock</span>
          </button>

        </div>

      </div>

      {/* UNLINKED BARCODE SCANNED MODAL */}
      {unlinkedScan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Unrecognized Barcode / QR Code
                </h3>
              </div>
              <button onClick={() => setUnlinkedScan(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-900">Scanned Code:</span>
              <div className="font-mono text-xs font-extrabold text-slate-900 bg-white p-2 rounded-lg border border-amber-200 break-all">
                {unlinkedScan.code}
              </div>
              <p className="text-[11px] text-amber-800 pt-1">
                This barcode is not linked to any product in your store yet. Choose an action:
              </p>
            </div>

            {/* Option A: Link to Existing Product */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Option 1: Link to an Existing Product
              </label>
              <select
                value={unlinkedScan.selectedProductId}
                onChange={(e) => setUnlinkedScan({ ...unlinkedScan, selectedProductId: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
              >
                {products.map(p => {
                  const st = p.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand}) — Stock: {st} units
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleConfirmLinkProduct}
                disabled={!unlinkedScan.selectedProductId}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Link className="w-4 h-4" />
                <span>Link Barcode &amp; Add to Cart</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">OR</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            {/* Option B: Create New Product for this Barcode */}
            <div>
              <button
                type="button"
                onClick={() => {
                  const code = unlinkedScan.code;
                  setUnlinkedScan(null);
                  if (onOpenQuickAddWithBarcode) {
                    onOpenQuickAddWithBarcode(code);
                  }
                }}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create New Product with this Barcode</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
