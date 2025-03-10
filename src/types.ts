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