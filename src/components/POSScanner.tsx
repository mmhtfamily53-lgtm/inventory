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
  Sparkles,
  RefreshCw,
  Percent
} from 'lucide-react';
import { Product, Batch, CartItem, PaymentMethod, Invoice, FarmerCustomer } from '../types';
import { store } from '../services/store';
import { parseScannedQRData, getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface POSScannerProps {
  onSaleComplete: (invoice: Invoice) => void;
  onOpenStickers: (product?: Product, batch?: Batch) => void;
}

export const POSScanner: React.FC<POSScannerProps> = ({
  onSaleComplete,
  onOpenStickers,
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

  // Manual / quick product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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
    // 1. Expiry Check
    const daysLeft = getDaysUntilExpiration(batch.expiryDate);
    if (daysLeft <= 0) {
      setScanFeedback({
        type: 'error',
        message: `BLOCKED: Batch ${batch.batchNumber} of ${product.name} expired on ${batch.expiryDate}. Illegal to sell.`,
      });
      return;
    }

    // 2. Stock Check
    const existingIndex = cart.findIndex(item => item.batch.id === batch.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (existingQty + 1 > batch.currentQuantity) {
      setScanFeedback({
        type: 'error',
        message: `Insufficient stock in Batch ${batch.batchNumber}. Available: ${batch.currentQuantity}`,
      });
      return;
    }

    // 3. Add or Increment
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

    if (daysLeft <= 60) {
      setScanFeedback({
        type: 'warning',
        message: `Added Batch ${batch.batchNumber}. Warning: Nearing expiry (${daysLeft} days remaining).`,
      });
    } else {
      setScanFeedback({
        type: 'success',
        message: `Scanned & added: ${product.name} (${batch.batchNumber})`,
      });
    }
  };

  // Process raw scanned text from Camera or Input
  const processScannedCode = (decodedText: string) => {
    try {
      const payload = parseScannedQRData(decodedText);
      if (!payload) {
        setScanFeedback({
          type: 'error',
          message: 'Invalid QR format. Expected AgroPulse dynamic batch payload.',
        });
        return;
      }

      const match = store.getBatchById(payload.bId);
      if (!match) {
        setScanFeedback({
          type: 'error',
          message: `Batch ID ${payload.bId} not found in store database.`,
        });
        return;
      }

      handleAddBatchToCart(match.product, match.batch);
    } catch (e: any) {
      setScanFeedback({
        type: 'error',
        message: e.message || 'Error processing scanned QR code.',
      });
    }
  };

  // Start / Stop Camera Scanner
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);

      // Wait a tick for div to mount
      setTimeout(async () => {
        try {
          const qrCodeScanner = new Html5Qrcode('qr-reader-viewport', {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
          html5QrCodeRef.current = qrCodeScanner;

          await qrCodeScanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Beep / audio feedback if supported
              processScannedCode(decodedText);
            },
            () => {
              // Frame parse ignore
            }
          );
        } catch (err: any) {
          console.error('Camera init error:', err);
          setCameraError(err?.message || 'Unable to access camera. Please check permissions or use manual batch select.');
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
        message: `Maximum stock reached: Only ${item.batch.currentQuantity} units in batch ${item.batch.batchNumber}.`,
      });
      return;
    }

    const updated = [...cart];
    updated[itemIndex].quantity = newQty;
    updated[itemIndex].total = newQty * updated[itemIndex].unitPrice;
    setCart(updated);
  };

  // Calculation totals
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const taxTotal = cart.reduce((acc, item) => {
    const tax = (item.unitPrice * item.quantity * item.gstRate) / (100 + item.gstRate);
    return acc + tax;
  }, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Finalize Sale
  const handleCheckout = () => {
    if (cart.length === 0) {
      setScanFeedback({ type: 'error', message: 'Cart is empty. Scan products to bill.' });
      return;
    }

    if (paymentMethod === 'KHATA_CREDIT' && !selectedFarmerId) {
      setScanFeedback({ 
        type: 'error', 
        message: 'Khata Credit Sale requires selecting a registered Farmer from the ledger.' 
      });
      return;
    }

    try {
      const result = store.processSale({
        items: cart,
        customerName: customerName || 'Walk-in Farmer',
        customerPhone: customerPhone || 'N/A',
        customerVillage: customerVillage || 'Local',
        farmerId: selectedFarmerId || undefined,
        paymentMethod,
        discount,
        notes,
      });

      // Clear cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerVillage('');
      setSelectedFarmerId('');
      setDiscount(0);
      setNotes('');
      if (isCameraActive) {
        stopCamera();
      }

      onSaleComplete(result.invoice);
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: err.message || 'Failed to complete transaction.',
      });
    }
  };

  // Filter products for quick add
  const filteredProducts = products.flatMap(p => 
    p.batches
      .filter(b => b.currentQuantity > 0)
      .filter(b => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(b => ({ product: p, batch: b }))
  );

  return (
    <div className="space-y-6">
      
      {/* Scanner & Feedback Notification Header */}
      {scanFeedback && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
          scanFeedback.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : scanFeedback.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {scanFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {scanFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {scanFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            <span>{scanFeedback.message}</span>
          </div>
          <button onClick={() => setScanFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Scanner / Product Picker, Right Cart & Invoice Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Scanner & Quick Item Picker (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Camera Scanner Module */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    WebRTC Dynamic QR Code Scanner
                  </h2>
                  <p className="text-xs text-slate-500">
                    Scan custom batch QR sticker labels for instant stock-out validation
                  </p>
                </div>
              </div>

              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Camera Viewport */}
            {isCameraActive && (
              <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-300 aspect-video flex flex-col items-center justify-center">
                <div id="qr-reader-viewport" className="w-full h-full max-h-[320px]" />
                <div className="absolute bottom-2 text-center text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full">
                  Align camera with batch QR sticker
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Camera Access Note:</span> {cameraError}
                  <div className="mt-1 text-slate-600">
                    You can still search or select products from the live catalog directly below!
                  </div>
                </div>
              </div>
            )}

            {/* Quick Add In-Stock Batches Bar */}
            {products.some(p => p.batches.length > 0) && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-slate-400" />
                    Quick Add In-Stock Batches:
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
                        className={`text-left p-2 rounded-lg border text-xs transition-all ${
                          isExp 
                            ? 'bg-rose-50/50 border-rose-200 opacity-60 cursor-not-allowed'
                            : 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200'
                        }`}
                      >
                        <div className="font-bold text-slate-900 leading-tight truncate max-w-[170px]">{p.name}</div>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Direct Inventory Catalog Lookup
              </h3>
              <span className="text-xs text-slate-500">
                {filteredProducts.length} batches available
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Chemical Active Ingredient (e.g. Fipronil), Product Name, or Batch Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {filteredProducts.map(({ product, batch }) => {
                const tox = getToxicityDisplay(product.toxicityClass);
                const daysLeft = getDaysUntilExpiration(batch.expiryDate);
                const isExp = daysLeft <= 0;

                return (
                  <div 
                    key={batch.id} 
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{product.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${tox.colorClass}`}>
                          {tox.short}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{product.activeIngredient}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Batch: {batch.batchNumber}</span>
                        <span>·</span>
                        <span>Stock: {batch.currentQuantity} {batch.unit}</span>
                        <span>·</span>
                        <span className={daysLeft <= 60 ? 'text-amber-700 font-bold' : ''}>
                          Exp: {batch.expiryDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-slate-900 text-sm">
                        ₹{batch.retailPrice}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddBatchToCart(product, batch)}
                        disabled={isExp || batch.currentQuantity <= 0}
                        className={`mt-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          isExp || batch.currentQuantity <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isExp ? 'Expired' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Billing Cart, Customer Ledger, Tax & Checkout (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Cart &amp; Billing Terminal
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {cart.length} line items
            </span>
          </div>

          {/* Customer Selection & Farmer Khata Link */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Customer / Farmer Account
              </label>
              {selectedFarmerId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFarmerId('');
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerVillage('');
                  }}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Clear link
                </button>
              )}
            </div>

            {/* Khata Farmer Dropdown */}
            <select
              value={selectedFarmerId}
              onChange={(e) => handleFarmerSelect(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-md py-1.5 px-2 font-medium focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">-- Select Registered Khata Farmer (or Walk-in) --</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.village}) - Due: ₹{f.outstandingDebt.toLocaleString()} / Limit: ₹{f.creditLimit.toLocaleString()}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Farmer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none text-xs"
              />
              <input
                type="text"
                placeholder="Phone (10 digits)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Cart Line Items */}
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No items scanned yet. Use the camera or tap a sample product to bill.
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.batch.id} 
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Batch: {item.batch.batchNumber} · GST: {item.gstRate}%
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                      ₹{item.unitPrice} × {item.quantity} = <span className="font-bold">₹{item.total.toLocaleString()}</span>
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
                      className="ml-1 p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-50 border-blue-500 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('KHATA_CREDIT')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'KHATA_CREDIT'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Khata (Credit)</span>
              </button>
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal (Inclusive of GST)</span>
              <span className="font-mono tabular-nums font-medium text-slate-700">₹{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <span>Total GST Component Included</span>
              </span>
              <span className="font-mono tabular-nums text-slate-700">₹{taxTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="text-xl font-mono tabular-nums text-emerald-800">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Finalize Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Generate Tax Invoice &amp; Deduct Stock</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Stock quantities will be deducted in real-time from the database.
          </p>

        </div>

      </div>

    </div>
  );
};
