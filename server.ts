import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI client if GEMINI_API_KEY is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'মেসার্স কোরাইশ ট্রেডার্স',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!ai,
  });
});

// Bengali Voice Assistant endpoint
app.post('/api/voice-assistant', async (req, res) => {
  try {
    const { query, catalogSummary } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'ভয়েস টেক্সট প্রদান করা হয়নি।' });
    }

    if (!ai) {
      // Return structured signal so client-side fallback rule parser handles it seamlessly
      return res.json({
        success: false,
        fallbackToLocal: true,
        message: 'লোকাল বাংলা প্রসেসর ব্যবহার করা হচ্ছে।',
      });
    }

    const systemInstruction = `
You are the Bengali Voice Parsing Engine for "Messrs Koraish Traders" (মেসার্স কোরাইশ ট্রেডার্স), a premier cement inventory and business ledger app in Bangladesh.
The owner speaks in natural Bengali or uses common Bangladeshi trade phrases (e.g. "শাহ সিমেন্টের ৫০ বস্তা স্টকে যোগ করো", "ক্রাউন সিমেন্টের স্টক কত আছে?", "রহিমের কাছে কত বাকি", "আজকে বিকাশে ৫০০০ টাকা পেয়েছি", "ফ্রেশ সিমেন্টের ২০ বস্তা বিক্রি করো").

Recognized Cement Brands in market: Shah Cement (শাহ সিমেন্ট), Bashundhara (বসুন্ধরা), Crown (ক্রাউন), Fresh (ফ্রেশ), Seven Rings (সেভেন রিংস), Premier (প্রিমিয়ার), Akij (আকিজ), Scan (স্ক্যান), Confidence (কনফিডেন্স), Holcim (হোলসিম), etc.
Current Catalog Context: ${catalogSummary ? JSON.stringify(catalogSummary) : 'Default brands available'}.

Return a STRICT JSON response ONLY (no markdown code blocks, just raw JSON) matching this schema:
{
  "action": "CHECK_STOCK" | "ADD_STOCK" | "SELL_STOCK" | "CHECK_CUSTOMER_DUE" | "RECORD_CUSTOMER_PAYMENT" | "RECORD_BKASH" | "CHECK_TODAYS_SALES" | "CHECK_LOW_STOCK" | "UNKNOWN",
  "brand": string | null,
  "quantity": number | null,
  "pricePerBag": number | null,
  "totalAmount": number | null,
  "personName": string | null,
  "bkashType": "CASH_IN" | "CASH_OUT" | "PAYMENT" | "SEND_MONEY" | null,
  "paymentMethod": "CASH" | "BKASH" | "CREDIT" | "BANK" | null,
  "requiresConfirmation": boolean,
  "confirmationMessageBn": string,
  "spokenFeedbackBn": string,
  "needsFollowUp": boolean,
  "followUpQuestionBn": string | null
}

Rules:
1. "CHECK_STOCK", "CHECK_CUSTOMER_DUE", "CHECK_TODAYS_SALES", "CHECK_LOW_STOCK" do NOT modify state, so "requiresConfirmation" is false.
2. Any financial/inventory mutation ("ADD_STOCK", "SELL_STOCK", "RECORD_CUSTOMER_PAYMENT", "RECORD_BKASH") MUST have "requiresConfirmation": true, and a clear, respectful Bangla confirmationMessageBn (e.g. "আপনি শাহ সিমেন্টের ৫০ বস্তা স্টকে যোগ করতে চান। নিশ্চিত করতে চান?").
3. Convert all Bengali digits (১, ২, ৩...) or text numerals (পঞ্চাশ, কুড়ি, একশত) to standard numbers in the JSON output.
4. If missing crucial info (e.g. selling without quantity or brand), set "needsFollowUp": true and specify "followUpQuestionBn" in polite Bangla.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User voice query in Bengali: "${query}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      // If parsing fails, trigger client local fallback
      return res.json({
        success: false,
        fallbackToLocal: true,
      });
    }

    return res.json({
      success: true,
      intent: parsedData,
    });
  } catch (error) {
    console.error('Voice Assistant Error:', error);
    return res.json({
      success: false,
      fallbackToLocal: true,
      error: error instanceof Error ? error.message : 'ত্রুটি ঘটেছে',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`মেসার্স কোরাইশ ট্রেডার্স সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
  });
}

startServer();
