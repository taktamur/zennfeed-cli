import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { buildFeedUrl } from "./api.ts";

Deno.test("buildFeedUrl returns correct URL for all type", () => {
  const url = buildFeedUrl({ type: "all" });
  assertEquals(url, "https://zenn.dev/feed");
});

Deno.test("buildFeedUrl returns correct URL for topic type", () => {
  const url = buildFeedUrl({ type: "topic", keyword: "typescript" });
  assertEquals(url, "https://zenn.dev/topics/typescript/feed");
});

Deno.test("buildFeedUrl returns correct URL for user type", () => {
  const url = buildFeedUrl({ type: "user", keyword: "username" });
  assertEquals(url, "https://zenn.dev/username/feed");
});