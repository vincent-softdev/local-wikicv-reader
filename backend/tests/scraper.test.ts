import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseWikiCvChapter, parseWikiCvNovel } from '../src/services/wikicvScraper.js';

describe('WikiCV parser', () => {
  it('extracts clean chapter data from representative markup', () => {
    const html = readFileSync(new URL('./fixtures/chapter.html', import.meta.url), 'utf8');
    const chapter = parseWikiCvChapter(html, 'https://wikicv.org/truyen/mau/chuong-3-mot-ngay');
    expect(chapter.novelTitle).toBe('Truyện mẫu');
    expect(chapter.chapterTitle).toContain('Chương 3');
    expect(chapter.paragraphs).toHaveLength(2);
    expect(chapter.paragraphs.join(' ')).not.toContain('Không được đưa vào');
    expect(chapter.nextChapterUrl).toBe('https://wikicv.org/truyen/mau/chuong-4-moi');
    expect(chapter.chapters).toHaveLength(1);
    expect(chapter.chapters[0].title).toContain('Chương 3');
    expect(chapter.novelUrl).toBe('https://wikicv.org/truyen/mau-Xcode');
  });

  it('reads the WikiCV index link and chapter list markup', () => {
    const html = '<h1 class="book-title">Truyện mẫu</h1><ul><li class="chapter-name"><a class="truncate" href="/truyen/mau/chuong-1-mo-dau-X1">Chương 1 mở đầu</a></li><li class="chapter-name"><a class="truncate" href="/truyen/mau/chuong-2-tiep-X2">Chương 2 tiếp</a></li></ul>';
    const novel = parseWikiCvNovel(html, 'https://wikicv.org/truyen/mau-Xcode');
    expect(novel.chapters).toHaveLength(2);
    expect(novel.chapters[1]).toEqual({ title: 'Chương 2 tiếp', url: 'https://wikicv.org/truyen/mau/chuong-2-tiep-X2' });
  });
});
