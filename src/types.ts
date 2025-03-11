// FeedEntryの型定義
export interface ExtendedFeedEntry {
  title?: { value: string };
  links?: Array<{ href: string }>;
  published?: string | Date;
  dc?: {
    creator?: string;
  };
}

export type Article = {
  title: string;
  link: string;
  pubDate: string;
  pubDateFormatted: string;
  author: string;
};

/**
 * フィードの記事一覧と取得元URL
 */
export type Feed = {
  articles: Article[];
  feedUrl: string;
};

/**
 * Markdown形式のコンテンツを表す型
 */
export type MarkdownContent = string;

/**
 * 記事の詳細コンテンツ
 */
export type ArticleContent = {
  title: string;
  content: MarkdownContent; // Markdown形式で保持
  author: string;
  published: string;
  url: string;
  tags: string[];
};

export type Result<T, E> = {
  ok: true;
  value: T;
} | {
  ok: false;
  error: E;
};

export type FeedType = "all" | "topic" | "user";

export type FeedFilter =
  | { type: "all" }
  | { type: "topic"; keyword: string }
  | { type: "user"; keyword: string };

/**
 * 出力フォーマットの種類
 */
export type OutputFormat = "text" | "json" | "markdown";
