import React from 'react';
import { Shield, Lock, Cloud, Mic, Bell, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTaka, toBnDigits } from '../utils/formatters';

interface NavbarProps {
  onOpenVoice: () => void;
  onOpenPinSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVoice, onOpenPinSettings }) => {
  const { profile, isLocked, lockAppNow, lowStockCount, cloudSyncStatus } = useApp();

  const todayBn = new Intl.DateTimeFormat('bn-BD', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 px-3 py-2.5 sm:px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[2px] shadow-lg shadow-emerald-950/50 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400 font-bold text-base sm:text-lg">
              কো
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate flex items-center gap-1.5">
              <span>{profile.businessName || 'মেসার্স কোরাইশ ট্রেডার্স'}</span>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                সিমেন্ট
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
              <span>{todayBn}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <Cloud className="w-3 h-3 text-emerald-400" />
                {cloudSyncStatus === 'synced' ? 'নিরাপদ সংরক্ষিত' : 'অফলাইন'}
              </span>
            </p>
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Low stock badge if any */}
          {lowStockCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs cursor-pointer"
              title={`${lowStockCount}টি সিমেন্টের স্টক কম`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-semibold">{toBnDigits(lowStockCount)} লো</span>
            </div>
          )}

          {/* Bengali Voice Assistant Quick Trigger */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/60 active:scale-95 transition-all text-xs font-semibold cursor-pointer"
            aria-label="বাংলা ভয়েস অ্যাসিস্ট্যান্ট"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span className="hidden sm:inline">ভয়েস নির্দেশ</span>
          </button>

          {/* App Lock / Security PIN */}
          {profile.pinHash ? (
            <button
              onClick={lockAppNow}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition-all cursor-pointer"
              title="অ্যাপ লক করুন"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenPinSettings}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border border-slate-700/60 transition-all cursor-pointer"
              title="নিরাপত্তা পিন সেট করুন"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
