import React, { useState } from 'react';
import { 
  BookOpen, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Share2, 
  MessageSquare,
  Search,
  Check
} from 'lucide-react';
import { FarmerCustomer, UserRole } from '../types';
import { store } from '../services/store';

interface FarmerKhataProps {
  currentRole?: UserRole;
}

export const FarmerKhata: React.FC<FarmerKhataProps> = ({ currentRole = 'ADMIN' }) => {
  const [farmers, setFarmers] = useState<FarmerCustomer[]>(store.getFarmers());
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [search, setSearch] = useState('');

  // Payment collection modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [collectionNote, setCollectionNote] = useState('Cash received from harvest produce');

  // New Farmer modal
  const [isNewFarmerOpen, setIsNewFarmerOpen] = useState(false);
  const [newFarmerName, setNewFarmerName] = useState('');
  const [newFarmerFather, setNewFarmerFather] = useState('');
  const [newFarmerVillage, setNewFarmerVillage] = useState('');
  const [newFarmerPhone, setNewFarmerPhone] = useState('');
  const [newFarmerLimit, setNewFarmerLimit] = useState<number>(25000);

  // Copied alert
  const [copiedMessage, setCopiedMessage] = useState(false);

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  const totalCreditGiven = farmers.reduce((acc, f) => acc + f.outstandingDebt, 0);
  const totalLimit = farmers.reduce((acc, f) => acc + f.creditLimit, 0);

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.village.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search)
  );

  const handleRecordCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer || collectionAmount <= 0) return;

    store.recordFarmerPayment(selectedFarmer.id, collectionAmount, collectionNote);
    setFarmers(store.getFarmers());
    setIsCollectModalOpen(false);
    setCollectionAmount(0);
  };

  const handleCreateFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmerName || !newFarmerPhone) return;

    const created = store.addFarmer({
      name: newFarmerName,
      fatherName: newFarmerFather,
      village: newFarmerVillage || 'Local Tehsil',
      phone: newFarmerPhone,
      creditLimit: newFarmerLimit,
      status: 'CLEAR',
    });

    setFarmers(store.getFarmers());
    setSelectedFarmerId(created.id);
    setIsNewFarmerOpen(false);
    setNewFarmerName('');
    setNewFarmerFather('');
    setNewFarmerVillage('');
    setNewFarmerPhone('');
  };

  const generateWhatsAppMessage = () => {
    if (!selectedFarmer) return '';
    return `Namaste ${selectedFarmer.name} ji,\nThis is AgroPulse Farm Store ledger update.\nYour outstanding credit balance is ₹${selectedFarmer.outstandingDebt.toLocaleString()}.\nPromised settlement date: ${selectedFarmer.promisedPayDate || 'Post-Harvest'}.\nThank you for choosing certified agrochemicals and seeds with us.`;
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Farmer Credit Register (Khata Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Managing rural credit terms, post-harvest payment promises, and customer receipt logs for local cultivators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">
              {currentRole === 'ADMIN' ? 'Total Active Receivables' : 'Customer Ledger Accounts'}
            </span>
            <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">
              {currentRole === 'ADMIN' ? `₹${totalCreditGiven.toLocaleString()}` : `${farmers.length} Cultivators`}
            </span>
          </div>

          {currentRole === 'ADMIN' ? (
            <button
              onClick={() => setIsNewFarmerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Farmer</span>
            </button>
          ) : (
            <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border">
              Worker Ledger Mode
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Farmer List, Right Detailed Ledger & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Farmer Directory (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search farmer by name or village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredFarmers.map(farmer => {
              const isSelected = selectedFarmerId === farmer.id;
              const hasDebt = farmer.outstandingDebt > 0;
              const utilization = (farmer.outstandingDebt / farmer.creditLimit) * 100;

              return (
                <div
                  key={farmer.id}
                  onClick={() => setSelectedFarmerId(farmer.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{farmer.name}</div>
                      <div className="text-[11px] text-slate-500">{farmer.village}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      farmer.status === 'WARNING' ? 'bg-rose-100 text-rose-900' :
                      hasDebt ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hasDebt ? `Due: ₹${farmer.outstandingDebt.toLocaleString()}` : 'Settled'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Limit: ₹{farmer.creditLimit.toLocaleString()}</span>
                    <span>{utilization.toFixed(0)}% used</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                    <div 
                      className={`h-full ${utilization > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Statement, Dues Aging & History (8 cols) */}
        {selectedFarmer ? (
          <div className="lg:col-span-8 space-y-4">
            
            {/* Farmer Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedFarmer.name}</h2>
                    {selectedFarmer.fatherName && (
                      <span className="text-xs text-slate-500">s/o {selectedFarmer.fatherName}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedFarmer.phone}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedFarmer.village}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedMessage ? 'Copied SMS Text!' : 'Share SMS/WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCollectionAmount(selectedFarmer.outstandingDebt);
                      setIsCollectModalOpen(true);
                    }}
                    disabled={selectedFarmer.outstandingDebt <= 0}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      selectedFarmer.outstandingDebt <= 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Collect Payment</span>
                  </button>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Outstanding Debt</span>
                  <span className="text-base font-bold font-mono text-rose-700 tabular-nums">
                    ₹{selectedFarmer.outstandingDebt.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Credit Limit Granted</span>
                  <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                    ₹{selectedFarmer.creditLimit.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Next Promise Date</span>
                  <span className="text-base font-bold font-mono text-amber-700">
                    {selectedFarmer.promisedPayDate || 'Post-Harvest'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Khata Ledger Transaction History
              </h3>

              <div className="space-y-3">
                {selectedFarmer.transactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No transactions recorded for this account.
                  </div>
                ) : (
                  selectedFarmer.transactions.map((tx) => {
                    const isCredit = tx.type === 'PURCHASE_CREDIT';
                    return (
                      <div 
                        key={tx.id}
                        className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCredit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {isCredit ? 'Credit Purchase (Stock Out)' : 'Payment Received (Recovery)'}
                            </div>
                            <div className="text-[11px] text-slate-500">{tx.note}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {tx.date} {tx.invoiceNumber ? `· Invoice #${tx.invoiceNumber}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${
                            isCredit ? 'text-rose-700' : 'text-emerald-800'
                          }`}>
                            {isCredit ? `+₹${tx.amount.toLocaleString()}` : `-₹${tx.amount.toLocaleString()}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Bal: ₹{tx.balanceAfter.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : null}

      </div>

      {/* Collect Payment Modal */}
      {isCollectModalOpen && selectedFarmer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Collect Farmer Dues</h3>
              <button onClick={() => setIsCollectModalOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleRecordCollection} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Farmer Account</label>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedFarmer.name} ({selectedFarmer.village})
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Current Outstanding: ₹{selectedFarmer.outstandingDebt.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedFarmer.outstandingDebt}
                  value={collectionAmount || ''}
                  onChange={(e) => setCollectionAmount(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Collection Receipt Note</label>
                <input
                  type="text"
                  value={collectionNote}
                  onChange={(e) => setCollectionNote(e.target.value)}
                  placeholder="e.g. Cash collected at mandi / UPI transfer"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm &amp; Update Khata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Farmer Modal */}
      {isNewFarmerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Register New Farmer (Khata)</h3>
              <button onClick={() => setIsNewFarmerOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateFarmer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Farmer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramkishan Patel"
                  value={newFarmerName}
                  onChange={(e) => setNewFarmerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Father's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Babulal Patel"
                  value={newFarmerFather}
                  onChange={(e) => setNewFarmerFather(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Village / Tehsil *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rampur Kalan"
                    value={newFarmerVillage}
                    onChange={(e) => setNewFarmerVillage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="10 digits"
                    value={newFarmerPhone}
                    onChange={(e) => setNewFarmerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Credit Limit Granted (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newFarmerLimit}
                  onChange={(e) => setNewFarmerLimit(Number(e.target.value))}
                  className="w-full font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFarmerOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Create Farmer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
