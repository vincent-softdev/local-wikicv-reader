import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocalChapter, LocalChapterMeta, LocalStoryMeta } from '../types/localStory.js';

const storiesDir = join(dirname(fileURLToPath(import.meta.url)), '../../data/stories');

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'truyen-moi';
}

function storyDir(slug: string) { return join(storiesDir, slug); }
function metaFile(slug: string) { return join(storyDir(slug), 'story.json'); }

async function readMeta(slug: string): Promise<LocalStoryMeta> { return JSON.parse(await readFile(metaFile(slug), 'utf8')) as LocalStoryMeta; }

export async function listLocalStories(): Promise<LocalStoryMeta[]> {
  await mkdir(storiesDir, { recursive: true });
  const entries = await readdir(storiesDir, { withFileTypes: true });
  const stories: LocalStoryMeta[] = [];
  for (const entry of entries) if (entry.isDirectory()) { try { stories.push(await readMeta(entry.name)); } catch { /* Ignore incomplete folders. */ } }
  return stories.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLocalStory(slug: string): Promise<LocalStoryMeta> { return readMeta(slug); }

export async function createLocalStory(title: string, chapterTitle: string, content: string): Promise<LocalStoryMeta> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;
  while (true) { try { await readMeta(slug); slug = `${baseSlug}-${suffix++}`; } catch { break; } }
  await mkdir(storyDir(slug), { recursive: true });
  const now = new Date().toISOString();
  const chapter: LocalChapterMeta = { number: 1, title: chapterTitle.trim() || 'Chương 1', file: 'chapter-1.txt', createdAt: now, updatedAt: now };
  const meta: LocalStoryMeta = { slug, title: title.trim(), createdAt: now, updatedAt: now, unread: true, chapters: [chapter] };
  await writeFile(join(storyDir(slug), chapter.file), content, 'utf8');
  await writeFile(metaFile(slug), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  return meta;
}

export async function addLocalChapter(slug: string, chapterTitle: string, content: string): Promise<LocalStoryMeta> {
  const meta = await readMeta(slug);
  const number = meta.chapters.length ? Math.max(...meta.chapters.map(chapter => chapter.number)) + 1 : 1;
  const now = new Date().toISOString();
  const chapter: LocalChapterMeta = { number, title: chapterTitle.trim() || `Chương ${number}`, file: `chapter-${number}.txt`, createdAt: now, updatedAt: now };
  await writeFile(join(storyDir(slug), chapter.file), content, 'utf8');
  const updated = { ...meta, updatedAt: now, chapters: [...meta.chapters, chapter] };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}

export async function editLocalChapter(slug: string, number: number, chapterTitle: string, content: string): Promise<LocalStoryMeta> {
  const meta = await readMeta(slug);
  const index = meta.chapters.findIndex(item => item.number === number);
  if (index < 0) throw new Error('Không tìm thấy chương truyện.');
  const previous = meta.chapters[index];
  const now = new Date().toISOString();
  const chapter = { ...previous, title: chapterTitle.trim() || previous.title, updatedAt: now };
  await writeFile(join(storyDir(slug), previous.file), content, 'utf8');
  const updated = { ...meta, updatedAt: now, chapters: meta.chapters.map((item, itemIndex) => itemIndex === index ? chapter : item) };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}

export async function readLocalChapter(slug: string, number: number): Promise<LocalChapter> {
  const meta = await readMeta(slug);
  const chapterIndex = meta.chapters.findIndex(item => item.number === number);
  const chapter = meta.chapters[chapterIndex];
  if (!chapter) throw new Error('Không tìm thấy chương truyện.');
  return { ...chapter, story: slug, storyTitle: meta.title, content: await readFile(join(storyDir(slug), chapter.file), 'utf8'), previousSourceUrl: meta.chapters[chapterIndex - 1]?.sourceUrl, nextSourceUrl: meta.chapters[chapterIndex + 1]?.sourceUrl };
}

export async function findCachedChapter(sourceUrl: string): Promise<LocalChapter | undefined> {
  for (const story of await listLocalStories()) {
    const chapter = story.chapters.find(item => item.sourceUrl === sourceUrl);
    if (chapter) { const index = story.chapters.findIndex(item => item.number === chapter.number); return { ...chapter, story: story.slug, storyTitle: story.title, content: await readFile(join(storyDir(story.slug), chapter.file), 'utf8'), previousSourceUrl: story.chapters[index - 1]?.sourceUrl, nextSourceUrl: story.chapters[index + 1]?.sourceUrl }; }
  }
  return undefined;
}

export async function cacheWikiCvChapter(novelTitle: string, novelUrl: string | undefined, chapterTitle: string, chapterUrl: string, content: string): Promise<{ saved: boolean; story: LocalStoryMeta }> {
  const baseSlug = slugify(novelTitle);
  let slug = baseSlug;
  let meta: LocalStoryMeta;
  try { meta = await readMeta(slug); } catch {
    const now = new Date().toISOString();
    meta = { slug, title: novelTitle.trim() || 'Truyện WikiCV', sourceUrl: novelUrl, createdAt: now, updatedAt: now, unread: true, chapters: [] };
    await mkdir(storyDir(slug), { recursive: true });
  }
  if (meta.chapters.some(chapter => chapter.sourceUrl === chapterUrl)) return { saved: false, story: meta };
  const number = meta.chapters.length ? Math.max(...meta.chapters.map(chapter => chapter.number)) + 1 : 1;
  const now = new Date().toISOString();
  const chapter: LocalChapterMeta = { number, title: chapterTitle.trim() || `Chương ${number}`, file: `chapter-${number}.txt`, sourceUrl: chapterUrl, createdAt: now, updatedAt: now };
  await writeFile(join(storyDir(slug), chapter.file), content, 'utf8');
  const updated = { ...meta, sourceUrl: meta.sourceUrl || novelUrl, updatedAt: now, chapters: [...meta.chapters, chapter] };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return { saved: true, story: updated };
}

export async function rateLocalStory(slug: string, rating: number): Promise<LocalStoryMeta> {
  const meta = await readMeta(slug);
  const updated = { ...meta, rating: Math.max(0, Math.min(5, Math.round(rating))), updatedAt: new Date().toISOString() };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}

export async function updateLocalStoryState(slug: string, state: { rating?: number; unread?: boolean }): Promise<LocalStoryMeta> {
  const meta = await readMeta(slug);
  const updated = { ...meta, ...(state.rating === undefined ? {} : { rating: Math.max(0, Math.min(5, Math.round(state.rating))) }), ...(state.unread === undefined ? {} : { unread: state.unread }), updatedAt: new Date().toISOString() };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}

export async function markLocalChapterRead(slug: string, number: number, read: boolean): Promise<LocalStoryMeta> {
  const meta = await readMeta(slug);
  if (!meta.chapters.some(chapter => chapter.number === number)) throw new Error('Không tìm thấy chương truyện.');
  const updated = { ...meta, unread: read ? false : meta.unread, lastReadChapter: read ? Math.max(meta.lastReadChapter ?? 0, number) : meta.lastReadChapter, updatedAt: new Date().toISOString(), chapters: meta.chapters.map(chapter => chapter.number === number ? { ...chapter, read, updatedAt: new Date().toISOString() } : chapter) };
  await writeFile(metaFile(slug), `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}
