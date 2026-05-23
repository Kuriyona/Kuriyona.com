import { defineContentConfig, defineCollection } from '@nuxt/content';
import { z } from 'zod';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        cwd: './app/content',
      },
      schema: z.object({
        title: z.string(),
        desc: z.string(),
        date: z.string(),
        edit: z.string(),
      }),
    }),
  },
});
