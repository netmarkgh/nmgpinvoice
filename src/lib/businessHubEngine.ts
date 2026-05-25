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


// ==========================================
// --- FEATURE 6: OPERATIONAL TIMELINE ACTIVITY FIELDS & HELPERS ---
// ==========================================

export interface OperationalActivity {
  id: string;
  type: 'System' | 'Manual' | 'Expense' | 'Task' | 'Supplier' | 'Inventory' | 'Finance' | 'Reminder' | 'Notification';
  title: string;
  description: string;
  relatedModule: 'Notes' | 'Expenses' | 'Cash Flow' | 'Tasks' | 'Suppliers' | 'System';
  timestamp: string; // ISO string 
  user: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
}

export const DEFAULT_ACTIVITIES: OperationalActivity[] = [
  {
    id: 'act-1',
    type: 'Expense',
    title: 'Packaging expense filed',
    description: 'City Packagers Ltd voucher registered for carton boxes packaging: GHS 120.',
    relatedModule: 'Expenses',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5 hours ago
    user: 'Ops Manager',
    priority: 'Medium',
    status: 'Processed'
  },
  {
    type: 'Task',
    id: 'act-2',
    title: 'Checklist task completed',
    description: 'Task "Submit monthly operations filing" was marked completed on the checklist.',
    relatedModule: 'Tasks',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    user: 'Finance Lead',
    priority: 'Critical',
    status: 'Completed'
  },
  {
    type: 'Supplier',
    id: 'act-3',
    title: 'Supplier shipment delayed',
    description: 'Mega Bottle Supplies delivery flagged Delayed: Raw material bottlenecks at bottle fabrication.',
    relatedModule: 'Suppliers',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), // 20 hours ago
    user: 'Logistics Supervisor',
    priority: 'High',
    status: 'Pending Alert'
  },
  {
    type: 'Finance',
    id: 'act-4',
    title: 'Inflow register reconciled',
    description: 'Direct Store Deposit incoming recorded by register reconciliation: GHS 1,200.',
    relatedModule: 'Cash Flow',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(), // 28 hours ago
    user: 'General Clerk',
    priority: 'Medium',
    status: 'Reconciled'
  },
  {
    type: 'System',
    id: 'act-5',
    title: 'Operational workspace initialized',
    description: 'Odoo ERP Business Hub environment spun up and persistent browser memory mapped.',
    relatedModule: 'System',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    user: 'System Admin',
    priority: 'Low',
    status: 'Online'
  }
];

export function logActivity(
  activities: OperationalActivity[], 
  type: OperationalActivity['type'], 
  title: string, 
  description: string, 
  relatedModule: OperationalActivity['relatedModule'], 
  priority: OperationalActivity['priority'] = 'Medium',
  user: string = 'Current User'
): OperationalActivity[] {
  const newAct: OperationalActivity = {
    id: `act-${Date.now()}`,
    type,
    title,
    description,
    relatedModule,
    timestamp: new Date().toISOString(),
    user,
    priority,
    status: 'Active'
  };
  return [newAct, ...activities];
}

export function filterActivities(activities: OperationalActivity[], filterType: string, searchQuery: string = ''): OperationalActivity[] {
  let list = [...activities];
  const q = searchQuery.toLowerCase().trim();
  
  if (q) {
    list = list.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.user.toLowerCase().includes(q)
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterStr = yesterday.toISOString().split('T')[0];

  switch (filterType) {
    case 'today':
      list = list.filter(a => a.timestamp.startsWith(todayStr));
      break;
    case 'yesterday':
      list = list.filter(a => a.timestamp.startsWith(yesterStr));
      break;
    case 'this_week':
      const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
      list = list.filter(a => new Date(a.timestamp).getTime() >= sevenDaysAgo);
      break;
    case 'tasks':
      list = list.filter(a => a.relatedModule === 'Tasks');
      break;
    case 'expenses':
      list = list.filter(a => a.relatedModule === 'Expenses');
      break;
    case 'finance':
      list = list.filter(a => a.relatedModule === 'Cash Flow');
      break;
    case 'system':
      list = list.filter(a => a.type === 'System');
      break;
    default:
      break;
  }
  return list;
}

export function generateTimeline(activities: OperationalActivity[], grouping: 'none' | 'day' | 'category' = 'none') {
  if (grouping === 'none') {
    return [{ groupTitle: 'All Activities', items: activities }];
  }

  const groups: Record<string, OperationalActivity[]> = {};

  activities.forEach(act => {
    let key = 'Other';
    if (grouping === 'day') {
      const date = new Date(act.timestamp);
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterStr = yesterday.toISOString().split('T')[0];
      
      const fileDateStr = act.timestamp.split('T')[0];
      if (fileDateStr === todayStr) key = 'Today';
      else if (fileDateStr === yesterStr) key = 'Yesterday';
      else key = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (grouping === 'category') {
      key = act.type;
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(act);
  });

  return Object.entries(groups).map(([groupTitle, items]) => ({
    groupTitle,
    items
  }));
}


// ==========================================
// --- FEATURE 7: AI SMART NOTES ENGINE ---
// ==========================================

export function analyzeBusinessNotes(noteText: string): { 
  category: 'General' | 'Sales' | 'Inventory' | 'Customer' | 'Supplier' | 'Finance' | 'Marketing' | 'Operations'; 
  priority: 'Low' | 'Medium' | 'High' | 'Critical'; 
  tags: string[]; 
  reminderSuggestion?: string; 
  taskSuggestion?: string; 
} {
  const text = noteText.toLowerCase();
  
  let category: any = 'General';
  let priority: any = 'Medium';
  let tags: string[] = ['ai-suggested'];
  let reminderSuggestion: string | undefined;
  let taskSuggestion: string | undefined;

  // Pattern detection for category
  if (text.includes('fuel') || text.includes('petrol') || text.includes('oil') || text.includes('transport') || text.includes('travel')) {
    category = 'Operations';
    tags.push('fuel', 'logistics');
    if (text.includes('rising') || text.includes('increase') || text.includes('high')) {
      priority = 'High';
      tags.push('cost-alert');
    }
  } else if (text.includes('supplier') || text.includes('vendor') || text.includes('order') || text.includes('restock') || text.includes('purchas')) {
    category = 'Supplier';
    tags.push('supplier-lead', 'procurement');
    priority = 'High';
    if (text.includes('delay') || text.includes('stuck') || text.includes('overdue')) {
      priority = 'Critical';
      tags.push('critical-delivery');
    }
  } else if (text.includes('discount') || text.includes('client') || text.includes('customer') || text.includes('complaint') || text.includes('refund')) {
    category = 'Customer';
    tags.push('customer-satisfaction', 'crm');
    if (text.includes('complaint') || text.includes('angry')) {
      priority = 'Critical';
    }
  } else if (text.includes('revenue') || text.includes('tax') || text.includes('momo') || text.includes('cash') || text.includes('invoice') || text.includes('bank')) {
    category = 'Finance';
    tags.push('accounting', 'cash-flow');
  } else if (text.includes('campaign') || text.includes('ads') || text.includes('promo') || text.includes('marketing') || text.includes('banner')) {
    category = 'Marketing';
    tags.push('promo', 'traffic');
    priority = 'Low';
  } else if (text.includes('inventory') || text.includes('caps') || text.includes('bottles') || text.includes('cups') || text.includes('boxes') || text.includes('stock')) {
    category = 'Inventory';
    tags.push('warehouse', 'stock-levels');
    priority = 'High';
  }

  // Reminders suggestions detector
  if (text.includes('monday') || text.includes('tomorrow') || text.includes('next week') || text.includes('pay') || text.includes('due')) {
    let day = 'Monday';
    if (text.includes('tomorrow')) day = 'Tomorrow';
    else if (text.includes('friday')) day = 'Friday';
    
    reminderSuggestion = `Create Reminder Alert for ${day} at 8:00 AM?`;
  }

  // Task suggestion detector
  if (text.includes('need to') || text.includes('must') || text.includes('should') || text.includes('reorder') || text.includes('file') || text.includes('call')) {
    taskSuggestion = `Convert this note into an operational checklist task?`;
  }

  return {
    category,
    priority,
    tags,
    reminderSuggestion,
    taskSuggestion
  };
}

export function generateSmartInsights(
  notes: QuickNote[], 
  expenses: DailyExpense[], 
  tasks: BusinessTask[],
  suppliers: SupplierNote[]
) {
  const insights: {
    type: 'Cost Alerts' | 'Task Recommendations' | 'Priority Alerts' | 'Supplier Warnings' | 'Productivity Trends';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
    actionsText?: string;
    actionTab?: string;
  }[] = [];

  const pending = tasks.filter(t => t.status !== 'Completed');
  const overdue = tasks.filter(t => t.status === 'Overdue' || (t.status === 'Pending' && new Date(t.dueDate) < new Date()));
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const delayedSups = suppliers.filter(s => s.status === 'Delayed');

  // Insight 1: Spending Sector
  if (totalExp > 300) {
    const marketingSum = expenses.filter(e => e.category === 'Marketing').reduce((sum, e) => sum + e.amount, 0);
    const fuelSum = expenses.filter(e => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
    const topCatText = marketingSum > fuelSum ? 'Marketing spend has risen' : 'Fuel running costs alert';
    insights.push({
      type: 'Cost Alerts',
      title: 'High expenditure speed detected',
      description: `Cumulative cash-drawer expenses logged stand at GHS ${totalExp.toLocaleString()}. Principal load: ${topCatText}.`,
      severity: 'warning',
      actionsText: 'Tighten Expense Caps'
    });
  }

  // Insight 2: Task Backlogs
  if (pending.length > 0) {
    insights.push({
      type: 'Task Recommendations',
      title: 'Operational Action Pending',
      description: `You have ${pending.length} checklist items uncompleted. ${overdue.length} items remain overdue.`,
      severity: overdue.length > 0 ? 'critical' : 'warning',
      actionsText: 'View Tasks Checklist',
      actionTab: 'tasks'
    });
  } else {
    insights.push({
      type: 'Productivity Trends',
      title: 'Flawless Workflow Efficiency',
      description: 'Stellar operations! All registered pending checklist items are resolved. No backlog registered.',
      severity: 'success'
    });
  }

  // Insight 3: Supplier Delayed alert
  if (delayedSups.length > 0) {
    insights.push({
      type: 'Supplier Warnings',
      title: 'Supplier shipment bottlenecks delayed',
      description: `${delayedSups.length} critical logistics routes flagged delayed. Impacts inventory replenish.`,
      severity: 'critical',
      actionsText: 'Call Suppliers Now',
      actionTab: 'suppliers'
    });
  }

  // Insight 4: General trend mapping
  insights.push({
    type: 'Priority Alerts',
    title: 'Workspace Quick note insights',
    description: `You have drafted ${notes.filter(n=>!n.isArchived).length} quick workspace notes. Use tags to group.`,
    severity: 'info'
  });

  return insights;
}


// ==========================================
// --- FEATURE 8: DASHBOARD INTEGRATION SEEDS ---
// ==========================================

export function syncBusinessHubModules(filteredSalesLines: any[] = [], inventoryIssues: Array<{name: string, stock: number}> = []) {
  const suggestions: {
    title: string;
    description: string;
    triggerSource: string;
    suggestedAction: string;
    type: 'Sales' | 'Inventory' | 'Customer';
  }[] = [];

  // Low sales detect trigger mapping
  if (filteredSalesLines.length > 0) {
    // Check if sales are lower than general benchmark
    const totalSalesQuantity = filteredSalesLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    if (totalSalesQuantity < 20) {
      suggestions.push({
        title: 'Sales volume benchmark decrease',
        description: `Only ${totalSalesQuantity} items sold in current calendar window. Draft promo note?`,
        triggerSource: 'Sales Analytics Sync',
        suggestedAction: 'Create Marketing Note',
        type: 'Sales'
      });
    }
  }

  // Inventory triggers
  if (inventoryIssues && inventoryIssues.length > 0) {
    inventoryIssues.forEach(part => {
      suggestions.push({
        title: `Low stock alert: ${part.name}`,
        description: `Currently ${part.stock} left. Inventory threshold depleted.`,
        triggerSource: 'Inventory Intel Trigger',
        suggestedAction: 'Create Restock Reminder',
        type: 'Inventory'
      });
    });
  } else {
    // Seed logical defaults
    suggestions.push({
      title: 'Stock replenish safety check',
      description: 'Yogurt caps are at critically low stock levels. System recommends immediate vendor call.',
      triggerSource: 'Inventory Intel Sync',
      suggestedAction: 'Add Supplier Order',
      type: 'Inventory'
    });
  }

  return suggestions;
}


// ==========================================
// --- FEATURE 10: ADVANCED FILTER & MULTI SEARCH ENGINE ---
// ==========================================

export function searchBusinessHub(
  query: string,
  dataPool: {
    notes: QuickNote[];
    expenses: DailyExpense[];
    cashFlows: CashLog[];
    tasks: BusinessTask[];
    suppliers: SupplierNote[];
    activities: OperationalActivity[];
  },
  filters: {
    priority?: string;
    category?: string;
    status?: string;
    amountMin?: number;
    amountMax?: number;
    dateStart?: string;
    dateEnd?: string;
  }
) {
  const qObj = query.toLowerCase().trim();
  
  // Custom filter checking functions
  const matchDate = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemDate = dateStr.slice(0, 10);
    if (filters.dateStart && itemDate < filters.dateStart) return false;
    if (filters.dateEnd && itemDate > filters.dateEnd) return false;
    return true;
  };

  const matchAmount = (amount?: number) => {
    if (amount === undefined) return true;
    if (filters.amountMin !== undefined && amount < filters.amountMin) return false;
    if (filters.amountMax !== undefined && amount > filters.amountMax) return false;
    return true;
  };

  const matchPriority = (pri?: string) => {
    if (!filters.priority || filters.priority === 'all') return true;
    return pri?.toLowerCase() === filters.priority.toLowerCase();
  };

  const matchCategory = (cat?: string) => {
    if (!filters.category || filters.category === 'all') return true;
    return cat?.toLowerCase() === filters.category.toLowerCase();
  };

  // 1. Search Notes
  const notesResults = dataPool.notes.filter(n => {
    if (!matchDate(n.createdDate) || !matchPriority(n.priority) || !matchCategory(n.category)) return false;
    if (filters.status && filters.status !== 'all') {
      const isArchivedF = filters.status === 'archived';
      if (n.isArchived !== isArchivedF) return false;
    }
    return n.title.toLowerCase().includes(qObj) || 
           n.description.toLowerCase().includes(qObj) ||
           n.tags.some(t => t.toLowerCase().includes(qObj)) ||
           n.category.toLowerCase().includes(qObj);
  });

  // 2. Search Expenses
  const expensesResults = dataPool.expenses.filter(e => {
    if (!matchDate(e.date) || !matchAmount(e.amount) || !matchCategory(e.category)) return false;
    return e.name.toLowerCase().includes(qObj) || 
           e.vendor.toLowerCase().includes(qObj) || 
           e.category.toLowerCase().includes(qObj) ||
           (e.notes && e.notes.toLowerCase().includes(qObj));
  });

  // 3. Search Cash Logs
  const cashResults = dataPool.cashFlows.filter(c => {
    if (!matchDate(c.date) || !matchAmount(c.amount) || !matchCategory(c.category)) return false;
    return c.name.toLowerCase().includes(qObj) || 
           c.category.toLowerCase().includes(qObj) || 
           c.source.toLowerCase().includes(qObj) ||
           (c.notes && c.notes.toLowerCase().includes(qObj));
  });

  // 4. Search Checklist Tasks
  const tasksResults = dataPool.tasks.filter(t => {
    if (!matchDate(t.dueDate) || !matchPriority(t.priority)) return false;
    if (filters.status && filters.status !== 'all') {
      if (t.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    }
    return t.name.toLowerCase().includes(qObj) || 
           t.description.toLowerCase().includes(qObj) ||
           t.tags.some(tg => tg.toLowerCase().includes(qObj));
  });

  // 5. Search Suppliers 
  const supplierResults = dataPool.suppliers.filter(s => {
    if (!matchDate(s.date) || !matchAmount(s.amount)) return false;
    if (filters.status && filters.status !== 'all') {
      if (s.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    }
    return s.supplierName.toLowerCase().includes(qObj) || 
           s.purchaseItem.toLowerCase().includes(qObj) || 
           s.notes.toLowerCase().includes(qObj);
  });

  return {
    notes: notesResults,
    expenses: expensesResults,
    cashFlows: cashResults,
    tasks: tasksResults,
    suppliers: supplierResults
  };
}

export function generateSearchSuggestions(query: string): string[] {
  const lowercase = query.toLowerCase().trim();
  if (!lowercase) return [];

  const catalog = [
    'Marketing campaign notes',
    'Inventory restock levels',
    'Fuel petroleum ledger caps',
    'Pay milk suppliers checklist',
    'Reconcile MOMO entries',
    'Overdue critical task checklist',
    'Standard packaging supplies expenses',
    'High Priority notes logs',
    'Tax operations ledger filings',
    'Cash inflows direct registry'
  ];

  return catalog.filter(s => s.toLowerCase().includes(lowercase)).slice(0, 5);
}


// ==========================================
// --- FEATURE 12: EXPORT / REPORT ARCHITECTURE ---
// ==========================================

export function generateOperationsReport(
  notes: QuickNote[], 
  expenses: DailyExpense[], 
  tasks: BusinessTask[],
  suppliers: SupplierNote[],
  cashLogs: CashLog[]
) {
  const dateStr = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;
  const supplierSpend = suppliers.reduce((sum, s) => sum + s.amount, 0);

  const cashIn = cashLogs.filter(c => c.type === 'Cash In').reduce((sum, c) => sum + c.amount, 0);
  const cashOut = cashLogs.filter(c => c.type === 'Cash Out').reduce((sum, c) => sum + c.amount, 0);
  const netCash = cashIn - cashOut;

  return {
    dateStr,
    totalExp,
    tasksCompleted,
    supplierSpend,
    cashIn,
    cashOut,
    netCash,
    notesPublished: notes.length,
    overdueWarningCount: tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length,
    delayedDeliveries: suppliers.filter(s => s.status === 'Delayed').length
  };
}

export function exportBusinessHubToCSV(type: 'Notes' | 'Expenses' | 'CashLogs' | 'Tasks' | 'Suppliers' | 'Activities', data: any[]): string {
  if (!data || data.length === 0) return 'No records to export.';

  let headers: string[] = [];
  let rows: string[][] = [];

  switch (type) {
    case 'Notes':
      headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Tags', 'Created Date', 'Pinned', 'Archived'];
      rows = (data as QuickNote[]).map(n => [
        n.id, n.title, n.description, n.category, n.priority, n.tags.join('; '), n.createdDate, n.isPinned.toString(), n.isArchived.toString()
      ]);
      break;
    case 'Expenses':
      headers = ['ID', 'Name', 'Amount', 'Category', 'Date', 'PaymentMethod', 'Vendor', 'Notes'];
      rows = (data as DailyExpense[]).map(e => [
        e.id, e.name, e.amount.toString(), e.category, e.date, e.paymentMethod, e.vendor, e.notes || ''
      ]);
      break;
    case 'CashLogs':
      headers = ['ID', 'Name', 'Amount', 'Type', 'Category', 'Date', 'Source', 'Notes'];
      rows = (data as CashLog[]).map(c => [
        c.id, c.name, c.amount.toString(), c.type, c.category, c.date, c.source, c.notes || ''
      ]);
      break;
    case 'Tasks':
      headers = ['ID', 'Name', 'Description', 'Due Date', 'Priority', 'Status', 'Reminder Time', 'Tags'];
      rows = (data as BusinessTask[]).map(t => [
        t.id, t.name, t.description, t.dueDate, t.priority, t.status, t.reminderTime || '', t.tags.join('; ')
      ]);
      break;
    case 'Suppliers':
      headers = ['ID', 'Supplier', 'Item Sourced', 'Amount', 'Date', 'Status', 'Notes'];
      rows = (data as SupplierNote[]).map(s => [
        s.id, s.supplierName, s.purchaseItem, s.amount.toString(), s.date, s.status, s.notes
      ]);
      break;
    case 'Activities':
      headers = ['ID', 'Type', 'Title', 'Description', 'Related Module', 'Timestamp', 'User', 'Priority', 'Status'];
      rows = (data as OperationalActivity[]).map(a => [
        a.id, a.type, a.title, a.description, a.relatedModule, a.timestamp, a.user, a.priority, a.status
      ]);
      break;
  }

  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}


// ==========================================
// --- FEATURE 13, 14, 15, 16, 17, 18: MASTER HUB STORE & COMPLIANT SCHEMAS ---
// ==========================================

export interface HubNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  readStatus: 'Read' | 'Unread';
  createdAt: string;
}

export interface HubAIInsight {
  id: string;
  insightType: string;
  message: string;
  confidence: number;
  sourceModule: string;
  createdAt: string;
}

// Master state representation
export interface BusinessHubState {
  notes: QuickNote[];
  expenses: DailyExpense[];
  cashFlows: CashLog[];
  tasks: BusinessTask[];
  suppliers: SupplierNote[];
  activities: OperationalActivity[];
  notifications: HubNotification[];
  insights: HubAIInsight[];
}

// Memory-backed Local Store Registry (Simulating enterprise Zoho/Odoo Core State Management)
class BusinessHubStoreRegistry {
  private state: BusinessHubState = {
    notes: [],
    expenses: [],
    cashFlows: [],
    tasks: [],
    suppliers: [],
    activities: [],
    notifications: [],
    insights: []
  };

  private listeners: (() => void)[] = [];

  constructor() {
    this.initializeBusinessHub();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public initializeBusinessHub() {
    // Loads from client-side persistent databases
    const savedNotes = localStorage.getItem('hub_quick_notes');
    const savedExpenses = localStorage.getItem('hub_daily_expenses');
    const savedCash = localStorage.getItem('hub_cash_flows');
    const savedTasks = localStorage.getItem('hub_business_tasks');
    const savedSuppliers = localStorage.getItem('hub_supplier_notes');
    const savedActivities = localStorage.getItem('hub_operational_activities');
    const savedNotifications = localStorage.getItem('hub_notifications_log');
    const savedInsights = localStorage.getItem('hub_ai_insights_tbl');

    this.state = {
      notes: savedNotes ? JSON.parse(savedNotes) : DEFAULT_QUICK_RECORDS,
      expenses: savedExpenses ? JSON.parse(savedExpenses) : DEFAULT_EXPENSES_RECORDS,
      cashFlows: savedCash ? JSON.parse(savedCash) : DEFAULT_CASH_FLOWS,
      tasks: savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS,
      suppliers: savedSuppliers ? JSON.parse(savedSuppliers) : DEFAULT_SUPPLIERS,
      activities: savedActivities ? JSON.parse(savedActivities) : DEFAULT_ACTIVITIES,
      notifications: savedNotifications ? JSON.parse(savedNotifications) : [
        {
          id: 'notif-1',
          title: 'Welcome to ERP Business Hub',
          message: 'Secure sandbox synchronized with browser cookie/storage layers.',
          type: 'success',
          readStatus: 'Unread',
          createdAt: new Date().toISOString()
        }
      ],
      insights: savedInsights ? JSON.parse(savedInsights) : [
        {
          id: 'ins-1',
          insightType: 'Stock Replenish warning',
          message: 'PET bottle supplies will dry out soon based on expense and supplier records.',
          confidence: 0.94,
          sourceModule: 'Suppliers',
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    this.syncHubData();
  }

  public syncHubData() {
    localStorage.setItem('hub_quick_notes', JSON.stringify(this.state.notes));
    localStorage.setItem('hub_daily_expenses', JSON.stringify(this.state.expenses));
    localStorage.setItem('hub_cash_flows', JSON.stringify(this.state.cashFlows));
    localStorage.setItem('hub_business_tasks', JSON.stringify(this.state.tasks));
    localStorage.setItem('hub_supplier_notes', JSON.stringify(this.state.suppliers));
    localStorage.setItem('hub_operational_activities', JSON.stringify(this.state.activities));
    localStorage.setItem('hub_notifications_log', JSON.stringify(this.state.notifications));
    localStorage.setItem('hub_ai_insights_tbl', JSON.stringify(this.state.insights));
    this.notify();
  }

  public getState() {
    return this.state;
  }

  public setState(updates: Partial<BusinessHubState>) {
    this.state = { ...this.state, ...updates };
    this.syncHubData();
  }

  // Feature 13 core methods
  public rebuildBusinessAnalytics() {
    const expensesAnalytics = generateExpenseAnalytics(this.state.expenses);
    const cashFlowAnalysis = generateCashFlowAnalytics(this.state.cashFlows);
    const supplierAnalytics = generateSupplierAnalytics(this.state.suppliers);

    // Refresh notification triggers based on analytical rules
    const hasDelayed = supplierAnalytics.delayedCount > 0;
    const isOverBudget = expensesAnalytics.monthlyTotal > 5000;

    let updatedNotifs = [...this.state.notifications];
    if (hasDelayed && !this.state.notifications.some(n => n.title.includes('Delayed Supplier'))) {
      updatedNotifs.unshift({
        id: `notif-delay-${Date.now()}`,
        title: 'Delayed Supplier Warning Alert',
        message: 'Critical reorder items are sluggish. Logistics operations hampered.',
        type: 'warning',
        readStatus: 'Unread',
        createdAt: new Date().toISOString()
      });
    }

    if (isOverBudget && !this.state.notifications.some(n => n.title.includes('Budget Exceeded'))) {
      updatedNotifs.unshift({
        id: `notif-budget-${Date.now()}`,
        title: 'Monthly Budget Threshold Exceeded',
        message: 'Daily expenditures breached safety thresholds. Restructure procurement.',
        type: 'error',
        readStatus: 'Unread',
        createdAt: new Date().toISOString()
      });
    }

    this.setState({ notifications: updatedNotifs.slice(0, 15) });
  }

  public refreshWorkspace() {
    this.initializeBusinessHub();
    this.rebuildBusinessAnalytics();
  }

  // --- ACTIONS (Feature 15) ---
  public addNote(note: Omit<QuickNote, 'id' | 'createdDate' | 'lastUpdated' | 'isPinned' | 'isArchived'>) {
    const updated = createQuickNote(this.state.notes, note);
    const act = logActivity(this.state.activities, 'Manual', 'Quick Note Added', `Note "${note.title}" filed.`, 'Notes', note.priority);
    this.setState({ notes: updated, activities: act });
    this.rebuildBusinessAnalytics();
  }

  public updateNote(id: string, updates: Partial<QuickNote>) {
    const updated = updateQuickNote(this.state.notes, id, updates);
    this.setState({ notes: updated });
  }

  public deleteNote(id: string) {
    const updated = deleteQuickNote(this.state.notes, id);
    this.setState({ notes: updated });
    this.rebuildBusinessAnalytics();
  }

  public addExpense(expense: Omit<DailyExpense, 'id' | 'date'>) {
    const updated = createExpense(this.state.expenses, expense.name, expense.amount, expense.category, expense.vendor, expense.paymentMethod, expense.notes);
    const act = logActivity(this.state.activities, 'Expense', 'Expense Charged', `Voucher logged for ${expense.name}: GHS ${expense.amount}`, 'Expenses', 'Medium');
    this.setState({ expenses: updated, activities: act });
    this.rebuildBusinessAnalytics();
  }

  public updateExpense(id: string, updates: Partial<DailyExpense>) {
    const updated = updateExpense(this.state.expenses, id, updates);
    this.setState({ expenses: updated });
    this.rebuildBusinessAnalytics();
  }

  public addTask(task: Omit<BusinessTask, 'id' | 'status'>) {
    const updated = createTask(this.state.tasks, task.name, task.description, task.dueDate, task.priority, task.reminderTime, task.tags);
    const act = logActivity(this.state.activities, 'Task', 'New Task Delegated', `Task checkbox allocated: "${task.name}"`, 'Tasks', task.priority);
    this.setState({ tasks: updated, activities: act });
    this.rebuildBusinessAnalytics();
  }

  public completeTask(id: string) {
    const updated = completeTask(this.state.tasks, id);
    const task = this.state.tasks.find(t => t.id === id);
    let act = this.state.activities;
    if (task) {
      act = logActivity(this.state.activities, 'Task', 'Task Completed', `Checklist solved: "${task.name}"`, 'Tasks', 'Low');
    }
    this.setState({ tasks: updated, activities: act });
    this.rebuildBusinessAnalytics();
  }

  public logWorkspaceActivity(type: OperationalActivity['type'], title: string, desc: string, mod: OperationalActivity['relatedModule'], priority: OperationalActivity['priority']) {
    const act = logActivity(this.state.activities, type, title, desc, mod, priority);
    this.setState({ activities: act });
  }

  // --- SELECTORS (Feature 15) ---
  public getPinnedNotes() {
    return this.state.notes.filter(n => n.isPinned);
  }

  public getMonthlyExpenses() {
    return this.state.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  public getPendingTasks() {
    return this.state.tasks.filter(t => t.status !== 'Completed');
  }

  public getCashBalance() {
    const analytics = generateCashFlowAnalytics(this.state.cashFlows);
    return analytics.balance;
  }
}

export const BusinessHubStore = new BusinessHubStoreRegistry();

// ==========================================
// --- FEATURE 16: API SERVICE LAYER (Offline Ready Sync Queue Client) ---
// ==========================================

export class ServiceError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Queue task structure
export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  timestamp: string;
}

class BusinessHubAPIService {
  private isOfflineMode = false;
  private syncQueue: SyncQueueItem[] = [];

  constructor() {
    const savedQueue = localStorage.getItem('hub_api_sync_queue');
    if (savedQueue) this.syncQueue = JSON.parse(savedQueue);
  }

  public setOfflineMode(offline: boolean) {
    this.isOfflineMode = offline;
    localStorage.setItem('hub_offline_flag', offline.toString());
    if (!offline) {
      this.flushSyncQueue();
    }
  }

  public getOfflineMode() {
    const saved = localStorage.getItem('hub_offline_flag');
    if (saved) this.isOfflineMode = saved === 'true';
    return this.isOfflineMode;
  }

  private async mockAPILatency(timeoutMs = 150) {
    return new Promise(resolve => setTimeout(resolve, timeoutMs));
  }

  private addToQueue(endpoint: string, method: SyncQueueItem['method'], payload: any) {
    this.syncQueue.push({
      id: `queue-${Date.now()}-${Math.random()}`,
      endpoint,
      method,
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('hub_api_sync_queue', JSON.stringify(this.syncQueue));
    
    // Log helpful indicator
    BusinessHubStore.logWorkspaceActivity(
      'System',
      'API Mode: Offline Queue Added',
      `Command queued for ${endpoint} ${method}. Reconnect to post transactions.`,
      'System',
      'Low'
    );
  }

  private async flushSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    const queueToFlush = [...this.syncQueue];
    this.syncQueue = [];
    localStorage.setItem('hub_api_sync_queue', '[]');

    for (const item of queueToFlush) {
      try {
        await this.mockAPILatency(80);
        // Dispatch actions to store
        if (item.endpoint === '/api/notes') {
          if (item.method === 'POST') BusinessHubStore.addNote(item.payload);
          else if (item.method === 'DELETE') BusinessHubStore.deleteNote(item.payload.id);
        } else if (item.endpoint === '/api/expenses' && item.method === 'POST') {
          BusinessHubStore.addExpense(item.payload);
        } else if (item.endpoint === '/api/tasks') {
          if (item.method === 'POST') BusinessHubStore.addTask(item.payload);
          else if (item.method === 'PATCH') BusinessHubStore.completeTask(item.payload.id);
        }
      } catch (err) {
        // Re-inject failed on retry loss
        this.syncQueue.push(item);
      }
    }
    
    localStorage.setItem('hub_api_sync_queue', JSON.stringify(this.syncQueue));
    BusinessHubStore.logWorkspaceActivity(
      'System',
      'Synced Local Workspace Cache',
      `Synchronized database ledger completely. Operations pipeline cleared.`,
      'System',
      'Medium'
    );
  }

  // --- Endpoints interfaces mocks ---
  public NotesService = {
    get: async (): Promise<QuickNote[]> => {
      await this.mockAPILatency();
      return BusinessHubStore.getState().notes;
    },
    post: async (note: Omit<QuickNote, 'id' | 'createdDate' | 'lastUpdated' | 'isPinned' | 'isArchived'>) => {
      await this.mockAPILatency();
      if (this.isOfflineMode) {
        this.addToQueue('/api/notes', 'POST', note);
        return;
      }
      BusinessHubStore.addNote(note);
    },
    delete: async (id: string) => {
      await this.mockAPILatency();
      if (this.isOfflineMode) {
        this.addToQueue('/api/notes', 'DELETE', { id });
        return;
      }
      BusinessHubStore.deleteNote(id);
    }
  };

  public ExpensesService = {
    get: async (): Promise<DailyExpense[]> => {
      await this.mockAPILatency();
      return BusinessHubStore.getState().expenses;
    },
    post: async (expense: Omit<DailyExpense, 'id' | 'date'>) => {
      await this.mockAPILatency();
      if (this.isOfflineMode) {
        this.addToQueue('/api/expenses', 'POST', expense);
        return;
      }
      BusinessHubStore.addExpense(expense);
    }
  };

  public TasksService = {
    get: async (): Promise<BusinessTask[]> => {
      await this.mockAPILatency();
      return BusinessHubStore.getState().tasks;
    },
    post: async (task: Omit<BusinessTask, 'id' | 'status'>) => {
      await this.mockAPILatency();
      if (this.isOfflineMode) {
        this.addToQueue('/api/tasks', 'POST', task);
        return;
      }
      BusinessHubStore.addTask(task);
    },
    complete: async (id: string) => {
      await this.mockAPILatency();
      if (this.isOfflineMode) {
        this.addToQueue('/api/tasks', 'PATCH', { id });
        return;
      }
      BusinessHubStore.completeTask(id);
    }
  };

  public getQueueLength(): number {
    return this.syncQueue.length;
  }
}

export const BusinessHubAPI = new BusinessHubAPIService();

// ==========================================
// --- FEATURE 17: PERFORMANCE READY OPTIMIZATIONS ---
// ==========================================

export function optimizeBusinessHub<T>(feed: T[], limit = 15): T[] {
  // Return memoized subset of activities, logging lists to avoid rendering lag
  return feed.slice(0, limit);
}

export function cacheAnalytics(key: string, calculation: any, durationMs = 15000) {
  const meta = {
    val: calculation,
    expiresAt: Date.now() + durationMs
  };
  localStorage.setItem(`cache_calc_${key}`, JSON.stringify(meta));
}

// ==========================================
// --- FEATURE 18: ROLE-BASED ACCESS CONTROL MATRIX ---
// ==========================================

export type EnterpriseRole = 'Owner' | 'Admin' | 'Manager' | 'Staff' | 'Read Only';

export interface PermissionDefinition {
  canAddNote: boolean;
  canDeleteNote: boolean;
  canViewExpenses: boolean;
  canAddExpense: boolean;
  canAddCashFlow: boolean;
  canViewSuppliers: boolean;
  canModifySuppliers: boolean;
  canAddTasks: boolean;
  expenseAmountCap: number; // Staff cap e.g., 500 GHS maximum
}

export const ROLE_PERMISSIONS: Record<EnterpriseRole, PermissionDefinition> = {
  'Owner': {
    canAddNote: true,
    canDeleteNote: true,
    canViewExpenses: true,
    canAddExpense: true,
    canAddCashFlow: true,
    canViewSuppliers: true,
    canModifySuppliers: true,
    canAddTasks: true,
    expenseAmountCap: Infinity
  },
  'Admin': {
    canAddNote: true,
    canDeleteNote: true,
    canViewExpenses: true,
    canAddExpense: true,
    canAddCashFlow: true,
    canViewSuppliers: true,
    canModifySuppliers: true,
    canAddTasks: true,
    expenseAmountCap: Infinity
  },
  'Manager': {
    canAddNote: true,
    canDeleteNote: false, // can't empty note database
    canViewExpenses: true,
    canAddExpense: true,
    canAddCashFlow: true,
    canViewSuppliers: true,
    canModifySuppliers: true,
    canAddTasks: true,
    expenseAmountCap: 2000
  },
  'Staff': {
    canAddNote: true,
    canDeleteNote: false,
    canViewExpenses: true, // can view limited expenses
    canAddExpense: true,
    canAddCashFlow: false, // no cash drawer manipulation
    canViewSuppliers: false,
    canModifySuppliers: false,
    canAddTasks: true,
    expenseAmountCap: 500 // staff constraint
  },
  'Read Only': {
    canAddNote: false,
    canDeleteNote: false,
    canViewExpenses: true,
    canAddExpense: false,
    canAddCashFlow: false,
    canViewSuppliers: true,
    canModifySuppliers: false,
    canAddTasks: false,
    expenseAmountCap: 0
  }
};

export function validatePermissions(role: EnterpriseRole, action: keyof PermissionDefinition): boolean {
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return false;
  const value = perm[action];
  return typeof value === 'boolean' ? value : false;
}

export function secureBusinessAction(
  role: EnterpriseRole, 
  action: keyof PermissionDefinition, 
  contextAmount = 0,
  fallbackFormatCurrency?: (amt: number, sym: string) => string
): { allowed: boolean; reason?: string } {
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return { allowed: false, reason: 'Invalid corporate role validation' };

  const isEnabled = perm[action];
  if (typeof isEnabled === 'boolean' && !isEnabled) {
    return { allowed: false, reason: `Action denied. Role "${role}" does not have privilege level of: ${action}.` };
  }

  if (contextAmount > 0 && contextAmount > perm.expenseAmountCap) {
    const formattedCap = fallbackFormatCurrency ? fallbackFormatCurrency(perm.expenseAmountCap, 'GHS') : `GHS ${perm.expenseAmountCap}`;
    const formattedAttempt = fallbackFormatCurrency ? fallbackFormatCurrency(contextAmount, 'GHS') : `GHS ${contextAmount}`;
    return { 
      allowed: false, 
      reason: `Action blocked. Role "${role}" has strict transactional cap limit of ${formattedCap}. (Attempted: ${formattedAttempt})` 
    };
  }

  return { allowed: true };
}


