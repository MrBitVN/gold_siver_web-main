import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fetch from "node-fetch";

// Cache cookie + crumb để tái sử dụng
let yahooCache = { cookie: null, crumb: null, fetchedAt: 0 };

async function getYahooCookieAndCrumb() {
  const now = Date.now();
  // Cache 30 phút
  if (yahooCache.cookie && yahooCache.crumb && now - yahooCache.fetchedAt < 30 * 60 * 1000) {
    return yahooCache;
  }

  try {
    // Bước 1: Lấy cookie từ Yahoo Finance
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const rawCookies = cookieRes.headers.raw()["set-cookie"] || [];
    const cookie = rawCookies.map(c => c.split(";")[0]).join("; ");

    // Bước 2: Lấy crumb dùng cookie vừa lấy
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Cookie": cookie,
      },
    });
    const crumb = await crumbRes.text();

    if (crumb && crumb.length > 0 && !crumb.includes("<!DOCTYPE")) {
      yahooCache = { cookie, crumb, fetchedAt: now };
      console.log("[Yahoo Proxy] Cookie + Crumb OK:", crumb);
      return yahooCache;
    }
  } catch (e) {
    console.error("[Yahoo Proxy] Lỗi lấy cookie/crumb:", e.message);
  }
  return { cookie: "", crumb: "" };
}

export default defineConfig({
  plugins: [
    react(),
    // Plugin middleware xử lý Yahoo Finance với cookie+crumb
    {
      name: "yahoo-finance-proxy",
      configureServer(server) {
        // Middleware /yahoo-quote — snapshot giá hiện tại
        server.middlewares.use("/yahoo-quote", async (req, res) => {
          try {
            const { cookie, crumb } = await getYahooCookieAndCrumb();
            const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?${qs}&crumb=${encodeURIComponent(crumb)}`;
            const yahooRes = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept": "application/json",
                "Cookie": cookie,
              },
            });
            const data = await yahooRes.text();
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = yahooRes.status;
            res.end(data);
          } catch (e) {
            console.error("[Yahoo Proxy] Lỗi:", e.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });

        // Middleware /yahoo-spark — historical close prices (multi-symbol)
        server.middlewares.use("/yahoo-spark", async (req, res) => {
          try {
            const { cookie, crumb } = await getYahooCookieAndCrumb();
            const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
            const url = `https://query1.finance.yahoo.com/v7/finance/spark?${qs}&crumb=${encodeURIComponent(crumb)}`;
            const yahooRes = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept": "application/json",
                "Cookie": cookie,
              },
            });
            const data = await yahooRes.text();
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = yahooRes.status;
            res.end(data);
          } catch (e) {
            console.error("[Yahoo Spark] Lỗi:", e.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api_vang247": {
        target: "https://thinkdiff.us/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api_vang247/, "")
      },
      "/sge_api": {
        target: "https://api_gold.thinkdiff.us",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sge_api/, "/shanghai_gold_exchange")
      },
      "/api_gold": {
        target: "https://api_gold.thinkdiff.us",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api_gold/, "")
      },
      "/vang247_xyz": {
        target: "https://thinkdiff.us",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/vang247_xyz/, "/vang247_xyz")
      },
      "/yahoo-finance": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yahoo-finance/, "")
      },
      "/yahoo-finance2": {
        target: "https://query2.finance.yahoo.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yahoo-finance2/, "")
      },
      "/stock-data": {
        target: "http://127.0.0.1:3005",
        changeOrigin: true
      },
      "/stock-detail": {
        target: "http://127.0.0.1:3005",
        changeOrigin: true
      },
      "/hyperliquid_api": {
        target: "https://api.hyperliquid.xyz",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/hyperliquid_api/, "")
      }
    }
  }
});
