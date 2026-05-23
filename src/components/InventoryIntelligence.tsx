import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Edit2, 
  RefreshCw, 
  Download, 
  Printer, 
  Check, 
  X, 
  Search,
  ChevronRight,
  TrendingDown,
  Trash2
} from 'lucide-react';
import { 
  generateInventoryIntelligence, 
  saveStoredStock, 
  deleteStoredStock,
  getDaysObserved, 
  ProductInventory 
} from '../lib/inventoryEngine';
import { formatCurrency, cn } from '../lib/utils';

interface InventoryIntelligenceProps {
  filteredData: any[];
  userProfile: any;
  selectedFilter: string;
  customStart?: string;
  customEnd?: string;
  onSelectProductFilter?: (productName: string) => void;
  currencySymbol?: string;
  onInspectItem?: (itemName: string) => void;
}

export function InventoryIntelligence({
  filteredData,
  userProfile,
  selectedFilter,
  customStart,
  customEnd,
  onSelectProductFilter,
  currencySymbol = '$',
  onInspectItem
}: InventoryIntelligenceProps) {
  const userId = userProfile?.id || 'default';
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'oversold' | 'restock'>('all');

  // Track manual edits count to force state refresh
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Calculate days observed for sales velocity
  const daysObserved = useMemo(() => {
    return getDaysObserved(filteredData, selectedFilter, customStart, customEnd);
  }, [filteredData, selectedFilter, customStart, customEnd]);

  // Run the Master Inventory Engine
  const intelligence = useMemo(() => {
    const isAdmin = userProfile?.role === 'admin';
    return generateInventoryIntelligence(filteredData, userId, daysObserved, isAdmin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, userId, daysObserved, refreshTrigger, userProfile?.role]);

  // Filter items in the inventory table based on search & tab
  const displayedItems = useMemo(() => {
    let list = intelligence.items;
    
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => item.description.toLowerCase().includes(q));
    }

    if (activeTab === 'low') {
      list = list.filter(item => item.status === 'low' || item.status === 'critical');
    } else if (activeTab === 'oversold') {
      list = list.filter(item => item.status === 'oversold');
    } else if (activeTab === 'restock') {
      list = list.filter(item => item.restockStatus === 'urgent' || item.restockStatus === 'plan');
    }

    return list;
  }, [intelligence.items, searchTerm, activeTab]);

  // Handles updating stock
  const handleUpdateStock = (description: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      saveStoredStock(userId, description, parsed);
      setEditingItem(null);
      setRefreshTrigger(p => p + 1);
    }
  };

  // Restocks an oversold/critically low item to a healthy baseline (Sold + 50 or double)
  const handleQuickRestock = (description: string, quantityToIncrease: number = 50) => {
    const currentItem = intelligence.items.find(it => it.description === description);
    const currentStock = currentItem ? currentItem.totalStock : 0;
    const currentSold = currentItem ? currentItem.quantitySold : 0;
    
    // Minimum stock needed = sold quantity + quantityToIncrease
    const optimalStock = Math.max(currentStock + quantityToIncrease, currentSold + 20);
    saveStoredStock(userId, description, optimalStock);
    setRefreshTrigger(p => p + 1);
  };
  
  const handleDeleteStock = (description: string) => {
    if (window.confirm(`Are you sure you want to delete/remove the stock tracking for "${description}"?`)) {
      deleteStoredStock(userId, description);
      setRefreshTrigger(p => p + 1);
    }
  };

  // Exports currently displayed inventory list as CSV
  const handleExportCSV = (reportType: 'all' | 'low_stock' | 'restock') => {
    let dataToExport = intelligence.items;
    let filename = 'inventory_report.csv';

    if (reportType === 'low_stock') {
      dataToExport = intelligence.items.filter(it => it.status === 'low' || it.status === 'critical');
      filename = 'low_stock_report.csv';
    } else if (reportType === 'restock') {
      dataToExport = intelligence.items.filter(it => it.restockStatus === 'urgent' || it.restockStatus === 'plan');
      filename = 'restock_recommendations.csv';
    }

    const headers = ['Product Description', 'Total Stock', 'Quantity Sold', 'Remaining Stock', 'Status/Health', 'Daily Velocity (units/day)', 'Est Days Cover', 'Recommended Restock units'];
    const rows = dataToExport.map(item => [
      `"${item.description.replace(/"/g, '""')}"`,
      item.totalStock,
      item.quantitySold,
      item.remainingStock < 0 ? 'Oversold' : item.remainingStock,
      item.statusLabel,
      item.averageDailySales.toFixed(2),
      item.daysRemaining === Infinity ? 'Stable (No Sales)' : item.daysRemaining.toFixed(1),
      item.recommendedRestock
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple printing of reports
  const handlePrintHTML = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Dashboard Header with Quick Action Exports */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-black/5 p-4 rounded-2xl shadow-sm no-print">
        <div>
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" /> 
            Inventory Intelligence Command Centre
          </h2>
          <p className="text-xs text-ink/40 mt-1">
            Dynamic stock tracking, depletion forecasting, and automated velocity projections for {daysObserved} days observed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExportCSV('all')}
            className="px-3 py-1.5 bg-paper hover:bg-black/5 border border-black/5 rounded-xl text-xs font-bold text-ink/70 flex items-center gap-1.5 transition-all"
            title="Export full inventory matrix to CSV"
          >
            <Download className="w-3.5 h-3.5 text-brand" /> Export Stock CSV
          </button>
          <button
            onClick={() => handleExportCSV('low_stock')}
            className="px-3 py-1.5 bg-paper hover:bg-black/5 border border-black/5 rounded-xl text-xs font-bold text-red-500 flex items-center gap-1.5 transition-all"
            title="Export only critical/low stock levels"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Export alerts
          </button>
          <button
            onClick={handlePrintHTML}
            className="px-3 py-1.5 bg-paper hover:bg-black/5 border border-black/5 rounded-xl text-xs font-bold text-ink/70 flex items-center gap-1.5 transition-all"
            title="Print inventory indicators"
          >
            <Printer className="w-3.5 h-3.5" /> Print Sheets
          </button>
        </div>
      </div>

      {/* Primary Key Performance Indicators & Urgency Score Meter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI: Oversold Items Alert */}
        <div className={cn(
          "bg-white border p-6 rounded-2xl shadow-sm transition-all",
          intelligence.oversoldItems.length > 0 ? "border-red-100 bg-red-50/20" : "border-black/5"
        )}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">OVERSOLD PRODUCTS</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
              intelligence.oversoldItems.length > 0 ? "bg-red-500 text-white" : "bg-green-100 text-green-700"
            )}>
              {intelligence.oversoldItems.length > 0 ? 'Danger' : 'All Safe'}
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-ink">
            {intelligence.oversoldItems.length}
          </div>
          <p className="text-xs text-ink/40 mt-1">
            {intelligence.oversoldItems.length > 0 
              ? `${intelligence.oversoldItems.length} items sold exceed configured stock levels` 
              : "No items negative. Splendid!"}
          </p>
        </div>

        {/* KPI: Low & Critical Stock Alert */}
        <div className={cn(
          "bg-white border p-6 rounded-2xl shadow-sm transition-all",
          intelligence.urgencySummary.criticalCount > 0 ? "border-orange-100 bg-orange-50/20" : "border-black/5"
        )}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">CRITICAL LOW STOCK</span>
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold uppercase">
              0-5 Left
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-ink">
            {intelligence.urgencySummary.criticalCount}
          </div>
          <p className="text-xs text-ink/40 mt-1">
            {intelligence.urgencySummary.criticalCount > 0 
              ? `${intelligence.urgencySummary.criticalCount} products urgently running out of stock` 
              : "All products stocked above critical level"}
          </p>
        </div>

        {/* KPI: Total Items Tracked */}
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">ACTIVE INVENTORY</span>
            <span className="px-1.5 py-0.5 bg-paper text-ink/50 rounded text-[9px] font-bold uppercase">
              Items Sold
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-ink">
            {intelligence.urgencySummary.totalProductsCount}
          </div>
          <p className="text-xs text-ink/40 mt-1">
            Total unique product lines with active sales or stock indexes
          </p>
        </div>

        {/* KPI: Auto Restock / Security Score */}
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="mb-2">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">AUTO RESTOCK SCORE</span>
          </div>
          {(() => {
            // General status score calculator:
            // 100 -> Immediate action needed (highly depleted)
            // 0 -> Perfectly secure
            let score = 0;
            if (intelligence.oversoldItems.length > 0) {
              score = 100;
            } else if (intelligence.urgencySummary.criticalCount > 0) {
              score = 85;
            } else if (intelligence.urgencySummary.lowCount > 0) {
              score = 60;
            } else {
              score = 25;
            }

            let colorClass = "text-green-500";
            let desc = "Inventory levels perfectly stable";
            if (score >= 90) {
              colorClass = "text-red-500";
              desc = "Immediate Attention Required";
            } else if (score >= 60) {
              colorClass = "text-orange-500";
              desc = "High Priority restocking recommended";
            }

            return (
              <>
                <div className="flex items-baseline gap-2">
                  <div className={cn("text-3xl font-black font-mono", colorClass)}>{score}</div>
                  <span className="text-xs font-semibold text-ink/40">/ 100</span>
                </div>
                <div className="text-xs font-bold uppercase text-ink mt-2 leading-none flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full inline-block", score >= 60 ? "bg-red-500 animate-ping" : "bg-green-500")} /> 
                  {score >= 90 ? "Immediate Action" : score >= 60 ? "High Priority" : "Monitor Level"}
                </div>
                <p className="text-[10px] text-ink/40 mt-2 leading-tight">{desc}</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Dashboard Alert Panels: Oversold Items (3C) & Low Stock Alerts (3B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Module 3C Panel: Oversold Detection */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Oversold Detection System
            </h3>
            <p className="text-xs text-ink/40 mb-4">
              Flagged items with sold volume surpassing available stock level.
            </p>

            {intelligence.oversoldItems.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center bg-green-50/10 border border-dashed border-green-100 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-xs text-green-700 font-bold">No oversold items detected</p>
                <p className="text-[10px] text-ink/30 mt-0.5">All transaction volumes are within healthy stock indexes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {intelligence.oversoldItems.map(item => (
                  <div 
                    key={item.description}
                    className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span 
                        onClick={() => {
                          if (onInspectItem) onInspectItem(item.description);
                        }}
                        className={cn(
                          "font-bold text-ink text-xs block",
                          onInspectItem ? "cursor-pointer hover:underline hover:text-brand" : ""
                        )}
                        title={onInspectItem ? "Click to inspect transactional history" : ""}
                      >
                        {item.description}
                        {onInspectItem && (
                          <span className="text-[8px] font-bold text-brand ml-2 bg-brand/5 px-1 py-0.5 rounded">
                            inspect ↗
                          </span>
                        )}
                      </span>
                      <div className="text-[10px] text-ink/50 mt-1 flex items-center gap-3">
                        <span>Sold: <strong className="text-red-600">{item.sold}</strong></span>
                        <span>Stock Cover: <strong>{item.stock}</strong></span>
                        <span className="text-red-600 font-semibold bg-red-100/60 px-1 py-0.5 rounded">
                          Oversold by {item.oversoldBy}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleQuickRestock(item.description, item.oversoldBy + 20)}
                        className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-sm"
                        title="Reset stock to cover the oversold units + 20 buffer"
                      >
                        Restock Now
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(item.description);
                          setEditValue(String(item.stock));
                        }}
                        className="p-1 text-ink/40 hover:text-ink hover:bg-black/5 rounded"
                        title="Adjust Initial Stock"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-black/5 flex justify-between text-[10px] text-ink/40 font-mono">
            <span>Critical alerts reactive</span>
            <span>Real-time checking</span>
          </div>
        </div>

        {/* Module 3B Panel: Low Stock Alert Warning System */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Low Stock Warning System
            </h3>
            <p className="text-xs text-ink/40 mb-4">
              Automatic warnings for items dropping below thresholds (orange &lt; 20, red &lt; 5).
            </p>

            {intelligence.lowStockAlerts.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center bg-green-50/10 border border-dashed border-green-100 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-xs text-green-700 font-bold">All inventory levels healthy</p>
                <p className="text-[10px] text-ink/30 mt-0.5">Everything is stacked above the warning limits of 20 units.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {intelligence.lowStockAlerts.map(item => {
                  const isCritical = item.remaining <= 5;
                  return (
                    <div 
                      key={item.description}
                      className={cn(
                        "p-3 rounded-xl flex items-center justify-between border",
                        isCritical ? "bg-red-50/40 border-red-100" : "bg-orange-50/30 border-orange-100"
                      )}
                    >
                      <div>
                        <span 
                          onClick={() => {
                            if (onInspectItem) onInspectItem(item.description);
                          }}
                          className={cn(
                            "font-bold text-ink text-xs block",
                            onInspectItem ? "cursor-pointer hover:underline hover:text-brand" : ""
                          )}
                          title={onInspectItem ? "Click to inspect transactional history" : ""}
                        >
                          {item.description}
                          {onInspectItem && (
                            <span className="text-[8px] font-bold text-brand ml-2 bg-brand/5 px-1 py-0.5 rounded">
                              inspect ↗
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-ink/40 mt-1 flex items-center gap-2">
                          Remaining Stock: 
                          <strong className={cn("font-mono font-bold", isCritical ? "text-red-600" : "text-orange-600")}>
                            {item.remaining} units
                          </strong>
                        </span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                        isCritical ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex justify-between text-[10px] text-ink/40 font-mono">
            <span>Thresholds: Critical: 5 | Low: 19</span>
            <span>Real-time calculation</span>
          </div>
        </div>
      </div>

      {/* Primary Inventory Matrix Table & Search Tools (3A) */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-ink text-sm">Product Inventory Balance Ledger</h3>
            <p className="text-xs text-ink/40 mt-0.5">Live stock counts with automatic status progress bars.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Tab switchers */}
            <div className="bg-paper p-0.5 border border-black/5 rounded-xl text-[10px] font-bold uppercase flex no-print">
              <button
                onClick={() => setActiveTab('all')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", activeTab === 'all' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('low')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", activeTab === 'low' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                Alerts
              </button>
              <button
                onClick={() => setActiveTab('oversold')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", activeTab === 'oversold' ? "bg-brand text-white shadow-sm" : "text-ink/50 hover:text-ink")}
              >
                Oversold
              </button>
            </div>

            {/* In-table Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30" />
              <input 
                type="text"
                placeholder="Filter items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-paper rounded-xl text-xs border border-transparent focus:border-brand focus:bg-white focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper/40 border-b border-black/5 text-[9px] font-bold uppercase tracking-widest text-ink/40">
                <th className="py-3 px-6">Product Description</th>
                <th className="py-3 px-4 text-center">Sold Qty</th>
                <th className="py-3 px-4 text-center">Initial Stock</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4">Sales/Stock Ratio</th>
                <th className="py-3 px-4 text-center">Health Status</th>
                <th className="py-3 px-6 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink/30 text-xs font-semibold">
                    No matching products found in inventory index.
                  </td>
                </tr>
              ) : (
                displayedItems.map(item => {
                  const percentSold = item.totalStock > 0 ? (item.quantitySold / item.totalStock) * 100 : 0;
                  const barColor = 
                    item.status === 'oversold' ? 'bg-red-500' :
                    item.status === 'critical' ? 'bg-red-500' :
                    item.status === 'low' ? 'bg-orange-500' :
                    'bg-green-500';

                  const badgeColor = 
                    item.status === 'oversold' ? 'bg-red-100 text-red-600 font-bold border-red-200' :
                    item.status === 'critical' ? 'bg-red-100 text-red-600 font-bold border-red-200' :
                    item.status === 'low' ? 'bg-orange-150 text-orange-600 border-orange-200' :
                    'bg-green-100 text-green-700 border-green-200';

                  return (
                    <tr key={item.description} className="hover:bg-paper/10 transition-colors text-xs text-ink/80 group">
                      {/* Description / Name */}
                      <td className="py-4 px-6 font-bold text-ink">
                        <span 
                          onClick={() => {
                            if (onSelectProductFilter) onSelectProductFilter(item.description);
                          }}
                          className="hover:underline hover:text-brand cursor-pointer flex items-center gap-1"
                          title="Click to filter reports by this item"
                        >
                          {item.description}
                          <ChevronRight className="w-3 h-3 text-ink/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </td>

                      {/* Sold Qty */}
                      <td className="py-4 px-4 text-center font-bold">
                        {item.quantitySold}
                      </td>

                      {/* Stock Qty (Inline Editable) */}
                      <td className="py-4 px-4 text-center font-mono">
                        {editingItem === item.description ? (
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateStock(item.description, editValue);
                                if (e.key === 'Escape') setEditingItem(null);
                              }}
                              className="w-14 px-1 py-0.5 text-center text-xs border rounded border-brand bg-white focus:outline-none focus:ring-1 focus:ring-brand font-bold"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleUpdateStock(item.description, editValue)}
                              className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingItem(null)}
                              className="p-0.5 text-ink/30 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold">{item.totalStock}</span>
                            <button
                              onClick={() => {
                                setEditingItem(item.description);
                                setEditValue(String(item.totalStock));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-ink/40 hover:text-brand transition-opacity rounded no-print"
                              title="Edit Stock"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Remaining Qty */}
                      <td className="py-4 px-4 text-center">
                        {item.remainingStock < 0 ? (
                          <span className="text-red-600 font-bold uppercase text-[9px] bg-red-100/60 px-1.5 py-0.5 rounded leading-none">
                            Oversold
                          </span>
                        ) : (
                          <span className={cn(
                            "font-mono font-bold",
                            item.remainingStock <= 5 ? "text-red-600" : item.remainingStock <= 19 ? "text-orange-600" : "text-ink/70"
                          )}>
                            {item.remainingStock}
                          </span>
                        )}
                      </td>

                      {/* Progress ratios */}
                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-ink/40 leading-none">
                            <span>{item.quantitySold} / {item.totalStock} Sold</span>
                            <span>{Math.min(100, Math.max(0, percentSold)).toFixed(0)}%</span>
                          </div>
                          {/* Progress slot */}
                          <div className="w-full bg-paper rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", barColor)}
                              style={{ width: `${Math.min(100, Math.max(0, percentSold))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Health Label */}
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                          badgeColor
                        )}>
                          {item.statusLabel}
                        </span>
                      </td>

                      {/* Quick action buttons */}
                      <td className="py-4 px-6 text-right no-print">
                        <div className="flex items-center justify-end gap-2">
                          {item.status !== 'healthy' && (
                            <button
                              onClick={() => handleQuickRestock(item.description, 30)}
                              className="px-2 py-1 bg-brand text-white border border-transparent rounded-lg text-[10px] uppercase font-bold tracking-wider hover:opacity-95 transition-all shadow-sm"
                            >
                              +30 Stock
                            </button>
                          )}
                          {onInspectItem && (
                            <button
                              onClick={() => onInspectItem(item.description)}
                              className="p-1 px-1.5 hover:bg-paper rounded text-[10px] font-bold text-brand hover:text-brand-dark uppercase transition-colors"
                              title="Deep inspect sales"
                            >
                              Inspect
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (onSelectProductFilter) onSelectProductFilter(item.description);
                            }}
                            className="p-1 px-1.5 hover:bg-paper rounded text-[10px] font-bold text-ink/50 hover:text-brand uppercase transition-colors"
                          >
                            Filter
                          </button>
                          <button
                            onClick={() => handleDeleteStock(item.description)}
                            className="p-1 px-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                            title="Delete Stock Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecasting and Restock Recommendation Engine Widget (3D) */}
      <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-ink text-sm">Depletion Forecasting & Restock Suggestions</h3>
          </div>
          <span className="text-[10px] text-ink/40 uppercase font-mono tracking-wider">
            Target Reserve Coverage: 30 Days
          </span>
        </div>
        <p className="text-xs text-ink/40 mb-6">
          Intelligent projections calculated by analyzing sales velocities over the {daysObserved}-day filtered period.
        </p>

        {intelligence.restockRecommendations.length === 0 ? (
          <div className="py-12 text-center bg-paper/20 rounded-xl border border-dashed border-black/5">
            <TrendingDown className="w-8 h-8 text-ink/20 mx-auto mb-2" />
            <p className="text-xs font-bold text-ink/50">No active restock recommendations</p>
            <p className="text-[10px] text-ink/30 mt-1 max-w-sm mx-auto">
              Recommendations will automatically appear once items exhibit active transaction volumes over the filtered time frame.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligence.restockRecommendations.map(rec => {
              const isUrgent = rec.daysRemaining <= 14;
              const isExtremelyLow = rec.daysRemaining <= 5;
              
              let statusClass = "bg-green-100 text-green-700";
              if (isExtremelyLow || rec.statusLabel === 'Urgent Restock') {
                statusClass = "bg-red-100 text-red-600 font-bold";
              } else if (isUrgent || rec.statusLabel === 'Plan Restock') {
                statusClass = "bg-orange-100 text-orange-600";
              }

              return (
                <div 
                  key={rec.description} 
                  className={cn(
                    "p-4 border rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform",
                    isExtremelyLow ? "bg-red-50/10 border-red-100" : isUrgent ? "bg-orange-50/5 border-orange-100" : "bg-paper/10 border-black/5"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span 
                        onClick={() => {
                          if (onInspectItem) onInspectItem(rec.description);
                        }}
                        className={cn(
                          "text-xs font-bold text-ink block truncate max-w-[130px]",
                          onInspectItem ? "cursor-pointer hover:underline hover:text-brand" : ""
                        )}
                        title={onInspectItem ? `${rec.description} (inspect transactional history)` : rec.description}
                      >
                        {rec.description}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase leading-none", statusClass)}>
                        {rec.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-black/5">
                      <div className="space-y-0.5">
                        <span className="text-ink/40">Daily Sales:</span>
                        <strong className="block text-ink font-mono">{rec.velocity.toFixed(2)} units</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-ink/40">Remaining Stock:</span>
                        <strong className="block text-brand font-mono">{rec.remaining} left</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-paper/60 rounded-lg text-[10px] font-semibold text-ink/70 leading-normal">
                      {rec.insight}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-ink/40 block">Forecast Cover:</span>
                      <strong className={cn(
                        "text-xs font-mono",
                        isUrgent ? "text-red-600" : "text-green-600"
                      )}>
                        {rec.daysRemaining === Infinity ? 'Stable (No Vol)' : rec.daysRemaining <= 0 ? 'Exhausted' : `${rec.daysRemaining.toFixed(1)} days`}
                      </strong>
                    </div>
                    {rec.suggestedUnits > 0 ? (
                      <div className="text-right">
                        <span className="text-[9px] text-brand font-bold block">Suggest restock:</span>
                        <button
                          onClick={() => handleQuickRestock(rec.description, rec.suggestedUnits)}
                          className="px-2 py-1 bg-brand text-white text-[10px] font-bold rounded hover:opacity-90 transition-all uppercase leading-none mt-0.5"
                          title="Click to automatically add suggested units to stock level"
                        >
                          +{rec.suggestedUnits} Units
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-green-600 font-bold uppercase">Optimal Stack</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend / Action descriptions for high precision flow */}
      <div className="p-4 bg-paper/30 border border-black/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-ink/40 no-print">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Healthy (20+ units)</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Low (6-19 units)</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical (0-5 units)</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-700 animate-pulse" /> Oversold (Sold &gt; Stock)</span>
        </div>
        <p className="sm:text-right font-mono">
          Last processed: {new Date().toISOString().substring(11, 19)} UTC
        </p>
      </div>
    </div>
  );
}
