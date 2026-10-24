import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle, X, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseBengaliVoiceCommand } from '../utils/voiceParser';
import { VoiceAssistantIntent } from '../types';
import { formatTaka, toBnDigits } from '../utils/formatters';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const {
    products,
    customers,
    addStockAdjustment,
    recordSale,
    recordCustomerPayment,
    recordBkashEntry,
    totalStockBags,
    todaySalesAmount,
    currentBkashBalance,
  } = useApp();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedIntent, setDetectedIntent] = useState<VoiceAssistantIntent | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('মাইক্রোফোন চেপে বাংলায় কথা বলুন...');
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [audioSupported, setAudioSupported] = useState<boolean>(true);

  // Recognition ref
  const recognitionRef = useRef<any>(null);

  // Bengali Text-to-Speech function
  const speakBengali = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 0.95;

      // Try finding a Bengali voice if browser installed
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.includes('bn') || v.name.includes('Bangla') || v.name.includes('Bengali'));
      if (bnVoice) {
        utterance.voice = bnVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS not supported or failed:', e);
    }
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAudioSupported(false);
      setStatusMessage('আপনার ব্রাউজার সরাসরি স্পিচ-টু-টেক্সট সমর্থন করে না। নিচে লিখে নির্দেশ দিন।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Bangladesh Bengali

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage('শুনছি... বাংলায় বলুন (যেমন: "শাহ সিমেন্টের ৫০ বস্তা স্টকে যোগ করো")');
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setStatusMessage('শব্দ স্পষ্ট বোঝা যায়নি। আবার চেষ্টা করুন বা নিচে লিখুন।');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setExecutionResult(null);
    setDetectedIntent(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started or restarting
        recognitionRef.current.stop();
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Process voice transcript either with backend Gemini API or robust local rule parser
  const processCommand = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    setStatusMessage('বিশ্লেষণ করা হচ্ছে...');

    const brandNames = products.map((p) => p.brandName);

    try {
      // 1. Try Gemini Backend Route first
      const res = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToProcess,
          catalogSummary: products.map((p) => ({ brand: p.brandName, stock: p.currentStock })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.intent) {
          handleParsedIntent(json.intent);
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend voice assistant error, falling back to local engine:', err);
    }

    // 2. Fallback to Local Bengali NLP Parser
    const localIntent = parseBengaliVoiceCommand(textToProcess, brandNames);
    handleParsedIntent(localIntent);
    setIsProcessing(false);
  };

  // Handle Intent execution or confirmation
  const handleParsedIntent = (intent: VoiceAssistantIntent) => {
    setDetectedIntent(intent);

    // Speak voice feedback in Bengali
    if (intent.spokenFeedbackBn) {
      speakBengali(intent.spokenFeedbackBn);
    }

    // If query is read-only, execute instantly!
    if (!intent.requiresConfirmation) {
      executeReadOnlyAction(intent);
    } else {
      setStatusMessage('অনুগ্রহ করে নিশ্চিত করুন: নিচের কাজটি সম্পন্ন করবেন কি?');
    }
  };

  // Execute read-only queries immediately
  const executeReadOnlyAction = (intent: VoiceAssistantIntent) => {
    switch (intent.action) {
      case 'CHECK_STOCK': {
        if (intent.brand) {
          const matched = products.find((p) =>
            p.brandName.toLowerCase().includes(intent.brand!.toLowerCase().replace('সিমেন্ট', '').trim())
          );
          if (matched) {
            const msg = `${matched.brandName}-এর স্টকে বর্তমানে ${toBnDigits(matched.currentStock)} বস্তা রয়েছে।`;
            setExecutionResult(msg);
            speakBengali(msg);
          } else {
            setExecutionResult(`স্টকে ${toBnDigits(totalStockBags)} বস্তা সিমেন্ট রয়েছে।`);
          }
        } else {
          setExecutionResult(`দোকানের গোডাউনে মোট ${toBnDigits(totalStockBags)} বস্তা সিমেন্ট রয়েছে।`);
        }
        break;
      }
      case 'CHECK_LOW_STOCK': {
        const lowProds = products.filter((p) => p.currentStock <= p.minStockAlert);
        if (lowProds.length > 0) {
          const names = lowProds.map((p) => `${p.brandName} (${toBnDigits(p.currentStock)} বস্তা)`).join(', ');
          const msg = `কম স্টক রয়েছে: ${names}`;
          setExecutionResult(msg);
          speakBengali(`${lowProds.length}টি ব্রান্ডের স্টক সতর্কতা সীমায় আছে।`);
        } else {
          const msg = 'আলহামদুলিল্লাহ, সকল ব্রান্ডের সিমেন্টের পর্যাপ্ত স্টক রয়েছে!';
          setExecutionResult(msg);
          speakBengali(msg);
        }
        break;
      }
      case 'CHECK_TODAYS_SALES': {
        const msg = `আজকের মোট বিক্রি হয়েছে ${formatTaka(todaySalesAmount)}।`;
        setExecutionResult(msg);
        speakBengali(msg);
        break;
      }
      case 'CHECK_CUSTOMER_DUE': {
        if (intent.personName) {
          const cust = customers.find((c) => c.name.includes(intent.personName!));
          if (cust) {
            const msg = `${cust.name}-এর কাছে বাকি আছে ${formatTaka(cust.totalDue)}।`;
            setExecutionResult(msg);
            speakBengali(msg);
          } else {
            setExecutionResult(`${intent.personName} নামে কোনো কাস্টমার পাওয়া যায়নি।`);
          }
        } else {
          const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
          const msg = `সব কাস্টমারের মোট বাকি ${formatTaka(totalDue)}।`;
          setExecutionResult(msg);
          speakBengali(msg);
        }
        break;
      }
      case 'RECORD_BKASH': {
        const msg = `বর্তমানে আপনার রেকর্ডকৃত বিকাশ ব্যালেন্স ${formatTaka(currentBkashBalance)}।`;
        setExecutionResult(msg);
        speakBengali(msg);
        break;
      }
      default:
        setExecutionResult('নির্দেশটি প্রস্তুত। নিচে বিস্তারিত দেখুন।');
    }
  };

  // Execute Confirmed Mutation
  const confirmAndExecute = () => {
    if (!detectedIntent) return;

    const { action, brand, quantity, totalAmount, personName } = detectedIntent;

    if (action === 'ADD_STOCK') {
      const targetBrand = brand || 'শাহ সিমেন্ট';
      let prod = products.find((p) =>
        p.brandName.toLowerCase().includes(targetBrand.toLowerCase().replace('সিমেন্ট', '').trim())
      );
      if (!prod) prod = products[0];

      const qty = quantity || 50;
      addStockAdjustment({
        productId: prod.id,
        quantity: qty,
        type: 'OPENING',
        pricePerBag: prod.avgPurchasePrice,
        notes: 'ভয়েস নির্দেশে স্টকে যোগ করা হয়েছে',
      });

      const res = `সফল হয়েছে! ${prod.brandName}-এ ${toBnDigits(qty)} বস্তা যুক্ত হয়েছে। বর্তমান স্টক: ${toBnDigits(prod.currentStock + qty)} বস্তা।`;
      setExecutionResult(res);
      speakBengali('স্টকে সফলভাবে যোগ করা হয়েছে।');
      setDetectedIntent(null);
    } else if (action === 'SELL_STOCK') {
      const targetBrand = brand || 'ফ্রেশ সিমেন্ট';
      let prod = products.find((p) =>
        p.brandName.toLowerCase().includes(targetBrand.toLowerCase().replace('সিমেন্ট', '').trim())
      );
      if (!prod) prod = products[0];

      const qty = quantity || 10;
      const resSale = recordSale({
        customerName: 'খুচরা গ্রাহক (ভয়েস)',
        items: [{ productId: prod.id, quantity: qty, unitPrice: prod.defaultSalePrice }],
        discountAmount: 0,
        paidAmount: qty * prod.defaultSalePrice,
        paymentMethod: 'CASH',
        notes: 'ভয়েস নির্দেশে নগদ বিক্রি',
      });

      if (resSale.success) {
        const res = `বিক্রি সম্পন্ন! চালান #${resSale.sale?.invoiceNumber}, মোট ${formatTaka(qty * prod.defaultSalePrice)}।`;
        setExecutionResult(res);
        speakBengali('বিক্রয় সফলভাবে সম্পন্ন হয়েছে।');
        setDetectedIntent(null);
      } else {
        setExecutionResult(`ত্রুটি: ${resSale.error}`);
        speakBengali('বিক্রয় সম্পন্ন করা যায়নি। পর্যাপ্ত স্টক নেই।');
      }
    } else if (action === 'RECORD_CUSTOMER_PAYMENT') {
      const amt = totalAmount || 1000;
      const cust = customers.find((c) => c.name.includes(personName || '')) || customers[0];
      recordCustomerPayment(cust.id, amt, 'CASH', 'ভয়েস নির্দেশে জমা');

      const res = `${cust.name}-এর হিসাবে ৳${amt} জমা হয়েছে। অবশিষ্ট বাকি: ${formatTaka(Math.max(0, cust.totalDue - amt))}।`;
      setExecutionResult(res);
      speakBengali('বকেয়া টাকা জমা করা হয়েছে।');
      setDetectedIntent(null);
    } else if (action === 'RECORD_BKASH') {
      const amt = totalAmount || 1000;
      recordBkashEntry({
        trxId: 'BKA' + Math.floor(100000 + Math.random() * 900000),
        type: 'MONEY_RECEIVED',
        amount: amt,
        counterpartyName: personName || 'গ্রাহক',
        counterpartyPhone: '',
        notes: 'ভয়েস নির্দেশে বিকাশ জমা',
      });

      const res = `বিকাশে ৳${amt} সফলভাবে জমা করা হয়েছে।`;
      setExecutionResult(res);
      speakBengali('বিকাশ টাকা রেকর্ড করা হয়েছে।');
      setDetectedIntent(null);
    }
  };

  // Quick preset voice examples
  const examplePrompts = [
    'শাহ সিমেন্টের ৫০ বস্তা স্টকে যোগ করো',
    'ফ্রেশ সিমেন্টের ২০ বস্তা বিক্রি করো',
    'ক্রাউন সিমেন্টের স্টক কত আছে?',
    'আজ কত টাকার সিমেন্ট বিক্রি হয়েছে?',
    'রহিমের কাছে কত বাকি আছে?',
    'কম স্টক আছে এমন সিমেন্ট দেখাও',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">বাংলা ভয়েস অ্যাসিস্ট্যান্ট</h2>
            <p className="text-xs text-slate-400">মেসার্স কোরাইশ ট্রেডার্স স্বয়ংক্রিয় সহকারী</p>
          </div>
        </div>

        {/* Main Microphone Action Area */}
        <div className="my-6 text-center">
          <div className="relative inline-flex items-center justify-center">
            {isListening && (
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/50 scale-105'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-950/60'
              }`}
            >
              {isListening ? (
                <MicOff className="w-9 h-9 animate-pulse text-white" />
              ) : (
                <Mic className="w-9 h-9 text-amber-300" />
              )}
            </button>
          </div>

          <p className="mt-4 text-xs sm:text-sm font-medium text-emerald-300 min-h-[20px]">
            {isListening ? 'শুনছি... আপনার নির্দেশ বলুন' : statusMessage}
          </p>
        </div>

        {/* Editable Transcript Input */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            কথিত বা লিখিত বাংলা বক্তব্য:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="মুখে বলুন অথবা বাংলায় লিখুন..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => processCommand(transcript)}
              disabled={!transcript.trim() || isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
            >
              {isProcessing ? 'যাচাই হচ্ছে...' : 'বিশ্লেষণ'}
            </button>
          </div>
        </div>

        {/* Confirmation Card for State Mutations */}
        {detectedIntent && detectedIntent.requiresConfirmation && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-slate-800 border border-amber-500/30 text-left">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-amber-300">নিশ্চিতকরণ আবশ্যক</h3>
            </div>
            <p className="text-sm text-slate-200 mb-3">{detectedIntent.confirmationMessageBn}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDetectedIntent(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                বাতিল
              </button>
              <button
                onClick={confirmAndExecute}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow-md shadow-emerald-950/60"
              >
                হ্যাঁ, নিশ্চিত করুন
              </button>
            </div>
          </div>
        )}

        {/* Execution Result Box */}
        {executionResult && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-300 mb-0.5">ফলাফল:</p>
              <p>{executionResult}</p>
            </div>
            <button
              onClick={() => speakBengali(executionResult)}
              className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200"
              title="পুনরায় শুনুন"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Example Presets to Tap and Try */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ক্লিক করে দ্রুত কমান্ড পরীক্ষা করুন:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(prompt);
                  processCommand(prompt);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 border border-slate-700/60 text-slate-300 transition-all text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
