// src/components/OceanBackdrop.jsx
// Decorative water-column layer: caustic light, a seagrass meadow that sways,
// and slow bubbles. Purely ambient - pointer-events-none, aria-hidden, and
// stilled entirely under prefers-reduced-motion (see index.css).
import React from 'react';

// Tufts rather than an even row, so the seabed reads as a meadow.
const blades = [
  { x: 30, h: 130, w: 20, lean: -14, delay: 0, dur: 7, tint: 'rgb(45 212 191 / 0.20)' },
  { x: 58, h: 195, w: 24, lean: 18, delay: 2.4, dur: 9, tint: 'rgb(52 211 153 / 0.26)' },
  { x: 92, h: 150, w: 20, lean: 26, delay: 1.1, dur: 8, tint: 'rgb(45 212 191 / 0.16)' },
  { x: 215, h: 100, w: 18, lean: -10, delay: 3.2, dur: 7.5, tint: 'rgb(52 211 153 / 0.18)' },
  { x: 240, h: 150, w: 20, lean: 12, delay: 0.6, dur: 9.5, tint: 'rgb(45 212 191 / 0.20)' },
  { x: 390, h: 90, w: 16, lean: -8, delay: 4, dur: 8.5, tint: 'rgb(52 211 153 / 0.14)' },
  { x: 412, h: 120, w: 18, lean: 14, delay: 1.8, dur: 7, tint: 'rgb(45 212 191 / 0.16)' },
  { x: 610, h: 110, w: 18, lean: -12, delay: 2.8, dur: 9, tint: 'rgb(45 212 191 / 0.16)' },
  { x: 636, h: 85, w: 16, lean: 10, delay: 0.3, dur: 7.5, tint: 'rgb(52 211 153 / 0.14)' },
  { x: 770, h: 165, w: 22, lean: -16, delay: 1.5, dur: 8, tint: 'rgb(52 211 153 / 0.22)' },
  { x: 800, h: 115, w: 18, lean: 12, delay: 3.6, dur: 10, tint: 'rgb(45 212 191 / 0.18)' },
  { x: 915, h: 150, w: 20, lean: -20, delay: 0.9, dur: 7.5, tint: 'rgb(45 212 191 / 0.18)' },
  { x: 945, h: 215, w: 24, lean: 10, delay: 2.1, dur: 9.5, tint: 'rgb(52 211 153 / 0.26)' },
  { x: 978, h: 135, w: 20, lean: 18, delay: 4.4, dur: 8, tint: 'rgb(45 212 191 / 0.20)' },
];

const bubbles = [
  { left: '12%', size: 6, delay: 0, dur: 18 },
  { left: '28%', size: 4, delay: 7, dur: 24 },
  { left: '47%', size: 7, delay: 13, dur: 21 },
  { left: '66%', size: 5, delay: 3, dur: 26 },
  { left: '81%', size: 4, delay: 10, dur: 19 },
  { left: '92%', size: 6, delay: 16, dur: 23 },
];

// A blade tapers from a wide base to a point, curving towards its lean.
const bladePath = ({ x, h, w, lean }) => {
  const top = 260 - h;
  const tipX = x + lean;
  return `M ${x - w / 2} 260
    C ${x - w / 2 - lean * 0.2} ${260 - h * 0.45}, ${tipX - w * 0.3} ${260 - h * 0.8}, ${tipX} ${top}
    C ${tipX + w * 0.25} ${260 - h * 0.75}, ${x + w / 2 - lean * 0.1} ${260 - h * 0.4}, ${x + w / 2} 260 Z`;
};

export default function OceanBackdrop({ withMeadow = true }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Depth gradient: lit shallows at the top down to the abyss */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#07293a] to-slate-950" />

      {/* Caustic light pools */}
      <div
        className="caustic absolute -top-1/3 left-1/4 w-[46rem] h-[46rem] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgb(45 212 191 / 0.30), transparent 62%)' }}
      />
      <div
        className="caustic absolute top-1/4 -right-24 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgb(34 211 238 / 0.26), transparent 62%)',
          animationDelay: '-18s',
        }}
      />
      <div
        className="caustic absolute -bottom-32 left-0 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgb(52 211 153 / 0.24), transparent 62%)',
          animationDelay: '-34s',
        }}
      />

      {/* Rising bubbles */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble absolute bottom-0 rounded-full border border-teal-200/25 bg-teal-100/10"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: `-${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}

      {/* Seagrass meadow along the seabed */}
      {withMeadow && (
        <svg
          className="absolute bottom-0 left-0 w-full h-56 sm:h-72"
          viewBox="0 0 1000 260"
          preserveAspectRatio="none"
          fill="none"
        >
          {blades.map((blade, i) => (
            <path
              key={i}
              className="blade"
              d={bladePath(blade)}
              fill={blade.tint}
              style={{ animationDelay: `-${blade.delay}s`, animationDuration: `${blade.dur}s` }}
            />
          ))}
        </svg>
      )}

      {/* Settle the meadow into the page below */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-slate-950" />
    </div>
  );
}
