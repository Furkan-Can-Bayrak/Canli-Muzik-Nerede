import { shouldRefreshReviewSummary } from './review-summary.util';

describe('shouldRefreshReviewSummary', () => {
  it('returns false for 0 reviews', () => {
    expect(shouldRefreshReviewSummary(0)).toBe(false);
  });

  it('returns true at multiples of 5', () => {
    expect(shouldRefreshReviewSummary(5)).toBe(true);
    expect(shouldRefreshReviewSummary(10)).toBe(true);
    expect(shouldRefreshReviewSummary(15)).toBe(true);
  });

  it('returns false between multiples of 5', () => {
    expect(shouldRefreshReviewSummary(1)).toBe(false);
    expect(shouldRefreshReviewSummary(4)).toBe(false);
    expect(shouldRefreshReviewSummary(6)).toBe(false);
    expect(shouldRefreshReviewSummary(9)).toBe(false);
  });
});
