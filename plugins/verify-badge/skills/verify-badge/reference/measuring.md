# 실측 방법론 — `scripts/measure.py` 가 하는 일

평소엔 읽을 필요 없다. 스크립트를 고치거나 Claude Code 밖에서 손으로 셀 때만.

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

