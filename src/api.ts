import { parseFeed } from "https://deno.land/x/rss@1.0.0/mod.ts";
import { Article, ExtendedFeedEntry, FeedFilter, Result } from "./types.ts";
import { formatDate } from "./utils.ts";

/**
 * フィルターに基づいてZennのフィードURLを生成する
 */
export function buildFeedUrl(filter: FeedFilter): string {
  if (filter.type === "all") {
    return "https://zenn.dev/feed";
  } else if (filter.type === "topic") {
    return `https://zenn.dev/topics/${filter.keyword}/feed`;
  } else {
    return `https://zenn.dev/${filter.keyword}/feed`;
  }
}

/**
 * Zennの最新記事を取得する
 */
export async function fetchLatestArticles(
  options: { count?: number; filter?: FeedFilter } = {},
): Promise<Result<{ articles: Article[]; feedUrl: string }, string>> {
  try {
    const { count = 20, filter = { type: "all" } } = options;
    const url = buildFeedUrl(filter);

    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        error:
          `APIリクエストに失敗しました: ${response.status} ${response.statusText}`,
      };
    }

    const xml = await response.text();
    const feed = await parseFeed(xml);

    if (!feed || !feed.entries) {
      return { ok: false, error: "フィードの解析に失敗しました" };
    }

    const articles: Article[] = [];

    for (let i = 0; i < Math.min(feed.entries.length, count); i++) {
      const entry = feed.entries[i] as ExtendedFeedEntry;

      // URLから著者名を抽出
      let author = "";
      const link = entry.links?.[0]?.href || "";
      if (link) {
        const match = link.match(/https:\/\/zenn\.dev\/([^\/]+)/);
        if (match && match[1]) {
          author = match[1];
        }
      }

      // Dublin Coreの情報も確認
      if (!author && entry.dc?.creator) {
        author = entry.dc.creator;
      }

      const pubDate = entry.published || "";
      const pubDateStr = typeof pubDate === "string"
        ? pubDate
        : pubDate.toISOString();

      articles.push({
        title: entry.title?.value || "",
        link: link,
        pubDate: pubDateStr,
        pubDateFormatted: formatDate(pubDateStr),
        author: author,
      });
    }

    return { ok: true, value: { articles, feedUrl: url } };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `エラーが発生しました: ${errorMessage}` };
  }
}
