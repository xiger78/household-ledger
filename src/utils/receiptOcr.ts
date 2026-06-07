import * as FileSystem from 'expo-file-system';
import TextRecognition, {
  TextRecognitionScript,
} from '@react-native-ml-kit/text-recognition';
import { Language } from '../types';
import { mergeOcrTexts } from './receiptNormalize';
import { parseReceiptText, ParsedReceipt, ReceiptOcrLine } from './receiptParser';

const RECEIPTS_DIR = FileSystem.documentDirectory + 'receipts/';

const SCRIPT_BY_LANGUAGE: Record<Language, TextRecognitionScript[]> = {
  ko: [
    TextRecognitionScript.KOREAN,
    TextRecognitionScript.JAPANESE,
    TextRecognitionScript.LATIN,
  ],
  ja: [
    TextRecognitionScript.JAPANESE,
    TextRecognitionScript.KOREAN,
    TextRecognitionScript.LATIN,
  ],
  en: [
    TextRecognitionScript.LATIN,
    TextRecognitionScript.JAPANESE,
    TextRecognitionScript.KOREAN,
  ],
};

export async function ensureReceiptsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RECEIPTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
  }
}

export async function saveReceiptImage(sourceUri: string): Promise<string> {
  await ensureReceiptsDir();
  const filename = `receipt_${Date.now()}.jpg`;
  const dest = RECEIPTS_DIR + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

function extractStructuredLines(result: {
  blocks?: Array<{
    lines?: Array<{
      text?: string;
      frame?: { top?: number; left?: number; height?: number };
    }>;
  }>;
}): ReceiptOcrLine[] {
  const lines: ReceiptOcrLine[] = [];

  for (const block of result.blocks ?? []) {
    for (const line of block.lines ?? []) {
      const text = line.text?.trim();
      if (!text) continue;
      lines.push({
        text,
        y: line.frame?.top ?? 0,
        x: line.frame?.left ?? 0,
        height: line.frame?.height ?? 0,
      });
    }
  }

  return lines.sort((a, b) => a.y - b.y || a.x - b.x);
}

async function recognizeWithScript(
  imageUri: string,
  script?: TextRecognitionScript
): Promise<{ text: string; lines: ReceiptOcrLine[] } | null> {
  try {
    const result = script
      ? await TextRecognition.recognize(imageUri, script)
      : await TextRecognition.recognize(imageUri);
    const text = result?.text?.trim() ?? '';
    if (!text) return null;
    return { text, lines: extractStructuredLines(result) };
  } catch {
    return null;
  }
}

export async function recognizeReceipt(
  imageUri: string,
  language: Language = 'ko'
): Promise<ParsedReceipt> {
  const scripts = SCRIPT_BY_LANGUAGE[language] ?? SCRIPT_BY_LANGUAGE.ko;
  const passes = await Promise.all(scripts.map((script) => recognizeWithScript(imageUri, script)));

  const fallback = await recognizeWithScript(imageUri);
  const results = [...passes, fallback].filter(
    (r): r is { text: string; lines: ReceiptOcrLine[] } => r !== null
  );

  if (results.length === 0) {
    throw new Error('영수증에서 텍스트를 인식하지 못했습니다.');
  }

  const mergedText = mergeOcrTexts(results.map((r) => r.text));
  if (!mergedText) {
    throw new Error('영수증에서 텍스트를 인식하지 못했습니다.');
  }

  const bestLines = results.reduce((best, cur) =>
    cur.lines.length > best.lines.length ? cur : best
  ).lines;

  return parseReceiptText(mergedText, bestLines);
}
