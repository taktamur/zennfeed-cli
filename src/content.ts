import { ArticleContent, MarkdownContent, Result } from "./types.ts";
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
    content: MarkdownContent.empty(),
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

  // 本文をMarkdown形式で抽出
  let mainContent = MarkdownContent.empty();
  if (mainElement) {
    mainContent = extractMarkdownFromElement(mainElement);
  }

  // 不要なテキストを削除
  const filteredContent = mainContent
    .replace(/バッジを贈って著者を応援しよう.*/gs, "")
    .replace(/Discussion.*/gs, "")
    .replace(/目次.*/gs, "");

  result.content = filteredContent.trim();

  // タイトルがまだ取得できていない場合、文章の最初の部分から推測
  if (!result.title && mainContent.length > 10) {
    // 最初の文またはセクションをタイトルとして使用（Markdownの記号を削除）
    const plainText = mainContent.toString().replace(/[#*`_~\[\]\(\)]/g, "");
    const firstSentence = plainText.split(/\.\s+/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 100) {
      result.title = firstSentence;
    }
  }

  return result;
}

// extractTextFromElementは使用しなくなったため削除

/**
 * DOMエレメントからMarkdownを抽出する関数
 */
function extractMarkdownFromElement(element: Element): MarkdownContent {
  // コピー要素を作成して不要なものを除外
  const clone = element.cloneNode(true) as Element;

  // 不要な要素を除外
  const scriptElements = clone.querySelectorAll(
    "script, style, svg",
  );
  for (const el of Array.from(scriptElements)) {
    (el as Element).remove();
  }

  // Markdown変換
  return convertElementToMarkdown(clone);
}

/**
 * HTMLエレメントをMarkdownに変換する
 */
function convertElementToMarkdown(element: Element): MarkdownContent {
  let markdown = "";

  // 子要素を再帰的に処理
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 3) { // テキストノード
      markdown += decodeHTMLEntities(child.textContent.trim());
      continue;
    }

    if (child.nodeType !== 1) continue; // 要素ノードでない場合はスキップ

    const el = child as Element;
    const tagName = el.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
        markdown += `\n\n# ${processInlineContent(el)}\n\n`;
        break;
      case "h2":
        markdown += `\n\n## ${processInlineContent(el)}\n\n`;
        break;
      case "h3":
        markdown += `\n\n### ${processInlineContent(el)}\n\n`;
        break;
      case "h4":
        markdown += `\n\n#### ${processInlineContent(el)}\n\n`;
        break;
      case "h5":
        markdown += `\n\n##### ${processInlineContent(el)}\n\n`;
        break;
      case "h6":
        markdown += `\n\n###### ${processInlineContent(el)}\n\n`;
        break;
      case "p":
        markdown += `\n\n${processInlineContent(el)}\n\n`;
        break;
      case "br":
        markdown += "\n";
        break;
      case "hr":
        markdown += "\n\n---\n\n";
        break;
      case "ul":
        markdown += "\n";
        for (const li of Array.from(el.querySelectorAll("li"))) {
          markdown += `\n- ${processInlineContent(li)}`;
        }
        markdown += "\n\n";
        break;
      case "ol": {
        markdown += "\n";
        const items = Array.from(el.querySelectorAll("li"));
        for (let i = 0; i < items.length; i++) {
          markdown += `\n${i + 1}. ${processInlineContent(items[i])}`;
        }
        markdown += "\n\n";
        break;
      }
      case "blockquote": {
        const quoteContent = convertElementToMarkdown(el)
          .toString()
          .trim()
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
        markdown += `\n\n${quoteContent}\n\n`;
        break;
      }
      case "pre": {
        const codeEl = el.querySelector("code");
        const code = codeEl ? codeEl.textContent : el.textContent;
        const codeClass = codeEl?.getAttribute("class") || "";
        const lang = codeClass.replace(/^language-/, "").trim() || "";
        markdown += `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
        break;
      }
      case "code":
        if (el.parentElement?.tagName.toLowerCase() !== "pre") {
          markdown += `\`${el.textContent.trim()}\``;
        }
        break;
      case "a": {
        const href = el.getAttribute("href") || "";
        markdown += `[${processInlineContent(el)}](${href})`;
        break;
      }
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        markdown += `![${alt}](${src})`;
        break;
      }
      case "strong":
      case "b":
        markdown += `**${processInlineContent(el)}**`;
        break;
      case "em":
      case "i":
        markdown += `*${processInlineContent(el)}*`;
        break;
      case "s":
      case "del":
        markdown += `~~${processInlineContent(el)}~~`;
        break;
      case "table":
        markdown += processTable(el);
        break;
      case "div":
      case "span":
      case "section":
      case "article": {
        // 一般的なコンテナ要素は子要素をそのまま処理
        const nestedContent = convertElementToMarkdown(el);
        markdown += nestedContent.toString();
        break;
      }
      default:
        // その他の要素は子要素をそのまま処理
        markdown += processInlineContent(el);
    }
  }

  return MarkdownContent.create(markdown.trim());
}

/**
 * インラインコンテンツの処理
 */
function processInlineContent(element: Element): string {
  let content = "";

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 3) { // テキストノード
      content += decodeHTMLEntities(child.textContent.trim());
      continue;
    }

    if (child.nodeType !== 1) continue;

    const el = child as Element;
    const tagName = el.tagName.toLowerCase();

    switch (tagName) {
      case "a": {
        const href = el.getAttribute("href") || "";
        content += `[${processInlineContent(el)}](${href})`;
        break;
      }
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        content += `![${alt}](${src})`;
        break;
      }
      case "strong":
      case "b":
        content += `**${processInlineContent(el)}**`;
        break;
      case "em":
      case "i":
        content += `*${processInlineContent(el)}*`;
        break;
      case "code":
        content += `\`${el.textContent.trim()}\``;
        break;
      case "s":
      case "del":
        content += `~~${processInlineContent(el)}~~`;
        break;
      case "br":
        content += " ";
        break;
      default:
        content += processInlineContent(el);
    }
  }

  return content.trim();
}

/**
 * テーブル要素をMarkdownに変換
 */
function processTable(tableElement: Element): string {
  let markdown = "\n\n";

  // ヘッダー行の処理
  const headerRow = tableElement.querySelector("thead tr");
  const headers: string[] = [];
  const separators: string[] = [];

  if (headerRow) {
    for (const th of Array.from(headerRow.querySelectorAll("th"))) {
      const text = processInlineContent(th).trim();
      headers.push(text);
      separators.push("-".repeat(Math.max(3, text.length)));
    }
  } else {
    // ヘッダーが無い場合は最初の行をヘッダーとして扱う
    const firstRow = tableElement.querySelector("tr");
    if (firstRow) {
      for (const td of Array.from(firstRow.querySelectorAll("td"))) {
        const text = processInlineContent(td).trim();
        headers.push(text);
        separators.push("-".repeat(Math.max(3, text.length)));
      }
    }
  }

  if (headers.length > 0) {
    markdown += `| ${headers.join(" | ")} |\n`;
    markdown += `| ${separators.join(" | ")} |\n`;
  }

  // データ行の処理
  const rows = tableElement.querySelectorAll("tbody tr");
  for (const row of Array.from(rows)) {
    const cells: string[] = [];
    for (const td of Array.from(row.querySelectorAll("td"))) {
      cells.push(processInlineContent(td).trim());
    }
    if (cells.length > 0) {
      markdown += `| ${cells.join(" | ")} |\n`;
    }
  }

  return markdown + "\n";
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
