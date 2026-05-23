import { parseLocalDate } from '../views/ItemsSoldView';

export interface ProductInventory {
  description: string;
  totalStock: number;
  quantitySold: number;
  remainingStock: number;
  status: 'healthy' | 'low' | 'critical' | 'oversold';
  statusLabel: string;
  oversoldBy: number;
  averageDailySales: number;
  daysRemaining: number;
  daysRemainingLabel: string;
  recommendedRestock: number;
  restockStatus: 'urgent' | 'plan' | 'stable' | 'unknown';
  restockStatusLabel: string;
  urgencyScore: number; // 0 to 100
}

export interface InventoryIntelligenceResult {
  items: ProductInventory[];
  lowStockAlerts: { description: string; remaining: number; status: string }[];
  oversoldItems: { description: string; sold: number; stock: number; oversoldBy: number }[];
  restockRecommendations: {
    description: string;
    remaining: number;
    velocity: number;
    daysRemaining: number;
    suggestedUnits: number;
    statusLabel: string;
    insight: string;
  }[];
  urgencySummary: {
    criticalCount: number;
    lowCount: number;
    oversoldCount: number;
    totalProductsCount: number;
  };
}

// Default initial stocks for popular products to make UI alive instantly
export const DEFAULT_INITIAL_STOCKS: Record<string, number> = {
  'Caps': 100,
  'Glass': 120,
  'Yogs Vanilla': 60,
  'Yogs Strawberry': 60,
  'Capsules': 150,
  'Bottles': 200,
};

/**
 * Gets the list of deleted stock item descriptions.
 */
export function getDeletedStocks(userId: string): string[] {
  const key = `inv_deleted_v1_${userId}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading deleted stocks', e);
  }
  return [];
}

/**
 * Gets the configured starting stock for items.
 * Merges defaults and user custom stock adjustments from localStorage, omitting deleted ones.
 */
export function getStoredStocks(userId: string): Record<string, number> {
  const key = `inv_stock_v1_${userId}`;
  const deleted = getDeletedStocks(userId);
  let base = { ...DEFAULT_INITIAL_STOCKS };
  try {
    const data = localStorage.getItem(key);
    if (data) {
      base = { ...base, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error loading inventory stocks', e);
  }

  // Filter out any marked as deleted
  deleted.forEach(item => {
    delete base[item];
  });

  return base;
}

/**
 * Saves stock adjustments for an item.
 */
export function saveStoredStock(userId: string, description: string, value: number) {
  const key = `inv_stock_v1_${userId}`;
  try {
    const current = getStoredStocks(userId);
    current[description] = value;
    localStorage.setItem(key, JSON.stringify(current));

    // Remove from deleted blacklist if it was there
    const delKey = `inv_deleted_v1_${userId}`;
    const deleted = getDeletedStocks(userId);
    if (deleted.includes(description)) {
      const updated = deleted.filter(item => item !== description);
      localStorage.setItem(delKey, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Error saving stock adjustment', e);
  }
}

/**
 * Deletes / removes a stock item from display blacklist.
 */
export function deleteStoredStock(userId: string, description: string) {
  // Remove from custom adjustments if present
  const key = `inv_stock_v1_${userId}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      delete parsed[description];
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch (e) {
    console.error('Error removing stock from custom records', e);
  }

  // Add configuration to deleted blacklist
  const delKey = `inv_deleted_v1_${userId}`;
  try {
    const deleted = getDeletedStocks(userId);
    if (!deleted.includes(description)) {
      deleted.push(description);
      localStorage.setItem(delKey, JSON.stringify(deleted));
    }
  } catch (e) {
    console.error('Error blacklisting deleted stock helper', e);
  }
}

/**
 * Calculates days range observed in the dataset.
 */
export function getDaysObserved(
  filteredData: any[],
  selectedFilter: string,
  customStart?: string,
  customEnd?: string
): number {
  if (selectedFilter === 'today') return 1;
  if (selectedFilter === 'yesterday') return 1;
  if (selectedFilter === 'last7days') return 7;
  if (selectedFilter === 'last30days') return 30;
  if (selectedFilter === 'thisMonth' || selectedFilter === 'lastMonth') return 30;

  if (selectedFilter === 'custom' && customStart && customEnd) {
    const s = parseLocalDate(customStart);
    const e = parseLocalDate(customEnd);
    if (s && e) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }
  }

  // Fallback: search date spread in dataset
  if (filteredData.length > 0) {
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    filteredData.forEach(r => {
      const dateStr = r.invoices?.inv_date || r.invoices?.created_at || r.createdAt || r.date || r.invoiceDate;
      if (dateStr) {
        const d = parseLocalDate(dateStr);
        if (d) {
          if (!minDate || d < minDate) minDate = d;
          if (!maxDate || d > maxDate) maxDate = d;
        }
      }
    });

    if (minDate && maxDate) {
      const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 7; // default to a week if same day or single entry
    }
  }

  return 30; // standard fallback
}

/**
 * MASTER INVENTORY INTELLIGENCE ENGINE
 * Aggregates and calculates dynamic stock intelligence on active filtered sales items.
 */
export function generateInventoryIntelligence(
  filteredData: any[],
  userId: string,
  daysObserved: number,
  isAdmin: boolean = false
): InventoryIntelligenceResult {
  const stocks = getStoredStocks(userId);

  // Group filtered sales by description
  const salesByItem: Record<string, number> = {};
  filteredData.forEach(r => {
    const desc = r.description?.trim() || 'Unnamed Item';
    salesByItem[desc] = (salesByItem[desc] || 0) + (r.quantity || 0);
  });

  // Calculate items, details and warnings
  const items: ProductInventory[] = [];
  const lowStockAlerts: { description: string; remaining: number; status: string }[] = [];
  const oversoldItems: { description: string; sold: number; stock: number; oversoldBy: number }[] = [];
  const restockRecommendations: any[] = [];

  // Custom adjusted stock keys from localStorage
  let customAdjustmentKeys: string[] = [];
  try {
    const rawData = localStorage.getItem(`inv_stock_v1_${userId}`);
    if (rawData) {
      customAdjustmentKeys = Object.keys(JSON.parse(rawData));
    }
  } catch (e) {
    console.error(e);
  }

  const deleted = getDeletedStocks(userId);

  // Limit non-admin descriptions to only what they actually sold OR customized
  const allDescriptions = (isAdmin
    ? Array.from(new Set([...Object.keys(stocks), ...Object.keys(salesByItem)]))
    : Array.from(new Set([...customAdjustmentKeys, ...Object.keys(salesByItem)]))
  ).filter(desc => !deleted.includes(desc));

  let criticalCount = 0;
  let lowCount = 0;
  let oversoldCount = 0;

  const TARGET_INVENTORY_DAYS = 30;
  const URGENT_RESTOCK_DAYS = 14;

  allDescriptions.forEach(desc => {
    const quantitySold = salesByItem[desc] || 0;
    
    // Default config: fallback to 50 if product stock not set
    let totalStock = stocks[desc];
    if (totalStock === undefined) {
      // Intelligently default to a reasonable stock: twice sold amount or 50
      totalStock = quantitySold > 0 ? Math.max(50, Math.ceil(quantitySold * 1.5)) : 50;
    }

    const remainingStock = totalStock - quantitySold;
    const isOversold = remainingStock < 0;

    // Warning levels
    let status: 'healthy' | 'low' | 'critical' | 'oversold' = 'healthy';
    let statusLabel = 'Healthy';

    if (isOversold) {
      status = 'oversold';
      statusLabel = 'Oversold';
      oversoldCount++;
    } else if (remainingStock <= 5) {
      status = 'critical';
      statusLabel = 'Critical Low';
      criticalCount++;
    } else if (remainingStock <= 19) {
      status = 'low';
      statusLabel = 'Low Stock';
      lowCount++;
    }

    const oversoldBy = isOversold ? Math.abs(remainingStock) : 0;

    // Sales Velocity
    const averageDailySales = quantitySold / Math.max(daysObserved, 1);

    // Days Remaining
    let daysRemaining = Infinity;
    let daysRemainingLabel = 'Stable';
    if (remainingStock > 0) {
      if (averageDailySales > 0) {
        daysRemaining = remainingStock / averageDailySales;
        daysRemainingLabel = `${daysRemaining.toFixed(1)} days`;
      } else {
        daysRemaining = Infinity;
        daysRemainingLabel = 'No active sales';
      }
    } else if (remainingStock === 0) {
      daysRemaining = 0;
      daysRemainingLabel = 'Out of stock';
    } else {
      daysRemaining = 0;
      daysRemainingLabel = 'Oversold';
    }

    // Restock status
    let restockStatus: 'urgent' | 'plan' | 'stable' | 'unknown' = 'unknown';
    let restockStatusLabel = 'No recommendation';
    let suggestedUnits = 0;

    if (averageDailySales > 0) {
      if (daysRemaining < URGENT_RESTOCK_DAYS) {
        restockStatus = 'urgent';
        restockStatusLabel = 'Urgent Restock';
        // Suggest quantity to bring back to target days cover
        suggestedUnits = Math.ceil((TARGET_INVENTORY_DAYS * averageDailySales) - Math.max(0, remainingStock));
      } else if (daysRemaining <= TARGET_INVENTORY_DAYS) {
        restockStatus = 'plan';
        restockStatusLabel = 'Plan Restock';
        suggestedUnits = Math.ceil((TARGET_INVENTORY_DAYS * averageDailySales) - Math.max(0, remainingStock));
      } else {
        restockStatus = 'stable';
        restockStatusLabel = 'Stable';
      }
    } else {
      if (remainingStock <= 5) {
        restockStatus = 'plan';
        restockStatusLabel = 'Plan Restock';
        suggestedUnits = 20; // safe baseline
      } else {
        restockStatus = 'stable';
        restockStatusLabel = 'Stable';
      }
    }

    // Urgency score calculation for prioritization (0 to 100)
    let urgencyScore = 0;
    if (isOversold) {
      urgencyScore = 100;
    } else if (status === 'critical') {
      // Scale based on remaining units
      urgencyScore = 70 + (5 - remainingStock) * 4; // 70 to 90
    } else if (status === 'low') {
      urgencyScore = 40 + (19 - remainingStock) * 2; // 40 to 68
    } else {
      if (daysRemaining < 30) {
        urgencyScore = Math.max(10, 30 - daysRemaining);
      } else {
        urgencyScore = 10;
      }
    }

    items.push({
      description: desc,
      totalStock,
      quantitySold,
      remainingStock,
      status,
      statusLabel,
      oversoldBy,
      averageDailySales,
      daysRemaining,
      daysRemainingLabel,
      recommendedRestock: suggestedUnits,
      restockStatus,
      restockStatusLabel,
      urgencyScore,
    });
  });

  // Compile individual collections for lists and panels
  items.forEach(it => {
    if (it.status === 'oversold') {
      oversoldItems.push({
        description: it.description,
        sold: it.quantitySold,
        stock: it.totalStock,
        oversoldBy: it.oversoldBy,
      });
    } else if (it.status === 'low' || it.status === 'critical') {
      lowStockAlerts.push({
        description: it.description,
        remaining: it.remainingStock,
        status: it.statusLabel,
      });
    }

    if (it.averageDailySales > 0 || it.status === 'oversold' || it.status === 'critical') {
      let insight = '';
      if (it.status === 'oversold') {
        insight = `${it.description} is oversold by ${it.oversoldBy} units. Urgent review of transactions is required.`;
      } else if (it.daysRemaining <= 7) {
        insight = `${it.description} is selling rapidly. Estimated stock depletion in ${it.daysRemainingLabel}.`;
      } else if (it.daysRemaining <= 14) {
        insight = `${it.description} has elevated sales velocity. Prepare stock before depletion.`;
      } else {
        insight = `${it.description} maintains moderate, stable consumer interest. Track stock periodically.`;
      }

      restockRecommendations.push({
        description: it.description,
        remaining: Math.max(0, it.remainingStock),
        velocity: it.averageDailySales,
        daysRemaining: it.daysRemaining,
        suggestedUnits: it.recommendedRestock,
        statusLabel: it.restockStatusLabel,
        insight,
      });
    }
  });

  // Sort by urgency or velocity
  items.sort((a, b) => b.urgencyScore - a.urgencyScore);
  lowStockAlerts.sort((a, b) => a.remaining - b.remaining);
  oversoldItems.sort((a, b) => b.oversoldBy - a.oversoldBy);
  restockRecommendations.sort((a, b) => {
    if (a.daysRemaining === b.daysRemaining) return b.velocity - a.velocity;
    return a.daysRemaining - b.daysRemaining;
  });

  return {
    items,
    lowStockAlerts,
    oversoldItems,
    restockRecommendations,
    urgencySummary: {
      criticalCount,
      lowCount,
      oversoldCount,
      totalProductsCount: allDescriptions.length,
    },
  };
}
