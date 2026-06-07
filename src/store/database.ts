import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  DailySummary,
  DEFAULT_HOLIDAYS_2026,
  Holiday,
  MonthSummary,
  SavingsPlan,
  Transaction,
} from '../types';
import {
  generateId,
  getDayType,
  getDaysInMonth,
  getWeekday,
  toDateSerial,
} from '../utils/date';

const STORAGE_KEY = 'household-ledger-data';

interface AppData {
  transactions: Transaction[];
  holidays: Holiday[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  year: 2026,
  weekdayExpense: 1000,
  holidayExpense: 5000,
  savingsPlan: {
    salary: 0,
    bonus: 0,
    balance: 0,
    fixedCost: 0,
    rent: 0,
  },
  language: 'ko',
};

const DEFAULT_DATA: AppData = {
  transactions: [],
  holidays: DEFAULT_HOLIDAYS_2026,
  settings: DEFAULT_SETTINGS,
};

let cache: AppData = { ...DEFAULT_DATA };
let initialized = false;

async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AppData;
      return {
        ...data,
        settings: {
          ...DEFAULT_SETTINGS,
          ...data.settings,
          savingsPlan: {
            ...DEFAULT_SETTINGS.savingsPlan,
            ...data.settings?.savingsPlan,
          },
        },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_DATA, holidays: [...DEFAULT_HOLIDAYS_2026] };
}

async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function initDatabase(): Promise<AppData> {
  if (!initialized) {
    cache = await loadData();
    initialized = true;
  }
  return cache;
}

export function getData(): AppData {
  return cache;
}

export function getTransactions(): Transaction[] {
  return cache.transactions;
}

export function getTransactionsByMonth(year: number, month: number): Transaction[] {
  return cache.transactions
    .filter((t) => t.year === year && t.month === month)
    .sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}

export function getTransactionsByDay(year: number, month: number, day: number): Transaction[] {
  return cache.transactions.filter(
    (t) => t.year === year && t.month === month && t.day === day
  );
}

export async function addTransaction(
  input: Omit<Transaction, 'id' | 'dateSerial'>
): Promise<Transaction> {
  const transaction: Transaction = {
    ...input,
    id: generateId(),
    dateSerial: toDateSerial(input.year, input.month, input.day),
  };
  cache.transactions.push(transaction);
  await saveData(cache);
  return transaction;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const index = cache.transactions.findIndex((t) => t.id === id);
  if (index === -1) return;

  const updated = { ...cache.transactions[index], ...updates };
  if (updates.year || updates.month || updates.day) {
    updated.dateSerial = toDateSerial(updated.year, updated.month, updated.day);
  }
  cache.transactions[index] = updated;
  await saveData(cache);
}

export async function deleteTransaction(id: string): Promise<void> {
  cache.transactions = cache.transactions.filter((t) => t.id !== id);
  await saveData(cache);
}

export function getSettings(): AppSettings {
  return cache.settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  cache.settings = { ...cache.settings, ...updates };
  await saveData(cache);
}

export async function updateSavingsPlan(updates: Partial<SavingsPlan>): Promise<void> {
  cache.settings.savingsPlan = { ...cache.settings.savingsPlan, ...updates };
  await saveData(cache);
}

export function getHolidays(): Holiday[] {
  return cache.holidays;
}

export function getMonthSummary(year: number, month: number): MonthSummary {
  const transactions = getTransactionsByMonth(year, month);
  const totalExpense = transactions
    .filter((t) => t.type === '지출')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === '수입')
    .reduce((sum, t) => sum + t.amount, 0);

  let workDays = 0;
  let restDays = 0;
  const daysInMonth = getDaysInMonth(year, month);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayType = getDayType(year, month, d, cache.holidays);
    if (dayType === '勤') workDays++;
    else restDays++;
  }

  return {
    year,
    month,
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    workDays,
    restDays,
  };
}

export function getDailySummaries(year: number, month: number): DailySummary[] {
  const daysInMonth = getDaysInMonth(year, month);
  const settings = cache.settings;
  const summaries: DailySummary[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayType = getDayType(year, month, day, cache.holidays);
    const dayTransactions = getTransactionsByDay(year, month, day);
    const actualExpense = dayTransactions
      .filter((t) => t.type === '지출')
      .reduce((sum, t) => sum + t.amount, 0);
    const actualIncome = dayTransactions
      .filter((t) => t.type === '수입')
      .reduce((sum, t) => sum + t.amount, 0);

    summaries.push({
      year,
      month,
      day,
      dateSerial: toDateSerial(year, month, day),
      weekday: getWeekday(year, month, day),
      dayType,
      expectedExpense: dayType === '勤' ? settings.weekdayExpense : settings.holidayExpense,
      actualExpense,
      actualIncome,
    });
  }

  return summaries;
}

export async function importFromExcelData(
  transactions: Transaction[],
  holidays?: Holiday[],
  settings?: Partial<AppSettings>
): Promise<void> {
  cache.transactions = transactions;
  if (holidays) cache.holidays = holidays;
  if (settings) cache.settings = { ...cache.settings, ...settings };
  await saveData(cache);
}

export async function resetData(): Promise<void> {
  cache = {
    transactions: [],
    holidays: [...DEFAULT_HOLIDAYS_2026],
    settings: { ...DEFAULT_SETTINGS, savingsPlan: { ...DEFAULT_SETTINGS.savingsPlan } },
  };
  await saveData(cache);
}

export function parseExcelDateSerial(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (value instanceof Date) {
    return toDateSerial(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  return null;
}

export function transactionFromExcelRow(
  year: number,
  month: number,
  day: number,
  dateSerial: number,
  type: string | null,
  method: string | null,
  amount: number | null,
  description: string | null,
  memo: string | null
): Transaction | null {
  if (!type || !amount || amount <= 0) return null;
  if (type !== '지출' && type !== '수입') return null;

  return {
    id: generateId(),
    year,
    month,
    day,
    dateSerial,
    type,
    method: (method as Transaction['method']) || '현금',
    amount,
    description: description || '',
    memo: memo || '',
  };
}
