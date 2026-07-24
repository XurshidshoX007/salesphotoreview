import { methodNotAllowed } from "../middleware/errors.mjs";

export function createTelegramRoutes({ telegram, storage, http }) {
  return async function routeTelegram({ req, res, parsed, access }) {
    if (parsed.pathname === "/api/telegram/status") {
      const brandConfig = await storage.loadBrandsConfig({ includeDisabled: true }).catch(() => ({ brands: [] }));
      const chats = [
        ...telegram.telegramChats(),
        ...(brandConfig.brands || []).map((brand) => ({
          id: telegram.cleanText(brand.telegramChatId),
          name: telegram.cleanText(brand.telegramChatName) || telegram.cleanText(brand.name) || telegram.cleanText(brand.id),
        })),
      ].filter((chat, index, list) => chat.id && list.findIndex((item) => item.id === chat.id) === index);
      http.sendJson(res, 200, {
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && chats.length),
        chatId: telegram.maskChatId(process.env.TELEGRAM_CHAT_ID),
        chats: chats.map((chat) => ({ ...chat, maskedId: telegram.maskChatId(chat.id) })),
        fileCacheChatConfigured: Boolean(telegram.telegramFileCacheChatId()),
      }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/admin/telegram-stats") {
      const stats = await telegram.readTelegramUsageStats();
      http.sendJson(res, 200, { ok: true, ...telegram.summarizeTelegramUsageStats(stats) }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/telegram/preview-suspicious") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 2_000_000);
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) throw http.apiError("Tekshirish uchun foto yo'q", 400);
      const groups = telegram.groupSuspiciousByAgent(items);
      const chatId = await telegram.resolveTelegramChatIdForItems(items, body.chatId);
      http.sendJson(res, 200, {
        ok: true,
        mode: telegram.cleanText(body.mode || process.env.TELEGRAM_SEND_MODE || "summary").toLowerCase(),
        chatId: telegram.maskChatId(chatId),
        photos: items.length,
        agents: groups.length,
        groups: groups.map((group) => ({ date: group.date, code: group.code, agent: group.agent, photos: group.items.length })),
      }, access.headers);
      return true;
    }
    if (parsed.pathname === "/api/telegram/send-suspicious") {
      if (req.method !== "POST") return methodNotAllowed(res, http.sendJson, access.headers);
      const body = await http.readJsonBody(req, 6_000_000);
      const mode = telegram.cleanText(body.mode || process.env.TELEGRAM_SEND_MODE || "summary").toLowerCase();
      const result = mode === "media" && process.env.TELEGRAM_ALLOW_DIRECT_MEDIA === "1"
        ? await telegram.sendSuspiciousToTelegramChat(body.items, body.chatId)
        : await telegram.sendSuspiciousSummaryToTelegram(body.items, body.chatId);
      http.sendJson(res, result.failed.length ? 207 : 200, { ok: result.failed.length === 0, ...result }, access.headers);
      return true;
    }
    return false;
  };
}
