import type { AiReview } from '~~/server/utils';

export const AI_REVIEW_KEYS: Record<AiReview, string> = {
  粗略核对: 'blog.ai-review-rough',
  基本核对: 'blog.ai-review-basic',
  充分核对: 'blog.ai-review-full',
};
