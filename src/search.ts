import { Article } from "./types.ts";

/**
 * 記事一覧からキーワードにマッチする記事をフィルタリングする
 * @param articles 記事一覧
 * @param searchQuery 検索キーワード
 * @returns 検索キーワードにマッチする記事一覧
 */
export function searchArticles(
  articles: Article[],
  searchQuery: string,
): Article[] {
  if (!searchQuery) {
    return articles;
  }

  const query = searchQuery.toLowerCase();
  return articles.filter((article) => {
    return article.title.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query);
  });
}
