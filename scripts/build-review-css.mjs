import { readFile, writeFile, rename, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STYLE_DIR = join(ROOT, "outputs", "review-ui", "styles");
const SOURCES = ["main.css", "studio.css", "brand.css"];
const OUTPUT = join(STYLE_DIR, "app.bundle.css");

function topLevelBlocks(source) {
  const blocks = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  let comment = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        blocks.push(source.slice(start, index + 1).trim());
        start = index + 1;
      }
    } else if (char === ";" && depth === 0) {
      blocks.push(source.slice(start, index + 1).trim());
      start = index + 1;
    }
  }
  const tail = source.slice(start).trim();
  if (tail) blocks.push(tail);
  return blocks.filter(Boolean);
}

function blockKey(block) {
  return block.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
}

function deduplicate(blocks) {
  const seen = new Set();
  const kept = [];
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const key = blockKey(blocks[index]);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(blocks[index]);
  }
  return kept.reverse();
}

// Safe, string/comment-aware CSS minifier. Collapses whitespace and drops
// comments only OUTSIDE quotes, so url(...) and content:"..." stay intact.
// Whitespace around combinators/colons is preserved (single space) to avoid
// breaking descendant selectors; only clearly-insignificant space is removed.
function minifyCss(source) {
  const PUNCT = new Set(["{", "}", ";", ",", ">", "~"]);
  const out = [];
  const last = () => out[out.length - 1];
  let quote = "";
  let comment = false;
  let pendingSpace = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (comment) {
      if (ch === "*" && next === "/") {
        comment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      out.push(ch);
      if (ch === "\\") {
        if (next !== undefined) out.push(next);
        i += 1;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      comment = true;
      i += 1;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f") {
      pendingSpace = true;
      continue;
    }
    // A significant char is about to be written.
    if (pendingSpace) {
      pendingSpace = false;
      // Keep a single space only when it may be a descendant combinator:
      // i.e. between two non-punctuation tokens. Drop it around { } ; , > ~.
      if (out.length && !PUNCT.has(last()) && !PUNCT.has(ch)) out.push(" ");
    }
    // Drop the trailing semicolon right before a closing brace.
    if (ch === "}" && last() === ";") out.pop();
    if (ch === '"' || ch === "'") quote = ch;
    out.push(ch);
  }
  return out.join("").trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Windows can transiently lock the freshly-written bundle (Defender scan, a
// server still serving it), surfacing as EBUSY/EPERM/UNKNOWN. Write atomically
// via a temp file + rename with retries; if it still fails but a valid bundle
// already exists, keep going instead of crashing the server on startup.
async function writeBundle(output) {
  const tmp = `${OUTPUT}.tmp`;
  const retryCodes = new Set(["EBUSY", "EPERM", "UNKNOWN", "EACCES"]);
  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await writeFile(tmp, output, "utf8");
      await rename(tmp, OUTPUT);
      return true;
    } catch (error) {
      lastError = error;
      if (!retryCodes.has(error.code)) throw error;
      await sleep(120 * (attempt + 1));
    }
  }
  let existing = null;
  try {
    existing = await stat(OUTPUT);
  } catch {}
  if (existing && existing.size > 0) {
    console.warn(
      `Review CSS: app.bundle.css qulflangan (${lastError?.code}), mavjud bundle ishlatiladi.`,
    );
    return false;
  }
  throw lastError;
}

export async function buildReviewCss() {
  const blocks = [];
  for (const name of SOURCES) {
    const source = await readFile(join(STYLE_DIR, name), "utf8");
    blocks.push(`/* source: ${name} */`, ...topLevelBlocks(source));
  }
  const kept = deduplicate(blocks);
  const header = "/* Generated by scripts/build-review-css.mjs. Edit source CSS files. */\n";
  const output = header + minifyCss(kept.join("\n")) + "\n";
  const written = await writeBundle(output);
  return { output: OUTPUT, bytes: Buffer.byteLength(output), blocks: kept.length, written };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await buildReviewCss();
  console.log(`Review CSS: ${result.blocks} blok, ${(result.bytes / 1024).toFixed(1)} KB`);
}
