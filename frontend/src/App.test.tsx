/** [M-6] Integration coverage for App orchestration.
 *
 * These tests mock `global.fetch` so they exercise the real app tree
 * (Header + api client + state machine) end-to-end without touching a
 * running backend. Assertions focus on the wiring most likely to
 * regress silently: health-response → badge, misconfig → fallback
 * badge, network failure → UNKNOWN state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const HEALTH_URL_TAIL = "/api/health";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("App (integration)", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("reflects a healthy MOCK backend on the mode badge", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith(HEALTH_URL_TAIL)) {
        return jsonResponse({
          status: "ok",
          mode: "MOCK",
          configured_mode: "MOCK",
          provider: "gemini",
          model: "gemini-3.6-flash",
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("mode-badge")).toHaveTextContent("MOCK");
    });
  });

  it("shows a MOCK (fallback) badge when the operator asked for LIVE but no key is set", async () => {
    // [H-1] proof: the badge must warn a reviewer, not lie.
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        mode: "MOCK",
        configured_mode: "LIVE",
        provider: "gemini",
        model: "gemini-3.6-flash",
      }),
    ) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("mode-badge")).toHaveTextContent(
        /MOCK\s*\(fallback\)/i,
      );
    });
  });

  it("shows LIVE · provider label when live credentials are wired up", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        mode: "LIVE",
        configured_mode: "LIVE",
        provider: "gemini",
        model: "gemini-3.6-flash",
      }),
    ) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("mode-badge")).toHaveTextContent(
        /LIVE\s*·\s*Gemini/,
      );
    });
  });

  it("leaves the badge in 'checking...' when the backend is unreachable", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    render(<App />);

    // The catch branch resets mode back to UNKNOWN, which renders as
    // "checking..." per Header's badge logic.
    await waitFor(() => {
      expect(screen.getByTestId("mode-badge")).toHaveTextContent(/checking/i);
    });
  });
});
