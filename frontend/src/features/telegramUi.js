window.PhotoReviewTelegram = (() => {
  async function preview(api, items, chatId) {
    return api.postJson("/api/telegram/preview-suspicious", { items, chatId });
  }
  async function send(api, items, chatId, mode) {
    return api.postJson("/api/telegram/send-suspicious", { items, chatId, mode });
  }
  return { preview, send };
})();
