#!/usr/bin/env node
// src/*.md -> js/data/content.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const IO_BLOCK = [
  '    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));',
  '    static StringTokenizer st;',
  '',
  '    static String next() throws IOException {',
  '        while (st == null || !st.hasMoreTokens()) {',
  '            String line = br.readLine();',
  '            if (line == null) return null;',
  '            st = new StringTokenizer(line);',
  '        }',
  '        return st.nextToken();',
  '    }',
  '',
  '    static int ni() throws IOException { return Integer.parseInt(next()); }',
  '    static long nl() throws IOException { return Long.parseLong(next()); }',
].join('\n');

const MODULES = [
  { id: 'm0', title: 'Asoslar', desc: 'Memoization, tabulation va DP retsepti' },
  { id: 'm1', title: '1D DP', desc: 'Chiziqli holatlar: prefiks va "i bilan tugaydigan"' },
  { id: 'm2', title: 'Grid DP', desc: 'To\'rdagi yo\'llar va 2D state' },
  { id: 'm3', title: 'Knapsack oilasi', desc: '0/1, unbounded, bounded, coin change' },
  { id: 'm4', title: 'Subsequence DP', desc: 'LIS, LCS, Edit Distance' },
  { id: 'm5', title: 'Satr DP', desc: 'Palindromlar va Word Break' },
  { id: 'm6', title: 'Interval DP', desc: 'dp[l][r], birlashtirish va o\'yinlar' },
  { id: 'm7', title: 'State machine', desc: 'Rejimli holatlar, aksiyalar' },
  { id: 'm8', title: 'Bitmask DP', desc: 'n ≤ 20, TSP, matching, SOS' },
  { id: 'm9', title: 'Digit DP', desc: 'Katta oraliqlarda sanash' },
  { id: 'm10', title: 'Tree DP', desc: 'Subtree DP, rerooting' },
  { id: 'm11', title: 'DAG DP', desc: 'Topologik tartib, Floyd, Bellman–Ford' },
  { id: 'm12', title: 'Sanash va ehtimollik', desc: 'MOD, kombinatorika, kutilma' },
  { id: 'm13', title: 'Optimizatsiyalar', desc: 'Prefix sum, deque, CHT' },
  { id: 'm14', title: 'Musobaqa', desc: 'Strategiya, debug, stress test' },
];

function splitItems(text) {
  return text.split(/^=====\s*$/m).map(s => s.trim()).filter(Boolean);
}

function parseFront(item, file) {
  const m = item.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Frontmatter topilmadi: ' + file + '\n' + item.slice(0, 80));
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].trim() };
}

const list = v => (v ? v.split('|').map(s => s.trim()).filter(Boolean) : []);

function readDir(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()
    .flatMap(f => splitItems(fs.readFileSync(path.join(dir, f), 'utf8')).map(it => parseFront(it, f)));
}

function sections(body) {
  const out = {};
  const parts = body.split(/^## (.+)$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i].trim()] = parts[i + 1].trim();
  return out;
}

function fences(text) {
  const re = /```(\w*)\n([\s\S]*?)```/g;
  const res = [];
  let m;
  while ((m = re.exec(text))) res.push({ lang: m[1], code: m[2].replace(/\n$/, '') });
  return res;
}

const lessons = readDir(path.join(SRC, 'lessons')).map(({ meta, body }) => ({
  id: meta.id,
  module: meta.module,
  week: +meta.week,
  title: meta.title,
  mins: +meta.mins,
  viz: list(meta.viz),
  problems: list(meta.problems),
  goals: list(meta.goals),
  summary: meta.summary || '',
  md: body,
}));

const problems = readDir(path.join(SRC, 'problems')).map(({ meta, body }) => {
  const s = sections(body);
  const need = ['Shart', 'Kirish va chiqish', 'Misollar', 'Hintlar', "G'oya", 'Yechim', 'Murakkablik'];
  for (const k of need) if (!(k in s)) throw new Error(`${meta.id}: "${k}" bo'limi yo'q`);
  const ex = fences(s['Misollar']);
  const examples = [];
  for (let i = 0; i < ex.length; i += 2) {
    if (ex[i].lang !== 'input' || !ex[i + 1] || ex[i + 1].lang !== 'output') throw new Error(meta.id + ': misol formati');
    examples.push({ input: ex[i].code, output: ex[i + 1].code });
  }
  const code = fences(s['Yechim']).find(f => f.lang === 'java');
  if (!code) throw new Error(meta.id + ': java yechim yo\'q');
  const java = code.code.replace(/^[ \t]*@IO[ \t]*$/m, IO_BLOCK);
  const hints = s['Hintlar'].split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
  return {
    id: meta.id,
    lesson: meta.lesson,
    title: meta.title,
    diff: meta.diff,
    ref: meta.ref,
    tags: (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    check: meta.check || 'exact',
    statement: s['Shart'],
    io: s['Kirish va chiqish'],
    examples,
    hints,
    idea: s["G'oya"],
    java,
    complexity: s['Murakkablik'],
  };
});

const ids = new Set(problems.map(p => p.id));
for (const l of lessons) for (const p of l.problems) if (!ids.has(p)) throw new Error(`${l.id}: ${p} topilmadi`);
for (const p of problems) if (!lessons.find(l => l.id === p.lesson)) throw new Error(`${p.id}: dars ${p.lesson} yo'q`);

const cheats = fs.readFileSync(path.join(SRC, 'cheats.md'), 'utf8');

const data = { version: 1, modules: MODULES, lessons, problems, cheats };
const out = '/* generated by tools/build.js — edit src/ instead */\nwindow.DPDATA = ' + JSON.stringify(data) + ';\n';
fs.writeFileSync(path.join(ROOT, 'js', 'data', 'content.js'), out);

if (process.argv.includes('--dump-java')) {
  const dir = path.join(ROOT, 'tools', '.java');
  fs.rmSync(dir, { recursive: true, force: true });
  for (const p of problems) {
    const d = path.join(dir, p.id);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'Main.java'), p.java);
    fs.writeFileSync(path.join(d, 'meta.json'), JSON.stringify({ check: p.check, examples: p.examples }));
  }
}
// sw.js keshi versiyasini fayllar mazmunidan hisoblash
const crypto = require('crypto');
const swPath = path.join(ROOT, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
const assets = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map(m => m[1]).filter(a => a !== './');
const h = crypto.createHash('sha1');
for (const a of assets) h.update(fs.readFileSync(path.join(ROOT, a)));
const ver = 'katak-' + h.digest('hex').slice(0, 10);
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${ver}';`);
fs.writeFileSync(swPath, sw);

console.log(`OK: ${lessons.length} dars, ${problems.length} masala, ${(out.length / 1024).toFixed(0)} KB, ${ver}`);
