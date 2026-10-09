/**
 * HyperLiquid API Service
 * Proxy qua /hyperliquid_api → https://api.hyperliquid.xyz
 *
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
 */

const BASE_URL = "https://api.hyperliquid.xyz/info";

export const post = async (body) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HyperLiquid API error: ${res.status}`);
  return res.json();
};

// ── Meta ──────────────────────────────────────────────────────────────────────

/** Lấy thông tin tất cả các coin (perp) */
export const getMeta = () => post({ type: "meta" });

/** Lấy giá mid của tất cả coin */
export const getAllMids = () => post({ type: "allMids" });

/** Lấy thông tin context của tất cả coin (funding, OI, ...) */
export const getMetaAndAssetCtxs = () => post({ type: "metaAndAssetCtxs" });

// ── User ──────────────────────────────────────────────────────────────────────

/** Lấy trạng thái tài khoản (positions, balance) */
export const getClearinghouseState = (address) =>
  post({ type: "clearinghouseState", user: address });

/** Lấy lịch sử giao dịch của user */
export const getUserFills = (address) =>
  post({ type: "userFills", user: address });

/** Lấy lịch sử funding của user */
export const getUserFundingHistory = (address, startTime, endTime) =>
  post({ type: "userFundingHistory", user: address, startTime, ...(endTime ? { endTime } : {}) });

/** Lấy open orders của user */
export const getOpenOrders = (address) =>
  post({ type: "openOrders", user: address });

// ── Market ────────────────────────────────────────────────────────────────────

/** Lấy order book của một coin */
export const getL2Book = (coin) =>
  post({ type: "l2Book", coin });

/** Lấy lịch sử nến (candles) */
export const getCandleSnapshot = (coin, interval, startTime, endTime) =>
  post({ type: "candleSnapshot", req: { coin, interval, startTime, endTime } });

/** Lấy funding rate hiện tại */
export const getFundingHistory = (coin, startTime, endTime) =>
  post({ type: "fundingHistory", coin, startTime, ...(endTime ? { endTime } : {}) });

// ── Spot ──────────────────────────────────────────────────────────────────────

/** Lấy meta spot */
export const getSpotMeta = () => post({ type: "spotMeta" });

/** Lấy trạng thái spot của user */
export const getSpotClearinghouseState = (address) =>
  post({ type: "spotClearinghouseState", user: address });
