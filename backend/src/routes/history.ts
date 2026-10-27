import { Router } from 'express';
import { readHistory, saveHistory } from '../services/historyStore.js';
import type { ReadingHistoryItem } from '../types/history.js';

export const historyRouter = Router();
historyRouter.get('/history', async (_req, res) => res.json(await readHistory()));
historyRouter.post('/history', async (req, res) => {
  const item = req.body as Partial<ReadingHistoryItem>;
  if (!item.chapterUrl || !item.chapterTitle || !item.novelTitle) return res.status(400).json({ error: 'Dữ liệu lịch sử không hợp lệ.' });
  res.json(await saveHistory(item as ReadingHistoryItem));
});
