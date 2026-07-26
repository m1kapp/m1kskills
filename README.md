# m1kskills

**AI로 만든 자료에 신뢰를 붙이는 스킬 모음.**
Claude Code면 플러그인으로 설치, 그 외 도구는 [`AGENTS.md`](AGENTS.md) 복붙으로 씁니다.

```
/plugin marketplace add m1kapp/m1kskills
/plugin install verify-badge@m1kskills     # 검증 이력 뱃지
/plugin install claude-run@m1kskills       # 구독 가성비 랭킹
```

> 설치 후 `/reload-plugins` 한 번.

| 스킬 | 부르는 법 | 준비물 |
|---|---|---|
| **verify-badge** | 리포트 마무리하며 **"뱃지 붙여줘"** | 없음 — 순수 프롬프트 |
| **claude-run** | `/claude-run` | python3 · node |

---

## 📦 스킬

### `claude-run` — 같이 달리는 구독 가성비 랭킹

Claude Code 구독을 **"API 정가로 환산하면 몇 배 뽑았나(본전배율)"** 로 환산해, 모두의 기록을 모아보는 랭킹([clauderun.m1k.app](https://clauderun.m1k.app))에 한 줄로 합류합니다.

| 보는 것 | 예시 |
|---|---|
| 월별 정가 환산액 | `2026년 6월 ₩3,000만` |
| 구독 대비 본전 배율 | `100×` |
| 개발자 프로필(누적) | 🦉 심야형 스프린터 · 캐시 장인 98% |

신원은 **내 Claude 계정 기준**(계정 UUID 해시)이라, 깃헙·기기를 바꿔도 한 줄로 갱신되고 **중복·허수가 안 들어갑니다**. 동시에 트랜스크립트 자동삭제 설정(`cleanupPeriodDays`, 기본 30일)을 **1년으로 보정**해 과거 기록을 보존합니다.

#### 사용법

```
/claude-run            # 최신 사용량으로 랭킹 갱신 (닉네임은 처음 한 번만)
/claude-run 닉네임      # 닉네임 지정/변경
/claude-run-out        # 랭킹에서 내 기록만 삭제
```

제출하면 **내 리포트(`clauderun.m1k.app/u/<id>`)가 브라우저로 자동으로 열립니다.**

#### 환경변수 (선택)

| 변수 | 기본 | 설명 |
|---|---|---|
| `USAGE_REPORT_KRW` | `1500` | 원화 환산 환율(₩/$) |
| `USAGE_REPORT_OUT` | `~/claude-usage-report.html` | 출력 경로 |

### `verify-badge` — 검증 이력 뱃지 (도장 아님, 감사)

AI로 만든 자료의 첫 반응은 늘 **"이거 진짜야?"** 입니다. 이 플러그인은 그 질문을 앞단에서 처리합니다.
리포트를 마무리할 때 **실명 책임 + 실제 검증 이력 + 냉정한 한계 진단**을 뱃지로 붙입니다.

```
/verify-badge
```
또는 "뱃지 붙여줘", "검증 이력", "이 리포트 신뢰도"

#### 핵심: 자랑이 아니라 감사(audit)

| 넣는 것 | 왜 |
|---|---|
| **파고든 관점** | 어떤 질문을 순서대로 팠나 — 횟수보다 사고의 궤적이 신뢰를 만듦 |
| **어디까지 확인** | 항목별 `A 그대로 인용` / `B 상대 비교만` / `C 자릿수만` / `D 미검증` |
| **고친 것** | 검증 라운드별 실제 수정분 + 심각도 + **현재 반영값** |
| **직접 확인** | 1차 출처 링크 — *"이 자료를 믿지 말고 찍어보라"* |
| **못 한 것** | 미검증 항목 / 왜 못 했나 / 하면 얻는 것(등급 승격) |

- **없는 검증은 만들지 않습니다.** 오류를 못 잡았으면 "발견 0건"으로 씁니다.
- **AI가 짜게 채점합니다.** 가정 상수가 결과를 좌우하면 B 이하, 1차 출처 없으면 C 이하.
- **한계 섹션이 필수**입니다. 못 믿을 걸 못 믿는다고 쓸 때 나머지가 믿깁니다.

산출물은 **하단 서명 + 미니 칩**(`⛨ VERIFIED │ N× reviewed`)과, 클릭 시 열리는 **5탭 상세**입니다.
👉 [예제 코드·데모](examples/verify-badge/) — 데이터 객체만 바꾸면 바로 씁니다.

#### Claude Code가 아니어도 씁니다

**쓰던 AI에 아래 3줄만 던지세요.** 나머지는 그쪽 에이전트가 알아서 합니다.

```
https://raw.githubusercontent.com/m1kapp/m1kskills/main/AGENTS.md

이 문서를 읽고 "Verify Badge" 지침을 그대로 따라서,
지금 작업 중인 자료에 검증 이력 뱃지를 붙여줘.
```

웹을 못 읽는 환경(브라우징 꺼진 ChatGPT 등)이면 [`AGENTS.md`](AGENTS.md) 를 열어 **전체 복사**해 붙여넣으면 똑같이 동작합니다. 본문이 그냥 마크다운이라 준비물이 없습니다.

**계속 쓸 거면 고정해 두세요:**

| 도구 | 두는 곳 |
|---|---|
| **Cursor · Copilot · Codex · Windsurf · Zed** | 레포 루트에 `AGENTS.md` 파일로 두면 자동 인식 |
| **Claude 웹·앱** | Project → Project instructions |
| **ChatGPT** | Custom GPT → Instructions |
| **Gemini · 기타** | 대화 시작 시 위 3줄 |

> `AGENTS.md` 는 [AAIF(Linux Foundation)](https://agents.md) 크로스툴 표준으로 28개+ 툴이 읽습니다.
> 고정해 뒀다면 그냥 **"뱃지 붙여줘"** 한마디면 됩니다.


---

## ✅ 필요 조건

**`verify-badge` 는 준비물이 없습니다.** 스킬 본문이 마크다운 프롬프트라 Claude Code도 필요 없습니다(위 복붙 표 참고).

`claude-run` 만 로컬 실행이 필요합니다:

- **Claude Code** (플러그인 지원 버전)
- **python3** — 보고서 생성
- **node / npx** — [ccusage](https://github.com/ryoppippi/ccusage)가 자동 설치되어 로컬 사용량을 읽음

별도 API 키·계정 연동 불필요. ccusage가 각자의 `~/.claude` 로컬 기록만 읽으므로, **설치한 사람마다 자기 사용량 보고서**가 나옵니다.

---

## ❓ 자주 묻는 질문

### `verify-badge`

**Q. 뱃지가 "이 자료 믿어도 된다"는 보증인가요?**
아니요, 정반대입니다. **감사(audit) 기록**입니다. 못 믿을 항목을 `C 자릿수만`·`D 미검증`으로 깎아서 적고, "못 한 것" 탭에 남은 숙제를 남깁니다. 등급이 낮게 나오는 게 정상 동작입니다.

**Q. 검증을 안 했으면 뱃지를 못 붙이나요?**
붙습니다. 대신 **"발견 0건 — 그만큼 검증 깊이가 얕았을 수 있음"** 으로 적힙니다. 없는 검증을 지어내지 않는 게 이 스킬의 1번 원칙입니다.

**Q. 칩의 `N× reviewed` 는 무슨 숫자인가요?**
**교차검증 라운드 수**(`rounds`)입니다. 고친 건수(`findings`)와 다릅니다 — 섞으면 칩과 상세 내용이 서로 다른 숫자를 말하게 됩니다. 라운드 수를 모르면 `N×` 를 아예 빼는 게 맞습니다.

### `claude-run`

**Q. 금액이 실제 청구액인가요?**
아니요. "같은 양을 **API 정가로 썼다면**"의 가상 환산값입니다. 구독제 실제 청구는 월 정액 그대로이고, 이 수치는 "구독이 얼마나 이득이었나"를 보여주는 용도입니다.

**Q. 클로드코드 Stats 화면의 토큰 수랑 다른데요?**
Stats는 cache read를 축약/제외한 집계라 작게 보입니다. 실제 API에 흐른 토큰은 cache read가 대부분(98%)이라, ccusage 기준이 훨씬 큽니다.

**Q. 몇 달 전 기록이 안 보여요.**
`cleanupPeriodDays`(기본 30일)로 이미 삭제된 과거는 복구 불가입니다. 이 플러그인이 설정을 1년으로 바꿔주므로 **지금부터 생기는 기록**은 보존됩니다.

**Q. codex 등 다른 도구 사용량도 잡히나요?**
ccusage는 잡지만, 이 보고서는 **Claude 모델만** 집계합니다(구독 가성비가 목적이므로).

---

## 🔧 마켓플레이스 관리 (기여자용)

새 플러그인 추가:
1. `plugins/<이름>/.claude-plugin/plugin.json` + 컴포넌트(`skills/`, `commands/` 등) 추가
2. `.claude-plugin/marketplace.json`의 `plugins` 배열에 항목 추가
3. 프롬프트만으로 쓰는 스킬이면 루트 `skills/<이름>` 에 심링크를 걸어 크로스툴 매니페스트(`.codex-plugin`·`.cursor-plugin`)에도 노출
4. `git push`

기존 사용자는 `/plugin marketplace update m1kskills` 로 갱신받습니다.
플러그인 수정 배포 시 `plugin.json`의 `version`을 올려야 사용자에게 업데이트가 노출됩니다.

---

## 라이선스

MIT © m1kapp
