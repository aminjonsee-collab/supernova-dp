---
id: l13
module: m9
week: 11
title: Digit DP
mins: 60
viz:
problems: p26
goals: [0, N] oraliqni raqamlar bo'yicha sanash | tight flag ma'nosini tushunish | f(R) - f(L-1) hiylasini qo'llash
summary: Juda katta sonlar oralig'ida sanash: pos, tight, sum va started holatlari.
---

## Qachon?

"[L, R] oraliqda xususiyati … bo'lgan sonlar nechta?" va **R juda katta** (10^18, hatto 10^10000). Sonlarni birma-bir tekshirib bo'lmaydi — raqamlar bo'yicha yuramiz.

## Asosiy hiyla

`count(L, R) = f(R) - f(L - 1)`, bunda `f(N)` — [0, N] dagi mos sonlar soni. Endi faqat `f(N)` kerak.

## State

N ni raqamlar satri deb olamiz va chapdan o'ngga raqam qo'yamiz:

- `pos` — qaysi pozitsiyadamiz
- `tight` — hozirgacha qo'yilgan raqamlar N ning prefiksiga tengmi? Agar ha, keyingi raqam N dagi raqamdan oshmasligi kerak; aks holda 0..9 erkin.
- xususiyatga oid qo'shimcha: raqamlar yig'indisi `% D`, oxirgi raqam, son boshlanganmi (`started`) …

```java
static String num;
static int D;
static long[][] memo;

static long go(int pos, int sum, boolean tight) {
    if (pos == num.length()) return sum == 0 ? 1 : 0;
    if (!tight && memo[pos][sum] != -1) return memo[pos][sum];
    int lim = tight ? num.charAt(pos) - '0' : 9;
    long res = 0;
    for (int dgt = 0; dgt <= lim; dgt++) {
        res += go(pos + 1, (sum + dgt) % D, tight && dgt == lim);
    }
    res %= MOD;
    if (!tight) memo[pos][sum] = res;
    return res;
}
```

> [!TIP] Memo'ni faqat `tight == false` holatlar uchun saqlash yetarli: tight holat har pozitsiyada faqat bitta bo'ladi.

Bu kod 0 ni ham sanaydi (uning yig'indisi 0). Masalada [1, K] so'ralsa — natijadan 1 ayiring.

## Iterativ variant

N uzunligi 10^4 bo'lsa rekursiya chuqurligi ham 10^4 — Java'da xavfli. Iterativ shakl:

```java
long[] dp = new long[D];
int tightSum = 0;
for (int pos = 0; pos < len; pos++) {
    long[] nd = new long[D];
    for (int s = 0; s < D; s++) {
        if (dp[s] == 0) continue;
        for (int dgt = 0; dgt <= 9; dgt++) {
            int ns = (s + dgt) % D;
            nd[ns] = (nd[ns] + dp[s]) % MOD;
        }
    }
    int cur = num.charAt(pos) - '0';
    for (int dgt = 0; dgt < cur; dgt++) {
        int ns = (tightSum + dgt) % D;
        nd[ns] = (nd[ns] + 1) % MOD;
    }
    tightSum = (tightSum + cur) % D;
    dp = nd;
}
long ans = (dp[0] + (tightSum == 0 ? 1 : 0)) % MOD;
```

`dp[s]` — allaqachon N dan kichik bo'lib bo'lgan (erkin) prefikslar; `tightSum` — N ning o'zi bo'yicha ketayotgan yagona prefiks.

## `started` flag

"Raqamlarida ketma-ket ikki bir xil raqam yo'q" kabi masalalarda boshidagi nollar xalaqit beradi: `007` dagi `00` haqiqiy son raqamlari emas. Shunda state'ga `started` qo'shiladi: hali nolmas raqam qo'yilmagan bo'lsa, "oldingi raqam" sifatida maxsus qiymat (masalan, 10) ishlatiladi.

## Murakkablik

`uzunlik × (state o'lchami) × 10`. K uzunligi 10^4, D = 100 bo'lsa: 10^4 · 100 · 10 = 10^7 — tez.

=====
---
id: l14
module: m10
week: 11
title: Daraxtda DP
mins: 65
viz:
problems: p27
goals: dp[v][holat] va post-order hisoblash | Java'da iterativ DFS yozish | Rerooting texnikasini qo'llash
summary: Subtree bo'yicha DP, Independent Set, diametr, rerooting va daraxtda knapsack.
---

## G'oya

Daraxtda qism-masala — **subtree**. `dp[v]` — v ildizli subtree uchun javob. U bolalarining `dp` qiymatlaridan yig'iladi, shuning uchun bolalar oldin hisoblanadi (post-order).

## Independent Set (rang berish)

Har tugunni oq yoki qora qilish kerak; ikki qo'shni qora bo'lmasin. Usullar soni?

- `dp[v][0]` — v oq: bolalar istalgan rangda → `Π (dp[c][0] + dp[c][1])`
- `dp[v][1]` — v qora: bolalar faqat oq → `Π dp[c][0]`

Javob: `dp[root][0] + dp[root][1]`.

## Java'da iterativ DFS

n = 10^5 bo'lsa daraxt "zanjir" ko'rinishida bo'lib, rekursiya 10^5 chuqurlikka tushadi → StackOverflowError. Ishonchli yo'l: stack bilan tartib olib, uni **teskari** aylanish.

```java
int[] order = new int[n], parent = new int[n];
int[] stack = new int[n];
int top = 0, cnt = 0;
stack[top++] = 0;
parent[0] = -1;
while (top > 0) {
    int v = stack[--top];
    order[cnt++] = v;
    for (int u : adj[v]) {
        if (u != parent[v]) {
            parent[u] = v;
            stack[top++] = u;
        }
    }
}
long[][] dp = new long[n][2];
for (int k = n - 1; k >= 0; k--) {
    int v = order[k];
    dp[v][0] = 1;
    dp[v][1] = 1;
    for (int u : adj[v]) {
        if (u == parent[v]) continue;
        dp[v][0] = dp[v][0] * ((dp[u][0] + dp[u][1]) % MOD) % MOD;
        dp[v][1] = dp[v][1] * dp[u][0] % MOD;
    }
}
```

`order` da har tugun o'z bolalaridan **oldin** turadi; teskari aylansak — bolalar oldin hisoblanadi.

## Diametr

Eng uzun yo'l (qirralar soni). `down[v]` — v dan pastga eng uzun yo'l. Har tugunda ikki eng uzun bola yo'lini qo'shamiz:

```java
int diameter = 0;
int[] down = new int[n];
for (int k = n - 1; k >= 0; k--) {
    int v = order[k];
    int best1 = 0, best2 = 0;
    for (int u : adj[v]) {
        if (u == parent[v]) continue;
        int d = down[u] + 1;
        if (d > best1) { best2 = best1; best1 = d; }
        else if (d > best2) best2 = d;
    }
    down[v] = best1;
    diameter = Math.max(diameter, best1 + best2);
}
```

## Rerooting

"Har bir tugun ildiz bo'lganda javob" so'ralsa — n marta DFS (O(n²)) o'rniga ikki o'tish:

1. Pastdan yuqoriga: `sz[v]` (subtree o'lchami) va `ans[0]` — 0 dan barcha tugunlargacha masofalar yig'indisi.
2. Yuqoridan pastga: ildiz v dan bolasi u ga ko'chganda, u subtree'dagi `sz[u]` ta tugun 1 ga yaqinlashadi, qolgan `n - sz[u]` tasi 1 ga uzoqlashadi:

`ans[u] = ans[v] - sz[u] + (n - sz[u])`

```java
for (int k = 1; k < n; k++) {
    int u = order[k];
    ans[u] = ans[parent[u]] - sz[u] + (n - sz[u]);
}
```

`order` to'g'ri tartibda (ota oldin) aylanadi. Bu **Sum of Distances in Tree** masalasining yechimi.

## Daraxtda knapsack

`dp[v][k]` — v subtree'dan k ta tugun tanlash. Bolalar birma-bir "qo'shib" boriladi. Har birlashtirishda indekslar `min(k, sz)` bilan cheklansa, umumiy murakkablik O(n²) bo'ladi (O(n³) emas) — bu isbotlangan muhim fakt.

=====
---
id: l15
module: m11
week: 12
title: DAG va graflarda DP
mins: 55
viz:
problems: p28
goals: DP = DAG'dagi yo'l ekanini ko'rish | Topologik tartib bilan hisoblash | Floyd–Warshall va Bellman–Ford'ni DP sifatida tushunish
summary: Longest Path, yo'llar soni, Floyd–Warshall va Bellman–Ford — graflarda DP.
---

## Har qanday DP — bu DAG

Holatlarni tugun, transition'larni qirra deb olsak, DP — **yo'naltirilgan siklsiz graf (DAG)** dagi yo'l masalasi. Hisoblash tartibi — topologik tartib. Shuning uchun DAG berilgan masalalar to'g'ridan-to'g'ri DP.

> [!WARN] Graf siklik bo'lsa, oddiy DP ishlamaydi — holat o'ziga bog'liq bo'lib qoladi. Unda shortest path algoritmlari (Dijkstra, Bellman–Ford) yoki SCC'ga siqish kerak.

## Longest Path (AtCoder G)

`dp[v]` — v dan boshlanadigan eng uzun yo'l. Kahn algoritmi bilan topologik tartib, keyin teskari tartibda:

```java
int[] indeg = new int[n];
for (int v = 0; v < n; v++) for (int u : adj[v]) indeg[u]++;
int[] q = new int[n];
int head = 0, tail = 0;
for (int v = 0; v < n; v++) if (indeg[v] == 0) q[tail++] = v;
while (head < tail) {
    int v = q[head++];
    for (int u : adj[v]) if (--indeg[u] == 0) q[tail++] = u;
}
int[] dp = new int[n];
int ans = 0;
for (int k = n - 1; k >= 0; k--) {
    int v = q[k];
    for (int u : adj[v]) dp[v] = Math.max(dp[v], dp[u] + 1);
    ans = Math.max(ans, dp[v]);
}
```

Muqobil: memo + DFS (`dp[v] = max(dp[u] + 1)`), lekin chuqur graflarda stack xavfi bor.

## Yo'llar soni

`cnt[v]` — 1 dan v gacha yo'llar soni (mod). Topologik tartibda push:

```java
cnt[0] = 1;
for (int k = 0; k < n; k++) {
    int v = q[k];
    for (int u : adj[v]) cnt[u] = (cnt[u] + cnt[v]) % MOD;
}
```

Bu — CSES **Game Routes** masalasi.

## Floyd–Warshall = DP

`d[k][i][j]` — oraliq tugunlar faqat `0..k-1` dan bo'lgan eng qisqa i→j yo'l:

`d[k+1][i][j] = min(d[k][i][j], d[k][i][k] + d[k][k][j])`

k o'lchamini tashlab yuborsa bo'ladi — shuning uchun klassik 3 ta ichma-ich tsikl, **k eng tashqarida**:

```java
for (int k = 0; k < n; k++)
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
```

## Bellman–Ford = DP

`d[t][v]` — ko'pi bilan t ta qirradan iborat eng qisqa yo'l: `d[t+1][v] = min(d[t][v], d[t][u] + w(u, v))`. n-1 qadam yetarli. n-qadamda ham yaxshilansa — manfiy sikl bor.

> [!TIP] "Ko'pi bilan K ta to'xtash bilan" (Cheapest Flights Within K Stops) — `d[t][v]` qatlamlarini alohida saqlang va aynan K+1 qadam qiling.
