window.PhotoReviewTelegram = (() => {
  function chatId(value) {
    return String(value || "").trim();
  }

  function uniqueChats(items) {
    const seen = new Set();
    return (items || []).filter((item) => {
      const id = chatId(item?.id || item?.chatId);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function allowedChats({ mainChat = null, brandChat = null } = {}) {
    return uniqueChats([brandChat, mainChat].filter(Boolean));
  }

  return { chatId, uniqueChats, allowedChats };
})();
