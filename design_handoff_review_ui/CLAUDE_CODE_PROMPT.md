# Claude Code uchun boshlang'ich prompt

Quyidagi matnni Claude Code ga birinchi xabar sifatida yuboring. Handoff papkasini repo ildiziga qo'ying (yoki yo'lni moslang).

---

`design_handoff_review_ui/README.md` faylini o'qi. Bu — `outputs/review-ui/` review interfeysi uchun to'liq disayn spetsifikatsiyasi.

Kontekst: `outputs/review-ui/styles/studio.css` — vizual qatlam (faylning o'zida yozilgan: "Visual-only layer. Functional ids preserved"). U `!important` bilan ko'rinishni qayta bo'yaydi, HTML tuzilishiga tegmaydi. Ishning katta qismi shu faylda bajariladi.

Qoidalar:
- React yoki boshqa framework kiritma — mavjud vanilla JS saqlanadi
- `index.html` dagi element `id` lari o'zgarmaydi
- Yangi ma'lumot yig'ish mexanizmi yozma — `js/dataset-auto-load.js` mavjud
- `studio.css` dagi `!important` tartibini buzma

README dagi 7 bosqichli jadval bo'yicha ishla. **Faqat 1-bosqichni bajar** (dizayn tokenlari va vizual sayqal → `studio.css` v66), keyin to'xtab menga ko'rsat. Keyingi bosqichga o'zim ruxsat beraman.

Boshlashdan oldin: `outputs/review-ui/index.html`, `styles/studio.css` va `js/app.js` ni o'qib, mavjud selektorlar va tuzilishni tushun. Keyin 1-bosqich uchun aniq reja ber.

---

## Keyingi bosqichlar uchun

Har bosqich tugagach shu tarzda davom eting:

**2-bosqich:** `README.md` dagi "Qaror mantiqiy oqimi" va "Qaytarish (undo)" bo'limlarini bajar. OK tugmasini olib tashla, `undoStack` qo'sh, Ctrl+Z va tepadagi qaytarish chizig'ini ishlat. Filmstripdagi yashil OK holatini olib tashla.

**3-bosqich:** 2c ekranidagi 4 ustunli vertikal gridga o't. Karta poyida faqat bitta minus tugmasi qoladi.

**4-bosqich:** Pastki 64px chiziqni suzuvchi kapsula panelga almashtir (README → 2c bo'limi). Popover ishlatma.

**5-bosqich:** 2h — ma'lumot yig'ishni alohida oynadan olib tashla, nav ostidagi holat chizig'iga o't.

**6-bosqich:** Ctrl+K tezkor qidiruv (`js/palette.js`).

**7-bosqich:** Taqqoslash ekrani (`js/compare.js`).
