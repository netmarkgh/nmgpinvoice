import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { Search, LayoutGrid, List, BarChart3, Package, Filter, RotateCcw, Hash, Info, FileText, ChevronRight, DollarSign, Sparkles } from 'lucide-react';
import { SalesAnalytics } from '../components/SalesAnalytics';
import { InventoryIntelligence } from '../components/InventoryIntelligence';
import { SalesDrillDown } from '../components/SalesDrillDown';
import { getProductCategory } from '../lib/drillDownEngine';
import { SmartGlobalSearch, HighlightText } from '../components/SmartGlobalSearch';
import { generateSmartSearchEngine } from '../lib/searchEngine';
import { isUXEnhancedEnabled, isAIInsightsEnabled, isMobileQuickActionsEnabled } from '../lib/visualEngine';
import { getDaysObserved, generateInventoryIntelligence } from '../lib/inventoryEngine';
import { SmartAIInsightsView } from '../components/SmartAIInsightsView';
import { MobileQuickActionsContainer } from '../components/MobileQuickActionsContainer';
import { 
  StatusBadge, 
  InteractiveTooltip, 
  PolishedKPICard, 
  DecorativeProgressBar, 
  EmptyStateView, 
  QuickVisualSummaryStrip 
} from '../components/VisualUXHelpers';

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
  const [activeSection, setActiveSection] = useState<'analytics' | 'records' | 'inventory' | 'intelligence'>('analytics');
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(isAIInsightsEnabled());
  const [mobileQuickActionsEnabled, setMobileQuickActionsEnabled] = useState(isMobileQuickActionsEnabled());

  useEffect(() => {
    const handleToggle = () => {
      setAiInsightsEnabled(isAIInsightsEnabled());
    };
    window.addEventListener('ai_insights_toggled', handleToggle);
    return () => window.removeEventListener('ai_insights_toggled', handleToggle);
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setMobileQuickActionsEnabled(isMobileQuickActionsEnabled());
    };
    window.addEventListener('mobile_quick_actions_toggled', handleToggle);
    return () => window.removeEventListener('mobile_quick_actions_toggled', handleToggle);
  }, []);

  const isAdmin = profile?.role === 'admin';
  const canManageItems = isAdmin || profile?.permissions?.includes('can_manage_items');
  const canUseAdvancedFilters = isAdmin || profile?.permissions?.includes('can_use_advanced_items_filters');
  const canAccessSalesAnalytics = isAdmin || profile?.permissions?.includes('can_access_sales_analytics');
  const canAccessInventoryIntelligence = isAdmin || profile?.permissions?.includes('can_access_inventory_intelligence');
  const canUseSalesDrillDown = isAdmin || profile?.permissions?.includes('can_use_sales_drill_down');
  const canUseSmartGlobalSearch = isAdmin || profile?.permissions?.includes('can_use_smart_global_search');

  // Drilldown Modal Configuration
  const [drillDownConfig, setDrillDownConfig] = useState<{ type: 'item' | 'client' | 'category'; targetValue: string } | null>(null);

  // Fallback activeSection based on available user permissions to prevent unauthorized or empty views
  useEffect(() => {
    if (activeSection === 'analytics' && !canAccessSalesAnalytics) {
      if (canAccessInventoryIntelligence) {
        setActiveSection('inventory');
      } else {
        setActiveSection('records');
      }
    } else if (activeSection === 'inventory' && !canAccessInventoryIntelligence) {
      if (canAccessSalesAnalytics) {
        setActiveSection('analytics');
      } else {
        setActiveSection('records');
      }
    }
  }, [canAccessSalesAnalytics, canAccessInventoryIntelligence, activeSection]);

  const fetchItems = async () => {
    if (!canManageItems) return;
    setLoading(true);
    const relationSelect = !isAdmin ? 'invoices!inner' : 'invoices';
    let q = supabase.from('invoice_items').select(`description, quantity, unit_price, amount, ${relationSelect}(user_id, client_name, client_phone, inv_number, inv_date, created_at, currency, reference, status, pay_method, note)`);
    if (!isAdmin) q = q.eq('invoices.user_id', user.id);
    
    const { data: rows, error } = await q;
    if (error) {
      setLoading(false);
      return;
    }
    
    const formatted = (rows || []).map((r: any) => ({
      ...r,
      invoices: Array.isArray(r.invoices) ? r.invoices[0] : r.invoices
    }));
    setData(formatted.filter(r => r.invoices && (isAdmin || r.invoices.user_id === user?.id)));
    setLoading(false);
  };

  useEffect(() => {
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
      if (canUseSmartGlobalSearch) {
        const engineResult = generateSmartSearchEngine(result, search, user.id);
        result = engineResult.results;
      } else {
        const q = search.toLowerCase().trim();
        result = result.filter(r => 
          r.description?.toLowerCase().includes(q) ||
          r.invoices?.client_name?.toLowerCase().includes(q)
        );
      }
    }
    
    return result;
  }, [data, selectedDateFilter, customStartDate, customEndDate, selectedClient, invoiceReferenceQuery, search, canUseAdvancedFilters, canUseSmartGlobalSearch, user.id]);

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

  const isEnhanced = isUXEnhancedEnabled();

  const daysObserved = React.useMemo(() => {
    return getDaysObserved(filtered, selectedDateFilter, customStartDate, customEndDate);
  }, [filtered, selectedDateFilter, customStartDate, customEndDate]);

  const inventoryIntelligence = React.useMemo(() => {
    return generateInventoryIntelligence(filtered, user?.id, daysObserved, isAdmin);
  }, [filtered, user?.id, daysObserved, isAdmin]);

  const allRawInvoices = React.useMemo(() => {
    const map = new Map();
    data.forEach(item => {
      if (item.invoices && item.invoices.inv_number) {
        map.set(item.invoices.inv_number, item.invoices);
      }
    });
    return Array.from(map.values());
  }, [data]);

  const sparklineData = React.useMemo(() => {
    if (filtered.length === 0) return [0, 0, 0, 0, 0];
    const sorted = [...filtered].sort((a,b) => {
      const da = new Date(a.invoices?.inv_date || a.invoices?.created_at || 0).getTime();
      const db = new Date(b.invoices?.inv_date || b.invoices?.created_at || 0).getTime();
      return da - db;
    });
    const chunkSize = Math.max(1, Math.ceil(sorted.length / 5));
    const chunks = [];
    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chunk = sorted.slice(i, i + chunkSize);
      const sum = chunk.reduce((s, r) => s + (r.amount || 0), 0);
      chunks.push(sum);
    }
    while (chunks.length < 5) chunks.push(0);
    return chunks;
  }, [filtered]);

  const topCategoryAndStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(item => {
      const cat = getProductCategory(item.description || '');
      counts[cat] = (counts[cat] || 0) + (item.amount || 0);
    });
    let topCat = '';
    let maxAmt = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxAmt) {
        maxAmt = val;
        topCat = cat;
      }
    });
    return { topCat, topCatAmount: maxAmt };
  }, [filtered]);

  const fastSellersCount = React.useMemo(() => {
    const itemUnits: Record<string, number> = {};
    filtered.forEach(r => {
      const d = r.description?.trim();
      if (d) itemUnits[d] = (itemUnits[d] || 0) + (r.quantity || 0);
    });
    return Object.values(itemUnits).filter(qty => qty >= 25).length;
  }, [filtered]);

  const lowStockCount = React.useMemo(() => {
    return (inventoryIntelligence?.urgencySummary?.lowCount || 0) + (inventoryIntelligence?.urgencySummary?.criticalCount || 0);
  }, [inventoryIntelligence]);

  const oversoldCount = React.useMemo(() => {
    return inventoryIntelligence?.urgencySummary?.oversoldCount || 0;
  }, [inventoryIntelligence]);

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
        <div 
          key={g.desc} 
          onClick={() => {
            if (canUseSalesDrillDown) {
              setDrillDownConfig({ type: 'item', targetValue: g.desc });
            }
          }}
          className={cn(
            "bg-white border border-black/5 p-6 rounded-2xl flex items-center justify-between group transition-all shadow-sm",
            canUseSalesDrillDown ? "cursor-pointer hover:border-brand/40 hover:shadow-md" : ""
          )}
        >
          <div className="space-y-1 bg-transparent">
            <div className="font-bold text-ink flex items-center gap-2">
              <HighlightText text={g.desc} highlight={search} />
              {isEnhanced && g.qty >= 25 && (
                <StatusBadge type="FAST_SELLER" />
              )}
              {canUseSalesDrillDown && !isEnhanced && (
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-brand/5 px-1.5 py-0.5 rounded ml-1">
                  Inspect Drill-down ↗
                </span>
              )}
            </div>
            {isEnhanced && (
              <div className="w-48">
                <DecorativeProgressBar current={g.qty} max={250} title="Sales Velocity" subLabel={String(g.qty)} />
              </div>
            )}
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
             <div 
               onClick={() => {
                 if (canUseSalesDrillDown) {
                   setDrillDownConfig({ type: 'client', targetValue: g.client });
                 }
               }}
               className={cn(
                 "font-bold text-ink group/h flex items-center gap-2",
                 canUseSalesDrillDown ? "cursor-pointer hover:text-brand" : ""
               )}
             >
               <HighlightText text={g.client} highlight={search} />
               {isEnhanced && g.amount >= 1000 && (
                 <StatusBadge type="TOP_CLIENT" />
               )}
               {canUseSalesDrillDown && !isEnhanced && (
                 <span className="text-[9px] font-bold text-brand uppercase tracking-wider opacity-0 group-hover/h:opacity-100 transition-opacity bg-brand/5 px-1.5 py-0.5 rounded">
                   Purchase Ledger ↗
                 </span>
               )}
             </div>
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
                    <tr key={idx} className="group/row">
                      <td 
                        onClick={() => {
                          if (canUseSalesDrillDown) {
                            setDrillDownConfig({ type: 'item', targetValue: it.description });
                          }
                        }}
                        className={cn(
                          "py-2.5 text-xs text-left",
                          canUseSalesDrillDown ? "cursor-pointer hover:underline text-brand font-bold" : "text-ink/70"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <HighlightText text={it.description} highlight={search} />
                          {isEnhanced && it.invoices?.status && (
                            <StatusBadge type={it.invoices.status} />
                          )}
                          {canUseSalesDrillDown && !isEnhanced && (
                            <span className="text-[8px] text-ink/30 font-semibold ml-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              (Inspect item)
                            </span>
                          )}
                        </div>
                      </td>
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
      {/* FEATURE 10 - STICKY ACTION BAR */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/5 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-8 shadow-sm no-print flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Items Sold</h1>
            <p className="text-ink/40 text-sm mt-1">Inventory tracking and sales performance</p>
            
            {(canAccessSalesAnalytics || canAccessInventoryIntelligence) && (
              <div className="bg-paper p-0.5 rounded-xl border border-black/5 flex flex-wrap text-xs font-bold uppercase mt-4 w-fit no-print gap-1">
                {aiInsightsEnabled && (
                  <button 
                    onClick={() => setActiveSection('intelligence')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", 
                      activeSection === 'intelligence' ? "bg-indigo-650 text-white shadow-sm bg-indigo-650" : "text-indigo-600 hover:text-indigo-800"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-505" /> AI Intelligence
                  </button>
                )}
                {canAccessSalesAnalytics && (
                  <button 
                    onClick={() => setActiveSection('analytics')}
                    className={cn("px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", activeSection === 'analytics' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Analytics Dashboard
                  </button>
                )}
                {canAccessInventoryIntelligence && (
                  <button 
                    onClick={() => setActiveSection('inventory')}
                    className={cn("px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", activeSection === 'inventory' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                  >
                    <Package className="w-3.5 h-3.5" /> Inventory Intelligence
                  </button>
                )}
                <button 
                  onClick={() => setActiveSection('records')}
                  className={cn("px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", activeSection === 'records' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                >
                  <List className="w-3.5 h-3.5" /> Detailed Ledger
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
            {canUseSmartGlobalSearch ? (
              <div className="w-full sm:w-80 md:w-[420px] no-print">
                <SmartGlobalSearch
                  value={search}
                  onChange={setSearch}
                  filteredRawData={data}
                  userId={user.id}
                />
              </div>
            ) : (
              <div className="relative flex-1 sm:flex-none p-2 md:p-0 no-print">
                <Search className="absolute left-5 md:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items or clients..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                />
              </div>
            )}
            {activeSection === 'records' && (
              <div className="bg-white border border-black/5 p-1 rounded-xl flex gap-1 no-print">
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
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 11 - QUICK VISUAL SUMMARY STRIP */}
      {isEnhanced && (
        <div className="mb-8">
          <QuickVisualSummaryStrip 
            fastSellersCount={fastSellersCount}
            lowStockCount={lowStockCount}
            oversoldCount={oversoldCount}
            topCategory={topCategoryAndStats.topCat}
            onActionClick={(action) => {
              if (action === 'inventory' && canAccessInventoryIntelligence) {
                setActiveSection('inventory');
              } else if (action === 'records') {
                setActiveSection('records');
              }
            }}
          />
        </div>
      )}

      {canUseSmartGlobalSearch && search.trim() && (
        <div className="mb-6 bg-brand/5 border border-brand/15 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-brand font-medium no-print">
          <div className="flex flex-wrap items-center gap-2">
            <span>Matches: <strong className="font-mono text-sm bg-brand/10 px-2.5 py-0.5 rounded-lg text-brand-dark font-extrabold">{filtered.length}</strong> items sold rows for query <strong className="underline font-bold">"{search}"</strong>.</span>
            {(() => {
              const engineStats = generateSmartSearchEngine(data, search, user.id);
              if (engineStats.metadata.matchedFields.length > 0) {
                return (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-ink/40 font-bold ml-1">Matched dimensions:</span>
                    {engineStats.metadata.matchedFields.map(f => (
                      <span key={f} className="bg-brand/15 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider text-brand">{f}</span>
                    ))}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <button
            onClick={() => setSearch('')}
            className="text-[10px] bg-brand text-white px-3.5 py-2 rounded-xl font-black uppercase tracking-wider hover:bg-brand/90 transition-all shadow-sm shrink-0 self-end sm:self-auto"
          >
            Clear Search
          </button>
        </div>
      )}
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

      {aiInsightsEnabled && activeSection === 'intelligence' ? (
        loading ? (
          <div className="p-20 text-center animate-pulse text-indigo-500/20 font-bold">Summoning Smart CoPilot...</div>
        ) : (
          <SmartAIInsightsView
            filteredData={filtered}
            userId={user ? user.id : 'global'}
            daysObserved={daysObserved}
            isAdmin={isAdmin}
            inventoryIntelligence={inventoryIntelligence}
            onDrilldownAction={(type, val) => {
              if (canUseSalesDrillDown) {
                setDrillDownConfig({ type, targetValue: val });
              }
            }}
            onNavigateSection={(sec) => {
              setActiveSection(sec);
            }}
          />
        )
      ) : canAccessSalesAnalytics && activeSection === 'analytics' ? (
        loading ? (
          <div className="p-20 text-center animate-pulse text-ink/20 font-bold">Scanning records...</div>
        ) : (
          <SalesAnalytics 
            filteredData={filtered} 
            currencySymbol={profile?.currency} 
            searchQuery={search}
            onInspect={(type, val) => {
              if (canUseSalesDrillDown) {
                setDrillDownConfig({ type, targetValue: val });
              }
            }}
          />
        )
      ) : canAccessInventoryIntelligence && activeSection === 'inventory' ? (
        loading ? (
          <div className="p-20 text-center animate-pulse text-ink/20 font-bold">Initializing Inventory...</div>
        ) : (
          <InventoryIntelligence 
            filteredData={filtered} 
            userProfile={profile} 
            selectedFilter={selectedDateFilter}
            customStart={customStartDate}
            customEnd={customEndDate}
            onSelectProductFilter={(prodName) => {
              setSearch(prodName);
              setActiveSection('records');
            }}
            currencySymbol={profile?.currency}
            onInspectItem={(itemName) => {
              if (canUseSalesDrillDown) {
                setDrillDownConfig({ type: 'item', targetValue: itemName });
              }
            }}
          />
        )
      ) : (
        <>
          {/* Summary Metrics */}
          {isEnhanced ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              <PolishedKPICard 
                title="Total Ledger Lines"
                value={filtered.length}
                icon={<List className="w-5 h-5 text-indigo-500" />}
                comparisonValue="Records matching search"
                tooltip="The absolute count of invoice item entries adhering to active visual criteria."
              />
              <PolishedKPICard 
                title="Total Units Sold"
                value={totalQty}
                icon={<Package className="w-5 h-5 text-amber-500" />}
                trend={{ type: totalQty > 0 ? 'up' : 'stable', value: 'Volume track' }}
                comparisonValue="Sum of items' quantities"
                tooltip="Sum cumulative shipping weight units calculated dynamically."
              />
              <PolishedKPICard 
                title="Total Value (Revenue)"
                value={formatCurrency(totalVal, profile?.currency)}
                icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                trend={{ type: totalVal >= topCategoryAndStats.topCatAmount / 2 ? 'up' : 'down', value: 'Revenue pace' }}
                sparklineData={sparklineData}
                comparisonValue={`Top cat: ${topCategoryAndStats.topCat || 'None'}`}
                statusColor="text-emerald-600"
                tooltip="Aggregated net transaction currency value for current selections."
              />
            </div>
          ) : (
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
          )}

          {/* Main List / Content */}
          <div className="grid gap-4">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-ink/20 font-bold">Scanning records...</div>
            ) : filtered.length === 0 ? (
              isEnhanced ? (
                <EmptyStateView 
                  type="search" 
                  onReset={handleResetFilters}
                  title="No Ledger Records Match Search"
                />
              ) : (
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
              )
            ) : renderContent()}
          </div>
        </>
      )}

      {drillDownConfig && (
        <SalesDrillDown 
          filteredData={filtered} 
          type={drillDownConfig.type} 
          targetValue={drillDownConfig.targetValue} 
          currencySymbol={profile?.currency}
          onClose={() => setDrillDownConfig(null)}
        />
      )}

      {mobileQuickActionsEnabled && (
        <MobileQuickActionsContainer
          filteredData={filtered}
          allRawInvoices={allRawInvoices}
          userId={user.id}
          inventoryIntelligence={inventoryIntelligence}
          onInvoiceAdded={() => {
            fetchItems();
          }}
          onStockUpdated={() => {
            fetchItems();
          }}
          onApplyFilters={(config) => {
            if (config.dateFilter !== undefined) setSelectedDateFilter(config.dateFilter);
            if (config.clientId !== undefined) setSelectedClient(config.clientId);
            if (config.searchQuery !== undefined) setSearch(config.searchQuery);
          }}
          onDrillDown={(type, value) => {
            if (canUseSalesDrillDown) {
              setDrillDownConfig({ type, targetValue: value });
            }
          }}
          onExportAction={(format) => {
            if (format === 'csv') {
              const headers = ["Invoice Ref", "Client Name", "Item Description", "Quantity", "Price", "Amount", "Date", "Status"];
              const rows = filtered.map(r => [
                r.invoices?.inv_number || '',
                r.invoices?.client_name || '',
                r.description || '',
                r.quantity || '',
                r.unit_price || '',
                r.amount || '',
                r.invoices?.inv_date || '',
                r.invoices?.status || ''
              ]);
              const content = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `Invoice_Dashboard_Summary_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } else {
              window.print();
            }
          }}
          onRefreshAll={async () => {
            await fetchItems();
          }}
          currentFilters={{
            dateFilter: selectedDateFilter,
            client: selectedClient,
            searchQuery: search
          }}
        />
      )}
    </div>
  );
}

