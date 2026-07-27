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


---

## 측정 함정 — 전부 실제로 밟은 것들

**권한 거부는 경로 선택 실패일 수 있다.** API 하나가 403이라고 "측정 불가"로 판정하지 않는다. 계정 역할이 무엇을 허용하는지 보고 **같은 데이터에 닿는 다른 경로**를 먼저 찾는다. `_cat/shards`가 막혔을 때 모니터링 인덱스(`monitoring_user` 역할)와 메타데이터 API(`viewer`의 `view_index_metadata`) 조합으로 같은 값이 나왔다. 그렇게 재보니 문서에 적혀 있던 값이 **출처 불명의 오값**이었다.

**raw 조회에서 빈 값이 나오면 인코딩·암호화를 의심한다.** 암호화 컬럼을 복호화 없이 읽어 표본 10건 중 6건을 "본문 없음"으로 셌다. 복호화 후 비율이 40% → 21.0%로 바뀌었다. 컬럼이 비어 보이면 먼저 `길이`와 `패턴`을 확인한다 — hex 문자열이면 암호화다.

**표본보다 전수 집계를 먼저 시도한다.** 위 10건 표본이 21%를 40%로 읽게 했다. `count(*) FILTER (WHERE ...)` 한 줄이면 되는데 표본으로 갈 이유가 없다. 표본은 **전수가 불가능할 때만** 쓰고, 쓸 때는 크기를 명시한다.

**표본에 정렬을 주지 않으면 무작위가 아니다.** `term` 쿼리에 정렬 없이 5건을 뽑았더니 색인 순서 앞쪽이 나왔다. 인접 문서는 생성 시각이 가까워 "2시간 반 안에 몰려 있다 → 자동 생성 배치"로 오독했다. 전수를 `date_histogram`으로 펼치니 **39개월 누적**이었다.

**"기준이 갈린다"와 "한쪽이 틀렸다"는 다르다.** 두 값이 충돌하면 기준 차이로 서술하기 전에 **양쪽을 다시 재라.** `300~550GB`와 `203GB`가 단위·기준 차이인 줄 알고 "통일 필요"로 남겼는데, 실측하니 300GB를 넘는 값이 아예 없었다. 전자는 근거 없는 값이었다.

**외부 수치는 URL을 적기 전에 연다.** 기억이나 앞선 문서에서 인용한 값은 1차 출처가 아니다. **링크를 붙이는 행위 자체가 검증 단계다** — 이번에 3건을 열었더니 3건 다 틀렸고, 그중 하나는 업무의 전제("재색인 불필요")를 무너뜨렸다.
