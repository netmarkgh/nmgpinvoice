import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Smartphone, Download } from 'lucide-react';
import { Invoice, InvoiceItem } from '../types';
import { formatCurrency, getInitials, prepareElementForPDF } from '../lib/utils';
import { supabase } from '../lib/supabase';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function InvoicePreviewModal({ invoice, onClose }: InvoicePreviewModalProps) {
  const [items, setItems] = React.useState<InvoiceItem[]>([]);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (invoice) {
      loadDetails();
    }
  }, [invoice]);

  async function loadDetails() {
    if (!invoice) return;
    const { data: itms } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('sort_order', { ascending: true });
    setItems(itms || []);

    const { data: prof } = await supabase.from('profiles').select('logo_url').eq('id', invoice.user_id).maybeSingle();
    setProfile(prof);
  }

  const handleShareWA = () => {
    if (!invoice) return;

    const phone = (invoice.client_phone || '').replace(/\D/g, '');
    const msg = `Hello ${invoice.client_name},\n\nFind your invoice from *${invoice.biz_name}*:\n\n*Invoice:* ${invoice.inv_number}\n*Amount:* ${formatCurrency(invoice.total, invoice.currency)}\n*Due date:* ${invoice.due_date}\n\n*Payment via:* ${invoice.pay_method} — ${invoice.acc_number}\n\n— ${invoice.biz_name}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    // Trigger WhatsApp link instantly to prevent popup blockers on all devices (mobile, tablet, PC)
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileOrTablet) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Auto-generate invoice PDF for attachment ready state with fixed dimensions
    const element = document.getElementById('printable-invoice');
    if (element) {
      const clone = prepareElementForPDF(element);
      const opt = {
        margin:       0.2,
        filename:     `Invoice_${invoice.inv_number || 'Draft'}.pdf`,
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
  };

  return (
    <AnimatePresence>
      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col print:shadow-none print:max-h-none print:w-full print:rounded-none"
          >
            {/* Header / Actions */}
            <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between bg-paper/50 no-print gap-4">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button 
                  onClick={handleShareWA}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-green-500/20"
                >
                  <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>
              <div className="hidden sm:block flex-1" />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto p-2 hover:bg-black/5 rounded-full text-ink/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-paper/30 print:p-0 print:bg-transparent print:overflow-visible">
              <div id="printable-invoice" className="bg-white w-full max-w-[800px] mx-auto shadow-xl p-6 md:p-12 print:shadow-none print:w-full print:p-0 print:mx-0 min-h-[1056px]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-[2.5px] border-brand pb-8 mb-8 gap-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-brand rounded-2xl flex items-center justify-center text-white font-bold text-xl md:text-2xl overflow-hidden shadow-lg shadow-brand/20 shrink-0">
                      {profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <span>{getInitials(invoice.biz_name)[0]}</span>}
                    </div>
                    <div>
                      <div className="text-lg md:text-xl font-bold text-brand leading-tight">{invoice.biz_name}</div>
                      <div className="text-[11px] md:text-xs text-ink/50 mt-1 max-w-[240px] leading-relaxed">{invoice.biz_address}</div>
                      <div className="text-[10px] md:text-[11px] text-ink/40 mt-1 font-medium">{invoice.biz_email} · {invoice.biz_phone}</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-0 border-black/5 pt-6 sm:pt-0">
                    <div className="bg-brand-light text-brand px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-[0.2em] inline-block mb-3">INVOICE</div>
                    <div className="font-mono text-xs font-bold text-ink/40 uppercase tracking-tighter">{invoice.inv_number}</div>
                    <div className="text-[10px] md:text-[11px] text-ink/40 mt-1">{new Date(invoice.inv_date).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mb-12">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">BILLED TO</div>
                    <div className="font-bold text-base text-ink">{invoice.client_name}</div>
                    <div className="text-xs text-ink/50 mt-1">{invoice.client_phone}</div>
                    <div className="text-xs text-ink/40 mt-1 leading-relaxed">{invoice.client_address}</div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-0 border-black/5 pt-6 sm:pt-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">DUE DATE</div>
                    <div className="font-bold text-base text-ink">{new Date(invoice.due_date).toLocaleDateString()}</div>
                    
                    {invoice.reference && (
                      <div className="mt-8">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-1">REFERENCE</div>
                        <div className="text-xs font-mono text-ink/60">{invoice.reference}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 mb-10">
                  <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                    <thead>
                      <tr className="border-b border-black/10 text-ink/40">
                        <th className="py-3 text-[10px] font-bold uppercase tracking-wider">Description</th>
                        <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-right w-16">Qty</th>
                        <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-right w-28">Unit Price</th>
                        <th className="py-3 text-[10px] font-bold uppercase tracking-wider text-right w-28 text-brand">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="text-ink border-b border-black/5 last:border-0">
                          <td className="py-4 text-sm font-medium pr-6">{it.description}</td>
                          <td className="py-4 text-sm text-right">{it.quantity}</td>
                          <td className="py-4 text-sm text-right">{formatCurrency(it.unit_price, invoice.currency)}</td>
                          <td className="py-4 text-sm text-right font-bold text-brand">{formatCurrency(it.amount, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex flex-col items-end gap-2 mb-12">
                  <div className="flex justify-between sm:justify-end gap-6 md:gap-12 text-[11px] text-ink/50 w-full sm:w-auto">
                    <span className="uppercase tracking-widest font-bold">Subtotal</span>
                    <span className="font-mono text-right w-28">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 md:gap-12 text-[11px] text-brand w-full sm:w-auto">
                      <span className="uppercase tracking-widest font-bold">Discount</span>
                      <span className="font-mono text-right w-28">-{formatCurrency(invoice.discount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 md:gap-12 text-[11px] text-ink/50 w-full sm:w-auto">
                      <span className="uppercase tracking-widest font-bold">VAT / TAX ({invoice.tax_rate}%)</span>
                      <span className="font-mono text-right w-28">+{formatCurrency(invoice.tax, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-end gap-6 md:gap-12 pt-3 border-t-2 border-brand mt-2 w-full sm:w-auto">
                    <span className="font-bold text-ink uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="font-mono text-xl font-bold text-brand w-28 text-right leading-none">{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>

                {/* Footer Pay Info */}
                <div className="py-6 border-b border-black/5 text-xs mb-8">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">PAYMENT VIA</div>
                  <div className="font-bold text-sm text-ink">{invoice.pay_method}</div>
                  {invoice.acc_number && <div className="text-ink/60 mt-1">{invoice.acc_number} ({invoice.acc_name})</div>}
                </div>

                <div className="mt-auto pt-4 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 text-center sm:text-left">
                  <div className="space-y-1">
                    <div className="text-[10px] text-ink/40">Thank you for your business!</div>
                    <div className="text-[10px] text-ink/40">Payment due within 7 days.</div>
                  </div>
                  <div className="text-[9px] text-ink/20 uppercase tracking-widest">
                    Generated by Net-Marketing Ghana(NMG)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
