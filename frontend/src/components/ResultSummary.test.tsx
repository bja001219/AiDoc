import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultSummary from "./ResultSummary";
import { sampleResult } from "../test/fixtures";

describe("ResultSummary", () => {
  it("renders the project name, budget, and score", () => {
    render(<ResultSummary result={sampleResult} />);
    expect(
      screen.getByText(/한국투자공사 내부 인공지능/),
    ).toBeInTheDocument();
    expect(screen.getByText("1,250,000,000원")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders the decision badge label matching the decision value", () => {
    render(<ResultSummary result={sampleResult} />);
    expect(screen.getByTestId("decision-badge")).toHaveTextContent(
      "CONDITIONAL GO",
    );
  });

  it("exposes a JSON download button that triggers a Blob download", async () => {
    const user = userEvent.setup();
    const createMock = vi.fn((_blob: Blob) => "blob:mock");
    const revokeMock = vi.fn((_url: string) => {});
    const originalCreate = (URL as unknown as { createObjectURL?: unknown })
      .createObjectURL;
    const originalRevoke = (URL as unknown as { revokeObjectURL?: unknown })
      .revokeObjectURL;
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createMock;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeMock;

    try {
      render(<ResultSummary result={sampleResult} />);
      await user.click(screen.getByTestId("download-json"));

      expect(createMock).toHaveBeenCalledTimes(1);
      const [blob] = createMock.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect((blob as Blob).type).toBe("application/json");
      expect(revokeMock).toHaveBeenCalledWith("blob:mock");
    } finally {
      (URL as unknown as { createObjectURL: unknown }).createObjectURL =
        originalCreate;
      (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL =
        originalRevoke;
    }
  });
});
