
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { 
  Transaction, 
  BankAccount, 
  Category, 
  TransactionType, 
  Mode 
} from './types';
import { 
  DEFAULT_CATEGORIES, 
  MOCK_ACCOUNTS, 
  MOCK_TRANSACTIONS 
} from './constants';
import { auth, isFirebaseEnabled } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFinancialAdvice } from './geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

// --- 元件定義 ---

const SidebarItem = <T,>({ icon: Icon, label, active, onClick }: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    {/* fix: use className instead of class */}
    <span className="font-medium">{label}</span>
  </button>
);

// fix: make children optional to resolve TS error where children are reported as missing despite being present in JSX
const Card = ({ children, title }: { children?: React.ReactNode, title?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    {title && <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>}
    {children}
  </div>
);

// --- 主元件 ---

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('DEMO');
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'dashboard' | 'accounts' | 'transactions' | 'reports'>('dashboard');
  
  // 數據狀態
  const [accounts, setAccounts] = useState<BankAccount[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  
  // 認證表單
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // AI 建議狀態
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 監聽 Firebase 認證狀態
  useEffect(() => {
    if (isFirebaseEnabled() && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setMode('PRODUCTION');
        } else {
          setUser(null);
          setMode('DEMO');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!isFirebaseEnabled() || !auth) {
      setAuthError('Firebase 未配置，請使用展示模式。');
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    setMode('DEMO');
    setAccounts(MOCK_ACCOUNTS);
    setTransactions(MOCK_TRANSACTIONS);
  };

  const toggleMode = () => {
    if (mode === 'DEMO') {
      alert('請先登入以使用正式模式');
    } else {
      setMode('DEMO');
    }
  };

  const generateAiAdvice = async () => {
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(transactions, accounts, categories);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  const addTransaction = (type: TransactionType) => {
    const amount = Number(prompt('請輸入金額:'));
    if (isNaN(amount) || amount <= 0) return;
    
    const note = prompt('備註:') || '';
    const categoryId = categories[0].id;
    const accountId = accounts[0].id;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      accountId,
      amount,
      type,
      categoryId,
      date: new Date().toISOString(),
      note
    };

    setTransactions([newTx, ...transactions]);
    
    // 更新餘額
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: type === TransactionType.INCOME ? acc.balance + amount : acc.balance - amount
        };
      }
      return acc;
    }));
  };

  // 數據統計
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const chartData = categories.map(cat => ({
    name: cat.name,
    value: transactions
      .filter(t => t.categoryId === cat.id && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.value > 0);

  if (!user && mode === 'PRODUCTION') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card>
          <div className="w-80 space-y-4">
            <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">WealthAI 登入</h2>
            {authError && <div className="text-red-500 text-sm mb-4">{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                <input 
                  type="email" 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">密碼</label>
                <input 
                  type="password" 
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                {isRegistering ? '註冊帳號' : '立即登入'}
              </button>
            </form>
            <div className="text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isRegistering ? '已有帳號？登入' : '還沒有帳號？註冊'}
              </button>
            </div>
            <div className="pt-4 border-t">
              <button 
                onClick={() => setMode('DEMO')}
                className="w-full text-gray-500 text-sm py-2 hover:bg-gray-50 rounded"
              >
                先試試展示模式 (不存檔)
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-600 mb-8">
            <Wallet size={32} />
            <span className="text-xl font-bold tracking-tight">WealthAI</span>
          </div>
          <nav className="space-y-2">
            <SidebarItem icon={LayoutDashboard} label="儀表板" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <SidebarItem icon={Wallet} label="銀行帳戶" active={view === 'accounts'} onClick={() => setView('accounts')} />
            <SidebarItem icon={ArrowUpRight} label="收支明細" active={view === 'transactions'} onClick={() => setView('transactions')} />
            <SidebarItem icon={PieChart} label="分析報告" active={view === 'reports'} onClick={() => setView('reports')} />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.email?.[0].toUpperCase() || 'D'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email || '展示模式帳號'}</p>
              <p className="text-xs text-gray-500 uppercase">{mode} MODE</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            <span>登出系統</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {view === 'dashboard' && '數據總覽'}
            {view === 'accounts' && '銀行帳戶管理'}
            {view === 'transactions' && '交易紀錄'}
            {view === 'reports' && 'AI 財務分析'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              mode === 'PRODUCTION' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {mode} MODE
            </div>
            <button 
              onClick={() => addTransaction(TransactionType.EXPENSE)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} />
              <span>記一筆</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {view === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="總資產 (TWD)">
                  <p className="text-3xl font-bold text-gray-900">${totalBalance.toLocaleString()}</p>
                  <p className="text-sm text-green-500 flex items-center mt-2">
                    <ArrowUpRight size={14} className="mr-1" /> 健康水位
                  </p>
                </Card>
                <Card title="本月支出">
                  <p className="text-3xl font-bold text-red-500">${monthlyExpense.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">共 {transactions.length} 筆交易</p>
                </Card>
                <Card title="AI 狀態">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <BrainCircuit size={24} />
                    <span className="font-medium">Gemini 3 Pro 已就緒</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">隨時為您分析財務狀況</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="支出比例圖">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="最近交易紀錄">
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map(tx => {
                      const cat = categories.find(c => c.id === tx.categoryId);
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{cat?.icon || '❓'}</div>
                            <div>
                              <p className="font-medium text-gray-800">{tx.note || cat?.name}</p>
                              <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className={`font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          )}

          {view === 'accounts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div key={acc.id} className="p-6 rounded-2xl text-white shadow-lg" style={{ backgroundColor: acc.color }}>
                  <div className="flex justify-between items-start mb-8">
                    <Wallet size={24} />
                    <button className="opacity-70 hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                  <h4 className="text-lg font-medium opacity-90">{acc.name}</h4>
                  <p className="text-3xl font-bold mt-2">${acc.balance.toLocaleString()}</p>
                  <p className="text-xs mt-4 opacity-70">**** **** **** {acc.id.slice(-4)}</p>
                </div>
              ))}
              <button 
                onClick={() => alert('此功能在展示模式下受限')}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <Plus size={32} />
                <span className="mt-2 font-medium">新增銀行帳戶</span>
              </button>
            </div>
          )}

          {view === 'transactions' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500 text-sm">
                      <th className="pb-4 font-medium">日期</th>
                      <th className="pb-4 font-medium">類別</th>
                      <th className="pb-4 font-medium">備註</th>
                      <th className="pb-4 font-medium">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map(tx => {
                      const cat = categories.find(c => c.id === tx.categoryId);
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-4">
                            <span className="flex items-center space-x-2">
                              <span>{cat?.icon}</span>
                              <span className="text-sm font-medium">{cat?.name}</span>
                            </span>
                          </td>
                          <td className="py-4 text-sm font-medium">{tx.note}</td>
                          <td className={`py-4 font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {view === 'reports' && (
            <div className="space-y-8">
              <Card title="智慧分析顧問">
                <div className="flex flex-col space-y-4">
                  <p className="text-gray-600 text-sm">點擊下方按鈕，讓 Gemini AI 根據您的收支趨勢提供專業理財建議。</p>
                  <button 
                    onClick={generateAiAdvice}
                    disabled={isAiLoading}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <BrainCircuit size={20} />
                        <span>獲取 AI 財務建議</span>
                      </>
                    )}
                  </button>
                  
                  {aiAdvice && (
                    <div className="mt-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-900 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {aiAdvice}
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="收支趨勢分析">
                   <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                   </div>
                </Card>
                <Card title="理財健檢報告">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">儲蓄率</span>
                      <span className="font-bold text-green-600">65%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">投資占比</span>
                      <span className="font-bold text-blue-600">20%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
