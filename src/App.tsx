import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, TabId } from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';

// Specialized Views
import { Dashboard } from './views/Dashboard';
import { InvoiceBuilder } from './views/InvoiceBuilder';
import { HistoryView } from './views/HistoryView';
import { ClientsView } from './views/ClientsView';
import { ItemsSoldView } from './views/ItemsSoldView';
import { SettingsView } from './views/SettingsView';
import { AdminView } from './views/AdminView';
import { NotificationCenter } from './components/NotificationCenter';

export default function App() {
  const { user, loading, profile, isRecoveryMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [builderInitialClient, setBuilderInitialClient] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-brand tracking-tighter mb-4">NMG</div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-brand animate-bounce" />
        </div>
      </div>
    );
  }

  if (isRecoveryMode) {
    return <AuthScreen initialMode="update" />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Handle inactive profile (subscription check)
  if (profile?.status === 'inactive' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-black/5 p-10 rounded-2xl shadow-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Account Inactive</h1>
          <p className="text-ink/60 mb-6">
            Your subscription has expired or your account has been deactivated. 
            Please contact an NMG Admin to renew your access.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
          onNewInvoice={() => setActiveTab('new-invoice')} 
          onViewHistory={() => setActiveTab('history')} 
        />;
      case 'new-invoice': 
        return <InvoiceBuilder 
          initialClientName={builderInitialClient} 
          onSuccess={() => {
            setBuilderInitialClient(null);
            setActiveTab('history');
          }} 
        />;
      case 'history': 
        return <HistoryView />;
      case 'clients': 
        return <ClientsView onNewInvoiceFor={(name) => {
          setBuilderInitialClient(name);
          setActiveTab('new-invoice');
        }} />;
      case 'items': 
        return <ItemsSoldView />;
      case 'settings': 
        return <SettingsView />;
      case 'admin': 
        return <AdminView />;
      default: 
        return <Dashboard 
          onNewInvoice={() => setActiveTab('new-invoice')} 
          onViewHistory={() => setActiveTab('history')} 
        />;
    }
  };

  return (
    <div className="flex bg-paper min-h-screen font-sans relative overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto h-screen relative">
        {/* Desktop floating Alerts Center Node */}
        <div className="absolute top-6 right-8 z-40 hidden lg:block no-print">
          <NotificationCenter onNavigate={(tab, val) => {
            setActiveTab(tab as TabId);
            if (tab === 'history' && val) {
              localStorage.setItem('focus_invoice_number', val);
              window.dispatchEvent(new Event('focus_invoice_number_changed'));
            } else if (tab === 'items' && val) {
              localStorage.setItem('focus_item_desc', val);
              window.dispatchEvent(new Event('focus_item_desc_changed'));
            }
          }} />
        </div>

        {/* Mobile Header with integrated alert center */}
        <div className="lg:hidden h-14 bg-white border-b border-black/5 flex items-center justify-between px-4 sticky top-0 z-30 no-print">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-ink/60 hover:text-ink transition-colors flex items-center justify-center animate-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-brand tracking-tighter text-xl">NMG</div>
          <NotificationCenter onNavigate={(tab, val) => {
            setActiveTab(tab as TabId);
            if (tab === 'history' && val) {
              localStorage.setItem('focus_invoice_number', val);
              window.dispatchEvent(new Event('focus_invoice_number_changed'));
            } else if (tab === 'items' && val) {
              localStorage.setItem('focus_item_desc', val);
              window.dispatchEvent(new Event('focus_item_desc_changed'));
            }
          }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
