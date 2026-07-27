# Verify Badge — 산출물 디자인 스펙

HTML 뱃지를 만들 때만 읽으면 된다. 마크다운·슬라이드 형식이면 필요 없다.

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

