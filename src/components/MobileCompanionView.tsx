import React, { useState } from 'react';
import { 
  Smartphone, 
  ScanLine, 
  Package, 
  Clock, 
  Receipt, 
  Wifi, 
  WifiOff, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Camera,
  Search,
  Plus
} from 'lucide-react';
import { store } from '../services/store';
import { getDaysUntilExpiration, getToxicityDisplay } from '../services/qrHelper';

export const MobileCompanionView: React.FC = () => {
  const [mobileScreen, setMobileScreen] = useState<'scanner' | 'inventory' | 'sales' | 'attendance'>('scanner');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const products = store.getProducts();
  const invoices = store.getInvoices();
  const staff = store.getStaff();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Companion Mobile Application &amp; Field Strategy
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Field &amp; Counter PWA / Hybrid
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Production-grade blueprint and live interactive device simulator for field agronomists, counter cashiers, and warehouse stock-takers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isSimulatedOffline ? 'Mode: Simulated Offline Sync' : 'Mode: Live Real-Time Socket'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Mobile Device Frame (Left) + Architectural Strategy (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Mobile Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative">
            
            {/* Phone Notch / Dynamic Island */}
            <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600/70" />
            </div>

            {/* Inner Mobile Screen Viewport */}
            <div className="bg-slate-50 rounded-[34px] overflow-hidden flex flex-col h-[620px] text-slate-900">
              
              {/* Mobile Status Bar */}
              <div className="px-5 py-2 bg-white flex items-center justify-between text-[11px] font-mono border-b border-slate-100">
                <span className="font-bold">09:41</span>
                <div className="flex items-center gap-1 text-[10px]">
                  {isSimulatedOffline ? (
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      <WifiOff className="w-3 h-3" /> Offline Queue (2)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Wifi className="w-3 h-3" /> 5G Connected
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Content Screen */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                
                {/* Screen 1: Streamlined POS Scanner */}
                {mobileScreen === 'scanner' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">Mobile Field Scanner</h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        1-Handed Mode
                      </span>
                    </div>

                    {/* Camera Viewfinder Simulation */}
                    <div className="bg-slate-900 rounded-2xl h-44 relative overflow-hidden flex flex-col items-center justify-center p-3 text-white border border-slate-700">
                      <div className="w-32 h-32 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center relative">
                        <ScanLine className="w-8 h-8 text-emerald-400 animate-pulse" />
                        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">
                        Center QR batch code in frame
                      </span>
                    </div>

                    {/* Quick Demo Scan Button */}
                    <button
                      onClick={() => {
                        const randomProduct = products[0];
                        setScannedResult(`Verified: ${randomProduct.name} - Batch ${randomProduct.batches[0].batchNumber}`);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Simulate Fast Camera Scan</span>
                    </button>

                    {scannedResult && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Batch Validated</span>
                          <span className="text-[11px] text-emerald-800">{scannedResult}</span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono font-bold text-xs">MRP: ₹850</span>
                            <button className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-bold">
                              + Bill Item
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Screen 2: Real-Time Mobile Inventory Lookup */}
                {mobileScreen === 'inventory' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-900">Quick Stock Lookup</h3>
                    
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Active chemical or seed..."
                        value={mobileSearch}
                        onChange={(e) => setMobileSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                      {products.map(p => {
                        const totalUnits = p.batches.reduce((acc, b) => acc + b.currentQuantity, 0);
                        const tox = getToxicityDisplay(p.toxicityClass);
                        return (
                          <div key={p.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                            <div className="flex items-start justify-between">
                              <span className="font-bold text-slate-900 leading-tight">{p.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tox.colorClass}`}>
                                {tox.short}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{p.activeIngredient}</div>
                            <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                              <span className="text-emerald-800 font-bold">{totalUnits} in stock</span>
                              <span className="text-slate-400">{p.batches.length} batches</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Screen 3: Basic Sales & Invoices */}
                {mobileScreen === 'sales' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-900">Today's Counter Bills</h3>
                    <div className="space-y-2 max-h-[380px] overflow-y-auto">
                      {invoices.map(inv => (
                        <div key={inv.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                            <span className="font-mono font-bold text-emerald-800">₹{inv.grandTotal.toLocaleString()}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>{inv.customerName}</span>
                            <span className="font-semibold text-slate-700">{inv.paymentMethod}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {inv.items.length} items deducted · {inv.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screen 4: Staff Attendance Logging */}
                {mobileScreen === 'attendance' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-900">Worker Attendance Log</h3>
                    
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Logged Cashier</span>
                        <span className="font-bold text-slate-900 text-sm">Arjun Sharma (Morning Shift)</span>
                      </div>

                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 text-[11px]">
                        <strong>Geofence Verified:</strong> Store Counter 1 (Agro Complex GPS Locked).
                      </div>

                      <button
                        onClick={() => alert('Attendance logged: Clock In timestamp recorded with counter GPS coordinates.')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-xs"
                      >
                        Tap to Clock In (09:41 AM)
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Mobile Navigation Bar (Ergonomic Thumb-Zone) */}
              <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-500">
                <button
                  onClick={() => setMobileScreen('scanner')}
                  className={`flex flex-col items-center gap-0.5 ${mobileScreen === 'scanner' ? 'text-emerald-700' : ''}`}
                >
                  <ScanLine className="w-5 h-5" />
                  <span>Scan</span>
                </button>
                <button
                  onClick={() => setMobileScreen('inventory')}
                  className={`flex flex-col items-center gap-0.5 ${mobileScreen === 'inventory' ? 'text-emerald-700' : ''}`}
                >
                  <Package className="w-5 h-5" />
                  <span>Stock</span>
                </button>
                <button
                  onClick={() => setMobileScreen('sales')}
                  className={`flex flex-col items-center gap-0.5 ${mobileScreen === 'sales' ? 'text-emerald-700' : ''}`}
                >
                  <Receipt className="w-5 h-5" />
                  <span>Sales</span>
                </button>
                <button
                  onClick={() => setMobileScreen('attendance')}
                  className={`flex flex-col items-center gap-0.5 ${mobileScreen === 'attendance' ? 'text-emerald-700' : ''}`}
                >
                  <Clock className="w-5 h-5" />
                  <span>Shift</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Complete Technical & UX Strategy (7 cols) */}
        <div className="lg:col-span-7 space-y-5 text-xs text-slate-700">
          
          {/* Section 1: Framework Recommendation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Cross-Platform Framework Recommendation: React Native (Expo) vs PWA
              </h2>
            </div>
            
            <p className="leading-relaxed">
              <strong>Primary Recommendation: React Native with Expo (or Progressive Web App for instant deployment).</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block text-xs">Why React Native / Expo:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Direct hardware access to rear camera auto-focus and laser torch for dark rural warehouse scanning.</li>
                  <li>Native SQLite engine for storing 10,000+ batch records locally with offline delta sync.</li>
                  <li>Shared TypeScript types directly with the Node.js/Express backend.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block text-xs">Why PWA Alternative:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Zero app store approvals; workers install in 5 seconds via browser prompt.</li>
                  <li>Service worker Cache-First strategy for instantaneous sub-100ms offline boot.</li>
                  <li>WebRTC Camera API (`getUserMedia`) works seamlessly across modern Android phones.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: API Design Considerations for Mobile & Offline Sync */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                2. API Design &amp; Seamless Offline Synchronization
              </h2>
            </div>

            <p className="leading-relaxed">
              Rural agricultural regions often experience intermittent 2G/3G connectivity. The mobile app architecture must adopt an <strong>Offline-First Idempotent Mutation Pipeline</strong>:
            </p>

            <div className="space-y-2 font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-800">
              <div className="text-emerald-400 font-bold">// Offline Mutation Payload Example:</div>
              <div>POST /api/v1/pos/offline-sync</div>
              <div>Headers: Authorization: Bearer &lt;jwt&gt; | Idempotency-Key: &lt;uuidv4&gt;</div>
              <div className="text-slate-400">Payload: {'{'} "queue": [{'{'}"action": "PROCESS_SALE", "client_timestamp": 1742080000, "items": [...] {'}'}] {'}'}</div>
            </div>

            <ul className="space-y-1.5 text-slate-600">
              <li><strong>Delta Sync Protocol:</strong> Sync queries use timestamp cursors (`?since=1742081234`) to only download modified batch inventory rather than refetching the entire catalog.</li>
              <li><strong>Row-Level Conflict Resolution:</strong> Server checks optimistic lock versions on batches. If a batch was sold out in the web app while the mobile cashier was offline, the transaction is rejected gracefully with alternatives.</li>
            </ul>
          </div>

          {/* Section 3: UI/UX Patterns for On-The-Go Usage */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                3. UI/UX Ergonomics for Counter &amp; Field Usage
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block">48px Touch Targets</span>
                <span className="text-[11px] text-slate-500">Accessible for workers wearing field dust gloves</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block">High Sunlight Contrast</span>
                <span className="text-[11px] text-slate-500">WCAG AAA contrast for bright outdoor farm inspections</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-900 block">Thumb-Zone Navigation</span>
                <span className="text-[11px] text-slate-500">Bottom pinned tabs for comfortable single-handed operation</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
