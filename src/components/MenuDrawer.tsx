import React from 'react';
import {
  X,
  Truck,
  FileText,
  Settings,
  Shield,
  Smartphone,
  BookOpen,
  Mic,
  Package,
  Download,
  Lock,
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { useApp } from '../context/AppContext';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenVoice: () => void;
  onOpenPinSetup: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenVoice,
  onOpenPinSetup,
}) => {
  const { profile, lockAppNow, exportDatabaseJson } = useApp();

  if (!isOpen) return null;

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koraish_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const menuItems = [
    { id: 'purchases', label: 'সিমেন্ট ক্রয় (মাল ইন)', icon: Truck, desc: 'ডিলার থেকে সিমেন্ট ক্রয় ও পরিবহন খরচ' },
    { id: 'reports', label: 'রিপোর্ট ও লাভ-ক্ষতি', icon: FileText, desc: 'দৈনিক ক্লোজিং, নিট মুনাফা ও এক্সেল' },
    { id: 'ledger', label: 'কাস্টমার ও মহাজন বাকি', icon: BookOpen, desc: 'বকেয়া হিসাব ও লেনদেন খতিয়ান' },
    { id: 'bkash', label: 'বিকাশ বিজনেস লেজার', icon: Smartphone, desc: 'ক্যাশইন, ক্যাশআউট ও ট্রানজেকশন ট্র্যাকিং' },
    { id: 'stock', label: 'সিমেন্ট ব্রান্ড স্টক', icon: Package, desc: 'ব্রান্ডভিত্তিক বস্তা গণনা ও সমন্বয়' },
    { id: 'settings', label: 'অ্যাপ ও ব্যবসা সেটিংস', icon: Settings, desc: 'দোকানের নাম, ঠিকানা ও নিরাপত্তা' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">{profile.businessName}</h2>
              <p className="text-xs text-slate-400">প্রধান মেনু ও কন্ট্রোল প্যানেল</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Voice Assistant Trigger */}
          <button
            onClick={() => {
              onClose();
              onOpenVoice();
            }}
            className="w-full mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-between shadow-lg shadow-emerald-950/60 active:scale-95 transition-all text-xs font-bold cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-300" />
              <span>বাংলা ভয়েস অ্যাসিস্ট্যান্ট</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">চালু করুন</span>
          </button>

          {/* Navigation Items */}
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id as NavTab)}
                  className="w-full p-2.5 rounded-xl bg-slate-850 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 flex items-start gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-400 mt-0.5 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions: Backup & Lock */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
          <button
            onClick={handleBackup}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition-all"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>ডাটাবেস ব্যাকআপ ডাউনলোড</span>
          </button>

          {profile.pinHash ? (
            <button
              onClick={() => {
                onClose();
                lockAppNow();
              }}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-semibold flex items-center justify-center gap-2 border border-rose-500/30 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>অ্যাপ লক করুন</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenPinSetup();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition-all"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>নিরাপত্তা পিন সেট করুন</span>
            </button>
          )}

          <p className="text-[10px] text-center text-slate-500 pt-1">
            মেসার্স কোরাইশ ট্রেডার্স • সংস্করণ ২.০
          </p>
        </div>
      </div>
    </div>
  );
};
