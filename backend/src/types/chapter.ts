export interface Chapter {
  sourceUrl: string;
  novelTitle: string;
  chapterTitle: string;
  paragraphs: string[];
  previousChapterUrl?: string;
  nextChapterUrl?: string;
  novelUrl?: string;
  chapters: ChapterLink[];
}

export interface ChapterLink {
  title: string;
  url: string;
}

export interface NovelIndex {
  sourceUrl: string;
  title: string;
  chapters: ChapterLink[];
}

export class ChapterParseError extends Error {}
