#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { fetchLatestArticles } from "./src/api.ts";
import { extractContent } from "./src/content.ts";
import { FeedFilter } from "./src/types.ts";

/**
 * メイン関数 - サブコマンドをハンドリング
 */
async function main() {
  // まず最初の引数（サブコマンド）を処理
  const subcommand = Deno.args[0];
  const restArgs = Deno.args.slice(1);

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    showHelp();
    return;
  }

  switch (subcommand) {
    case "feed":
      await handleFeedCommand(restArgs);
      break;
    case "article":
      await handleArticleCommand(restArgs);
      break;
    default:
      console.error(JSON.stringify(
        {
          error: `不明なコマンド: ${subcommand}`,
        },
        null,
        2,
      ));
      showHelp();
      Deno.exit(1);
  }
}

/**
 * フィード取得コマンドの処理
 */
async function handleFeedCommand(args: string[]) {
  const parsedArgs = parse(args, {
    string: ["count", "keyword", "type"],
    boolean: ["help"],
    default: { count: "20", type: "all" },
    alias: {
      h: "help",
    },
  });

  if (parsedArgs.help) {
    showFeedHelp();
    return;
  }

  const count = parseInt(parsedArgs.count);
  const keyword = parsedArgs.keyword as string;
  const type = parsedArgs.type as "all" | "topic" | "user";

  // フィルターの構築
  let filter: FeedFilter;
  if (type === "all") {
    filter = { type: "all" };
  } else if (type === "topic" && keyword) {
    filter = { type: "topic", keyword };
  } else if (type === "user" && keyword) {
    filter = { type: "user", keyword };
  } else if ((type === "topic" || type === "user") && !keyword) {
    console.error(JSON.stringify(
      {
        error: "keywordパラメータが必要です",
      },
      null,
      2,
    ));
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

  // 記事一覧のみを表示
  const output = {
    articles: result.value,
  };
  console.log(JSON.stringify(output, null, 2));
}

/**
 * 記事取得コマンドの処理
 */
async function handleArticleCommand(args: string[]) {
  const parsedArgs = parse(args, {
    string: ["url"],
    boolean: ["help"],
    alias: {
      h: "help",
      u: "url",
    },
  });

  if (parsedArgs.help) {
    showArticleHelp();
    return;
  }

  const url = parsedArgs.url;
  if (!url) {
    console.error(JSON.stringify(
      {
        error: "URLパラメータが必要です",
      },
      null,
      2,
    ));
    showArticleHelp();
    Deno.exit(1);
    return;
  }

  const result = await extractContent(url);

  if (!result.ok) {
    console.error(JSON.stringify({ error: result.error }, null, 2));
    Deno.exit(1);
  }

  // 構造化されたデータをそのまま表示
  console.log(JSON.stringify(result.value, null, 2));
}

/**
 * メインヘルプの表示
 */
function showHelp() {
  console.log(`
ZennFeed CLI - Zenn.devの記事を取得・表示するツール

使用方法:
  zennfeed <command> [options]

サブコマンド:
  feed      Zennの記事フィードを取得
  article   指定したURLの記事本文を抽出

詳細なオプションを確認するには:
  zennfeed feed --help
  zennfeed article --help

例:
  zennfeed feed
  zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
  `);
}

/**
 * feedコマンドのヘルプ表示
 */
function showFeedHelp() {
  console.log(`
ZennFeed CLI - フィード取得コマンド

使用方法:
  zennfeed feed [options]

オプション:
  --help, -h          このヘルプメッセージを表示
  --type TYPE         フィードタイプ (all, topic, user) (デフォルト: all)
  --keyword KEYWORD   トピックまたはユーザー名 (typeがtopicまたはuserの場合は必須)
  --count COUNT       取得する記事数 (デフォルト: 20)

例:
  zennfeed feed
  zennfeed feed --type topic --keyword typescript
  zennfeed feed --type user --keyword taktamur
  `);
}

/**
 * articleコマンドのヘルプ表示
 */
function showArticleHelp() {
  console.log(`
ZennFeed CLI - 記事本文取得コマンド

使用方法:
  zennfeed article --url <URL>

オプション:
  --help, -h          このヘルプメッセージを表示
  --url, -u URL       記事のURL（必須）

例:
  zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
  `);
}

if (import.meta.main) {
  await main();
}
