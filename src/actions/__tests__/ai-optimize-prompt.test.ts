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
import { optimizePrompt } from "@/actions/ai-optimize-prompt";

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
    typeName: "prompt" as const,
    title: "Code review prompt",
    content: "review my code"
  };
}

describe("optimizePrompt", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedRateLimit.mockReset();
    mockedResponsesCreate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedGetUserIsPro).not.toHaveBeenCalled();
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free users with the Pro error before calling the model", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);

    const result = await optimizePrompt(basePayload());

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
      output_text: JSON.stringify({ prompt: "Refined prompt." })
    });

    await optimizePrompt(basePayload());

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

    const result = await optimizePrompt(basePayload());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Too many attempts. Please try again in 600 seconds."
      );
    }
    expect(mockedRateLimit).toHaveBeenCalledWith(
      "aiOptimizePrompt",
      "user:user_1"
    );
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects payloads with empty content", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);

    const result = await optimizePrompt({
      typeName: "prompt",
      content: ""
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("There's nothing to optimize.");
    }
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects payloads with an unsupported type", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);

    const result = await optimizePrompt({
      // @ts-expect-error testing runtime rejection of an unsupported type
      typeName: "snippet",
      content: "console.log('hi')"
    });

    expect(result.success).toBe(false);
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses {prompt: '...'} response and trims surrounding whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        prompt: "  Review the code below for bugs and style issues.\n\nFocus on:\n- correctness  "
      })
    });

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({
      success: true,
      prompt:
        "Review the code below for bugs and style issues.\n\nFocus on:\n- correctness"
    });
  });

  it("parses a bare string response shape", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify("Refined prompt body.\n\n- bullet one")
    });

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({
      success: true,
      prompt: "Refined prompt body.\n\n- bullet one"
    });
  });

  it("truncates long content and sends the correct Responses API payload", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ prompt: "x." })
    });

    const huge = "x".repeat(5_000);
    await optimizePrompt({ ...basePayload(), content: huge });

    expect(mockedResponsesCreate).toHaveBeenCalledOnce();
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(typeof args.input).toBe("string");
    expect(args.input).toContain("…[truncated]");
    expect(args.input.length).toBeLessThan(huge.length);
    expect(args.text).toEqual({ format: { type: "json_object" } });
    expect(args.model).toBe("gpt-5-nano");
    // The Responses API rejects requests with `text.format: json_object`
    // unless the literal word "json" appears in `input` (not `instructions`).
    expect(args.input.toLowerCase()).toContain("json");
    expect(args.input).toContain("Title: Code review prompt");
  });

  it("treats an empty model response as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({ output_text: "" });

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return a refined prompt."
    });
  });

  it("treats malformed JSON as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: "not json at all"
    });

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return a refined prompt."
    });
  });

  it("returns a generic error when the OpenAI call throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockRejectedValue(new Error("network down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await optimizePrompt(basePayload());

    expect(result).toEqual({
      success: false,
      error: "Could not optimize this prompt. Please try again."
    });
    errSpy.mockRestore();
  });

  it("accepts a payload without a title", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ prompt: "Refined." })
    });

    const result = await optimizePrompt({
      typeName: "prompt",
      content: "write a haiku"
    });

    expect(result).toEqual({ success: true, prompt: "Refined." });
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(args.input).not.toContain("Title:");
    expect(args.input).toContain("Prompt:");
  });
});
