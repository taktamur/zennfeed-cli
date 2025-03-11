import { Article, ArticleContent, OutputFormat } from "./types.ts";

/**
 * フィードの出力をフォーマットする
 * @param articles 記事リスト
 * @param format 出力フォーマット
 * @returns フォーマットされた出力
 */
export function formatFeedOutput(
  articles: Article[],
  format: OutputFormat = "text",
): string {
  switch (format) {
    case "json":
      return JSON.stringify({ articles }, null, 2);
    case "markdown":
      return articles
        .map((article) =>
          `- [${article.title}](${article.link}) by ${article.author} - ${article.pubDateFormatted}`
        )
        .join("\n");
    case "text":
    default:
      return articles
        .map((article) =>
          `${article.title}\n  ${article.link}\n  ${article.author} - ${article.pubDateFormatted}`
        )
        .join("\n\n");
  }
}

/**
 * 記事内容の出力をフォーマットする
 * @param content 記事内容
 * @param format 出力フォーマット
 * @returns フォーマットされた出力
 */
export function formatArticleOutput(
  content: ArticleContent,
  format: OutputFormat = "text",
): string {
  switch (format) {
    case "json":
      return JSON.stringify(content, null, 2);
    case "markdown": {
      const tagsList = content.tags.length > 0
        ? `\n\nTags: ${content.tags.map((tag) => `\`${tag}\``).join(", ")}`
        : "";
      return `# ${content.title}\n\n` +
        `*By ${content.author} - ${content.published}*\n\n${content.content}${tagsList}`;
    }
    case "text":
    default:
      return `タイトル: ${content.title}\n` +
        `著者: ${content.author}\n` +
        `公開日: ${content.published}\n` +
        `URL: ${content.url}\n` +
        `タグ: ${content.tags.join(", ")}\n\n` +
        `${content.content}`;
  }
}