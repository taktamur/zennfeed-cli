#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { fetchLatestArticles } from "./src/api.ts";
import { extractContent } from "./src/content.ts";
import { FeedFilter } from "./src/types.ts";

/**
 * メイン関数
 */
async function main() {
  const args = parse(Deno.args, {
    string: ["count", "keyword", "type", "url", "content"],
    boolean: ["help"],
    default: { count: "20", type: "all" },
    alias: {
      h: "help",
      c: "content",
      u: "url",
    },
  });

  // ヘルプの表示
  if (args.help) {
    showHelp();
    return;
  }

  // URL指定での本文取得モード
  if (args.url) {
    await handleContentExtraction(args.url);
    return;
  }

  // フィード取得モード
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

  // コンテンツ取得フラグが指定されている場合は最初の記事の本文も取得
  if (args.content && result.value.length > 0) {
    const firstArticle = result.value[0];
    await handleContentExtraction(firstArticle.link);
    return;
  }
  
  console.log(JSON.stringify({ articles: result.value }, null, 2));
}

/**
 * URLから記事情報を抽出して表示する
 */
async function handleContentExtraction(url: string) {
  const result = await extractContent(url);
  
  if (!result.ok) {
    console.error(JSON.stringify({ error: result.error }, null, 2));
    Deno.exit(1);
  }
  
  // 構造化されたデータをそのまま表示
  console.log(JSON.stringify(result.value, null, 2));
}

/**
 * ヘルプメッセージを表示する
 */
function showHelp() {
  console.log(`
ZennFeed CLI - Zenn.devの記事を取得・表示するツール

使用方法:
  deno run --allow-net mod.ts [options]

オプション:
  --help, -h          このヘルプメッセージを表示
  --type TYPE         フィードタイプ (all, topic, user) (デフォルト: all)
  --keyword KEYWORD   トピックまたはユーザー名 (typeがtopicまたはuserの場合は必須)
  --count COUNT       取得する記事数 (デフォルト: 20)
  --url, -u URL       指定したURLの記事本文を抽出
  --content, -c       最初の記事の本文も取得して表示

例:
  deno run --allow-net mod.ts
  deno run --allow-net mod.ts --type topic --keyword typescript
  deno run --allow-net mod.ts --type user --keyword taktamur
  deno run --allow-net mod.ts --url https://zenn.dev/taktamur/articles/b5a26613e7261e
  `);
}

if (import.meta.main) {
  await main();
}