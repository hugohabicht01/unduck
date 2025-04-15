import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the bangs import before any other imports
vi.mock("../bang", () => ({
  bangs: [
    { t: "test", d: "Test Bang", u: "https://test.com" },
  ],
}));

// Import real bangs for reference in some tests
const realBangs = await import("../bang").then(module => module.bangs);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace global localStorage with mock
vi.stubGlobal("localStorage", localStorageMock);

// Import after mocking localStorage
import {
  getCustomBangs,
  mergeBangs,
  loadBangs,
  transformToLookup,
  setDefaultSearchEngine,
} from "../settings";

describe("settings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getCustomBangs", () => {
    it("returns empty object when no custom bangs are set", () => {
      expect(getCustomBangs()).toEqual({});
    });

    it("returns parsed custom bangs from localStorage", () => {
      const customBangs = { test: { t: "test", u: "https://test.com" } };
      localStorage.setItem("customBangs", JSON.stringify(customBangs));
      expect(getCustomBangs()).toEqual(customBangs);
    });
  });

  describe("mergeBangs", () => {
    it("combines two bang objects", () => {
      const bang1 = { a: { t: "a", u: "https://a.com" } };
      const bang2 = { b: { t: "b", u: "https://b.com" } };
      expect(mergeBangs(bang1, bang2)).toEqual({
        a: { t: "a", u: "https://a.com" },
        b: { t: "b", u: "https://b.com" },
      });
    });

    it("right object overwrites left object properties", () => {
      const bang1 = { a: { t: "a", u: "https://a.com" } };
      const bang2 = { a: { t: "a", u: "https://b.com" } };
      expect(mergeBangs(bang1, bang2)).toEqual({
        a: { t: "a", u: "https://b.com" },
      });
    });
  });

  describe("transformToLookup", () => {
    it("transforms array of bangs to lookup object", () => {
      const result = transformToLookup(realBangs);
      expect(result).toHaveProperty(realBangs[0].t);
      expect(result[realBangs[0].t]).toEqual(realBangs[0]);
    });
  });

  describe("setDefaultSearchEngine", () => {
    it("sets valid search engine to localStorage", () => {
      const validBang = "test"; // Use our mocked bang
      setDefaultSearchEngine(validBang);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "default-bang",
        validBang,
      );
    });

    it("throws error for invalid search engine", () => {
      expect(() => setDefaultSearchEngine("invalid-bang")).toThrow(
        "invalid search engine",
      );
    });
  });

  describe("loadBangs", () => {
    it("merges default and custom bangs, favoring custom bangs", () => {
      localStorage.clear(); // ensure its actually empty

      // check before setting the custom bangs
      expect(loadBangs()["test"].u).toBe("https://test.com");
      localStorage.setItem(
        "customBangs",
        JSON.stringify({ test: { t: "test", u: "https://custom.com" } }),
      );
      expect(loadBangs()["test"].u).toBe("https://custom.com");
    });

    it("it works well without any custom bangs", () => {
      localStorage.clear(); // ensure its actually empty
      console.log(loadBangs());
      expect(loadBangs()["test"].u).toBe("https://test.com");
    });
  });
});
