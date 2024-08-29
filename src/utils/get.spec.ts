import { expect, test } from "bun:test";
import { get } from "./get.js";

test("", () =>
  expect(get({ server: { host: "localhost" } }, "server", "host")).toBe(
    "localhost",
  ));
test("", () =>
  expect(get({ a: [{ a: 3 }, { b: "asd" }] }, "a", 1, "b")).toBe("asd"));
test("", () => expect(get(null, "a", 1, "b")).toBe(undefined));
