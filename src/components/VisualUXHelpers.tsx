import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  ChevronRight, 
  X, 
  Flame, 
  TrendingDown, 
  AlertTriangle, 
  AlertOctagon, 
  BadgeCheck, 
  Layers, 
  RotateCcw, 
  Smartphone, 
  CreditCard, 
  Send, 
  Coins, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  Plus, 
  Sparkle
} from 'lucide-react';
import { generateBadge, generateProgressMetrics, getStatusColor, isUXEnhancedEnabled } from '../lib/visualEngine';
import { formatCurrency, cn } from '../lib/utils';

/**
 * FEATURE 5 - TOOLTIP COMPONENT WITH MOBILE SUPPORT
 */
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function InteractiveTooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[11px] leading-relaxed shadow-xl animate-in fade-in duration-150 font-normal no-print"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

/**
 * FEATURE 2 - DYNAMIC BADGE COMPONENT
 */
interface BadgeProps {
  type: string;
  value?: string | number;
}

export function StatusBadge({ type, value }: BadgeProps) {
  const meta = generateBadge(type, value);
  return (
    <InteractiveTooltip content={meta.tooltip}>
      <span 
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-help transition-all duration-150 hover:brightness-105 active:brightness-95",
          meta.bgClass
        )}
      >
        <span>{meta.label}</span>
      </span>
    </InteractiveTooltip>
  );
}

/**
 * FEATURE 3 - PROGRESS BAR COMPONENT
 */
interface ProgressBarProps {
  current: number;
  max: number;
  title?: string;
  subLabel?: string;
  percentageSuffix?: string;
}

export function DecorativeProgressBar({ current, max, title, subLabel, percentageSuffix = '' }: ProgressBarProps) {
  const metrics = generateProgressMetrics(current, max);
  
  return (
    <div className="space-y-1.5 w-full">
      {(title || subLabel) && (
        <div className="flex items-center justify-between text-[11px] font-bold text-ink/40 uppercase">
          {title && <span>{title}</span>}
          {subLabel && <span className="font-mono text-ink text-xs">{subLabel} {percentageSuffix}</span>}
        </div>
      )}
      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-black/[0.02]">
        <div 
          role="progressbar"
          aria-valuenow={metrics.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn("h-full rounded-full transition-all duration-500", metrics.color)}
          style={{ width: `${metrics.percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * FEATURE 7 - GRAND EMPTY STATE UX VIEW
 */
interface EmptyStateViewProps {
  type: 'search' | 'analytics' | 'inventory' | 'records' | 'filters' | 'default';
  onReset?: () => void;
  title?: string;
}

export function EmptyStateView({ type, onReset, title }: EmptyStateViewProps) {
  const getMeta = () => {
    switch (type) {
      case 'search':
        return {
          title: title || 'No Matching Records Found',
          desc: 'Your search terms did not match any inventory descriptors, product codes, or clients.',
          tips: ['Adjust search tags or terms', 'Clear filters', 'Verify spelling']
        };
      case 'analytics':
        return {
          title: title || 'No Analytics Available',
          desc: 'We couldn’t accumulate any transactional indicators. Ready to build your business tracker?',
          tips: ['Create your first Invoice', 'Extend the selected calendar range']
        };
      case 'inventory':
        return {
          title: title || 'No Tracking Data',
          desc: 'No stock adjustments match your lookup query or criteria.',
          tips: ['Ensure stock balances exist', 'Remove custom search queries']
        };
      default:
        return {
          title: title || 'Record Set Empty',
          desc: 'No records match the current view constraints.',
          tips: ['Reset current filters', 'Change active workspace tab']
        };
    }
  };

  const meta = getMeta();

  return (
    <div className="bg-white border border-dashed border-black/15 p-10 md:p-16 rounded-3xl text-center max-w-lg mx-auto space-y-5 shadow-sm animate-in zoom-in-95 duration-200">
      <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
        <Package className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-ink text-lg tracking-tight">{meta.title}</h3>
        <p className="text-xs text-ink/40 leading-relaxed max-w-sm mx-auto">{meta.desc}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 p-4 rounded-2xl text-left space-y-2 max-w-xs mx-auto">
        <div className="text-[10px] uppercase font-black tracking-widest text-ink/30">Suggestions:</div>
        <ul className="text-xs text-ink/60 space-y-1.5 font-medium">
          {meta.tips.map((t, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          aria-label="Reset all filters and view operations"
        >
          Reset Filters & Search
        </button>
      )}
    </div>
  );
}

/**
 * FEATURE 11 - QUICK VISUAL SUMMARY STRIP
 */
interface SummaryStripProps {
  fastSellersCount: number;
  lowStockCount: number;
  oversoldCount: number;
  topCategory: string;
  onActionClick: (action: 'records' | 'inventory' | 'low_stock' | 'oversold') => void;
}

export function QuickVisualSummaryStrip({ 
  fastSellersCount, 
  lowStockCount, 
  oversoldCount, 
  topCategory, 
  onActionClick 
}: SummaryStripProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-black/5 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <Sparkle className="w-4 h-4 text-brand animate-spin-slow" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-ink/50 tracking-wider">Operational Summary Strip</h4>
          <p className="text-[10px] text-ink/40 mt-0.5">Automated velocity reports and inventory health risks</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-bold uppercase tracking-tight text-[10px]">
        {fastSellersCount > 0 && (
          <button 
            onClick={() => onActionClick('records')}
            className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100/50 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{fastSellersCount} Fast Sellers</span>
          </button>
        )}

        {lowStockCount > 0 && (
          <button 
            onClick={() => onActionClick('inventory')}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100/50 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}

        {oversoldCount > 0 && (
          <button 
            onClick={() => onActionClick('inventory')}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100/50 rounded-xl transition-all cursor-pointer flex items-center gap-1 animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{oversoldCount} Oversold</span>
          </button>
        )}

        {topCategory && (
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Top: {topCategory}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FEATURE 6 - ELEVATED KPI CARD WITH MINI SPARKLINE TREND GRAPH
 */
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    type: 'up' | 'down' | 'stable';
    value: string;
  };
  sparklineData?: number[];
  comparisonValue?: string;
  statusColor?: string;
  tooltip?: string;
}

export function PolishedKPICard({ 
  title, 
  value, 
  icon, 
  trend, 
  sparklineData, 
  comparisonValue, 
  statusColor = 'text-brand',
  tooltip
}: KPICardProps) {
  const cardContent = (
    <div className="bg-white border border-black/5 p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01] hover:-translate-y-0.5 ease-out duration-200 flex flex-col justify-between h-full group relative overflow-hidden">
      {/* Dynamic light subtle backdrop effect on brand cards */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/[0.015] rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-125" />

      <div>
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-[10px] font-black text-ink/30 uppercase tracking-widest">{title}</span>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 text-ink/40 group-hover:text-brand rounded-2xl group-hover:bg-brand/5 border border-black/[0.02] transition-colors shrink-0">
            {icon}
          </div>
        </div>

        <div className={cn("text-2xl md:text-3xl font-extrabold tracking-tight leading-none", statusColor)}>
          {value}
        </div>
      </div>

      {/* Sparks sparkline graph & trend section */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-black/5 mt-4">
        <div className="space-y-1">
          {trend && (
            <div className="flex items-center gap-1 text-[11px] font-bold">
              {trend.type === 'up' && (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {trend.value}
                </span>
              )}
              {trend.type === 'down' && (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {trend.value}
                </span>
              )}
              {trend.type === 'stable' && (
                <span className="text-slate-400 flex items-center gap-0.5">
                  <MinusIcon className="w-3.5 h-3.5" /> Stable
                </span>
              )}
            </div>
          )}
          {comparisonValue && (
            <div className="text-[10px] text-ink/40 font-bold uppercase tracking-tight">{comparisonValue}</div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <svg className="w-16 h-8 text-brand/30 group-hover:text-brand/50 transition-colors pointer-events-none" viewBox="0 0 60 20">
            {(() => {
              const maxVal = Math.max(...sparklineData);
              const minVal = Math.min(...sparklineData);
              const range = maxVal - minVal || 1;
              const points = sparklineData.map((v, i) => {
                const x = (i / (sparklineData.length - 1)) * 56 + 2;
                const y = 18 - ((v - minVal) / range) * 16;
                return `${x},${y}`;
              }).join(' ');

              return (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            })()}
          </svg>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <InteractiveTooltip content={tooltip}>
        {cardContent}
      </InteractiveTooltip>
    );
  }

  return cardContent;
}

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
