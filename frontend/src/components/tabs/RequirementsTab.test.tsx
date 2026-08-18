import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RequirementsTab from "./RequirementsTab";
import { sampleResult } from "../../test/fixtures";

describe("RequirementsTab", () => {
  it("renders one row per requirement with id and title", () => {
    render(<RequirementsTab requirements={sampleResult.requirements} />);
    expect(screen.getByText("SFR-001")).toBeInTheDocument();
    expect(screen.getByText("SER-001")).toBeInTheDocument();
    expect(screen.getByText("생성형 AI 기반 지식 검색")).toBeInTheDocument();
  });

  it("shows the source page badge when evidence is present", () => {
    render(<RequirementsTab requirements={sampleResult.requirements} />);
    expect(screen.getByText("Source: p.5")).toBeInTheDocument();
    expect(screen.getByText("Source: p.30")).toBeInTheDocument();
  });

  it("shows an empty state when there are no requirements", () => {
    render(<RequirementsTab requirements={[]} />);
    expect(
      screen.getByText(/추출된 요구사항이 없습니다/),
    ).toBeInTheDocument();
  });
});
