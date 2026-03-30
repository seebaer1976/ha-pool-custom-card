class PoolCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._animFrame = null;
    this._dashOffset = 0;
  }

  static getConfigElement() {
    return document.createElement("pool-custom-card-editor");
  }

  static getStubConfig() {
    return {
      temp_entity: "sensor.pool_temperature",
      ph_entity: "sensor.pool_ph",
      level_entity: "sensor.pool_level",
      pressure_entity: "sensor.pool_filter_pressure",
      flow_entity: "sensor.pool_flow_rate",
      pump_entity: "switch.pool_pump",
    };
  }

  setConfig(config) {
    this.config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateValues();
  }

  getCardSize() { return 5; }

  getGridOptions() {
    return { rows: 5, columns: 12, min_rows: 4 };
  }

  _val(entityId) {
    if (!this._hass || !entityId) return null;
    const s = this._hass.states[entityId];
    return s ? s.state : null;
  }

  _pumpOn() {
    const v = this._val(this.config?.pump_entity);
    return v === "on";
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          padding: 16px;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .title {
          font-size: 15px;
          font-weight: 500;
        }
        .badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          background: var(--success-color, #4caf50);
          color: #fff;
        }
        .badge.off {
          background: var(--secondary-background-color);
          color: var(--secondary-text-color);
        }
        .schematic {
          background: var(--secondary-background-color);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 14px;
        }
        svg { display: block; width: 100%; }
        .sensors {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .sensor-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--secondary-background-color);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .sensor-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          flex: 1;
        }
        .sensor-val {
          font-size: 14px;
          font-weight: 500;
        }
        .sensor-unit {
          font-size: 11px;
          color: var(--disabled-text-color);
          margin-left: 2px;
        }
        .pump-btn {
          margin-bottom: 12px;
          padding: 6px 14px;
          font-size: 12px;
          border-radius: 8px;
          border: 1px solid var(--divider-color);
          background: transparent;
          color: var(--primary-text-color);
          cursor: pointer;
        }
        .pump-btn.on {
          background: var(--primary-color);
          color: #fff;
          border-color: var(--primary-color);
        }

        @keyframes flow-fwd  { to { stroke-dashoffset: -20; } }
        @keyframes flow-bwd  { to { stroke-dashoffset:  20; } }
        .anim-fwd  { animation: flow-fwd  0.8s linear infinite; }
        .anim-bwd  { animation: flow-bwd  0.8s linear infinite; }
      </style>
      <ha-card>
        <div class="header">
          <span class="title">Pool</span>
          <span class="badge off" id="badge">Pumpe aus</span>
        </div>
        <button class="pump-btn" id="pump-btn">Pumpe einschalten</button>
        <div class="schematic">
          <svg viewBox="0 0 580 240">

            <!-- Pool -->
            <rect x="40" y="45" width="220" height="150" rx="60"
              fill="#B5D4F4" fill-opacity="0.18" stroke="#378ADD" stroke-width="1.5"/>
            <text x="150" y="98"  text-anchor="middle" font-size="11" fill="#185FA5" font-weight="500">Pool</text>
            <text x="150" y="124" text-anchor="middle" font-size="18" fill="#0C447C" font-weight="500" id="s-temp">—°C</text>
            <text x="150" y="143" text-anchor="middle" font-size="12" fill="#378ADD" id="s-ph">pH —</text>
            <text x="150" y="160" text-anchor="middle" font-size="12" fill="#378ADD" id="s-level">Stand —%</text>

            <!-- Sandfilter -->
            <rect x="400" y="65" width="130" height="120" rx="12"
              fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/>
            <text x="465" y="93"  text-anchor="middle" font-size="11" fill="#085041" font-weight="500">Sandfilter</text>
            <circle cx="465" cy="130" r="24" fill="#9FE1CB" stroke="#1D9E75" stroke-width="1"/>
            <text x="465" y="126" text-anchor="middle" font-size="10" fill="#085041">Druck</text>
            <text x="465" y="140" text-anchor="middle" font-size="13" fill="#085041" font-weight="500" id="s-pressure">— bar</text>
            <text x="465" y="172" text-anchor="middle" font-size="10" fill="#0F6E56" id="s-flow">—</text>

            <!-- Vorlauf Pool→Filter (oben, blau) -->
            <path id="pipe-base-to"
              d="M260 95 C330 95 360 95 400 105"
              fill="none" stroke="#378ADD" stroke-width="3" stroke-linecap="round"/>
            <!-- animierte Fließlinie Pool→Filter -->
            <path id="pipe-anim-to"
              d="M260 95 C330 95 360 95 400 105"
              fill="none" stroke="#85B7EB" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="8 6" stroke-dashoffset="0" style="display:none"/>

            <!-- Rücklauf Filter→Pool (unten, grün) -->
            <!-- Pfad läuft von Filter (x=400) nach Pool (x=260), d.h. von rechts nach links -->
            <path id="pipe-base-from"
              d="M400 150 C360 150 330 158 260 158"
              fill="none" stroke="#1D9E75" stroke-width="3" stroke-linecap="round"/>
            <!-- animierte Fließlinie Filter→Pool: dashoffset wächst positiv → bewegt sich von rechts nach links -->
            <path id="pipe-anim-from"
              d="M400 150 C360 150 330 158 260 158"
              fill="none" stroke="#5DCAA5" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="8 6" stroke-dashoffset="0" style="display:none"/>

            <!-- Labels -->
            <text x="330" y="89"  text-anchor="middle" font-size="10" fill="#185FA5">Pool → Filter</text>
            <text x="330" y="172" text-anchor="middle" font-size="10" fill="#0F6E56" id="s-flow-label">Filter → Pool</text>

            <!-- Verbindungspunkte -->
            <circle cx="260" cy="95"  r="4" fill="#378ADD"/>
            <circle cx="260" cy="158" r="4" fill="#1D9E75"/>
            <circle cx="400" cy="105" r="4" fill="#378ADD"/>
            <circle cx="400" cy="150" r="4" fill="#1D9E75"/>
          </svg>
        </div>
        <div class="sensors">
          <div class="sensor-row">
            <span class="sensor-label">Temperatur</span>
            <span class="sensor-val" id="v-temp">—</span><span class="sensor-unit">°C</span>
          </div>
          <div class="sensor-row">
            <span class="sensor-label">pH-Wert</span>
            <span class="sensor-val" id="v-ph">—</span>
          </div>
          <div class="sensor-row">
            <span class="sensor-label">Füllstand</span>
            <span class="sensor-val" id="v-level">—</span><span class="sensor-unit">%</span>
          </div>
          <div class="sensor-row">
            <span class="sensor-label">Filterdruck</span>
            <span class="sensor-val" id="v-pressure">—</span><span class="sensor-unit">bar</span>
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById("pump-btn").addEventListener("click", () => {
      if (!this._hass || !this.config?.pump_entity) return;
      const svc = this._pumpOn() ? "turn_off" : "turn_on";
      this._hass.callService("switch", svc, { entity_id: this.config.pump_entity });
    });
  }

  _updateValues() {
    if (!this.shadowRoot.querySelector("ha-card")) return;

    const get = (id) => this.shadowRoot.getElementById(id);
    const fmtNum = (v, dec = 1) => v !== null ? parseFloat(v).toFixed(dec) : "—";

    const temp     = this._val(this.config?.temp_entity);
    const ph       = this._val(this.config?.ph_entity);
    const level    = this._val(this.config?.level_entity);
    const pressure = this._val(this.config?.pressure_entity);
    const flow     = this._val(this.config?.flow_entity);
    const on       = this._pumpOn();

    get("s-temp").textContent     = temp     !== null ? fmtNum(temp, 1) + "°C"   : "—°C";
    get("s-ph").textContent       = ph       !== null ? "pH " + fmtNum(ph, 1)    : "pH —";
    get("s-level").textContent    = level    !== null ? "Stand " + Math.round(parseFloat(level)) + "%" : "Stand —%";
    get("s-pressure").textContent = pressure !== null ? fmtNum(pressure, 1) + " bar" : "— bar";

    get("v-temp").textContent     = temp     !== null ? fmtNum(temp, 1)           : "—";
    get("v-ph").textContent       = ph       !== null ? fmtNum(ph, 1)             : "—";
    get("v-level").textContent    = level    !== null ? Math.round(parseFloat(level)).toString() : "—";
    get("v-pressure").textContent = pressure !== null ? fmtNum(pressure, 1)       : "—";

    const flowTxt = flow !== null ? fmtNum(flow, 1) + " m³/h" : "—";
    get("s-flow").textContent       = on ? flowTxt : "—";
    get("s-flow-label").textContent = on ? flowTxt : "Filter → Pool";

    const badge  = get("badge");
    const btn    = get("pump-btn");
    const animTo   = get("pipe-anim-to");
    const animFrom = get("pipe-anim-from");

    if (on) {
      badge.textContent  = "Pumpe läuft";
      badge.className    = "badge";
      btn.textContent    = "Pumpe ausschalten";
      btn.className      = "pump-btn on";
      animTo.style.display   = "block";
      animFrom.style.display = "block";
      // Vorlauf Pool→Filter: dashoffset nimmt ab → dash bewegt sich vorwärts (links→rechts)
      animTo.className   = "anim-fwd";
      // Rücklauf Filter→Pool: der Pfad geht von rechts nach links (x=400 → x=260)
      // dashoffset nimmt ZU (flow-bwd: 0→20) → dash bewegt sich entlang des Pfads,
      // also von rechts (400) nach links (260) ✓
      animFrom.className = "anim-bwd";
    } else {
      badge.textContent  = "Pumpe aus";
      badge.className    = "badge off";
      btn.textContent    = "Pumpe einschalten";
      btn.className      = "pump-btn";
      animTo.style.display   = "none";
      animFrom.style.display = "none";
      animTo.className   = "";
      animFrom.className = "";
    }
  }
}

// ── Grafischer Konfigurationseditor ──────────────────────────────────────────

class PoolCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) { this._hass = hass; }

  static getConfigForm() {
    return {
      schema: [
        { name: "temp_entity",     required: true,  selector: { entity: { domain: "sensor" } } },
        { name: "ph_entity",       required: false, selector: { entity: { domain: "sensor" } } },
        { name: "level_entity",    required: false, selector: { entity: { domain: "sensor" } } },
        { name: "pressure_entity", required: false, selector: { entity: { domain: "sensor" } } },
        { name: "flow_entity",     required: false, selector: { entity: { domain: "sensor" } } },
        { name: "pump_entity",     required: false, selector: { entity: { domain: "switch" } } },
      ],
      computeLabel: (schema) => {
        const labels = {
          temp_entity:     "Wassertemperatur",
          ph_entity:       "pH-Wert",
          level_entity:    "Füllstand",
          pressure_entity: "Filterdruck",
          flow_entity:     "Durchfluss",
          pump_entity:     "Filterpumpe (Switch)",
        };
        return labels[schema.name] || schema.name;
      },
    };
  }

  _render() {
    if (!this._config) return;
    this.innerHTML = `<p style="font-size:13px;color:var(--secondary-text-color);padding:8px">
      Bitte Entitäten über den visuellen Editor zuweisen.</p>`;
  }
}

customElements.define("pool-custom-card-editor", PoolCardEditor);
customElements.define("pool-custom-card", PoolCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "pool-custom-card",
  name: "Pool Custom Card",
  preview: false,
  description: "Schematische Pool-Übersicht mit animiertem Filterkreislauf",
  documentationURL: "https://github.com/youruser/ha-pool-custom-card",
});

// Automatische Ressourcen-Registrierung (wird von HACS übernommen,
// aber auch bei manueller Installation ohne Neustart wirksam)
(async () => {
  const RESOURCE_URL = "/local/ha-pool-custom-card/pool-custom-card.js";

  // Warten bis HA-Frontend bereit ist
  await customElements.whenDefined("home-assistant");
  const ha = document.querySelector("home-assistant");
  if (!ha) return;

  // Lovelace-Ressourcen prüfen und ggf. eintragen
  try {
    const conn = ha.connection;
    if (!conn) return;
    const resources = await conn.sendMessagePromise({ type: "lovelace/resources" });
    const already = resources.some((r) => r.url === RESOURCE_URL);
    if (!already) {
      await conn.sendMessagePromise({
        type: "lovelace/resources/create",
        res_type: "module",
        url: RESOURCE_URL,
      });
      console.info("[pool-custom-card] Ressource automatisch registriert. Bitte Seite neu laden.");
    }
  } catch (e) {
    // Fehler still ignorieren – manuelle Registrierung als Fallback
  }
})();
