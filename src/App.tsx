import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { StockView } from './components/StockView';
import { SalesView } from './components/SalesView';
import { BkashView } from './components/BkashView';
import { LedgerView } from './components/LedgerView';
import { PurchasesView } from './components/PurchasesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { PinLockModal } from './components/PinLockModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { MenuDrawer } from './components/MenuDrawer';
import { SaleTransaction } from './types';
import { Mic } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isLocked } = useApp();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isPinSetupOpen, setIsPinSetupOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [printSale, setPrintSale] = useState<SaleTransaction | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Security PIN Lock Overlay if locked */}
      {isLocked && <PinLockModal mode="unlock" />}

      {/* PIN Setup Modal */}
      {isPinSetupOpen && (
        <PinLockModal mode="setup" onClose={() => setIsPinSetupOpen(false)} />
      )}

      {/* Main Top Navigation */}
      <Navbar
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenPinSettings={() => setIsPinSetupOpen(true)}
      />

      {/* Main Screen Content View */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'home' && (
          <DashboardView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onQuickSale={() => setCurrentTab('sales')}
          />
        )}
        {currentTab === 'stock' && <StockView />}
        {currentTab === 'sales' && (
          <SalesView onPrintInvoice={(sale) => setPrintSale(sale)} />
        )}
        {currentTab === 'bkash' && <BkashView />}
        {currentTab === 'ledger' && <LedgerView />}
        {currentTab === 'purchases' && <PurchasesView />}
        {currentTab === 'reports' && <ReportsView />}
        {currentTab === 'settings' && (
          <SettingsView onOpenPinSetup={() => setIsPinSetupOpen(true)} />
        )}
      </main>

      {/* Floating Bengali Voice Assistant Mic Button */}
      <button
        onClick={() => setIsVoiceOpen(true)}
        className="fixed bottom-18 right-4 sm:right-6 z-30 w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[2px] shadow-xl shadow-emerald-950/80 active:scale-95 transition-all cursor-pointer group"
        aria-label="বাংলা ভয়েস কমান্ড চালু করুন"
      >
        <div className="w-full h-full bg-slate-950/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center group-hover:bg-slate-900 transition-all">
          <Mic className="w-6 h-6 text-amber-300 animate-pulse" />
        </div>
      </button>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Cash Memo Print Modal */}
      {printSale && (
        <InvoicePrintModal
          sale={printSale}
          onClose={() => setPrintSale(null)}
        />
      )}

      {/* Side Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenPinSetup={() => setIsPinSetupOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
