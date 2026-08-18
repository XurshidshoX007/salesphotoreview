(() => {
  const api = window.PhotoReviewDataLoader;
  const stateLib = window.PhotoReviewState;
  const filtersLib = window.PhotoReviewFilters;
  const marksLib = window.PhotoReviewMarks;
  const brandsLib = window.PhotoReviewBrands;
  const attLib = window.PhotoReviewAttendance;
  const autoLoad = window.PhotoReviewDatasetAutoLoad;
  const loader = window.PhotoReviewPhotoLoader;
  const utils = window.PhotoReviewUtils;
  const ui = window.PhotoReviewUiState;
  const counters = window.PhotoReviewCounters;
  const autoReview = window.PhotoReviewAutoReview;
  const telegramUi = window.PhotoReviewTelegram;
  const exporter = window.PhotoReviewExport;
  const $ = utils.$;
  const esc = utils.escapeHtml;

  const DEMO_DATASET = {
    date: "2026-08-17",
    brand: { id: "lalaku_mama", name: "Lalaku Mama", code: "LMJ" },
    agents: [
      {
        code: "LMJTEST01",
        agent: "Demo Agent",
        orderSum: 1250000,
        status: "ok",
        photos: Array.from({ length: 5 }, (_, index) => ({
          id: `p${index + 1}`,
          url: `review-ui/assets/demo-${(index % 5) + 1}.svg`,
          client: `Klient ${index + 1}`,
          clientId: `C${index + 1}`,
          photoTime: `2026-08-17 10:0${index}`,
          row: 1,
        })),
      },
      {
        code: "LMJTEST02",
        agent: "Demo Agent 2",
        orderSum: 860000,
        status: "ok",
        photos: Array.from({ length: 4 }, (_, index) => ({
          id: `p${index + 1}`,
          url: `review-ui/assets/demo-${(index % 5) + 1}.svg`,
          client: `Do'kon ${index + 1}`,
          photoTime: "2026-08-17 11:15",
          row: 1,
        })),
      },
    ],
  };

  const state = {
    clientId: stateLib.clientId(localStorage, "lmjClientId"),
    brands: { brands: [] },
    reasons: { customReasons: [], reasonOverrides: {}, deletedReasons: [] },
    marks: {},
    revisions: {},
    manifest: { datasets: [] },
    dataset: null,
    agents: [],
    agentIndex: 0,
    start: 0,
    pageSize: 4,
    paused: true,
    delay: 3500,
    timer: null,
    current: null,
    zoom: 1,
    selectedDate: "",
    selectedBrand: "",
    attendance: null,
    attendanceView: "month",
    attendanceFilter: "",
    undo: [],
    telegramChats: [],
  };

  function markKey(agent, photo) {
    return `${state.dataset?.date || ""}#${agent.code}#${photo.id}`;
  }

  function normalizeDataset(raw) {
    const source = raw?.agents || raw?.rows || [];
    return source.map((agent, agentIndex) => {
      const code = agent.code || `AGENT${agentIndex + 1}`;
      const photos = [];
      if (Array.isArray(agent.photos) && agent.photos.length && (agent.photos[0].url || agent.photos[0].id)) {
        photos.push(...agent.photos.map((item, index) => ({
          id: item.id || `p${index + 1}`,
          url: item.url || item.src || "",
          client: item.client || "",
          clientOrderSum: Number(item.clientOrderSum || 0) || 0,
          clientId: item.clientId || "",
          photoTime: item.photoTime || "",
          row: item.row || index + 1,
        })));
      } else if (Array.isArray(agent.photos)) {
        agent.photos.forEach((row, rowIndex) => {
          const items = row.photoItems || row.items || (row.urls || []).map((url, itemIndex) => ({
            url,
            photoTime: row.photoTimes?.[itemIndex] || row.photoTime || "",
          }));
          items.forEach((item, itemIndex) => photos.push({
            id: item.id || `r${rowIndex + 1}_${itemIndex + 1}`,
            url: item.url || item.src || "",
            client: item.client || row.client || "",
            clientOrderSum: Number(item.clientOrderSum || row.clientOrderSum || 0) || 0,
            clientId: item.clientId || row.clientId || "",
            photoTime: item.photoTime || row.photoTime || "",
            row: row.row || rowIndex + 1,
          }));
        });
      } else {
        (agent.urls || []).forEach((url, index) => photos.push({
          id: `p${index + 1}`, url, client: "", clientOrderSum: 0, clientId: "", photoTime: "", row: index + 1,
        }));
      }
      const match = String(code).match(/^([A-Z]+)(\d+)/i);
      return {
        code,
        agent: agent.agent || agent.modalTitle || agent.name || code,
        group: match ? match[1] : code,
        tail: match ? Number(match[2]) : 999,
        orderSum: Number(agent.orderSum ?? agent.sum ?? 0) || 0,
        collectStatus: agent.status || "ok",
        photos: photos.filter((photo) => photo.url),
      };
    })
      .filter((agent) => agent.collectStatus !== "duplicate" && agent.collectStatus !== "error")
      .filter((agent) => agent.photos.length > 0)
      .sort((a, b) => a.group.localeCompare(b.group) || a.orderSum - b.orderSum || a.tail - b.tail || a.code.localeCompare(b.code));
  }

  function currentAgents() {
    const brand = brandsLib.byId(state.brands, state.selectedBrand);
    const mode = $("agentFilter")?.value || "matching";
    return state.agents.filter((agent) => {
      if (!brand || mode === "all") return true;
      const match = (brand.agentPrefixes || []).some((prefix) => String(agent.code).toUpperCase().startsWith(String(prefix).toUpperCase()));
      return mode === "unmatched" ? !match : match;
    });
  }

  function rebuildAgents() {
    const select = $("agentSel");
    if (!select) return;
    const agents = currentAgents();
    select.innerHTML = "";
    agents.forEach((agent, index) => {
      const minus = Object.values(state.marks).filter((mark) => marksLib.isMinus(mark) && mark.date === state.dataset?.date && mark.code === agent.code).length;
      select.add(new Option(
        `${agent.code} | ${utils.formatNumber(agent.orderSum)} | ${agent.photos.length} foto${minus ? ` | -${minus}` : ""}`,
        String(index),
      ));
    });
    if (state.agentIndex >= agents.length) state.agentIndex = 0;
    select.value = String(state.agentIndex);
  }

  function renderReasons(selected = []) {
    const box = $("reasonChecks");
    if (!box) return;
    const deleted = new Set((state.reasons.deletedReasons || []).map((item) => item.toLowerCase()));
    const reasons = [...autoReview.DEFAULT_REASONS, ...(state.reasons.customReasons || [])]
      .filter((reason, index, list) => list.indexOf(reason) === index && !deleted.has(reason.toLowerCase()));
    box.innerHTML = reasons.map((reason) => {
      const label = state.reasons.reasonOverrides?.[reason] || reason;
      return `<label class="reason"><input type="checkbox" value="${esc(reason)}" ${selected.includes(reason) ? "checked" : ""}> <span>${esc(label)}</span></label>`;
    }).join("");
  }

  function renderGrid() {
    const agents = currentAgents();
    const agent = agents[state.agentIndex];
    const grid = $("grid");
    if (!grid) return;
    if (!agent) {
      grid.innerHTML = `<div class="emptyState">Tanlangan sana/brend uchun foto yo'q.</div>`;
      return;
    }
    const pageSize = Math.max(1, Number(state.pageSize) || 4);
    if (state.start >= agent.photos.length) state.start = Math.max(0, agent.photos.length - ((agent.photos.length % pageSize) || pageSize));
    const slice = agent.photos.slice(state.start, state.start + pageSize);
    grid.dataset.columns = String(pageSize);
    grid.style.setProperty("--photo-columns", String(pageSize));
    grid.innerHTML = slice.map((photo, offset) => {
      const index = state.start + offset;
      const mark = state.marks[markKey(agent, photo)];
      const verdict = String(mark?.verdict || "").toUpperCase();
      return `<article class="card ${verdict === "MINUS" ? "marked" : ""}" data-i="${index}">
        <div class="photoFrame">
          <img alt="${esc(agent.code)} foto ${index + 1}" loading="eager">
        </div>
        <div class="cap">
          <b>${esc(agent.code)} #${index + 1}</b>
          <span>${esc(photo.client || "")}</span>
          <span>${esc(autoReview.photoClock(photo) || "vaqt yo'q")}</span>
          ${verdict ? `<em>${esc(verdict)}</em>` : ""}
        </div>
      </article>`;
    }).join("");
    grid.querySelectorAll(".card").forEach((card) => {
      const img = card.querySelector("img");
      const photo = agent.photos[Number(card.dataset.i)];
      loader.load(img, photo.url, "proxy", "thumb");
      card.onclick = () => openModal(Number(card.dataset.i));
    });
    $("title").textContent = `${agent.code} | ${agent.agent}`;
    $("meta").textContent = `${state.dataset.date} | ${state.start + 1}-${Math.min(state.start + pageSize, agent.photos.length)} / ${agent.photos.length} foto`;
    const stats = counters.summarize(state.agents, state.marks, state.dataset.date);
    counters.renderDateStats($("dateStats"), stats);
    $("reviewProgressText").textContent = `${stats.reviewed} / ${stats.photos}`;
    $("agentSel").value = String(state.agentIndex);
  }

  function move(delta) {
    const agents = currentAgents();
    const agent = agents[state.agentIndex];
    if (!agent) return;
    const pageSize = Math.max(1, Number(state.pageSize) || 4);
    state.start += delta;
    if (state.start < 0) {
      if (state.agentIndex > 0) {
        state.agentIndex -= 1;
        const prev = agents[state.agentIndex];
        state.start = Math.max(0, prev.photos.length - ((prev.photos.length % pageSize) || pageSize));
      } else state.start = 0;
    } else if (state.start >= agent.photos.length) {
      if (state.agentIndex < agents.length - 1) {
        state.agentIndex += 1;
        state.start = 0;
      } else {
        state.start = Math.max(0, agent.photos.length - ((agent.photos.length % pageSize) || pageSize));
      }
    }
    renderGrid();
  }

  function openModal(index) {
    const agent = currentAgents()[state.agentIndex];
    const photo = agent?.photos[index];
    if (!photo) return;
    state.current = { agent, photo, index };
    state.zoom = 1;
    state.paused = true;
    $("quickPause").textContent = "Resume";
    $("modalTitle").textContent = `${agent.code} #${index + 1} | ${photo.client || ""}`;
    $("modalMeta").textContent = autoReview.photoClock(photo) || "vaqt yo'q";
    const mark = state.marks[markKey(agent, photo)] || {};
    $("note").value = mark.note || "";
    renderReasons(mark.reasons || autoReview.inspect(agent, photo).reasons);
    const img = $("modalImg");
    img.style.transform = "scale(1)";
    loader.load(img, photo.url, "proxy", "full");
    $("modal").classList.add("open");
  }

  function closeModal() {
    $("modal").classList.remove("open");
    state.current = null;
  }

  async function saveMark(verdict) {
    if (!state.current) return;
    const { agent, photo, index } = state.current;
    const key = markKey(agent, photo);
    const prev = state.marks[key];
    const next = {
      date: state.dataset.date,
      code: agent.code,
      agent: agent.agent,
      photo: index + 1,
      client: photo.client || "",
      clientId: photo.clientId || "",
      photoTime: photo.photoTime || "",
      url: photo.url,
      brandId: state.dataset.brand?.id || state.selectedBrand || "",
      brandName: state.dataset.brand?.name || "",
      verdict,
      reasons: [...document.querySelectorAll("#reasonChecks input:checked")].map((node) => node.value),
      note: $("note").value.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: state.clientId,
    };
    state.undo.push({ key, prev });
    $("undoReviewBtn").disabled = false;
    state.marks[key] = next;
    try {
      const saved = await api.postJson(`/api/marks?compact=1`, { marks: { [key]: next }, baseRevision: state.revisions.marks });
      if (saved.marks?.[key]) state.marks[key] = saved.marks[key];
      if (saved.revision) state.revisions.marks = saved.revision;
    } catch (error) {
      utils.toast(error.message);
    }
    rebuildAgents();
    renderGrid();
    closeModal();
  }

  async function undoMark() {
    const last = state.undo.pop();
    if (!last) return;
    if (last.prev) state.marks[last.key] = last.prev;
    else delete state.marks[last.key];
    $("undoReviewBtn").disabled = !state.undo.length;
    try {
      await api.postJson("/api/marks?compact=1", {
        marks: { [last.key]: last.prev || { _deleted: true, updatedAt: new Date().toISOString() } },
      });
    } catch {}
    renderGrid();
  }

  async function loadManifest() {
    try {
      const data = await fetch(`lmj_review_datasets.json?${Date.now()}`).then((res) => res.json());
      state.manifest = data && Array.isArray(data.datasets) ? data : { datasets: [] };
    } catch {
      state.manifest = { datasets: [] };
    }
  }

  function datasetEntries() {
    return (state.manifest.datasets || []).map((item) => ({
      ...item,
      iso: filtersLib.datasetDate(item),
      brandId: typeof item.brand === "string" ? item.brand : item.brand?.id || brandsLib.byCode(state.brands, item.date)?.id || "",
    }));
  }

  function fillBrandSelects() {
    const brands = (state.brands.brands || []).filter((brand) => brand.enabled !== false);
    for (const id of ["brandSel", "collectBrand", "attendanceBrand"]) {
      const select = $(id);
      if (!select) continue;
      const current = select.value;
      select.innerHTML = brands.map((brand) => `<option value="${esc(brand.id)}">${esc(brand.name)}</option>`).join("");
      if (current && brands.some((brand) => brand.id === current)) select.value = current;
    }
    if (!state.selectedBrand) state.selectedBrand = $("brandSel")?.value || brands[0]?.id || "";
    if ($("brandSel") && state.selectedBrand) $("brandSel").value = state.selectedBrand;
  }

  async function openDataset(raw) {
    state.dataset = raw;
    state.agents = normalizeDataset(raw);
    state.agentIndex = 0;
    state.start = 0;
    state.selectedDate = filtersLib.cleanDatasetDate(raw.date) || raw.date;
    if ($("dateSel") && state.selectedDate) $("dateSel").value = state.selectedDate;
    rebuildAgents();
    renderGrid();
  }

  async function loadSelectedDataset() {
    const iso = $("dateSel")?.value || state.selectedDate;
    const brandId = $("brandSel")?.value || state.selectedBrand;
    state.selectedDate = iso;
    state.selectedBrand = brandId;
    const entries = datasetEntries()
      .filter((item) => item.iso === iso)
      .filter((item) => !brandId || item.brandId === brandId || String(item.date).toLowerCase().includes(brandId));
    for (const entry of entries.reverse()) {
      try {
        const raw = await fetch(`${entry.file}?${Date.now()}`).then((res) => {
          if (!res.ok) throw new Error("missing");
          return res.json();
        });
        await openDataset({ ...raw, date: filtersLib.cleanDatasetDate(raw.date || entry.date), brand: raw.brand || entry.brand });
        return;
      } catch {}
    }
    if (iso === DEMO_DATASET.date || !entries.length) {
      await openDataset(DEMO_DATASET);
      return;
    }
    $("grid").innerHTML = `<div class="emptyState">Dataset topilmadi. Avtomatik yig'ish tekshirilmoqda...</div>`;
  }

  function bindAutoLoad() {
    if (!autoLoad?.create) return;
    const controller = autoLoad.create({
      request: (url, options = {}) => api.requestJson(url, options),
      isCurrent: (selection) => selection.date === state.selectedDate && selection.brand === state.selectedBrand,
      onState: (result) => {
        const banner = $("datasetStatusBanner");
        if (!banner) return;
        if (!result || result.status === "ready") {
          banner.hidden = true;
          return;
        }
        banner.hidden = false;
        banner.textContent = result.message || result.status || "";
      },
      onReady: async () => {
        await loadManifest();
        await loadSelectedDataset();
      },
    });
    state.autoLoad = controller;
  }

  async function syncServer() {
    const data = await api.getJson("/api/sync?light=1");
    state.brands = data.brands || state.brands;
    state.reasons = data.reasons || state.reasons;
    state.revisions = data.revisions || {};
    const marks = await api.getJson("/api/marks");
    state.marks = marks.marks || {};
    if (marks.revision) state.revisions.marks = marks.revision;
    fillBrandSelects();
  }

  async function refreshSystemStatus() {
    const rows = $("systemStatusRows");
    if (!rows) return;
    const [telegram, collect, attendance] = await Promise.allSettled([
      api.getJson("/api/telegram/status"),
      api.getJson("/api/collect/status"),
      api.getJson("/api/attendance/config"),
    ]);
    const items = [
      { name: "Server", ok: true, text: "Review API ishlayapti" },
      { name: "Telegram", ok: telegram.status === "fulfilled" && telegram.value.configured, text: telegram.status === "fulfilled" ? (telegram.value.configured ? "Sozlangan" : "Token/chat yo'q") : "Xato" },
      { name: "Yig'ish", ok: collect.status === "fulfilled", text: collect.status === "fulfilled" ? (collect.value.collect?.status || "idle") : "Xato" },
      { name: "Tabel", ok: attendance.status === "fulfilled", text: attendance.status === "fulfilled" ? `${attendance.value.employees?.length || 0} xodim` : "Xato" },
    ];
    rows.innerHTML = items.map((item) => `<div class="systemStatusRow ${item.ok ? "ok" : "warn"}"><b>${esc(item.name)}</b><span>${esc(item.text)}</span></div>`).join("");
    $("systemStatusUpdated").textContent = new Date().toLocaleString("uz-UZ");
    $("systemStatusDot").classList.remove("loading");
    $("systemStatusLabel").textContent = "Tizim tayyor";
    if (telegram.status === "fulfilled") state.telegramChats = telegram.value.chats || [];
  }

  function renderMinusList() {
    const items = Object.values(state.marks).filter((mark) => marksLib.isMinus(mark) && (!state.selectedDate || mark.date === state.selectedDate));
    $("listSubtitle").textContent = `${items.length} ta minus foto`;
    $("listBody").innerHTML = items.length
      ? `<table><thead><tr><th>Sana</th><th>Agent</th><th>Foto</th><th>Klient</th><th>Sabab</th></tr></thead><tbody>${
        items.map((mark) => `<tr><td>${esc(mark.date)}</td><td>${esc(mark.code)}</td><td>${esc(mark.photo)}</td><td>${esc(mark.client)}</td><td>${esc((mark.reasons || []).join("; "))}</td></tr>`).join("")
      }</tbody></table>`
      : `<div class="emptyState">Minus fotolar hozircha yo'q. Demo ro'yxat: tekshiruv uchun bo'sh holat o'rniga joriy sana belgilarini ko'ring.</div>`;
    if (!items.length) {
      $("listBody").innerHTML = `<div class="emptyState">Minus fotolar yo'q. Avval fotoni Minus qilib saqlang.</div><p class="hint">Jami belgilar: ${Object.keys(state.marks).length}</p>`;
    }
  }

  function renderBrandList() {
    const list = $("brandList");
    if (!list) return;
    list.innerHTML = (state.brands.brands || []).map((brand) => (
      `<button class="brandItem" data-id="${esc(brand.id)}">${esc(brand.name)}<span>${esc((brand.agentPrefixes || []).join(", "))}</span></button>`
    )).join("");
    list.querySelectorAll(".brandItem").forEach((button) => {
      button.onclick = () => fillBrandForm(brandsLib.byId(state.brands, button.dataset.id));
    });
    if (state.brands.brands?.[0]) fillBrandForm(state.brands.brands[0]);
  }

  function fillBrandForm(brand) {
    if (!brand) return;
    $("brandId").value = brand.id || "";
    $("brandNameInput").value = brand.name || "";
    $("brandPrefixes").value = (brand.agentPrefixes || []).join(", ");
    $("brandSalesNames").value = (brand.salesBrandNames || []).join(", ");
    $("brandTelegramChatId").value = brand.telegramChatId || "";
    $("brandEnabled").checked = brand.enabled !== false;
    $("brandNotes").value = brand.notes || "";
    const chatSel = $("brandTelegramChat");
    if (chatSel) {
      chatSel.innerHTML = `<option value="">Umumiy tanlov / ulanmagan</option>${
        state.telegramChats.map((chat) => `<option value="${esc(chat.id)}">${esc(chat.name || chat.id)}</option>`).join("")
      }`;
      if (brand.telegramChatId) chatSel.value = brand.telegramChatId;
    }
  }

  async function saveBrand() {
    const id = $("brandId").value || brandsLib.slug($("brandNameInput").value, $("brandPrefixes").value.split(","));
    const payload = {
      brands: (state.brands.brands || []).filter((brand) => brand.id !== id).concat([{
        id,
        name: $("brandNameInput").value.trim(),
        agentPrefixes: $("brandPrefixes").value.split(",").map((item) => item.trim()).filter(Boolean),
        salesBrandNames: $("brandSalesNames").value.split(",").map((item) => item.trim()).filter(Boolean),
        telegramChatId: $("brandTelegramChatId").value.trim() || $("brandTelegramChat").value.trim(),
        enabled: $("brandEnabled").checked,
        notes: $("brandNotes").value.trim(),
      }]),
    };
    const saved = await api.postJson("/api/brands", payload);
    state.brands = saved;
    fillBrandSelects();
    renderBrandList();
    utils.toast("Brend saqlandi");
  }

  function attendanceMonth() {
    return $("attendanceMonth")?.value || "2026-06";
  }

  async function loadAttendance() {
    const month = attendanceMonth();
    const brandId = $("attendanceBrand")?.value || state.selectedBrand || "";
    $("attendanceMeta").textContent = "Tabel yuklanmoqda...";
    const data = await api.getJson(`/api/attendance/month?month=${encodeURIComponent(month)}&brandId=${encodeURIComponent(brandId)}`);
    state.attendance = data;
    renderAttendance();
  }

  function attendanceRows() {
    const query = filtersLib.normalizeText($("attendanceEmployee")?.value);
    const prefix = String($("attendancePrefix")?.value || "").toUpperCase();
    const role = filtersLib.normalizeText($("attendanceRole")?.value);
    const status = $("attendanceStatus")?.value || "";
    const region = $("attendanceRegion")?.value || "";
    const svrOnly = $("attendanceSvrOnly")?.checked;
    return (state.attendance?.rows || []).filter((row) => {
      if (state.attendanceFilter === "low" && !row.days?.some((day) => ["low", "zero_activity"].includes(day.state))) return false;
      if (state.attendanceFilter === "vacant" && row.routeStatus !== "vacant") return false;
      if (state.attendanceFilter === "issue" && row.routeStatus === "assigned" && !row.days?.some((day) => ["low", "zero_activity", "missing_dataset"].includes(day.state))) return false;
      if (query && !filtersLib.normalizeText(`${row.agentCode} ${row.employeeName}`).includes(query)) return false;
      if (prefix && !String(row.agentCode).toUpperCase().startsWith(prefix)) return false;
      if (role && filtersLib.normalizeText(row.role) !== role) return false;
      if (status && row.routeStatus !== status) return false;
      if (region && String(row.region || "") !== region) return false;
      if (svrOnly && String(row.role || "").toLowerCase() !== "svr") return false;
      return true;
    });
  }

  function renderAttendance() {
    const data = state.attendance || { rows: [], summaryTotals: {}, dataQuality: { rawDatesFound: [] } };
    const totals = data.summaryTotals || {};
    $("attendanceMeta").innerHTML = `
      <div class="attendanceMetric"><span>Qator</span><b>${totals.rows || data.rows?.length || 0}</b></div>
      <div class="attendanceMetric"><span>Ish kuni</span><b>${totals.workDays || 0}</b></div>
      <div class="attendanceMetric"><span>Kam foto</span><b>${totals.lowPhotoDays || 0}</b></div>
      <div class="attendanceMetric"><span>Shtraf</span><b>${totals.penaltyCount || 0}</b></div>
      <div class="attendanceSecondaryMetric">Biriktirilgan: ${totals.assignedRows || 0}</div>
      <div class="attendanceSecondaryMetric">Vakant: ${totals.vacantRows || 0}</div>
      <div class="attendanceSecondaryMetric">Sababli: ${totals.specialDays || 0}</div>
      <div class="attendanceSecondaryMetric">Holat: ${esc(data.monthStatus?.status || "draft")}</div>
      <div class="attendanceSecondaryMetric">Reja: ${data.plannedWorkDays ?? "-"}</div>
    `;
    const days = utils.monthDays(data.month || attendanceMonth());
    const month = data.month || attendanceMonth();
    const missingDates = new Set();
    for (const row of data.rows || []) {
      for (const day of row.days || []) {
        if (day.state === "missing_dataset" && day.date) missingDates.add(day.date);
      }
    }
    $("attendanceCoverage").innerHTML = Array.from({ length: days }, (_, index) => {
      const date = `${month}-${utils.pad(index + 1)}`;
      return `<button type="button" data-coverage-date="${date}" class="${missingDates.has(date) ? "missing" : "ok"}">${index + 1}</button>`;
    }).join("");
    const regionSel = $("attendanceRegion");
    if (regionSel && regionSel.options.length <= 1) {
      const regions = [...new Set((data.rows || []).map((row) => row.region).filter(Boolean))];
      regionSel.innerHTML = `<option value="">Barcha hududlar</option>${regions.map((item) => `<option>${esc(item)}</option>`).join("")}`;
    }
    renderAttendanceView();
  }

  function renderAttendanceView() {
    const table = $("attendanceTable");
    const list = $("attendanceListView");
    const rows = attendanceRows();
    const month = state.attendance?.month || attendanceMonth();
    const days = utils.monthDays(month);
    if (state.attendanceView === "month") {
      table.classList.remove("hidden");
      list.innerHTML = "";
      table.innerHTML = `<thead><tr><th>Kod</th><th>Xodim</th>${Array.from({ length: days }, (_, i) => `<th>${i + 1}</th>`).join("")}<th>Ish</th></tr></thead><tbody>${
        rows.map((row) => {
          const map = attLib.indexDays(row.days);
          return `<tr><td>${esc(row.agentCode)}</td><td>${esc(row.employeeName)}</td>${
            Array.from({ length: days }, (_, i) => {
              const day = map.get(i + 1);
              return `<td data-att-cell="${esc(row.agentCode)}:${i + 1}" class="${esc(day?.state || "")}">${esc(day?.finalValue ?? "")}</td>`;
            }).join("")
          }<td>${esc(row.summary?.workDays ?? "")}</td></tr>`;
        }).join("")
      }</tbody>`;
      table.querySelectorAll("[data-att-cell]").forEach((cell) => {
        cell.onclick = () => openAttendanceDetail(cell.dataset.attCell);
      });
      return;
    }
    table.classList.add("hidden");
    table.innerHTML = "";
    if (state.attendanceView === "day") {
      const date = `${month}-01`;
      list.innerHTML = rows.length
        ? `<div class="attendanceDayHead">${esc(date)}</div>${rows.map((row) => {
          const day = row.days?.[0];
          return `<article class="attendanceDayRow"><b>${esc(row.agentCode)}</b><span>${esc(row.employeeName)}</span><em>${esc(day?.finalValue ?? "")}</em></article>`;
        }).join("")}`
        : `<div class="attendanceDatasetEmpty">Bu kunda qator yo'q.</div>`;
      return;
    }
    const issues = (state.attendanceIssues || []).length ? state.attendanceIssues : deriveIssues(state.attendance);
    list.innerHTML = `<div class="attendanceIssuesHead">Muammolar: ${issues.length}</div>${
      issues.map((item) => `<article class="attendanceIssue ${esc(item.type)}">${esc(item.label || item.type)} ${esc(item.date || item.agentCode || "")}</article>`).join("")
    }`;
  }

  function deriveIssues(monthData) {
    const issues = [];
    const missing = new Map();
    for (const row of monthData?.rows || []) {
      for (const day of row.days || []) {
        if (day.state === "missing_dataset") missing.set(day.date, (missing.get(day.date) || 0) + 1);
        else if (["low", "zero_activity"].includes(day.state)) issues.push({ type: "low", date: day.date, agentCode: row.agentCode, label: "Kam foto" });
      }
    }
    for (const [date, affectedRows] of missing) issues.push({ type: "missing_dataset", date, affectedRows, label: "Dataset yo'q" });
    return issues;
  }

  async function openAttendanceDetail(token) {
    const [agentCode, day] = String(token).split(":");
    const row = (state.attendance?.rows || []).find((item) => item.agentCode === agentCode);
    const info = attLib.indexDays(row?.days).get(Number(day));
    $("attendanceDetailTitle").textContent = `${agentCode} / ${info?.date || day}`;
    $("attendanceDetailSubtitle").textContent = row?.employeeName || "";
    $("attendanceDetailBody").innerHTML = `
      <p>Auto qiymat: <b>${esc(info?.autoValue ?? "")}</b></p>
      <p>Final: <b>${esc(info?.finalValue ?? "")}</b></p>
      <p>Holat: ${esc(info?.state || "")}</p>
      <p>Foto: ${esc(info?.photoCount ?? "")}</p>`;
    $("attendanceDetailDrawer").setAttribute("aria-hidden", "false");
    $("attendanceDetailDrawer").classList.add("open");
  }

  async function loadAdminStats() {
    const body = $("adminStatsBody");
    try {
      const data = await api.getJson("/api/admin/telegram-stats");
      body.innerHTML = `<div class="adminStat"><span>Hodisalar</span><b>${data.totals?.events || 0}</b></div>
        <div class="adminStat"><span>Foydalanuvchi</span><b>${data.totals?.uniqueUsers || 0}</b></div>
        <div class="adminStat"><span>Foto yuborildi</span><b>${data.totals?.photoSent || 0}</b></div>
        <p>Telegram bot statistikasi yangilandi.</p>`;
    } catch (error) {
      body.innerHTML = `<div class="adminEmpty">${esc(error.message)}</div>`;
    }
  }

  async function pollCollect() {
    try {
      const data = await api.getJson("/api/collect/status");
      const collect = data.collect || {};
      $("collectBadge").textContent = collect.status || "idle";
      $("collectStatusTitle").textContent = collect.running ? "Yig'ilmoqda" : "Tayyor";
      $("collectStatusText").textContent = collect.error?.message || collect.logs?.at?.(-1) || "Sanani va brendni tanlab boshlang.";
      $("collectLog").textContent = (collect.logs || []).join("\n") || "Hali jarayon boshlanmagan.";
      $("collectStart").disabled = Boolean(collect.running);
      $("collectStop").disabled = !collect.running;
      if (collect.progress) {
        $("collectProgress").hidden = false;
        $("collectProgressFill").style.width = `${collect.progress.percent || 0}%`;
        $("collectProgressText").textContent = `${collect.progress.completed || 0} / ${collect.progress.total || 0} agent`;
        $("collectProgressPct").textContent = `${collect.progress.percent || 0}%`;
      }
    } catch {}
  }

  function bindEvents() {
    $("filterToggleBtn")?.addEventListener("click", () => ui.setFilterOpen($("filterToggleBtn").getAttribute("aria-expanded") !== "true"));
    $("filterCloseBtn")?.addEventListener("click", () => ui.setFilterOpen(false));
    $("filterBackdrop")?.addEventListener("click", () => ui.setFilterOpen(false));
    $("systemStatusBtn")?.addEventListener("click", async () => {
      const open = $("systemStatusPanel").getAttribute("aria-hidden") !== "false";
      $("systemStatusPanel").setAttribute("aria-hidden", open ? "false" : "true");
      $("systemStatusBtn").setAttribute("aria-expanded", open ? "true" : "false");
      if (open) await refreshSystemStatus();
    });
    $("systemStatusClose")?.addEventListener("click", () => {
      $("systemStatusPanel").setAttribute("aria-hidden", "true");
      $("systemStatusBtn").setAttribute("aria-expanded", "false");
    });
    $("systemStatusRefresh")?.addEventListener("click", refreshSystemStatus);
    $("sidePhotoBtn")?.addEventListener("click", () => {
      ui.closeAll();
      document.querySelectorAll(".sideActions button").forEach((btn) => btn.classList.remove("active"));
      $("sidePhotoBtn").classList.add("active");
    });
    $("sideAttendanceBtn")?.addEventListener("click", async () => {
      ui.openPanel("attendancePanel");
      await loadAttendance();
    });
    $("sideAdminStatsBtn")?.addEventListener("click", async () => {
      ui.openPanel("adminStatsPanel");
      await loadAdminStats();
    });
    $("adminStatsRefresh")?.addEventListener("click", loadAdminStats);
    $("sideMinusListBtn")?.addEventListener("click", () => {
      renderMinusList();
      ui.openPanel("minusList");
    });
    $("listClose")?.addEventListener("click", () => ui.closeAll());
    $("sideCsvBtn")?.addEventListener("click", () => exporter.downloadCsv(`minus_${state.selectedDate || "all"}.csv`, exporter.minusRows(state.marks, state.selectedDate)));
    $("sideAgentExcelBtn")?.addEventListener("click", () => exporter.downloadCsv(`agents_${state.selectedDate || "all"}.csv`, exporter.agentRows(currentAgents(), state.marks, state.selectedDate)));
    $("sideBrandSettingsBtn")?.addEventListener("click", () => {
      renderBrandList();
      ui.openPanel("brandPanel");
    });
    $("brandClose")?.addEventListener("click", () => ui.closeAll());
    $("brandSave")?.addEventListener("click", () => saveBrand().catch((error) => utils.toast(error.message)));
    $("brandNew")?.addEventListener("click", () => fillBrandForm({ enabled: true }));
    $("sideAutoReviewBtn")?.addEventListener("click", () => {
      const items = autoReview.scan(currentAgents());
      $("autoReviewSubtitle").textContent = `${state.agents.reduce((sum, agent) => sum + agent.photos.length, 0)} ta foto ko'rildi, ${items.length} ta nomzod topildi`;
      $("autoReviewBody").innerHTML = items.map((item) => `<article class="autoItem"><b>${esc(item.agent.code)}</b> ${esc(item.photo.client || "")}<span>${esc(item.reasons.join("; "))}</span></article>`).join("") || `<div class="emptyState">Nomzod yo'q</div>`;
      ui.openPanel("autoReviewList");
    });
    $("autoReviewClose")?.addEventListener("click", () => ui.closeAll());
    $("sideCollectBtn")?.addEventListener("click", () => {
      ui.openPanel("collectPanel");
      pollCollect();
    });
    $("collectClose")?.addEventListener("click", () => ui.closeAll());
    $("sectionCloseBtn")?.addEventListener("click", () => ui.closeAll());
    $("deleteDateBtn")?.addEventListener("click", async () => {
      if (document.body.classList.contains("sectionOpen")) {
        ui.closeAll();
        return;
      }
      if (!state.selectedDate || !confirm(`${state.selectedDate} sanasini o'chirilsinmi?`)) return;
      await api.requestJson("/api/datasets/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: state.selectedDate, brand: state.selectedBrand }),
      });
      await loadManifest();
      await loadSelectedDataset();
    });
    $("brandSel")?.addEventListener("change", async () => {
      state.selectedBrand = $("brandSel").value;
      state.autoLoad?.schedule({ date: state.selectedDate, brand: state.selectedBrand });
      await loadSelectedDataset();
    });
    $("dateSel")?.addEventListener("change", async () => {
      state.selectedDate = $("dateSel").value;
      state.autoLoad?.schedule({ date: state.selectedDate, brand: state.selectedBrand });
      await loadSelectedDataset();
    });
    $("agentSel")?.addEventListener("change", () => {
      state.agentIndex = Number($("agentSel").value) || 0;
      state.start = 0;
      renderGrid();
    });
    $("agentFilter")?.addEventListener("change", () => {
      state.agentIndex = 0;
      rebuildAgents();
      renderGrid();
    });
    $("quickNext")?.addEventListener("click", () => move(state.pageSize));
    $("quickPrev")?.addEventListener("click", () => move(-state.pageSize));
    $("quickPause")?.addEventListener("click", () => {
      state.paused = !state.paused;
      $("quickPause").textContent = state.paused ? "Resume" : "Pause";
    });
    $("photoPageSize")?.addEventListener("change", () => {
      state.pageSize = Math.max(1, Number($("photoPageSize").value) || 4);
      renderGrid();
    });
    $("showAllPhotos")?.addEventListener("click", () => {
      const agent = currentAgents()[state.agentIndex];
      state.pageSize = agent?.photos.length || 4;
      $("photoPageSize").value = String(state.pageSize);
      state.start = 0;
      renderGrid();
    });
    $("speedSlower")?.addEventListener("click", () => { state.delay = Math.max(1000, state.delay - 500); $("speedText").textContent = `${(state.delay / 1000).toFixed(1)}s`; });
    $("speedFaster")?.addEventListener("click", () => { state.delay = Math.min(8000, state.delay + 500); $("speedText").textContent = `${(state.delay / 1000).toFixed(1)}s`; });
    $("modalClose")?.addEventListener("click", closeModal);
    $("modalMinus")?.addEventListener("click", () => saveMark("MINUS"));
    $("modalOk")?.addEventListener("click", () => saveMark("OK"));
    $("sideMinus")?.addEventListener("click", () => saveMark("MINUS"));
    $("sideOk")?.addEventListener("click", () => saveMark("OK"));
    $("addReason")?.addEventListener("click", async () => {
      const value = $("newReason").value.trim();
      if (!value) return;
      await api.postJson("/api/reasons", { customReasons: [value] });
      state.reasons.customReasons = [...new Set([...(state.reasons.customReasons || []), value])];
      $("newReason").value = "";
      renderReasons([...document.querySelectorAll("#reasonChecks input:checked")].map((node) => node.value).concat(value));
    });
    $("zoomIn")?.addEventListener("click", () => { state.zoom = Math.min(3, state.zoom + 0.15); $("modalImg").style.transform = `scale(${state.zoom})`; });
    $("zoomOut")?.addEventListener("click", () => { state.zoom = Math.max(0.35, state.zoom - 0.15); $("modalImg").style.transform = `scale(${state.zoom})`; });
    $("zoomFit")?.addEventListener("click", () => { state.zoom = 1; $("modalImg").style.transform = "scale(1)"; });
    $("undoReviewBtn")?.addEventListener("click", undoMark);
    $("nextUncheckedBtn")?.addEventListener("click", () => {
      const agents = currentAgents();
      for (let a = state.agentIndex; a < agents.length; a += 1) {
        const start = a === state.agentIndex ? state.start : 0;
        const index = agents[a].photos.findIndex((photo, photoIndex) => photoIndex >= start && !marksLib.isReviewed(state.marks[markKey(agents[a], photo)]));
        if (index >= 0) {
          state.agentIndex = a;
          state.start = index;
          renderGrid();
          openModal(index);
          return;
        }
      }
      utils.toast("Tekshirilmagan foto yo'q");
    });
    $("themeToggleBtn")?.addEventListener("click", () => ui.setTheme(!document.documentElement.classList.contains("dark")));
    $("collectStart")?.addEventListener("click", async () => {
      await api.postJson("/api/collect/start", {
        startDate: $("collectDate").value,
        endDate: $("collectDateTo").value,
        brand: $("collectBrand").value,
      });
      pollCollect();
    });
    $("collectStop")?.addEventListener("click", async () => {
      await api.postJson("/api/collect/stop", {});
      pollCollect();
    });
    document.querySelectorAll("[data-attendance-view]").forEach((button) => {
      button.addEventListener("click", async () => {
        document.querySelectorAll("[data-attendance-view]").forEach((node) => node.classList.remove("active"));
        button.classList.add("active");
        state.attendanceView = button.dataset.attendanceView;
        if (state.attendanceView === "issues") {
          const month = attendanceMonth();
          const brandId = $("attendanceBrand")?.value || "";
          const data = await api.getJson(`/api/attendance/issues?month=${encodeURIComponent(month)}&brandId=${encodeURIComponent(brandId)}`);
          state.attendanceIssues = data.issues || [];
        }
        renderAttendanceView();
      });
    });
    document.querySelectorAll("[data-attendance-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-attendance-filter]").forEach((node) => node.classList.remove("active"));
        button.classList.add("active");
        state.attendanceFilter = button.dataset.attendanceFilter;
        renderAttendanceView();
      });
    });
    $("attendanceGenerate")?.addEventListener("click", async () => {
      await api.postJson("/api/attendance/generate", { month: attendanceMonth(), brandId: $("attendanceBrand").value });
      await loadAttendance();
    });
    $("attendanceMonth")?.addEventListener("change", loadAttendance);
    $("attendanceBrand")?.addEventListener("change", loadAttendance);
    $("attendanceEmployee")?.addEventListener("input", renderAttendanceView);
    $("attendanceMoreFilters")?.addEventListener("click", () => {
      const box = $("attendanceAdvancedFilters");
      box.hidden = !box.hidden;
    });
    $("attendanceActionsToggle")?.addEventListener("click", () => {
      const menu = $("attendanceActionsMenu");
      const open = menu.hidden;
      menu.hidden = !open;
      $("attendanceActionsToggle").setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("attendanceExport")?.addEventListener("click", () => {
      location.href = `/api/attendance/export?month=${encodeURIComponent(attendanceMonth())}&brandId=${encodeURIComponent($("attendanceBrand").value || "")}`;
    });
    $("attendanceReplace")?.addEventListener("click", () => ui.setOpen("attendanceReplaceModal", true));
    $("attendanceReplaceClose")?.addEventListener("click", () => ui.setOpen("attendanceReplaceModal", false));
    $("attendanceReplaceCancel")?.addEventListener("click", () => ui.setOpen("attendanceReplaceModal", false));
    $("attendanceReplaceSave")?.addEventListener("click", async () => {
      const payload = {
        agentCode: $("replaceAgentCode").value,
        oldEmployeeEndDate: $("replaceOldEndDate").value,
        newStartDate: $("replaceNewStartDate").value,
        reason: $("replaceReason").value,
        brandId: $("attendanceBrand").value,
        newEmployeeId: $("replaceCreateNew").checked ? "" : $("replaceEmployeeSelect").value,
        newEmployee: {
          name: $("replaceNewName").value,
          phone: $("replaceNewPhone").value,
          role: $("replaceNewRole").value,
          notes: $("replaceNewNotes").value,
        },
      };
      try {
        await api.postJson("/api/attendance/assignments/replace-employee", payload);
        ui.setOpen("attendanceReplaceModal", false);
        await loadAttendance();
      } catch (error) {
        $("replaceMessage").textContent = error.message;
      }
    });
    $("attendanceDetailClose")?.addEventListener("click", () => {
      $("attendanceDetailDrawer").setAttribute("aria-hidden", "true");
      $("attendanceDetailDrawer").classList.remove("open");
    });
    $("attendanceDetailBackdrop")?.addEventListener("click", () => $("attendanceDetailClose").click());
    $("attendancePrevMonth")?.addEventListener("click", () => shiftMonth(-1));
    $("attendanceNextMonth")?.addEventListener("click", () => shiftMonth(1));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowRight") move(state.pageSize);
      if (event.key === "ArrowLeft") move(-state.pageSize);
    });
  }

  function shiftMonth(delta) {
    const value = attendanceMonth();
    const [year, month] = value.split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    $("attendanceMonth").value = `${date.getFullYear()}-${utils.pad(date.getMonth() + 1)}`;
    loadAttendance();
  }

  async function boot() {
    bindEvents();
    bindAutoLoad();
    ui.setTheme(localStorage.getItem("lmjTheme") === "dark");
    $("sectionCloseBtn").hidden = true;
    const today = new Date();
    const iso = `${today.getFullYear()}-${utils.pad(today.getMonth() + 1)}-${utils.pad(today.getDate())}`;
    if ($("collectDate") && !$("collectDate").value) $("collectDate").value = iso;
    if ($("collectDateTo") && !$("collectDateTo").value) $("collectDateTo").value = iso;
    try {
      await syncServer();
      await loadManifest();
      const latest = datasetEntries().at(-1);
      state.selectedBrand = $("brandSel")?.value || latest?.brandId || state.brands.brands?.[0]?.id || "lalaku_mama";
      state.selectedDate = latest?.iso || DEMO_DATASET.date;
      if ($("dateSel")) $("dateSel").value = state.selectedDate;
      if ($("brandSel")) $("brandSel").value = state.selectedBrand;
      await loadSelectedDataset();
      await refreshSystemStatus();
      state.timer = setInterval(() => { if (!state.paused) move(state.pageSize); }, state.delay);
    } catch (error) {
      $("meta").textContent = `Xato: ${error.message}`;
      await openDataset(DEMO_DATASET);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
