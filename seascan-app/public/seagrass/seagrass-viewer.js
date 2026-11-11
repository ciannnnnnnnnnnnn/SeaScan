/**
 * <seagrass-viewer>: drop-in 3D viewer for the SeaScan seagrass library.
 *
 *   <script type="module" src="/seagrass/seagrass-viewer.js"></script>
 *   <seagrass-viewer species="halophila-ovalis"></seagrass-viewer>
 *
 * Attributes
 *   species            id from species.json, e.g. "enhalus-acoroides" (required)
 *   base               folder holding species.json and models/ (default: this script's folder)
 *   labels             "true" to open with part labels shown
 *   no-sway            start with the sway animation paused
 *   ar                 show the "View in your space" AR button on supported phones
 *   model-viewer-src   where to load <model-viewer> from (default: jsDelivr CDN; self-host if you prefer)
 *
 * Properties: .labels (bool), .sway (bool), .species (string), .data (species entry once loaded)
 * Events:     "seagrass-load" (detail = species entry), "seagrass-error" (detail = message)
 * Styling:    --sg-height, --sg-radius, --sg-bg, --sg-accent, --sg-font
 */
const DEFAULT_MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js';
const SCRIPT_BASE = new URL('.', import.meta.url).href;
const START_ORBIT = '30deg 72deg auto';

const dataCache = new Map();
function loadData(base){
  const url = new URL('species.json', base).href;
  if (!dataCache.has(url)){
    dataCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(`species.json: HTTP ${r.status}`); return r.json(); }));
  }
  return dataCache.get(url);
}
let mvPromise = null;
function loadModelViewer(src){
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (!mvPromise) mvPromise = import(src).then(() => customElements.whenDefined('model-viewer'));
  return mvPromise;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CSS = `
:host{display:block;position:relative;height:var(--sg-height,520px);border-radius:var(--sg-radius,16px);overflow:hidden;
  background:var(--sg-bg,linear-gradient(180deg,#2c8a92 0%,#1b6a73 45%,#0f454d 100%));font-family:var(--sg-font,inherit);color:#fff;isolation:isolate}
.wrap{position:absolute;inset:0}
model-viewer{width:100%;height:100%;background:transparent;--poster-color:transparent;--progress-bar-color:var(--sg-accent,#9fe0b4)}
.status{position:absolute;inset:0;display:grid;place-items:center;font-size:14px;opacity:.85;text-align:center;padding:20px}
.bar{position:absolute;left:12px;bottom:12px;display:flex;gap:6px;flex-wrap:wrap;z-index:2}
.bar button{appearance:none;border:1px solid rgba(255,255,255,.22);background:rgba(4,30,36,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  color:#fff;font:500 12.5px/1 var(--sg-font,system-ui,sans-serif);padding:8px 12px;border-radius:999px;cursor:pointer}
.bar button[aria-pressed="true"]{background:var(--sg-accent,#9fe0b4);color:#0b3237;border-color:transparent}
.bar button:focus-visible{outline:2px solid #fff;outline-offset:2px}
.cap{position:absolute;right:14px;top:12px;font:12px/1.3 var(--sg-font,system-ui,sans-serif);opacity:.8;text-align:right;pointer-events:none;z-index:2;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.hs{display:none;position:relative;appearance:none;border:0;background:none;padding:0;width:12px;height:12px;cursor:pointer;color:#fff;font:inherit}
.show-labels .hs{display:block}
.hs .dot{position:absolute;inset:0;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(4,30,36,.45),0 0 10px rgba(255,255,255,.7)}
.hs .lab{position:absolute;left:16px;top:50%;transform:translateY(-50%);white-space:nowrap;text-align:left;background:rgba(4,30,36,.8);
  border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:5px 9px;font:500 12px/1.25 var(--sg-font,system-ui,sans-serif)}
.hs .lab small{display:none;font-weight:400;opacity:.8;margin-top:2px}
.hs:hover .lab small,.hs:focus .lab small{display:block}
.hs:hover,.hs:focus{z-index:5;outline:none}
.hs:not([data-visible]) {opacity:.35}
`;

class SeagrassViewer extends HTMLElement {
  static get observedAttributes(){ return ['species', 'labels', 'base']; }
  constructor(){
    super();
    this._root = this.attachShadow({mode:'open'});
    this._root.innerHTML = `<style>${CSS}</style><div class="wrap"><div class="status">Loading 3D model…</div></div>`;
    this._labels = false; this._sway = true; this._mv = null; this._sp = null;
  }
  connectedCallback(){
    this._labels = this.getAttribute('labels') === 'true';
    this._sway = !this.hasAttribute('no-sway');
    this._render();
  }
  attributeChangedCallback(name, oldV, newV){
    if (!this.isConnected || oldV === newV) return;
    if (name === 'labels') this.labels = newV === 'true';
    else this._render();
  }
  get species(){ return this.getAttribute('species'); }
  set species(v){ this.setAttribute('species', v); }
  get data(){ return this._sp; }
  get labels(){ return this._labels; }
  set labels(v){ this._labels = !!v; this._apply(); }
  get sway(){ return this._sway; }
  set sway(v){ this._sway = !!v; this._apply(); }

  _fail(msg){
    const wrap = this._root.querySelector('.wrap');
    wrap.innerHTML = `<div class="status">${esc(msg)}</div>`;
    this.dispatchEvent(new CustomEvent('seagrass-error', {detail: msg, bubbles: true}));
  }

  async _render(){
    const id = this.getAttribute('species');
    if (!id) return this._fail('No species selected');
    const base = new URL(this.getAttribute('base') || SCRIPT_BASE, document.baseURI).href;
    const token = this._token = Symbol();
    try {
      await loadModelViewer(this.getAttribute('model-viewer-src') || DEFAULT_MV);
      const data = await loadData(base);
      if (token !== this._token) return;
      const sp = data.species.find(s => s.id === id);
      if (!sp) throw new Error(`Unknown species "${id}"`);
      this._sp = sp;

      const wrap = this._root.querySelector('.wrap');
      wrap.innerHTML = '';
      const mv = document.createElement('model-viewer');
      const set = (k, v) => mv.setAttribute(k, v);
      set('src', new URL(sp.model.file, base).href);
      set('alt', `3D model of ${sp.scientificName}`);
      set('camera-controls', ''); set('touch-action', 'pan-y');
      set('camera-orbit', START_ORBIT);
      set('min-camera-orbit', 'auto 0deg auto'); set('max-camera-orbit', 'auto 180deg auto');
      set('interaction-prompt', 'none');
      set('shadow-intensity', '0'); set('exposure', '1.05'); set('tone-mapping', 'neutral');
      set('animation-name', 'Sway');
      if (this.hasAttribute('ar')){ set('ar', ''); set('ar-modes', 'webxr scene-viewer quick-look'); set('ar-scale', 'fixed'); }

      for (const h of sp.hotspots){
        const b = document.createElement('button');
        b.className = 'hs'; b.slot = `hotspot-${h.id}`;
        b.dataset.position = h.position; b.dataset.visibilityAttribute = 'visible';
        b.setAttribute('aria-label', h.note ? `${h.label}: ${h.note}` : h.label);
        b.innerHTML = `<span class="dot"></span><span class="lab">${esc(h.label)}${h.note ? `<small>${esc(h.note)}</small>` : ''}</span>`;
        mv.appendChild(b);
      }

      const bar = document.createElement('div'); bar.className = 'bar';
      bar.innerHTML = `<button data-act="labels" aria-pressed="false">Labels</button>
        <button data-act="sway" aria-pressed="true">Sway</button>
        <button data-act="reset">Reset view</button>`;
      bar.addEventListener('click', e => {
        const act = e.target.closest('button')?.dataset.act;
        if (act === 'labels') this.labels = !this._labels;
        if (act === 'sway') this.sway = !this._sway;
        if (act === 'reset'){ mv.cameraTarget = 'auto auto auto'; mv.fieldOfView = 'auto'; mv.cameraOrbit = START_ORBIT; }
      });
      const cap = document.createElement('div'); cap.className = 'cap';
      const h = sp.model.heightAboveSedimentCm;
      cap.innerHTML = `Life size · about ${h >= 10 ? Math.round(h) : h} cm tall<br><i>${esc(sp.scientificName)}</i>`;

      mv.addEventListener('load', () => {
        this._apply();
        this.dispatchEvent(new CustomEvent('seagrass-load', {detail: sp, bubbles: true}));
      });
      mv.addEventListener('error', () => this._fail('Could not load the 3D model.'));
      wrap.append(mv, bar, cap);
      this._mv = mv;
      this._apply();
    } catch (err) {
      if (token === this._token) this._fail(err.message || String(err));
    }
  }

  _apply(){
    const mv = this._mv; if (!mv) return;
    this._root.querySelector('.wrap')?.classList.toggle('show-labels', this._labels);
    const bl = this._root.querySelector('[data-act="labels"]'), bs = this._root.querySelector('[data-act="sway"]');
    if (bl) bl.setAttribute('aria-pressed', String(this._labels));
    if (bs){ bs.setAttribute('aria-pressed', String(this._sway && !this._labels)); bs.disabled = this._labels; }
    // labels sit on the rest pose, so the sway pauses at frame 0 while they are shown
    if (!mv.loaded) { if (this._sway && !this._labels) mv.setAttribute('autoplay', ''); else mv.removeAttribute('autoplay'); return; }
    if (this._labels){ mv.pause(); mv.currentTime = 0; }
    else if (this._sway) mv.play();
    else mv.pause();
  }
}

if (!customElements.get('seagrass-viewer')) customElements.define('seagrass-viewer', SeagrassViewer);
export { SeagrassViewer };
