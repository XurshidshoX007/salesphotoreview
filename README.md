# LMJ foto nazorati

Sales sahifasidan foto hisobot ma'lumotlarini yig'ish, ko'rib chiqish va minus ro'yxatini yuritish uchun lokal dastur.

## Eng oson ishga tushirish

1. **`1-YIGISH-02-06.bat`** faylini oching.
2. Kerakli sanani kiriting. Bo'sh qoldirilsa, kechagi sana olinadi.
3. Brauzer ochilganda kerak bo'lsa Salesga login qiling.
4. Ma'lumot yig'ish tugagach **`2-REVIEW.bat`** faylini oching.
5. Brauzerda foto nazorati sahifasi ochiladi.

Cloudflare orqali hamkasblar ishlatganda review panel public link orqali ochiladi. **Ma'lumot yig'ish** bosilganda Sales brauzeri server kompyuterida ochiladi va shu kompyuterdagi saqlangan login sessiyasidan foydalanadi.

Sales login oynasi chiqsa avtomatik kirishi uchun `.env.local` ichiga quyidagilarni yozing:

```env
SALES_USERNAME=your_sales_login
SALES_PASSWORD=your_sales_password
```

Haqiqiy login/parolni kodga yoki README ichiga yozmang. `.env.local` gitga qo'shilmaydi.

## Terminal orqali ishga tushirish

Bog'liqliklarni qayta o'rnatish:

```powershell
npm.cmd ci
npx.cmd playwright install
```

```powershell
npm run collect -- 2026-06-03
npm run collect -- 2026-06-03 lalaku_mama
npm run collect -- 2026-06-03 sof
npm run review
```

Yig'ish tezligi uchun asosiy sozlamalar `.env.local` ichida boshqariladi:

```env
COLLECT_CONCURRENCY=12
COLLECT_FLUSH_EVERY=25
COLLECT_ORDER_PREFETCH=1
SALES_API_TIMEOUT_MS=45000
```

`COLLECT_CONCURRENCY` juda oshirilsa Sales serveri sekin javob berishi mumkin; odatda 12 xavfsiz boshlang'ich qiymat.

Review sahifasi:

```text
http://127.0.0.1:8765/lmj_date_photo_review.html
```

## Hamkasblar uchun public link

Ishxona kompyuteri vaqtincha server bo'lib ishlaganda Cloudflare tunnel orqali hamkasblarga link berish mumkin.

Eng oson ishga tushirish:

1. **`3-PUBLIC-LINK-CLOUDFLARE.bat`** faylini oching.
2. Oynada chiqqan linkni hamkasblarga yuboring.
3. Oynani yopmang; kompyuter yoniq va internet bor bo'lsa link ishlaydi.

Script review serverni o'zi tekshiradi. Server o'chiq bo'lsa `127.0.0.1:8765` portda fon rejimida ishga tushiradi. Public linkga `access` token avtomatik qo'shiladi, shuning uchun oddiy URL topgan odam token bo'lmasa kira olmaydi.

Vaqtinchalik link:

- `CLOUDFLARE_TUNNEL_TOKEN` bo'sh bo'lsa Cloudflare `trycloudflare.com` link beradi.
- Bu link kompyuter yoki tunnel qayta ishga tushsa o'zgarishi mumkin.

Doimiy link:

1. Cloudflare Zero Trust dashboardda Tunnel yarating.
2. Public hostname sifatida masalan `foto-nazorat.example.com` ni `http://127.0.0.1:8765` ga ulang.
3. Tunnel token va hostname ni `.env.local` ichiga yozing:

```env
CLOUDFLARE_TUNNEL_TOKEN=cloudflare_tunnel_token_here
CLOUDFLARE_PUBLIC_URL=https://foto-nazorat.example.com
```

Keyin **`3-PUBLIC-LINK-CLOUDFLARE.bat`** doimiy linkni chiqaradi.

Xavfsizlik eslatmasi:

- `.env.local` gitga qo'shilmaydi va tokenlar shu yerda saqlanadi.
- Link ichidagi `access` tokenni faqat kerakli odamlarga yuboring.
- Ish tugaganda tunnel oynasini yopsangiz tashqi kirish to'xtaydi.

## Brend sozlamalari

Brendlar `config/brands.json` faylida saqlanadi. Har bir brendda `id`, `name`, Salesdagi nomlar (`salesBrandNames`) va agent kod prefikslari (`agentPrefixes`) bo'ladi.

```powershell
npm run brands:list
npm run brands:validate
npm run brands:add -- --id nestle --name "Nestle" --sales "Nestle,NESTLE" --prefix "NS,NT"
npm run brands:edit -- --id nestle --prefix "NS,NT,NST"
```

Eski nomlar ham ishlaydi:

```powershell
npm run collect -- 2026-06-03 "Lalaku mama"
npm run collect -- 2026-06-03 SOF
```

Review oynasida chap menyudan **Brend sozlamalari** tugmasi orqali brend qo'shish, tahrirlash, o'chirish, import/export qilish va validatsiyadan o'tkazish mumkin. Saqlashdan oldin config tekshiriladi, eski `brands.json` esa `config/backups/` ichiga backup qilinadi.

Agentlar ro'yxatidagi **Mos agentlar / Mos kelmagan agentlar / Barchasi** filtri tanlangan brend prefixlariga mos kelmaydigan agentlarni alohida ko'rishga yordam beradi.

## Asosiy ish jarayoni

- Fotolarni ko'rib chiqing.
- Talabga javob bermagan fotoni **Minus** sifatida saqlang.
- Sababni belgilang va kerak bo'lsa qo'shimcha izoh yozing.
- **Minus ro'yxati** orqali saqlangan fotolarni ko'ring.
- Telegramga yuborishni hozircha qo'lda, kerakli fotolar tanlangandan keyin bajaring.

## Sabablar katalogi

- Ish vaqtidan tashqari olingan foto
- Kamera yopilgan yoki to'sib olingan foto
- Bitta do'kondan takroriy foto
- Ekrandan qayta olingan foto
- Katalogdan olingan rasm
- Faqat mahsulot rasmi
- Foto talabga javob bermaydi

## Telegram sozlamasi

1. BotFather orqali bot yarating va bot token oling.
2. Botni kerakli Telegram guruhga qo'shing.
3. `.env.example` fayldan nusxa olib `.env` yarating:

```powershell
copy .env.example .env
```

4. `.env` ichiga token va guruh ID yozing:

```env
TELEGRAM_BOT_TOKEN=1234567890:bot_token_here
TELEGRAM_CHAT_ID=-1001234567890
```

## Eksport

- **Excel**: minus qilingan fotolar bo'yicha hisobot.
- **Agent Excel**: agentlar bo'yicha foto hisobot va yakuniy ko'rsatkichlar.

## Tabel / Ish kuni nazorati

Tabel ma'lumotlari `data/attendance/` ichida saqlanadi:

- `employees.json` - xodimlar
- `routes.json` - doimiy agent/marshrut kodlari
- `assignments.json` - xodim qaysi sanadan qaysi sanagacha agent kodda ishlagani
- `settings.json` - 20+, 19s, shtraf, Vacant va SVR qoidalari
- `months/YYYY-MM.json` - Sales/foto outputlardan generatsiya qilingan oylik tabel snapshot
- `overrides/YYYY-MM.json` - qo'lda kiritilgan kunlik qiymatlar
- `audit-log.json` - manual override tarixi

Agent kodi xodimniki emas, doimiy route kodi hisoblanadi. Xodim almashganda eski assignment `endDate` bilan yopiladi va yangi assignment ochiladi; eski xodim tarixi ustidan yozilmaydi.

Qoidalar:

- `20+` foto - ish kuni
- `19` foto va savdo summasi `1 000 000` dan katta bo'lsa - `19s`, sababli ish kuni
- `0-19` foto - foto kamligi
- har 3 ta foto kamligiga 1 ta shtraf
- `Vacant` ish kuni, foto kamligi va shtrafga kirmaydi
- `K`, `k`, `b` markerlari yangi tabelda ishlatilmaydi va invalid hisoblanadi
- SVR uchun `data/attendance/settings.json` ichidagi `teams` xaritasi kerak; agent activity bo'lsa SVR kuni `1`, bo'lmasa `0`

CLI:

```powershell
npm run attendance:generate -- 2026-06 sof
npm run attendance:export -- 2026-06 sof
npm run attendance:validate
npm run attendance:list -- 2026-06 sof
```

CSV export `outputs/attendance-2026-06-sof.csv` ko'rinishida yoziladi.

Review oynasida yuqoridagi **Tabel** tab orqali Excelga o'xshash jadval ochiladi. Kun kataklari qo'lda tahrirlanadi; auto qiymat saqlanib qoladi, manual qiymat esa override sifatida yoziladi va `audit-log.json` ga tushadi. **Xodim almashtirish** tugmasi eski assignmentni yopib, yangi xodim va yangi assignment yaratadi.

## Avto-tekshiruvni baholash

`data/labels.csv` ichidagi belgilangan samplelar bo'yicha qoidaviy avto-tekshiruvni baholash:

```powershell
npm run eval:auto-review
```

Natija `outputs/auto_review_eval.json` va `outputs/auto_review_eval_details.csv` fayllariga yoziladi.

## Eslatma

`outputs/lmj_review_marks.json` fayli minus belgilari va izohlarni saqlaydi. Bu faylni qo'lda o'zgartirmaslik tavsiya etiladi.
