# Railway'ga deploy qilish

Foto nazorati serverini Railway'da xostlash bo'yicha qisqa qo'llanma.

## Ma'lumot (baza) qayerda saqlanadi?

Bu dasturning "bazasi" — oddiy JSON fayllar (PostgreSQL emas):

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

> Maslahat: har kuni avtomatik backup (zip → Telegram) qo'shsak, ko'chish yanada oson
> bo'ladi va falokat sug'urtasi ham bo'ladi. (keyingi qadam)

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

> `PORT` va `HOST` ni qo'lda qo'ymang — Railway `PORT` ni o'zi beradi, server
> Railway muhitida avtomatik `0.0.0.0` ga bog'lanadi.

### 4. Deploy
- Railway avtomatik build qiladi (`npm install` → `npm start`) va URL beradi.
- URL'ni oching → PIN so'raydi → kiring.

---

## Muhim ogohlantirishlar

1. **Tokenlarni almashtiring** — eski `.env`/`.env.local` git tarixida qolgan.
   Deploy'dan oldin bot token (BotFather) va Sales parolni yangilang.
2. **IP bloki xavfi** — Sales O'zbekiston tizimi, Railway serverlari chet elda.
   Sales chet el IP'sini bloklashi yoki captcha so'rashi mumkin. Birinchi
   yig'ishda tekshiring; ishlamasa gibrid rejimga o'tamiz (yig'ish lokalda,
   panel serverda).
3. **Boshlang'ich ma'lumot** — Volume bo'sh boshlanadi (brendlardan tashqari,
   ular avtomatik ko'chiriladi). Mavjud review belgilari/datasetlarni ko'chirish
   uchun ularni `/data` ga qo'lda yuklang yoki serverda qaytadan yig'ing.
