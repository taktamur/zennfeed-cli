import {
  Article,
  ArticleContent,
  MarkdownContent,
  OutputFormat,
} from "./types.ts";

/**
 * フィードの出力をフォーマットする
 * @param articles 記事リスト
 * @param format 出力フォーマット
 * @returns フォーマットされた出力
 */
export function formatFeedOutput(
  articles: Article[],
  format: OutputFormat = "text",
  feedUrl?: string,
): string {
  const feedHeader = feedUrl ? `Feed URL: ${feedUrl}\n\n` : "";

  switch (format) {
    case "json":
      return JSON.stringify({ feedUrl, articles }, null, 2);
    case "markdown": {
      const mdHeader = feedUrl ? `## Feed: [${feedUrl}](${feedUrl})\n\n` : "";
      return mdHeader + articles
        .map((article) =>
          `- [${article.title}](${article.link}) by ${article.author} - ${article.pubDateFormatted}`
        )
        .join("\n");
    }
    case "text":
    default:
      return feedHeader + articles
        .map((article) =>
          `${article.title}\n  ${article.link}\n  ${article.author} - ${article.pubDateFormatted}`
        )
        .join("\n\n");
  }
}

/**
 * Markdownコンテンツをプレーンテキストに変換する
 */
function markdownToText(markdown: MarkdownContent): string {
  return markdown
    // 見出し
    .replace(/^#+\s+/gm, "")
    // 太字
    .replace(/\*\*(.*?)\*\*/g, "$1")
    // 斜体
    .replace(/\*(.*?)\*/g, "$1")
    // インラインコード
    .replace(/`([^`]+)`/g, "$1")
    // リンク
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    // 画像
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "画像: $1")
    // 取り消し線
    .replace(/~~(.*?)~~/g, "$1")
    // 水平線
    .replace(/^---+$/gm, "----------")
    // リスト
    .replace(/^\s*[*+-]\s+/gm, "- ")
    .replace(/^\s*\d+\.\s+/gm, "* ")
    // コードブロック
    .replace(/```[\s\S]*?```/g, (match) => {
      // バッククォートとシンタックスハイライト用の言語指定を削除
      return match
        .replace(/```[a-zA-Z0-9]*\n/, "")
        .replace(/```$/, "")
        .trim();
    })
    // 引用
    .replace(/^>\s+/gm, "");
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
    case "json": {
      // JSON形式の場合は、コンテンツをテキスト形式に変換して出力
      const jsonContent = {
        ...content,
        content: markdownToText(content.content),
      };
      return JSON.stringify(jsonContent, null, 2);
    }
    case "markdown": {
      // Markdown形式の場合は、内部的にMarkdown形式で保持しているコンテンツをそのまま出力
      const tagsList = content.tags.length > 0
        ? `\n\nTags: ${content.tags.map((tag) => `\`${tag}\``).join(", ")}`
        : "";
      return `# ${content.title}\n\n` +
        `*By ${content.author} - ${content.published}*\n\n${content.content}${tagsList}`;
    }
    case "text":
    default: {
      // テキスト形式の場合は、Markdownをプレーンテキストに変換
      const plainTextContent = markdownToText(content.content);
      return `タイトル: ${content.title}\n` +
        `著者: ${content.author}\n` +
        `公開日: ${content.published}\n` +
        `URL: ${content.url}\n` +
        `タグ: ${content.tags.join(", ")}\n\n` +
        `${plainTextContent}`;
    }
  }
}
