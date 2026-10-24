/**
 * Client-side Bengali Natural Language Voice Intent Parser
 * Operates offline or in conjunction with Gemini backend
 */

import { VoiceAssistantIntent } from '../types';
import { toEnDigits, parseBanglaWordsToNumber } from './formatters';

const BRAND_KEYWORDS: { key: string; nameBn: string; regex: RegExp }[] = [
  { key: 'shah', nameBn: 'শাহ সিমেন্ট', regex: /শাহ|shah/i },
  { key: 'crown', nameBn: 'ক্রাউন সিমেন্ট', regex: /ক্রাউন|crown/i },
  { key: 'bashundhara', nameBn: 'বসুন্ধরা সিমেন্ট', regex: /বসুন্ধরা|bashundhara/i },
  { key: 'fresh', nameBn: 'ফ্রেশ সিমেন্ট', regex: /ফ্রেশ|fresh/i },
  { key: 'seven_rings', nameBn: 'সেভেন রিংস সিমেন্ট', regex: /সেভেন|seven|রিংস|rings/i },
  { key: 'premier', nameBn: 'প্রিমিয়ার সিমেন্ট', regex: /প্রিমিয়ার|premier/i },
  { key: 'akij', nameBn: 'আকিজ সিমেন্ট', regex: /আকিজ|akij/i },
  { key: 'scan', nameBn: 'স্ক্যান সিমেন্ট', regex: /স্ক্যান|scan/i },
  { key: 'confidence', nameBn: 'কনফিডেন্স সিমেন্ট', regex: /কনফিডেন্স|confidence/i },
  { key: 'holcim', nameBn: 'হোলসিম সিমেন্ট', regex: /হোলসিম|holcim/i },
];

/**
 * Extract number of bags or amount from speech transcript
 */
function extractQuantityOrAmount(transcript: string): number | null {
  // First check english/bangla digits followed by বস্তা or টাকা
  const enText = toEnDigits(transcript);

  // Match e.g. "50 বস্তা", "20 bag", "5000 টাকা"
  const bagMatch = enText.match(/(\d+)\s*(বস্তা|ব্যাগ|bag|পিস|pc)/i);
  if (bagMatch) {
    return parseInt(bagMatch[1], 10);
  }

  const takaMatch = enText.match(/(\d+)\s*(টাকা|টাকার|tk|taka)/i);
  if (takaMatch) {
    return parseInt(takaMatch[1], 10);
  }

  // Any standalone digits
  const anyDigit = enText.match(/\b\d+\b/);
  if (anyDigit) {
    return parseInt(anyDigit[0], 10);
  }

  // Word-based parsing (যেমন: পঞ্চাশ, বিশ, কুড়ি, দশ, একশ, দুই হাজার)
  return parseBanglaWordsToNumber(transcript);
}

/**
 * Detect matched brand from catalog
 */
function detectBrand(transcript: string, existingBrands: string[]): string | null {
  // Check predefined keywords
  for (const item of BRAND_KEYWORDS) {
    if (item.regex.test(transcript)) {
      return item.nameBn;
    }
  }

  // Check dynamically against existing products in store
  for (const b of existingBrands) {
    const cleanB = b.replace(/সিমেন্ট|cement/gi, '').trim();
    if (cleanB && transcript.toLowerCase().includes(cleanB.toLowerCase())) {
      return b;
    }
  }

  return null;
}

/**
 * Extract person's name (e.g. "রহিমের কাছে", "করিম থেকে")
 */
function extractPersonName(transcript: string): string | null {
  const match = transcript.match(/([^\s]+)(?:ের|র)?\s*(?:কাছে|থেকে|কে|বাবদ)/);
  if (match && match[1]) {
    const name = match[1].replace(/[.,?!]/g, '').trim();
    if (name.length > 1 && !/আজ|কাল|টাকা|সিমেন্ট|স্টক|বিকাশ|বিক্রি|ক্রয়/.test(name)) {
      return name;
    }
  }
  return null;
}

/**
 * Parse Bengali Speech transcript into structured VoiceAssistantIntent
 */
export function parseBengaliVoiceCommand(
  rawTranscript: string,
  existingBrands: string[] = []
): VoiceAssistantIntent {
  const t = rawTranscript.trim();
  const lower = t.toLowerCase();

  const brand = detectBrand(t, existingBrands);
  const qtyOrAmt = extractQuantityOrAmount(t);
  const person = extractPersonName(t);

  // 1. ADD_STOCK / PURCHASE (স্টকে যোগ / কিনলাম / মাল আসল)
  if (
    /স্টকে?\s*(যোগ|ঢুকা|আন|যুক্ত)|কিনেছি|ক্রয়|stock\s*in|মাল\s*এসেছে/i.test(t) &&
    !/কত|বলো|দেখা/i.test(t)
  ) {
    const qty = qtyOrAmt || 50;
    const detectedBrand = brand || 'শাহ সিমেন্ট';
    return {
      action: 'ADD_STOCK',
      brand: detectedBrand,
      quantity: qty,
      requiresConfirmation: true,
      confirmationMessageBn: `আপনি ${detectedBrand}-এর ${qty} বস্তা স্টকে যোগ করতে চান। নিশ্চিত করতে চান?`,
      spokenFeedbackBn: `আপনি ${detectedBrand}-এর ${qty} বস্তা স্টকে যোগ করতে চান। সংরক্ষণ করব?`,
      needsFollowUp: !brand,
      followUpQuestionBn: !brand ? 'কোন ব্যান্ডের সিমেন্ট যোগ করবেন?' : null,
    };
  }

  // 2. SELL_STOCK / SALE (বিক্রি করো / বিক্রি হয়েছে / মাল দিলাম)
  if (/বিক্রি|sell|দিলাম|খালাস|মাল\s*দাও/i.test(t) && !/কত|বলো|হিসাব/i.test(t)) {
    const qty = qtyOrAmt || 10;
    const detectedBrand = brand || 'ফ্রেশ সিমেন্ট';
    return {
      action: 'SELL_STOCK',
      brand: detectedBrand,
      quantity: qty,
      requiresConfirmation: true,
      confirmationMessageBn: `আপনি ${detectedBrand}-এর ${qty} বস্তা বিক্রি রেকর্ড করতে চান। নিশ্চিত করতে চান?`,
      spokenFeedbackBn: `আপনি ${detectedBrand}-এর ${qty} বস্তা বিক্রি করতে চান। সংরক্ষণ করব?`,
      needsFollowUp: !brand,
      followUpQuestionBn: !brand ? 'কোন ব্যান্ডের সিমেন্ট বিক্রি করবেন?' : null,
    };
  }

  // 3. CHECK_STOCK (স্টক কত আছে / ব্যালেন্স কত)
  if (/স্টক\s*কত|কত\s*(বস্তা|ব্যাগ|মাল)|স্টকের\s*খবর|মাল\s*কত/i.test(t)) {
    return {
      action: 'CHECK_STOCK',
      brand: brand || null,
      requiresConfirmation: false,
      confirmationMessageBn: brand ? `${brand}-এর স্টক তথ্য দেখা হচ্ছে।` : 'সমস্ত সিমেন্টের স্টক দেখা হচ্ছে।',
      spokenFeedbackBn: brand ? `${brand}-এর বর্তমান স্টক দেখাচ্ছি।` : 'সমস্ত পণ্যের স্টক বিবরণ দেখাচ্ছি।',
      needsFollowUp: false,
    };
  }

  // 4. CHECK_LOW_STOCK (কম স্টক / স্টক শেষ)
  if (/কম\s*স্টক|শেষ\s*হয়ে|অল্প\s*সিমেন্ট|লো\s*স্টক/i.test(t)) {
    return {
      action: 'CHECK_LOW_STOCK',
      requiresConfirmation: false,
      confirmationMessageBn: 'যেসব সিমেন্টের স্টক কমে গেছে সেগুলো দেখা হচ্ছে।',
      spokenFeedbackBn: 'যেসব সিমেন্টের স্টক শেষ পর্যায়ে, তাদের তালিকা দেখাচ্ছি।',
      needsFollowUp: false,
    };
  }

  // 5. CHECK_TODAYS_SALES (আজকের বিক্রি কত / মোট বিক্রি বলো)
  if (/আজকের\s*(মোট\s*)?বিক্রি|আজ\s*কত\s*বিক্রি|বিক্রি\s*বলো|কত\s*টাকার\s*সিমেন্ট/i.test(t)) {
    return {
      action: 'CHECK_TODAYS_SALES',
      requiresConfirmation: false,
      confirmationMessageBn: 'আজকের মোট বিক্রির হিসাব দেখানো হচ্ছে।',
      spokenFeedbackBn: 'আজকের মোট বেচাকেনার হিসাব দেখাচ্ছি।',
      needsFollowUp: false,
    };
  }

  // 6. RECORD_CUSTOMER_PAYMENT (বাকি পেলাম / টাকা দিয়েছে)
  if (/বাকি\s*(পেলাম|আদায়|দিয়েছে|জমা)/i.test(t)) {
    const amount = qtyOrAmt || 1000;
    const name = person || 'গ্রাহক';
    return {
      action: 'RECORD_CUSTOMER_PAYMENT',
      personName: name,
      totalAmount: amount,
      paymentMethod: 'CASH',
      requiresConfirmation: true,
      confirmationMessageBn: `আপনি ${name}-এর কাছ থেকে ৳${amount} বাকি জমা রেকর্ড করতে চান। সংরক্ষণ করবেন?`,
      spokenFeedbackBn: `${name}-এর কাছ থেকে ${amount} টাকা বাকি আদায় করতে চান। নিশ্চিত করবেন?`,
      needsFollowUp: !person,
      followUpQuestionBn: !person ? 'কোন কাস্টমারের বাকি জমা করবেন?' : null,
    };
  }

  // 7. CHECK_CUSTOMER_DUE (বাকি কত আছে / কার কাছে কত পাব)
  if (/বাকি\s*(কত|আছে|পাব|হিসাব)/i.test(t)) {
    return {
      action: 'CHECK_CUSTOMER_DUE',
      personName: person || null,
      requiresConfirmation: false,
      confirmationMessageBn: person ? `${person}-এর বকেয়া হিসাব দেখা হচ্ছে।` : 'সকল কাস্টমারের বকেয়া তালিকা দেখা হচ্ছে।',
      spokenFeedbackBn: person ? `${person}-এর বকেয়া টাকার পরিমাণ দেখাচ্ছি।` : 'বাকি টাকার তালিকা দেখাচ্ছি।',
      needsFollowUp: false,
    };
  }

  // 8. BKASH TRANSACTIONS (বিকাশে টাকা এসেছে / বিকাশ হিসাব)
  if (/বিকাশ|bkash/i.test(lower)) {
    if (/এসেছে|পেয়েছি|ঢুকেছে|জমা/i.test(t)) {
      const amount = qtyOrAmt || 1000;
      return {
        action: 'RECORD_BKASH',
        bkashType: 'CASH_IN',
        totalAmount: amount,
        personName: person || 'কাস্টমার',
        requiresConfirmation: true,
        confirmationMessageBn: `বিকাশে ৳${amount} প্রাপ্তি জমা করতে চান?`,
        spokenFeedbackBn: `বিকাশে ${amount} টাকা প্রাপ্তি রেকর্ড করব?`,
        needsFollowUp: false,
      };
    }

    return {
      action: 'RECORD_BKASH',
      bkashType: null,
      requiresConfirmation: false,
      confirmationMessageBn: 'বিকাশ লেনদেন খাতা দেখানো হচ্ছে।',
      spokenFeedbackBn: 'আজকের বিকাশ হিসাব খাতা দেখাচ্ছি।',
      needsFollowUp: false,
    };
  }

  // UNKNOWN / Fallback
  return {
    action: 'UNKNOWN',
    requiresConfirmation: false,
    confirmationMessageBn: `আপনার বক্তব্য: "${t}"। স্পষ্ট করতে পুনরায় বলুন বা অপশন বেছে নিন।`,
    spokenFeedbackBn: 'আমি নির্দেশটি বুঝতে পারিনি। দয়া করে আবার স্পষ্ট করে বলুন।',
    needsFollowUp: true,
    followUpQuestionBn: 'আপনি স্টক যোগ, বিক্রি, অথবা বাকি চেক করতে চান কি না বলুন।',
  };
}
