// src/lib/cookieStorage.js
// Keeps the Supabase login session (access JWT + refresh token) in cookies
// instead of localStorage.
//
// - "Keep me signed in" ticked   -> persistent cookie (REMEMBER_DAYS)
// - not ticked                    -> session cookie, cleared when the browser closes
// - SameSite=Lax + Secure (on HTTPS), Path=/; long values are split into chunks
//   because a single cookie is limited to about 4 KB.
// Note: cookies written by JavaScript cannot be HttpOnly. That would need a
// server issuing the cookie; SeaScan's protection is the short-lived JWT plus
// Row Level Security in the database.

export const REMEMBER_DAYS = 30;
const REMEMBER_FLAG = 'seascan-remember';
const CHUNK_SIZE = 3000;
const MAX_CHUNKS = 10;

const secure = () => (typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '');

function readCookie(name) {
  const prefix = `${name}=`;
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(prefix)) return part.slice(prefix.length);
  }
  return null;
}

function writeCookie(name, value, maxAgeSeconds) {
  const age = maxAgeSeconds === undefined ? '' : `; Max-Age=${maxAgeSeconds}`;
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax${secure()}${age}`;
}

export function isRemembered() {
  return readCookie(REMEMBER_FLAG) === '1';
}

/** Call before signing in: decides whether the session cookie outlives the browser. */
export function setRemembered(remember) {
  if (remember) writeCookie(REMEMBER_FLAG, '1', REMEMBER_DAYS * 86400);
  else writeCookie(REMEMBER_FLAG, '', 0);
}

export const cookieStorage = {
  getItem(key) {
    const parts = [];
    for (let i = 0; i < MAX_CHUNKS; i++) {
      const chunk = readCookie(`${key}.${i}`);
      if (chunk === null) break;
      parts.push(chunk);
    }
    return parts.length ? decodeURIComponent(parts.join('')) : null;
  },
  setItem(key, value) {
    this.removeItem(key);
    const encoded = encodeURIComponent(value);
    const maxAge = isRemembered() ? REMEMBER_DAYS * 86400 : undefined;
    for (let i = 0; i * CHUNK_SIZE < encoded.length && i < MAX_CHUNKS; i++) {
      writeCookie(`${key}.${i}`, encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), maxAge);
    }
  },
  removeItem(key) {
    for (let i = 0; i < MAX_CHUNKS; i++) {
      if (readCookie(`${key}.${i}`) === null) break;
      writeCookie(`${key}.${i}`, '', 0);
    }
  },
};

/** Remove sessions that older versions of the app kept in localStorage. */
export function clearLegacyLocalSessions() {
  try {
    Object.keys(localStorage)
      .filter((k) => /^sb-.*-auth-token/.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable: nothing to clean */
  }
}

/** Read the payload of a JWT (no signature check - the server does that). */
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload).split('').map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}
