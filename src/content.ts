import { ArticleContent, Result } from "./types.ts";
import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";

/**
 * URLから記事情報を抽出する
 */
export async function extractContent(
  url: string,
): Promise<Result<ArticleContent, string>> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        error:
          `コンテンツの取得に失敗しました: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // 記事情報の抽出
    const articleContent = extractArticleContent(html, url);

    if (!articleContent.content) {
      return { ok: false, error: "本文の抽出に失敗しました" };
    }

    return { ok: true, value: articleContent };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `エラーが発生しました: ${errorMessage}` };
  }
}

/**
 * HTMLから記事の構造化情報を抽出する
 */
function extractArticleContent(html: string, url: string): ArticleContent {
  const result: ArticleContent = {
    title: "",
    content: "",
    author: "",
    published: "",
    url,
    tags: [],
  };

  // DOMパーサーを使用してHTMLを解析
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  if (!document) {
    return result;
  }

  // タイトルの抽出
  // 1. og:titleメタタグから
  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  if (ogTitleMeta && ogTitleMeta.getAttribute("content")) {
    result.title = decodeHTMLEntities(
      ogTitleMeta.getAttribute("content")!.trim(),
    );
  } // 2. タイトルタグから
  else if (document.querySelector("title")) {
    result.title = decodeHTMLEntities(
      document.querySelector("title")!.textContent.trim(),
    );
  } // 3. h1タグから
  else if (document.querySelector("h1")) {
    result.title = decodeHTMLEntities(
      document.querySelector("h1")!.textContent.trim(),
    );
  }

  // 著者名の抽出
  // 1. user-nameクラスから
  const userNameElement = document.querySelector(".user-name");
  if (userNameElement) {
    result.author = decodeHTMLEntities(userNameElement.textContent.trim());
  } // 2. ContentStickyNavForMobile_displayName__cmEagクラスから
  else if (
    document.querySelector(".ContentStickyNavForMobile_displayName__cmEag")
  ) {
    result.author = decodeHTMLEntities(
      document.querySelector(".ContentStickyNavForMobile_displayName__cmEag")!
        .textContent.trim(),
    );
  }
  // 3. URLからも著者名を抽出（バックアップ）
  if (!result.author) {
    const urlAuthorMatch = url.match(/https:\/\/zenn\.dev\/([^\/]+)/);
    if (urlAuthorMatch && urlAuthorMatch[1]) {
      result.author = urlAuthorMatch[1];
    }
  }

  // 公開日の抽出
  // 1. article:published_timeメタタグから
  const publishedTimeMeta = document.querySelector(
    'meta[property="article:published_time"]',
  );
  if (publishedTimeMeta && publishedTimeMeta.getAttribute("content")) {
    try {
      const date = new Date(publishedTimeMeta.getAttribute("content")!);
      result.published = date.toISOString().split("T")[0]; // YYYY-MM-DD形式
    } catch (_) {
      // 日付のパースに失敗した場合は次の方法を試す
    }
  }

  // 2. 日本語表記の公開日を含むテキストから抽出
  if (!result.published) {
    const pubDateElements = Array.from(
      document.querySelectorAll(".ArticleHeader_pubDate__gF_sc"),
    );
    for (const element of pubDateElements) {
      const text = element.textContent.trim();
      const dateMatch = text.match(/(\d{4})\/(\d{2})\/(\d{2})[^\d]*に公開/);
      if (dateMatch) {
        result.published = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        break;
      }
    }
  }

  // タグの抽出
  // 1. トピックリンクから抽出
  const topicLinks = document.querySelectorAll("a.View_topicLink__jdtX_");
  for (const link of Array.from(topicLinks)) {
    const href = link.getAttribute("href");
    if (!href) continue;

    const topicSlug = href.replace("/topics/", "");
    const topicNameElement = link.querySelector(".View_topicName____nYp");

    if (topicNameElement) {
      const topicName = topicNameElement.textContent.trim();

      // スラッグとトピック名のどちらかを適切に選択
      const tagToAdd = topicName.toLowerCase() === "tech"
        ? "tech"
        : topicName.match(/^[a-zA-Z0-9_\-\.]+$/)
        ? topicName
        : topicSlug;

      if (tagToAdd && !result.tags.includes(tagToAdd)) {
        result.tags.push(tagToAdd);
      }
    }
  }

  // 2. メタデータからキーワード抽出
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta && keywordsMeta.getAttribute("content")) {
    const keywords = keywordsMeta.getAttribute("content")!.split(",").map(
      (kw) => kw.trim(),
    );
    for (const keyword of keywords) {
      if (keyword && !result.tags.includes(keyword)) {
        result.tags.push(keyword);
      }
    }
  }

  // 3. コンテンツからの一般的なタグの検出（バックアップ）
  if (result.tags.length === 0) {
    const textContent = document.body ? document.body.textContent : "";
    const potentialTags = [
      "macOS",
      "Docker",
      "TypeScript",
      "JavaScript",
      "React",
      "Vue",
      "Node.js",
      "Python",
      "Go",
      "Rust",
      "AWS",
      "Azure",
      "GCP",
      "Kubernetes",
    ];

    for (const tag of potentialTags) {
      if (textContent.includes(tag) && !result.tags.includes(tag)) {
        result.tags.push(tag);
      }
    }

    // "tech" タグは頻出するので、コンテンツに含まれていない場合でもデフォルトで追加
    if (!result.tags.includes("tech")) {
      result.tags.push("tech");
    }
  }

  // 本文の抽出
  let mainElement = null;

  // 1. zncクラスを持つdivを探す (Zennの記事本文)
  mainElement = document.querySelector("div.znc");

  // 2. article-bodyクラスを持つdivを探す
  if (!mainElement) {
    mainElement = document.querySelector('div[class*="article-body"]');
  }

  // 3. articleタグ内を探す
  if (!mainElement) {
    mainElement = document.querySelector("article");
  }

  // 本文テキストの抽出と整形
  let mainText = "";
  if (mainElement) {
    mainText = extractTextFromElement(mainElement);
  }

  // 不要なテキストを削除
  mainText = mainText
    .replace(/バッジを贈って著者を応援しよう.*/gs, "")
    .replace(/Discussion.*/gs, "")
    .replace(/目次.*/gs, "");

  result.content = mainText.trim();

  // タイトルがまだ取得できていない場合、文章の最初の部分から推測
  if (!result.title && mainText.length > 10) {
    // 最初の文またはセクションをタイトルとして使用
    const firstSentence = mainText.split(/\.\s+/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 100) {
      result.title = firstSentence;
    }
  }

  return result;
}

/**
 * DOMエレメントからテキストを抽出する補助関数
 */
function extractTextFromElement(element: Element): string {
  // 不要な要素を除外
  const scriptElements = element.querySelectorAll(
    "script, style, svg, pre, code",
  );
  for (const el of Array.from(scriptElements)) {
    (el as Element).remove();
  }

  // テキストを抽出し整形
  const text = element.textContent
    .replace(/\s{2,}/g, " ") // 連続する空白文字を1つのスペースに置換
    .trim();

  return decodeHTMLEntities(text);
}

/**
 * HTML文字実体参照をデコードする
 */
export function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, hex) => String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}
