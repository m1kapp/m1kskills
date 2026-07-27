---
name: verify-badge
description: Attach a verification-history badge when finishing a report, analysis, or calculator. This is an audit, not a rubber stamp — record only what was actually verified, grade confidence coldly, and state what still needs digging. Use for "뱃지 붙여줘", "검증 이력", "이 리포트 신뢰도", "verify-badge", or when wrapping up / sharing any analytical deliverable.
allowed-tools: Bash(python3 *) Read Write Edit Glob
---

## Measured evidence (already computed — do not re-derive)

```!
python3 "${CLAUDE_SKILL_DIR}/scripts/measure.py" 2>&1 || echo "미측정 — 트랜스크립트 접근 불가"
```

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
| Prompt count · work period | Transcript — **count, don't estimate** (see below) |

**If nothing was caught, say "발견 0건."** That's a deduction to disclose, not hide.

#### The numbers are already measured — do not re-derive them

The block at the top of this file ran `scripts/measure.py` before you saw any of this, so the burst table and the JSON line are **already in your context**. Read them; do not open transcripts yourself. Hand-counting is slower and it is where the mistakes live — UTC rendered as local time, slash-command echoes counted as prompts, notification blocks counted as human turns. The script filters all of that.

What the script cannot decide, and you must:

1. **Which slice is this deliverable.** The table covers the whole session, and long sessions drift. Find where the topic changed, cut there, and **say what you counted** — "105건(계산기 구간; 세션 전체 191)". A bare session total is dishonest.
2. **What each burst carved.** The script prints each burst's opening prompt; turn that into a label describing *what changed*, not what was done. Name the dead ends — an abandoned direction is the most credible line a badge can carry.
3. **Work period** = the distinct dates in your slice, never first-to-last span. Three active days in a five-day window is `3일`, not `5일 분산`.

If the script reports `미측정`, write 미측정. Never substitute a guess.

Methodology, filter rules and the manual fallback: [`reference/measuring.md`](reference/measuring.md).

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

Full layout, colour, tab and widget spec: **[`reference/design.md`](reference/design.md)** — read it only when you are building an HTML badge. For markdown (`<details>` sections) or slides, the data model below is all you need.

**Do not write the renderer — it ships with this skill.**

| File | Use |
|---|---|
| `assets/badge.js` | `mount(el, PROVENANCE)` — signature, chip, dialog, tabs, timeline, level widget |
| `assets/badge.css` | amber signature colour, light/dark, fixed tab height |
| `assets/provenance.example.js` | a filled-in object to copy the shape from |

Copy the two assets next to the document and author **only the data object**. Re-generating the renderer each time costs hundreds of output tokens and quietly drops hard-won details — HTML escaping, the `javascript:` scheme block, derived chip levels, keyboard tab navigation. If the medium is not HTML, keep the same data object and render it as `<details>` sections or a text block.

**Data/render separation**
Collect data in one object; a renderer draws it. Swapping reports = swapping this object.
```js
const PROVENANCE = {
  author:{name,title,org,dept}, period:{from,to,mode,effort},
  tool, asOf, use, rounds,               // use = intended use (Step 2); rounds = the chip's N×
  method, stats:[{v,l}],
  grades:[{k,g,why}],
  timeline:[{d,t,min,n,k,s}],          // work bursts from timestamps — the trust anchor
  angles:[[title,detail]],               // prose fallback when no timestamps
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
- **A chip that reads the same no matter how weak the report is** — it launders bad work past anyone who doesn't open it
- Hand-writing the readiness level instead of deriving it from the worst grade
- Tab names that repeat a word (확인/확인) or describe your artifacts instead of the reader's question
- Subtitles that are labels ("근거 수준") where a value would fit ("최저 C · 4항목")
- The same figure printed in both the header and a tab subtitle
- A prose "angles" list that restates the burst labels
- **Estimating a countable stat** — guessing prompt volume or work days when the transcript is right there
- Counting a whole session as one deliverable, so unrelated work inflates the number
