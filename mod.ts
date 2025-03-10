#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { fetchLatestArticles } from "./src/api.ts";
import { FeedFilter } from "./src/types.ts";

/**
 * メイン関数
 */
async function main() {
  const args = parse(Deno.args, {
    string: ["count", "keyword", "type"],
    default: { count: "20", type: "all" },
  });

  const count = parseInt(args.count);
  const keyword = args.keyword as string;
  const type = args.type as "all" | "topic" | "user";
  
  // フィルターの構築
  let filter: FeedFilter;
  if (type === "all") {
    filter = { type: "all" };
  } else if (type === "topic" && keyword) {
    filter = { type: "topic", keyword };
  } else if (type === "user" && keyword) {
    filter = { type: "user", keyword };
  } else if ((type === "topic" || type === "user") && !keyword) {
    console.error(JSON.stringify({ 
      error: "keywordパラメータが必要です" 
    }, null, 2));
    Deno.exit(1);
    // TypeScriptの型チェックのため
    filter = { type: "all" };
  } else {
    filter = { type: "all" };
  }
  
  const result = await fetchLatestArticles({
    count,
    filter,
  });
  
  if (!result.ok) {
    console.error(JSON.stringify({ error: result.error }, null, 2));
    Deno.exit(1);
  }
  
  console.log(JSON.stringify({ articles: result.value }, null, 2));
}

if (import.meta.main) {
  await main();
}