window.PhotoReviewAutoReview = (() => {
  const DEFAULT_REASONS = [
    "Ish vaqtidan tashqari olingan foto",
    "Kamera yopilgan yoki to'sib olingan foto",
    "Bitta do'kondan takroriy foto",
    "Ekrandan qayta olingan foto",
    "Katalogdan olingan rasm",
    "Faqat mahsulot rasmi",
    "Foto talabga javob bermaydi",
  ];

  function photoClock(photo) {
    const match = String(photo?.photoTime || "").match(/\b(\d{2}):(\d{2})\b/);
    return match ? `${match[1]}:${match[2]}` : "";
  }

  function inspect(agent, photo) {
    const reasons = [];
    const time = photoClock(photo);
    if (time && (time < "08:00" || time > "17:45")) reasons.push(DEFAULT_REASONS[0]);
    const sameUrl = (agent.photos || []).filter((item) => item.url && item.url === photo.url).length;
    if (sameUrl > 1) reasons.push(DEFAULT_REASONS[2]);
    return {
      reasons,
      candidate: reasons.length > 0 && !(Number(photo.clientOrderSum || 0) > 0),
    };
  }

  function scan(agents) {
    const items = [];
    for (const agent of agents || []) {
      for (const photo of agent.photos || []) {
        const result = inspect(agent, photo);
        if (result.candidate) items.push({ agent, photo, reasons: result.reasons });
      }
    }
    return items;
  }

  return { DEFAULT_REASONS, photoClock, inspect, scan };
})();
