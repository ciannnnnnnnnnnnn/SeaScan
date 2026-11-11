// Procedural, true-to-scale seagrass specimens (units: metres, y up, sediment surface at y = 0).
// Each specimen is a short length of rhizome with its shoots, leaves, roots and node scars,
// plus a translucent sediment disc. Leaves carry two morph targets (swayA / swayB) and an
// 8-second looping "Sway" clip that starts and ends at the rest pose.
import * as THREE from 'three';

/* ------------------------------------------------------------------ helpers */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const Y = new THREE.Vector3(0,1,0);
const rangeR = (rng, r) => lerp(r[0], r[1], rng());
const rangeI = (rng, r) => r[0] + Math.floor(rng()*(r[1]-r[0]+1));

/* ------------------------------------------------------------------ species model parameters */
export const MODELS = {
  'enhalus-acoroides': {
    seed: 11,
    leaf: { type:'strap', len:[0.45,1.0], width:[0.0125,0.0175], perShoot:[3,5], curve:0.12, twist:0.7, fold:0.22, tip:'round', tipLen:0.5, cols:9, rows:36, stiff:1.0,
            colors:['#d8d3a2','#2c5a20','#4f5c22'], tex:{veins:18, specks:0.55, tannin:false, midvein:null, lenRef:0.1} },
    sheath: { len:0.04, color:'#e2dfb8', widthMul:0.75, flare:1.0 },
    rhizome: { len:0.42, r:0.011, depth:0.06, color:'#3b2c1f', internode:0.014, scars:'none', branch:false, bristles:true, shoots:3 },
    roots: { at:'shoots+', perNode:[3,5], len:[0.12,0.26], r:0.0028, color:'#c7ae82', branched:false }
  },
  'thalassia-hemprichii': {
    seed: 23,
    leaf: { type:'strap', len:[0.10,0.32], width:[0.005,0.009], perShoot:[2,5], curve:0.55, twist:0.3, fold:0.12, tip:'serrate', teeth:0.05, tipLen:0.5, cols:11, rows:24, stiff:1.4,
            colors:['#dcd8a8','#3a7428','#58712b'], tex:{veins:13, specks:0.35, tannin:true, midvein:null, lenRef:0.05} },
    sheath: { len:0.03, color:'#ebe8cc', widthMul:0.7, flare:1.0 },
    rhizome: { len:0.36, r:0.0022, depth:0.03, color:'#9c7d55', internode:0.009, scars:'ring', scarColor:'#5a4329', branch:false, shoots:4 },
    roots: { at:'nodes', every:2, perNode:[1,2], len:[0.04,0.1], r:0.0008, color:'#dccaa6', branched:false }
  },
  'cymodocea-rotundata': {
    seed: 37,
    leaf: { type:'strap', len:[0.07,0.16], width:[0.002,0.004], perShoot:[2,4], curve:0.35, twist:0.25, fold:0.1, tip:'notch', tipLen:0.5, cols:9, rows:20, stiff:1.5,
            colors:['#d6cdb2','#3b782d','#5a7a30'], tex:{veins:11, specks:0.25, tannin:false, midvein:null, lenRef:0.04} },
    sheath: { len:0.035, color:'#cdb4c8', widthMul:0.8, flare:1.1, stem:true },
    rhizome: { len:0.26, r:0.0008, depth:0.022, color:'#d9cfb4', internode:0.03, scars:'ring', scarColor:'#8e7a5c', branch:true, shoots:'nodes' },
    roots: { at:'nodes', every:1, perNode:[1,3], len:[0.03,0.08], r:0.00045, color:'#e2d6bb', branched:true }
  },
  'cymodocea-serrulata': {
    seed: 41,
    leaf: { type:'strap', len:[0.07,0.15], width:[0.005,0.009], perShoot:[2,4], curve:0.3, twist:0.25, fold:0.1, tip:'serrate', teeth:0.2, tipLen:0.5, cols:13, rows:20, stiff:1.4,
            colors:['#d5c3c4','#2e6c29','#4c6d29'], tex:{veins:15, specks:0.3, tannin:false, midvein:null, lenRef:0.05} },
    sheath: { len:0.03, color:'#93628f', widthMul:0.55, flare:1.9, stem:true },
    rhizome: { len:0.3, r:0.0013, depth:0.028, color:'#c9b38d', internode:0.035, scars:'half', scarColor:'#6f5a3e', branch:true, shoots:'nodes' },
    roots: { at:'nodes', every:1, perNode:[2,4], len:[0.04,0.1], r:0.0006, color:'#ddcfb0', branched:true }
  },
  'halodule-pinifolia': {
    seed: 53,
    leaf: { type:'strap', len:[0.07,0.19], width:[0.0006,0.0012], perShoot:[2,3], curve:0.2, twist:1.1, fold:0.0, tip:'round', tipLen:0.5, cols:5, rows:16, stiff:1.7,
            colors:['#dcdab2','#57983a','#6c8a36'], tex:{veins:1, specks:0.15, tannin:false, midvein:'black', lenRef:0.03} },
    sheath: { len:0.018, color:'#efeedb', widthMul:1.0, flare:1.0, stem:true },
    rhizome: { len:0.2, r:0.0004, depth:0.012, color:'#ece4cb', internode:0.016, scars:'ring', scarColor:'#14110d', branch:true, shoots:'nodes' },
    roots: { at:'nodes', every:1, perNode:[2,4], len:[0.02,0.05], r:0.0002, color:'#f0e8d2', branched:false }
  },
  'halodule-uninervis': {
    seed: 59,
    leaf: { type:'strap', len:[0.05,0.15], width:[0.0012,0.0025], perShoot:[2,4], curve:0.22, twist:1.0, fold:0.0, tip:'trident', tipLen:0.9, cols:9, rows:16, stiff:1.6,
            colors:['#dcdab0','#4f9135','#668634'], tex:{veins:1, specks:0.2, tannin:false, midvein:'green', lenRef:0.03} },
    sheath: { len:0.02, color:'#eeedd8', widthMul:0.9, flare:1.0, stem:true },
    rhizome: { len:0.2, r:0.0005, depth:0.013, color:'#efe6cc', internode:0.018, scars:'ring', scarColor:'#14110d', branch:true, shoots:'nodes' },
    roots: { at:'nodes', every:1, perNode:[2,4], len:[0.02,0.05], r:0.00022, color:'#f2ead5', branched:false }
  },
  'halophila-minor': {
    seed: 61,
    leaf: { type:'paddle', blade:[0.008,0.013], width:[0.0032,0.005], petiole:[0.006,0.018], crossVeins:[4,7], shape:1.0, petioleR:0.00025,
            colors:['#5aa64a','#3f8b3a'] },
    rhizome: { len:0.15, r:0.00045, depth:0.006, color:'#f0e9d7', internode:0.013, scars:'none', branch:true, shoots:'nodes', scales:0.0028 },
    roots: { at:'nodes', every:1, perNode:[1,1], len:[0.02,0.05], r:0.00018, color:'#f3ecda', branched:false }
  },
  'halophila-ovalis': {
    seed: 67,
    leaf: { type:'paddle', blade:[0.014,0.032], width:[0.007,0.013], petiole:[0.014,0.035], crossVeins:[12,18], shape:1.15, petioleR:0.0004,
            colors:['#56a246','#3a8636'] },
    rhizome: { len:0.25, r:0.0009, depth:0.008, color:'#f0e6cf', internode:0.025, scars:'none', branch:true, shoots:'nodes', scales:0.005 },
    roots: { at:'nodes', every:1, perNode:[1,1], len:[0.03,0.09], r:0.0003, color:'#f2ead6', branched:false }
  },
  'syringodium-isoetifolium': {
    seed: 71,
    leaf: { type:'terete', len:[0.08,0.26], width:[0.0012,0.0019], perShoot:[2,3], curve:0.3, twist:0, stiff:1.3, radial:7, rows:26,
            colors:['#ddd0b6','#46883a','#66883a'], tex:{veins:4, specks:0.25, tannin:false, midvein:null, lenRef:0.04} },
    sheath: { len:0.025, color:'#c99a8c', widthMul:1.2, flare:1.0, stem:true },
    rhizome: { len:0.26, r:0.0008, depth:0.02, color:'#dacdb0', internode:0.026, scars:'ring', scarColor:'#8b7658', branch:true, shoots:'nodes' },
    roots: { at:'nodes', every:1, perNode:[1,3], len:[0.03,0.08], r:0.0004, color:'#e4d8bd', branched:true }
  }
};

/* ------------------------------------------------------------------ textures */
function leafTexture(sp){
  const L = sp.leaf, T = L.tex;
  const cw = 64, ch = 512;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  const rng = mulberry32(sp.seed*13+1);
  g.fillStyle = '#ffffff'; g.fillRect(0,0,cw,ch);
  // longitudinal veins
  const nV = T.veins;
  for (let i=0;i<nV;i++){
    const x = nV === 1 ? cw/2 : (i+0.5)/nV*cw;
    g.fillStyle = 'rgba(40,70,30,0.13)';
    g.fillRect(x-0.6, 0, 1.2, ch);
  }
  if (T.midvein === 'black'){ g.fillStyle = 'rgba(20,18,12,0.85)'; g.fillRect(cw/2-2.5, 0, 5, ch); }
  if (T.midvein === 'green'){ g.fillStyle = 'rgba(25,60,20,0.45)'; g.fillRect(cw/2-2.5, 0, 5, ch); }
  // physical scale -> pixels (so specks stay round on the leaf)
  const wRef = (L.width[0]+L.width[1])/2 * (L.type === 'terete' ? Math.PI : 1);
  const pxU = cw / wRef, pxV = ch / T.lenRef;
  if (T.tannin){ // short dark bars of tannin cells (Thalassia)
    for (let i=0;i<70;i++){
      const x = rng()*cw, y = rng()*ch;
      g.fillStyle = `rgba(55,30,15,${0.35+0.35*rng()})`;
      g.fillRect(x, y, Math.max(1.2, 0.00025*pxU), (0.0008+rng()*0.0012)*pxV);
    }
  }
  const nS = Math.round(160*T.specks);
  for (let i=0;i<nS;i++){
    const x = rng()*cw, y = rng()*ch, r = 0.00003 + rng()*0.00012;
    g.fillStyle = rng() < 0.5 ? `rgba(150,125,80,${0.18+0.22*rng()})` : `rgba(70,90,45,${0.12+0.15*rng()})`;
    g.beginPath(); g.ellipse(x, y, Math.max(0.8, r*pxU), Math.max(0.8, r*pxV), 0, 0, Math.PI*2); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.name = 'leaf-surface';
  return tex;
}

function paddleTexture(sp){
  const L = sp.leaf;
  const cw = 256, ch = 512;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  // blade outline: base (y = ch) narrows into the petiole, tip (y = 0) rounded
  const outline = (inset) => {
    g.beginPath();
    const N = 80;
    for (let i=0;i<=N;i++){
      const t = i/N;                 // 0 = base, 1 = tip
      const uu = Math.pow(t, L.shape), prof = Math.sqrt(Math.max(0, 1 - Math.pow(2*uu - 1, 2)));
      const hw = (cw/2 - 4 - inset) * prof;
      const y = ch - 2 - t*(ch-4);
      if (i===0) g.moveTo(cw/2 + hw, y); else g.lineTo(cw/2 + hw, y);
    }
    for (let i=N;i>=0;i--){
      const t = i/N;
      const uu = Math.pow(t, L.shape), prof = Math.sqrt(Math.max(0, 1 - Math.pow(2*uu - 1, 2)));
      const hw = (cw/2 - 4 - inset) * prof;
      g.lineTo(cw/2 - hw, ch - 2 - t*(ch-4));
    }
    g.closePath();
  };
  const grd = g.createLinearGradient(0, ch, 0, 0);
  grd.addColorStop(0, L.colors[1]); grd.addColorStop(1, L.colors[0]);
  outline(0); g.fillStyle = grd; g.fill();
  g.save(); outline(0); g.clip();
  // veins: midrib, intramarginal veins, ascending cross veins
  g.strokeStyle = 'rgba(205,235,170,0.85)'; g.lineCap = 'round';
  g.lineWidth = 6; g.beginPath(); g.moveTo(cw/2, ch); g.lineTo(cw/2, 10); g.stroke();
  g.lineWidth = 3; outline(12); g.stroke();
  const n = Math.round((L.crossVeins[0]+L.crossVeins[1])/2);
  g.lineWidth = 2.2;
  for (let i=0;i<n;i++){
    const y0 = ch*0.9 - (i+0.5)/n*ch*0.82;
    for (const s of [-1,1]){
      g.beginPath(); g.moveTo(cw/2, y0); g.quadraticCurveTo(cw/2 + s*cw*0.22, y0 - 20, cw/2 + s*cw*0.44, y0 - 48); g.stroke();
    }
  }
  g.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.name = 'halophila-blade';
  return tex;
}

/* ------------------------------------------------------------------ geometry accumulator */
class Acc {
  constructor(){ this.p=[]; this.uv=[]; this.c=[]; this.a=[]; this.b=[]; this.i=[]; this.n=0; }
  v(p, u, v, col, dA, dB){
    this.p.push(p.x,p.y,p.z); this.uv.push(u,v);
    if (col) this.c.push(col.r,col.g,col.b);
    if (dA){ this.a.push(dA.x,dA.y,dA.z); this.b.push(dB.x,dB.y,dB.z); }
    return this.n++;
  }
  quad(a,b,c,d){ this.i.push(a,b,d, b,c,d); }
  geometry(){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p,3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv,2));
    if (this.c.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c,3));
    g.setIndex(this.i);
    g.computeVertexNormals();
    if (this.a.length){
      const A = new THREE.Float32BufferAttribute(this.a,3); A.name = 'swayA';
      const B = new THREE.Float32BufferAttribute(this.b,3); B.name = 'swayB';
      g.morphAttributes.position = [A, B];
      g.morphTargetsRelative = true;
    }
    return g;
  }
}

/* centre line of a leaf bending (in its local frame) towards the horizontal vector (bx, bz) */
function centerline(len, bx, bz){
  const steps = 80, B = Math.hypot(bx,bz), th = Math.min(B, 1.35);
  const dx = B > 1e-6 ? bx/B : 0, dz = B > 1e-6 ? bz/B : 1;
  const pts = [new THREE.Vector3()];
  let p = new THREE.Vector3();
  for (let i=0;i<steps;i++){
    const s = (i+0.5)/steps, a = th*Math.pow(s,1.35);
    p = p.clone().add(new THREE.Vector3(Math.sin(a)*dx, Math.cos(a), Math.sin(a)*dz).multiplyScalar(len/steps));
    pts.push(p);
  }
  return {
    at(s){ const f = Math.min(Math.max(s,0),1)*steps, i = Math.min(Math.floor(f), steps-1); return pts[i].clone().lerp(pts[i+1], f-i); },
    tan(s){ const a = th*Math.pow(Math.max(s,1e-4),1.35); return new THREE.Vector3(Math.sin(a)*dx, Math.cos(a), Math.sin(a)*dz); }
  };
}
function frame(line, s, twist){
  const T = line.tan(s);
  let W = new THREE.Vector3(1,0,0).addScaledVector(T, -T.x).normalize();
  const tw = twist*s;
  W = W.multiplyScalar(Math.cos(tw)).add(new THREE.Vector3().crossVectors(T, W).multiplyScalar(Math.sin(tw))).normalize();
  const N = new THREE.Vector3().crossVectors(W, T).normalize();
  return {c: line.at(s), T, W, N};
}

function tipProfile(type, x, col, teeth){
  const round = Math.sqrt(Math.max(0, 1 - 4*x*x));
  switch(type){
    case 'notch':   return round * (1 - 0.18*Math.exp(-Math.pow(x/0.08, 2)));
    case 'serrate': return Math.min(1, round + (col % 2 ? teeth : 0));
    case 'trident': return 0.35 + 0.65*Math.abs(Math.cos(2*Math.PI*x));
    default: return round;
  }
}

/* ------------------------------------------------------------------ leaves */
function leafColor(sp, s, L, rowNoise){
  const [cb, cm, ct] = sp._cols;
  const col = cb.clone().lerp(cm, smooth(0, 0.12, s));
  col.lerp(ct, smooth(0.45, 1.0, s) * (0.25 + 0.5*L.age));
  col.multiplyScalar(0.86 + 0.28*L.tint);
  const brown = smooth(1 - 0.32*L.age, 1.02, s + (rowNoise-0.5)*0.1) * L.age * L.age;
  col.lerp(sp._brown, brown*0.6);
  return col;
}

function swayLocal(L){
  // global sway directions A = +x, B = +z expressed in the leaf's local (yawed) frame
  const c = Math.cos(L.yaw), s = Math.sin(L.yaw);
  return { A:[c*L.ampA, s*L.ampA], B:[-s*L.ampB, c*L.ampB] };
}

function addStrapLeaf(acc, sp, L){
  const lf = sp.leaf, cols = lf.cols, rows = lf.rows;
  const M = new THREE.Matrix4().compose(L.base, new THREE.Quaternion().setFromAxisAngle(Y, L.yaw), new THREE.Vector3(1,1,1));
  const sw = swayLocal(L);
  const lines = [centerline(L.len, 0, L.curve), centerline(L.len, sw.A[0], L.curve + sw.A[1]), centerline(L.len, sw.B[0], L.curve + sw.B[1])];
  const tipFrac = Math.min(0.3, lf.tipLen * L.width / L.len);
  const rowNoise = Array.from({length: rows+1}, () => L.rng());
  const idx = [];
  for (let c=0;c<cols;c++){
    const x = c/(cols-1) - 0.5;
    const sEnd = 1 - tipFrac*(1 - tipProfile(lf.tip, x, c, lf.teeth || 0));
    idx.push([]);
    for (let r=0;r<=rows;r++){
      const s = (r/rows)*sEnd;
      const w = L.width * (0.72 + 0.28*smooth(0, 0.06, s));
      const P = lines.map(line => {
        const f = frame(line, s, L.twist);
        return f.c.addScaledVector(f.W, x*w).addScaledVector(f.N, lf.fold*w*4*x*x).applyMatrix4(M);
      });
      idx[c].push(acc.v(P[0], x+0.5, s*L.len/lf.tex.lenRef, leafColor(sp, s, L, rowNoise[r]), P[1].sub(P[0]), P[2].sub(P[0])));
    }
  }
  for (let c=0;c<cols-1;c++) for (let r=0;r<rows;r++) acc.quad(idx[c][r], idx[c+1][r], idx[c+1][r+1], idx[c][r+1]);
  return lines[0].at(0.97).applyMatrix4(M);
}

function addTereteLeaf(acc, sp, L){
  const lf = sp.leaf, rad = lf.radial, rows = lf.rows;
  const M = new THREE.Matrix4().compose(L.base, new THREE.Quaternion().setFromAxisAngle(Y, L.yaw), new THREE.Vector3(1,1,1));
  const sw = swayLocal(L);
  const lines = [centerline(L.len, 0, L.curve), centerline(L.len, sw.A[0], L.curve + sw.A[1]), centerline(L.len, sw.B[0], L.curve + sw.B[1])];
  const rowNoise = Array.from({length: rows+1}, () => L.rng());
  const grid = [];
  for (let r=0;r<=rows;r++){
    const s = r/rows;
    const radius = L.width/2 * (s < 0.82 ? 1 : Math.max(0.04, Math.pow((1-s)/0.18, 0.8)));
    grid.push([]);
    for (let k=0;k<=rad;k++){
      const ph = k/rad*Math.PI*2;
      const P = lines.map(line => {
        const f = frame(line, s, 0);
        return f.c.addScaledVector(f.W, Math.cos(ph)*radius).addScaledVector(f.N, Math.sin(ph)*radius).applyMatrix4(M);
      });
      grid[r].push(acc.v(P[0], k/rad, s*L.len/lf.tex.lenRef, leafColor(sp, s, L, rowNoise[r]), P[1].sub(P[0]), P[2].sub(P[0])));
    }
  }
  for (let r=0;r<rows;r++) for (let k=0;k<rad;k++) acc.quad(grid[r][k], grid[r][k+1], grid[r+1][k+1], grid[r+1][k]);
  return lines[0].at(0.97).applyMatrix4(M);
}

/* Halophila: a pair of petiolate, paddle-shaped leaves at each node */
function addPaddleLeaf(petAcc, bladeAcc, sp, node, yaw, Lp, Lb, Wb, ampA, ampB, rng){
  const lf = sp.leaf;
  const q = new THREE.Quaternion().setFromAxisAngle(Y, yaw);
  const spread = 0.35 + rng()*0.45;
  const pet = centerline(Lp, 0, spread);
  const toWorld = v => v.clone().applyQuaternion(q).add(node);
  const rot = [null, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,-1), ampA), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), ampB)];
  const variants = p => { const w = toWorld(p); const out = [w];
    for (let k=1;k<3;k++){ out.push(w.clone().sub(node).applyQuaternion(rot[k]).add(node)); }
    return out; };
  // petiole tube
  const R = lf.petioleR, rows = 10, rad = 5, grid = [];
  for (let r=0;r<=rows;r++){
    const s = r/rows, f = frame(pet, s, 0); grid.push([]);
    for (let k=0;k<=rad;k++){
      const ph = k/rad*Math.PI*2;
      const P = variants(f.c.clone().addScaledVector(f.W, Math.cos(ph)*R).addScaledVector(f.N, Math.sin(ph)*R));
      grid[r].push(petAcc.v(P[0], k/rad, s, null, P[1].sub(P[0]), P[2].sub(P[0])));
    }
  }
  for (let r=0;r<rows;r++) for (let k=0;k<rad;k++) petAcc.quad(grid[r][k], grid[r][k+1], grid[r+1][k+1], grid[r+1][k]);
  // blade: continues from the petiole tip, tipping further outwards
  const end = pet.at(1), T = pet.tan(1);
  const D = T.clone().add(new THREE.Vector3(0,0,1).multiplyScalar(0.55 + rng()*0.4)).normalize();
  const Wd = new THREE.Vector3(1,0,0);
  const N = new THREE.Vector3().crossVectors(Wd, D).normalize();
  const cols = 6, brow = 12, bgrid = [];
  for (let r=0;r<=brow;r++){
    const v = r/brow; bgrid.push([]);
    for (let c=0;c<=cols;c++){
      const u = c/cols, x = u - 0.5;
      const p = end.clone().addScaledVector(D, v*Lb).addScaledVector(Wd, x*Wb)
        .addScaledVector(N, Wb*0.12*(4*x*x) - Lb*0.12*v*v);
      const P = variants(p);
      bgrid[r].push(bladeAcc.v(P[0], u, v, null, P[1].sub(P[0]), P[2].sub(P[0])));
    }
  }
  for (let r=0;r<brow;r++) for (let c=0;c<cols;c++) bladeAcc.quad(bgrid[r][c], bgrid[r][c+1], bgrid[r+1][c+1], bgrid[r+1][c]);
  return { petMid: toWorld(pet.at(0.6)), bladeMid: toWorld(end.clone().addScaledVector(D, Lb*0.5)), tip: toWorld(end.clone().addScaledVector(D, Lb*0.97)) };
}

/* ------------------------------------------------------------------ tubes */
function taperTube(curve, segs, radius, radial, taperFn){
  const geo = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  if (taperFn){
    const pos = geo.attributes.position;
    for (let i=0;i<=segs;i++){
      const t = i/segs, c = curve.getPointAt(t), k = taperFn(t);
      for (let j=0;j<=radial;j++){
        const id = i*(radial+1)+j;
        const v = new THREE.Vector3().fromBufferAttribute(pos, id).sub(c).multiplyScalar(k).add(c);
        pos.setXYZ(id, v.x, v.y, v.z);
      }
    }
    geo.computeVertexNormals();
  }
  return geo;
}
function merge(geos){
  // minimal merge for non-indexed / indexed geometries with position, normal, uv
  const out = new THREE.BufferGeometry();
  const P=[],N=[],U=[],I=[]; let off=0;
  for (const g0 of geos){
    const g = g0.index ? g0 : g0;
    const p=g.attributes.position, n=g.attributes.normal, u=g.attributes.uv;
    for (let i=0;i<p.count;i++){ P.push(p.getX(i),p.getY(i),p.getZ(i)); N.push(n.getX(i),n.getY(i),n.getZ(i)); U.push(u?u.getX(i):0, u?u.getY(i):0); }
    if (g.index){ for (let i=0;i<g.index.count;i++) I.push(g.index.getX(i)+off); }
    else { for (let i=0;i<p.count;i++) I.push(i+off); }
    off += p.count;
  }
  out.setAttribute('position', new THREE.Float32BufferAttribute(P,3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(N,3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(U,2));
  out.setIndex(I);
  return out;
}

/* ------------------------------------------------------------------ main builder */
export function buildSpecimen(id){
  const sp = MODELS[id];
  const rng = mulberry32(sp.seed);
  const lf = sp.leaf, RZ = sp.rhizome, RT = sp.roots;
  if (lf.type !== 'paddle') sp._cols = lf.colors.map(h => new THREE.Color(h));
  sp._brown = new THREE.Color('#5b4322');

  const group = new THREE.Group(); group.name = id;
  const anchors = {};

  // rhizome axes: main + optional branch
  const axes = [];
  const mainPts = [];
  for (let i=0;i<=8;i++){
    const t = i/8;
    mainPts.push(new THREE.Vector3(-RZ.len/2 + RZ.len*t, -RZ.depth*(0.9 + 0.2*rng()), (rng()-0.5)*RZ.len*0.12));
  }
  axes.push({curve: new THREE.CatmullRomCurve3(mainPts), len: RZ.len, scale: 1});
  if (RZ.branch){
    const t0 = 0.35, p0 = axes[0].curve.getPointAt(t0);
    const ang = (rng() < 0.5 ? 1 : -1) * (0.7 + rng()*0.3);
    const bl = RZ.len*0.5, pts = [];
    for (let i=0;i<=5;i++){
      const t = i/5;
      pts.push(new THREE.Vector3(p0.x + Math.cos(ang)*bl*t + (rng()-0.5)*bl*0.05*t, p0.y + (rng()-0.5)*RZ.depth*0.15*t, p0.z + Math.sin(ang)*bl*t));
    }
    axes.push({curve: new THREE.CatmullRomCurve3(pts), len: bl, scale: 0.75, branch: true});
  }

  const rhizGeos = [], scarGeos = [], rootGeos = [], sheathGeos = [], stemGeos = [], scaleGeos = [];
  const leafAcc = new Acc(), petAcc = new Acc(), bladeAcc = new Acc();
  const bristle = [];
  const shootsInfo = [];
  let tallest = 0, tallestTip = null, rootPick = null, paddles = [], firstRootCurve = null, firstNode = null, firstSheath = null, firstPaddle = null;
  const zAxis = new THREE.Vector3(0,0,1);

  axes.forEach((ax, ai) => {
    const curve = ax.curve;
    const apexTaper = t => t > 0.9 ? lerp(1, 0.45, (t-0.9)/0.1) : 1;
    rhizGeos.push(taperTube(curve, 120, RZ.r*(ax.branch ? 0.9 : 1), 10, apexTaper));
    if (!ax.branch){ const cap = new THREE.SphereGeometry(RZ.r, 12, 8); cap.translate(...curve.getPointAt(0).toArray()); rhizGeos.push(cap); }

    // nodes
    const nNodes = Math.max(2, Math.round(ax.len / RZ.internode));
    const nodes = []; for (let i=0;i<nNodes;i++) nodes.push((i+0.5)/nNodes * (ax.branch ? 0.95 : 1));

    // leaf scars at nodes
    if (RZ.scars !== 'none'){
      nodes.forEach((t, ni) => {
        if (ax.branch && t < 0.08) return;
        const g = new THREE.TorusGeometry(RZ.r*1.02, RZ.r*0.22, 6, 20, RZ.scars === 'half' ? Math.PI*1.1 : Math.PI*2);
        const p = curve.getPointAt(t), T = curve.getTangentAt(t);
        const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(zAxis, T), new THREE.Vector3(1,1,1));
        if (RZ.scars === 'half') m.multiply(new THREE.Matrix4().makeRotationZ(rng()*Math.PI*2));
        g.applyMatrix4(m); scarGeos.push(g);
        if (!firstNode && !ax.branch && ni === Math.floor(nNodes*0.55)) firstNode = p.clone();
      });
    }

    // shoots
    let shootTs;
    if (RZ.shoots === 'nodes') shootTs = nodes.filter(t => t < 0.93 && !(ax.branch && t < 0.12));
    else { const n = ax.branch ? 0 : RZ.shoots; shootTs = Array.from({length:n}, (_,j) => 0.05 + 0.85*(j+0.5)/n); }

    shootTs.forEach((t, j) => {
      const p = curve.getPointAt(t);
      const size = (1.08 - 0.5*t) * ax.scale * (0.9 + 0.2*rng());
      const yaw = (rng()-0.5)*1.0 + (lf.type === 'paddle' ? Math.PI/2 : 0);

      if (lf.type === 'paddle'){
        const L1 = rangeR(rng, lf.blade)*size, W1 = rangeR(rng, lf.width)*Math.min(1, size*1.05);
        const P1 = rangeR(rng, lf.petiole)*size;
        for (const side of [0, Math.PI]){
          const r = addPaddleLeaf(petAcc, bladeAcc, sp, p, yaw + side + (rng()-0.5)*0.4, P1*(0.9+0.2*rng()), L1*(0.92+0.16*rng()), W1, 0.22 + rng()*0.15, (rng()-0.5)*0.35, rng);
          if (!ax.branch && side === 0) paddles[j] = Object.assign(r, {node: p.clone()});
          tallest = Math.max(tallest, r.tip.y);
        }
        // two transparent scales enclosing the node
        for (const s of [-1,1]){
          const sc = new THREE.CircleGeometry(1, 14); sc.scale(RZ.scales*0.45, RZ.scales*0.75, 1);
          sc.rotateX(-0.25*s); sc.translate(0, RZ.scales*0.45, 0);
          sc.applyMatrix4(new THREE.Matrix4().compose(p.clone().add(new THREE.Vector3(0,0,s*RZ.r*0.6)), new THREE.Quaternion().setFromAxisAngle(Y, yaw + (s>0?0:Math.PI)), new THREE.Vector3(1,1,1)));
          scaleGeos.push(sc);
        }
        shootsInfo.push({p, size});
        return;
      }

      // erect stem / sheath
      const SH = sp.sheath;
      const wMax = lf.width[1];
      const top = SH.len * Math.min(1, size);
      const sheathR = Math.max(wMax*SH.widthMul*0.5, RZ.r*0.9);
      if (SH.stem){
        const st = new THREE.CylinderGeometry(RZ.r*0.75, RZ.r*0.85, -p.y, 8, 1, true);
        st.translate(p.x, p.y/2, p.z); stemGeos.push(st);
      }
      const yBase = SH.stem ? -0.002 : p.y;
      const shH = top - yBase;
      const sg = new THREE.CylinderGeometry(sheathR*SH.flare, sheathR, shH, 16, 4, true);
      sg.scale(1, 1, lf.type === 'terete' ? 1 : 0.45); sg.rotateY(yaw);
      sg.translate(p.x, yBase + shH/2, p.z); sheathGeos.push(sg);
      if (!firstSheath && !ax.branch && j === Math.min(1, shootTs.length-1)) firstSheath = new THREE.Vector3(p.x, yBase + shH*0.85, p.z);

      // leaves (distichous fan; outermost = oldest)
      const nL = rangeI(rng, lf.perShoot);
      const maxLen = rangeR(rng, lf.len) * size;
      for (let i=0;i<nL;i++){
        const age = nL === 1 ? 1 : 1 - (i/(nL-1))*0.85;
        const side = i % 2 === 0 ? 1 : -1;
        const len = maxLen*(0.45 + 0.55*age)*(0.9 + 0.2*rng());
        const flex = Math.min(1.0, (0.35 + len*2.2)/lf.stiff);
        const L = {
          base: new THREE.Vector3(p.x, top - 0.002, p.z), yaw: yaw + (rng()-0.5)*0.25,
          len, width: rangeR(rng, lf.width)*(0.82 + 0.18*age),
          curve: lf.curve*(0.45 + 0.9*rng())*side + (rng()-0.5)*0.06,
          twist: (rng()-0.5)*lf.twist, age, tint: rng(), rng,
          ampA: flex*(0.7 + 0.5*rng()), ampB: flex*(rng()-0.5)*1.1
        };
        const tip = lf.type === 'terete' ? addTereteLeaf(leafAcc, sp, L) : addStrapLeaf(leafAcc, sp, L);
        if (tip.y > tallest){ tallest = tip.y; tallestTip = tip; anchors._tallestLeaf = {L, p}; }
      }
      shootsInfo.push({p, size, top, maxLen});

      // Enhalus: fibrous bristles around the shoot base
      if (RZ.bristles){
        for (let k=0;k<170;k++){
          const a = rng()*Math.PI*2, rr = sheathR*(1.05 + rng()*0.9);
          const x = p.x + Math.cos(a)*rr, z = p.z + Math.sin(a)*rr*0.7;
          const y0 = p.y + rng()*0.012, y1 = Math.min(0.015, p.y + (-p.y)*(0.75 + rng()*0.5));
          bristle.push(x, y0, z, x + (rng()-0.5)*0.008, y1, z + (rng()-0.5)*0.008);
        }
      }
    });

    // roots
    let rootTs = [];
    if (RT.at === 'shoots+') rootTs = shootTs.concat([0.02, 0.5, 0.97].filter(() => !ax.branch));
    else rootTs = nodes.filter((_, i) => i % (RT.every || 1) === 0 && !(ax.branch && _ < 0.12));
    rootTs.forEach(t => {
      const base = curve.getPointAt(t);
      const nR = rangeI(rng, RT.perNode);
      for (let k=0;k<nR;k++){
        const L = rangeR(rng, RT.len) * (ax.branch ? 0.8 : 1);
        const a = rng()*Math.PI*2, spr = L*(0.2 + 0.35*rng());
        const dx = Math.cos(a)*spr, dz = Math.sin(a)*spr, w = () => (rng()-0.5)*L*0.14;
        const c = new THREE.CatmullRomCurve3([
          base.clone().add(new THREE.Vector3(0, -RZ.r*0.4, 0)),
          base.clone().add(new THREE.Vector3(dx*0.25+w(), -L*0.3, dz*0.25+w())),
          base.clone().add(new THREE.Vector3(dx*0.6+w(), -L*0.65, dz*0.6+w())),
          base.clone().add(new THREE.Vector3(dx, -L, dz))
        ]);
        rootGeos.push(taperTube(c, 24, RT.r, 6, tt => lerp(1, 0.35, tt)));
        if (!ax.branch && (!rootPick || Math.abs(t - 0.72) < Math.abs(rootPick.t - 0.72))) rootPick = {c, t};
        if (RT.branched && rng() < 0.7){
          const t0 = 0.3 + rng()*0.4, b0 = c.getPointAt(t0), bl = L*(0.25 + 0.25*rng()), ba = rng()*Math.PI*2;
          const bc = new THREE.CatmullRomCurve3([b0, b0.clone().add(new THREE.Vector3(Math.cos(ba)*bl*0.5, -bl*0.4, Math.sin(ba)*bl*0.5)), b0.clone().add(new THREE.Vector3(Math.cos(ba)*bl*0.8, -bl, Math.sin(ba)*bl*0.8))]);
          rootGeos.push(taperTube(bc, 12, RT.r*0.6, 5, tt => lerp(1, 0.4, tt)));
        }
      }
    });

    // Enhalus: bristles along the rhizome
    if (RZ.bristles){
      const tmp = new THREE.Vector3();
      for (let i=0;i<1500;i++){
        const t = rng(), p = curve.getPointAt(t), T = curve.getTangentAt(t);
        tmp.set(rng()-0.5, rng()-0.5, rng()-0.5).cross(T).normalize();
        const st = p.clone().addScaledVector(tmp, RZ.r*0.95);
        const dir = tmp.clone().multiplyScalar(0.8).addScaledVector(T, (rng()-0.5)*0.9).addScaledVector(Y, 0.35).normalize();
        const en = st.clone().addScaledVector(dir, 0.012 + rng()*0.03);
        bristle.push(st.x,st.y,st.z,en.x,en.y,en.z);
      }
    }
  });

  /* ---- materials & meshes */
  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({roughness:0.8, metalness:0}, o));
  const add = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; group.add(m); return m; };
  const animated = [];

  if (lf.type !== 'paddle'){
    const leaves = add(leafAcc.geometry(), std({name:'leaf', vertexColors:true, map:leafTexture(sp), side:THREE.DoubleSide, roughness:0.6}), 'Leaves');
    animated.push(leaves);
    add(merge(sheathGeos), std({name:'sheath', color:sp.sheath.color, side:THREE.DoubleSide, roughness:0.7}), 'LeafSheaths');
    if (stemGeos.length) add(merge(stemGeos), std({name:'stem', color:RZ.color}), 'ErectStems');
  } else {
    animated.push(add(petAcc.geometry(), std({name:'petiole', color:'#a7cf86', roughness:0.6}), 'Petioles'));
    animated.push(add(bladeAcc.geometry(), std({name:'blade', map:paddleTexture(sp), alphaTest:0.5, side:THREE.DoubleSide, roughness:0.5}), 'LeafBlades'));
    add(merge(scaleGeos), std({name:'scale', color:'#f4f1e4', transparent:true, opacity:0.55, side:THREE.DoubleSide, roughness:0.4, depthWrite:false}), 'Scales');
  }
  add(merge(rhizGeos), std({name:'rhizome', color:RZ.color, roughness:0.75}), 'Rhizome');
  if (scarGeos.length) add(merge(scarGeos), std({name:'leaf-scar', color:RZ.scarColor, roughness:0.9}), 'LeafScars');
  add(merge(rootGeos), std({name:'root', color:RT.color, roughness:0.85}), 'Roots');
  if (bristle.length){
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bristle, 3));
    const ls = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({name:'bristle', color:'#17110b'})); ls.name = 'Bristles'; group.add(ls);
  }

  // sediment disc
  const box = new THREE.Box3().setFromObject(group);
  const span = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z));
  const sedR = span*1.12;
  const sed = new THREE.CircleGeometry(sedR, 72); sed.rotateX(-Math.PI/2);
  add(sed, std({name:'sediment', color:'#cdbf98', transparent:true, opacity:0.3, depthWrite:false, side:THREE.DoubleSide, roughness:1}), 'Sediment');

  // morph targets + sway clip
  animated.forEach(m => { m.updateMorphTargets(); m.morphTargetInfluences.fill(0); });
  const dur = 8, times = [], vals = [];
  for (let i=0;i<=80;i++){
    const t = i/80*dur, w = 2*Math.PI/dur;
    times.push(t);
    vals.push(0.62*Math.sin(w*t) + 0.2*Math.sin(2*w*t), 0.35*Math.sin(2*w*t) + 0.2*Math.sin(3*w*t));
  }
  const clip = new THREE.AnimationClip('Sway', dur, animated.map(m => new THREE.NumberKeyframeTrack(`${m.name}.morphTargetInfluences`, times, vals)));

  /* ---- anchors for labels (rest pose, model coordinates) */
  const A = {};
  if (lf.type === 'paddle'){
    const pk = i => paddles[Math.min(i, paddles.length-1)] || paddles.find(Boolean);
    A.blade = pk(1).bladeMid; A.petiole = pk(4).petMid;
    A.scales = pk(7).node.clone().add(new THREE.Vector3(0, RZ.scales*0.8, 0));
  } else {
    const {L} = anchors._tallestLeaf;
    const M = new THREE.Matrix4().compose(L.base, new THREE.Quaternion().setFromAxisAngle(Y, L.yaw), new THREE.Vector3(1,1,1));
    const line = centerline(L.len, 0, L.curve);
    A.blade = line.at(0.45).applyMatrix4(M);
    A.tip = tallestTip;
    A.sheath = firstSheath;
  }
  const mainC = axes[0].curve;
  A.rhizome = mainC.getPointAt(0.96);
  if (firstNode) A.node = firstNode;
  if (rootPick) A.roots = rootPick.c.getPointAt(0.8);
  if (RZ.bristles) A.bristles = mainC.getPointAt(0.12).add(new THREE.Vector3(0, -RZ.r*2.6, 0));
  A.sediment = new THREE.Vector3(-0.6*sedR, 0, -0.8*sedR);
  const anchorsOut = {}; for (const k in A) anchorsOut[k] = A[k].toArray().map(v => +v.toFixed(5));

  const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  return { group, clip, anchors: anchorsOut,
    dims: { heightAboveSediment:+tallest.toFixed(4), depthBelow:+(-box.min.y).toFixed(4), width:+size.x.toFixed(4), depth:+size.z.toFixed(4) } };
}
