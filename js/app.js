(function () {
  'use strict';
  const D = window.DPDATA, X = window.DPEXTRA, MD = window.MD, VIZ = window.VIZ, VizPlayer = window.VizPlayer;
  const esc = MD.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const KEY = 'katak.v1';
  const main = $('#main');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LESSON = {}, PROB = {}, MODULE = {};
  D.lessons.forEach((l, i) => { l.n = i + 1; LESSON[l.id] = l; });
  D.problems.forEach((p, i) => { p.n = i + 1; PROB[p.id] = p; });
  D.modules.forEach(m => { MODULE[m.id] = m; });
  const cardKey = c => c.l + ':' + c.f;

  /* ---------- sana ---------- */
  const pad = n => String(n).padStart(2, '0');
  const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dstr(new Date());
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); };
  const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
  const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  const fmtD = s => { const d = parseD(s); return `${d.getDate()}-${MONTHS[d.getMonth()]}`; };

  /* ---------- holat ---------- */
  function fresh() {
    return { v: 1, name: '', theme: 'auto', start: today(), items: [], solved: {}, tried: {}, hints: {}, peek: {}, mysol: {}, notes: {}, quiz: {}, cards: {}, log: {}, focus: {}, seq: 1, viz: {}, boardView: 'board' };
  }
  let S = null;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  S = Object.assign(fresh(), S || {});
  let canSave = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) {
      if (canSave) { canSave = false; toast("Brauzer xotirasiga yozib bo'lmadi — progress saqlanmayapti."); }
    }
  }

  /* ---------- work items ---------- */
  const TYPES = { Learn: 'Nazariya', Code: 'Kod', Practice: 'Masala', Viz: 'Vizual', Quiz: 'Test', Review: 'Takrorlash', Custom: 'Boshqa' };
  const STATUSES = [['todo', 'To Do'], ['doing', 'In Progress'], ['review', 'Review'], ['done', 'Done']];
  const STATUS_LABEL = Object.fromEntries(STATUSES);
  const PRI = { 1: 'Yuqori', 2: "O'rta", 3: 'Past' };
  const SP_OPTS = [1, 2, 3, 5, 8];

  function genItems() {
    const out = [];
    D.lessons.forEach((l, idx) => {
      let k = 1;
      const id = () => 'DP-' + ((idx + 1) * 100 + k++);
      out.push({ id: id(), type: 'Learn', lesson: l.id, title: `${l.title}: nazariya`, sp: 2, pr: 1, crit: [...l.goals, 'Konspekt yozildi'] });
      if (l.id === 'l18') {
        out.push({ id: id(), type: 'Code', lesson: l.id, title: 'Stress test faylini yozib ishga tushirish', sp: 3, pr: 2, crit: ['Brute force yechim yozildi', 'Tasodifiy test generatori yozildi', "Kamida bitta xatoni stress test bilan topdim yoki 10 000 testda OK oldim"] });
      } else {
        out.push({ id: id(), type: 'Code', lesson: l.id, title: `${l.title}: kodlarni qo'lda yozish`, sp: 3, pr: 2, crit: ["Darsdagi kod bloklarini ko'chirmasdan, o'zim yozdim", "Kamida bitta misolni qog'ozda jadval bilan hisobladim", 'Vaqt va xotira murakkabligini tushuntira olaman'] });
      }
      for (const pid of l.problems) {
        const p = PROB[pid];
        out.push({ id: id(), type: 'Practice', lesson: l.id, problem: pid, title: `${p.title} (${p.ref})`, sp: p.diff === 'Oson' ? 2 : p.diff === 'Qiyin' ? 5 : 3, pr: p.diff === 'Qiyin' ? 2 : 1, crit: ["Hintlarsiz kamida 20 daqiqa o'yladim", "Yechim barcha misollardan o'tdi", 'Murakkablikni baholadim'] });
      }
      for (const vz of l.viz) {
        out.push({ id: id(), type: 'Viz', lesson: l.id, viz: vz, title: `Vizualizator: ${VIZ[vz].title}`, sp: 1, pr: 3, crit: ["Standart misolni oxirigacha ko'rdim", "O'z inputim bilan oxirigacha ko'rdim", 'Har katak qaysi kataklarga bog\'liqligini tushuntira olaman'] });
      }
      if (X.quiz.some(q => q.l === l.id)) out.push({ id: id(), type: 'Quiz', lesson: l.id, title: `${l.title}: test ≥ 80%`, sp: 1, pr: 2, crit: ['Testni 80% dan yuqori natija bilan topshirdim', 'Xato javoblarni tahlil qildim'] });
      if (X.cards.some(c => c.l === l.id)) out.push({ id: id(), type: 'Review', lesson: l.id, title: `${l.title}: kartalarni takrorlash`, sp: 1, pr: 3, crit: ['Barcha kartalarni kamida bir marta "Bildim" deb belgiladim'] });
    });
    return out.map(it => Object.assign(it, { sprint: LESSON[it.lesson].week, crit: it.crit.map(t => ({ t, d: false })) }));
  }

  function syncItems() {
    const have = new Set(S.items.map(i => i.id));
    for (const g of genItems()) {
      if (!have.has(g.id)) S.items.push(Object.assign(g, { status: 'todo', notes: '', created: today(), doneAt: null }));
    }
  }
  syncItems();
  save();

  const idNum = id => parseInt(id.replace(/\D/g, ''), 10) || 0;
  const ST_ORDER = { doing: 0, review: 1, todo: 2, done: 3 };
  const sortItems = (a, b) => ST_ORDER[a.status] - ST_ORDER[b.status] || a.sprint - b.sprint || a.pr - b.pr || idNum(a.id) - idNum(b.id);
  const itemsOf = lid => S.items.filter(i => i.lesson === lid);
  const findItem = pred => S.items.find(pred);
  const byId = id => S.items.find(i => i.id === id);
  const sumSp = arr => arr.reduce((a, i) => a + (+i.sp || 0), 0);

  function logAct(n) { const t = today(); S.log[t] = (S.log[t] || 0) + (n || 1); }
  function streak() {
    let d = today();
    if (!S.log[d]) d = addDays(d, -1);
    let k = 0;
    while (S.log[d]) { k++; d = addDays(d, -1); }
    return k;
  }

  function setStatus(it, st, auto) {
    if (!it || it.status === st) return;
    const wasDone = it.status === 'done';
    it.status = st;
    if (st === 'done') {
      it.doneAt = today();
      if (auto) it.crit.forEach(c => { c.d = true; });
      if (!wasDone) logAct(1);
    } else it.doneAt = null;
  }
  function autoDone(pred) {
    const it = findItem(pred);
    if (it && it.status !== 'done') {
      setStatus(it, 'done', true);
      toast(`${it.id} Done ustuniga o'tdi`);
    }
  }
  function critChanged(it) {
    if (it.crit.length && it.crit.every(c => c.d) && it.status !== 'done') {
      setStatus(it, 'done');
      toast(`Barcha mezonlar bajarildi — ${it.id} Done`);
    }
  }
  const lessonDone = lid => { const it = findItem(i => i.lesson === lid && i.type === 'Learn'); return !!(it && it.status === 'done'); };
  function lessonProg(lid) {
    const its = itemsOf(lid);
    const tot = sumSp(its);
    return tot ? sumSp(its.filter(i => i.status === 'done')) / tot : 0;
  }
  const grade = p => (p >= 0.9 ? 5 : p >= 0.75 ? 4 : p >= 0.5 ? 3 : 2);
  const mark = (g, small) => `<span class="mark${small ? ' sm' : ''}" title="Baho: ${g}">${g}</span>`;

  const SPRINTS = Math.max(...D.lessons.map(l => l.week));
  const curSprint = () => Math.max(1, Math.floor(diffDays(S.start, today()) / 7) + 1);
  const sprintStart = k => addDays(S.start, (k - 1) * 7);
  const sprintLabel = k => `${fmtD(sprintStart(k))} – ${fmtD(addDays(sprintStart(k), 6))}`;

  /* ---------- ikonlar ---------- */
  const IC = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/>',
    board: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
    flag: '<path d="M5 21V4h12l-2.5 4L17 12H5"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5v.6M12 17h.01"/>',
    cards: '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/>',
    code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    first: '<path d="M6 5v14M18 5l-7 7 7 7"/>',
    last: '<path d="M18 5v14M6 5l7 7-7 7"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-8.1L4 10"/>',
  };
  const ic = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

  /* ---------- umumiy UI ---------- */
  let toastT;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2800);
  }

  let lastFocus = null, modalOnClose = null;
  function openModal(html, opts) {
    opts = opts || {};
    closeModal(true);
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-back" data-act="modal-close"></div><div class="modal${opts.cls ? ' ' + opts.cls : ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || '')}">${html}</div>`;
    root.classList.add('open');
    document.body.classList.add('modal-open');
    lastFocus = document.activeElement;
    modalOnClose = opts.onClose || null;
    const m = $('.modal', root);
    if (opts.onMount) opts.onMount(m);
    const f = $('[autofocus]', m) || $('button, input, select, textarea, a[href]', m);
    if (f) f.focus();
  }
  function closeModal(silent) {
    const root = $('#modal-root');
    if (!root.classList.contains('open')) return;
    root.classList.remove('open');
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
    const cb = modalOnClose;
    modalOnClose = null;
    if (!silent && cb) cb();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function confirmBox(text, okLabel, onOk, danger) {
    openModal(`<div class="m-pad"><p class="m-text">${esc(text)}</p><div class="row gap end"><button class="btn" data-act="modal-close">Bekor qilish</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cOk">${esc(okLabel)}</button></div></div>`, {
      label: 'Tasdiqlash', cls: 'narrow',
      onMount: m => { $('#cOk', m).onclick = () => { closeModal(true); onOk(); }; },
    });
  }

  function copyText(text) {
    const done = () => toast('Nusxa olindi');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast("Nusxa olib bo'lmadi"); }
      ta.remove();
    }
  }

  function applyTheme() {
    const t = S.theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.theme;
    document.documentElement.dataset.theme = t;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = t === 'dark' ? '#0e1828' : '#f7f9fd';
    $$('[data-act="theme"]').forEach(b => { b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon'); b.setAttribute('aria-label', t === 'dark' ? "Kunduzgi rejim" : 'Tungi rejim'); });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'auto') applyTheme(); });

  /* ---------- navigatsiya ---------- */
  const NAV = [
    ['#/', 'home', 'Bosh sahifa'],
    ['#/darslar', 'book', 'Darslar'],
    ['#/board', 'board', 'Board'],
    ['#/masalalar', 'flag', 'Masalalar'],
    ['#/viz', 'grid', 'Vizualizator'],
    ['#/test', 'quiz', 'Test'],
    ['#/kartalar', 'cards', 'Kartalar'],
    ['#/shablonlar', 'code', 'Shablonlar'],
    ['#/sozlamalar', 'gear', 'Sozlamalar'],
  ];
  const TABS = ['#/', '#/darslar', '#/board', '#/masalalar'];

  function buildNav() {
    $('#nav').innerHTML = NAV.map(([href, icon, label]) => `<a href="${href}" data-nav="${href}">${ic(icon)}<span>${label}</span></a>`).join('');
    $('#tabbar').innerHTML = NAV.filter(n => TABS.includes(n[0])).map(([href, icon, label]) => `<a href="${href}" data-nav="${href}">${ic(icon)}<span>${label === 'Bosh sahifa' ? 'Bosh' : label}</span></a>`).join('')
      + `<button type="button" data-act="more" data-nav="more">${ic('more')}<span>Ko'proq</span></button>`;
  }
  function navKey(h) {
    if (h.startsWith('#/dars/')) return '#/darslar';
    if (h.startsWith('#/masala/')) return '#/masalalar';
    if (h.startsWith('#/viz/')) return '#/viz';
    return h === '#' || h === '' ? '#/' : h;
  }
  function markNav(h) {
    const k = navKey(h);
    $$('[data-nav]').forEach(a => {
      const on = a.dataset.nav === k || (a.dataset.nav === 'more' && !TABS.includes(k));
      a.classList.toggle('on', on);
      if (on && a.tagName === 'A') a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function openMore() {
    const rest = NAV.filter(n => !TABS.includes(n[0]));
    openModal(`<div class="sheet"><div class="sheet-grip"></div><nav class="sheet-nav">${rest.map(([href, icon, label]) => `<a href="${href}" data-act="modal-close-go">${ic(icon)}<span>${label}</span></a>`).join('')}</nav><div class="sheet-timer" data-timer-box></div></div>`, { label: "Ko'proq", cls: 'sheet-modal', onMount: () => renderTimers() });
  }

  /* ---------- router ---------- */
  const ROUTES = [
    [/^#\/?$/, pageHome],
    [/^#\/darslar$/, pageLessons],
    [/^#\/dars\/(l\d+)$/, pageLesson],
    [/^#\/board$/, pageBoard],
    [/^#\/masalalar$/, pageProblems],
    [/^#\/masala\/(p\d+)$/, pageProblem],
    [/^#\/viz$/, pageVizList],
    [/^#\/viz\/(\w+)$/, pageViz],
    [/^#\/test$/, pageQuiz],
    [/^#\/kartalar$/, pageCards],
    [/^#\/shablonlar$/, pageCheats],
    [/^#\/sozlamalar$/, pageSettings],
  ];
  let cleanups = [];
  const onLeave = fn => cleanups.push(fn);
  function route(keepScroll) {
    const y = window.scrollY;
    cleanups.forEach(f => { try { f(); } catch (e) { /* */ } });
    cleanups = [];
    closeModal(true);
    hideSearch();
    const h = location.hash || '#/';
    for (const [re, fn] of ROUTES) {
      const m = h.match(re);
      if (m && (fn !== pageLesson || LESSON[m[1]]) && (fn !== pageProblem || PROB[m[1]]) && (fn !== pageViz || VIZ[m[1]])) {
        main.innerHTML = '';
        fn.apply(null, m.slice(1));
        markNav(h);
        renderTimers();
        if (keepScroll) window.scrollTo(0, y);
        else { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
        return;
      }
    }
    location.replace('#/');
  }
  const refresh = () => route(true);

  /* ---------- bosh sahifa ---------- */
  let heroPlayed = false;
  function pageHome() {
    document.title = 'Katak — Java DP';
    const next = D.lessons.find(l => !lessonDone(l.id)) || D.lessons.find(l => lessonProg(l.id) < 1) || D.lessons[D.lessons.length - 1];
    const cs = curSprint();
    const day = diffDays(sprintStart(cs), today()) + 1;
    const open = S.items.filter(i => i.status !== 'done');
    let list = open.filter(i => i.sprint <= cs).sort(sortItems).slice(0, 5);
    if (!list.length) list = open.slice().sort(sortItems).slice(0, 5);
    const doneL = D.lessons.filter(l => lessonDone(l.id)).length;
    const solved = Object.keys(S.solved).length;
    const spAll = sumSp(S.items), spDone = sumSp(S.items.filter(i => i.status === 'done'));
    const st = streak();
    const mins = S.focus[today()] || 0;

    main.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-meta">${S.name ? esc(S.name) + ', bugun ' : 'Bugun '}${fmtD(today())}. Sprint ${cs}, ${day}-kun.</p>
          <h1>Bugun qaysi katakni to'ldiramiz?</h1>
          <p class="hero-lead">Keyingi dars: <a href="#/dars/${next.id}">${next.n}. ${esc(next.title)}</a>. ${esc(next.summary)}</p>
          <div class="row gap wrap">
            <a class="btn primary" href="#/dars/${next.id}">Darsni ochish</a>
            <a class="btn" href="#/board">Sprint ${cs} board'i</a>
          </div>
        </div>
        <figure class="hero-fig">
          <div class="hero-table" id="heroTable"></div>
          <figcaption>LCS("DASTUR", "DARSLIK"): har katak chap, yuqori yoki diagonal qo'shnidan to'ladi. <button type="button" class="linkbtn" data-act="hero-replay">Qaytadan yozish</button></figcaption>
        </figure>
      </section>

      <section class="dash">
        <div class="panel dash-today">
          <div class="panel-head"><h2>Navbatdagi ishlar</h2><a href="#/board">Board</a></div>
          ${list.length ? `<ul class="todo">${list.map(todoRow).join('')}</ul>` : `<p class="empty">Barcha work item'lar bajarilgan. Yangisini board'da qo'shing.</p>`}
        </div>

        <div class="panel dash-stats">
          <div class="panel-head"><h2>Natija</h2></div>
          <dl class="stats">
            <div><dt>Darslar</dt><dd>${doneL}<small>/${D.lessons.length}</small></dd></div>
            <div><dt>Masalalar</dt><dd>${solved}<small>/${D.problems.length}</small></dd></div>
            <div><dt>Story points</dt><dd>${spDone}<small>/${spAll}</small></dd></div>
            <div><dt>Ketma-ket kunlar</dt><dd>${st}<small> kun</small></dd></div>
          </dl>
          <div class="bar" role="img" aria-label="Umumiy progress ${Math.round(spDone / spAll * 100)}%"><i style="width:${(spDone / spAll * 100).toFixed(1)}%"></i></div>
        </div>

        <div class="panel dash-heat">
          <div class="panel-head"><h2>Faollik</h2><span class="muted">so'nggi 16 hafta</span></div>
          ${heatmap(16)}
        </div>

        <div class="panel dash-timer">
          <div class="panel-head"><h2>Fokus taymer</h2><span class="muted">bugun ${mins} daqiqa</span></div>
          <div data-timer-box></div>
        </div>

        <div class="panel dash-modules">
          <div class="panel-head"><h2>Modullar</h2><a href="#/darslar">Barcha darslar</a></div>
          <ul class="mods">${D.modules.map(modRow).join('')}</ul>
        </div>
      </section>`;

    const host = $('#heroTable');
    const model = VIZ.lcs.build({ s: 'DASTUR', t: 'DARSLIK' });
    const pl = new VizPlayer(host, model, {
      mini: true, speed: 110,
      onFinish: () => {
        host.classList.add('done');
        const last = $('tbody tr:last-child td:last-child', host);
        if (last) last.classList.add('answer');
      },
    });
    if (heroPlayed || reduceMotion) pl.end();
    else { heroPlayed = true; setTimeout(() => pl.play(), 500); }
    onLeave(() => pl.destroy());
    $('[data-act="hero-replay"]').onclick = () => {
      host.classList.remove('done');
      $$('.answer', host).forEach(td => td.classList.remove('answer'));
      pl.finished = false;
      pl.reset();
      pl.play();
    };
  }

  function todoRow(it) {
    return `<li><button type="button" class="todo-row" data-act="item-open" data-id="${it.id}">
      <span class="tbadge t-${it.type}">${TYPES[it.type]}</span>
      <span class="todo-title">${esc(it.title)}</span>
      <span class="todo-st st-${it.status}">${STATUS_LABEL[it.status]}</span>
    </button></li>`;
  }

  function modRow(m) {
    const ls = D.lessons.filter(l => l.module === m.id);
    const p = ls.reduce((a, l) => a + lessonProg(l.id), 0) / ls.length;
    const allDone = ls.every(l => itemsOf(l.id).every(i => i.status === 'done'));
    return `<li><a href="#/dars/${ls[0].id}"><span class="mod-name">${esc(m.title)}</span><span class="bar thin"><i style="width:${(p * 100).toFixed(0)}%"></i></span><span class="mod-p">${allDone ? mark(5, true) : Math.round(p * 100) + '%'}</span></a></li>`;
  }

  function heatmap(weeks) {
    const end = today();
    const dow = (parseD(end).getDay() + 6) % 7;
    const start = addDays(end, -(weeks - 1) * 7 - dow);
    let cells = '';
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      if (diffDays(day, end) < 0) { cells += '<i class="hm off"></i>'; continue; }
      const n = S.log[day] || 0;
      const lv = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4;
      cells += `<i class="hm l${lv}${day === end ? ' now' : ''}" title="${fmtD(day)}: ${n} ta harakat"></i>`;
    }
    return `<div class="heat-wrap"><div class="heat-days"><span>Du</span><span></span><span>Ch</span><span></span><span>Ju</span><span></span><span>Ya</span></div><div class="heat" style="--weeks:${weeks}">${cells}</div></div>`;
  }

  /* ---------- darslar ---------- */
  function pageLessons() {
    document.title = 'Darslar — Katak';
    const done = D.lessons.filter(l => lessonDone(l.id)).length;
    main.innerHTML = `
      <header class="page-head"><h1>Darslar</h1><p>${D.lessons.length} ta dars, ${D.modules.length} ta modul. ${done} tasi o'qilgan. Har dars bitta sprintga (haftaga) rejalashtirilgan — sprintlar <a href="#/board">board</a>'da.</p></header>
      <ol class="roadmap">${D.modules.map(m => {
        const ls = D.lessons.filter(l => l.module === m.id);
        return `<li class="rm-module"><h2>${esc(m.title)}<span>${esc(m.desc)}</span></h2><ol class="rm-lessons">${ls.map(lessonRow).join('')}</ol></li>`;
      }).join('')}</ol>`;
  }
  function lessonRow(l) {
    const p = lessonProg(l.id);
    const allDone = p >= 1;
    const read = lessonDone(l.id);
    const state = allDone ? mark(5) : read ? `<span class="rm-pct">${Math.round(p * 100)}%</span>` : p > 0 ? `<span class="rm-pct">${Math.round(p * 100)}%</span>` : '';
    return `<li class="rm-lesson${read ? ' read' : ''}"><a href="#/dars/${l.id}">
      <span class="rm-n">${l.n}</span>
      <span class="rm-body"><strong>${esc(l.title)}</strong><span class="rm-sum">${esc(l.summary)}</span>
      <span class="rm-meta">Sprint ${l.week}, ~${l.mins} daqiqa${l.problems.length ? `, ${l.problems.length} ta masala` : ''}${l.viz.length ? ', vizualizator' : ''}</span></span>
      <span class="rm-state">${state}</span></a></li>`;
  }

  function pageLesson(id) {
    const l = LESSON[id];
    document.title = `${l.title} — Katak`;
    const mod = MODULE[l.module];
    const { html, toc } = MD.render(l.md, { prefix: l.id });
    const learn = findItem(i => i.lesson === id && i.type === 'Learn');
    const prev = D.lessons[l.n - 2], next = D.lessons[l.n];
    const q = S.quiz[id];
    const its = itemsOf(id).slice().sort((a, b) => idNum(a.id) - idNum(b.id));
    const read = learn.status === 'done';
    main.innerHTML = `
      <article class="lesson">
        <header class="lesson-head">
          <p class="crumbs"><a href="#/darslar">Darslar</a><span aria-hidden="true">/</span>${esc(mod.title)}</p>
          <h1><span class="lesson-n">${l.n}</span>${esc(l.title)}</h1>
          <p class="lesson-meta">Sprint ${l.week}, taxminan ${l.mins} daqiqa${read ? ` ${mark(5, true)}` : ''}</p>
          <div class="goals">
            <h2>Dars maqsadlari</h2>
            <ul class="checklist">${learn.crit.map((c, k) => `<li><label><input type="checkbox" data-crit="${learn.id}:${k}" ${c.d ? 'checked' : ''}><span>${MD.inline(c.t)}</span></label></li>`).join('')}</ul>
          </div>
        </header>
        <div class="lesson-layout">
          <div class="prose">${html}</div>
          <aside class="lesson-aside">
            <nav class="toc" aria-label="Mundarija"><h2>Mundarija</h2><ol>${toc.map(t => `<li><a href="#${t.id}" data-act="toc">${MD.inline(t.text)}</a></li>`).join('')}</ol></nav>
            <section class="aside-items"><h2>Work items</h2><ul>${its.map(it => `<li><button type="button" data-act="item-open" data-id="${it.id}" class="mini-item st-${it.status}"><span class="wi-id">${it.id}</span><span>${esc(TYPES[it.type])}${it.problem ? ': ' + esc(PROB[it.problem].title) : ''}</span><span class="dot" title="${STATUS_LABEL[it.status]}"></span></button></li>`).join('')}</ul></section>
          </aside>
        </div>
        <section class="lesson-end">
          ${l.problems.length ? `<div class="end-block"><h2>Amaliyot</h2><ul class="plinks">${l.problems.map(pid => { const p = PROB[pid]; return `<li><a href="#/masala/${pid}"><span class="diff d-${diffKey(p.diff)}">${p.diff}</span>${esc(p.title)}<small>${esc(p.ref)}</small>${S.solved[pid] ? ic('check', 'ok') : ''}</a></li>`; }).join('')}</ul></div>` : ''}
          ${l.viz.length ? `<div class="end-block"><h2>Vizualizator</h2><ul class="plinks">${l.viz.map(v => `<li><a href="#/viz/${v}">${ic('grid')}${esc(VIZ[v].title)}</a></li>`).join('')}</ul></div>` : ''}
          <div class="end-block"><h2>Test</h2><p>${X.quiz.filter(x => x.l === id).length} ta savol.${q ? ` Eng yaxshi natija: ${Math.round(q.best * 100)}% ${mark(grade(q.best), true)}` : ''}</p><button type="button" class="btn" data-act="quiz-lesson" data-l="${id}">Testni boshlash</button></div>
          <div class="end-block wide"><h2><label for="notes">Konspekt</label></h2><textarea id="notes" class="notes" data-notes="${id}" rows="6" placeholder="O'z so'zlaringiz bilan: state nima, transition qanday, qaysi joyda adashdingiz…">${esc(S.notes[id] || '')}</textarea><p class="muted small">Avtomatik saqlanadi. 40 belgidan oshsa, "Konspekt yozildi" mezoni belgilanadi.</p></div>
          <div class="end-block wide finish">
            ${read ? `<p class="done-line">${mark(5)} Nazariya o'qilgan. Keyingi qadam — amaliyot va test.</p>` : `<button type="button" class="btn primary" data-act="lesson-done" data-l="${id}">Darsni o'qib chiqdim</button><p class="muted small">${learn.id} Done ustuniga o'tadi.</p>`}
          </div>
          <nav class="pager">${prev ? `<a href="#/dars/${prev.id}" class="pg prev"><small>Oldingi</small>${prev.n}. ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/dars/${next.id}" class="pg next"><small>Keyingi</small>${next.n}. ${esc(next.title)}</a>` : ''}</nav>
        </section>
      </article>`;
    if (learn.status === 'todo') { setStatus(learn, 'doing'); save(); }
  }
  const diffKey = d => (d === 'Oson' ? 'e' : d === 'Qiyin' ? 'h' : 'm');

  /* ---------- board ---------- */
  const BF = { sprint: 'cur', types: new Set(), q: '' };
  function pageBoard() {
    document.title = 'Work items — Katak';
    const cs = curSprint();
    main.innerHTML = `
      <header class="page-head row between wrap">
        <div><h1>Work items</h1><p>Har dars nazariya, kod, masala, vizual, test va takrorlash ishlariga bo'lingan. Kartani suring yoki bosib holatini o'zgartiring.</p></div>
        <button type="button" class="btn primary" data-act="item-new">${ic('plus')}Yangi work item</button>
      </header>
      <div class="toolbar">
        <label class="field inline"><span>Sprint</span><select id="fSprint">
          <option value="cur">Joriy (${cs})</option><option value="all">Hammasi</option>
          ${Array.from({ length: SPRINTS }, (_, i) => `<option value="${i + 1}">Sprint ${i + 1}</option>`).join('')}
        </select></label>
        <div class="chips" role="group" aria-label="Tur bo'yicha filtr">${Object.keys(TYPES).map(t => `<button type="button" class="chip t-${t}" data-type="${t}" aria-pressed="${BF.types.has(t)}">${TYPES[t]}</button>`).join('')}</div>
        <input type="search" id="fText" class="input" placeholder="ID yoki nom" value="${esc(BF.q)}" aria-label="Qidirish">
        <div class="seg" role="group" aria-label="Ko'rinish"><button type="button" data-view="board" aria-pressed="${S.boardView !== 'list'}">Board</button><button type="button" data-view="list" aria-pressed="${S.boardView === 'list'}">Ro'yxat</button></div>
      </div>
      <section class="sprint-sum" id="sprintSum"></section>
      <div id="boardBody"></div>`;
    $('#fSprint').value = BF.sprint;
    $('#fSprint').onchange = e => { BF.sprint = e.target.value; renderBoard(); };
    $('#fText').oninput = e => { BF.q = e.target.value.trim().toLowerCase(); renderBoard(); };
    $$('.chips .chip').forEach(b => b.onclick = () => {
      const t = b.dataset.type;
      if (BF.types.has(t)) BF.types.delete(t); else BF.types.add(t);
      b.setAttribute('aria-pressed', BF.types.has(t));
      renderBoard();
    });
    $$('.seg [data-view]').forEach(b => b.onclick = () => {
      S.boardView = b.dataset.view;
      save();
      $$('.seg [data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
      renderBoard();
    });
    renderBoard();
  }

  function boardItems() {
    const cs = curSprint();
    return S.items.filter(i => {
      if (BF.sprint === 'cur' && i.sprint !== cs) return false;
      if (BF.sprint !== 'cur' && BF.sprint !== 'all' && i.sprint !== +BF.sprint) return false;
      if (BF.types.size && !BF.types.has(i.type)) return false;
      if (BF.q && !(i.id.toLowerCase().includes(BF.q) || i.title.toLowerCase().includes(BF.q))) return false;
      return true;
    });
  }

  function renderBoard() {
    const its = boardItems();
    const k = BF.sprint === 'cur' ? curSprint() : BF.sprint === 'all' ? null : +BF.sprint;
    const sum = $('#sprintSum');
    if (k) {
      const sp = S.items.filter(i => i.sprint === k);
      const tot = sumSp(sp), dn = sumSp(sp.filter(i => i.status === 'done'));
      const lessons = D.lessons.filter(l => l.week === k);
      sum.innerHTML = `<div class="ss-text"><h2>Sprint ${k}</h2><p>${sprintLabel(k)}${lessons.length ? '. Darslar: ' + lessons.map(l => `<a href="#/dars/${l.id}">${l.n}. ${esc(l.title)}</a>`).join(', ') : ''}.</p>
        <p class="ss-num"><strong>${dn}</strong> / ${tot} SP bajarildi</p><div class="bar"><i style="width:${tot ? (dn / tot * 100).toFixed(1) : 0}%"></i></div></div>
        <div class="ss-chart">${burndown(k)}</div>`;
    } else {
      const tot = sumSp(S.items), dn = sumSp(S.items.filter(i => i.status === 'done'));
      sum.innerHTML = `<div class="ss-text"><h2>Barcha sprintlar</h2><p>${SPRINTS} ta sprint, ${S.items.length} ta work item.</p><p class="ss-num"><strong>${dn}</strong> / ${tot} SP bajarildi</p><div class="bar"><i style="width:${(dn / tot * 100).toFixed(1)}%"></i></div></div>`;
    }
    const body = $('#boardBody');
    if (S.boardView === 'list') {
      const sorted = its.slice().sort((a, b) => a.sprint - b.sprint || idNum(a.id) - idNum(b.id));
      body.innerHTML = sorted.length ? `<div class="table-wrap"><table class="wlist"><thead><tr><th>ID</th><th>Nomi</th><th>Tur</th><th>Holat</th><th>Sprint</th><th>SP</th></tr></thead><tbody>${sorted.map(it => `
        <tr><td><button type="button" class="linkbtn mono" data-act="item-open" data-id="${it.id}">${it.id}</button></td><td>${esc(it.title)}</td><td><span class="tbadge t-${it.type}">${TYPES[it.type]}</span></td>
        <td><select class="mini-select" data-status-of="${it.id}" aria-label="${it.id} holati">${STATUSES.map(([v, t]) => `<option value="${v}"${v === it.status ? ' selected' : ''}>${t}</option>`).join('')}</select></td><td>${it.sprint}</td><td>${it.sp}</td></tr>`).join('')}</tbody></table></div>` : emptyBoard();
      return;
    }
    body.innerHTML = `<div class="kanban">${STATUSES.map(([st, label]) => {
      const col = its.filter(i => i.status === st).sort(sortItems);
      return `<section class="col col-${st}" data-drop="${st}" aria-label="${label}">
        <header><h2>${label}</h2><span>${col.length} ta, ${sumSp(col)} SP</span></header>
        <div class="col-body">${col.map(wiCard).join('') || '<p class="col-empty">Bo\'sh</p>'}</div></section>`;
    }).join('')}</div>`;
    bindDnD(body);
  }
  const emptyBoard = () => '<p class="empty">Filtrga mos work item yo\'q.</p>';

  function wiCard(it) {
    const cd = it.crit.filter(c => c.d).length;
    const l = LESSON[it.lesson];
    return `<article class="wi t-${it.type}" draggable="true" data-id="${it.id}" data-act="item-open" tabindex="0" aria-label="${it.id}: ${esc(it.title)}">
      <div class="wi-top"><span class="wi-id">${it.id}</span><span class="tbadge t-${it.type}">${TYPES[it.type]}</span></div>
      <h3>${esc(it.title)}</h3>
      <div class="wi-foot">${l ? `<span title="${esc(l.title)}">Dars ${l.n}</span>` : ''}<span>${it.sp} SP</span><span class="pri p${it.pr}">${PRI[it.pr]}</span>${it.crit.length ? `<span class="crit-n${cd === it.crit.length ? ' full' : ''}">${ic('check')}${cd}/${it.crit.length}</span>` : ''}</div>
    </article>`;
  }

  function bindDnD(root) {
    let dragId = null;
    $$('.wi', root).forEach(card => {
      card.addEventListener('dragstart', e => { dragId = card.dataset.id; e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; card.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); $$('.col', root).forEach(c => c.classList.remove('over')); });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(card.dataset.id); }
      });
    });
    $$('.col', root).forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('over');
        const it = byId(e.dataTransfer.getData('text/plain') || dragId);
        if (it && it.status !== col.dataset.drop) {
          setStatus(it, col.dataset.drop);
          save();
          renderBoard();
          if (it.status === 'done') toast(`${it.id} Done`);
        }
      });
    });
  }

  function burndown(k) {
    const its = S.items.filter(i => i.sprint === k);
    const total = sumSp(its);
    if (!total) return '';
    const s0 = sprintStart(k);
    const W = 280, H = 120, px = 28, py = 14;
    const x = d => px + (d / 7) * (W - px - 8);
    const y = v => py + (1 - v / total) * (H - py - 22);
    const pts = [];
    for (let d = 0; d <= 7; d++) {
      const dayEnd = addDays(s0, d - 1);
      if (d > 0 && diffDays(dayEnd, today()) < 0) break;
      const done = sumSp(its.filter(i => i.status === 'done' && i.doneAt && diffDays(i.doneAt, dayEnd) >= 0));
      pts.push([x(d), y(total - done)]);
    }
    const start = parseD(s0).getDay();
    const lbl = d => { const wd = (start + d - 1 + 7) % 7; return ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][wd]; };
    return `<svg class="burn" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sprint ${k} burndown: ${total} SP dan qolgan ishlar">
      <line class="ax" x1="${px}" y1="${y(0)}" x2="${W - 8}" y2="${y(0)}"/>
      <line class="ax" x1="${px}" y1="${py}" x2="${px}" y2="${y(0)}"/>
      <text x="${px - 6}" y="${py + 4}" class="lb" text-anchor="end">${total}</text>
      <text x="${px - 6}" y="${y(0) + 4}" class="lb" text-anchor="end">0</text>
      ${Array.from({ length: 7 }, (_, i) => `<text x="${x(i + 1)}" y="${H - 4}" class="lb" text-anchor="middle">${lbl(i + 1)}</text>`).join('')}
      <line class="ideal" x1="${x(0)}" y1="${y(total)}" x2="${x(7)}" y2="${y(0)}"/>
      ${pts.length > 1 ? `<polyline class="actual" points="${pts.map(p => p.join(',')).join(' ')}"/>` : ''}
      ${pts.map(p => `<circle class="actual-pt" cx="${p[0]}" cy="${p[1]}" r="2.6"/>`).join('')}
    </svg><p class="burn-legend"><span class="lg ideal"></span>ideal <span class="lg actual"></span>haqiqiy</p>`;
  }

  function openItem(id) {
    const it = byId(id);
    if (!it) return;
    const l = LESSON[it.lesson];
    const p = it.problem && PROB[it.problem];
    const renderCrit = () => it.crit.map((c, k) => `<li><label><input type="checkbox" data-mcrit="${k}" ${c.d ? 'checked' : ''}><span>${MD.inline(c.t)}</span></label>${it.type === 'Custom' || c.own ? `<button type="button" class="icon-btn sm" data-del-crit="${k}" aria-label="Mezonni o'chirish">${ic('x')}</button>` : ''}</li>`).join('');
    openModal(`
      <header class="m-head"><span class="wi-id">${it.id}</span><span class="tbadge t-${it.type}">${TYPES[it.type]}</span><button type="button" class="icon-btn" data-act="modal-close" aria-label="Yopish">${ic('x')}</button></header>
      <div class="m-pad">
        <label class="sr" for="mTitle">Nomi</label>
        <input id="mTitle" class="m-title" value="${esc(it.title)}">
        <div class="seg status-seg" role="group" aria-label="Holat">${STATUSES.map(([v, t]) => `<button type="button" data-st="${v}" aria-pressed="${it.status === v}">${t}</button>`).join('')}</div>
        <div class="m-grid">
          <label class="field"><span>Sprint</span><select id="mSprint">${Array.from({ length: Math.max(SPRINTS, it.sprint) }, (_, i) => `<option value="${i + 1}"${it.sprint === i + 1 ? ' selected' : ''}>Sprint ${i + 1}</option>`).join('')}</select></label>
          <label class="field"><span>Story points</span><select id="mSp">${SP_OPTS.map(v => `<option${+it.sp === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field"><span>Muhimlik</span><select id="mPr">${[1, 2, 3].map(v => `<option value="${v}"${it.pr === v ? ' selected' : ''}>${PRI[v]}</option>`).join('')}</select></label>
          ${it.type === 'Custom' ? `<label class="field"><span>Dars</span><select id="mLesson"><option value="">—</option>${D.lessons.map(x => `<option value="${x.id}"${it.lesson === x.id ? ' selected' : ''}>${x.n}. ${esc(x.title)}</option>`).join('')}</select></label>` : ''}
        </div>
        <h3>Acceptance criteria</h3>
        <ul class="checklist" id="mCrit">${renderCrit()}</ul>
        <form class="row gap add-crit" id="mAdd"><label class="sr" for="mNewCrit">Yangi mezon</label><input id="mNewCrit" class="input" placeholder="Yangi mezon qo'shish"><button class="btn" type="submit">Qo'shish</button></form>
        <h3><label for="mNotes">Izoh</label></h3>
        <textarea id="mNotes" class="notes" rows="3" placeholder="Nima qildingiz, qayerda qotdingiz…">${esc(it.notes || '')}</textarea>
        <div class="m-links">
          ${l ? `<a href="#/dars/${l.id}" data-act="modal-close-go">${ic('book')}${l.n}. ${esc(l.title)}</a>` : ''}
          ${p ? `<a href="#/masala/${p.id}" data-act="modal-close-go">${ic('flag')}${esc(p.title)}</a>` : ''}
          ${it.viz ? `<a href="#/viz/${it.viz}" data-act="modal-close-go">${ic('grid')}${esc(VIZ[it.viz].title)}</a>` : ''}
          ${it.type === 'Quiz' ? `<button type="button" class="linkbtn" data-act="quiz-lesson" data-l="${it.lesson}">${ic('quiz')}Testni boshlash</button>` : ''}
          ${it.type === 'Review' ? `<a href="#/kartalar" data-act="modal-close-go">${ic('cards')}Kartalar</a>` : ''}
        </div>
        <footer class="m-foot"><span class="muted small">Yaratilgan: ${fmtD(it.created)}${it.doneAt ? `. Bajarilgan: ${fmtD(it.doneAt)}` : ''}</span>${it.type === 'Custom' ? `<button type="button" class="btn danger sm" id="mDel">O'chirish</button>` : ''}</footer>
      </div>`, {
      label: it.id, cls: 'item-modal',
      onClose: () => { save(); refresh(); },
      onMount: m => {
        $('#mTitle', m).oninput = e => { it.title = e.target.value; save(); };
        $$('[data-st]', m).forEach(b => b.onclick = () => {
          setStatus(it, b.dataset.st);
          save();
          $$('[data-st]', m).forEach(x => x.setAttribute('aria-pressed', x === b));
        });
        $('#mSprint', m).onchange = e => { it.sprint = +e.target.value; save(); };
        $('#mSp', m).onchange = e => { it.sp = +e.target.value; save(); };
        $('#mPr', m).onchange = e => { it.pr = +e.target.value; save(); };
        if ($('#mLesson', m)) $('#mLesson', m).onchange = e => { it.lesson = e.target.value || null; save(); };
        $('#mNotes', m).oninput = e => { it.notes = e.target.value; save(); };
        const critBox = $('#mCrit', m);
        critBox.onchange = e => {
          const k = e.target.dataset.mcrit;
          if (k == null) return;
          it.crit[k].d = e.target.checked;
          critChanged(it);
          save();
          $$('[data-st]', m).forEach(x => x.setAttribute('aria-pressed', x.dataset.st === it.status));
        };
        critBox.onclick = e => {
          const b = e.target.closest('[data-del-crit]');
          if (!b) return;
          it.crit.splice(+b.dataset.delCrit, 1);
          save();
          critBox.innerHTML = renderCrit();
        };
        $('#mAdd', m).onsubmit = e => {
          e.preventDefault();
          const inp = $('#mNewCrit', m);
          const t = inp.value.trim();
          if (!t) return;
          it.crit.push({ t, d: false, own: true });
          inp.value = '';
          save();
          critBox.innerHTML = renderCrit();
        };
        if ($('#mDel', m)) $('#mDel', m).onclick = () => confirmBox(`${it.id} o'chirilsinmi?`, "O'chirish", () => { S.items = S.items.filter(x => x !== it); save(); refresh(); toast(`${it.id} o'chirildi`); }, true);
      },
    });
  }

  function newItem() {
    const it = { id: 'MY-' + S.seq++, type: 'Custom', lesson: null, title: 'Yangi work item', sp: 2, pr: 2, sprint: BF.sprint === 'cur' || BF.sprint === 'all' ? curSprint() : +BF.sprint, status: 'todo', crit: [], notes: '', created: today(), doneAt: null };
    S.items.push(it);
    save();
    openItem(it.id);
    const t = $('#mTitle');
    if (t) { t.focus(); t.select(); }
  }

  /* ---------- masalalar ---------- */
  const PF = { diff: '', st: '', q: '' };
  function pageProblems() {
    document.title = 'Masalalar — Katak';
    const solved = Object.keys(S.solved).length;
    main.innerHTML = `
      <header class="page-head"><h1>Masalalar</h1><p>${D.problems.length} ta masala, ${solved} tasi yechilgan. Hammasi ilova ichida: shart, misollar, bosqichma-bosqich hintlar va Java yechim. Asl manbasi (AtCoder, CSES, LeetCode) har birida ko'rsatilgan.</p></header>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Qiyinlik">${[['', 'Hammasi'], ['Oson', 'Oson'], ["O'rta", "O'rta"], ['Qiyin', 'Qiyin']].map(([v, t]) => `<button type="button" data-diff="${v}" aria-pressed="${PF.diff === v}">${t}</button>`).join('')}</div>
        <label class="field inline"><span>Holat</span><select id="pSt"><option value="">Hammasi</option><option value="open">Yechilmagan</option><option value="solved">Yechilgan</option></select></label>
        <input type="search" id="pText" class="input" placeholder="Nom, manba yoki teg" value="${esc(PF.q)}" aria-label="Qidirish">
      </div>
      <div id="plist"></div>`;
    $('#pSt').value = PF.st;
    $('#pSt').onchange = e => { PF.st = e.target.value; renderPlist(); };
    $('#pText').oninput = e => { PF.q = e.target.value.trim().toLowerCase(); renderPlist(); };
    $$('[data-diff]').forEach(b => b.onclick = () => { PF.diff = b.dataset.diff; $$('[data-diff]').forEach(x => x.setAttribute('aria-pressed', x === b)); renderPlist(); });
    renderPlist();
  }
  function renderPlist() {
    const list = D.problems.filter(p => {
      if (PF.diff && p.diff !== PF.diff) return false;
      if (PF.st === 'solved' && !S.solved[p.id]) return false;
      if (PF.st === 'open' && S.solved[p.id]) return false;
      if (PF.q && !(`${p.title} ${p.ref} ${p.tags.join(' ')}`.toLowerCase().includes(PF.q))) return false;
      return true;
    });
    $('#plist').innerHTML = list.length ? `<ul class="plist">${list.map(p => {
      const l = LESSON[p.lesson];
      const st = S.solved[p.id] ? 'solved' : S.tried[p.id] ? 'tried' : '';
      return `<li><a class="prow ${st}" href="#/masala/${p.id}">
        <span class="pid">${p.id.toUpperCase()}</span>
        <span class="ptitle"><strong>${esc(p.title)}</strong><small>${esc(p.ref)}, ${l.n}-dars</small></span>
        <span class="ptags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</span>
        <span class="diff d-${diffKey(p.diff)}">${p.diff}</span>
        <span class="pstate" title="${st === 'solved' ? 'Yechilgan' : st === 'tried' ? 'Urinib ko\'rilgan' : 'Yechilmagan'}">${st === 'solved' ? ic('check') : st === 'tried' ? '<i class="half"></i>' : ''}</span>
      </a></li>`;
    }).join('')}</ul>` : '<p class="empty">Filtrga mos masala yo\'q.</p>';
  }

  function pageProblem(id) {
    const p = PROB[id];
    const l = LESSON[p.lesson];
    document.title = `${p.title} — Katak`;
    const shown = S.hints[id] || 0;
    const prev = D.problems[p.n - 2], next = D.problems[p.n];
    const st = S.solved[id] ? 'solved' : S.tried[id] ? 'tried' : 'open';
    main.innerHTML = `
      <article class="problem">
        <p class="crumbs"><a href="#/masalalar">Masalalar</a><span aria-hidden="true">/</span><a href="#/dars/${l.id}">${l.n}. ${esc(l.title)}</a></p>
        <h1><span class="pid">${p.id.toUpperCase()}</span>${esc(p.title)}</h1>
        <p class="pmeta"><span class="diff d-${diffKey(p.diff)}">${p.diff}</span><span>${esc(p.ref)}</span>${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${S.peek[id] ? '<span class="tag warn">yechimga qaralgan</span>' : ''}</p>
        <div class="prose">${MD.render(p.statement).html}</div>
        <h2>Kirish va chiqish</h2>
        <div class="prose">${MD.render(p.io).html}</div>
        <h2>Misollar</h2>
        <div class="examples">${p.examples.map((ex, k) => `<div class="ex"><div class="ex-h">Misol ${k + 1}</div><div class="ex-io"><div>${MD.codeBlock(ex.input, 'input')}</div><div>${MD.codeBlock(ex.output || ' ', 'output')}</div></div></div>`).join('')}</div>
        ${p.check === 'lcs' ? '<p class="muted small">Bir nechta to\'g\'ri javob bo\'lishi mumkin — uzunligi bir xil istalgan umumiy subsequence qabul qilinadi.</p>' : p.check === 'float' ? '<p class="muted small">Javob 10^-9 aniqlikda tekshiriladi, o\'nli belgilar soni muhim emas.</p>' : ''}
        <h2>Hintlar</h2>
        <ol class="hints">${p.hints.slice(0, shown).map(h => `<li>${MD.inline(h)}</li>`).join('')}</ol>
        ${shown < p.hints.length ? `<button type="button" class="btn" data-act="hint" data-p="${id}">${shown ? 'Keyingi hint' : 'Birinchi hint'} (${shown + 1}/${p.hints.length})</button>` : '<p class="muted small">Barcha hintlar ochilgan.</p>'}
        <details class="reveal"${S.peek[id] ? ' open' : ''}><summary>G'oya</summary><div class="prose">${MD.render(p.idea).html}</div></details>
        <h2>Yechim</h2>
        <div id="sol">${S.peek[id] ? solutionHtml(p) : `<p class="muted">Avval o'zingiz yozib ko'ring. Yechim ochilsa, masala kartasida belgi qoladi.</p><button type="button" class="btn" data-act="peek" data-p="${id}">Java yechimni ko'rsatish</button>`}</div>
        <h2><label for="mysol">Mening yechimim</label></h2>
        <textarea id="mysol" class="code-input" data-mysol="${id}" rows="12" spellcheck="false" placeholder="public class Main { … }">${esc(S.mysol[id] || '')}</textarea>
        <div class="pactions">
          <span class="pst">Holat: <strong>${st === 'solved' ? 'yechilgan' : st === 'tried' ? 'urinib ko\'rilgan' : 'boshlanmagan'}</strong></span>
          ${st !== 'solved' ? `<button type="button" class="btn" data-act="tried" data-p="${id}">Urinib ko'rdim</button><button type="button" class="btn primary" data-act="solved" data-p="${id}">${ic('check')}Yechdim</button>` : `<button type="button" class="btn" data-act="unsolve" data-p="${id}">Belgini olib tashlash</button>`}
        </div>
        <nav class="pager">${prev ? `<a href="#/masala/${prev.id}" class="pg prev"><small>Oldingi</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/masala/${next.id}" class="pg next"><small>Keyingi</small>${esc(next.title)}</a>` : ''}</nav>
      </article>`;
  }
  const solutionHtml = p => `${MD.codeBlock(p.java, 'java')}<p><strong>Murakkablik:</strong> ${MD.inline(p.complexity)}</p>`;

  /* ---------- vizualizator ---------- */
  function pageVizList() {
    document.title = 'Vizualizator — Katak';
    main.innerHTML = `
      <header class="page-head"><h1>Vizualizator</h1><p>DP jadvali qadam-baqadam to'ladi: joriy katak, u bog'liq kataklar va tanlangan variant ko'rinadi. Inputni o'zgartirib, o'z misolingizni sinang.</p></header>
      <ul class="viz-grid">${Object.entries(VIZ).map(([k, v]) => {
        const l = LESSON[v.lesson];
        const it = findItem(i => i.type === 'Viz' && i.viz === k);
        return `<li><a href="#/viz/${k}" class="viz-card"><span class="vc-mini" aria-hidden="true">${miniGlyph(k)}</span><strong>${esc(v.title)}</strong><span>${esc(v.blurb)}</span><small>${l.n}-dars${it && it.status === 'done' ? ', bajarilgan' : ''}</small></a></li>`;
      }).join('')}</ul>`;
  }
  function miniGlyph(k) {
    const shapes = { fib: [1, 7], frog: [2, 6], coin: [1, 8], lis: [2, 7], grid: [4, 4], knap: [4, 6], lcs: [5, 5], edit: [5, 5], lps: [5, 5] };
    const [r, c] = shapes[k] || [3, 3];
    let s = '';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const off = k === 'lps' && j < i;
      const f = (i * c + j) % 3 === 0;
      s += `<i class="${off ? 'off' : f ? 'f' : ''}"></i>`;
    }
    return `<span class="glyph" style="--c:${c}">${s}</span>`;
  }

  function pageViz(key) {
    const V = VIZ[key];
    const l = LESSON[V.lesson];
    document.title = `${V.title} — Katak`;
    const vals = Object.fromEntries(V.inputs.map(i => [i.k, i.def]));
    main.innerHTML = `
      <header class="page-head"><p class="crumbs"><a href="#/viz">Vizualizator</a><span aria-hidden="true">/</span><a href="#/dars/${l.id}">${l.n}. ${esc(l.title)}</a></p><h1>${esc(V.title)}</h1><p>${esc(V.blurb)}</p></header>
      <form class="viz-form" id="vizForm">
        ${V.inputs.map(i => `<label class="field"><span>${esc(i.label)}</span>${i.options ? `<select name="${i.k}">${i.options.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>` : i.area ? `<textarea name="${i.k}" rows="4" class="input mono" spellcheck="false">${esc(i.def)}</textarea>` : `<input name="${i.k}" class="input mono" value="${esc(i.def)}" spellcheck="false" autocomplete="off">`}</label>`).join('')}
        <div class="viz-form-act"><button class="btn primary" type="submit">Jadvalni qurish</button><button class="btn" type="button" id="vizDefault">Standart misol</button></div>
      </form>
      <div class="viz-layout">
        <div class="viz-main">
          <div class="viz-host" id="vizHost"></div>
          <div class="viz-controls" role="group" aria-label="Boshqaruv">
            <button type="button" class="icon-btn" data-v="reset" aria-label="Boshiga">${ic('first')}</button>
            <button type="button" class="icon-btn" data-v="prev" aria-label="Oldingi qadam">${ic('prev')}</button>
            <button type="button" class="icon-btn play" data-v="play" aria-label="Ijro">${ic('play')}</button>
            <button type="button" class="icon-btn" data-v="next" aria-label="Keyingi qadam">${ic('next')}</button>
            <button type="button" class="icon-btn" data-v="end" aria-label="Oxiriga">${ic('last')}</button>
            <label class="speed"><span>Tezlik</span><input type="range" min="80" max="1400" step="20" value="${1480 - 520}" id="vizSpeed" aria-label="Tezlik"></label>
          </div>
          <p class="muted small kbd-hint">Klaviatura: ← → qadam, Space — ijro/pauza.</p>
          <div class="viz-code" id="vizCode"></div>
        </div>
        <aside class="viz-side">
          <div class="viz-explain" aria-live="polite"><p class="viz-count" id="vizCount"></p><p class="viz-text" id="vizText"></p></div>
          <ul class="legend"><li><i class="lg-cur"></i>joriy katak</li><li><i class="lg-dep"></i>bog'liq kataklar</li><li><i class="lg-best"></i>tanlangan qiymat</li><li><i class="lg-path"></i>javob yo'li</li></ul>
        </aside>
      </div>`;

    let player = null, isDefault = true;
    const form = $('#vizForm');
    const read = () => Object.fromEntries(V.inputs.map(i => [i.k, form.elements[i.k].value]));
    const build = () => {
      if (player) player.destroy();
      const cur = read();
      isDefault = V.inputs.every(i => String(cur[i.k]).trim() === String(vals[i.k]).trim() || i.options);
      const model = V.build(cur);
      $('#vizCode').innerHTML = MD.codeBlock(model.code || V.code, 'java');
      player = new VizPlayer($('#vizHost'), model, {
        speed: 1480 - +$('#vizSpeed').value,
        onStep: (k, st, done, playing) => {
          $('#vizCount').textContent = done ? `Tayyor: ${model.steps.length} ta qadam` : `Qadam ${k} / ${model.steps.length}`;
          $('#vizText').textContent = done ? model.answer : st ? st.text : 'Ijro tugmasini bosing yoki → bilan qadamlab yuring.';
          const pb = $('[data-v="play"]');
          const isPlaying = playing !== undefined ? playing : player && player.playing;
          pb.innerHTML = ic(isPlaying ? 'pause' : 'play');
          pb.setAttribute('aria-label', isPlaying ? 'Pauza' : 'Ijro');
        },
        onFinish: () => vizFinished(key, isDefault),
      });
    };
    form.onsubmit = e => { e.preventDefault(); build(); };
    $('#vizDefault').onclick = () => { V.inputs.forEach(i => { form.elements[i.k].value = i.def; }); build(); };
    $('.viz-controls').onclick = e => {
      const b = e.target.closest('[data-v]');
      if (!b || !player) return;
      const a = b.dataset.v;
      if (a === 'play') { if (player.playing) player.pause(); else player.play(); }
      else player[a]();
    };
    $('#vizSpeed').oninput = e => player && player.setSpeed(1480 - +e.target.value);
    const onKey = e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || !player || $('#modal-root').classList.contains('open')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); player.pause(); player.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); player.prev(); }
      else if (e.key === ' ') { e.preventDefault(); if (player.playing) player.pause(); else player.play(); }
    };
    document.addEventListener('keydown', onKey);
    onLeave(() => { document.removeEventListener('keydown', onKey); if (player) player.destroy(); });
    build();
  }

  function vizFinished(key, isDefault) {
    const it = findItem(i => i.type === 'Viz' && i.viz === key);
    if (!it) return;
    const before = it.status;
    const k = isDefault ? 0 : 1;
    if (!it.crit[k].d) { it.crit[k].d = true; logAct(1); }
    if (it.crit.every(c => c.d)) setStatus(it, 'done');
    else if (it.crit[0].d && it.crit[1].d) { if (it.status !== 'done') setStatus(it, 'review'); }
    else if (it.status === 'todo') setStatus(it, 'doing');
    save();
    if (before !== it.status) toast(`${it.id}: ${STATUS_LABEL[it.status]}`);
  }

  /* ---------- test ---------- */
  let QZ = null;
  let quizPreset = null;
  function pageQuiz() {
    document.title = 'Test — Katak';
    if (quizPreset) { const l = quizPreset; quizPreset = null; startQuiz(l); return; }
    QZ = null;
    const counts = {};
    X.quiz.forEach(q => { counts[q.l] = (counts[q.l] || 0) + 1; });
    main.innerHTML = `
      <header class="page-head"><h1>Test</h1><p>${X.quiz.length} ta savol. Dars testida 80% va undan yuqori natija tegishli work item'ni Done qiladi. Baho 5 ballik tizimda.</p></header>
      <div class="quiz-start">
        <button type="button" class="btn primary" data-act="quiz-mix">Aralash test: 10 ta tasodifiy savol</button>
        <button type="button" class="btn" data-act="quiz-weak">Zaif darslar bo'yicha</button>
      </div>
      <ul class="quiz-lessons">${D.lessons.map(l => {
        const q = S.quiz[l.id];
        return `<li><button type="button" data-act="quiz-lesson" data-l="${l.id}" class="ql"><span class="rm-n">${l.n}</span><span class="ql-t">${esc(l.title)}<small>${counts[l.id] || 0} ta savol${q ? `, eng yaxshi ${Math.round(q.best * 100)}%` : ''}</small></span>${q ? mark(grade(q.best), true) : '<span class="ql-new">yangi</span>'}</button></li>`;
      }).join('')}</ul>`;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function startQuiz(scope) {
    let list, title;
    if (scope === 'mix') { list = shuffle(X.quiz.slice()).slice(0, 10); title = 'Aralash test'; }
    else if (scope === 'weak') {
      const weak = D.lessons.filter(l => !S.quiz[l.id] || S.quiz[l.id].best < 0.8).map(l => l.id);
      list = shuffle(X.quiz.filter(q => weak.includes(q.l))).slice(0, 10);
      if (!list.length) list = shuffle(X.quiz.slice()).slice(0, 10);
      title = 'Zaif darslar';
    } else { list = shuffle(X.quiz.filter(q => q.l === scope)); title = `${LESSON[scope].n}. ${LESSON[scope].title}`; }
    QZ = { scope, title, list: list.map(q => { const order = shuffle(q.o.map((_, i) => i)); return Object.assign({}, q, { order }); }), i: 0, picks: [] };
    if (location.hash !== '#/test') { quizPreset = null; location.hash = '#/test'; setTimeout(renderQ, 0); }
    else renderQ();
  }

  function renderQ() {
    if (!QZ) return;
    const q = QZ.list[QZ.i];
    const picked = QZ.picks[QZ.i];
    const answered = picked !== undefined;
    main.innerHTML = `
      <section class="quiz">
        <header class="quiz-head"><p class="crumbs"><a href="#/test" data-act="quiz-exit">Test</a><span aria-hidden="true">/</span>${esc(QZ.title)}</p>
          <div class="quiz-prog"><span>${QZ.i + 1} / ${QZ.list.length}</span><div class="bar"><i style="width:${(QZ.i / QZ.list.length * 100).toFixed(1)}%"></i></div></div></header>
        <h1 class="quiz-q">${MD.inline(q.q)}</h1>
        <ol class="opts" type="A">${q.order.map((oi, k) => {
          let cls = '';
          if (answered) { if (oi === q.a) cls = 'right'; else if (oi === picked) cls = 'wrong'; }
          return `<li><button type="button" class="opt ${cls}" data-act="quiz-pick" data-o="${oi}" ${answered ? 'disabled' : ''}><span class="opt-k">${'ABCD'[k]}</span><span>${MD.inline(q.o[oi])}</span></button></li>`;
        }).join('')}</ol>
        ${answered ? `<div class="quiz-exp ${picked === q.a ? 'ok' : 'bad'}"><strong>${picked === q.a ? "To'g'ri." : "Noto'g'ri."}</strong> ${MD.inline(q.e)}</div>
          <button type="button" class="btn primary" data-act="quiz-next" autofocus>${QZ.i + 1 < QZ.list.length ? 'Keyingi savol' : 'Natijani ko\'rish'}</button>` : '<p class="muted small">Klaviatura: 1–4 yoki A–D.</p>'}
        <p class="muted small">Dars: <a href="#/dars/${q.l}">${LESSON[q.l].n}. ${esc(LESSON[q.l].title)}</a></p>
      </section>`;
    const nb = $('[data-act="quiz-next"]');
    if (nb) nb.focus();
  }

  function quizPick(oi) {
    if (!QZ || QZ.picks[QZ.i] !== undefined) return;
    QZ.picks[QZ.i] = oi;
    renderQ();
  }
  function quizNext() {
    if (!QZ) return;
    if (QZ.i + 1 < QZ.list.length) { QZ.i++; renderQ(); return; }
    const right = QZ.list.filter((q, k) => QZ.picks[k] === q.a).length;
    const pct = right / QZ.list.length;
    logAct(2);
    if (LESSON[QZ.scope]) {
      const prev = S.quiz[QZ.scope];
      S.quiz[QZ.scope] = { best: Math.max(pct, prev ? prev.best : 0), last: pct, at: today() };
      if (pct >= 0.8) autoDone(i => i.lesson === QZ.scope && i.type === 'Quiz');
      else {
        const it = findItem(i => i.lesson === QZ.scope && i.type === 'Quiz');
        if (it && it.status === 'todo') setStatus(it, 'doing');
      }
    }
    save();
    const wrong = QZ.list.map((q, k) => ({ q, p: QZ.picks[k] })).filter(x => x.p !== x.q.a);
    const g = grade(pct);
    main.innerHTML = `
      <section class="quiz quiz-done">
        <p class="crumbs"><a href="#/test">Test</a><span aria-hidden="true">/</span>${esc(QZ.title)}</p>
        <div class="result"><span class="mark xl">${g}</span><div><h1>${right} / ${QZ.list.length} to'g'ri</h1><p>${Math.round(pct * 100)}%. ${pct >= 0.8 ? (LESSON[QZ.scope] ? 'Test work item\'i bajarildi.' : 'Yaxshi natija.') : '80% ga yetish uchun xatolarni ko\'rib chiqing va qayta topshiring.'}</p></div></div>
        ${wrong.length ? `<h2>Xatolar tahlili</h2><ol class="wrong-list">${wrong.map(({ q, p }) => `<li><p class="wq">${MD.inline(q.q)}</p><p><span class="bad-t">Sizning javob:</span> ${MD.inline(q.o[p])}</p><p><span class="ok-t">To'g'ri:</span> ${MD.inline(q.o[q.a])}</p><p class="muted">${MD.inline(q.e)}</p></li>`).join('')}</ol>` : '<p>Xato yo\'q.</p>'}
        <div class="row gap wrap"><button type="button" class="btn primary" data-act="quiz-again">Qayta topshirish</button><a class="btn" href="#/test" data-act="quiz-exit">Boshqa test</a>${LESSON[QZ.scope] ? `<a class="btn" href="#/dars/${QZ.scope}">Darsga qaytish</a>` : ''}</div>
      </section>`;
  }

  /* ---------- kartalar ---------- */
  const CF = { l: '', mode: 'due', i: 0, flipped: false, deck: [] };
  const BOX_DAYS = [0, 0, 1, 3, 7, 14];
  const cardDue = c => { const s = S.cards[cardKey(c)]; return !s || s.due <= today(); };
  function pageCards() {
    document.title = 'Kartalar — Katak';
    CF.deck = X.cards.filter(c => (!CF.l || c.l === CF.l) && (CF.mode === 'all' || cardDue(c)));
    CF.i = 0;
    CF.flipped = false;
    const boxes = [0, 0, 0, 0, 0, 0];
    X.cards.forEach(c => { const s = S.cards[cardKey(c)]; boxes[s ? s.box : 0]++; });
    const due = X.cards.filter(cardDue).length;
    main.innerHTML = `
      <header class="page-head"><h1>Kartalar</h1><p>${X.cards.length} ta karta, bugun takrorlash uchun ${due} ta. Leitner tizimi: "Bildim" kartani keyingi qutiga (keyinroq takrorlashga), "Bilmadim" birinchi qutiga qaytaradi.</p></header>
      <div class="toolbar">
        <label class="field inline"><span>Dars</span><select id="cL"><option value="">Hammasi</option>${D.lessons.filter(l => X.cards.some(c => c.l === l.id)).map(l => `<option value="${l.id}">${l.n}. ${esc(l.title)}</option>`).join('')}</select></label>
        <div class="seg" role="group" aria-label="Rejim"><button type="button" data-cmode="due" aria-pressed="${CF.mode === 'due'}">Takrorlash</button><button type="button" data-cmode="all" aria-pressed="${CF.mode === 'all'}">Hammasi</button></div>
      </div>
      <ol class="boxes" aria-label="Qutilar">${[1, 2, 3, 4, 5].map(b => `<li><span>${b}-quti</span><strong>${boxes[b]}</strong></li>`).join('')}<li class="new"><span>Yangi</span><strong>${boxes[0]}</strong></li></ol>
      <div id="flashHost"></div>`;
    $('#cL').value = CF.l;
    $('#cL').onchange = e => { CF.l = e.target.value; pageCards(); };
    $$('[data-cmode]').forEach(b => b.onclick = () => { CF.mode = b.dataset.cmode; pageCards(); });
    renderFlash();
  }
  function renderFlash() {
    const host = $('#flashHost');
    if (!host) return;
    if (CF.i >= CF.deck.length) {
      host.innerHTML = `<div class="flash-empty"><p>${CF.deck.length ? 'Bu to\'plam tugadi.' : 'Hozircha takrorlash uchun karta yo\'q.'}</p>${CF.mode === 'due' ? '<button type="button" class="btn" data-cmode-all>Barcha kartalarni ko\'rish</button>' : ''}</div>`;
      const b = $('[data-cmode-all]', host);
      if (b) b.onclick = () => { CF.mode = 'all'; pageCards(); };
      return;
    }
    const c = CF.deck[CF.i];
    const s = S.cards[cardKey(c)];
    host.innerHTML = `
      <div class="flash-meta"><span>${CF.i + 1} / ${CF.deck.length}</span><a href="#/dars/${c.l}">${LESSON[c.l].n}. ${esc(LESSON[c.l].title)}</a><span>${s ? s.box + '-quti' : 'yangi'}</span></div>
      <button type="button" class="flash${CF.flipped ? ' flipped' : ''}" data-act="flip" aria-label="Kartani aylantirish">
        <span class="flash-face front">${MD.inline(c.f)}</span>
        <span class="flash-face back">${MD.inline(c.b)}</span>
      </button>
      <div class="flash-act">${CF.flipped ? `<button type="button" class="btn" data-act="card-no">Bilmadim</button><button type="button" class="btn primary" data-act="card-yes">Bildim</button>` : '<p class="muted small">Kartani bosing yoki Space — javobni ko\'rish.</p>'}</div>`;
  }
  function cardAnswer(ok) {
    const c = CF.deck[CF.i];
    const k = cardKey(c);
    const s = S.cards[k] || { box: 0 };
    s.box = ok ? Math.min(5, Math.max(1, s.box) + (s.box ? 1 : 1)) : 1;
    if (ok && s.box < 2) s.box = 2;
    s.due = addDays(today(), BOX_DAYS[s.box]);
    S.cards[k] = s;
    logAct(1);
    const lc = X.cards.filter(x => x.l === c.l);
    if (lc.every(x => (S.cards[cardKey(x)] || {}).box >= 2)) autoDone(i => i.lesson === c.l && i.type === 'Review');
    save();
    CF.i++;
    CF.flipped = false;
    renderFlash();
  }

  /* ---------- shablonlar ---------- */
  const PAT = new Set();
  function pageCheats() {
    document.title = 'Shablonlar — Katak';
    const { html, toc } = MD.render(D.cheats, { prefix: 'ch' });
    main.innerHTML = `
      <header class="page-head"><h1>Shablonlar</h1><p>Musobaqada tez topiladigan Java shablonlar va masala matnidan pattern topuvchi.</p></header>
      <section class="pattern panel">
        <div class="panel-head"><h2>Qaysi DP pattern?</h2><button type="button" class="linkbtn" data-act="pat-clear">Tozalash</button></div>
        <p class="muted">Masala matni yoki cheklovlarida uchragan belgilarni tanlang.</p>
        <div class="chips wrap" id="patChips">${X.patterns.map(p => `<button type="button" class="chip" data-pat="${p.id}" aria-pressed="${PAT.has(p.id)}">${esc(p.label)}</button>`).join('')}</div>
        <div id="patOut" aria-live="polite"></div>
      </section>
      <div class="lesson-layout">
        <div class="prose">${html}</div>
        <aside class="lesson-aside"><nav class="toc" aria-label="Mundarija"><h2>Mundarija</h2><ol>${toc.map(t => `<li><a href="#${t.id}" data-act="toc">${MD.inline(t.text)}</a></li>`).join('')}</ol></nav></aside>
      </div>`;
    $('#patChips').onclick = e => {
      const b = e.target.closest('[data-pat]');
      if (!b) return;
      const id = b.dataset.pat;
      if (PAT.has(id)) PAT.delete(id); else PAT.add(id);
      b.setAttribute('aria-pressed', PAT.has(id));
      renderPat();
    };
    renderPat();
  }
  function renderPat() {
    const out = $('#patOut');
    if (!out) return;
    if (!PAT.size) { out.innerHTML = ''; return; }
    const score = {}, why = {};
    X.patterns.filter(p => PAT.has(p.id)).forEach(p => Object.entries(p.w).forEach(([l, w]) => {
      score[l] = (score[l] || 0) + w;
      (why[l] = why[l] || []).push(p.label);
    }));
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const max = ranked[0][1];
    out.innerHTML = `<ol class="pat-res">${ranked.map(([lid, s]) => `<li><a href="#/dars/${lid}"><span class="rm-n">${LESSON[lid].n}</span><span><strong>${esc(LESSON[lid].title)}</strong><small>${why[lid].map(esc).join('; ')}</small></span><span class="bar thin"><i style="width:${(s / max * 100).toFixed(0)}%"></i></span></a></li>`).join('')}</ol>`;
  }

  /* ---------- sozlamalar ---------- */
  function pageSettings() {
    document.title = 'Sozlamalar — Katak';
    const sw = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);
    main.innerHTML = `
      <header class="page-head"><h1>Sozlamalar</h1><p>Barcha ma'lumot faqat shu brauzerda (localStorage) saqlanadi. Boshqa qurilmaga o'tkazish uchun eksport/import qiling.</p></header>
      <div class="settings">
        <section class="panel"><h2>Profil</h2>
          <label class="field"><span>Ism (bosh sahifada ko'rinadi)</span><input class="input" id="sName" value="${esc(S.name)}" autocomplete="given-name"></label>
          <label class="field"><span>1-sprint boshlanish sanasi</span><input class="input" type="date" id="sStart" value="${S.start}"></label>
          <p class="muted small">Hozir Sprint ${curSprint()} (${sprintLabel(curSprint())}). Jami ${SPRINTS} ta sprint, har biri 7 kun.</p>
        </section>
        <section class="panel"><h2>Ko'rinish</h2>
          <div class="seg" role="group" aria-label="Mavzu">${[['auto', 'Avtomatik'], ['light', 'Kunduzgi'], ['dark', 'Tungi']].map(([v, t]) => `<button type="button" data-theme-set="${v}" aria-pressed="${S.theme === v}">${t}</button>`).join('')}</div>
        </section>
        <section class="panel"><h2>Ma'lumotlar</h2>
          <div class="row gap wrap"><button type="button" class="btn" data-act="export">JSON eksport</button><label class="btn file-btn">JSON import<input type="file" accept="application/json,.json" id="sImport" hidden></label><button type="button" class="btn danger" data-act="reset">Progressni o'chirish</button></div>
          <p class="muted small">Eksport faylida work item'lar, masalalar holati, test natijalari, kartalar va konspektlar bor.</p>
        </section>
        <section class="panel"><h2>Offline</h2>
          <p>${sw ? (navigator.serviceWorker.controller ? "Ilova keshlangan — internet bo'lmasa ham ochiladi. Telefonda brauzer menyusidagi \"Bosh ekranga qo'shish\" orqali app sifatida o'rnating." : "Service worker ro'yxatdan o'tmoqda. Sahifani bir marta yangilang — keyin ilova to'liq offline ishlaydi.") : "Fayl sifatida ochilgan (file://). Ilova baribir to'liq ishlaydi, faqat \"o'rnatish\" (PWA) GitHub Pages yoki boshqa https manzilda mavjud."}</p>
          <p class="muted small">Ilova hech qanday tashqi so'rov yubormaydi: shriftlar, kontent va kod — hammasi ichida.</p>
        </section>
      </div>`;
    $('#sName').oninput = e => { S.name = e.target.value.trim(); save(); };
    $('#sStart').onchange = e => { if (e.target.value) { S.start = e.target.value; save(); refresh(); } };
    $$('[data-theme-set]').forEach(b => b.onclick = () => { S.theme = b.dataset.themeSet; save(); applyTheme(); $$('[data-theme-set]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#sImport').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (!data || !Array.isArray(data.items)) throw new Error('format');
          confirmBox('Joriy progress import qilingan fayl bilan almashtirilsinmi?', 'Import qilish', () => {
            S = Object.assign(fresh(), data);
            syncItems();
            save();
            applyTheme();
            refresh();
            toast('Import qilindi');
          });
        } catch (err) { toast("Fayl o'qilmadi: bu Katak eksport fayli emas."); }
      };
      r.readAsText(f);
      e.target.value = '';
    };
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `katak-progress-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Eksport fayli yuklab olindi');
  }

  /* ---------- fokus taymer ---------- */
  const T = { mode: 'focus', left: 25 * 60, running: false, h: null };
  const TDUR = { focus: 25 * 60, break: 5 * 60 };
  function tick() {
    T.left--;
    if (T.left <= 0) {
      if (T.mode === 'focus') {
        const d = today();
        S.focus[d] = (S.focus[d] || 0) + 25;
        logAct(2);
        save();
        beep();
        toast("25 daqiqa fokus tugadi. 5 daqiqa dam oling.");
        T.mode = 'break';
      } else { beep(); toast('Tanaffus tugadi.'); T.mode = 'focus'; }
      T.left = TDUR[T.mode];
      stopTimer();
    }
    renderTimers();
  }
  function startTimer() { if (T.running) return; T.running = true; T.h = setInterval(tick, 1000); renderTimers(); }
  function stopTimer() { T.running = false; clearInterval(T.h); T.h = null; renderTimers(); }
  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      [0, 0.25].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.22);
      });
    } catch (e) { /* ovoz yo'q */ }
  }
  function renderTimers() {
    const mm = pad(Math.floor(T.left / 60)), ss = pad(T.left % 60);
    const pct = 1 - T.left / TDUR[T.mode];
    $$('[data-timer-box]').forEach(el => {
      el.innerHTML = `<div class="timer ${T.mode}${T.running ? ' run' : ''}">
        <div class="timer-face" role="timer" aria-label="${T.mode === 'focus' ? 'Fokus' : 'Tanaffus'}: ${mm}:${ss}"><span class="timer-time">${mm}:${ss}</span><span class="timer-mode">${T.mode === 'focus' ? 'fokus' : 'tanaffus'}</span></div>
        <div class="bar thin"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
        <div class="row gap"><button type="button" class="btn sm${T.running ? '' : ' primary'}" data-act="timer-toggle">${T.running ? ic('pause') + 'Pauza' : ic('play') + 'Boshlash'}</button><button type="button" class="icon-btn sm" data-act="timer-reset" aria-label="Taymerni qaytarish">${ic('reset')}</button></div>
      </div>`;
    });
    const side = $('#sideTimer');
    if (side) side.innerHTML = `<button type="button" class="side-timer${T.running ? ' run' : ''}" data-act="timer-toggle" aria-label="Fokus taymer ${mm}:${ss}, ${T.running ? 'pauza' : 'boshlash'}">${ic('timer')}<span>${mm}:${ss}</span><small>${T.mode === 'focus' ? 'fokus' : 'tanaffus'}</small></button>`;
  }

  /* ---------- qidiruv ---------- */
  const IDX = [];
  D.lessons.forEach(l => IDX.push({ kind: 'Dars', title: `${l.n}. ${l.title}`, sub: l.summary, href: `#/dars/${l.id}`, hay: `${l.title} ${l.summary} ${l.md}`.toLowerCase(), tl: l.title.toLowerCase() }));
  D.problems.forEach(p => IDX.push({ kind: 'Masala', title: p.title, sub: `${p.ref}, ${p.diff}`, href: `#/masala/${p.id}`, hay: `${p.title} ${p.ref} ${p.tags.join(' ')} ${p.statement}`.toLowerCase(), tl: `${p.title} ${p.ref} ${p.id}`.toLowerCase() }));
  Object.entries(VIZ).forEach(([k, v]) => IDX.push({ kind: 'Vizual', title: v.title, sub: v.blurb, href: `#/viz/${k}`, hay: `${v.title} ${v.blurb}`.toLowerCase(), tl: v.title.toLowerCase() }));
  X.cards.forEach(c => IDX.push({ kind: 'Karta', title: c.f, sub: c.b.replace(/`/g, ''), href: '#/kartalar', hay: `${c.f} ${c.b}`.toLowerCase(), tl: c.f.toLowerCase() }));
  let sel = -1, results = [];
  function doSearch(q) {
    q = q.trim().toLowerCase();
    const box = $('#searchResults');
    if (!q) { hideSearch(); return; }
    const words = q.split(/\s+/);
    results = IDX.map(e => {
      if (!words.every(w => e.hay.includes(w) || e.tl.includes(w))) return null;
      let s = 0;
      words.forEach(w => { if (e.tl.includes(w)) s += 5; if (e.tl.startsWith(w)) s += 3; });
      if (e.kind === 'Dars') s += 1;
      return { e, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 8).map(r => r.e);
    sel = results.length ? 0 : -1;
    box.innerHTML = results.length ? results.map((r, i) => `<a href="${r.href}" class="sr-item${i === sel ? ' sel' : ''}" role="option" aria-selected="${i === sel}" data-i="${i}"><span class="sr-kind">${r.kind}</span><span class="sr-t">${esc(r.title)}<small>${esc(r.sub.slice(0, 90))}</small></span></a>`).join('') : `<p class="sr-empty">"${esc(q)}" bo'yicha hech narsa topilmadi.</p>`;
    box.hidden = false;
    $('#search').setAttribute('aria-expanded', 'true');
  }
  function hideSearch() {
    const box = $('#searchResults');
    if (box) { box.hidden = true; box.innerHTML = ''; }
    const s = $('#search');
    if (s) s.setAttribute('aria-expanded', 'false');
    results = [];
    sel = -1;
  }
  function moveSel(d) {
    if (!results.length) return;
    sel = (sel + d + results.length) % results.length;
    $$('.sr-item').forEach((a, i) => { a.classList.toggle('sel', i === sel); a.setAttribute('aria-selected', i === sel); });
  }

  /* ---------- hodisalar ---------- */
  const ACT = {
    'modal-close': () => closeModal(),
    'modal-close-go': (el, e) => { e.preventDefault(); const h = el.getAttribute('href'); closeModal(true); location.hash = h; },
    more: () => openMore(),
    theme: () => {
      const cur = document.documentElement.dataset.theme;
      S.theme = cur === 'dark' ? 'light' : 'dark';
      save();
      applyTheme();
    },
    copy: el => copyText($('code', el.closest('.code')).innerText),
    toc: (el, e) => { e.preventDefault(); const t = document.getElementById(el.getAttribute('href').slice(1)); if (t) { t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } },
    'item-open': el => openItem(el.dataset.id),
    'item-new': () => newItem(),
    'lesson-done': el => {
      const lid = el.dataset.l;
      autoDone(i => i.lesson === lid && i.type === 'Learn');
      save();
      refresh();
    },
    'quiz-lesson': el => { closeModal(true); if (location.hash === '#/test') startQuiz(el.dataset.l); else { quizPreset = el.dataset.l; location.hash = '#/test'; } },
    'quiz-mix': () => startQuiz('mix'),
    'quiz-weak': () => startQuiz('weak'),
    'quiz-pick': el => quizPick(+el.dataset.o),
    'quiz-next': () => quizNext(),
    'quiz-again': () => startQuiz(QZ.scope),
    'quiz-exit': (el, e) => { e.preventDefault(); QZ = null; if (location.hash === '#/test') route(); else location.hash = '#/test'; },
    hint: el => { const id = el.dataset.p; S.hints[id] = (S.hints[id] || 0) + 1; if (!S.tried[id]) S.tried[id] = today(); save(); refresh(); },
    peek: el => { const id = el.dataset.p; S.peek[id] = today(); save(); refresh(); },
    tried: el => { const id = el.dataset.p; S.tried[id] = today(); const it = findItem(i => i.problem === id); if (it && it.status === 'todo') setStatus(it, 'doing'); logAct(1); save(); refresh(); toast("Belgilandi: urinib ko'rildi"); },
    solved: el => { const id = el.dataset.p; S.solved[id] = today(); logAct(2); autoDone(i => i.problem === id && i.type === 'Practice'); save(); refresh(); },
    unsolve: el => { const id = el.dataset.p; delete S.solved[id]; const it = findItem(i => i.problem === id); if (it && it.status === 'done') setStatus(it, 'doing'); save(); refresh(); },
    flip: () => { CF.flipped = !CF.flipped; renderFlash(); const b = $(CF.flipped ? '[data-act="card-yes"]' : '.flash'); if (b) b.focus(); },
    'card-yes': () => { cardAnswer(true); const f = $('.flash') || $('#flashHost button'); if (f) f.focus(); },
    'card-no': () => { cardAnswer(false); const f = $('.flash') || $('#flashHost button'); if (f) f.focus(); },
    'pat-clear': () => { PAT.clear(); pageCheats(); },
    export: () => exportData(),
    reset: () => confirmBox("Barcha progress (work item holatlari, masalalar, testlar, kartalar, konspektlar) o'chiriladi. Avval eksport qilishni tavsiya qilamiz.", "O'chirish", () => {
      const keep = { name: S.name, theme: S.theme };
      S = Object.assign(fresh(), keep);
      syncItems();
      save();
      refresh();
      toast("Progress o'chirildi");
    }, true),
    'timer-toggle': () => (T.running ? stopTimer() : startTimer()),
    'timer-reset': () => { stopTimer(); T.mode = 'focus'; T.left = TDUR.focus; renderTimers(); },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    if (el.closest('.wi') && el.classList.contains('wi') && e.target.closest('a')) return;
    fn(el, e);
  });

  let saveT;
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.notes) {
      const lid = t.dataset.notes;
      S.notes[lid] = t.value;
      clearTimeout(saveT);
      saveT = setTimeout(() => {
        const learn = findItem(i => i.lesson === lid && i.type === 'Learn');
        const c = learn && learn.crit.find(x => x.t === 'Konspekt yozildi');
        if (c && !c.d && t.value.trim().length >= 40) {
          c.d = true;
          critChanged(learn);
          toast('Konspekt mezoni belgilandi');
        }
        save();
      }, 400);
    } else if (t.dataset.mysol) {
      S.mysol[t.dataset.mysol] = t.value;
      clearTimeout(saveT);
      saveT = setTimeout(save, 400);
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.crit) {
      const [iid, k] = t.dataset.crit.split(':');
      const it = byId(iid);
      it.crit[+k].d = t.checked;
      critChanged(it);
      save();
      if (it.status === 'done') refresh();
    } else if (t.dataset.statusOf) {
      const it = byId(t.dataset.statusOf);
      setStatus(it, t.value);
      save();
      renderBoard();
    }
  });

  document.addEventListener('keydown', e => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (e.key === 'Escape') {
      if ($('#modal-root').classList.contains('open')) { closeModal(); return; }
      if (results.length || !$('#searchResults').hidden) { hideSearch(); $('#search').blur(); return; }
    }
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      $('#search').focus();
      $('#search').select();
      return;
    }
    if (typing) return;
    if (QZ && location.hash === '#/test' && !$('#modal-root').classList.contains('open')) {
      const k = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()];
      if (k !== undefined) {
        const btn = $$('.opt')[k];
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    }
    if (location.hash === '#/kartalar' && $('.flash') && !$('#modal-root').classList.contains('open')) {
      if (e.key === ' ' && document.activeElement !== $('.flash')) { e.preventDefault(); ACT.flip(); }
      else if (CF.flipped && (e.key === 'ArrowRight' || e.key === 'j')) ACT['card-yes']();
      else if (CF.flipped && (e.key === 'ArrowLeft' || e.key === 'f')) ACT['card-no']();
    }
  });

  function initSearch() {
    const s = $('#search');
    const mq = window.matchMedia('(max-width: 860px)');
    const ph = () => { s.placeholder = mq.matches ? 'Qidirish…' : 'Dars, masala yoki tushuncha…'; };
    ph();
    mq.addEventListener('change', ph);
    s.addEventListener('input', () => doSearch(s.value));
    s.addEventListener('focus', () => { if (s.value.trim()) doSearch(s.value); });
    s.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); location.hash = results[sel].href; s.value = ''; hideSearch(); s.blur(); }
    });
    $('#searchResults').addEventListener('click', e => { if (e.target.closest('.sr-item')) { s.value = ''; hideSearch(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) hideSearch(); });
  }

  /* ---------- start ---------- */
  buildNav();
  applyTheme();
  initSearch();
  window.addEventListener('hashchange', () => route());
  route();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
