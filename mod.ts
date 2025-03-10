#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { fetchLatestArticles } from "./api.ts";
import { FeedType } from "./types.ts";

/**
 * メイン関数
 */
async function main() {
  const args = parse(Deno.args, {
    string: ["count", "keyword", "type"],
    default: { count: "20" },
  });

  const count = parseInt(args.count);
  const keyword = args.keyword as string;
  const type = args.type as FeedType;
  
  const result = await fetchLatestArticles({
    count,
    keyword,
    type,
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