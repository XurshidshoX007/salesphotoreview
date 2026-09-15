import assert from "node:assert/strict";
import { readPhotoExif, exifTimeOffsetMinutes, dominantModel, EXIF_EXPECTED_OFFSET_MINUTES } from "../backend/src/services/photo-exif.service.mjs";

// --- readPhotoExif: EXIF yo'q yoki buzuq bo'lsa tashlamasin ---
assert.deepEqual(readPhotoExif(null), { present: false });
assert.deepEqual(readPhotoExif(Buffer.alloc(0)), { present: false });
const broken = readPhotoExif(Buffer.from("bu exif emas"));
assert.equal(broken.present, false);
assert.equal(broken.unreadable, true);

// --- exifTimeOffsetMinutes ---
// O'lchangan normal holat: Sales UTC (06:46), EXIF mahalliy (11:46) => -300
assert.equal(exifTimeOffsetMinutes("06:46", "2026-09-02 11:46:38"), EXIF_EXPECTED_OFFSET_MINUTES);
assert.equal(exifTimeOffsetMinutes("2026-09-02 06:46", "2026-09-02 11:46:38"), -300);
// Rasm ertalab olinib kechqurun yuklangan bo'lsa farq boshqacha bo'ladi
assert.equal(exifTimeOffsetMinutes("14:00", "2026-09-02 11:46:00"), 134);
// Yarim tun orqali: EXIF mahalliy 02:00 => Sales UTC 21:00 (oldingi kun).
// Xom ayirma +1140, lekin haqiqiy farq -300 bo'lishi kerak.
assert.equal(exifTimeOffsetMinutes("21:00", "2026-09-03 02:00:00"), -300);
// Ertalab olinib kechqurun yuklangan rasm: normal -300 dan aniq farq qiladi
assert.notEqual(exifTimeOffsetMinutes("00:10", "2026-09-02 19:10:00"), -300);
// Sales haqiqatda to'liq ISO yozadi: "2026-09-02T06:46:38.131584Z".
// Bu format avval noto'g'ri o'qilardi (soat o'rniga daqiqa:sekund olinardi).
assert.equal(exifTimeOffsetMinutes("2026-09-02T06:46:38.131584Z", "2026-09-02 11:46:38"), -300);
assert.equal(exifTimeOffsetMinutes("2026-09-02T06:33:15.490981Z", "2026-09-02 11:33:12"), -300);

// Ma'lumot yetishmasa null
assert.equal(exifTimeOffsetMinutes("", "2026-09-02 11:46:38"), null);
assert.equal(exifTimeOffsetMinutes("06:46", ""), null);
assert.equal(exifTimeOffsetMinutes("06:46", "sana yo'q"), null);

// --- dominantModel ---
const d1 = dominantModel(["2209116AG", "2209116AG", "2209116AG", "ABR-NX1"]);
assert.equal(d1.model, "2209116AG");
assert.equal(d1.count, 3);
assert.equal(d1.total, 4);
assert.equal(d1.distinct, 2);
const d2 = dominantModel([]);
assert.equal(d2.model, "");
assert.equal(d2.total, 0);
// Bo'sh qiymatlar hisobga olinmasin
const d3 = dominantModel(["", null, undefined, "  ", "Redmi"]);
assert.equal(d3.model, "Redmi");
assert.equal(d3.distinct, 1);

console.log("Photo EXIF tests OK | parse, vaqt farqi, model aniqlash");
