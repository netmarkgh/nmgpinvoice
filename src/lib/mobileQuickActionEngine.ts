/**
 * MASTER MOBILE QUICK ACTIONS ENGINE
 * Handles touch targets, priority action assignment, badges, recent short-cuts, and responsive visibility settings.
 */

export interface DashboardState {
  filteredData: any[];
  inventoryIntelligence?: any;
  activeSearchQuery?: string;
  selectedDateFilter?: string;
  selectedClient?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  priority: 'high' | 'low';
  requiresPermission?: string;
  badge?: number | string;
}

export interface MobileShortcuts {
  recentSearches: string[];
  lastExport: string;
  recentClient: string;
  lastInvoice: string;
}

export interface QuickActionsResult {
  actions: QuickActionItem[];
  badges: Record<string, number | string>;
  visibility: {
    showQuickBar: boolean;
    showFloatingFAB: boolean;
  };
  shortcuts: MobileShortcuts;
  responsiveLayout: {
    showActionRow: boolean;
    priorityActions: QuickActionItem[];
    moreActions: QuickActionItem[];
  };
}

/**
 * FEATURE 10 - MOBILE ACTION SHORTCUT ACTIONS
 */
export function getMobileShortcuts(): MobileShortcuts {
  try {
    const defaultVal: MobileShortcuts = {
      recentSearches: ['caps', 'Vivian', 'invoice'],
      lastExport: 'PDF Report',
      recentClient: 'Vivian Yogs',
      lastInvoice: 'INV-2026-042'
    };
    const stored = localStorage.getItem('mobile_shortcuts_preferences');
    if (stored) {
      return { ...defaultVal, ...JSON.parse(stored) };
    }
    return defaultVal;
  } catch (e) {
    return {
      recentSearches: [],
      lastExport: 'None',
      recentClient: 'None',
      lastInvoice: 'None'
    };
  }
}

export function updateMobileShortcuts(partial: Partial<MobileShortcuts>) {
  try {
    const current = getMobileShortcuts();
    const updated = { ...current, ...partial };
    localStorage.setItem('mobile_shortcuts_preferences', JSON.stringify(updated));
    window.dispatchEvent(new Event('mobile_shortcuts_updated'));
  } catch (e) {
    console.error('Error updating shortcuts state', e);
  }
}

/**
 * MASTER QUICK ACTION ENGINE
 */
export function generateMobileQuickActions(
  dashboardState: DashboardState,
  screenSize: 'mobile' | 'tablet' | 'desktop',
  permissions: { isAdmin: boolean; canManageItems: boolean; canAccessSalesAnalytics: boolean }
): QuickActionsResult {

  // Calculate badges
  const lowStockCount = dashboardState.inventoryIntelligence?.items?.filter((i: any) => i.status === 'low' || i.status === 'critical').length || 0;
  const oversoldCount = dashboardState.inventoryIntelligence?.items?.filter((i: any) => i.status === 'oversold').length || 0;
  
  // Alerts count combines critical stock threat, oversold items, and receivables alert status
  const alertsCount = lowStockCount + oversoldCount;

  const badges: Record<string, number | string> = {
    alerts: alertsCount,
    inventory: lowStockCount,
    export: '✓ Ready'
  };

  // Define total action pool
  const actionPool: QuickActionItem[] = [
    {
      id: 'sale',
      label: 'New Sale',
      icon: '🧾',
      priority: 'high'
    },
    {
      id: 'stock',
      label: 'Add Stock',
      icon: '📦',
      priority: 'high',
      requiresPermission: 'can_manage_items',
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
    {
      id: 'search',
      label: 'Search',
      icon: '🔍',
      priority: 'high'
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: '⚙',
      priority: 'high'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: '🚨',
      priority: 'high',
      badge: alertsCount > 0 ? alertsCount : undefined
    },
    {
      id: 'export',
      label: 'Export',
      icon: '⬇',
      priority: 'low'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: '🔄',
      priority: 'low'
    }
  ];

  // Filter actions based on client permissions
  const permittedActions = actionPool.filter(action => {
    if (action.requiresPermission === 'can_manage_items' && !permissions.canManageItems && !permissions.isAdmin) {
      return false;
    }
    return true;
  });

  // Calculate layout priorities depending on screen size
  const highPriority = permittedActions.filter(a => a.priority === 'high');
  const lowPriority = permittedActions.filter(a => a.priority === 'low');

  let priorityActions: QuickActionItem[] = [];
  let moreActions: QuickActionItem[] = [];

  if (screenSize === 'mobile') {
    // Mobile limits visible buttons to prevent spacing issues
    priorityActions = permittedActions.slice(0, 4);
    moreActions = permittedActions.slice(4);
  } else if (screenSize === 'tablet') {
    priorityActions = permittedActions.slice(0, 5);
    moreActions = permittedActions.slice(5);
  } else {
    // Desktop enjoys all buttons in a expanded row
    priorityActions = permittedActions;
    moreActions = [];
  }

  // Visibility checks
  const showQuickBar = screenSize !== 'desktop';
  const showFloatingFAB = screenSize === 'mobile';

  const shortcuts = getMobileShortcuts();

  return {
    actions: permittedActions,
    badges,
    visibility: {
      showQuickBar,
      showFloatingFAB
    },
    shortcuts,
    responsiveLayout: {
      showActionRow: showQuickBar,
      priorityActions,
      moreActions
    }
  };
}
