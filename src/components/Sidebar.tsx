import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Users, 
  Settings, 
  TrendingUp, 
  ShieldCheck,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn, getInitials } from '../lib/utils';
import { isBusinessHubEnabled } from '../lib/visualEngine';

export type TabId = 'dashboard' | 'new-invoice' | 'history' | 'clients' | 'items' | 'business-hub' | 'settings' | 'admin';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { profile, signOut, user } = useAuth();
  const [hubEnabled, setHubEnabled] = useState(() => isBusinessHubEnabled());

  useEffect(() => {
    const handleToggle = () => {
      setHubEnabled(isBusinessHubEnabled());
    };
    window.addEventListener('business_hub_toggled', handleToggle);
    return () => window.removeEventListener('business_hub_toggled', handleToggle);
  }, []);
  
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-invoice', label: 'New Invoice', icon: FilePlus2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'clients', label: 'Clients', icon: Users, permission: 'can_manage_clients' },
    { id: 'items', label: 'Items Sold', icon: TrendingUp, permission: 'can_manage_items' },
  ];

  if (hubEnabled) {
    baseItems.push({ id: 'business-hub', label: 'Business Hub', icon: Layers });
  }

  baseItems.push({ id: 'settings', label: 'Settings', icon: Settings });

  const menuItems = baseItems.filter(item => {
    if (profile?.role === 'admin') return true;
    if (!item.permission) return true;
    return profile?.permissions?.includes(item.permission);
  });

  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
    onClose();
  };

  if (profile?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden no-print"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 lg:static w-72 bg-white border-r border-black/5 flex flex-col h-screen overflow-hidden no-print transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
      <div className="p-6 border-b border-black/5 flex items-center gap-3 relative">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-lg shadow-brand/20">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span>{getInitials(profile?.biz_name || 'NMG')[0]}</span>
          )}
        </div>
        <div className="overflow-hidden flex-1">
          <div className="font-semibold text-sm truncate">{profile?.biz_name || 'NMG'}</div>
          <div className="text-[10px] text-ink/40 uppercase tracking-wider font-medium">
            {profile?.role === 'admin' ? 'Admin' : 'Member'}
          </div>
        </div>
        
        {/* Close Button Mobile Only */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-ink/30 hover:text-ink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id as TabId)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
              activeTab === item.id 
                ? "bg-brand/10 text-brand font-medium shadow-sm" 
                : "text-ink/60 hover:bg-black/5 hover:text-ink"
            )}
          >
            <item.icon className={cn("w-4.5 h-4.5 transition-opacity", activeTab === item.id ? "opacity-100" : "opacity-60")} />
            <span className="flex-1 text-left">{item.label}</span>
            {activeTab === item.id && <ChevronRight className="w-4 h-4 opacity-40" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-xs shrink-0">
            {getInitials(profile?.name || '?')}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold truncate">{profile?.name || 'User'}</div>
            <div className="text-[10px] text-ink/40 truncate">{user?.email}</div>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
    </>
  );
}
