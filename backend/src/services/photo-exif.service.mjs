import exifReader from "exif-reader";

// EXIF ma'lumoti rasm ichida keladi va Sales uni o'chirmaydi — o'lchandi:
// 70 ta namunaning 70 tasida mavjud. Shu sababli EXIF yo'qligi yoki
// agentning odatdagi telefonidan boshqa model — kuchli signal.
//
// exif-reader sanani Date ga aylantiradi va vaqt mintaqasiz matnni UTC deb
// o'qiydi. Asl "YYYY:MM:DD HH:MM:SS" matnini tiklash uchun UTC getterlardan
// foydalanamiz; aks holda server mintaqasiga qarab sana surilib ketardi.
function wallClock(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
    + ` ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`;
}

function text(value) {
  return String(value ?? "").replace(/\0+$/, "").trim();
}

/**
 * sharp metadata.exif buferidan kerakli maydonlarni ajratadi.
 * Xato bo'lsa tashlamaydi — EXIF yo'qligi ham o'zi ma'lumot.
 */
export function readPhotoExif(exifBuffer) {
  if (!exifBuffer || !exifBuffer.length) return { present: false };
  let parsed;
  try {
    parsed = exifReader(exifBuffer);
  } catch {
    return { present: false, unreadable: true };
  }
  const image = parsed?.Image || {};
  const photo = parsed?.Photo || {};
  const taken = wallClock(photo.DateTimeOriginal) || wallClock(image.DateTime);
  return {
    present: true,
    make: text(image.Make),
    model: text(image.Model),
    software: text(image.Software),
    takenAt: taken,
  };
}

/**
 * Sales yozgan yuklash vaqti bilan EXIF dagi olingan vaqt orasidagi farq
 * (daqiqada). O'lchangan normal qiymat -300 — Sales UTC da, EXIF mahalliy
 * vaqtda yozadi (UTC+5). Undan chetga chiqish rasm boshqa vaqtda
 * olinganini bildiradi.
 */
export function exifTimeOffsetMinutes(salesTime, exifTakenAt) {
  // Soat qatorning boshida, "T" dan keyin yoki probeldan keyin keladi.
  // Bu yerda \b ishlatib bo'lmaydi: Sales to'liq ISO yozadi
  // ("2026-09-02T06:46:38.131584Z") va "T" ham so'z belgisi bo'lgani uchun
  // soat oldidan chegara topilmasdi — regex "46:38" ni olib, farqni
  // butunlay noto'g'ri hisoblardi.
  const HHMM = /(?:^|[T\s])(\d{2}):(\d{2})/;
  const sales = String(salesTime || "").match(HHMM);
  const exif = String(exifTakenAt || "").match(HHMM);
  if (!sales || !exif) return null;
  const salesMinutes = Number(sales[1]) * 60 + Number(sales[2]);
  const exifMinutes = Number(exif[1]) * 60 + Number(exif[2]);
  let diff = salesMinutes - exifMinutes;
  // Yarim tun orqali o'tishni hisobga olamiz: farq doim [-720, 720] oralig'ida.
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff;
}

export const EXIF_EXPECTED_OFFSET_MINUTES = -300;

/**
 * Agentning odatdagi telefoni. Ko'pchilik rasm qaysi modeldan kelgan bo'lsa,
 * o'sha "odatdagi" hisoblanadi.
 */
export function dominantModel(models = []) {
  const counts = new Map();
  for (const model of models) {
    const key = text(model);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [model, count] of counts) {
    if (count > bestCount) { best = model; bestCount = count; }
  }
  return { model: best, count: bestCount, total: models.length, distinct: counts.size };
}
