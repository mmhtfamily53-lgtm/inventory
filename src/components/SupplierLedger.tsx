import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  Search,
  X
} from 'lucide-react';
import { Supplier, SupplierBill } from '../types';
import { store } from '../services/store';

export const SupplierLedger: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(store.getSuppliers());
  const [bills, setBills] = useState<SupplierBill[]>(store.getSupplierBills());
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Payment modal state
  const [activePaymentBill, setActivePaymentBill] = useState<SupplierBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // New Supplier modal state
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [creditDays, setCreditDays] = useState<number>(30);

  const totalOutstanding = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);
  const overdueBills = bills.filter(b => b.status === 'OVERDUE');
  const pendingBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'PARTIAL');

  // Filter bills
  const filteredBills = bills.filter(b => {
    if (selectedSupplierId !== 'ALL' && b.supplierId !== selectedSupplierId) return false;
    if (search && !b.billNumber.toLowerCase().includes(search.toLowerCase()) && !b.supplierName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleOpenPayment = (bill: SupplierBill) => {
    setActivePaymentBill(bill);
    setPaymentAmount(bill.balanceAmount);
    setPaymentNote(`Bank NEFT payment against invoice ${bill.billNumber}`);
    setPaymentSuccess(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentBill || paymentAmount <= 0) return;

    store.recordSupplierPayment(activePaymentBill.id, paymentAmount);
    setSuppliers(store.getSuppliers());
    setBills(store.getSupplierBills());
    setPaymentSuccess(`Successfully recorded payment of ₹${paymentAmount.toLocaleString()} for bill ${activePaymentBill.billNumber}.`);
    setTimeout(() => {
      setActivePaymentBill(null);
      setPaymentSuccess(null);
    }, 1800);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone) return;

    store.addSupplier({
      company: companyName,
      name: contactPerson || companyName,
      phone,
      email: email || '',
      gstin: gstin || 'UNREGISTERED',
      licenseNumber: licenseNumber || 'NA',
      address: address || 'Local',
      paymentDueDays: creditDays,
    });

    setSuppliers(store.getSuppliers());
    setIsAddSupplierOpen(false);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstin('');
    setLicenseNumber('');
    setAddress('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with AP Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Supplier Ledger &amp; Accounts Payable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking inbound seed &amp; pesticide consignments, manufacturer credit terms, and payment due schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Outstanding Balance</span>
            <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
              ₹{totalOutstanding.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Registered Suppliers</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {suppliers.length} Companies
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Distributors &amp; Manufacturers</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Invoices</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {pendingBills.length} Bills
          </div>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">Within agreed credit cycle</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overdue Vendor Bills</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {overdueBills.length} Overdue
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires immediate credit clearance</p>
        </div>
      </div>

      {/* Supplier Profiles Grid */}
      {suppliers.length === 0 ? (
        <div className="p-10 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Suppliers Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add wholesale pesticide and hybrid seed distributors to track invoices, credit terms, and payment schedules.
          </p>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Supplier</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div 
              key={sup.id}
              onClick={() => setSelectedSupplierId(selectedSupplierId === sup.id ? 'ALL' : sup.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedSupplierId === sup.id 
                  ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{sup.company}</h3>
                  <span className="text-[11px] text-slate-500">{sup.name}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  sup.outstandingBalance > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {sup.outstandingBalance > 0 ? 'Pending Dues' : 'Settled'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>GST: {sup.gstin}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Balance Due:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{sup.outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inbound Bills & Consignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Inbound Purchase Invoices &amp; Payment Due Ledger
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search invoice or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            {selectedSupplierId !== 'ALL' && (
              <button 
                onClick={() => setSelectedSupplierId('ALL')}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No supplier invoices recorded yet. As you add batches with supplier details in Inventory, purchase bills will be logged here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Bill / Invoice No.</th>
                  <th className="py-2.5 px-3 font-semibold">Supplier / Manufacturer</th>
                  <th className="py-2.5 px-3 font-semibold">Bill Date</th>
                  <th className="py-2.5 px-3 font-semibold">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold">Total Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Paid Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Balance Due</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map(bill => {
                  const isOverdue = bill.status === 'OVERDUE';
                  const isPaid = bill.status === 'PAID';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {bill.billNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {bill.supplierName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {bill.billDate}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {bill.dueDate}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-900 font-medium">
                        ₹{bill.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-emerald-800">
                        ₹{bill.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-900">
                        ₹{bill.balanceAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' :
                          isOverdue ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(bill)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Register Wholesale Supplier</h3>
              </div>
              <button 
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Company / Distributor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bayer CropScience / Local Seed Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Area Manager"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98200 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Pesticide / Seed Lic No.</label>
                  <input
                    type="text"
                    placeholder="Permit/License #"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Agreed Credit Days</label>
                  <input
                    type="number"
                    min="0"
                    value={creditDays}
                    onChange={(e) => setCreditDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Warehouse / Depot Address</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {activePaymentBill && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Record Vendor Bill Payment</h3>
              </div>
              <button 
                onClick={() => setActivePaymentBill(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold text-center">
                {paymentSuccess}
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Invoice Number &amp; Vendor</label>
                  <div className="font-bold text-slate-900 font-mono">
                    {activePaymentBill.billNumber} · {activePaymentBill.supplierName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Amount</span>
                    <span className="font-mono font-bold text-slate-800">₹{activePaymentBill.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Current Balance Due</span>
                    <span className="font-mono font-bold text-rose-700">₹{activePaymentBill.balanceAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Amount to Pay (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={activePaymentBill.balanceAmount}
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Payment Reference / Note</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Bank NEFT / Cheque No. 441092"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePaymentBill(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  >
                    Confirm &amp; Record Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
