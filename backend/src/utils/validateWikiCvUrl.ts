const ALLOWED_HOSTS = new Set(['wikicv.org', 'www.wikicv.org']);

export function validateWikiCvUrl(value: string): URL {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('Chỉ hỗ trợ link truyện từ WikiCV.'); }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) throw new Error('Chỉ hỗ trợ link truyện từ WikiCV.');
  if (!/^\/truyen\/[^/]+(?:\/(?:chuong|phan)(?:-[^/]+)+)?\/?$/i.test(parsed.pathname)) throw new Error('Vui lòng nhập link truyện hoặc chương truyện WikiCV hợp lệ.');
  parsed.hash = '';
  return parsed;
}

export function validateWikiCvNovelUrl(value: string): URL {
  const parsed = validateWikiCvUrl(value);
  if (/(?:\/chuong|\/phan)(?:-|\/)/i.test(parsed.pathname)) throw new Error('Đây là link chương, không phải link trang truyện.');
  return parsed;
}

export function isAllowedWikiCvUrl(value: string): boolean {
  try { validateWikiCvUrl(value); return true; } catch { return false; }
}
