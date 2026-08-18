import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadCard from "./UploadCard";

function makePdfFile(name = "sample.pdf") {
  return new File(["%PDF-1.4 fake"], name, { type: "application/pdf" });
}

describe("UploadCard", () => {
  it("disables the Analyze button until a file is selected", () => {
    const onAnalyze = vi.fn();
    render(
      <UploadCard
        file={null}
        onFileSelected={() => {}}
        onAnalyze={onAnalyze}
        isAnalyzing={false}
      />,
    );
    const button = screen.getByRole("button", { name: /Analyze RFP/i });
    expect(button).toBeDisabled();
  });

  it("displays the selected file name and enables Analyze", async () => {
    const user = userEvent.setup();
    const onAnalyze = vi.fn();
    render(
      <UploadCard
        file={makePdfFile("rfp.pdf")}
        onFileSelected={() => {}}
        onAnalyze={onAnalyze}
        isAnalyzing={false}
      />,
    );
    expect(screen.getByTestId("file-name")).toHaveTextContent("rfp.pdf");
    await user.click(screen.getByRole("button", { name: /Analyze RFP/i }));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it("propagates file changes to the parent on input change", async () => {
    const user = userEvent.setup();
    const onFileSelected = vi.fn();
    render(
      <UploadCard
        file={null}
        onFileSelected={onFileSelected}
        onAnalyze={() => {}}
        isAnalyzing={false}
      />,
    );
    const input = screen.getByTestId("upload-input") as HTMLInputElement;
    await user.upload(input, makePdfFile("chosen.pdf"));
    expect(onFileSelected).toHaveBeenCalledTimes(1);
    const uploaded = onFileSelected.mock.calls[0][0] as File;
    expect(uploaded.name).toBe("chosen.pdf");
  });

  it("shows the error message when provided", () => {
    render(
      <UploadCard
        file={makePdfFile()}
        onFileSelected={() => {}}
        onAnalyze={() => {}}
        isAnalyzing={false}
        error="분석 실패"
      />,
    );
    expect(screen.getByText("분석 실패")).toBeInTheDocument();
  });
});
