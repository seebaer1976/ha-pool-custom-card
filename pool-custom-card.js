// pool-custom-card – v1.3 – Canvas 2D

const _loadHaComponents = () => {
  if (!customElements.get("ha-form"))
    customElements.get("hui-button-card")?.getConfigElement();
  if (!customElements.get("ha-entity-picker"))
    customElements.get("hui-entities-card")?.getConfigElement();
};

const POOL_SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    type: "expandable", name: "required_sensors", title: "Pflichtsensoren", flatten: true,
    schema: [
      { name: "temp_entity", required: true, selector: { entity: { device_class: "temperature" } } },
      { name: "pump_entity", required: true, selector: { entity: { domain: "switch" } } },
    ],
  },
  {
    type: "expandable", name: "optional_sensors", title: "Optionale Sensoren", flatten: true,
    schema: [
      { name: "ph_entity",       selector: { entity: { domain: "sensor" } } },
      { name: "level_entity",    selector: { entity: { device_class: ["moisture","volume","volume_storage","distance"] } } },
      { name: "pressure_entity", selector: { entity: { device_class: "pressure" } } },
      { name: "flow_entity",     selector: { entity: { domain: "sensor" } } },
      { name: "chlor_entity",    selector: { entity: { domain: "switch" } } },
    ],
  },
];

const POOL_LABELS = {
  title: "Kartenname",
  required_sensors: "Pflichtsensoren",
  optional_sensors: "Optionale Sensoren",
  temp_entity:     "Wassertemperatur",
  ph_entity:       "pH-Wert",
  level_entity:    "Füllstand",
  pressure_entity: "Filterdruck",
  flow_entity:     "Durchfluss (m³/h)",
  pump_entity:     "Filterpumpe (Switch)",
  chlor_entity:    "Salzwassersystem (Switch)",
};

// ── Canvas Renderer ────────────────────────────────────────────────────────────
function poolCanvasRenderer(canvas, cfg) {
  const ctx = canvas.getContext("2d");
  const W = 680, H = 370;
  canvas.width = W; canvas.height = H;
  let t = 0, raf = null;

  // Liniensegmente exakt aus SVG
  // dir: +1 = dashoffset nimmt zu (bwd), -1 = nimmt ab (fwd)
  const BLUE = [
    { pts:[{x:515,y:269},{x:293,y:270}], dir:+1 }, // p1a bwd
    { pts:[{x:554,y:225},{x:634,y:225}], dir:-1 }, // p1b fwd
    { pts:[{x:634,y:222},{x:634,y:63}],  dir:-1 }, // p1c fwd
    { pts:[{x:634,y:62}, {x:605,y:62}],  dir:-1 }, // p1d fwd
    { pts:[{x:554,y:235},{x:554,y:225}], dir:-1 }, // p1e fwd
  ];
  const GREEN = [
    { pts:[{x:380,y:183},{x:315,y:183}], dir:-1 }, // p3a fwd
    { pts:[{x:425,y:183},{x:484,y:183}], dir:+1 }, // p3b bwd
    { pts:[{x:484,y:183},{x:484,y:63}],  dir:+1 }, // p3c bwd
    { pts:[{x:484,y:62}, {x:529,y:62}],  dir:+1 }, // p3d bwd
  ];
  const BYPASS = { pts:[{x:315,y:183},{x:484,y:183}], dir:+1 };

  function rr(x,y,w,h,r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  }

  function solidPath(pts,w,col) {
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap="round"; ctx.setLineDash([]); ctx.stroke();
  }

  function animPath(pts,col,dir) {
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.lineCap="round";
    ctx.setLineDash([8,6]); ctx.lineDashOffset = dir * t * 12; ctx.stroke(); ctx.setLineDash([]);
  }

  function drawChlor() {
    rr(366,173,74,24,12); ctx.fillStyle="#d8d8d8"; ctx.fill(); ctx.strokeStyle="#aaaaaa"; ctx.lineWidth=1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(374,173); ctx.bezierCurveTo(374,147,432,147,432,173);
    ctx.fillStyle="#d2d2d2"; ctx.fill(); ctx.strokeStyle="#aaaaaa"; ctx.lineWidth=1.2; ctx.stroke();
    rr(381,150,44,23,9); ctx.fillStyle="#2a3828"; ctx.fill(); ctx.strokeStyle="#3a5040"; ctx.lineWidth=1.2; ctx.stroke();
    rr(385,153,13,7,2); ctx.fillStyle="#0a1208"; ctx.fill();
    ctx.beginPath(); ctx.arc(395,157,3,0,Math.PI*2);
    ctx.fillStyle=cfg.chlorOn?"#00ee44":"#330000"; ctx.strokeStyle=cfg.chlorOn?"#00ff66":"#440000";
    ctx.lineWidth=1; ctx.fill(); ctx.stroke();
    [[406,156],[413,156],[420,156],[406,164],[413,164],[420,164]].forEach(([bx,by]) => {
      ctx.beginPath(); ctx.arc(bx,by,1.8,0,Math.PI*2); ctx.fillStyle="#3a5038"; ctx.fill();
    });
    // Rechter Anschluss cx=424 cy=183
    rr(418,177,12,12,3); ctx.fillStyle="#888"; ctx.fill(); ctx.strokeStyle="#666"; ctx.lineWidth=1; ctx.stroke();
    ctx.beginPath(); ctx.arc(424,183,5,0,Math.PI*2); ctx.fillStyle="#1a2030"; ctx.fill(); ctx.strokeStyle="#4466aa"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(424,183,2.8,0,Math.PI*2); ctx.fillStyle="#0a1020"; ctx.fill(); ctx.strokeStyle="#5588cc"; ctx.lineWidth=1; ctx.stroke();
    // Linker Anschluss cx=381 cy=183
    rr(375,177,12,12,3); ctx.fillStyle="#888"; ctx.fill(); ctx.strokeStyle="#666"; ctx.lineWidth=1; ctx.stroke();
    ctx.beginPath(); ctx.arc(381,183,5,0,Math.PI*2); ctx.fillStyle="#1a2030"; ctx.fill(); ctx.strokeStyle="#4466aa"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(381,183,2.8,0,Math.PI*2); ctx.fillStyle="#0a1020"; ctx.fill(); ctx.strokeStyle="#5588cc"; ctx.lineWidth=1; ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0,0,W,H); ctx.fillStyle="#141820"; ctx.fillRect(0,0,W,H);

    // 1. Chlorinator zuerst (Linien kommen drüber)
    if (cfg.showChlor) drawChlor();

    // 2. Statische Linien
    BLUE.forEach(s => { solidPath(s.pts,5,"#0d2a44"); solidPath(s.pts,3,"#1a4a6a"); });
    GREEN.forEach(s => { solidPath(s.pts,5,"#0a2018"); solidPath(s.pts,3,"#1a4028"); });
    if (!cfg.showChlor) { solidPath(BYPASS.pts,5,"#0a2018"); solidPath(BYPASS.pts,3,"#1a4028"); }

    // 3. Animierte Linien
    if (cfg.pumpOn) {
      BLUE.forEach(s  => animPath(s.pts,"#2299ee",s.dir));
      GREEN.forEach(s => animPath(s.pts,"#22dd66",s.dir));
      if (!cfg.showChlor) animPath(BYPASS.pts,"#22dd66",BYPASS.dir);
    }

    // 4. Pool
    ctx.beginPath(); ctx.ellipse(185,222,161,62,0,0,Math.PI*2);
    ctx.fillStyle="#0e4a7a"; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(185,222,161,62,0,0,Math.PI*2); ctx.clip();
    for (let i=0;i<3;i++) {
      ctx.beginPath();
      for (let x=24;x<=346;x+=3) { const y=215+Math.sin((x/28)+t+i*2.1)*5; x===24?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.strokeStyle="rgba(34,153,238,0.2)"; ctx.lineWidth=1.5; ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(185,222,161,62,0,0,Math.PI*2); ctx.strokeStyle="#2299dd"; ctx.lineWidth=2; ctx.stroke();
    // Leiter
    ctx.strokeStyle="#c8902a"; ctx.lineWidth=4; ctx.lineCap="round";
    [[210],[228]].forEach(([px]) => { ctx.beginPath(); ctx.moveTo(px,162); ctx.lineTo(px,224); ctx.stroke(); });
    ctx.strokeStyle="#e0a830"; ctx.lineWidth=3;
    [174,187,200].forEach(y => { ctx.beginPath(); ctx.moveTo(208,y); ctx.lineTo(234,y); ctx.stroke(); });
    // Sensorwerte
    if (cfg.showPh) {
      ctx.fillStyle="#6ab0d8"; ctx.font="11px sans-serif"; ctx.textAlign="center"; ctx.fillText("pH",90,218);
      ctx.fillStyle="#4ab8ff"; ctx.font="bold 20px sans-serif"; ctx.fillText(cfg.ph,90,242);
    }
    ctx.fillStyle="#6ab0d8"; ctx.font="11px sans-serif"; ctx.textAlign="center"; ctx.fillText("Temperatur",178,224);
    ctx.fillStyle="#4ab8ff"; ctx.font="bold 24px sans-serif"; ctx.fillText(cfg.temp,178,252);
    if (cfg.showLevel) {
      ctx.fillStyle="#6ab0d8"; ctx.font="11px sans-serif"; ctx.fillText("Füllstand",278,218);
      ctx.fillStyle="#4ab8ff"; ctx.font="bold 20px sans-serif"; ctx.fillText(cfg.level,278,242);
    }

    // 5. Sandfilter cx=567 (30px höher)
    ctx.beginPath(); ctx.ellipse(567,177,34,11,0,0,Math.PI*2); ctx.fillStyle="#152a1e"; ctx.fill(); ctx.strokeStyle="#1a5530"; ctx.lineWidth=1.2; ctx.stroke();
    rr(533,92,68,85,0); ctx.fillStyle="#162a1e"; ctx.fill(); ctx.strokeStyle="#1d5535"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(567,92,34,11,0,Math.PI,0); ctx.fillStyle="#1a3025"; ctx.fill(); ctx.strokeStyle="#256640"; ctx.lineWidth=1.5; ctx.stroke();
    rr(537,138,60,39,0); ctx.fillStyle="#1e3828"; ctx.fill();
    if (cfg.showPres) {
      ctx.beginPath(); ctx.arc(567,102,24,0,Math.PI*2); ctx.fillStyle="#0d1a12"; ctx.fill(); ctx.strokeStyle="#1d6633"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(567,102,20,0,Math.PI*2); ctx.strokeStyle="#154422"; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle="#44bb77"; ctx.font="9px sans-serif"; ctx.textAlign="center"; ctx.fillText("bar",567,97);
      ctx.fillStyle="#22dd66"; ctx.font="bold 14px sans-serif"; ctx.fillText(cfg.pres,567,112);
    }

    // 6. Ventil cx=567 y=50
    rr(549,50,36,26,4); ctx.fillStyle="#1e3a28"; ctx.fill(); ctx.strokeStyle="#2a7040"; ctx.lineWidth=1.5; ctx.stroke();
    rr(529,57,20,10,3); ctx.fillStyle="#1a3020"; ctx.fill(); ctx.strokeStyle="#22aa44"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(529,62,4,0,Math.PI*2); ctx.fillStyle="#0d1a10"; ctx.fill(); ctx.strokeStyle="#22dd66"; ctx.lineWidth=1.2; ctx.stroke();
    rr(585,57,20,10,3); ctx.fillStyle="#0d1e30"; ctx.fill(); ctx.strokeStyle="#2266aa"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(605,62,4,0,Math.PI*2); ctx.fillStyle="#0a1520"; ctx.fill(); ctx.strokeStyle="#2288cc"; ctx.lineWidth=1.2; ctx.stroke();
    rr(561,36,10,16,3); ctx.fillStyle="#2a4a35"; ctx.fill(); ctx.strokeStyle="#3a8a50"; ctx.lineWidth=1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(566,36); ctx.lineTo(555,25); ctx.strokeStyle="#4aaa60"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.stroke();
    ctx.beginPath(); ctx.arc(553,22,3.5,0,Math.PI*2); ctx.fillStyle="#22aa44"; ctx.fill();

    // 7. Pumpe – Volute cx=547 cy=270
    rr(547,252,56,36,6); ctx.fillStyle="#1a1e30"; ctx.fill(); ctx.strokeStyle="#334488"; ctx.lineWidth=1.5; ctx.stroke();
    [[15,"#0f1525","#2244aa"],[9,"#0a0f1e","#3366cc"],[3.5,"#1a2a4a","#4488ff"]].forEach(([r,f,s]) => {
      ctx.beginPath(); ctx.arc(547,270,r,0,Math.PI*2); ctx.fillStyle=f; ctx.fill(); ctx.strokeStyle=s; ctx.lineWidth=1.5; ctx.stroke();
    });
    ctx.strokeStyle="#4488ff"; ctx.lineWidth=1.2; ctx.globalAlpha=0.6;
    [[547,262,547,278],[539,270,555,270]].forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
    ctx.globalAlpha=1;
    rr(583,256,20,26,4); ctx.fillStyle="#161a28"; ctx.fill(); ctx.strokeStyle="#2a3060"; ctx.lineWidth=1.2; ctx.stroke();
    [587,590,593,596,599].forEach(x => { ctx.beginPath(); ctx.moveTo(x,256); ctx.lineTo(x,282); ctx.strokeStyle="#2a3060"; ctx.lineWidth=1; ctx.stroke(); });
    rr(548,236,10,17,3); ctx.fillStyle="#141828"; ctx.fill(); ctx.strokeStyle="#2244aa"; ctx.lineWidth=1.2; ctx.stroke();
    rr(515,264,17,10,3); ctx.fillStyle="#141828"; ctx.fill(); ctx.strokeStyle="#2244aa"; ctx.lineWidth=1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(547,270,16,0,Math.PI*2); ctx.strokeStyle="rgba(68,136,255,0.4)"; ctx.lineWidth=0.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(585,280,3,0,Math.PI*2);
    ctx.fillStyle=cfg.pumpOn?"#22ff88":"#223"; ctx.strokeStyle=cfg.pumpOn?"#44ffaa":"#334"; ctx.lineWidth=1; ctx.fill(); ctx.stroke();

    // 8. Flow Badge x=459 y=115
    if (cfg.showFlow) {
      rr(459,115,50,26,6); ctx.fillStyle="#0d1a12"; ctx.fill(); ctx.strokeStyle="#22aa44"; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle="#44bb77"; ctx.font="9px sans-serif"; ctx.textAlign="center"; ctx.fillText("m³/h",484,126);
      ctx.fillStyle="#22dd66"; ctx.font="bold 12px sans-serif"; ctx.fillText(cfg.flow,484,137);
    }

    t += 0.015;
    raf = requestAnimationFrame(frame);
  }

  frame();
  return { stop: () => { if (raf) cancelAnimationFrame(raf); } };
}

// ── Hauptkarte ────────────────────────────────────────────────────────────────
class PoolCard extends HTMLElement {

  static getConfigElement() { return document.createElement("pool-custom-card-editor"); }

  static getStubConfig() {
    return { title:"Pool", temp_entity:"", ph_entity:"", level_entity:"", pressure_entity:"", flow_entity:"", pump_entity:"", chlor_entity:"" };
  }

  setConfig(config) { this.config = config; }

  disconnectedCallback() { if (this._renderer) this._renderer.stop(); }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._lastPumpOn = undefined;
      this.innerHTML = `
        <style>
          pool-custom-card { display:block; background:var(--ha-card-background,var(--card-background-color,white)); border-radius:var(--ha-card-border-radius,12px); border:1px solid var(--ha-card-border-color,var(--divider-color,#e0e0e0)); box-sizing:border-box; overflow:hidden; }
          pool-custom-card canvas { display:block; width:100%; }
          pool-custom-card .topbar { display:flex; align-items:center; justify-content:space-between; padding:10px 14px 4px; }
          pool-custom-card .card-title { font-size:14px; font-weight:500; color:var(--primary-text-color); }
          pool-custom-card .pump-btn { padding:4px 14px; font-size:11px; border-radius:20px; border:1px solid #2288cc; background:transparent; color:#2288cc; cursor:pointer; }
          pool-custom-card .pump-btn.on { background:#2288cc; color:#fff; }
          pool-custom-card .pump-status { font-size:11px; font-weight:500; color:var(--secondary-text-color); }
          pool-custom-card .pump-status.on { color:#22dd66; }
        </style>
        <div class="topbar">
          <span class="card-title" id="pcc-title">Pool</span>
          <span class="pump-status" id="pcc-badge">Pumpe aus</span>
          <button class="pump-btn" id="pcc-pbtn">Pumpe einschalten</button>
        </div>
        <canvas id="pcc-canvas"></canvas>`;

      this.content = this.querySelector(".topbar");

      // Canvas-Renderer starten
      const canvas = this.querySelector("#pcc-canvas");
      this._cfg = {
        temp:"—°C", ph:"—", level:"—%", pres:"—", flow:"—",
        showPh:false, showLevel:false, showPres:false, showFlow:false, showChlor:false,
        pumpOn:false, chlorOn:false,
      };
      this._renderer = poolCanvasRenderer(canvas, this._cfg);

      this.querySelector("#pcc-pbtn").addEventListener("click", () => {
        if (!this._hass || !this.config?.pump_entity) return;
        this._hass.callService("switch", this._pumpOn() ? "turn_off" : "turn_on", { entity_id: this.config.pump_entity });
      });
    }
    this._update();
  }

  getCardSize() { return 5; }
  getGridOptions() { return { rows:5, columns:12, min_rows:4 }; }

  _val(id) {
    if (!this._hass || !id) return null;
    const s = this._hass.states[id];
    return s ? s.state : null;
  }

  _pumpOn() { return this._val(this.config?.pump_entity) === "on"; }

  _update() {
    if (!this.content || !this._cfg) return;
    const fmt = (v, d=1) => parseFloat(v).toFixed(d);
    const temp  = this._val(this.config?.temp_entity);
    const ph    = this._val(this.config?.ph_entity);
    const lev   = this._val(this.config?.level_entity);
    const pres  = this._val(this.config?.pressure_entity);
    const flow  = this._val(this.config?.flow_entity);
    const chlor = this._val(this.config?.chlor_entity);
    const on    = this._pumpOn();

    // Canvas cfg aktualisieren – der Renderer liest diese Werte im nächsten Frame
    this._cfg.temp    = temp  !== null ? fmt(temp)+"°C"                          : "—°C";
    this._cfg.ph      = ph    !== null ? fmt(ph)                                  : "—";
    this._cfg.level   = lev   !== null ? Math.round(parseFloat(lev))+"%"          : "—%";
    this._cfg.pres    = pres  !== null ? fmt(pres)                                : "—";
    this._cfg.flow    = flow  !== null ? fmt(flow)                                : "—";
    this._cfg.pumpOn  = on;
    this._cfg.chlorOn = chlor === "on";

    // Optionale Elemente: nur anzeigen wenn Entity konfiguriert
    this._cfg.showPh    = !!this.config?.ph_entity;
    this._cfg.showLevel = !!this.config?.level_entity;
    this._cfg.showPres  = !!this.config?.pressure_entity;
    this._cfg.showFlow  = !!this.config?.flow_entity;
    this._cfg.showChlor = !!this.config?.chlor_entity;

    // Topbar
    const title = this.querySelector("#pcc-title");
    const badge = this.querySelector("#pcc-badge");
    const btn   = this.querySelector("#pcc-pbtn");
    if (title) title.textContent = this.config?.title || "Pool";
    if (on) {
      badge.textContent="Pumpe läuft"; badge.className="pump-status on";
      btn.textContent="Pumpe ausschalten"; btn.className="pump-btn on";
    } else {
      badge.textContent="Pumpe aus"; badge.className="pump-status";
      btn.textContent="Pumpe einschalten"; btn.className="pump-btn";
    }
  }
}

// ── Editor ────────────────────────────────────────────────────────────────────
class PoolCardEditor extends HTMLElement {
  constructor() { super(); this._config={}; this._hass=null; this._form=null; }
  connectedCallback() { _loadHaComponents(); this._build(); }
  setConfig(config) { this._config={...config}; if(this._form) this._form.data=this._config; }
  set hass(hass) { this._hass=hass; if(this._form) this._form.hass=hass; else this._build(); }
  _build() {
    if (this._form || !this._hass) return;
    this._form = document.createElement("ha-form");
    this._form.hass=this._hass; this._form.data=this._config;
    this._form.schema=POOL_SCHEMA;
    this._form.computeLabel=(s) => POOL_LABELS[s.name]||s.name;
    this._form.addEventListener("value-changed", (e) => {
      e.stopPropagation();
      this._config={...e.detail.value};
      this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true}));
    });
    this.appendChild(this._form);
  }
}

customElements.define("pool-custom-card-editor", PoolCardEditor);
customElements.define("pool-custom-card", PoolCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:"pool-custom-card", name:"Pool Custom Card", preview:false,
  description:"Schematische Pool-Übersicht mit animiertem Filterkreislauf",
  documentationURL:"https://github.com/seebaer1976/ha-pool-custom-card",
});

(async () => {
  const RURL = "/local/pool-custom-card/pool-custom-card.js";
  await customElements.whenDefined("home-assistant");
  const ha = document.querySelector("home-assistant");
  if (!ha) return;
  try {
    const conn = ha.connection;
    if (!conn) return;
    const res = await conn.sendMessagePromise({ type:"lovelace/resources" });
    if (!res.some(r => r.url===RURL)) {
      await conn.sendMessagePromise({ type:"lovelace/resources/create", res_type:"module", url:RURL });
      console.info("[pool-custom-card] Ressource registriert – bitte Seite neu laden.");
    }
  } catch(_) {}
})();
