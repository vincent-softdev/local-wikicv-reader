import * as cheerio from 'cheerio';
import { Chapter, ChapterParseError } from '../types/chapter.js';
import { validateWikiCvUrl } from '../utils/validateWikiCvUrl.js';

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
  const candidates = $('a').toArray().map((el) => ({ text: clean($(el).text()), href: $(el).attr('href') })).filter((x) => x.href && labels.test(x.text));
  const href = candidates[0]?.href;
  if (!href) return undefined;
  try { const url = new URL(href, source); return url.hostname.endsWith('wikicv.org') ? url.toString() : undefined; } catch { return undefined; }
}

export function parseWikiCvChapter(html: string, sourceUrl: string): Chapter {
  const source = validateWikiCvUrl(sourceUrl);
  const $ = cheerio.load(html);
  $('script,style,noscript').remove();
  const novelTitle = firstText($, ['[class*="novel-title"]', '.book-title', '.truyen-title', '[class*="book-name"]', 'meta[property="og:site_name"]']) || 'WikiCV';
  const chapterTitle = firstText($, ['[class*="chapter-title"]', '.chapter-name', '.entry-title', 'h2', 'h1']) || clean($('title').text());
  const paragraphs = extractParagraphs($);
  if (!paragraphs.length) throw new ChapterParseError('The page loaded but the chapter content could not be identified.');
  return { sourceUrl: source.toString(), novelTitle: novelTitle.replace(chapterTitle, '').trim() || novelTitle, chapterTitle, paragraphs, previousChapterUrl: findChapterLink($, 'prev', source), nextChapterUrl: findChapterLink($, 'next', source) };
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

function isSameWikiCvHost(value: string): boolean { try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'wikicv.org' || url.hostname === 'www.wikicv.org'); } catch { return false; } }
