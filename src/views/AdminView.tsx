import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import { formatCurrency, cn, getInitials } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Shield, 
  Key, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Building2,
  Tag,
  Settings,
  X
} from 'lucide-react';

export function AdminView() {
  const { profile: loggedInProfile } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Subscription Modal State
  const [pendingSub, setPendingSub] = useState<Profile | null>(null);
  const [subMonths, setSubMonths] = useState(1);
  const [subStart, setSubStart] = useState(new Date().toISOString().split('T')[0]);

  // Advanced Profile State
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [activeTab, setActiveTab] = useState<'info' | 'analytics' | 'activity'>('info');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: invs } = await supabase.from('invoices').select('total, status, user_id, created_at');
    setMembers(profiles || []);
    setInvoices(invs || []);
    setLoading(false);
  }

  const getMemberAnalytics = (userId: string) => {
    const userInvs = invoices.filter(i => i.user_id === userId);
    return {
      count: userInvs.length,
      revenue: userInvs.reduce((s, i) => s + parseFloat(i.total || 0), 0),
      paidCount: userInvs.filter(i => i.status === 'paid').length
    };
  };

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const activeMembers = members.filter(m => m.status === 'active').length;

  const handleUpdateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, role: role as any } : m));
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const status = current === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ status }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, status: status as any } : m));
  };

  const handleSetSubscription = async () => {
    if (!pendingSub) return;
    const end = new Date(subStart);
    end.setMonth(end.getMonth() + subMonths);
    
    const { error } = await supabase.from('profiles').update({
      status: 'active',
      sub_starts_at: new Date(subStart).toISOString(),
      sub_expires_at: end.toISOString()
    }).eq('id', pendingSub.id);

    if (!error) {
      alert('Subscription set successfully');
      setPendingSub(null);
      loadAdminData();
    }
  };

  const handleEdit = (member: Profile) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      biz_name: member.biz_name,
      role: member.role,
      phone: member.phone,
      address: member.address,
      permissions: member.permissions || [],
      tags: member.tags || []
    });
  };

  const handleSaveProfile = async () => {
    if (!editingMember) return;
    
    const { error } = await supabase.from('profiles').update({
      name: editForm.name,
      email: editForm.email,
      biz_name: editForm.biz_name,
      role: editForm.role,
      phone: editForm.phone,
      address: editForm.address,
      permissions: editForm.permissions,
      tags: editForm.tags
    }).eq('id', editingMember.id);

    if (!error) {
      setEditingMember(null);
      loadAdminData();
    } else {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message} (${error.hint || 'No hint available'})`);
    }
  };

  if (loggedInProfile?.role !== 'admin') {
    return <div className="p-20 text-center font-bold text-red-500">Access Denied</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-ink">NMG Admin Panel</h1>
        <p className="text-ink/40 text-sm mt-1">Community management and infrastructure health.</p>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Members</div>
           <div className="text-2xl font-bold text-ink">{members.length}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Active</div>
           <div className="text-2xl font-bold text-brand">{activeMembers}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Community Revenue</div>
           <div className="text-2xl font-bold font-mono text-ink leading-tight">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
           <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mb-1">Collected</div>
           <div className="text-2xl font-bold font-mono text-brand leading-tight">{formatCurrency(collected)}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-semibold text-ink/80 text-sm">Community Members</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-black/5 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between shadow-sm group hover:border-brand/40 transition-all gap-6">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-paper shrink-0 rounded-2xl flex items-center justify-center text-brand font-bold text-lg group-hover:bg-brand/10 transition-all">
                    {getInitials(m.name || '?')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-ink text-sm">{m.name}</span>
                       <span className={cn(
                         "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                         m.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-paper text-ink/30 border-black/5"
                       )}>
                         {m.role}
                       </span>
                    </div>
                    <div className="text-[10px] text-ink/50 mt-1 uppercase tracking-tight font-medium">
                      {m.biz_name} {m.biz_name && '·'} {m.biz_type || 'General'}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        m.status === 'active' ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-500"
                      )}>
                        {m.status}
                      </span>
                      {m.sub_expires_at && (
                        <div className="flex items-center gap-1 text-[9px] text-ink/40 font-bold uppercase">
                          <Clock className="w-2.5 h-2.5" /> 
                          Exp: {m.sub_expires_at.split('T')[0]}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between md:justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity pt-4 md:pt-0 border-t md:border-0 border-black/5">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="p-2.5 bg-paper md:bg-transparent md:hover:bg-paper rounded-xl text-ink/40 hover:text-brand transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateRole(m.id, m.role === 'admin' ? 'member' : 'admin')}
                      className="p-2.5 bg-paper md:bg-transparent md:hover:bg-paper rounded-xl text-ink/40 hover:text-ink transition-colors"
                      title="Toggle Admin"
                    >
                      <Shield className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(m.id, m.status)}
                      className={cn(
                        "p-2.5 bg-paper md:bg-transparent rounded-xl transition-colors",
                        m.status === 'active' ? "hover:bg-red-50 text-red-400 hover:text-red-500" : "hover:bg-brand/10 text-brand/40 hover:text-brand"
                      )}
                      title={m.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {m.status === 'active' ? <XCircle className="w-5 h-5 md:w-4 md:h-4" /> : <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />}
                    </button>
                  </div>
                  <button 
                    onClick={() => setPendingSub(m)}
                    className="flex items-center gap-2 bg-brand text-white md:bg-brand/10 md:text-brand px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider md:hover:bg-brand md:hover:text-white transition-all shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Subscription
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Modal */}
      {pendingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
           <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md p-6 md:p-8 rounded-3xl shadow-2xl space-y-6"
           >
              <div>
                <h3 className="text-xl font-bold text-ink">Set Subscription</h3>
                <p className="text-ink/40 text-sm mt-1">Update access for {pendingSub.name}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Duration (Months)</label>
                  <select 
                    value={subMonths} 
                    onChange={e => setSubMonths(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink/40 uppercase ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={subStart} 
                    onChange={e => setSubStart(e.target.value)}
                    className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand font-mono"
                  />
                </div>

                <div className="bg-brand-light p-4 rounded-xl text-brand text-xs font-semibold">
                  Access will extend until {(() => {
                    const d = new Date(subStart);
                    d.setMonth(d.getMonth() + subMonths);
                    return d.toLocaleDateString();
                  })()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={handleSetSubscription} className="flex-1 bg-brand text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all order-1 sm:order-2">
                  Confirm Access
                </button>
                <button onClick={() => setPendingSub(null)} className="flex-1 bg-paper text-ink/40 py-3.5 rounded-xl font-bold text-sm hover:bg-black/5 transition-all order-2 sm:order-1">
                  Cancel
                </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Advanced Profile Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl"
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-ink">Advanced Member Profile</h3>
                <p className="text-ink/40 text-[10px] md:text-xs mt-0.5">Edit comprehensive details for {editingMember.name || 'this member'}.</p>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="p-2 hover:bg-paper rounded-xl text-ink/20 hover:text-ink/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation */}
            <div className="px-5 md:px-6 flex gap-4 md:gap-6 border-b border-black/5 bg-paper/30 overflow-x-auto no-scrollbar">
              {[
                { id: 'info', icon: Users, label: 'Core Info' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'activity', icon: Clock, label: 'Activity Log' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all shrink-0",
                    activeTab === tab.id 
                      ? "border-brand text-brand" 
                      : "border-transparent text-ink/30 hover:text-ink/60"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              {activeTab === 'info' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <Users className="w-3 h-3" /> Full Name
                        </label>
                        <input 
                          value={editForm.name || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input 
                          value={editForm.email || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Company Name
                        </label>
                        <input 
                          value={editForm.biz_name || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, biz_name: e.target.value }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <Shield className="w-3 h-3" /> System Role
                        </label>
                        <select 
                          value={editForm.role} 
                          onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> Phone Number
                        </label>
                        <input 
                          value={editForm.phone || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                          placeholder="+233..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> Physical Address
                        </label>
                        <input 
                          value={editForm.address || ''} 
                          onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-transparent focus:border-brand"
                          placeholder="City, Street"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> Account Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editForm.tags || []).map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-brand/5 text-brand rounded-lg text-xs font-bold flex items-center gap-2 group">
                          {tag}
                          <button 
                            onClick={() => setEditForm(prev => ({ ...prev, tags: (prev.tags || []).filter((_, idx) => idx !== i) }))}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !(editForm.tags || []).includes(val)) {
                            setEditForm(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="w-full px-4 py-3 bg-paper rounded-xl text-sm focus:outline-none border border-black/5"
                      placeholder="Type a tag and press Enter..."
                    />
                  </div>

                  {/* Permissions Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-ink/40 uppercase ml-1 flex items-center gap-1.5">
                      <Settings className="w-3 h-3" /> Specific Permissions
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        'can_export_data',
                        'can_delete_invoices',
                        'can_manage_clients',
                        'can_access_revenue_reports',
                        'can_manage_items',
                        'can_use_advanced_items_filters',
                        'can_customize_branding',
                        'can_access_sales_analytics'
                      ].map(perm => (
                        <label key={perm} className="flex items-center gap-3 p-3 bg-paper rounded-xl cursor-pointer hover:bg-black/5 transition-colors">
                          <input 
                            type="checkbox"
                            checked={(editForm.permissions || []).includes(perm)}
                            onChange={e => {
                              const checked = e.target.checked;
                              setEditForm(prev => ({
                                ...prev,
                                permissions: checked 
                                  ? [...(prev.permissions || []), perm]
                                  : (prev.permissions || []).filter(p => p !== perm)
                                }));
                            }}
                            className="w-4 h-4 rounded border-black/10 text-brand focus:ring-brand"
                          />
                          <span className="text-xs font-medium text-ink/70 capitalize">{perm.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {(() => {
                        const stats = getMemberAnalytics(editingMember.id);
                        return (
                          <>
                            <div className="bg-paper p-6 rounded-2xl border border-black/5">
                               <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1">Lifetime Revenue</div>
                               <div className="text-xl font-bold text-ink leading-tight">{formatCurrency(stats.revenue)}</div>
                            </div>
                            <div className="bg-paper p-6 rounded-2xl border border-black/5">
                               <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1">Invoices Issued</div>
                               <div className="text-xl font-bold text-ink leading-tight">{stats.count}</div>
                            </div>
                            <div className="bg-paper p-6 rounded-2xl border border-black/5">
                               <div className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1">Paid Invoices</div>
                               <div className="text-xl font-bold text-brand leading-tight">{stats.paidCount}</div>
                            </div>
                          </>
                        );
                      })()}
                   </div>

                   <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="text-xs font-bold text-ink/80">Account Timeline</div>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-xs">
                            <span className="text-ink/40">Member Since</span>
                            <span className="font-bold text-ink">{new Date(editingMember.created_at).toLocaleDateString()}</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                            <span className="text-ink/40">Current Status</span>
                            <span className={cn(
                              "font-bold px-2 py-0.5 rounded-md",
                              editingMember.status === 'active' ? "bg-brand/10 text-brand" : "bg-red-50 text-red-500"
                            )}>{editingMember.status}</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                            <span className="text-ink/40">Last Activity</span>
                            <span className="font-bold text-ink">Today</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Recent System Events</div>
                      <div className="space-y-3">
                         {[
                           { event: 'Invoice Generated', target: 'NMG-0012', time: '2 hours ago', icon: ArrowUpRight, color: 'text-brand bg-brand/5' },
                           { event: 'Profile Updated', target: 'Business Name', time: '5 hours ago', icon: Edit3, color: 'text-blue-500 bg-blue-50' },
                           { event: 'Security Login', target: 'IP: 192.168.1.1', time: '1 day ago', icon: Key, color: 'text-purple-500 bg-purple-50' },
                           { event: 'New Client Added', target: 'Global Tech Ltd', time: '2 days ago', icon: Users, color: 'text-orange-500 bg-orange-50' }
                         ].map((log, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 bg-paper rounded-2xl border border-transparent hover:border-black/5 transition-all">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", log.color)}>
                                 <log.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <h4 className="text-sm font-bold text-ink">{log.event}</h4>
                                    <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{log.time}</span>
                                 </div>
                                 <p className="text-xs text-ink/50 truncate font-mono mt-1">{log.target}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 md:p-6 border-t border-black/5 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSaveProfile}
                className="flex-1 bg-brand text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all order-1 sm:order-2"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingMember(null)}
                className="flex-1 bg-paper text-ink/40 py-3.5 rounded-xl font-bold text-sm hover:bg-black/5 transition-all order-2 sm:order-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
