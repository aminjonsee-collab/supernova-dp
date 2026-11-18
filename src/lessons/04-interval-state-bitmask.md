---
id: l10
module: m6
week: 9
title: Interval DP
mins: 60
viz: lps
problems: p20 | p21
goals: dp[l][r] va uzunlik bo'yicha tartib | Bo'lish nuqtasi k ni sanash | O'yin masalalarida farq (difference) DP
summary: Oraliqlar ustida DP: Slimes, Matrix Chain, Burst Balloons va Removal Game.
---

## Shablon

Interval DP — javob qism-oraliq `[l, r]` ga bog'liq bo'lganda. Odatiy ko'rinish:

`dp[l][r] = min over k in [l, r) of ( dp[l][k] + dp[k+1][r] + cost(l, r, k) )`

Hisoblash tartibi — **oraliq uzunligi o'sishi** bo'yicha, chunki `[l, r]` ichidagi barcha kichik oraliqlar oldin tayyor bo'lishi kerak.

```java
for (int len = 2; len <= n; len++) {
    for (int l = 0; l + len - 1 < n; l++) {
        int r = l + len - 1;
        dp[l][r] = INF;
        for (int k = l; k < r; k++) {
            dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r] + cost(l, r, k));
        }
    }
}
```

Murakkablik: O(n³). Java'da n ≤ 400–500 gacha ishlaydi.

## Slimes (oraliqlarni birlashtirish)

Qatorda N ta slime, o'lchamlari `a[i]`. Ikki qo'shni slime birlashsa, xarajat — ular o'lchamlari yig'indisi. Hammasini bitta qilishning minimal xarajati?

Oxirgi birlashtirish `[l, k]` va `[k+1, r]` ni qo'shadi va narxi har doim `sum(l..r)`:

`dp[l][r] = min(dp[l][k] + dp[k+1][r]) + sum(l, r)`

`sum(l, r)` ni prefix sum bilan O(1) da olamiz.

## Matrix Chain Multiplication

Matritsalar o'lchamlari `p[0]×p[1], p[1]×p[2], …`. Ko'paytirish tartibini (qavslarni) shunday tanlash kerakki, skalyar ko'paytmalar soni minimal bo'lsin:

`dp[l][r] = min(dp[l][k] + dp[k+1][r] + p[l]·p[k+1]·p[r+1])`

## Burst Balloons — "oxirgi" fikrlash

Sharlarni yorish masalasida "birinchi qaysi yoriladi" deb o'ylasak, qo'shnilar o'zgarib, oraliqlar mustaqil bo'lmaydi. Hiyla: **`[l, r]` oraliqda oxirgi yoriladigan shar — k**. U yorilganda uning qo'shnilari — `l-1` va `r+1`:

`dp[l][r] = max(dp[l][k-1] + dp[k+1][r] + a[l-1]·a[k]·a[r+1])`

> [!TIP] Interval DP'da "birinchi" emas, "oxirgi" amalni tanlash ko'pincha oraliqlarni mustaqil qiladi.

## O'yin DP: Removal Game

Ikki o'yinchi navbat bilan massivning chap yoki o'ng chetidan son oladi. Ikkalasi ham optimal o'ynaydi. Birinchi o'yinchi maksimal qancha yig'adi?

State'ni **farq** sifatida olamiz: `dp[l][r]` — `[l, r]` qolganda navbatdagi o'yinchining raqibidan maksimal ustunligi.

`dp[l][r] = max(a[l] - dp[l+1][r], a[r] - dp[l][r-1])`

Birinchi o'yinchi ochkosi: `(sum + dp[0][n-1]) / 2`.

```java
long[][] dp = new long[n][n];
for (int l = n - 1; l >= 0; l--) {
    dp[l][l] = a[l];
    for (int r = l + 1; r < n; r++) {
        dp[l][r] = Math.max(a[l] - dp[l + 1][r], a[r] - dp[l][r - 1]);
    }
}
```

## Ikki xil tartib

| Tartib | Qachon |
|---|---|
| `len = 1..n`, keyin `l` | Har doim ishlaydi, eng ishonchli |
| `l = n-1..0`, keyin `r = l..n-1` | `dp[l][r]` faqat `dp[l+1][*]` va `dp[l][r'<r]` ga bog'liq bo'lsa |

=====
---
id: l11
module: m7
week: 9
title: State machine DP
mins: 45
viz:
problems: p22 | p23
goals: Holatlar diagrammasini chizish | Har qadamda bir nechta state yuritish | K ta tranzaksiyali masalalarni yechish
summary: Vacation, aksiya oldi-sotdi (cooldown, K tranzaksiya, fee) — holatlar mashinasi orqali.
---

## G'oya

Ba'zan `dp[i]` yetarli emas — i-qadamdan keyin **qanday holatda ekanimiz** ham muhim. Shunda state'ga rejim qo'shiladi: `dp[i][s]`, bunda `s` — kichik chekli to'plam (masalan, "aksiya bor / yo'q").

Ish tartibi:

1. Holatlarni sanab chiqing.
2. Holatlar orasidagi o'tishlarni strelka bilan chizing.
3. Har strelka — transition formulasidagi bitta had.

## Vacation (AtCoder C)

Har kuni uchta faoliyatdan biri: A, B, C — ketma-ket ikki kun bir xil bo'lmasin. `dp[i][k]` — i-kun k-faoliyat bilan tugagan maksimal baxt.

```java
long[][] dp = new long[n][3];
for (int k = 0; k < 3; k++) dp[0][k] = h[0][k];
for (int i = 1; i < n; i++) {
    for (int k = 0; k < 3; k++) {
        for (int p = 0; p < 3; p++) {
            if (p != k) dp[i][k] = Math.max(dp[i][k], dp[i - 1][p] + h[i][k]);
        }
    }
}
```

## Aksiyalar: cooldown bilan

Narxlar `p[i]`. Sotib olish/sotish cheksiz, lekin sotgandan keyingi kuni sotib olib bo'lmaydi. Holatlar:

- `hold` — qo'limizda aksiya bor
- `sold` — bugun sotdik
- `rest` — aksiya yo'q va cooldown'da emasmiz

O'tishlar:

- `hold = max(hold, rest - p[i])`
- `sold = hold + p[i]`
- `rest = max(rest, sold)` (kechagi sold)

```java
long hold = Long.MIN_VALUE / 2, sold = 0, rest = 0;
for (int i = 0; i < n; i++) {
    long pHold = hold, pSold = sold, pRest = rest;
    hold = Math.max(pHold, pRest - p[i]);
    sold = pHold + p[i];
    rest = Math.max(pRest, pSold);
}
System.out.println(Math.max(sold, rest));
```

> [!WARN] Yangi qiymatlarni hisoblashda eski qiymatlardan foydalaning (`pHold`, `pSold`…). Aks holda bitta kunda ikki o'tish bo'lib ketadi.

## K ta tranzaksiya

`buy[j]` — j-sotib olishdan keyingi maksimal foyda, `sell[j]` — j-sotishdan keyingi:

```java
long[] buy = new long[k + 1], sell = new long[k + 1];
Arrays.fill(buy, Long.MIN_VALUE / 2);
for (int x : p) {
    for (int j = 1; j <= k; j++) {
        buy[j] = Math.max(buy[j], sell[j - 1] - x);
        sell[j] = Math.max(sell[j], buy[j] + x);
    }
}
System.out.println(sell[k]);
```

Komissiya (fee) bo'lsa — sotishda `x - fee`. Bu oilaning barcha masalalari bitta diagramma bilan yechiladi, faqat holatlar soni o'zgaradi.

> [!NOTE] Bitta kunda sotib olib, o'sha kuni sotish foyda 0 beradi — shuning uchun `buy[j]` ni yangilab, darhol `sell[j]` da ishlatish xato emas.

=====
---
id: l12
module: m8
week: 10
title: Bitmask DP
mins: 70
viz:
problems: p24 | p25
goals: Java'da bit amallarini bexato yozish | TSP / Hamiltonian path — dp[mask][v] | Submask aylanish va SOS DP g'oyasi
summary: n ≤ 20 belgisi, qism-to'plamlar ustida DP, Matching, Hamiltonian Flights, SOS.
---

## Qachon?

Cheklovlarda **n ≤ 20** (ba'zan ≤ 16, ≤ 23) ko'rsangiz — deyarli har doim bitmask. Har bir qism-to'plamni `int` ning bitlari bilan ifodalaymiz: i-bit 1 bo'lsa, i-element to'plamda.

## Java'da bit amallari

| Amal | Kod |
|---|---|
| i-bit bormi | `(mask >> i & 1) == 1` |
| i-bitni qo'shish | `mask \| (1 << i)` |
| i-bitni olib tashlash | `mask & ~(1 << i)` |
| Bitlar soni | `Integer.bitCount(mask)` |
| Eng kichik 1-bit | `mask & -mask` |
| Uning indeksi | `Integer.numberOfTrailingZeros(mask)` |
| To'liq to'plam | `(1 << n) - 1` |

> [!WARN] `1 << 31` manfiy son bo'ladi, `1 << 32` esa `1` ga teng (Java shiftni 32 ga bo'lgandagi qoldiq bo'yicha oladi). 32+ bit kerak bo'lsa — `1L << i` va `long`.

## Hamiltonian path / TSP

`dp[mask][v]` — `mask` dagi shaharlarni aynan bir martadan ziyorat qilib, `v` da turgan holatdagi minimal narx (yoki yo'llar soni).

```java
int full = 1 << n;
long[][] dp = new long[full][n];
for (long[] row : dp) Arrays.fill(row, INF);
dp[1][0] = 0;
for (int mask = 1; mask < full; mask++) {
    for (int v = 0; v < n; v++) {
        if (dp[mask][v] == INF || (mask >> v & 1) == 0) continue;
        for (int u = 0; u < n; u++) {
            if ((mask >> u & 1) == 1) continue;
            int nm = mask | (1 << u);
            dp[nm][u] = Math.min(dp[nm][u], dp[mask][v] + cost[v][u]);
        }
    }
}
```

Vaqt O(2^n · n²), xotira O(2^n · n). n = 20 da `long[1<<20][20]` ≈ 170 MB — ehtiyot bo'ling, imkon bo'lsa `int` ishlating.

Mask doim o'sadi (`nm > mask`), shuning uchun mask'ni o'sish tartibida aylanish to'g'ri.

## Assignment: Matching

n erkak, n ayol, `ok[i][j]` — mos keladimi. Barchani juftlash usullari soni (mod)?

Kalit kuzatuv: navbatdagi erkak raqami `i = bitCount(mask)` — nechta ayol band bo'lsa, shuncha erkak juftlangan. Shuning uchun bitta o'lchamli `dp[mask]` yetarli:

```java
long[] dp = new long[1 << n];
dp[0] = 1;
for (int mask = 0; mask < (1 << n); mask++) {
    int i = Integer.bitCount(mask);
    if (i >= n || dp[mask] == 0) continue;
    for (int j = 0; j < n; j++) {
        if (ok[i][j] && (mask >> j & 1) == 0) {
            int nm = mask | (1 << j);
            dp[nm] = (dp[nm] + dp[mask]) % MOD;
        }
    }
}
System.out.println(dp[(1 << n) - 1]);
```

O(2^n · n) — `dp[mask][i]` dan n marta tezroq.

## Submask'larni aylanish

`mask` ning barcha bo'sh bo'lmagan qism-to'plamlari:

```java
for (int s = mask; s > 0; s = (s - 1) & mask) {
    process(s);
}
```

Barcha mask'lar uchun barcha submask'lar jami **O(3^n)** — n ≤ 15–16 gacha. Bu "to'plamni guruhlarga bo'lish" masalalarida kerak: `dp[mask] = min(dp[mask ^ s] + cost[s])`.

## SOS DP (Sum over Subsets)

Har `mask` uchun `F[mask] = Σ A[s]`, s ⊆ mask. O(3^n) o'rniga O(2^n · n):

```java
for (int i = 0; i < n; i++)
    for (int mask = 0; mask < (1 << n); mask++)
        if ((mask >> i & 1) == 1) F[mask] += F[mask ^ (1 << i)];
```

`F` boshida `A` ning nusxasi. Bu — har bir bit bo'yicha alohida prefix sum.
