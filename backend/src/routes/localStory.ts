import { Router } from 'express';
import { addLocalChapter, cacheWikiCvChapter, createLocalStory, editLocalChapter, findCachedChapter, getLocalStory, listLocalStories, markLocalChapterRead, rateLocalStory, readLocalChapter, updateLocalStoryState } from '../services/localStoryStore.js';

export const localStoryRouter = Router();
localStoryRouter.get('/stories', async (_req, res) => res.json(await listLocalStories()));
localStoryRouter.get('/stories/cached', async (req, res) => {
  const sourceUrl = typeof req.query.url === 'string' ? req.query.url : '';
  const chapter = await findCachedChapter(sourceUrl);
  if (!chapter) return res.status(404).json({ error: 'Chương chưa được lưu local.' });
  res.json(chapter);
});
localStoryRouter.post('/stories/cache', async (req, res) => {
  const { novelTitle, novelUrl, chapterTitle, chapterUrl, content } = req.body as { novelTitle?: string; novelUrl?: string; chapterTitle?: string; chapterUrl?: string; content?: string };
  if (!novelTitle?.trim() || !chapterTitle?.trim() || !chapterUrl || !content?.trim()) return res.status(400).json({ error: 'Dữ liệu chương WikiCV không hợp lệ.' });
  res.status(201).json(await cacheWikiCvChapter(novelTitle, novelUrl, chapterTitle, chapterUrl, content));
});
localStoryRouter.post('/stories', async (req, res) => {
  const { title, chapterTitle, content } = req.body as { title?: string; chapterTitle?: string; content?: string };
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ error: 'Cần nhập tên truyện và nội dung chương.' });
  res.status(201).json(await createLocalStory(title, chapterTitle || 'Chương 1', content));
});
localStoryRouter.get('/stories/:slug', async (req, res) => {
  try { res.json(await getLocalStory(req.params.slug)); } catch { res.status(404).json({ error: 'Không tìm thấy truyện.' }); }
});
localStoryRouter.put('/stories/:slug/rating', async (req, res) => {
  const rating = Number((req.body as { rating?: number }).rating);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return res.status(400).json({ error: 'Điểm đánh giá phải từ 0 đến 5.' });
  try { res.json(await rateLocalStory(req.params.slug, rating)); } catch { res.status(404).json({ error: 'Không tìm thấy truyện.' }); }
});
localStoryRouter.put('/stories/:slug/state', async (req, res) => {
  const state = req.body as { rating?: number; unread?: boolean };
  try { res.json(await updateLocalStoryState(req.params.slug, state)); } catch { res.status(404).json({ error: 'Không tìm thấy truyện.' }); }
});
localStoryRouter.post('/stories/:slug/chapters', async (req, res) => {
  const { chapterTitle, content } = req.body as { chapterTitle?: string; content?: string };
  if (!content?.trim()) return res.status(400).json({ error: 'Cần nhập nội dung chương.' });
  try { res.status(201).json(await addLocalChapter(req.params.slug, chapterTitle || '', content)); } catch { res.status(404).json({ error: 'Không tìm thấy truyện.' }); }
});
localStoryRouter.put('/stories/:slug/chapters/:number', async (req, res) => {
  const { chapterTitle, content } = req.body as { chapterTitle?: string; content?: string };
  if (!content?.trim()) return res.status(400).json({ error: 'Cần nhập nội dung chương.' });
  try { res.json(await editLocalChapter(req.params.slug, Number(req.params.number), chapterTitle || '', content)); } catch (error) { res.status(404).json({ error: error instanceof Error ? error.message : 'Không thể sửa chương truyện.' }); }
});
localStoryRouter.put('/stories/:slug/chapters/:number/read', async (req, res) => {
  try { res.json(await markLocalChapterRead(req.params.slug, Number(req.params.number), Boolean((req.body as { read?: boolean }).read))); } catch { res.status(404).json({ error: 'Không tìm thấy chương truyện.' }); }
});
localStoryRouter.get('/stories/:slug/chapters/:number', async (req, res) => {
  try { res.json(await readLocalChapter(req.params.slug, Number(req.params.number))); } catch { res.status(404).json({ error: 'Không tìm thấy chương truyện.' }); }
});
