import React from 'react';
import { 
  Flame, 
  Award, 
  AlertTriangle, 
  AlertOctagon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  FileText, 
  Users, 
  Layers, 
  Coins, 
  CreditCard, 
  Smartphone, 
  Send, 
  Globe, 
  Edit3, 
  Printer, 
  Download, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  XCircle,
  TrendingUp as TrendingUpIcon,
  Minus
} from 'lucide-react';

export interface DashboardVisuals {
  colors: Record<string, any>;
  badges: Record<string, any>;
  progressBar: Record<string, any>;
  icons: Record<string, any>;
}

/**
 * FEATURE 1 - COLOR CODING SYSTEM
 * Translates a status code or metrics value into appropriate visual design tokens
 */
export function getStatusColor(type: 'payment' | 'performance' | 'inventory' | 'trend', value: string | number) {
  const normVal = String(value).toLowerCase().trim();

  // Return design tokens for light/dark mode compatibility
  switch (type) {
    case 'payment':
      if (normVal === 'paid') {
        return {
          background: 'bg-emerald-50 dark:bg-emerald-950/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          borderColor: 'border-emerald-200 dark:border-emerald-900/30',
          hoverBg: 'hover:bg-emerald-100/50',
          icon: 'CheckCircle2'
        };
      }
      if (normVal === 'pending') {
        return {
          background: 'bg-amber-50 dark:bg-amber-950/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-200 dark:border-amber-900/30',
          hoverBg: 'hover:bg-amber-100/50',
          icon: 'Clock'
        };
      }
      if (normVal === 'partial') {
        return {
          background: 'bg-orange-50 dark:bg-orange-950/30',
          textColor: 'text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-200 dark:border-orange-900/30',
          hoverBg: 'hover:bg-orange-100/50',
          icon: 'AlertTriangle'
        };
      }
      if (normVal === 'unpaid' || normVal === 'overdue') {
        return {
          background: 'bg-rose-50 dark:bg-rose-950/30',
          textColor: 'text-rose-700 dark:text-rose-400',
          borderColor: 'border-rose-200 dark:border-rose-900/30',
          hoverBg: 'hover:bg-rose-100/50',
          icon: 'XCircle'
        };
      }
      if (normVal === 'refunded') {
        return {
          background: 'bg-purple-50 dark:bg-purple-950/30',
          textColor: 'text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-200 dark:border-purple-900/30',
          hoverBg: 'hover:bg-purple-100/50',
          icon: 'RotateCcw'
        };
      }
      return {
        background: 'bg-slate-50 dark:bg-slate-900',
        textColor: 'text-slate-700 dark:text-slate-300',
        borderColor: 'border-slate-200 dark:border-slate-800',
        hoverBg: 'hover:bg-slate-100',
        icon: 'HelpCircle'
      };

    case 'performance':
      // Value represents performance level
      if (normVal === 'high' || normVal === 'topseller' || normVal === 'true') {
        return {
          background: 'bg-emerald-500/10',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          borderColor: 'border-emerald-500/20',
          icon: 'Flame'
        };
      }
      if (normVal === 'medium' || normVal === 'moderate') {
        return {
          background: 'bg-amber-500/10',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-500/20',
          icon: 'TrendingUp'
        };
      }
      if (normVal === 'low' || normVal === 'weak' || normVal === 'slow') {
        return {
          background: 'bg-rose-500/10',
          textColor: 'text-rose-700 dark:text-rose-400',
          borderColor: 'border-rose-500/20',
          icon: 'TrendingDown'
        };
      }
      return {
        background: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
        icon: 'Minus'
      };

    case 'inventory':
      const qty = typeof value === 'number' ? value : parseFloat(normVal);
      if (isNaN(qty)) {
        if (normVal.includes('oversold') || normVal.includes('exceed')) {
          return {
            background: 'bg-red-950 text-red-200 border-red-800',
            textColor: 'text-red-300',
            borderColor: 'border-red-900',
            icon: 'XCircle'
          };
        }
        if (normVal.includes('critical') || normVal.includes('urgent')) {
          return {
            background: 'bg-red-50 text-red-700 border-red-200',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            icon: 'AlertOctagon'
          };
        }
        if (normVal.includes('low')) {
          return {
            background: 'bg-orange-50 text-orange-700 border-orange-200',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
            icon: 'AlertTriangle'
          };
        }
        // Healthy
        return {
          background: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          icon: 'CheckCircle2'
        };
      }

      // Quantity range
      if (qty < 0) {
        return {
          background: 'bg-red-950/20 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-500/40',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-500/40',
          icon: 'AlertOctagon'
        };
      }
      if (qty === 0) {
        return {
          background: 'bg-red-500/10 text-red-500 border-red-500/20',
          textColor: 'text-red-500',
          borderColor: 'border-red-500/20',
          icon: 'AlertOctagon'
        };
      }
      if (qty <= 5) {
        return {
          background: 'bg-red-50 text-red-600 border-red-200',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          icon: 'AlertOctagon'
        };
      }
      if (qty <= 19) {
        return {
          background: 'bg-orange-50 text-orange-600 border-orange-200',
          textColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          icon: 'AlertTriangle'
        };
      }
      // Healthy
      return {
        background: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-100',
        icon: 'CheckCircle2'
      };

    case 'trend':
      if (normVal.startsWith('positive') || normVal.includes('up') || normVal.startsWith('+') || normVal === 'green') {
        return {
          background: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          icon: 'TrendingUp'
        };
      }
      if (normVal.startsWith('negative') || normVal.includes('down') || normVal.startsWith('-') || normVal === 'red') {
        return {
          background: 'bg-red-50 text-red-700 border-red-200',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: 'TrendingDown'
        };
      }
      return {
        background: 'bg-slate-50 text-slate-500 border-slate-200',
        textColor: 'text-slate-500',
        borderColor: 'border-slate-200',
        icon: 'Minus'
      };
  }
}

/**
 * FEATURE 2 - BADGE SYSTEM
 * Generates badge attributes dynamically with descriptive tooltips
 */
export function generateBadge(type: string, value?: string | number) {
  const normType = type.toUpperCase().replace(/\s+/g, '_');
  
  switch (normType) {
    case 'FAST_SELLER':
      return {
        label: '🔥 Fast Seller',
        bgClass: 'bg-gradient-to-r from-orange-500/15 to-rose-500/15 text-orange-700 border duration-150 border-orange-500/20',
        textClass: 'text-orange-700',
        tooltip: 'High velocity product with substantial sales frequency.'
      };
    case 'TOP_CLIENT':
      return {
        label: '⭐ Top Client',
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/30',
        textClass: 'text-indigo-700 dark:text-indigo-300',
        tooltip: 'VIP Client representing high spending contribution.'
      };
    case 'LOW_STOCK':
      return {
        label: '⚠ Low Stock',
        bgClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        textClass: 'text-amber-700',
        tooltip: 'Inventory level below optimal safety index.'
      };
    case 'CRITICAL_STOCK':
      return {
        label: '🚨 Critical Low',
        bgClass: 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse',
        textClass: 'text-rose-700',
        tooltip: 'Immediate depletion risk! Needs re-stocking.'
      };
    case 'OVERSOLD':
      return {
        label: '❌ Oversold',
        bgClass: 'bg-red-950/20 text-red-400 border border-red-500/30 font-bold',
        textClass: 'text-red-400',
        tooltip: 'Transactions sold volume exceeds initial stocked tracking!'
      };
    case 'NEW':
      return {
        label: '🆕 New Item',
        bgClass: 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30',
        textClass: 'text-sky-700',
        tooltip: 'Newly cataloged item in active observation period.'
      };
    case 'BEST_CATEGORY':
      return {
        label: '🏆 Leading Segment',
        bgClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium',
        textClass: 'text-emerald-700',
        tooltip: 'This category contributes the highest revenue share.'
      };
    case 'PAID':
      return {
        label: 'Paid',
        bgClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        textClass: 'text-emerald-800',
        tooltip: 'Fully reconciled transaction.'
      };
    case 'PENDING':
      return {
        label: 'Pending',
        bgClass: 'bg-amber-100 text-amber-800 border border-amber-200',
        textClass: 'text-amber-800',
        tooltip: 'Awaiting client remittance.'
      };
    case 'PARTIAL':
      return {
        label: 'Partial',
        bgClass: 'bg-orange-100 text-orange-800 border border-orange-200',
        textClass: 'text-orange-800',
        tooltip: 'Partial deposit collected; remaining balance outstanding.'
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        bgClass: 'bg-purple-100 text-purple-800 border border-purple-200',
        textClass: 'text-purple-800',
        tooltip: 'Funds original payment reversed.'
      };
    case 'CANCELLED':
      return {
        label: 'Void/X',
        bgClass: 'bg-slate-100 text-slate-700 border border-slate-200',
        textClass: 'text-slate-700',
        tooltip: 'Invoice cancelled or written off.'
      };
    default:
      return {
        label: String(value || type),
        bgClass: 'bg-slate-50 text-slate-600 border border-slate-100',
        textClass: 'text-slate-600',
        tooltip: 'System data status code.'
      };
  }
}

/**
 * FEATURE 3 - MINI PROGRESS BARS
 * Generates percentage markers and status colors mathematically
 */
export function generateProgressMetrics(current: number, max: number) {
  if (!max || max <= 0) {
    return {
      percent: 100,
      color: 'bg-slate-300 dark:bg-slate-700',
      label: 'N/A'
    };
  }

  const rawPercent = (current / max) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  let color = 'bg-emerald-500'; // Strong Performance (>= 75%)
  if (percent < 30) {
    color = 'bg-rose-500'; // Weak Performance (<30%)
  } else if (percent < 75) {
    color = 'bg-amber-500'; // Moderate Performance (30% - 75%)
  }

  return {
    percent,
    color,
    label: `${percent}%`
  };
}

/**
 * Checks if the global visual enhancements system is enabled.
 * Fetches preference from localStorage, defaulting to true to show off the system immediately.
 */
export function isUXEnhancedEnabled(): boolean {
  try {
    const val = localStorage.getItem('global_ux_enhancements_enabled');
    return val !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Sets the website's enhancement status.
 */
export function toggleUXEnhanced(enabled: boolean) {
  try {
    localStorage.setItem('global_ux_enhancements_enabled', String(enabled));
    window.dispatchEvent(new Event('ux_enhancement_toggled'));
  } catch (e) {
    console.error('Error holding preference key', e);
  }
}

/**
 * Checks if the AI-Driven Smart Insights Engine is enabled.
 * Fetches preference from localStorage, defaulting to true to enable the intelligence layer immediately.
 */
export function isAIInsightsEnabled(): boolean {
  try {
    const val = localStorage.getItem('global_ai_insights_enabled');
    return val !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Sets the website's AI-Driven Smart Insights Engine status.
 */
export function toggleAIInsights(enabled: boolean) {
  try {
    localStorage.setItem('global_ai_insights_enabled', String(enabled));
    window.dispatchEvent(new Event('ai_insights_toggled'));
  } catch (e) {
    console.error('Error holding AI Insights preference key', e);
  }
}

/**
 * Checks if the Mobile-Friendly Quick Actions Layer is enabled.
 * Fetches preference from localStorage, defaulting to true to enable the quick actions layer immediately.
 */
export function isMobileQuickActionsEnabled(): boolean {
  try {
    const val = localStorage.getItem('global_mobile_quick_actions_enabled');
    return val !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Sets the website's Mobile-Friendly Quick Actions Layer status.
 */
export function toggleMobileQuickActions(enabled: boolean) {
  try {
    localStorage.setItem('global_mobile_quick_actions_enabled', String(enabled));
    window.dispatchEvent(new Event('mobile_quick_actions_toggled'));
  } catch (e) {
    console.error('Error holding Mobile Quick Actions preference key', e);
  }
}

/**
 * FEATURE 13 - CENTRALIZED PIPELINE
 * Translates a collection of active invoices into dashboard summary stats.
 */
export function generateDashboardVisuals(filteredData: any[]) {
  const isEnabled = isUXEnhancedEnabled();
  if (!isEnabled) {
    return {
      enabled: false,
      summary: null
    };
  }

  // Derive top stats for visual summary line
  const totalsByDesc: Record<string, { qty: number; value: number }> = {};
  filteredData.forEach(item => {
    const desc = item.description || 'Other';
    if (!totalsByDesc[desc]) totalsByDesc[desc] = { qty: 0, value: 0 };
    totalsByDesc[desc].qty += (item.quantity || 0);
    totalsByDesc[desc].value += (item.amount || 0);
  });

  const uniqueItems = Object.keys(totalsByDesc);
  const fastSellers = uniqueItems.filter(desc => totalsByDesc[desc].qty >= 25);
  
  return {
    enabled: true,
    fastSellersCount: fastSellers.length,
    fastSellersList: fastSellers,
    totals: totalsByDesc
  };
}
