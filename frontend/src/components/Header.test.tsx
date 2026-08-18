import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  it("renders the service name and subtitle", () => {
    render(<Header mode="MOCK" />);
    expect(screen.getByText("PublicBid AI Assistant")).toBeInTheDocument();
    expect(
      screen.getByText(/AI-powered RFP Analysis/i),
    ).toBeInTheDocument();
  });

  it("shows the mode in the badge when mock", () => {
    render(<Header mode="MOCK" configuredMode="MOCK" />);
    expect(screen.getByTestId("mode-badge")).toHaveTextContent("MOCK");
  });

  it("shows LIVE with provider label when live and provider given", () => {
    render(<Header mode="LIVE" provider="gemini" configuredMode="LIVE" />);
    expect(screen.getByTestId("mode-badge")).toHaveTextContent(
      /LIVE\s*·\s*Gemini/,
    );
  });

  it("shows LIVE with OpenAI label when provider is openai", () => {
    render(<Header mode="LIVE" provider="openai" configuredMode="LIVE" />);
    expect(screen.getByTestId("mode-badge")).toHaveTextContent(
      /LIVE\s*·\s*OpenAI/,
    );
  });

  it("shows MOCK (fallback) when effective mode is MOCK but user asked for LIVE", () => {
    // [H-1] — silent mock fallback must be visible in the UI.
    render(<Header mode="MOCK" provider="gemini" configuredMode="LIVE" />);
    expect(screen.getByTestId("mode-badge")).toHaveTextContent(/MOCK\s*\(fallback\)/i);
  });

  it("shows a placeholder while the mode is unknown", () => {
    render(<Header mode="UNKNOWN" />);
    expect(screen.getByTestId("mode-badge")).toHaveTextContent(/checking/i);
  });
});
