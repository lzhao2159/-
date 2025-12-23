
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type Mode = 'DEMO' | 'PRODUCTION';
