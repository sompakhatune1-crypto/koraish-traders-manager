import React from 'react';
import { Home, Package, ShoppingCart, Smartphone, BookOpen, Menu } from 'lucide-react';

export type NavTab = 'home' | 'stock' | 'sales' | 'bkash' | 'ledger' | 'purchases' | 'reports' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, onOpenMenu }) => {
  const tabs = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'stock', label: 'স্টক', icon: Package },
    { id: 'sales', label: 'বিক্রি', icon: ShoppingCart },
    { id: 'bkash', label: 'বিকাশ', icon: Smartphone },
    { id: 'ledger', label: 'হিসাব', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-6 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* Menu Drawer button */}
        <button
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            ['purchases', 'reports', 'settings'].includes(currentTab)
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg ${
              ['purchases', 'reports', 'settings'].includes(currentTab)
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">মেনু</span>
        </button>
      </div>
    </nav>
  );
};
