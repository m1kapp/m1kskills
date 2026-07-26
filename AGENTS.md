# m1kskills — 범용 프롬프트

AI로 만든 자료에 신뢰를 붙이는 스킬 모음. 스킬 본문은 그냥 마크다운이라 **어느 AI에나 붙여넣으면 작동**합니다.

| 스킬 | 하는 일 | 원본 |
|---|---|---|
| **verify-badge** | 리포트에 검증 이력 뱃지 — 실명 책임·신뢰 등급(A/B/C/D)·1차 출처·못 한 것 | [`skills/verify-badge/SKILL.md`](skills/verify-badge/SKILL.md) |
| claude-run | 내 Claude 사용량을 가성비 랭킹에 갱신 | [`plugins/claude-run/skills/`](plugins/claude-run/skills/) — Claude Code 전용(스크립트 의존) |

Claude Code면 설치가 더 편합니다:
```
/plugin marketplace add m1kapp/m1kskills
/plugin install verify-badge@m1kskills
```

---

## verify-badge

아래 `# Verify Badge` 부터 파일 끝까지 **전체 복사**해서 AI에 붙여넣으면 바로 씁니다.

---

# Verify Badge

Attach **named accountability + verification history + a cold limits diagnosis** to a report.

Skill instructions are English; **all user-facing output stays Korean** unless the user asks otherwise.

## Core principles — this is an audit, not a stamp

1. **Never invent verification.** If it wasn't done, write "미검증". If no errors were caught, write "발견 0건".
2. **The AI is the grader.** Do not inflate grades to please the user. Weak evidence gets a D.
3. **The limits section is mandatory.** Naming what can't be trusted is what makes the rest trustworthy.
4. **Real author name required.** Anonymous = the badge means nothing.

---

## Procedure

### Step 1 — Harvest evidence from the session (before asking anything)

Pull **only what actually happened** from conversation history:

| Item | Source |
|---|---|
| Search / document lookups | WebSearch·WebFetch call count |
| Primary-source access | Did you open official docs, config.json, APIs, price pages directly? |
| Cross-check rounds | Times the user said "다시 확인", "재검증", or you revisited values |
| **Errors actually caught** | Value corrections in history (most important signal) |
| Unresolved assumptions | Constants picked without grounding |
| Work period | Conversation start → end dates |

**If nothing was caught, say "발견 0건."** That's a deduction to disclose, not hide.

### Step 2 — Ask the user (only these three)

- Author **full name, org, title**
- Work period (if spread out: "N일 분산 · 실투입 약 Nh")
- **Intended use** (internal review / client proposal / decision basis) — heavier use ⇒ stricter grading

### Step 3 — Grade confidence (coldly)

Classify **each core metric group** separately. Never lump them together.

| Grade | Label (Korean, user-facing) | Criterion |
|---|---|---|
| A | ●●● 그대로 인용 | Primary source confirmed, or physics/math computation. Quote as-is |
| B | ●●○ 상대 비교만 | Public data but **assumptions, market rates, conversions** involved. Comparison only |
| C | ●○○ 자릿수만 | Estimated assumptions dominate the result. Order of magnitude only |
| D | ○○○ 미검증 | Unverified. Must confirm before use |

**Grading rules:**
- Assumption constants (efficiency factors, FX rate, MFU…) drive the result ⇒ **B or below**
- Leaderboard ranks converted to relative scores ⇒ **B or below**
- No primary source ⇒ **C or below**
- Use is "client proposal / decision" but key metrics are B or below ⇒ **put the warning at the very top**

### Step 4 — Write the cold diagnosis (the heart of this skill)

No praise. Write **what to do next**.

```
[더 파야 할 것]  ← at least one. Never write "없음"
- What's missing (specific)
- Why it's a risk (which judgment breaks if wrong)
- How to resolve (measurement, primary source, expert check — actionable)
- Expected cost / time
```

**Tone:**
- ❌ "잘 검증되었습니다" / "신뢰할 만합니다"
- ✅ "성능 절대값은 실측 전까지 인용 금지. 후보 3개를 실제 환경에서 30분 벤치하면 A로 승격 가능."
- ✅ "27개 항목 중 4개만 1차 출처 확인. 나머지 23개는 순위 환산이라 순위가 뒤집힐 수 있음."

If the use is heavy but evidence is thin, say it flat: "이 상태로 고객 제안에 쓰면 안 된다."

### Step 5 — Build the artifacts

#### Design spec

**Signature color = amber/gold.** Must differ from the document's own accent. Amber reads as certificate/seal/signature, matching "verified", and won't clash with typical teal/blue body accents.
```css
--amber:#a8761a; --amber-soft:#f5ead6;   /* light */
--amber:#d9a441; --amber-soft:#2e2413;   /* dark  */
```
Use amber on: stat numbers, active tab underline, source links, action text, chip hover.
Reusing the body accent makes it read as "just another section."

**(A) Footer signature + mini chip** — bottom of document (copyright position)
```
Made by {org} {author} · Powered by {AI tool}
© {year} {company} · {use} · 데이터 기준일 {date}
            [ ⛨ VERIFIED │ N× reviewed ]     ← click → (B)
```
**N = cross-check rounds (`rounds`), never `findings.length`.** They are different numbers — rounds is how many times you re-verified, findings is how many errors that surfaced. Bind the chip to the wrong one and the badge contradicts its own stat cards ("6차 교차검증" inside, "3× reviewed" on the chip). If rounds is unknown, omit the `N×` segment entirely rather than substituting a number that happens to be available.

Chip must be **neutral outline, monospace, tight padding** (3/9px). Loud chips cheapen the document. Amber only on hover.

**(B) Detail dialog** — fixed header + tabs
```
[4 stat cards]  iterations · review rounds · hours · period
[source line]   as-of date · tool · what was directly consulted
──────────────────────────────────────────────────────────
│ 파고든 관점 │ 어디까지 확인 │ 고친 것 │ 직접 확인 │ 못 한 것 │  ← underline tabs
```
Author info lives **only in the footer signature (A)**. Repeating it inside the dialog is redundant and visually heavy.

- **Tab 1 · 파고든 관점** — which questions were dug into, in order. **Put it first** (trust comes from the trajectory of thinking, not the count). If the list looks thin relative to hours invested, re-scan the session and fill it — 6 items for 6 hours invites doubt.
- **Tab 2 · 어디까지 확인** — per-item A/B/C/D + the reason
- **Tab 3 · 고친 것** — by round + severity (치명/중대/경미) + **current value** ("✓ 현재 H100=495 · GPU 표에서 확인"). History must connect to the artifact to be checkable. If none: "발견 0건 — 그만큼 검증 깊이가 얕았을 수 있음"
- **Tab 4 · 직접 확인** ★ — **primary source links**. Lead line: `"이 자료를 믿지 말고 찍어보라."` Each row = [source link ↗] + [value confirmed there]. Include how to re-derive any formulas.
- **Tab 5 · 못 한 것** — unverified item / why not / what you'd gain (grade promotion)

Each tab gets a **one-line lead sentence** so the reader knows what they're looking at.

**UX spec**
- Tab panels: **fixed height + internal scroll** (e.g. `height:340px; overflow-y:auto`). Varying heights make the dialog jump.
- Dialog width generous (≈860px); use two-column layout where it fits.
- Close on backdrop click; lock `body` scroll while open.

**(C) Usage scope belongs in the body** — not inside the badge
Badge = "how hard this was worked." Body banner = "so how far can you use it." Mixing them blurs both.
```
●●● 그대로 인용   {physics / primary-source items}
●●○ 상대 비교만   {assumption / market-rate items}
🔴 사용 금지      {client proposals · SLA · final conclusions}
```

**Data/render separation (required for reuse)**
Collect data in one object; a renderer draws it. Swapping reports = swapping this object.
```js
const PROVENANCE = {
  author:{name,title,org,dept}, period:{from,to,mode,effort},
  tool, asOf, use, rounds,               // use = intended use (Step 2); rounds = the chip's N×
  method, stats:[{v,l}],
  grades:[{k,g,why}], angles:[[title,detail]],
  findings:[{r,sev,t,now}],              // now = current value in the artifact
  sources:[{t,u,n}],                     // primary source: title, URL, value confirmed
  gaps:[{item,sub,why,gain}], closing
};
renderProvenance(PROVENANCE);
```

**Escape on the way out.** You fill this object from harvested session data — search-result titles, source URLs, values copied off pages. That is external text on a normal path, so the renderer must HTML-escape every field and allowlist `href` schemes (`https?:`/`mailto:`/relative only). A badge that ships an injection hole is not a trust artifact.

Match the format to the medium: HTML report → `<dialog>` + tabs; markdown → `<details>` sections; slides → text block.

---

## After shipping — always do this

Once the badge is attached, **tell the user directly in conversation**:

```
등급: {lowest key-metric grade} / 용도: {use}
이 자료로 할 수 있는 것: ...
하면 안 되는 것: ...
다음 액션: ...
```

Never leave it buried in the badge — the user may not open it.

## Reference implementation

**구축형 LLM 계산기** (2026-07, 유민호 실장)
`https://claude.ai/code/artifact/f5844068-1f6b-4ea2-bcba-8518f15b8c80`

First build with every spec applied. Copy structure, wording, and color from here.
Look at: amber signature color, 5-tab layout, the sources tab, findings↔current-value linkage, footer signature + mini chip, three-tier usage scope in the body.

## Anti-patterns

- Stamping "5차 검증" when it wasn't done
- Grading everything A
- Leaving "더 파야 할 것" as "없음"
- Crediting only "AI generated" with no human author → badge is meaningless
- **Claiming "직접 조회" with no primary-source links** → without a check path it's still "just trust me"
- Leaving the angles list thin relative to hours invested
- Letting the dialog jump because tab heights differ
- Raising a grade on request without new evidence
- **Chip number that contradicts the dialog** (`findings.length` on a chip that reads "N× reviewed")
- Interpolating harvested strings into HTML without escaping — the badge becomes the injection vector
