import React, { useEffect, useState, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckSquare, 
  Trash2, 
  Settings, 
  Layers, 
  Bot, 
  Calendar, 
  ArrowUpRight, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Smartphone, 
  SlidersHorizontal, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { 
  NotificationItem, 
  generateDashboardNotifications, 
  markAlertAsRead, 
  dismissAlert, 
  snoozeAlert, 
  markAllAsRead,
  UserPreferences,
  DEFAULT_PREFERENCES
} from '../lib/notificationEngine';
import { isNotificationsEnabled } from '../lib/visualEngine';
import { supabase } from '../lib/supabase';

interface NotificationCenterProps {
  onNavigate?: (tab: 'dashboard' | 'history' | 'items', actionValue?: string) => void;
  filteredSalesData?: any[]; // For on-the-fly calculations
}

export function NotificationCenter({ onNavigate, filteredSalesData = [] }: NotificationCenterProps) {
  const { user, profile } = useAuth();
  const userId = user ? user.id : 'global';
  const isAdmin = profile?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(`nmg_pref_channels_v1_${userId}`);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [showPrefPanel, setShowPrefPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Core state for computed alerts
  const [notificationState, setNotificationState] = useState<{
    notifications: NotificationItem[];
    unreadCount: number;
    timeline: Record<string, NotificationItem[]>;
    metadata: { critical: number; high: number; normal: number; low: number };
    digest: { newSales: number; lowStocks: number; overdueInvoices: number };
  }>({
    notifications: [],
    unreadCount: 0,
    timeline: { Today: [], Yesterday: [], Older: [] },
    metadata: { critical: 0, high: 0, normal: 0, low: 0 },
    digest: { newSales: 0, lowStocks: 0, overdueInvoices: 0 }
  });

  const [realtimeRows, setRealtimeRows] = useState<any[]>(filteredSalesData);

  // Listen to mobile viewport checks
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Sync rows from parent
  useEffect(() => {
    if (filteredSalesData && filteredSalesData.length > 0) {
      setRealtimeRows(filteredSalesData);
    }
  }, [filteredSalesData]);

  // Read all rows directly from supabase if parent list is empty, ensuring fully resolved alerts list
  useEffect(() => {
    let active = true;
    const loadRealData = async () => {
      if (filteredSalesData && filteredSalesData.length > 0) return;
      const relationSelect = !isAdmin ? 'invoices!inner' : 'invoices';
      const q = supabase.from('invoice_items').select(`description, quantity, unit_price, amount, ${relationSelect}(user_id, client_name, client_phone, inv_number, inv_date, created_at, currency, reference, status, pay_method, note)`);
      
      const { data, error } = await q;
      if (!error && data && active) {
        const formatted = data.map((r: any) => ({
          ...r,
          invoices: Array.isArray(r.invoices) ? r.invoices[0] : r.invoices
        }));
        setRealtimeRows(formatted.filter(r => r.invoices && (isAdmin || r.invoices.user_id === userId)));
      }
    };

    loadRealData();
    return () => {
      active = false;
    };
  }, [userId, isAdmin, filteredSalesData]);

  // Recalculate Master Notification Pipeline when records change, or action mutations occur
  const refreshEngine = () => {
    const results = generateDashboardNotifications(realtimeRows, userId, isAdmin, preferences);
    setNotificationState(results);
  };

  useEffect(() => {
    refreshEngine();
    
    // Wire up custom Event listeners to support real-time reactive updates
    // E.g., when invoice created or payments updated, we listen to transactions mutations
    const handleMutation = () => {
      refreshEngine();
    };

    window.addEventListener('notifications_mutated', handleMutation);
    window.addEventListener('invoice_created', handleMutation);
    window.addEventListener('invoice_payment_completed', handleMutation);
    window.addEventListener('stock_adjusted', handleMutation);
    
    return () => {
      window.removeEventListener('notifications_mutated', handleMutation);
      window.removeEventListener('invoice_created', handleMutation);
      window.removeEventListener('invoice_payment_completed', handleMutation);
      window.removeEventListener('stock_adjusted', handleMutation);
    };
  }, [realtimeRows, userId, isAdmin, preferences]);

  // Close dropdown on Escape key for accessibility support
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleTogglePref = (channelKey: keyof UserPreferences['channels']) => {
    const updated = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channelKey]: !preferences.channels[channelKey]
      }
    };
    setPreferences(updated);
    localStorage.setItem(`nmg_pref_channels_v1_${userId}`, JSON.stringify(updated));
  };

  // Safe navigation routers
  const executeNavigate = (item: NotificationItem) => {
    setIsOpen(false);
    // Mark as read immediately on click
    markAlertAsRead(userId, item.id);
    
    if (!onNavigate) return;

    if (item.actionType === 'restock' || item.actionType === 'adjust_inventory') {
      onNavigate('items', item.actionValue);
    } else if (item.actionType === 'view_invoice') {
      onNavigate('history', item.actionValue);
    } else if (item.actionType === 'view_analytics') {
      onNavigate('dashboard');
    }
  };

  // Filters candidates
  const filteredAlerts = notificationState.notifications.filter(item => {
    // 1. Text Search matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    // 2. Category matching
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return item.unread;
    if (activeFilter === 'critical') return item.severity === 'critical';
    return item.category === activeFilter;
  });

  const isCenterEnabled = isNotificationsEnabled();
  if (!isCenterEnabled) return null;

  return (
    <div className="relative inline-block no-print" id="nmg-notif-hub">
      {/* TRIGGER BELL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-brand/5 hover:border-brand/20 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Toggle Notification Dialog Center"
        aria-expanded={isOpen}
      >
        {notificationState.unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-brand animate-swing" />
        ) : (
          <Bell className="w-5 h-5 text-slate-600" />
        )}
        
        {notificationState.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm animate-pulse">
            {notificationState.unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN ALERTS MODAL CENTER */}
      {isOpen && (
        <>
          {/* Backdrop Clicker */}
          <div 
            className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />

          <div className={cn(
            "fixed inset-x-4 md:absolute bottom-4 md:bottom-auto md:top-12 md:right-0 z-50 bg-white border border-black/10 rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 transform animate-in fade-in slide-in-from-top-4",
            isMobile ? "h-[85vh]" : "w-[440px] max-h-[640px]"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Centralized alerts"
          >
            {/* Header Area */}
            <div className="p-4 bg-slate-50 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand" />
                <h3 className="font-exbold text-xs uppercase tracking-wider text-[#111111] font-black">
                  Business alerts ({notificationState.unreadCount} pending)
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    markAllAsRead(userId);
                    refreshEngine();
                  }}
                  className="p-1 px-2.5 bg-brand/[0.06] hover:bg-brand/10 text-brand text-[10px] font-extrabold rounded-lg hover:opacity-95 transition-all text-center flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Read All
                </button>
                <button
                  onClick={() => setShowPrefPanel(!showPrefPanel)}
                  className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-black/5 transition-all cursor-pointer"
                  title="Channel preferences"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-black/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHANNEL PREFERENCES PREMIUM PANEL */}
            {showPrefPanel && (
              <div className="bg-indigo-50/70 border-b border-indigo-100/50 p-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-indigo-950 tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Notification Channels API
                  </span>
                  <button 
                    onClick={() => setShowPrefPanel(false)}
                    className="text-[9px] text-[#444444] hover:underline font-bold"
                  >
                    Close Settings
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Enable external Cloud Nodes to transmit live transaction statements & low stock warnings out-of-band:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {[
                    { key: 'inApp', label: '📳 In-App UI', enabled: preferences.channels.inApp },
                    { key: 'email', label: '✉ Email Node', enabled: preferences.channels.email },
                    { key: 'sms', label: '📨 SMS Gateway', enabled: preferences.channels.sms },
                    { key: 'push', label: '🔔 Browser Push', enabled: preferences.channels.push },
                    { key: 'whatsapp', label: '💬 WhatsApp', enabled: preferences.channels.whatsapp },
                  ].map((chan) => (
                    <button
                      key={chan.key}
                      onClick={() => handleTogglePref(chan.key as keyof UserPreferences['channels'])}
                      className={cn(
                        "p-2 rounded-xl border text-[10px] font-bold text-left transition-all flex items-center justify-between cursor-pointer",
                        chan.enabled 
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                          : "bg-white border-black/5 text-[#555555] hover:bg-indigo-50/50"
                      )}
                    >
                      <span>{chan.label}</span>
                      {chan.enabled ? <Check className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* INTEGRATED INTELLIGENT DIGEST PANEL */}
            {!showPrefPanel && (
              <div className="p-3 bg-gradient-to-r from-teal-900/5 to-emerald-950/5 border-b border-black/5 flex items-center justify-between text-[11px] text-[#333333]">
                <div className="flex items-center gap-1.5 font-bold shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600 animate-bounce" /> Daily Digest:
                </div>
                <div className="flex items-center gap-3 overflow-x-auto select-none no-scrollbar font-semibold">
                  <span className="p-1 px-1.5 bg-white border border-black/5 rounded-md text-[10px] text-slate-700 whitespace-nowrap">
                    <b>{notificationState.digest.newSales}</b> New Sales
                  </span>
                  <span className="p-1 px-1.5 bg-white border border-black/5 rounded-md text-[10px] text-slate-700 whitespace-nowrap">
                    <b>{notificationState.digest.lowStocks}</b> Low Stock
                  </span>
                  <span className="p-1 px-1.5 bg-white border border-black/5 rounded-md text-[10px] text-slate-700 whitespace-nowrap">
                    <b>{notificationState.digest.overdueInvoices}</b> Overdue
                  </span>
                </div>
              </div>
            )}

            {/* FILTERS RAIL */}
            <div className="p-2 bg-slate-100 border-b border-black/5 flex items-center gap-1 overflow-x-auto select-none no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: '🔴 Unread' },
                { id: 'critical', label: '🚨 Critical' },
                { id: 'inventory', label: '📦 Stock' },
                { id: 'sales', label: '📈 Sales' },
                { id: 'payments', label: '💸 Pay' },
                { id: 'customers', label: '👤 Customers' },
                { id: 'insights', label: '🧠 AI Insights' },
                { id: 'system', label: '⚙ System' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer shrink-0 whitespace-nowrap",
                    activeFilter === pill.id
                      ? "bg-brand text-white shadow-sm font-black"
                      : "bg-white border border-black/5 text-[#555555] hover:bg-slate-50"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* TEXT SEARCH FILTER */}
            <div className="px-3 py-2 bg-white border-b border-black/5">
              <input
                type="text"
                placeholder="Search alerts (e.g. Greek Yogs, INV-0012)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-[11px] p-2 bg-slate-50 hover:bg-slate-100/50 border border-black/5 rounded-lg focus:outline-none focus:border-brand focus:bg-white"
              />
            </div>

            {/* CORE ALERTS LIST CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {filteredAlerts.length === 0 ? (
                <div className="py-12 text-center text-ink/30 space-y-2">
                  <div className="text-3xl">📭</div>
                  <p className="text-xs font-bold leading-none">No notifications match selection.</p>
                  <p className="text-[10px] opacity-75">All operational services are reporting healthy.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grouping by high-priority critical indicators first */}
                  {filteredAlerts.map((item) => {
                    const sevColor = 
                      item.severity === 'critical' ? 'border-l-4 border-l-red-500 bg-red-100/10' :
                      item.severity === 'high' ? 'border-l-4 border-l-amber-500 bg-amber-100/10' :
                      item.severity === 'normal' ? 'border-l-4 border-l-blue-500 bg-blue-100/10' :
                      'border-l-4 border-l-slate-400 bg-slate-300/10';

                    const categoryIcon = 
                      item.category === 'inventory' ? '📦' :
                      item.category === 'sales' ? '📈' :
                      item.category === 'payments' ? '💸' :
                      item.category === 'customers' ? '👤' :
                      item.category === 'insights' ? '🧠' : '⚙';

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3 rounded-xl bg-white border border-black/5 shadow-sm transition-all relative flex flex-col gap-2 hover:shadow",
                          sevColor,
                          item.unread ? "ring-2 ring-brand/10 ring-offset-0" : ""
                        )}
                      >
                        {/* Red Dot indicator on unread */}
                        {item.unread && (
                          <span className="absolute top-2.5 right-2 px-1 text-[8px] bg-red-500 text-white rounded font-extrabold uppercase animate-pulse">
                            New
                          </span>
                        )}

                        <div className="flex gap-2">
                          <span className="text-base select-none shrink-0 mt-0.5">{categoryIcon}</span>
                          <div className="space-y-1 pr-6 flex-1">
                            {/* Alert title */}
                            <h4 className="font-extrabold text-ink text-xs leading-none">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-ink/75 leading-relaxed font-semibold">
                              {item.message}
                            </p>
                            {/* Timing indicator */}
                            <div className="flex items-center gap-1.5 text-[9px] text-[#777777] font-bold">
                              <Calendar className="w-3 h-3 scale-90" />
                              <span>{new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                              <span className="text-[8px] uppercase px-1 bg-slate-100 border border-black/5 text-[#666666] font-extrabold rounded">
                                {item.severity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* WORKFLOW QUICK ACTIONS LAYOUT FOOT PANEL */}
                        <div className="flex items-center justify-between border-t border-black/[0.03] pt-2 mt-1">
                          <div className="flex items-center gap-1">
                            {item.unread && (
                              <button
                                onClick={() => {
                                  markAlertAsRead(userId, item.id);
                                  refreshEngine();
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#444444] text-[9px] font-black rounded uppercase transition-colors cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              onClick={() => {
                                dismissAlert(userId, item.id);
                                refreshEngine();
                              }}
                              className="px-2 py-1 hover:bg-red-50 text-red-600 text-[9px] font-black rounded uppercase transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <div className="relative group/snooze">
                              <button
                                className="px-2 py-1 hover:bg-indigo-50 text-[#555555] text-[9px] font-black rounded uppercase transition-colors cursor-pointer flex items-center gap-0.5"
                                title="Snooze Alert text"
                              >
                                <Clock className="w-2.5 h-2.5" /> Snooze
                              </button>
                              <div className="hidden group-hover/snooze:block absolute bottom-full left-0 bg-white border border-black/10 rounded-lg shadow-xl p-1 z-50 min-w-[100px] mb-1 animate-in slide-in-from-bottom-2">
                                <button
                                  onClick={() => {
                                    snoozeAlert(userId, item.id, 1);
                                    refreshEngine();
                                  }}
                                  className="block w-full text-left px-2 py-1 hover:bg-indigo-50 text-[9px] font-bold rounded text-[#222222]"
                                >
                                  Snooze 1 Hr
                                </button>
                                <button
                                  onClick={() => {
                                    snoozeAlert(userId, item.id, 24);
                                    refreshEngine();
                                  }}
                                  className="block w-full text-left px-2 py-1 hover:bg-indigo-50 text-[9px] font-bold rounded text-[#222222]"
                                >
                                  Snooze Today
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Primary Action Button (Restock or View Invoice etc.) */}
                          {item.actionType && (
                            <button
                              onClick={() => executeNavigate(item)}
                              className="px-2 py-1 bg-brand text-white text-[9px] font-black rounded uppercase flex items-center gap-0.5 hover:opacity-90 cursor-pointer shadow-sm"
                            >
                              {item.actionType === 'restock' ? 'Restock Now' :
                               item.actionType === 'adjust_inventory' ? 'Adjust Stock' :
                               item.actionType === 'view_invoice' ? 'View invoice' : 'Inspect'}
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Global notification footer */}
            <div className="p-3 bg-white border-t border-black/5 text-[#555555] text-[10px] text-center font-bold">
              Business Alert Engine is monitoring active transaction logs.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
