# Railway'ga deploy qilish

Foto nazorati serverini Railway'da xostlash bo'yicha qisqa qo'llanma.

## Ma'lumot (baza) qayerda saqlanadi?

 Asosiy ishchi baza — JSON fayllar. Railway'da PostgreSQL mirror ham qo'shilgan,
 ammo hozircha o'qish va asosiy yozuvlar JSONdan amalga oshadi. Bu rollbackni
 xavfsiz va sodda saqlaydi.

| Ma'lumot | Fayl / papka |
|---|---|
| Review belgilari (minus/OK) | `outputs/lmj_review_marks.json` |
| Sabablar | `outputs/lmj_review_reasons.json` |
| Yig'ilgan datasetlar | `outputs/*_raw.json` + `outputs/lmj_review_datasets.json` |
| Tabel | `data/attendance/` |
| Brendlar | `config/brands.json` |
| Telegram sessiyalari | `outputs/lmj_telegram_*.json` |

Railway'da bularning **hammasi `DATA_DIR` (Volume) ichida** saqlanadi. Volume — deploy'lar
va qayta ishga tushirishlar orasida **saqlanib qoladigan** disk. Volume'siz har deploy'da
ma'lumot o'chadi — shuning uchun Volume ulash **shart**.

## Boshqa serverga ko'chish (masalan 1 oydan keyin)

Baza PostgreSQL bo'lmagani uchun ko'chirish oddiy — **fayllarni nusxalash**:

1. Railway'da Volume papkasidagi (`/data`) barcha fayllarni yuklab oling
   (Railway CLI: `railway volume` yoki dashboard orqali; yoki server ichidan
   Excel/backup eksport qiling).
2. Yangi serverda `DATA_DIR` papkasiga o'sha fayllarni joylashtiring.
3. Server ishga tushadi — hammasi joyida. Migratsiya/dump kerak emas.

## Backup va PostgreSQL mirror

- Server `/data/data/backups/review-snapshots/` ichida kunlik gzip snapshot yaratadi.
  Har fayl SHA-256 bilan tekshiriladi; faqat oxirgi 7 snapshot saqlanadi.
- Backup Volume ichida turadi — operator xatosi yoki noto'g'ri deploydan tiklashga
  yordam beradi. Volume butunlay yo'qolishiga qarshi alohida tashqi backup (S3/R2)
  keyingi alohida ish sifatida kerak bo'ladi.
- `POSTGRES_MIRROR_WRITES=1` bo'lsa minus, sabab va brend o'zgarishlari JSONdan
  keyin PostgreSQLga ham yoziladi. PostgreSQL xatosi paneldagi saqlashni to'xtatmaydi.
- Mirrorni qayta tekshirish: Railway service ichida `node scripts/db-sync-from-json.mjs`.
  Bu PostgreSQL mirrorini JSONdan qayta yaratadi; JSON fayllarga tegmaydi.
- Tez rollback: `POSTGRES_MIRROR_WRITES=0` qilib redeploy qiling. Ilova JSON bilan
  avvalgidek ishlashda davom etadi.

---

## Deploy qadamlari (Railway dashboard)

### 1. Loyihani ulash
- [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**
- `XurshidshoX007/salesphotoreview` reposini tanlang

### 2. Volume qo'shish (MUHIM — ma'lumot saqlanishi uchun)
- Service → **Variables** yonidagi **Volume** → **Add Volume**
- Mount path: **`/data`**

### 3. Muhit o'zgaruvchilari (Variables)
Quyidagilarni qo'shing:

| O'zgaruvchi | Qiymat | Izoh |
|---|---|---|
| `DATA_DIR` | `/data` | Volume mount path (2-qadam bilan bir xil) |
| `COLLECT_MODE` | `http` | Brauzersiz yig'ish |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` | Chromium yuklab olinmaydi (kerak emas) |
| `REVIEW_ACCESS_PIN` | `<yangi PIN>` | Panelga kirish paroli |
| `SALES_USERNAME` | `<sales login>` | Avto-login |
| `SALES_PASSWORD` | `<sales parol>` | Avto-login |
| `TELEGRAM_BOT_TOKEN` | `<YANGI token>` | Botni BotFather'da yangilang! |
| `TELEGRAM_CHAT_ID` | `<chat id>` | Ixtiyoriy |
| `REVIEW_BACKUP_AUTO` | `1` | Kunlik tekshirilgan backupni yoqadi |
| `REVIEW_BACKUP_RETENTION_DAYS` | `7` | Saqlanadigan snapshotlar soni |
| `POSTGRES_MIRROR_WRITES` | `1` | PostgreSQL mirror yozuvlarini yoqadi |

> `PORT` va `HOST` ni qo'lda qo'ymang — Railway `PORT` ni o'zi beradi, server
> Railway muhitida avtomatik `0.0.0.0` ga bog'lanadi.

### 4. Deploy
- Railway avtomatik build qiladi (`npm install` → `npm start`) va URL beradi.
- URL'ni oching → PIN so'raydi → kiring.

---

## Muhim ogohlantirishlar

1. **Tokenlarni almashtiring** — eski `.env`/`.env.local` yoki terminal chiqishida
   qolgan maxfiy qiymatlarni xavfsiz deb hisoblamang. BotFather tokeni, Sales paroli,
   `REVIEW_ACCESS_PIN` va session secretni yangilang.
2. **IP bloki xavfi** — Sales O'zbekiston tizimi, Railway serverlari chet elda.
   Sales chet el IP'sini bloklashi yoki captcha so'rashi mumkin. Birinchi
   yig'ishda tekshiring; ishlamasa gibrid rejimga o'tamiz (yig'ish lokalda,
   panel serverda).
3. **Boshlang'ich ma'lumot** — Volume bo'sh boshlanadi (brendlardan tashqari,
   ular avtomatik ko'chiriladi). Mavjud review belgilari/datasetlarni ko'chirish
   uchun ularni `/data` ga qo'lda yuklang yoki serverda qaytadan yig'ing.
