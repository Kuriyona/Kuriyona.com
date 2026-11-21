import type { AiReview } from '~~/server/utils';

export const AI_REVIEW_KEYS: Record<AiReview, string> = {
  rough: 'blog.ai-review-rough',
  basic: 'blog.ai-review-basic',
  full: 'blog.ai-review-full',
};
