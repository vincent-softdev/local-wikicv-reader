import { Router } from 'express';
import { fetchWikiCvChapter } from '../services/wikicvScraper.js';
import { validateWikiCvUrl } from '../utils/validateWikiCvUrl.js';
import { ChapterParseError } from '../types/chapter.js';

export const chapterRouter = Router();
chapterRouter.get('/chapter', async (req, res) => {
  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  try {
    validateWikiCvUrl(raw);
    res.json(await fetchWikiCvChapter(raw));
  } catch (error) {
    const message = error instanceof ChapterParseError ? 'Trang đã tải nhưng không tìm thấy nội dung chương.' : error instanceof Error && error.message.includes('Chỉ hỗ trợ') ? error.message : 'Không thể tải chương truyện.';
    res.status(400).json({ error: message });
  }
});
