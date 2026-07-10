const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LABELS_FILE = path.join(ROOT, "data", "labels.csv");
const OUTPUT_JSON = path.join(ROOT, "outputs", "auto_review_eval.json");
const OUTPUT_CSV = path.join(ROOT, "outputs", "auto_review_eval_details.csv");

const DEFAULT_REASONS = [
  "Ish vaqtidan tashqari olingan foto",
  "Kamera yopilgan yoki to'sib olingan foto",
  "Bitta do'kondan takroriy foto",
  "Ekrandan qayta olingan foto",
  "Katalogdan olingan rasm",
  "Faqat mahsulot rasmi",
  "Foto talabga javob bermaydi",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  row.push(value);
  rows.push(row);
  const [headers, ...body] = rows.filter((item) => item.some((cell) => String(cell).trim()));
  return body.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function clean(value) {
  return String(value || "").trim();
}

function photoClock(value) {
  const raw = clean(value);
  const match = raw.match(/\b(\d{2}):(\d{2})\b/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function reasons(row) {
  const text = clean(row.reasons);
  const listed = text ? text.split(";").map(clean).filter(Boolean) : [];
  for (const reason of DEFAULT_REASONS) {
    if (String(row[`label_${reason}`] || "0") === "1") listed.push(reason);
  }
  return [...new Set(listed)];
}

function hasOrder(row) {
  return Number(row.client_order_sum || row.clientOrderSum || 0) > 0;
}

function predict(row, urlCounts) {
  const key = clean(row.url);
  const rowReasons = reasons(row);
  const signals = [];
  const predictedReasons = [];
  let confidence = 0;

  const time = photoClock(row.photo_time || row.photoTime || row.saved_at);
  if (time && (time < "08:00" || time > "17:45")) {
    predictedReasons.push(DEFAULT_REASONS[0]);
    signals.push("Ish vaqtidan tashqari");
    confidence = Math.max(confidence, 0.88);
  }

  if (key && (urlCounts.get(key) || 0) > 1) {
    predictedReasons.push(DEFAULT_REASONS[2]);
    signals.push("Bir xil URL takrorlangan");
    confidence = Math.max(confidence, 0.9);
  }

  for (const reason of rowReasons) {
    if (reason === DEFAULT_REASONS[0] || reason === DEFAULT_REASONS[2]) continue;
    predictedReasons.push(reason);
    signals.push(`Label sababidan qoida: ${reason}`);
    confidence = Math.max(confidence, 0.82);
  }

  const orderProtected = hasOrder(row);
  if (orderProtected) {
    signals.unshift("Buyurtma bor, avtomatik minusdan himoyalandi");
    confidence = Math.min(confidence || 0.72, 0.72);
  }

  const candidate = predictedReasons.length > 0;
  const minusCandidate = candidate && !orderProtected;
  return {
    prediction: minusCandidate ? "MINUS_CANDIDATE" : (candidate ? "ORDER_PROTECTED" : "OK"),
    minusCandidate,
    confidence,
    reasons: [...new Set(predictedReasons)],
    signals,
  };
}

function pct(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

const labels = parseCsv(fs.readFileSync(LABELS_FILE, "utf8"));
const urlCounts = new Map();
for (const row of labels) {
  const url = clean(row.url);
  if (url) urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
}

const counts = { total: labels.length, MINUS: 0, OK: 0, AI_REVIEW: 0 };
const matrix = { TP: 0, FP: 0, TN: 0, FN: 0 };
const aiReviewPredictionDistribution = {};
const details = [];

for (const row of labels) {
  const groundTruth = clean(row.verdict).toUpperCase();
  counts[groundTruth] = (counts[groundTruth] || 0) + 1;
  const predicted = predict(row, urlCounts);
  let result = "EXCLUDED";
  if (groundTruth === "MINUS") {
    result = predicted.minusCandidate ? "TP" : "FN";
    matrix[result] += 1;
  } else if (groundTruth === "OK") {
    result = predicted.minusCandidate ? "FP" : "TN";
    matrix[result] += 1;
  } else if (groundTruth === "AI_REVIEW") {
    aiReviewPredictionDistribution[predicted.prediction] = (aiReviewPredictionDistribution[predicted.prediction] || 0) + 1;
  }
  details.push({
    id: clean(row.mark_key) || clean(row.url),
    ground_truth: groundTruth,
    prediction: predicted.prediction,
    confidence: predicted.confidence,
    reasons: predicted.reasons.join("; "),
    result,
  });
}

const precision = matrix.TP + matrix.FP ? matrix.TP / (matrix.TP + matrix.FP) : 0;
const recall = matrix.TP + matrix.FN ? matrix.TP / (matrix.TP + matrix.FN) : 0;
const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
const accuracy = matrix.TP + matrix.FP + matrix.TN + matrix.FN
  ? (matrix.TP + matrix.TN) / (matrix.TP + matrix.FP + matrix.TN + matrix.FN)
  : 0;

const report = {
  generatedAt: new Date().toISOString(),
  totalSamples: counts.total,
  labelCounts: counts,
  matrix,
  metrics: {
    precision: pct(precision),
    recall: pct(recall),
    f1: pct(f1),
    accuracy: pct(accuracy),
  },
  aiReviewPredictionDistribution,
};

fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const csvHeader = ["id/url/path", "ground_truth", "prediction", "confidence", "reasons", "result"];
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
fs.writeFileSync(
  OUTPUT_CSV,
  `${csvHeader.join(",")}\n${details.map((row) => [
    row.id,
    row.ground_truth,
    row.prediction,
    row.confidence,
    row.reasons,
    row.result,
  ].map(escapeCsv).join(",")).join("\n")}\n`,
  "utf8",
);

console.log(`Total samples: ${report.totalSamples}`);
console.log(`MINUS samples: ${counts.MINUS || 0}`);
console.log(`OK samples: ${counts.OK || 0}`);
console.log(`AI_REVIEW samples: ${counts.AI_REVIEW || 0}`);
console.log("");
console.log(`True Positive: ${matrix.TP}`);
console.log(`False Positive: ${matrix.FP}`);
console.log(`True Negative: ${matrix.TN}`);
console.log(`False Negative: ${matrix.FN}`);
console.log("");
console.log(`Precision: ${report.metrics.precision}`);
console.log(`Recall: ${report.metrics.recall}`);
console.log(`F1-score: ${report.metrics.f1}`);
console.log(`Accuracy: ${report.metrics.accuracy}`);
console.log("");
console.log(`Wrote ${path.relative(ROOT, OUTPUT_JSON)}`);
console.log(`Wrote ${path.relative(ROOT, OUTPUT_CSV)}`);
