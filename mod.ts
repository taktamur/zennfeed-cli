#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { parseFeed } from "https://deno.land/x/rss@1.0.0/mod.ts";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  pubDateFormatted: string;
  author: string;
};

type Result<T, E> = {
  ok: true;
  value: T;
} | {
  ok: false;
  error: E;
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    }).format(date);
  } catch (error) {
    return dateStr;
  }
}

async function fetchLatestArticles(count = 20): Promise<Result<Article[], string>> {
  try {
    const response = await fetch("https://zenn.dev/feed");
    
    if (!response.ok) {
      return { 
        ok: false, 
        error: `APIリクエストに失敗しました: ${response.status} ${response.statusText}` 
      };
    }
    
    const xml = await response.text();
    const feed = await parseFeed(xml);
    
    if (!feed || !feed.entries) {
      return { ok: false, error: "フィードの解析に失敗しました" };
    }
    
    const articles: Article[] = [];
    
    for (let i = 0; i < Math.min(feed.entries.length, count); i++) {
      const entry = feed.entries[i];
      
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
      if (!author && entry.dc && entry.dc.creator) {
        author = entry.dc.creator;
      }
      
      const pubDate = entry.published || "";
      
      articles.push({
        title: entry.title?.value || "",
        link: link,
        pubDate: pubDate,
        pubDateFormatted: formatDate(pubDate),
        author: author,
      });
    }
    
    return { ok: true, value: articles };
  } catch (error) {
    return { ok: false, error: `エラーが発生しました: ${error.message}` };
  }
}

async function main() {
  const args = parse(Deno.args, {
    string: ["count"],
    default: { count: "20" },
  });

  const count = parseInt(args.count);
  
  const result = await fetchLatestArticles(count);
  
  if (!result.ok) {
    console.error(JSON.stringify({ error: result.error }, null, 2));
    Deno.exit(1);
  }
  
  console.log(JSON.stringify({ articles: result.value }, null, 2));
}

if (import.meta.main) {
  await main();
}