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
  ArrowRight,
  Clock,
  Download,
  Filter,
  Brain,
  Mic,
  Printer,
  ChevronRight,
  Activity,
  CheckCircle,
  HelpCircle,
  BarChart,
  User,
  Coffee,
  ListTodo,
  Wifi,
  WifiOff,
  Sliders,
  Settings,
  Shuffle,
  Info
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { 
  QuickNote, 
  DailyExpense, 
  CashLog, 
  BusinessTask, 
  SupplierNote, 
  OperationalActivity,
  DEFAULT_QUICK_RECORDS, 
  DEFAULT_EXPENSES_RECORDS, 
  DEFAULT_CASH_FLOWS, 
  DEFAULT_TASKS, 
  DEFAULT_SUPPLIERS,
  DEFAULT_ACTIVITIES,
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
  generateSupplierAnalytics,
  logActivity,
  filterActivities,
  generateTimeline,
  analyzeBusinessNotes,
  generateSmartInsights,
  syncBusinessHubModules,
  searchBusinessHub,
  generateSearchSuggestions,
  generateOperationsReport,
  exportBusinessHubToCSV,
  BusinessHubStore,
  BusinessHubAPI,
  ROLE_PERMISSIONS,
  EnterpriseRole,
  secureBusinessAction,
  validatePermissions
} from '../lib/businessHubEngine';


interface BusinessHubViewProps {
  currencySymbol?: string;
  filteredSalesLines?: any[];
}

export function BusinessHubView({ currencySymbol, filteredSalesLines = [] }: BusinessHubViewProps) {
  // Tab control state (expanded tabs for Features 6 & 7)
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'expenses' | 'cash_flow' | 'tasks' | 'suppliers' | 'activity_log' | 'ai_copilot'>('notes');

  // --- ENTERPRISE ROLE-BASED ACCESS CONTROL (Feature 18) ---
  const [enterpriseRole, setEnterpriseRole] = useState<EnterpriseRole>(() => {
    const saved = localStorage.getItem('hub_active_role');
    return (saved as EnterpriseRole) || 'Owner';
  });

  // --- CONNECTIVITY & LAYOUT PERSISTENCE (Feature 16, 17, 23) ---
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return BusinessHubAPI.getOfflineMode();
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncQueueSize, setSyncQueueSize] = useState<number>(() => {
    return BusinessHubAPI.getQueueLength();
  });

  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('hub_visible_widgets_layout');
    return saved ? JSON.parse(saved) : {
      analyticsCards: true,
      trendsCharts: true,
      liveAlarms: true,
      aiIntelligence: true
    };
  });

  const [showConfigLayoutModal, setShowConfigLayoutModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [securityBlockNotice, setSecurityBlockNotice] = useState<{ msg: string; active: boolean } | null>(null);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('hub_active_role', enterpriseRole);
  }, [enterpriseRole]);

  useEffect(() => {
    localStorage.setItem('hub_visible_widgets_layout', JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  // --- SHORTCUTS ENGINE (Feature 23) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette: CTRL + K or CMD + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // If typing in forms or inputs, skip shortcuts
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' || 
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      // Check keybinds N -> New Note, E -> New Expense, T -> New Task
      if (e.key.toLowerCase() === 'n') {
        const check = secureBusinessAction(enterpriseRole, 'canAddNote', 0, formatCurrency);
        if (check.allowed) {
          setShowNoteModal(true);
        } else {
          setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
        }
      } else if (e.key.toLowerCase() === 'e') {
        const check = secureBusinessAction(enterpriseRole, 'canAddExpense', 1, formatCurrency);
        if (check.allowed) {
          setShowExpenseModal(true);
        } else {
          setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
        }
      } else if (e.key.toLowerCase() === 't') {
        const check = secureBusinessAction(enterpriseRole, 'canAddTasks', 0, formatCurrency);
        if (check.allowed) {
          setShowTaskModal(true);
        } else {
          setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
        }
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setSecurityBlockNotice(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterpriseRole]);

  // Handle connection toggling
  const handleToggleConnectivity = () => {
    const nextMode = !isOfflineMode;
    BusinessHubAPI.setOfflineMode(nextMode);
    setIsOfflineMode(nextMode);
    
    if (!nextMode) {
      // Re-connected! Simulate syncing latency
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setSyncQueueSize(BusinessHubAPI.getQueueLength());
        // Sync arrays to trigger UI refresh
        setNotes([...BusinessHubStore.getState().notes]);
        setExpenses([...BusinessHubStore.getState().expenses]);
        setTasks([...BusinessHubStore.getState().tasks]);
        setActivities([...BusinessHubStore.getState().activities]);
      }, 1500);
    } else {
      setSyncQueueSize(BusinessHubAPI.getQueueLength());
    }
  };

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

  const [activities, setActivities] = useState<OperationalActivity[]>(() => {
    const saved = localStorage.getItem('hub_operational_activities');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
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

  useEffect(() => {
    localStorage.setItem('hub_operational_activities', JSON.stringify(activities));
  }, [activities]);


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


  // --- FEATURE 10: ADVANCED ENTERPRISE SEARCH STATES ---
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [globalFilterCat, setGlobalFilterCat] = useState('all');
  const [globalFilterPri, setGlobalFilterPri] = useState('all');
  const [globalFilterStatus, setGlobalFilterStatus] = useState('all');
  const [globalFilterMinAmt, setGlobalFilterMinAmt] = useState('');
  const [globalFilterMaxAmt, setGlobalFilterMaxAmt] = useState('');
  const [globalFilterStart, setGlobalFilterStart] = useState('');
  const [globalFilterEnd, setGlobalFilterEnd] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [savedFiltersList, setSavedFiltersList] = useState<Array<{ name: string, active: boolean, config: any }>>([
    { name: 'Critical Checklist', active: false, config: { priority: 'Critical', category: 'all', status: 'all' } },
    { name: 'Supplier Overdue Logs', active: false, config: { priority: 'all', category: 'Supplier', status: 'delayed' } },
    { name: 'Today\'s Cash Register', active: false, config: { priority: 'all', category: 'all', status: 'all', dateStart: new Date().toISOString().split('T')[0] } }
  ]);

  // --- FEATURE 9: MOBILE CORNER VIEW & DICTATION CAPTURE ---
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceWaveActive, setVoiceWaveActive] = useState(false);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState('Tap Mic to capture input');
  const [voiceInstructionText, setVoiceInstructionText] = useState('');
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // --- FEATURE 6: TIMELINE ACTIVITY NAVIGATION AND STATUS ---
  const [activitiesQuery, setActivitiesQuery] = useState('');
  const [activitiesFilter, setActivitiesFilter] = useState('all');
  const [activitiesGrouping, setActivitiesGrouping] = useState<'none' | 'day' | 'category'>('none');

  // --- FEATURE 12: EXECUTIVE SUMMARY & PRINT MODALS ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [aiAnalyzingSelectedNote, setAiAnalyzingSelectedNote] = useState<string | null>(null);
  const [aiDeepExplanation, setAiDeepExplanation] = useState<string>('');

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

  // --- FEATURE 6: MEMOIZED OPERATIONAL TIMELINE ---
  const processedActivitiesList = useMemo(() => {
    const list = filterActivities(activities, activitiesFilter, activitiesQuery);
    return generateTimeline(list, activitiesGrouping);
  }, [activities, activitiesFilter, activitiesQuery, activitiesGrouping]);

  // --- FEATURE 7: HEURISTIC CO-PILOT ADVISIONS ---
  const intelligentBrainInsights = useMemo(() => {
    return generateSmartInsights(notes, expenses, tasks, suppliers);
  }, [notes, expenses, tasks, suppliers]);

  // --- FEATURE 8: DASHBOARD INTERACTION ANOMALIES TRIGGER ENGINE ---
  const syncDashboardAlerts = useMemo(() => {
    // Collect low-stock triggers from filteredSalesLines or inventory issues simulation
    const lowStockParts: Array<{name: string, stock: number}> = [];
    
    // Scan items in our main invoice items lines, if quantity in a line is dangerously low
    const yogurtCapsLine = filteredSalesLines.find(l => (l.item || l.product_name || '').toLowerCase().includes('cap'));
    if (yogurtCapsLine && (yogurtCapsLine.quantity || 0) < 5) {
      lowStockParts.push({ name: 'Yogurt Caps', stock: yogurtCapsLine.quantity });
    }
    const bottlesLine = filteredSalesLines.find(l => (l.item || l.product_name || '').toLowerCase().includes('bottle'));
    if (bottlesLine && (bottlesLine.quantity || 0) < 5) {
      lowStockParts.push({ name: 'Yogurt PET Bottles', stock: bottlesLine.quantity });
    }

    return syncBusinessHubModules(filteredSalesLines, lowStockParts);
  }, [filteredSalesLines]);

  // --- FEATURE 10: 5-IN-1 ENTERPRISE CROSS-MODULE SEARCH RESULTS ---
  const crossedSearchPoolResults = useMemo(() => {
    const minVal = globalFilterMinAmt ? parseFloat(globalFilterMinAmt) : undefined;
    const maxVal = globalFilterMaxAmt ? parseFloat(globalFilterMaxAmt) : undefined;

    return searchBusinessHub(
      globalSearchQuery,
      { notes, expenses, cashFlows, tasks, suppliers, activities },
      {
        priority: globalFilterPri,
        category: globalFilterCat,
        status: globalFilterStatus,
        amountMin: minVal,
        amountMax: maxVal,
        dateStart: globalFilterStart,
        dateEnd: globalFilterEnd
      }
    );
  }, [
    globalSearchQuery, notes, expenses, cashFlows, tasks, suppliers, activities,
    globalFilterPri, globalFilterCat, globalFilterStatus, globalFilterMinAmt, globalFilterMaxAmt, globalFilterStart, globalFilterEnd
  ]);

  // Total matching search counts to display badge
  const totalSearchMatchesCount = useMemo(() => {
    const r = crossedSearchPoolResults;
    return r.notes.length + r.expenses.length + r.cashFlows.length + r.tasks.length + r.suppliers.length;
  }, [crossedSearchPoolResults]);

  // --- FEATURE 12: GENERAL LEDGER REPORT EXTRAPOLATION ---
  const generalLedgerOperationsReport = useMemo(() => {
    return generateOperationsReport(notes, expenses, tasks, suppliers, cashFlows);
  }, [notes, expenses, tasks, suppliers, cashFlows]);

  // --- FEATURE 11: PROACTIVE EMERGENCY ALARMS TRAY ---
  const dynamicProactiveAlarmsList = useMemo(() => {
    const list: Array<{ id: string, title: string, desc: string, severity: 'warning' | 'critical' | 'info', timestamp: string }> = [];

    // Checked delayed logistics
    suppliers.forEach(s => {
      if (s.status === 'Delayed') {
        list.push({
          id: `alarm-sup-${s.id}`,
          title: `Procurement delayed: ${s.supplierName}`,
          desc: `Logistic dispatch for "${s.purchaseItem}" (GHS ${s.amount}) flagged Delayed. Immediate follow-up required.`,
          severity: 'critical',
          timestamp: s.date
        });
      }
    });

    // Check high expense vouchers
    expenses.forEach(e => {
      if (e.amount > 1000) {
        list.push({
          id: `alarm-exp-${e.id}`,
          title: 'Premium cost sheet registered',
          desc: `Expense voucher filed for amount exceeding safety caps: GHS ${e.amount.toLocaleString()} logged.`,
          severity: 'warning',
          timestamp: e.date
        });
      }
    });

    // Check overdue tasks
    const todayISO = new Date().toISOString().split('T')[0];
    tasks.forEach(t => {
      if (t.status !== 'Completed' && t.dueDate < todayISO) {
        list.push({
          id: `alarm-task-${t.id}`,
          title: `Overdue Task Notice: "${t.name}"`,
          desc: `Checklist item due by ${t.dueDate} is currently neglected. Settle operations immediately.`,
          severity: 'critical',
          timestamp: t.dueDate
        });
      }
    });

    return list;
  }, [suppliers, expenses, tasks]);


  // --- MUTATORS & CREATORS FUNCTIONS ---

  // Create Note
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const check = secureBusinessAction(enterpriseRole, 'canAddNote', 0, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

    const tagsArr = newNoteTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = createQuickNote(notes, {
      title: newNoteTitle,
      description: newNoteDesc,
      category: newNoteCat,
      priority: newNotePriority,
      tags: tagsArr
    });
    setNotes(updated);

    // Auto-Log Activity Feed
    setActivities(prev => logActivity(
      prev, 
      'Manual', 
      'Quick Note Created', 
      `Note "${newNoteTitle}" added to category ${newNoteCat}.`, 
      'Notes',
      newNotePriority
    ));

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
    const target = notes.find(n => n.id === id);
    setNotes(updateQuickNote(notes, id, { isPinned }));
    if (target) {
      setActivities(prev => logActivity(
        prev, 
        'System', 
        isPinned ? 'Note Pinned' : 'Note Unpinned', 
        `Note "${target.title}" was marked ${isPinned ? 'Pinned' : 'Normal'}.`, 
        'Notes',
        'Low'
      ));
    }
  };

  const handleArchiveNote = (id: string, isArchived: boolean) => {
    const target = notes.find(n => n.id === id);
    setNotes(updateQuickNote(notes, id, { isArchived }));
    if (target) {
      setActivities(prev => logActivity(
        prev, 
        'System', 
        isArchived ? 'Note Archived' : 'Note Unarchived', 
        `Note "${target.title}" was ${isArchived ? 'moved to archive storage' : 'unarchived to workspace'}.`, 
        'Notes',
        'Low'
      ));
    }
  };

  const handleDeleteNote = (id: string) => {
    const check = secureBusinessAction(enterpriseRole, 'canDeleteNote', 0, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

    const target = notes.find(n => n.id === id);
    setNotes(deleteQuickNote(notes, id));
    if (target) {
      setActivities(prev => logActivity(
        prev, 
        'System', 
        'Note Deleted', 
        `Note "${target.title}" deleted completely.`, 
        'Notes',
        'Low'
      ));
    }
  };

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim() || !expAmount) return;

    const val = parseFloat(expAmount);
    if (isNaN(val)) return;

    const check = secureBusinessAction(enterpriseRole, 'canAddExpense', val, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

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

    // Log Activity Feed
    setActivities(prev => logActivity(
      prev, 
      'Expense', 
      'Voucher Expense logged', 
      `Voucher filed: GHS ${val.toLocaleString()} spent on ${expName} (${expCat}) via ${expPayMethod}.`, 
      'Expenses',
      val > 500 ? 'High' : 'Medium'
    ));

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

    const check = secureBusinessAction(enterpriseRole, 'canAddCashFlow', val, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

    const updated = createCashLog(cashFlows, cashName, val, cashType, cashCat, cashSource);
    setCashFlows(updated);

    // Filter Alert Event
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

    // Log Activity Feed
    setActivities(prev => logActivity(
      prev, 
      'Finance', 
      'Cash Ledger transaction', 
      `Registered ${cashType} allocation of GHS ${val.toLocaleString()} for "${cashName}" (Category: ${cashCat}).`, 
      'Cash Flow',
      val > 1000 ? 'High' : 'Medium'
    ));

    // Reset
    setCashName('');
    setCashAmount('');
    setShowCashModal(false);
  };

  // Add Task 
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const check = secureBusinessAction(enterpriseRole, 'canAddTasks', 0, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

    const tagsArr = taskTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = createTask(tasks, taskName, taskDesc, taskDueDate || new Date().toISOString().split('T')[0], taskPriority, taskReminderTime, tagsArr);
    setTasks(updated);

    // High priority notification alert trace
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

    // Log Activity Feed
    setActivities(prev => logActivity(
      prev, 
      'Task', 
      'Checklist task created', 
      `Task "${taskName}" queued to schedule checklists due ${taskDueDate || 'Today'}.`, 
      'Tasks',
      taskPriority
    ));

    setTaskName('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskTags('');
    setShowTaskModal(false);
  };

  const handleToggleCompleteTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(completeTask(tasks, id));
    if (target) {
      // Log activity Completion
      setActivities(prev => logActivity(
        prev, 
        'Task', 
        'Checklist task completed', 
        `Completed task checklist item: "${target.name}". status closed.`, 
        'Tasks',
        'Low'
      ));
    }
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(tasks.filter(t => t.id !== id));
    if (target) {
      setActivities(prev => logActivity(
        prev, 
        'Task', 
        'Checklist task scrubbed', 
        `Task checklist item "${target.name}" was discarded from schedule.`, 
        'Tasks',
        'Low'
      ));
    }
  };

  // Add Supplier note
  const handleAddSupplierNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supNameInput.trim() || !supItemInput.trim()) return;

    const check = secureBusinessAction(enterpriseRole, 'canModifySuppliers', 0, formatCurrency);
    if (!check.allowed) {
      setSecurityBlockNotice({ msg: check.reason || 'Blocked', active: true });
      return;
    }

    const val = parseFloat(supAmountInput) || 0;
    const updated = createSupplierNote(suppliers, supNameInput, supItemInput, val, supStatusInput, supNotesInput);
    setSuppliers(updated);

    // Log activity
    setActivities(prev => logActivity(
      prev, 
      'Supplier', 
      'Supplier Logistics Logged', 
      `Logged purchase terms with ${supNameInput} for ${supItemInput} (${supStatusInput}): GHS ${val.toLocaleString()}`, 
      'Suppliers',
      supStatusInput === 'Delayed' ? 'Critical' : 'Medium'
    ));

    // Clear
    setSupNameInput('');
    setSupItemInput('');
    setSupAmountInput('');
    setSupNotesInput('');
    setShowSupplierModal(false);
  };

  const handleDelSupplier = (id: string) => {
    const target = suppliers.find(s => s.id === id);
    setSuppliers(suppliers.filter(s => s.id !== id));
    if (target) {
      setActivities(prev => logActivity(
        prev, 
        'Supplier', 
        'Supplier Logistics Deleted', 
        `Interaction with supplier ${target.supplierName} deleted.`, 
        'Suppliers',
        'Low'
      ));
    }
  };

  // --- FEATURE 9 VOICE SPEECH RECOGNITION MOCK SIMULATION ---
  const handleTriggerVoiceSpeechSimulate = () => {
    setVoiceWaveActive(true);
    setVoiceStatusMsg('Listening to operational guidelines...');
    
    const transcripts = [
      'Need to reorder plastic PET Yogurt bottles from Mega Bottle tomorrow morning high priority and check packaging cost caps.',
      'File daily marketing cost voucher: GHS 450 spent on direct Social Media ads via MoMo gateway, vendor Facebook Ads.',
      'Log direct bank inflow reconciliation from shop registers cash drawer amount GHS 1200 as Store Cash balance.',
      'Urgent reminder task check milk concentrate temperature levels before noon.'
    ];
    
    const randomIdx = Math.floor(Math.random() * transcripts.length);
    const selectedText = transcripts[randomIdx];

    setTimeout(() => {
      setVoiceInstructionText(selectedText);
      setVoiceWaveActive(false);
      setVoiceStatusMsg('Voice processed successfully!');
    }, 2800);
  };

  const handleApplyVoiceAutoParse = () => {
    if (!voiceInstructionText.trim()) return;
    
    // Call our smart AI heuristic parser
    const parsed = analyzeBusinessNotes(voiceInstructionText);
    
    // Automatically route to correct modals/fields based on text keywords
    if (voiceInstructionText.includes('reorder') || voiceInstructionText.includes('bottles') || voiceInstructionText.includes('supplier')) {
      setActiveSubTab('suppliers');
      setSupNameInput('Mega Bottle Supplies');
      setSupItemInput('PET Yogurt bottles packaging');
      setSupAmountInput('1500');
      setSupStatusInput('Pending');
      setSupNotesInput(`Auto-parsed from voice: ${voiceInstructionText}`);
      setShowSupplierModal(true);
    } else if (voiceInstructionText.includes('marketing') || voiceInstructionText.includes('spent') || voiceInstructionText.includes('voucher')) {
      setActiveSubTab('expenses');
      setExpName('Social Media Ads Promo Campaign');
      setExpAmount('450');
      setExpCat('Marketing');
      setExpVendor('Facebook Ads / Meta platform');
      setExpPayMethod('MoMo');
      setExpNotes(`Auto-parsed from voice: ${voiceInstructionText}`);
      setShowExpenseModal(true);
    } else if (voiceInstructionText.includes('inflow') || voiceInstructionText.includes('drawer') || voiceInstructionText.includes('deposit') || voiceInstructionText.includes('reconcile')) {
      setActiveSubTab('cash_flow');
      setCashName('Shop registers daily reconciliation in flow');
      setCashAmount('1200');
      setCashType('Cash In');
      setCashCat('Revenue');
      setCashSource('Store physical registers drawer');
      setShowCashModal(true);
    } else {
      setActiveSubTab('tasks');
      setTaskName('Check milk concentrate temperature levels before noon');
      setTaskDesc(`Auto-parsed checklist from voice command dictation: ${voiceInstructionText}`);
      setTaskDueDate(new Date().toISOString().split('T')[0]);
      setTaskPriority('Critical');
      setTaskTags('operations, auto-voice');
      setShowTaskModal(true);
    }
    
    // Close voice modal
    setShowVoiceModal(false);
    setVoiceInstructionText('');
    setVoiceStatusMsg('Tap Mic to capture input');
  };

  // --- FEATURE 7: ARTIFICIAL DEEP INTELLIGENCE DISCOVERY SHIELD ---
  const handleDeepAIAnalyzeSelectedNote = (noteId: string) => {
    setAiAnalyzingSelectedNote(noteId);
    const foundNote = notes.find(n => n.id === noteId);
    if (!foundNote) return;

    setAiDeepExplanation('Summoning Gemini Workspace Intelligence...');
    
    setTimeout(() => {
      let desc = '';
      if (foundNote.title.toLowerCase().includes('milk') || foundNote.description.toLowerCase().includes('milk')) {
        desc = `**Gemini AI Analytics Discovery for Yogurt manufacturing:**\n\n` +
               `1. **Logistics Risk**: Yogurt procurement relies on raw pasteurized milk concentrates. Currently, you have registered pending delayed items with suppliers.\n\n` +
               `2. **Cost Settle Prediction**: If GHS 4,500 pending supplier balance is paid late, Mega Bottle Supplies delivery delays might worsen.\n\n` +
               `3. **Recommendation**: Settle invoice voucher inside **Daily Expenses Drawer** immediately using Mobile Money payment gateways.`;
      } else if (foundNote.title.toLowerCase().includes('momo') || foundNote.description.toLowerCase().includes('momo')) {
        desc = `**Gemini AI Analytics Discovery for Digital Payments reconciliation:**\n\n` +
               `1. **Pattern Mapping**: MoMo is the dominant gateway method (accounting for 72% of daily incoming flow).\n\n` +
               `2. **Tax Exposure alert**: Recent legislative changes in e-levy suggests standard e-charges. Tax ledger line should be drafted to account for e-discrepancies.\n\n` +
               `3. **Actionable Checklist**: Create task "Draft Digital Tax reconciliation reports before Friday" to shield audits.`;
      } else {
        desc = `**Gemini AI Workspace Copilot Analysis:**\n\n` +
               `* **Subject of Note:** "${foundNote.title}" - Category: ${foundNote.category}.\n` +
               `* **Status Priority:** ${foundNote.priority} Index. Auto-tagged labels: ${foundNote.tags.join(', ')}.\n\n` +
               `* **Core ERP Suggestion**: Create corresponding Supplier logistics records and log cash expenditures. The description points to operational bottlenecks that could disrupt manufacturing schedules. Recommend marking this Critical to prevent workflow stalling.`;
      }
      setAiDeepExplanation(desc);
    }, 1200);
  };

  // --- TYPE SAFE METRICS & HELPER CALCULATIONS FOR CHARTS ---
  const cashInVal = Number(cashFlowAnalytics.cashIn) || 0;
  const cashOutVal = Number(cashFlowAnalytics.cashOut) || 0;
  const cashSumTotal = Math.max(1, cashInVal + cashOutVal);

  const handleExportAllToCSV = () => {
    const csvData = exportBusinessHubToCSV('Notes', notes);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Yogurt_Hub_All_Notes_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    
    // Log activity
    setActivities(prev => logActivity(
      prev,
      'System',
      'CSV Ledger Exported',
      `Full internal quick notes dataset compiled and exported to physical CSV sheet audit files.`,
      'Notes',
      'Low'
    ));
  };

  return (
    <div className="space-y-6" id="business-hub-dashboard">
      
      {/* HEADER HERO AREA */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111111] to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-indigo-300 px-3 py-1 rounded-full border border-slate-700">
              📌 ENTERPRISE BUSINESS COMMAND CENTER
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 mt-1">
              <Layers className="w-6 h-6 text-indigo-400" /> OPERATIONAL WORKSPACE HUB
            </h2>
            <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
              Lite ERP companion. Draft notes, file daily cost vouchers, compile checking sheets, track cash flow reserves, and follow supply lines—fully synchronized with active invoice records.
            </p>
          </div>

          {/* Quick Stats overview inside header */}
          <div className="flex items-center gap-4 bg-white/[0.04] p-3 px-4 rounded-2xl border border-white/10 self-stretch md:self-auto justify-around">
            <div className="text-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Pending Checklists</span>
              <span className="text-base font-black text-amber-400 leading-none">{tasks.filter(t => t.status !== 'Completed').length} Items</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Net Register Balance</span>
              <span className="text-base font-black text-emerald-400 leading-none font-mono">
                {formatCurrency(cashFlowAnalytics.balance, currencySymbol)}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Delivery Alerts</span>
              <span className="text-base font-black text-rose-400 leading-none">{suppliers.filter(s => s.status === 'Delayed').length} delayed</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MASTER ORCHESTRATION CONSOLE & STATUS BAR --- */}
      <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        {/* Left: Role switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Active Credentials Role</span>
              <select
                value={enterpriseRole}
                onChange={(e) => setEnterpriseRole(e.target.value as EnterpriseRole)}
                className="text-xs font-black text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="Owner">👑 Owner (Full Super-Admin Access)</option>
                <option value="Admin">🛠️ Admin (Can Edit & Delete)</option>
                <option value="Manager">💼 Manager (Audit/Log Limits)</option>
                <option value="Staff">🤝 Staff (Daily entry capped at GHS 500)</option>
                <option value="Read Only">👁️ Read Only (No DB Mutations)</option>
              </select>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-200" />

          {/* Role Caps summary */}
          <div className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-100 rounded-xl p-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>
              {enterpriseRole === 'Owner' && "Unconstrained super-permissions. Custom rules enabled."}
              {enterpriseRole === 'Admin' && "All write, create, and search indexes are operational."}
              {enterpriseRole === 'Manager' && "Write capability active. GHS 10,000 cost transaction ceiling apply."}
              {enterpriseRole === 'Staff' && "Write active. Transaction budget capped at GHS 500."}
              {enterpriseRole === 'ReadOnly' && "View-only restricted access. DB modification forbidden."}
            </span>
          </div>
        </div>

        {/* Right: Offline connection simulator & Shortcuts info */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {/* Shortcuts Info */}
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="px-3 py-1.5 bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cmd Palette <kbd className="bg-slate-200/80 px-1 rounded">Ctrl+K</kbd></span>
          </button>

          {/* Customize Layout Widget Toggle Button */}
          <button
            onClick={() => setShowConfigLayoutModal(true)}
            className="px-3 py-1.5 bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Customize Dashboard</span>
          </button>

          <div className="w-px h-8 bg-slate-200 hidden md:block" />

          {/* Connection Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleConnectivity}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all shadow-sm border",
                isOfflineMode 
                  ? "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              )}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Offline Mode (Queue: {syncQueueSize})</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online Service Live</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- REAL-TIME SYNCING OVERLAY LOADER --- */}
      {isSyncing && (
        <div className="bg-indigo-900 text-white p-3 px-5 rounded-2xl flex items-center justify-between gap-3 shadow animate-pulse">
          <div className="flex items-center gap-2.5">
            <Shuffle className="w-4 h-4 text-indigo-300 animate-spin" />
            <span className="text-[11px] font-black">
              🔄 Synchronizing database tables... Committing offline mutations queue registry back to primary Postgres instance.
            </span>
          </div>
          <span className="text-[9px] font-black bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-700/60 uppercase">
            FLUSHING QUEUE ({syncQueueSize} items)
          </span>
        </div>
      )}

      {/* --- INTRUSIVE SECURITY WARNING DISMISSABLE BANNER --- */}
      {securityBlockNotice?.active && (
        <div className="bg-red-50 border border-red-300/60 rounded-2.5xl p-4.5 flex items-start gap-3 shadow-sm animate-bounce">
          <div className="p-1 px-2.5 bg-red-100 text-red-800 text-[10px] font-black rounded-lg uppercase">
            Denied
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-[11px] font-black text-rose-950">Security Access Rules Constraint Warning</h4>
            <p className="text-[10px] text-rose-800 font-semibold">{securityBlockNotice.msg}</p>
          </div>
          <button 
            onClick={() => setSecurityBlockNotice(null)}
            className="text-[10px] text-rose-600 font-black uppercase tracking-wider hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- CUSTOMIZABLE WIDGETS CONTROL PANEL MODAL --- */}
      {showConfigLayoutModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase">
                <Sliders className="w-5 h-5 text-indigo-600" /> Customize Dashboard Tiles
              </h3>
              <button 
                onClick={() => setShowConfigLayoutModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Personalize your workspace experience. Toggle active bento components on and off to maintain focusing speeds or discover higher density reports.
            </p>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-[#111111] text-xs">Analytics Tiles Panel</span>
                </div>
                <input 
                  type="checkbox"
                  checked={visibleWidgets.analyticsCards}
                  onChange={(e) => setVisibleWidgets(prev => ({ ...prev, analyticsCards: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-[#111111] text-xs">High-Fidelity Trends Charts</span>
                </div>
                <input 
                  type="checkbox"
                  checked={visibleWidgets.trendsCharts}
                  onChange={(e) => setVisibleWidgets(prev => ({ ...prev, trendsCharts: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-[#111111] text-xs">Proactive Alarms & suggestions list</span>
                </div>
                <input 
                  type="checkbox"
                  checked={visibleWidgets.liveAlarms}
                  onChange={(e) => setVisibleWidgets(prev => ({ ...prev, liveAlarms: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-[#111111] text-xs">Gemini Deep Intelligence Intelligence cards</span>
                </div>
                <input 
                  type="checkbox"
                  checked={visibleWidgets.aiIntelligence}
                  onChange={(e) => setVisibleWidgets(prev => ({ ...prev, aiIntelligence: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-3">
              <button 
                onClick={() => setShowConfigLayoutModal(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl"
              >
                Apply Custom Selection ({Object.values(visibleWidgets).filter(Boolean).length} Active)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMMAND PALETTE MODAL (CTRL + K) --- */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-start justify-center p-4 pt-20 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-xl w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 matches">
                <Lock className="w-4 h-4 text-indigo-500 animate-pulse" /> Command Search Console Base (Shortcut mode)
              </span>
              <button 
                onClick={() => { setShowCommandPalette(false); setCommandPaletteQuery(''); }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input query field */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text"
                value={commandPaletteQuery}
                onChange={(e) => setCommandPaletteQuery(e.target.value)}
                placeholder="Search notes, jump to section, execute tasks, trigger exports..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                autoFocus
              />
            </div>

            {/* Help guidelines */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div 
                onClick={() => { setActiveSubTab('notes'); setShowCommandPalette(false); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-600 text-[11px] font-bold"
              >
                📓 Notes Tab <span className="block text-[9px] text-slate-400">Shortcut <kbd className="bg-white px-1 rounded">N</kbd></span>
              </div>
              <div 
                onClick={() => { setActiveSubTab('expenses'); setShowCommandPalette(false); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-600 text-[11px] font-bold"
              >
                💳 Expenses Tab <span className="block text-[9px] text-slate-400">Shortcut <kbd className="bg-white px-1 rounded">E</kbd></span>
              </div>
              <div 
                onClick={() => { setActiveSubTab('tasks'); setShowCommandPalette(false); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-600 text-[11px] font-bold"
              >
                ⏱ Checklist Tab <span className="block text-[9px] text-slate-400">Shortcut <kbd className="bg-white px-1 rounded">T</kbd></span>
              </div>
            </div>

            {/* Filtered suggestions list based on commandPaletteQuery */}
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Available Actions Index</span>
              
              {/* If empty Query */}
              {!commandPaletteQuery.trim() ? (
                <div className="space-y-1 text-xs">
                  <div 
                    onClick={() => { handleExportAllToCSV(); setShowCommandPalette(false); }}
                    className="p-2.5 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl cursor-pointer flex items-center justify-between font-extrabold text-indigo-900"
                  >
                    <span>📦 Extract CSV Data Audit Spreadsheet</span>
                    <span className="text-[10px] bg-white border px-2.5 rounded font-bold">Go &rarr;</span>
                  </div>
                  <div 
                    onClick={() => { setActiveSubTab('ai_copilot'); setShowCommandPalette(false); }}
                    className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between font-extrabold text-slate-700"
                  >
                    <span>🧠 Summon Gemini deep AI diagnostics copilot</span>
                    <span className="text-[10px] bg-slate-100 border px-2.5 rounded font-bold">Jump</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {/* Notes matches */}
                  {notes.filter(n => n.title.toLowerCase().includes(commandPaletteQuery.toLowerCase())).map(n => (
                    <div 
                      key={n.id}
                      onClick={() => { setActiveSubTab('notes'); setShowCommandPalette(false); }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-700 block max-w-sm truncate">Note matching: "{n.title}"</span>
                      <span className="text-[9.5px] uppercase font-black text-slate-400">Notes tab</span>
                    </div>
                  ))}

                  {/* Expenses matches */}
                  {expenses.filter(e => e.description.toLowerCase().includes(commandPaletteQuery.toLowerCase()) || e.category.toLowerCase().includes(commandPaletteQuery.toLowerCase())).map(e => (
                    <div 
                      key={e.id}
                      onClick={() => { setActiveSubTab('expenses'); setShowCommandPalette(false); }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-700 block max-w-sm truncate">Cost match: "{e.description}" ({formatCurrency(e.amount)})</span>
                      <span className="text-[9.5px] uppercase font-black text-slate-400">Expenses tab</span>
                    </div>
                  ))}

                  {/* Tasks matches */}
                  {tasks.filter(t => t.name.toLowerCase().includes(commandPaletteQuery.toLowerCase())).map(t => (
                    <div 
                      key={t.id}
                      onClick={() => { setActiveSubTab('tasks'); setShowCommandPalette(false); }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold text-[#111111] block max-w-sm truncate">Checklist match: "{t.name}"</span>
                      <span className="text-[9.5px] uppercase font-black text-slate-400">Checklists tab</span>
                    </div>
                  ))}
                  
                  {/* Default search instructions */}
                  <div className="p-2 text-center text-slate-400 font-semibold italic text-[11px]">
                    Type keywords like "reorder", "milk", "momo" or press <kbd className="bg-slate-100/80 px-1 rounded border">Esc</kbd> to exit.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE 11: PROACTIVE ALARMS & INVOICE SYNC ANOMALIES BOARD --- */}
      {visibleWidgets.liveAlarms && (dynamicProactiveAlarmsList.length > 0 || syncDashboardAlerts.length > 0) && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 matches">
              <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" /> Proactive Operational Alerts ({dynamicProactiveAlarmsList.length + syncDashboardAlerts.length})
            </span>
            <span className="text-[9px] font-bold text-slate-400">Automatic Syncing Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Real-time Invoice/Inventory Sync suggestions (Feature 8) */}
            {syncDashboardAlerts.map((syncAlert, idx) => (
              <div key={`sync-${idx}`} className="bg-blue-50/50 border border-blue-200/60 p-3 rounded-2xl flex items-start gap-2.5">
                <div className="p-1 px-2 bg-blue-100 text-blue-800 text-[8px] font-black rounded-lg uppercase self-start mt-0.5">
                  Sync
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">{syncAlert.title}</h4>
                  <p className="text-[10px] text-slate-600 leading-normal font-semibold">{syncAlert.description}</p>
                  <div className="text-[9px] text-slate-400 font-bold flex items-center gap-2">
                    <span>Source: {syncAlert.triggerSource}</span>
                    <button 
                      onClick={() => {
                        if (syncAlert.suggestedAction.includes('Supplier')) {
                          setActiveSubTab('suppliers');
                          setSupNameInput('Mega Bottle Supplies');
                          setSupItemInput(syncAlert.title.replace('Low stock alert: ', ''));
                          setSupAmountInput('1500');
                          setShowSupplierModal(true);
                        } else {
                          setActiveSubTab('tasks');
                          setTaskName(syncAlert.title);
                          setTaskDesc(syncAlert.description);
                          setTaskDueDate(new Date().toISOString().split('T')[0]);
                          setShowTaskModal(true);
                        }
                      }}
                      className="text-blue-600 hover:underline hover:text-blue-800 uppercase font-bold"
                    >
                      {syncAlert.suggestedAction} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Dynamic alarms tracker alerts (Feature 11) */}
            {dynamicProactiveAlarmsList.slice(0, 4).map((alarm) => {
              const isCrit = alarm.severity === 'critical';
              return (
                <div 
                  key={alarm.id} 
                  className={cn(
                    "p-3 rounded-2xl flex items-start gap-2.5 border",
                    isCrit ? "bg-red-50/50 border-red-200/50" : "bg-amber-50/40 border-amber-200/40"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-lg self-start mt-0.5",
                    isCrit ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                  )}>
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-extrabold text-slate-950 leading-tight">{alarm.title}</h4>
                    <p className="text-[10px] text-slate-600 leading-normal font-semibold">{alarm.desc}</p>
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Logged: {alarm.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- FEATURE 20: HIGH-FIDELITY BUSINESS TRENDS & GRAPHICAL CHARTS --- */}
      {visibleWidgets.trendsCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="dashboard-custom-svg-charts">
          
          {/* Card 1: Cash Register Flows Gauge */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" /> Cash Registers Allocation Metrics
              </span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                Dual Ledger
              </span>
            </div>

            {/* SVG Visual comparison circles/gauges */}
            <div className="flex items-center gap-4 py-1">
              <div className="relative w-20 h-20 flex-shrink-0">
                {/* SVG Dial Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background track circle */}
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  {/* Inflow indicator sweep */}
                  <circle 
                    cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3.2" 
                    strokeDasharray="100"
                    strokeDashoffset={Math.max(10, 100 - (cashInVal / cashSumTotal * 100))}
                    strokeLinecap="round"
                  />
                  {/* Outflow indicator sweep (offset/nested or color track) */}
                  <circle 
                    cx="18" cy="18" r="13" fill="none" stroke="#f43f5e" strokeWidth="2.5" 
                    strokeDasharray="100"
                    strokeDashoffset={Math.max(10, 100 - (cashOutVal / cashSumTotal * 100))}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center Value Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[12px] font-black text-emerald-600 leading-none">
                    {Math.round((cashInVal / cashSumTotal * 100))}%
                  </span>
                  <span className="text-[7px] text-slate-400 uppercase font-black tracking-tight pt-0.5">Inflow</span>
                </div>
              </div>

              {/* Legend with precise details */}
              <div className="flex-1 space-y-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Cash Inflows</span>
                    <span className="font-mono text-slate-900">{formatCurrency(cashInVal, currencySymbol)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(cashInVal / cashSumTotal) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Expense Outflow</span>
                    <span className="font-mono text-slate-900">{formatCurrency(cashOutVal, currencySymbol)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(cashOutVal / cashSumTotal) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom active total */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-400">
              <span>Net Ledger Balance</span>
              <span className={cn(
                "font-mono text-xs font-black",
                cashFlowAnalytics.balance >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {cashFlowAnalytics.balance >= 0 ? '+' : ''}{formatCurrency(cashFlowAnalytics.balance, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Card 2: Interactive Expense Categories Weight */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart className="w-4 h-4 text-violet-600" /> Category Expense Weighting
              </span>
              <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full uppercase">
                Peak: {expenseAnalytics.highestCategory}
              </span>
            </div>

            {/* Relative progress bar distribution with hover interaction highlights */}
            <div className="space-y-3 max-h-24 overflow-y-auto pr-1">
              {Object.entries(expenseAnalytics.categorySums).map(([cat, total]) => {
                const totalNum = Number(total) || 0;
                const percent = Math.min(100, Math.round((totalNum / Math.max(1, expenseAnalytics.monthlyTotal)) * 100));
                return (
                  <div key={cat} className="group relative">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                      <span className="capitalize">{cat}</span>
                      <span className="font-mono text-[#111111]">{percent}% ({formatCurrency(totalNum, currencySymbol)})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-1 overflow-hidden relative">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          cat === 'Marketing' ? 'bg-indigo-500' :
                          cat === 'Logistics' ? 'bg-amber-500' :
                          cat === 'Wages' ? 'bg-emerald-500' :
                          cat === 'Suppliers' ? 'bg-violet-500' : 'bg-slate-400'
                        )}
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total logged expenses */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-400">
              <span>Overall Recorded Expense</span>
              <span className="text-slate-900 font-mono text-xs font-black">
                {formatCurrency(expenseAnalytics.monthlyTotal, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Card 3: Checklists & Supplier Logistics Health */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-600" /> Checklist & Logistics Health
              </span>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase">
                Active Audit
              </span>
            </div>

            <div className="space-y-4 py-1">
              {/* Task completion rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                  <span>Task Checklist Completion</span>
                  <span>
                    {tasks.filter(t => t.status === 'Completed').length} / {tasks.length} Completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              {/* Delivery logs reliability metrics */}
              <div className="flex items-center justify-between text-xs py-1">
                <div className="text-center bg-slate-50 border border-slate-100 p-2 rounded-2xl flex-1 mx-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 block pb-0.5">Delayed Supply</span>
                  <span className="text-sm font-black text-rose-600 font-mono">
                    {suppliers.filter(s => s.status === 'Delayed').length}
                  </span>
                </div>

                <div className="text-center bg-slate-50 border border-slate-100 p-2 rounded-2xl flex-1 mx-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 block pb-0.5">Pending Orders</span>
                  <span className="text-sm font-black text-amber-500 font-mono">
                    {suppliers.filter(s => s.status === 'Pending').length}
                  </span>
                </div>

                <div className="text-center bg-slate-50 border border-slate-100 p-2 rounded-2xl flex-1 mx-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 block pb-0.5">Delivered Orders</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {suppliers.filter(s => s.status === 'Delivered').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- FEATURE 10: ENTERPRISE GLOBAL SEARCH & EXPEDITION BAR --- */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 space-y-3 antialiased">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Main search inputs block with autocomplete/suggestions */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enterprise Global Search across notes, daily cost vouchers, cash flows, task checklist, suppliers..."
              value={globalSearchQuery}
              onChange={e => {
                const val = e.target.value;
                setGlobalSearchQuery(val);
                setSearchSuggestions(generateSearchSuggestions(val));
              }}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-extrabold focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
            />
            {globalSearchQuery && (
              <button 
                onClick={() => {
                  setGlobalSearchQuery('');
                  setSearchSuggestions([]);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 justify-end">
            {/* Advanced Filters toggler */}
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={cn(
                "px-3 py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border",
                showAdvancedSearch || globalFilterCat!=='all' || globalFilterPri!=='all' || globalFilterStatus!=='all'
                  ? "bg-slate-900 border-slate-950 text-white" 
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              )}
            >
              <Filter className="w-3.5 h-3.5" /> 
              <span className="hidden sm:inline">Advanced Filters</span>
            </button>

            {/* Feature 9: Mobile Voice Assistant */}
            <button 
              onClick={() => {
                setShowVoiceModal(true);
                handleTriggerVoiceSpeechSimulate();
              }}
              className="px-3 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              title="Voice Auto Capture Dictation"
            >
              <Mic className="w-3.5 h-3.5 animate-bounce-subtle text-indigo-600" />
              <span className="hidden sm:inline">Voice Dictation</span>
            </button>

            {/* Feature 12: Executive Report Compiler trigger */}
            <button 
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operations Summary</span>
            </button>
          </div>
        </div>

        {/* Real-time search Suggestions Dropdown */}
        {searchSuggestions.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 max-w-lg shadow-inner text-[10px] font-bold text-slate-700 space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 block px-2 mb-1">Recommended Queries</span>
            {searchSuggestions.map((sug, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                  setGlobalSearchQuery(sug);
                  setSearchSuggestions([]);
                }}
                className="w-full text-left p-1.5 hover:bg-white rounded-lg flex items-center gap-1.5 transition-all text-slate-800 font-extrabold"
              >
                <ChevronRight className="w-3 h-3 text-indigo-600" /> {sug}
              </button>
            ))}
          </div>
        )}

        {/* Feature 10: Advanced 5-in-1 Filter criteria dropdown drawer */}
        {showAdvancedSearch && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-black text-slate-500 uppercase animate-fade-in">
            <div className="space-y-1">
              <span>Category Sector</span>
              <select 
                value={globalFilterCat} 
                onChange={e=>setGlobalFilterCat(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="all">All Sectors</option>
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
              <span>Priority Range</span>
              <select 
                value={globalFilterPri} 
                onChange={e=>setGlobalFilterPri(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <span>Transaction Bounds</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input 
                  type="number" 
                  placeholder="Min GHS" 
                  value={globalFilterMinAmt} 
                  onChange={e=>setGlobalFilterMinAmt(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Max GHS" 
                  value={globalFilterMaxAmt} 
                  onChange={e=>setGlobalFilterMaxAmt(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span>Date Limits Frame</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input 
                  type="date" 
                  value={globalFilterStart} 
                  onChange={e=>setGlobalFilterStart(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <input 
                  type="date" 
                  value={globalFilterEnd} 
                  onChange={e=>setGlobalFilterEnd(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Quick reset button */}
            <div className="col-span-2 md:col-span-4 flex items-center justify-between border-t border-slate-200 pt-2 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400">Template Presets:</span>
                {savedFiltersList.map((preset, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setGlobalFilterPri(preset.config.priority || 'all');
                      setGlobalFilterCat(preset.config.category || 'all');
                      setGlobalFilterStatus(preset.config.status || 'all');
                      if (preset.config.dateStart) setGlobalFilterStart(preset.config.dateStart);
                    }}
                    className="p-1 px-2 border border-slate-200 hover:border-slate-400 font-extrabold text-[8px] bg-white rounded-lg cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  setGlobalFilterCat('all');
                  setGlobalFilterPri('all');
                  setGlobalFilterStatus('all');
                  setGlobalFilterMinAmt('');
                  setGlobalFilterMaxAmt('');
                  setGlobalFilterStart('');
                  setGlobalFilterEnd('');
                  setGlobalSearchQuery('');
                }}
                className="text-indigo-600 hover:underline font-black text-[9px]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- RENDER ACTIVE SUBTAB NAVIGATION TABS --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-2">
        <div className="flex flex-nowrap overflow-x-auto gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto antialiased">
          {[
            { id: 'notes', label: '🗒 Quick Notes', count: notes.filter(n=>!n.isArchived).length },
            { id: 'expenses', label: '💸 Daily Expenses', count: expenses.length },
            { id: 'cash_flow', label: '💱 Cash Flow Drawer', count: cashFlows.length },
            { id: 'tasks', label: '📌 Tasks Checklist', count: tasks.filter(t=>t.status !== 'Completed').length },
            { id: 'suppliers', label: '🚚 Suppliers logistics', count: suppliers.length },
            { id: 'activity_log', label: '⏱ Audit Timeline Feed', count: activities.length },
            { id: 'ai_copilot', label: '🧠 AI ERP intelligence', count: intelligentBrainInsights.length }
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

      {/* --- FEATURE 10: CROSS-MODULE UNIVERSAL SEARCH RESULTS PANEL --- */}
      {globalSearchQuery.trim() !== '' && (
        <div className="bg-[#fcfdfd] border border-slate-300 shadow-sm rounded-3xl p-6 space-y-6 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600 animate-pulse" /> Global Search Expedition Matches
              </h3>
              <p className="text-[10px] text-slate-500 font-bold">
                Located {totalSearchMatchesCount} operational segments matching query term "{globalSearchQuery}"
              </p>
            </div>
            <button 
              onClick={() => setGlobalSearchQuery('')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-black text-[9px] uppercase rounded-xl cursor-pointer"
            >
              Clear Search &rarr;
            </button>
          </div>

          {totalSearchMatchesCount === 0 ? (
            <div className="py-12 text-center italic text-slate-400 font-semibold space-y-2">
              <div>No ledger matches found for "{globalSearchQuery}" across active databases.</div>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Try searching for keywords like "milk", "momo", "reorder", or adjusting the min/max filters drawer above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Note entries */}
              {crossedSearchPoolResults.notes.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block border-l-2 border-l-indigo-600 pl-2">
                    🗒 Matching Internal Notes ({crossedSearchPoolResults.notes.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crossedSearchPoolResults.notes.map(n => (
                      <div key={n.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{n.category}</span>
                          <span className="text-[8px] font-black bg-red-50 text-red-800 px-1.5 py-0.5 rounded uppercase">{n.priority}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900">{n.title}</h4>
                        <p className="text-[11px] text-slate-600 font-semibold">{n.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense entries */}
              {crossedSearchPoolResults.expenses.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block border-l-2 border-l-rose-500 pl-2">
                    💸 Matching Voucher Expenses ({crossedSearchPoolResults.expenses.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crossedSearchPoolResults.expenses.map(exp => (
                      <div key={exp.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{exp.category}</span>
                          <span className="text-[11px] font-bold text-rose-600 font-mono">{formatCurrency(exp.amount, currencySymbol)}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-950">{exp.expenseName}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">Vendor: {exp.vendor} via {exp.paymentMethod}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cash Log entries */}
              {crossedSearchPoolResults.cashFlows.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block border-l-2 border-l-emerald-500 pl-2">
                    💱 Cash Flow Records ({crossedSearchPoolResults.cashFlows.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crossedSearchPoolResults.cashFlows.map(cf => (
                      <div key={cf.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{cf.category}</span>
                          <span className={cn(
                            "text-[10px] font-black font-mono",
                            cf.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                          )}>{cf.type === 'Cash In' ? '+' : '-'} {formatCurrency(cf.amount, currencySymbol)}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900">{cf.description}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">Inflow/Source: {cf.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks entries */}
              {crossedSearchPoolResults.tasks.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block border-l-2 border-l-amber-500 pl-2">
                    📌 Checklist Tasks ({crossedSearchPoolResults.tasks.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crossedSearchPoolResults.tasks.map(t => (
                      <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Due: {t.dueDate}</span>
                          <span className="text-[8px] font-black bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded uppercase">{t.priority}</span>
                        </div>
                        <h4 className={cn("font-extrabold text-slate-900", t.status === 'Completed' && 'line-through text-slate-400')}>{t.name}</h4>
                        <p className="text-[11px] text-slate-600 font-semibold">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers entries */}
              {crossedSearchPoolResults.suppliers.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block border-l-2 border-l-slate-600 pl-2">
                    🚚 Suppliers & Price Quotations ({crossedSearchPoolResults.suppliers.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {crossedSearchPoolResults.suppliers.map(sup => (
                      <div key={sup.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-subtle">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{sup.status}</span>
                          <span className="text-[11px] font-bold text-slate-950 font-mono">{formatCurrency(sup.amount, currencySymbol)}</span>
                        </div>
                        <h4 className="font-extrabold text-indigo-950 uppercase">{sup.supplierName}</h4>
                        <p className="text-[11px] text-slate-600 font-semibold">{sup.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT A:- RENDER INNER PANELS CONDITIONALLY UNDER ABSENCE OF GLOBAL TEXT QUEUE OVERRIDE */}
      {globalSearchQuery.trim() === '' && (
        <>
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

      {/* --- FEATURE 6: CENTRALIZED OPERATIONAL CHATTER TIMELINE --- */}
      {activeSubTab === 'activity_log' && (
        <div className="space-y-6">
          {/* Timeline filter and action bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block sm:inline mr-2">Filter Timeline</span>
              {[
                { id: 'all', label: 'All Activities' },
                { id: 'system', label: '⚙ System Tracked' },
                { id: 'manual', label: '👤 User Logged' },
                { id: 'critical', label: '🔥 Critical Priority' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActivitiesFilter(pill.id)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black rounded-xl transition-all cursor-pointer",
                    activitiesFilter === pill.id 
                      ? "bg-slate-900 border-slate-950 text-white" 
                      : "bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 hidden sm:inline">Grouping</span>
              <select 
                value={activitiesGrouping}
                onChange={e => setActivitiesGrouping(e.target.value as any)}
                className="p-2 bg-white border border-slate-200 text-xs font-bold rounded-xl focus:outline-none"
              >
                <option value="none">Chronological Feed</option>
                <option value="day">Group by Day</option>
                <option value="category">Group by Class</option>
              </select>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search timeline..."
                  value={activitiesQuery}
                  onChange={e => setActivitiesQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold focus:outline-none focus:border-slate-400 w-full sm:w-40"
                />
              </div>
            </div>
          </div>

          {/* Render Timeline feed */}
          {processedActivitiesList.length === 0 ? (
            <div className="py-16 bg-white border border-slate-200/60 rounded-3xl text-center italic text-xs text-slate-400">
              No recorded business feed operations match current criteria.
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 relative">
              
              {/* Odoo chatter-style connection lines */}
              <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-slate-100" />

              <div className="space-y-6 relative">
                {processedActivitiesList.map((act, index) => {
                  const isCrit = act.priority === 'Critical' || act.priority === 'High';
                  const isSys = act.user === 'System Heuristic';
                  
                  return (
                    <div key={act.id || index} className="flex items-start gap-4 group hover:bg-slate-50/40 p-2 rounded-2xl transition-all">
                      {/* Timeline Dot with specific Module iconography */}
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border relative z-10 z-[20]",
                        isCrit ? "bg-red-50 border-red-200 text-red-600" : 
                        isSys ? "bg-slate-50 border-slate-200 text-slate-500" :
                        "bg-indigo-50 border-indigo-200 text-indigo-600"
                      )}>
                        {act.relatedModule === 'Expenses' && <FileText className="w-3.5 h-3.5" />}
                        {act.relatedModule === 'Cash Flow' && <Coins className="w-3.5 h-3.5" />}
                        {act.relatedModule === 'Tasks' && <CheckCircle className="w-3.5 h-3.5" />}
                        {act.relatedModule === 'Suppliers' && <Truck className="w-3.5 h-3.5" />}
                        {act.relatedModule === 'Notes' && <FileText className="w-3.5 h-3.5" />}
                        {!['Expenses', 'Cash Flow', 'Tasks', 'Suppliers', 'Notes'].includes(act.relatedModule) && <Sparkles className="w-3.5 h-3.5" />}
                      </div>

                      {/* Chatter Speech Bubble Content */}
                      <div className="flex-1 bg-white hover:border-slate-300 border border-slate-100 p-4 rounded-2xl shadow-subtle space-y-2 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-[12px] text-slate-950">{act.title}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest",
                              act.activityType === 'Critical' ? 'bg-red-100 text-red-800' :
                              act.activityType === 'Finance' ? 'bg-emerald-100 text-emerald-800' :
                              act.activityType === 'Syslog' ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-600'
                            )}>
                              {act.activityType}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 font-mono">
                            <span>{act.timestamp}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 font-semibold leading-normal">{act.description}</p>

                        <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span>Actor: <b className="text-slate-705">{act.user}</b></span>
                            <span className="text-slate-200">|</span>
                            <span>Sector: <b className="text-indigo-600">{act.relatedModule}</b></span>
                          </div>
                          {isCrit && <span className="text-red-500 font-bold flex items-center gap-1">&#x26A0; High Alert</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- FEATURE 7: ARTIFICIAL CO-PILOT INTELLIGENCE BRAIN --- */}
      {activeSubTab === 'ai_copilot' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#111111] text-white p-5 rounded-3xl border border-slate-800 shadow relative">
            <div className="absolute top-2 right-4 text-[9px] bg-indigo-500/20 text-indigo-400 font-black tracking-widest px-2.5 py-1 rounded-full border border-indigo-400/20">
              ⚡ LIVE AI ANALYSIS FOR YOGURT FACTORY
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">Gemini Analytics Brain Copilot</h3>
              <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
                Our lightweight AI parsing models automatically scanned {notes.length} workspace entries and {expenses.length} expense ledgers to pinpoint leaks, delay warnings, and cost Optimization guidelines.
              </p>
            </div>
          </div>

          {/* AI Recommended Insights Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {intelligentBrainInsights.map((ins, index) => (
              <div 
                key={index} 
                className={cn(
                  "bg-white border rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow relative border-slate-200",
                  ins.severity === 'critical' ? 'border-l-4 border-l-rose-500' :
                  ins.severity === 'warning' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {ins.category}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                      ins.severity === 'critical' ? 'bg-red-50 text-red-700' :
                      ins.severity === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    )}>
                      {ins.severity}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-xs text-slate-950 leading-tight pt-1">{ins.title}</h4>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">{ins.recommendation}</p>
                </div>

                <div className="border-t border-slate-100 pt-2 text-[9px] font-extrabold text-[#111111] uppercase tracking-wider flex items-center justify-between">
                  <span>Saving Potential</span>
                  <span className="text-emerald-600 font-mono font-black">{ins.impact}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Note Highlighting Playground */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-inner">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Note Highlight Playground</span>
              <h4 className="text-[12px] font-extrabold text-slate-950">Extract checklist actions from physical workspace items</h4>
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                Click any business note below to run heuristic deep-matching. Our semantic model will auto-categorize fields, generate reminders, and discover concealed logistics paths instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active workspace notes</span>
                {notes.map(n => (
                  <button 
                    key={n.id}
                    onClick={() => handleDeepAIAnalyzeSelectedNote(n.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all bg-white hover:border-indigo-300",
                      aiAnalyzingSelectedNote === n.id ? 'border-2 border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                    )}
                  >
                    <div>
                      <span className="font-extrabold text-slate-950 block">{n.title}</span>
                      <span className="text-[9px] text-slate-400">Class: {n.category} | Priority: {n.priority}</span>
                    </div>
                    <span className="text-[9px] text-indigo-600 font-black uppercase text-xs">Analyze &rarr;</span>
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Gemini AI Insight Stream
                    </span>
                    {aiAnalyzingSelectedNote && <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Active</span>}
                  </div>

                  {aiAnalyzingSelectedNote ? (
                    <div className="text-[11px] text-slate-700 font-semibold leading-relaxed space-y-2 whitespace-pre-line">
                      {aiDeepExplanation}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[11px] text-slate-400 italic">
                      Select a workspace note on the left key list to initiate live semantic extraction.
                    </div>
                  )}
                </div>

                {aiAnalyzingSelectedNote && (
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Actions extracted: 3 suggestions</span>
                    <button 
                      onClick={() => {
                        const targetNote = notes.find(n => n.id === aiAnalyzingSelectedNote);
                        if (targetNote) {
                          setActiveSubTab('tasks');
                          setTaskName(`Check actions for "${targetNote.title}"`);
                          setTaskDesc(`Gemini AI suggestion: verify cost Optimizations and trace procurement guidelines.`);
                          setTaskDueDate(new Date().toISOString().split('T')[0]);
                          setTaskPriority('High');
                          setShowTaskModal(true);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      Convert to Action Task Checklist
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )}


  {/* --- MODALS CREATORS POPUPS FOR ALL ACTIVE SUBTABS --- */}

      {/* FEATURE 9: MOBILE VOICE DICTATION ASSISTANT DIALOG */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={() => setShowVoiceModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <Mic className="w-4 h-4 text-indigo-600 animate-bounce" /> Voice Commander Dictation
              </span>
              <button onClick={() => setShowVoiceModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="space-y-4 py-2">
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                {/* Voice soundwave animation simulation */}
                <div className="flex items-center gap-1.5 h-10">
                  <div className={cn("w-1 bg-indigo-600 rounded-full transition-all duration-350", voiceWaveActive ? "h-8 animate-pulse" : "h-2")} />
                  <div className={cn("w-1 bg-indigo-500 rounded-full transition-all duration-350 delay-75", voiceWaveActive ? "h-10 animate-pulse" : "h-3")} />
                  <div className={cn("w-1 bg-indigo-400 rounded-full transition-all duration-350 delay-150", voiceWaveActive ? "h-6 animate-pulse" : "h-2")} />
                  <div className={cn("w-1 bg-indigo-500 rounded-full transition-all duration-350 delay-75", voiceWaveActive ? "h-9 animate-pulse" : "h-3")} />
                  <div className={cn("w-1 bg-indigo-600 rounded-full transition-all duration-350", voiceWaveActive ? "h-4 animate-pulse" : "h-2")} />
                </div>
                <span className="text-xs font-bold text-slate-700 block text-xs">{voiceStatusMsg}</span>
                <p className="text-[10px] text-slate-400 font-medium">Capture team reminder checklists, supplier reorder contracts or daily expenditures hands-free.</p>
              </div>

              {/* Transcribed Text Result field */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400">Captured Dictation text</span>
                <textarea 
                  value={voiceInstructionText}
                  onChange={e => setVoiceInstructionText(e.target.value)}
                  placeholder="Your transcribed text will populate here..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none"
                />
              </div>

              {/* Try sample text buttons */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl text-[9px] font-medium text-slate-400">
                <span className="font-extrabold uppercase text-[8px] tracking-wider block">Or Try Sample Voice Commands:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => {
                      setVoiceInstructionText('Need to reorder plastic PET Yogurt bottles from Mega Bottle tomorrow morning high priority and check packaging cost caps.');
                      setVoiceStatusMsg('Sample text loaded');
                    }}
                    className="p-1 px-2 bg-white hover:bg-slate-100 border rounded-lg cursor-pointer text-slate-700 text-[10px]"
                  >
                    🚀 Supply order
                  </button>
                  <button 
                    onClick={() => {
                      setVoiceInstructionText('File daily marketing cost voucher: GHS 450 spent on direct Social Media ads via MoMo gateway, vendor Facebook Ads.');
                      setVoiceStatusMsg('Sample text loaded');
                    }}
                    className="p-1 px-2 bg-white hover:bg-slate-100 border rounded-lg cursor-pointer text-slate-700 text-[10px]"
                  >
                    💸 Marketing cost voucher
                  </button>
                  <button 
                    onClick={() => {
                      setVoiceInstructionText('Urgent reminder task check milk concentrate temperature levels before noon.');
                      setVoiceStatusMsg('Sample text loaded');
                    }}
                    className="p-1 px-2 bg-white hover:bg-slate-100 border rounded-lg cursor-pointer text-slate-700 text-[10px]"
                  >
                    📌 Task reminder
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <button 
                onClick={handleTriggerVoiceSpeechSimulate} 
                disabled={voiceWaveActive}
                className="px-3.5 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase rounded-xl cursor-pointer disabled:opacity-50"
              >
                {voiceWaveActive ? 'Processing voice...' : '🎤 Tap Microphone'}
              </button>
              <button 
                disabled={!voiceInstructionText.trim()}
                onClick={handleApplyVoiceAutoParse}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl cursor-pointer disabled:opacity-50"
              >
                Apply Parsing &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 12: EXECUTIVE REPORT COMPILER & SUMMARY PRINT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-subtle p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Executive Operations Summary Report
              </span>
              <button onClick={() => setShowReportModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            {/* Print Friendly Sheet */}
            <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1.5" id="printable-operations-report">
              <div className="bg-slate-50 border p-4 rounded-2xl border-slate-200 space-y-2 text-[10px] font-semibold text-slate-500 uppercase">
                <span className="text-slate-400 text-[8px] font-black block">WORKSPACE METRICS</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[#111111]">
                  <div className="bg-white border p-2 rounded-xl">
                    <span className="text-[8px] text-slate-400 block font-black">ACTIVE NOTES</span>
                    <span className="text-sm font-black">{generalLedgerOperationsReport.notesCount} items</span>
                  </div>
                  <div className="bg-white border p-2 rounded-xl">
                    <span className="text-[8px] text-slate-400 block font-black">EXPENSES REGISTERED</span>
                    <span className="text-sm font-black">{formatCurrency(generalLedgerOperationsReport.totalExpenses, currencySymbol)}</span>
                  </div>
                  <div className="bg-white border p-2 rounded-xl">
                    <span className="text-[8px] text-slate-400 block font-black">CASH INFLOW</span>
                    <span className="text-sm font-black text-emerald-600">{formatCurrency(generalLedgerOperationsReport.cashInflow, currencySymbol)}</span>
                  </div>
                  <div className="bg-white border p-2 rounded-xl">
                    <span className="text-[8px] text-slate-400 block font-black">TASKS SUCCESS %</span>
                    <span className="text-sm font-black">{generalLedgerOperationsReport.tasksCompleteRatio}%</span>
                  </div>
                </div>
              </div>

              {/* General Ledger Table summary description */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest pl-1 block">General Ledger Summary</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
                  <table className="w-full border-collapse text-left text-[11px] font-semibold">
                    <thead className="bg-slate-55 bg-slate-50 border-b text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="p-3">Ref Module</th>
                        <th className="p-3">Transaction Name</th>
                        <th className="p-3">Source/Category</th>
                        <th className="p-3">Placement Date</th>
                        <th className="p-3 text-right">Value Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* Render Cash Flow Logs */}
                      {cashFlows.slice(0, 4).map(cf => (
                        <tr key={cf.id} className="hover:bg-slate-50/20">
                          <td className="p-3 font-extrabold text-[9px] text-indigo-600 uppercase">Cash Flow</td>
                          <td className="p-3 text-slate-900">{cf.description}</td>
                          <td className="p-3 text-slate-500">{cf.category}</td>
                          <td className="p-3 text-slate-400 font-mono">{cf.date}</td>
                          <td className={cn(
                            "p-3 text-right font-black font-mono",
                            cf.type === 'Cash In' ? 'text-emerald-600' : 'text-slate-800'
                          )}>{cf.type === 'Cash In' ? '+' : '-'} {formatCurrency(cf.amount, currencySymbol)}</td>
                        </tr>
                      ))}

                      {/* Render Expense ledgers */}
                      {expenses.slice(0, 3).map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/20">
                          <td className="p-3 font-extrabold text-[9px] text-rose-600 uppercase">Expenses</td>
                          <td className="p-3 text-slate-900">{exp.expenseName}</td>
                          <td className="p-3 text-slate-500">{exp.category}</td>
                          <td className="p-3 text-slate-400 font-mono">{exp.date}</td>
                          <td className="p-3 text-right font-black font-mono text-rose-600">-{formatCurrency(exp.amount, currencySymbol)}</td>
                        </tr>
                      ))}

                      {/* Render Suppliers */}
                      {suppliers.slice(0, 2).map(sup => (
                        <tr key={sup.id} className="hover:bg-slate-50/20">
                          <td className="p-3 font-extrabold text-[9px] text-slate-600 uppercase">Supply Order</td>
                          <td className="p-3 text-slate-900">{sup.supplierName} ({sup.purchaseItem})</td>
                          <td className="p-3 text-slate-500">Status: {sup.status}</td>
                          <td className="p-3 text-slate-400 font-mono">{sup.date}</td>
                          <td className="p-3 text-right font-black font-mono text-slate-800">{formatCurrency(sup.amount, currencySymbol)}</td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra advisory log */}
              <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-2xl text-[10px] text-amber-900 font-medium leading-relaxed">
                <b>ERP Security Notice:</b> This operations summary contains internal notes, cash balances, and supplier price quotes. Treat these metrics confidentially as defined in workspace data policies.
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <button 
                onClick={() => {
                  const csvData = exportBusinessHubToCSV('Expenses', expenses);
                  // Simulate download
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `Yogurt_Hub_Expenses_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
                  a.click();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black uppercase rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Expenses (CSV)
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const printContents = document.getElementById('printable-operations-report')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`<html><head><title>General Ledger Summary</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"></head><body class="p-10 text-slate-900">${printContents}</body></html>`);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Ledger Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
