// pool-custom-card – v1.2 – isometrisches SVG mit Chlorinator

const _loadHaComponents = () => {
  if (!customElements.get("ha-form"))
    customElements.get("hui-button-card")?.getConfigElement();
  if (!customElements.get("ha-entity-picker"))
    customElements.get("hui-entities-card")?.getConfigElement();
};

const POOL_SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    type: "expandable", name: "sensors", title: "Sensoren",
    schema: [
      { name: "temp_entity", required: true, selector: { entity: { device_class: "temperature" } } },
      { name: "ph_entity", selector: { entity: { domain: "sensor" } } },
      { name: "level_entity", selector: { entity: { device_class: ["moisture", "volume", "volume_storage", "distance"] } } },
      { name: "pressure_entity", selector: { entity: { device_class: "pressure" } } },
      { name: "flow_entity", selector: { entity: { domain: "sensor" } } },
      { name: "pump_entity", selector: { entity: { domain: "switch" } } },
      { name: "chlor_entity", selector: { entity: { domain: "sensor" } } },
    ],
  },
];

const POOL_LABELS = {
  title: "Kartenname",
  sensors: "Sensoren",
  temp_entity: "Wassertemperatur",
  ph_entity: "pH-Wert",
  level_entity: "Füllstand",
  pressure_entity: "Filterdruck",
  flow_entity: "Durchfluss (m³/h)",
  pump_entity: "Filterpumpe (Switch)",
  chlor_entity: "Salzwassersystem (Status)",
};

class PoolCard extends HTMLElement {

  static getConfigElement() {
    return document.createElement("pool-custom-card-editor");
  }

  static getStubConfig() {
    return { title: "Pool", temp_entity: "", ph_entity: "", level_entity: "", pressure_entity: "", flow_entity: "", pump_entity: "", chlor_entity: "" };
  }

  setConfig(config) { this.config = config; }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._lastPumpOn = undefined;
      this.innerHTML = `
        <style>
          pool-custom-card { display:block; background:var(--ha-card-background,var(--card-background-color,white)); border-radius:var(--ha-card-border-radius,12px); border:1px solid var(--ha-card-border-color,var(--divider-color,#e0e0e0)); box-sizing:border-box; overflow:hidden; }
          pool-custom-card svg { display:block; width:100%; }
          pool-custom-card .topbar { display:flex; align-items:center; justify-content:space-between; padding:10px 14px 4px; }
          pool-custom-card .card-title { font-size:14px; font-weight:500; color:var(--primary-text-color); }
          pool-custom-card .pump-btn { padding:4px 14px; font-size:11px; border-radius:20px; border:1px solid #2288cc; background:transparent; color:#2288cc; cursor:pointer; }
          pool-custom-card .pump-btn.on { background:#2288cc; color:#fff; }
          pool-custom-card .pump-status { font-size:11px; font-weight:500; color:var(--secondary-text-color); }
          pool-custom-card .pump-status.on { color:#22dd66; }
          @keyframes pcc-fwd { to { stroke-dashoffset:-20; } }
          @keyframes pcc-bwd { to { stroke-dashoffset:20; } }
        </style>
        <div class="topbar">
          <span class="card-title" id="pcc-title">Pool</span>
          <span class="pump-status" id="pcc-badge">Pumpe aus</span>
          <button class="pump-btn" id="pcc-pbtn">Pumpe einschalten</button>
        </div>
        <svg viewBox="0 0 680 370">
          <rect width="680" height="370" fill="#141820" />

          <!-- POOL x=185 y=222 -->
          <path d="M24 222 L24 268 Q24 320 185 320 Q346 320 346 268 L346 222" fill="#0b2d47" stroke="#1a5580"
            stroke-width="1.5" />
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="#0d3d65" />
          <ellipse cx="185" cy="222" rx="159" ry="60" fill="#0e4a7a" />
          <path d="M70 216 Q120 208 170 216 Q220 224 270 216 Q310 210 340 216" fill="none" stroke="#1a6fa0"
            stroke-width="1.2" opacity="0.5" />
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="none" stroke="#2299dd" stroke-width="2" />
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="none" stroke="#4ab8ff" stroke-width="0.5" opacity="0.4" />
          <rect x="210" y="162" width="4" height="62" rx="2" fill="#c8902a" />
          <rect x="228" y="162" width="4" height="62" rx="2" fill="#c8902a" />
          <rect x="208" y="174" width="26" height="3" rx="1.5" fill="#e0a830" />
          <rect x="208" y="187" width="26" height="3" rx="1.5" fill="#e0a830" />
          <rect x="208" y="200" width="26" height="3" rx="1.5" fill="#e0a830" />
          <text x="90" y="218" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6ab0d8">pH</text>
          <text x="90" y="242" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700"
            fill="#4ab8ff" id="pcc-ph">—</text>
          <text x="178" y="224" text-anchor="middle" font-family="sans-serif" font-size="11"
            fill="#6ab0d8">Temperatur</text>
          <text x="178" y="252" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700"
            fill="#4ab8ff" id="pcc-temp">—°C</text>
          <text x="278" y="218" text-anchor="middle" font-family="sans-serif" font-size="11"
            fill="#6ab0d8">Füllstand</text>
          <text x="278" y="242" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700"
            fill="#4ab8ff" id="pcc-level">—%</text>

          <!-- SANDFILTER x=567 y=138 -->
          <ellipse cx="567" cy="196" rx="34" ry="11" fill="#152a1e" stroke="#1a5530" stroke-width="1.2" />
          <path d="M533 122 L533 196 Q533 207 567 207 Q601 207 601 196 L601 122" fill="#162a1e" stroke="#1d5535"
            stroke-width="1.5" />
          <path d="M533 122 Q533 86 567 86 Q601 86 601 122" fill="#1a3025" stroke="#256640" stroke-width="1.5" />
          <path d="M533 122 L533 196 Q533 207 567 207 Q601 207 601 196 L601 122 Q601 86 567 86 Q533 86 533 122"
            fill="none" stroke="#22dd66" stroke-width="0.6" opacity="0.5" />
          <path d="M537 168 L537 194 Q537 205 567 205 Q597 205 597 194 L597 168 Z" fill="#1e3828" opacity="0.8" />
          <path d="M537 152 Q567 162 597 152 L597 168 Q567 178 537 168 Z" fill="#254030" opacity="0.6" />
          <circle cx="567" cy="132" r="24" fill="#0d1a12" stroke="#1d6633" stroke-width="1.5" />
          <circle cx="567" cy="132" r="20" fill="none" stroke="#154422" stroke-width="1" />
          <text x="567" y="127" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#44bb77">bar</text>
          <text x="567" y="142" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700"
            fill="#22dd66" id="pcc-pres">—</text>

          <!-- VENTIL x=567 y=63 -->
          <rect x="549" y="50" width="36" height="26" rx="4" fill="#1e3a28" stroke="#2a7040" stroke-width="1.5" />
          <rect x="529" y="57" width="20" height="10" rx="3" fill="#1a3020" stroke="#22aa44" stroke-width="1.5" />
          <circle cx="529" cy="62" r="4" fill="#0d1a10" stroke="#22dd66" stroke-width="1.2" />
          <rect x="585" y="57" width="20" height="10" rx="3" fill="#0d1e30" stroke="#2266aa" stroke-width="1.5" />
          <circle cx="605" cy="62" r="4" fill="#0a1520" stroke="#2288cc" stroke-width="1.2" />
          <rect x="561" y="36" width="10" height="16" rx="3" fill="#2a4a35" stroke="#3a8a50" stroke-width="1.2" />
          <ellipse cx="566" cy="36" rx="7" ry="3.5" fill="#2a5535" stroke="#4aaa60" stroke-width="1" />
          <line x1="566" y1="33" x2="555" y2="22" stroke="#4aaa60" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="553" cy="21" r="3.5" fill="#22aa44" stroke="#44cc66" stroke-width="1" />
          <rect x="561" y="76" width="10" height="12" rx="2" fill="#1e3a28" stroke="#2a6a3a" stroke-width="1" />

          <!-- PUMPE x=575 y=270 -->
          <rect x="547" y="252" width="56" height="36" rx="6" fill="#1a1e30" stroke="#334488" stroke-width="1.5" />
          <ellipse cx="547" cy="270" rx="15" ry="15" fill="#0f1525" stroke="#2244aa" stroke-width="1.5" />
          <ellipse cx="547" cy="270" rx="9" ry="9" fill="#0a0f1e" stroke="#3366cc" stroke-width="1" />
          <ellipse cx="547" cy="270" rx="3.5" ry="3.5" fill="#1a2a4a" stroke="#4488ff" stroke-width="1" />
          <rect x="583" y="256" width="20" height="26" rx="4" fill="#161a28" stroke="#2a3060" stroke-width="1.2" />
          <line x1="587" y1="256" x2="587" y2="282" stroke="#2a3060" stroke-width="1" />
          <line x1="590" y1="256" x2="590" y2="282" stroke="#2a3060" stroke-width="1" />
          <line x1="593" y1="256" x2="593" y2="282" stroke="#2a3060" stroke-width="1" />
          <line x1="596" y1="256" x2="596" y2="282" stroke="#2a3060" stroke-width="1" />
          <line x1="599" y1="256" x2="599" y2="282" stroke="#2a3060" stroke-width="1" />
          <rect x="515" y="264" width="17" height="10" rx="3" fill="#141828" stroke="#2244aa" stroke-width="1.2" />
          <rect x="548" y="236" width="10" height="17" rx="3" fill="#141828" stroke="#2244aa" stroke-width="1.2" />
          <circle cx="585" cy="280" r="3" fill="#223" stroke="#334" id="pcc-led" />

          <!-- CHLORINATOR x=403 y=173 -->
          <rect x="366" y="173" width="74" height="24" rx="12" fill="#d8d8d8" stroke="#aaaaaa" stroke-width="1.2" />
          <path d="M371 173 Q371 148 403 146 Q435 144 435 173 Z" fill="#d2d2d2" stroke="#aaaaaa" stroke-width="1.2" />
          <rect x="381" y="150" width="44" height="23" rx="9" fill="#2a3828" stroke="#3a5040" stroke-width="1.2" />
          <rect x="385" y="153" width="13" height="7" rx="2" fill="#0a1208" stroke="#1a2a18" stroke-width="0.5" />
          <circle cx="395" cy="157" r="3" id="pcc-chlor-led" fill="#001800" stroke="#002800" />
          <circle cx="406" cy="156" r="1.8" fill="#3a5038" />
          <circle cx="413" cy="156" r="1.8" fill="#3a5038" />
          <circle cx="420" cy="156" r="1.8" fill="#3a5038" />
          <circle cx="406" cy="164" r="1.8" fill="#3a5038" />
          <circle cx="413" cy="164" r="1.8" fill="#3a5038" />
          <circle cx="420" cy="164" r="1.8" fill="#3a5038" />
          <!-- Rechter Anschluss bei x=442 -->
          <rect x="418" y="177" width="12" height="12" rx="3" fill="#888" stroke="#666" stroke-width="1" />
          <ellipse cx="424" cy="183" rx="5" ry="5" fill="#1a2030" stroke="#4466aa" stroke-width="1.5" />
          <ellipse cx="424" cy="183" rx="2.8" ry="2.8" fill="#0a1020" stroke="#5588cc" stroke-width="1" />
          <!-- Linker Anschluss bei x=364 -->
          <rect x="375" y="177" width="12" height="12" rx="3" fill="#888" stroke="#666" stroke-width="1" />
          <ellipse cx="381" cy="183" rx="5" ry="5" fill="#1a2030" stroke="#4466aa" stroke-width="1.5" />
          <ellipse cx="381" cy="183" rx="2.8" ry="2.8" fill="#0a1020" stroke="#5588cc" stroke-width="1" />

          <!-- LINIEN STATISCH -->
          <!-- Blau -->
          <path d="M554 235 C554 225 554 225 554 225" fill="none" stroke="#0d2a44" stroke-width="5"
            stroke-linecap="round" />
          <path d="M554 235 C554 225 554 225 554 225" fill="none" stroke="#1a4a6a" stroke-width="3"
            stroke-linecap="round" />
          <path d="M554 225 C614 225 624 225 634 225" fill="none" stroke="#0d2a44" stroke-width="5"
            stroke-linecap="round" />
          <path d="M554 225 C614 225 624 225 634 225" fill="none" stroke="#1a4a6a" stroke-width="3"
            stroke-linecap="round" />
          <path d="M634 222 C635 248 634 84 634 63" fill="none" stroke="#0d2a44" stroke-width="5"
            stroke-linecap="round" />
          <path d="M634 222 C635 248 634 84 634 63" fill="none" stroke="#1a4a6a" stroke-width="3"
            stroke-linecap="round" />
          <path d="M634 62 C621 62 608 62 605 62" fill="none" stroke="#0d2a44" stroke-width="5" stroke-linecap="round" />
          <path d="M634 62 C621 62 608 62 605 62" fill="none" stroke="#1a4a6a" stroke-width="3" stroke-linecap="round" />
          <path d="M515 269 C461 269 378 270 293 270" fill="none" stroke="#0d2a44" stroke-width="5"
            stroke-linecap="round" />
          <path d="M515 269 C461 269 378 270 293 270" fill="none" stroke="#1a4a6a" stroke-width="3"
            stroke-linecap="round" />
          <!-- Grün -->
          <path d="M380 183 C348 183 332 183 315 183" fill="none" stroke="#0a2018" stroke-width="5"
            stroke-linecap="round" />
          <path d="M380 183 C348 183 332 183 315 183" fill="none" stroke="#1a4028" stroke-width="3"
            stroke-linecap="round" />
          <path d="M425 183 C456 182 470 182 484 183" fill="none" stroke="#0a2018" stroke-width="5"
            stroke-linecap="round" />
          <path d="M425 183 C456 182 470 182 484 183" fill="none" stroke="#1a4028" stroke-width="3"
            stroke-linecap="round" />
          <path d="M484 183 C484 169 484 75 484 63" fill="none" stroke="#0a2018" stroke-width="5"
            stroke-linecap="round" />
          <path d="M484 183 C484 169 484 75 484 63" fill="none" stroke="#1a4028" stroke-width="3"
            stroke-linecap="round" />
          <path d="M484 62 C502 62 520 63 529 62" fill="none" stroke="#0a2018" stroke-width="5" stroke-linecap="round" />
          <path d="M484 62 C502 62 520 63 529 62" fill="none" stroke="#1a4028" stroke-width="3" stroke-linecap="round" />

          <!-- ANIMIERT -->
          <path id="pcc-p1a" d="M515 269 C461 269 378 270 293 270" fill="none" stroke="#2299ee" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p1b" d="M554 225 C614 225 624 225 634 225" fill="none" stroke="#2299ee" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p1c" d="M634 222 C635 248 634 84 634 63" fill="none" stroke="#2299ee" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p1d" d="M634 62 C621 62 608 62 605 62" fill="none" stroke="#2299ee" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p1e" d="M554 235 C554 225 554 225 554 225" fill="none" stroke="#2299ee" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p3a" d="M380 183 C348 183 332 183 315 183" fill="none" stroke="#22dd66" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p3b" d="M425 183 C456 182 470 182 484 183" fill="none" stroke="#22dd66" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p3c" d="M484 183 C484 169 484 75 484 63" fill="none" stroke="#22dd66" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />
          <path id="pcc-p3d" d="M484 62 C502 62 520 63 529 62" fill="none" stroke="#22dd66" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="8 6" style="display:none" />

          <!-- Durchfluss Badge auf grüner vertikaler Linie -->
          <rect x="459" y="115" width="50" height="26" rx="6" fill="#0d1a12" stroke="#22aa44" stroke-width="1.2" />
          <text x="484" y="126" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#44bb77">m³/h</text>
          <text x="484" y="137" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700"
            fill="#22dd66" id="pcc-flow">—</text>
        </svg>`;

      this.content = this.querySelector(".topbar");
      this.querySelector("#pcc-pbtn").addEventListener("click", () => {
        if (!this._hass || !this.config?.pump_entity) return;
        this._hass.callService("switch", this._pumpOn() ? "turn_off" : "turn_on", { entity_id: this.config.pump_entity });
      });
    }
    this._update();
  }

  getCardSize() { return 5; }
  getGridOptions() { return { rows: 5, columns: 12, min_rows: 4 }; }

  _val(id) {
    if (!this._hass || !id) return null;
    const s = this._hass.states[id];
    return s ? s.state : null;
  }

  _pumpOn() { return this._val(this.config?.pump_entity) === "on"; }

  _update() {
    if (!this.content) return;
    const g = (id) => this.querySelector("#" + id);
    const fmt = (v, d = 1) => parseFloat(v).toFixed(d);
    const temp = this._val(this.config?.temp_entity);
    const ph = this._val(this.config?.ph_entity);
    const lev = this._val(this.config?.level_entity);
    const pres = this._val(this.config?.pressure_entity);
    const flow = this._val(this.config?.flow_entity);
    const chlor = this._val(this.config?.chlor_entity);
    const on = this._pumpOn();

    g("pcc-title").textContent = this.config?.title || "Pool";
    g("pcc-temp").textContent = temp !== null ? fmt(temp) + "°C" : "—°C";
    g("pcc-ph").textContent = ph !== null ? fmt(ph) : "—";
    g("pcc-level").textContent = lev !== null ? Math.round(parseFloat(lev)) + "%" : "—%";
    g("pcc-pres").textContent = pres !== null ? fmt(pres) : "—";
    g("pcc-flow").textContent = flow !== null ? fmt(flow) : "—";

    // Chlorinator LED
    const chlorLed = g("pcc-chlor-led");
    const chlorActive = chlor !== null && chlor !== "off" && chlor !== "0" && chlor !== "idle";
    chlorLed.setAttribute("fill", chlorActive ? "#00ee44" : "#330000");
    chlorLed.setAttribute("stroke", chlorActive ? "#00ff66" : "#440000");

    const badge = g("pcc-badge"), btn = g("pcc-pbtn");
    if (on) {
      badge.textContent = "Pumpe läuft"; badge.className = "pump-status on";
      btn.textContent = "Pumpe ausschalten"; btn.className = "pump-btn on";
    } else {
      badge.textContent = "Pumpe aus"; badge.className = "pump-status";
      btn.textContent = "Pumpe einschalten"; btn.className = "pump-btn";
    }

    if (on !== this._lastPumpOn) {
      this._lastPumpOn = on;
      const led = g("pcc-led");
      // Blau: Pool←Pumpe (p1a rechts→links=bwd), Pumpe→oben (p1b links→rechts=fwd),
      //       runter (p1c oben→unten=fwd), Ventil (p1d rechts→links=bwd), senkrecht kurz (p1e=fwd)
      const blueSegs = {
        "pcc-p1a": "pcc-bwd",
        "pcc-p1b": "pcc-fwd",
        "pcc-p1c": "pcc-fwd",
        "pcc-p1d": "pcc-fwd",
        "pcc-p1e": "pcc-fwd",
      };
      // Grün: Chlor→Pool (p3a rechts→links=bwd), Chlor→rechts (p3b links→rechts=fwd),
      //       senkrecht hoch (p3c=bwd), zum Ventil (p3d links→rechts=fwd)
      const greenSegs = {
        "pcc-p3a": "pcc-bwd",
        "pcc-p3b": "pcc-bwd",
        "pcc-p3c": "pcc-bwd",
        "pcc-p3d": "pcc-fwd",
      };
      Object.entries({ ...blueSegs, ...greenSegs }).forEach(([id, anim]) => {
        const el = g(id);
        if (!el) return;
        if (on) {
          el.style.display = "block";
          // Animation nur setzen wenn noch nicht läuft – verhindert Ruckeln
          if (!el.style.animationName || el.style.animationName === "none") {
            el.style.animation = anim + " 0.9s linear infinite";
          }
        } else {
          el.style.display = "none";
          el.style.animation = "none";
          el.style.animationName = "none";
        }
      });
      led.setAttribute("fill", on ? "#22ff88" : "#223");
      led.setAttribute("stroke", on ? "#44ffaa" : "#334");
    }
  }
}

// ── Editor ────────────────────────────────────────────────────────────────────
class PoolCardEditor extends HTMLElement {
  constructor() { super(); this._config = {}; this._hass = null; this._form = null; }

  connectedCallback() { _loadHaComponents(); this._build(); }

  setConfig(config) {
    this._config = { ...config };
    if (this._form) this._form.data = this._config;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._build();
  }

  _build() {
    if (this._form || !this._hass) return;
    this._form = document.createElement("ha-form");
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = POOL_SCHEMA;
    this._form.computeLabel = (s) => POOL_LABELS[s.name] || s.name;
    this._form.addEventListener("value-changed", (e) => {
      e.stopPropagation();
      this._config = { ...e.detail.value };
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: this._config }, bubbles: true, composed: true,
      }));
    });
    this.appendChild(this._form);
  }
}

customElements.define("pool-custom-card-editor", PoolCardEditor);
customElements.define("pool-custom-card", PoolCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "pool-custom-card", name: "Pool Custom Card", preview: false,
  description: "Schematische Pool-Übersicht mit animiertem Filterkreislauf",
  documentationURL: "https://github.com/seebaer1976/ha-pool-custom-card",
});

(async () => {
  const RURL = "/local/pool-custom-card/pool-custom-card.js";
  await customElements.whenDefined("home-assistant");
  const ha = document.querySelector("home-assistant");
  if (!ha) return;
  try {
    const conn = ha.connection;
    if (!conn) return;
    const res = await conn.sendMessagePromise({ type: "lovelace/resources" });
    if (!res.some(r => r.url === RURL)) {
      await conn.sendMessagePromise({ type: "lovelace/resources/create", res_type: "module", url: RURL });
      console.info("[pool-custom-card] Ressource registriert – bitte Seite neu laden.");
    }
  } catch (_) { }
})();