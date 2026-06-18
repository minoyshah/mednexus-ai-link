import { describe, it, expect } from "vitest";
import { appendUniqueById, sortByCreatedAt } from "./realtime";

describe("appendUniqueById", () => {
  it("appends a new message", () => {
    const out = appendUniqueById([{ id: "a" }], { id: "b" });
    expect(out.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("ignores a duplicate id (realtime echo / replay)", () => {
    const list = [{ id: "a" }, { id: "b" }];
    expect(appendUniqueById(list, { id: "b" })).toBe(list); // unchanged reference
  });
});

describe("sortByCreatedAt", () => {
  it("orders chronologically by ISO timestamp", () => {
    const out = sortByCreatedAt([
      { id: "2", created_at: "2026-06-07T10:05:00Z" },
      { id: "1", created_at: "2026-06-07T10:00:00Z" },
      { id: "3", created_at: "2026-06-07T10:10:00Z" },
    ]);
    expect(out.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });
});
