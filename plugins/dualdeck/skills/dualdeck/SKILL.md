---
name: dualdeck
description: "Build a single self-contained HTML that is both a report and a 16:9 presentation, with a palette engine, ink-first typography, and Korean text rules. Use for 리포트/보고서/발표자료 요청, \"리포트 써줘\", \"발표자료로도 되게\", \"HTML로 정리해줘\", dualdeck by name, or when a deliverable needs to be read closely AND presented."
version: 1.0.0
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

Copy [`examples/dualdeck/shell.html`](../../../../examples/dualdeck/shell.html) and fill it in.
It already contains the mode toggle, 8 palettes, PDF export, shortcuts, the 16:9 stage,
and the component CSS. **Reimplementing any of that by hand is the failure mode this skill exists to prevent.**

```
examples/dualdeck/shell.html  →  <제목>.html
```

Then: replace `<title>`, the `<header>` block, and the demo `<section>`s. Touch nothing else.

섹션 구성이 안 잡히면 [`examples/dualdeck/PATTERNS.md`](../../../../examples/dualdeck/PATTERNS.md) —
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

- **[verify-badge](../../../verify-badge/skills/verify-badge/SKILL.md)** — 문서를 공유하기 직전,
  사용 범위 배너와 검증 이력 뱃지를 붙인다. 뱃지는 문서의 `--card` `--line` 변수를 그대로 물려받아
  팔레트를 따라간다.
