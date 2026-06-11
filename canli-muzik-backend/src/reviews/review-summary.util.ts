export function shouldRefreshReviewSummary(totalCount: number): boolean {
  return totalCount > 0 && totalCount % 5 === 0;
}
