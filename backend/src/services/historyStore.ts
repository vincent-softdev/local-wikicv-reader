import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReadingHistoryItem } from '../types/history.js';

const filePath = join(dirname(fileURLToPath(import.meta.url)), '../../data/reading-history.json');

export async function readHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const items = JSON.parse(await readFile(filePath, 'utf8')) as ReadingHistoryItem[];
    const seen = new Set<string>();
    return items.filter(item => { const key = item.novelUrl || item.novelTitle; if (seen.has(key)) return false; seen.add(key); return true; });
  }
  catch { return []; }
}

export async function saveHistory(item: ReadingHistoryItem): Promise<ReadingHistoryItem[]> {
  const novelKey = item.novelUrl || item.novelTitle;
  const history = [item, ...(await readHistory()).filter(existing => (existing.novelUrl || existing.novelTitle) !== novelKey)].slice(0, 50);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
  return history;
}
