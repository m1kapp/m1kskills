# Verify Badge — 산출물 디자인 스펙

HTML 뱃지를 만들 때만 읽으면 된다. 마크다운·슬라이드 형식이면 필요 없다.

#### Design spec

**Signature color = amber/gold.** Must differ from the document's own accent. Amber reads as certificate/seal/signature, matching "verified", and won't clash with typical teal/blue body accents.
```css
:root{ --amber:#a8761a; --amber-soft:#faf3e6 }                    /* 기본은 라이트 */
:root[data-vb-theme="dark"]{ --amber:#d9a441; --amber-soft:#2e2413 }
```

**호스트 문서의 팔레트를 먼저 확인한다.** `body` 배경과 `:root` 변수에 다크 대응이 있는지 본다. 없으면 배지도 라이트로 고정하고 `data-vb-theme`를 붙이지 않는다. `@media (prefers-color-scheme:dark)`를 쓰면 **OS가 다크일 때 라이트 고정 문서 안에서 배지만 뒤집힌다** — 실제로 어두운 배경 위에 어두운 글자가 나왔다. 다이얼로그에 `color-scheme:light`도 함께 박아 UA 기본 스타일이 새는 경로를 막는다.

**앰버는 쓰되 면을 칠하지 않는다.**

| 앰버 | 중립(호스트 색) |
|---|---|
| 등급 아이콘·등급명 · 활성 탭 밑줄 · 통계 숫자 · 타임라인 막대 · 조치 비용 열 · 출처 링크 · 칩 hover | 헤더 바 · 표 헤더 · 그룹 헤더 행 · 노트 박스 · 레벨 표 현재 행 |

헤더 바나 표 배경을 앰버로 채우면 **템플릿처럼 보이고 호스트 문서와 겉돈다.** 목표는 그라파이트 헤더 바 + 앰버 등급명이다. 활성 탭도 밑줄로만 표시한다.

**왼쪽 강조 보더를 덧붙이지 않는다.** 면 색과 테두리로 이미 구분된다. 호스트가 그 패턴을 쓰더라도 배지는 따라가지 않는다 — 배지 안에서 위계를 또 만들면 시끄럽다.

Reusing the body accent makes it read as "just another section."

**(A) Footer signature + mini chip** — bottom of document (copyright position)
```
Made by {org} {author} · Powered by {AI tool}
© {year} {company} · {use} · 데이터 기준일 {date}
            [ ⛨ VERIFIED │ N× reviewed ]     ← click → (B)
```
**The chip label is a readiness level, and it is DERIVED — never authored.** A chip that always reads "VERIFIED" carries no information: a report graded A throughout and one graded D throughout look identical, so the badge launders the weak one for any reader who does not open it. Compute the level from `grades` instead, and let the author's own honesty set it:

| Level | Chip text | Icon | Condition |
|---|---|---|---|
| D | `VERIFY BEFORE USE` | magnifier | any key metric is D · **or** `sources` is empty · **or** no grades recorded |
| C | `DIRECTIONAL ONLY` | compass | worst grade is C |
| B | `REFERENCE ONLY` | book | worst grade is B |
| A | `CITE AS-IS` | shield-check | every metric is A |

Keep the labels **short and English** even in a Korean document — they sit in a monospace chip where a Korean phrase wraps, and terms like "자릿수만" need a legend to parse. The Korean explanation belongs on hover and in the widget.

**Differentiate by icon, not colour.** A red or amber chip makes the whole document look alarming, which quietly punishes the author for grading honestly — exactly the incentive this skill must not create. Keep the chip neutral grey at every level and let the icon carry the meaning.

**Put the level widget at the top of the dialog**, above the stat cards — it is the answer to "can I use this", so it should not be buried in a tab. Give it an `!` button that opens the four levels **in a nested dialog**, not an inline expander — the panel pushes everything below it and makes the dialog jump, the exact instability the fixed tab height was introduced to avoid. Keep that table on one line per row (`white-space: nowrap`, generous dialog width); a wrapped condition column reads as noise. Mark the current level so the reader sees both the ceiling and the distance to it.

**출처에는 반박 경로가 반드시 있어야 한다.** 외부 문서는 **URL을 적기 전에 연다** — 기억이나 앞선 문서에서 인용한 값은 1차 출처가 아니고, 링크를 붙이는 행위 자체가 검증 단계다. 내부 측정(API·DB·코드)에는 URL이 없으니 대신 **그대로 다시 돌릴 수 있는 명령**을 넣는다.

```
출처                      확인한 값                재현 경로
Elastic 샤드 사이징 가이드 ↗  10-50GB · 샤드당 2억 문서   공개 문서
ES 인덱스별 primary 바이트   comment_hybrid 1,510 GiB   GET .monitoring-es-*/_search {type:index_stats}
운영 DB flow_chat_msg       구간 203,176 / 173,559     SELECT count(*) FILTER (WHERE ...)
```

URL이든 명령이든 **반박 경로가 없는 출처는 출처가 아니다.**

**Weakest link sets the level** — averaging hides the one number that will break someone's decision. And no primary sources means level D regardless of grades: without a check path the reader cannot dispute anything, so the grades are unfalsifiable.

Say *what to do*, not what grade it got. "스스로 더 검증하세요" is actionable; "●○○" needs a legend. Put the reason on hover (`title`) and repeat the level at the top of the grades tab so opening the dialog explains the chip.

If the author asks to raise the level, the answer is to raise the evidence — add a primary source, run the measurement. Editing the label directly is forbidden.

**N = cross-check rounds (`rounds`), never `findings.length`.** They are different numbers — rounds is how many times you re-verified, findings is how many errors that surfaced. Bind the chip to the wrong one and the badge contradicts its own stat cards ("6차 교차검증" inside, "3× reviewed" on the chip). If rounds is unknown, omit the `N×` segment entirely rather than substituting a number that happens to be available.

Chip must be **neutral outline, monospace, tight padding** (3/9px). Loud chips cheapen the document. Amber only on hover.

**(B) Detail dialog** — compact header, then tabs

```
[ ⌖ DIRECTIONAL ONLY   가정이 결과를 좌우 — 방향·자릿수 감만        [!] ]
105 프롬프트 · 6차 교차검증 · 6시간 39분 실투입 · 3일 실작업 · 2026-07-26 기준 · Claude Opus 5
──────────────────────────────────────────────────────────────────
 ①            ②            ③            ④            ⑤
어떻게 팠나   얼마나 믿나  뭘 바로잡았나  어디서 왔나   뭘 못했나
 12구간      최저 C·4항목  6건·치명 3   1차 출처 8   3건 미검증
```

Author info lives **only in the footer signature (A)**. Repeating it inside the dialog is redundant and visually heavy.

**Header: one widget, one line.** The readiness widget answers "can I use this"; a single measured line answers "how hard was this worked". Resist stat *cards* — four boxes eat vertical space and end up repeating what the tab subtitles already say. Any figure that appears both in the header and in a tab subtitle must be cut from one of them.

**Name tabs after the reader's questions, not your artifacts.** "어디까지 확인" and "직접 확인" both contain 확인 and cannot be told apart; "고친 것" does not say what was fixed. Five parallel questions in the same grammatical form read as one set and need no legend:

| # | Tab | Subtitle carries |
|---|---|---|
| ① | 어떻게 팠나 | burst count |
| ② | 얼마나 믿나 | **worst grade** + item count |
| ③ | **뭘 바로잡았나** | findings + how many 치명 |
| ④ | 어디서 왔나 | primary-source count |
| ⑤ | 뭘 못했나 | unverified count |

**Subtitles must carry information, not labels.** "근거 수준" tells the reader nothing — "최저 C · 4항목" tells them the verdict before they click. Number the tabs (①–⑤); it signals these are read in order, and the numbered badge gives the active tab a second visual anchor besides the underline.

Each tab gets a **one-line lead sentence** so the reader knows what they're looking at.

**UX spec**

- **탭 패널 높이는 모든 탭이 같기만 하면 된다.** 절대 픽셀 대신 `height:clamp(340px,64vh,660px)`. 작은 화면에서는 340px를 지키고 큰 화면은 활용한다. 상한은 4K에서 표가 과하게 늘어나는 것을 막는다
- 다이얼로그 폭 ≈920px. 타임라인 라벨 열이 덜 접힌다
- 배경 클릭으로 닫고, 열려 있는 동안 `body` 스크롤을 잠근다

**호스트 문서의 다이얼로그 크롬을 재사용한다.** 문서에 이미 다이얼로그가 있으면 그 헤더 구조(제목 + 닫기를 한 flex 바에)를 그대로 쓰고 **강조색만 바꾼다**. 배지가 자기 크롬을 만들면 — 특히 `position:absolute` 닫기 버튼 — 다른 컨트롤과 자리를 다투고 덧붙인 것처럼 보인다. **레벨 위젯은 헤더 바에 흡수시킨다**; 별도 위젯으로 두면 등급이 헤더와 위젯에 두 번 나온다. **중첩 다이얼로그(레벨 legend)도 같은 패턴**을 쓴다 — 닫기가 본문 끝에 있으면 스크롤해야 닫힌다.

```
[ ⌖  DIRECTIONAL ONLY   가정이 결과를 좌우 — 방향·자릿수 감만   (!)  닫기 ✕ ]
```

**모든 표에 `<thead>`를 붙인다.** 열이 3~5개인데 헤더가 없으면 무엇을 보는 열인지 추론해야 한다.

| 탭 | 헤더 |
|---|---|
| ① | 시각 · 추이 · 소요 · 턴 · 무엇을 했나 |
| ② | 항목군 · 등급 · 왜 이 등급인가 |
| ③ | 심각도 · 무엇을 뒤집었나 · 어떻게 드러났나 · 결과 |
| ④ | 출처 · 확인한 값 · 재현 경로 |
| ⑤ | 확인 못한 것 · 대상 · 왜 남겨두면 위험한가 · 해소 비용 |

헤더 문구도 정보를 나른다. "왜 남겨두면 위험한가"는 gap이 단순 목록이 아니라 **리스크 서술**임을 알린다.

**다만 sticky는 쓰지 않는다.** 세 함정이 줄줄이 걸린다 — ①`border-collapse:collapse`에서는 테두리가 표에 속해 고정 시 아래 선이 안 따라온다 ②`separate`로 바꿔 그룹 헤더를 2단으로 붙이면 `top`을 눈대중하는 순간 열 헤더 위로 겹친다 ③겹침을 배경으로 가리려 `td`에 배경을 일괄로 주면 호스트의 `.bg-bad` 같은 강조 셀을 명시도로 덮는다. 패널이 이미 `64vh`라 헤더가 화면 밖으로 나가는 일이 드물다 — **비용이 효용을 넘는다.** 고정이 필요할 만큼 긴 표라면 패널을 나누거나 행을 줄인다.

**타임라인의 소요와 턴은 별도 열로 나눈다.** 한 칸에 세로로 겹치면 행이 두 줄이 되어 구간이 20개만 넘어도 훑기 어렵다. 소요는 본문색·좌측, 턴은 보조색·우측, 둘 다 등폭.

**(C) Usage scope belongs in the body** — not inside the badge
Badge = "how hard this was worked." Body banner = "so how far can you use it." Mixing them blurs both.
```
●●● 그대로 인용   {physics / primary-source items}
●●○ 상대 비교만   {assumption / market-rate items}
🔴 사용 금지      {client proposals · SLA · final conclusions}
```

