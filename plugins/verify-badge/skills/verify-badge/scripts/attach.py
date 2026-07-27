#!/usr/bin/env python3
"""배지를 문서에 붙이거나 갱신한다 — AI 는 JSON 만 만들고, HTML 은 손대지 않는다.

    python3 attach.py <문서.html> <provenance.json>

멱등하다. #vb-provenance 가 있으면 그 JSON 만 갈아끼우고, 없으면 인라인 블록을
</body> 앞에 넣는다. 렌더러를 매번 다시 쓰면 이스케이프·javascript: 차단·레벨
산출·키보드 탭 이동이 조용히 빠진다 — 그래서 코드는 고정, 데이터만 바꾼다.
"""
import json, sys, re, pathlib

SKILL = pathlib.Path(__file__).resolve().parent.parent
TAG = re.compile(r'(<script type="application/json" id="vb-provenance">)(.*?)(</script>)', re.S)


def is_grouped(tl) -> bool:
    """timeline 이 날짜 그룹 형태({d,wd,rows})인지 옛 평면 형태인지."""
    return bool(tl) and isinstance(tl[0], dict) and "rows" in tl[0]


def flatten(tl) -> list:
    return [r for d in tl for r in (d.get("rows") or [])] if is_grouped(tl) else list(tl)


def day_label(d: str) -> str:
    """'07-22' · '2026-07-22' 어느 쪽이 와도 일(日)만 뽑는다. [3:] 슬라이스는 형식을 가정했다."""
    parts = str(d).split("-")
    return parts[-1] if len(parts) >= 2 else str(d)


# 이 셋이 없으면 렌더러가 브라우저에서 죽는다 — 붙이기 전에 잡는다
REQUIRED = {"author": ("name", "org"), "grades": None, "sources": None}


def validate(P: dict) -> None:
    miss = []
    for k, sub in REQUIRED.items():
        v = P.get(k)
        if v is None:
            miss.append(k); continue
        if sub and not all(v.get(x) for x in sub):
            miss.append(f"{k}.{{{','.join(x for x in sub if not v.get(x))}}}")
    if miss:
        sys.exit("필수 필드 누락 → 배지가 브라우저에서 죽는다: " + ", ".join(miss))
    if not P.get("grades"):
        print("  ⚠ grades 가 비어 레벨이 VERIFY BEFORE USE 로 고정된다")
    if not P.get("sources"):
        print("  ⚠ sources 가 비어 등급과 무관하게 최하 레벨이 된다")


def derive(P: dict) -> dict:
    """파생값을 여기서 계산한다 — 사람이 다시 세면 반드시 틀린다."""
    tl = P.get("timeline") or []
    rows = flatten(tl)
    if rows:
        mins = sum(r.get("min", 0) for r in rows)
        n = sum(r.get("n", 0) for r in rows)
        per = [sum(r.get("n", 0) for r in d["rows"]) for d in tl] if is_grouped(tl) else []
        eff = f"{mins//60}시간 {mins%60}분" if mins >= 60 else f"{mins}분"
        P.setdefault("period", {})
        P["period"]["effort"] = eff + " 실측"
        P["period"]["mode"] = f"실작업 {len(tl)}일" + (f"({'·'.join(day_label(d['d']) for d in tl)})" if per else "")
        P["stats"] = [
            {"v": str(n), "l": "프롬프트"},
            {"v": f"{P.get('rounds', 0)}차", "l": "교차검증"},
            {"v": eff, "l": "실투입"},
            {"v": f"{len(tl)}일", "l": "실작업(" + "·".join(map(str, per)) + ")"},
        ]
    return P


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    doc, src = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    P = json.loads(src.read_text(encoding="utf-8"))
    validate(P)
    P = derive(P)
    blob = json.dumps(P, ensure_ascii=False, separators=(",", ":"))
    if "</script" in blob:
        sys.exit("JSON 안에 </script 가 있어 태그가 깨진다 — 데이터를 확인하라")

    h = doc.read_text(encoding="utf-8")
    if TAG.search(h):
        # lambda 치환은 백슬래시를 해석하지 않는다 — 이스케이프하면 JSON 이 깨진다
        h = TAG.sub(lambda m: m.group(1) + blob + m.group(3), h, count=1)
        action = "갱신"
    else:
        block = (SKILL / "assets/badge.inline.html").read_text(encoding="utf-8")
        ph = 'id="vb-provenance">{}<'
        if ph not in block:   # str.replace 는 실패를 알리지 않는다 — 그대로 두면 {} 를 파싱해 죽는다
            sys.exit("badge.inline.html 의 JSON 플레이스홀더를 찾지 못했다 — 자산이 손상됐다")
        block = block.replace(ph, f'id="vb-provenance">{blob}<')
        anchor = "</body>" if "</body>" in h else None
        h = h.replace(anchor, block + anchor, 1) if anchor else h + block
        action = "신규 삽입"
    doc.write_text(h, encoding="utf-8")

    rows = flatten(P.get("timeline") or [])
    gs = [g.get("g") for g in P.get("grades", [])]
    worst = next((k for k in "DCBA" if k in gs), "D")
    lv = {"D": "VERIFY BEFORE USE", "C": "DIRECTIONAL ONLY",
          "B": "REFERENCE ONLY", "A": "CITE AS-IS"}[worst if P.get("sources") else "D"]
    print(f"{action}: {doc.name}  ({len(blob):,}바이트)")
    print(f"  칩 {lv} · {P.get('rounds','?')}× reviewed")
    print(f"  탭 ①{len(rows)}구간 ②최저 {worst}·{len(gs)}항목 "
          f"③{len(P.get('findings',[]))}건 ④출처 {len(P.get('sources',[]))} ⑤{len(P.get('gaps',[]))}건")


if __name__ == "__main__":
    main()
