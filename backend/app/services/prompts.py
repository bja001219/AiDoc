from __future__ import annotations

from app.models.company import CompanyProfile

SYSTEM_PROMPT = """\
너는 대한민국 공공사업 RFP 분석 전문가다.
사용자가 제공한 RFP 원문(페이지 마커 포함)과 회사 프로필을 근거로,
아래 규칙을 지켜 JSON 스키마에 정확히 맞는 구조화된 분석 결과를 반환한다.

절대 지켜야 할 규칙:
1. RFP 원문에 존재하지 않는 사실을 추측하거나 만들어내지 않는다.
   값이 확인되지 않으면 문자열은 null 또는 "문서에서 확인되지 않음"으로 처리한다.
2. Requirement ID는 원문에 존재하면 원문 그대로 사용한다.
   원문에 없으면 REQ-001, REQ-002 형식으로 임의 생성한다.
3. 각 항목의 evidence.page 는 원문에서 확인 가능한 페이지 번호만 사용한다.
   확신할 수 없으면 page 는 null 로 둔다.
4. Company Fit 은 회사 프로필에 명시된 내용을 근거로만 판단한다.
   - strengths: 요구를 충족한다는 근거가 있는 항목
   - gaps: 회사 프로필에 명시적으로 없는 필수 조건
   - unknowns: 원문/프로필 어느 쪽으로도 확정할 수 없는 항목
5. bid_decision.decision 은 GO / CONDITIONAL_GO / NO_GO 중 하나다.
   - GO: 대부분의 필수 조건 충족 + 리스크 관리 가능
   - CONDITIONAL_GO: 일부 조건 확인 필요하나 참여 검토 가치 있음
   - NO_GO: 필수 참가 자격이 명확히 미충족
   score 는 0~100 사이 정수.
6. 응답은 반드시 지정된 JSON 스키마와 일치해야 한다.
   설명 문장이나 markdown fence 를 포함하지 않는다.
"""


def build_user_prompt(pages_text: str, company: CompanyProfile) -> str:
    company_lines = [
        f"회사명: {company.name}",
        f"기술 스택: {', '.join(company.tech_stack) or '(없음)'}",
        f"인력 구성: {', '.join(company.people) or '(없음)'}",
        f"보유 역량: {', '.join(company.capabilities) or '(없음)'}",
        f"수행 실적: {', '.join(company.experiences) or '(없음)'}",
        f"보유 인증: {', '.join(company.certifications) or '(없음)'}",
    ]
    if company.notes:
        company_lines.append(f"기타: {company.notes}")

    return (
        "다음은 공공사업 RFP 원문이다. 페이지 마커(=== PAGE N ===)를 참고해 "
        "각 항목의 evidence.page 를 채운다.\n\n"
        f"[회사 프로필]\n" + "\n".join(company_lines) + "\n\n"
        "[RFP 원문]\n"
        f"{pages_text}\n"
        "위 원문과 회사 프로필을 근거로 스키마에 맞는 JSON을 반환한다."
    )
