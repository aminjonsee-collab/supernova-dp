---
id: l07
module: m4
week: 6
title: LIS — eng uzun o'suvchi qism-ketma-ketlik
mins: 55
viz: lis
problems: p15
goals: O(n²) LIS DP | O(n log n) tails massivi | Ketma-ketlikni tiklash va variantlarni bilish
summary: Subsequence tushunchasi, ikki xil LIS algoritmi va mashhur variantlari.
---

## Subarray va subsequence

- **Subarray** — ketma-ket elementlar: `[3, 5, 3]`.
- **Subsequence** — tartib saqlangan, lekin elementlar tashlab ketilishi mumkin: `[3, 5, 9]`.

LIS — qat'iy o'suvchi eng uzun subsequence. `[7, 3, 5, 3, 6, 2, 9, 8]` uchun javob 4: `3, 5, 6, 9`.

## O(n²) DP

`dp[i]` — **aynan i-element bilan tugaydigan** LIS uzunligi:

`dp[i] = 1 + max(dp[j])`, bunda `j < i` va `a[j] < a[i]`.

```java
int[] dp = new int[n];
int[] par = new int[n];
int best = 0, end = -1;
for (int i = 0; i < n; i++) {
    dp[i] = 1;
    par[i] = -1;
    for (int j = 0; j < i; j++) {
        if (a[j] < a[i] && dp[j] + 1 > dp[i]) {
            dp[i] = dp[j] + 1;
            par[i] = j;
        }
    }
    if (dp[i] > best) { best = dp[i]; end = i; }
}
```

Ketma-ketlikni tiklash — `par` bo'yicha orqaga:

```java
List<Integer> seq = new ArrayList<>();
for (int i = end; i != -1; i = par[i]) seq.add(a[i]);
Collections.reverse(seq);
```

## O(n log n): tails massivi

`tails[k]` — uzunligi `k+1` bo'lgan o'suvchi ketma-ketliklarning **eng kichik mumkin bo'lgan oxirgi elementi**. Bu massiv doim o'suvchi, shuning uchun binary search ishlatsa bo'ladi.

Har bir `x` uchun: `tails` da `x` dan **katta yoki teng** birinchi elementni topamiz (lower bound) va uni `x` bilan almashtiramiz. Topilmasa — oxiriga qo'shamiz.

```java
int[] tails = new int[n];
int len = 0;
for (int x : a) {
    int lo = 0, hi = len;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (tails[mid] < x) lo = mid + 1;
        else hi = mid;
    }
    tails[lo] = x;
    if (lo == len) len++;
}
System.out.println(len);
```

> [!WARN] `tails` — LIS'ning o'zi emas! U faqat uzunlikni to'g'ri beradi. Ketma-ketlikni tiklash uchun har element qaysi pozitsiyaga tushganini va undan oldingi elementni alohida saqlang.

## Nega tails ishlaydi?

Uzunligi k bo'lgan ketma-ketliklar ichida oxirgi elementi kichikrog'i "yaxshiroq" — unga keyin ko'proq son qo'shish mumkin. Biz har uzunlik uchun faqat eng yaxshi variantni saqlaymiz. Bu — DP'ning greedy bilan siqilgan shakli.

## Variantlar

| Variant | O'zgarish |
|---|---|
| Non-decreasing (≤) | `tails[mid] <= x` bo'lsa `lo = mid + 1` (upper bound) |
| Kamayuvchi | elementlarni `-x` qilib LIS |
| Russian Doll Envelopes | eni bo'yicha o'sish, teng enda bo'yi bo'yicha kamayish tartibida sort, keyin bo'yi bo'yicha LIS |
| LIS'lar soni | `cnt[i]` — i bilan tugaydigan LIS'lar soni, O(n²) |
| Minimal o'chirish (o'suvchi qilish uchun) | `n - LIS` |

=====
---
id: l08
module: m4
week: 7
title: LCS va Edit Distance
mins: 60
viz: lcs | edit
problems: p16 | p17
goals: Ikki satr prefikslari bo'yicha 2D state | Jadvaldan javobni tiklash (traceback) | Edit distance'ning uchta amalini modellash
summary: Ikki ketma-ketlik ustida DP: LCS, Levenshtein masofasi va xotirani tejash.
---

## Ikki ketma-ketlik — 2D state

Ikki satr (yoki massiv) bilan ishlaganda standart state:

`dp[i][j]` — `s` ning birinchi i ta belgisi va `t` ning birinchi j ta belgisi uchun javob.

Jadval o'lchami `(n+1) × (m+1)`; 0-qator va 0-ustun — bo'sh prefiks.

## LCS

Eng uzun umumiy subsequence:

- `s[i-1] == t[j-1]` bo'lsa: `dp[i][j] = dp[i-1][j-1] + 1`
- aks holda: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`

```java
int[][] dp = new int[n + 1][m + 1];
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
        if (s.charAt(i - 1) == t.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
}
```

## Traceback

`(n, m)` dan boshlab orqaga yuramiz:

```java
StringBuilder sb = new StringBuilder();
int i = n, j = m;
while (i > 0 && j > 0) {
    if (s.charAt(i - 1) == t.charAt(j - 1)) {
        sb.append(s.charAt(i - 1));
        i--;
        j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
}
System.out.println(sb.reverse());
```

## Edit Distance (Levenshtein)

`s` ni `t` ga aylantirish uchun minimal amallar soni. Amallar: belgi qo'shish, o'chirish, almashtirish.

- `dp[i][0] = i` (hammasini o'chirish), `dp[0][j] = j` (hammasini qo'shish)
- `s[i-1] == t[j-1]`: `dp[i][j] = dp[i-1][j-1]`
- aks holda `1 + min` uchtadan:
  - `dp[i-1][j]` — s dan o'chirish
  - `dp[i][j-1]` — t belgisini qo'shish
  - `dp[i-1][j-1]` — almashtirish

```java
int[][] dp = new int[n + 1][m + 1];
for (int i = 0; i <= n; i++) dp[i][0] = i;
for (int j = 0; j <= m; j++) dp[0][j] = j;
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
        if (s.charAt(i - 1) == t.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    }
}
```

## Xotirani tejash

Har qator faqat oldingi qatorga bog'liq — ikkita 1D massiv yetarli:

```java
int[] prev = new int[m + 1], cur = new int[m + 1];
for (int j = 0; j <= m; j++) prev[j] = j;
for (int i = 1; i <= n; i++) {
    cur[0] = i;
    for (int j = 1; j <= m; j++) {
        if (s.charAt(i - 1) == t.charAt(j - 1)) cur[j] = prev[j - 1];
        else cur[j] = 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));
    }
    int[] tmp = prev;
    prev = cur;
    cur = tmp;
}
System.out.println(prev[m]);
```

> [!NOTE] Traceback kerak bo'lsa, to'liq jadval kerak (yoki Hirschberg algoritmi — murakkabroq).

## Bog'liq masalalar

| Masala | Formula |
|---|---|
| Shortest Common Supersequence uzunligi | `n + m - LCS` |
| Ikki satrni tenglash uchun minimal o'chirishlar | `n + m - 2·LCS` |
| Longest Palindromic Subsequence | `LCS(s, reverse(s))` |
| Distinct Subsequences | `dp[i][j] = dp[i-1][j] + (s[i-1]==t[j-1] ? dp[i-1][j-1] : 0)` |

=====
---
id: l09
module: m5
week: 8
title: Satr DP — palindromlar va Word Break
mins: 55
viz: lps
problems: p18 | p19
goals: isPal jadvalini qurish | Word Break prefiks DP | Palindromlarga minimal bo'lishni topish
summary: Palindrom jadvali, eng uzun palindrom subsequence, Word Break va minimal kesishlar.
---

## isPal jadvali

`pal[l][r]` — `s[l..r]` palindrommi?

`pal[l][r] = (s[l] == s[r]) && (r - l < 2 || pal[l+1][r-1])`

`pal[l][r]` ichki `pal[l+1][r-1]` ga bog'liq, shuning uchun **l ni kamayish** tartibida hisoblaymiz:

```java
boolean[][] pal = new boolean[n][n];
for (int l = n - 1; l >= 0; l--) {
    for (int r = l; r < n; r++) {
        pal[l][r] = s.charAt(l) == s.charAt(r) && (r - l < 2 || pal[l + 1][r - 1]);
    }
}
```

O(n²) vaqt va xotira. Undan:

- **Palindromic Substrings soni** — `true` kataklar soni.
- **Longest Palindromic Substring** — `true` bo'lgan eng katta `r - l + 1`.

> [!TIP] Faqat eng uzun palindrom kerak bo'lsa, "markazdan kengaytirish" O(1) xotira bilan ishlaydi. n ≤ 10^6 bo'lsa — Manacher algoritmi.

## Longest Palindromic Subsequence

`dp[l][r]` — `s[l..r]` dagi eng uzun palindrom subsequence:

- `l == r`: 1
- `s[l] == s[r]`: `dp[l+1][r-1] + 2`
- aks holda: `max(dp[l+1][r], dp[l][r-1])`

```java
int[][] dp = new int[n][n];
for (int l = n - 1; l >= 0; l--) {
    dp[l][l] = 1;
    for (int r = l + 1; r < n; r++) {
        if (s.charAt(l) == s.charAt(r)) dp[l][r] = dp[l + 1][r - 1] + 2;
        else dp[l][r] = Math.max(dp[l + 1][r], dp[l][r - 1]);
    }
}
```

`r = l + 1` va belgilar teng bo'lsa, `dp[l+1][l]` — jadvalning pastki uchburchagi, u 0 — natija 2, to'g'ri. Bu interval DP'ning birinchi namunasi — keyingi darsda batafsil.

## Word Break

Satr `s` va lug'at berilgan. `s` ni lug'at so'zlariga bo'lish mumkinmi?

`ok[i]` — `s` ning birinchi i ta belgisini bo'lish mumkinmi.

```java
Set<String> dict = new HashSet<>(words);
int maxLen = 0;
for (String w : words) maxLen = Math.max(maxLen, w.length());
boolean[] ok = new boolean[n + 1];
ok[0] = true;
for (int i = 1; i <= n; i++) {
    for (int len = 1; len <= Math.min(i, maxLen) && !ok[i]; len++) {
        if (ok[i - len] && dict.contains(s.substring(i - len, i))) ok[i] = true;
    }
}
```

`maxLen` cheklovi ishni ancha tezlashtiradi. Bo'lish usullari soni kerak bo'lsa — `boolean` o'rniga `long` va `+=`.

## Palindrome Partitioning II

Satrni palindrom bo'laklarga ajratish uchun minimal kesishlar soni.

`cut[i]` — `s[0..i]` uchun minimal kesishlar. `s[0..i]` palindrom bo'lsa — 0. Aks holda: `cut[i] = min(cut[j-1] + 1)`, bunda `s[j..i]` palindrom.

```java
int[] cut = new int[n];
for (int i = 0; i < n; i++) {
    if (pal[0][i]) { cut[i] = 0; continue; }
    cut[i] = i;
    for (int j = 1; j <= i; j++) {
        if (pal[j][i]) cut[i] = Math.min(cut[i], cut[j - 1] + 1);
    }
}
```

Ikki bosqich: avval `pal`, keyin `cut`. Umumiy O(n²).
