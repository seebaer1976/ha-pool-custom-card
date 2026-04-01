// pool-custom-card – v1.1 – isometrisches SVG

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

    if (!this.content) {
      this._lastPumpOn = undefined;
      this.innerHTML = `
        <style>
          pool-custom-card {
            display: block;
            background: var(--ha-card-background, var(--card-background-color, white));
            border-radius: var(--ha-card-border-radius, 12px);
            border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
            box-sizing: border-box;
            overflow: hidden;
          }
          pool-custom-card svg { display: block; width: 100%; }
          pool-custom-card .pump-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 14px 6px;
          }
          pool-custom-card .pump-btn {
            padding: 4px 14px; font-size: 11px; border-radius: 20px;
            border: 1px solid #2288cc; background: transparent;
            color: #2288cc; cursor: pointer;
          }
          pool-custom-card .pump-btn.on { background: #2288cc; color: #fff; }
          pool-custom-card .pump-status {
            font-size: 11px; font-weight: 500;
            color: var(--secondary-text-color);
          }
          pool-custom-card .pump-status.on { color: #22dd66; }
          @keyframes pcc-fwd { to { stroke-dashoffset: -20; } }
          @keyframes pcc-bwd { to { stroke-dashoffset: 20; } }
        </style>
        <div class="pump-bar">
          <span class="pump-status" id="pcc-badge">Pumpe aus</span>
          <button class="pump-btn" id="pcc-pbtn">Pumpe einschalten</button>
        </div>
        <svg viewBox="0 0 680 370">
          <rect width="680" height="370" fill="#141820"/>

          <!-- POOL -->
          <path d="M24 222 L24 268 Q24 320 185 320 Q346 320 346 268 L346 222" fill="#0b2d47" stroke="#1a5580" stroke-width="1.5"/>
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="#0d3d65"/>
          <ellipse cx="185" cy="222" rx="159" ry="60" fill="#0e4a7a"/>
          <path d="M70 216 Q120 208 170 216 Q220 224 270 216 Q310 210 340 216" fill="none" stroke="#1a6fa0" stroke-width="1.2" opacity="0.5"/>
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="none" stroke="#2299dd" stroke-width="2"/>
          <ellipse cx="185" cy="222" rx="161" ry="62" fill="none" stroke="#4ab8ff" stroke-width="0.5" opacity="0.4"/>

          <!-- Leiter -->
          <rect x="210" y="162" width="4" height="62" rx="2" fill="#c8902a"/>
          <rect x="228" y="162" width="4" height="62" rx="2" fill="#c8902a"/>
          <rect x="208" y="174" width="26" height="3" rx="1.5" fill="#e0a830"/>
          <rect x="208" y="187" width="26" height="3" rx="1.5" fill="#e0a830"/>
          <rect x="208" y="200" width="26" height="3" rx="1.5" fill="#e0a830"/>

          <!-- Sensorwerte Pool -->
          <text x="90" y="218" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6ab0d8">pH</text>
          <text x="90" y="242" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="#4ab8ff" id="pcc-ph">—</text>
          <text x="178" y="224" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6ab0d8">Temperatur</text>
          <text x="178" y="252" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#4ab8ff" id="pcc-temp">—°C</text>
          <text x="278" y="218" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6ab0d8">Füllstand</text>
          <text x="278" y="242" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="#4ab8ff" id="pcc-level">—%</text>

          <!-- SANDFILTER -->
          <ellipse cx="538" cy="234" rx="34" ry="11" fill="#152a1e" stroke="#1a5530" stroke-width="1.2"/>
          <path d="M504 160 L504 234 Q504 245 538 245 Q572 245 572 234 L572 160" fill="#162a1e" stroke="#1d5535" stroke-width="1.5"/>
          <path d="M504 160 Q504 124 538 124 Q572 124 572 160" fill="#1a3025" stroke="#256640" stroke-width="1.5"/>
          <path d="M504 160 L504 234 Q504 245 538 245 Q572 245 572 234 L572 160 Q572 124 538 124 Q504 124 504 160" fill="none" stroke="#22dd66" stroke-width="0.6" opacity="0.5"/>
          <path d="M508 206 L508 232 Q508 243 538 243 Q568 243 568 232 L568 206 Z" fill="#1e3828" opacity="0.8"/>
          <path d="M508 190 Q538 200 568 190 L568 206 Q538 216 508 206 Z" fill="#254030" opacity="0.6"/>
          <circle cx="538" cy="170" r="24" fill="#0d1a12" stroke="#1d6633" stroke-width="1.5"/>
          <circle cx="538" cy="170" r="20" fill="none" stroke="#154422" stroke-width="1"/>
          <text x="538" y="165" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#44bb77">bar</text>
          <text x="538" y="180" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#22dd66" id="pcc-pres">—</text>

          <!-- VENTIL -->
          <rect x="520" y="96" width="36" height="26" rx="4" fill="#1e3a28" stroke="#2a7040" stroke-width="1.5"/>
          <rect x="500" y="103" width="20" height="10" rx="3" fill="#1a3020" stroke="#22aa44" stroke-width="1.5"/>
          <circle cx="500" cy="108" r="4" fill="#0d1a10" stroke="#22dd66" stroke-width="1.2"/>
          <rect x="556" y="103" width="20" height="10" rx="3" fill="#0d1e30" stroke="#2266aa" stroke-width="1.5"/>
          <circle cx="576" cy="108" r="4" fill="#0a1520" stroke="#2288cc" stroke-width="1.2"/>
          <rect x="532" y="82" width="10" height="16" rx="3" fill="#2a4a35" stroke="#3a8a50" stroke-width="1.2"/>
          <ellipse cx="537" cy="82" rx="7" ry="3.5" fill="#2a5535" stroke="#4aaa60" stroke-width="1"/>
          <line x1="537" y1="79" x2="526" y2="68" stroke="#4aaa60" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="524" cy="67" r="3.5" fill="#22aa44" stroke="#44cc66" stroke-width="1"/>
          <rect x="532" y="122" width="10" height="14" rx="2" fill="#1e3a28" stroke="#2a6a3a" stroke-width="1"/>

          <!-- PUMPE -->
          <rect x="578" y="252" width="56" height="36" rx="6" fill="#1a1e30" stroke="#334488" stroke-width="1.5"/>
          <ellipse cx="600" cy="270" rx="15" ry="15" fill="#0f1525" stroke="#2244aa" stroke-width="1.5"/>
          <ellipse cx="600" cy="270" rx="9" ry="9" fill="#0a0f1e" stroke="#3366cc" stroke-width="1"/>
          <ellipse cx="600" cy="270" rx="3.5" ry="3.5" fill="#1a2a4a" stroke="#4488ff" stroke-width="1"/>
          <line x1="600" y1="262" x2="600" y2="278" stroke="#4488ff" stroke-width="1.2" opacity="0.6"/>
          <line x1="592" y1="270" x2="608" y2="270" stroke="#4488ff" stroke-width="1.2" opacity="0.6"/>
          <rect x="623" y="256" width="20" height="26" rx="4" fill="#161a28" stroke="#2a3060" stroke-width="1.2"/>
          <line x1="627" y1="256" x2="627" y2="282" stroke="#2a3060" stroke-width="1"/>
          <line x1="631" y1="256" x2="631" y2="282" stroke="#2a3060" stroke-width="1"/>
          <line x1="635" y1="256" x2="635" y2="282" stroke="#2a3060" stroke-width="1"/>
          <line x1="639" y1="256" x2="639" y2="282" stroke="#2a3060" stroke-width="1"/>
          <rect x="595" y="236" width="10" height="17" rx="3" fill="#141828" stroke="#2244aa" stroke-width="1.2"/>
          <rect x="556" y="264" width="22" height="10" rx="3" fill="#141828" stroke="#2244aa" stroke-width="1.2"/>
          <ellipse cx="600" cy="270" rx="16" ry="16" fill="none" stroke="#4488ff" stroke-width="0.5" opacity="0.4"/>
          <circle cx="628" cy="285" r="3" fill="#223" stroke="#334" id="pcc-led"/>

          <!-- ROHRLEITUNGEN statisch -->
          <path d="M346 268 C430 278 500 275 556 269" fill="none" stroke="#0d2a44" stroke-width="5" stroke-linecap="round"/>
          <path d="M346 268 C430 278 500 275 556 269" fill="none" stroke="#1a4a6a" stroke-width="3" stroke-linecap="round"/>
          <path d="M600 236 C600 185 592 140 576 108" fill="none" stroke="#0d2a44" stroke-width="5" stroke-linecap="round"/>
          <path d="M600 236 C600 185 592 140 576 108" fill="none" stroke="#1a4a6a" stroke-width="3" stroke-linecap="round"/>
          <path d="M331 185 C390 158 445 125 500 108" fill="none" stroke="#0a2018" stroke-width="5" stroke-linecap="round"/>
          <path d="M331 185 C390 158 445 125 500 108" fill="none" stroke="#1a4028" stroke-width="3" stroke-linecap="round"/>

          <!-- ROHRLEITUNGEN animiert -->
          <path id="pcc-p1" d="M346 268 C430 278 500 275 556 269" fill="none" stroke="#2299ee" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8 6" style="display:none"/>
          <path id="pcc-p2" d="M600 236 C600 185 592 140 576 108" fill="none" stroke="#2299ee" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8 6" style="display:none"/>
          <path id="pcc-p3" d="M331 185 C390 158 445 125 500 108" fill="none" stroke="#22dd66" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8 6" style="display:none"/>

          <!-- Durchfluss-Badge auf grüner Linie -->
          <rect x="388" y="128" width="56" height="30" rx="6" fill="#0d1a12" stroke="#22aa44" stroke-width="1.2"/>
          <text x="416" y="141" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#44bb77">m³/h</text>
          <text x="416" y="153" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#22dd66" id="pcc-flow">—</text>
        </svg>`;

      this.content = this.querySelector(".pump-bar");

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
    g("pcc-ph").textContent = ph !== null ? fmt(ph) : "—";
    g("pcc-level").textContent = lev !== null ? Math.round(parseFloat(lev)) + "%" : "—%";
    g("pcc-pres").textContent = pres !== null ? fmt(pres) : "—";
    g("pcc-flow").textContent = flow !== null ? fmt(flow) : "—";

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
      ["pcc-p1", "pcc-p2"].forEach(id => {
        const el = g(id);
        el.style.display = on ? "block" : "none";
        el.style.animation = on ? "pcc-fwd 0.9s linear infinite" : "none";
      });
      const p3 = g("pcc-p3");
      p3.style.display = on ? "block" : "none";
      p3.style.animation = on ? "pcc-bwd 0.9s linear infinite" : "none";
      led.setAttribute("fill", on ? "#22ff88" : "#223");
      led.setAttribute("stroke", on ? "#44ffaa" : "#334");
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