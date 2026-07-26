---
name: verify-badge
description: Attach a verification-history badge when finishing a report, analysis, or calculator. This is an audit, not a rubber stamp — record only what was actually verified, grade confidence coldly, and state what still needs digging. Use for "뱃지 붙여줘", "검증 이력", "이 리포트 신뢰도", "verify-badge", or when wrapping up / sharing any analytical deliverable.
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
| Prompt count · work period | Transcript — **count, don't estimate** (see below) |

**If nothing was caught, say "발견 0건."** That's a deduction to disclose, not hide.

#### Count the countable — never estimate prompt volume or work days

Prompt count and work period look like soft numbers, so the temptation is to eyeball them ("~90 prompts, 5 days"). Don't. In Claude Code they are **exactly measurable**, and a guessed stat on a badge whose first principle is "never invent verification" discredits every other number on it.

Transcripts live at `~/.claude/projects/<slugified-cwd>/*.jsonl` — one JSON object per line. A real human turn is `type == "user"` **minus** four things that also arrive as `user`:

| Exclude | How it looks |
|---|---|
| Tool results | `message.content` array contains a `tool_result` block |
| Injected context | `isMeta: true` |
| System reminders | text starts with `<system-reminder>` |
| Slash commands & their output | text starts with `<command-name>`, `<command-message>`, `<command-args>`, `<local-command-stdout>` |

That last row is the one people miss — `/model`, `/clear` and the stdout echoed back afterwards all land in the transcript as `user` turns. They are not prompts about the work.

```python
import json, glob
SKIP = ("<system-reminder>", "<command-name>", "<command-message>",
        "<command-args>", "<local-command-stdout>")
turns = []
for f in glob.glob(f"{TRANSCRIPT_DIR}/*.jsonl"):
    for line in open(f, encoding="utf-8", errors="replace"):
        try: e = json.loads(line)
        except: continue
        if e.get("type") != "user" or e.get("isMeta"): continue
        c = (e.get("message") or {}).get("content")
        if isinstance(c, list):
            if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c): continue
            t = "".join(b.get("text","") for b in c if isinstance(b, dict) and b.get("type") == "text")
        elif isinstance(c, str): t = c
        else: continue
        t = t.strip()
        if not t or t.startswith(SKIP): continue
        turns.append((e.get("timestamp","")[:10], t))
```

**A session is not one deliverable.** Long sessions drift — the calculator becomes the badge becomes an unrelated bug fix — and stray terminal pastes land mid-stream. Counting the whole session inflates the badge. So after filtering, segment:

1. **Find the topic boundary.** Search the turns for where the subject changes (first mention of the next deliverable) and slice there. Print the two turns on either side and confirm the cut is where you think it is.
2. **Drop strays inside the slice.** Pasted shell sessions, logs, and half-finished thoughts belonging to other work. Scan the slice; a paste starting with a shell prompt (`user@host$`, `Last login:`) is the usual case.
3. **State what you counted.** "105 prompts (calculator slice; session total 177)" is honest. A bare "177" is not.

Then:
- **Prompt count** = the size of that slice, after strays.
- **Work period** = distinct dates in the slice, **not** first-to-last span. Three active days inside a five-day window is "3일(07-22·23·26)", never "5일 분산". Report the per-day distribution when it is lopsided — hiding a final-night push is the same sin as inflating the total.

Outside Claude Code, or when no transcript is reachable, write **"미측정"**. Do not substitute a guess.

#### Then build the trajectory — the one part readers actually trust

A prose list of "angles I explored" is still self-report; the author writes whatever sounds good. The same turns carry **timestamps**, and those are hard to fake without forging the transcript. Cluster them into work bursts and you get a trajectory that shows depth instead of claiming it.

Split the slice wherever the gap between consecutive turns exceeds **30 minutes**. Each burst becomes one row: `{d, t, min, n, k, s}` — date, start time, duration, prompt count, what got carved, one line of detail.

```python
bursts = [[turns[0]]]
for prev, cur in zip(turns, turns[1:]):
    (bursts[-1] if (cur.ts - prev.ts).total_seconds() <= 1800
     else bursts.append([]) or bursts[-1]).append(cur)
```

Render each row as a bar whose **width is proportional to duration**, not prompt count. Time-on-task is what "digging" means; ten rapid-fire tweaks are not deeper than one hour of wrestling with a formula.

What makes this convincing is the shape, so don't sand it down:
- **The long bar** is where the thinking actually happened — label it with what changed, not what was done ("격자표를 계산기로 뒤집음", not "UI 작업")
- **Single-prompt ticks** prove the work was revisited over days rather than crammed. Keep them; they read as diligence, not noise
- **Abandoned directions belong in the label.** "기업 케이스 매칭 시도 → 근거 부족으로 폐기" is the single most credible line a badge can carry, because nobody invents a dead end they took

Fall back to the prose `angles` list only when no timestamps are available.

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

- **Tab 1 · 파고든 궤적** — the timestamp-derived burst timeline (see Step 1). **Put it first** — trust comes from the trajectory of thinking, and this is the only tab whose data the author did not author. Bars sized by duration; label each with what changed and name the dead ends.
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
- **Estimating a countable stat** — guessing prompt volume or work days when the transcript is right there
- Counting a whole session as one deliverable, so unrelated work inflates the number
