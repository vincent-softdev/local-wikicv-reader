import type { Chapter } from '../types';
export async function fetchChapter(url: string): Promise<Chapter> {
  const response = await fetch(`/api/chapter?url=${encodeURIComponent(url)}`);
  const data = await response.json() as Chapter & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Không thể tải chương truyện.');
  return data;
}
