// Verify Badge 렌더러 — mount(el, PROVENANCE) 한 줄로 서명+칩+다이얼로그 생성

// PROVENANCE 는 AI가 세션에서 수확한 값(검색 결과 제목·출처 URL 등)으로 채워진다.
// 즉 외부 문자열이 정상 경로로 들어온다 → 삽입 전 반드시 이스케이프.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

// href 는 이스케이프만으론 부족하다 — javascript:/data: 스킴 자체를 막아야 한다.
const safeUrl = v => {
  const s = String(v ?? '').trim();
  return /^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(s) ? esc(s) : '#';
};

// 칩 레벨은 **작성자가 고르지 않는다.** 항목별 등급의 최저값에서 자동 산출한다.
// 자기가 "인용 가능" 이라고 써넣을 수 있으면 칩은 다시 자기 홍보가 된다.
// 원칙: 가장 약한 고리가 그 자료의 수준이다. 1차 출처가 하나도 없으면 무조건 최하.
const LEVELS = {
  D: { t:'스스로 더 검증하세요', c:'d', w:'핵심 항목에 미검증이 있다' },
  C: { t:'부분 검증 — 자릿수만', c:'c', w:'가정이 결과를 좌우한다' },
  B: { t:'참고자료로 사용 가능', c:'b', w:'비교·후보 좁히기까지' },
  A: { t:'그대로 인용 가능',     c:'a', w:'전 항목 1차 출처·물리 계산' },
};
function levelOf(P) {
  const gs = (P.grades || []).map(x => x.g).filter(Boolean);
  if (!gs.length) return { ...LEVELS.D, w:'항목별 등급이 기재되지 않았다' };
  // 확인 경로(1차 출처)가 없으면 등급이 뭐든 최하 — 독자가 대조할 방법이 없다
  if (!(P.sources || []).length) return { ...LEVELS.D, w:'1차 출처가 없어 대조할 방법이 없다' };
  const worst = ['D','C','B','A'].find(k => gs.includes(k));
  return LEVELS[worst] || LEVELS.D;
}

export function mount(el, P) {
  const g = x => x==='A'?'vb-g-a':x==='B'?'vb-g-b':x==='C'?'vb-g-c':'vb-g-d';
  const s = x => x==='치명'?'hi':x==='중대'?'mid':'lo';
  const A = P.author, D = P.period;
  // 칩 숫자는 검증 라운드 수(rounds). findings.length(고친 건수)와 혼동하면
  // 다이얼로그의 "N차 교차검증" 과 칩이 서로 다른 숫자를 말하게 된다.
  const rounds = P.rounds ?? null;
  // 타임라인은 있으면 쓰고 없으면 기존 angles 목록으로 폴백(구 데이터 호환)
  const tl = Array.isArray(P.timeline) ? P.timeline : [];
  const maxMin = Math.max(1, ...tl.map(x => x.min || 0));
  const totalMin = tl.reduce((s, x) => s + (x.min || 0), 0);
  const lv = levelOf(P);

  const tabs = [
    { id:'a', label:'파고든 궤적', sub:tl.length?`${tl.length}구간 · ${totalMin}분`:`${P.angles.length}단계`, html:`
      <p class="vb-lead">${tl.length
        ? `실제 타임스탬프에서 뽑은 작업 구간. <b>막대 길이 = 그 구간에 머문 시간</b>이라, 어디서 오래 붙들렸는지가 그대로 보인다.`
        : `어떤 질문을 <b>순서대로</b> 파고들었나.`}</p>
      ${tl.length ? `<table class="vb-tl">${tl.map(x=>`<tr>
          <td class="when">${esc(x.d)}<br><span>${esc(x.t)}</span></td>
          <td class="bar"><i style="width:${Math.max(3, Math.round((x.min/maxMin)*100))}%"></i></td>
          <td class="num">${x.min?esc(x.min)+'분':'—'}<br><span>${esc(x.n)}건</span></td>
          <td><b>${esc(x.k)}</b><br><span class="sub">${esc(x.s)}</span></td>
        </tr>`).join('')}</table>`
        : `<ol class="vb-list">${P.angles.map(x=>`<li><b>${esc(x[0])}</b> — ${esc(x[1])}</li>`).join('')}</ol>`}` },
    { id:'b', label:'어디까지 확인', sub:'근거 수준', html:`
      <p class="vb-lead">항목마다 <b>근거의 단단함이 다르다.</b> 아래 <b>최저 등급이 곧 칩의 레벨</b>이다 — 가장 약한 고리가 이 자료의 수준이라서.</p>
      <div class="vb-lvbox lv-${lv.c}"><b>${esc(lv.t)}</b><span>${esc(lv.w)}</span></div>
      <table class="vb-tbl">${P.grades.map(x=>`<tr><td style="width:38%"><b class="${g(x.g)}">${esc(x.g)}</b> ${esc(x.k)}</td><td>${esc(x.why)}</td></tr>`).join('')}</table>` },
    { id:'c', label:'고친 것', sub:`${P.findings.length}건`, html:`
      <p class="vb-lead">검증 라운드마다 <b>실제로 틀려서 수정한 것들.</b></p>
      <table class="vb-tbl">${P.findings.map(f=>`<tr><td style="width:15%;white-space:nowrap">${esc(f.r)}<span class="vb-sev ${s(f.sev)}">${esc(f.sev)}</span></td><td>${esc(f.t)}${f.now?`<br><span class="vb-now">✓ ${esc(f.now)}</span>`:''}</td></tr>`).join('')}</table>` },
    { id:'d', label:'직접 확인', sub:`${P.sources.length}건`, html:`
      <p class="vb-lead">이 자료를 <b>믿지 말고 찍어보라.</b> 실제로 조회한 1차 출처다.</p>
      <table class="vb-tbl">${P.sources.map(x=>`<tr><td style="width:42%"><a href="${safeUrl(x.u)}" target="_blank" rel="noopener noreferrer">${esc(x.t)} ↗</a></td><td>${esc(x.n)}</td></tr>`).join('')}</table>` },
    { id:'e', label:'못 한 것', sub:`${P.gaps.length}건`, html:`
      <p class="vb-lead">여기까지가 <b>이 자료의 한계.</b> 다음 담당자가 이어서 하면 된다.</p>
      <table class="vb-tbl">${P.gaps.map(x=>`<tr><td style="width:26%"><b>${esc(x.item)}</b><br><small>${esc(x.sub)}</small></td><td>${esc(x.why)}<br><b style="color:var(--vb-amber)">${esc(x.gain)}</b></td></tr>`).join('')}</table>
      <div class="vb-eq">👉 ${esc(P.closing)}</div>` },
  ];

  const dlgId = 'vbDlg' + Math.random().toString(36).slice(2,7);
  el.innerHTML = `
  <footer class="vb-sign">
    <div class="line"><b>Made by</b> ${esc(A.org)} ${esc(A.dept)} ${esc(A.name)} ${esc(A.title)} · <b>Powered by</b> ${esc(P.tool)}</div>
    <div class="line dim">© ${esc(String(P.asOf).slice(0,4))} ${esc(A.org)}${P.use?` · ${esc(P.use)}`:''} · 데이터 기준일 ${esc(P.asOf)}</div>
    <button class="vb-chip lv-${lv.c}" data-open="${dlgId}" title="${esc(lv.w)}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
      <span>${esc(lv.t)}</span>${rounds?`<em>${esc(rounds)}× reviewed</em>`:''}
    </button>
  </footer>
  <dialog class="vb-dlg" id="${dlgId}" aria-label="제작·검증 이력">
    <div class="vb-head"><h3>제작·검증 이력 <span style="font-weight:400;color:var(--vb-ink3);font-size:13px">· 이 자료를 어떻게 만들었나</span></h3><button data-close aria-label="닫기">✕</button></div>
    <div class="vb-body">
      <div class="vb-stats">${P.stats.map(x=>`<div><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('')}</div>
      <p class="vb-method">${esc(P.asOf)} · ${esc(P.tool)} · ${esc(P.method)}</p>
      <div class="vb-tabs" role="tablist">${tabs.map((t,i)=>`<button role="tab" id="${dlgId}-t-${t.id}" aria-controls="${dlgId}-p-${t.id}" aria-selected="${i===0}" tabindex="${i?-1:0}" data-t="${t.id}"><b>${esc(t.label)}</b><small>${esc(t.sub)}</small></button>`).join('')}</div>
      ${tabs.map((t,i)=>`<div class="vb-pane" role="tabpanel" id="${dlgId}-p-${t.id}" aria-labelledby="${dlgId}-t-${t.id}" tabindex="0" data-p="${t.id}" ${i?'hidden':''}>${t.html}</div>`).join('')}
    </div>
  </dialog>`;

  const dlg = el.querySelector('dialog');
  el.querySelector('[data-open]').onclick = () => dlg.showModal();
  el.querySelector('[data-close]').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  const btns = [...el.querySelectorAll('.vb-tabs button')];
  const select = b => {
    btns.forEach(x => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    el.querySelectorAll('[data-p]').forEach(p => p.hidden = p.dataset.p !== b.dataset.t);
  };
  btns.forEach((b, i) => {
    b.onclick = () => select(b);
    // 탭 역할이면 좌우 화살표 이동이 기대 동작이다
    b.onkeydown = e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = btns[(i + d + btns.length) % btns.length];
      select(next); next.focus();
    };
  });
}
