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
// 색으로 경고하지 않고 아이콘으로 구분한다 — 붉은/노란 칩은 문서 전체를 불안하게 만들어서,
// 정직하게 낮은 등급을 적을 유인을 오히려 깎는다.
const ICO = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 17h15"/>',
  shield:'<path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
};
const LEVELS = {
  D: { t:'VERIFY BEFORE USE', i:'search',  w:'핵심 항목이 미검증 — 쓰기 전에 직접 확인하세요', cond:'한 항목이라도 D · 또는 1차 출처 없음' },
  C: { t:'DIRECTIONAL ONLY',  i:'compass', w:'가정이 결과를 좌우 — 방향·자릿수 감만 가져가세요', cond:'최저 등급이 C' },
  B: { t:'REFERENCE ONLY',    i:'book',    w:'비교·후보 좁히기까지. 숫자 인용은 실측 후에', cond:'최저 등급이 B' },
  A: { t:'CITE AS-IS',        i:'shield',  w:'전 항목 1차 출처·물리 계산 — 그대로 인용 가능', cond:'전 항목 A' },
};
const LV_ORDER = ['A','B','C','D'];
const fmtMin = m => m < 60 ? `${m}분` : `${Math.floor(m/60)}시간 ${m%60}분`;
function levelOf(P) {
  const gs = (P.grades || []).map(x => x.g).filter(Boolean);
  if (!gs.length) return { ...LEVELS.D, key:'D', w:'항목별 등급이 기재되지 않았다' };
  // 확인 경로(1차 출처)가 없으면 등급이 뭐든 최하 — 독자가 대조할 방법이 없다
  if (!(P.sources || []).length) return { ...LEVELS.D, key:'D', w:'1차 출처가 없어 대조할 방법이 없다' };
  const k = ['D','C','B','A'].find(x => gs.includes(x)) || 'D';
  return { ...LEVELS[k], key:k };
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
  const flat = tl.flatMap(d => d.rows || []);
  const maxMin = Math.max(1, ...flat.map(x => x.min || 0));
  const totalMin = flat.reduce((s, x) => s + (x.min || 0), 0);
  const lv = levelOf(P);

  const tabs = [
    { id:'a', n:1, label:'어떻게 팠나', sub:flat.length?`${flat.length}구간`:`${P.angles.length}단계`, html:`
      <p class="vb-lead">${flat.length
        ? `트랜스크립트 타임스탬프에서 뽑은 작업 구간(KST). <b>막대 길이 = 그 구간에 머문 시간</b>이라, 어디서 오래 붙들렸는지가 그대로 보인다.`
        : `어떤 질문을 <b>순서대로</b> 파고들었나.`}</p>
      ${flat.length ? `<table class="vb-tl"><thead><tr><th>시각</th><th>추이</th><th>소요 · 턴</th><th>무엇을 했나</th></tr></thead><tbody>${tl.map(day=>`
        <tr class="dayrow"><td colspan="4"><b>${esc(day.d)}</b><span>(${esc(day.wd)})</span><em>${day.rows.length}구간 · ${fmtMin(day.rows.reduce((a,r)=>a+r.min,0))} · ${day.rows.reduce((a,r)=>a+r.n,0)}건</em></td></tr>
        ${day.rows.map(x=>`<tr>
          <td class="when">${esc(x.t)}</td>
          <td class="bar"><i style="width:${Math.max(3, Math.round((x.min/maxMin)*100))}%"></i></td>
          <td class="num">${x.min?fmtMin(x.min):'—'}<br><span>${esc(x.n)}건</span></td>
          <td><b>${esc(x.k)}</b><br><span class="sub">${esc(x.s)}</span></td></tr>`).join('')}`).join('')}</tbody></table>
      <p class="vb-sep">이 과정에서 <b>확정한 판단 ${P.angles.length}가지</b> — 구간 라벨과 겹치지 않는 것만</p>` : ''}
      <ol class="vb-list">${P.angles.map(x=>`<li><b>${esc(x[0])}</b> — ${esc(x[1])}</li>`).join('')}</ol>` },
    { id:'b', n:2, label:'얼마나 믿나', sub:`최저 ${lv.key} · ${P.grades.length}항목`, html:`
      <p class="vb-lead">항목마다 <b>근거의 단단함이 다르다.</b> 이 중 <b>최저 등급이 맨 위 레벨</b>을 결정한다 — 가장 약한 고리가 이 자료의 수준이라서.</p>
      <table class="vb-tbl"><thead><tr><th style="width:38%">항목군 · 등급</th><th>왜 이 등급인가</th></tr></thead><tbody>${P.grades.map(x=>`<tr><td style="width:38%"><b class="${g(x.g)}">${esc(x.g)}</b> ${esc(x.k)}</td><td>${esc(x.why)}</td></tr>`).join('')}</tbody></table>` },
    { id:'c', n:3, label:'뭘 바로잡았나', sub:`${P.findings.length}건 · 치명 ${P.findings.filter(f=>f.sev==='치명').length}`, html:`
      <p class="vb-lead">작업 중간에 <b>스스로 뒤집은 판단</b>이다. 남은 오류가 아니라 이미 고친 것들이고, 치명은 <b>결정 자체가 바뀐 것</b>을 말한다.</p>
      <table class="vb-tbl"><thead><tr><th style="width:15%">심각도</th><th>무엇을 뒤집었나 · 결과</th></tr></thead><tbody>${P.findings.map(f=>`<tr><td style="width:15%;white-space:nowrap">${esc(f.r)}<span class="vb-sev ${s(f.sev)}">${esc(f.sev)}</span></td><td>${esc(f.t)}${f.now?`<br><span class="vb-now">✓ ${esc(f.now)}</span>`:''}</td></tr>`).join('')}</tbody></table>` },
    { id:'d', n:4, label:'어디서 왔나', sub:`1차 출처 ${P.sources.length}`, html:`
      <p class="vb-lead">이 자료를 <b>믿지 말고 찍어보라.</b> 실제로 조회한 1차 출처다.<br><span style="color:var(--vb-ink3);font-size:11.5px">조사 방식 — ${esc(P.method)}</span></p>
      <table class="vb-tbl"><thead><tr><th style="width:28%">출처</th><th>확인한 값</th><th style="width:26%">재현 경로</th></tr></thead><tbody>${P.sources.map(x=>`<tr><td>${x.u?`<a href="${safeUrl(x.u)}" target="_blank" rel="noopener noreferrer">${esc(x.t)} ↗</a>`:`<b>${esc(x.t)}</b>`}</td><td>${esc(x.n)}</td><td><code style="font-size:10px;word-break:break-all">${esc(x.r||(x.u?'공개 문서':'—'))}</code></td></tr>`).join('')}</tbody></table>` },
    { id:'e', n:5, label:'뭘 못했나', sub:`${P.gaps.length}건 미검증`, html:`
      <p class="vb-lead">여기까지가 <b>이 자료의 한계.</b> 다음 담당자가 이어서 하면 된다.</p>
      <table class="vb-tbl"><thead><tr><th style="width:26%">확인 못한 것</th><th>왜 남겨두면 위험한가 · 해소 비용</th></tr></thead><tbody>${P.gaps.map(x=>`<tr><td style="width:26%"><b>${esc(x.item)}</b><br><small>${esc(x.sub)}</small></td><td>${esc(x.why)}<br><b style="color:var(--vb-amber)">${esc(x.gain)}</b></td></tr>`).join('')}</tbody></table>
      <div class="vb-eq">👉 ${esc(P.closing)}</div>` },
  ];

  const dlgId = 'vbDlg' + Math.random().toString(36).slice(2,7);
  el.innerHTML = `
  <footer class="vb-sign">
    <div class="line"><b>Made by</b> ${esc(A.org)} ${esc(A.dept)} ${esc(A.name)} ${esc(A.title)} · <b>Powered by</b> ${esc(P.tool)}</div>
    <div class="line dim">© ${esc(String(P.asOf).slice(0,4))} ${esc(A.org)}${P.use?` · ${esc(P.use)}`:''} · 데이터 기준일 ${esc(P.asOf)}</div>
    <button class="vb-chip" data-open="${dlgId}" title="${esc(lv.w)}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${ICO[lv.i]}</svg>
      <span>${esc(lv.t)}</span>${rounds?`<em>${esc(rounds)}× reviewed</em>`:''}
    </button>
  </footer>
  <dialog class="vb-dlg" id="${dlgId}" aria-label="제작·검증 이력">
    <div class="vb-head"><h3>제작·검증 이력 <span style="font-weight:400;color:var(--vb-ink3);font-size:13px">· 이 자료를 어떻게 만들었나</span></h3><button data-close aria-label="닫기">✕</button></div>
    <div class="vb-body">
      <div class="vb-lvbox">
        <svg viewBox="0 0 24 24">${ICO[lv.i]}</svg><b>${esc(lv.t)}</b><span>${esc(lv.w)}</span>
        <button class="vb-lvi" data-lvi title="다른 레벨은 뭐가 있나">!</button>
      </div>
      <p class="vb-meta">${P.stats.map(x=>`<b>${esc(x.v)}</b> ${esc(String(x.l).replace(/\(.*\)/,'').trim())}`).join(' <i>·</i> ')} <i>·</i> <s>${esc(P.asOf)} 기준</s> <i>·</i> <s>${esc(P.tool)}</s></p>
      <div class="vb-tabs" role="tablist">${tabs.map((t,i)=>`<button role="tab" id="${dlgId}-t-${t.id}" aria-controls="${dlgId}-p-${t.id}" aria-selected="${i===0}" tabindex="${i?-1:0}" data-t="${t.id}"><u>${t.n}</u><b>${esc(t.label)}</b><small>${esc(t.sub)}</small></button>`).join('')}</div>
      ${tabs.map((t,i)=>`<div class="vb-pane" role="tabpanel" id="${dlgId}-p-${t.id}" aria-labelledby="${dlgId}-t-${t.id}" tabindex="0" data-p="${t.id}" ${i?'hidden':''}>${t.html}</div>`).join('')}
    </div>
  </dialog>
  <dialog class="vb-dlg vb-dlg-lv" id="${dlgId}-lv" aria-label="준비도 레벨">
    <div class="vb-head"><h3>준비도 레벨 <span style="font-weight:400;color:var(--vb-ink3);font-size:13px">· 4단계와 판정 조건</span></h3><button data-lvclose aria-label="닫기">✕</button></div>
    <div class="vb-body">
      <p class="vb-lvnote">레벨은 <b>항목별 등급의 최저값</b>에서 자동으로 정해진다. 문구를 고쳐 올릴 수 없고, 근거를 올려야 올라간다.</p>
      <table class="vb-lvall"><thead><tr><th></th><th>등급</th><th>인용 범위</th><th>어떤 상태인가</th></tr></thead><tbody>${LV_ORDER.map(k=>{const L=LEVELS[k];return `<tr class="${k===lv.key?'on':''}">
        <td class="ic"><svg viewBox="0 0 24 24">${ICO[L.i]}</svg></td>
        <td class="nm">${esc(L.t)}${k===lv.key?'<i>현재</i>':''}</td>
        <td class="cd">${esc(L.cond)}</td><td>${esc(L.w)}</td></tr>`;}).join('')}</tbody></table>
    </div>
  </dialog>`;

  const dlg = el.querySelector('dialog');
  el.querySelector('[data-open]').onclick = () => dlg.showModal();
  el.querySelector('[data-close]').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  // 레벨 4단계는 중첩 다이얼로그로 — 인라인 펼침은 아래를 밀어내 다이얼로그가 튄다
  const lvi = el.querySelector('[data-lvi]'), lvd = el.querySelector('.vb-dlg-lv');
  if (lvi) lvi.onclick = () => lvd.showModal();
  if (lvd) {
    lvd.querySelector('[data-lvclose]').onclick = () => lvd.close();
    lvd.addEventListener('click', e => { if (e.target === lvd) lvd.close(); });
  }

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
