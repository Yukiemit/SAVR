import axios from "axios";

// ── In-memory GET cache ────────────────────────────────────────────────────
// Stores { data, ts } keyed by full URL+params string.
// TTL: 60 seconds for most endpoints, 10 seconds for stats/counts.
const cache      = new Map();
const STATS_TTL  = 10_000;   // 10 s  — badge counts, dashboard numbers
const DEFAULT_TTL = 60_000;  // 60 s  — lists, profiles, inventory

const STATS_PATTERNS = ["/stats", "/dashboard/stats", "/dashboard"];

function ttlFor(url) {
  return STATS_PATTERNS.some((p) => url.includes(p)) ? STATS_TTL : DEFAULT_TTL;
}

function cacheKey(config) {
  const params = config.params ? "?" + new URLSearchParams(config.params).toString() : "";
  return (config.baseURL ?? "") + config.url + params;
}

// Invalidate all cached keys that contain any of the given path segments.
// Called automatically after every mutating request (POST/PUT/PATCH/DELETE).
function invalidateRelated(url) {
  // Extract the resource segment: e.g. "inventory/food" → "inventory"
  const segments = url.replace(/^\//, "").split("/").filter(Boolean);
  for (const key of cache.keys()) {
    if (segments.some((seg) => key.includes(seg))) {
      cache.delete(key);
    }
  }
}

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 30_000,   // 30s — Railway PostgreSQL can be slow on cold start
});

// ── Request interceptor: attach token + serve from cache ──────────────────
api.interceptors.request.use((config) => {
  // Attach auth token
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Only cache GET requests and only when not explicitly skipped
  if (config.method?.toLowerCase() !== "get" || config.skipCache) return config;

  const key    = cacheKey(config);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < ttlFor(config.url)) {
    // Return a fake resolved promise — axios will short-circuit the request
    config.adapter = () =>
      Promise.resolve({
        data:    cached.data,
        status:  200,
        statusText: "OK (cached)",
        headers: {},
        config,
        request: {},
      });
  }

  return config;
});

// ── Response interceptor: store in cache + redirect on 401 ────────────────
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();

    if (method === "get" && !response.config.skipCache) {
      // Store successful GET responses in cache
      const key = cacheKey(response.config);
      cache.set(key, { data: response.data, ts: Date.now() });
    } else if (["post", "put", "patch", "delete"].includes(method)) {
      // Mutating request → invalidate related cached lists
      invalidateRelated(response.config.url ?? "");
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Manual cache helpers (use when you need to force-refresh) ──────────────
export function clearCache(urlFragment) {
  if (urlFragment) {
    invalidateRelated(urlFragment);
  } else {
    cache.clear();
  }
}

export function bustCache() {
  cache.clear();
}

export default api;
