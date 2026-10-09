import { useState } from "react";
import { post } from "../services/hyperliquidService";

const PRESETS = [
  { label: "All Mids (giá tất cả coin)", body: { type: "allMids" } },
  { label: "Meta (thông tin perp)", body: { type: "meta" } },
  { label: "Meta + Asset Ctxs", body: { type: "metaAndAssetCtxs" } },
  { label: "L2 Book — GOLD", body: { type: "l2Book", coin: "GOLD" } },
  { label: "L2 Book — SILVER", body: { type: "l2Book", coin: "SILVER" } },
  { label: "Spot Meta", body: { type: "spotMeta" } },
  { label: "User Fills", body: { type: "userFills", user: "0x9e8b1e51c642f4c8b87c6ba11c53d516a218afc4" } },
];

export default function HyperLiquidExplorer() {
  const [bodyText, setBodyText] = useState(JSON.stringify({ type: "allMids" }, null, 2));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsed = JSON.parse(bodyText);
      const data = await post(parsed);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, background: "#0a0a0a", minHeight: "100vh", color: "#f0f0f0", fontFamily: "monospace" }}>
      <h2 style={{ color: "#ffd700", marginBottom: 16 }}>🔗 HyperLiquid API Explorer</h2>
      <p style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>POST → https://api.hyperliquid.xyz/info</p>

      {/* Presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {PRESETS.map((p, i) => (
          <button key={i}
            onClick={() => setBodyText(JSON.stringify(p.body, null, 2))}
            style={{ padding: "4px 10px", background: "#1a1a1a", border: "1px solid #333", color: "#90caf9", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Body editor */}
      <textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        rows={8}
        style={{ width: "100%", background: "#111", color: "#4caf50", border: "1px solid #333", borderRadius: 8, padding: 12, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
      />

      <button onClick={call} disabled={loading}
        style={{ marginTop: 10, padding: "8px 24px", background: loading ? "#333" : "#ffd700", color: "#000", fontWeight: "bold", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontSize: 14 }}>
        {loading ? "Đang gọi..." : "▶ Gọi API"}
      </button>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 16, padding: 12, background: "#2a0000", border: "1px solid #f44336", borderRadius: 8, color: "#f44336" }}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>Kết quả:</div>
          <pre style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: 16, overflowX: "auto", fontSize: 12, color: "#e0e0e0", maxHeight: 600, overflowY: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
