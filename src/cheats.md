## Fast I/O (CP shabloni)

```java
import java.util.*;
import java.io.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    static int ni() throws IOException { return Integer.parseInt(next()); }
    static long nl() throws IOException { return Long.parseLong(next()); }

    public static void main(String[] args) throws IOException {
        int n = ni();
        StringBuilder out = new StringBuilder();
        out.append(n).append('\n');
        System.out.print(out);
    }
}
```

Ko'p qatorli javobni `StringBuilder`ga yig'ib, oxirida bitta `print` qiling — `System.out.println` ni 10^5 marta chaqirish sekin.

## Memo (top-down)

```java
static long[][] memo;

static long go(int i, int j) {
    if (i == n) return 0;
    if (memo[i][j] != -1) return memo[i][j];
    long res = 0;
    // transition'lar
    return memo[i][j] = res;
}

// main ichida:
memo = new long[n + 1][m + 1];
for (long[] row : memo) Arrays.fill(row, -1);
```

## Katta stack bilan ishga tushirish

```java
public static void main(String[] args) {
    new Thread(null, () -> {
        try { solve(); } catch (IOException e) { throw new RuntimeException(e); }
    }, "solve", 1 << 27).start();
}
```

`1 << 27` = 128 MB stack — chuqurligi 10^6 gacha rekursiya uchun yetadi.

## Knapsack tsikllari

```java
for (int i = 0; i < n; i++)
    for (int c = W; c >= w[i]; c--)
        dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);

for (int i = 0; i < n; i++)
    for (int c = w[i]; c <= W; c++)
        dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
```

Birinchisi — 0/1 (teskari), ikkinchisi — unbounded (to'g'ri yo'nalish).

## Coin change: ikki xil sanash

```java
for (int s = 1; s <= x; s++)
    for (int c : coins)
        if (c <= s) dp[s] = (dp[s] + dp[s - c]) % MOD;

for (int c : coins)
    for (int s = c; s <= x; s++)
        dp[s] = (dp[s] + dp[s - c]) % MOD;
```

Birinchisi — permutatsiyalar (tartib muhim), ikkinchisi — kombinatsiyalar.

## LIS O(n log n)

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
```

Non-decreasing uchun: `tails[mid] <= x`.

## Ikki satr (LCS shabloni)

```java
int[][] dp = new int[n + 1][m + 1];
for (int i = 1; i <= n; i++)
    for (int j = 1; j <= m; j++)
        dp[i][j] = s.charAt(i - 1) == t.charAt(j - 1)
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
```

## Interval DP

```java
for (int len = 2; len <= n; len++)
    for (int l = 0; l + len - 1 < n; l++) {
        int r = l + len - 1;
        dp[l][r] = INF;
        for (int k = l; k < r; k++)
            dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r] + cost(l, r));
    }
```

## Bitmask

```java
for (int mask = 0; mask < (1 << n); mask++)
    for (int v = 0; v < n; v++) {
        if ((mask >> v & 1) == 0) continue;
        for (int u = 0; u < n; u++) {
            if ((mask >> u & 1) == 1) continue;
            int nm = mask | (1 << u);
            dp[nm][u] = Math.min(dp[nm][u], dp[mask][v] + cost[v][u]);
        }
    }

for (int s = mask; s > 0; s = (s - 1) & mask) { }
```

## Digit DP

```java
static long go(int pos, int state, boolean tight) {
    if (pos == len) return good(state) ? 1 : 0;
    if (!tight && memo[pos][state] != -1) return memo[pos][state];
    int lim = tight ? num.charAt(pos) - '0' : 9;
    long res = 0;
    for (int d = 0; d <= lim; d++)
        res += go(pos + 1, next(state, d), tight && d == lim);
    res %= MOD;
    if (!tight) memo[pos][state] = res;
    return res;
}
```

## Daraxt: iterativ post-order

```java
int[] order = new int[n], par = new int[n], stk = new int[n];
int top = 0, cnt = 0;
stk[top++] = 0;
par[0] = -1;
while (top > 0) {
    int v = stk[--top];
    order[cnt++] = v;
    for (int u : adj[v]) if (u != par[v]) { par[u] = v; stk[top++] = u; }
}
for (int k = n - 1; k >= 0; k--) {
    int v = order[k];
    // bolalar tayyor: dp[v] ni hisoblang
}
```

## MOD yordamchilari

```java
static final long MOD = 1_000_000_007L;

static long add(long a, long b) { return (a + b) % MOD; }
static long sub(long a, long b) { return ((a - b) % MOD + MOD) % MOD; }
static long mul(long a, long b) { return a % MOD * (b % MOD) % MOD; }

static long pow(long b, long e) {
    long r = 1;
    b %= MOD;
    for (; e > 0; e >>= 1, b = b * b % MOD) if ((e & 1) == 1) r = r * b % MOD;
    return r;
}

static long inv(long a) { return pow(a, MOD - 2); }
```

## Factorial va C(n, k)

```java
long[] fact = new long[N + 1], inv = new long[N + 1];
fact[0] = 1;
for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
inv[N] = pow(fact[N], MOD - 2);
for (int i = N; i > 0; i--) inv[i - 1] = inv[i] * i % MOD;

static long C(int n, int k) {
    if (k < 0 || k > n) return 0;
    return fact[n] * inv[k] % MOD * inv[n - k] % MOD;
}
```

## Ko'p uchraydigan konstantalar

| Nima | Qiymat |
|---|---|
| `int` max | 2 147 483 647 ≈ 2.1·10^9 |
| `long` max | ≈ 9.2·10^18 |
| Xavfsiz INF (`int`) | `Integer.MAX_VALUE / 2` |
| Xavfsiz INF (`long`) | `Long.MAX_VALUE / 4` yoki `(long) 1e18` |
| MOD | `1_000_000_007` yoki `998_244_353` |
| 1 soniyada (Java) | ~10^8 oddiy amal |
