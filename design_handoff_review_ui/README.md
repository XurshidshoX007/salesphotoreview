# Handoff: Foto nazorati — Review UI qayta disayni

## Overview

`salesphotoreview` loyihasining review interfeysi qayta disayn qilindi. Asosiy maqsad: **foto ko‘rish** qadamini tezlashtirish va tushunarli qilish. Uchta tub o‘zgarish:

1. **Foto katta bo‘ldi** — 360px dan 614px ga (1 foto rejimi), grid rejimida 4 ustunli vertikal joylashuv.
2. **OK tugmasi olib tashlandi** — to‘g‘ri fotoga hech narsa bosilmaydi, faqat minuslar kiritiladi.
3. **Qaytarish qo‘shildi** — adashib minus bosilganda Ctrl+Z bilan qaytariladi.

Qo‘shimcha: ma‘lumot yig‘ish alohida oynadan olib tashlandi, takroriy fotoni taqqoslash ekrani va Ctrl+K tezkor qidiruv qo‘shildi.

## About the Design Files

Bu to‘plamdagi fayllar — **HTML da yaratilgan disayn referenslari**. Ular ko‘rinish va xatti-harakatni ko‘rsatuvchi prototiplar, ishlab chiqarishga tayyor kod emas. Vazifa — bu disaynlarni **mavjud kodbazaning o‘z muhitida qayta yaratish**.

Bu loyihada muhit allaqachon aniq: `outputs/review-ui/` ichida oddiy HTML + vanilla JS + CSS. React yoki boshqa framework kiritish **kerak emas**. Mavjud tuzilishga moslashib ishlang.

## Fidelity

**High-fidelity.** Barcha ranglar, o‘lchamlar, radiuslar, soyalar va shriftlar yakuniy. Quyidagi qiymatlarni aynan ishlatish kerak.

---

## Kodbaza tuzilishi va ishlash tartibi

### Muhim: studio.css — vizual qatlam

`outputs/review-ui/styles/studio.css` faylining boshida yozilgan:

```
Studio UI v65
Visual-only layer. Functional ids preserved.
```

Bu fayl `!important` bilan HTML tuzilishini o‘zgartirmasdan faqat ko‘rinishni qayta bo‘yaydi. **Ishning ~70% i shu faylda bajariladi** — `app.js` ga tegmasdan.

`index.html` dagi element `id` lari va `app.js` dagi hodisa ulanishlari **o‘zgarmasligi kerak**. Ular funksional shartnoma.

### Ish tartibi (shu ketma-ketlikda bajaring)

| Bosqich | Nima | Fayl | Xavf |
| --- | --- | --- | --- |
| 1 | Dizayn tokenlari va vizual sayqal | `styles/studio.css` → v66 | Past |
| 2 | OK tugmasini olib tashlash + qaytarish | `js/app.js` + `studio.css` | O‘rta |
| 3 | 4 ustunli vertikal grid | `js/app.js` + `studio.css` | O‘rta |
| 4 | Suzuvchi pastki panel | `js/app.js` + `studio.css` | O‘rta |
| 5 | Ma‘lumot yig‘ish chizig‘i | `js/app.js` | O‘rta |
| 6 | Ctrl+K qidiruv | yangi `js/palette.js` | Yuqori |
| 7 | Taqqoslash ekrani | yangi `js/compare.js` | Yuqori |

Har bosqichdan keyin to‘xtab tekshiring. 1–3 bosqich eng katta foyda beradi.

---

## Design Tokens

Bu qiymatlarni `studio.css` ning `:root` blokiga CSS o‘zgaruvchilari sifatida qo‘shing. Mavjud `--studio-*` nomlash tartibini saqlang.

### Ranglar — asos

| Token | Qiymat | Ishlatilishi |
| --- | --- | --- |
| `--studio-bg` | `#f6f8f9` | Sahifa foni (yorug‘ ekranlar) |
| `--studio-surface` | `#ffffff` | Kartalar, panellar, menyu |
| `--studio-surface-soft` | `#fafcfd` | Input foni, ikkilamchi maydonlar |
| `--studio-surface-tint` | `#f6f9fa` | Jadval sarlavhasi, eslatma bloklari |
| `--studio-border` | `#e0e7ec` | Input va tugma chegarasi |
| `--studio-border-soft` | `#e8eef2` | Karta chegarasi |
| `--studio-hairline` | `#eff3f6` | Ichki ajratgichlar |
| `--studio-rule` | `#f2f6f8` | Jadval qator ajratgichi |

### Ranglar — matn

| Token | Qiymat | Ishlatilishi |
| --- | --- | --- |
| `--studio-text` | `#17212b` | Sarlavha, asosiy matn |
| `--studio-text-body` | `#3a4855` | Oddiy matn |
| `--studio-text-muted` | `#7d8a96` | Ikkilamchi matn |
| `--studio-text-faint` | `#93a1ac` | Kichik sarlavhalar, izohlar |
| `--studio-text-nav` | `#5d6b78` | Nofaol menyu |

### Ranglar — brend va holat

| Token | Qiymat | Ishlatilishi |
| --- | --- | --- |
| `--studio-accent` | `#0f8f88` | Asosiy amal, progress |
| `--studio-accent-deep` | `#0a6d69` | Faol menyu matni |
| `--studio-accent-wash` | `#e6f4f2` | Faol menyu foni |
| `--studio-accent-glow` | `rgba(15,143,136,.30)` | Asosiy tugma soyasi |
| `--studio-danger` | `#d63a48` | Minus tugmasi foni |
| `--studio-danger-deep` | `#c02b39` | Minus hover, minus matni |
| `--studio-danger-wash` | `#fff5f6` | Ikkilamchi minus foni |
| `--studio-danger-line` | `#f0bfc4` | Ikkilamchi minus chegarasi |
| `--studio-danger-glow` | `rgba(207,51,65,.32)` | Minus tugma soyasi |
| `--studio-warn` | `#e09b2d` | Ogohlantirish nuqtasi |
| `--studio-warn-wash` | `#fff7eb` | Ogohlantirish foni |
| `--studio-warn-text` | `#8a4c08` | Ogohlantirish matni |
| `--studio-ok` | `#3fae7a` | Server holati, tayyor |
| `--studio-ok-wash` | `#edf8f1` | Tayyor holat foni |
| `--studio-ok-text` | `#168044` | Tayyor holat matni |

### Ranglar — quyuq sahna (foto ko‘rish)

| Token | Qiymat | Ishlatilishi |
| --- | --- | --- |
| `--stage-bg` | `#232a31` | Sahna asosi |
| `--stage-gradient` | `radial-gradient(120% 90% at 50% 42%,#2b333b 0%,#232a31 55%,#1d242a 100%)` | Foto ortidagi yorug‘lik |
| `--stage-chrome` | `#1a2026` | Pastki band, karta poyi |
| `--stage-chrome-line` | `#2b343c` | Quyuq chegara |
| `--stage-text` | `#eef3f6` | Quyuq fonda sarlavha |
| `--stage-text-muted` | `#8e9ca7` | Quyuq fonda ikkilamchi |
| `--stage-text-soft` | `#c3ced6` | Quyuq fonda tugma matni |
| `--stage-fill` | `rgba(255,255,255,.10)` | Quyuq fonda tugma foni |
| `--stage-fill-soft` | `rgba(255,255,255,.08)` | Quyuq fonda yengil tugma |
| `--photo-placeholder` | `repeating-linear-gradient(135deg,#3a434c 0 10px,#424c56 10px 20px)` | Foto o‘rni |

### O‘lchamlar

| Token | Qiymat |
| --- | --- |
| `--r-input` | `9px` |
| `--r-btn` | `11px` |
| `--r-card` | `13px` |
| `--r-panel` | `14px` |
| `--r-modal` | `18px` |
| `--r-pill` | `999px` |
| `--h-nav-btn` | `32px` |
| `--h-control` | `36px` |
| `--h-btn` | `42px` |
| `--h-btn-lg` | `46px` |

### Soyalar

| Token | Qiymat |
| --- | --- |
| `--sh-card` | `0 1px 2px rgba(23,33,43,.04)` |
| `--sh-panel` | `0 24px 64px rgba(23,33,43,.14), 0 2px 6px rgba(23,33,43,.06)` |
| `--sh-float` | `0 16px 44px rgba(0,0,0,.44), 0 0 0 1px rgba(255,255,255,.09)` |
| `--sh-modal` | `0 36px 92px rgba(0,0,0,.44), 0 0 0 1px rgba(255,255,255,.06)` |
| `--sh-photo` | `0 30px 80px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.07)` |
| `--sh-primary` | `0 6px 16px rgba(15,143,136,.30)` |
| `--sh-danger` | `0 6px 16px rgba(207,51,65,.32), inset 0 1px 0 rgba(255,255,255,.16)` |

### Tipografiya

Shrift: `Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`.

`body` ga qo‘shing:
```css
-webkit-font-smoothing: antialiased;
font-variant-numeric: tabular-nums;
```
`tabular-nums` muhim — jadvallardagi raqamlar tekis turishi uchun.

| Rol | O‘lcham / qalinlik / line-height |
| --- | --- |
| Ekran sarlavhasi | 17px / 700 / 1.2 |
| Blok sarlavhasi | 14px / 700 / 1.2 |
| Karta sarlavhasi | 13px / 700 / 1.25 |
| Asosiy matn | 13px / 400 / 1.5 |
| Menyu tugmasi | 12px / 600–700 / 1 |
| Ikkilamchi matn | 12px / 400 / 1.4 |
| Kichik izoh | 11px / 400 / 1.5 |
| Jadval sarlavhasi | 11px / 700 / 1 |
| Kichik sarlavha (eyebrow) | 10px / 800 / 1, `letter-spacing:.08em`, `text-transform:uppercase` |
| Katta raqam (metrika) | 24–30px / 700 / 1 |
| `kbd` | 10–11px / 700 / 1, monospace |

---

## Komponent uslublari

Bu uslublarni `studio.css` da mavjud selektorlarga bog‘lang. Har birining aniq qiymatlari.

### Yuqori menyu (nav)

```
height: 52px
background: var(--studio-surface)
border-bottom: 1px solid #e8edf1
box-shadow: 0 1px 0 rgba(23,33,43,.03)
padding: 0 16px
display: flex; align-items: center; gap: 18px
```

Logotip bloki: `flex: 0 0 auto`, o‘ngdan `padding-right:16px`, `border-right:1px solid #eaeff2`. Logotip 28×28px, `border:1px solid #b9ddda`, `border-radius:7px`.

Menyu tugmalari `flex: 0 0 auto` konteynerda, `gap: 2px`:

| Holat | Uslub |
| --- | --- |
| Faol | `background: var(--studio-accent-wash)`, `color: var(--studio-accent-deep)`, `font-weight:700`, `box-shadow: inset 0 0 0 1px rgba(15,143,136,.14)` |
| Nofaol | `background: transparent`, `color: var(--studio-text-nav)`, `font-weight:600` |

Ikkalasi: `height:32px`, `padding:0 12px`, `border:0`, `border-radius:8px`, `font-size:12px`, `white-space:nowrap`.

**Muhim:** barcha menyu tugmalariga `white-space: nowrap` shart — aks holda matn ikki qatorga sinadi.

### Tugmalar

**Asosiy (teal):**
```
height: 42px (yoki 46px katta)
padding: 0 20px
border: 0
border-radius: 11px
background: var(--studio-accent)
color: #fff
font: 800 13px/1 Inter
letter-spacing: .01em
box-shadow: var(--sh-primary)
white-space: nowrap
```

**Minus (asosiy amal):**
```
height: 42px (kartalarda) / 46px (asosiy ekranlarda)
padding: 0 20px
border: 0
border-radius: 11px (kartalarda) / 12px (asosiy)
background: var(--studio-danger)
color: #fff
font: 800 13px/1 Inter
letter-spacing: .01em
box-shadow: var(--sh-danger)
display: flex; align-items: center; gap: 9px
```
Hover: `background: var(--studio-danger-deep)`.

Ichida **minus belgisi** — chiziqli doira:
```html
<span class="minusGlyph">
  <span></span>
</span>
```
```css
.minusGlyph{
  width:16px; height:16px; flex:0 0 16px;
  display:grid; place-items:center;
  border-radius:50%;
  border:1.6px solid currentColor;
}
.minusGlyph > span{
  width:7px; height:1.6px;
  background:currentColor;
  border-radius:1px;
}
```
Bu belgi barcha minus tugmalarida bo‘lishi kerak — matnni o‘qimasdan tanib olish uchun.

**Minus (ikkilamchi / ommaviy):**
```
height: 36px
padding: 0 14px
border: 1px solid var(--studio-danger-line)
border-radius: 10px
background: var(--studio-danger-wash)
color: var(--studio-danger-deep)
font: 700 12px/1 Inter
```
Hover: `background:#ffecee; border-color:#e79aa2`.

**Ikkilamchi (neytral):**
```
height: 42px
padding: 0 18px
border: 1px solid var(--studio-border)
border-radius: 11px
background: var(--studio-surface)
color: var(--studio-text-nav)
font: 600 13px/1 Inter
```

**Quyuq fonda tugma:**
```
background: var(--stage-fill)
color: #dbe3e9
border: 0
border-radius: 10px
font: 700 13px/1 Inter
```

### Inputlar

```
height: 36px (nav) / 42–44px (forma)
padding: 0 12px
border: 1px solid var(--studio-border)
border-radius: 9px (nav) / 11px (forma)
background: var(--studio-surface)   /* to‘ldirilgan */
background: var(--studio-surface-soft)  /* bo‘sh / ikkilamchi */
font-size: 13px
color: var(--studio-text)
```

**Textarea (brend izohi):**
```
min-height: 132px
padding: 13px 14px
border-radius: 10px
line-height: 1.6
resize: vertical
```
Yorlig‘i uch qismdan: `Izoh` + `ixtiyoriy` (och rang) + o‘ngda `0 / 300` hisoblagich. `placeholder` da nima yozish kerakligi ko‘rsatiladi.

### Kartalar va panellar

```
border: 1px solid var(--studio-border-soft)
border-radius: 13px
background: var(--studio-surface)
box-shadow: var(--sh-card)
```

Metrika kartasi: `padding: 14px 16px`, ichida yorliq (11px, muted) + qiymat (24px, 700).

### Jadval

```
Konteyner: border:1px solid var(--studio-border-soft); border-radius:13px; overflow:hidden
Sarlavha:  background: var(--studio-surface-tint); border-bottom:1px solid #eaeff2;
           position:sticky; top:0; z-index:2; font: 700 11px/1; color: var(--studio-text-muted)
Qator:     border-bottom: 1px solid var(--studio-rule)
```

### Nishonlar (badge)

```
height: 24px
padding: 0 9px
border-radius: 6px
font: 700 11px/1 Inter
white-space: nowrap
display: inline-flex; align-items: center
```
Ranglar: ogohlantirish `--studio-warn-wash` / `--studio-warn-text`; minus `#fff3f4` / `#c02b39`; tayyor `--studio-ok-wash` / `--studio-ok-text`; neytral `#eef2f4` / `#5c6b78`.

### Klaviatura belgisi (kbd)

```css
kbd{
  display:inline-grid; place-items:center;
  min-width:22px; height:22px; padding:0 6px;
  border:1px solid rgba(255,255,255,.28);
  border-bottom-width:2px;
  border-radius:5px;
  background:rgba(255,255,255,.10);
  color:#c3ced6;
  font:700 11px/1 ui-monospace,Menlo,monospace;
}
```
Yorug‘ fonda: `border-color:#cfd8de`, `background:#fff`, `color:#4a5b68`.

---

## Screens

### 2a — Ko‘rish rejimi (1 foto)

**Purpose:** Bitta fotoni to‘liq o‘lchamda ko‘rish va kerak bo‘lsa minus qilish.

**Layout:** vertikal flex — nav (52px) → sahna (`flex:1`) → filmstrip (96px).

Sahna: `display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:22px; background: var(--stage-gradient)`.

**Foto bloki** — gorizontal flex, `gap:26px`, markazda:
- Chapda: `186×426px`, `border-radius:10px`, `opacity:.32`, quyuqroq placeholder — oldingi foto
- Markazda: `552×614px`, `border-radius:12px`, `box-shadow: var(--sh-photo)` — asosiy foto
- O‘ngda: chapdagi bilan bir xil — keyingi foto

Yon fotolar shunchaki bezak emas — foydalanuvchi qatorda qayerdaligini ko‘rsatadi.

Asosiy fotoning chap-yuqorisida ogohlantirish nishoni (`left:13px; top:13px`), `background:#f5c86a`, `color:#4a3208`, `box-shadow:0 4px 14px rgba(0,0,0,.24)`.

**Foto ostidagi qator** — `width:552px`, `display:flex; justify-content:space-between`:
- Chapda: do‘kon nomi (14px/700, `--stage-text`) + buyurtma (12px, `--stage-text-muted`)
- O‘ngda: `To‘g‘ri bo‘lsa hech narsa bosmang` izohi → `Keyingi [Space]` (quyuq tugma) → `⊖ Minus qilish [M]` (qizil tugma, 46px)

**OK tugmasi yo‘q.** Bu ataylab: nazoratchi faqat muammoni belgilaydi.

**Sahna burchaklari:**
- Chap-yuqori (`left:20px; top:18px`): agent kodi + `foto 5 / 28`
- O‘ng-yuqori (`right:20px; top:18px`): `Kunlik: 966 / 1284` + progress (120×5px) + zoom (`−` / `Fit` / `+`)

**Qaytarish chizig‘i** (minus qo‘yilgandan keyin chiqadi):
```
position: absolute; left: 50%; top: 64px; transform: translateX(-50%);
height: 52px; padding: 0 10px 0 18px;
border-radius: 999px;
background: rgba(26,32,38,.95);
box-shadow: 0 16px 44px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.10);
z-index: 3;
```
Ichida: qizil nuqta (9px) + `Minus qo‘yildi` (13px/700) + sabab (12px, muted) + `Qaytarish [Ctrl Z]` tugmasi.

**Muhim:** chiziq **tepada** turishi shart. Pastga qo‘yilsa foto ostidagi tugmalarni to‘sib qoladi — bu sinovda aniqlandi. 4 soniyadan keyin o‘zi yo‘qoladi.

**Filmstrip** (96px, `background: var(--stage-chrome)`):
- `‹` tugma (36×56px) → scroll qatori (`flex:1; overflow-x:auto; gap:7px`) → `›` tugma
- Eskizlar: `62×70px`, `border-radius:8px`, `border:2px solid`
- Chegara rangi: minus `#cf3341`, hozirgi `#2fb3aa`, boshqa `#454f59`
- **Yashil (OK) holati yo‘q** — OK tugmasi olib tashlanganidan keyin ma‘nosi qolmadi
- O‘ngda ajratgich ortida: `← →` klaviatura izohi + `Keyingi agent`

### 2b — Minus sababi

**Purpose:** Minus bosilgandan keyin sababni bir bosishda tanlash.

Modal: `width:720px`, `padding:22px`, `border-radius:18px`, `background:#fff`, `box-shadow: var(--sh-modal)`. Orqa fon: `rgba(18,23,28,.62)`.

Sarlavha qatori: `Minus sababi` (17px/700) + kontekst (12px, muted) + o‘ngda `Raqam bosing yoki tanlang` (11px/600, faint).

**Sabablar** — `grid-template-columns: 1fr 1fr; gap: 8px`. Har biri:
```
min-height: 56px
padding: 10px 13px
border: 1px solid #e6edf1
border-radius: 12px
background: #fff
display: grid; grid-template-columns: 26px 1fr; gap: 12px
text-align: left
```
Hover: `border-color:#efb5bb; background:#fffafa`.

Chapda raqam: `26×26px`, `border-radius:7px`, `background:#f6f9fa`, monospace 12px/800.

Sabablar ro‘yxati (`README.md` dagi katalogdan):
1. Ish vaqtidan tashqari olingan foto
2. Kamera yopilgan yoki to‘sib olingan foto
3. Bitta do‘kondan takroriy foto
4. Ekrandan qayta olingan foto
5. Katalogdan olingan rasm
6. Faqat mahsulot rasmi
7. Foto talabga javob bermaydi

**Pastki qator:** izoh inputi (`flex:1`) + `Bekor [Esc]` + `⊖ Minus qilish` (qizil, 44px).

**Qaytarish eslatmasi:** `padding:11px 13px`, `border-radius:10px`, `background:#f6f9fa`, kulrang nuqta + matn: *"Adashib bosilsa qaytariladi: `Ctrl Z` yoki Minus ro‘yxatidan o‘chirish."*

**Ommaviy amallar** ajratgich ostida: `Bu agentning barcha 28 fotosi` (ikkilamchi minus uslubi) + `Shu do‘konning takroriylari (3)`.

### 2c — 4 foto rejimi

**Purpose:** Tez ko‘rib chiqish — bir ekranda 4 foto.

**Grid:** `display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:14px; height:100%`.

**Vertikal (portret) ustunlar** — do‘kon fotolari portret bo‘ladi, shuning uchun 2×2 emas, 1×4.

Karta: `display:flex; flex-direction:column`, `border-radius:10px`, `background: var(--stage-chrome)`, `border:1px solid var(--stage-chrome-line)`, `overflow:hidden`.
- Yuqorisi: `flex:1; min-height:0`, foto placeholder, chap-yuqorida holat nishoni
- Poyi: `display:grid; gap:10px; padding:12px 13px 13px; border-top:1px solid var(--stage-chrome-line)`
  - Do‘kon nomi (13px/700, `--stage-text`, `ellipsis`) + vaqt/buyurtma (11px, muted)
  - **Bitta** `⊖ Minus qilish` tugmasi (42px, to‘liq kenglik)

Ustun torligi sababli tugma matn **ostida**, yonida emas.

**Suzuvchi pastki panel** — to‘liq kenglikdagi 64px chiziq o‘rniga:
```
position: relative; padding: 0 20px 20px;
display: flex; align-items: flex-end; justify-content: center;
```
Ichidagi kapsula:
```
height: 54px; padding: 0 8px;
border-radius: 999px;
background: rgba(26,32,38,.94);
box-shadow: var(--sh-float);
display: flex; align-items: center; gap: 7px;
```
Tarkibi: `‹` (42px dumaloq) → `Keyingi 4 ta` (teal, kapsula) → `›` → ajratgich → avto blok (`Avto  − 3.5s +  Pauza`, `background: rgba(47,179,170,.16)`) → ajratgich → `↰ Qaytarish` → `Keyingi agent`.

**Muhim:** avval bu popover sifatida qilingan edi — kartalarni to‘sib qolgani uchun panelning o‘zi kengaydi. Ustiga ochiladigan oyna ishlatmang.

Panel sichqoncha pastga kelganda chiqadi, tinch turganda yo‘qoladi (opacity + transform transition, 160ms).

### 2d — Minus ro‘yxati

**Purpose:** Kunlik minuslarni ko‘rish, tekshirish, Telegramga yuborish.

Yuqorida 4 metrika + amallar: `Jami minus 37` / `Agent 11` / `Eng ko‘p sabab: Ish vaqtidan tashqari · 14` (pushti fonda) / `Yuborilmagan 9`, o‘ngda `Excel` + `Telegramga yuborish (9)`.

Sabab filtrlari — kapsula tugmalar: `height:32px`, `border-radius:999px`. Faol: `background: var(--studio-accent-wash)`, `color: var(--studio-accent-deep)`. O‘ngda qidiruv inputi.

**Jadval ustunlari:**
```
grid-template-columns: 76px 150px minmax(0,1fr) 70px minmax(0,1.3fr) minmax(0,1fr) 96px
```
Foto (60×52px eskiz) · Agent (kod + ism) · Do‘kon · Vaqt · Sabab (nishon) · Izoh · Amallar.

Amallar: `Ochish` + `×` (32×32px, ikkilamchi minus uslubi, `title="Minusni qaytarish"`). Bu `×` — qaytarishning ikkinchi yo‘li.

### 2e — Tabel

**Purpose:** Oylik davomat jadvali.

Yuqorida rejim tanlash (`Oy bo‘yicha` / `Kun bo‘yicha` / `Muammolar`), oy navigatsiyasi, brend, qidiruv, `CSV` + `Yangilash`.

7 metrika kartasi: Ish kuni · 19s sababli · Foto kamligi · Shtraf · Vacant · SVR kuni · Muammo.

**Katak izohi (legend) — majburiy.** Foydalanuvchi shikoyat qilgan asosiy muammo shu edi: ranglar tushunarsiz.
```
22   #eaf8ef / #197544   ish kuni (20+ foto)
19s  #fff7e8 / #a95c08   sababli ish kuni
12   #fff0f1 / #bb2636   foto kamligi
V    #f2f4f7 / #667085   Vacant
—    inset 0 -2px 0 #3b82f6   qo‘lda kiritilgan
```

Jadval: `grid-template-columns: 92px 190px 110px repeat(21, 42px)`. Sarlavha `sticky`. Dam olish kunlari ustuni `background:#fbf8f3`. Kataklar: `margin:4px 3px; height:28px; border-radius:7px; font:800 11px/1`.

### 2f — Statistika

4 metrika kartasi (`padding:18px 20px`, qiymat 30px/700, ostida yashil o‘zgarish izohi): Telegramga yuborilgan · Bot foydalanuvchilari · Agent ochilishlari · Minus ulushi.

Asosiy qism: `grid-template-columns: minmax(0,1.35fr) minmax(0,1fr)`.
- Chapda agentlar jadvali: Xodim · Kod · Ochilgan · Minus (qizil) · Ulush. Minus ulushi yuqori bo‘lganlar tepada.
- O‘ngda: kunlik tekshiruv ustun diagrammasi (14 ustun, faol `--studio-accent`, qolgani `#bfd9d6`) + sabablar taqsimoti (nom + son + progress chiziq).

### 2g — Brend sozlamalari

Tab qatori: `Brendlar` / `Avto tekshiruv` / `Telegram` / `Xodimlar`. O‘ngda `Import` / `Export` / `Yangi brend`.

`grid-template-columns: 320px minmax(0,1fr)`.

Chapda brend ro‘yxati — karta: `border-left: 3px solid` (faol `--studio-accent`, boshqa `transparent`), faol fon `--studio-accent-wash`. Ichida nom + holat nishoni + `Prefiks: LM, LMJ`.

O‘ngda forma, bo‘limlar eyebrow sarlavha bilan: **Asosiy** (brend nomi, agent prefikslari, Salesdagi nomlar) · **Telegram** (guruh, qo‘lda chat ID) · **Holat** (toggle + katta textarea izoh).

Pastda: `Saqlash` (teal) + `Bekor qilish` + o‘ngda `O‘chirish`.

### 2h — Ma‘lumot yig‘ish

**Purpose:** Sana/brend tanlanganda ma‘lumot o‘zi yig‘ilishi.

**Bu ekran eng ko‘p o‘zgardi.** Avvalgi disaynda alohida oyna, `Boshlash`/`To‘xtatish` tugmalari va log oynasi bor edi. Hammasi olib tashlandi.

`js/dataset-auto-load.js` allaqachon avtomatik ishlaydi — `datasets/ensure` holatlarini qaytaradi: `checking` → `collecting` → `partial` → `ready`. UI shunga moslashishi kerak, yangi mexanizm yozilmaydi.

Nav o‘ngida brend select va sana input (teal chegara: `border:1px solid #b9ddda; background:#f3faf9; color:#0b7772; font-weight:700`) — yig‘ishni boshlaydigan yagona nazorat.

**Holat chizig‘i** (nav ostida, 48px):
```
grid-template-columns: 12px minmax(0,1fr) auto auto
gap: 12px; padding: 0 20px;
background: var(--studio-accent-wash)
border-bottom: 1px solid #cfe6e3
```
Nuqta (10px) + `Yig‘ilmoqda — Lalaku mama · 03.06.2026` (13px/700, `#0b5c58`) + `27 / 42 agent · 884 foto keldi · taxminan 1 daqiqa` (12px, `#4c7c78`) + progress (180×6px) + `Bekor qilish`.

Ostida darhol review gridi — 2c bilan **aynan bir xil** 4 ustunli joylashuv. Kelgan fotolar to‘q (`opacity:1`), kutilayotganlar xira (`opacity:.45`, matn `kutilmoqda` / `yuklanmoqda...`).

Kelgan fotoni darhol tekshirish mumkin — to‘liq yig‘ilishini kutish shart emas.

**Holat variantlari** (bitta chiziqning turli ko‘rinishi, matnlar `dataset-auto-load.js` dan):

| Holat | Sarlavha | Matn | Fon / matn / nuqta |
| --- | --- | --- | --- |
| `checking` | Tekshirilmoqda | Bu sana uchun ma‘lumot bor-yo‘qligi aniqlanmoqda... | `#f2f6f8` / `#5c6b78` / `#93a1ac` |
| `ready` | Tayyor | 1 284 foto · 42 agent yuklandi | `#edf8f1` / `#0d5c33` / `#3fae7a` |
| `busy` | Navbatda | Server boshqa ma‘lumotni tayyorlamoqda | `#fff7eb` / `#7a4708` / `#e09b2d` |
| `error` | Xato | Sales serveriga ulanib bo‘lmadi | `#fff3f4` / `#a3202d` / `#cf3341` |

### 2i — Taqqoslash

**Purpose:** Takroriy fotoni isbotlash. Hozir bu imkonsiz — ikki fotoni yonma-yon ko‘rmasdan "takroriy" deb belgilash taxmin bo‘ladi.

Sarlavha: `Takroriy shubhasi` + nishon `Chorsu Mini Market · 2 daqiqa farq` + `Avto tekshiruv 12 ta shunday juftlik topdi — bu 3-si`. O‘ngda `Oldingi juftlik` / `Keyingi juftlik`.

`grid-template-columns: 1fr 1fr; gap: 18px`, fon `var(--stage-gradient)`.

Har tomonda: yorliq qatori (`Foto 7` nishoni + vaqt + kontekst) + foto (`flex:1`, `border-radius:12px`). Shubhali tomonning soyasi sariq halqa bilan: `0 24px 60px rgba(0,0,0,.40), 0 0 0 1px rgba(240,189,110,.35)`.

Pastda: `C` taqqoslashni yopish · `Tab` ustma-ust qo‘yish · o‘ngda `Ikkalasi ham to‘g‘ri` + `⊖ Foto 8 ni takroriy deb belgilash`.

### 2j — Ctrl+K tezkor qidiruv

**Purpose:** Agent, sana va amallarni bitta joydan topish.

Nav o‘ngida qidiruv tugmasi: `Qidirish` + `Ctrl K` belgisi (`background:#fafcfd`, `color:#93a1ac`).

Palitra: `width:660px`, `top:96px`, `border-radius:18px`, `box-shadow: 0 44px 110px rgba(0,0,0,.50), 0 0 0 1px rgba(255,255,255,.06)`. Orqa fon `rgba(16,21,26,.66)`.

Qidiruv qatori: doira ikonka (16px) + input (16px, chegarasiz) + `Esc` belgisi + `border-bottom:1px solid var(--studio-hairline)`.

Natijalar guruhlangan (guruh sarlavhasi eyebrow uslubida):
- **Agentlar** — `LMJNM08 · Nodira Ergasheva` + `12 ta tekshirilmagan`
- **Sana** — `Kecha — 02.06.2026` + `1 190 foto`
- **Amallar** — `Keyingi tekshirilmagan fotoga o‘tish` + `Enter`

Qator: `grid-template-columns: minmax(0,1fr) auto`, `padding:12px`, `border-radius:9px`. Tanlangan: `background:#f2f8f7`.

Poyi: `↑ ↓ tanlash` · `Enter ochish` · o‘ngda `? — barcha tugmalar`.

---

## Interactions & Behavior

### Qaror mantiqiy oqimi (eng muhim o‘zgarish)

**Oldin:** har bir fotoga OK yoki Minus bosilardi. 1284 foto = 1284 bosish.

**Endi:** faqat muammoli fotoga Minus bosiladi. Qolganlari `Space` bilan yoki avto o‘tish bilan o‘tadi. Amalda ~3% foto minus oladi, ya‘ni bosishlar soni ~30 barobar kamayadi.

Ko‘rilgan foto `seen` deb belgilanadi (minus emas). Filmstripda kulrang chegara. Bu holat saqlanishi kerak — nazoratchi qayerda to‘xtaganini bilishi uchun.

### Qaytarish (undo) — majburiy

Uch yo‘l:
1. **Chiziq** — minus qo‘yilgandan keyin 2a sahnasi tepasida chiqadi, `Qaytarish` tugmasi bilan. 4 soniyadan keyin yo‘qoladi.
2. **Ctrl+Z** — oxirgi minusni qaytaradi. Ketma-ket bosilsa oldingilariga boradi (stack).
3. **Minus ro‘yxati** — 2d dagi `×` tugmasi bilan istalgan vaqtda o‘chirish.

Stack kamida 20 ta amalni saqlashi kerak. Qaytarish serverga ham yetib borishi shart (`DELETE` yoki `verdict: null`) — faqat UI da emas.

### Klaviatura

| Tugma | Amal |
| --- | --- |
| `Space` | Keyingi foto |
| `M` | Minus (sabab oynasini ochadi) |
| `1`–`7` | Sabab bilan darhol minus |
| `Ctrl+Z` | Minusni qaytarish |
| `←` `→` | Foto almashtirish |
| `Ctrl+K` | Tezkor qidiruv |
| `C` | Taqqoslash |
| `P` | Avto o‘tishni pauza |
| `Esc` | Oyna yopish |
| `?` | Barcha tugmalar ro‘yxati |

Klaviatura bilan ishlaganda suzuvchi panel umuman chiqmasligi kerak.

### Suzuvchi panel

Sichqoncha ekranning pastki 120px iga kirsa chiqadi, chiqib ketsa 600ms dan keyin yo‘qoladi. `opacity` + `translateY(8px)`, 160ms `ease-out`. Panel ustida sichqoncha turganda yo‘qolmaydi.

### Ma‘lumot yig‘ish

`datasets/ensure` javobiga qarab holat chizig‘i o‘zgaradi. `partial` holatda kelgan fotolar darhol gridga qo‘shiladi — to‘liq yig‘ilish kutilmaydi. Log ko‘rsatilmaydi (foydalanuvchi so‘rovi bo‘yicha).

---

## State Management

Yangi holat o‘zgaruvchilari:

| Nom | Tur | Vazifa |
| --- | --- | --- |
| `undoStack` | `Array<{photoId, prevVerdict, reason, note, ts}>` | Qaytarish uchun, max 20 |
| `undoToast` | `{photoId, reason, visible} \| null` | Tepadagi chiziq |
| `seenPhotos` | `Set<photoId>` | Ko‘rilgan (minus emas) fotolar |
| `paletteOpen` | `boolean` | Ctrl+K |
| `compareTarget` | `{photoA, photoB} \| null` | Taqqoslash |
| `dockVisible` | `boolean` | Suzuvchi panel |
| `datasetState` | `'checking'\|'collecting'\|'partial'\|'ready'\|'busy'\|'error'` | Yig‘ish holati |

`app.js` dagi mavjud `marks` / `verdict` tuzilishi saqlanadi — `undoStack` uning ustiga qo‘shiladi.

---

## Assets

`outputs/review-ui/assets/foto-nazorati-logo.svg` — mavjud brend logotipi, o‘zgarmaydi. Boshqa yangi asset kerak emas; minus belgisi CSS bilan chiziladi (SVG emas).

Fotolar o‘rnida prototipda `repeating-linear-gradient` placeholder ishlatilgan — real loyihada haqiqiy `<img>` keladi.

## Files

| Fayl | Tarkibi |
| --- | --- |
| `Foto ko'rish - yangi yo'nalish.dc.html` | Yakuniy disayn, 10 ta ekran (2a–2j). **Asosiy referens.** |
| `Hozirgi holat - Foto Review.dc.html` | Hozirgi UI ning aynan nusxasi — taqqoslash uchun |
| `Optimallashtirilgan variantlar.dc.html` | Rad etilgan dastlabki uch yo‘nalish (1a–1c). Tarix uchun; bajarilmaydi. |

Fayllarni brauzerda ochib ko‘rish mumkin. Har bir ekranning `id` si (`2a`, `2b`, ...) va nomi ustida ko‘rsatilgan.

## Nima qilinmasin

- **React yoki boshqa framework kiritilmasin** — mavjud vanilla JS saqlanadi.
- **`index.html` dagi `id` lar o‘zgartirilmasin** — `app.js` va `studio.css` ularga bog‘langan.
- **Yangi ma‘lumot yig‘ish mexanizmi yozilmasin** — `dataset-auto-load.js` mavjud, faqat UI moslashadi.
- **`studio.css` dagi `!important` tartibi buzilmasin** — u ataylab shunday, brend CSS ustidan yozish uchun.
- **Yashil "OK" holati qaytarilmasin** — OK tugmasi olib tashlangani uchun ma‘nosi yo‘q.
- **Popover ishlatilmasin** suzuvchi panelda — kartalarni to‘sadi (sinovda aniqlangan).
