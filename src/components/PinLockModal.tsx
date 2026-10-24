import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toBnDigits } from '../utils/formatters';

interface PinLockModalProps {
  mode: 'unlock' | 'setup';
  onClose?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ mode, onClose }) => {
  const { profile, unlockApp, setAppPinCode } = useApp();
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [remainingLockout, setRemainingLockout] = useState<number>(0);
  const [showRecovery, setShowRecovery] = useState<boolean>(false);
  const [recoveryCode, setRecoveryCode] = useState<string>('');

  // Lockout timer effect
  useEffect(() => {
    if (profile.lockoutUntil && profile.lockoutUntil > Date.now()) {
      const updateTimer = () => {
        const sec = Math.ceil((profile.lockoutUntil! - Date.now()) / 1000);
        if (sec > 0) {
          setRemainingLockout(sec);
        } else {
          setRemainingLockout(0);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingLockout(0);
    }
  }, [profile.lockoutUntil]);

  const handleKeyPress = (num: string) => {
    if (remainingLockout > 0) return;
    setErrorMsg('');

    if (mode === 'setup' && isConfirming) {
      if (confirmPin.length < 6) {
        setConfirmPin((prev) => prev + num);
      }
    } else {
      if (pin.length < 6) {
        setPin((prev) => prev + num);
      }
    }
  };

  const handleDelete = () => {
    if (remainingLockout > 0) return;
    setErrorMsg('');

    if (mode === 'setup' && isConfirming) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setPin('');
    setConfirmPin('');
    setIsConfirming(false);
    setErrorMsg('');
  };

  // Submit PIN for unlock
  const handleUnlockSubmit = async (pinToTest: string) => {
    if (!pinToTest) return;
    const res = await unlockApp(pinToTest);
    if (!res.success) {
      setErrorMsg(res.error || 'ভুল পিন দিয়েছেন!');
      setPin('');
    } else {
      handleClear();
      if (onClose) onClose();
    }
  };

  // Submit PIN for setup
  const handleSetupSubmit = async () => {
    if (pin.length < 4) {
      setErrorMsg('পিন ন্যূনতম ৪ সংখ্যার হতে হবে।');
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg('উভয় পিন মিলছে না! পুনরায় দিন।');
      setConfirmPin('');
      return;
    }

    await setAppPinCode(pin);
    handleClear();
    if (onClose) onClose();
  };

  // Auto submit when 4 or 6 digits entered
  useEffect(() => {
    if (mode === 'unlock' && (pin.length === 4 || pin.length === 6)) {
      handleUnlockSubmit(pin);
    }
  }, [pin, mode]);

  // Master recovery code (for owner safety if locked)
  const handleRecoverySubmit = () => {
    // If owner types their phone number or master default recovery "1971"
    if (recoveryCode === '1971' || recoveryCode === profile.phone) {
      unlockApp('bypass');
      if (onClose) onClose();
    } else {
      setErrorMsg('রিকভারি কোড সঠিক নয়।');
    }
  };

  const currentDisplayPin = mode === 'setup' && isConfirming ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
        {mode === 'setup' && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 mb-4">
          {mode === 'unlock' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-bold text-slate-100">
          {mode === 'unlock'
            ? 'মালিকের পিন প্রবেশ করান'
            : isConfirming
            ? 'পিন পুনরায় নিশ্চিত করুন'
            : 'নতুন নিরাপত্তা পিন সেট করুন'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          {mode === 'unlock'
            ? 'মেসার্স কোরাইশ ট্রেডার্স ডাটাবেস সুরক্ষায় সংরক্ষিত'
            : '৪ থেকে ৬ ডিজিটের গোপন পিন নম্বর নির্ধারণ করুন'}
        </p>

        {/* Lockout Warning */}
        {remainingLockout > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">অতিরিক্ত ভুল চেষ্টার কারণে অ্যাপ লক!</p>
              <p>দয়া করে {toBnDigits(remainingLockout)} সেকেন্ড অপেক্ষা করুন।</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 my-5">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                index < currentDisplayPin.length
                  ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-500/50'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad for Touchscreens */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mt-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={remainingLockout > 0}
              onClick={() => handleKeyPress(digit)}
              className="h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600/30 text-slate-100 text-lg font-bold border border-slate-700/60 active:scale-95 transition-all disabled:opacity-40"
            >
              {toBnDigits(digit)}
            </button>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:scale-95 text-slate-300 text-xs font-semibold border border-slate-700/40"
          >
            মুছুন
          </button>

          <button
            type="button"
            disabled={remainingLockout > 0}
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-600/30 text-slate-100 text-lg font-bold border border-slate-700/60 active:scale-95 transition-all disabled:opacity-40"
          >
            ০
          </button>

          {mode === 'setup' ? (
            <button
              type="button"
              onClick={handleSetupSubmit}
              className="h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/60"
            >
              {isConfirming ? 'সংরক্ষণ' : 'পরবর্তী'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUnlockSubmit(pin)}
              className="h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/60"
            >
              আনলক
            </button>
          )}
        </div>

        {/* Forgot PIN / Emergency recovery */}
        {mode === 'unlock' && (
          <div className="mt-5">
            {!showRecovery ? (
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="text-xs text-slate-400 hover:text-emerald-400 underline underline-offset-4"
              >
                পিন ভুলে গেছেন? রিকভারি কোড দিন
              </button>
            ) : (
              <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
                <p className="text-[11px] text-slate-300 mb-2">
                  মাস্টার রিকভারি কোড অথবা আপনার নিবন্ধিত ফোন নম্বর দিন:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="রিকভারি কোড (১৯৭১)"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleRecoverySubmit}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    যাচাই
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
