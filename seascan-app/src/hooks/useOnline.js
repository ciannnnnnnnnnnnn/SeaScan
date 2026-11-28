// src/hooks/useOnline.js
// True while the browser has a network connection (navigator.onLine), updated
// when the connection drops or returns.
import { useSyncExternalStore } from 'react';

const subscribe = (onChange) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
