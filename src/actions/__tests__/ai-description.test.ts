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
import { generateDescription } from "@/actions/ai-description";

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
    typeName: "snippet",
    title: "useDebounce hook",
    content: "function useDebounce<T>(value: T, ms: number): T { return value }",
    language: "typescript",
    tags: ["react", "hooks"]
  };
}

describe("generateDescription", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedRateLimit.mockReset();
    mockedResponsesCreate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await generateDescription(basePayload());

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedGetUserIsPro).not.toHaveBeenCalled();
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free users with the Pro error before calling the model", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);

    const result = await generateDescription(basePayload());

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
      output_text: JSON.stringify({ description: "A debounce hook." })
    });

    await generateDescription(basePayload());

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

    const result = await generateDescription(basePayload());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Too many attempts. Please try again in 600 seconds."
      );
    }
    expect(mockedRateLimit).toHaveBeenCalledWith(
      "aiGenerateDescription",
      "user:user_1"
    );
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects payloads with no title, content, URL, or filename", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);

    const result = await generateDescription({
      typeName: "snippet",
      title: "   ",
      content: "",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Need a title, content, URL, or filename to work from."
      );
    }
    expect(mockedResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses {description: '...'} response, trims, and collapses whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        description: "  A TypeScript hook\n   that debounces\tvalues.  "
      })
    });

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: true,
      description: "A TypeScript hook that debounces values."
    });
  });

  it("parses a bare string response shape", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify("A reusable debounce hook for React.")
    });

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: true,
      description: "A reusable debounce hook for React."
    });
  });

  it("caps responses longer than 2 sentences", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        description:
          "First sentence. Second sentence. Third sentence. Fourth sentence."
      })
    });

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: true,
      description: "First sentence. Second sentence."
    });
  });

  it("truncates long content and sends the correct Responses API payload", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "x." })
    });

    const huge = "x".repeat(5_000);
    await generateDescription({ ...basePayload(), content: huge });

    expect(mockedResponsesCreate).toHaveBeenCalledOnce();
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(typeof args.input).toBe("string");
    expect(args.input).toContain("…[truncated]");
    expect(args.input.length).toBeLessThan(huge.length);
    expect(args.text).toEqual({ format: { type: "json_object" } });
    expect(args.model).toBe("gpt-5-nano");
    // The Responses API rejects requests with `text.format: json_object` unless
    // the literal word "json" appears in `input` (not `instructions`). Guard
    // against a future refactor accidentally dropping the prompt prefix.
    expect(args.input.toLowerCase()).toContain("json");
  });

  it("treats an empty model response as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({ output_text: "" });

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return a description."
    });
  });

  it("treats malformed JSON as a failure", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: "not json at all"
    });

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: false,
      error: "AI did not return a description."
    });
  });

  it("returns a generic error when the OpenAI call throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockRejectedValue(new Error("network down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateDescription(basePayload());

    expect(result).toEqual({
      success: false,
      error: "Could not generate description. Please try again."
    });
    errSpy.mockRestore();
  });

  it("accepts a link-type payload with only title + url", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "A great link." })
    });

    const result = await generateDescription({
      typeName: "link",
      title: "shadcn/ui",
      url: "https://ui.shadcn.com"
    });

    expect(result).toEqual({
      success: true,
      description: "A great link."
    });
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(args.input).toContain("URL: https://ui.shadcn.com");
    expect(args.input).toContain("Type: link");
  });

  it("accepts a file-type payload with only fileName", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedRateLimit.mockResolvedValue(allowedLimit);
    mockedResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "A PDF resume." })
    });

    const result = await generateDescription({
      typeName: "file",
      fileName: "resume.pdf"
    });

    expect(result.success).toBe(true);
    const [args] = mockedResponsesCreate.mock.calls[0];
    expect(args.input).toContain("Filename: resume.pdf");
  });
});
