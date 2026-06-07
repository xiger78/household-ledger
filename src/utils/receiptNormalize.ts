const SPLIT_KEYWORD_PREFIXES = ['合', '総', '합', '결제', '총', '支払'];

/** OCR 결과의 흔한 오인식·분리를 보정합니다. */
export function normalizeReceiptOcrText(text: string): string {
  let normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[￥￦₩]/g, '¥')
    .replace(/[，]/g, ',')
    .replace(/[：]/g, ':')
    .replace(/[‐‑‒–—―ー]/g, '-');

  normalized = normalized
    .replace(/合\s*計/g, '合計')
    .replace(/総\s*計/g, '総計')
    .replace(/合\s*計\s*金\s*額/g, '合計金額')
    .replace(/お\s*買\s*上/g, 'お買上')
    .replace(/支\s*払\s*金\s*額/g, '支払金額')
    .replace(/합\s*계/g, '합계')
    .replace(/결\s*제\s*금\s*액/g, '결제금액')
    .replace(/총\s*액/g, '총액')
    .replace(/([¥￥])\s*(\d{1,3})\s+(\d{3})\b/g, '$1$2$3');

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return mergeBrokenLines(lines).join('\n');
}

function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    if (merged.length === 0) {
      merged.push(line);
      continue;
    }

    const prev = merged[merged.length - 1];
    const prevEndsKeyword = SPLIT_KEYWORD_PREFIXES.some((p) => prev.endsWith(p) || prev === p);
    const isAmountOnly = /^[¥]?\s*[\d,]+(?:\.\d+)?$/.test(line);
    const isKeywordSuffix = /^(計|額|금액|액)$/.test(line);

    if ((prevEndsKeyword || isKeywordSuffix) && (isAmountOnly || isKeywordSuffix)) {
      merged[merged.length - 1] = `${prev}${line}`;
      continue;
    }

    if (prevEndsKeyword && /^[\d,]+(?:円|원)?$/.test(line)) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    merged.push(line);
  }

  return merged;
}

/** 여러 OCR 패스 결과를 중복 제거하며 병합합니다. */
export function mergeOcrTexts(texts: string[]): string {
  const uniqueTexts = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (uniqueTexts.length === 0) return '';
  if (uniqueTexts.length === 1) return normalizeReceiptOcrText(uniqueTexts[0]);

  const lineMap = new Map<string, string>();
  for (const text of uniqueTexts) {
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const key = trimmed.replace(/\s+/g, '').toLowerCase();
      const existing = lineMap.get(key);
      if (!existing || trimmed.length > existing.length) {
        lineMap.set(key, trimmed);
      }
    }
  }

  const primary = uniqueTexts.reduce((best, cur) => (cur.length > best.length ? cur : best), '');
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const line of primary.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const key = trimmed.replace(/\s+/g, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(lineMap.get(key) ?? trimmed);
  }

  for (const line of lineMap.values()) {
    const key = line.replace(/\s+/g, '').toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(line);
    }
  }

  return normalizeReceiptOcrText(ordered.join('\n'));
}
