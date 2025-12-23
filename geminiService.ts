
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount, Category } from './types';

export const getFinancialAdvice = async (
  transactions: Transaction[], 
  accounts: BankAccount[],
  categories: Category[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key 未設定，無法獲取 AI 建議。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 整理摘要數據給 AI
    const summary = {
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
      income: transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
      expense: transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0),
      topCategories: categories.map(cat => ({
        name: cat.name,
        amount: transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0)
      })).sort((a, b) => b.amount - a.amount).slice(0, 3)
    };

    const prompt = `
      作為一名資深理財顧問，請分析以下用戶的財務數據並提供 3 點具體建議：
      總餘額: ${summary.totalBalance}
      本期總收入: ${summary.income}
      本期總支出: ${summary.expense}
      支出最高的類別: ${summary.topCategories.map(c => `${c.name}(${c.amount})`).join(', ')}
      
      請直接回傳繁體中文建議，條列清晰。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "AI 無法產出內容，請稍後再試。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "獲取 AI 建議時發生錯誤。";
  }
};
