#!/usr/bin/env python3
"""트랜스크립트에서 실측치를 뽑는다 — 추정 금지 원칙의 집행 장치.

SKILL.md 가 `!`로 주입해 실행하므로, AI 는 계산 결과만 받는다.
직접 jsonl 을 뒤지면 매번 UTC/필터 실수가 재발한다(실제로 났다).

출력: 사람이 읽는 표 + 마지막 줄에 JSON 한 줄.
"""
import json, sys, glob, os, datetime as dt
from collections import Counter

KST = dt.timezone(dt.timedelta(hours=9))          # 로컬 오프셋. 다른 지역이면 TZ_OFFSET 로 덮어쓴다
OFFSET = float(os.environ.get("VB_TZ_OFFSET", "9"))
TZ = dt.timezone(dt.timedelta(hours=OFFSET))
WD = "월화수목금토일"
GAP = int(os.environ.get("VB_GAP_MIN", "30")) * 60  # 구간 경계(분)

# user 턴으로 들어오지만 사람이 친 게 아닌 것들
SKIP = ("<system-reminder>", "<command-name>", "<command-message>",
        "<command-args>", "<local-command-stdout>", "<task-notification>",
        "[SYSTEM NOTIFICATION", "<user-prompt-submit-hook>")
# 무관 붙여넣기(쉘 세션 등)
STRAY = ("Last login:",)


def project_dir() -> str:
    """cwd 를 슬러그화한 트랜스크립트 디렉터리. Claude Code 규칙: / 와 . 을 - 로."""
    if d := os.environ.get("VB_TRANSCRIPT_DIR"):
        return d
    slug = os.getcwd().replace("/", "-").replace(".", "-")
    return os.path.expanduser(f"~/.claude/projects/{slug}")


def load(path: str):
    turns = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                e = json.loads(line)
            except Exception:
                continue
            if e.get("type") != "user" or e.get("isMeta"):
                continue
            c = (e.get("message") or {}).get("content")
            if isinstance(c, list):
                if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                    continue
                t = "".join(b.get("text", "") for b in c
                            if isinstance(b, dict) and b.get("type") == "text")
            elif isinstance(c, str):
                t = c
            else:
                continue
            t = t.strip()
            if not t or t.startswith(SKIP) or t.startswith(STRAY):
                continue
            ts = e.get("timestamp")
            if not ts:
                continue
            turns.append((dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(TZ), t))
    return turns


def fmt(m: int) -> str:
    return f"{m}분" if m < 60 else f"{m//60}시간 {m%60}분"


def main():
    d = project_dir()
    files = sorted(glob.glob(f"{d}/*.jsonl"), key=os.path.getmtime, reverse=True)
    if not files:
        print(f"미측정 — 트랜스크립트를 찾지 못함 ({d})")
        print(json.dumps({"ok": False, "reason": "no transcript"}, ensure_ascii=False))
        return

    target = sys.argv[1] if len(sys.argv) > 1 else files[0]
    turns = load(target)
    if not turns:
        print("미측정 — 사람이 친 턴이 없음")
        print(json.dumps({"ok": False, "reason": "no human turns"}, ensure_ascii=False))
        return

    bursts = [[turns[0]]]
    for prev, cur in zip(turns, turns[1:]):
        (bursts[-1] if (cur[0] - prev[0]).total_seconds() <= GAP
         else bursts.append([]) or bursts[-1]).append(cur)

    days = Counter(t.date() for t, _ in turns)
    total = sum(int((g[-1][0] - g[0][0]).total_seconds() // 60) for g in bursts)

    print(f"세션: {os.path.basename(target)}  (TZ +{OFFSET:g}, 경계 {GAP//60}분)")
    print(f"사람이 친 턴 {len(turns)}건 · {len(bursts)}구간 · {fmt(total)} · 실작업 {len(days)}일")
    print("일별: " + " · ".join(f"{k:%m-%d}({WD[k.weekday()]}) {v}" for k, v in sorted(days.items())))
    print()
    print(f"{'#':>3}  {'시작':<16}{'분':>5}{'건':>5}  첫 프롬프트")
    out = []
    for i, g in enumerate(bursts, 1):
        m = int((g[-1][0] - g[0][0]).total_seconds() // 60)
        head = g[0][1].replace("\n", " ")[:52]
        print(f"{i:>3}  {g[0][0]:%m-%d}({WD[g[0][0].weekday()]}) {g[0][0]:%H:%M}{m:>5}{len(g):>5}  {head}")
        out.append({"d": f"{g[0][0]:%m-%d}", "wd": WD[g[0][0].weekday()],
                    "t": f"{g[0][0]:%H:%M}", "min": m, "n": len(g), "head": head})
    print()
    print("↑ 세션 전체다. 산출물이 세션 일부라면 주제가 바뀐 구간에서 잘라 쓰고,")
    print("  '105건(계산기 구간; 세션 전체 177)' 처럼 무엇을 셌는지 밝힐 것.")
    print(json.dumps({"ok": True, "turns": len(turns), "bursts": len(bursts),
                      "minutes": total, "days": len(days),
                      "perDay": {f"{k:%m-%d}": v for k, v in sorted(days.items())},
                      "rows": out}, ensure_ascii=False))


if __name__ == "__main__":
    main()
