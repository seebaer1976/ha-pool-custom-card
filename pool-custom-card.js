// pool-custom-card – v1.0
// Kein ha-card, kein Shadow DOM – plain div wie HA-Doku Beispiel

const _loadHaComponents = () => {
  if (!customElements.get("ha-form"))
    customElements.get("hui-button-card")?.getConfigElement();
  if (!customElements.get("ha-entity-picker"))
    customElements.get("hui-entities-card")?.getConfigElement();
};

const POOL_SCHEMA = [
  { name: "temp_entity", required: true, selector: { entity: { device_class: "temperature" } } },
  { name: "ph_entity", selector: { entity: { domain: "sensor" } } },
  { name: "level_entity", selector: { entity: { device_class: ["moisture", "volume", "volume_storage", "distance"] } } },
  { name: "pressure_entity", selector: { entity: { device_class: "pressure" } } },
  { name: "flow_entity", selector: { entity: { domain: "sensor" } } },
  { name: "pump_entity", selector: { entity: { domain: "switch" } } },
];

const POOL_LABELS = {
  temp_entity: "Wassertemperatur",
  ph_entity: "pH-Wert",
  level_entity: "Füllstand",
  pressure_entity: "Filterdruck",
  flow_entity: "Durchfluss (m³/h)",
  pump_entity: "Filterpumpe (Switch)",
};

// ── Hauptkarte ────────────────────────────────────────────────────────────────
class PoolCard extends HTMLElement {

  static getConfigElement() {
    return document.createElement("pool-custom-card-editor");
  }

  static getStubConfig() {
    return { temp_entity: "", ph_entity: "", level_entity: "", pressure_entity: "", flow_entity: "", pump_entity: "" };
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;

    // DOM einmalig aufbauen – kein ha-card, kein Shadow DOM
    if (!this.content) {
      this.innerHTML = `
        <style>
          pool-custom-card {
            display: block;
            background: var(--ha-card-background, var(--card-background-color, white));
            border-radius: var(--ha-card-border-radius, 12px);
            border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
            padding: 16px;
            box-sizing: border-box;
          }
          pool-custom-card .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
          pool-custom-card .title { font-size: 15px; font-weight: 500; color: var(--primary-text-color); }
          pool-custom-card .badge { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; background: var(--success-color, #4caf50); color: #fff; }
          pool-custom-card .badge.off { background: var(--secondary-background-color); color: var(--secondary-text-color); }
          pool-custom-card .schematic { background: var(--secondary-background-color); border-radius: 10px; padding: 4px; margin-bottom: 14px; }
          pool-custom-card svg { display: block; width: 100%; }
          pool-custom-card .sensors { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          pool-custom-card .srow { display: flex; align-items: center; gap: 8px; background: var(--secondary-background-color); border-radius: 8px; padding: 8px 10px; }
          pool-custom-card .slabel { font-size: 12px; color: var(--secondary-text-color); flex: 1; }
          pool-custom-card .sval { font-size: 14px; font-weight: 500; color: var(--primary-text-color); }
          pool-custom-card .sunit { font-size: 11px; color: var(--secondary-text-color); margin-left: 2px; }
          pool-custom-card .pump-btn { margin-bottom: 12px; padding: 6px 14px; font-size: 12px; border-radius: 8px; border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); cursor: pointer; }
          pool-custom-card .pump-btn.on { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
          @keyframes pcc-fwd { to { stroke-dashoffset: -20; } }
          @keyframes pcc-bwd { to { stroke-dashoffset: 20; } }
        </style>
        <div class="header">
          <span class="title">Pool</span>
          <span class="badge off" id="pcc-badge">Pumpe aus</span>
        </div>
        <button class="pump-btn" id="pcc-pbtn">Pumpe einschalten</button>
        <div class="schematic">
          <svg viewBox="0 0 580 240">
            <rect x="40" y="45" width="220" height="150" rx="60" fill="#B5D4F4" fill-opacity="0.18" stroke="#378ADD" stroke-width="1.5"/>
            <text x="150" y="98" text-anchor="middle" font-size="11" fill="#185FA5" font-weight="500">Pool</text>
            <text x="150" y="124" text-anchor="middle" font-size="18" fill="#0C447C" font-weight="500" id="pcc-temp">—°C</text>
            <text x="150" y="143" text-anchor="middle" font-size="12" fill="#378ADD" id="pcc-ph">pH —</text>
            <text x="150" y="160" text-anchor="middle" font-size="12" fill="#378ADD" id="pcc-level">Stand —%</text>
            <rect x="400" y="65" width="130" height="120" rx="12" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/>
            <text x="465" y="93" text-anchor="middle" font-size="11" fill="#085041" font-weight="500">Sandfilter</text>
            <circle cx="465" cy="130" r="24" fill="#9FE1CB" stroke="#1D9E75" stroke-width="1"/>
            <text x="465" y="126" text-anchor="middle" font-size="10" fill="#085041">Druck</text>
            <text x="465" y="140" text-anchor="middle" font-size="13" fill="#085041" font-weight="500" id="pcc-pres">— bar</text>
            <text x="465" y="172" text-anchor="middle" font-size="10" fill="#0F6E56" id="pcc-flow">—</text>
            <path d="M260 95 C330 95 360 95 400 105" fill="none" stroke="#378ADD" stroke-width="3" stroke-linecap="round"/>
            <path id="pcc-at" d="M260 95 C330 95 360 95 400 105" fill="none" stroke="#85B7EB" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 6" style="display:none"/>
            <path d="M400 150 C360 150 330 158 260 158" fill="none" stroke="#1D9E75" stroke-width="3" stroke-linecap="round"/>
            <path id="pcc-af" d="M400 150 C360 150 330 158 260 158" fill="none" stroke="#5DCAA5" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 6" style="display:none"/>
            <text x="330" y="89" text-anchor="middle" font-size="10" fill="#185FA5">Pool → Filter</text>
            <text x="330" y="172" text-anchor="middle" font-size="10" fill="#0F6E56" id="pcc-flowlbl">Filter → Pool</text>
            <circle cx="260" cy="95"  r="4" fill="#378ADD"/>
            <circle cx="260" cy="158" r="4" fill="#1D9E75"/>
            <circle cx="400" cy="105" r="4" fill="#378ADD"/>
            <circle cx="400" cy="150" r="4" fill="#1D9E75"/>
          </svg>
        </div>
        <div class="sensors">
          <div class="srow"><span class="slabel">Temperatur</span><span class="sval" id="pcc-vtemp">—</span><span class="sunit">°C</span></div>
          <div class="srow"><span class="slabel">pH-Wert</span><span class="sval" id="pcc-vph">—</span></div>
          <div class="srow"><span class="slabel">Füllstand</span><span class="sval" id="pcc-vlevel">—</span><span class="sunit">%</span></div>
          <div class="srow"><span class="slabel">Filterdruck</span><span class="sval" id="pcc-vpres">—</span><span class="sunit">bar</span></div>
        </div>`;

      this.content = this.querySelector(".header");

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
    const on = this._pumpOn();

    g("pcc-temp").textContent = temp !== null ? fmt(temp) + "°C" : "—°C";
    g("pcc-ph").textContent = ph !== null ? "pH " + fmt(ph) : "pH —";
    g("pcc-level").textContent = lev !== null ? "Stand " + Math.round(parseFloat(lev)) + "%" : "Stand —%";
    g("pcc-pres").textContent = pres !== null ? fmt(pres) + " bar" : "— bar";
    g("pcc-vtemp").textContent = temp !== null ? fmt(temp) : "—";
    g("pcc-vph").textContent = ph !== null ? fmt(ph) : "—";
    g("pcc-vlevel").textContent = lev !== null ? Math.round(parseFloat(lev)).toString() : "—";
    g("pcc-vpres").textContent = pres !== null ? fmt(pres) : "—";
    const ft = flow !== null ? fmt(flow) + " m³/h" : "—";
    g("pcc-flow").textContent = on ? ft : "—";
    g("pcc-flowlbl").textContent = on ? ft : "Filter → Pool";

    const badge = g("pcc-badge"), btn = g("pcc-pbtn"), at = g("pcc-at"), af = g("pcc-af");
    if (on) {
      badge.textContent = "Pumpe läuft"; badge.className = "badge";
      btn.textContent = "Pumpe ausschalten"; btn.className = "pump-btn on";
      at.style.display = "block"; af.style.display = "block";
      // Pool→Filter: Pfad läuft links→rechts, dashoffset nimmt ab → fwd
      at.style.animation = "pcc-fwd 0.8s linear infinite";
      // Filter→Pool: Pfad läuft rechts→links (x=400→x=260), dashoffset nimmt zu → bwd
      af.style.animation = "pcc-bwd 0.8s linear infinite";
    } else {
      badge.textContent = "Pumpe aus"; badge.className = "badge off";
      btn.textContent = "Pumpe einschalten"; btn.className = "pump-btn";
      at.style.display = "none"; af.style.display = "none";
      at.style.animation = "none"; af.style.animation = "none";
    }
  }
}

// ── Editor ────────────────────────────────────────────────────────────────────
class PoolCardEditor extends HTMLElement {

  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._form = null;
  }

  connectedCallback() {
    _loadHaComponents();
    this._build();
  }

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

// ── Registrierung ─────────────────────────────────────────────────────────────
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