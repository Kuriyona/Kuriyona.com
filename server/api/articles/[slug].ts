import { type Article, getArticles } from '../../utils';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  const article = await getArticles();
  return article;
});
