import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Layers, 
  AlertTriangle, 
  MousePointer2, 
  Download, 
  Flame, 
  TrendingDown, 
  Sparkles, 
  FileSpreadsheet, 
  Printer 
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  generateDashboardAnalytics, 
  calculateRevenueTrend, 
  BestSeller, 
  SlowMover, 
  CategoryStat, 
  RevenueTrendPoint 
} from '../lib/analyticsEngine';

interface SalesAnalyticsProps {
  filteredData: any[];
  currencySymbol?: string;
}

export function SalesAnalytics({ filteredData, currencySymbol }: SalesAnalyticsProps) {
  // Common stats derived
  const totalItemsCount = filteredData.length;
  
  // States for 2A: Best Sellers
  const [bestSellersLimit, setBestSellersLimit] = useState<number>(5);
  const [bestSellersSort, setBestSellersSort] = useState<'qty' | 'revenue'>('qty');

  // States for 2B: Slow Movers
  const [slowMoversLimit, setSlowMoversLimit] = useState<number>(5);
  const [slowMoversSort, setSlowMoversSort] = useState<'qty' | 'revenue'>('qty');

  // States for 2C: Revenue Trend
  const [trendGrouping, setTrendGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<RevenueTrendPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Sizing for responsive SVG container
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(600);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setChartWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute stats in active memoized pipeline
  const analyticsData = useMemo(() => {
    return generateDashboardAnalytics(filteredData);
  }, [filteredData]);

  const { totalRevenue, bestSellersRaw, slowMoversRaw, categoryPerformance } = analyticsData;

  // Process 2A: Best-selling ranking
  const bestSellers = useMemo(() => {
    const list = [...bestSellersRaw];
    if (bestSellersSort === 'qty') {
      list.sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
    } else {
      list.sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
    }
    return list.slice(0, bestSellersLimit);
  }, [bestSellersRaw, bestSellersLimit, bestSellersSort]);

  // Process 2B: Slow-moving products
  const slowMovers = useMemo(() => {
    const list = [...slowMoversRaw];
    if (slowMoversSort === 'qty') {
      list.sort((a, b) => a.qty - b.qty || a.revenue - b.revenue);
    } else {
      list.sort((a, b) => a.revenue - b.revenue || a.qty - b.qty);
    }
    return list.slice(0, slowMoversLimit);
  }, [slowMoversRaw, slowMoversLimit, slowMoversSort]);

  // Process 2C: Revenue Trend Data
  const trendData = useMemo(() => {
    return calculateRevenueTrend(filteredData, trendGrouping);
  }, [filteredData, trendGrouping]);

  // Chart coordinate math
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartHeight = 260;

  const maxRevenueInTrend = useMemo(() => {
    if (trendData.length === 0) return 0;
    const maxVal = Math.max(...trendData.map(d => d.revenue));
    return maxVal === 0 ? 100 : maxVal;
  }, [trendData]);

  const trendPoints = useMemo(() => {
    if (trendData.length === 0) return [];
    
    return trendData.map((d, index) => {
      const x = paddingLeft + (index / (trendData.length - 1 || 1)) * (chartWidth - paddingLeft - paddingRight);
      const y = chartHeight - paddingBottom - (d.revenue / maxRevenueInTrend) * (chartHeight - paddingTop - paddingBottom);
      return { x, y, data: d, index };
    });
  }, [trendData, chartWidth, maxRevenueInTrend]);

  // Touch/Mouse event handlers for trend graph tooltips
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (trendPoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Find closest point by X coordinate
    let closestPoint = trendPoints[0];
    let minDiff = Math.abs(trendPoints[0].x - mouseX);
    
    trendPoints.forEach(p => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = p;
      }
    });
    
    setHoveredPoint(closestPoint.data);
    setHoveredIndex(closestPoint.index);
  };

  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
    setHoveredIndex(null);
  };

  // 2D SVG Line Spline generation (for Smooth Line Chart)
  const splinePath = useMemo(() => {
    if (trendPoints.length === 0) return '';
    if (trendPoints.length === 1) {
      return `M ${trendPoints[0].x} ${trendPoints[0].y}`;
    }
    
    // Draw simple cubic spline or straight continuous lines with smooth curvatures
    let path = `M ${trendPoints[0].x} ${trendPoints[0].y}`;
    for (let i = 0; i < trendPoints.length - 1; i++) {
      const p0 = trendPoints[i];
      const p1 = trendPoints[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [trendPoints]);

  const splineAreaPath = useMemo(() => {
    if (trendPoints.length === 0) return '';
    const baseLineY = chartHeight - paddingBottom;
    const startX = trendPoints[0].x;
    const endX = trendPoints[trendPoints.length - 1].x;
    return `${splinePath} L ${endX} ${baseLineY} L ${startX} ${baseLineY} Z`;
  }, [trendPoints, splinePath]);

  // Simple automated insight generation (Bonus enhancement)
  const businessInsights = useMemo(() => {
    const list: string[] = [];
    if (filteredData.length === 0) return [];

    // Most dominant Category
    if (categoryPerformance.length > 0) {
      const biggestCat = categoryPerformance[0];
      if (biggestCat.contributionPct > 35) {
        list.push(`🔥 ${biggestCat.category} leads your business, accounting for ${biggestCat.contributionPct.toFixed(0)}% of total sales.`);
      } else {
        list.push(`📊 Your sales are evenly distributed. ${biggestCat.category} holds the top spot with ${biggestCat.contributionPct.toFixed(0)}% contribution.`);
      }
    }

    // Top Selling item contribution
    const masterBestSeller = bestSellersRaw.sort((a,b) => b.revenue - a.revenue)[0];
    if (masterBestSeller) {
      const itemAndPct = totalRevenue > 0 ? (masterBestSeller.revenue / totalRevenue) * 100 : 0;
      if (itemAndPct > 20) {
        list.push(`🏆 ${masterBestSeller.item} is your star product, representing ${itemAndPct.toFixed(0)}% (worth ${formatCurrency(masterBestSeller.revenue, currencySymbol)}) of revenue.`);
      }
    }

    // Slow mover warning
    const slowest = [...slowMoversRaw].sort((a,b) => a.qty - b.qty)[0];
    if (slowest && slowest.qty < 5) {
      list.push(`💡 Slow Mover Warning: ${slowest.item} has critically low velocity (${slowest.qty} sold). Consider bundling or running promotions.`);
    }

    // Average volume velocity
    const avgUnitsSold = totalItemsCount > 0 ? (filteredData.reduce((s,r) => s + (r.quantity || 0), 0) / Array.from(new Set(filteredData.map(r => r.description))).length) : 0;
    if (avgUnitsSold > 10) {
      list.push(`📈 Healthy inventory movement! Active items average ${avgUnitsSold.toFixed(0)} units sold across the selected scope.`);
    }

    return list.slice(0, 3);
  }, [filteredData, categoryPerformance, bestSellersRaw, slowMoversRaw, totalRevenue, currencySymbol, totalItemsCount]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Section 1: Overview
    csvContent += "SALES ANALYTICS REPORT\r\n";
    csvContent += `Generated On: ${new Date().toLocaleDateString()}\r\n`;
    csvContent += `Total Revenue,${totalRevenue}\r\n`;
    csvContent += `Total Line Sales,${totalItemsCount}\r\n\r\n`;
    
    // Section 2: Best Sellers
    csvContent += "BEST SELLING ITEMS\r\n";
    csvContent += "Item,Quantity Sold,Revenue,Contribution %\r\n";
    bestSellersRaw.forEach(row => {
      csvContent += `"${row.item.replace(/"/g, '""')}",${row.qty},${row.revenue},${((row.revenue / (totalRevenue || 1)) * 100).toFixed(2)}%\r\n`;
    });
    csvContent += "\r\n";

    // Section 3: Categories
    csvContent += "CATEGORY PERFORMANCE\r\n";
    csvContent += "Category,Revenue,Quantity Sold,Contribution %\r\n";
    categoryPerformance.forEach(row => {
      csvContent += `"${row.category}",${row.revenue},${row.qty},${row.contributionPct.toFixed(2)}%\r\n`;
    });
    csvContent += "\r\n";

    // Section 4: Revenue Trend
    csvContent += `REVENUE TRENDS (${trendGrouping.toUpperCase()})\r\n`;
    csvContent += "Period,Revenue,Transaction Count\r\n";
    trendData.forEach(row => {
      csvContent += `"${row.label}",${row.revenue},${row.txCount}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-analytics-${trendGrouping}-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Business Insight Cards (Bonus) */}
      {businessInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
          {businessInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="bg-brand/[0.02] border border-brand/10 p-4 rounded-xl flex items-start gap-3 shadow-none transition-transform hover:-translate-y-0.5"
            >
              <div className="mt-0.5 flex shrink-0 items-center justify-center text-brand">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-ink/70 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* CSV and Print Actions Row */}
      {totalItemsCount > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-black/5 text-xs text-ink/70 hover:text-ink font-semibold rounded-lg border border-black/5 transition-all shadow-none"
            title="Export CSV document"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV Report
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-black/5 text-xs text-ink/70 hover:text-ink font-semibold rounded-lg border border-black/5 transition-all shadow-none"
            title="Print entire analytics"
          >
            <Printer className="w-3.5 h-3.5 text-brand" /> Print Report
          </button>
        </div>
      )}

      {/* 2C — REVENUE TREND GRAPH */}
      <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-ink/40 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" /> Revenue Growth Trend
            </div>
            <h3 className="font-bold text-base text-ink mt-0.5">Financial Sales Timeline</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Chart type select */}
            <div className="bg-paper p-0.5 rounded-lg border border-black/5 flex text-[11px] font-bold uppercase no-print">
              <button 
                onClick={() => setChartType('area')}
                className={cn("px-2.5 py-1 rounded-md transition-all", chartType === 'area' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                Area
              </button>
              <button 
                onClick={() => setChartType('line')}
                className={cn("px-2.5 py-1 rounded-md transition-all", chartType === 'line' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                Curve
              </button>
              <button 
                onClick={() => setChartType('bar')}
                className={cn("px-2.5 py-1 rounded-md transition-all", chartType === 'bar' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                Bar
              </button>
            </div>

            {/* Time spacing select */}
            <div className="bg-paper p-0.5 rounded-lg border border-black/5 flex text-[11px] font-bold uppercase">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(grp => (
                <button
                  key={grp}
                  onClick={() => setTrendGrouping(grp)}
                  className={cn("px-2.5 py-1 rounded-md transition-all", trendGrouping === grp ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Chart viewport wrapper */}
        {trendData.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-ink/30 italic text-xs border border-dashed border-black/5 rounded-xl bg-paper">
            No revenue trend data available. Fill in filters with invoice sales.
          </div>
        ) : (
          <div className="relative" ref={chartContainerRef}>
            
            {/* Overlay Mouse Tooltip display */}
            {hoveredPoint && (
              <div 
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-ink text-white p-3 rounded-xl shadow-lg border border-white/10 z-20 pointer-events-none flex items-center gap-4 transition-all"
                style={{
                  transform: 'translateX(-50%)'
                }}
              >
                <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{hoveredPoint.label}</div>
                  <div className="text-sm font-black font-mono mt-0.5">{formatCurrency(hoveredPoint.revenue, currencySymbol)}</div>
                </div>
                <div className="border-l border-white/15 pl-4 py-0.5 text-right">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Line Sales</div>
                  <div className="text-xs font-bold text-brand mt-0.5">{hoveredPoint.txCount} transactions</div>
                </div>
              </div>
            )}

            {/* SVG Plot view rendering */}
            <svg 
              className="w-full transition-all cursor-crosshair select-none" 
              height={chartHeight}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const yVal = paddingTop + p * (chartHeight - paddingTop - paddingBottom);
                return (
                  <g key={idx}>
                    <line 
                      x1={paddingLeft} 
                      y1={yVal} 
                      x2={chartWidth - paddingRight} 
                      y2={yVal} 
                      stroke="#f1f5f9" 
                      strokeWidth={1} 
                      strokeDasharray={idx === 4 ? "0" : "4 4"}
                    />
                    {/* Tick Label */}
                    <text 
                      x={paddingLeft - 8} 
                      y={yVal + 3} 
                      fill="#94a3b8" 
                      fontSize="9px" 
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {formatCurrency(((1 - p) * maxRevenueInTrend), currencySymbol)}
                    </text>
                  </g>
                );
              })}

              {/* Draw Bar type of graph */}
              {chartType === 'bar' && trendPoints.map((pt, i) => {
                const columnWidth = Math.max(4, ((chartWidth - paddingLeft - paddingRight) / trendPoints.length) * 0.5);
                const barHeight = (chartHeight - paddingBottom) - pt.y;
                return (
                  <rect 
                    key={i}
                    x={pt.x - columnWidth / 2}
                    y={pt.y}
                    width={columnWidth}
                    height={Math.max(1, barHeight)}
                    fill={hoveredIndex === i ? '#3b82f6' : '#93c5fd'}
                    rx={2}
                    className="transition-colors duration-200"
                  />
                );
              })}

              {/* Draw Line and Area types */}
              {chartType === 'area' && trendPoints.length > 1 && (
                <path 
                  d={splineAreaPath} 
                  fill="url(#areaGradient)" 
                  className="transition-all duration-300"
                />
              )}

              {(chartType === 'area' || chartType === 'line') && trendPoints.length > 1 && (
                <path 
                  d={splinePath} 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Timeline Horizontal Label ticks */}
              {trendPoints.map((pt, i) => {
                const shouldDrawLabel = 
                  trendPoints.length <= 10 || 
                  i === 0 || 
                  i === trendPoints.length - 1 || 
                  (trendPoints.length <= 30 && i % 4 === 0) ||
                  (trendPoints.length > 30 && i % 8 === 0);

                return (
                  <g key={i}>
                    {shouldDrawLabel && (
                      <text 
                        x={pt.x} 
                        y={chartHeight - 15} 
                        fill="#94a3b8" 
                        fontSize="9px" 
                        fontWeight="600"
                        className="tracking-tight select-none"
                        textAnchor="middle"
                      >
                        {pt.data.label}
                      </text>
                    )}
                    
                    {/* Glow interactive points on line */}
                    {chartType !== 'bar' && (hoveredIndex === i || trendPoints.length < 15) && (
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={hoveredIndex === i ? 6 : 3.5} 
                        fill={hoveredIndex === i ? '#3b82f6' : '#ffffff'} 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        className="transition-all duration-100"
                      />
                    )}
                  </g>
                );
              })}

              {/* Interactive vertical hover scanline */}
              {hoveredIndex !== null && trendPoints[hoveredIndex] && (
                <line 
                  x1={trendPoints[hoveredIndex].x} 
                  y1={paddingTop} 
                  x2={trendPoints[hoveredIndex].x} 
                  y2={chartHeight - paddingBottom} 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              )}
            </svg>
            <div className="flex items-center justify-between text-[10px] text-ink/30 font-bold px-2 uppercase tracking-wide mt-2">
              <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3 text-brand" /> Hover track active</span>
              <span>Sorted Chronologically</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid containing Ranking & Low Performers Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2A — BEST SELLING ITEM WIDGET */}
        <div className="bg-white border border-black/5 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-ink/40 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Product Analytics
                </div>
                <h3 className="font-bold text-base text-ink">Best Selling Items</h3>
              </div>

              {/* Count Limit controls */}
              <div className="flex items-center gap-1.5 no-print">
                <select 
                  value={bestSellersLimit} 
                  onChange={(e) => setBestSellersLimit(Number(e.target.value))} 
                  className="bg-paper border border-black/5 rounded-lg px-2 py-1 text-xs font-bold text-ink cursor-pointer focus:outline-none focus:border-brand"
                >
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                </select>
                <button
                  onClick={() => setBestSellersSort(prev => prev === 'qty' ? 'revenue' : 'qty')}
                  className="bg-paper hover:bg-black/5 border border-black/5 rounded-lg px-2.5 py-1 text-xs font-bold text-ink transition-colors flex items-center gap-1"
                >
                  Sort: {bestSellersSort === 'qty' ? 'Qty' : 'Total'}
                </button>
              </div>
            </div>

            {bestSellers.length === 0 ? (
              <div className="p-10 text-center text-ink/30 italic text-xs border border-dashed border-black/5 rounded-xl bg-paper">
                No sales analytics available.
              </div>
            ) : (
              <div className="space-y-3.5">
                {bestSellers.map((item, idx) => {
                  const rankIcon = idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                  return (
                    <div 
                      key={item.item} 
                      className="group p-3 rounded-xl hover:bg-black/[0.01] border border-transparent hover:border-black/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-paper shrink-0 flex items-center justify-center font-black text-xs text-ink/40">
                            {rankIcon || (idx + 1)}
                          </span>
                          <div className="font-bold text-sm text-ink truncate group-hover:text-brand transition-colors">
                            {item.item}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-ink text-sm">
                            {formatCurrency(item.revenue, currencySymbol)}
                          </div>
                          <div className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">
                            {item.qty} Qty Sold
                          </div>
                        </div>
                      </div>

                      {/* Percent of category volume visually */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-ink/40 font-medium">
                          <span>Volume Contribution</span>
                          <span className="font-mono text-xs text-brand font-bold">{item.contributionPct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-paper rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, item.contributionPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2B — LOWEST PERFORMING PRODUCTS */}
        <div className="bg-white border border-black/5 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-ink/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Slow Movers
                </div>
                <h3 className="font-bold text-base text-ink">Lowest Performing Items</h3>
              </div>

              {/* Count Limit controls */}
              <div className="flex items-center gap-1.5 no-print">
                <select 
                  value={slowMoversLimit} 
                  onChange={(e) => setSlowMoversLimit(Number(e.target.value))} 
                  className="bg-paper border border-black/5 rounded-lg px-2 py-1 text-xs font-bold text-ink cursor-pointer focus:outline-none focus:border-brand"
                >
                  <option value="5">Bottom 5</option>
                  <option value="10">Bottom 10</option>
                  <option value="20">Bottom 20</option>
                </select>
                <button
                  onClick={() => setSlowMoversSort(prev => prev === 'qty' ? 'revenue' : 'qty')}
                  className="bg-paper hover:bg-black/5 border border-black/5 rounded-lg px-2.5 py-1 text-xs font-bold text-ink transition-colors flex items-center gap-1"
                >
                  Sort: {slowMoversSort === 'qty' ? 'Qty' : 'Total'}
                </button>
              </div>
            </div>

            {slowMovers.length === 0 ? (
              <div className="p-10 text-center text-ink/30 italic text-xs border border-dashed border-black/5 rounded-xl bg-paper">
                No low-performance data available.
              </div>
            ) : (
              <div className="space-y-3.5">
                {slowMovers.map((item, idx) => {
                  let badgeColorClass = "bg-amber-100 text-amber-800 border-amber-200/50";
                  if (item.performanceLabel === 'Critical Low Seller') {
                    badgeColorClass = "bg-red-50 text-red-700 border-red-200/50";
                  } else if (item.performanceLabel === 'Low Seller') {
                    badgeColorClass = "bg-orange-50 text-orange-700 border-orange-200/50";
                  }

                  return (
                    <div 
                      key={item.item} 
                      className="group p-3 rounded-xl hover:bg-black/[0.01] border border-transparent hover:border-black/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink truncate group-hover:text-brand transition-colors flex items-center gap-2">
                            <span>{item.item}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn("text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded border", badgeColorClass)}>
                              {item.performanceLabel}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-ink/70 text-sm">
                            {formatCurrency(item.revenue, currencySymbol)}
                          </div>
                          <div className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">
                            {item.qty} Qty sold
                          </div>
                        </div>
                      </div>

                      {/* Percent of category volume visually */}
                      <div className="mt-3.5 space-y-1">
                        <div className="w-full bg-paper rounded-full h-1 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              item.performanceLabel === 'Critical Low Seller' ? 'bg-red-400' :
                              item.performanceLabel === 'Low Seller' ? 'bg-orange-400' : 'bg-amber-400'
                            )}
                            style={{ width: `${Math.max(10, Math.min(100, (item.qty / 50) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2D — CATEGORY PERFORMANCE ANALYTICS */}
      <div className="bg-white border border-black/5 p-5 md:p-6 rounded-2xl shadow-sm">
        <div className="text-xs uppercase tracking-wider font-bold text-ink/40 flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-brand" /> Segment Categories
        </div>
        <h3 className="font-bold text-base text-ink mb-6">Sales Category Analytics</h3>
        
        {categoryPerformance.length === 0 ? (
          <div className="p-16 text-center text-ink/30 italic text-sm border border-dashed border-black/5 rounded-2xl bg-paper">
            No category analytics available. Check description mapping.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryPerformance.map((cat, idx) => {
              // Custom graphic tags for category types
              const isFashion = cat.category.toLowerCase().includes('fashion');
              const isBeverage = cat.category.toLowerCase().includes('beverag');
              const isFood = cat.category.toLowerCase().includes('food');
              const isKitchen = cat.category.toLowerCase().includes('glass');
              const isService = cat.category.toLowerCase().includes('service');

              return (
                <div 
                  key={cat.category} 
                  className="p-5 bg-paper rounded-2xl border border-black/[0.03] hover:border-brand/20 hover:bg-brand/[0.01] transition-all flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors block">
                        {cat.category}
                      </span>
                      <span className="text-[10px] text-ink/30 font-mono tracking-wider uppercase font-bold">MATCH #{idx+1}</span>
                    </div>
                    <div className="font-mono font-black text-brand text-xl">{formatCurrency(cat.revenue, currencySymbol)}</div>
                    <div className="text-[10px] text-ink/40 font-bold uppercase tracking-widest mt-1.5">{cat.qty} Units Shipped</div>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-xl border border-dashed border-black/5">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-tight text-ink/50 uppercase">
                      <span>Share of Total Sales</span>
                      <span className="font-mono text-brand font-black text-xs">{cat.contributionPct.toFixed(1)}%</span>
                    </div>
                    
                    {/* Visual Segment bar representation */}
                    <div className="w-full bg-paper rounded-full h-1.5 overflow-hidden mt-1">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isFashion ? 'bg-pink-500' :
                          isBeverage ? 'bg-cyan-500' :
                          isFood ? 'bg-amber-500' :
                          isKitchen ? 'bg-blue-500' :
                          isService ? 'bg-violet-500' : 'bg-brand'
                        )}
                        style={{ width: `${Math.min(100, cat.contributionPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
