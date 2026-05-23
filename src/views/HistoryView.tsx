import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice } from '../types';
import { formatCurrency, cn, prepareElementForPDF } from '../lib/utils';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Smartphone, 
  Printer, 
  Trash2,
  ChevronDown,
  Eye
} from 'lucide-react';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function HistoryView() {
  const { profile, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const toggleMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMenuId(prev => (prev === id ? null : id));
  };

  const handleUpdateStatus = async (id: number, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMenuId(null);
    await updateStatus(id, status);
  };

  const handleDeleteInvoice = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMenuId(null);
    await deleteInvoice(id);
  };

  useEffect(() => {
    async function fetchInvoices() {
      let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('user_id', user.id);
      if (filter !== 'all') q = q.eq('status', filter);
      
      const { data } = await q;
      setInvoices(data || []);
      setLoading(false);
    }
    fetchInvoices();
  }, [user.id, isAdmin, filter]);

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.inv_number.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: number, status: string) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (!error) {
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: status as any } : inv));
    }
  };

  const deleteInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) {
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  const handleShareWA = (inv: Invoice) => {
    const phone = (inv.client_phone || '').replace(/\D/g, '');
    const msg = `Hello ${inv.client_name},\n\nReminder from *${inv.biz_name}*:\n\n*Invoice:* ${inv.inv_number}\n*Amount due:* ${formatCurrency(inv.total, inv.currency)}\n*Due date:* ${inv.due_date}\n\n*Payment via:* ${inv.pay_method} — ${inv.acc_number}\n\n— ${inv.biz_name}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    // Trigger WhatsApp link instantly to prevent popup blockers on all devices (mobile, tablet, PC)
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileOrTablet) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Open the preview modal so that 'printable-invoice' DOM element is rendered and download the PDF
    setSelectedInvoice(inv);

    // Wait slightly for React view lifecycle to mount and render the printable-invoice DOM element
    setTimeout(() => {
      const element = document.getElementById('printable-invoice');
      if (element) {
        const clone = prepareElementForPDF(element);
        const opt = {
          margin:       0.2,
          filename:     `Invoice_${inv.inv_number || 'Draft'}.pdf`,
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };
        try {
          html2pdf().set(opt).from(clone).save()
            .then(() => clone.remove())
            .catch(() => clone.remove());
        } catch (e) {
          console.error("Error generating PDF:", e);
          clone.remove();
        }
      }
    }, 300);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Invoice History</h1>
            <p className="text-ink/40 text-sm mt-1">{filteredInvoices.length} invoices found</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client or #"
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div className="relative group flex-1 sm:flex-none">
               <button className="w-full px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-semibold flex items-center justify-between sm:justify-start gap-2">
                 <div className="flex items-center gap-2">
                   <Filter className="w-4 h-4 text-ink/30" />
                   <span className="capitalize">{filter}</span>
                 </div>
                 <ChevronDown className="w-3 h-3 text-ink/30" />
               </button>
               <div className="absolute right-0 top-full mt-2 w-full sm:w-40 bg-white border border-black/5 rounded-xl shadow-xl z-20 overflow-hidden opacity-0 invisible group-focus-within:visible group-focus-within:opacity-100 transition-all">
                 {['all', 'paid', 'unpaid', 'overdue', 'draft'].map(s => (
                   <button 
                    key={s} 
                    onClick={() => setFilter(s)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-paper capitalize"
                   >
                     {s}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Table View (Desktop) */}
        <div className="hidden md:block bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper border-b border-black/5">
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest">Date / Due</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink/30 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-ink/20 animate-pulse font-bold">Loading records...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-ink/30 italic">No records to display.</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-paper/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] font-bold text-brand">{inv.inv_number}</div>
                      {isAdmin && <div className="text-[10px] text-ink/30 mt-0.5">{inv.biz_name}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{inv.client_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-ink/60">{inv.inv_date}</div>
                      <div className="text-[10px] text-ink/30 mt-0.5 font-bold">Due: {inv.due_date}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold font-mono text-sm">{formatCurrency(inv.total, inv.currency)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md",
                          inv.status === 'paid' ? 'bg-brand/10 text-brand' : 
                          inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 
                          'bg-amber-500/10 text-amber-500'
                        )}>
                          {inv.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex justify-end gap-2 transition-opacity",
                        activeMenuId === inv.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <button 
                           onClick={() => setSelectedInvoice(inv)}
                           title="View Invoice"
                           className="p-1.5 text-brand hover:bg-paper rounded-lg transition-colors"
                        >
                           <Eye className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => handleShareWA(inv)}
                           title="Share WhatsApp"
                           className="p-1.5 text-[#25D366] hover:bg-paper rounded-lg transition-colors"
                        >
                           <Smartphone className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          title="Print PDF"
                          className="p-1.5 text-ink/40 hover:text-ink hover:bg-paper rounded-lg transition-colors"
                        >
                           <Printer className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleMenu(inv.id, e)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              activeMenuId === inv.id 
                                ? "text-brand bg-brand/10" 
                                : "text-ink/40 hover:text-ink hover:bg-paper"
                            )}
                          >
                             <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div 
                            className={cn(
                              "absolute right-0 bottom-full mb-2 w-32 bg-white border border-black/5 rounded-xl shadow-xl z-30 overflow-hidden transition-all",
                              activeMenuId === inv.id ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                            )}
                          >
                             <button onClick={(e) => handleUpdateStatus(inv.id, 'paid', e)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-brand hover:bg-paper">Mark Paid</button>
                             <button onClick={(e) => handleUpdateStatus(inv.id, 'unpaid', e)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-paper">Mark Unpaid</button>
                             <button onClick={(e) => handleDeleteInvoice(inv.id, e)} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-paper border-t border-black/5">Delete</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card View (Mobile) */}
        <div className="md:hidden space-y-4">
          {loading ? (
             <div className="px-6 py-20 text-center text-ink/20 animate-pulse font-bold">Loading records...</div>
          ) : filteredInvoices.length === 0 ? (
             <div className="px-6 py-20 text-center text-ink/30 italic">No records to display.</div>
          ) : (
            filteredInvoices.map((inv) => (
              <div key={inv.id} className="bg-white border border-black/5 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[10px] font-bold text-brand">{inv.inv_number}</div>
                    <div className="font-bold text-ink mt-1">{inv.client_name}</div>
                    <div className="text-xs text-ink/40 mt-1">Issued: {inv.inv_date}</div>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md",
                    inv.status === 'paid' ? 'bg-brand/10 text-brand' : 
                    inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 
                    'bg-amber-500/10 text-amber-500'
                  )}>
                    {inv.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end pt-4 border-t border-black/5">
                  <div>
                    <div className="text-[10px] text-ink/30 uppercase tracking-tight font-bold">Total Amount</div>
                    <div className="text-lg font-bold font-mono text-ink leading-tight">{formatCurrency(inv.total, inv.currency)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-2.5 bg-paper rounded-xl text-brand transition-colors"
                    >
                       <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleShareWA(inv)}
                      className="p-2.5 bg-paper rounded-xl text-[#25D366] transition-colors"
                    >
                       <Smartphone className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(inv.id, e)}
                        className={cn(
                          "p-2.5 rounded-xl transition-colors",
                          activeMenuId === inv.id 
                            ? "text-brand bg-brand/10" 
                            : "bg-paper text-ink/40 hover:text-ink"
                        )}
                      >
                         <MoreHorizontal className="w-5 h-5" />
                      </button>
                      <div 
                        className={cn(
                          "absolute right-0 bottom-full mb-2 w-32 bg-white border border-black/5 rounded-xl shadow-xl z-30 overflow-hidden transition-all",
                          activeMenuId === inv.id ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                        )}
                      >
                         <button onClick={(e) => handleUpdateStatus(inv.id, 'paid', e)} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-brand hover:bg-paper">Mark Paid</button>
                         <button onClick={(e) => handleUpdateStatus(inv.id, 'unpaid', e)} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-paper">Mark Unpaid</button>
                         <button onClick={(e) => handleDeleteInvoice(inv.id, e)} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-paper border-t border-black/5">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <InvoicePreviewModal 
        invoice={selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
      />
    </div>
  );
}
