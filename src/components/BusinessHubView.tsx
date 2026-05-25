import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  MapPin, 
  Pin, 
  Archive, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Circle, 
  AlertOctagon, 
  AlertTriangle, 
  FileText, 
  Check, 
  Briefcase, 
  Truck, 
  Zap, 
  Coins, 
  X, 
  Calendar, 
  Lock, 
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  QuickNote, 
  DailyExpense, 
  CashLog, 
  BusinessTask, 
  SupplierNote, 
  DEFAULT_QUICK_RECORDS, 
  DEFAULT_EXPENSES_RECORDS, 
  DEFAULT_CASH_FLOWS, 
  DEFAULT_TASKS, 
  DEFAULT_SUPPLIERS,
  createQuickNote,
  updateQuickNote,
  deleteQuickNote,
  searchNotes,
  createExpense,
  generateExpenseAnalytics,
  createCashLog,
  generateCashFlowAnalytics,
  createTask,
  completeTask,
  generateTaskAlerts,
  createSupplierNote,
  generateSupplierAnalytics
} from '../lib/businessHubEngine';

interface BusinessHubViewProps {
  currencySymbol?: string;
}

export function BusinessHubView({ currencySymbol }: BusinessHubViewProps) {
  // Tab control state
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'expenses' | 'cash_flow' | 'tasks' | 'suppliers'>('notes');

  // --- Client Side Persistence ---
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    const saved = localStorage.getItem('hub_quick_notes');
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_RECORDS;
  });

  const [expenses, setExpenses] = useState<DailyExpense[]>(() => {
    const saved = localStorage.getItem('hub_daily_expenses');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES_RECORDS;
  });

  const [cashFlows, setCashFlows] = useState<CashLog[]>(() => {
    const saved = localStorage.getItem('hub_cash_flows');
    return saved ? JSON.parse(saved) : DEFAULT_CASH_FLOWS;
  });

  const [tasks, setTasks] = useState<BusinessTask[]>(() => {
    const saved = localStorage.getItem('hub_business_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [suppliers, setSuppliers] = useState<SupplierNote[]>(() => {
    const saved = localStorage.getItem('hub_supplier_notes');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  // Automatically save to local session store
  useEffect(() => {
    localStorage.setItem('hub_quick_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('hub_daily_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('hub_cash_flows', JSON.stringify(cashFlows));
  }, [cashFlows]);

  useEffect(() => {
    localStorage.setItem('hub_business_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hub_supplier_notes', JSON.stringify(suppliers));
  }, [suppliers]);


  // --- FEATURES WRAPPERS STATE ---

  // Note Search Filters Configuration
  const [noteQuery, setNoteQuery] = useState('');
  const [noteFilter, setNoteFilter] = useState('all');

  // Note dialog toggler & input states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDesc, setNewNoteDesc] = useState('');
  const [newNoteCat, setNewNoteCat] = useState<QuickNote['category']>('Operations');
  const [newNotePriority, setNewNotePriority] = useState<QuickNote['priority']>('Medium');
  const [newNoteTags, setNewNoteTags] = useState('');

  // Expense toggler & input states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState<DailyExpense['category']>('Operations');
  const [expVendor, setExpVendor] = useState('');
  const [expPayMethod, setExpPayMethod] = useState('MoMo');
  const [expNotes, setExpNotes] = useState('');

  // Cash Log Input fields
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashName, setCashName] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashType, setCashType] = useState<'Cash In' | 'Cash Out'>('Cash In');
  const [cashCat, setCashCat] = useState('Revenue');
  const [cashSource, setCashSource] = useState('Main Drawer');

  // Task dialog toggler & input states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<BusinessTask['priority']>('Medium');
  const [taskReminderTime, setTaskReminderTime] = useState('09:00');
  const [taskTags, setTaskTags] = useState('');

  // Supplier note inputs
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supNameInput, setSupNameInput] = useState('');
  const [supItemInput, setSupItemInput] = useState('');
  const [supAmountInput, setSupAmountInput] = useState('');
  const [supStatusInput, setSupStatusInput] = useState<SupplierNote['status']>('Pending');
  const [supNotesInput, setSupNotesInput] = useState('');


  // --- MATHEMATICAL COMPLIMENT DIAGNOSTICS CALCULATIONS ---

  const filteredNotesList = useMemo(() => {
    return searchNotes(notes, noteQuery, noteFilter);
  }, [notes, noteQuery, noteFilter]);

  const expenseAnalytics = useMemo(() => {
    return generateExpenseAnalytics(expenses);
  }, [expenses]);

  const cashFlowAnalytics = useMemo(() => {
    return generateCashFlowAnalytics(cashFlows);
  }, [cashFlows]);

  const taskAlerts = useMemo(() => {
    return generateTaskAlerts(tasks);
  }, [tasks]);

  const supplierAnalytics = useMemo(() => {
    return generateSupplierAnalytics(suppliers);
  }, [suppliers]);


  // --- MUTATORS & CREATORS FUNCTIONS ---

  // Create Note
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const tagsArr = newNoteTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = createQuickNote(notes, {
      title: newNoteTitle,
      description: newNoteDesc,
      category: newNoteCat,
      priority: newNotePriority,
      tags: tagsArr
    });
    setNotes(updated);

    // Reset fields
    setNewNoteTitle('');
    setNewNoteDesc('');
    setNewNoteCat('Operations');
    setNewNotePriority('Medium');
    setNewNoteTags('');
    setShowNoteModal(false);
  };

  // Archive / Pin/ Delete operations
  const handlePinNote = (id: string, isPinned: boolean) => {
    setNotes(updateQuickNote(notes, id, { isPinned }));
  };

  const handleArchiveNote = (id: string, isArchived: boolean) => {
    setNotes(updateQuickNote(notes, id, { isArchived }));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(deleteQuickNote(notes, id));
  };

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim() || !expAmount) return;

    const val = parseFloat(expAmount);
    if (isNaN(val)) return;

    const updated = createExpense(expenses, expName, val, expCat, expVendor, expPayMethod, expNotes);
    setExpenses(updated);

    // Also auto-append a corresponding "Cash Out" log for cash consistency
    const cashOutLog = createCashLog(
      cashFlows,
      `Expense: ${expName}`,
      val,
      'Cash Out',
      expCat,
      expVendor || 'Unknown Vendor',
      expNotes
    );
    setCashFlows(cashOutLog);

    // Reset
    setExpName('');
    setExpAmount('');
    setExpCat('Operations');
    setExpVendor('');
    setExpNotes('');
    setShowExpenseModal(false);
  };

  // Add Cash Flow Log entry
  const handleAddCashFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashName.trim() || !cashAmount) return;

    const val = parseFloat(cashAmount);
    if (isNaN(val)) return;

    const updated = createCashLog(cashFlows, cashName, val, cashType, cashCat, cashSource);
    setCashFlows(updated);

    // Emit standard notification simulation to alerts engine
    const alertEvent = new CustomEvent('notifications_mutated', {
      detail: {
        id: `cash-${Date.now()}`,
        category: 'finance',
        title: `💸 Cash Transaction Filer`,
        message: `${cashType} recorded for ${cashName}: GHS ${val.toLocaleString()}`,
        severity: 'info'
      }
    });
    window.dispatchEvent(alertEvent);

    // Reset
    setCashName('');
    setCashAmount('');
    setShowCashModal(false);
  };

  // Add Task 
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const tagsArr = taskTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = createTask(tasks, taskName, taskDesc, taskDueDate || new Date().toISOString().split('T')[0], taskPriority, taskReminderTime, tagsArr);
    setTasks(updated);

    // Notify user immediately that high priority task was initialized
    if (taskPriority === 'High' || taskPriority === 'Critical') {
      const alertEvent = new CustomEvent('notifications_mutated', {
        detail: {
          id: `task-notice-${Date.now()}`,
          category: 'task',
          title: `📌 High Priority Task Created`,
          message: `Due: ${taskDueDate || 'Today'} - ${taskName}`,
          severity: 'warning'
        }
      });
      window.dispatchEvent(alertEvent);
    }

    setTaskName('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskTags('');
    setShowTaskModal(false);
  };

  const handleToggleCompleteTask = (id: string) => {
    setTasks(completeTask(tasks, id));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Add Supplier note
  const handleAddSupplierNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supNameInput.trim() || !supItemInput.trim()) return;

    const val = parseFloat(supAmountInput) || 0;
    const updated = createSupplierNote(suppliers, supNameInput, supItemInput, val, supStatusInput, supNotesInput);
    setSuppliers(updated);

    // Clear
    setSupNameInput('');
    setSupItemInput('');
    setSupAmountInput('');
    setSupNotesInput('');
    setShowSupplierModal(false);
  };

  const handleDelSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8" id="business-hub-dashboard">
      {/* HEADER HERO AREA */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-brand/20 text-brand px-3 py-1 rounded-full border border-brand/20">
              📌 INTERNAL OPERATIONS WORKSPACE
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 mt-1">
              <Layers className="w-6 h-6 text-brand" /> BUSINESS OPERATIONS HUB
            </h2>
            <p className="text-xs text-white/50 max-w-xl font-medium leading-relaxed">
              Odoo-style lightweight operational control ledger. Record business quick notes, log expenses, manage team reminders checklists, and track cash-drawer flows without interrupting sales invoices.
            </p>
          </div>

          {/* Quick Stats overview inside header */}
          <div className="flex items-center gap-4 bg-white/5 p-3 px-4 rounded-2xl border border-white/10 self-stretch md:self-auto justify-around">
            <div className="text-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Tasks Pending</span>
              <span className="text-base font-black text-brand leading-none">{tasks.filter(t => t.status !== 'Completed').length} items</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Net Drawer Balance</span>
              <span className="text-base font-black text-emerald-400 leading-none font-mono">
                {formatCurrency(cashFlowAnalytics.balance, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENT HUB NAVIGATION TABS - Desktop/Tablet/Mobile design instructions met */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-2">
        <div className="flex flex-nowrap overflow-x-auto gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto antialiased">
          {[
            { id: 'notes', label: '🗒 Quick Notes', count: notes.filter(n=>!n.isArchived).length },
            { id: 'expenses', label: '💸 Daily Expenses', count: expenses.length },
            { id: 'cash_flow', label: '💱 Cash Flow Drawer', count: cashFlows.length },
            { id: 'tasks', label: '📌 Tasks & Alerts', count: tasks.filter(t=>t.status !== 'Pending').length + tasks.filter(t=>t.status==='Pending').length },
            { id: 'suppliers', label: '🚚 Suppliers & Pricing', count: suppliers.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-3.5 py-2 text-xs font-black rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5",
                activeSubTab === tab.id 
                  ? "bg-[#111111] text-white shadow" 
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-slate-800 rounded font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action dispatchers depends on active subtab */}
        <div className="shrink-0">
          {activeSubTab === 'notes' && (
            <button 
              onClick={() => setShowNoteModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Create Note
            </button>
          )}

          {activeSubTab === 'expenses' && (
            <button 
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          )}

          {activeSubTab === 'cash_flow' && (
            <button 
              onClick={() => setShowCashModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Log Cash In/Out
            </button>
          )}

          {activeSubTab === 'tasks' && (
            <button 
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add New Task
            </button>
          )}

          {activeSubTab === 'suppliers' && (
            <button 
              onClick={() => setShowSupplierModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Add Supplier Order
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT A: QUICK NOTES PANEL (FEATURE 1) */}
      {activeSubTab === 'notes' && (
        <div className="space-y-6">
          {/* Note Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-black/5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Notes' },
                { id: 'pinned', label: '📌 Pinned Only' },
                { id: 'today', label: '📅 Created Today' },
                { id: 'inventory', label: '📦 Inventory Category' },
                { id: 'high', label: '🔥 High Priority' },
                { id: 'archived', label: '📁 Archived' }
              ].map((pPill) => (
                <button
                  key={pPill.id}
                  onClick={() => setNoteFilter(pPill.id)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer",
                    noteFilter === pPill.id 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {pPill.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search note contents..."
                value={noteQuery}
                onChange={e => setNoteQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-black/10 rounded-xl text-[11px] focus:outline-none focus:border-indigo-500 w-full sm:w-48 font-semibold"
              />
            </div>
          </div>

          {/* Notes Cards Render List */}
          {filteredNotesList.length === 0 ? (
            <div className="py-12 bg-white border border-black/5 rounded-3xl text-center italic text-xs text-ink/30 space-y-1">
              <div>No operational workspace notes matching standard criteria.</div>
              <button onClick={() => setShowNoteModal(true)} className="text-indigo-600 hover:underline font-bold text-[10px] uppercase">Create first business note now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredNotesList.map((note) => {
                const isCritical = note.priority === 'Critical';
                const isHigh = note.priority === 'High';

                return (
                  <div 
                    key={note.id} 
                    className={cn(
                      "bg-white border p-5 rounded-3xl flex flex-col justify-between gap-4 shadow-sm relative group hover:shadow transition-all hover:border-black/15",
                      note.isPinned ? "border-amber-400 border-2" : "border-black/5"
                    )}
                  >
                    {/* Top indicator icons */}
                    <div className="flex items-start justify-between">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest p-1 px-2 rounded-lg",
                        isCritical ? "bg-red-50 text-red-700" :
                        isHigh ? "bg-amber-50 text-amber-700" :
                        "bg-slate-50 text-slate-600"
                      )}>
                        {note.priority} Priority / {note.category}
                      </span>

                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handlePinNote(note.id, !note.isPinned)}
                          className={cn("p-1 rounded hover:bg-slate-100", note.isPinned ? "text-amber-500" : "text-slate-400")}
                          title="Pin note"
                        >
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={() => handleArchiveNote(note.id, !note.isArchived)}
                          className={cn("p-1 rounded hover:bg-slate-100", note.isArchived ? "text-indigo-600" : "text-slate-400")}
                          title={note.isArchived ? "Unarchive" : "Archive"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note details */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-tight">{note.title}</h4>
                      <p className="text-[11px] text-[#555555] font-semibold leading-relaxed">{note.description}</p>
                    </div>

                    {/* Footer Tags & Updated Timelines */}
                    <div className="pt-3 border-t border-black/[0.03] flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((t, tI) => (
                          <span key={tI} className="px-1 bg-slate-100 rounded text-slate-500 lowercase">#{t}</span>
                        ))}
                      </div>
                      <span>{new Date(note.lastUpdated).toLocaleDateString([], {month:'short', day:'numeric'})}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT B: EXPENSES CONTROLS (FEATURE 2) */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          {/* Quick Analytics blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-black/5 rounded-3xl shrink-0">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Today's Expenses</span>
              <span className="text-lg font-black text-rose-600 font-mono block">
                {formatCurrency(expenseAnalytics.todayTotal, currencySymbol)}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block">operational costs</span>
            </div>

            <div className="p-4 bg-white border border-black/5 rounded-3xl shrink-0">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Monthly Spend</span>
              <span className="text-lg font-black text-slate-800 font-mono block">
                {formatCurrency(expenseAnalytics.monthlyTotal, currencySymbol)}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block">Aggregated running total</span>
            </div>

            <div className="p-4 bg-white border border-black/5 rounded-3xl shrink-0">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Top Expenditure Sector</span>
              <span className="text-sm font-black text-indigo-950 block capitalize truncate">
                {expenseAnalytics.highestCategory}
              </span>
              <span className="text-[9px] text-emerald-600 font-black block mt-1">GHS {expenseAnalytics.highestCategoryValue.toLocaleString()} spend</span>
            </div>

            {/* Quick Promo Banner */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-indigo-900 block leading-tight">💡 Auto-Ledger integration</span>
              <p className="text-[9px] text-indigo-700 font-bold leading-tight mt-1">
                Add an expense log here to instantly decrease cash balance and synchronize your Cash Out logs.
              </p>
            </div>
          </div>

          {/* List of expenses entries */}
          <div className="bg-white border border-black/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                DAILY EXPENDITURES RECORD LEDGER
              </span>

              <button 
                onClick={() => setShowExpenseModal(true)}
                className="p-1 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] font-black uppercase rounded-lg cursor-pointer"
              >
                + Filer Expenses
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="py-8 text-center italic text-xs text-ink/30">No expenses cataloged at this time.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 text-[9px] uppercase font-black text-slate-400 pb-2">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Voucher/Item</th>
                      <th className="pb-2">Sector Category</th>
                      <th className="pb-2">Supplier Vendor</th>
                      <th className="pb-2">Gateway</th>
                      <th className="pb-2 text-right">Refund/Sum Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02] font-semibold text-slate-700">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">{exp.date}</td>
                        <td className="py-2.5 text-indigo-950 font-bold capitalize">{exp.name}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-black/5 text-[9px] rounded font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500 italic">{exp.vendor}</td>
                        <td className="py-2.5 font-mono text-[10px]">{exp.paymentMethod}</td>
                        <td className="py-2.5 text-right font-mono font-black text-rose-600">
                          - {formatCurrency(exp.amount, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT C: CASH FLOW RECORD WORKSPACE (FEATURE 3) */}
      {activeSubTab === 'cash_flow' && (
        <div className="space-y-6">
          {/* Cash Summary Analytics metrics list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block">Total Cash Inflows</span>
                <span className="text-xl font-black text-emerald-900 font-mono">
                  + {formatCurrency(cashFlowAnalytics.cashIn, currencySymbol)}
                </span>
              </div>
              <p className="text-[9px] text-[#447744] font-semibold">From store registers and client Invoice settlement</p>
            </div>

            <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl space-y-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 block">Total Outflows</span>
                <span className="text-xl font-black text-rose-900 font-mono">
                  - {formatCurrency(cashFlowAnalytics.cashOut, currencySymbol)}
                </span>
              </div>
              <p className="text-[9px] text-[#884444] font-semibold">Operational procurement payouts logged</p>
            </div>

            <div className="p-5 bg-indigo-50 border border-indigo-150 rounded-3xl flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-800 block">Net Register Surplus</span>
                <span className="text-lg font-black text-indigo-950 font-mono">
                  {formatCurrency(cashFlowAnalytics.balance, currencySymbol)}
                </span>
              </div>
              {/* Cash progress visually */}
              <div className="space-y-1 mt-2">
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-700" style={{ width: '65%' }} />
                </div>
                <div className="flex items-center justify-between text-[8px] text-slate-400 font-black uppercase">
                  <span>Inflows share</span>
                  <span>Healthy Balance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Logs Journal Database view */}
          <div className="bg-white border border-black/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                ACTIVE DRAWER CASH LOG ENTRIES
              </span>
              <button 
                onClick={() => setShowCashModal(true)}
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase rounded-lg cursor-pointer"
              >
                + Record Transaction
              </button>
            </div>

            {cashFlows.length === 0 ? (
              <div className="py-8 text-center italic text-xs text-ink/30">No transactions recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 text-[9px] uppercase font-black text-slate-400 pb-2">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Transfer Heading</th>
                      <th className="pb-2">Log Category</th>
                      <th className="pb-2">Account Line</th>
                      <th className="pb-2">Movement Type</th>
                      <th className="pb-2 text-right">Sum Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02] font-semibold text-slate-700">
                    {cashFlows.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">{log.date}</td>
                        <td className="py-2.5 text-indigo-950 font-bold capitalize">{log.name}</td>
                        <td className="py-2.5 text-slate-500">{log.category}</td>
                        <td className="py-2.5 text-slate-400 italic font-mono text-[10px]">{log.source}</td>
                        <td className="py-2.5">
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider",
                            log.type === 'Cash In' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className={cn(
                          "py-2.5 text-right font-mono font-black",
                          log.type === 'Cash In' ? 'text-emerald-700' : 'text-rose-600'
                        )}>
                          {log.type === 'Cash In' ? '+' : '-'} {formatCurrency(log.amount, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT D: TASKS & CHECKLIST CHECKROOM (FEATURE 4) */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          {/* Overdue alert count info */}
          <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-amber-950">Active Action items on checklist ({taskAlerts.alertCount} items outstanding)</h4>
                <p className="text-[10px] text-amber-800 font-bold leading-none mt-0.5">Keep track of supplier payments, inventory restocking schedules, and customer inquiries.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 text-white hover:bg-amber-700 text-[10px] font-black uppercase rounded-lg shadow-sm cursor-pointer"
            >
              Compose Task
            </button>
          </div>

          {/* Tasks checklist dashboard list */}
          <div className="bg-white border border-black/5 rounded-3xl p-6 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pb-2 border-b border-black/[0.03]">
              Workspace Action Checklists
            </span>

            {tasks.length === 0 ? (
              <div className="py-8 text-center italic text-xs text-ink/30">All tasks completed! Settle back and relax.</div>
            ) : (
              <div className="grid gap-3">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div 
                      key={task.id} 
                      className={cn(
                        "p-4 border rounded-2xl flex items-center justify-between gap-4 group transition-all",
                        isCompleted ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-black/5 hover:border-black/15"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Interactive Circle status checks */}
                        <button 
                          onClick={() => handleToggleCompleteTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          disabled={isCompleted}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:scale-105 transition-all" />
                          )}
                        </button>
                        
                        <div className="space-y-1">
                          <span className={cn(
                            "font-extrabold text-xs block",
                            isCompleted ? "line-through text-slate-400" : "text-indigo-950"
                          )}>
                            {task.name}
                          </span>
                          <p className="text-[11px] text-[#555555] font-semibold">{task.description}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded",
                              task.priority === 'Critical' ? 'bg-red-500 text-white' :
                              task.priority === 'High' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                            )}>
                              {task.priority} Priority
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">Due: {task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 px-2.5 text-[10px] text-rose-500 hover:bg-rose-50 font-black uppercase rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT E: SUPPLIERS LOGISTICS RECORDER (FEATURE 5) */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Supplier quick specs stats columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-black/5 rounded-3xl">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Top Supplier Account</span>
              <span className="text-base font-black text-indigo-950 block">
                {supplierAnalytics.topSupplier}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">highest single supply line engagement</span>
            </div>

            <div className="p-4 bg-white border border-black/5 rounded-3xl">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total Suppliers spend ledger</span>
              <span className="text-base font-black text-emerald-700 font-mono block">
                {formatCurrency(supplierAnalytics.totalSpend, currencySymbol)}
              </span>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Sourced goods cost</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-3xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-rose-800 block uppercase">Delayed Shipments</span>
                <span className="text-sm font-black text-rose-950 block">
                  {supplierAnalytics.delayedCount} deliveries flagged delayed
                </span>
              </div>
              <Truck className="w-8 h-8 text-rose-500 animate-pulse shrink-0" />
            </div>
          </div>

          {/* Suppliers listing grid list */}
          <div className="bg-white border border-black/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.03] pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                ACTIVE SUPPLIERS & LOGISTICS tracker
              </span>
              <button 
                onClick={() => setShowSupplierModal(true)}
                className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer hover:bg-black"
              >
                + Register Supplier Order
              </button>
            </div>

            {suppliers.length === 0 ? (
              <div className="py-8 text-center italic text-xs text-ink/30">No supplier logs documented.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((sup) => (
                  <div key={sup.id} className="p-4 bg-slate-50 border border-black/5 rounded-2xl flex flex-col justify-between gap-3 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-indigo-950 uppercase">{sup.supplierName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block">Purchased: <b className="text-[#333333]">{sup.purchaseItem}</b></span>
                      </div>

                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                        sup.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        sup.status === 'Delayed' ? 'bg-red-150 text-red-800 font-bold animate-pulse' : 'bg-amber-100 text-amber-800'
                      )}>
                        {sup.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-semibold">{sup.notes}</p>

                    <div className="pt-2 border-t border-black/[0.03] flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Order placement: {sup.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-950 font-mono font-black">{formatCurrency(sup.amount, currencySymbol)}</span>
                        <button 
                          onClick={() => handleDelSupplier(sup.id)}
                          className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:underline text-[9px] uppercase font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* --- MODALS CREATORS POPUPS FOR ALL ACTIVE SUBTABS --- */}

      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowNoteModal(false)}>
          <div className="bg-white rounded-3xl border border-black/10 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Create internal business note</h3>
              <button onClick={() => setShowNoteModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Note Title</span>
                <input 
                  type="text" 
                  value={newNoteTitle} 
                  required
                  placeholder="E.g. Restock strawberry cartons"
                  onChange={e=>setNewNoteTitle(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Brief details Description</span>
                <textarea 
                  value={newNoteDesc} 
                  rows={3}
                  placeholder="Check dairy shelf and restock before Wednesday morning rush."
                  onChange={e=>setNewNoteDesc(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Category sector</span>
                  <select 
                    value={newNoteCat}
                    onChange={e=>setNewNoteCat(e.target.value as any)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Sales">Sales</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Priority Index</span>
                  <select 
                    value={newNotePriority}
                    onChange={e=>setNewNotePriority(e.target.value as any)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Tags (comma separated)</span>
                <input 
                  type="text" 
                  value={newNoteTags} 
                  placeholder="urgent, restock, fashion"
                  onChange={e=>setNewNoteTags(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all cursor-pointer text-xs"
              >
                Publish Note to Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expense modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white rounded-3xl border border-black/10 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">File Daily Expense voucher</h3>
              <button onClick={() => setShowExpenseModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Expense Item Name</span>
                <input 
                  type="text" 
                  value={expName} 
                  required
                  placeholder="E.g. Carton Boxes Packaging"
                  onChange={e=>setExpName(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Amount spent (GHS)</span>
                  <input 
                    type="number" 
                    value={expAmount} 
                    required
                    placeholder="120"
                    onChange={e=>setExpAmount(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Category sector</span>
                  <select 
                    value={expCat}
                    onChange={e=>setExpCat(e.target.value as any)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Stock Purchase">Stock Purchase</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Staff">Staff</option>
                    <option value="Operations">Operations</option>
                    <option value="Internet">Internet</option>
                    <option value="Fuel">Fuel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Gateway payment method</span>
                  <select 
                    value={expPayMethod}
                    onChange={e=>setExpPayMethod(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="MoMo">Mobile Money Gateway</option>
                    <option value="Cash">Cash Drawer</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Vendor Supplier</span>
                  <input 
                    type="text" 
                    value={expVendor} 
                    placeholder="E.g. City Packagers"
                    onChange={e=>setExpVendor(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition-all cursor-pointer text-xs"
              >
                Log Cost Sheet & Settle Cash Flow
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cash Log modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowCashModal(false)}>
          <div className="bg-white rounded-3xl border border-black/10 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Log registers cash transactions</h3>
              <button onClick={() => setShowCashModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddCashFlow} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Transaction Heading</span>
                <input 
                  type="text" 
                  value={cashName} 
                  required
                  placeholder="E.g. Store register physical reconciliation"
                  onChange={e=>setCashName(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Amount (GHS)</span>
                  <input 
                    type="number" 
                    value={cashAmount} 
                    required
                    placeholder="450"
                    onChange={e=>setCashAmount(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Movement direction</span>
                  <select 
                    value={cashType}
                    onChange={e=>setCashType(e.target.value as any)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="Cash In">Cash In (Income)</option>
                    <option value="Cash Out">Cash Out (Expense)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Sector Category</span>
                  <input 
                    type="text" 
                    value={cashCat} 
                    placeholder="E.g. Store Revenue"
                    onChange={e=>setCashCat(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Source account/Drawer</span>
                  <input 
                    type="text" 
                    value={cashSource} 
                    placeholder="E.g. Main Desk Register"
                    onChange={e=>setCashSource(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all cursor-pointer text-xs"
              >
                Publish Cash Ledger Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-3xl border border-black/10 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Create internal business task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Task Checklist Name</span>
                <input 
                  type="text" 
                  value={taskName} 
                  required
                  placeholder="E.g. Pay Vendor B outstanding invoice"
                  onChange={e=>setTaskName(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Detailed task steps description</span>
                <textarea 
                  value={taskDesc} 
                  rows={2}
                  placeholder="Confirm milk Carton concentrate quantity was verified before dispatching bank transfer."
                  onChange={e=>setTaskDesc(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Due Date</span>
                  <input 
                    type="date" 
                    value={taskDueDate} 
                    required
                    onChange={e=>setTaskDueDate(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Task Priority</span>
                  <select 
                    value={taskPriority}
                    onChange={e=>setTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High</option>
                    <option value="Critical">Immediate Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Checklist Tags (comma separated)</span>
                <input 
                  type="text" 
                  value={taskTags} 
                  placeholder="supplier, reconciliation, admin"
                  onChange={e=>setTaskTags(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl transition-all cursor-pointer text-xs"
              >
                Save Task to Reminders
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowSupplierModal(false)}>
          <div className="bg-white rounded-3xl border border-black/10 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider font-slate-900">Log Supplier Purchase Interaction</h3>
              <button onClick={() => setShowSupplierModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddSupplierNote} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Supplier corporate name</span>
                <input 
                  type="text" 
                  value={supNameInput} 
                  required
                  placeholder="E.g. Mega Bottle Supplies"
                  onChange={e=>setSupNameInput(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Sourced Procurement Item</span>
                  <input 
                    type="text" 
                    value={supItemInput} 
                    required
                    placeholder="PET Yogurt bottles"
                    onChange={e=>setSupItemInput(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Billing Cost Amount (GHS)</span>
                  <input 
                    type="number" 
                    value={supAmountInput} 
                    required
                    placeholder="1500"
                    onChange={e=>setSupAmountInput(e.target.value)}
                    className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Delivery Logistics Status</span>
                <select 
                  value={supStatusInput}
                  onChange={e=>setSupStatusInput(e.target.value as any)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                >
                  <option value="Pending">Pending Dispatch</option>
                  <option value="Shipped">Shipped (In Transit)</option>
                  <option value="Completed">Completed Shipment</option>
                  <option value="Delayed">Delayed Logistic Alert</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Suppliers special terms / remarks</span>
                <textarea 
                  value={supNotesInput} 
                  rows={2}
                  placeholder="Bottles delays due to raw material processing."
                  onChange={e=>setSupNotesInput(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-xl focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-slate-900 text-white font-black rounded-xl transition-all hover:bg-black cursor-pointer text-xs"
              >
                Log Supplier transaction Note
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
