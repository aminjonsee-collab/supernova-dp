---
id: l16
module: m12
week: 12
title: Sanash, kombinatorika va ehtimollik DP
mins: 60
viz:
problems: p29 | p30
goals: Mod arifmetikasini Java'da to'g'ri yozish | Pascal uchburchagi va partitions | Ehtimollik va matematik kutilma DP
summary: MOD bilan sanash, C(n, k), bo'linishlar, Coins va Sushi masalalari.
---

## Mod arifmetikasi Java'da

```java
static final long MOD = 1_000_000_007L;

long add = (a + b) % MOD;
long sub = ((a - b) % MOD + MOD) % MOD;
long mul = a * b % MOD;
```

- `a` va `b` < MOD bo'lsa, `a * b` < 10^18 — `long`ga sig'adi. `int * int` esa overflow beradi: avval `(long) a * b`.
- Java'da `%` manfiy sonda manfiy natija beradi: `-3 % 5 == -3`. Ayirishdan keyin `+ MOD`.
- Bo'lish uchun teskari element: `pow(b, MOD - 2)` (Fermat kichik teoremasi).

```java
static long pow(long b, long e) {
    long r = 1;
    b %= MOD;
    while (e > 0) {
        if ((e & 1) == 1) r = r * b % MOD;
        b = b * b % MOD;
        e >>= 1;
    }
    return r;
}
```

## Pascal uchburchagi

`C[n][k] = C[n-1][k-1] + C[n-1][k]` — "n-element olinadimi yoki yo'qmi". n ≤ 5000 gacha jadval bilan; kattaroq bo'lsa factorial + inverse factorial.

```java
long[][] C = new long[N + 1][N + 1];
for (int i = 0; i <= N; i++) {
    C[i][0] = 1;
    for (int k = 1; k <= i; k++) C[i][k] = (C[i - 1][k - 1] + C[i - 1][k]) % MOD;
}
```

## Partitions

n ni musbat sonlar yig'indisi sifatida (tartib muhim emas) necha usulda yozish mumkin? Bu coin change kombinatsiyalari: tangalar 1..n.

```java
long[] p = new long[n + 1];
p[0] = 1;
for (int c = 1; c <= n; c++)
    for (int s = c; s <= n; s++)
        p[s] = (p[s] + p[s - c]) % MOD;
```

## Ehtimollik DP: Coins (AtCoder I)

N ta tanga, i-tanga gerb tushish ehtimoli `p[i]`. Gerblar soni yarmidan ko'p bo'lish ehtimoli?

`dp[i][j]` — dastlabki i ta tangadan aynan j ta gerb ehtimoli:

`dp[i][j] = dp[i-1][j-1]·p[i] + dp[i-1][j]·(1 - p[i])`

```java
double[] dp = new double[n + 1];
dp[0] = 1;
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j >= 1; j--) {
        dp[j] = dp[j] * (1 - p[i]) + dp[j - 1] * p[i];
    }
    dp[0] *= (1 - p[i]);
}
```

1D'da **j kamayish** tartibida — xuddi 0/1 knapsack kabi.

> [!WARN] `System.out.printf("%.10f", x)` o'zbek yoki rus locale'li kompyuterda `0,6120000000` (vergul bilan) chiqarishi mumkin. Ishonchli variant: `String.format(Locale.US, "%.10f", x)`.

## Matematik kutilma: Sushi (AtCoder J)

Kutilma (expected value) DP odatda **oxirdan** boshlanadi: `E[state]` — shu holatdan maqsadga yetish uchun kutilgan qadamlar soni.

Sushi'da muhim kuzatuv: tarelkalar tartibi emas, **nechta tarelkada 1, 2, 3 ta sushi borligi** muhim. State `(a, b, c)`:

`E(a,b,c) = (n + a·E(a-1,b,c) + b·E(a+1,b-1,c) + c·E(a,b+1,c-1)) / (a + b + c)`

Bu bo'sh tarelka tanlanishi (o'z-o'ziga sikl) algebraik yo'q qilingandan keyingi formula.

> [!TIP] Tenglama `E = 1 + q·E + …` ko'rinishida o'ziga bog'liq bo'lsa, E ni tenglamadan ifodalab chiqing: `E = (1 + …) / (1 - q)`.

Hisoblash tartibi: `c` tashqarida, keyin `b`, keyin `a` (hammasi o'sish bo'yicha) — o'ng tomondagi har bir holat oldin tayyor bo'ladi.

=====
---
id: l17
module: m13
week: 13
title: DP optimizatsiyalari
mins: 75
viz:
problems: p31 | p32
goals: Prefix sum bilan transition'ni O(1) ga tushirish | Monoton deque'ni qo'llash | Convex Hull Trick va Li Chao tree
summary: Transition'ni tezlashtirish: prefix sum, deque, CHT/Li Chao, D&C va Knuth haqida.
---

## Qachon optimizatsiya kerak?

To'g'ri DP bor, lekin `holatlar × transition` juda katta. Holatlarni kamaytirish qiyin bo'lsa — **transition'ni tezlashtiramiz**.

| Transition ko'rinishi | Usul | Bitta holat narxi |
|---|---|---|
| `dp[i] = Σ dp[j]`, j oraliqda | Prefix sum | O(1) |
| `dp[i] = min dp[j]`, j sirpanuvchi oynada | Monoton deque | amortized O(1) |
| `dp[i] = min (dp[j] + b[j]·a[i])` | Convex Hull Trick / Li Chao | O(log X) |
| `dp[i][j] = min (dp[i-1][k] + C(k, j))`, opt monoton | Divide & Conquer opt | O(log n) amortized |
| Interval DP, `opt[l][r-1] ≤ opt[l][r] ≤ opt[l+1][r]` | Knuth opt | O(1) amortized |

## Prefix sum: Candies (AtCoder M)

K ta konfetni N bolaga bo'lish, i-bola 0..a[i] ta oladi. `dp[i][j] = Σ dp[i-1][j-t]`, t = 0..a[i]. To'g'ridan-to'g'ri O(N·K²). Prefix sum bilan:

```java
long[] dp = new long[K + 1];
dp[0] = 1;
for (int i = 0; i < n; i++) {
    long[] pre = new long[K + 2];
    for (int j = 0; j <= K; j++) pre[j + 1] = (pre[j] + dp[j]) % MOD;
    for (int j = 0; j <= K; j++) {
        int lo = Math.max(0, j - a[i]);
        dp[j] = (pre[j + 1] - pre[lo] + MOD) % MOD;
    }
}
```

O(N·K).

## Monoton deque

`dp[i] = a[i] + max(dp[j])`, `i-k ≤ j < i`. Deque'da indekslarni saqlaymiz, ularning `dp` qiymatlari kamayuvchi:

```java
int[] dq = new int[n];
int h = 0, t = 0;
dp[0] = a[0];
dq[t++] = 0;
for (int i = 1; i < n; i++) {
    while (h < t && dq[h] < i - k) h++;
    dp[i] = a[i] + dp[dq[h]];
    while (h < t && dp[dq[t - 1]] <= dp[i]) t--;
    dq[t++] = i;
}
```

Har indeks deque'ga bir marta kiradi va bir marta chiqadi — O(n). (LeetCode **Jump Game VI**, **Constrained Subsequence Sum**.)

## Convex Hull Trick: Frog 3 (AtCoder Z)

`dp[j] = min over i<j: dp[i] + (h[j] - h[i])² + C`

Qavsni ochamiz:

`dp[j] = h[j]² + C + min( (-2h[i])·h[j] + (dp[i] + h[i]²) )`

Ichidagi ifoda — `y = m·x + b` to'g'ri chiziq: `m = -2h[i]`, `b = dp[i] + h[i]²`, `x = h[j]`. Demak kerak bo'lgan amallar: to'plamga chiziq qo'shish va berilgan x da minimal qiymatni so'rash.

**Li Chao tree** — x qiymatlari oralig'ida segment tree, har tugunda bitta chiziq. Qo'shish va so'rov O(log X). Faqat chiziq nuqtada hisoblanadi — kesishish nuqtalarini topishdagi katta ko'paytmalar (overflow) yo'q:

```java
static long[] M, B;
static boolean[] has;

static long f(int node, long x) { return M[node] * x + B[node]; }

static void add(int node, int lo, int hi, long m, long b) {
    if (!has[node]) { M[node] = m; B[node] = b; has[node] = true; return; }
    int mid = (lo + hi) >>> 1;
    boolean leftBetter = m * lo + b < f(node, lo);
    boolean midBetter = m * mid + b < f(node, mid);
    if (midBetter) {
        long tm = M[node], tb = B[node];
        M[node] = m;
        B[node] = b;
        m = tm;
        b = tb;
    }
    if (lo == hi) return;
    if (leftBetter != midBetter) add(2 * node, lo, mid, m, b);
    else add(2 * node + 1, mid + 1, hi, m, b);
}

static long query(int node, int lo, int hi, long x) {
    if (!has[node]) return Long.MAX_VALUE;
    long res = f(node, x);
    if (lo == hi) return res;
    int mid = (lo + hi) >>> 1;
    if (x <= mid) return Math.min(res, query(2 * node, lo, mid, x));
    return Math.min(res, query(2 * node + 1, mid + 1, hi, x));
}
```

> [!NOTE] Klassik deque'li CHT O(n) ishlaydi (qiyaliklar va so'rovlar monoton bo'lsa), lekin kesishishni solishtirishda `b·m` ko'paytmalar `long`dan chiqib ketishi mumkin. Java'da Li Chao xavfsizroq.

## D&C va Knuth — qisqacha

- **Divide & Conquer optimization**: `dp[i][j] = min_{k<j} (dp[i-1][k] + C(k+1, j))` va optimal `k` j bo'yicha monoton. j oralig'ining o'rtasi uchun optimal k ni topib, ikki yarmini mos k oraliqlarida rekursiv hal qilamiz. Har qatlam O(n log n).
- **Knuth optimization**: interval DP'da `opt[l][r-1] ≤ opt[l][r] ≤ opt[l+1][r]` bo'lsa, k ni faqat shu oraliqda qidirish O(n³) ni O(n²) ga tushiradi.

Ikkalasi uchun ham cost funksiyasi **quadrangle inequality** ga bo'ysunishi kerak. Musobaqada odatda: sodda DP yozib, kichik testlarda `opt` monotonligini tekshirib ko'riladi.

=====
---
id: l18
module: m14
week: 13
title: Musobaqada DP — strategiya va debug
mins: 50
viz:
problems:
goals: Cheklovlardan murakkablikni taxmin qilish | Tipik xatolarni tez topish | Brute force bilan stress test qilish
summary: Cheklov→murakkablik jadvali, xotira hisoblash, xatolar ro'yxati va stress test.
---

## Cheklovlar → murakkablik

Java'da 1 soniyada taxminan **10^8 oddiy amal** (massivga murojaat, qo'shish) bajariladi. Shunga qarab:

| n | Kutilgan murakkablik | Tipik DP |
|---|---|---|
| ≤ 12 | O(n!) | permutatsiyalar |
| ≤ 20 | O(2^n · n) | bitmask |
| ≤ 100 | O(n^4) | ko'p o'lchamli state |
| ≤ 500 | O(n³) | interval DP, Floyd |
| ≤ 5000 | O(n²) | LCS, 2D DP |
| ≤ 10^5–10^6 | O(n log n) / O(n) | 1D, LIS, CHT |
| ≤ 10^18 | O(log n) / raqamlar soni | digit DP, matritsa darajasi |

## Xotira

- `int` — 4 bayt, `long` — 8 bayt, `boolean` — 1 bayt.
- `int[5000][5000]` ≈ 100 MB. `long[5000][5000]` ≈ 200 MB.
- 256 MB limitda ~6·10^7 tadan ortiq `int` olmang.
- Java'da `int[n][2]` kabi ko'p mayda massivlar ortiqcha xotira oladi (har massivning sarlavhasi bor) — `int[2][n]` yaxshiroq.

## Tipik xatolar

| Xato | Belgisi | Tuzatish |
|---|---|---|
| Overflow | Manfiy yoki g'alati katta javob | `long`, `(long) a * b`, har qadamda `% MOD` |
| Noto'g'ri INF | `INF + x` manfiy bo'ladi | `INF = MAX_VALUE / 2` yoki `1e18` |
| Tsikl yo'nalishi | Knapsack'da buyum ko'p marta olinadi | 0/1 da teskari, unbounded'da to'g'ri |
| Base case | Javob 0 yoki 1 ga siljigan | `dp[0]` ma'nosini qayta o'qing |
| Off-by-one | `ArrayIndexOutOfBoundsException` | `n+1` o'lchamli massiv, 1-indeksatsiya |
| Manfiy mod | Javob manfiy | `(x % MOD + MOD) % MOD` |
| Memo belgisi | Javobi 0 bo'lgan holat qayta-qayta hisoblanadi | `-1` bilan to'ldiring, 0 bilan emas |
| StackOverflow | Katta testda Runtime Error | Iterativ yoki katta stackli `Thread` |
| Testlar orasida reset | Ko'p testli masalada 2-test xato | Har testda massivni qayta yarating |
| Locale | `0,5` chiqadi | `String.format(Locale.US, ...)` |

## Stress test

DP xatosini topishning eng ishonchli usuli — **brute force bilan solishtirish**. Hammasini bitta Java faylda qilish mumkin:

```java
import java.util.*;

public class Stress {
    static long solveDp(int[] a) {
        int n = a.length;
        long[] dp = new long[n + 1];
        dp[1] = a[0];
        for (int i = 2; i <= n; i++) dp[i] = Math.max(dp[i - 1], dp[i - 2] + a[i - 1]);
        return dp[n];
    }

    static long solveBrute(int[] a) {
        int n = a.length;
        long best = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if ((mask & (mask >> 1)) != 0) continue;
            long s = 0;
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) s += a[i];
            best = Math.max(best, s);
        }
        return best;
    }

    public static void main(String[] args) {
        Random rnd = new Random(1);
        for (int it = 0; it < 10000; it++) {
            int n = rnd.nextInt(8) + 1;
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rnd.nextInt(10) + 1;
            long x = solveDp(a), y = solveBrute(a);
            if (x != y) {
                System.out.println(Arrays.toString(a) + " dp=" + x + " brute=" + y);
                return;
            }
        }
        System.out.println("OK");
    }
}
```

Brute force — sekin, lekin aniq to'g'ri (bu yerda barcha qism-to'plamlarni sanash). Kichik tasodifiy testlar xatoni tez ochib beradi va eng kichik "buzuq" testni ko'rsatadi.

## Javobni tiklash (reconstruction)

Ko'p masalalar faqat sonni emas, yechimning o'zini so'raydi. Ikki usul:

1. **Parent massivi** — har holatda qaysi transition tanlanganini yozib boring (LIS'dagi `par`).
2. **Qayta yurish** — tayyor jadvaldan oxiridan boshlab "qaysi had tenglikni berdi?" deb tekshirib orqaga yuring (LCS, knapsack).

## Qotib qolganda: savollar ro'yxati

1. Brute force rekursiyani yoza olamanmi? Uning argumentlari nima?
2. Qaysi argumentlarni tashlab yuborsa bo'ladi (ular boshqalardan kelib chiqadi)?
3. Holatlar soni × transition cheklovga sig'adimi?
4. Sig'masa: kichik chegarali parametrni indeksga, kattasini qiymatga o'tkaza olamanmi?
5. Transition'ni prefix sum / deque / CHT bilan tezlashtirsa bo'ladimi?
6. "Oxirgi" amal haqida o'ylab ko'rdimmi (interval, burst balloons)?
7. Masalani teskari yo'nalishda (oxirdan) yechish osonmi?

## Keyingi qadamlar

- **AtCoder Educational DP Contest** — A dan Z gacha 26 masala; bu ilovadagi ko'p masalalar shu to'plamdan.
- **CSES Problem Set → Dynamic Programming** — 19 ta klassik masala.
- **Codeforces**: `dp` tegi, reyting 1400 → 2000 ga bosqichma-bosqich.
