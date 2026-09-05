export interface Chapter { sourceUrl: string; novelTitle: string; chapterTitle: string; paragraphs: string[]; previousChapterUrl?: string; nextChapterUrl?: string; }
export interface HistoryItem { novelTitle: string; chapterTitle: string; url: string; lastParagraph: number; totalParagraphs: number; updatedAt: string; }
