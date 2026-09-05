export interface Chapter {
  sourceUrl: string;
  novelTitle: string;
  chapterTitle: string;
  paragraphs: string[];
  previousChapterUrl?: string;
  nextChapterUrl?: string;
}

export class ChapterParseError extends Error {}
