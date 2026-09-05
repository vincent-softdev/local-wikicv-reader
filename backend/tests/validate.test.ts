import { describe, expect, it } from 'vitest';
import { isAllowedWikiCvUrl } from '../src/utils/validateWikiCvUrl.js';

describe('WikiCV URL validation', () => {
  it('allows only HTTPS chapter URLs on WikiCV', () => {
    expect(isAllowedWikiCvUrl('https://wikicv.org/truyen/a/chuong-1-test')).toBe(true);
    expect(isAllowedWikiCvUrl('https://www.wikicv.org/truyen/a/chuong-1-test')).toBe(true);
    expect(isAllowedWikiCvUrl('https://google.com/truyen/a/chuong-1-test')).toBe(false);
    expect(isAllowedWikiCvUrl('http://wikicv.org/truyen/a/chuong-1-test')).toBe(false);
    expect(isAllowedWikiCvUrl('https://wikicv.org/')).toBe(false);
  });
});
