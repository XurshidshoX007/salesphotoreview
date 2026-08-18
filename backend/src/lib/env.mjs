export function parseEnvValue(raw) {
  let value = String(raw ?? "").trim();
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === "\"" || quote === "'") && value[value.length - 1] === quote) {
      return value.slice(1, -1);
    }
  }
  return value;
}

export function parseEnvText(text, target = process.env, { override = false } = {}) {
  const values = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) continue;
    const value = parseEnvValue(trimmed.slice(index + 1));
    values[key] = value;
    if (override || target[key] === undefined) target[key] = value;
  }
  return values;
}
