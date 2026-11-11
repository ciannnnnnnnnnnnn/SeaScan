// src/components/DetectionOverlay.jsx
import React from 'react';

/**
 * Draws highlight boxes over the sample image: corner brackets plus a label
 * chip, the way a camera shows focus lock.
 *
 * Boxes are percentages of the image, so the overlay scales with it. The parent
 * must be exactly the size of the visible image for the boxes to line up.
 */
export default function DetectionOverlay({ detections = [] }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {detections.map((d, i) => {
        const primary = i === 0;
        const stroke = primary ? 'border-teal-300' : 'border-cyan-300/70';
        const chip = primary
          ? 'bg-teal-400 text-slate-950'
          : 'bg-slate-900/90 text-cyan-200 border border-cyan-400/40';

        return (
          <div
            key={d.label + i}
            className="detect-box absolute"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.w}%`,
              height: `${d.h}%`,
              animationDelay: `${i * 140}ms`,
            }}
          >
            {/* Faint full rectangle, with brighter corner brackets on top */}
            <div className={`absolute inset-0 border ${primary ? 'border-teal-300/40' : 'border-cyan-300/25'} rounded-sm`} />

            {['-top-px -left-px border-t-2 border-l-2 rounded-tl-sm',
              '-top-px -right-px border-t-2 border-r-2 rounded-tr-sm',
              '-bottom-px -left-px border-b-2 border-l-2 rounded-bl-sm',
              '-bottom-px -right-px border-b-2 border-r-2 rounded-br-sm',
            ].map((pos) => (
              <span key={pos} className={`detect-corner absolute w-5 h-5 ${stroke} ${pos}`} />
            ))}

            {/* Label sits above the box, or inside when near the top edge */}
            <div
              className={`detect-chip absolute left-0 whitespace-nowrap px-2 py-1 rounded-md text-xs font-semibold shadow-lg ${chip} ${
                d.y < 12 ? 'top-1 mx-1' : '-top-7'
              } ${d.x > 40 ? 'right-0 left-auto' : ''}`}
              style={{ animationDelay: `${380 + i * 140}ms` }}
            >
              <span className="italic">{d.label}</span>
              <span className="ml-1.5 tabular-nums opacity-80">{d.confidence}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
