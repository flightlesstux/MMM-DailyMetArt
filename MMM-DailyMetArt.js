/* global Module */

Module.register("MMM-DailyMetArt", {
  defaults: {
    // fetch cadence
    updateInterval: 12 * 60 * 60 * 1000,  // 12h
    initialLoadDelay: 3000,
    refreshAtMidnight: true,              // refresh when the date flips
    maxCallsPerHour: 2,                   // guardrail (2 calls/h => min 30min interval). Set null to disable.

    // layout (NEW: textPosition). Backward-compat: falls back to imageSide if present.
    textPosition: "right",                // "left" | "right" | "top" | "bottom"
    imageMaxWidth: "420px",
    textAlign: "left",                    // "left" | "center" | "right"

    // show/hide toggles
    showTitle: true,
    showArtist: true,
    showDate: true,
    showMedium: true,
    showDepartment: false,
    showCredit: false,
    showAttribution: true,                // small “Image & data: The Met”

    // text styling
    titleFontSize: "18px",
    titleColor: "#fff",
    bodyFontSize: "14px",
    bodyColor: "#ddd",
    attribFontSize: "11px",
    attribColor: "rgba(255,255,255,0.7)"
  },

  start() {
    this.loaded = false;
    this.error = null;
    this.art = null;

    // Backward-compat shim: if user still has imageSide, map it to textPosition.
    if (!this.config.textPosition && this.config.imageSide) {
      // imageSide described where the image sits; text is opposite.
      const map = { left: "right", right: "left", top: "bottom", bottom: "top" };
      this.config.textPosition = map[this.config.imageSide] || "right";
    }

    // Clamp update interval against rate-limit guard if provided
    const interval = this._effectiveUpdateInterval();
    const fetchNow = () => this.sendSocketNotification("MET_FETCH", { seed: this._todaySeed() });

    setTimeout(fetchNow, this.config.initialLoadDelay);
    this._intervalId = setInterval(fetchNow, interval);

    if (this.config.refreshAtMidnight) {
      this._scheduleMidnightRefresh();
    }
  },

  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
    if (this._midnightTimeout) clearTimeout(this._midnightTimeout);
  },

  getStyles() {
    return ["MMM-DailyMetArt.css"];
  },

  socketNotificationReceived(notif, payload) {
    if (notif === "MET_RESULT") {
      this.loaded = true;
      this.error = null;
      this.art = payload;
      this.updateDom();
    } else if (notif === "MET_ERROR") {
      this.loaded = true;
      this.error = payload?.message || "Unknown error";
      this.art = null;
      this.updateDom();
    }
  },

  getDom() {
    const w = document.createElement("div");
    w.className = "met-root";

    // CSS vars
    w.style.setProperty("--met-image-max-width", this.config.imageMaxWidth);
    w.style.setProperty("--met-text-align", this.config.textAlign);
    w.style.setProperty("--met-title-size", this.config.titleFontSize);
    w.style.setProperty("--met-title-color", this.config.titleColor);
    w.style.setProperty("--met-body-size", this.config.bodyFontSize);
    w.style.setProperty("--met-body-color", this.config.bodyColor);
    w.style.setProperty("--met-attrib-size", this.config.attribFontSize);
    w.style.setProperty("--met-attrib-color", this.config.attribColor);

    if (!this.loaded) {
      w.innerHTML = "<div class='met-loading'>Loading DailyArt…</div>";
      return w;
    }
    if (this.error) {
      w.innerHTML = `<div class='met-error'>${this.error}</div>`;
      return w;
    }
    if (!this.art) {
      w.innerHTML = "<div class='met-empty'>No artwork.</div>";
      return w;
    }

    const { image, title, artist, objectDate, department, medium, creditLine } = this.art;

    const card = document.createElement("div");
    card.className = `met-card text-${this.config.textPosition}`;

    const img = document.createElement("img");
    img.className = "met-image";
    img.src = image;
    img.loading = "lazy";

    const info = document.createElement("div");
    info.className = "met-info";

    // Title
    if (this.config.showTitle && title) {
      const el = document.createElement("div");
      el.className = "met-title";
      el.textContent = title || "Untitled";
      info.appendChild(el);
    }

    // Artist / Date
    const lineBits = [];
    if (this.config.showArtist && artist) lineBits.push(artist);
    if (this.config.showDate && objectDate) lineBits.push(objectDate);
    if (lineBits.length) {
      const el = document.createElement("div");
      el.className = "met-body";
      el.textContent = lineBits.join(" — ");
      info.appendChild(el);
    }

    if (this.config.showMedium && medium) {
      const el = document.createElement("div");
      el.className = "met-body";
      el.textContent = medium;
      info.appendChild(el);
    }

    if (this.config.showDepartment && department) {
      const el = document.createElement("div");
      el.className = "met-body";
      el.textContent = department;
      info.appendChild(el);
    }

    if (this.config.showCredit && creditLine) {
      const el = document.createElement("div");
      el.className = "met-body";
      el.textContent = creditLine;
      info.appendChild(el);
    }

    if (this.config.showAttribution) {
      const el = document.createElement("div");
      el.className = "met-attrib";
      el.textContent = "Image & data: The Metropolitan Museum of Art";
      info.appendChild(el);
    }

    // Order children based on textPosition
    switch (this.config.textPosition) {
      case "left":
        // text left, image right
        card.appendChild(info);
        card.appendChild(img);
        break;
      case "right":
        // image left, text right
        card.appendChild(img);
        card.appendChild(info);
        break;
      case "top":
        // text on top, image below
        card.appendChild(info);
        card.appendChild(img);
        break;
      case "bottom":
        // image on top, text below
        card.appendChild(img);
        card.appendChild(info);
        break;
      default:
        card.appendChild(img);
        card.appendChild(info);
    }

    w.appendChild(card);
    return w;
  },

  // --- helpers ---
  _todaySeed() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
  },

  _effectiveUpdateInterval() {
    const requested = Math.max(1, Number(this.config.updateInterval) || 0);
    // Hard safety floor (avoid silly low polling): 10 minutes
    const HARD_MIN_MS = 10 * 60 * 1000;

    // If maxCallsPerHour is set, compute policy min
    let policyMin = 0;
    if (typeof this.config.maxCallsPerHour === "number" && this.config.maxCallsPerHour > 0) {
      const calls = Math.max(1, Math.floor(this.config.maxCallsPerHour));
      policyMin = Math.ceil(60 / calls) * 60 * 1000; // e.g., 2 => 30min
    }

    return Math.max(requested, HARD_MIN_MS, policyMin);
  },

  _scheduleMidnightRefresh() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0); // next local midnight
    const ms = next - now;

    this._midnightTimeout = setTimeout(() => {
      this.sendSocketNotification("MET_FETCH", { seed: this._todaySeed() });
      this._scheduleMidnightRefresh(); // schedule next
    }, ms);
  }
});
