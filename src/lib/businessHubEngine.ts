/**
 * Business Operations Hub Engine
 * Handles internal Quick Notes, Cash In/Out Logs, Daily Expenses Trackers, Tasks, and Supplier Logistics.
 */

// --- Quick Notes Struct ---
export interface QuickNote {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Sales' | 'Inventory' | 'Customer' | 'Supplier' | 'Finance' | 'Marketing' | 'Operations';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
  createdDate: string;
  lastUpdated: string;
  isPinned: boolean;
  isArchived: boolean;
}

// --- Daily Expenses Struct ---
export interface DailyExpense {
  id: string;
  name: string;
  amount: number;
  category: 'Transport' | 'Utilities' | 'Marketing' | 'Packaging' | 'Stock Purchase' | 'Maintenance' | 'Staff' | 'Operations' | 'Internet' | 'Fuel';
  date: string;
  paymentMethod: string;
  vendor: string;
  notes?: string;
}

// --- Cash In / Cash Out Struct ---
export interface CashLog {
  id: string;
  name: string;
  amount: number;
  type: 'Cash In' | 'Cash Out';
  category: string;
  date: string;
  source: string;
  notes?: string;
}

// --- Tasks & Reminders Struct ---
export interface BusinessTask {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  reminderTime?: string;
  tags: string[];
}

// --- Supplier Notes Struct ---
export interface SupplierNote {
  id: string;
  supplierName: string;
  purchaseItem: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Shipped' | 'Completed' | 'Delayed';
  notes: string;
}

// --- Default Mock Workspace Seeds to present a beautifully populated HubSpot/Notion look ---
export const DEFAULT_QUICK_RECORDS: QuickNote[] = [
  {
    id: 'note-1',
    title: 'Restock Caps Tomorrow',
    description: 'Fashion category Caps are running low check inventory level alerts.',
    category: 'Inventory',
    priority: 'High',
    tags: ['restock', 'caps'],
    createdDate: '2026-05-24T10:00:00.000Z',
    lastUpdated: '2026-05-24T10:00:00.000Z',
    isPinned: true,
    isArchived: false,
  },
  {
    id: 'note-2',
    title: 'Customer Steven discount query',
    description: 'Steven requested special tier coupon codes for multi-box order next month.',
    category: 'Customer',
    priority: 'Medium',
    tags: ['discount', 'special-orders'],
    createdDate: '2026-05-23T14:30:00.000Z',
    lastUpdated: '2026-05-23T14:30:00.000Z',
    isPinned: false,
    isArchived: false,
  },
  {
    id: 'note-3',
    title: 'Supplier delayed shipment feedback',
    description: 'Vendor B claims regional trucking routes took an extra 2 days to fulfill milk carton orders.',
    category: 'Supplier',
    priority: 'Medium',
    tags: ['delay', 'logistics'],
    createdDate: '2026-05-22T09:00:00.000Z',
    lastUpdated: '2026-05-22T09:00:00.000Z',
    isPinned: false,
    isArchived: false,
  },
  {
    id: 'note-4',
    title: 'Yogurt combo promotions ideas',
    description: 'Create localized banner campaigns for strawberry flavor products.',
    category: 'Marketing',
    priority: 'Low',
    tags: ['social-media', 'promotions'],
    createdDate: '2026-05-21T11:00:00.000Z',
    lastUpdated: '2026-05-21T11:00:00.000Z',
    isPinned: false,
    isArchived: false,
  }
];

export const DEFAULT_EXPENSES_RECORDS: DailyExpense[] = [
  {
    id: 'exp-1',
    name: 'Carton Box Packaging boxes',
    amount: 120,
    category: 'Packaging',
    date: '2026-05-24',
    paymentMethod: 'MoMo',
    vendor: 'City Packagers Ltd',
    notes: 'Standard 200pcs supply run'
  },
  {
    id: 'exp-2',
    name: 'Delivery truck fuel refill',
    amount: 350,
    category: 'Fuel',
    date: '2026-05-24',
    paymentMethod: 'Cash',
    vendor: 'Total Energies Station',
    notes: 'Routine weekly fuel'
  },
  {
    id: 'exp-3',
    name: 'Internet fiber subscription',
    amount: 180,
    category: 'Internet',
    date: '2026-05-22',
    paymentMethod: 'MoMo',
    vendor: 'MTN Ghana Fibers',
    notes: 'Office operations connectivity link'
  }
];

export const DEFAULT_CASH_FLOWS: CashLog[] = [
  {
    id: 'cash-1',
    name: 'Yogurt sales invoice pay',
    amount: 480,
    type: 'Cash In',
    category: 'Client Revenue',
    date: '2026-05-24',
    source: 'Invoice payment #2390',
    notes: 'Settled by mobile money swift transfer'
  },
  {
    id: 'cash-2',
    name: 'Fuel payment dispatch',
    amount: 70,
    type: 'Cash Out',
    category: 'Fuel Dispatch',
    date: '2026-05-24',
    source: 'Petroleum Station Fuel',
  },
  {
    id: 'cash-3',
    name: 'Direct Store deposit incoming',
    amount: 1200,
    type: 'Cash In',
    category: 'Store Income',
    date: '2026-05-23',
    source: 'Cash register reconciliation',
  }
];

export const DEFAULT_TASKS: BusinessTask[] = [
  {
    id: 'task-1',
    name: 'Pay milk supplier Vendor B tomorrow',
    description: 'Ensure to settle outstanding invoice balances by 12:00 PM.',
    dueDate: '2026-05-26',
    priority: 'High',
    status: 'Pending',
    reminderTime: '09:00',
    tags: ['supplier', 'accounts-payable']
  },
  {
    id: 'task-2',
    name: 'Reconcile cash flow journal logs',
    description: 'Check active mobile money tokens to confirm balance matches.',
    dueDate: '2026-05-25',
    priority: 'Medium',
    status: 'In Progress',
    tags: ['reconcile', 'finance']
  },
  {
    id: 'task-3',
    name: 'Submit monthly operations filing',
    description: 'Assemble physical and digital invoices logs for administrative overview.',
    dueDate: '2026-05-24',
    priority: 'Critical',
    status: 'Completed',
    tags: ['tax', 'operations']
  }
];

export const DEFAULT_SUPPLIERS: SupplierNote[] = [
  {
    id: 'sup-1',
    supplierName: 'Vendor B Dairy Imports',
    purchaseItem: 'Milk cartons concentrate',
    amount: 4500,
    date: '2026-05-24',
    status: 'Completed',
    notes: 'Received bulk milk extract combo mix.'
  },
  {
    id: 'sup-2',
    supplierName: 'Mega Bottle Supplies',
    purchaseItem: 'PET Yogurt bottles packaging',
    amount: 1500,
    date: '2026-05-23',
    status: 'Delayed',
    notes: 'Delayed 2 days due to raw material processing backlogs.'
  }
];


// --- FEATURE 1: QUICK NOTES HELPERS ---

export function createQuickNote(notes: QuickNote[], newNote: Omit<QuickNote, 'id' | 'createdDate' | 'lastUpdated' | 'isPinned' | 'isArchived'>): QuickNote[] {
  const item: QuickNote = {
    ...newNote,
    id: `note-${Date.now()}`,
    createdDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isPinned: false,
    isArchived: false
  };
  return [item, ...notes];
}

export function updateQuickNote(notes: QuickNote[], id: string, updates: Partial<QuickNote>): QuickNote[] {
  return notes.map(n => n.id === id ? { ...n, ...updates, lastUpdated: new Date().toISOString() } : n);
}

export function deleteQuickNote(notes: QuickNote[], id: string): QuickNote[] {
  return notes.filter(n => n.id !== id);
}

export function searchNotes(notes: QuickNote[], query: string, filterType: string): QuickNote[] {
  let list = [...notes];
  const q = query.toLowerCase().trim();

  if (q) {
    list = list.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.description.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (filterType === 'pinned') list = list.filter(n => n.isPinned);
  else if (filterType === 'today') {
    const todayStr = new Date().toISOString().split('T')[0];
    list = list.filter(n => n.createdDate.startsWith(todayStr));
  }
  else if (filterType === 'sales') list = list.filter(n => n.category === 'Sales');
  else if (filterType === 'inventory') list = list.filter(n => n.category === 'Inventory');
  else if (filterType === 'high') list = list.filter(n => n.priority === 'High' || n.priority === 'Critical');
  else if (filterType === 'archived') list = list.filter(n => n.isArchived);
  else list = list.filter(n => !n.isArchived); // default doesn't show archived

  return list;
}


// --- FEATURE 2: DAILY EXPENSES HELPERS ---

export function createExpense(expenses: DailyExpense[], name: string, amount: number, category: DailyExpense['category'], vendor: string, paymentMethod: string, notes?: string): DailyExpense[] {
  const item: DailyExpense = {
    id: `exp-${Date.now()}`,
    name,
    amount,
    category,
    date: new Date().toISOString().split('T')[0],
    paymentMethod,
    vendor,
    notes
  };
  return [item, ...expenses];
}

export function updateExpense(expenses: DailyExpense[], id: string, updates: Partial<DailyExpense>): DailyExpense[] {
  return expenses.map(e => e.id === id ? { ...e, ...updates } : e);
}

export function generateExpenseAnalytics(expenses: DailyExpense[]) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Expenses calculated inside intervals
  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Simple current week lookup matching month calendar scale
  const isThisWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 65 * 60 * 24));
    return diffDays <= 7;
  };

  const weeklyTotal = expenses
    .filter(e => isThisWeek(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group categories to verify peak
  const categorySums: Record<string, number> = {};
  expenses.forEach(e => {
    categorySums[e.category] = (categorySums[e.category] || 0) + e.amount;
  });

  const sortedCats = Object.entries(categorySums).sort((a,b) => b[1] - a[1]);
  const highestCategory = sortedCats[0]?.[0] || 'Operations';
  const highestCategoryValue = sortedCats[0]?.[1] || 0;

  return {
    todayTotal,
    weeklyTotal,
    monthlyTotal,
    highestCategory,
    highestCategoryValue,
    categorySums
  };
}


// --- FEATURE 3: CASH FLOW LOG HELPERS ---

export function createCashLog(logs: CashLog[], name: string, amount: number, type: 'Cash In' | 'Cash Out', category: string, source: string, notes?: string): CashLog[] {
  const item: CashLog = {
    id: `cash-${Date.now()}`,
    name,
    amount,
    type,
    category,
    date: new Date().toISOString().split('T')[0],
    source,
    notes
  };
  return [item, ...logs];
}

export function generateCashFlowAnalytics(logs: CashLog[]) {
  const cashIn = logs
    .filter(l => l.type === 'Cash In')
    .reduce((sum, l) => sum + l.amount, 0);

  const cashOut = logs
    .filter(l => l.type === 'Cash Out')
    .reduce((sum, l) => sum + l.amount, 0);

  const balance = cashIn - cashOut;

  return {
    cashIn,
    cashOut,
    balance,
    netFlow: balance
  };
}


// --- FEATURE 4: TASKS & REMINDERS HELPERS ---

export function createTask(tasks: BusinessTask[], name: string, description: string, dueDate: string, priority: BusinessTask['priority'], reminderTime?: string, tags: string[] = []): BusinessTask[] {
  const item: BusinessTask = {
    id: `task-${Date.now()}`,
    name,
    description,
    dueDate,
    priority,
    status: 'Pending',
    reminderTime,
    tags
  };
  return [item, ...tasks];
}

export function completeTask(tasks: BusinessTask[], id: string): BusinessTask[] {
  return tasks.map(t => t.id === id ? { ...t, status: 'Completed' as const } : t);
}

export function generateTaskAlerts(tasks: BusinessTask[]) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const alertCount = pendingTasks.length;

  return {
    alertCount,
    highTasks: pendingTasks.filter(t => t.priority === 'High' || t.priority === 'Critical'),
    dueToday: pendingTasks.filter(t => t.dueDate === todayStr)
  };
}


// --- FEATURE 5: SUPPLIER WORKSPACE HELPERS ---

export function createSupplierNote(suppliers: SupplierNote[], supplierName: string, purchaseItem: string, amount: number, status: SupplierNote['status'], notes: string): SupplierNote[] {
  const item: SupplierNote = {
    id: `sup-${Date.now()}`,
    supplierName,
    purchaseItem,
    amount,
    date: new Date().toISOString().split('T')[0],
    status,
    notes
  };
  return [item, ...suppliers];
}

export function generateSupplierAnalytics(suppliers: SupplierNote[]) {
  const spendByName: Record<string, number> = {};
  suppliers.forEach(s => {
    spendByName[s.supplierName] = (spendByName[s.supplierName] || 0) + s.amount;
  });

  const sortedSuppliers = Object.entries(spendByName).sort((a,b) => b[1] - a[1]);
  const topSupplier = sortedSuppliers[0]?.[0] || 'N/A';
  const totalSpend = suppliers.reduce((sum, s) => sum + s.amount, 0);

  const delayedCount = suppliers.filter(s => s.status === 'Delayed').length;

  return {
    spendByName,
    topSupplier,
    totalSpend,
    delayedCount
  };
}
