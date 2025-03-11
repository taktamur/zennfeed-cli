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
 * Markdown形式のコンテンツを表すクラス
 * 単なるstringと区別するための型安全なクラス
 */
export class MarkdownContent {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * 文字列からMarkdownContentを作成する
   */
  static create(content: string): MarkdownContent {
    return new MarkdownContent(content);
  }

  /**
   * 空のMarkdownContentを作成する
   */
  static empty(): MarkdownContent {
    return new MarkdownContent("");
  }

  /**
   * 文字列に変換する
   */
  toString(): string {
    return this.value;
  }

  /**
   * 内容を置換する
   */
  replace(pattern: RegExp, replacement: string): MarkdownContent {
    return new MarkdownContent(this.value.replace(pattern, replacement));
  }

  /**
   * 内容をトリムする
   */
  trim(): MarkdownContent {
    return new MarkdownContent(this.value.trim());
  }

  /**
   * 内容の長さを取得する
   */
  get length(): number {
    return this.value.length;
  }
}

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
