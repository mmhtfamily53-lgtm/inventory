import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  QrCode, 
  Barcode, 
  CheckCircle2, 
  Package, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle, 
  Info, 
  PenTool, 
  ShieldCheck, 
  RotateCw, 
  Edit3, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  FileSearch,
  Layers
} from 'lucide-react';
import { store } from '../services/store';
import { Product, ProductType, Batch, DetectedCodeInfo } from '../types';
import { analyzeScannedCode } from '../services/barcodeIntelligence';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: Product, batch: Batch) => void;
  initialBarcode?: string;
  initialQrCode?: string;
  initialMode?: 'ADD_PRODUCT' | 'ADJUST_STOCK';
  initialProductId?: string;
}

export const QuickProductModal: React.FC<QuickProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  initialBarcode = '',
  initialQrCode = '',
  initialMode = 'ADD_PRODUCT',
  initialProductId = '',
}) => {
  const products = store.getProducts();

  const [activeTab, setActiveTab] = useState<'ADD_PRODUCT' | 'ADJUST_STOCK'>(initialMode);

  // Hidden file inputs for Camera photo vs Gallery upload
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Photo Analysis State
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [detectedReviewData, setDetectedReviewData] = useState<DetectedCodeInfo | null>(null);

  // Live Video Scanner State
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Form Fields (Mandatory: Name, Company, Retail Price, Quantity)
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [retailPrice, setRetailPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('10');
  const [batchNumber, setBatchNumber] = useState('');
  const [originalBarcode, setOriginalBarcode] = useState(initialBarcode);
  const [originalQrCode, setOriginalQrCode] = useState(initialQrCode);

  // Optional Advanced Details (No synthetic assumptions!)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [costPrice, setCostPrice] = useState<string>('');
  const [type, setType] = useState<ProductType>('INSECTICIDE');
  const [minStockThreshold, setMinStockThreshold] = useState<string>('5');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [activeIngredient, setActiveIngredient] = useState<string>('');

  // Quick Stock Adjust Form
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );
  const [stockDelta, setStockDelta] = useState<number>(5);
  const [adjustAction, setAdjustAction] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Consignment');

  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup live scanner on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const stopLiveCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner cleanup warning:', err);
      }
      scannerRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  // Start live video camera
  const startLiveCamera = async () => {
    await stopLiveCamera();
    setCameraError(null);
    setPhotoError(null);
    setIsLiveCameraActive(true);

    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode('live-video-qr-viewport', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });
        scannerRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: facingMode },
          {
            fps: 15,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleDecodedCode(decodedText, 'LIVE_CAMERA');
          },
          () => {}
        );
      } catch (err: any) {
        console.error('Camera start failed:', err);
        setCameraError(err.message || 'Camera permission denied or camera not available.');
        setIsLiveCameraActive(false);
      }
    }, 150);
  };

  // Analyze Photo from Camera or Gallery Upload
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingPhoto(true);
    setPhotoError(null);
    setScanFeedback(null);
    setCameraError(null);

    try {
      const html5Qr = new Html5Qrcode('qr-photo-analyzer-temp', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      });

      const decodedText = await html5Qr.scanFile(file, false);
      await html5Qr.clear();

      handleDecodedCode(decodedText, 'PHOTO_UPLOAD');
    } catch (err: any) {
      console.warn('QR scan error on photo:', err);
      setPhotoError(
        'No readable QR code or barcode was detected in this photo. Please make sure the code on the pesticide bottle is clear, in-focus, and well-lit. You can try another photo or enter details manually.'
      );
    } finally {
      setIsAnalyzingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Unified Handler for detected code (either live scan or photo upload)
  const handleDecodedCode = async (decodedText: string, source: 'LIVE_CAMERA' | 'PHOTO_UPLOAD') => {
    if (source === 'LIVE_CAMERA') {
      await stopLiveCamera();
    }

    const clean = decodedText.trim();
    const analysis = analyzeScannedCode(clean);

    // Populate QR or barcode
    if (analysis.codeFormat === 'BARCODE_1D') {
      setOriginalBarcode(clean);
    } else {
      setOriginalQrCode(clean);
    }

    // Auto-fill available details without overwriting user-typed values
    if (analysis.productName && !name) {
      setName(analysis.productName);
    }
    if (analysis.brandOrCompany && !company) {
      setCompany(analysis.brandOrCompany);
    }
    if (analysis.batchNumber && !batchNumber) {
      setBatchNumber(analysis.batchNumber);
    }
    if (analysis.expiryDate && !expiryDate) {
      setExpiryDate(analysis.expiryDate);
    }
    if (analysis.retailPrice && !retailPrice) {
      setRetailPrice(analysis.retailPrice.toString());
    }
    if (analysis.activeIngredient && !activeIngredient) {
      setActiveIngredient(analysis.activeIngredient);
    }

    // Check duplicate code
    const dup = store.checkDuplicateCode(clean);
    if (dup.isDuplicate) {
      setDuplicateWarning(`Note: This code is already registered in store for ${dup.matchedProductName}.`);
    } else {
      setDuplicateWarning(null);
    }

    setDetectedReviewData(analysis);
    setScanFeedback(
      `QR Code successfully detected from ${source === 'PHOTO_UPLOAD' ? 'bottle photograph' : 'camera scan'}! Extracted: ${analysis.detectedFields.join(', ') || 'Code Value'}. Review details below.`
    );
  };

  const handleBarcodeChange = (val: string) => {
    setOriginalBarcode(val);
    if (val.trim()) {
      const dup = store.checkDuplicateCode(val.trim());
      setDuplicateWarning(dup.isDuplicate ? `Code already registered to ${dup.matchedProductName}` : null);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleQrChange = (val: string) => {
    setOriginalQrCode(val);
    if (val.trim()) {
      const dup = store.checkDuplicateCode(val.trim());
      setDuplicateWarning(dup.isDuplicate ? `QR already registered to ${dup.matchedProductName}` : null);
    } else {
      setDuplicateWarning(null);
    }
  };

  if (!isOpen) return null;

  // Selected product for stock adjust
  const currentProduct = products.find(p => p.id === selectedProductId);
  const currentStock = currentProduct 
    ? currentProduct.batches.reduce((sum, b) => sum + b.currentQuantity, 0) 
    : 0;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate 4 mandatory fields
    if (!name.trim()) {
      setError('Please enter the Product Name.');
      return;
    }
    if (!company.trim()) {
      setError('Please enter the Company / Brand Name.');
      return;
    }
    if (!retailPrice || Number(retailPrice) <= 0) {
      setError('Please enter a valid Selling Price / MRP.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter the initial Quantity in numbers.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await store.quickAddProduct({
        name: name.trim(),
        company: company.trim(),
        retailPrice: Number(retailPrice),
        quantity: Number(quantity),
        originalBarcode: originalBarcode.trim() || undefined,
        originalQrCode: originalQrCode.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        type: type,
        minStockThreshold: minStockThreshold ? Number(minStockThreshold) : 5,
        expiryDate: expiryDate.trim() || undefined,
        activeIngredient: activeIngredient.trim() || undefined,
      });

      setSuccessMsg(`Added ${result.product.name} (${result.product.brand}) — Stock: ${result.batch.currentQuantity} units!`);
      
      if (onProductCreated) {
        onProductCreated(result.product, result.batch);
      }

      setTimeout(() => {
        setName('');
        setCompany('');
        setRetailPrice('');
        setQuantity('10');
        setBatchNumber('');
        setOriginalBarcode('');
        setOriginalQrCode('');
        setCostPrice('');
        setExpiryDate('');
        setActiveIngredient('');
        setDetectedReviewData(null);
        setSuccessMsg(null);
        onClose();
      }, 1200);

    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (!stockDelta || stockDelta <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    const delta = adjustAction === 'ADD' ? stockDelta : -stockDelta;

    try {
      const res = store.quickAdjustStock(selectedProductId, undefined, delta, adjustReason);
      setSuccessMsg(`Updated ${res.productName}! New total stock: ${res.newQuantity} units.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update stock.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Hidden container for file scanner analyzer */}
      <div id="qr-photo-analyzer-temp" className="hidden" />

      {/* Hidden File Inputs */}
      {/* 1. Phone Camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      {/* 2. Gallery / Desktop File upload */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />

      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Easy Product &amp; Stock Manager</span>
            </h2>
            <p className="text-xs text-slate-500">
              Add products in seconds. QR/Barcode scanning or photo upload is completely optional.
            </p>
          </div>
          <button 
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              setActiveTab('ADD_PRODUCT');
            }}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ADD_PRODUCT' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              setActiveTab('ADJUST_STOCK');
            }}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ADJUST_STOCK' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>+/- Quick Stock Adjust</span>
          </button>
        </div>

        {/* Alerts & Feedback */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {photoError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Photo Scanning Notice</span>
            </div>
            <p className="text-[11px] text-amber-800">{photoError}</p>
            <button
              type="button"
              onClick={() => setPhotoError(null)}
              className="text-[11px] font-bold text-emerald-800 underline block pt-0.5"
            >
              Dismiss / Continue entering manually
            </button>
          </div>
        )}

        {duplicateWarning && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {scanFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{scanFeedback}</span>
            </div>
            <button
              onClick={() => setScanFeedback(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: Add Product Form */}
        {activeTab === 'ADD_PRODUCT' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* REQUIREMENT: "Scan QR Code / Upload QR Photo" Button & Action Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Scan QR Code / Upload QR Photo</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full uppercase">
                  Optional
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Take a photo of the QR code printed on the pesticide bottle, upload from gallery, or skip to enter manually.
              </p>

              {/* Photo Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs font-bold">
                
                {/* 1. Take Photo with Phone Camera */}
                <button
                  type="button"
                  disabled={isAnalyzingPhoto}
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center text-center gap-1 transition-all shadow-2xs hover:scale-[1.02]"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span className="text-[11px] leading-tight">Take QR Photo</span>
                </button>

                {/* 2. Upload QR Photo from Gallery */}
                <button
                  type="button"
                  disabled={isAnalyzingPhoto}
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center text-center gap-1 transition-all shadow-2xs hover:scale-[1.02]"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-[11px] leading-tight">Upload from Gallery</span>
                </button>

                {/* 3. Live Video Viewfinder */}
                <button
                  type="button"
                  disabled={isAnalyzingPhoto}
                  onClick={() => {
                    if (isLiveCameraActive) {
                      stopLiveCamera();
                    } else {
                      startLiveCamera();
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all shadow-2xs col-span-2 sm:col-span-1 ${
                    isLiveCameraActive
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <RotateCw className={`w-4 h-4 ${isLiveCameraActive ? 'text-rose-600 animate-spin' : 'text-slate-600'}`} />
                  <span className="text-[11px] leading-tight">
                    {isLiveCameraActive ? 'Stop Live Scan' : 'Live Camera Scan'}
                  </span>
                </button>
              </div>

              {/* Photo Analysis Loading State */}
              {isAnalyzingPhoto && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Analyzing bottle photo and detecting QR code...</span>
                </div>
              )}
            </div>

            {/* Live Camera Viewfinder if active */}
            {isLiveCameraActive && (
              <div className="p-3 bg-slate-900 rounded-2xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-white text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Point at original QR code printed on bottle</span>
                  </span>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[220px]">
                  <div id="live-video-qr-viewport" className="w-full h-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = facingMode === 'environment' ? 'user' : 'environment';
                      setFacingMode(next);
                      startLiveCamera();
                    }}
                    className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Flip Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Close Live Camera
                  </button>
                </div>
              </div>
            )}

            {/* Camera Access Error Message */}
            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Camera Notice</span>
                </div>
                <p className="text-[11px]">{cameraError}</p>
              </div>
            )}

            {/* Detected Information Review Card */}
            {detectedReviewData && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Detected from Bottle QR Code</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {detectedReviewData.codeFormat}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {detectedReviewData.detectedFields.map((f, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      ✓ {f}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-emerald-200 font-mono break-all">
                  <span className="text-[10px] text-slate-400 block font-bold">Raw Scanned String</span>
                  {detectedReviewData.rawCode}
                </div>

                <p className="text-[10px] text-slate-500">
                  Review and edit the fields below as needed before saving.
                </p>
              </div>
            )}

            {/* Main Product Entry Form */}
            <form onSubmit={handleQuickAdd} className="space-y-4">
              
              {/* Field 1: Product Name (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coragen 18.5% SC, Amistar Top, Saaf Fungicide"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field 2: Company / Brand Name (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Company / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FMC, Bayer, Syngenta, UPL, Tata Rallis"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field 3 & 4: Prices & Quantity in Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Selling Price (MRP ₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="450"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Quantity in Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Count in numbers (bottles/packets)
                  </span>
                </div>
              </div>

              {/* Manual Batch Number (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Batch Number
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Optional
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. BAY-CRG-9021 or leave blank"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Optional Barcode & QR Code Fields */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manufacturer Barcode &amp; QR String</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full uppercase">
                    Optional
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      1D Barcode Number (EAN / UPC)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8901030825123"
                      value={originalBarcode}
                      onChange={(e) => handleBarcodeChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Original 2D QR Code String
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://verify... or raw QR text"
                      value={originalQrCode}
                      onChange={(e) => handleQrChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Products can be saved without scanning or with any barcode/QR. Never replaces original bottle codes.
                </p>
              </div>

              {/* Collapsible: More Details (Optional) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 transition-colors"
                >
                  <span>More Details (Category, Wholesale Cost, Active Formulation) — Optional</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Wholesale Buying Cost (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Optional cost"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Low Stock Alert Threshold
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="5"
                          value={minStockThreshold}
                          onChange={(e) => setMinStockThreshold(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Category
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as ProductType)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="INSECTICIDE">Insecticide</option>
                          <option value="HERBICIDE">Herbicide</option>
                          <option value="FUNGICIDE">Fungicide</option>
                          <option value="HYBRID_SEED">Hybrid Seed</option>
                          <option value="FERTILIZER">Fertilizer</option>
                          <option value="BIO_STIMULANT">Bio-stimulant</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Active Chemical Formulation
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chlorantraniliprole 18.5% SC"
                          value={activeIngredient}
                          onChange={(e) => setActiveIngredient(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    onClose();
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !name || !company || !retailPrice || !quantity}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Product...' : 'Save & Add to Stock'}</span>
                </button>
              </div>

            </form>

          </div>
        )}

        {/* TAB 2: Easy Stock Adjuster (+ / -) */}
        {activeTab === 'ADJUST_STOCK' && (
          <form onSubmit={handleStockAdjust} className="p-6 space-y-4">
            
            {/* Product Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Select Product to Adjust
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {products.length === 0 ? (
                  <option value="">No products in store yet</option>
                ) : (
                  products.map(p => {
                    const st = p.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand}) — Stock: {st} units
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Current Stock Display */}
            {currentProduct && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {currentProduct.name} <span className="font-normal text-slate-500">by {currentProduct.brand}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Threshold: {currentProduct.minStockThreshold} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Current Stock</div>
                  <div className="text-base font-extrabold font-mono text-emerald-800 tabular-nums">
                    {currentStock} units
                  </div>
                </div>
              </div>
            )}

            {/* Action Toggle: Add vs Subtract */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Adjustment Action
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustAction('ADD')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    adjustAction === 'ADD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Units to Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustAction('SUBTRACT')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    adjustAction === 'SUBTRACT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>- Subtract / Deduct Units</span>
                </button>
              </div>
            </div>

            {/* Quick Quantity Buttons & Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Number of Units to {adjustAction === 'ADD' ? 'Add' : 'Deduct'}
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[1, 5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStockDelta(num)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border font-mono transition-colors ${
                      stockDelta === num 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {adjustAction === 'ADD' ? `+${num}` : `-${num}`}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                required
                value={stockDelta}
                onChange={(e) => setStockDelta(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Note (Optional)
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Restock / New Consignment">Restock / New Consignment</option>
                <option value="Damaged / Leaked Bottle">Damaged / Leaked Bottle</option>
                <option value="Supplier Return">Supplier Return</option>
                <option value="Manual Counter Sale">Manual Counter Sale</option>
                <option value="Audit Stock Correction">Audit Stock Correction</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedProductId || stockDelta <= 0}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  adjustAction === 'ADD'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/20'
                }`}
              >
                {adjustAction === 'ADD' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                <span>
                  {adjustAction === 'ADD' ? `Add +${stockDelta} Units` : `Deduct -${stockDelta} Units`}
                </span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
