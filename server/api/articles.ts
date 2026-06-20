import { type ArticleMeta, getArticles } from '../utils';

export default defineEventHandler(async () => {
  const Articles_ = (await getArticles()) as ArticleMeta[];
  const articles = Articles_.map((article) => {
    delete article.content;
    return article;
  });
  return articles;
});
