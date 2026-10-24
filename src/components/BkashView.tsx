import { useState, useEffect } from "react";

type TxnType = "customer_payment" | "money_received" | "mahajan_payment" | "money_sent";
type Transaction = {
  id: string;
  type: TxnType;
  amount: number;
  note: string;
  date: string;
};

export default function BkashLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnType, setTxnType] = useState<TxnType>("mahajan_payment");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bkash_transactions");
    if (saved) {
      try { setTransactions(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("bkash_transactions", JSON.stringify(transactions));
  }, [transactions]);

  const balance = transactions.reduce((total, t) => {
    if (t.type === "customer_payment" || t.type === "money_received") {
      return total + t.amount;
    } else {
      return total - t.amount;
    }
  }, 0);

  const handleAdd = () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      alert("সঠিক টাকার পরিমাণ লিখুন");
      return;
    }
    const newTxn: Transaction = {
      id: Date.now().toString(),
      type: txnType,
      amount: numAmount,
      note: note,
      date: new Date().toLocaleString("bn-BD"),
    };
    setTransactions([newTxn, ...transactions]);
    setAmount("");
    setNote("");
  };

  const handleDelete = (id: string) => {
    if (confirm("এই লেনদেন ডিলিট করলে ব্যালেন্স আবার হিসাব হবে, আপনি কি নিশ্চিত?")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const getTypeLabel = (type: TxnType) => {
    if (type === "customer_payment") return "কাস্টমার পেমেন্ট (+)";
    if (type === "money_received") return "টাকা প্রাপ্তি (+)";
    if (type === "mahajan_payment") return "মহাজন পরিশোধ (-)";
    return "টাকা পাঠানো (-)";
  };

  return (
    <div className="p-4 bg-[#121212] min-h-screen text-white">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-[24px] p-5 mb-5 border border-pink-900/20">
        <p className="text-gray-400 text-sm">বর্তমান ব্যালেন্স</p>
        <h1 className="text-3xl font-bold mt-1">৳ {balance.toLocaleString("bn-BD")}</h1>
        <p className="text-xs text-gray-500 mt-2">{transactions.length} টি লেনদেন</p>
      </div>

      {/* New Entry Form - তোমার স্ক্রিনশটের মত */}
      <div className="bg-[#1E1E1E] rounded-[24px] p-5 border border-gray-800">
        <h2 className="font-bold flex items-center gap-2">
          <span>📱</span> নতুন বিকাশ লেনদেন রেকর্ড
        </h2>
        <p className="text-xs text-gray-500 mb-4 mt-1">ব্যবসায়িক বিকাশ এন্ট্রি সংরক্ষণ করুন</p>

        <p className="text-sm text-gray-400 mb-2">লেনদেনের ধরন:</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button onClick={()=>setTxnType("customer_payment")} className={`py-3
