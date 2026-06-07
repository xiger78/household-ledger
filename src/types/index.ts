export type TransactionType = '지출' | '수입';

export type PaymentMethod = '현금' | '카드' | '페이페이' | '라쿠텐페이' | '계좌이체';

export type DayType = '勤' | '休';

export type Language = 'ko' | 'ja' | 'en';

export interface Transaction {
  id: string;
  year: number;
  month: number;
  day: number;
  dateSerial: number;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  description: string;
  memo: string;
  receiptUri?: string;
}

export interface DailySummary {
  year: number;
  month: number;
  day: number;
  dateSerial: number;
  weekday: string;
  dayType: DayType;
  expectedExpense: number;
  actualExpense: number;
  actualIncome: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  workDays: number;
  restDays: number;
}

export interface SavingsPlan {
  salary: number;
  bonus: number;
  balance: number;
  fixedCost: number;
  rent: number;
}

export interface AppSettings {
  year: number;
  weekdayExpense: number;
  holidayExpense: number;
  savingsPlan: SavingsPlan;
  language: Language;
}

export interface Holiday {
  year: number;
  month: number;
  day: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  '현금',
  '카드',
  '페이페이',
  '라쿠텐페이',
  '계좌이체',
];

export const TRANSACTION_TYPES: TransactionType[] = ['지출', '수입'];

export const WEEKDAYS_KO = ['日', '月', '火', '水', '木', '金', '土'];

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 1, day: 2 },
  { year: 2026, month: 1, day: 3 },
  { year: 2026, month: 1, day: 12 },
  { year: 2026, month: 2, day: 11 },
  { year: 2026, month: 2, day: 23 },
  { year: 2026, month: 3, day: 20 },
  { year: 2026, month: 4, day: 29 },
  { year: 2026, month: 5, day: 3 },
  { year: 2026, month: 5, day: 4 },
  { year: 2026, month: 5, day: 5 },
  { year: 2026, month: 5, day: 6 },
  { year: 2026, month: 7, day: 20 },
  { year: 2026, month: 8, day: 11 },
  { year: 2026, month: 9, day: 21 },
  { year: 2026, month: 9, day: 22 },
  { year: 2026, month: 9, day: 23 },
  { year: 2026, month: 10, day: 12 },
  { year: 2026, month: 11, day: 3 },
  { year: 2026, month: 11, day: 23 },
  { year: 2026, month: 12, day: 28 },
  { year: 2026, month: 12, day: 29 },
  { year: 2026, month: 12, day: 30 },
  { year: 2026, month: 12, day: 31 },
];
