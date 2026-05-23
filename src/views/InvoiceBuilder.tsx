import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Client } from '../types';
import { formatCurrency, cn, getInitials, prepareElementForPDF } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  FileText, 
  Smartphone,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoiceBuilderProps {
  onSuccess: () => void;
  initialClientName?: string | null;
}

export function InvoiceBuilder({ onSuccess, initialClientName }: InvoiceBuilderProps) {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [nextInvNumber, setNextInvNumber] = useState('NMG-2000');

  // Form State
  const [form, setForm] = useState({
    clientName: initialClientName || '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    bizName: profile?.biz_name || '',
    bizPhone: profile?.phone || '',
    bizEmail: user?.email || '',
    bizAddress: profile?.address || '',
    invDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
    currency: profile?.currency || 'GHS',
    status: 'unpaid' as const,
    reference: '',
    payMethod: profile?.pay_method || 'MTN Mobile Money',
    accNumber: profile?.acc_number || '',
    accName: profile?.acc_name || '',
    note: profile?.default_note || '',
    terms: profile?.default_terms || '',
    taxRate: 0,
    discountValue: 0,
    discountType: 'pct' as 'pct' | 'flat',
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { id: Date.now(), description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id);
      setClients(data || []);
      
      if (initialClientName) {
        const client = (data || []).find(c => c.name === initialClientName);
        if (client) {
          setForm(prev => ({
            ...prev,
            clientPhone: client.phone || '',
            clientEmail: client.email || '',
            clientAddress: client.address || ''
          }));
        }
      }
    }
    loadClients();

    async function getNextInvNumber() {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const num = 2000 + (count || 0);
      setNextInvNumber(`NMG-${num}`);
    }
    getNextInvNumber();
  }, [user.id, initialClientName]);

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = (updated.quantity || 1) * (updated.unit_price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = form.discountType === 'pct' ? (subtotal * form.discountValue / 100) : form.discountValue;
  const tax = (subtotal - discount) * form.taxRate / 100;
  const total = Math.max(0, subtotal - discount + tax);

  const handleSave = async () => {
    if (!form.clientName) return alert('Client name is required');
    setLoading(true);

    try {
      const { data: inv, error: invError } = await supabase.from('invoices').insert({
        user_id: user.id,
        inv_number: nextInvNumber,
        client_name: form.clientName,
        client_phone: form.clientPhone,
        client_email: form.clientEmail,
        client_address: form.clientAddress,
        biz_name: form.bizName,
        biz_phone: form.bizPhone,
        biz_email: form.bizEmail,
        biz_address: form.bizAddress,
        inv_date: form.invDate,
        due_date: form.dueDate,
        reference: form.reference,
        status: form.status,
        currency: form.currency,
        subtotal,
        discount,
        discount_type: form.discountType,
        discount_value: form.discountValue,
        tax,
        tax_rate: form.taxRate,
        total,
        pay_method: form.payMethod,
        acc_number: form.accNumber,
        acc_name: form.accName,
        note: form.note,
        terms: form.terms
      }).select().single();

      if (invError) throw invError;

      const itemsToInsert = items.map((it, i) => ({
        invoice_id: inv.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: (it.quantity || 0) * (it.unit_price || 0),
        sort_order: i
      }));
      await supabase.from('invoice_items').insert(itemsToInsert);

      // Auto-save client
      const existingClient = clients.find(c => c.name.toLowerCase() === form.clientName.toLowerCase());
      if (!existingClient) {
        await supabase.from('clients').insert({
          user_id: user.id,
          name: form.clientName,
          phone: form.clientPhone,
          email: form.clientEmail,
          address: form.clientAddress
        });
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWA = () => {
    const phone = form.clientPhone.replace(/\D/g, '');
    const msg = `Hello ${form.clientName},\n\nPlease find your invoice from *${form.bizName}*:\n\n*Amount due:* ${formatCurrency(total, form.currency)}\n*Due date:* ${form.dueDate}\n\n*Payment:* ${form.payMethod} — ${form.accNumber}\nName: ${form.accName}\n\n${form.note}\n\n— ${form.bizName}`;
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
        filename:     `Invoice_${nextInvNumber || 'Draft'}.pdf`,
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">New Invoice</h1>
            <p className="text-ink/40 text-sm mt-1">Fill in the details to generate a professional invoice.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleShareWA}
              className="flex-1 md:flex-none justify-center bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-4 h-4" /> WhatsApp
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 md:flex-none justify-center bg-white border border-black/5 text-ink px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-paper transition-colors"
            >
              <FileText className="w-4 h-4" /> Print / Save PDF
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full md:w-auto justify-center bg-brand text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        {/* Editor Side */}
        <div className="space-y-6 no-print order-2 lg:order-1">
          {/* Section: Client */}
          <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-2">Bill To — Client</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client Name</label>
                <input 
                  list="clients-list"
                  value={form.clientName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm(prev => ({ ...prev, clientName: name }));
                    const client = clients.find(c => c.name === name);
                    if (client) {
                      setForm(prev => ({
                        ...prev,
                        clientPhone: client.phone || '',
                        clientEmail: client.email || '',
                        clientAddress: client.address || ''
                      }));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="Client Name"
                />
                <datalist id="clients-list">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client Phone (WhatsApp)</label>
                <input 
                  value={form.clientPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="Client Phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client Email</label>
                <input 
                  value={form.clientEmail}
                  onChange={(e) => setForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="client@email.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Client Address</label>
                <input 
                  value={form.clientAddress}
                  onChange={(e) => setForm(prev => ({ ...prev, clientAddress: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                  placeholder="Client Address"
                />
              </div>
            </div>
          </div>

          {/* Section: Invoice Details */}
          <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-2">Invoice Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Invoice Date</label>
                <input 
                  type="date"
                  value={form.invDate}
                  onChange={(e) => setForm(prev => ({ ...prev, invDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Due Date</label>
                <input 
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Currency</label>
                <select 
                  value={form.currency}
                  onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                >
                  <option value="GHS">GHS</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Status</label>
                <select 
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Reference / PO Number</label>
              <input 
                value={form.reference}
                onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                placeholder="NMGConnects"
              />
            </div>
          </div>

          {/* Section: Items */}
          <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30 mb-2 font-sans">Line Items</div>
            <div className="space-y-6 md:space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    {index === 0 && <label className="hidden md:block text-[9px] font-bold text-ink/40 uppercase ml-1">Description</label>}
                    <input 
                      value={item.description}
                      onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                      className="w-full px-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:border-brand"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 space-y-1">
                    {index === 0 && <label className="hidden md:block text-[9px] font-bold text-ink/40 uppercase ml-1 text-right">Qty</label>}
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 bg-paper border border-black/5 rounded-xl text-sm text-right focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    {index === 0 && <label className="hidden md:block text-[9px] font-bold text-ink/40 uppercase ml-1 text-right">Unit Price</label>}
                    <input 
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id!, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-paper border border-black/5 rounded-xl text-sm text-right focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 h-10 flex items-center justify-end font-mono text-xs font-bold text-brand">
                    {(item.amount || 0).toFixed(2)}
                  </div>
                  <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                    <button 
                      onClick={() => removeItem(item.id!)}
                      className="p-2 text-red-400 hover:text-red-500 transition-colors bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-center pt-2">
                <button 
                  onClick={addItem}
                  className="bg-brand/10 text-brand px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                >
                  + Add line item
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-6 mt-6 border-t border-black/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink/40">Subtotal</span>
                <span className="font-mono font-bold">{formatCurrency(subtotal, form.currency)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ink/40">Discount</span>
                  <input 
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1.5 bg-paper border border-black/5 rounded-md text-xs text-right focus:outline-none"
                  />
                  <select 
                    value={form.discountType}
                    onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                    className="px-1 py-1.5 bg-paper border border-black/5 rounded-md text-[10px] focus:outline-none"
                  >
                    <option value="pct">% perc</option>
                    <option value="flat">Fixed</option>
                  </select>
                </div>
                <span className="font-mono text-brand font-bold">-{formatCurrency(discount, form.currency)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ink/40">Tax Rate (%)</span>
                  <input 
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1.5 bg-paper border border-black/5 rounded-md text-xs text-right focus:outline-none"
                  />
                </div>
                <span className="font-mono font-bold">+{formatCurrency(tax, form.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-black/5">
                <span className="font-bold text-ink">Total Amount</span>
                <span className="text-xl font-bold font-mono text-brand">{formatCurrency(total, form.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Section: Payment & Notes */}
          <div className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30">Payment Details</div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink/40 uppercase ml-1">Method</label>
                  <select 
                    value={form.payMethod}
                    onChange={(e) => setForm(prev => ({ ...prev, payMethod: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none"
                  >
                    <option>MTN Mobile Money</option>
                    <option>Vodafone Cash</option>
                    <option>Bank Transfer</option>
                    <option>Paystack Link</option>
                    <option>Cash</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink/40 uppercase ml-1">Account Number</label>
                  <input 
                    value={form.accNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, accNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-paper border border-black/5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-ink/30">Notes & Terms</div>
              <textarea 
                value={form.note}
                onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                className="w-full h-24 px-3 py-2.5 bg-paper border border-black/5 rounded-xl text-sm resize-none"
                placeholder="Note to client..."
              />
            </div>
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="lg:sticky lg:top-8 space-y-4 order-1 lg:order-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-ink/30 font-sans">Live Preview</span>
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
              form.status === 'paid' ? 'bg-brand/10 text-brand' : 'bg-amber-500/10 text-amber-500'
            )}>
              {form.status}
            </div>
          </div>
          
          <div id="printable-invoice" className="bg-white border border-black/5 shadow-2xl rounded-2xl p-6 md:p-10 font-sans overflow-hidden print-shadow-none print:w-full print:border-none print:p-0 min-h-[500px] lg:min-h-[1056px]">
             {/* Header */}
             <div className="flex justify-between items-start border-b-[2px] border-brand pb-6 mb-6">
               <div className="flex gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl overflow-hidden shrink-0 shadow-lg shadow-brand/20">
                    {profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <span>{getInitials(form.bizName)[0]}</span>}
                  </div>
                  <div>
                    <div className="text-base md:text-lg font-bold text-brand leading-tight">{form.bizName}</div>
                    <div className="text-[10px] text-ink/50 mt-1 max-w-[200px] leading-tight">{form.bizAddress}</div>
                    <div className="text-[10px] text-ink/50 mt-0.5">{form.bizEmail} · {form.bizPhone}</div>
                  </div>
               </div>
               <div className="text-right">
                 <div className="bg-brand-light text-brand px-3 py-1 rounded-md text-[10px] font-bold tracking-widest inline-block">INVOICE</div>
                 <div className="font-mono text-[11px] text-ink/40 mt-1.5 uppercase tracking-tighter">{nextInvNumber}</div>
                 <div className="text-[10px] text-ink/40 mt-0.5">{form.invDate}</div>
               </div>
             </div>

             {/* Parties */}
             <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
               <div>
                 <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-2">BILLED TO</div>
                 <div className="font-bold text-xs md:text-sm text-ink">{form.clientName || '—'}</div>
                 <div className="text-[10px] text-ink/50 mt-1">{form.clientPhone}</div>
                 <div className="text-[10px] text-ink/50">{form.clientAddress}</div>
               </div>
               <div className="text-right">
                 <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-2">DUE DATE</div>
                 <div className="font-bold text-xs md:text-sm text-ink">{form.dueDate}</div>
                 {form.reference && (
                  <div className="mt-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-ink/30 mb-1">REFERENCE</div>
                    <div className="text-[10px] text-ink/60">{form.reference}</div>
                  </div>
                 )}
               </div>
             </div>

             {/* Table */}
             <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
               <table className="w-full text-left border-collapse mb-6 min-w-[300px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider">Description</th>
                      <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-12">Qty</th>
                      <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-24">Unit Price</th>
                      <th className="py-2 text-[9px] font-bold text-ink/30 uppercase tracking-wider text-right w-24 text-brand">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-[10px] md:text-[11px] font-medium text-ink pr-4">{it.description || '—'}</td>
                        <td className="py-3 text-[10px] md:text-[11px] text-ink text-right">{it.quantity}</td>
                        <td className="py-3 text-[10px] md:text-[11px] text-ink text-right">{formatCurrency(it.unit_price || 0, form.currency)}</td>
                        <td className="py-3 text-[10px] md:text-[11px] text-brand text-right font-bold">{formatCurrency(it.amount || 0, form.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>

             {/* Calculations */}
             <div className="flex flex-col items-end gap-1.5 mb-8">
               <div className="flex justify-between sm:justify-end gap-10 text-[10px] md:text-[11px] text-ink/60 w-full sm:w-auto">
                 <span>Subtotal</span>
                 <span className="font-mono text-right w-24">{formatCurrency(subtotal, form.currency)}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between sm:justify-end gap-10 text-[10px] md:text-[11px] text-brand w-full sm:w-auto">
                   <span>Discount</span>
                   <span className="font-mono text-right w-24">-{formatCurrency(discount, form.currency)}</span>
                 </div>
               )}
               {tax > 0 && (
                 <div className="flex justify-between sm:justify-end gap-10 text-[10px] md:text-[11px] text-ink/60 w-full sm:w-auto">
                   <span>Tax ({form.taxRate}%)</span>
                   <span className="font-mono text-right w-24">+{formatCurrency(tax, form.currency)}</span>
                 </div>
               )}
               <div className="flex justify-between sm:justify-end gap-10 pt-2 border-t border-black/5 mt-1 w-full sm:w-auto">
                 <span className="font-bold text-ink text-[11px] md:text-xs">Total</span>
                 <span className="font-mono text-base md:text-lg font-bold text-brand w-24 text-right leading-none">{formatCurrency(total, form.currency)}</span>
               </div>
             </div>

             {/* Footer Pay Info */}
             <div className="py-4 border-b border-black/5 text-[10px] mb-8">
                <div className="text-[8px] font-bold uppercase tracking-widest text-ink/30 mb-2">PAYMENT VIA</div>
                <div className="font-bold text-ink">{form.payMethod}</div>
                {form.accNumber && <div className="text-ink/60 text-[9px] mt-1">{form.accNumber} ({form.accName})</div>}
             </div>

             <div className="mt-auto pt-4 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 text-center sm:text-left">
               <div className="space-y-1">
                 <div className="text-[9px] text-ink/40">Thank you for your business!</div>
                 <div className="text-[9px] text-ink/40">Payment due within 7 days.</div>
               </div>
               <div className="text-[8px] font-mono text-ink/20 uppercase tracking-widest">
                 Generated by Net-Marketing Ghana(NMG)
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
