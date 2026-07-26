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
          [ ⛨ 부분 검증 — 자릿수만  6× reviewed ]
```

> **칩 문구는 손으로 쓰는 게 아니라 `grades` 에서 자동 산출됩니다.** 최저 등급이 레벨을 정합니다 —
> 이 예제는 품질점수가 `C` 라서 넷 중 세 번째가 아니라 `부분 검증`으로 떨어집니다.
>
> | 최저 등급 | 칩 | 색 |
> |---|---|---|
> | D · 또는 `sources` 없음 | `스스로 더 검증하세요` | 빨강 |
> | C | `부분 검증 — 자릿수만` | 주황 |
> | B | `참고자료로 사용 가능` | 기본 |
> | 전부 A | `그대로 인용 가능` | 초록 |
>
> 항상 `VERIFIED` 로 똑같이 나오면 A짜리와 D짜리가 겉모습이 같아, 안 열어보는 독자에게 부실한
> 리포트를 세탁해줍니다. 레벨을 올리려면 문구가 아니라 **근거**를 올려야 합니다.
>
> `6×` 는 `rounds`(교차검증 라운드 수)입니다. `findings` 건수와 혼동하면 칩과 상세가 다른 숫자를 말합니다.

**칩 클릭 → 5탭 상세**

| 탭 | 내용 |
|---|---|
| 파고든 관점 | 어떤 질문을 순서대로 팠나 |
| 어디까지 확인 | 항목별 A/B/C/D + 근거 |
| 고친 것 | 라운드별 수정분 + 심각도 + **현재 반영값** |
| 직접 확인 | **1차 출처 링크** — "믿지 말고 찍어보라" |
| 못 한 것 | 미검증 항목 / 왜 / 하면 얻는 것 |

## 실제 적용 사례

[구축형 LLM 계산기](https://claude.ai/code/artifact/f5844068-1f6b-4ea2-bcba-8518f15b8c80) — 6차 교차검증, config.json 1차 확인, 못 한 것까지 기록.
