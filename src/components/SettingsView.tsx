import React, { useState } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  Store,
  Phone,
  MapPin,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsViewProps {
  onOpenPinSetup: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenPinSetup }) => {
  const { profile, updateProfile, removeAppPin, resetToDefaults, clearAllData } = useApp();

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [tagline, setTagline] = useState(profile.tagline);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      businessName,
      ownerName,
      phone,
      address,
      tagline,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm('সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত টেস্ট ডাটা রিসেট করে প্রাথমিক অবস্থায় ফিরে যেতে চান?')) {
      resetToDefaults();
      alert('ডাটাবেস সফলভাবে রিসেট করা হয়েছে!');
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-3 sm:px-4 pt-3 text-xs sm:text-sm">
      {/* Title */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>অ্যাপ সেটিংস ও ব্যবসা প্রোফাইল</span>
        </h1>
        <p className="text-xs text-slate-400">ব্যবসায়িক তথ্য, নিরাপত্তা পিন এবং ক্লাউড সংযোগ</p>
      </div>

      {/* Business Information Form */}
      <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Store className="w-4 h-4 text-emerald-400" />
          <span>দোকানের বিবরণ (মেমোতে প্রদর্শিত হবে)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 block mb-1">প্রতিষ্ঠানের নাম:</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">স্বত্বাধিকারী / মালিকের নাম:</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 block mb-1">দোকানের মোবাইল নম্বর:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">ট্যাগলাইন / স্লোগান:</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="যেমন: গুণগতমানের সকল ব্রান্ডের সিমেন্ট পাইকারি ও খুচরা বিক্রেতা"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">দোকান / গোডাউনের ঠিকানা:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              তথ্য সফলভাবে সংরক্ষণ হয়েছে!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* Security PIN Section */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>অ্যাপ লক ও নিরাপত্তা পিন (PIN Protection)</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-200">
              বর্তমান অবস্থা:{' '}
              {profile.pinHash ? (
                <span className="text-emerald-400 font-bold">সুরক্ষিত (পিন সক্রিয়)</span>
              ) : (
                <span className="text-amber-400 font-bold">পিন সেট করা নেই</span>
              )}
            </p>
            <p className="text-slate-400 mt-0.5">
              অননুমোদিত প্রবেশ রোধ করতে ৪-৬ ডিজিটের পিন ব্যবহার করুন। পরপর ৫ বার ভুল পিনে ৫ মিনিট লক থাকবে।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPinSetup}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{profile.pinHash ? 'পিন পরিবর্তন' : 'পিন সেট করুন'}</span>
            </button>

            {profile.pinHash && (
              <button
                onClick={() => {
                  if (confirm('আপনি কি অ্যাপ পিন নিষ্ক্রিয় করতে চান?')) {
                    removeAppPin();
                  }
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl font-semibold border border-slate-700"
              >
                পিন মুছুন
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Firebase Cloud Sync Guide for Bangladeshi Trader */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Cloud className="w-4 h-4 text-teal-400" />
          <span>ফায়ারবেস ক্লাউড সিনক্রোনাইজেশন গাইড (Firebase Cloud Setup)</span>
        </h2>

        <div className="space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-teal-300">
            অফলাইনে ব্যবহারযোগ্য এবং ক্লাউড সংযুক্তির সহজ নিয়মাবলী:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>
              <strong>অফলাইন স্বয়ংসম্পূর্ণতা:</strong> ইন্টারনেট বা মোবাইল নেটওয়ার্ক না থাকলেও সমস্ত ইনভেন্টরি, বিক্রি ও বিকাশ এন্ট্রি লোকাল ডিভাইসে নির্ভুলভাবে সংরক্ষিত থাকবে।
            </li>
            <li>
              <strong>ক্লাউড ব্যাকআপ সংযোগ:</strong> আপনার ফায়ারবেস কনসোল (<code className="text-teal-300">console.firebase.google.com</code>) থেকে বিনামূল্যে একটি প্রজেক্ট তৈরি করে Authentication এ Phone Provider চালু করুন।
            </li>
            <li>
              প্রকল্পের <code className="text-teal-300">firestore.rules</code> এবং <code className="text-teal-300">firebase-blueprint.json</code> ইতিমধ্যেই এই অ্যাপ্লিকেশনে সর্বোচ্চ নিরাপত্তায় প্রস্তুত করা আছে।
            </li>
          </ul>
        </div>
      </div>

      {/* Danger Zone: Reset Database & Clear All to 00 */}
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
        <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>ডাটাবেস শূন্যকরণ ও রিসেট (Danger Zone)</span>
        </h2>
        <p className="text-xs text-slate-300">
          আপনার সমস্ত বিকাশ, সিমেন্ট স্টক, বিক্রয় এবং গ্রাহকের বাকি হিসাব মুছে সম্পূর্ণ ০০ (Zero) করতে নিচের বাটনে চাপ দিন।
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={clearAllData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>সব হিসাব ০০ (Zero) করুন</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold border border-slate-700"
          >
            ডিফল্ট ক্যাটালগ রিস্টোর
          </button>
        </div>
      </div>
    </div>
  );
};
