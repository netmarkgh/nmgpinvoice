export function parseLocalDateEx(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const day = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

export function getCategoryForDescription(row: any): string {
  // Check if database or row contains direct category, group, type or productCategory
  const dbCategory = row.category || row.productCategory || row.type || row.group || row.product_category || row.invoices?.category || row.invoices?.type;
  if (dbCategory) return String(dbCategory).trim();

  const desc = (row.description || '').toLowerCase();
  
  if (desc.includes('cap') || desc.includes('hat') || desc.includes('shirt') || desc.includes('pant') || desc.includes('clothe') || desc.includes('wear') || desc.includes('fashion') || desc.includes('bag') || desc.includes('shoe')) {
    return 'Fashion & Apparel';
  }
  if (desc.includes('glass') || desc.includes('cup') || desc.includes('bottle') || desc.includes('jug') || desc.includes('mug') || desc.includes('plate') || desc.includes('bowl') || desc.includes('container')) {
    return 'Glassware & Kitchen';
  }
  if (desc.includes('yog') || desc.includes('milk') || desc.includes('dairy') || desc.includes('strawberry') || desc.includes('food') || desc.includes('snack') || desc.includes('chip') || desc.includes('greek')) {
    return 'Food & Groceries';
  }
  if (desc.includes('cola') || desc.includes('drink') || desc.includes('beverage') || desc.includes('water') || desc.includes('juice') || desc.includes('soda') || desc.includes('coffee') || desc.includes('tea')) {
    return 'Beverages';
  }
  if (desc.includes('consulting') || desc.includes('service') || desc.includes('hour') || desc.includes('setup') || desc.includes('fee') || desc.includes('support') || desc.includes('work') || desc.includes('audit')) {
    return 'Services';
  }
  if (desc.includes('software') || desc.includes('license') || desc.includes('app') || desc.includes('digital') || desc.includes('hosting')) {
    return 'Digital Products';
  }
  
  return 'Uncategorized';
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export interface BestSeller {
  item: string;
  qty: number;
  revenue: number;
  contributionPct: number;
}

export interface SlowMover {
  item: string;
  qty: number;
  revenue: number;
  performanceLabel: 'Critical Low Seller' | 'Low Seller' | 'Moderate Seller';
}

export interface CategoryStat {
  category: string;
  revenue: number;
  qty: number;
  contributionPct: number;
}

export interface RevenueTrendPoint {
  label: string;
  timestamp: number;
  revenue: number;
  txCount: number;
}

export function calculateBestSellers(filteredData: any[], totalRevenue: number): BestSeller[] {
  const grouped: { [key: string]: { qty: number; revenue: number } } = {};
  
  filteredData.forEach(r => {
    const key = r.description?.trim() || 'Unnamed Item';
    if (!grouped[key]) {
      grouped[key] = { qty: 0, revenue: 0 };
    }
    grouped[key].qty += r.quantity || 0;
    grouped[key].revenue += r.amount || 0;
  });

  return Object.entries(grouped).map(([item, stats]) => ({
    item,
    qty: stats.qty,
    revenue: stats.revenue,
    contributionPct: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
  }));
}

export function calculateSlowMovers(filteredData: any[]): SlowMover[] {
  const grouped: { [key: string]: { qty: number; revenue: number } } = {};
  
  filteredData.forEach(r => {
    const key = r.description?.trim();
    // Ignore 0-sale placeholders, null items, empty item names
    if (!key || (r.quantity || 0) <= 0) return;
    
    if (!grouped[key]) {
      grouped[key] = { qty: 0, revenue: 0 };
    }
    grouped[key].qty += r.quantity || 0;
    grouped[key].revenue += r.amount || 0;
  });

  const rawList = Object.entries(grouped)
    .map(([item, stats]) => ({
      item,
      qty: stats.qty,
      revenue: stats.revenue
    }))
    .filter(x => x.qty > 0);

  // We sort ascending to evaluate rank later
  const sortedByQty = [...rawList].sort((a, b) => a.qty - b.qty);
  const count = sortedByQty.length;

  return sortedByQty.map((mover, index) => {
    // Label calculation based on ranking percentile
    // 0% - 30% bottom : Critical Low Seller
    // 30% - 65% bottom : Low Seller
    // > 65% : Moderate Seller
    const percentile = count > 1 ? index / (count - 1) : 0;
    let performanceLabel: 'Critical Low Seller' | 'Low Seller' | 'Moderate Seller' = 'Moderate Seller';

    if (percentile <= 0.3) {
      performanceLabel = 'Critical Low Seller';
    } else if (percentile <= 0.65) {
      performanceLabel = 'Low Seller';
    }

    return {
      ...mover,
      performanceLabel
    };
  });
}

export function calculateCategoryPerformance(filteredData: any[], totalRevenue: number): CategoryStat[] {
  const grouped: { [key: string]: { revenue: number; qty: number } } = {};
  
  filteredData.forEach(r => {
    const catName = getCategoryForDescription(r);
    if (!grouped[catName]) {
      grouped[catName] = { revenue: 0, qty: 0 };
    }
    grouped[catName].revenue += r.amount || 0;
    grouped[catName].qty += r.quantity || 0;
  });

  return Object.entries(grouped)
    .map(([category, stats]) => ({
      category,
      revenue: stats.revenue,
      qty: stats.qty,
      contributionPct: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function calculateRevenueTrend(filteredData: any[], grouping: 'daily' | 'weekly' | 'monthly' | 'yearly'): RevenueTrendPoint[] {
  const buckets: { [key: string]: { label: string; timestamp: number; revenue: number; txCount: number } } = {};
  
  filteredData.forEach(r => {
    const itemDateStr = r.invoices?.inv_date || r.invoices?.created_at || r.createdAt || r.date || r.invoiceDate || r.timestamp;
    if (!itemDateStr) return;
    const dateObj = parseLocalDateEx(itemDateStr);
    if (!dateObj) return;

    let bucketKey = '';
    let label = '';
    let timestamp = 0;

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    if (grouping === 'daily') {
      bucketKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timestamp = new Date(year, month, day).getTime();
    } else if (grouping === 'weekly') {
      // Get week commencement
      const startOfWeek = new Date(dateObj);
      const dayOffset = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOffset);
      startOfWeek.setHours(0, 0, 0, 0);
      bucketKey = `${startOfWeek.getFullYear()}-W${getWeekNumber(startOfWeek)}`;
      label = `Wk of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      timestamp = startOfWeek.getTime();
    } else if (grouping === 'monthly') {
      bucketKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      timestamp = new Date(year, month, 1).getTime();
    } else if (grouping === 'yearly') {
      bucketKey = `${year}`;
      label = `${year}`;
      timestamp = new Date(year, 0, 1).getTime();
    }

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        label,
        timestamp,
        revenue: 0,
        txCount: 0
      };
    }
    buckets[bucketKey].revenue += r.amount || 0;
    buckets[bucketKey].txCount += 1;
  });

  return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
}

export function generateDashboardAnalytics(filteredData: any[]) {
  const totalRevenue = filteredData.reduce((s, r) => s + (r.amount || 0), 0);
  
  const bestSellersRaw = calculateBestSellers(filteredData, totalRevenue);
  const slowMoversRaw = calculateSlowMovers(filteredData);
  const categoryPerformance = calculateCategoryPerformance(filteredData, totalRevenue);
  
  return {
    totalRevenue,
    bestSellersRaw,
    slowMoversRaw,
    categoryPerformance
  };
}
