import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  Smartphone, 
  Share2, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Sparkles, 
  Mic, 
  CheckCircle, 
  ArrowRight,
  User,
  ShoppingBag,
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { getStoredStocks, saveStoredStock } from '../lib/inventoryEngine';
import { getProductCategory } from '../lib/drillDownEngine';
import { 
  generateMobileQuickActions, 
  updateMobileShortcuts, 
  getMobileShortcuts,
  QuickActionItem
} from '../lib/mobileQuickActionEngine';

interface MobileQuickActionsContainerProps {
  filteredData: any[];
  allRawInvoices: any[];
  userId: string;
  inventoryIntelligence?: any;
  onInvoiceAdded: () => void;
  onStockUpdated: () => void;
  onApplyFilters: (config: {
    dateFilter?: string;
    clientId?: string;
    status?: string;
    searchQuery?: string;
  }) => void;
  onDrillDown: (type: 'item' | 'client' | 'category', value: string) => void;
  onExportAction: (format: 'pdf' | 'csv' | 'excel' | 'print') => void;
  onRefreshAll: () => Promise<void>;
  currentFilters?: {
    dateFilter: string;
    client: string;
    searchQuery: string;
  };
}

export function MobileQuickActionsContainer({
  filteredData,
  allRawInvoices,
  userId,
  inventoryIntelligence,
  onInvoiceAdded,
  onStockUpdated,
  onApplyFilters,
  onDrillDown,
  onExportAction,
  onRefreshAll,
  currentFilters
}: MobileQuickActionsContainerProps) {
  const { user } = useAuth();

  // Active overlay drawer controls
  const [activeModal, setActiveModal] = useState<'sale' | 'stock' | 'search' | 'filters' | 'export' | 'alerts' | null>(null);
  
  // Collapsible Scroll behaviour variables
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  // Quick Action Engine values
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [shortcuts, setShortcuts] = useState(() => getMobileShortcuts());

  // Listen to mobile shortcut local persistence changes
  useEffect(() => {
    const handleShortcutUpdate = () => {
      setShortcuts(getMobileShortcuts());
    };
    window.addEventListener('mobile_shortcuts_updated', handleShortcutUpdate);
    return () => window.removeEventListener('mobile_shortcuts_updated', handleShortcutUpdate);
  }, []);

  // Screen resize detector
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collapsible toolbar on scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setIsCollapsed(true); // scrolling down
      } else {
        setIsCollapsed(false); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract client names and products dynamically from present invoices to populate options
  const clientsList = useMemo(() => {
    const names = new Set<string>();
    allRawInvoices.forEach(inv => {
      if (inv.client_name) names.add(inv.client_name);
    });
    return Array.from(names);
  }, [allRawInvoices]);

  const productsList = useMemo(() => {
    const names = new Set<string>();
    // Default system items
    names.add('Caps');
    names.add('Glass');
    names.add('Yogs Vanilla');
    names.add('Yogs Strawberry');
    names.add('Capsules');
    names.add('Bottles');

    allRawInvoices.forEach(inv => {
      if (inv.invoice_items) {
        inv.invoice_items.forEach((item: any) => {
          if (item.description) names.add(item.description);
        });
      }
    });
    return Array.from(names);
  }, [allRawInvoices]);

  // Master mobile actions calculation
  const masterActions = useMemo(() => {
    return generateMobileQuickActions(
      {
        filteredData,
        inventoryIntelligence
      },
      screenSize,
      {
        isAdmin: true, // Allow UI actions
        canManageItems: true,
        canAccessSalesAnalytics: true
      }
    );
  }, [filteredData, inventoryIntelligence, screenSize]);

  // Collapsible Floating Action Button state
  const [fabExpanded, setFabExpanded] = useState(false);

  // Form State - Quick Sale
  const [saleForm, setSaleForm] = useState({
    client: '',
    item: 'Caps',
    quantity: 1,
    price: 15,
    discount: 0,
    payMethod: 'Mobile Money'
  });
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  // Form State - Quick Stock
  const [stockForm, setStockForm] = useState({
    product: 'Caps',
    addQty: 50,
    reason: 'Restock'
  });
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // Form State - Search Bar and Voice commands
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);

  // Custom filter states
  const [filterDate, setFilterDate] = useState(currentFilters?.dateFilter || 'all');
  const [filterClient, setFilterClient] = useState(currentFilters?.client || 'all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load correct starting product price depending on item selection
  useEffect(() => {
    if (saleForm.item === 'Caps') setSaleForm(p => ({ ...p, price: 15 }));
    else if (saleForm.item === 'Glass') setSaleForm(p => ({ ...p, price: 25 }));
    else if (saleForm.item.includes('Yogs')) setSaleForm(p => ({ ...p, price: 12 }));
    else setSaleForm(p => ({ ...p, price: 20 }));
  }, [saleForm.item]);

  // Quick Add Sale handler
  const handleQuickSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.client.trim()) {
      alert('Client Name is required');
      return;
    }
    setSaleSubmitting(true);
    try {
      // 1. Calculate invoices structure
      const subtotal = saleForm.quantity * saleForm.price;
      const discount = saleForm.discount;
      const total = Math.max(0, subtotal - discount);

      // Generate Invoice Reference No.
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const prevInvs = allRawInvoices.length;
      const nextNo = `INV-${datePart}-${prevInvs + 1001}`;

      // Insert Parent invoice object
      const { data: inv, error: errInv } = await supabase.from('invoices').insert({
        user_id: user ? user.id : userId,
        inv_number: nextNo,
        client_name: saleForm.client,
        client_phone: '0550000000',
        inv_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        subtotal,
        discount,
        discount_type: 'amount',
        discount_value: discount,
        total,
        pay_method: saleForm.payMethod,
        note: 'Submitted via Mobile-Friendly Quick Actions Layer'
      }).select().single();

      if (errInv) throw errInv;

      // Insert Line Item
      await supabase.from('invoice_items').insert({
        invoice_id: inv.id,
        description: saleForm.item,
        quantity: saleForm.quantity,
        unit_price: saleForm.price,
        amount: subtotal,
        sort_order: 0
      });

      // Save custom client persistence
      const existsClient = clientsList.includes(saleForm.client);
      if (!existsClient) {
        await supabase.from('clients').insert({
          user_id: user ? user.id : userId,
          name: saleForm.client,
          phone: '0550000000'
        });
      }

      // Record shortcut trackers
      updateMobileShortcuts({
        recentClient: saleForm.client,
        lastInvoice: nextNo
      });

      // UI Success Alert
      onInvoiceAdded();
      setActiveModal(null);
      
      // Reset Sale form
      setSaleForm({
        client: '',
        item: 'Caps',
        quantity: 1,
        price: 15,
        discount: 0,
        payMethod: 'Mobile Money'
      });
    } catch (err: any) {
      alert(`Error submitting sale: ${err.message}`);
    } finally {
      setSaleSubmitting(false);
    }
  };

  // Quick Add Stock Helper
  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    setStockSubmitting(true);
    try {
      const currentStocks = getStoredStocks(user ? user.id : userId);
      const startingStock = currentStocks[stockForm.product] || 0;
      const finalVal = startingStock + Number(stockForm.addQty);

      saveStoredStock(user ? user.id : userId, stockForm.product, finalVal);

      onStockUpdated();
      setActiveModal(null);
    } catch (err) {
      alert('Error updating stock numbers.');
    } finally {
      setStockSubmitting(false);
    }
  };

  // Quick Refresh Helper
  const [refreshLoading, setRefreshLoading] = useState(false);
  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await onRefreshAll();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setRefreshLoading(false), 500);
    }
  };

  // Filter application handler
  const handleApplyFilters = () => {
    onApplyFilters({
      dateFilter: filterDate,
      clientId: filterClient === 'all' ? undefined : filterClient,
      status: filterStatus === 'all' ? undefined : filterStatus
    });
    setActiveModal(null);
  };

  const handleResetFilters = () => {
    setFilterDate('all');
    setFilterClient('all');
    setFilterStatus('all');
    onApplyFilters({
      dateFilter: 'all',
      clientId: undefined,
      status: undefined
    });
    setActiveModal(null);
  };

  // Mobile Web Speech Recognition Handler
  const handleVoiceTrigger = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API narration/recognition is not supported in this browser environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setVoiceActive(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);

      // Smart Voice Actions trigger matching user voice speech patterns
      const speakLower = speechToText.toLowerCase();
      if (speakLower.includes('create sale') || speakLower.includes('new sale') || speakLower.includes('add invoice')) {
        setTimeout(() => {
          setActiveModal('sale');
        }, 1200);
      } else if (speakLower.includes('add stock') || speakLower.includes('restock') || speakLower.includes('replenish')) {
        setTimeout(() => {
          setActiveModal('stock');
        }, 1200);
      } else {
        // Run as filter search term query update
        onApplyFilters({ searchQuery: speechToText });
        updateMobileShortcuts({
          recentSearches: [speechToText, ...shortcuts.recentSearches.slice(0, 2)]
        });
      }
    };

    recognition.onerror = () => {
      setVoiceActive(false);
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };
  };

  // Keyboard Navigation accessibility hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setFabExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* 1. STICKY BOTTOM QUICK ACTIONS DOCK (collapses elegantly on downwards scrolling) */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/10 shadow-2xl z-40 transition-all duration-300 no-print md:px-6 py-2.5 flex items-center justify-around",
          isCollapsed ? "translate-y-[100%]" : "translate-y-0"
        )}
      >
        {masterActions.responsiveLayout.priorityActions.map((action: QuickActionItem) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === 'sale') setActiveModal('sale');
              else if (action.id === 'stock') setActiveModal('stock');
              else if (action.id === 'search') setActiveModal('search');
              else if (action.id === 'filters') setActiveModal('filters');
              else if (action.id === 'alerts') setActiveModal('alerts');
            }}
            className="flex flex-col items-center justify-center py-2 h-14 min-w-[64px] active:scale-90 transition-transform cursor-pointer relative"
          >
            {/* Action Badges inside circles */}
            {action.badge && (
              <span className="absolute top-1 right-3 bg-rose-500 text-white font-extrabold font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {action.badge}
              </span>
            )}
            <span className="text-2xl select-none leading-none">{action.icon}</span>
            <span className="text-[10px] font-black tracking-tight text-[#111111] uppercase mt-1">
              {action.label}
            </span>
          </button>
        ))}

        {/* More Actions Expand Menu trigger */}
        <button
          onClick={() => setActiveModal('export')}
          className="flex flex-col items-center justify-center py-2 h-14 min-w-[64px] active:scale-95 transition-transform cursor-pointer text-[#111111]"
        >
          <span className="text-xl leading-none">⚙</span>
          <span className="text-[10px] font-black tracking-tight uppercase mt-1">Action Engine</span>
        </button>
      </div>

      {/* 2. FLOATING ACTION BUTTON (Radial Pop Expansion) */}
      {masterActions.visibility.showFloatingFAB && (
        <div className="fixed bottom-20 right-4 z-40 no-print">
          {fabExpanded && (
            <div className="flex flex-col gap-2 mb-3 items-end animate-in fade-in slide-in-from-bottom-6 duration-200">
              <button
                onClick={() => { setActiveModal('sale'); setFabExpanded(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-brand text-white text-xs font-black uppercase rounded-2xl shadow-lg cursor-pointer"
              >
                🧾 Quick Sale
              </button>
              <button
                onClick={() => { setActiveModal('stock'); setFabExpanded(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-black uppercase rounded-2xl shadow-lg cursor-pointer"
              >
                📦 Add Stock
              </button>
              <button
                onClick={() => { handleRefresh(); setFabExpanded(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-xs font-black uppercase rounded-2xl shadow-lg cursor-pointer"
              >
                🔄 Resync Data
              </button>
            </div>
          )}
          
          <button
            onClick={() => setFabExpanded(!fabExpanded)}
            className="w-14 h-14 bg-brand hover:scale-105 active:scale-95 duration-150 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl font-bold cursor-pointer transition-transform"
            aria-label="Expand floating rapid actions panel"
          >
            <Plus className={cn("w-6 h-6 transition-transform duration-200", fabExpanded ? "rotate-45" : "rotate-0")} />
          </button>
        </div>
      )}

      {/* 3. MODAL COMPONENT 1 — QUICK SALE MODAL */}
      {activeModal === 'sale' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <span className="font-black text-xs uppercase tracking-wider text-slate-500">POS Rapid Sale Entry</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSaleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">CLIENT NAME *</label>
                <input
                  required
                  placeholder="e.g. Vivian Yogs"
                  value={saleForm.client}
                  onChange={e => setSaleForm(p => ({ ...p, client: e.target.value }))}
                  className="w-full px-4 py-3 border border-black/10 rounded-2xl text-xs focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">PRODUCT SELECT</label>
                  <select
                    value={saleForm.item}
                    onChange={e => setSaleForm(p => ({ ...p, item: e.target.value }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs bg-white focus:outline-none"
                  >
                    {productsList.map((prod, idx) => (
                      <option key={idx} value={prod}>{prod}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">PAYMENT METHOD</label>
                  <select
                    value={saleForm.payMethod}
                    onChange={e => setSaleForm(p => ({ ...p, payMethod: e.target.value }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Mobile Money">Mobile Money (MoMo)</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank POS">Bank POS Card</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">QTY</label>
                  <input
                    type="number"
                    min="1"
                    value={saleForm.quantity}
                    onChange={e => setSaleForm(p => ({ ...p, quantity: Math.max(1, Number(e.target.value)) }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">UNIT PRICE</label>
                  <input
                    type="number"
                    min="0"
                    value={saleForm.price}
                    onChange={e => setSaleForm(p => ({ ...p, price: Math.max(0, Number(e.target.value)) }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">DISCOUNT</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="GHS 0"
                    value={saleForm.discount}
                    onChange={e => setSaleForm(p => ({ ...p, discount: Math.max(0, Number(e.target.value)) }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Price Calculations Indicator */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-black/[0.03] space-y-1 text-xs">
                <div className="flex justify-between text-ink/40">
                  <span>Subtotal:</span>
                  <span>GHS {(saleForm.quantity * saleForm.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Discount:</span>
                  <span>GHS {saleForm.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-[#111111] border-t border-black/5 pt-1.5 mt-1.5">
                  <span>Total Realized Sale:</span>
                  <span>GHS {Math.max(0, (saleForm.quantity * saleForm.price) - saleForm.discount).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#111111] text-xs font-black uppercase rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saleSubmitting}
                  className="flex-1 py-3 bg-brand text-white text-xs font-black uppercase rounded-2xl hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saleSubmitting ? "Bookkeeping..." : "🎉 Create Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL COMPONENT 2 — QUICK STOCK MODAL */}
      {activeModal === 'stock' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <span className="font-black text-xs uppercase tracking-wider text-amber-600">Inventory Stock Controller</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddStock} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">CHOOSE CATALOG ITEM</label>
                <select
                  value={stockForm.product}
                  onChange={e => setStockForm(p => ({ ...p, product: e.target.value }))}
                  className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs bg-white focus:outline-none"
                >
                  {productsList.map((prod, idx) => (
                    <option key={idx} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">ADD QUANTITY</label>
                  <input
                    type="number"
                    min="1"
                    value={stockForm.addQty}
                    onChange={e => setStockForm(p => ({ ...p, addQty: Math.max(1, Number(e.target.value)) }))}
                    className="w-full px-4 py-3 border border-black/10 rounded-2xl text-xs text-center font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#222222]">ADJUSTMENT REASON</label>
                  <select
                    value={stockForm.reason}
                    onChange={e => setStockForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full px-3 py-3 border border-black/10 rounded-2xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Restock">Replenish Shipment</option>
                    <option value="Audit Adjustment">In-house Audit Correction</option>
                    <option value="Damaged Goods">Remove Damaged Stock</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#111111] text-xs font-black uppercase rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockSubmitting}
                  className="flex-1 py-3 bg-amber-600 text-white text-xs font-black uppercase rounded-2xl hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {stockSubmitting ? 'Adjusting Stock...' : '📦 Replenish Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL COMPONENT 3 — MOBILE SEARCH OVERLAY SHEET */}
      {activeModal === 'search' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col z-50 p-4 no-print animate-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden mt-6 mx-auto flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
              <span className="font-extrabold text-xs text-indigo-600 uppercase">Search Invoices & Stock</span>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-3 text-xs font-bold rounded-xl bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Voice search action banner */}
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type client name, product tag..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onApplyFilters({ searchQuery });
                      updateMobileShortcuts({
                        recentSearches: [searchQuery, ...shortcuts.recentSearches.slice(0, 2)]
                      });
                      setActiveModal(null);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-black/10 rounded-2xl text-xs focus:outline-none focus:bg-white"
                />
                <button
                  onClick={handleVoiceTrigger}
                  className={cn(
                    "p-3 rounded-2xl text-white transition-all cursor-pointer",
                    voiceActive ? "bg-rose-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                  title="Voice Command Search"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              {voiceActive && (
                <div className="text-center text-xs text-rose-500 animate-pulse font-bold bg-rose-50 p-3 rounded-2xl">
                  🎙️ Speaking... Say "Create sale", "Add Stock", or any product keywords.
                </div>
              )}

              {/* Suggestions Section & Shortcuts */}
              <div className="space-y-2 mt-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">RECENT MOBILE SEARCHES</span>
                <div className="flex flex-wrap gap-2">
                  {shortcuts.recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(term);
                        onApplyFilters({ searchQuery: term });
                        setActiveModal(null);
                      }}
                      className="px-3.5 py-1.5 bg-slate-50 border border-black/[0.05] rounded-full text-xs hover:border-brand/40 transition-colors cursor-pointer text-[#111111]"
                    >
                      🔍 {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions shortcut panel */}
              <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">MOBILE QUICK TARGET SHORTCUTS</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-black/[0.02]">
                    <span className="text-[9px] text-ink/30 uppercase font-black">Last Export</span>
                    <div className="font-bold text-[#111111] mt-0.5 truncate">{shortcuts.lastExport}</div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-black/[0.02]">
                    <span className="text-[9px] text-ink/30 uppercase font-black">Recent Client Address</span>
                    <div className="font-bold text-brand mt-0.5 truncate">{shortcuts.recentClient}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-black/5 flex gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  onApplyFilters({ searchQuery: '' });
                }}
                className="flex-1 py-2.5 bg-white border border-black/10 text-xs font-bold rounded-xl"
              >
                Clear Query
              </button>
              <button
                onClick={() => {
                  onApplyFilters({ searchQuery });
                  updateMobileShortcuts({
                    recentSearches: [searchQuery, ...shortcuts.recentSearches.slice(0, 2)]
                  });
                  setActiveModal(null);
                }}
                className="flex-1 py-2.5 bg-brand text-white text-xs font-black uppercase rounded-xl"
              >
                Execute Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL COMPONENT 4 — MOBILE QUICK FILTERS PANEL DRAWER */}
      {activeModal === 'filters' && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-end justify-center z-50 no-print animate-in duration-200">
          <div className="bg-white rounded-t-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-300">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
                <span className="font-black text-xs uppercase tracking-wider text-[#111111]">Mobile Filters Dashboard</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-3 text-xs bg-slate-100 rounded-xl"
              >
                Done
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#111111]">Invoice Date Scope</label>
                <select
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-black/10 rounded-2xl bg-white"
                >
                  <option value="all">All Available Cycles</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>

              {/* Client Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#111111]">Client Account</label>
                <select
                  value={filterClient}
                  onChange={e => setFilterClient(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-black/10 rounded-2xl bg-white"
                >
                  <option value="all">All Clients Combined</option>
                  {clientsList.map((client, idx) => (
                    <option key={idx} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#111111]">Payment Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-black/10 rounded-2xl bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid Receipts</option>
                  <option value="pending">Pending Invoices</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-3 border border-black/15 text-[#111111] font-black uppercase rounded-2xl cursor-pointer bg-white"
                >
                  Reset Layout
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="flex-1 py-3 bg-brand text-white font-black uppercase rounded-2xl hover:opacity-95 cursor-pointer"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL COMPONENT 5 — ACTION REPORT ENGINE EXPORTS/REFRESH MENU */}
      {activeModal === 'export' && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-end justify-center z-50 no-print animate-in duration-200">
          <div className="bg-white rounded-t-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-300">
            <div className="p-5 border-b border-black/5 text-center">
              <span className="font-black text-xs uppercase tracking-widest text-[#111111]">System Export Options</span>
              <p className="text-[10px] text-ink/40 mt-1">Export results matching your active filters and timelines</p>
            </div>

            <div className="p-6 space-y-3.5 text-xs text-slate-800">
              <button
                onClick={() => {
                  onExportAction('pdf');
                  updateMobileShortcuts({ lastExport: 'PDF Invoice Sheet' });
                  setActiveModal(null);
                }}
                className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 text-rose-500" /> Print / Export PDF Document
              </button>

              <button
                onClick={() => {
                  onExportAction('csv');
                  updateMobileShortcuts({ lastExport: 'CSV Transactions list' });
                  setActiveModal(null);
                }}
                className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Download raw CSV Spreadsheet
              </button>

              <button
                onClick={() => {
                  onExportAction('print');
                  updateMobileShortcuts({ lastExport: 'Direct Print Run' });
                  setActiveModal(null);
                }}
                className="w-full p-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-2xl flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Printer className="w-5 h-5 text-indigo-500" /> Send to POS Desk Printer
              </button>

              <button
                onClick={() => {
                  handleRefresh();
                  setActiveModal(null);
                }}
                className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 text-[#111111] font-extrabold rounded-2xl flex items-center gap-3 transition-colors cursor-pointer justify-center"
              >
                {refreshLoading ? (
                  <span className="animate-spin italic">Applying sync...</span>
                ) : (
                  <>🔄 Reload Real-time Database</>
                )}
              </button>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full p-3 bg-[#111111] hover:bg-[#222222] text-white font-black uppercase rounded-2xl text-center cursor-pointer mt-2"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL COMPONENT 6 — LIVE ALERTS DRAWER */}
      {activeModal === 'alerts' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-end md:items-center justify-center z-50 p-4 no-print animate-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600 animate-bounce" />
                <span className="font-black text-xs uppercase tracking-wider text-rose-600">Active Warning Signals ({masterActions.badges.alerts})</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 px-3 bg-white text-xs text-[#222222] rounded-xl font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
              {inventoryIntelligence?.items?.filter((i: any) => i.status === 'low' || i.status === 'critical' || i.status === 'oversold').length === 0 ? (
                <div className="text-center p-12 space-y-2 text-slate-400">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-black">All Catalog items healthy!</p>
                </div>
              ) : (
                inventoryIntelligence?.items?.map((item: any, idx: number) => {
                  const isOversold = item.status === 'oversold';
                  const isCritical = item.status === 'critical';
                  const isLow = item.status === 'low';

                  if (!isLow && !isCritical && !isOversold) return null;

                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border text-xs leading-relaxed flex flex-col justify-between gap-3 shadow-xs",
                        isOversold ? "bg-red-50/50 border-red-200 text-red-700" :
                        isCritical ? "bg-rose-50/50 border-rose-200 text-rose-700" :
                        "bg-amber-50/50 border-amber-200 text-amber-700"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">⚠️</span>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-[#111111] uppercase tracking-tight">
                            {isOversold ? '❌ Oversold Alert' : isCritical ? '🚨 Critical out-of-stock' : '⚠ Low Reserves warning'}
                          </h4>
                          <p className="font-medium text-slate-700">
                            {item.description} has only **{item.remainingStock} units** left.
                            {isOversold && ` oversold by ${item.oversoldBy} units`}
                            {!isOversold && ` Expected exhaustion: ${Math.ceil(item.daysRemaining)} days.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-black/[0.04] pt-2">
                        <button
                          onClick={() => {
                            setStockForm({ product: item.description, addQty: 50, reason: 'Restock' });
                            setActiveModal('stock');
                          }}
                          className="px-3 py-1 bg-white border border-black/10 hover:bg-slate-100 text-[#111111] font-black uppercase rounded-lg text-[10px]"
                        >
                          📦 Add Stock
                        </button>
                        <button
                          onClick={() => {
                            onDrillDown('item', item.description);
                            setActiveModal(null);
                          }}
                          className="px-3 py-1 bg-brand text-white font-black uppercase rounded-lg text-[10px]"
                        >
                          Drill-Down Detail
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
