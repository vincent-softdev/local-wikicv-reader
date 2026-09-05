import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseWikiCvChapter } from '../src/services/wikicvScraper.js';

describe('WikiCV parser', () => {
  it('extracts clean chapter data from representative markup', () => {
    const html = readFileSync(new URL('./fixtures/chapter.html', import.meta.url), 'utf8');
    const chapter = parseWikiCvChapter(html, 'https://wikicv.org/truyen/mau/chuong-3-mot-ngay');
    expect(chapter.novelTitle).toBe('Truyện mẫu');
    expect(chapter.chapterTitle).toContain('Chương 3');
    expect(chapter.paragraphs).toHaveLength(2);
    expect(chapter.paragraphs.join(' ')).not.toContain('Không được đưa vào');
    expect(chapter.nextChapterUrl).toBe('https://wikicv.org/truyen/mau/chuong-4-moi');
  });
});
