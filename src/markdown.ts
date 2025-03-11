import { MarkdownContent } from "./types.ts";
import { Element } from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";

/**
 * DOMエレメントからMarkdownを抽出する関数
 */
export function extractMarkdownFromElement(element: Element): MarkdownContent {
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

  // 特殊なリンクのあるZennの段落を処理
  if (element.tagName.toLowerCase() === "p") {
    try {
      const html = element.outerHTML;
      // リンクを特定の形式に置き換える
      if (html.includes("<a ") && html.includes("href=")) {
        // リンクを [text](url) の形式に置き換え
        const processedHtml = html.replace(
          /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
          (_match, url, text) => {
            // 空のテキストの場合、URLの末尾を使用
            const linkText = text.trim()
              ? text.trim()
              : url.split("/").pop() || url;
            return `[${linkText}](${url})`;
          },
        );

        // HTMLタグを削除してテキストだけを取得
        const plainText = processedHtml
          .replace(/<[^>]*>/g, "") // HTMLタグを削除
          .replace(/\s+/g, " ") // 連続する空白を1つに
          .trim();

        if (plainText) {
          return MarkdownContent.create(`\n\n${plainText}\n\n`);
        }
      }
    } catch (_error) {
      // エラーの場合は通常の処理に進む
    }
  }

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
      case "p": {
        markdown += `\n\n${processInlineContent(el)}\n\n`;
        break;
      }
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
        // リンクの中身の文字列を取得（再帰的ではなく直接textContentを使用）
        let linkText = el.textContent.trim();

        // リンクテキストが空の場合はURLを表示テキストとして使用
        if (!linkText) {
          // URLからドメイン以下を表示テキストとして使用
          linkText = href.split("/").pop() || href;
        }

        markdown += `[${linkText}](${href})`;
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
        // リンクの中身の文字列を取得（再帰的ではなく直接textContentを使用）
        let linkText = el.textContent.trim();

        // リンクテキストが空の場合はURLを表示テキストとして使用
        if (!linkText) {
          // URLからドメイン以下を表示テキストとして使用
          linkText = href.split("/").pop() || href;
        }

        content += `[${linkText}](${href})`;
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
