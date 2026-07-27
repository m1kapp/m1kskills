# dualdeck — 셸

`shell.html` 하나가 전부입니다. 복사해서 내용만 채우면 됩니다.

```
cp shell.html 내문서.html
```

들어 있는 것:

| | |
|---|---|
| **두 모드** | 우상단 ⋯ → 리포트 / 프레젠테이션 토글 (16:9 스테이지 자동 배율) |
| **8개 팔레트** | purple · latte · coral · forest / mocha · tokyo · dracula · nord — 긍정·부정·차트색까지 함께 바뀜 |
| **PDF** | ⋯ → PDF 저장 (인쇄 스타일 포함) |
| **단축키** | `⌥1` 리포트 · `⌥2` 프레젠테이션 · `←/→` 슬라이드 · `⌥\` 팔레트 |
| **컴포넌트** | 결론 박스 · 지표 타일 · 표 · 2단 대조 · 흐름도 · 강조/고지 블록 |
| **한글 타이포** | `keep-all` · `text-wrap: pretty/balance` · 글줄 폭 상한 없음 |

바꿀 곳은 `<title>`, `<header>`, 그리고 `<section>` 들입니다. 나머지는 건드리지 마세요.

구조 규칙 하나만 지키면 됩니다 — **`.sl` 하나가 슬라이드 하나**입니다.

```html
<section data-sec="03 · 라벨">
 <div class="sl"><div class="sl-in"> ...내용... </div></div>
</section>
```

**무슨 섹션을 어떤 순서로 놓을지** 막히면 → [`PATTERNS.md`](PATTERNS.md) (문서 유형 3종 레시피)

자세한 지침은 [`skills/dualdeck/SKILL.md`](../../skills/dualdeck/SKILL.md).
