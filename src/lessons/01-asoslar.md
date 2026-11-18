---
id: l01
module: m0
week: 1
title: Rekursiyadan memoizatsiyaga
mins: 40
viz: fib
problems: p01
goals: DP qachon kerakligini tushunish | Memoization bilan top-down yozish | Java'da stack va overflow tuzoqlarini bilish
summary: Fibonacci misolida takrorlanuvchi qism-masalalar, memo massiv va tabulation.
---

## DP nima?

**Dynamic Programming (DP)** — katta masalani kichik qism-masalalarga bo'lib, har bir qism-masalani **faqat bir marta** yechish va javobini saqlab qo'yish usuli. Keyingi safar o'sha qism-masala kerak bo'lsa, qayta hisoblamaymiz — tayyor javobni olamiz.

DP ishlashi uchun masalada ikki xususiyat bo'lishi kerak:

- **Overlapping subproblems** — bir xil qism-masala ko'p marta uchraydi.
- **Optimal substructure** — katta masalaning javobi kichik masalalar javoblaridan yig'iladi.

> [!NOTE] Qism-masalalar takrorlanmasa (masalan, merge sort), bu oddiy divide and conquer — DP emas.

## Sodda rekursiya: Fibonacci

`F(0) = 0`, `F(1) = 1`, `F(n) = F(n-1) + F(n-2)`.

```java
static long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
```

Muammo: `fib(5)` chaqirilsa, `fib(3)` ikki marta, `fib(2)` uch marta hisoblanadi. Chaqiruvlar soni taxminan `1.6^n` ga o'sadi: `fib(40)` uchun 300 milliondan ortiq chaqiruv.

## Memoization (top-down)

G'oya: har bir `fib(i)` javobini massivga yozib qo'yamiz. Hisoblashdan oldin massivni tekshiramiz.

```java
static long[] memo;

static long fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}

public static void main(String[] args) {
    int n = 90;
    memo = new long[n + 1];
    Arrays.fill(memo, -1);
    System.out.println(fib(n));
}
```

Endi har bir `i` faqat bir marta hisoblanadi: vaqt `O(n)`, xotira `O(n)`.

## Tabulation (bottom-up)

Rekursiyasiz: kichik holatlardan kattasiga qarab jadval to'ldiramiz.

```java
static long fib(int n) {
    if (n <= 1) return n;
    long[] dp = new long[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

## Space optimization

`dp[i]` faqat oxirgi ikki qiymatga bog'liq — butun massiv shart emas:

```java
static long fib(int n) {
    long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long c = a + b;
        a = b;
        b = c;
    }
    return a;
}
```

| Usul | Vaqt | Xotira |
|---|---|---|
| Sodda rekursiya | O(1.6^n) | O(n) stack |
| Memoization | O(n) | O(n) |
| Tabulation | O(n) | O(n) |
| 2 ta o'zgaruvchi | O(n) | O(1) |

## Java'ga xos tuzoqlar

- **Overflow.** `F(46)` hali `int`ga sig'adi, `F(47)` sig'maydi. `long` `F(92)`gacha yetadi. Undan katta bo'lsa — `mod 1_000_000_007`.
- **StackOverflowError.** Rekursiya chuqurligi taxminan 10^4–10^5 dan oshsa stack to'lib qoladi. CP'da yechim — katta stackli `Thread`:

```java
public static void main(String[] args) {
    new Thread(null, () -> {
        try { solve(); } catch (Exception e) { throw new RuntimeException(e); }
    }, "main", 1 << 27).start();
}
```

- **`long[]` va `Long[]`.** Primitive `long[]` + `-1` belgisi tezroq. `Long[]` + `null` qulay, lekin sekin va ko'p xotira oladi.
- **`HashMap` memo** holatlar siyrak (sparse) bo'lganda foydali, lekin massivdan 5–10 marta sekin.

## Qachon DP haqida o'ylash kerak?

Masala matnida quyidagilar bo'lsa:

- "nechta usul bilan…" (counting)
- "eng kichik / eng katta…" (optimization)
- "mumkinmi?" (feasibility)

va har qadamda bir nechta tanlov bo'lib, tanlov keyingi holatni belgilasa.

> [!TIP] Avval brute-force rekursiyani yozing. Keyin "qaysi argumentlar takrorlanadi?" deb so'rang — o'sha argumentlar DP holati (state) bo'ladi.

=====
---
id: l02
module: m0
week: 1
title: DP yechishning 5 qadami
mins: 45
viz: frog
problems: p02 | p03
goals: Har qanday DP'ni 5 qadamda tuzish | Push va pull uslublarini farqlash | Top-down va bottom-up'ni ongli tanlash
summary: State, transition, base case, tartib va javob — har bir DP uchun bitta retsept.
---

## Retsept

Har bir DP masalani shu 5 savol bilan yeching:

1. **State** — `dp[i]` aniq nimani bildiradi? Bir gap bilan yozing: "`dp[i]` — i-zinaga chiqish usullari soni".
2. **Transition** — `dp[i]` qaysi kichik holatlardan hosil bo'ladi? Odatda "oxirgi qadam nima bo'lgan?" deb so'raladi.
3. **Base case** — eng kichik holatlarning javobi.
4. **Order** — qaysi tartibda hisoblaymiz, shunda kerakli holatlar oldindan tayyor bo'ladi.
5. **Answer** — javob jadvalning qayerida: `dp[n]`, `max(dp)`, `dp[0][n-1]`…

> [!WARN] Eng ko'p xato 1-qadamda bo'ladi. State ma'nosi noaniq bo'lsa, transition ham noto'g'ri chiqadi.

## Misol 1: Climbing Stairs

n zinapoya bor, bir qadamda 1 yoki 2 zina chiqish mumkin. Necha xil usul bor?

1. `dp[i]` — aynan i-zinaga chiqish usullari soni.
2. Oxirgi qadam 1 zina bo'lsa i-1 dan, 2 bo'lsa i-2 dan keldik: `dp[i] = dp[i-1] + dp[i-2]`.
3. `dp[0] = 1` (hech narsa qilmaslik — 1 usul).
4. i = 1..n o'sish tartibida.
5. `dp[n]`.

```java
long[] dp = new long[n + 1];
dp[0] = 1;
for (int i = 1; i <= n; i++) {
    dp[i] = dp[i - 1];
    if (i >= 2) dp[i] += dp[i - 2];
}
```

## Misol 2: Frog 1 (minimal xarajat)

N ta tosh, balandliklari `h[i]`. Qurbaqa i-toshdan i+1 yoki i+2 ga sakraydi, xarajat `|h[i] - h[j]|`. Oxirgi toshga minimal xarajat?

- `dp[i]` — i-toshga yetib kelishning minimal xarajati.
- `dp[i] = min(dp[i-1] + |h[i]-h[i-1]|, dp[i-2] + |h[i]-h[i-2]|)`.
- `dp[0] = 0`.

```java
int[] dp = new int[n];
for (int i = 1; i < n; i++) {
    dp[i] = dp[i - 1] + Math.abs(h[i] - h[i - 1]);
    if (i >= 2) dp[i] = Math.min(dp[i], dp[i - 2] + Math.abs(h[i] - h[i - 2]));
}
System.out.println(dp[n - 1]);
```

## Pull va push

Yuqoridagi kod **pull** uslubi: `dp[i]` ni oldingi holatlardan "tortib" olamiz. **Push** uslubida tayyor `dp[i]` dan keyingi holatlarni yangilaymiz:

```java
int INF = Integer.MAX_VALUE / 2;
int[] dp = new int[n];
Arrays.fill(dp, INF);
dp[0] = 0;
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j <= Math.min(n - 1, i + 2); j++) {
        dp[j] = Math.min(dp[j], dp[i] + Math.abs(h[i] - h[j]));
    }
}
```

Push "i-holatdan qayerga borish mumkin" aniq bo'lganda qulay (masalan, Frog 2: 1..K qadam).

> [!TIP] `INF` uchun `Integer.MAX_VALUE` emas, `MAX_VALUE / 2` oling — aks holda `INF + cost` overflow bo'lib manfiy son chiqadi.

## Top-down yoki bottom-up?

| | Top-down (memo) | Bottom-up (tabulation) |
|---|---|---|
| Yozish | Rekursiyadan oson o'tiladi | Tartibni o'ylash kerak |
| Tezlik | Rekursiya overhead bor | Odatda tezroq |
| Faqat kerakli holatlar | Ha | Yo'q, hammasi |
| Stack xavfi | Bor | Yo'q |
| Space optimization | Qiyin | Oson |

CP'da: holatlar kam yoki tartib murakkab bo'lsa — top-down; n katta (10^5+) bo'lsa — bottom-up.

## Murakkablikni hisoblash

**Vaqt = holatlar soni × bitta holat uchun transition narxi.**

- Climbing stairs: n holat × O(1) = O(n).
- Frog 2: n holat × K = O(nK).
- Dice Combinations: n holat × 6 = O(6n).

=====
---
id: l03
module: m1
week: 2
title: 1D chiziqli DP
mins: 50
viz:
problems: p04 | p05
goals: "Prefiks" va "i bilan tugaydigan" state'larni farqlash | House Robber va Kadane | Decode Ways'da shartli transition
summary: House Robber, Kadane, Maximum Product va Decode Ways — 1D state'ning ikki ma'nosi.
---

## Ikki xil 1D state

1D DP'da `dp[i]` odatda ikki ma'nodan birini bildiradi:

- **Prefiks** — "birinchi i ta element uchun javob" (House Robber).
- **i bilan tugaydigan** — "aynan i-element bilan tugaydigan eng yaxshi javob" (Kadane, LIS).

Ikkinchi holatda yakuniy javob `max(dp[i])` bo'ladi, `dp[n-1]` emas.

## House Robber

Qatorda uylar, har birida `a[i]` pul. Qo'shni ikki uyni o'g'irlab bo'lmaydi. Maksimal summa?

`dp[i]` — dastlabki i ta uydan olinadigan maksimum. i-uy uchun ikki tanlov:

- olmaymiz: `dp[i-1]`
- olamiz: `dp[i-2] + a[i]`

```java
long[] dp = new long[n + 1];
dp[1] = a[0];
for (int i = 2; i <= n; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + a[i - 1]);
}
```

> [!TIP] `dp` massivini 1 ga siljitib (`n + 1` o'lcham) olish `i - 2 < 0` tekshiruvlaridan qutqaradi.

**Aylana variant** (uylar aylana bo'ylab): birinchi va oxirgi uy birga olinmaydi. Ikki marta hisoblang — `[0..n-2]` va `[1..n-1]` — kattasini oling.

## Kadane = DP

Maksimal summali subarray. `best[i]` — **aynan i da tugaydigan** maksimal summa:

`best[i] = max(a[i], best[i-1] + a[i])`

```java
long cur = a[0], ans = a[0];
for (int i = 1; i < n; i++) {
    cur = Math.max(a[i], cur + a[i]);
    ans = Math.max(ans, cur);
}
```

**Maximum Product Subarray**: manfiy son minimalni maksimalga aylantiradi, shuning uchun ikkita state saqlaymiz — maksimal va minimal ko'paytma.

```java
long mx = a[0], mn = a[0], ans = a[0];
for (int i = 1; i < n; i++) {
    long x = a[i];
    long p = mx * x, q = mn * x;
    mx = Math.max(x, Math.max(p, q));
    mn = Math.min(x, Math.min(p, q));
    ans = Math.max(ans, mx);
}
```

## Decode Ways

Harflar kodlangan: `A=1, B=2, …, Z=26`. Raqamlar satri berilgan — necha xil dekodlash mumkin?

`dp[i]` — dastlabki i ta belgining dekodlash soni.

- oxirgi bitta raqam (`s[i-1] != '0'`): `dp[i] += dp[i-1]`
- oxirgi ikkita raqam 10..26 oralig'ida: `dp[i] += dp[i-2]`

```java
long[] dp = new long[n + 1];
dp[0] = 1;
for (int i = 1; i <= n; i++) {
    if (s.charAt(i - 1) != '0') dp[i] += dp[i - 1];
    if (i >= 2) {
        int two = (s.charAt(i - 2) - '0') * 10 + (s.charAt(i - 1) - '0');
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
    }
    dp[i] %= MOD;
}
```

## "Oxirgi qadam" fikrlash usuli

1D masalada state topilmasa, o'zingizga savol bering: **"optimal javobda oxirgi element bilan nima bo'lgan?"** U olinganmi, olinmaganmi, nechta element bilan birlashganmi… Har bir variant — transition'ning bitta hadi.

## Frog 2 va K-qadam

Agar qadam 1..K bo'lsa: `dp[i] = min(dp[i-j] + |h[i]-h[i-j]|)`, j = 1..K. Vaqt O(nK). n·K ≤ 10^8 bo'lsa Java'da odatda o'tadi.
