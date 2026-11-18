---
id: l04
module: m2
week: 3
title: Grid DP — to'rdagi yo'llar
mins: 50
viz: grid
problems: p06 | p07 | p08
goals: 2D state va hisoblash tartibi | Yo'llar sonini mod bilan sanash | Rolling array'ga o'tish
summary: Unique Paths, to'siqlar, Minimum Path Sum va bitta qatorli massiv.
---

## Unique Paths

n×m to'r, chap-yuqoridan o'ng-pastga faqat o'ngga yoki pastga yurib nechta yo'l bor?

`dp[i][j]` — (i, j) katakka kelish yo'llari soni. Bu katakka faqat yuqoridan yoki chapdan kelinadi:

`dp[i][j] = dp[i-1][j] + dp[i][j-1]`

```java
long[][] dp = new long[n][m];
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        if (grid[i][j] == '*') { dp[i][j] = 0; continue; }
        if (i == 0 && j == 0) { dp[i][j] = 1; continue; }
        long up = i > 0 ? dp[i - 1][j] : 0;
        long left = j > 0 ? dp[i][j - 1] : 0;
        dp[i][j] = (up + left) % MOD;
    }
}
```

To'siq (`*`) bo'lgan katakka 0 yozamiz — u orqali yo'l yo'q.

> [!NOTE] To'siqsiz holatda javob kombinatorik formula: `C(n+m-2, n-1)`. To'siqlar paydo bo'lganda DP kerak.

## Minimum Path Sum

Har katakda narx bor. Minimal yig'indili yo'l:

`dp[i][j] = a[i][j] + min(dp[i-1][j], dp[i][j-1])`

Birinchi qator va ustunda faqat bitta qo'shni bor — chegaralarni alohida ishlang yoki `INF` bilan to'ldiring.

```java
long INF = Long.MAX_VALUE / 4;
long[][] dp = new long[n][m];
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        if (i == 0 && j == 0) { dp[i][j] = a[i][j]; continue; }
        long up = i > 0 ? dp[i - 1][j] : INF;
        long left = j > 0 ? dp[i][j - 1] : INF;
        dp[i][j] = a[i][j] + Math.min(up, left);
    }
}
```

## Hisoblash tartibi

`dp[i][j]` yuqori va chap qo'shnilarga bog'liq. Demak qatorma-qator, chapdan o'ngga yurish yetarli. Umumiy qoida: **har bir holat o'zi bog'liq bo'lgan holatlardan keyin hisoblanishi kerak.**

## Rolling array

`i`-qator faqat `i-1`-qatorga bog'liq. Bitta 1D massiv yetarli:

```java
long[] dp = new long[m];
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        if (grid[i][j] == '*') dp[j] = 0;
        else if (i == 0 && j == 0) dp[j] = 1;
        else if (j > 0) dp[j] = (dp[j] + dp[j - 1]) % MOD;
    }
}
```

Yangilanishdan oldin `dp[j]` — yuqoridagi qiymat, `dp[j-1]` esa allaqachon yangilangan chapdagi qiymat. Xotira O(nm) dan O(m) ga tushadi.

## Teskari yo'nalish

Ba'zi masalalarda (masalan, **Dungeon Game**) yo'l boshidagi talab oxiriga bog'liq. Bunda DP'ni **o'ng-pastdan** boshlab hisoblang: `dp[i][j]` — (i, j) dan oxirgacha borish uchun kerakli minimal kuch.

## Jadval ko'rinishida bo'lmagan "grid"

**Array Description** (CSES): massiv elementlari 1..m, qo'shnilar farqi ≤ 1, ba'zi elementlar noma'lum (0). `dp[i][v]` — i-pozitsiyada qiymati v bo'lgan to'g'ri prefikslar soni:

`dp[i][v] = dp[i-1][v-1] + dp[i-1][v] + dp[i-1][v+1]`

Bu ham to'rdagi yo'l: qatorlar — pozitsiyalar, ustunlar — qiymatlar.

=====
---
id: l05
module: m3
week: 4
title: 0/1 Knapsack va Subset Sum
mins: 60
viz: knap
problems: p09 | p10 | p11 | p12
goals: 2D knapsack jadvalini qurish | 1D'da teskari tsikl sababini tushunish | DP'ni og'irlik yoki qiymat bo'yicha tanlash
summary: Klassik 0/1 knapsack, uning 1D shakli, Knapsack 2 hiylasi va subset sum.
---

## Masala

N ta buyum: og'irligi `w[i]`, qiymati `v[i]`. Sumka sig'imi W. Har buyumni ko'pi bilan bir marta olish mumkin. Maksimal qiymat?

## 2D yechim

`dp[i][c]` — dastlabki i ta buyumdan, umumiy og'irligi ≤ c bo'lgan maksimal qiymat.

i-buyum uchun ikki tanlov:

- olmaymiz: `dp[i-1][c]`
- olamiz (agar `w[i] ≤ c`): `dp[i-1][c - w[i]] + v[i]`

```java
long[][] dp = new long[n + 1][W + 1];
for (int i = 1; i <= n; i++) {
    for (int c = 0; c <= W; c++) {
        dp[i][c] = dp[i - 1][c];
        if (w[i - 1] <= c) {
            dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);
        }
    }
}
System.out.println(dp[n][W]);
```

Vaqt va xotira: O(N·W).

## 1D yechim va teskari tsikl

`i`-qator faqat `i-1`-qatorga bog'liq. Bitta massiv qoldiramiz, lekin **c ni kamayish tartibida** aylanamiz:

```java
long[] dp = new long[W + 1];
for (int i = 0; i < n; i++) {
    for (int c = W; c >= w[i]; c--) {
        dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
    }
}
```

> [!WARN] c o'sish tartibida aylansa, `dp[c - w[i]]` allaqachon shu buyum bilan yangilangan bo'ladi — buyum bir necha marta olinadi. Bu unbounded knapsack bo'lib qoladi.

## Qaysi o'lcham bo'yicha DP?

AtCoder **Knapsack 2**da `W ≤ 10^9`, lekin `v[i] ≤ 1000`, `N ≤ 100`. O(N·W) mumkin emas. State'ni almashtiramiz:

`dp[val]` — aynan `val` qiymatni yig'ish uchun minimal og'irlik. Javob — `dp[val] ≤ W` bo'lgan eng katta `val`.

```java
int maxV = 100 * 1000;
long INF = Long.MAX_VALUE / 4;
long[] dp = new long[maxV + 1];
Arrays.fill(dp, INF);
dp[0] = 0;
for (int i = 0; i < n; i++) {
    for (int val = maxV; val >= v[i]; val--) {
        dp[val] = Math.min(dp[val], dp[val - v[i]] + w[i]);
    }
}
```

> [!TIP] Qoida: **kichik chegarali parametr** DP indeksiga, kattasi DP qiymatiga aylanadi.

## Subset Sum va Partition

"Massivdan yig'indisi aynan S bo'lgan qism-to'plam bormi?" — qiymatlarsiz knapsack:

```java
boolean[] can = new boolean[S + 1];
can[0] = true;
for (int x : a) {
    for (int s = S; s >= x; s--) {
        if (can[s - x]) can[s] = true;
    }
}
```

**Partition Equal Subset Sum**: umumiy yig'indi `T` toq bo'lsa — yo'q; aks holda `can[T/2]` ni tekshiramiz.

## Tanlangan buyumlarni tiklash

2D jadval saqlangan bo'lsa, oxirdan orqaga yuramiz: `dp[i][c] != dp[i-1][c]` bo'lsa, i-buyum olingan va `c -= w[i]`.

```java
List<Integer> chosen = new ArrayList<>();
int c = W;
for (int i = n; i >= 1; i--) {
    if (dp[i][c] != dp[i - 1][c]) {
        chosen.add(i - 1);
        c -= w[i - 1];
    }
}
```

=====
---
id: l06
module: m3
week: 5
title: Coin Change va unbounded knapsack
mins: 55
viz: coin
problems: p13 | p14
goals: Minimal tangalar sonini topish | Kombinatsiya va permutatsiyani tsikl tartibi bilan ajratish | Bounded knapsack'ni binary splitting bilan yechish
summary: Cheksiz buyumlar, minimal tangalar, usullar soni va tsikl tartibining ahamiyati.
---

## Unbounded knapsack

Har bir buyumni **cheksiz** marta olish mumkin. 1D massivda c ni **o'sish** tartibida aylanamiz — shunda `dp[c - w]` ichida shu buyum yana ishtirok etishi mumkin:

```java
for (int i = 0; i < n; i++) {
    for (int c = w[i]; c <= W; c++) {
        dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
    }
}
```

## Minimizing Coins

Tangalar `c[1..n]`. x summani minimal nechta tanga bilan yig'ish mumkin?

`dp[s]` — s summani yig'ish uchun minimal tangalar soni: `dp[s] = min(dp[s - c] + 1)`.

```java
int INF = Integer.MAX_VALUE / 2;
int[] dp = new int[x + 1];
Arrays.fill(dp, INF);
dp[0] = 0;
for (int s = 1; s <= x; s++) {
    for (int c : coins) {
        if (c <= s && dp[s - c] + 1 < dp[s]) dp[s] = dp[s - c] + 1;
    }
}
System.out.println(dp[x] >= INF ? -1 : dp[x]);
```

> [!WARN] Greedy (eng katta tangadan boshlash) har doim ishlamaydi: tangalar {1, 3, 4}, summa 6 → greedy 4+1+1 = 3 ta, to'g'risi 3+3 = 2 ta.

## Usullar soni: tartib muhim!

Bu CP'dagi eng mashhur tuzoqlardan biri.

**Permutatsiyalar** (tartib muhim: 2+3 va 3+2 — ikki xil). Tashqi tsikl — summa:

```java
dp[0] = 1;
for (int s = 1; s <= x; s++)
    for (int c : coins)
        if (c <= s) dp[s] = (dp[s] + dp[s - c]) % MOD;
```

**Kombinatsiyalar** (tartib muhim emas: 2+3 = 3+2). Tashqi tsikl — tangalar:

```java
dp[0] = 1;
for (int c : coins)
    for (int s = c; s <= x; s++)
        dp[s] = (dp[s] + dp[s - c]) % MOD;
```

Nega ishlaydi: ikkinchi variantda tangalar qat'iy tartibda "qo'shiladi" — avval faqat 1-tanga bilan, keyin 2-tanga ham qo'shiladi va h.k. Shuning uchun har bir to'plam faqat bitta tartibda sanaladi.

| Masala | Tashqi tsikl | Nimani sanaydi |
|---|---|---|
| CSES Coin Combinations I | summa | permutatsiyalar |
| CSES Coin Combinations II | tanga | kombinatsiyalar |

## Bounded knapsack

i-buyumdan ko'pi bilan `k[i]` dona. Sodda yondashuv — har donani alohida buyum qilish: O(W·Σk). Tezroq — **binary splitting**: `k` ni `1, 2, 4, …, qoldiq` bo'laklarga ajratamiz va har bo'lakni 0/1 buyum deb olamiz.

```java
for (int i = 0; i < n; i++) {
    int cnt = k[i];
    for (int p = 1; cnt > 0; p <<= 1) {
        int take = Math.min(p, cnt);
        cnt -= take;
        int ww = take * w[i];
        long vv = (long) take * v[i];
        for (int c = W; c >= ww; c--) {
            dp[c] = Math.max(dp[c], dp[c - ww] + vv);
        }
    }
}
```

Vaqt: O(W · Σ log k[i]). Har qanday 0..k sonni bu bo'laklar yig'indisi sifatida yozish mumkin.
