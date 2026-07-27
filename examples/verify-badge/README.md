# Verify Badge — 예제

ES module 을 쓰므로 **로컬 서버로 열어야** 합니다. `file://` 로 직접 열면 브라우저가 CORS 로 막습니다.

```bash
python3 -m http.server 8000
# → http://localhost:8000/examples/verify-badge/demo.html
```

## 파일

| 파일 | 역할 |
|---|---|
| `provenance.js` | **검증 이력 데이터** — 다른 리포트엔 이 객체만 교체 |
| `badge.js` | 렌더러 — `mount(el, PROVENANCE)` 한 줄 |
| `badge.css` | 스타일 — 앰버 시그니처 색, 라이트/다크 대응 |
| `demo.html` | 붙여넣고 바로 열리는 최소 예제 |

## 쓰는 법

```html
<link rel="stylesheet" href="badge.css">
<div id="badge"></div>
<script type="module">
  import { PROVENANCE } from './provenance.js';
  import { mount } from './badge.js';
  mount(document.getElementById('badge'), PROVENANCE);
</script>
```

## 나오는 것

**문서 하단 서명 + 미니 칩**
```
Made by 마드라스체크 AI사업개발실 유민호 실장 · Powered by Claude Opus 5
© 2026 마드라스체크 · 내부 검토용 · 데이터 기준일 2026-07-26
          [ 🧭 DIRECTIONAL ONLY  6× reviewed ]
```

> **칩 문구는 손으로 쓰는 게 아니라 `grades` 에서 자동 산출됩니다.** 최저 등급이 레벨을 정합니다 —
> 이 예제는 품질점수가 `C` 라서 `DIRECTIONAL ONLY` 로 떨어집니다. 다이얼로그 최상단 위젯의 `!` 를 누르면 4단계 전체가 펼쳐집니다.
>
> | 최저 등급 | 칩 | 아이콘 |
> |---|---|---|
> | D · 또는 `sources` 없음 | `VERIFY BEFORE USE` | 돋보기 |
> | C | `DIRECTIONAL ONLY` | 나침반 |
> | B | `REFERENCE ONLY` | 책 |
> | 전부 A | `CITE AS-IS` | 방패체크 |
>
> 색이 아니라 **아이콘**으로 구분합니다 — 빨간/노란 칩은 문서 전체를 불안하게 만들어서
> 정직하게 낮은 등급을 적을 유인을 오히려 깎습니다. 칩은 어느 레벨이든 회색입니다.
>
> 항상 `VERIFIED` 로 똑같이 나오면 A짜리와 D짜리가 겉모습이 같아, 안 열어보는 독자에게 부실한
> 리포트를 세탁해줍니다. 레벨을 올리려면 문구가 아니라 **근거**를 올려야 합니다.
>
> `6×` 는 `rounds`(교차검증 라운드 수)입니다. `findings` 건수와 혼동하면 칩과 상세가 다른 숫자를 말합니다.

**칩 클릭 → 5탭 상세**

탭 이름은 **독자가 던지는 질문**으로 답니다. 부제엔 라벨이 아니라 값이 들어갑니다 —
누르기 전에 결론이 보여야 하니까요.

| 탭 | 내용 | 부제 예시 |
|---|---|---|
| ① 어떻게 팠나 | 타임스탬프 기반 작업 구간 + 확정한 판단 | `12구간` |
| ② 얼마나 믿나 | 항목별 A/B/C/D + 근거 | `최저 C · 4항목` |
| ③ 뭘 틀렸나 | 라운드별 수정분 + 심각도 + **현재 반영값** | `6건 · 치명 3` |
| ④ 어디서 왔나 | **1차 출처 링크** — "믿지 말고 찍어보라" | `1차 출처 8` |
| ⑤ 뭘 못했나 | 미검증 항목 / 왜 / 하면 얻는 것 | `3건 미검증` |

> `어디까지 확인` 과 `직접 확인` 처럼 같은 단어가 겹치면 구분이 안 됩니다.
> 어미를 `~나` 로 통일하면 다섯 개가 한 세트 질문으로 읽힙니다.

## 실제 적용 사례

[구축형 LLM 계산기](https://claude.ai/code/artifact/f5844068-1f6b-4ea2-bcba-8518f15b8c80) — 6차 교차검증, config.json 1차 확인, 못 한 것까지 기록.
