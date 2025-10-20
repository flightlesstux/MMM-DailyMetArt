const NodeHelper = require("node_helper");

// Prefer global fetch if available (Node 18+), else fall back to node-fetch v2.
let fetchFn = global.fetch;
if (!fetchFn) {
  try { fetchFn = require("node-fetch"); } catch (_) {}
}
const fetch = (...args) => fetchFn(...args);

const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

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

    const params = new URLSearchParams({ q: "painting", hasImages: "true", isPublicDomain: "true" });
    const searchUrl = `${MET_BASE}/search?${params}`;
    const search = await this._j(searchUrl);

    const ids = Array.isArray(search.objectIDs) ? search.objectIDs : [];
    if (!ids.length) throw new Error("No artworks found today.");

    const id = this._pick(ids, seed);
    const obj = await this._j(`${MET_BASE}/objects/${id}`);

    const image = obj.primaryImageSmall || obj.primaryImage || null;
    if (!image) throw new Error("Selected artwork has no image.");

    const payload = {
      image,
      title: obj.title || "Untitled",
      artist: obj.artistDisplayName || obj.culture || "Unknown",
      objectDate: obj.objectDate || "",
      objectURL: obj.objectURL || ""
    };

    if (seed) this.cache[seed] = payload;
    this.sendSocketNotification("MET_RESULT", payload);
  },

  async _j(url) {
    const r = await fetch(url, { timeout: 15000 });
    if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
    return r.json();
  },

  _pick(list, seed) {
    if (!seed) return list[Math.floor(Math.random() * list.length)];
    let h = 5381; for (let c of seed) { h = ((h << 5) + h) + c.charCodeAt(0); h |= 0; }
    return list[Math.abs(h) % list.length];
  }
});
