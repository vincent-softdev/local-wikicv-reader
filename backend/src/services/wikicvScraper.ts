import * as cheerio from 'cheerio';
import { Chapter, ChapterLink, ChapterParseError, NovelIndex } from '../types/chapter.js';
import { validateWikiCvNovelUrl, validateWikiCvUrl } from '../utils/validateWikiCvUrl.js';

const USER_AGENT = 'Local-WikiCV-Reader/1.0 (personal local reader)';
const CONTENT_SELECTORS = ['#bookContentBody', '.reading-content', '.chapter-content', '.chapter-c', '.content-chapter', '[class*="chapter-content"]', '[class*="reading-content"]'];
const NOISE = 'script,style,noscript,iframe,form,button,nav,header,footer,aside,.ads,.ad,.advertisement,.comment,.comments,.recommend,.related,.social,.breadcrumb,.share';

function clean(value: string): string { return value.replace(/\s+/g, ' ').trim(); }

function firstText($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const value = clean($(selector).first().text());
    if (value) return value;
  }
  return '';
}

function extractParagraphs($: cheerio.CheerioAPI): string[] {
  for (const selector of CONTENT_SELECTORS) {
    const node = $(selector).first();
    if (!node.length) continue;
    const clone = node.clone();
    clone.find(NOISE).remove();
    const paragraphs = clone.find('p').toArray().map((el) => clean($(el).text())).filter(Boolean);
    if (paragraphs.length >= 2) return paragraphs;
    const lines = clone.text().split(/\n+/).map(clean).filter((line) => line.length > 20);
    if (lines.length >= 2) return lines;
  }
  return [];
}

function findChapterLink($: cheerio.CheerioAPI, direction: 'prev' | 'next', source: URL): string | undefined {
  const labels = direction === 'prev' ? /trước|previous|prev/i : /sau|next/i;
  const selector = direction === 'prev' ? '[rel="prev"], .prev, .previous, .chapter-prev, [class*="prev"]' : '[rel="next"], .next, .next-chapter, .chapter-next, [class*="next"]';
  const candidates = [...$(selector).toArray(), ...$('a[href], [data-href], [data-url]').toArray()].map((el) => ({
    text: clean($(el).text()) || clean($(el).attr('title') ?? '') || clean($(el).attr('aria-label') ?? ''),
    href: $(el).attr('href') ?? $(el).attr('data-href') ?? $(el).attr('data-url'),
    preferred: $(el).is(selector),
  })).filter((x) => x.href && (x.preferred || labels.test(x.text)));
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate.href!, source);
      if (url.hostname.endsWith('wikicv.org') && /\/truyen\/[^/]+\/chuong(?:-|\/)/i.test(url.pathname) && url.toString() !== source.toString()) return url.toString();
    } catch { /* Try the next candidate. */ }
  }
  return undefined;
}

function findNovelLink($: cheerio.CheerioAPI, source: URL): string | undefined {
  const indexHref = $('.btn-index').first().attr('href');
  if (indexHref) {
    try {
      const indexUrl = new URL(indexHref, source);
      if (indexUrl.origin === source.origin && /^\/truyen\/[^/]+\/?$/i.test(indexUrl.pathname)) return indexUrl.toString();
    } catch { /* Continue with the generic link scan. */ }
  }
  const candidates = $('a[href]').toArray().map(element => ({ text: clean($(element).text()) || clean($(element).attr('title') ?? '') || clean($(element).attr('aria-label') ?? ''), href: $(element).attr('href') }));
  for (const candidate of candidates) {
    if (!candidate.href || (!/mục lục|danh sách chương|trang truyện|book|novel|truyện/i.test(candidate.text) && /\/chuong(?:-|\/)/i.test(candidate.href))) continue;
    try {
      const url = new URL(candidate.href, source);
      if (url.origin === source.origin && /^\/truyen\/[^/]+\/?$/i.test(url.pathname)) return url.toString();
    } catch { /* Ignore malformed links. */ }
  }
  return undefined;
}

function findChapterLinks($: cheerio.CheerioAPI, source: URL, currentTitle = ''): ChapterLink[] {
  const links: ChapterLink[] = [];
  const seen = new Set<string>();
  const chapterPage = /\/chuong(?:-|\/)/i.test(source.pathname);
  const novelSlug = source.pathname.split('/').filter(Boolean)[1];
  const novelPrefix = chapterPage ? `${source.origin}/truyen/${novelSlug}/` : '';
  const addLink = (href: string | undefined, rawTitle?: string) => {
    if (!href) return;
    try {
      const url = new URL(href, source);
      if (url.origin !== source.origin || (novelPrefix && !url.pathname.startsWith(novelPrefix)) || !/\/truyen\/[^/]+\/chuong(?:-|\/)/i.test(url.pathname)) return;
      const absoluteUrl = url.toString();
      if (seen.has(absoluteUrl)) return;
      const title = clean(rawTitle ?? '') || clean(decodeURIComponent(url.pathname.split('/').pop() ?? '').replace(/^chuong[-_]?/i, 'Chương '));
      if (/chương (trước|sau)|previous|next|prev/i.test(title)) return;
      seen.add(absoluteUrl);
      links.push({ title, url: absoluteUrl });
    } catch { /* Ignore malformed external links. */ }
  };
  $('.chapter-name a[href]').each((_, element) => addLink($(element).attr('href'), clean($(element).text())));
  $('a[href], option[value], [data-href], [data-url]').each((_, element) => {
    const href = $(element).attr('href') ?? $(element).attr('value') ?? $(element).attr('data-href') ?? $(element).attr('data-url');
    const title = clean($(element).text()) || clean($(element).attr('title') ?? '') || clean($(element).attr('aria-label') ?? '');
    addLink(href, title);
  });
  const urlPattern = /(?:https?:\/\/wikicv\.org)?\/truyen\/[^"'\\\s]+\/chuong(?:-|\/)[^"'\\\s<]+/gi;
  for (const match of $.html().matchAll(urlPattern)) addLink(match[0]);
  const currentUrl = source.toString();
  if (currentTitle && !seen.has(currentUrl)) links.push({ title: currentTitle, url: currentUrl });
  return links;
}

export function parseWikiCvNovel(html: string, sourceUrl: string): NovelIndex {
  const source = validateWikiCvNovelUrl(sourceUrl);
  const $ = cheerio.load(html);
  const title = firstText($, ['[class*="novel-title"]', '.book-title', '.truyen-title', '[class*="book-name"]', 'h1', 'title']) || 'WikiCV';
  return { sourceUrl: source.toString(), title, chapters: findChapterLinks($, source) };
}

export function parseWikiCvChapter(html: string, sourceUrl: string): Chapter {
  const source = validateWikiCvUrl(sourceUrl);
  const $ = cheerio.load(html);
  $('script,style,noscript').remove();
  const novelTitle = firstText($, ['[class*="novel-title"]', '.book-title', '.truyen-title', '[class*="book-name"]', 'meta[property="og:site_name"]']) || 'WikiCV';
  const chapterTitle = firstText($, ['[class*="chapter-title"]', '.chapter-name', '.entry-title', 'h2', 'h1']) || clean($('title').text());
  const paragraphs = extractParagraphs($);
  if (!paragraphs.length) throw new ChapterParseError('The page loaded but the chapter content could not be identified.');
  const cleanNovelTitle = novelTitle.replace(chapterTitle, '').trim() || novelTitle;
  return { sourceUrl: source.toString(), novelTitle: cleanNovelTitle, chapterTitle, paragraphs, previousChapterUrl: findChapterLink($, 'prev', source), nextChapterUrl: findChapterLink($, 'next', source), novelUrl: findNovelLink($, source), chapters: findChapterLinks($, source, chapterTitle) };
}

export async function fetchWikiCvChapter(sourceUrl: string, redirectDepth = 0): Promise<Chapter> {
  if (redirectDepth > 3) throw new Error('Too many redirects.');
  const url = validateWikiCvUrl(sourceUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'manual', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || !isSameWikiCvHost(location)) throw new Error('WikiCV returned an unsafe redirect.');
      return fetchWikiCvChapter(new URL(location, url).toString(), redirectDepth + 1);
    }
    if (!response.ok) throw new Error(`WikiCV responded with ${response.status}.`);
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 8_000_000) throw new Error('The WikiCV page is too large.');
    const html = await response.text();
    if (html.length > 10_000_000) throw new Error('The WikiCV page is too large.');
    return parseWikiCvChapter(html, url.toString());
  } finally { clearTimeout(timer); }
}

export async function fetchWikiCvNovel(sourceUrl: string): Promise<NovelIndex> {
  const url = validateWikiCvNovelUrl(sourceUrl);
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`WikiCV responded with ${response.status}.`);
  return parseWikiCvNovel(await response.text(), url.toString());
}

function isSameWikiCvHost(value: string): boolean { try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'wikicv.org' || url.hostname === 'www.wikicv.org'); } catch { return false; } }
