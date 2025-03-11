#!/usr/bin/env -S deno run --allow-net

import { parse } from "https://deno.land/std@0.216.0/flags/mod.ts";
import { fetchLatestArticles } from "./src/api.ts";
import { extractContent } from "./src/content.ts";
import { FeedFilter, OutputFormat } from "./src/types.ts";
import { formatFeedOutput, formatArticleOutput } from "./src/utils.ts";

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
    string: ["count", "keyword", "type", "format"],
    boolean: ["help"],
    default: { count: "20", type: "all", format: "text" },
    alias: {
      h: "help",
      f: "format",
    },
  });

  if (parsedArgs.help) {
    showFeedHelp();
    return;
  }

  const count = parseInt(parsedArgs.count);
  const keyword = parsedArgs.keyword as string;
  const type = parsedArgs.type as "all" | "topic" | "user";
  const format = parsedArgs.format as OutputFormat;

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

  // 指定されたフォーマットで出力
  console.log(formatFeedOutput(result.value, format));
}

/**
 * 記事取得コマンドの処理
 */
async function handleArticleCommand(args: string[]) {
  const parsedArgs = parse(args, {
    string: ["url", "format"],
    boolean: ["help"],
    default: { format: "text" },
    alias: {
      h: "help",
      u: "url",
      f: "format",
    },
  });

  if (parsedArgs.help) {
    showArticleHelp();
    return;
  }

  const url = parsedArgs.url;
  const format = parsedArgs.format as OutputFormat;
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

  // 指定されたフォーマットで出力
  console.log(formatArticleOutput(result.value, format));
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
  --format, -f FORMAT 出力フォーマット (text, json, markdown) (デフォルト: text)

例:
  zennfeed feed
  zennfeed feed --type topic --keyword typescript
  zennfeed feed --type user --keyword taktamur
  zennfeed feed --format markdown
  `);
}

/**
 * articleコマンドのヘルプ表示
 */
function showArticleHelp() {
  console.log(`
ZennFeed CLI - 記事本文取得コマンド

使用方法:
  zennfeed article --url <URL> [options]

オプション:
  --help, -h          このヘルプメッセージを表示
  --url, -u URL       記事のURL（必須）
  --format, -f FORMAT 出力フォーマット (text, json, markdown) (デフォルト: text)

例:
  zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
  zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e --format markdown
  `);
}

if (import.meta.main) {
  await main();
}
