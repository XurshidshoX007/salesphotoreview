export async function readResponseBuffer(response, { maxBytes }) {
  const limit = Math.max(1, Number(maxBytes) || 1);
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > limit) {
    const error = new Error(`Foto hajmi ruxsat etilgan ${limit} baytdan katta`);
    error.status = 413;
    throw error;
  }
  if (!response.body?.getReader) {
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > limit) {
      const error = new Error(`Foto hajmi ruxsat etilgan ${limit} baytdan katta`);
      error.status = 413;
      throw error;
    }
    return data;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel("response too large").catch(() => {});
        const error = new Error(`Foto hajmi ruxsat etilgan ${limit} baytdan katta`);
        error.status = 413;
        throw error;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}
