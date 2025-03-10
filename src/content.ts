import { ArticleContent, Result } from "./types.ts";

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

  // タイトルの抽出（メタタグから）
  const metaTitleMatch = html.match(
    /<meta\s+property="og:title"\s+content="([^"]+)"/i,
  );
  if (metaTitleMatch && metaTitleMatch[1]) {
    result.title = decodeHTMLEntities(metaTitleMatch[1].trim());
  } else {
    // 代替手段: h1タグからの抽出
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = decodeHTMLEntities(titleMatch[1].trim());
    }
  }

  // 著者名の抽出（コンテンツ内から）
  if (html.includes('class="user-name"')) {
    const authorMatch = html.match(/class="user-name"[^>]*>([^<]+)/i);
    if (authorMatch && authorMatch[1]) {
      result.author = decodeHTMLEntities(authorMatch[1].trim());
    }
  }

  // URLからも著者名を抽出できる（バックアップ）
  if (!result.author) {
    const urlAuthorMatch = url.match(/https:\/\/zenn\.dev\/([^\/]+)/);
    if (urlAuthorMatch && urlAuthorMatch[1]) {
      result.author = urlAuthorMatch[1];
    }
  }

  // 公開日の抽出
  const dateMatch = html.match(/(\d{4})\/(\d{2})\/(\d{2})[^\d<]*に公開/i);
  if (dateMatch) {
    result.published = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  // TODO: 公開日の抽出方法を改善
  // - メタタグからの抽出を試す (og:published_time など)
  // - 日付のフォーマットを標準化 (ISO 8601形式など)
  // - タイムゾーン処理の追加

  // タグの抽出（コンテンツから）
  // テキストベースで簡易検出
  const textContent = html.replace(/<[^>]+>/g, " ");
  const potentialTags = [
    "macOS",
    "Docker",
    "tech",
    "TypeScript",
    "JavaScript",
    "React",
    "Vue",
    "Node.js",
    "Python",
  ];

  for (const tag of potentialTags) {
    if (textContent.includes(tag)) {
      // 重複しないようにチェック
      if (!result.tags.includes(tag)) {
        result.tags.push(tag);
      }
    }
  }

  // "tech" タグは頻出するので、コンテンツに含まれていない場合でもデフォルトで追加
  if (!result.tags.includes("tech")) {
    result.tags.push("tech");
  }

  // 本文の抽出 - メインコンテンツ部分に焦点を当てる
  let mainText = "";

  // 主要な記事コンテンツを含む要素を探す
  const articleMatch = html.match(
    /<div[^>]*class=".*?article-body.*?"[^>]*>([\s\S]*?)<\/div>/i,
  );

  if (articleMatch) {
    const articleHtml = articleMatch[1];

    // HTMLタグを削除し、テキストのみを抽出
    mainText = articleHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // スタイルタグを削除
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // スクリプトタグを削除
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "") // SVGタグを削除
      .replace(/<[^>]+>/g, " ") // 残りのHTMLタグをスペースに置換
      .replace(/\s{2,}/g, " ") // 連続する空白文字を1つのスペースに置換
      .trim();
  } else {
    // 代替手段: articleタグ内を探す
    const altMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (altMatch) {
      const articleHtml = altMatch[1];

      mainText = articleHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }

  // エンティティをデコード
  mainText = decodeHTMLEntities(mainText);

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
