import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  TrendingUp, 
  Clock, 
  SlidersHorizontal,
  DollarSign,
  Layers,
  ShoppingBag,
  ListFilter,
  Calendar,
  Grid
} from 'lucide-react';
import { 
  generateDrilldownDetails, 
  calculateDrilldownSummary, 
  TransactionDetailRow 
} from '../lib/drillDownEngine';
import { formatCurrency, cn } from '../lib/utils';

interface SalesDrillDownProps {
  filteredData: any[];
  type: 'item' | 'client' | 'category';
  targetValue: string;
  currencySymbol?: string;
  onClose: () => void;
}

export function SalesDrillDown({
  filteredData,
  type,
  targetValue,
  currencySymbol = '$',
  onClose
}: SalesDrillDownProps) {
  // Advanced State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_amount' | 'lowest_amount' | 'highest_qty' | 'lowest_qty'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [viewMode, setViewMode] = useState<'table' | 'timeline' | 'cards'>('table');

  // Compute Raw Matches from Engine
  const rawRows = useMemo(() => {
    return generateDrilldownDetails(filteredData, type, targetValue);
  }, [filteredData, type, targetValue]);

  // Apply Real-time Searching Inside Drilldown
  const searchedRows = useMemo(() => {
    let list = [...rawRows];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.invoiceNo.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.salesPerson.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        String(r.lineTotal).includes(q)
      );
    }
    return list;
  }, [rawRows, searchQuery]);

  // Apply Real-time Sorting
  const sortedRows = useMemo(() => {
    const list = [...searchedRows];
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'highest_amount') {
        return b.lineTotal - a.lineTotal;
      }
      if (sortBy === 'lowest_amount') {
        return a.lineTotal - b.lineTotal;
      }
      if (sortBy === 'highest_qty') {
        return b.quantity - a.quantity;
      }
      if (sortBy === 'lowest_qty') {
        return a.quantity - b.quantity;
      }
      return 0;
    });
    return list;
  }, [searchedRows, sortBy]);

  // Summary Metrics Header Computed from Filtered Target Rows
  const summary = useMemo(() => {
    return calculateDrilldownSummary(sortedRows);
  }, [sortedRows]);

  // Pagination Math
  const totalRecords = sortedRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  
  // Safe page pointer adjustment
  const activePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, activePage, pageSize]);

  // Helper to Format Output Dates beautifully
  const formatDetailDate = (dateStr: string) => {
    try {
      if (!dateStr || dateStr === 'N/A') return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Export current active view to CSV file
  const handleExportCSV = () => {
    const headers = ['Invoice Ref', 'Transaction Date', 'Client Name', 'Item Description', 'Qty Sold', 'Unit Price', 'Line Total', 'Salesperson', 'Category'];
    const rows = sortedRows.map(r => [
      `"${r.invoiceNo.replace(/"/g, '""')}"`,
      `"${formatDetailDate(r.date)}"`,
      `"${r.clientName.replace(/"/g, '""')}"`,
      `"${r.itemName.replace(/"/g, '""')}"`,
      r.quantity,
      r.unitPrice,
      r.lineTotal,
      `"${r.salesPerson.replace(/"/g, '""')}"`,
      `"${r.category}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const safeTag = targetValue.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `drilldown_report_${type}_${safeTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Human-readable titles depending on clicked target
  const getHeaderTitle = () => {
    if (type === 'item') return `Product Sales Breakdown: ${targetValue}`;
    if (type === 'client') return `Client Purchase History: ${targetValue}`;
    if (type === 'category') return `Category Performance: ${targetValue}`;
    return `Transaction Inspector: ${targetValue}`;
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print-backdrop">
      <div 
        className="bg-white border border-black/10 rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
        id="drilldown-modal-container"
      >
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-black/5 flex items-center justify-between bg-paper/20 no-print">
          <div>
            <div className="flex items-center gap-2">
              {type === 'item' && <ShoppingBag className="w-5 h-5 text-brand" />}
              {type === 'client' && <DollarSign className="w-5 h-5 text-brand" />}
              {type === 'category' && <Layers className="w-5 h-5 text-brand" />}
              <h2 className="text-lg font-bold text-ink">{getHeaderTitle()}</h2>
            </div>
            <p className="text-xs text-ink/40 mt-1">
              Inspection of {rawRows.length} total raw transactions corresponding to the active date & client filters.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full text-ink/40 hover:text-ink transition-colors"
            title="Close drilldown inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Summary Metric Strip (Sticky / Top of inspector) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-paper/30 border border-black/5 p-4 rounded-2xl">
            <div>
              <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest block mb-0.5">Transactions Count</span>
              <strong className="text-xl font-bold font-mono text-ink">{summary.totalTransactions}</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest block mb-0.5">Total Quantity Sold</span>
              <strong className="text-xl font-bold font-mono text-brand">{summary.totalQty}</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest block mb-0.5">Cumulative Value</span>
              <strong className="text-xl font-bold font-mono text-brand">{formatCurrency(summary.totalRevenue, currencySymbol)}</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest block mb-0.5">Weighted Avg Price</span>
              <strong className="text-xl font-bold font-mono text-ink">{formatCurrency(summary.averagePrice, currencySymbol)}</strong>
            </div>
          </div>

          {/* Search, Sorting, Exports & Display Mode Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white border border-black/5 p-4 rounded-2xl shadow-sm no-print">
            <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
              {/* Internal Search */}
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input 
                  type="text"
                  placeholder="Search invoice, client..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // reset to first page
                  }}
                  className="w-full md:w-56 pl-9 pr-3 py-1.5 bg-paper rounded-xl text-xs border border-transparent focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                />
              </div>

              {/* Sorting Downbox */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="appearance-none bg-paper pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold text-ink/60 border border-transparent focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_amount">Highest Amount</option>
                  <option value="lowest_amount">Lowest Amount</option>
                  <option value="highest_qty">Highest Qty</option>
                  <option value="lowest_qty">Lowest Qty</option>
                </select>
                <ChevronDown className="w-3 h-3 text-ink/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Switches */}
              <div className="bg-paper p-0.5 border border-black/5 rounded-xl text-[10px] font-bold uppercase flex">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn("px-2 py-1 rounded-lg transition-all", viewMode === 'table' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                  title="Table view"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={cn("px-2 py-1 rounded-lg transition-all", viewMode === 'timeline' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                  title="Timeline tracker view"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn("px-2 py-1 rounded-lg transition-all", viewMode === 'cards' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                  title="Dynamic Grid layout"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Export / Print Tools */}
            <div className="flex gap-2 items-center w-full md:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-paper hover:bg-black/5 border border-black/5 rounded-xl text-xs font-bold text-ink/70 flex items-center gap-1.5"
                title="Download active sorted rows as CSV"
              >
                <Download className="w-3.5 h-3.5 text-brand" /> Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-paper hover:bg-black/5 border border-black/5 rounded-xl text-xs font-bold text-ink/70 flex items-center gap-1.5"
                title="Print transaction document"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Results Area */}
          {paginatedRows.length === 0 ? (
            <div className="py-20 text-center bg-paper/20 rounded-2xl border border-dashed border-black/5">
              <ListFilter className="w-8 h-8 text-ink/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-ink/60">No transaction history found</p>
              <p className="text-xs text-ink/40 mt-1 max-w-sm mx-auto">
                No matching rows exist within this criteria. Try clearing search fields or expanding dashboard dates.
              </p>
            </div>
          ) : (
            <div className="transition-all">
              {/* VIEW 1: Traditional ERP Table */}
              {viewMode === 'table' && (
                <div className="bg-white border border-black/5 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-paper/40 border-b border-black/5 text-[9px] font-bold uppercase tracking-widest text-ink/40">
                        <th className="py-3.5 px-6">Invoice Ref</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Client Name</th>
                        <th className="py-3.5 px-4">Item Name</th>
                        <th className="py-3.5 px-4 text-center">Qty</th>
                        <th className="py-3.5 px-4 text-right">Unit Price</th>
                        <th className="py-3.5 px-4 text-right">Line Total</th>
                        <th className="py-3.5 px-4 text-center">Category</th>
                        <th className="py-3.5 px-6 text-right">Salesperson</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {paginatedRows.map((row, index) => (
                        <tr key={index} className="hover:bg-paper/10 text-xs text-ink/80 transition-colors">
                          <td className="py-3 px-6 font-mono font-bold text-brand">{row.invoiceNo}</td>
                          <td className="py-3 px-4 text-ink/60">{formatDetailDate(row.date)}</td>
                          <td className="py-3 px-4 font-bold text-ink/80">{row.clientName}</td>
                          <td className="py-3 px-4 text-ink">{row.itemName}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-ink">{row.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-ink/50">{formatCurrency(row.unitPrice, currencySymbol)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-brand">{formatCurrency(row.lineTotal, currencySymbol)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-1.5 py-0.5 bg-paper rounded text-[9px] font-bold text-ink/50 uppercase leading-none">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right text-[10px] text-ink/40 font-mono">{row.salesPerson}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 2: Timeline Tracker */}
              {viewMode === 'timeline' && (
                <div className="relative border-l-2 border-brand/20 ml-4 pl-6 space-y-6">
                  {paginatedRows.map((row, index) => (
                    <div key={index} className="relative group">
                      {/* Timeline Dot Marker */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-brand flex items-center justify-center group-hover:bg-brand transition-colors">
                        <span className="w-1.5 h-1.5 bg-brand rounded-full group-hover:bg-white" />
                      </span>

                      <div className="bg-paper/30 border border-black/5 p-4 rounded-xl hover:border-brand/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">{formatDetailDate(row.date)}</span>
                            <span className="text-brand font-mono font-bold text-xs bg-brand/5 px-2 py-0.5 rounded">{row.invoiceNo}</span>
                          </div>
                          <p className="text-xs text-ink/70">
                            <strong>{row.clientName}</strong> purchased <strong>{row.quantity}x {row.itemName}</strong>
                          </p>
                          <div className="text-[10px] text-ink/40 flex items-center gap-3">
                            <span>Category: {row.category}</span>
                            <span>Salesperson: {row.salesPerson}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-brand font-mono block">
                            {formatCurrency(row.lineTotal, currencySymbol)}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-ink/30">
                            {row.quantity} @ {formatCurrency(row.unitPrice, currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW 3: Optimized Responsive Cards */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedRows.map((row, index) => (
                    <div 
                      key={index} 
                      className="bg-white border border-black/5 hover:border-brand/20 p-5 rounded-2xl shadow-sm space-y-3 hover:scale-[1.01] transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-ink/30 font-mono font-bold block">{row.invoiceNo} · {formatDetailDate(row.date)}</span>
                          <strong className="text-sm font-bold text-ink block mt-1">{row.itemName}</strong>
                          <span className="text-xs text-ink/60 mt-0.5 block">Client: {row.clientName}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-paper rounded text-[8px] font-bold uppercase border text-ink/50">
                          {row.category}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                        <div className="text-[10px] text-ink/40">
                          <span>Qty: <strong>{row.quantity}</strong> @ <strong>{formatCurrency(row.unitPrice, currencySymbol)}</strong></span>
                          <span className="block mt-0.5">Handler: {row.salesPerson}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-brand">
                          {formatCurrency(row.lineTotal, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-black/5 no-print">
              {/* Record counts */}
              <p className="text-xs text-ink/40">
                Weekly Ledger: Showing <strong className="text-ink">{(activePage - 1) * pageSize + 1}</strong> to <strong className="text-ink">{Math.min(activePage * pageSize, totalRecords)}</strong> of <strong className="text-ink">{totalRecords}</strong> transaction lines.
              </p>

              <div className="flex items-center gap-3">
                {/* Custom Page size downbox */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-ink/40 uppercase font-semibold">Page size:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-1 px-1.5 bg-paper border border-black/5 text-[10px] font-bold rounded-lg focus:outline-none"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Paginate Buttons selection */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="p-1.5 bg-paper hover:bg-black/5 text-ink/60 disabled:opacity-30 disabled:hover:bg-paper rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold font-mono text-ink/60 bg-paper px-2.5 py-1 rounded-lg">
                    {activePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    className="p-1.5 bg-paper hover:bg-black/5 text-ink/60 disabled:opacity-30 disabled:hover:bg-paper rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
