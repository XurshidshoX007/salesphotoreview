import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAgentAllowed, publicBrand } from "../scripts/brand-config.mjs";

const MONTHS_RU = [
  "\u042f\u043d\u0432\u0430\u0440\u044c",
  "\u0424\u0435\u0432\u0440\u0430\u043b\u044c",
  "\u041c\u0430\u0440\u0442",
  "\u0410\u043f\u0440\u0435\u043b\u044c",
  "\u041c\u0430\u0439",
  "\u0418\u044e\u043d\u044c",
  "\u0418\u044e\u043b\u044c",
  "\u0410\u0432\u0433\u0443\u0441\u0442",
  "\u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c",
  "\u041e\u043a\u0442\u044f\u0431\u0440\u044c",
  "\u041d\u043e\u044f\u0431\u0440\u044c",
  "\u0414\u0435\u043a\u0430\u0431\u0440\u044c",
];

const MONTH_ALIASES = [
  ["\u044f\u043d\u0432", "yanv", "jan"],
  ["\u0444\u0435\u0432", "fev", "feb"],
  ["\u043c\u0430\u0440", "mar"],
  ["\u0430\u043f\u0440", "apr"],
  ["\u043c\u0430\u0439", "may"],
  ["\u0438\u044e\u043d", "iyun", "jun"],
  ["\u0438\u044e\u043b", "iyul", "jul"],
  ["\u0430\u0432\u0433", "avg", "aug"],
  ["\u0441\u0435\u043d", "sen", "sep"],
  ["\u043e\u043a\u0442", "okt", "oct"],
  ["\u043d\u043e\u044f", "noy", "nov"],
  ["\u0434\u0435\u043a", "dek", "dec"],
];

const S3_URL_RE = /s3\.timeweb\.cloud\/lalaku\/.*\.(jpg|jpeg|png|webp)(\?|$)/i;
const PHOTO_CELL_RE = /(\d+)\s*T\.T\.\s*\((\d+)\s*фото\)/i;
const API = {
  agentList: "/api/web/dashboard/agent/list",
  clientList: "/api/web/dashboard/agent/client/list",
  photoReportFiles: "/api/web/dashboard/agent/photo-report/files",
  orderList: "/api/web/orders/order/list",
  ordersByAgentsOrderList: "/api/web/report/orders-by-agents/order-list",
};

function brandConfig(options = {}) {
  if (options.brand) return publicBrand(options.brand);
  const code = String(options.brandPrefix || options.code || process.env.BRAND_PREFIX || "LMJ").trim().toUpperCase();
  const fallback = {
    id: code === "JY" ? "sof" : "lalaku_mama",
    name: String(options.brandName || process.env.BRAND_NAME || (code === "JY" ? "SOF" : "Lalaku Mama")).trim(),
    salesBrandNames: [String(options.brandName || process.env.BRAND_NAME || (code === "JY" ? "Sof" : "Lalaku mama")).trim()],
    agentPrefixes: [code || "LMJ"],
    enabled: true,
  };
  return publicBrand(fallback);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePhotoCell(text) {
  const match = String(text || "").replace(/\s+/g, " ").trim().match(PHOTO_CELL_RE);
  if (!match) return null;
  return {
    tt: Number(match[1]),
    expectedPhotos: Number(match[2]),
    photoText: `${match[1]} T.T. (${match[2]} фото)`,
  };
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function valueAt(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function firstValue(obj, paths, fallback = "") {
  for (const path of paths) {
    const value = valueAt(obj, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function parseAmount(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "object") {
    return parseAmount(
      value.amount
        ?? value.value
        ?? value.total
        ?? value.sum
        ?? value.price
        ?? 0,
    );
  }
  const normalized = String(value)
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const ORDER_SUM_FIELDS = [
  "total_order_amount.amount",
  "total_order_amount",
  "total_amount.amount",
  "total_amount",
  "total_cost.amount",
  "total_cost",
  "order_amount.amount",
  "order_amount",
  "total_cost_without_discount.amount",
  "total_cost_without_discount",
  "total_cost_with_discount.amount",
  "total_cost_with_discount",
  "order_sum",
  "orderSum",
  "orders_sum",
  "ordersSum",
  "cost.amount",
  "cost",
  "price.amount",
  "price",
  "summa",
  "sum",
  "amount",
];

function orderSumFrom(value, fallback = 0) {
  const found = firstValue(value, ORDER_SUM_FIELDS, undefined);
  const parsed = parseAmount(found);
  return parsed || parseAmount(fallback);
}

function displayName(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.name || value.title || value.value || value.label || "").trim();
}

function normalizeLookupKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compactLookupKey(value) {
  return normalizeLookupKey(value).replace(/[^a-z0-9а-яё]+/gi, "");
}

function makeDateRange(targetIso) {
  const start = new Date(`${targetIso}T00:00:00.000+05:00`);
  const end = new Date(`${targetIso}T23:59:59.999+05:00`);
  return { from: start.toISOString(), to: end.toISOString() };
}

function collectPerfEnabled() {
  return process.env.COLLECT_PERF !== "0";
}

function nowMs() {
  return Date.now();
}

function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function assertIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Sana noto'g'ri: "${value}". Format YYYY-MM-DD bo'lishi kerak.`);
  }
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y
    || date.getMonth() !== m - 1
    || date.getDate() !== d
  ) {
    throw new Error(`Sana mavjud emas: "${value}"`);
  }
}

function baseFilterPayload(targetDate) {
  return {
    currency_id_arr: [],
    territory_id_arr: [],
    supervisor_id_arr: [],
    agent_id_arr: [],
    trade_direction_id_arr: [],
    client_category_id_arr: [],
    date_range: makeDateRange(targetDate),
  };
}

function uniqueUrls(urls) {
  return [...new Set((urls || []).filter((url) => S3_URL_RE.test(url || "")))];
}

export function collectStatusFromCounts(actualUrls, expectedPhotos) {
  const actual = Number(actualUrls);
  if (expectedPhotos === null || expectedPhotos === undefined || expectedPhotos === "") return "unknown";
  const expected = Number(expectedPhotos);
  if (!Number.isFinite(expected)) return "unknown";
  if (actual === expected) return "ok";
  if (actual === 0) return "empty";
  if (actual < expected) return "partial";
  if (actual > expected) return "extra";
  return "mismatch";
}

function normalizeAgentApiRow(item, index, options = {}) {
  const brand = brandConfig(options);
  const agentObj = item.agent || item.user || item;
  const code = String(firstValue(item, ["agent_code", "agent.code", "code"], "")).trim();
  const agentId = firstValue(item, ["agent.id", "agent_id", "id"], "");
  const name = displayName(agentObj) || String(firstValue(item, ["agent_name", "name"], "")).trim();
  const orderSum = orderSumFrom(item);
  const tt = Number(firstValue(item, ["photo_report_uploaded_client_count"], 0)) || 0;
  const expectedPhotos = Number(firstValue(item, ["uploaded_photo_report_count", "expectedPhotos"], 0)) || 0;
  if (!agentId || !isAgentAllowed(code, brand)) return null;
  return {
    index,
    agentId,
    code,
    name,
    agent: name || code,
    rowText: `${name} ${code}`,
    orderSum,
    tt,
    expectedPhotos,
    photoText: `${tt} T.T. (${expectedPhotos} фото)`,
    apiRow: item,
  };
}

function normalizeClientApiRow(item) {
  const clientObj = item.client || item;
  const apiId = firstValue(item, ["client.id", "client_id", "id"], "");
  const visualId = String(firstValue(item, ["visual_id", "client.visual_id", "client.visualId", "client.code"], "")).trim();
  const name = displayName(clientObj) || String(firstValue(item, ["client_name", "name"], "")).trim();
  const orderSum = orderSumFrom(item);
  const category = displayName(item.category || item.client_category || clientObj.category);
  const territory = displayName(item.territory || clientObj.territory);
  const photoCategory = Array.isArray(item.photo_report_categories)
    ? item.photo_report_categories.map(displayName).filter(Boolean).join(", ")
    : displayName(item.photo_report_categories || item.photo_report_category);
  return { apiId, visualId, name, orderSum, category, territory, photoCategory };
}

function normalizeOrderApiRow(item) {
  const clientObj = item.client || item.customer || item.counterparty || {};
  const apiId = firstValue(item, [
    "client.id",
    "client_id",
    "customer.id",
    "customer_id",
    "counterparty.id",
    "counterparty_id",
  ], "");
  const visualId = String(firstValue(item, [
    "client.visual_id",
    "client.visualId",
    "client.code",
    "client.visual_code",
    "client.visualId",
    "client.visual_code",
    "customer.visual_id",
    "customer.visualId",
    "customer.code",
    "customer.visual_code",
    "counterparty.visual_id",
    "counterparty.visualId",
    "counterparty.code",
    "counterparty.visual_code",
    "visual_id",
    "visualId",
    "client_code",
    "client_visual_id",
    "clientVisualId",
  ], "")).trim();
  const name = displayName(clientObj)
    || String(firstValue(item, [
      "client_name",
      "clientName",
      "client.name",
      "client.legal_name",
      "client.legalName",
      "customer_name",
      "customer.name",
      "legal_name",
      "legalName",
      "name",
    ], "")).trim();
  const orderSum = orderSumFrom(item);
  const status = displayName(item.status || item.order_status || item.state)
    || String(firstValue(item, ["status_name", "order_status_name"], "")).trim();
  const orderId = firstValue(item, ["id", "order_id", "number", "code", "visual_id", "visualId"], "");
  const agentObj = item.agent || item.user || item.sales_agent || {};
  const agentId = firstValue(item, ["agent.id", "agent_id", "sales_agent.id", "sales_agent_id", "user.id", "user_id"], "");
  const agentCode = String(firstValue(item, [
    "agent_code",
    "agent_visual_id",
    "agent_name",
    "agent.code",
    "sales_agent.code",
    "user.code",
  ], "")).trim();
  return { apiId, visualId, name, orderSum, status, orderId, agentId, agentCode, raw: item };
}

function isCountableOrder(order) {
  const status = normalizeLookupKey(order?.status || "");
  if (!status) return true;
  return !/(отмен|bekor|cancel|возврат|return)/i.test(status);
}

function addClientMap(map, client) {
  for (const key of [client.apiId, client.visualId, client.name]) {
    if (!key) continue;
    const normalized = normalizeLookupKey(key);
    const compact = compactLookupKey(key);
    if (normalized) map.set(normalized, client);
    if (compact) map.set(compact, client);
  }
}

function addOrderToClientMap(map, order) {
  const keys = [order.apiId, order.visualId, order.name].filter(Boolean);
  let client = lookupClient(map, keys);
  if (!client || !Object.keys(client).length) {
    client = {
      apiId: order.apiId,
      visualId: order.visualId,
      name: order.name,
      orderSum: 0,
      orderCount: 0,
      orderIds: [],
      orderStatuses: [],
    };
  }
  client.orderSum = (Number(client.orderSum) || 0) + (Number(order.orderSum) || 0);
  client.orderCount = (Number(client.orderCount) || 0) + 1;
  client.orderKnown = true;
  client.orderSource = "zayavki";
  if (order.orderId) client.orderIds = [...new Set([...(client.orderIds || []), order.orderId])];
  if (order.status) client.orderStatuses = [...new Set([...(client.orderStatuses || []), order.status])];
  addClientMap(map, client);
  return client;
}

function lookupClient(clientMap, keys) {
  for (const key of keys) {
    const normalized = normalizeLookupKey(key);
    const compact = compactLookupKey(key);
    if (normalized && clientMap.has(normalized)) return clientMap.get(normalized);
    if (compact && clientMap.has(compact)) return clientMap.get(compact);
  }
  return {};
}

function findPhotoUrlsDeep(value, depth = 0) {
  if (value == null || depth > 4) return [];
  if (typeof value === "string") return S3_URL_RE.test(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((item) => findPhotoUrlsDeep(item, depth + 1));
  if (typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (!/url|path|src|file|image|photo/i.test(key) && depth > 0) return [];
    return findPhotoUrlsDeep(child, depth + 1);
  });
}

function collectPhotoObjects(value, out = []) {
  if (value == null) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectPhotoObjects(item, out);
    return out;
  }
  if (typeof value !== "object") return out;

  const urls = uniqueUrls(findPhotoUrlsDeep(value));
  const hasMetadata = Boolean(
    firstValue(value, ["upload_time", "uploadTime", "created_at", "createdAt", "date"], "")
      || value.client
      || value.agent
      || value.photo_report_category
      || value.photo_report_category_id
  );
  if (urls.length && hasMetadata) out.push({ source: value, urls });

  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectPhotoObjects(child, out);
  }
  return out;
}

function normalizePhotoApiData(data, clientMap, { orderLookupKnown = false } = {}) {
  const seen = new Set();
  const photos = [];

  for (const candidate of collectPhotoObjects(data)) {
    const item = candidate.source;
    const clientObj = item.client || {};
    const clientKeys = [
      "client.id",
      "client_id",
      "client.visual_id",
      "client.visualId",
      "client.code",
      "visual_id",
      "visualId",
      "client.visual_code",
      "client.name",
      "client_name",
      "name",
    ].map((path) => firstValue(item, [path], "")).filter(Boolean);
    clientKeys.push(displayName(clientObj));
    const mapped = lookupClient(clientMap, clientKeys);
    const client = displayName(clientObj) || String(firstValue(item, ["client_name"], "")) || mapped.name || "";
    const clientOrderSum = orderSumFrom(item, mapped.orderSum || 0);
    const clientOrderCount = Number(mapped.orderCount || 0) || (clientOrderSum > 0 ? 1 : 0);
    const clientId = String(firstValue(item, [
      "client.visual_id",
      "client.visualId",
      "client.code",
      "visual_id",
      "client_id",
    ], mapped.visualId || mapped.apiId || "")).trim();
    const category = displayName(item.client_category || item.category || clientObj.category) || mapped.category || "";
    const territory = displayName(item.territory || clientObj.territory) || mapped.territory || "";
    const photoCategory = displayName(item.photo_report_category || item.photo_report_categories || item.category_name)
      || mapped.photoCategory
      || "";
    const photoTime = String(firstValue(item, [
      "upload_time",
      "uploadTime",
      "uploaded_at",
      "created_at",
      "createdAt",
      "date",
    ], "")).trim();
    const orderKnown = Boolean(mapped.orderKnown || orderLookupKnown || clientOrderSum > 0 || clientOrderCount > 0);
    const hasOrder = clientOrderSum > 0 || clientOrderCount > 0;

    for (const url of candidate.urls) {
      if (seen.has(url)) continue;
      seen.add(url);
      photos.push({
        page: 1,
        row: photos.length + 1,
        category,
        client,
        clientOrderSum,
        clientOrderCount,
        clientHasOrder: orderKnown ? hasOrder : undefined,
        clientOrderKnown: orderKnown,
        clientOrderSource: mapped.orderSource || (hasOrder ? "zayavki" : ""),
        clientOrderStatuses: mapped.orderStatuses || [],
        clientId,
        photoCategory,
        territory,
        photoTime,
        urls: [url],
      });
    }
  }

  return photos.map((photo, index) => ({ ...photo, row: index + 1 }));
}

async function salesApiPost(tab, path, payload) {
  const timeoutMs = Math.max(5000, Number(process.env.SALES_API_TIMEOUT_MS || 45000) || 45000);
  return tab.playwright.evaluate(async ({ path, payload, timeoutMs }) => {
    const getCookie = (name) => document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1);
    const rawToken = getCookie("token")
      || localStorage.getItem("token")
      || sessionStorage.getItem("token")
      || "";
    const token = rawToken ? decodeURIComponent(rawToken).replace(/^"|"$/g, "") : "";
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tashkent",
      "Accept-Language": navigator.language || "uz",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    let text = "";
    try {
      res = await fetch(path, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      text = await res.text();
    } finally {
      clearTimeout(timeout);
    }
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) throw new Error(json?.message || json?.Messages?.[0] || text || `HTTP ${res.status}`);
    return json;
  }, { path, payload, timeoutMs });
}

async function fetchPaged(tab, path, basePayload, { pageSize = 500, maxPages = 50 } = {}) {
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await salesApiPost(tab, path, {
      ...basePayload,
      page,
      page_size: pageSize,
    });
    const items = asArray(data);
    all.push(...items);
    if (items.length < pageSize || items.length === 0) break;
  }
  return all;
}

function orderListPayloadForAgent(targetDate, row) {
  return {
    branch_id_arr: [],
    status_arr: [],
    type_arr: [],
    price_type_id_arr: [],
    currency_id_arr: [],
    day_arr: [],
    trade_direction_id_arr: [],
    territory_id_arr: [],
    product_category_id_arr: [],
    product_id_arr: [],
    client_category_id_arr: [],
    warehouse_id_arr: [],
    expeditor_id_arr: [],
    invoice_type_id_arr: [],
    filter: [
      { field: "for_consignation", value: [] },
      { field: "client_id", value: [] },
    ],
    date_filter_type: 1,
    date_range: makeDateRange(targetDate),
    search: null,
    order_by: null,
    page_size: 1000,

    // Sales "Zayavki" sahifasi ko'p tanlovli agent filteridan foydalanadi.
    // Eski agent_id ayrim endpointlarda ishlamaydi, shuning uchun ikkalasini
    // ham beramiz: server o'zi tanigan maydonni oladi.
    agent_id: row.agentId,
    agent_id_arr: row.agentId ? [row.agentId] : [],

    // date_filter_type=1 frontenddagi OrderListDateFilterType.ByOrderDate.
    // Sales Zayavki sahifasi sanani Toshkent kuni bo'yicha UTC interval yuboradi.
  };
}

function orderListPayloadForDate(targetDate) {
  return {
    ...orderListPayloadForAgent(targetDate, {}),
    agent_id: undefined,
    agent_id_arr: [],
  };
}

function orderReportPayloadForAgent(targetDate, row) {
  return {
    branch_id_arr: [],
    order_status_arr: [],
    price_type_id_arr: [],
    currency_id_arr: [],
    agent_id_arr: row.agentId ? [row.agentId] : [],
    trade_direction_id_arr: [],
    territory_id_arr: [],
    category_id_arr: [],
    product_id_arr: [],
    product_group_id_arr: [],
    client_category_id_arr: [],
    segment_id_arr: [],
    date_filter_type: 1,
    date_range: makeDateRange(targetDate),
    order_type: undefined,
    consignation_filter_type: undefined,
    result_value_type: 3,
    search: "",
    order_by: {
      field: "order_date",
      is_asc: true,
    },
    filter: [
      {
        field: "is_active",
        value: ["true"],
      },
    ],
    page_size: 1000,
  };
}

function orderReportPayloadForDate(targetDate) {
  return {
    ...orderReportPayloadForAgent(targetDate, {}),
    agent_id_arr: [],
  };
}

function buildOrderIndex(orderRows = []) {
  const byAgentId = new Map();
  const byAgentCode = new Map();
  const normalized = orderRows.map(normalizeOrderApiRow).filter((order) => (
    (order.apiId || order.visualId || order.name) && isCountableOrder(order)
  ));
  for (const order of normalized) {
    if (order.agentId) {
      const key = String(order.agentId);
      const list = byAgentId.get(key) || [];
      list.push(order);
      byAgentId.set(key, list);
    }
    if (order.agentCode) {
      const key = normalizeLookupKey(order.agentCode);
      const list = byAgentCode.get(key) || [];
      list.push(order);
      byAgentCode.set(key, list);
    }
  }
  return { rows: orderRows, normalized, byAgentId, byAgentCode };
}

function ordersForAgentFromIndex(orderIndex, row) {
  if (!orderIndex) return null;
  const found = [];
  if (row.agentId && orderIndex.byAgentId.has(String(row.agentId))) {
    found.push(...orderIndex.byAgentId.get(String(row.agentId)));
  }
  const codeKey = normalizeLookupKey(row.code);
  if (codeKey && orderIndex.byAgentCode.has(codeKey)) {
    found.push(...orderIndex.byAgentCode.get(codeKey));
  }
  const seen = new Set();
  return found.filter((order) => {
    const key = order.apiId || order.visualId || order.orderId || `${order.name}:${order.orderSum}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function prefetchOrderIndex(tab, targetDate) {
  if (process.env.COLLECT_ORDER_PREFETCH === "0") return null;
  const variants = [
    ["all_agent_id_arr", API.orderList, orderListPayloadForDate(targetDate)],
    ["all_report_agent", API.ordersByAgentsOrderList, orderReportPayloadForDate(targetDate)],
  ];
  let lastError = null;
  for (const [scope, path, payload] of variants) {
    try {
      const rows = await fetchPaged(tab, path, payload, {
        pageSize: Math.max(500, Number(process.env.COLLECT_ORDER_PAGE_SIZE || 1000) || 1000),
        maxPages: Math.max(1, Number(process.env.COLLECT_ORDER_MAX_PAGES || 100) || 100),
      });
      if (rows.length || scope === variants.at(-1)[0]) {
        const index = buildOrderIndex(rows);
        return { ...index, scope };
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (process.env.COLLECT_ORDER_PREFETCH_STRICT === "1" && lastError) throw lastError;
  return null;
}

async function fetchAgentOrderRows(tab, row, targetDate) {
  const payload = orderListPayloadForAgent(targetDate, row);
  const reportPayload = orderReportPayloadForAgent(targetDate, row);
  const variants = [
    ["agent_id_arr", payload],
    ["report_agent", reportPayload],
  ];
  let lastError = null;
  for (let index = 0; index < variants.length; index += 1) {
    const [scope, variant] = variants[index];
    try {
      const path = String(scope).startsWith("report_") ? API.ordersByAgentsOrderList : API.orderList;
      const rows = await fetchPaged(tab, path, variant, { pageSize: 1000, maxPages: 100 });
      if (rows.length || index === variants.length - 1) return { rows, scope };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Zayavki bo'yicha buyurtmalar olinmadi");
}

export async function readLmjRowsFromApi(tab, targetDate, options = {}) {
  const brand = brandConfig(options);
  const payload = {
    ...baseFilterPayload(targetDate),
    search: (brand.agentPrefixes[0] || brand.code).toLowerCase(),
    order_by: null,
  };
  const items = await fetchPaged(tab, API.agentList, payload, { pageSize: 500 });
  return items
    .map((item, index) => normalizeAgentApiRow(item, index, brand))
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));
}

async function collectAgentPhotosFromApi(tab, row, targetDate, options = {}) {
  const orderIndex = options.orderIndex || null;
  const filter = baseFilterPayload(targetDate);
  const [clientRows, photoData] = await Promise.all([
    fetchPaged(tab, API.clientList, { ...filter, search: null, order_by: null, agent_id: row.agentId }, { pageSize: 500, maxPages: 20 }),
    salesApiPost(tab, API.photoReportFiles, { agent_id: row.agentId, client_id: null, date_range: filter.date_range }),
  ]);
  const clientMap = new Map();
  const clients = clientRows.map(normalizeClientApiRow);
  for (const clientRow of clients) addClientMap(clientMap, clientRow);

  let orderRows = [];
  let orderLookupStatus = "skipped";
  let orderLookupError = "";
  let orderLookupScope = "";
  try {
    let orders = ordersForAgentFromIndex(orderIndex, row);
    if (orders) {
      orderRows = orders.map((order) => order.raw || order);
      orderLookupScope = orderIndex.scope || "prefetch";
    } else {
      const orderResult = await fetchAgentOrderRows(tab, row, targetDate);
      orderRows = orderResult.rows;
      orderLookupScope = orderResult.scope;
      orders = orderRows.map(normalizeOrderApiRow).filter((order) => {
        if (!(order.apiId || order.visualId || order.name) || !isCountableOrder(order)) return false;
        const hasAgentInfo = Boolean(order.agentId || order.agentCode);
        const agentIdOk = order.agentId && String(order.agentId) === String(row.agentId);
        const agentCodeOk = order.agentCode && normalizeLookupKey(order.agentCode) === normalizeLookupKey(row.code);
        return !hasAgentInfo || agentIdOk || agentCodeOk;
      });
    }
    for (const order of orders) addOrderToClientMap(clientMap, order);
    orderLookupStatus = orders.length ? "ok" : (orderRows.length ? "unmatched" : "empty");
  } catch (error) {
    orderLookupStatus = "error";
    orderLookupError = String(error?.message || error);
  }

  const photos = normalizePhotoApiData(photoData, clientMap, {
    orderLookupKnown: orderLookupStatus === "ok" || orderLookupStatus === "empty",
  });
  const urls = photos.flatMap((photo) => photo.urls);
  const actualUrls = urls.length;
  const countOk = actualUrls === row.expectedPhotos;
  return {
    ...row,
    urls,
    clients,
    orders: orderRows.map(normalizeOrderApiRow),
    orderLookupStatus,
    orderLookupScope,
    orderLookupError,
    photos,
    actualUrls,
    countOk,
    status: countOk ? "ok" : (actualUrls > 0 ? "partial" : "empty"),
    source: "api",
  };
}

/** Brauzer kontekstida: faqat foto modal ichidagi rasmlar */
function s3PhotoUrlsFromModalRoot() {
  const isPhotoUrl = (src) => S3_URL_RE.test(src || "");
  const roots = [
    ...document.querySelectorAll('[role="dialog"]'),
    ...document.querySelectorAll(".v-overlay__content"),
    ...document.querySelectorAll(".modal, .d-modal, [class*='modal']"),
  ].filter((el) => {
    const text = (el.innerText || "").replace(/\s+/g, " ");
    return /Фотоотчет:/i.test(text) || /Все картинки/i.test(text);
  });
  const root = roots.at(-1) || document.body;
  return [...new Set(
    Array.from(root.querySelectorAll("img"))
      .map((img) => img.currentSrc || img.src || "")
      .filter(isPhotoUrl),
  )];
}

function readPhotoModalTitle() {
  const lines = document.body.innerText.split("\n").map((x) => x.trim()).filter(Boolean);
  return lines.find((x) => /Фотоотчет:/i.test(x) && !/Дашбоард/i.test(x)) || "";
}

function isPhotoModalOpen() {
  return !!readPhotoModalTitle() || !!document.body.innerText.includes("Все картинки");
}

async function clickCenter(tab, rect) {
  await tab.cua.click({
    x: Math.round(rect.x + rect.width / 2),
    y: Math.round(rect.y + rect.height / 2),
  });
}

async function elementRect(tab, selector, index = 0) {
  const rect = await tab.playwright.evaluate(
    ({ selector, index }) => {
      const items = [...document.querySelectorAll(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.y >= 0 && r.y < innerHeight && r.x >= 0 && r.x < innerWidth;
      });
      const el = items[index];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    },
    { selector, index },
  );
  if (!rect) throw new Error(`Element topilmadi: ${selector} #${index}`);
  return rect;
}

export async function closePhotoModals(tab, { timeoutMs = 3000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const closeRect = await tab.playwright.evaluate(() => {
      const roots = [
        ...document.querySelectorAll('[role="dialog"]'),
        ...document.querySelectorAll(".v-overlay__content"),
        ...document.querySelectorAll(".modal, .d-modal, [class*='modal']"),
      ].filter((el) => {
        const text = (el.innerText || "").replace(/\s+/g, " ");
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (/Фотоотчет:/i.test(text) || text.includes("Все картинки"));
      });
      const root = roots.at(-1);

      const imageViewerOpen = [...document.querySelectorAll("img")].some((img) => {
        const src = img.currentSrc || img.src || "";
        const r = img.getBoundingClientRect();
        return /s3\.timeweb\.cloud\/lalaku\/.*\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)
          && r.width > Math.min(260, innerWidth * 0.25)
          && r.height > Math.min(260, innerHeight * 0.25);
      });

      const closeText = (el) => (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || el.className || "")
        .toString()
        .replace(/\s+/g, " ")
        .trim();

      if (!root && imageViewerOpen) {
        const globalBest = [...document.querySelectorAll("button, [role='button'], [class*='close'], .mdi-close, .v-icon")]
          .map((el) => {
            const text = closeText(el);
            const r = el.getBoundingClientRect();
            const closeLike = text === "×" || /close|закрыть|yopish|mdi-close/i.test(text);
            const visible = r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.x < innerWidth && r.y < innerHeight;
            const likelyViewerClose = r.x > innerWidth - 120 && r.y < 220;
            const score = (closeLike ? 1000 : 0) + (likelyViewerClose ? 500 : 0) - Math.abs(innerWidth - (r.x + r.width)) - r.y;
            return { text, x: r.x, y: r.y, width: r.width, height: r.height, score, visible, closeLike };
          })
          .filter((r) => r.visible && r.closeLike && r.score > 300)
          .sort((a, b) => b.score - a.score)[0];
        return globalBest || { escOnly: true };
      }

      if (!root) return null;

      const rootRect = root.getBoundingClientRect();
      const buttons = [...root.querySelectorAll("button")].map((el) => {
        const text = closeText(el);
        const r = el.getBoundingClientRect();
        const nearTopRight = r.x > rootRect.right - 90 && r.y < rootRect.top + 80;
        const closeLike = text === "×" || /закрыть|yopish|close/i.test(text);
        const smallSquare = r.width > 0 && r.width <= 48 && r.height > 0 && r.height <= 48;
        const score = (closeLike ? 1000 : 0)
          + (nearTopRight ? 500 : 0)
          + (smallSquare ? 100 : 0)
          - Math.abs(rootRect.right - (r.x + r.width))
          - Math.abs(r.y - rootRect.top);
        return { text, x: r.x, y: r.y, width: r.width, height: r.height, score };
      }).filter((r) => r.width > 0 && r.height > 0 && (r.score > 0 || r.x > rootRect.right - 120));

      const best = buttons.sort((a, b) => b.score - a.score)[0];
      return best ? { x: best.x, y: best.y, width: best.width, height: best.height } : { escOnly: true };
    });

    if (!closeRect) return true;
    if (!closeRect.escOnly) {
      await clickCenter(tab, closeRect).catch(() => {});
      await tab.playwright.waitForTimeout(140);
    }
    await tab.cua.keypress({ keys: ["ESC"] }).catch(() => {});
    await tab.playwright.waitForTimeout(140);
  }
  return false;
}

/** @deprecated use closePhotoModals */
export async function closeOverlays(tab) {
  return closePhotoModals(tab);
}

function modalTitleMatchesCode(modalTitle, code) {
  if (!modalTitle || !code) return false;
  const upper = modalTitle.toUpperCase();
  const agentCode = String(code).toUpperCase();
  if (upper.includes(agentCode)) return true;
  const compact = agentCode.replace(/(\D+)(\d+)/, "$1 $2");
  return upper.includes(compact);
}

function normalizeAgentTitle(text) {
  return String(text || "")
    .replace(/^Фотоотчет:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function modalTitleMatchesRow(modalTitle, row) {
  if (modalTitleMatchesCode(modalTitle, row.code)) return true;
  const title = normalizeAgentTitle(modalTitle);
  const name = normalizeAgentTitle(row.name);
  return !!name && (title.includes(name) || name.includes(title));
}

export async function readSalesDateInput(tab) {
  return tab.playwright.evaluate(() => {
    const parts = [];
    for (const input of document.querySelectorAll("input.dp__input, input[placeholder*='Дата'], input")) {
      if (input.value) parts.push(input.value);
    }
    for (const el of document.querySelectorAll(".dp__input_wrap, .dp__main, [class*='date'], [class*='Date']")) {
      const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      if (text) parts.push(text);
    }
    return [...new Set(parts)].join(" | ");
  });
}

export async function isSalesDateSet(tab, targetIso) {
  const value = await readSalesDateInput(tab);
  const [y, m, d] = targetIso.split("-").map(Number);
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const normalized = value.toLowerCase().replace(/\s+/g, " ");
  const monthAliases = MONTH_ALIASES[m - 1] || [];
  return (
    normalized.includes(`${dd}.${mm}.${y}`)
    || normalized.includes(`${d}.${m}.${y}`)
    || normalized.includes(targetIso)
    || normalized.includes(`${y}-${mm}-${dd}`)
    || (normalized.includes(dd) && normalized.includes(String(y)) && monthAliases.some((name) => normalized.includes(name)))
  );
}

export async function setSalesDate(tab, targetIso) {
  if (await isSalesDateSet(tab, targetIso)) {
    return readSalesDateInput(tab);
  }

  const [targetYear, targetMonth] = targetIso.split("-").map(Number);

  await closePhotoModals(tab);
  await tab.playwright.evaluate(() => window.scrollTo(0, 0));
  await tab.playwright.waitForTimeout(300);
  await clickCenter(tab, await elementRect(tab, "input.dp__input"));
  await tab.playwright.waitForTimeout(500);
  for (let wait = 0; wait < 10; wait += 1) {
    const open = await tab.playwright.evaluate(() => !!document.querySelector(".dp__month_year_wrap, .dp__menu"));
    if (open) break;
    await clickCenter(tab, await elementRect(tab, "input.dp__input"));
    await tab.playwright.waitForTimeout(300);
  }

  for (let guard = 0; guard < 48; guard += 1) {
    const current = await tab.playwright.evaluate(() => {
      const el = document.querySelector(".dp__month_year_wrap")
        || document.querySelector(".dp--header-wrap")
        || document.querySelector("[data-dp-element='overlay-month']");
      return (el?.innerText || document.querySelector(".dp__month_year_select")?.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
    });
    const match = current.match(/(\S+)\s+(\d{4})/);
    if (!match) {
      if (guard < 8) {
        await tab.playwright.waitForTimeout(400);
        continue;
      }
      throw new Error(
        `Kalendar ochilmadi. Sanani qo'lda ${targetIso} qilib, APPLY_DATE=0 bilan qayta urinib ko'ring.`,
      );
    }

    const currentMonth = MONTHS_RU.indexOf(match[1]) + 1;
    const currentYear = Number(match[2]);
    const diff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);
    if (diff === 0) break;

    const navIndex = diff < 0 ? 0 : 1;
    await clickCenter(tab, await elementRect(tab, "button.dp--arrow-btn-nav", navIndex));
    await tab.playwright.waitForTimeout(250);
  }

  const dayRect = await tab.playwright.evaluate((targetIso) => {
    const el = document.getElementById(targetIso);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, targetIso);
  if (!dayRect) throw new Error(`Kalendar ichida sana topilmadi: ${targetIso}`);

  await clickCenter(tab, dayRect);
  await tab.playwright.waitForTimeout(500);
  await tab.playwright.getByText("Применить", { exact: true }).click();
  await tab.playwright.waitForTimeout(3000);

  return readSalesDateInput(tab);
}

function parseLmjRow(tr, index, options = {}) {
  const brand = brandConfig(options);
  const text = tr.innerText.replace(/\s+/g, " ").trim();
  const cells = [...tr.querySelectorAll("td,th")].map((cell) => cell.innerText.replace(/\s+/g, " ").trim());
  const codeRe = new RegExp(`^(${brand.agentPrefixes.map(escapeRegExp).join("|")})[A-Z0-9]+$`, "i");
  const code = cells.find((cell) => codeRe.test(cell));
  const photo = cells.map(parsePhotoCell).find(Boolean) || parsePhotoCell(text);
  if (!code || !photo) return null;
  const orderSum = Number((cells[2] || "").replace(/[^\d.]/g, "")) || 0;
  return {
    index,
    code,
    name: cells[0] || "",
    rowText: text,
    orderSum,
    tt: photo.tt,
    expectedPhotos: photo.expectedPhotos,
    photoText: photo.photoText,
  };
}

export async function readLmjRows(tab, options = {}) {
  const brand = brandConfig(options);
  await closePhotoModals(tab);

  const searchInputs = await tab.playwright.evaluate(() => [...document.querySelectorAll("input")].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      value: el.value || "",
      placeholder: el.getAttribute("placeholder") || "",
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    };
  }).filter((x) => x.width > 0 && x.height > 0));

  const searchPrefix = brand.agentPrefixes[0] || brand.code;
  const search = [...searchInputs].reverse().find((x) => /poisk|search|qidir|поиск/i.test(x.placeholder) || x.value.toLowerCase() === searchPrefix.toLowerCase());
  if (search) {
    await clickCenter(tab, search);
    await tab.cua.keypress({ keys: ["CTRL", "A"] });
    await tab.cua.type({ text: searchPrefix.toLowerCase() });
    await tab.playwright.waitForTimeout(600);
  }

  const byCode = new Map();
  await tab.playwright.evaluate(() => window.scrollTo(0, 0));
  await tab.playwright.waitForTimeout(180);

  for (let pass = 0; pass < 80; pass += 1) {
    const batch = await tab.playwright.evaluate((prefixes) => Array.from(document.querySelectorAll("tr"))
      .map((tr, index) => {
        const text = tr.innerText.replace(/\s+/g, " ").trim();
        const cells = [...tr.querySelectorAll("td,th")].map((cell) => cell.innerText.replace(/\s+/g, " ").trim());
        const escaped = prefixes.map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const codeRe = new RegExp(`^(${escaped})[A-Z0-9]+$`, "i");
        const code = cells.find((cell) => codeRe.test(cell));
        const photoCell = cells.find((cell) => /T\.T\.\s*\(\d+\s*фото\)/i.test(cell)) || text;
        const match = photoCell.match(/(\d+)\s*T\.T\.\s*\((\d+)\s*фото\)/i);
        if (!code || !match) return null;
        const orderSum = Number((cells[2] || "").replace(/[^\d.]/g, "")) || 0;
        return {
          index,
          code,
          name: cells[0] || "",
          rowText: text,
          orderSum,
          tt: Number(match[1]),
          expectedPhotos: Number(match[2]),
          photoText: `${match[1]} T.T. (${match[2]} фото)`,
        };
      })
      .filter(Boolean), brand.agentPrefixes);

    for (const row of batch) byCode.set(row.code, row);

    const atBottom = await tab.playwright.evaluate(() => {
      const y = window.scrollY + window.innerHeight;
      return y >= document.body.scrollHeight - 4;
    });
    if (atBottom) break;
    await tab.playwright.evaluate(() => window.scrollBy(0, Math.max(500, Math.floor(window.innerHeight * 0.95))));
    await tab.playwright.waitForTimeout(120);
  }

  await tab.playwright.evaluate(() => window.scrollTo(0, 0));
  await tab.playwright.waitForTimeout(120);
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

async function scrollAgentRowIntoView(tab, row) {
  const rect = await tab.playwright.evaluate((code) => {
    const tr = [...document.querySelectorAll("tr")].find((item) => {
      const cells = [...item.querySelectorAll("td,th")].map((cell) => cell.innerText.replace(/\s+/g, " ").trim());
      return cells.some((cell) => cell.toUpperCase() === String(code).toUpperCase());
    });
    if (!tr) return null;
    tr.scrollIntoView({ block: "center", behavior: "instant" });
    const cells = [...tr.querySelectorAll("td,th")];
    const target = [...cells].reverse().find((cell) => /T\.T\.\s*\(\d+\s*фото\)/i.test(cell.innerText)) || cells.at(-1);
    const r = (target || tr).getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, row.code);
  if (!rect) throw new Error(`Agent qatori topilmadi: ${row.code}`);
  await tab.playwright.waitForTimeout(80);
  return rect;
}

async function openAgentPhotoModal(tab, row) {
  await closePhotoModals(tab);
  const rect = await scrollAgentRowIntoView(tab, row);
  await clickCenter(tab, rect);
  await tab.playwright.waitForTimeout(250);

  let modalTitle = "";
  for (let wait = 0; wait < 8; wait += 1) {
    modalTitle = await tab.playwright.evaluate(() => {
      const lines = document.body.innerText.split("\n").map((x) => x.trim()).filter(Boolean);
      return lines.find((x) => /Фотоотчет:/i.test(x) && !/Дашбоард/i.test(x)) || "";
    });
    if (modalTitleMatchesRow(modalTitle, row)) break;
    await tab.playwright.waitForTimeout(150);
  }

  if (!modalTitleMatchesRow(modalTitle, row)) {
    throw new Error(`Modal agent mos emas: kutilgan ${row.code}, topildi: ${modalTitle || "(bo'sh)"}`);
  }
  return modalTitle;
}

async function waitForPhotoUrls(tab, expectedPhotos, { timeoutMs = 2200 } = {}) {
  const started = Date.now();
  let lastCount = 0;
  let stablePasses = 0;
  let urls = [];

  while (Date.now() - started < timeoutMs) {
    urls = await tab.playwright.evaluate(() => {
      const isPhotoUrl = (src) => /s3\.timeweb\.cloud\/lalaku\/.*\.(jpg|jpeg|png|webp)(\?|$)/i.test(src || "");
      const roots = [
        ...document.querySelectorAll('[role="dialog"]'),
        ...document.querySelectorAll(".v-overlay__content"),
        ...document.querySelectorAll(".modal, .d-modal, [class*='modal']"),
      ].filter((el) => {
        const text = (el.innerText || "").replace(/\s+/g, " ");
        return /Фотоотчет:/i.test(text) || /Все картинки/i.test(text);
      });
      const root = roots.at(-1) || document.body;
      return [...new Set(
        Array.from(root.querySelectorAll("img"))
          .map((img) => img.currentSrc || img.src || "")
          .filter(isPhotoUrl),
      )];
    });
    if (urls.length === expectedPhotos) return urls;
    if (urls.length === lastCount && urls.length > 0) stablePasses += 1;
    else stablePasses = 0;
    lastCount = urls.length;
    if (stablePasses >= 1 && urls.length > 0) return urls;
    await tab.playwright.waitForTimeout(120);
  }
  return urls;
}

async function collectAgentUrlsOnce(tab, row) {
  const modalTitle = await openAgentPhotoModal(tab, row);
  await tab.playwright.getByText("Все картинки", { exact: true }).click();
  await tab.playwright.waitForTimeout(120);
  const urls = await waitForPhotoUrls(tab, row.expectedPhotos);
  await closePhotoModals(tab);

  const actualUrls = urls.length;
  const countOk = actualUrls === row.expectedPhotos;
  const status = collectStatusFromCounts(actualUrls, row.expectedPhotos);
  return {
    ...row,
    urls,
    modalTitle,
    actualUrls,
    countOk,
    status,
  };
}

export async function collectAgentUrls(tab, row, { maxAttempts = 1 } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const item = await collectAgentUrlsOnce(tab, row);
      if (item.countOk || attempt === maxAttempts) {
        return { ...item, attempts: attempt };
      }
      await closePhotoModals(tab);
      await tab.playwright.waitForTimeout(500);
    } catch (error) {
      lastError = error;
      await closePhotoModals(tab);
      await tab.playwright.waitForTimeout(500);
    }
  }
  throw lastError || new Error(`Agent yig'ib bo'lmadi: ${row.code}`);
}

function collectConcurrency(collectionMode) {
  if (collectionMode !== "api") return 1;
  return Math.max(1, Math.min(24, Number(process.env.COLLECT_CONCURRENCY || 12) || 12));
}

function collectFlushEvery() {
  return Math.max(1, Number(process.env.COLLECT_FLUSH_EVERY || 25) || 25);
}

function buildCollectData({ targetDate, brand, appliedDateText, collectionMode, apiError, rows, rowsInScope, rowsWithPhotos, agents }) {
  return {
    date: targetDate,
    brand,
    appliedDateText,
    collectionMode,
    apiError,
    collectedAt: new Date().toISOString(),
    totalRows: rows.length,
    totalAgents: rowsInScope.length,
    totalAgentsWithPhotos: rowsWithPhotos.length,
    agents: agents.filter(Boolean),
    stats: summarizeAgents(agents.filter(Boolean)),
  };
}

export async function collectLmjForSalesDate(tab, {
  targetDate,
  outPath,
  applyDate = true,
  limitAgents = Infinity,
  progress = () => {},
  brandPrefix,
  brandName,
  brand: selectedBrand,
} = {}) {
  const brand = brandConfig({ brandPrefix, brandName, brand: selectedBrand });
  if (!targetDate) throw new Error("targetDate kerak: YYYY-MM-DD");
  assertIsoDate(targetDate);
  const absoluteOut = resolve(outPath || `outputs/${brand.filePrefix}_browser_collect_${targetDate}_raw.json`);
  await mkdir(dirname(absoluteOut), { recursive: true });

  const appliedDateText = applyDate
    ? await setSalesDate(tab, targetDate)
    : `API date_range: ${targetDate}`;
  let rows = [];
  let collectionMode = "api";
  let apiError = "";
  const strictApi = process.env.STRICT_API === "1";
  if (process.env.FORCE_DOM === "1") {
    if (strictApi) throw new Error("STRICT_API=1 rejimida FORCE_DOM ishlatilmaydi.");
    collectionMode = "dom";
    rows = await readLmjRows(tab, brand);
  } else {
    try {
      rows = await readLmjRowsFromApi(tab, targetDate, brand);
      if (!rows.length) throw new Error(`API ${brand.code} agent qaytarmadi`);
    } catch (error) {
      apiError = String(error?.message || error);
      if (strictApi) {
        throw new Error(`API yig'ish ishlamadi, noto'g'ri sana xavfi sabab DOM fallback o'chirilgan: ${apiError}`);
      }
      collectionMode = "dom";
      rows = await readLmjRows(tab, brand);
    }
  }
  const rowsInScope = rows.slice(0, limitAgents);
  const rowsWithPhotos = rowsInScope.filter((row) => row.expectedPhotos > 0);
  const agents = Array(rowsInScope.length);
  const urlSetsSeen = new Map();
  const flushEvery = collectFlushEvery();
  const concurrency = collectConcurrency(collectionMode);
  const perfEnabled = collectPerfEnabled();
  const collectStartedAt = nowMs();
  let completed = 0;
  let changedSinceFlush = 0;
  let flushChain = Promise.resolve();

  let orderIndex = null;
  if (collectionMode === "api") {
    const orderStarted = nowMs();
    try {
      orderIndex = await prefetchOrderIndex(tab, targetDate);
      if (perfEnabled) {
        progress({
          type: "perf",
          message: orderIndex
            ? `Order prefetch: ${orderIndex.normalized.length} ta (${orderIndex.scope}) ${formatMs(nowMs() - orderStarted)}`
            : `Order prefetch ishlamadi, per-agent fallback ${formatMs(nowMs() - orderStarted)}`,
        });
      }
    } catch (error) {
      if (perfEnabled) {
        progress({ type: "perf", message: `Order prefetch xato, per-agent fallback: ${String(error?.message || error).slice(0, 160)}` });
      }
      orderIndex = null;
    }
  }

  async function flushPartial(force = false) {
    if (!force && changedSinceFlush < flushEvery) return;
    const shouldWrite = force || changedSinceFlush >= flushEvery;
    if (!shouldWrite) return;
    changedSinceFlush = 0;
    const partial = buildCollectData({
      targetDate,
      brand,
      appliedDateText,
      collectionMode,
      apiError,
      rows,
      rowsInScope,
      rowsWithPhotos,
      agents,
    });
    flushChain = flushChain.then(() => writeFile(absoluteOut, JSON.stringify(partial, null, 2), "utf8"));
    await flushChain;
  }

  async function collectOne(row, rowIndex) {
    if (row.expectedPhotos <= 0) {
      agents[rowIndex] = {
        ...row,
        urls: [],
        photos: [],
        actualUrls: 0,
        status: "ok",
      };
      completed += 1;
      changedSinceFlush += 1;
      progress({
        code: row.code,
        ok: true,
        status: "ok",
        count: 0,
        expected: 0,
        done: completed,
        total: rowsInScope.length,
      });
      await flushPartial();
      return;
    }
    try {
      const item = collectionMode === "api"
        ? await collectAgentPhotosFromApi(tab, row, targetDate, { orderIndex })
        : await collectAgentUrls(tab, row);
      agents[rowIndex] = item;
      completed += 1;
      changedSinceFlush += 1;
      progress({
        code: row.code,
        ok: item.status === "ok",
        status: item.status,
        orderLookupStatus: item.orderLookupStatus,
        orderLookupScope: item.orderLookupScope,
        orderCount: (item.orders || []).length,
        orderPhotos: (item.photos || []).filter((photo) => (
          Number(photo.clientOrderSum || 0) > 0 || Number(photo.clientOrderCount || 0) > 0
        )).length,
        orderLookupError: item.orderLookupError,
        count: item.urls.length,
        expected: row.expectedPhotos,
        done: completed,
        total: rowsInScope.length,
      });
    } catch (error) {
      agents[rowIndex] = {
        ...row,
        urls: [],
        status: "error",
        error: String(error?.message || error),
        actualUrls: 0,
      };
      completed += 1;
      changedSinceFlush += 1;
      progress({
        code: row.code,
        ok: false,
        status: "error",
        error: String(error?.message || error),
        done: completed,
        total: rowsInScope.length,
      });
      await closePhotoModals(tab);
    }
    await flushPartial();
  }

  if (concurrency <= 1) {
    for (let index = 0; index < rowsInScope.length; index += 1) {
      await collectOne(rowsInScope[index], index);
    }
  } else {
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, rowsInScope.length) }, async () => {
      while (nextIndex < rowsInScope.length) {
        const index = nextIndex;
        nextIndex += 1;
        await collectOne(rowsInScope[index], index);
      }
    });
    await Promise.all(workers);
  }

  for (const item of agents.filter(Boolean)) {
    const fingerprint = item.urls?.join("|") || "";
    if (!fingerprint) continue;
    const duplicateOf = urlSetsSeen.get(fingerprint);
    if (duplicateOf) {
      item.status = "duplicate";
      item.duplicateOf = duplicateOf;
    } else {
      urlSetsSeen.set(fingerprint, item.code);
    }
  }
  await flushPartial(true);

  const data = buildCollectData({ targetDate, brand, appliedDateText, collectionMode, apiError, rows, rowsInScope, rowsWithPhotos, agents });
  await writeFile(absoluteOut, JSON.stringify(data, null, 2), "utf8");
  if (perfEnabled) {
    progress({ type: "perf", message: `Yig'ish jami: ${formatMs(nowMs() - collectStartedAt)}, concurrency=${concurrency}, flushEvery=${flushEvery}` });
  }
  return { outPath: absoluteOut, ...data };
}

export function summarizeAgents(agents) {
  const stats = { ok: 0, partial: 0, extra: 0, empty: 0, mismatch: 0, unknown: 0, error: 0, duplicate: 0 };
  for (const agent of agents) stats[agent.status] = (stats[agent.status] || 0) + 1;
  return stats;
}

export async function updateDatasetManifest(manifestPath, datasetPath, date, meta = {}) {
  const absoluteManifest = resolve(manifestPath);
  const absoluteDataset = resolve(datasetPath);
  const manifestDir = dirname(absoluteManifest);
  let manifest = { datasets: [] };
  try {
    manifest = JSON.parse(await readFile(absoluteManifest, "utf8"));
  } catch {
    await mkdir(manifestDir, { recursive: true });
  }
  const rel = absoluteDataset
    .replace(manifestDir, "")
    .replace(/^[/\\]+/, "")
    .replaceAll("\\", "/");
  const existing = manifest.datasets.find((item) => item.date === date);
  if (existing) {
    existing.file = rel;
    existing.updatedAt = new Date().toISOString();
    if (meta.label) existing.label = meta.label;
    if (meta.brand) existing.brand = meta.brand;
    delete existing.dataQuality;
    delete existing.note;
  } else {
    manifest.datasets.push({ date, file: rel, updatedAt: new Date().toISOString(), ...(meta.label ? { label: meta.label } : {}), ...(meta.brand ? { brand: meta.brand } : {}) });
  }
  manifest.datasets.sort((a, b) => a.date.localeCompare(b.date));
  await writeFile(absoluteManifest, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

export function projectRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}
