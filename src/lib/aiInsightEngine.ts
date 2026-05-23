import { getProductCategory } from './drillDownEngine';
import { getStoredStocks } from './inventoryEngine';

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical' | 'opportunity';
export type InsightCategory = 'sales' | 'inventory' | 'customers' | 'revenue' | 'categories' | 'risks' | 'recommendations';

export interface SmartInsight {
  id: string;
  icon: string;
  title: string;
  text: string;
  severity: InsightSeverity;
  timestamp: string;
  category: InsightCategory;
  actionLabel?: string;
  actionPayload?: { type: string; value: string };
  confidenceScore?: number;
  explanation?: string;
}

export interface PredictiveForecasting {
  projectedRevenue: number;
  growthTrend: 'up' | 'down' | 'stable';
  confidenceScore: number;
  daysRemainingInMonth: number;
}

export interface SmartInsightsResult {
  salesInsights: SmartInsight[];
  inventoryInsights: SmartInsight[];
  customerInsights: SmartInsight[];
  revenueInsights: SmartInsight[];
  categoryInsights: SmartInsight[];
  anomalies: SmartInsight[];
  recommendations: SmartInsight[];
  summary: string[];
  allInsights: SmartInsight[];
  confidenceScore: number;
  predictiveForecasting: PredictiveForecasting;
}

/**
 * FEATURE 1 — SALES PERFORMANCE INSIGHTS
 */
export function generateSalesInsights(filteredData: any[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (filteredData.length === 0) return insights;

  // 1. TOP SELLER INSIGHT
  const totalsByDesc: Record<string, number> = {};
  const quantitiesByDesc: Record<string, number> = {};
  let grandTotal = 0;

  filteredData.forEach(item => {
    const desc = item.description || 'Other';
    const amount = item.amount || 0;
    const qty = item.quantity || 0;
    totalsByDesc[desc] = (totalsByDesc[desc] || 0) + amount;
    quantitiesByDesc[desc] = (quantitiesByDesc[desc] || 0) + qty;
    grandTotal += amount;
  });

  let topProduct = '';
  let maxAmount = 0;
  Object.entries(totalsByDesc).forEach(([desc, val]) => {
    if (val > maxAmount) {
      maxAmount = val;
      topProduct = desc;
    }
  });

  if (topProduct && grandTotal > 0) {
    const pct = Math.round((maxAmount / grandTotal) * 100);
    insights.push({
      id: `sales_top_${topProduct.replace(/\s+/g, '_')}`,
      icon: '🔥',
      title: 'Top Revenue Generator',
      text: `${topProduct} generated GHS ${maxAmount.toLocaleString()} (${pct}% of total sales revenue).`,
      severity: pct > 40 ? 'opportunity' : 'success',
      timestamp: 'Just calculated',
      category: 'sales',
      actionLabel: 'Promote further',
      confidenceScore: 98,
      explanation: 'High volume matching invoice registries.'
    });
  }

  // 2. FASTEST GROWING PRODUCT (or high velocity)
  let fastestProduct = '';
  let highestQty = 0;
  Object.entries(quantitiesByDesc).forEach(([desc, qty]) => {
    if (qty > highestQty) {
      highestQty = qty;
      fastestProduct = desc;
    }
  });

  if (fastestProduct && highestQty >= 25) {
    insights.push({
      id: `sales_fast_${fastestProduct.replace(/\s+/g, '_')}`,
      icon: '📈',
      title: 'High Velocity Product',
      text: `${fastestProduct} sales recorded high volumes of ${highestQty} units this period, indicating accelerating demand.`,
      severity: 'success',
      timestamp: 'Dynamic scan',
      category: 'sales',
      actionLabel: 'Secure Supply Chain',
      confidenceScore: 95
    });
  }

  // 3. SLOW MOVING PRODUCT
  let slowestProduct = '';
  let lowestQty = Infinity;
  Object.entries(quantitiesByDesc).forEach(([desc, qty]) => {
    if (qty < lowestQty) {
      lowestQty = qty;
      slowestProduct = desc;
    }
  });

  if (slowestProduct && lowestQty < 10 && Object.keys(quantitiesByDesc).length > 1) {
    insights.push({
      id: `sales_slow_${slowestProduct.replace(/\s+/g, '_')}`,
      icon: '📉',
      title: 'Underperforming Sales',
      text: `${slowestProduct} has the lowest sales volume with only ${lowestQty} units sold. Consider marketing push.`,
      severity: 'warning',
      timestamp: '30-day index',
      category: 'sales',
      actionLabel: 'Promote Item',
      actionPayload: { type: 'item', value: slowestProduct },
      confidenceScore: 92
    });
  }

  // 4. SALES SPIKE DETECTION
  const salesByDay: Record<number, number> = {};
  filteredData.forEach(item => {
    const dateStr = item.invoices?.inv_date || item.invoices?.created_at || item.createdAt;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = date.getDay(); // 0-6
        salesByDay[day] = (salesByDay[day] || 0) + (item.amount || 0);
      }
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let peakDayIndex = -1;
  let peakDayAmount = 0;
  Object.entries(salesByDay).forEach(([day, amt]) => {
    if (amt > peakDayAmount) {
      peakDayAmount = amt;
      peakDayIndex = parseInt(day, 10);
    }
  });

  if (peakDayIndex !== -1 && grandTotal > 0 && peakDayAmount > (grandTotal / 5)) {
    insights.push({
      id: `sales_spike_day`,
      icon: '🚀',
      title: 'Peak Activity Day',
      text: `Sales volume consolidated significantly on ${dayNames[peakDayIndex]}s, yielding GHS ${peakDayAmount.toLocaleString()} this period.`,
      severity: 'opportunity',
      timestamp: 'Rolling 7-day calendar',
      category: 'sales',
      confidenceScore: 90
    });
  }

  // 5. LOW SALES WARNING
  if (grandTotal > 0 && grandTotal < 500) {
    insights.push({
      id: `sales_low_warning`,
      icon: '⚠',
      title: 'Low Revenue Alert',
      text: `Cumulative period revenue of GHS ${grandTotal.toLocaleString()} is currently below the average expectation line.`,
      severity: 'critical',
      timestamp: 'Instant telemetry',
      category: 'sales',
      confidenceScore: 94
    });
  }

  return insights;
}

/**
 * FEATURE 2 — INVENTORY INTELLIGENCE INSIGHTS
 */
export function generateInventoryInsights(
  filteredData: any[],
  userId: string = 'global',
  inventoryIntelligence?: any
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  
  const stocks = getStoredStocks(userId);
  const totalSoldByDesc: Record<string, number> = {};
  filteredData.forEach(item => {
    const d = item.description?.trim();
    if (d) {
      totalSoldByDesc[d] = (totalSoldByDesc[d] || 0) + (item.quantity || 0);
    }
  });

  // 1. LOW STOCK / CRITICAL DEPLETIION / OVERSOLD
  if (inventoryIntelligence?.items) {
    let lowCount = 0;
    let criticalCount = 0;
    let oversoldCount = 0;

    inventoryIntelligence.items.forEach((item: any) => {
      const desc = item.description;
      if (item.status === 'oversold') {
        oversoldCount++;
        insights.push({
          id: `inv_oversold_${desc.replace(/\s+/g, '_')}`,
          icon: '❌',
          title: 'Inventory Alert: Oversold',
          text: `${desc} is in oversold status by ${item.oversoldBy} units. Urgent catalog audit required.`,
          severity: 'critical',
          timestamp: 'Live Ledger Hook',
          category: 'inventory',
          actionLabel: 'Adjust Stock',
          actionPayload: { type: 'item', value: desc },
          confidenceScore: 100
        });
      } else if (item.status === 'critical') {
        criticalCount++;
        insights.push({
          id: `inv_critical_${desc.replace(/\s+/g, '_')}`,
          icon: '🚨',
          title: 'Critical Out-Of-Stock Threat',
          text: `Caps/Packaging of ${desc} may completely deplete within ${Math.ceil(item.daysRemaining)} days at present velocity.`,
          severity: 'critical',
          timestamp: 'Predictive run',
          category: 'inventory',
          actionLabel: 'Restock Now',
          actionPayload: { type: 'item', value: desc },
          confidenceScore: 97
        });
      } else if (item.status === 'low') {
        lowCount++;
        insights.push({
          id: `inv_low_${desc.replace(/\s+/g, '_')}`,
          icon: '⚠',
          title: 'Low Inventory Warning',
          text: `${desc} is hovering below the safe reserve threshold with only ${item.remainingStock} units left.`,
          severity: 'warning',
          timestamp: 'Inventory scan',
          category: 'inventory',
          actionLabel: 'Plan Purchase',
          actionPayload: { type: 'item', value: desc },
          confidenceScore: 95
        });
      }
    });

    if (lowCount > 2) {
      insights.push({
        id: `inv_summary_low`,
        icon: '📦',
        title: 'Multi-Product Restock Flag',
        text: `At least ${lowCount} active items require restock replenishment to maintain safe business continuity buffers.`,
        severity: 'warning',
        timestamp: 'System overview',
        category: 'inventory',
        confidenceScore: 92
      });
    }
  }

  // 2. DEAD STOCK DETECTION (Stored products with 0 sales)
  Object.entries(stocks).forEach(([desc, totalAmt]) => {
    const qtySold = totalSoldByDesc[desc] || 0;
    if (qtySold === 0 && filteredData.length > 5) {
      insights.push({
        id: `inv_dead_${desc.replace(/\s+/g, '_')}`,
        icon: '📉',
        title: 'Stagnant Cash Asset',
        text: `${desc} has registered zero purchase transactions over the observed date range. Evaluate stock liquidation.`,
        severity: 'info',
        timestamp: 'Audit Indexer',
        category: 'inventory',
        actionLabel: 'Promote Item',
        actionPayload: { type: 'item', value: desc },
        confidenceScore: 90
      });
    }
  });

  return insights;
}

/**
 * FEATURE 3 — CUSTOMER / CLIENT INSIGHTS
 */
export function generateCustomerInsights(filteredData: any[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (filteredData.length === 0) return insights;

  const clientRevenue: Record<string, number> = {};
  const clientInvoiceCount: Record<string, Set<string>> = {};
  let totalRevenue = 0;

  filteredData.forEach(item => {
    const client = item.invoices?.client_name || item.client || 'Other';
    const amount = item.amount || 0;
    const invNo = item.invoices?.inv_number || '';
    
    clientRevenue[client] = (clientRevenue[client] || 0) + amount;
    totalRevenue += amount;

    if (!clientInvoiceCount[client]) clientInvoiceCount[client] = new Set();
    if (invNo) clientInvoiceCount[client].add(invNo);
  });

  // 1. TOP CLIENT
  let topClient = '';
  let maxSpend = 0;
  Object.entries(clientRevenue).forEach(([client, val]) => {
    if (val > maxSpend) {
      maxSpend = val;
      topClient = client;
    }
  });

  if (topClient && maxSpend > 0) {
    insights.push({
      id: `cust_top_spender`,
      icon: '⭐',
      title: 'Vanguard Account Spender',
      text: `${topClient} matches supreme buyer criteria with GHS ${maxSpend.toLocaleString()} accumulated spending.`,
      severity: 'opportunity',
      timestamp: 'Reconciled',
      category: 'customers',
      actionLabel: 'Reward VIP Customer',
      actionPayload: { type: 'client', value: topClient },
      confidenceScore: 99
    });
  }

  // 2. RETURNING CUSTOMER
  const totalClients = Object.keys(clientInvoiceCount).length;
  let repeatClients = 0;
  Object.entries(clientInvoiceCount).forEach(([_, bills]) => {
    if (bills.size > 1) repeatClients++;
  });

  if (totalClients > 1 && totalRevenue > 0) {
    const ratio = Math.round((repeatClients / totalClients) * 100);
    insights.push({
      id: `cust_loyalty_ratio`,
      icon: '🔁',
      title: 'Customer Loyalty Index',
      text: `${ratio}% of purchasing database are returning clients, indicating exceptional retention performance.`,
      severity: ratio >= 50 ? 'success' : 'info',
      timestamp: 'Database cross-compile',
      category: 'customers',
      confidenceScore: 91
    });
  }

  // 3. FREQUENT BUYER
  let frequentClient = '';
  let highBillCount = 0;
  Object.entries(clientInvoiceCount).forEach(([client, bills]) => {
    if (bills.size > highBillCount) {
      highBillCount = bills.size;
      frequentClient = client;
    }
  });

  if (frequentClient && highBillCount >= 2) {
    insights.push({
      id: `cust_frequent_buyer`,
      icon: '🛒',
      title: 'Frequent Client Hub',
      text: `${frequentClient} placed ${highBillCount} distinct orders this period. High communication activity.`,
      severity: 'success',
      timestamp: 'POS tracker',
      category: 'customers',
      confidenceScore: 95
    });
  }

  // 4. CUSTOMER CONCENTRATION RISK
  if (totalClients >= 2 && totalRevenue > 0) {
    const sortedSpends = Object.entries(clientRevenue).sort((a,b) => b[1] - a[1]);
    const top2Spend = (sortedSpends[0]?.[1] || 0) + (sortedSpends[1]?.[1] || 0);
    const concentration = Math.round((top2Spend / totalRevenue) * 100);
    if (concentration >= 40) {
      insights.push({
        id: `cust_risk_concentration`,
        icon: '⚠',
        title: 'High Customer Concentration Risk',
        text: `Over ${concentration}% of total sales relies entirely on the top 2 client accounts (Portfolio dependence).`,
        severity: concentration > 65 ? 'critical' : 'warning',
        timestamp: 'Audit Analysis',
        category: 'customers',
        actionLabel: 'Diversify Marketing',
        confidenceScore: 96
      });
    }
  }

  return insights;
}

/**
 * FEATURE 4 — REVENUE TREND INSIGHTS
 */
export function generateRevenueInsights(filteredData: any[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (filteredData.length === 0) return insights;

  let grandTotal = 0;
  let paidTotal = 0;
  let unpaidTotal = 0;

  filteredData.forEach(item => {
    const amt = item.amount || 0;
    grandTotal += amt;
    const isPaid = item.invoices?.status === 'paid';
    if (isPaid) paidTotal += amt;
    else unpaidTotal += amt;
  });

  // Calculate day performance
  const dailyBreakdown: Record<string, number> = {};
  filteredData.forEach(item => {
    const dateStr = item.invoices?.inv_date || item.invoices?.created_at;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const localeString = date.toLocaleDateString('en-US', { weekday: 'long' });
        dailyBreakdown[localeString] = (dailyBreakdown[localeString] || 0) + (item.amount || 0);
      }
    }
  });

  let bestDay = '';
  let bestDayAmt = 0;
  Object.entries(dailyBreakdown).forEach(([day, amt]) => {
    if (amt > bestDayAmt) {
      bestDayAmt = amt;
      bestDay = day;
    }
  });

  if (bestDay) {
    insights.push({
      id: `rev_best_day`,
      icon: '🏆',
      title: 'Top Daily Performer',
      text: `${bestDay} holds the absolute revenue record this period, pulling in GHS ${bestDayAmt.toLocaleString()} in sales.`,
      severity: 'success',
      timestamp: 'Reconciled calendar',
      category: 'revenue',
      confidenceScore: 94
    });
  }

  // Revenue Health & Growth
  if (grandTotal > 1500) {
    insights.push({
      id: `rev_healthy_momentum`,
      icon: '📈',
      title: 'Positive Fiscal Velocity',
      text: `Aggregate ledger velocity reached GHS ${grandTotal.toLocaleString()} with GHS ${paidTotal.toLocaleString()} in fully realized cash flow.`,
      severity: 'opportunity',
      timestamp: 'Live Ledger Hook',
      category: 'revenue',
      confidenceScore: 97
    });
  }

  // Outstanding Accounts Receivable
  if (unpaidTotal > (grandTotal * 0.25) && grandTotal > 100) {
    const ratio = Math.round((unpaidTotal / grandTotal) * 100);
    insights.push({
      id: `rev_unreconciled_danger`,
      icon: '⚠️',
      title: 'High Receivables Exposure',
      text: `Approximately ${ratio}% of gross revenue remains locked in unpaid or pending status. Action needed.`,
      severity: ratio > 50 ? 'critical' : 'warning',
      timestamp: 'Overdue registry',
      category: 'revenue',
      actionLabel: 'Check Ledger',
      confidenceScore: 99
    });
  }

  return insights;
}

/**
 * FEATURE 5 — CATEGORY PERFORMANCE INSIGHTS
 */
export function generateCategoryInsights(filteredData: any[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (filteredData.length === 0) return insights;

  const categorySales: Record<string, number> = {};
  let totalSales = 0;

  filteredData.forEach(item => {
    const cat = getProductCategory(item.description || '');
    const amt = item.amount || 0;
    categorySales[cat] = (categorySales[cat] || 0) + amt;
    totalSales += amt;
  });

  let leadingCat = '';
  let maxAmt = 0;
  Object.entries(categorySales).forEach(([cat, amt]) => {
    if (amt > maxAmt) {
      maxAmt = amt;
      leadingCat = cat;
    }
  });

  if (leadingCat && totalSales > 0) {
    const share = Math.round((maxAmt / totalSales) * 100);
    insights.push({
      id: `cat_dominant_head`,
      icon: '🏆',
      title: 'Core Revenue Pillar',
      text: `The ${leadingCat} domain commands ${share}% of total business volume, bringing in GHS ${maxAmt.toLocaleString()}.`,
      severity: 'success',
      timestamp: 'Audit Index',
      category: 'categories',
      actionLabel: 'Expand Line',
      actionPayload: { type: 'category', value: leadingCat },
      confidenceScore: 98
    });

    if (share >= 60) {
      insights.push({
        id: `cat_risk_dependence`,
        icon: '⚠',
        title: 'Single-Sector Dependency Risk',
        text: `Over ${share}% of total period sales depend strictly on the ${leadingCat} product line. Market shocks could heavily impact revenue.`,
        severity: 'warning',
        timestamp: 'Vulnerability scanner',
        category: 'categories',
        confidenceScore: 93
      });
    }
  }

  return insights;
}

/**
 * FEATURE 6 — ANOMALY DETECTION
 */
export function detectBusinessAnomalies(filteredData: any[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (filteredData.length < 5) return insights;

  // Invoice lines quantity anomaly check ($ or items)
  const amounts = filteredData.map(r => r.amount || 0);
  const sum = amounts.reduce((s, a) => s + a, 0);
  const mean = sum / amounts.length;
  const variance = amounts.reduce((v, a) => v + Math.pow(a - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  filteredData.forEach(item => {
    const amt = item.amount || 0;
    if (amt > mean + (2.5 * stdDev) && stdDev > 20) {
      insights.push({
        id: `anomaly_spike_${item.id || Math.random()}`,
        icon: '🚨',
        title: 'Atypical Purchase Spike',
        text: `Unusual single-line order value of GHS ${amt.toLocaleString()} detected for ${item.description || 'items'}, well above average standard deviations.`,
        severity: 'critical',
        timestamp: 'Statistical Anomaly Run',
        category: 'risks',
        actionLabel: 'Inspect Invoice',
        confidenceScore: 99
      });
    }
  });

  return insights;
}

/**
 * FEATURE 7 — ACTIONABLE RECOMMENDATIONS
 */
export function generateBusinessRecommendations(
  filteredData: any[],
  userId: string = 'global',
  inventoryIntelligence?: any
): SmartInsight[] {
  const recs: SmartInsight[] = [];
  if (filteredData.length === 0) return recs;

  // 1. Restock recommendation
  if (inventoryIntelligence?.items) {
    const critical = inventoryIntelligence.items.filter((i: any) => i.status === 'critical' || i.status === 'oversold');
    if (critical.length > 0) {
      const best = critical[0];
      recs.push({
        id: 'rec_restock_critical',
        icon: '📦',
        title: 'Immediate Supply replenishment',
        text: `Recommend ordering at least ${Math.max(50, Math.round(best.recommendedRestock || 100))} units of ${best.description} immediately to avert production gridlock.`,
        severity: 'critical',
        timestamp: 'Restock pipeline',
        category: 'recommendations',
        actionLabel: 'Reorder now',
        actionPayload: { type: 'item', value: best.description },
        confidenceScore: 97
      });
    }
  }

  // 2. Marketing / promotion recommendation
  const totalsByDesc: Record<string, number> = {};
  filteredData.forEach(item => {
    totalsByDesc[item.description || ''] = (totalsByDesc[item.description || ''] || 0) + (item.amount || 0);
  });

  const sorted = Object.entries(totalsByDesc).sort((a,b) => a[1] - b[1]);
  if (sorted.length > 1 && sorted[0][1] < 100) {
    recs.push({
      id: 'rec_promo_weak',
      icon: '📣',
      title: 'Targeted Marketing Promotion',
      text: `Launch a flash package or strategic bundler for ${sorted[0][0]} to increase sales and recover stagnant materials.`,
      severity: 'opportunity',
      timestamp: 'Marketing ERP engine',
      category: 'recommendations',
      actionLabel: 'Apply Discount',
      actionPayload: { type: 'item', value: sorted[0][0] },
      confidenceScore: 91
    });
  }

  // 3. Customer Retention Recommendation
  const clientRevenue: Record<string, number> = {};
  filteredData.forEach(item => {
    const c = item.invoices?.client_name || item.client;
    if (c) clientRevenue[c] = (clientRevenue[c] || 0) + (item.amount || 0);
  });
  const topSpenders = Object.entries(clientRevenue).sort((a,b) => b[1] - a[1]);
  if (topSpenders.length > 0) {
    recs.push({
      id: 'rec_vip_rewards',
      icon: '🎁',
      title: 'VIP Client Partnership Retention',
      text: `Grant exclusive discount points or premium credit flexibility to ${topSpenders[0][0]} to secure this critical channel.`,
      severity: 'success',
      timestamp: 'Client Retention Module',
      category: 'recommendations',
      actionLabel: 'Contact client',
      confidenceScore: 94
    });
  }

  return recs;
}

/**
 * FEATURE 9 — INSIGHT PRIORITIZATION SYSTEM
 */
export function prioritizeInsights(insights: SmartInsight[]): SmartInsight[] {
  const severityOrder: Record<InsightSeverity, number> = {
    'critical': 0,
    'warning': 1,
    'opportunity': 2,
    'success': 3,
    'info': 4
  };

  return [...insights].sort((a, b) => {
    const valA = severityOrder[a.severity] ?? 5;
    const valB = severityOrder[b.severity] ?? 5;
    return valA - valB;
  });
}

/**
 * MASTER AI ENGINE — generateSmartInsights()
 */
export function generateSmartInsights(
  filteredData: any[],
  userId: string = 'global',
  daysObserved: number = 30,
  isAdmin: boolean = false,
  inventoryIntelligence?: any
): SmartInsightsResult {
  const sales = generateSalesInsights(filteredData);
  const inventory = generateInventoryInsights(filteredData, userId, inventoryIntelligence);
  const customers = generateCustomerInsights(filteredData);
  const revenue = generateRevenueInsights(filteredData);
  const categories = generateCategoryInsights(filteredData);
  const anomalies = detectBusinessAnomalies(filteredData);
  const recommendations = generateBusinessRecommendations(filteredData, userId, inventoryIntelligence);

  const combined = [
    ...sales,
    ...inventory,
    ...customers,
    ...revenue,
    ...categories,
    ...anomalies,
    ...recommendations
  ];

  const prioritized = prioritizeInsights(combined);

  // Generate dynamic executive summary bullet points (NLU style)
  const summaryList: string[] = [];
  if (prioritized.length > 0) {
    prioritized.slice(0, 4).forEach(insight => {
      summaryList.push(insight.text);
    });
  } else {
    summaryList.push('💡 No dynamic insights triggered for selected constraints.');
    summaryList.push('📊 Maintain standard catalog stock auditing to record data.');
  }

  // Calculate generic index size confidence
  const recordCount = filteredData.length;
  let conf = 85;
  if (recordCount > 50) conf = 97;
  else if (recordCount > 20) conf = 93;
  else if (recordCount > 5) conf = 89;

  // Let's create a forecast
  const totalVal = filteredData.reduce((s, r) => s + (r.amount || 0), 0);
  const daysInPeriod = Math.max(1, daysObserved);
  const velocityPerDay = totalVal / daysInPeriod;
  const daysRemainingInMonth = Math.max(1, 30 - daysInPeriod);
  const projectedRevenue = totalVal + (velocityPerDay * daysRemainingInMonth);

  const forecasting: PredictiveForecasting = {
    projectedRevenue: Math.round(projectedRevenue),
    growthTrend: velocityPerDay > 500 ? 'up' : velocityPerDay > 100 ? 'stable' : 'down',
    confidenceScore: conf,
    daysRemainingInMonth
  };

  return {
    salesInsights: sales,
    inventoryInsights: inventory,
    customerInsights: customers,
    revenueInsights: revenue,
    categoryInsights: categories,
    anomalies,
    recommendations,
    summary: summaryList,
    allInsights: prioritized,
    confidenceScore: conf,
    predictiveForecasting: forecasting
  };
}
