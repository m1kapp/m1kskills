// 검증 이력 데이터 — 다른 리포트에 쓸 땐 이 객체만 교체
export const PROVENANCE = {
  author: { name:'유민호', title:'실장', org:'마드라스체크', dept:'AI사업개발실' },
  period: { from:'2026-07-22(수)', to:'07-26(일)', mode:'5일 분산 작업', effort:'약 6시간' },
  tool: 'Claude Opus 5',
  asOf: '2026-07-26',
  use: '내부 검토용',           // 용도 — 등급 엄격도의 기준. 서명줄에 남는다
  rounds: 6,                    // 교차검증 라운드 수. 칩의 "N× reviewed" 는 이 값이다
  method: '웹 검색 20+회 · HuggingFace config.json·공식 요금표 직접 조회',

  stats: [
    { v:'~90', l:'프롬프트 반복' },
    { v:'6차',  l:'교차검증 · 27모델' },
    { v:'~6h', l:'실투입 시간' },
    { v:'5일',  l:'07-22(수)~26(일)' },
  ],

  // 어떤 질문을 순서대로 팠나 (신뢰의 핵심 — 횟수보다 궤적)
  angles: [
    ['GPU 단위 혼란', '"GPU 1대"가 칩 1장인지 서버 8장인지. 칩/노드/랙/클러스터 4층위 정리.'],
    ['"돌린다"의 정의', '가중치만 올리는 게 아니다. 컨텍스트 × 동시요청의 KV캐시가 VRAM을 먹는다.'],
    ['모델 실측 스펙', 'KV 구조를 HF config.json으로 직접 확인. MLA 구조를 발견해 정정.'],
    ['신뢰도 분리', '물리 계산 / 가정 포함 / 엔진 의존을 나눠 표기. 못 한 것까지 남김.'],
  ],

  // 항목별 신뢰 등급 (A 그대로 인용 / B 상대 비교만 / C 자릿수만 / D 미검증)
  grades: [
    { k:'VRAM·동시 슬롯', g:'A', why:'물리 계산 + config.json 1차 확인' },
    { k:'가격',          g:'B', why:'공개 요금표 기반, 환율·시세 가정 포함' },
    { k:'TTFT·RPM',      g:'B', why:'MFU·디코드 효율이 가정치' },
    { k:'품질점수',       g:'C', why:'27종 중 4종만 실측, 나머지는 순위 환산' },
  ],

  // 실제로 틀려서 고친 것 — now 로 현재 값과 연결해야 검증 가능해진다
  findings: [
    { r:'2차', sev:'치명', t:'TFLOPS가 FP16이 아닌 sparse/FP8 값(990→495)', now:'현재 H100=495 · GPU 표에서 확인' },
    { r:'3차', sev:'치명', t:'KV캐시 임의값 → 아키텍처 공식으로 재산출(최대 4.5배 오차)', now:'VRAM 상세에 산출식 표기' },
    { r:'5차', sev:'중대', t:'AWS H200/B200 가격 동일값 오류' },
  ],

  // 1차 출처 — "믿지 말고 찍어보라"
  sources: [
    { t:'Solar Open 100B config.json', u:'https://huggingface.co/upstage/Solar-Open-100B/raw/main/config.json', n:'48층·KV8·hd128 → KV 0.188MB' },
    { t:'AWS p6-b200 요금',            u:'https://instances.vantage.sh/aws/ec2/p6-b200.48xlarge',              n:'$113.93/hr ÷8 = $14.24' },
    { t:'BFCL v4 리더보드',            u:'https://gorilla.cs.berkeley.edu/leaderboard.html',                    n:'툴콜링 점수 스케일 앵커' },
  ],

  // 아직 못 한 것 — 다음 담당자용
  gaps: [
    { item:'성능 실측', sub:'TTFT·RPM 절대값', why:'GPU 미보유 (효율 계수가 가정치)', gain:'H200 반나절 + vLLM 30분 → B → A 승격' },
    { item:'툴콜 성공률', sub:'품질점수 근거', why:'자체 평가셋 부재', gain:'후보 3개 × 자체 데이터 → C → B 승격' },
  ],

  closing: '위 항목은 도구로는 못 올린다. 실제 환경·데이터가 있어야 한다. 그 전까지 이 자료는 후보를 좁히는 용도로만 쓴다.',
};
