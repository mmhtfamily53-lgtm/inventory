import React, { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Barcode, 
  QrCode, 
  Search, 
  ExternalLink, 
  Flag, 
  History, 
  Layers, 
  Sparkles,
  Info,
  Package,
  RotateCw,
  Sliders,
  Check,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  SCANNER_TEST_CASES, 
  ScannerTestCase, 
  analyzeScannedCode, 
  matchDetectedCodeWithInventory, 
  getScanHistory, 
  getReportedScanIssues, 
  reportScanIssue 
} from '../services/barcodeIntelligence';
import { store } from '../services/store';
import { DetectedCodeInfo, ProductMatchResult } from '../types';

interface ScannerTestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForSale?: (product: any, batch: any) => void;
}

export const ScannerTestModeModal: React.FC<ScannerTestModeModalProps> = ({
  isOpen,
  onClose,
  onSelectProductForSale,
}) => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM_TEST' | 'HISTORY'>('PRESETS');
  
  // Selected Test Case
  const [selectedTestCase, setSelectedTestCase] = useState<ScannerTestCase>(SCANNER_TEST_CASES[0]);
  
  // Custom code input
  const [customInputCode, setCustomInputCode] = useState('');
  
  // Test Results state
  const [testedCode, setTestedCode] = useState<string>(SCANNER_TEST_CASES[0].sampleCode);
  const [detectedResult, setDetectedResult] = useState<DetectedCodeInfo>(
    analyzeScannedCode(SCANNER_TEST_CASES[0].sampleCode)
  );
  const [matchResult, setMatchResult] = useState<ProductMatchResult>(
    matchDetectedCodeWithInventory(analyzeScannedCode(SCANNER_TEST_CASES[0].sampleCode), store.getProducts())
  );

  // Track tested test-case IDs in this session
  const [testedCaseIds, setTestedCaseIds] = useState<string[]>([SCANNER_TEST_CASES[0].id]);

  // Reporting feedback
  const [isReporting, setIsReporting] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Scan History
  const [historyList, setHistoryList] = useState(getScanHistory());
  const [reportedIssuesList, setReportedIssuesList] = useState(getReportedScanIssues());

  if (!isOpen) return null;

  const products = store.getProducts();

  const handleRunTestCase = (testCase: ScannerTestCase) => {
    setSelectedTestCase(testCase);
    setTestedCode(testCase.sampleCode);
    const det = analyzeScannedCode(testCase.sampleCode);
    setDetectedResult(det);
    setMatchResult(matchDetectedCodeWithInventory(det, products));
    
    if (!testedCaseIds.includes(testCase.id)) {
      setTestedCaseIds([...testedCaseIds, testCase.id]);
    }
    setIsReporting(false);
    setReportSuccess(false);
  };

  const handleRunCustomTest = (code: string) => {
    if (!code.trim()) return;
    setTestedCode(code.trim());
    const det = analyzeScannedCode(code.trim());
    setDetectedResult(det);
    setMatchResult(matchDetectedCodeWithInventory(det, products));
    setIsReporting(false);
    setReportSuccess(false);
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;

    reportScanIssue({
      rawCode: testedCode,
      manufacturerName: detectedResult.brandOrCompany,
      productName: detectedResult.productName,
      expectedBatch: detectedResult.batchNumber,
      userFeedback: reportNote.trim(),
    });

    setReportSuccess(true);
    setReportedIssuesList(getReportedScanIssues());
    setTimeout(() => {
      setIsReporting(false);
      setReportSuccess(false);
      setReportNote('');
    }, 1800);
  };

  const testedCount = testedCaseIds.length;
  const totalPresetCount = SCANNER_TEST_CASES.length;
  const isFullyTested = testedCount >= 3;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white">
                  Scanner Reliability &amp; Testing Lab
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isFullyTested 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isFullyTested ? 'Verified Reliable (3+ Formats Checked)' : `Tested ${testedCount}/${totalPresetCount} Formats`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-format validation: GS1 DataMatrix, EAN-13 barcodes, manufacturer URLs, and custom codes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-bold gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'PRESETS'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Preset Manufacturer Tests ({testedCount}/{totalPresetCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CUSTOM_TEST')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'CUSTOM_TEST'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Custom Code Tester</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHistoryList(getScanHistory());
              setReportedIssuesList(getReportedScanIssues());
              setActiveTab('HISTORY');
            }}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'HISTORY'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Scan History &amp; Issues ({historyList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">

          {/* TAB 1: Preset Manufacturer Tests */}
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Preset Test Picker */}
              <div className="lg:col-span-5 space-y-2.5">
                <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wider block">
                  Select Manufacturer Code to Test
                </span>

                <div className="space-y-2">
                  {SCANNER_TEST_CASES.map((tc) => {
                    const isSelected = selectedTestCase.id === tc.id;
                    const isTested = testedCaseIds.includes(tc.id);

                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => handleRunTestCase(tc)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{tc.manufacturer}</span>
                            {isTested && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>Tested</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium mt-0.5">
                            {tc.productName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Format: {tc.codeFormat}
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${
                          isSelected ? 'text-emerald-600' : 'text-slate-300'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Testing Progress Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Validation Progress</span>
                    <span className="text-emerald-700">{Math.round((testedCount / totalPresetCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(testedCount / totalPresetCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isFullyTested 
                      ? '✓ Fully verified across 3+ manufacturer formats. Meets reliability standards.' 
                      : 'Please test at least 3 manufacturer formats to complete reliability testing.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Real-Time Diagnostic Results */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wider block">
                  Diagnostic Extraction Report
                </span>

                {/* Raw Code Card */}
                <div className="p-3 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono break-all">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold uppercase tracking-wider">Input Code</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">
                      {detectedResult.rawFormatDescription}
                    </span>
                  </div>
                  <div className="text-emerald-300 font-semibold">{testedCode || '(Empty code / 100% manual test)'}</div>
                </div>

                {/* Breakdown: Detected vs Not Encoded */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Successfully Detected ({detectedResult.detectedFields.length})</span>
                    </div>
                    {detectedResult.detectedFields.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">No fields encoded (Manual product)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {detectedResult.detectedFields.map((f, i) => (
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
                      <span>Not Present in Code ({detectedResult.unidentifiedFields.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {detectedResult.unidentifiedFields.slice(0, 5).map((f, i) => (
                        <span key={i} className="text-[10px] font-medium bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded-md">
                          • {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Fields Table */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    Field-Level Breakdown
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Company / Brand</span>
                      <span className="font-bold text-slate-900">{detectedResult.brandOrCompany || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Product Name</span>
                      <span className="font-bold text-slate-900">{detectedResult.productName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Batch Number</span>
                      <span className="font-mono font-bold text-slate-900">{detectedResult.batchNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Expiry Date</span>
                      <span className="font-mono font-bold text-slate-900">{detectedResult.expiryDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">GTIN / Barcode</span>
                      <span className="font-mono font-bold text-slate-900">{detectedResult.productIdOrGtin || detectedResult.barcodeNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Serial Number</span>
                      <span className="font-mono font-bold text-slate-900">{detectedResult.serialNumber || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Inventory Match Status */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Inventory Database Match
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      matchResult.status === 'EXACT_MATCH'
                        ? 'bg-emerald-100 text-emerald-800'
                        : matchResult.status === 'MULTIPLE_MATCHES'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {matchResult.status === 'EXACT_MATCH' 
                        ? 'Exact Match' 
                        : matchResult.status === 'MULTIPLE_MATCHES' 
                        ? `${matchResult.matches.length} Matches` 
                        : 'Product Not Found in Store'}
                    </span>
                  </div>

                  {matchResult.status === 'EXACT_MATCH' && matchResult.matches[0] && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium">
                      Matched: <strong>{matchResult.matches[0].product.name} ({matchResult.matches[0].product.brand})</strong>
                      {' · '}Stock: {matchResult.matches[0].batch?.currentQuantity || 0} units
                    </div>
                  )}

                  {matchResult.status === 'NOT_FOUND' && (
                    <div className="text-slate-500 text-[11px]">
                      No existing item registered with this code yet. When scanned in POS or Inventory, users will be prompted to link it or quick-create.
                    </div>
                  )}
                </div>

                {/* Report Incorrect Scan */}
                <div className="pt-1">
                  {!isReporting ? (
                    <button
                      type="button"
                      onClick={() => setIsReporting(true)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Report incorrect detection for this test case</span>
                    </button>
                  ) : (
                    <form onSubmit={handleReportIssue} className="p-3 bg-slate-100 rounded-xl text-xs space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-rose-600" />
                        <span>Log Scan Discrepancy</span>
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="e.g. Expected batch B-4401 on bottle, but scanner read B-440"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsReporting(false)}
                          className="px-3 py-1 text-slate-600 hover:text-slate-800 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                        >
                          Submit Diagnostic
                        </button>
                      </div>
                      {reportSuccess && (
                        <div className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Logged to diagnostic report successfully.</span>
                        </div>
                      )}
                    </form>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Custom Code Tester */}
          {activeTab === 'CUSTOM_TEST' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-extrabold uppercase text-slate-800 tracking-wider block">
                  Test Any Raw Code or Barcode String
                </span>
                <p className="text-xs text-slate-600">
                  Paste or type any code from a pesticide bottle (1D barcode, GS1 string, verification URL, or custom text) to verify how the intelligence engine interprets it.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customInputCode}
                    onChange={(e) => setCustomInputCode(e.target.value)}
                    placeholder="e.g. 8901030825123 or (01)08901234567890(10)BAY9021 or https://verify.bayer.com..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunCustomTest(customInputCode)}
                    disabled={!customInputCode.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Run Parser Test
                  </button>
                </div>
              </div>

              {/* Show Diagnostics for Custom Code */}
              {testedCode && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="p-3 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono break-all flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Tested Code</span>
                      <span className="text-emerald-400 font-semibold">{testedCode}</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {detectedResult.codeFormat}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">Detected Fields:</span>
                      <div className="flex flex-wrap gap-1">
                        {detectedResult.detectedFields.map((f, i) => (
                          <span key={i} className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">Unidentified / Missing:</span>
                      <div className="flex flex-wrap gap-1">
                        {detectedResult.unidentifiedFields.map((f, i) => (
                          <span key={i} className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                            • {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Scan History & Reported Issues */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6">
              
              {/* Scan History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
                    Recent Scan History (Latest 50 Scans)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Total: {historyList.length}
                  </span>
                </div>

                {historyList.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No scans logged yet. When codes are scanned in POS or Inventory, they appear here.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {historyList.map((entry) => (
                      <div 
                        key={entry.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 truncate max-w-xs">{entry.rawCode}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {entry.codeFormat}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {entry.detectedSummary}
                            {entry.matchedProductName && ` · Matched: ${entry.matchedProductName}`}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            entry.status === 'EXACT_MATCH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.status === 'MULTIPLE_MATCHES'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {entry.status}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reported Issues */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-extrabold uppercase text-slate-800 tracking-wider block">
                  Reported Discrepancies &amp; User Feedback ({reportedIssuesList.length})
                </span>

                {reportedIssuesList.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                    No scan issues reported yet. Staff can log discrepancies when a bottle label doesn't scan properly.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reportedIssuesList.map((issue) => (
                      <div key={issue.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{issue.productName || 'Unidentified Product'} ({issue.manufacturerName || 'Unknown Brand'})</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(issue.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-600">
                          Code: {issue.rawCode}
                        </div>
                        <p className="text-slate-800 text-[11px]">
                          <strong>User note:</strong> {issue.userFeedback}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reliability verification engine active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            Close Testing Lab
          </button>
        </div>

      </div>
    </div>
  );
};
