import {
  escapeLikePattern,
  normalizeSearchText,
  turkishLikePattern,
} from './search-text.util';

describe('normalizeSearchText', () => {
  it('folds Turkish letters and case', () => {
    expect(normalizeSearchText('Kadıköy')).toBe('kadikoy');
    expect(normalizeSearchText('kadikoy')).toBe('kadikoy');
    expect(normalizeSearchText('  ŞÖĞÜÇ  ')).toBe('soguc');
  });

  it('handles Turkish I/İ rules', () => {
    expect(normalizeSearchText('İstanbul')).toBe('istanbul');
    expect(normalizeSearchText('Istanbul')).toBe('istanbul');
    expect(normalizeSearchText('ISTANBUL')).toBe('istanbul');
    expect(normalizeSearchText('ılıca')).toBe('ilica');
  });
});

describe('escapeLikePattern', () => {
  it('escapes SQL LIKE wildcards', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });
});

describe('turkishLikePattern', () => {
  it('returns null for blank input', () => {
    expect(turkishLikePattern('   ')).toBeNull();
  });

  it('builds normalized LIKE pattern', () => {
    expect(turkishLikePattern('Kadıköy')).toBe('%kadikoy%');
  });
});
