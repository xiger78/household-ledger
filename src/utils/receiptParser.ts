import { PaymentMethod } from '../types';

export interface ReceiptOcrLine {
  text: string;
  y: number;
  x: number;
  height: number;
}

export interface ParsedReceipt {
  amount: number | null;
  year: number;
  month: number;
  day: number;
  description: string;
  method: PaymentMethod;
  category: string;
  rawText: string;
}

const TOTAL_KEYWORDS = [
  '合計',
  '総計',
  '総額',
  '合計金額',
  '請求額',
  'お買上額',
  'お買上げ',
  'お買上',
  'ご利用額',
  '支払金額',
  '支払額',
  '御買上',
  '合　計',
  '合 計',
  '税込合計',
  'お支払',
  '총액',
  '합계',
  '결제금액',
  '결제 금액',
  '받을금액',
  '청구금액',
  '승인금액',
  'total',
  'amount due',
  'grand total',
];

const SUBTOTAL_KEYWORDS = ['小計', '소계', 'subtotal', '商品合計'];

const EXCLUDE_KEYWORDS = [
  '税率',
  '消費税',
  '内税',
  '外税',
  'お釣り',
  '釣銭',
  '預り',
  '預かり',
  'お預り',
  'ポイント',
  '会員',
  '還元',
  '割引',
  '値引',
  'クーポン',
  '免税',
  '対象',
  '軽減',
  '税込8',
  '税込10',
  '부가세',
  '공급가액',
  '거스름',
  '포인트',
  '할인',
  '적립',
  '잔액',
  '카드번호',
  '승인번호',
  '전화',
  'tel',
  'fax',
];

const KNOWN_STORES: { pattern: RegExp; name: string }[] = [
  { pattern: /セブン[\-\s]?イレブン|7[\-\s]?eleven|seven/i, name: 'セブン-イレブン' },
  { pattern: /ファミリーマート|family\s*mart/i, name: 'ファミリーマート' },
  { pattern: /ローソン|lawson/i, name: 'ローソン' },
  { pattern: /ミニストップ|ministop/i, name: 'ミニストップ' },
  { pattern: /イオン|aeon/i, name: 'イオン' },
  { pattern: /ドン・キホーテ|don\s*qui/i, name: 'ドン・キホーテ' },
  { pattern: /マクドナルド|mcdonald/i, name: 'マクドナルド' },
  { pattern: /スターバックス|starbucks/i, name: 'スターバックス' },
  { pattern: /\bcu\b|씨유/i, name: 'CU' },
  { pattern: /gs25|gs\s*25/i, name: 'GS25' },
  { pattern: /세븐일레븐|seven/i, name: '세븐일레븐' },
  { pattern: /이마트|e[\-\s]?mart/i, name: '이마트' },
  { pattern: /홈플러스|homeplus/i, name: '홈플러스' },
  { pattern: /다이소|daiso/i, name: '다이소' },
  { pattern: /맥도날드|mcdonald/i, name: '맥도날드' },
];

const PAYMENT_PATTERNS: { pattern: RegExp; method: PaymentMethod }[] = [
  { pattern: /paypay|ペイペイ|페이페이/i, method: '페이페이' },
  { pattern: /楽天|ラクテン|라쿠텐|rakuten/i, method: '라쿠텐페이' },
  { pattern: /line\s*pay|ラインペイ/i, method: '페이페이' },
  { pattern: /d払い|dペイ/i, method: '페이페이' },
  { pattern: /au\s*pay/i, method: '페이페이' },
  { pattern: /交通系|icカード|suica|pasmo|nanaco|waon|edy/i, method: '카드' },
  { pattern: /クレジット|credit|カード|card|신용|체크/i, method: '카드' },
  { pattern: /現金|cash|현금/i, method: '현금' },
  { pattern: /口座|振込|이체|계좌/i, method: '계좌이체' },
];

const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /コンビニ|convenience|편의점|세븐|ローソン|ファミマ/i, category: '편의점' },
  { pattern: /スーパー|super|마트|이마트|홈플러스|イオン/i, category: '마트' },
  { pattern: /レストラン|飲食|식당|카페|coffee|スタバ|マック/i, category: '식비' },
  { pattern: /ガソリン|gas|주유|gs|shell|セルフ/i, category: '교통비' },
  { pattern: /ドラッグ|薬局|약국|ダイソー/i, category: '의료/생활' },
  { pattern: /電車|地下鉄|バス|jr|택시|taxi|交通/i, category: '교통비' },
];

function parseNumbersFromLine(line: string): number[] {
  const nums: number[] = [];
  const patterns = [
    /[¥￥]\s*([\d,]+(?:\.\d+)?)/g,
    /([\d,]+(?:\.\d+)?)\s*円/g,
    /([\d,]+(?:\.\d+)?)\s*원/g,
    /(?:合計|総額|합계|총액|total|amount)\s*[:：]?\s*([\d,]+)/gi,
    /(?:^|\s)([\d,]{2,7})(?:\s*円|\s*원)?(?:\s|$)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const raw = match[1].replace(/,/g, '');
      const num = parseInt(raw.split('.')[0], 10);
      if (num >= 1 && num <= 9_999_999) nums.push(num);
    }
  }

  return nums;
}

function scoreAmountCandidate(
  amount: number,
  line: string,
  lineIndex: number,
  totalLines: number,
  ocrLine?: ReceiptOcrLine,
  maxY: number = 1
): number {
  let score = 0;
  const lower = line.toLowerCase();

  if (TOTAL_KEYWORDS.some((kw) => line.includes(kw) || lower.includes(kw.toLowerCase()))) {
    score += 120;
  } else if (SUBTOTAL_KEYWORDS.some((kw) => line.includes(kw))) {
    score += 40;
  }

  if (EXCLUDE_KEYWORDS.some((kw) => line.includes(kw))) score -= 100;

  const positionRatio = totalLines > 1 ? lineIndex / (totalLines - 1) : 0.5;
  score += positionRatio * 35;

  if (ocrLine && maxY > 0) {
    score += (ocrLine.y / maxY) * 25;
    if (ocrLine.height >= 18) score += 10;
  }

  if (/[¥￥円원]/.test(line)) score += 25;
  if (amount >= 100 && amount <= 500_000) score += 15;
  if (amount < 100) score -= 50;
  if (amount > 500_000) score -= 20;

  if (/\d{4}[/年.-]\d{1,2}[/月.-]\d{1,2}/.test(line)) score -= 60;
  if (/\d{2}:\d{2}/.test(line)) score -= 30;
  if (/^\d{10,}$/.test(line.replace(/\s/g, ''))) score -= 40;

  return score;
}

function parseAmount(text: string, structuredLines: ReceiptOcrLine[] = []): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const maxY = structuredLines.reduce((m, l) => Math.max(m, l.y), 0) || 1;
  const lineMeta = new Map<string, ReceiptOcrLine>();
  for (const sl of structuredLines) {
    lineMeta.set(sl.text.trim(), sl);
  }

  const candidates: { amount: number; score: number }[] = [];

  lines.forEach((line, index) => {
    const nums = parseNumbersFromLine(line);
    const ocrLine = lineMeta.get(line);

    for (const num of nums) {
      candidates.push({
        amount: num,
        score: scoreAmountCandidate(num, line, index, lines.length, ocrLine, maxY),
      });
    }

    const isTotalLine = TOTAL_KEYWORDS.some((kw) => line.includes(kw));
    if (isTotalLine && index + 1 < lines.length) {
      const nextNums = parseNumbersFromLine(lines[index + 1]);
      for (const num of nextNums) {
        candidates.push({
          amount: num,
          score: scoreAmountCandidate(num, lines[index + 1], index + 1, lines.length, lineMeta.get(lines[index + 1]), maxY) + 80,
        });
      }
    }
  });

  if (candidates.length === 0) return null;

  const bestByAmount = new Map<number, number>();
  for (const c of candidates) {
    const prev = bestByAmount.get(c.amount) ?? -Infinity;
    if (c.score > prev) bestByAmount.set(c.amount, c.score);
  }

  const ranked = [...bestByAmount.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (ranked.length > 0) return ranked[0][0];

  const fallback = [...bestByAmount.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  return fallback[0]?.[0] ?? null;
}

function parseDate(text: string): { year: number; month: number; day: number } {
  const now = new Date();
  const patterns: Array<{
    regex: RegExp;
    map: (m: RegExpMatchArray) => { year: number; month: number; day: number } | null;
  }> = [
    {
      regex: /(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})/,
      map: (m) => ({ year: +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
      map: (m) => ({ year: +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      map: (m) => ({ year: +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /(\d{4})(\d{2})(\d{2})/,
      map: (m) => ({ year: +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /令和\s*(\d{1,2})[年.](\d{1,2})[月.](\d{1,2})/,
      map: (m) => ({ year: 2018 + +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /R\s*(\d{1,2})[./](\d{1,2})[./](\d{1,2})/i,
      map: (m) => ({ year: 2018 + +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /(\d{2})[年/.](\d{1,2})[月/.](\d{1,2})/,
      map: (m) => ({ year: 2000 + +m[1], month: +m[2], day: +m[3] }),
    },
    {
      regex: /(\d{1,2})[月/](\d{1,2})[日/]/,
      map: (m) => ({ year: now.getFullYear(), month: +m[1], day: +m[2] }),
    },
  ];

  for (const { regex, map } of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    const parsed = map(match);
    if (!parsed) continue;
    const { year, month, day } = parsed;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function parsePaymentMethod(text: string): PaymentMethod {
  for (const { pattern, method } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) return method;
  }
  return '카드';
}

function parseCategory(text: string, storeName: string): string {
  const combined = `${storeName} ${text}`;
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(combined)) return category;
  }
  return '기타';
}

function parseStoreName(lines: string[], fullText: string): string {
  for (const { pattern, name } of KNOWN_STORES) {
    if (pattern.test(fullText)) return name;
  }

  const skipPattern =
    /^[\d\s/:.,\-¥￥円원]+$|〒|電話|TEL|FAX|レジ|担当|ありがとう|領収|レシート|お買上|会員|ポイント|税率|消費税|内税|外税|お釣り|預り|welcome|thank|receipt|영수증|거래일시|승인번호|카드사/i;

  let best = '';
  let bestScore = 0;

  for (const line of lines.slice(0, 15)) {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 45) continue;
    if (skipPattern.test(trimmed)) continue;
    if (/^\d{4,}/.test(trimmed)) continue;
    if (TOTAL_KEYWORDS.some((kw) => trimmed.includes(kw))) continue;

    let score = trimmed.length;
    if (/[가-힣ァ-ン一-龯]/.test(trimmed)) score += 10;
    if (/店|마트|식당|카페|편의|コンビニ|スーパー/.test(trimmed)) score += 15;

    if (score > bestScore) {
      bestScore = score;
      best = trimmed;
    }
  }

  return best || '영수증 지출';
}

export function parseReceiptText(
  rawText: string,
  structuredLines: ReceiptOcrLine[] = []
): ParsedReceipt {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const date = parseDate(rawText);
  const amount = parseAmount(rawText, structuredLines);
  const storeName = parseStoreName(lines, rawText);
  const method = parsePaymentMethod(rawText);
  const category = parseCategory(rawText, storeName);

  return {
    amount,
    year: date.year,
    month: date.month,
    day: date.day,
    description: storeName,
    method,
    category,
    rawText,
  };
}
