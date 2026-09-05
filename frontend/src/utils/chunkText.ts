export function chunkText(text: string, maxLength = 220): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = []; let remaining = text.trim();
  const punctuation = /(?<=[.!?。！？…])\s+/g;
  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength + 1);
    const matches = [...candidate.matchAll(punctuation)];
    let cut = matches.at(-1)?.index ?? -1;
    if (cut < Math.floor(maxLength * 0.45)) {
      const comma = Math.max(candidate.lastIndexOf(', '), candidate.lastIndexOf('; '), candidate.lastIndexOf('，'), candidate.lastIndexOf('；'), candidate.lastIndexOf(' '));
      cut = comma;
    }
    if (cut <= 0) cut = maxLength;
    chunks.push(remaining.slice(0, cut).trim()); remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.filter(Boolean);
}
