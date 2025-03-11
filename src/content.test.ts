import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { decodeHTMLEntities } from "./markdown.ts";

Deno.test("decodeHTMLEntities decodes HTML entities correctly", () => {
  const input =
    "&lt;div&gt;Hello &amp; World&lt;/div&gt; &quot;test&quot; &#39;single&#39;";
  assertEquals(
    decodeHTMLEntities(input),
    "<div>Hello & World</div> \"test\" 'single'",
  );

  // Test numeric entities
  assertEquals(decodeHTMLEntities("&#65;&#66;&#67;"), "ABC");
  assertEquals(decodeHTMLEntities("&#x41;&#x42;&#x43;"), "ABC");
});
