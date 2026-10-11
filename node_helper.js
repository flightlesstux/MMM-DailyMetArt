const NodeHelper = require("node_helper");

// Prefer global fetch if available (Node 18+), else fall back to node-fetch v2.
let fetchFn = global.fetch;
if (!fetchFn) {
  try { fetchFn = require("node-fetch"); } catch (_) {}
}
const fetch = (...args) => fetchFn(...args);

const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
// v1/search was retired on 2026-10-01; search lives on v1.1 and is paginated (offset/limit).
const MET_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1.1/search";
// v1.1 search returns objectIDs: null for any offset at or beyond this window.
const SEARCH_WINDOW = 10000;
const MAX_ATTEMPTS = 5;

module.exports = NodeHelper.create({
  start() { this.cache = {}; },

  socketNotificationReceived(notif, payload) {
    if (notif === "MET_FETCH") {
      this.fetchArt(payload).catch(err => {
        this.sendSocketNotification("MET_ERROR", { message: err?.message || String(err) });
      });
    }
  },

  async fetchArt({ seed }) {
    if (seed && this.cache[seed]) {
      this.sendSocketNotification("MET_RESULT", this.cache[seed]);
      return;
    }

    // Probe for the result count, then pick one position inside the reachable window.
    const total = (await this._search(0)).total;
    const size = Math.min(Number(total) || 0, SEARCH_WINDOW);
    if (!size) throw new Error("No artworks found today.");

    const start = this._pick(size, seed);
    let lastError = new Error("No artworks found today.");

    // Some objects 404 or come back without an image; step to the next result instead of failing.
    for (let i = 0; i < Math.min(MAX_ATTEMPTS, size); i++) {
      try {
        const { ids } = await this._search((start + i) % size);
        if (!ids.length) throw new Error("No artworks found today.");

        const obj = await this._j(`${MET_BASE}/objects/${ids[0]}`);
        const image = obj.primaryImageSmall || obj.primaryImage || null;
        if (!image) throw new Error("Selected artwork has no image.");

        const payload = {
          image,
          title: obj.title || "Untitled",
          artist: obj.artistDisplayName || obj.culture || "Unknown",
          objectDate: obj.objectDate || "",
          medium: obj.medium || "",
          department: obj.department || "",
          creditLine: obj.creditLine || "",
          objectURL: obj.objectURL || ""
        };

        if (seed) this.cache[seed] = payload;
        this.sendSocketNotification("MET_RESULT", payload);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  },

  async _search(offset) {
    const params = new URLSearchParams({
      q: "painting", hasImages: "true", isPublicDomain: "true",
      offset: String(offset), limit: "1"
    });
    const res = await this._j(`${MET_SEARCH}?${params}`);
    return { total: res.total, ids: Array.isArray(res.objectIDs) ? res.objectIDs : [] };
  },

  async _j(url) {
    // Global fetch ignores a `timeout` option, so abort via signal.
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
    return r.json();
  },

  _pick(size, seed) {
    if (!seed) return Math.floor(Math.random() * size);
    let h = 5381; for (let c of seed) { h = ((h << 5) + h) + c.charCodeAt(0); h |= 0; }
    return Math.abs(h) % size;
  }
});
