import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import {
  AppSettings,
  Holiday,
  SavingsPlan,
  Transaction,
} from '../types';
import {
  parseExcelDateSerial,
  transactionFromExcelRow,
} from '../store/database';

export interface ImportResult {
  transactions: Transaction[];
  holidays: Holiday[];
  settings: Partial<AppSettings>;
  monthCount: number;
}

export async function importFromExcelUri(uri: string): Promise<ImportResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const workbook = XLSX.read(base64, { type: 'base64', cellDates: true });
  return parseWorkbook(workbook);
}

function parseWorkbook(workbook: XLSX.WorkBook): ImportResult {
  const transactions: Transaction[] = [];
  const holidays: Holiday[] = [];
  const settings: Partial<AppSettings> = { year: 2026 };

  const holidaySheet = workbook.Sheets['2026년휴일'];
  if (holidaySheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(holidaySheet, { header: 1 }) as unknown[][];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const dateVal = row[1];
      if (dateVal instanceof Date) {
        holidays.push({
          year: dateVal.getFullYear(),
          month: dateVal.getMonth() + 1,
          day: dateVal.getDate(),
        });
      } else if (typeof row[2] === 'number' && typeof row[3] === 'number') {
        holidays.push({ year: 2026, month: row[2] as number, day: row[3] as number });
      }
    }
  }

  const refSheet = workbook.Sheets['참조'];
  if (refSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(refSheet, { header: 1 }) as unknown[][];
    for (const row of rows) {
      if (row[4] === '지출' && typeof row[3] === 'number') {
        settings.holidayExpense = row[3] as number;
      }
      if (row[4] === '수입' && typeof row[3] === 'number') {
        settings.weekdayExpense = row[3] as number;
      }
    }
  }

  const savingsSheet = workbook.Sheets['2026저축계획'];
  if (savingsSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(savingsSheet, { header: 1 }) as unknown[][];
    const savingsPlan: Partial<SavingsPlan> = {};
    for (const row of rows) {
      if (row[0] === '월급') savingsPlan.salary = (row[1] as number) || 0;
      if (row[0] === '상여') savingsPlan.bonus = (row[1] as number) || 0;
      if (row[0] === '잔액') savingsPlan.balance = (row[1] as number) || 0;
      if (row[2] === '고정비') savingsPlan.fixedCost = (row[3] as number) || 0;
      if (row[2] === '월세') savingsPlan.rent = (row[3] as number) || 0;
    }
    settings.savingsPlan = savingsPlan as SavingsPlan;
  }

  let monthCount = 0;
  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.startsWith('지출기록_') || sheetName === '지출기록_양식') continue;
    monthCount++;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) as unknown[][];

    let year = 2026;
    let month = 1;

    for (const row of rows) {
      if (!row) continue;

      if (row[0] === '년도' && typeof row[1] === 'number') year = row[1] as number;
      if (row[0] === '월' && typeof row[1] === 'number') month = row[1] as number;

      const day = row[3];
      if (typeof day !== 'number') continue;

      const tx = transactionFromExcelRow(
        year,
        month,
        day,
        parseExcelDateSerial(row[4]) || 0,
        row[5] as string | null,
        row[6] as string | null,
        typeof row[7] === 'number' ? row[7] : null,
        row[8] as string | null,
        row[9] as string | null
      );
      if (tx) transactions.push(tx);
    }
  }

  return { transactions, holidays, settings, monthCount };
}

export async function exportToExcel(
  transactions: Transaction[],
  holidays: Holiday[],
  settings: AppSettings
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  const refData = [
    [null, 1, '日', '休', settings.holidayExpense, '지출', '현금'],
    [null, 2, '月', '勤', settings.weekdayExpense, '수입', '카드'],
    [null, 3, '火', null, null, null, '페이페이'],
    [null, 4, '水', null, null, null, '라쿠텐페이'],
    [null, 5, '木', null, null, null, '계좌이체'],
    [null, 6, '金'],
    [null, 7, '土'],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(refData), '참조');

  const holidayData: unknown[][] = [[2026, null, '월', '일']];
  for (const h of holidays) {
    holidayData.push([null, new Date(h.year, h.month - 1, h.day), h.month, h.day]);
  }
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(holidayData), '2026년휴일');

  const sp = settings.savingsPlan;
  const savingsData = [
    ['월급', sp.salary],
    ['상여', sp.bonus],
    ['잔액', sp.balance],
    [null, null, '지출', 0],
    [null, null, '고정비', sp.fixedCost],
    [null, null, '월세', sp.rent],
    [null, null, '지출합계', sp.fixedCost + sp.rent],
    [null, null, null, null, '수입', sp.salary + sp.bonus],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(savingsData), '2026저축계획');

  const months = new Set(transactions.map((t) => t.month));
  if (months.size === 0) months.add(new Date().getMonth() + 1);

  for (const month of Array.from(months).sort((a, b) => a - b)) {
    const monthTx = transactions.filter((t) => t.month === month && t.year === settings.year);
    const daysInMonth = new Date(settings.year, month, 0).getDate();
    const sheetData: unknown[][] = [
      ['년도', settings.year],
      ['월', month, null, null, '날짜', '구분', '수단', '액수', '내용', '비고'],
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTx = monthTx.filter((t) => t.day === day);
      const slots = Math.max(dayTx.length, 1);
      for (let s = 0; s < slots; s++) {
        const tx = dayTx[s];
        sheetData.push([
          null, null, null, day,
          tx ? tx.dateSerial : toSerial(settings.year, month, day),
          tx ? tx.type : null,
          tx ? tx.method : null,
          tx ? tx.amount : null,
          tx ? tx.description : null,
          tx ? tx.memo : null,
        ]);
      }
    }

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetData), `지출기록_${month}월`);
  }

  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileName = `가계부_${settings.year}년_${formatExportDate()}.xlsx`;
  const fileUri = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: '가계부 엑셀보내기',
    });
  }
}

function toSerial(year: number, month: number, day: number): number {
  const EXCEL_EPOCH = new Date(1899, 11, 30);
  const date = new Date(year, month - 1, day);
  return Math.round((date.getTime() - EXCEL_EPOCH.getTime()) / 86400000);
}

function formatExportDate(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}
