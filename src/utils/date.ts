import { DayType, Holiday, WEEKDAYS_KO } from '../types';

const EXCEL_EPOCH = new Date(1899, 11, 30);

export function toDateSerial(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  return Math.round((date.getTime() - EXCEL_EPOCH.getTime()) / 86400000);
}

export function fromDateSerial(serial: number): { year: number; month: number; day: number } {
  const date = new Date(EXCEL_EPOCH.getTime() + serial * 86400000);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function getWeekday(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return WEEKDAYS_KO[date.getDay()];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

export function isHoliday(year: number, month: number, day: number, holidays: Holiday[]): boolean {
  return holidays.some((h) => h.year === year && h.month === month && h.day === day);
}

export function getDayType(
  year: number,
  month: number,
  day: number,
  holidays: Holiday[]
): DayType {
  if (isWeekend(year, month, day) || isHoliday(year, month, day, holidays)) {
    return '休';
  }
  return '勤';
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}년 ${month}월 ${day}일`;
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
