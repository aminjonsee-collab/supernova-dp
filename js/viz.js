(function () {
  'use strict';
  const nums = s => String(s).split(/[\s,;]+/).filter(Boolean).map(Number).filter(x => Number.isFinite(x));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const word = (s, max) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);
  const INF = Infinity;
  const fmt = v => (v === INF ? '∞' : String(v));
  const range = n => Array.from({ length: n }, (_, i) => i);

  const VIZ = {};

  VIZ.fib = {
    title: 'Fibonacci jadvali',
    lesson: 'l01',
    blurb: 'Memo jadvali qanday to\'ladi va sodda rekursiya qancha ortiqcha ish qilardi.',
    inputs: [{ k: 'n', label: 'n (2–20)', def: '10' }],
    code: 'dp[0] = 0;\ndp[1] = 1;\nfor (int i = 2; i <= n; i++)\n    dp[i] = dp[i - 1] + dp[i - 2];',
    build(v) {
      const n = clamp(parseInt(v.n, 10) || 10, 2, 20);
      const dp = [0, 1];
      const steps = [
        { r: 0, c: 0, v: 0, deps: [], text: 'Base case: dp[0] = 0' },
        { r: 0, c: 1, v: 1, deps: [], text: 'Base case: dp[1] = 1' },
      ];
      for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        steps.push({ r: 0, c: i, v: dp[i], deps: [[0, i - 1], [0, i - 2]], text: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}` });
      }
      const f = [0, 1];
      for (let i = 2; i <= n + 1; i++) f[i] = f[i - 1] + f[i - 2];
      const calls = 2 * f[n + 1] - 1;
      return {
        rows: 1, cols: n + 1, rowHead: ['dp'], colHead: range(n + 1).map(String), steps, path: [[0, n]],
        answer: `F(${n}) = ${dp[n]}. Jadval ${n + 1} ta katakni bir martadan to'ldirdi; memo'siz rekursiya ${calls.toLocaleString('en-US')} marta chaqirilardi.`,
      };
    },
  };

  VIZ.frog = {
    title: 'Frog 1 — minimal xarajat',
    lesson: 'l02',
    blurb: 'Pull uslubi: har tosh uchun ikki oldingi toshdan kelish solishtiriladi.',
    inputs: [{ k: 'h', label: 'Balandliklar (2–12 ta)', def: '30 10 60 10 60 50' }],
    code: 'dp[0] = 0;\nfor (int i = 1; i < n; i++) {\n    dp[i] = dp[i - 1] + Math.abs(h[i] - h[i - 1]);\n    if (i >= 2) dp[i] = Math.min(dp[i], dp[i - 2] + Math.abs(h[i] - h[i - 2]));\n}',
    build(v) {
      let h = nums(v.h).slice(0, 12);
      if (h.length < 2) h = [30, 10, 60, 10, 60, 50];
      const n = h.length, dp = [0], from = [-1];
      const steps = [{ r: 1, c: 0, v: 0, deps: [], refs: [[0, 0]], text: 'Base case: qurbaqa 0-toshda, xarajat 0' }];
      for (let i = 1; i < n; i++) {
        const a = dp[i - 1] + Math.abs(h[i] - h[i - 1]);
        let best = a, bf = i - 1;
        let text = `dp[${i}] = dp[${i - 1}] + |${h[i]} - ${h[i - 1]}| = ${a}`;
        const deps = [[1, i - 1]], refs = [[0, i], [0, i - 1]];
        if (i >= 2) {
          const b = dp[i - 2] + Math.abs(h[i] - h[i - 2]);
          deps.push([1, i - 2]);
          refs.push([0, i - 2]);
          text = `dp[${i}] = min(dp[${i - 1}] + |${h[i]} - ${h[i - 1]}|, dp[${i - 2}] + |${h[i]} - ${h[i - 2]}|) = min(${a}, ${b}) = ${Math.min(a, b)}`;
          if (b < a) { best = b; bf = i - 2; }
        }
        dp[i] = best;
        from[i] = bf;
        steps.push({ r: 1, c: i, v: best, deps, refs, best: [1, bf], text });
      }
      const path = [];
      for (let i = n - 1; i >= 0; i = from[i]) path.push([1, i]);
      const route = path.map(p => p[1]).reverse().join(' → ');
      return {
        rows: 2, cols: n, rowHead: ['h', 'dp'], colHead: range(n).map(String),
        pre: h.map((x, i) => [0, i, x]), steps, path,
        answer: `Minimal xarajat ${dp[n - 1]}. Yo'l: ${route}.`,
      };
    },
  };

  VIZ.grid = {
    title: 'Grid Paths — yo\'llar soni',
    lesson: 'l04',
    blurb: 'Har katak yuqori va chap qo\'shnilar yig\'indisi; to\'siqda 0.',
    inputs: [{ k: 'g', label: 'To\'r (. bo\'sh, * to\'siq)', def: '....\n.*..\n...*\n*...', area: true }],
    code: 'if (grid[i][j] == \'*\') dp[i][j] = 0;\nelse if (i == 0 && j == 0) dp[i][j] = 1;\nelse dp[i][j] = up + left;',
    build(v) {
      let rows = String(v.g).split('\n').map(r => r.trim().replace(/[^.*]/g, '')).filter(Boolean).slice(0, 8);
      if (!rows.length) rows = ['....', '.*..', '...*', '*...'];
      const m = Math.min(8, Math.max(...rows.map(r => r.length)));
      rows = rows.map(r => r.padEnd(m, '.').slice(0, m));
      const n = rows.length;
      const dp = range(n).map(() => Array(m).fill(0));
      const steps = [], blocked = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        if (rows[i][j] === '*') {
          blocked.push([i, j]);
          steps.push({ r: i, c: j, v: 0, deps: [], text: `(${i}, ${j}) — to'siq, bu yerdan yo'l yo'q: 0` });
          continue;
        }
        if (i === 0 && j === 0) {
          dp[i][j] = 1;
          steps.push({ r: 0, c: 0, v: 1, deps: [], text: 'Boshlang\'ich katak: 1 ta yo\'l' });
          continue;
        }
        const up = i > 0 ? dp[i - 1][j] : 0, left = j > 0 ? dp[i][j - 1] : 0;
        dp[i][j] = up + left;
        const deps = [];
        if (i > 0) deps.push([i - 1, j]);
        if (j > 0) deps.push([i, j - 1]);
        steps.push({ r: i, c: j, v: dp[i][j], deps, text: `dp[${i}][${j}] = yuqori ${i > 0 ? up : '—'} + chap ${j > 0 ? left : '—'} = ${dp[i][j]}` });
      }
      return {
        rows: n, cols: m, rowHead: range(n).map(String), colHead: range(m).map(String), blocked, steps, path: [[n - 1, m - 1]],
        answer: `O'ng-pastki katakka ${dp[n - 1][m - 1]} ta yo'l bor.`,
      };
    },
  };

  VIZ.knap = {
    title: '0/1 Knapsack jadvali',
    lesson: 'l05',
    blurb: 'Har buyum uchun ikki tanlov: olmaymiz (yuqori katak) yoki olamiz (yuqori-chapdagi katak + qiymat).',
    inputs: [
      { k: 'w', label: 'Og\'irliklar', def: '3 4 5 2' },
      { k: 'v', label: 'Qiymatlar', def: '30 50 60 15' },
      { k: 'W', label: 'Sig\'im W (≤ 15)', def: '9' },
    ],
    code: 'dp[i][c] = dp[i - 1][c];\nif (w[i] <= c)\n    dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i]] + v[i]);',
    build(v) {
      let w = nums(v.w).map(x => clamp(Math.round(x), 1, 15)).slice(0, 6);
      let val = nums(v.v).map(x => Math.round(x)).slice(0, 6);
      const k = Math.min(w.length, val.length);
      if (!k) { w = [3, 4, 5, 2]; val = [30, 50, 60, 15]; }
      else { w = w.slice(0, k); val = val.slice(0, k); }
      const n = w.length;
      const W = clamp(parseInt(v.W, 10) || 9, 1, 15);
      const dp = range(n + 1).map(() => Array(W + 1).fill(0));
      const steps = [];
      for (let i = 1; i <= n; i++) for (let c = 0; c <= W; c++) {
        const skip = dp[i - 1][c];
        if (w[i - 1] > c) {
          dp[i][c] = skip;
          steps.push({ r: i, c, v: skip, deps: [[i - 1, c]], best: [i - 1, c], text: `#${i} (w=${w[i - 1]}) c=${c} ga sig'maydi → dp[${i - 1}][${c}] = ${skip}` });
        } else {
          const take = dp[i - 1][c - w[i - 1]] + val[i - 1];
          dp[i][c] = Math.max(skip, take);
          steps.push({
            r: i, c, v: dp[i][c], deps: [[i - 1, c], [i - 1, c - w[i - 1]]], best: take > skip ? [i - 1, c - w[i - 1]] : [i - 1, c],
            text: `olmaymiz: ${skip}; olamiz: dp[${i - 1}][${c - w[i - 1]}] + ${val[i - 1]} = ${take} → ${dp[i][c]}`,
          });
        }
      }
      const path = [], chosen = [];
      let c = W;
      for (let i = n; i >= 1; i--) {
        path.push([i, c]);
        if (dp[i][c] !== dp[i - 1][c]) { chosen.push(i); c -= w[i - 1]; }
      }
      path.push([0, c]);
      chosen.reverse();
      return {
        rows: n + 1, cols: W + 1,
        rowHead: ['∅', ...w.map((x, i) => `#${i + 1} w${x} v${val[i]}`)],
        colHead: range(W + 1).map(String),
        pre: range(W + 1).map(j => [0, j, 0]), steps, path,
        answer: `Maksimal qiymat ${dp[n][W]}. Tanlangan buyumlar: ${chosen.length ? chosen.map(i => '#' + i).join(', ') : 'hech biri'}.`,
      };
    },
  };

  VIZ.coin = {
    title: 'Coin Change',
    lesson: 'l06',
    blurb: 'Minimal tangalar soni yoki kombinatsiyalar soni — ikkinchisida tangalar qatorma-qator "ochiladi".',
    inputs: [
      { k: 'coins', label: 'Tangalar', def: '1 3 4' },
      { k: 'x', label: 'Summa (≤ 25)', def: '10' },
      { k: 'mode', label: 'Rejim', def: 'min', options: [['min', 'Minimal tangalar'], ['ways', 'Kombinatsiyalar soni']] },
    ],
    code: 'for (int s = 1; s <= x; s++)\n    for (int c : coins)\n        if (c <= s) dp[s] = Math.min(dp[s], dp[s - c] + 1);',
    codeWays: 'for (int c : coins)\n    for (int s = c; s <= x; s++)\n        dp[s] += dp[s - c];',
    build(v) {
      let coins = [...new Set(nums(v.coins).map(x => Math.round(x)).filter(x => x >= 1 && x <= 25))].sort((a, b) => a - b).slice(0, 5);
      if (!coins.length) coins = [1, 3, 4];
      const x = clamp(parseInt(v.x, 10) || 10, 1, 25);
      if (v.mode === 'ways') {
        const k = coins.length;
        const dp = range(k + 1).map(() => Array(x + 1).fill(0));
        dp[0][0] = 1;
        const steps = [];
        for (let i = 1; i <= k; i++) for (let s = 0; s <= x; s++) {
          const c = coins[i - 1];
          const without = dp[i - 1][s], withc = s >= c ? dp[i][s - c] : 0;
          dp[i][s] = without + withc;
          const deps = [[i - 1, s]];
          if (s >= c) deps.push([i, s - c]);
          steps.push({ r: i, c: s, v: dp[i][s], deps, text: s >= c ? `${c} tangasiz: ${without}; ${c} bilan: dp[${s - c}] = ${withc} → ${dp[i][s]}` : `${c} > ${s}, faqat tangasiz: ${without}` });
        }
        return {
          rows: k + 1, cols: x + 1, rowHead: ['—', ...coins.map(c => '+' + c)], colHead: range(x + 1).map(String),
          pre: range(x + 1).map(s => [0, s, s === 0 ? 1 : 0]), steps, path: [[k, x]], code: VIZ.coin.codeWays,
          answer: `${x} ni {${coins.join(', ')}} tangalari bilan ${dp[k][x]} xil usulda (tartibsiz) yig'ish mumkin.`,
        };
      }
      const dp = Array(x + 1).fill(INF), pick = Array(x + 1).fill(-1);
      dp[0] = 0;
      const steps = [{ r: 0, c: 0, v: 0, deps: [], text: 'Base case: 0 summa uchun 0 ta tanga' }];
      for (let s = 1; s <= x; s++) {
        const deps = [], parts = [];
        for (const c of coins) if (c <= s) {
          deps.push([0, s - c]);
          parts.push(`dp[${s - c}]+1=${fmt(dp[s - c] + 1)}`);
          if (dp[s - c] + 1 < dp[s]) { dp[s] = dp[s - c] + 1; pick[s] = c; }
        }
        steps.push({ r: 0, c: s, v: fmt(dp[s]), deps, best: pick[s] > 0 ? [0, s - pick[s]] : null, text: deps.length ? `dp[${s}] = min(${parts.join(', ')}) = ${fmt(dp[s])}` : `${s} ni hech bir tanga bilan yig'ib bo'lmaydi: ∞` });
      }
      const path = [], used = [];
      if (dp[x] !== INF) for (let s = x; s > 0; s -= pick[s]) { path.push([0, s]); used.push(pick[s]); }
      path.push([0, 0]);
      return {
        rows: 1, cols: x + 1, rowHead: ['dp'], colHead: range(x + 1).map(String), steps, path,
        answer: dp[x] === INF ? `${x} ni yig'ib bo'lmaydi.` : `Minimal ${dp[x]} ta tanga: ${used.join(' + ')} = ${x}.`,
      };
    },
  };

  VIZ.lis = {
    title: 'LIS — O(n²) DP',
    lesson: 'l07',
    blurb: 'dp[i] — i bilan tugaydigan eng uzun o\'suvchi subsequence; chapdagi kichikroq elementlar ko\'rib chiqiladi.',
    inputs: [{ k: 'a', label: 'Massiv (≤ 12 ta)', def: '7 3 5 3 6 2 9 8' }],
    code: 'dp[i] = 1;\nfor (int j = 0; j < i; j++)\n    if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);',
    build(v) {
      let a = nums(v.a).map(x => Math.round(x)).slice(0, 12);
      if (!a.length) a = [7, 3, 5, 3, 6, 2, 9, 8];
      const n = a.length, dp = [], par = [];
      const steps = [];
      for (let i = 0; i < n; i++) {
        dp[i] = 1; par[i] = -1;
        const deps = [], refs = [[0, i]];
        for (let j = 0; j < i; j++) if (a[j] < a[i]) {
          deps.push([1, j]);
          refs.push([0, j]);
          if (dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; par[i] = j; }
        }
        const text = deps.length
          ? `a[${i}] = ${a[i]} dan kichik chapdagilar: ${deps.map(d => `a[${d[1]}]=${a[d[1]]}`).join(', ')}. dp[${i}] = ${dp[i] - 1} + 1 = ${dp[i]}`
          : `a[${i}] = ${a[i]} dan kichik element chapda yo'q → dp[${i}] = 1`;
        steps.push({ r: 1, c: i, v: dp[i], deps, refs, best: par[i] >= 0 ? [1, par[i]] : null, text });
      }
      let end = 0;
      for (let i = 1; i < n; i++) if (dp[i] > dp[end]) end = i;
      const idx = [];
      for (let i = end; i !== -1; i = par[i]) idx.push(i);
      idx.reverse();
      return {
        rows: 2, cols: n, rowHead: ['a', 'dp'], colHead: range(n).map(String), pre: a.map((x, i) => [0, i, x]), steps,
        path: idx.flatMap(i => [[0, i], [1, i]]),
        answer: `LIS uzunligi ${dp[end]}: ${idx.map(i => a[i]).join(', ')}.`,
      };
    },
  };

  VIZ.lcs = {
    title: 'LCS jadvali',
    lesson: 'l08',
    blurb: 'Teng belgilar — diagonal + 1; aks holda yuqori yoki chapdagi kattasi. Oxirida traceback.',
    inputs: [{ k: 's', label: 's (≤ 10)', def: 'DASTUR' }, { k: 't', label: 't (≤ 10)', def: 'DARSLIK' }],
    code: 'if (s.charAt(i - 1) == t.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;\nelse dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);',
    build(v) {
      const s = word(v.s, 10) || 'DASTUR', t = word(v.t, 10) || 'DARSLIK';
      const n = s.length, m = t.length;
      const dp = range(n + 1).map(() => Array(m + 1).fill(0));
      const steps = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
        if (s[i - 1] === t[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          steps.push({ r: i, c: j, v: dp[i][j], deps: [[i - 1, j - 1]], best: [i - 1, j - 1], match: true, text: `'${s[i - 1]}' = '${t[j - 1]}' → diagonal + 1 = ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}` });
        } else {
          const up = dp[i - 1][j], left = dp[i][j - 1];
          dp[i][j] = Math.max(up, left);
          steps.push({ r: i, c: j, v: dp[i][j], deps: [[i - 1, j], [i, j - 1]], best: up >= left ? [i - 1, j] : [i, j - 1], text: `'${s[i - 1]}' ≠ '${t[j - 1]}' → max(yuqori ${up}, chap ${left}) = ${dp[i][j]}` });
        }
      }
      const path = [], match = [];
      let i = n, j = m, res = '';
      while (i > 0 && j > 0) {
        path.push([i, j]);
        if (s[i - 1] === t[j - 1]) { res = s[i - 1] + res; match.push([i, j]); i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
      }
      path.push([i, j]);
      const pre = [];
      for (let c = 0; c <= m; c++) pre.push([0, c, 0]);
      for (let r = 1; r <= n; r++) pre.push([r, 0, 0]);
      return {
        rows: n + 1, cols: m + 1, rowHead: ['∅', ...s], colHead: ['∅', ...t], pre, steps, path, match,
        answer: `LCS("${s}", "${t}") = ${dp[n][m]}: "${res}".`,
      };
    },
  };

  VIZ.edit = {
    title: 'Edit Distance',
    lesson: 'l08',
    blurb: 'Uch amal: almashtirish (diagonal), o\'chirish (yuqori), qo\'shish (chap).',
    inputs: [{ k: 's', label: 's (≤ 10)', def: 'LOVE' }, { k: 't', label: 't (≤ 10)', def: 'MOVIE' }],
    code: 'if (s.charAt(i - 1) == t.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\nelse dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],\n        Math.min(dp[i - 1][j], dp[i][j - 1]));',
    build(v) {
      const s = word(v.s, 10) || 'LOVE', t = word(v.t, 10) || 'MOVIE';
      const n = s.length, m = t.length;
      const dp = range(n + 1).map((_, i) => range(m + 1).map(j => (i === 0 ? j : j === 0 ? i : 0)));
      const steps = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
        if (s[i - 1] === t[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
          steps.push({ r: i, c: j, v: dp[i][j], deps: [[i - 1, j - 1]], best: [i - 1, j - 1], match: true, text: `'${s[i - 1]}' = '${t[j - 1]}' → amal kerak emas, diagonal: ${dp[i][j]}` });
        } else {
          const d = dp[i - 1][j - 1], u = dp[i - 1][j], l = dp[i][j - 1];
          dp[i][j] = 1 + Math.min(d, u, l);
          const mn = Math.min(d, u, l);
          const best = d === mn ? [i - 1, j - 1] : u === mn ? [i - 1, j] : [i, j - 1];
          steps.push({ r: i, c: j, v: dp[i][j], deps: [[i - 1, j - 1], [i - 1, j], [i, j - 1]], best, text: `1 + min(almashtirish ${d}, o'chirish ${u}, qo'shish ${l}) = ${dp[i][j]}` });
        }
      }
      const path = [], ops = [];
      let i = n, j = m;
      while (i > 0 || j > 0) {
        path.push([i, j]);
        if (i > 0 && j > 0 && s[i - 1] === t[j - 1]) { i--; j--; continue; }
        const d = i > 0 && j > 0 ? dp[i - 1][j - 1] : INF, u = i > 0 ? dp[i - 1][j] : INF, l = j > 0 ? dp[i][j - 1] : INF;
        const mn = Math.min(d, u, l);
        if (d === mn) { ops.push(`${s[i - 1]}→${t[j - 1]} almashtirish`); i--; j--; }
        else if (u === mn) { ops.push(`${s[i - 1]} ni o'chirish`); i--; }
        else { ops.push(`${t[j - 1]} ni qo'shish`); j--; }
      }
      path.push([0, 0]);
      const pre = [];
      for (let c = 0; c <= m; c++) pre.push([0, c, c]);
      for (let r = 1; r <= n; r++) pre.push([r, 0, r]);
      return {
        rows: n + 1, cols: m + 1, rowHead: ['∅', ...s], colHead: ['∅', ...t], pre, steps, path,
        answer: `"${s}" → "${t}": ${dp[n][m]} ta amal${ops.length ? ' (' + ops.reverse().join(', ') + ')' : ''}.`,
      };
    },
  };

  VIZ.lps = {
    title: 'Interval DP: eng uzun palindrom subsequence',
    lesson: 'l09',
    blurb: 'Jadval diagonal bo\'ylab — oraliq uzunligi o\'sishi tartibida to\'ladi.',
    inputs: [{ k: 's', label: 's (≤ 10)', def: 'BBABCBCAB' }],
    code: 'if (s.charAt(l) == s.charAt(r)) dp[l][r] = dp[l + 1][r - 1] + 2;\nelse dp[l][r] = Math.max(dp[l + 1][r], dp[l][r - 1]);',
    build(v) {
      const s = word(v.s, 10) || 'BBABCBCAB';
      const n = s.length;
      const dp = range(n).map(() => Array(n).fill(0));
      const steps = [], disabled = [];
      for (let l = 0; l < n; l++) for (let r = 0; r < l; r++) disabled.push([l, r]);
      for (let len = 1; len <= n; len++) for (let l = 0; l + len - 1 < n; l++) {
        const r = l + len - 1;
        if (len === 1) {
          dp[l][r] = 1;
          steps.push({ r: l, c: r, v: 1, deps: [], text: `len=1: '${s[l]}' — o'zi palindrom, 1` });
        } else if (s[l] === s[r]) {
          const inner = len === 2 ? 0 : dp[l + 1][r - 1];
          dp[l][r] = inner + 2;
          steps.push({ r: l, c: r, v: dp[l][r], deps: len > 2 ? [[l + 1, r - 1]] : [], best: len > 2 ? [l + 1, r - 1] : null, match: true, text: `len=${len}: chetlar '${s[l]}' = '${s[r]}' → ichki ${inner} + 2 = ${dp[l][r]}` });
        } else {
          const a = dp[l + 1][r], b = dp[l][r - 1];
          dp[l][r] = Math.max(a, b);
          steps.push({ r: l, c: r, v: dp[l][r], deps: [[l + 1, r], [l, r - 1]], best: a >= b ? [l + 1, r] : [l, r - 1], text: `len=${len}: '${s[l]}' ≠ '${s[r]}' → max(${a}, ${b}) = ${dp[l][r]}` });
        }
      }
      let l = 0, r = n - 1, left = '', right = '';
      const path = [];
      while (l <= r) {
        path.push([l, r]);
        if (l === r) { left += s[l]; break; }
        if (s[l] === s[r]) { left += s[l]; right = s[r] + right; l++; r--; }
        else if (dp[l + 1][r] >= dp[l][r - 1]) l++;
        else r--;
      }
      return {
        rows: n, cols: n, rowHead: s.split('').map((ch, i) => `${i} ${ch}`), colHead: s.split('').map((ch, i) => `${i} ${ch}`),
        disabled, steps, path, answer: `Eng uzun palindrom subsequence: ${dp[0][n - 1]} ("${left + right}").`,
      };
    },
  };

  class Player {
    constructor(host, model, opts) {
      this.host = host;
      this.m = model;
      this.o = Object.assign({ speed: 450, mini: false, onFinish: null, onStep: null }, opts || {});
      this.k = 0;
      this.timer = null;
      this.finished = false;
      this.build();
      this.go(0);
    }

    build() {
      const m = this.m;
      const t = document.createElement('table');
      t.className = 'viz-table' + (this.o.mini ? ' mini' : '');
      const thead = `<thead><tr><th class="corner"></th>${m.colHead.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead>`;
      let body = '<tbody>';
      for (let r = 0; r < m.rows; r++) {
        body += `<tr><th scope="row">${m.rowHead ? m.rowHead[r] : r}</th>`;
        for (let c = 0; c < m.cols; c++) body += `<td data-r="${r}" data-c="${c}"><span></span></td>`;
        body += '</tr>';
      }
      t.innerHTML = thead + body + '</tbody>';
      this.host.innerHTML = '';
      this.host.appendChild(t);
      this.cells = [];
      t.querySelectorAll('td').forEach(td => {
        const r = +td.dataset.r, c = +td.dataset.c;
        (this.cells[r] = this.cells[r] || [])[c] = td;
      });
      (m.blocked || []).forEach(([r, c]) => this.cells[r][c].classList.add('blocked'));
      (m.disabled || []).forEach(([r, c]) => this.cells[r][c].classList.add('off'));
      (m.pre || []).forEach(([r, c, v]) => {
        const td = this.cells[r][c];
        td.classList.add('pre');
        td.firstChild.textContent = v;
      });
    }

    cell(p) { return p && this.cells[p[0]] && this.cells[p[0]][p[1]]; }

    go(k) {
      k = clamp(k, 0, this.m.steps.length);
      this.k = k;
      const cls = ['cur', 'dep', 'best', 'ref', 'path', 'filled', 'match', 'just'];
      this.cells.flat().forEach(td => {
        td.classList.remove(...cls);
        if (!td.classList.contains('pre')) td.firstChild.textContent = '';
      });
      for (let i = 0; i < k; i++) {
        const st = this.m.steps[i];
        const td = this.cells[st.r][st.c];
        td.firstChild.textContent = st.v;
        td.classList.add('filled');
      }
      const done = k === this.m.steps.length;
      if (k > 0 && !done) {
        const st = this.m.steps[k - 1];
        this.cell([st.r, st.c]).classList.add('cur', 'just');
        (st.deps || []).forEach(d => this.cell(d) && this.cell(d).classList.add('dep'));
        (st.refs || []).forEach(d => this.cell(d) && this.cell(d).classList.add('ref'));
        if (st.best && this.cell(st.best)) this.cell(st.best).classList.add('best');
      }
      if (done) {
        (this.m.path || []).forEach(p => this.cell(p) && this.cell(p).classList.add('path'));
        (this.m.match || []).forEach(p => this.cell(p) && this.cell(p).classList.add('match'));
        if (!this.finished) {
          this.finished = true;
          if (this.o.onFinish) this.o.onFinish();
        }
        this.pause();
      }
      if (this.o.onStep) this.o.onStep(k, k > 0 && !done ? this.m.steps[k - 1] : null, done);
    }

    next() { this.go(this.k + 1); }
    prev() { this.pause(); this.go(this.k - 1); }
    end() { this.pause(); this.go(this.m.steps.length); }
    reset() { this.pause(); this.go(0); }
    get playing() { return !!this.timer; }

    play() {
      if (this.timer) return;
      if (this.k >= this.m.steps.length) this.go(0);
      this.timer = setInterval(() => this.next(), this.o.speed);
      if (this.o.onStep) this.o.onStep(this.k, null, false, true);
    }

    pause() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = null;
      if (this.o.onStep) this.o.onStep(this.k, this.k > 0 && this.k < this.m.steps.length ? this.m.steps[this.k - 1] : null, this.k === this.m.steps.length, false);
    }

    setSpeed(ms) {
      this.o.speed = ms;
      if (this.timer) { clearInterval(this.timer); this.timer = setInterval(() => this.next(), ms); }
    }

    destroy() { this.pause(); }
  }

  window.VIZ = VIZ;
  window.VizPlayer = Player;
})();
