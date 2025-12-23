
import { Category, BankAccount, Transaction, TransactionType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat1', name: '飲食', icon: '🍴', color: '#EF4444' },
  { id: 'cat2', name: '交通', icon: '🚗', color: '#3B82F6' },
  { id: 'cat3', name: '薪資', icon: '💰', color: '#10B981' },
  { id: 'cat4', name: '娛樂', icon: '🎮', color: '#F59E0B' },
  { id: 'cat5', name: '購物', icon: '🛍️', color: '#8B5CF6' },
  { id: 'cat6', name: '其他', icon: '📦', color: '#6B7280' },
];

export const MOCK_ACCOUNTS: BankAccount[] = [
  { id: 'acc1', name: '主要帳戶', balance: 50000, currency: 'TWD', color: '#3B82F6' },
  { id: 'acc2', name: '數位錢包', balance: 12500, currency: 'TWD', color: '#10B981' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', accountId: 'acc1', amount: 150, type: TransactionType.EXPENSE, categoryId: 'cat1', date: new Date().toISOString(), note: '午餐' },
  { id: 't2', accountId: 'acc1', amount: 2000, type: TransactionType.EXPENSE, categoryId: 'cat5', date: new Date().toISOString(), note: '買衣服' },
  { id: 't3', accountId: 'acc2', amount: 35000, type: TransactionType.INCOME, categoryId: 'cat3', date: new Date().toISOString(), note: '月薪' },
];
