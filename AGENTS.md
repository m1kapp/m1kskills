# m1kskills — 범용 프롬프트

본문이 그냥 마크다운이라 **어느 AI에나 붙여넣으면 작동**합니다. 준비물 없음.

| 스킬 | 하는 일 | 원본 |
|---|---|---|
| **Verify Badge** | 자료에 검증 이력 뱃지 — 실명 책임 + 실제 검증 이력 + 냉정한 한계 진단 | [`skills/verify-badge/SKILL.md`](skills/verify-badge/SKILL.md) |
| **Dualdeck** | 리포트와 16:9 발표자료가 같은 HTML 한 장 — 팔레트 엔진 · 잉크 우선 타이포 · 한글 규칙 | [`skills/dualdeck/SKILL.md`](skills/dualdeck/SKILL.md) |
| **Logodown** | 앱 아이콘·파비콘 — 심볼 148개에서 직접 골라 후보 제시, SVG·ICO·PWA 에셋 한 벌 | [`skills/logodown/SKILL.md`](skills/logodown/SKILL.md) |
| **Work Coordinates** | 북극성·현재·다음·검증을 유지하고 디버깅 변경의 성격을 구분 | [`skills/work-coordinates/SKILL.md`](skills/work-coordinates/SKILL.md) |

> [m1kskills](https://github.com/m1kapp/m1kskills) 의 스킬 모음입니다.

## 가져다 쓰는 법

**쓰던 AI에 이 3줄:**
```
https://raw.githubusercontent.com/m1kapp/m1kskills/main/AGENTS.md

이 문서를 읽고 "Verify Badge" 지침을 그대로 따라서,
지금 작업 중인 자료에 검증 이력 뱃지를 붙여줘.
```

리포트를 만들 거면 마지막 줄만 바꾸면 됩니다:
```
이 문서를 읽고 "Dualdeck" 지침을 그대로 따라서,
아래 내용을 리포트 겸 발표자료 HTML 한 장으로 만들어줘.
```

로고가 필요하면:
```
이 문서를 읽고 "Logodown" 지침을 그대로 따라서,
이 프로젝트에 어울리는 앱 아이콘과 파비콘을 만들어줘.
```

웹을 못 읽는 환경이면 필요한 스킬의 `SKILL.md`를 **대화에 붙여넣어** 일회성으로 쓸 수 있습니다.
기존 `AGENTS.md`를 이 파일로 복사하거나 덮어쓰지 마세요. 지속 활성화는 Work Coordinates의
관리 마커 기반 dry-run 절차로만 병합합니다.

플러그인 없이 활성화 도구만 쓸 때도 기본은 dry-run입니다:
```
npx github:m1kapp/m1kskills status
npx github:m1kapp/m1kskills activate
npx github:m1kapp/m1kskills activate --apply
```

Claude Code면 설치가 더 편합니다:
```
/plugin marketplace add m1kapp/m1kskills
/plugin install verify-badge@m1kskills
/plugin install dualdeck@m1kskills
/plugin install logodown@m1kskills
/plugin install work-coordinates@m1kskills
```

설치만으로 사용자 지침은 바뀌지 않습니다. 활성화하려면 새 대화에서
`작업 좌표를 활성화해줘. 먼저 dry-run과 diff를 보여줘.`라고 명시적으로 요청하세요.

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

#### The numbers are already measured — do not re-derive them

The block at the top of this file ran `scripts/measure.py` before you saw any of this, so the burst table and the JSON line are **already in your context**. Read them; do not open transcripts yourself. Hand-counting is slower and it is where the mistakes live — UTC rendered as local time, slash-command echoes counted as prompts, notification blocks counted as human turns. The script filters all of that.

What the script cannot decide, and you must:

1. **Which slice is this deliverable.** The table covers the whole session, and long sessions drift. Find where the topic changed, cut there, and **say what you counted** — "105건(계산기 구간; 세션 전체 191)". A bare session total is dishonest.
2. **What each burst carved.** The script prints each burst's opening prompt; turn that into a label describing *what changed*, not what was done. Name the dead ends — an abandoned direction is the most credible line a badge can carry.
3. **Work period** = the distinct dates in your slice, never first-to-last span. Three active days in a five-day window is `3일`, not `5일 분산`.

If the script reports `미측정`, write 미측정. Never substitute a guess.

**Outside Claude Code there is no script — count by hand using the method below.**

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

**Convert to the author's local timezone first.** Transcript timestamps are UTC (`...Z`); rendering them raw shifts every burst by the offset and can move work onto the wrong day. Verify against something local in the transcript — a pasted shell banner (`Last login: ... KST`) settles it. Then split the slice wherever the gap between consecutive turns exceeds **30 minutes**. Group bursts by date: `{d, wd, rows:[{t, min, n, k, s}]}` — the date and weekday become a header row (with that day's subtotal) and each burst row carries only the start time. Repeating the date on every row wastes the column and hides the day rhythm. Render durations as `N시간 M분` once they pass an hour; a bare `399분` is unreadable.

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

**Keep the prose list only for what the timeline cannot say.** A burst label already states what changed in that stretch, so an "angles I explored" entry covering the same ground is duplication — and calling it "질문 N가지" when N does not match the burst count is simply false. Cut every prose item a burst label already covers; keep only **conclusions with numbers attached** ("SXM NVLink 900GB/s 실효율 75~85% vs PCIe 64GB/s 20~30%", "손익분기 AWS 6개월·Elice 14.5개월"). Title it accordingly — 확정한 판단, not 파고든 질문.

The division of labour: **timeline = when and what you did (log, hard to fake); prose list = what you concluded (content).** If an item does not clearly belong to one of those, it belongs in the report body, not the badge.

Fall back to the prose list entirely only when no timestamps are available.



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
어떻게 팠나   얼마나 믿나   뭘 틀렸나    어디서 왔나   뭘 못했나
 12구간      최저 C·4항목  6건·치명 3   1차 출처 8   3건 미검증
```

Author info lives **only in the footer signature (A)**. Repeating it inside the dialog is redundant and visually heavy.

**Header: one widget, one line.** The readiness widget answers "can I use this"; a single measured line answers "how hard was this worked". Resist stat *cards* — four boxes eat vertical space and end up repeating what the tab subtitles already say. Any figure that appears both in the header and in a tab subtitle must be cut from one of them.

**Name tabs after the reader's questions, not your artifacts.** "어디까지 확인" and "직접 확인" both contain 확인 and cannot be told apart; "고친 것" does not say what was fixed. Five parallel questions in the same grammatical form read as one set and need no legend:

| # | Tab | Subtitle carries |
|---|---|---|
| ① | 어떻게 팠나 | burst count |
| ② | 얼마나 믿나 | **worst grade** + item count |
| ③ | 뭘 틀렸나 | findings + how many 치명 |
| ④ | 어디서 왔나 | primary-source count |
| ⑤ | 뭘 못했나 | unverified count |

**Subtitles must carry information, not labels.** "근거 수준" tells the reader nothing — "최저 C · 4항목" tells them the verdict before they click. Number the tabs (①–⑤); it signals these are read in order, and the numbered badge gives the active tab a second visual anchor besides the underline.

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



**Write the renderer once, then never again.**

`mount(el, PROVENANCE)` draws the signature, chip, dialog, tabs, timeline and level widget; a stylesheet carries the amber signature colour, light/dark and the fixed tab height. Build both once from the spec above, keep them beside the document, and author **only the data object** for every later report. (Installed as a Claude Code plugin these ship prebuilt in `assets/`; ready-made copies also live at <https://github.com/m1kapp/m1kskills/tree/main/examples/verify-badge>.) Re-generating the renderer each time costs hundreds of output tokens and quietly drops hard-won details — HTML escaping, the `javascript:` scheme block, derived chip levels, keyboard tab navigation. If the medium is not HTML, keep the same data object and render it as `<details>` sections or a text block.

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

---

# Dualdeck

One HTML file. Two modes. **No build step, no CDN, no assets** — it opens from a `file://` path
and still works after being emailed.

Skill instructions are English; **all user-facing output stays Korean** unless the user asks otherwise.

The point is not decoration. A document that must be *read closely* and a document that must be
*projected* usually get written twice and drift apart. Dualdeck makes them the same file, so the
numbers can't disagree.

---

## Start here — do not author from scratch

Copy [`examples/dualdeck/shell.html`](examples/dualdeck/shell.html) and fill it in.
It already contains the mode toggle, 8 palettes, PDF export, shortcuts, the 16:9 stage,
and the component CSS. **Reimplementing any of that by hand is the failure mode this skill exists to prevent.**

```
examples/dualdeck/shell.html  →  <제목>.html
```

Then: replace `<title>`, the `<header>` block, and the demo `<section>`s. Touch nothing else.

섹션 구성이 안 잡히면 [`examples/dualdeck/PATTERNS.md`](examples/dualdeck/PATTERNS.md) —
비교 리포트 · 기술 설명 자료 · 측정 보고 세 유형의 섹션 순서와,
각 유형에서 자주 망가지는 지점이 적혀 있다. **셸을 유형별로 복제하지 마라** — 팔레트 엔진이 N벌이 된다.

---

## The one structural rule

```html
<section data-sec="03 · 짧은라벨">      <!-- 리포트: 구획 · 프레젠테이션: 슬라이드 그룹 -->
 <div class="sl"><div class="sl-in">     <!-- .sl 하나 = 슬라이드 하나 -->
   ...내용...
 </div></div>
</section>
```

- `data-sec` is the deck's corner label. Keep it under ~12 characters.
- **One `.sl` = one slide.** A section with three `.sl` blocks is one report chapter and three slides.
- Content always sits inside `.sl-in`. Nothing else.
- If a slide overflows in deck mode, **split it into another `.sl`** — never shrink the font.

That's the whole contract. Everything below is vocabulary and taste.

---

## Component vocabulary

Use these. Don't invent new class names — the palette engine only knows these.

| Block | What it's for |
|---|---|
| `.verdict` + `.big` + `.hl` | 결론 문장. `.hl` 은 그 문장에서 딱 한 구절 |
| `.tiles` > `.tile` (`.chain`/`.good`/`.cut`) + `.v`/`.l`/`.s` | 표지 숫자 4개. `.s` 에 근거·표본을 반드시 적는다 |
| `.tw` > `table` | **모든 표는 `.tw` 로 감싼다** (좁은 화면 가로 스크롤). `tr.me` = 우리 쪽 행 |
| `.cmp.two` > `.pane.win` / `.pane.fail` / `.pane.mid` + `.ph` | 2단 대조 |
| `.feat` > `h4` + `.k` + `.why` | 기능·항목 설명 블록. `.why` 를 쌓아 단계를 적는다 |
| `.chain-flow` > `.hop` (+`.blk`) + `.arw` | 단계 흐름도 |
| `.cal.key` / `.cal.honest` + `.ch` | 강조 블록 / **한계·정정 고지 블록** |
| `.lede` · `.tag`(`.pp`) · `.sub-t` · `.badge` · `.n1` | 도입문 · 라벨 · 보조텍스트 · 배지 · 약한근거 표시 |
| `.more[data-dlg]` + `dialog.dlg` | **복잡한 근거를 숨기는 다이얼로그** — 본문엔 결론만 |

**`.cal.honest` 는 장식이 아니다.** 못 한 것·틀렸던 것·쓰면 안 되는 수치를 여기에 적는다.
이 블록이 없는 리포트는 검토자가 먼저 의심한다.

---

## Layout defaults — 세 가지

이 셸이 이미 그렇게 되어 있다. 바꾸지 말고 따르면 된다.

### 1. 가운데 정렬 + 컨테이너 안에서는 꽉 차게

`.wrap{max-width:1180px;margin:0 auto}` — 화면이 아무리 넓어도 본문은 1180px 컬럼에 머문다.
**대신 그 안에서는 표·패널·타일이 폭을 100% 쓴다.**

- 문단에만 `ch` 상한을 걸면 **표는 100%인데 글만 60%** 라 문서가 깨져 보인다. 셸은 상한이 없다.
- 진짜 전체 폭이 필요한 건 표가 아니라 **다이어그램**이다. 그 경우만 `.wrap` 밖으로 뺀다.

### 2. 복잡한 정보는 다이얼로그로 숨긴다

**본문에는 결론, 다이얼로그에는 근거.** 원본 표·계산 과정·출처 목록을 본문에 펼치면
읽는 사람이 결론을 못 찾는다.

```html
<button class="more" data-dlg="dlgX">근거·원본 보기</button>

<dialog class="dlg" id="dlgX">
  <div class="dlg-hd">
    <h3>제목</h3>
    <div class="dlg-sub">한 줄 설명</div>
    <button class="dlg-x" aria-label="닫기">×</button>
  </div>
  <div class="dlg-bd"> ...표·원본·계산... </div>
</dialog>
```

`data-dlg` 만 붙이면 열리고, **배경 클릭 · ESC · ×** 셋 다로 닫힌다. 열려 있는 동안 배경 스크롤은 잠긴다.

> ⚠️ `.dlg` 에 **`margin:auto` 를 지우지 마라.** 셸의 `*{margin:0}` 리셋이
> 브라우저 기본 `dialog{margin:auto}` 를 덮어써서, 빼는 순간 다이얼로그가 **좌상단에 처박힌다.**
> 눈에 잘 안 띄는 사고라 실제로 두 번 겪었다.

### 3. 모바일이 기본값

- **탭 타깃 44px** — 메뉴·팔레트·다이얼로그 버튼에 `min-height:44px` 가 걸려 있다.
- **다이얼로그는 640px 미만에서 전체 화면**으로 열린다. 배경이 없으므로 × 와 ESC 로만 닫힌다.
- **표는 `.tw` 가 가로 스크롤**을 맡는다. 감싸지 않으면 페이지 전체가 옆으로 밀린다.
- **프레젠테이션 모드는 좁은 화면에서 16:9 스테이지를 포기**하고 폭에 맞춘 카드로 떨어진다.
  축소 배율을 걸면 글자가 못 읽게 되기 때문이다.
- 타일은 4열 → 2열 → 1열로 접힌다.


### 3-1. 모바일 함정 세 가지 (실제로 다 밟았다)

**① 더블탭 확대 + "버튼이 안 눌린다"는 같은 원인이다.**
`touch-action:auto` 면 iOS는 더블탭 확대를 기다리느라 첫 탭을 지연·취소한다.
셸은 `html{touch-action:manipulation}` 으로 **더블탭 확대만 끄고 핀치 확대는 남긴다.**
`maximum-scale=1` 로 막는 방식은 접근성을 해치므로 쓰지 않는다.

**② 긴 ASCII 문자열 하나가 페이지 전체를 밀어낸다.**
한글용 `word-break:keep-all` 이 전역이라 `apps/api/src/internal/...` 같은 경로가 안 끊긴다.
390px 화면에서 395px짜리 태그 하나가 **레이아웃 폭을 413px로 늘리고**, 그러면
`position:fixed` 인 우상단 메뉴 버튼이 화면 밖으로 밀려 **눌리지 않는다.**

```css
.tag,code,kbd,a[href]{overflow-wrap:anywhere;word-break:break-word}
.tag,code,kbd{white-space:normal;max-width:100%}   /* nowrap 이 overflow-wrap 을 이긴다 */
```

> 증상은 "버튼이 안 눌려요"인데 원인은 **본문 어딘가의 긴 경로 문자열**이다.
> 고정 UI가 안 눌리면 먼저 `scrollWidth > clientWidth` 를 의심하라.

**③ 노치·홈바.** `env(safe-area-inset-*)` 를 고정 UI 위치에 더한다. 셸에 이미 걸려 있다.

**확인은 390px 에서 한다.** 768은 통과하는데 390에서 깨지는 경우가 대부분이다.

---

## Palette engine — never hardcode a color

8 palettes ship: `purple` `latte` `coral` `forest` (light) · `mocha` `tokyo` `dracula` `nord` (dark).
Switching one **retunes the semantic colors too** — 긍정/부정/경고/차트 4색이 같은 온도로 따라 움직인다.

Because of that:

- **Write `var(--pp)`, `var(--good)`, `var(--bad)`, `var(--dim)` — never `#5f49db`, never `green`.**
  A hardcoded hex survives the palette switch and becomes the one wrong-looking element.
- Surfaces are variables too (`--card`, `--cardalt`, `--line`, `--tint-bad`…). Dark palettes only
  work because nothing is hardcoded.
- Adding a palette = adding one `body[data-theme="x"]{...}` block with the same variable set.
  Validate contrast before shipping it; don't eyeball colorblind separation.

---

## Typography — ink first, color last

A report is read in **black, gray, and weight**. Color is a pointer, not a texture.

- Structure comes from **size and weight**, not from hue. If everything is the accent color, nothing is.
- Accent per screen: roughly **one `.hl`, a few `<b>`, the section number**. That's it.
- `<b>` carries numbers and verdicts. Prose stays plain — **한 문장에 굵게는 한 번**.
- No emoji as icons. **Inline SVG** (`stroke="currentColor"`) so icons inherit the palette.

### Korean text rules — these are already in the shell, keep them

```css
word-break: keep-all;      /* 단어 중간에서 끊지 않는다 */
text-wrap: pretty;         /* 본문 — 외톨이 줄 방지 */
text-wrap: balance;        /* 제목 — 줄 길이 균형 */
```

- 1음절 단어가 홀로 떨어지면 앞 단어와 `&nbsp;` 로 묶는다.
- **글줄 폭에 `ch` 상한을 걸지 마라.** 한글은 글자 폭이 넓어 `66ch` 가 컨테이너의 60%밖에 안 되고,
  옆의 표는 100%를 쓰기 때문에 문단만 짧게 잘려 보인다. 셸은 이미 상한이 제거돼 있다.

---

## Deck mode

- 16:9 스테이지에 맞춰 **가로폭이 최대가 되는 배율**을 자동 계산한다(`fit()`). 손대지 않는다.
- 좁은 화면은 스테이지를 포기하고 폭에 맞춘 카드로 렌더한다 — 축소 배율을 걸면 글자가 못 읽게 된다.
- 슬라이드 넘침은 **콘텐츠를 쪼개서** 해결한다. 폰트 축소는 금지.

## Shortcuts — the two traps

```js
if (e.code === 'KeyD') ...   // ✅ 물리 키
if (e.key === 'd') ...       // ❌ 한글 입력기에서 'ㅇ' 이 들어와 죽는다
```

- **`e.key` 를 쓰면 한글 IME에서 단축키가 통째로 죽는다.** 항상 `e.code`.
- `⌘R`(새로고침) `⌘T`(새 탭) `⌘S`(저장)는 브라우저가 가져간다. **`⌥`(Alt) 조합**을 쓴다.
- 단축키를 만들었으면 ⋯ 메뉴에 **목록을 노출**한다. 안 보이는 단축키는 없는 것과 같다.

---

## Before you ship — render it and look

The CSS says nothing about whether the layout actually holds. Check:

```js
// playwright
await p.goto('file://' + path);
await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1); // 가로 넘침
await p.evaluate(() => [...document.querySelectorAll('.sl')]
  .filter(s => (s.querySelector('.sl-in')?.scrollHeight||0) > s.clientHeight).length);                   // 슬라이드 넘침
```

- **폭 1400 / 768 / 390** 세 지점 + **리포트·프레젠테이션 두 모드** + **라이트·다크 팔레트 각 1개**.
- 가로 넘침 0, 슬라이드 넘침 0, 콘솔 에러 0.
- 다이얼로그가 있으면 **중앙 정렬 · 배경클릭 · ESC · × · 스크롤 복구** 5개를 다 눌러본다.
- **실제 터치로** 우상단 메뉴를 탭해 본다(`page.tap`). 클릭 시뮬레이션은 통과하는데 탭은 실패하는 조합이 있다.
- `scrollWidth === clientWidth` 를 모바일 3기종(390 · 320 · 412)에서 확인한다.
- 스크린샷을 실제로 열어 본다. 자동 검사는 라벨 충돌과 어색한 줄바꿈을 못 잡는다.

---

## Anti-patterns

- **셸을 안 쓰고 처음부터 작성** — 모드 토글·팔레트·PDF를 다시 만들다가 절반만 동작한다
- 하드코딩된 hex — 팔레트를 바꾸면 그 요소만 튄다
- 표를 `.tw` 없이 넣기 — 좁은 화면에서 페이지 전체가 가로로 밀린다
- `.cal.honest` 없이 마무리 — 한계를 안 적은 리포트는 숫자부터 의심받는다
- 슬라이드가 넘쳐서 폰트를 줄이기 — 쪼개라
- 이모지를 아이콘으로 — 팔레트를 안 따라가고 OS마다 다르게 보인다
- 문단에 `ch` 상한 — 한글에서는 표만 넓고 글만 좁아 보인다
- **강조색 남발** — 리포트는 잉크로 읽는다
- **`dialog` 에 `margin:auto` 를 안 걸기** — `*{margin:0}` 리셋 때문에 좌상단에 붙는다
- 근거 표를 본문에 통째로 펼치기 — 결론이 묻힌다. `.more` + `.dlg` 로 접어라
- 모바일 확인을 768px 에서 끝내기 — 390px 에서 깨진다
- `touch-action` 을 안 걸어 더블탭 확대가 살아 있기 — 버튼이 "가끔 안 눌리는" 증상으로 나타난다
- 긴 경로·URL에 줄바꿈 규칙을 안 주기 — 한 문자열이 페이지 폭을 늘려 고정 UI를 밀어낸다
- CSS 블록을 정규식으로 일괄 치환 — `*{}` `html{}` `body{}` 까지 삼켜 다크 테마가 통째로 깨진다
  (실제로 겪은 사고다. 치환 후 반드시 다크 팔레트로 렌더해 볼 것)

---

## Pairs well with

- ****Verify Badge**(이 문서 위쪽)** — 문서를 공유하기 직전,
  사용 범위 배너와 검증 이력 뱃지를 붙인다. 뱃지는 문서의 `--card` `--line` 변수를 그대로 물려받아
  팔레트를 따라간다.

---

# Logodown

두 칸짜리 슬롯(앞/뒤)에 **문자 또는 심볼**을 하나씩 넣고, 배경색·스타일을 얹는 구조.
`M + ↓` 가 마크다운 마크인 것처럼, **이니셜 + 뜻을 담은 심볼** 조합이 기본 문법이다.

## 1. 무엇을 만들지 정한다

프로젝트 이름·설명·package.json·README 를 먼저 읽고 아래를 스스로 결정한다. 사용자에게
일일이 묻지 말 것 — 정하고, 결과를 보여주고, 마음에 안 들면 그때 바꾼다.

**슬롯 두 칸**

| 조합 | 언제 | 예 |
|---|---|---|
| 문자 + 심볼 | 기본값. 이름이 읽히면서 뜻도 전달됨 | `M + down`, `C + flame` |
| 심볼 + 문자 | 심볼이 단어의 앞부분을 대신할 때 | `flame + 컷` = "핫컷" |
| 문자 + 문자 | 두 글자 약어 | `H + C` |
| 심볼 + 심볼 | 이름이 안 읽혀도 될 때. 추상적 | `zap + bars` |

- 문자는 `char:` 접두사, 심볼은 접두사 없이 또는 `symbol:` — `-f char:M -b down`
- 한글 한 글자도 쓸 수 있다: `-b char:컷` (셸에서는 그대로, `--url` 안에서는 퍼센트 인코딩)
- 문자는 1~3자. 2자 이상이면 폭 기준으로 맞춰져서 작아진다 — 되도록 1자

**심볼 148개** — 전체 목록은 `npx github:m1kapp/logodown --list symbols`.
자주 쓰는 것만:

- 방향·움직임 `down up right left down-right zap zap2 zap3 meteor flow wave waves wind orbit`
- 기하 `star star4 star5fat star6 star8 triangle diamond plus cross circle check hex sparkle sparkles`
- 개발 `codecrafters drawio bars layers dbox box packageopen settings wrench hammer key shield puzzle`
- 자연 `flame droplet leaf trees sprout flower clover mountain cloud sun moon snowflake tulip cactus`
- 도구 `scissors pen pocketknife sword paintroller palette camera wand flask beaker microscope compass map`
- 생물 `rabbit fish bird dog cat panda crab elephant ghost brain dna`
- 음식 `coffee coffeebean burger pizza cookie cake donut lemon carrot apple wine beer bottle`
- 상징 `crown trophy gem heart target rocket globe lightbulb megaphone gradcap handshake infinity anchor feather`

**색** — 브랜드가 있으면 그 색. 없으면 성격에 맞춰 고른다.
팔레트에 이름으로 든 값들: `#09090b`(black) `#7c3aed`(violet) `#3b82f6`(blue) `#06b6d4`(cyan)
`#10b981`(emerald) `#f59e0b`(amber) `#f97316`(orange) `#ef4444`(red) `#ec4899`(pink)
`#FF0000`(youtube) `#D97757`(claude) `#10A37F`(openai) `#5E6AD2`(linear) `#635BFF`(stripe)

**스타일** (`-s`)

| 값 | 결과 | 언제 |
|---|---|---|
| `colorWhite` (기본) | 색 배경 + 흰 글리프 | 앱 아이콘. 가장 무난 |
| `color` | 색 배경 + 어두운 글리프 | 밝은 색일 때 |
| `onWhite` | 흰 배경 + 색 글리프 | 문서·README 안에 놓을 때 |
| `onBlack` | 검정 배경 + 색 글리프 | 다크 테마 제품 |
| `outline` | 배경 없이 테두리만 | 마크다운 마크 같은 룩. 배경이 투명이라 파비콘엔 주의 |

**그라디언트** (`-g`) — 끝색은 시작색에서 자동 계산(색상환 +32°, 중간 톤 쪽으로).
채도 높은 색에서 잘 나오고, 검정·흰색·아주 어두운 색에서는 효과가 거의 없다.

## 2. 만든다

```bash
npx github:m1kapp/logodown -f char:M -b down -c '#09090b' -o public
```

첫 실행은 clone + 번들 때문에 30초쯤 걸린다(이후 npx 캐시).

주요 옵션:

```
-f, --front <slot>   앞 슬롯. flame | symbol:flame | char:C
-b, --back  <slot>   뒤 슬롯
-c, --color <hex>    기준 색
-g, --gradient       그라디언트
-s, --style <id>     colorWhite | color | onWhite | onBlack | outline
    --sw <weight>    선 심볼 굵기. thin | light | regular | bold
    --fr, --br <n>   앞/뒤 슬롯 회전 0~360
    --fs, --bs <n>   앞/뒤 슬롯 크기 0.5~2 (기본은 자동 정규화라 보통 불필요)
    --shadow <0-3>   그림자
-o, --out <dir>      출력 폴더 (기본 ./logodown-out)
    --svg-only       SVG 만
    --name/--slogan  manifest·OG 텍스트
    --url <url>      웹앱 링크를 그대로 붙여넣기
    --list [symbols|chars]
```

나오는 파일: `icon.svg` `favicon.ico`(16·32·48) `favicon-16/32.png`
`apple-touch-icon.png`(180) `icon-192/512.png` `icon-maskable-512.png`
`manifest.json` `head.html` `README.md`

## 3. 보여주고 고른다

**후보를 3~4개 만들어 한 번에 보여준다.** 하나만 만들어 들이밀지 말 것.
서로 다른 축으로 흔든다 — 심볼을 바꾸거나, 스타일을 바꾸거나, 색을 바꾸거나.

```bash
for v in "flame char:C #FF0000" "zap char:C #7c3aed" "bars char:C #09090b"; do ... done
```

만든 뒤 `icon-512.png` 들을 사용자에게 이미지로 보여준다(파일 전송). 텍스트로 설명만
하지 말 것 — 로고는 봐야 판단이 된다.

## 4. 프로젝트에 붙인다

`-o public` 으로 뽑았으면 `head.html` 내용을 `index.html` 의 `<head>` 에 붙이면 끝.
Next.js 면 `app/` 에 `icon.svg` `apple-icon.png` 로 두면 자동 인식된다.

## 판단 기준

- **작은 크기에서 살아남는가** — 파비콘은 16px 다. 선이 얇거나 요소가 많으면 뭉갠다.
  `--sw thin` 은 32px 이하에서 거의 사라진다
- **뜻이 읽히는가** — 심볼 두 개로 단어를 만드는 수수께끼(불+가위=핫컷)는 대체로 안 읽힌다.
  글자를 한 칸 쓰는 편이 낫다
- **`outline` 은 배경이 투명** — 다크 브라우저 탭에서 검은 테두리는 보이지 않는다.
  파비콘 용도면 밝은 색을 쓰거나 다른 스타일로
- 크기·정렬은 엔진이 잉크 bbox 기준으로 자동 정규화한다. `--fs`/`--bs` 는 웬만하면 건드리지 말 것

## 웹에서 직접 고르고 싶을 때

같은 엔진의 웹 UI 가 있고, URL 파라미터로 상태를 바로 열 수 있다.

```
https://logodown.m1k.app/?front=symbol:flame&back=char:C&color=%23FF0000&mode=gradient&style=outline&sw=thin
```

파라미터: `front` `back` `color` `mode`(solid/gradient) `style` `fr` `br` `fs` `bs`
`shadow` `sw` `title` `desc`. 이 URL 을 그대로 `--url` 에 넘겨도 된다.
