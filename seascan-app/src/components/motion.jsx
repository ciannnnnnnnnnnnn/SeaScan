// src/components/motion.jsx
// Motion primitives built on IntersectionObserver + rAF. No animation library:
// the bundle is already ~200 KB gzipped and these are a few dozen lines.
import React, { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fires once when the element scrolls into view, then stops observing.
function useInView(ref, { rootMargin = '0px 0px -10% 0px' } = {}) {
  const [inView, setInView] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

/**
 * Reveals children with a rise-and-fade the first time they enter the viewport.
 * `delay` staggers a group (60ms per item reads as one motion, not a queue).
 */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref);

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'reveal-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts up to `value` when scrolled into view. Renders the final value
 * immediately under reduced-motion, and for anyone who never scrolls past it
 * the number is still correct because the observer sets state on entry.
 */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 1100, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (!inView) return;

    let frame;
    if (prefersReducedMotion()) {
      frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic: fast start, settles gently on the real number
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
