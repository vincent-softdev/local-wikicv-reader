export interface LocalChapterMeta {
  number: number;
  title: string;
  file: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  read?: boolean;
}

export interface LocalStoryMeta {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  chapters: LocalChapterMeta[];
  sourceUrl?: string;
  rating?: number;
  unread?: boolean;
  lastReadChapter?: number;
}

export interface LocalChapter extends LocalChapterMeta {
  story: string;
  storyTitle: string;
  content: string;
  previousSourceUrl?: string;
  nextSourceUrl?: string;
}
