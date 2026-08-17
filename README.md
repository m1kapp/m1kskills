# m1kskills

**AI 쓰다 유용했던 나만의 스킬 모음.**
핵심은 **그냥 마크다운 프롬프트**라 어느 도구에 붙여넣어도 작동합니다.

| 스킬 | 하는 일 | 부르는 법 |
|---|---|---|
| **verify-badge** | 자료에 **검증 이력 뱃지** — 실명 책임·신뢰 등급·1차 출처·못 한 것 | "뱃지 붙여줘" |
| **dualdeck** | **리포트와 발표자료가 같은 HTML 한 장** — 8팔레트·PDF·한글 타이포 내장 | "리포트 써줘" |
| **logodown** | **앱 아이콘·파비콘 한 벌** — 심볼 148개에서 직접 골라 후보 제시, SVG·ICO·PWA·manifest | "로고 만들어줘" |
| **work-coordinates** | **작업의 북극성·현재·다음·검증 유지** — 증거 기반 디버깅과 비파괴 활성화 | "작업 좌표 활성화해줘" |

```
/plugin marketplace add m1kapp/m1kskills
/plugin install verify-badge@m1kskills
/plugin install dualdeck@m1kskills
/plugin install logodown@m1kskills
/plugin install work-coordinates@m1kskills
```

> 설치 후 `/reload-plugins` 한 번.
> Claude Code가 아니어도 씁니다 — [3줄 부트스트랩](#claude-code가-아니어도-씁니다)

---

## 📦 스킬

### `work-coordinates` — 목표를 잃지 않는 작업 좌표

세션이 길어져도 작은 할 일을 목표로 착각하지 않게 **여러 세션의 북극성**을 유지합니다.
상태가 바뀔 때마다 현재 근거, 다음 한 행동, 그대로 복사할 테스트와 기대 결과를 모바일 형식으로 남깁니다.
다음·테스트·결과에 실제 대상이 있으면 맨 경로가 아니라 **한 번에 열리는 Markdown 링크**로 제공합니다.
로컬 파일은 `[파일명] · [바로 위 폴더]` 두 링크로 짧게 보여 주고, 공백이 든 경로도 깨지지 않게 처리합니다.
각 결과 끝에는 `관측만`, `가설 적용 · 인과 미확정`, `완화 · 원인 남음`, `원인 수정`, `근본 해결`처럼 현재 해결 단계를 보수적으로 표시합니다.
같은 대상은 좌표 전체에서 한 번만 링크하고 이후에는 `위 PR #2`처럼 참조합니다. PR이 포함한 커밋도 특별한 이유가 없으면 반복하지 않습니다.

디버깅에서는 관측·재현·가설·진단 계측·원인 수정·완화·우회를 구분합니다.
수정 전 실패와 수정 후 같은 조건의 통과가 없으면 `근본 해결`이라고 부르지 않습니다.

👉 [반응형 데모와 설치 안내](https://m1kapp.github.io/m1kskills/work-coordinates/)

#### 설치와 활성화는 별개입니다

플러그인 설치만으로 `AGENTS.md`는 바뀌지 않습니다. 영구 활성화는 사용자가 아래처럼 명시적으로 요청한 한 번의 절차입니다.

```
작업 좌표를 활성화해줘. 먼저 dry-run과 diff를 보여줘.
```

활성화 도구는 `CODEX_HOME`을 우선하고, 없으면 `~/.codex`를 씁니다. 비어 있지 않은
`AGENTS.override.md`가 있으면 그 파일을, 아니면 `AGENTS.md`를 선택하며 이유를 표시합니다.
기존 파일은 덮어쓰지 않고 관리 마커 블록만 삽입·갱신합니다. 적용 전 diff, 적용 시 백업,
재실행 중복 방지, 제거 뒤 마커 밖 바이트 복원을 자동 검증합니다.

Codex CLI에서 설치하려면:

```
codex plugin marketplace add m1kapp/m1kskills
codex plugin add work-coordinates@m1kskills
```

Claude Code는 위의 `/plugin` 명령을 쓰고, Cursor는 저장소의 `.cursor-plugin` 매니페스트와
`skills/work-coordinates` 정본 링크를 통해 같은 스킬을 읽습니다. 활성화 뒤에는 전역 지침을
다시 읽도록 **새 세션**을 시작해 동작을 확인하세요.

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

### `dualdeck` — 리포트 = 발표자료 (HTML 한 장)

읽는 문서와 띄우는 문서를 따로 만들면 **숫자가 어긋납니다.** 이 스킬은 둘을 같은 파일로 만듭니다.
빌드도 CDN도 에셋도 없어서 `file://` 로 열리고, 메일로 보내도 그대로 동작합니다.

```
/dualdeck
```
또는 "리포트 써줘", "발표자료로도 되게", "HTML로 정리해줘"

| 들어 있는 것 | |
|---|---|
| **두 모드** | 우상단 ⋯ → 리포트 / 프레젠테이션. 16:9 스테이지에 맞춰 배율 자동 계산 |
| **8개 팔레트** | purple · latte · coral · forest / mocha · tokyo · dracula · nord — **긍정·부정·차트색까지 함께** 바뀜 |
| **PDF · 단축키** | `⌥1` 리포트 · `⌥2` 프레젠테이션 · `←/→` 슬라이드 · `⌥\` 팔레트 |
| **컴포넌트** | 결론 박스 · 지표 타일 · 표 · 2단 대조 · 흐름도 · 강조/**고지** 블록 |
| **한글 타이포** | `keep-all` · `text-wrap: pretty/balance` · 글줄 폭 상한 없음 |

구조 규칙은 하나뿐입니다 — **`.sl` 하나가 슬라이드 하나.**

```html
<section data-sec="03 · 라벨">
 <div class="sl"><div class="sl-in"> ...내용... </div></div>
</section>
```

- **잉크 우선.** 리포트는 검정·회색·굵기로 읽습니다. 강조색은 화면당 한두 곳.
- **하드코딩 색 금지.** `var(--pp)` 를 쓰지 않으면 팔레트를 바꿨을 때 그 요소만 튑니다.
- **`.cal.honest` 는 필수.** 못 한 것·틀린 것·쓰면 안 되는 수치를 적는 블록입니다.
- 단축키는 `e.code` 로. `e.key` 는 **한글 입력기에서 통째로 죽습니다.**

👉 [셸 파일 하나](examples/dualdeck/) — 복사해서 내용만 채우면 됩니다.
👉 [섹션 순서 레시피](examples/dualdeck/PATTERNS.md) — 비교 리포트 · 기술 설명 자료 · 측정 보고 3종

### `logodown` — 앱 아이콘·파비콘 (고르는 것까지 대신)

프로젝트 이름과 README를 읽고 **심볼 148개 + 문자(영문·숫자·한글)** 중에서 슬롯 두 칸을 정합니다.
`M + ↓` 가 마크다운 마크인 것처럼, 이니셜 하나와 뜻을 담은 심볼 하나를 붙이는 문법입니다.
색과 스타일까지 정해서 **후보를 여러 개 만들어 보여주고**, 고르면 에셋 한 벌이 나옵니다.

```
/logodown
```

나오는 것 — `icon.svg` · `favicon.ico`(16·32·48) · `apple-touch-icon.png` ·
`icon-192/512.png` · `icon-maskable-512.png` · `manifest.json` · `head.html`

- **크기·정렬은 자동.** 심볼마다 다른 그리드 여백을 실측한 잉크 bbox 로 정규화해서, 글자 옆에 놓아도 위아래 끝이 맞습니다.
- **작은 크기 기준으로 고릅니다.** 파비콘은 16px 입니다 — 선이 얇거나 요소가 많으면 뭉갭니다.
- 웹 UI 로 직접 만지고 싶으면 [logodown.m1k.app](https://logodown.m1k.app). URL 파라미터로 상태를 그대로 주고받습니다.

👉 엔진과 CLI 는 [m1kapp/logodown](https://github.com/m1kapp/logodown) — 플러그인 없이 `npx github:m1kapp/logodown` 으로도 씁니다.

---

#### Claude Code가 아니어도 씁니다

**쓰던 AI에 아래 3줄만 던지세요.** 나머지는 그쪽 에이전트가 알아서 합니다.

```
https://raw.githubusercontent.com/m1kapp/m1kskills/main/AGENTS.md

이 문서를 읽고 "Verify Badge" 지침을 그대로 따라서,
지금 작업 중인 자료에 검증 이력 뱃지를 붙여줘.
```

웹을 못 읽는 환경이면 필요한 [`skills/<이름>/SKILL.md`](skills/)만 대화에 붙여넣어
일회성으로 쓸 수 있습니다. 기존 `AGENTS.md`를 통째로 복사하거나 덮어쓰지 마세요.

**지속해서 쓸 때:**

| 도구 | 두는 곳 |
|---|---|
| **Codex** | 플러그인 설치 뒤 Work Coordinates의 dry-run 병합 |
| **Cursor · Copilot · Windsurf · Zed** | 기존 프로젝트 지침을 보존한 수동 병합 |
| **Claude 웹·앱** | Project → Project instructions |
| **ChatGPT** | Custom GPT → Instructions |
| **Gemini · 기타** | 대화 시작 시 위 3줄 |

> `AGENTS.md` 는 [AAIF(Linux Foundation)](https://agents.md) 크로스툴 표준으로 28개+ 툴이 읽습니다.
> Work Coordinates 활성화는 관리 마커 사이만 바꾸며 프로젝트 `AGENTS.md`는 경고만 하고 수정하지 않습니다.


---

## ✅ 필요 조건

프롬프트로만 쓸 때는 없습니다. Work Coordinates의 비파괴 전역 활성화 도구는 Python 3가 필요합니다.
API 키는 필요하지 않습니다.

---

## ❓ 자주 묻는 질문

### `work-coordinates`

**Q. 설치하면 제 `AGENTS.md`가 바뀌나요?**
아니요. 설치와 활성화는 분리돼 있습니다. 사용자가 활성화를 명시해야 먼저 dry-run과 diff를 보여주고,
다시 적용을 승인한 뒤에만 전역 파일의 관리 마커 블록을 바꿉니다.

**Q. 프로젝트 지침과 충돌하면요?**
Codex는 프로젝트 지침을 전역 지침 뒤에 읽습니다. 활성화 도구는 충돌 가능성을 경고하지만 프로젝트 파일은 수정하지 않습니다.

### `verify-badge`

**Q. 뱃지가 "이 자료 믿어도 된다"는 보증인가요?**
아니요, 정반대입니다. **감사(audit) 기록**입니다. 못 믿을 항목을 `C 자릿수만`·`D 미검증`으로 깎아서 적고, "못 한 것" 탭에 남은 숙제를 남깁니다. 등급이 낮게 나오는 게 정상 동작입니다.

**Q. 검증을 안 했으면 뱃지를 못 붙이나요?**
붙습니다. 대신 **"발견 0건 — 그만큼 검증 깊이가 얕았을 수 있음"** 으로 적힙니다. 없는 검증을 지어내지 않는 게 이 스킬의 1번 원칙입니다.

**Q. 칩의 `N× reviewed` 는 무슨 숫자인가요?**
**교차검증 라운드 수**(`rounds`)입니다. 고친 건수(`findings`)와 다릅니다 — 섞으면 칩과 상세 내용이 서로 다른 숫자를 말하게 됩니다. 라운드 수를 모르면 `N×` 를 아예 빼는 게 맞습니다.

---

## 📦 여기 있던 `claude-run` 은?

[**m1kapp/claude-rank**](https://github.com/m1kapp/claude-rank) 로 옮겼습니다. 랭킹 서비스와 한 리포에 있는 게 맞아서요.

```
/plugin marketplace remove m1kskills      # 예전에 여기서 설치했다면
/plugin marketplace add m1kapp/claude-rank
/plugin install claude-run@claude-rank
```

---

## 🔧 마켓플레이스 관리 (기여자용)

새 플러그인 추가:
1. `plugins/<이름>`에 클라이언트 매니페스트와 컴포넌트 추가
2. Claude는 `.claude-plugin/marketplace.json`, Codex는 `.agents/plugins/marketplace.json`에 연결
3. 루트 `skills/<이름>` 심링크로 Cursor와 루트 플러그인에도 같은 정본 노출
4. skill·plugin validator와 영향 범위 테스트 뒤 버전 갱신

기존 사용자는 `/plugin marketplace update m1kskills` 로 갱신받습니다.
플러그인 수정 배포 시 `plugin.json`의 `version`을 올려야 사용자에게 업데이트가 노출됩니다.

---

## 라이선스

MIT © m1kapp
