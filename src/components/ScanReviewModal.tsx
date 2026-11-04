import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Package, 
  Building2, 
  Layers, 
  Calendar, 
  Tag, 
  QrCode, 
  Barcode, 
  Link as LinkIcon, 
  Edit3, 
  PlusCircle, 
  AlertCircle,
  Flag,
  ShieldCheck,
  Info
} from 'lucide-react';
import { DetectedCodeInfo, ProductMatchResult, Product, Batch } from '../types';
import { store } from '../services/store';
import { reportScanIssue } from '../services/barcodeIntelligence';

interface ScanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedInfo: DetectedCodeInfo | null;
  matchResult: ProductMatchResult | null;
  onConfirmMatch: (product: Product, batch: Batch) => void;
  onOpenQuickAddWithCode: (details: {
    name?: string;
    company?: string;
    barcode?: string;
    qrCode?: string;
    batchNumber?: string;
    expiryDate?: string;
    price?: number;
  }) => void;
  onLinkToExisting: (code: string) => void;
}

export const ScanReviewModal: React.FC<ScanReviewModalProps> = ({
  isOpen,
  onClose,
  detectedInfo,
  matchResult,
  onConfirmMatch,
  onOpenQuickAddWithCode,
  onLinkToExisting,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedCompany, setEditedCompany] = useState('');
  const [editedBatch, setEditedBatch] = useState('');
  const [editedExpiry, setEditedExpiry] = useState('');
  const [editedBarcode, setEditedBarcode] = useState('');
  
  // Issue report form state
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [reportFeedback, setReportFeedback] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Sync state whenever detectedInfo changes
  React.useEffect(() => {
    if (detectedInfo) {
      setEditedName(detectedInfo.productName || '');
      setEditedCompany(detectedInfo.brandOrCompany || '');
      setEditedBatch(detectedInfo.batchNumber || '');
      setEditedExpiry(detectedInfo.expiryDate || '');
      setEditedBarcode(detectedInfo.barcodeNumber || detectedInfo.productIdOrGtin || '');
      setIsEditing(false);
      setIsReportingIssue(false);
      setReportSuccess(false);
    }
  }, [detectedInfo]);

  if (!isOpen || !detectedInfo) return null;

  // Check duplicate status
  const duplicateCheck = store.checkDuplicateCode(detectedInfo.rawCode);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFeedback.trim()) return;

    reportScanIssue({
      rawCode: detectedInfo.rawCode,
      manufacturerName: editedCompany || detectedInfo.brandOrCompany,
      productName: editedName || detectedInfo.productName,
      expectedBatch: editedBatch || detectedInfo.batchNumber,
      userFeedback: reportFeedback.trim(),
    });

    setReportSuccess(true);
    setTimeout(() => {
      setIsReportingIssue(false);
      setReportSuccess(false);
      setReportFeedback('');
    }, 1800);
  };

  const handleCreateWithDetected = () => {
    onOpenQuickAddWithCode({
      name: editedName || detectedInfo.productName,
      company: editedCompany || detectedInfo.brandOrCompany,
      barcode: detectedInfo.codeFormat === 'BARCODE_1D' ? (editedBarcode || detectedInfo.rawCode) : undefined,
      qrCode: detectedInfo.codeFormat !== 'BARCODE_1D' ? detectedInfo.rawCode : undefined,
      batchNumber: editedBatch || detectedInfo.batchNumber,
      expiryDate: editedExpiry || detectedInfo.expiryDate,
      price: detectedInfo.retailPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              {detectedInfo.codeFormat === 'BARCODE_1D' ? (
                <Barcode className="w-5 h-5 text-emerald-700" />
              ) : (
                <QrCode className="w-5 h-5 text-emerald-700" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Scanned Code Intelligence &amp; Review</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                  {detectedInfo.codeFormat}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Review detected information from pesticide bottle before taking action.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Raw Scanned Code Preview Bar */}
          <div className="p-3 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono break-all flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">
                Original Manufacturer Code
              </span>
              <span className="text-emerald-400 font-semibold">{detectedInfo.rawCode}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
              {detectedInfo.rawFormatDescription}
            </span>
          </div>

          {/* URL Safety Notice if scanned code is a link */}
          {detectedInfo.isUrl && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">External Manufacturer Link Detected</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  AgroPulse safely extracts parameter data without automatically navigating to unverified external websites.
                </div>
                <div className="text-[11px] font-mono text-amber-700 mt-1 truncate max-w-sm">
                  {detectedInfo.websiteUrl}
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Code Alert */}
          {duplicateCheck.isDuplicate && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Duplicate Code Registered</div>
                <div className="text-[11px] text-rose-800 mt-0.5">
                  This code is already linked in inventory to <strong>{duplicateCheck.matchedProductName}</strong>
                  {duplicateCheck.matchedBatchNo && ` (Batch ${duplicateCheck.matchedBatchNo})`}.
                </div>
              </div>
            </div>
          )}

          {/* Detection Transparency Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Detected in Code ({detectedInfo.detectedFields.length})</span>
              </div>
              {detectedInfo.detectedFields.length === 0 ? (
                <span className="text-slate-400 text-xs italic">No structured fields detected</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {detectedInfo.detectedFields.map((f, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Not Encoded in Code ({detectedInfo.unidentifiedFields.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {detectedInfo.unidentifiedFields.slice(0, 5).map((f, i) => (
                  <span key={i} className="text-[10px] font-medium bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded-md">
                    • {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scanned Details Card with Edit Mode */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Identified Information</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Done Editing' : 'Correct / Edit Fields'}</span>
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Product Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="e.g. Coragen 18.5% SC"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Company / Brand</label>
                    <input
                      type="text"
                      value={editedCompany}
                      onChange={(e) => setEditedCompany(e.target.value)}
                      placeholder="e.g. FMC, Bayer, Syngenta"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Batch Number</label>
                    <input
                      type="text"
                      value={editedBatch}
                      onChange={(e) => setEditedBatch(e.target.value)}
                      placeholder="e.g. BAY-CRG-9021"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expiry Date</label>
                    <input
                      type="date"
                      value={editedExpiry}
                      onChange={(e) => setEditedExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Barcode / GTIN</label>
                    <input
                      type="text"
                      value={editedBarcode}
                      onChange={(e) => setEditedBarcode(e.target.value)}
                      placeholder="e.g. 8901030825123"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Product Name</span>
                  <span className="font-bold text-slate-900">{editedName || '— (Not identified)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Company / Brand</span>
                  <span className="font-bold text-slate-900">{editedCompany || '— (Not identified)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900">{editedBatch || '— (Not identified)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Expiry Date</span>
                  <span className="font-mono font-bold text-slate-900">{editedExpiry || '— (Not identified)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Barcode / GTIN</span>
                  <span className="font-mono font-bold text-slate-900">{editedBarcode || '— (Not identified)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Active Chemical</span>
                  <span className="text-slate-800">{detectedInfo.activeIngredient || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Match State Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Store Inventory Match
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                matchResult?.status === 'EXACT_MATCH'
                  ? 'bg-emerald-100 text-emerald-800'
                  : matchResult?.status === 'MULTIPLE_MATCHES'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {matchResult?.status === 'EXACT_MATCH' 
                  ? 'Exact Match Found' 
                  : matchResult?.status === 'MULTIPLE_MATCHES' 
                  ? `${matchResult.matches.length} Matches Found` 
                  : 'Product Not Found'}
              </span>
            </div>

            {/* Case A: Exact Match */}
            {matchResult?.status === 'EXACT_MATCH' && matchResult.matches[0] && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {matchResult.matches[0].product.name} ({matchResult.matches[0].product.brand})
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Batch: <span className="font-mono font-semibold">{matchResult.matches[0].batch?.batchNumber || 'Default'}</span>
                    {' · '}
                    Stock: <span className="font-mono font-bold text-emerald-800">{matchResult.matches[0].batch?.currentQuantity || 0} units</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    ✓ {matchResult.matches[0].matchReason}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (matchResult.matches[0].batch) {
                      onConfirmMatch(matchResult.matches[0].product, matchResult.matches[0].batch);
                    }
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Confirm &amp; Use Item
                </button>
              </div>
            )}

            {/* Case B: Multiple Matches */}
            {matchResult?.status === 'MULTIPLE_MATCHES' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Multiple products or batches matched your scanned code. Select the correct one:
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {matchResult.matches.map((cand, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {cand.product.name} ({cand.product.brand})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Batch: {cand.batch?.batchNumber || 'N/A'} · Stock: {cand.batch?.currentQuantity || 0} units
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Match: {cand.matchReason} ({cand.matchScore}% confidence)
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (cand.batch) {
                            onConfirmMatch(cand.product, cand.batch);
                          }
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case C: Not Found */}
            {matchResult?.status === 'NOT_FOUND' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 space-y-2">
                <p>
                  No existing product or batch matches this code in your current store inventory.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onLinkToExisting(detectedInfo.rawCode);
                      onClose();
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Link to Existing Product</span>
                  </button>

                  <button
                    onClick={handleCreateWithDetected}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create New Product with this Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Report Incorrect Scan Section */}
          <div className="pt-1">
            {!isReportingIssue ? (
              <button
                type="button"
                onClick={() => setIsReportingIssue(true)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1.5"
              >
                <Flag className="w-3 h-3" />
                <span>Report an incorrect or unreadable scan to diagnostics</span>
              </button>
            ) : (
              <form onSubmit={handleReportSubmit} className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Report Incorrect Scan</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tell us what was incorrect (e.g. wrong batch, missing manufacturer, misidentified barcode):
                </p>
                <textarea
                  required
                  rows={2}
                  value={reportFeedback}
                  onChange={(e) => setReportFeedback(e.target.value)}
                  placeholder="e.g. Expected batch B-4401 on bottle, but scanner read B-440"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportingIssue(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>
                {reportSuccess && (
                  <div className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Report logged successfully for store administrator review.</span>
                  </div>
                )}
              </form>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold bg-white border border-slate-300 rounded-xl"
          >
            Close Review
          </button>
        </div>

      </div>
    </div>
  );
};
