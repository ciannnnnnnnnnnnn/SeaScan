// src/components/Logo.jsx
import React from 'react';

// The source image has wide empty margins, so it is cropped in with a scale.
// Decorative: the "SeaScan" wordmark next to it carries the name.
export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <span className={`block overflow-hidden shrink-0 ${className}`}>
      <img
        src="/seascan-logo.png"
        alt=""
        className="w-full h-full object-cover scale-[1.75] transition-transform duration-300 ease-out group-hover:-rotate-6"
      />
    </span>
  );
}
