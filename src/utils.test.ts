import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { formatDate } from "./utils.ts";

Deno.test("formatDate formats date correctly", () => {
  const dateStr = "2023-01-01T12:34:56Z";
  assertEquals(formatDate(dateStr), "2023/01/01 21:34");
});
