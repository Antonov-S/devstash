import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/billing", () => ({
  getUserIsPro: vi.fn()
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  rateLimitMessage: vi.fn(
    (result: { retryAfterSeconds: number }) =>
      `Too many attempts. Please try again in ${result.retryAfterSeconds} seconds.`
  )
}));

const mockedResponsesCreate = vi.fn();
vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  getOpenAI: () => ({
    responses: {
      create: mockedResponsesCreate
    }
  })
}));

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { generateAutoTags } from "@/actions/ai-tags";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedGetUserIsPro = getUserIsPro as unknown as ReturnType<typeof vi.fn>;
const mockedRateLimit = rateLimit as unknown as ReturnType<typeof vi.fn>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

const allowedLimit = {
  success: true,
  remaining: 19,
  reset: 0,
  retryAfterSeconds: 0
};

function basePayload() {
  return {
    title: "useDebounce hook",
    content: "function useDebounce<T>(value: T, ms: number): T { return value }",
    description: "Debounces a value",
    language: "typescript",
    typeName: "snippet"
  };
}

describe("generateAutoTags", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedRateLimit.mockReset();
    mockedResponsesCreate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedGetUserIsPro).not.toHaveBeenCalled();
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free users with the Pro error before calling the model", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI features require Pro."
    });
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("re-reads isPro from the DB even if a stale JWT would say otherwise", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["react"] })
    });

    await generateAutoTags(basePayload());

    expect(mockedGetUserIsPro).toHaveBeenCalledWith("user_1");
  });

  it("returns the rate-limit message when the per-user hourly cap is exceeded", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: 0,
      retryAfterSeconds: 600
    });

    const result = await generateAutoTags(basePayload());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Too many attempts. Please try again in 600 seconds.");
    }
    expect(mockedRateLimit).toHaveBeenCalledWith(
      "aiSuggestTags",
      "user:user_1"
    );
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects empty titles before calling the model", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);

    const result = await generateAutoTags({ ...basePayload(), title: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Title is required");
    }
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses tags from a {tags: [...]} response shape and normalizes them", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        tags: ["React", " HOOKS ", "react", "", "debounce"]
      })
    });

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: true,
      tags: ["react", "hooks", "debounce"]
    });
  });

  it("parses tags from a bare array response shape", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify(["api", "rest", "fetch"])
    });

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: true,
      tags: ["api", "rest", "fetch"]
    });
  });

  it("truncates long content before sending it to the model", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify(["x"])
    });

    const huge = "x".repeat(5_000);
    await generateAutoTags({ ...basePayload(), content: huge });

    expect(mockedResponsesCreate).toHaveBeenCalledOnce();
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(typeof args.input).toBe("string");
    // The truncation marker is appended when content exceeds AI_MAX_INPUT_CHARS.
    expect(args.input).toContain("…[truncated]");
    expect(args.input.length).toBeLessThan(huge.length);
    expect(args.text).toEqual({ format: { type: "json_object" } });
    expect(args.model).toBe("gpt-5-nano");
    // OpenAI's Responses API rejects requests with `text.format: json_object`
    // unless the literal word "json" appears in `input` (not `instructions`).
    // Guard against a future refactor accidentally dropping the prompt prefix.
    expect(args.input.toLowerCase()).toContain("json");
  });

  it("treats an empty model response as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({ output_text: "" });

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return any tags."
    });
  });

  it("treats malformed JSON as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: "not json at all"
    });

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return any tags."
    });
  });

  it("returns a generic error when the OpenAI call throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockRejectedValue(new Error("network down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateAutoTags(basePayload());

    expect(result).toEqual({
      success: false,
      error: "Could not suggest tags. Please try again."
    });
    errSpy.mockRestore();
  });
});
