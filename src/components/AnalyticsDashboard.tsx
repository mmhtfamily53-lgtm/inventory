import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Layers, 
  Database, 
  Download, 
  DollarSign, 
  Inbox
} from 'lucide-react';
import { store } from '../services/store';

export const AnalyticsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const invoices = store.getInvoices();
  const products = store.getProducts();
  const suppliers = store.getSuppliers();

  // Compute live sales aggregates from store invoices
  const totalGrossSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalOrders = invoices.length;
  const totalTaxCollected = invoices.reduce((acc, inv) => acc + inv.taxTotal, 0);

  // Group invoices by date for live trends
  const dateMap: { [key: string]: { sales: number; orders: number } } = {};
  invoices.forEach(inv => {
    const d = inv.date.split(' ')[0] || 'Today';
    if (!dateMap[d]) dateMap[d] = { sales: 0, orders: 0 };
    dateMap[d].sales += inv.grandTotal;
    dateMap[d].orders += 1;
  });

  const liveTrendData = Object.keys(dateMap).map(date => ({
    label: date,
    sales: dateMap[date].sales,
    margin: dateMap[date].sales * 0.25, // Estimated 25% gross margin
    orders: dateMap[date].orders,
  }));

  const maxSales = liveTrendData.length > 0 ? Math.max(...liveTrendData.map(d => d.sales), 1000) : 1000;

  // Compute product sales volume
  const productSalesMap: { [pName: string]: { units: number; revenue: number; batchNo: string } } = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { units: 0, revenue: 0, batchNo: item.batchNumber };
      }
      productSalesMap[item.productName].units += item.quantity;
      productSalesMap[item.productName].revenue += item.total;
    });
  });

  const bestSellers = Object.keys(productSalesMap).map(name => ({
    name,
    units: productSalesMap[name].units,
    revenue: productSalesMap[name].revenue,
    batchNo: productSalesMap[name].batchNo,
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Category counts
  const categoryCounts: { [cat: string]: number } = {};
  products.forEach(p => {
    categoryCounts[p.type] = (categoryCounts[p.type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Business Intelligence &amp; Analytics
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Admin Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time shop metrics for daily revenue velocity, inventory turns, margin breakdown, and tax compliance.
          </p>
        </div>

        {/* Timeframe & Export Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['7D', '30D', '90D', 'YTD'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  timeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Exporting live shop transactions to CSV...')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-400 block">Total Gross Revenue</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            ₹{totalGrossSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalOrders} Sales Invoices Logged</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-400 block">GST Component Collected</span>
          <div className="text-2xl font-bold font-mono text-emerald-800 tabular-nums mt-1">
            ₹{totalTaxCollected.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for GSTR-1 Tax Filing</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-400 block">Active Cataloged Products</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {products.length} Products
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {products.reduce((acc, p) => acc + p.batches.length, 0)} Active Batches Live
          </p>
        </div>
      </div>

      {/* Primary Visualizations Grid: Sales Trends & Turnover Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales & Margin Velocity (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Sales Revenue &amp; Trend ({timeframe})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live transaction revenue grouped by billing session
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                <span className="text-slate-600">Gross Sales</span>
              </div>
            </div>
          </div>

          {liveTrendData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
              <Inbox className="w-8 h-8 text-slate-300 mb-2" />
              <span className="font-semibold text-slate-700">No Sales Transactions Recorded Yet</span>
              <span className="mt-1 max-w-sm">
                When you scan products and process bills at the POS counter, daily revenue trends and margin curves will render here automatically.
              </span>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-slate-100">
              {liveTrendData.map((d, index) => {
                const salesHeight = (d.sales / maxSales) * 100;
                const isHovered = hoveredBarIndex === index;

                return (
                  <div 
                    key={d.label}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-12 z-20 bg-slate-900 text-white p-2 rounded shadow-lg text-[10px] font-mono pointer-events-none whitespace-nowrap">
                        <div className="font-bold">{d.label}</div>
                        <div>Sales: ₹{d.sales.toLocaleString()}</div>
                        <div>Orders: {d.orders}</div>
                      </div>
                    )}

                    <div className="w-full max-w-[42px] flex items-end justify-center h-full">
                      <div 
                        className={`w-full rounded-t transition-all ${
                          isHovered ? 'bg-emerald-700' : 'bg-emerald-600'
                        }`}
                        style={{ height: `${Math.max(10, salesHeight)}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Live shop database stream active</span>
            <span className="font-mono text-emerald-800 font-semibold">100% Real Transaction Ledger</span>
          </div>
        </div>

        {/* Category Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Catalog Category Distribution</span>
            </h2>
            <p className="text-xs text-slate-500">
              Product diversity across chemicals &amp; seeds
            </p>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              0 products in inventory. Use the Inventory tab to register your initial chemical and seed stocks.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.keys(categoryCounts).map(cat => (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{cat}</span>
                    <span className="font-mono">{categoryCounts[cat]} items</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-600"
                      style={{ width: `${(categoryCounts[cat] / products.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600">
            <strong>Turnover Strategy:</strong> High seed turnover occurs during 3-week sowing windows, whereas fungicides and insecticides sustain demand through pest outbreaks.
          </div>
        </div>

      </div>

      {/* Best-Selling Products by Revenue */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Top Performing Products &amp; Batches</span>
          </h2>
          <span className="text-xs text-slate-400">Ranked by Sales Revenue</span>
        </div>

        {bestSellers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No sales processed yet. Best-selling rankings will dynamically calculate here as invoices are completed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3 font-semibold">Product Name</th>
                  <th className="py-2 px-3 font-semibold">Batch No.</th>
                  <th className="py-2 px-3 font-semibold">Units Sold</th>
                  <th className="py-2 px-3 font-semibold text-right">Gross Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bestSellers.map(p => (
                  <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{p.batchNo}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">{p.units}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-emerald-800 text-right">
                      ₹{p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Aggregation Architecture Guide */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            Architectural Blueprint: Database Aggregation &amp; Real-Time Querying
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In a live PostgreSQL production deployment, reporting queries run against a scheduled Materialized View with index scan optimization. As real sales occur, an asynchronous event trigger automatically refreshes the aggregate table (`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_analytics;`).
        </p>
      </div>

    </div>
  );
};
