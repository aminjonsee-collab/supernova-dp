# Katak — Java DP

Java'da Dynamic Programming'ni noldan musobaqa darajasigacha o'rganish uchun offline ilova.
Hech qanday tashqi so'rov yo'q: shriftlar, darslar, masalalar va kod — hammasi ichida.

## Ichida nima bor

- **18 ta dars** (15 modul): memoization → 1D → grid → knapsack → LIS/LCS → satr → interval → state machine → bitmask → digit → tree → DAG → ehtimollik → optimizatsiyalar (prefix sum, deque, CHT/Li Chao) → musobaqa strategiyasi.
- **32 ta masala** (AtCoder DP, CSES, LeetCode klassikalari): shart, misollar, 3 bosqichli hint, g'oya, to'liq Java yechim. Barcha yechimlar misollarda sinalgan.
- **Work item board** (Azure DevOps / Jira uslubida): 114 ta avtomatik work item, 13 ta sprint, story points, acceptance criteria, burndown, drag & drop, o'z work item'laringiz.
- **Vizualizator**: 9 ta DP jadvali qadam-baqadam (Fibonacci, Frog, Grid, Knapsack, Coin Change, LIS, LCS, Edit Distance, interval DP).
- **Test**: 79 ta savol, 5 ballik baho, xatolar tahlili.
- **Kartalar**: 53 ta flashcard, Leitner tizimi.
- **Shablonlar**: Java CP shablonlari + "Qaysi DP pattern?" topuvchi.
- Fokus taymer (25/5), faollik xaritasi, qidiruv (Ctrl K), kunduzgi/tungi mavzu, JSON eksport/import.

Progress avtomatik bog'lanadi: masalani "Yechdim" desangiz — tegishli work item Done bo'ladi; dars testida ≥ 80% — test work item'i Done; barcha mezonlar belgilansa — item Done.

## GitHub Pages'ga joylash

1. GitHub'da yangi public repo oching, masalan `katak`.
2. Arxivdagi `katak/` papka **ichidagi** barcha fayl va papkalarni repo ildiziga yuklang (Add file → Upload files, sudrab tashlash mumkin). `index.html` repo ildizida turishi kerak.
3. Settings → Pages → Source: **Deploy from a branch**, Branch: `main`, papka: `/ (root)` → Save.
4. 1–2 daqiqadan keyin: `https://aminjonsee-colab.github.io/katak/` (foydalanuvchi nomi va repo nomi sizniki bo'ladi).

Telefonga (Android, Chrome): saytni oching → ⋮ menyu → **Ilovani o'rnatish** / **Bosh ekranga qo'shish**. Birinchi ochilishdan keyin internetsiz ham ishlaydi.

## Kompyuterda lokal ishlatish

`index.html` ni brauzerda oching — hammasi ishlaydi (faqat "o'rnatish" funksiyasi https talab qiladi).
Yoki papka ichida: `python -m http.server 8000` → http://localhost:8000

## Ma'lumotlar

Progress faqat shu brauzerning localStorage'ida saqlanadi. Telefon va kompyuter orasida o'tkazish: Sozlamalar → JSON eksport → boshqa qurilmada JSON import.

## Kontentni tahrirlash (ixtiyoriy)

Darslar `src/lessons/*.md`, masalalar `src/problems/*.md`, shablonlar `src/cheats.md` da. O'zgartirgandan keyin (Node.js kerak):

```
node tools/build.js
```

Bu `js/data/content.js` ni qayta yaratadi va `sw.js` kesh versiyasini yangilaydi (telefondagi ilova yangi versiyani o'zi oladi).
Test savollari va kartalar — `js/data/extra.js`.

Java yechimlarni misollarda tekshirish (JDK kerak):

```
node tools/build.js --dump-java
node tools/test-java.js
```

## Fayllar

```
index.html             ilova
manifest.webmanifest   PWA
sw.js                  offline kesh
css/app.css
js/app.js              UI, board, test, kartalar
js/viz.js              vizualizatorlar
js/md.js               markdown + Java highlight
js/data/content.js     darslar va masalalar (build natijasi)
js/data/extra.js       test, kartalar, patternlar
fonts/                 Onest, JetBrains Mono, Caveat (OFL litsenziyasi)
icons/
src/                   darslar va masalalar manbasi (.md)
tools/                 build va test skriptlari
```
