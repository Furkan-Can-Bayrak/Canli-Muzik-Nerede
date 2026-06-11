import type { Review, User } from '@prisma/client';

type ReviewWithAuthor = Review & {
  author: User & {
    customerProfile: { displayName: string | null } | null;
    cafeProfile: { name: string } | null;
    bandProfile: { bandName: string } | null;
  };
};

export function authorDisplayName(
  author: ReviewWithAuthor['author'],
): string {
  if (author.customerProfile?.displayName?.trim()) {
    return author.customerProfile.displayName.trim();
  }
  if (author.cafeProfile?.name) return author.cafeProfile.name;
  if (author.bandProfile?.bandName) return author.bandProfile.bandName;
  return 'Kullanıcı';
}

export function presentReview(review: ReviewWithAuthor) {
  return {
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    authorName: authorDisplayName(review.author),
    authorUserId: review.authorUserId,
  };
}
