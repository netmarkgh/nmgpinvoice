import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { Search, LayoutGrid, List, BarChart3, Package, Filter, RotateCcw, Hash } from 'lucide-react';

export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Match YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const day = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  // Fallback to general Date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

export function filterByDateRange(data: any[], selectedFilter: string, customStart?: string, customEnd?: string) {
  if (selectedFilter === 'all') return data;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  let start: Date | null = null;
  let end: Date | null = null;
  
  switch (selectedFilter) {
    case 'today':
      start = todayStart;
      end = todayEnd;
      break;
    case 'yesterday':
      start = new Date(todayStart);
      start.setDate(start.getDate() - 1);
      end = new Date(todayEnd);
      end.setDate(end.getDate() - 1);
      break;
    case 'last7days':
      start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      end = todayEnd;
      break;
    case 'last30days':
      start = new Date(todayStart);
      start.setDate(start.getDate() - 29);
      end = todayEnd;
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'custom':
      start = customStart ? parseLocalDate(customStart) : null;
      end = customEnd ? parseLocalDate(customEnd) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      break;
    default:
      return data;
  }
  
  return data.filter(r => {
    const itemDateStr = r.invoices?.inv_date || r.invoices?.created_at || r.createdAt || r.date || r.invoiceDate || r.timestamp;
    if (!itemDateStr) return false;
    const itemDate = parseLocalDate(itemDateStr);
    if (!itemDate) return false;
    
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    return true;
  });
}

export function filterByClient(data: any[], selectedClient: string) {
  if (!selectedClient || selectedClient === 'all') return data;
  const target = selectedClient.trim().toLowerCase();
  return data.filter(r => {
    const clientName = (r.invoices?.client_name || r.client || r.customer || r.buyer || r.customerName || r.clientName || '').trim().toLowerCase();
    return clientName === target;
  });
}

export function filterByInvoiceRef(data: any[], refQuery: string) {
  if (!refQuery || !refQuery.trim()) return data;
  const query = refQuery.trim().toLowerCase();
  return data.filter(r => {
    const ref = (r.invoices?.inv_number || r.invoiceRef || r.reference || r.invoiceNumber || r.invoiceId || r.ref || '').trim().toLowerCase();
    return ref.includes(query);
  });
}

export function applyFilters(data: any[], filters: {
  dateFilter: string;
  customStart?: string;
  customEnd?: string;
  selectedClient: string;
  invoiceQuery: string;
}) {
  let result = data;
  result = filterByDateRange(result, filters.dateFilter, filters.customStart, filters.customEnd);
  result = filterByClient(result, filters.selectedClient);
  result = filterByInvoiceRef(result, filters.invoiceQuery);
  return result;
}

export function ItemsSoldView() {
  const { profile, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'item' | 'client'>('item');

  // Filter States
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [invoiceReferenceQuery, setInvoiceReferenceQuery] = useState('');

  const isAdmin = profile?.role === 'admin';
  const canManageItems = isAdmin || profile?.permissions?.includes('can_manage_items');
  const canUseAdvancedFilters = isAdmin || profile?.permissions?.includes('can_use_advanced_items_filters');

  useEffect(() => {
    if (!canManageItems) return;
    async function fetchItems() {
      let q = supabase.from('invoice_items').select('description, quantity, unit_price, amount, invoices(user_id, client_name, inv_number, inv_date, created_at, currency)');
      if (!isAdmin) q = q.eq('invoices.user_id', user.id);
      
      const { data: rows, error } = await q;
      if (error) return;
      
      // Filter out mismatches from join
      const formatted = (rows || []).map((r: any) => ({
        ...r,
        invoices: Array.isArray(r.invoices) ? r.invoices[0] : r.invoices
      }));
      setData(formatted.filter(r => r.invoices && (isAdmin || r.invoices.user_id === user?.id)));
      setLoading(false);
    }
    fetchItems();
  }, [user.id, isAdmin, canManageItems]);

  const uniqueClients = React.useMemo(() => {
    const clients = new Set<string>();
    data.forEach(r => {
      const clientName = r.invoices?.client_name || r.client || r.customer || r.buyer || r.customerName || r.clientName;
      if (clientName) {
        clients.add(clientName.trim());
      }
    });
    return Array.from(clients).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = React.useMemo(() => {
    let result = data;
    if (canUseAdvancedFilters) {
      result = applyFilters(data, {
        dateFilter: selectedDateFilter,
        customStart: customStartDate,
        customEnd: customEndDate,
        selectedClient: selectedClient,
        invoiceQuery: invoiceReferenceQuery,
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(r => 
        r.description?.toLowerCase().includes(q) ||
        r.invoices?.client_name?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [data, selectedDateFilter, customStartDate, customEndDate, selectedClient, invoiceReferenceQuery, search, canUseAdvancedFilters]);

  const totalQty = React.useMemo(() => {
    return filtered.reduce((s, r) => s + (r.quantity || 0), 0);
  }, [filtered]);

  const totalVal = React.useMemo(() => {
    return filtered.reduce((s, r) => s + (r.amount || 0), 0);
  }, [filtered]);

  const handleResetFilters = () => {
    setSelectedDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedClient('all');
    setInvoiceReferenceQuery('');
    setSearch('');
  };

  const hasActiveFilters = selectedDateFilter !== 'all' || selectedClient !== 'all' || invoiceReferenceQuery.trim() !== '' || search.trim() !== '';

  const getDateFilterLabel = (filterType: string, start?: string, end?: string) => {
    switch (filterType) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7days': return 'Last 7 Days';
      case 'last30days': return 'Last 30 Days';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'custom':
        if (start && end) return `${start} to ${end}`;
        if (start) return `Since ${start}`;
        if (end) return `Before ${end}`;
        return 'Custom Range';
      default: return 'All Dates';
    }
  };

  const renderContent = () => {
    if (groupBy === 'item') {
      const grouped: any = {};
      filtered.forEach(r => {
        const key = r.description?.trim() || 'Unnamed Item';
        if (!grouped[key]) grouped[key] = { desc: key, qty: 0, amount: 0, clients: new Set(), invoiceCount: 0 };
        grouped[key].qty += r.quantity;
        grouped[key].amount += r.amount;
        if (r.invoices?.client_name) {
          grouped[key].clients.add(r.invoices.client_name);
        }
        grouped[key].invoiceCount++;
      });
      
      return Object.values(grouped).sort((a: any, b: any) => b.amount - a.amount).map((g: any) => (
        <div key={g.desc} className="bg-white border border-black/5 p-6 rounded-2xl flex items-center justify-between group hover:border-brand/40 transition-all shadow-sm">
          <div>
            <div className="font-bold text-ink">{g.desc}</div>
            <div className="text-[10px] text-ink/40 mt-1 uppercase tracking-tight flex items-center gap-2">
              <span className="text-brand font-bold">{g.invoiceCount} Sales</span> · {Array.from(g.clients).join(', ') || 'Unknown Client'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono text-brand text-lg">{formatCurrency(g.amount, profile?.currency)}</div>
            <div className="text-[10px] text-ink/40 font-bold uppercase tracking-widest mt-1">Total Qty: {g.qty}</div>
          </div>
        </div>
      ));
    } else {
      const grouped: any = {};
      filtered.forEach(r => {
        const key = r.invoices?.client_name || 'Unknown Client';
        if (!grouped[key]) grouped[key] = { client: key, items: [], amount: 0 };
        grouped[key].items.push(r);
        grouped[key].amount += r.amount;
      });
      
      return Object.values(grouped).sort((a: any, b: any) => b.amount - a.amount).map((g: any) => (
        <div key={g.client} className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <div className="font-bold text-ink">{g.client}</div>
             <div className="text-right">
               <div className="font-bold font-mono text-brand text-lg">{formatCurrency(g.amount, profile?.currency)}</div>
               <div className="text-[9px] text-ink/40 font-bold uppercase tracking-widest leading-none">{g.items.length} items</div>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest">Item</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Qty</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Value</th>
                    <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-widest text-right">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {g.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 text-xs text-ink/70">{it.description}</td>
                      <td className="py-2.5 text-xs text-ink font-bold text-right">{it.quantity}</td>
                      <td className="py-2.5 text-xs text-brand font-mono font-bold text-right">{formatCurrency(it.amount, profile?.currency)}</td>
                      <td className="py-2.5 text-[10px] text-ink/30 font-mono text-right">{it.invoices?.inv_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      ));
    }
  };

  if (!canManageItems) {
    return (
      <div className="p-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
          <Package className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Access Restricted</h1>
        <p className="text-ink/40 max-w-sm mx-auto">
          You do not have the <span className="font-bold text-ink/60">can_manage_items</span> permission required to view the items sold report. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Items Sold</h1>
          <p className="text-ink/40 text-sm mt-1">Inventory tracking and sales performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or clients..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div className="bg-white border border-black/5 p-1 rounded-xl flex gap-1">
             <button 
              onClick={() => setGroupBy('item')}
              className={cn("flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex items-center justify-center", groupBy === 'item' ? "bg-brand text-white shadow-sm" : "hover:bg-paper text-ink/40")}
             >
               <Package className="w-4 h-4" />
               <span className="sm:hidden ml-2 text-xs font-bold uppercase tracking-wider">By Item</span>
             </button>
             <button 
              onClick={() => setGroupBy('client')}
              className={cn("flex-1 sm:flex-none p-1.5 rounded-lg transition-all flex items-center justify-center", groupBy === 'client' ? "bg-brand text-white shadow-sm" : "hover:bg-paper text-ink/40")}
             >
               <BarChart3 className="w-4 h-4" />
               <span className="sm:hidden ml-2 text-xs font-bold uppercase tracking-wider">By Client</span>
             </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {canUseAdvancedFilters && (
        <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl mb-6 space-y-4 shadow-sm no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-wider font-bold text-ink/40 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand" /> Advanced Filters
            </div>
            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin-reverse" /> Reset All Filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Date Period</label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand text-ink font-medium"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Client Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client / Customer</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand text-ink font-medium"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Invoice Ref Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Invoice Reference</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input 
                  type="text"
                  value={invoiceReferenceQuery}
                  onChange={(e) => setInvoiceReferenceQuery(e.target.value)}
                  placeholder="Filter by Invoice Ref..."
                  className="w-full pl-9 pr-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand text-ink font-medium"
                />
              </div>
            </div>
          </div>

          {/* Conditional Custom Date Range Pickers */}
          {selectedDateFilter === 'custom' && (
            <div className="pt-2 border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand text-ink font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand text-ink font-medium"
                />
              </div>
            </div>
          )}

          {/* Active Filter Pills (Bonus Enhancement) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
              {selectedDateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/5 font-semibold text-brand rounded-full text-[10px] uppercase tracking-wide">
                  <span>Date: {getDateFilterLabel(selectedDateFilter, customStartDate, customEndDate)}</span>
                  <button onClick={() => setSelectedDateFilter('all')} className="hover:text-ink transition-colors font-bold text-xs leading-none">&times;</button>
                </span>
              )}
              {selectedClient !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/5 font-semibold text-brand rounded-full text-[10px] uppercase tracking-wide">
                  <span>Client: {selectedClient}</span>
                  <button onClick={() => setSelectedClient('all')} className="hover:text-ink transition-colors font-bold text-xs leading-none">&times;</button>
                </span>
              )}
              {invoiceReferenceQuery.trim() !== '' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/5 font-semibold text-brand rounded-full text-[10px] uppercase tracking-wide">
                  <span>Ref: {invoiceReferenceQuery}</span>
                  <button onClick={() => setInvoiceReferenceQuery('')} className="hover:text-ink transition-colors font-bold text-xs leading-none">&times;</button>
                </span>
              )}
              {search.trim() !== '' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/5 font-semibold text-brand rounded-full text-[10px] uppercase tracking-wide">
                  <span>Search: {search}</span>
                  <button onClick={() => setSearch('')} className="hover:text-ink transition-colors font-bold text-xs leading-none">&times;</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Lines</div>
           <div className="text-2xl font-bold text-ink">{filtered.length}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Qty</div>
           <div className="text-2xl font-bold text-brand">{totalQty}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm sm:col-span-2 md:col-span-1">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total Value</div>
           <div className="text-2xl font-bold font-mono text-brand">{formatCurrency(totalVal, profile?.currency)}</div>
        </div>
      </div>

      {/* Main List / Content */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-ink/20 font-bold">Scanning records...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-black/10 p-16 md:p-20 rounded-2xl text-center space-y-4">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
               <Package className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-ink text-base">No matching sales found</h3>
             <p className="text-sm text-ink/40 max-w-xs mx-auto">Try adjusting your filters, searching for something else, or resetting all search conditions.</p>
             <button
               onClick={handleResetFilters}
               className="mt-2 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
             >
               Reset All Filters
             </button>
          </div>
        ) : renderContent()}
      </div>
    </div>
  );
}

