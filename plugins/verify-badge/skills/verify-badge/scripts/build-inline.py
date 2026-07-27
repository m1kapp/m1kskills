#!/usr/bin/env python3
"""badge.js + badge.css → badge.inline.html 을 생성한다.

    python3 build-inline.py           # 생성(덮어쓰기)
    python3 build-inline.py --check   # 어긋났으면 exit 1 (손대기 전 검사용)

inline.html 은 **생성물**이다. 손으로 고치면 badge.js 와 갈라지고, 그 순간
단일 파일 산출물만 옛 렌더러를 쓰게 된다 — 이 스킬이 없애려던 바로 그 드리프트다.
badge.js·badge.css 를 고쳤으면 반드시 이걸 다시 돌린다.
"""
import sys, pathlib

A = pathlib.Path(__file__).resolve().parent.parent / "assets"

HEAD = """<!-- ─────────────────────────────────────────────────────────────────
     Verify Badge — 단일 파일용 인라인 블록.  **생성물이다. 손으로 고치지 말 것.**
     원본은 assets/badge.js · badge.css — 고쳤으면 scripts/build-inline.py 재실행.
     데이터 갱신은 아래 #vb-provenance 의 JSON 만 교체한다:
         python3 scripts/attach.py <문서.html> <provenance.json>
     ───────────────────────────────────────────────────────────────── -->
"""


def render() -> str:
    css = (A / "badge.css").read_text(encoding="utf-8").rstrip()
    js = (A / "badge.js").read_text(encoding="utf-8").replace("export function mount", "function mount").rstrip()
    return (f"{HEAD}<style>\n{css}\n</style>\n\n"
            '<script type="application/json" id="vb-provenance">{}</script>\n'
            '<div id="vb-badge"></div>\n\n'
            f"<script>\n{js}\n"
            "mount(document.getElementById('vb-badge'),\n"
            "      JSON.parse(document.getElementById('vb-provenance').textContent));\n"
            "</script>\n")


def main():
    out = A / "badge.inline.html"
    new = render()
    if "--check" in sys.argv:
        cur = out.read_text(encoding="utf-8") if out.exists() else ""
        if cur == new:
            print(f"동기 OK — {out.name}")
            return
        sys.exit(f"어긋남: {out.name} 이 badge.js/badge.css 와 다르다. "
                 "`python3 scripts/build-inline.py` 로 재생성하라.")
    out.write_text(new, encoding="utf-8")
    print(f"생성: {out.name}  ({len(new):,}바이트 / {len(new.splitlines())}줄)")


if __name__ == "__main__":
    main()
