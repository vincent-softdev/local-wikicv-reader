import { Router } from 'express';
import { fetchWikiCvChapter, fetchWikiCvNovel } from '../services/wikicvScraper.js';
import { validateWikiCvUrl } from '../utils/validateWikiCvUrl.js';
import { ChapterParseError } from '../types/chapter.js';

export const chapterRouter = Router();
chapterRouter.get('/chapter', async (req, res) => {
  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  try {
    validateWikiCvUrl(raw);
    res.json(await fetchWikiCvChapter(raw));
  } catch (error) {
    const message = error instanceof ChapterParseError ? 'Trang đã tải nhưng không tìm thấy nội dung chương.' : error instanceof Error && /1106|429|too many|rate limit/i.test(error.message) ? 'WikiCV đang giới hạn truy cập (Error 1106). Hãy chờ một chút rồi thử lại.' : error instanceof Error && error.message.includes('Chỉ hỗ trợ') ? error.message : 'Không thể tải chương truyện.';
    res.status(400).json({ error: message });
  }
});
chapterRouter.get('/novel', async (req, res) => {
  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  try { res.json(await fetchWikiCvNovel(raw)); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Không thể tải mục lục truyện.' }); }
});
