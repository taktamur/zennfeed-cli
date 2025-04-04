import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { formatArticleOutput, formatFeedOutput } from "./format.ts";
import { Article, ArticleContent, MarkdownContent } from "./types.ts";

Deno.test("formatFeedOutput formats feed in text format", () => {
  const articles: Article[] = [
    {
      title: "Test Article",
      link: "https://zenn.dev/test/article",
      pubDate: "2023-07-09T10:30:00Z",
      pubDateFormatted: "2023/07/09 19:30",
      author: "Test Author",
    },
  ];

  const formatted = formatFeedOutput(articles, "text");
  const expected =
    "Test Article\n  https://zenn.dev/test/article\n  Test Author - 2023/07/09 19:30";

  assertEquals(formatted, expected);

  // フィードURLがある場合
  const feedUrl = "https://zenn.dev/feed";
  const formattedWithUrl = formatFeedOutput(articles, "text", feedUrl);
  const expectedWithUrl = `Feed URL: ${feedUrl}\n\n${expected}`;

  assertEquals(formattedWithUrl, expectedWithUrl);
});

Deno.test("formatFeedOutput formats feed in json format", () => {
  const articles: Article[] = [
    {
      title: "Test Article",
      link: "https://zenn.dev/test/article",
      pubDate: "2023-07-09T10:30:00Z",
      pubDateFormatted: "2023/07/09 19:30",
      author: "Test Author",
    },
  ];

  const formatted = formatFeedOutput(articles, "json");
  const parsed = JSON.parse(formatted);

  assertEquals(parsed.articles.length, 1);
  assertEquals(parsed.articles[0].title, "Test Article");
  assertEquals(parsed.feedUrl, undefined);

  // フィードURLがある場合
  const feedUrl = "https://zenn.dev/feed";
  const formattedWithUrl = formatFeedOutput(articles, "json", feedUrl);
  const parsedWithUrl = JSON.parse(formattedWithUrl);

  assertEquals(parsedWithUrl.feedUrl, feedUrl);
});

Deno.test("formatFeedOutput formats feed in markdown format", () => {
  const articles: Article[] = [
    {
      title: "Test Article",
      link: "https://zenn.dev/test/article",
      pubDate: "2023-07-09T10:30:00Z",
      pubDateFormatted: "2023/07/09 19:30",
      author: "Test Author",
    },
  ];

  const formatted = formatFeedOutput(articles, "markdown");
  const expected =
    "- [Test Article](https://zenn.dev/test/article) by Test Author - 2023/07/09 19:30";

  assertEquals(formatted, expected);

  // フィードURLがある場合
  const feedUrl = "https://zenn.dev/feed";
  const formattedWithUrl = formatFeedOutput(articles, "markdown", feedUrl);
  const expectedWithUrl = `## Feed: [${feedUrl}](${feedUrl})\n\n${expected}`;

  assertEquals(formattedWithUrl, expectedWithUrl);
});

Deno.test("formatArticleOutput formats article in text format", () => {
  // Markdownコンテンツを作成
  const markdownContent = MarkdownContent.create("Article content");

  const article: ArticleContent = {
    title: "Test Article",
    content: markdownContent,
    author: "Test Author",
    published: "2023/07/09 19:30",
    url: "https://zenn.dev/test/article",
    tags: ["test", "example"],
  };

  const formatted = formatArticleOutput(article, "text");
  const expected = "タイトル: Test Article\n" +
    "著者: Test Author\n" +
    "公開日: 2023/07/09 19:30\n" +
    "URL: https://zenn.dev/test/article\n" +
    "タグ: test, example\n\n" +
    "Article content";

  assertEquals(formatted, expected);
});

Deno.test("formatArticleOutput formats article in json format", () => {
  // Markdownコンテンツを作成
  const markdownContent = MarkdownContent.create("Article content");

  const article: ArticleContent = {
    title: "Test Article",
    content: markdownContent,
    author: "Test Author",
    published: "2023/07/09 19:30",
    url: "https://zenn.dev/test/article",
    tags: ["test", "example"],
  };

  const formatted = formatArticleOutput(article, "json");
  const parsed = JSON.parse(formatted);

  assertEquals(parsed.title, "Test Article");
  assertEquals(parsed.content, "Article content");
  assertEquals(parsed.tags.length, 2);
});

Deno.test("formatArticleOutput formats article in markdown format", () => {
  // Markdownコンテンツを作成
  const markdownContent = MarkdownContent.create("Article content");

  const article: ArticleContent = {
    title: "Test Article",
    content: markdownContent,
    author: "Test Author",
    published: "2023/07/09 19:30",
    url: "https://zenn.dev/test/article",
    tags: ["test", "example"],
  };

  const formatted = formatArticleOutput(article, "markdown");
  const expectedStart =
    "# Test Article\n\n*By Test Author - 2023/07/09 19:30*\n\nArticle content";
  const expectedEnd = "\n\nTags: `test`, `example`";

  assertEquals(formatted.startsWith(expectedStart), true);
  assertEquals(formatted.endsWith(expectedEnd), true);
});
